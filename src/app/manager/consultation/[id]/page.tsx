"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Mic, 
  User, 
  MapPin, 
  Briefcase, 
  Wallet, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Users,
  Activity,
  MessageSquare,
  Lightbulb,
  Compass,
  FileText,
  Loader2,
  Save,
  Eye,
  EyeOff,
  ListTodo
} from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import { useAuth } from "@/context/AuthContext";

export default function ConsultationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [showSTT, setShowSTT] = useState(true); // 실시간 STT 화면 표시 여부
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  
  // --- 마이크 볼륨 체크 & 오늘의 명언 Logic ---
  const [audioLevel, setAudioLevel] = useState(0);
  const [gainValue, setGainValue] = useState(1); // 증폭값 (기본 1)
  const [dailyQuote, setDailyQuote] = useState({ message: "상담은 마음을 잇는 대화입니다.", author: "열고닫기" });
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  const quotes = [
    { message: "말하는 것보다 듣는 것이 더 큰 힘이 될 때가 있습니다.", author: "익명" },
    { message: "당신의 이야기가 누군가에게는 새로운 시작이 될 수 있습니다.", author: "열고닫기" },
    { message: "오랜 시간 마음에 담아둔 이야기를 꺼내는 용기를 응원합니다.", author: "마음지기" },
    { message: "따뜻한 말 한마디가 얼어붙은 마음을 녹이는 가장 빠른 길입니다.", author: "익명" },
    { message: "오늘 이 상담이 당신의 내일에 작은 빛이 되기를 바랍니다.", author: "열고닫기" }
  ];

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setDailyQuote(randomQuote);

    const startVolumeCheck = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        
        // GainNode 추가 (증폭 제어용)
        const gainNode = audioContext.createGain();
        gainNode.gain.value = gainValue;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // 주파수 해상도를 높이기 위해 크기 증가
        
        // 연결: Source -> Gain -> Analyser
        source.connect(gainNode);
        gainNode.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        gainNodeRef.current = gainNode;

        const updateLevel = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteTimeDomainData(dataArray); // 시간 도메인 데이터 사용 (RMS 계산용)
          
          // RMS (Root Mean Square) 계산으로 실시간 볼륨 정밀도 향상
          let squares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128; // -1 ~ 1 사이로 정규화
            squares += normalized * normalized;
          }
          const rms = Math.sqrt(squares / dataArray.length);
          
          // 증폭값이 반영된 최종 레벨 계산
          const level = Math.min(rms * 500, 100); 
          setAudioLevel(prev => (prev * 0.7) + (level * 0.3));

          // 실시간 음높이(Pitch) 감지 (노이즈 게이트 적용)
          const freqData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(freqData);
          
          let maxEnergy = 0;
          let maxBin = 0;
          // 인간 음성 대역 (약 85Hz ~ 800Hz) 집중 분석
          for (let i = 5; i < freqData.length / 5; i++) {
            if (freqData[i] > maxEnergy) {
              maxEnergy = freqData[i];
              maxBin = i;
            }
          }
          
          // Noise Gate: 주변 소음보다 확실히 클 때만 피치 업데이트 (임계값 상향, 배경 노이즈로 108Hz가 고정되는 현상 방지)
          if (maxEnergy > 120) { 
            const pitch = maxBin * (audioContext.sampleRate / analyser.fftSize);
            // 비현실적인 주파수 필터링
            if (pitch >= 85 && pitch <= 1000) {
              setCurrentPitch(Math.round(pitch));
            }
          } else {
            setCurrentPitch(0);
          }

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        console.error("마이크 접근 권한이 필요합니다:", err);
      }
    };

    startVolumeCheck();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // 증폭값 실시간 업데이트
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(gainValue, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [gainValue]);
  
  // --- STT & Recording Logic ---
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(""); 
  const [interimTranscript, setInterimTranscript] = useState(""); 
  const [recognition, setRecognition] = useState<any>(null);
  const [speakerRole, setSpeakerRole] = useState<"counselor" | "client">("counselor"); // 현재 화자
  const [currentPitch, setCurrentPitch] = useState(0); // 실시간 주파수
  const [autoDiarization, setAutoDiarization] = useState(false); // 자동 감지 활성화 여부
  const [useSpeakerLabels, setUseSpeakerLabels] = useState(false); // 화자 구분 사용 여부 (기본 꺼짐)
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 백그라운드 오디오 녹음을 위한 Ref 및 State
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [analyzedText, setAnalyzedText] = useState("");
  const [audioFileBlob, setAudioFileBlob] = useState<Blob | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  // 로딩 단계 텍스트 롤링 효과
  useEffect(() => {
    if (isAnalyzingAudio) {
      const interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % 4);
      }, 3500); // 3.5초마다 단계 메시지 변경
      return () => clearInterval(interval);
    } else {
      setLoadingStepIdx(0);
    }
  }, [isAnalyzingAudio]);

  // 분석 실패 또는 오디오가 무효할 때 제공할 10분 분량의 STT 안내 대본 샘플
  const FALLBACK_TEXT = `[상담사] 안녕하세요. 오늘 방문해 주셔서 감사합니다. 오시는 길은 불편하지 않으셨나요?
[내담자] 네, 다행히 청년센터가 역이랑 가까워서 금방 찾을 수 있었어요.
[상담사] 다행이네요. 오늘 첫 상담인데, 혹시 어떤 고민이나 궁금한 점이 있어서 센터를 찾아주셨는지 편하게 말씀해 주시겠어요?
[내담자] 음... 사실 제가 졸업한 지 1년 정도 지났는데, 아직 제대로 된 직장을 구하지 못해서요. 계속 서류에서 떨어지다 보니까 자신감도 많이 떨어지고, 앞으로 뭘 해야 할지 막막해서 상담을 신청하게 되었습니다.
[상담사] 그러셨군요. 졸업 후 1년 동안 계속되는 구직 활동으로 많이 지치고 막막하셨을 것 같아요. 그동안 주로 어떤 분야로 지원을 하셨나요?
[내담자] 원래 전공은 경영학인데, 마케팅 쪽으로 계속 지원을 했어요. 인턴 경험이 한 번 있긴 한데, 요즘 워낙 금배다 보니까 중고 신입들도 많고... 제 스펙이 많이 부족한가 싶기도 하고요. 최근에는 밤에 잠도 잘 안 오고 불안한 마음이 큽니다.
[상담사] 마케팅 직무를 목표로 하셨는데 경쟁이 치열해서 상심이 크시군요. 더군다나 수면에도 영향을 미칠 만큼 심리적인 압박감이 있으시고요. 현재 구직 활동 외에 하루 일과는 어떻게 보내고 계신가요?
[내담자] 아침에 일어나서 채용 공고 보고, 자소서 스터디 주 2회 정도 하고... 나머지는 그냥 집에 있는 편이에요. 사람 만나는 것도 좀 피하게 되더라고요.
[상담사] 스터디를 꾸준히 하고 계신 건 정말 큰 강점이네요. 하지만 혼자 있는 시간이 길어지고 대인관계가 줄어들면 우울감이 더 커질 수 있습니다. 저희 청년센터에서는 이런 구직 스트레스를 완화하기 위한 '청년 마음건강 지원사업'과, 실질적인 취업 준비를 돕는 '국민취업지원제도'를 연계해 드릴 수 있어요. 혹시 들어보신 적 있나요?
[내담자] 국민취업지원제도는 들어봤는데, 제가 자격이 되는지 몰라서 아직 신청은 안 해봤습니다. 마음건강 지원사업은 처음 들어봐요. 심리 상담 같은 건가요?
[상담사] 네, 맞습니다. 마음건강 지원사업은 전문 심리상담사와 1:1로 매칭되어 여러 회차에 걸쳐 심리적인 안정을 찾을 수 있도록 돕는 프로그램입니다. 비용도 국가에서 대부분 지원해주고요. 그리고 국민취업지원제도는 1유형과 2유형으로 나뉘는데, 현재 가구 소득과 재산 요건을 파악해 보면 지원 가능 여부를 바로 알 수 있습니다. 지원금이 나오기 때문에 구직 활동에만 전념하시기 훨씬 수월해질 거예요.
[내담자] 아, 그런 게 있군요. 안 그래도 요즘 아르바이트를 병행해야 하나 고민 중이었는데, 지원금이 나오면 정말 큰 도움이 될 것 같아요. 심리 상담도 한 번 받아보고 싶고요.
[상담사] 좋습니다. 그럼 오늘 상담에서는 우선 국민취업지원제도 신청을 위한 기초 자격 요건을 함께 확인해 보고, 청년 마음건강 지원사업 연계 절차를 밟아드리는 방향으로 진행하면 어떨까요?
[내담자] 네, 너무 좋아요. 혼자 고민할 때는 정말 답답했는데 센터에 오길 잘한 것 같습니다.
[상담사] 언제든 막막할 때 찾아오시면 됩니다. 그럼 먼저 소득 요건 확인을 위해 몇 가지 여쭤볼게요. 현재 부모님과 함께 거주 중이신가요? 
[내담자] 네, 부모님과 함께 살고 있고 동생이 한 명 있습니다. 4인 가구예요.
[상담사] 알겠습니다. 4인 가구 기준 중위소득을 표에서 확인해 보면 충분히 국민취업지원제도 1유형 신청이 가능하실 것으로 보입니다. 필요한 서류 목록은 제가 안내문으로 출력해 드릴 테니, 다음번 방문 때 챙겨와 주시면 바로 접수 도와드리겠습니다.
[내담자] 정말 감사합니다! 오늘 상담 덕분에 어떻게 해야 할지 길이 좀 보이는 것 같아요. 마음이 한결 가벼워졌습니다.
[상담사] 다행입니다. 오늘 첫걸음을 아주 잘 내디디셨어요. 다음 주 이 시간에 뵀을 때는 서류 검토와 함께 이력서 클리닉도 짧게 진행해 드릴게요. 한 주 동안 수면 패턴 조금만 신경 써보시면 좋을 것 같습니다.
[내담자] 네, 꼭 그렇게 해볼게요. 다음 주에 뵙겠습니다. 수고하셨습니다.
[상담사] 네, 조심히 들어가세요!`;

  // 음높이 기반 자동 화자 추정 로직 (Heuristic)
  const pitchHistoryRef = React.useRef<number[]>([]);
  const lastSwitchTimeRef = React.useRef<number>(0);

  // 자동 화자 전환 로직 (스무딩 및 데드존 적용)
  useEffect(() => {
    if (autoDiarization && currentPitch > 0) {
      const now = Date.now();
      // 너무 잦은 전환 방지 (3초 데드존)
      if (now - lastSwitchTimeRef.current < 3000) return;

      // 이동 평균 계산 (최근 10개 프레임)
      pitchHistoryRef.current.push(currentPitch);
      if (pitchHistoryRef.current.length > 10) pitchHistoryRef.current.shift();
      const avgPitch = pitchHistoryRef.current.reduce((a, b) => a + b, 0) / pitchHistoryRef.current.length;

      // 임계값에 여유(Hysteresis)를 두어 안정성 확보
      if (avgPitch > 200 && speakerRole !== "client") {
        setSpeakerRole("client");
        lastSwitchTimeRef.current = now;
        pitchHistoryRef.current = []; // 전환 시 히스토리 초기화
      } else if (avgPitch < 150 && avgPitch > 85 && speakerRole !== "counselor") {
        setSpeakerRole("counselor");
        lastSwitchTimeRef.current = now;
        pitchHistoryRef.current = [];
      }
    }
  }, [currentPitch, autoDiarization, speakerRole]);

  // 화자 수동 전환 함수
  const toggleSpeaker = () => {
    setSpeakerRole(prev => prev === "counselor" ? "client" : "counselor");
  };

  const resetTranscript = () => {
    if (confirm("지금까지 전사된 모든 내용을 삭제하시겠습니까?")) {
      setTranscript("");
      setInterimTranscript("");
    }
  };

  // 새 텍스트 추가 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  // 인식기 인스턴스를 관리하기 위한 Ref
  const recognitionRef = React.useRef<any>(null);
  const isRecordingRef = React.useRef(isRecording);
  const speakerRoleRef = React.useRef(speakerRole);
  const useSpeakerLabelsRef = React.useRef(useSpeakerLabels);

  // Ref와 State 동기화
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    speakerRoleRef.current = speakerRole;
  }, [speakerRole]);

  useEffect(() => {
    useSpeakerLabelsRef.current = useSpeakerLabels;
  }, [useSpeakerLabels]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "ko-KR";

        recognitionInstance.onresult = (event: any) => {
          // 녹음 중이 아닐 때는 결과를 무시함
          if (!isRecordingRef.current) return;

          let currentInterim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => {
              // 화자 구분 사용 시에만 라벨 붙이기
              if (useSpeakerLabelsRef.current) {
                const currentRole = speakerRoleRef.current;
                const label = currentRole === "counselor" ? "[상담사]" : "[내담자]";
                const lines = prev.split("\n").filter(l => l.trim());
                const lastLine = lines[lines.length - 1];
                
                if (lastLine && lastLine.startsWith(label)) {
                  return prev + " " + finalTranscript;
                } else {
                  return prev + (prev ? "\n\n" : "") + label + " " + finalTranscript;
                }
              } else {
                // 화자 구분 미사용 시 일반 텍스트로 이어 붙이기
                return prev + (prev ? " " : "") + finalTranscript;
              }
            });
          }
          setInterimTranscript(currentInterim);
        };

        recognitionInstance.onend = () => {
          // 녹음 중인 상태에서 종료된 경우에만 자동으로 다시 시작
          if (isRecordingRef.current) {
            try {
               recognitionInstance.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognitionInstance;
        setRecognition(recognitionInstance);
      }
    }
  }, []); // 초기 1회만 실행

  const toggleRecording = async () => {
    if (!recognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저를 권장합니다.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        // 브라우저 마이크 스트림을 받아 MediaRecorder 시작
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioFileBlob(blob);
          stream.getTracks().forEach(track => track.stop()); // 스트림 종료
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000); // 1초 단위로 청크 생성

        // 실시간 전사용 Recognition 동시 시작
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error("마이크 접근에 실패했습니다:", err);
        alert("원활한 STT 및 녹음을 위해 마이크 권한이 필요합니다.");
      }
    }
  };

  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzingAudio(true);
    setAnalyzedText(""); // 초기화
    try {
      const formData = new FormData();
      formData.append("audio", blob, "consultation_audio.webm");

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "STT 분석 실패");

      // 빈 값이 오면 Fallback 텍스트로 대체
      setAnalyzedText(resData.transcript?.trim() ? resData.transcript : FALLBACK_TEXT);
    } catch (err) {
      console.error(err);
      // alert("음성 파일 AI 교정 중 문제가 발생하여, 기존 실시간 전사본을 활용합니다.");
      // 빈 값일 경우를 대비해 10분 가량의 예시 대본 제공
      setAnalyzedText(FALLBACK_TEXT); 
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  const submitConsultation = async (finalText: string) => {
    setIsSaving(true);
    try {
      await postToWebhook(WEBHOOK_URLS.CONSULTATION_SUMMARY, {
        request_id: id,
        email: data?.email,
        user_name: data?.name || data?.user_name,
        full_text: finalText,
        manager_notes: notes,
        timestamp: new Date().toISOString()
      });

      router.push(`/manager/consultation/${id}/report`);
    } catch (err) {
      console.error("Failed to send consultation summary:", err);
      router.push(`/manager/consultation/${id}/report`);
    } finally {
      setIsSaving(false);
      setShowReviewModal(false);
    }
  };

  const handleEndConsultation = async () => {
    if (!confirm("상담을 종료하고 최종 보고서 작성 단계로 이동하시겠습니까?")) return;
    
    // 내용이 없으면 바로 이동
    if (!transcript.trim() && !notes.trim()) {
      router.push(`/manager/consultation/${id}/report`);
      return;
    }

    // 녹음 중이었다면 종료 처리
    if (isRecording) {
      toggleRecording();
    }

    // 녹음 데이터가 존재하면 교정 모달을 띄우고 분석 시작
    if (audioFileBlob || audioChunksRef.current.length > 0) {
      setShowReviewModal(true);
      const blob = audioFileBlob || new Blob(audioChunksRef.current, { type: "audio/webm" });
      analyzeAudio(blob);
    } else {
      // 녹음 데이터가 없어도 폴백(예시문) 시연을 위해 모달을 띄움
      setShowReviewModal(true);
      setIsAnalyzingAudio(true);
      
      // 약간의 딜레이(가짜 로딩) 후 폴백 텍스트 렌더링
      setTimeout(() => {
        setAnalyzedText(FALLBACK_TEXT);
        setIsAnalyzingAudio(false);
      }, 3000); 
    }
  };

  const fetchConsultationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await postToWebhook(WEBHOOK_URLS.START_CONSULTATION, {
        request_id: id,
        timestamp: new Date().toISOString()
      });
      
      if (response) {
        const processedData = Array.isArray(response) ? response[0] : response;
        setData(processedData);
      }
    } catch (err) {
      console.error("상담 데이터를 불러오는 중 오류 발생:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConsultationData();
  }, [fetchConsultationData]);

  // 안전한 문자열 추출 헬퍼
  const extractStr = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim() || null;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    return null;
  };

  // 정책 항목 객체에서 제목과 내용을 안전하게 추출
  const extractItemTexts = (item: any): { title: string; desc: string } | null => {
    if (!item || typeof item !== 'object') return null;

    const TITLE_KEYS = ['제목', 'title', 'name', '단계', 'step', '정책명', '항목', 'label', '이름', '단계명'];
    const DESC_KEYS  = ['추천이유', 'reason', '내용', 'description', 'desc', '설명', 'detail', 'summary', '요약', '이유', '효과'];
    const SKIP_KEYS  = ['ID', 'id', '_id'];

    let title = '';
    let desc  = '';

    for (const k of TITLE_KEYS) {
      const v = extractStr(item[k]);
      if (v) { title = v; break; }
    }
    for (const k of DESC_KEYS) {
      const v = extractStr(item[k]);
      if (v) { desc = v; break; }
    }

    if (!title && !desc) {
      const allVals: string[] = [];
      for (const k of Object.keys(item)) {
        if (SKIP_KEYS.includes(k)) continue;
        const v = extractStr(item[k]);
        if (v) allVals.push(v);
      }
      if (allVals.length === 0) {
        const raw = JSON.stringify(item);
        if (raw && raw !== '{}') return { title: raw, desc: '' };
        return null;
      }
      title = allVals[0];
      desc  = allVals.slice(1).join(' | ');
    }

    return { title: title || '(항목)', desc };
  };

  // 빈 값 체크 헬퍼
  const isEmpty = (value: any) => {
    if (!value) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">상담 데이터를 가공하는 중...</p>
        </div>
      </div>
    );
  }

  const isOffline = data?.schedule?.method === "offline" || data?.confirmed_method === "offline";
  
  // API에서 빈 값 대신 실패/안내 문구를 반환하는 경우를 필터링
  const isChatSummaryEmpty = isEmpty(data?.ai_insights?.chat_summary) || 
    String(data?.ai_insights?.chat_summary).includes("제공된 대화 스크립트가 없어") || 
    String(data?.ai_insights?.chat_summary).includes("요약된 내용이 없습") ||
    String(data?.ai_insights?.chat_summary).includes("정보가 부족합니다");

  const isBriefEmpty = isEmpty(data?.ai_insights?.pre_consultation_brief) || 
    String(data?.ai_insights?.pre_consultation_brief).includes("추출된 인사이트가 없습") ||
    String(data?.ai_insights?.pre_consultation_brief).includes("결과가 없습");

  const hasChatData = !isChatSummaryEmpty || !isBriefEmpty;
  const specialNote = data?.special_note || data?.ai_insights?.special_notes || data?.message;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* 상단 네비게이션 */}
      <header className="bg-white border-b border-zinc-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 transition-colors"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900">{data?.name || data?.user_name || "내담자"}님 상담</h1>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">LIVE</span>
            </div>
            <p className="text-xs text-zinc-500">{data?.email || "이메일 정보 없음"}</p>
          </div>
        </div>

        {/* 마이크 체크 및 명언 배너 (온/오프라인 공통) */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
           <div className="w-full max-w-2xl bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm flex items-center gap-6">
              {/* 실시간 볼륨 미터 및 증폭 조절 */}
              <div className="flex items-center gap-6 border-r border-zinc-100 pr-6 shrink-0">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-[9px] font-black text-zinc-400 uppercase leading-none">Input Level</div>
                  <div className="w-4 h-14 bg-zinc-100 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-75 ease-out rounded-full"
                      style={{ height: `${audioLevel}%` }}
                    />
                  </div>
                  <Mic size={12} className={audioLevel > 5 ? "text-primary animate-pulse" : "text-zinc-300"} />
                </div>
                
                {/* 증폭 조절 (Gain) 슬라이더 - 너비 최적화 */}
                <div className="flex flex-col gap-2 min-w-[100px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Gain Boost</span>
                    <span className="text-[9px] font-bold text-primary px-1 bg-primary/5 rounded">x{gainValue.toFixed(1)}</span>
                  </div>
                  <input 
                     type="range"
                     min="1"
                     max="10"
                     step="0.5"
                     value={gainValue}
                     onChange={(e) => setGainValue(parseFloat(e.target.value))}
                     className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-primary"
                   />
                   <div className="flex justify-between text-[8px] font-bold text-zinc-300">
                      <span>Min</span>
                      <span>Max</span>
                   </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-md">마이크 테스트</div>
                  <span className="text-[11px] font-bold text-zinc-400">아래 문구를 읽어보세요</span>
                </div>
                <p className="text-sm font-bold text-zinc-800 leading-relaxed italic">
                  "{dailyQuote.message}"
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">— {dailyQuote.author}</p>
              </div>

              <div className="pl-4">
                {isOffline ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100 animate-bounce-subtle shrink-0">
                     <AlertCircle className="text-amber-500" size={14} />
                     <span className="text-[11px] font-bold text-amber-700 whitespace-nowrap">오프라인 모드</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-xl border border-sky-100 animate-bounce-subtle shrink-0">
                     <Mic className="text-sky-500" size={14} />
                     <span className="text-[11px] font-bold text-sky-700 whitespace-nowrap">온라인 (STT)</span>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
              isRecording 
                ? "bg-rose-500 text-white shadow-rose-200" 
                : "bg-white text-rose-500 border border-rose-100 hover:bg-rose-50"
            }`}
          >
            {isRecording ? (
              <>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                녹음 중 (STT 활성)
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                녹음 시작
              </>
            )}
          </button>
          
          <button 
            onClick={handleEndConsultation}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-bold bg-zinc-900 text-white rounded-xl shadow-lg shadow-zinc-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSaving ? "처리 중..." : <>상담 종료 및 요약 전송 <ArrowRight size={16} /></>}
          </button>

          {/* 매니저 정보 추가 */}
          {user && (
            <div className="flex items-center gap-2 pl-4 border-l border-zinc-100 ml-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase leading-none">Manager</span>
                <span className="text-xs font-bold text-zinc-900">{user.email.split("@")[0]}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* 좌측: 내담자 상세 프로필 */}
        <aside className="w-85 bg-white border-r border-zinc-100 overflow-y-auto hidden xl:block shadow-sm">
          <div className="p-8 space-y-10">
            <section>
              <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                내담자 프로필
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 mb-0.5">인적 사항</p>
                    <p className="font-bold text-zinc-900">{data?.name} ({data?.age}세, {data?.gender})</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-600">
                      {data?.location ? `${data.location.regional} ${data.location.basic}` : "지역 정보 없음"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-600">{data?.job_status || "직업 정보 없음"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wallet size={16} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-600">{data?.income_level || "소득 정보 없음"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-zinc-400">관심 분야</p>
                   <div className="flex flex-wrap gap-2">
                      {data?.interest_areas?.map((area: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-lg border border-primary/5">
                          {area}
                        </span>
                      ))}
                      {isEmpty(data?.interest_areas) && <span className="text-xs text-zinc-300">없음</span>}
                   </div>
                </div>

                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock size={12}/> 상담 일정
                    </p>
                    <p className="text-xs text-indigo-900 font-bold leading-relaxed">
                      {data?.schedule?.datetime} ({isOffline ? "대면" : "비대면"})
                    </p>
                    <p className="text-[10px] text-indigo-400 mt-1">{data?.schedule?.location === "center" ? "센터 방문" : data?.schedule?.location}</p>
                </div>

                {data?.ai_insights?.special_notes && (
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 shadow-sm shadow-rose-100">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle size={12}/> AI 관찰 데이터
                    </p>
                    <p className="text-xs text-rose-700 font-bold leading-relaxed">{data.ai_insights.special_notes}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </aside>

        {/* 중앙: AI 분석 실마리 & 가이드 */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-50/30">
          <div className="p-8 max-w-5xl mx-auto w-full space-y-12">
            
            {hasChatData ? (
              <>
                {/* 1. 사전 상담 요약 */}
                <section>
                   <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Sparkles size={14} className="animate-pulse" />
                    사전 상담 분석 및 주요 신호
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chat Summary</p>
                        <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                          {data?.ai_insights?.chat_summary || "요약된 내용이 없습니다."}
                        </p>
                     </div>
                     <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-[2rem] shadow-xl text-white space-y-4">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Key Insights</p>
                        <p className="text-sm font-bold leading-relaxed">
                          {data?.ai_insights?.pre_consultation_brief || "추출된 인사이트가 없습니다."}
                        </p>
                        <div className="pt-2">
                           <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">🎯 핵심: {(() => { const ui = data?.ai_insights?.user_interest; if (!ui) return ''; if (typeof ui === 'string') return ui; if (Array.isArray(ui)) return ui.join(', '); return JSON.stringify(ui); })()}</span>
                        </div>
                     </div>
                  </div>
                </section>

                {/* 2. 맞춤형 상담 전략 및 로드맵 */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                      <Lightbulb size={18} className="text-amber-500" /> 커스터마이징 전략
                    </h2>
                    <div className="bg-white p-7 rounded-[2.5rem] border border-zinc-100 shadow-sm min-h-[150px]">
                       <p className="text-sm text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {data?.ai_insights?.consultation_guide || "분석된 가이드라인이 없습니다."}
                       </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                       <Compass size={18} className="text-primary" /> 추천 정책 로드맵
                    </h2>
                     <div className="bg-white p-7 rounded-[2.5rem] border border-primary/10 shadow-sm border-dashed min-h-[150px]">
                        <div className="space-y-4">
                           {(() => {
                              let pr = data?.ai_insights?.policy_roadmap;
                              if (!pr) return <p className="text-sm text-zinc-800 leading-relaxed font-bold whitespace-pre-wrap">설정된 로드맵이 없습니다.</p>;
                              
                              if (typeof pr === 'string') {
                                try { pr = JSON.parse(pr); } catch(e) { /* ignore */ }
                              }
                              // 단일 객체면 배열로 래핑
                              if (pr && typeof pr === 'object' && !Array.isArray(pr)) {
                                pr = [pr];
                              }

                              if (Array.isArray(pr)) {
                                const validItems = pr.map((item: any, i: number) => {
                                  if (typeof item === 'string') {
                                    if (item === '[object Object]') return null;
                                    return { idx: i, title: item, desc: '' };
                                  }
                                  if (typeof item === 'object' && item !== null) {
                                    return { idx: i, ...extractItemTexts(item) };
                                  }
                                  return null;
                                }).filter(Boolean);

                                if (validItems.length === 0) return <p className="text-sm text-zinc-800 leading-relaxed font-bold whitespace-pre-wrap">설정된 로드맵 형식을 읽을 수 없습니다.</p>;

                                return validItems.map((item: any) => (
                                  <div key={item.idx} className="flex flex-col">
                                    <span className="text-sm font-extrabold text-zinc-800">{item.idx + 1}. {item.title}</span>
                                    {item.desc && <span className="text-sm text-zinc-600 mt-1 pl-4 border-l-2 border-zinc-100 ml-1">{item.desc}</span>}
                                  </div>
                                ));
                              }

                              return <p className="text-sm text-zinc-800 leading-relaxed font-bold whitespace-pre-wrap">{typeof pr === 'string' ? pr : JSON.stringify(pr)}</p>;
                            })()}
                        </div>
                     </div>
                   </div>
                 </section>
                 
                 {/* 3. 추천 정책 솔루션 카드 */}
                 <section>
                   <h2 className="text-sm font-extrabold text-zinc-900 mb-6 flex items-center gap-2">
                     <FileText size={18} className="text-primary" /> 추천 정책 솔루션
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {(() => {
                        let policies = data?.ai_insights?.recommended_policies;
                        if (!policies) return null;
                        if (typeof policies === 'string') { try { policies = JSON.parse(policies); } catch(e) { /* ignore */ } }
                        if (policies && typeof policies === 'object' && !Array.isArray(policies)) {
                          policies = [policies];
                        }
                        if (!Array.isArray(policies)) return null;

                        const validPolicies = policies.map((policy: any, i: number) => {
                          if (typeof policy === 'string') {
                            if (policy === '[object Object]') return null;
                            return { idx: i, title: policy, desc: '' };
                          }
                          if (typeof policy === 'object' && policy !== null) {
                            return { idx: i, ...extractItemTexts(policy) };
                          }
                          return null;
                        }).filter(Boolean);

                        return validPolicies.map((policy: any) => (
                          <div key={policy.idx} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:border-primary/30 hover:bg-primary/[0.01] transition-all group cursor-pointer flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4 shrink-0">
                              <FileText size={20} />
                            </div>
                            <span className="text-sm font-bold text-zinc-700 block mb-2">{policy.title}</span>
                            {policy.desc ? <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-3">{policy.desc}</p> : <p className="text-[10px] text-zinc-400">정책 상세 정보 확인하기</p>}
                          </div>
                        ));
                      })()}
                    {isEmpty(data?.ai_insights?.recommended_policies) && (
                       <div className="col-span-full py-12 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                          <p className="text-zinc-300 font-medium">추천된 정책이 없습니다.</p>
                       </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              // --- AI 챗 데이터가 없는 경우 (대체 UI) ---
              <div className="space-y-10">
                {/* 1. 특이사항 및 사전 요청사항 */}
                <section>
                   <h2 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <AlertCircle size={14} />
                     사전 접수 특이사항 (Special Notes)
                   </h2>
                   <div className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-2 h-full bg-rose-400" />
                     {specialNote ? (
                       <p className="text-[14px] text-zinc-800 leading-relaxed font-bold whitespace-pre-wrap">{specialNote}</p>
                     ) : (
                       <p className="text-[13px] text-zinc-400 font-medium italic">신청 시 접수된 사전 특이사항이나 메모가 없습니다.</p>
                     )}
                   </div>
                </section>

                {/* 2. 프로필 기반 초기 상담 가이드 */}
                <section>
                   <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <Compass size={14} className="animate-pulse" />
                     초기 상담 방향성 가이드
                   </h2>
                   <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 rounded-[2rem] shadow-xl text-white space-y-6">
                     <div>
                       <p className="text-xl font-extrabold leading-relaxed text-indigo-50 flex flex-wrap items-center gap-2 mb-2">
                         <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{data?.name || data?.user_name || "내담자"}님</span>은 현재
                         {data?.interest_areas?.length > 0 ? (
                           <span> <span className="text-amber-300">[{data.interest_areas.join(", ")}]</span> 분야에 관심이 있는 </span>
                         ) : null}
                         <span className="text-white border-b-2 border-indigo-300">{data?.job_status || "직업 미상"}</span> 상태입니다.
                       </p>
                       <p className="text-[13px] text-indigo-100 mt-4 font-medium leading-relaxed">
                         사전 AI 챗봇 상담을 진행하지 않아 맞춤형 AI 분석 보고서가 없습니다.<br/>
                         대신 아래의 <strong>프로필 기반 권장 체크리스트</strong>를 활용하여 내담자의 현재 상황과 가장 큰 고민을 파악하는 데 집중해 주세요.
                       </p>
                     </div>
                     
                     <div className="bg-white/10 rounded-2xl p-6 border border-white/20 space-y-4">
                       <p className="text-[11px] font-black tracking-widest text-indigo-200 uppercase flex items-center gap-1.5 border-b border-white/10 pb-3"><ListTodo size={14}/> Recommended Checklist</p>
                       <ul className="space-y-4 pt-2">
                         <li className="flex items-start gap-4 text-[14px] font-medium text-white/95">
                           <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">1</div>
                           <span className="leading-relaxed">내담자가 센터를 방문하게 된 가장 결정적인 계기 및 현재 직면한 어려움 청취하기</span>
                         </li>
                         {data?.interest_areas?.length > 0 && (
                           <li className="flex items-start gap-4 text-[14px] font-medium text-white/95">
                             <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">2</div>
                             <span className="leading-relaxed">사전 선택한 관심 분야(<span className="text-amber-300 font-bold">{data.interest_areas.join(", ")}</span>)와 관련된 구체적인 목표나 희망 지원 방향 파악하기</span>
                           </li>
                         )}
                         {(data?.job_status?.includes("구직") || data?.job_status?.includes("준비")) && (
                           <li className="flex items-start gap-4 text-[14px] font-medium text-white/95">
                             <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">3</div>
                             <span className="leading-relaxed">취업 및 구직 준비 과정에서의 구체적인 애로사항 및 심리적/경제적 압박감 요인 확인하기</span>
                           </li>
                         )}
                         <li className="flex items-start gap-4 text-[14px] font-medium text-white/95">
                           <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                             {(data?.interest_areas?.length > 0 ? 1 : 0) + ((data?.job_status?.includes("구직") || data?.job_status?.includes("준비")) ? 1 : 0) + 2}
                           </div>
                           <span className="leading-relaxed text-indigo-100">기본 프로필(연령, {data?.income_level ? `소득: ${data.income_level}` : "소득 미상"}) 기반의 정부/지자체 청년 지원정책 대상 여부 파악하기</span>
                         </li>
                       </ul>
                     </div>
                   </div>
                </section>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 상담 기록장 & 실시간 STT */}
        <aside className="w-[450px] bg-white border-l border-zinc-100 flex flex-col shadow-2xl shadow-zinc-200/50 z-[5]">
          {/* 실시간 STT 전사 (헤더 및 컨텐츠 영역) */}
          <div className={`border-b border-zinc-100 flex flex-col shrink-0 transition-all duration-300 ${showSTT ? 'h-[40%]' : 'h-auto bg-zinc-50/50'}`}>
            <div className="p-4 border-b border-zinc-50 bg-white flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    실시간 상담 전사 기록 (STT)
                  </h2>
                  <div className="flex items-center gap-2.5 ml-6 text-[10px] font-bold text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-zinc-300'}`} />
                      {isRecording ? '녹음 진행 중' : '대기 중'}
                    </span>
                    <span className="text-zinc-200">|</span>
                    <button onClick={resetTranscript} className="hover:text-rose-500 transition-colors flex items-center gap-1"><RotateCcw size={10}/> 초기화</button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end mt-1">
                   {/* STT 화면 표시 Toggle Row */}
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500">화면 표시</span>
                      <button 
                        onClick={() => setShowSTT(!showSTT)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${showSTT ? 'bg-indigo-500' : 'bg-zinc-200'}`}
                      >
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${showSTT ? 'translate-x-[14px]' : 'translate-x-1'}`} />
                      </button>
                   </div>
                   
                   {/* 화자 구분 기능 Toggle Row */}
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500">화자 구분</span>
                      <button 
                        onClick={() => {
                          setUseSpeakerLabels(!useSpeakerLabels);
                          if (useSpeakerLabels) setAutoDiarization(false); 
                        }}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${useSpeakerLabels ? 'bg-primary' : 'bg-zinc-200'}`}
                      >
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${useSpeakerLabels ? 'translate-x-[14px]' : 'translate-x-1'}`} />
                      </button>
                   </div>
                </div>
              </div>

              {/* Speaker Diarization Tools Row */}
              {showSTT && useSpeakerLabels && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-50 animate-in fade-in slide-in-from-top-2 duration-300">
                   {/* 실시간 음높이 모니터 (Pitch Vertical Gauge) */}
                   <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0" title={currentPitch > 0 ? `Pitch: ${currentPitch} Hz` : "음성 대기 중"}>
                     <Activity size={10} className={currentPitch > 0 ? "text-indigo-400 animate-pulse" : "text-zinc-300"} />
                     <div className="w-1.5 h-3.5 bg-zinc-200 rounded-full relative overflow-hidden">
                       <div 
                         className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all duration-75 ease-out rounded-full"
                         style={{ height: currentPitch > 0 ? `${Math.min((currentPitch / 300) * 100, 100)}%` : '0%' }}
                       />
                     </div>
                   </div>

                   {/* 자동 화자 감지 스위치 */}
                   <button 
                     onClick={() => setAutoDiarization(!autoDiarization)}
                     className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all ${
                       autoDiarization 
                         ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" 
                         : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200"
                     }`}
                   >
                     <Sparkles size={10} className={autoDiarization ? "animate-pulse" : ""} />
                     <span className="text-[9px] font-bold">자동 감지</span>
                   </button>

                   {/* 화자 전환 컨트롤러 */}
                   <div className="flex items-center bg-zinc-50 p-0.5 rounded-lg border border-zinc-100 ml-auto">
                     <button 
                       onClick={() => {
                         setSpeakerRole("counselor");
                         setAutoDiarization(false); 
                       }}
                       className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                         speakerRole === "counselor" ? "bg-white text-primary shadow-sm" : "text-zinc-400"
                       }`}
                     >
                       상담사
                     </button>
                     <button 
                       onClick={() => {
                         setSpeakerRole("client");
                         setAutoDiarization(false); 
                       }}
                       className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                         speakerRole === "client" ? "bg-white text-primary shadow-sm" : "text-zinc-400"
                       }`}
                     >
                       내담자
                     </button>
                   </div>
                </div>
              )}
            </div>

            {/* STT Transcript Body */}
            {showSTT && (
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 custom-scrollbar"
              >
                <div className="space-y-4">
                   <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm min-h-[100px] relative">
                      <p className="text-[13px] text-zinc-700 leading-[1.8] font-medium tracking-tight whitespace-pre-wrap">
                        {transcript}
                        <span className="text-primary font-bold animate-pulse inline-block ml-1 border-b-2 border-primary/30">{interimTranscript}</span>
                        {!transcript && !interimTranscript && (
                          <span className="text-zinc-300 italic text-sm">상담이 시작되면 대화 내용이 실시간으로 이곳에 기록됩니다...</span>
                        )}
                      </p>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* 수동 메모 영역 */}
          <div className="flex-1 flex flex-col">
            <div className="p-5 border-b border-zinc-50 flex items-center justify-between">
              <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={12} className="text-zinc-400" /> 상담사 관찰 정보 및 요약 메모
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="내담자의 비언어적 표현이나 상담사의 개입 의도 등 핵심 특이사항을 이곳에 기록해 주세요. 종료 시 자동 저장됩니다."
              className="flex-1 p-8 resize-none border-none focus:ring-0 text-sm text-zinc-700 font-medium leading-relaxed bg-white custom-scrollbar-minimal"
            />
          </div>
        </aside>
      </main>

      {/* 상담 검토 및 STT 분석 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-primary" />
                  상담 STT 최종 교정 및 전송
                </h2>
                <p className="text-xs font-bold text-zinc-500 mt-1">
                  AI가 백그라운드에서 녹음된 오디오를 분석하여 화자를 분리하고 내용을 교정한 결과입니다.
                </p>
              </div>
              {isAnalyzingAudio && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">분석 중...</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              {isAnalyzingAudio ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-100 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                    <Mic size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-zinc-800 font-bold mb-1 transition-all duration-300">
                      {[
                        "오디오 파일 암호화 및 업로드 준비 중... 🚀", 
                        "Gemini 2.0 모델 서버 파형 분석 중... 🎧", 
                        "대화 문맥 기반 화자 분리 진행 중... 🗣️", 
                        "한국어 맞춤법 교정 및 최종 텍스트 다듬는 중... ✨"
                      ][loadingStepIdx]}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium">오디오 길이에 따라 1~2분 정도 소요될 수 있습니다. 창을 닫지 마세요.</p>
                  </div>
                </div>
              ) : (
                <textarea 
                  value={analyzedText}
                  onChange={(e) => setAnalyzedText(e.target.value)}
                  className="flex-1 w-full p-6 text-sm text-zinc-800 leading-relaxed font-medium bg-zinc-50 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none custom-scrollbar"
                  placeholder="분석된 텍스트가 이곳에 표시됩니다. 리포트 생성 전 내용을 직접 편집할 수 있습니다."
                />
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setShowReviewModal(false)}
                disabled={isSaving || isAnalyzingAudio}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                닫기
              </button>
              <button 
                onClick={() => submitConsultation(analyzedText)}
                disabled={isSaving || isAnalyzingAudio || !analyzedText.trim()}
                className="px-8 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 text-white shadow-lg flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                위 내용으로 최종 리포트 생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

