"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Sparkles, 
  MessageSquare, 
  Lightbulb, 
  ChevronRight, 
  User, 
  Clock, 
  FileText, 
  Map, 
  ArrowRight,
  AlertCircle,
  Mic,
  Activity,
  UserCheck,
  Briefcase,
  Wallet,
  Compass,
  RotateCcw,
  Users,
  MapPin
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
          
          // Noise Gate: 주변 소음보다 확실히 클 때만 피치 업데이트 (임계값 상향)
          if (maxEnergy > 85) { 
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
  const [useSpeakerLabels, setUseSpeakerLabels] = useState(true); // 화자 구분 사용 여부
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  const toggleRecording = () => {
    if (!recognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저를 권장합니다.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleEndConsultation = async () => {
    if (!confirm("상담을 종료하고 최종 보고서 작성 단계로 이동하시겠습니까?")) return;
    
    // 전사 내용이나 메모가 전혀 없는 경우 웹훅을 쏘지 않고 바로 이동
    if (!transcript.trim() && !notes.trim()) {
      router.push(`/manager/consultation/${id}/report`);
      return;
    }

    setIsSaving(true);
    try {
      await postToWebhook(WEBHOOK_URLS.CONSULTATION_SUMMARY, {
        request_id: id,
        email: data?.email,
        user_name: data?.name || data?.user_name,
        full_text: transcript, // 요청하신 필드명 full_text로 변경
        manager_notes: notes,
        timestamp: new Date().toISOString()
      });

      router.push(`/manager/consultation/${id}/report`);
    } catch (err) {
      console.error("Failed to send consultation summary:", err);
      router.push(`/manager/consultation/${id}/report`);
    } finally {
      setIsSaving(false);
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

        {/* 오프라인 상담 및 마이크 체크 배너 */}
        {isOffline && (
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100 animate-bounce-subtle">
                     <AlertCircle className="text-amber-500" size={14} />
                     <span className="text-[11px] font-bold text-amber-700">오프라인 모드</span>
                  </div>
                </div>
             </div>
          </div>
        )}

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
                   <p className="text-sm text-zinc-800 leading-relaxed font-bold whitespace-pre-wrap">
                      {(() => {
                         const pr = data?.ai_insights?.policy_roadmap;
                         if (!pr) return '설정된 로드맵이 없습니다.';
                         if (typeof pr === 'string') return pr;
                         if (Array.isArray(pr)) {
                           const txts = pr.map((item: any, i: number) => {
                             if (typeof item === 'string') return (i+1)+'. '+item;
                             const t = (item['제목'] || item['title'] || item['단계'] || '') as string;
                             const d = (item['추천이유'] || item['reason'] || item['내용'] || item['description'] || '') as string;
                             if (!t && !d) return null;
                             return (i+1)+'. '+t+(d ? '\n   '+d : '');
                           }).filter(Boolean);
                           return txts.length ? txts.join('\n\n') : '설정된 로드맵이 없습니다.';
                         }
                         return JSON.stringify(pr, null, 2);
                       })()}
                   </p>
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
                   if (typeof policies === 'string') { try { policies = JSON.parse(policies); } catch(e) { policies = null; } }
                   if (!Array.isArray(policies)) return null;
                   return policies.map((policy: any, i: number) => {
                     const title = typeof policy === 'string' ? policy : String(policy['제목'] || policy['title'] || policy['name'] || ('정책 '+(i+1)));
                     const reason = typeof policy !== 'string' ? String(policy['추천이유'] || policy['reason'] || policy['description'] || '') : '';
                     return (
                       <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:border-primary/30 hover:bg-primary/[0.01] transition-all group cursor-pointer">
                         <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4">
                           <FileText size={20} />
                         </div>
                         <span className="text-sm font-bold text-zinc-700 block mb-2">{title}</span>
                         {reason ? <p className="text-[10px] text-zinc-400 leading-relaxed">{reason}</p> : <p className="text-[10px] text-zinc-400">정책 상세 정보 확인하기</p>}
                       </div>
                     );
                   });
                 })()}
                {isEmpty(data?.ai_insights?.recommended_policies) && (
                   <div className="col-span-full py-12 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                      <p className="text-zinc-300 font-medium">추천된 정책이 없습니다.</p>
                   </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* 우측: 상담 기록장 & 실시간 STT */}
        <aside className="w-[450px] bg-white border-l border-zinc-100 flex flex-col shadow-2xl shadow-zinc-200/50 z-[5]">
          {/* 실시간 STT 전사 영역 */}
          <div className="h-[45%] border-b border-zinc-100 flex flex-col">
            <div className="p-5 border-b border-zinc-50 bg-white flex items-center justify-between">
              <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-primary animate-pulse" />
                실시간 상담 전사 기록 (STT)
              </h2>
              <div className="flex items-center gap-2">
                {/* 화자 구분 전체 Toggle */}
                <button 
                  onClick={() => {
                    setUseSpeakerLabels(!useSpeakerLabels);
                    if (useSpeakerLabels) setAutoDiarization(false); // 구분 끌 때 자동감지도 해제
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    useSpeakerLabels 
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200" 
                      : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400"
                  }`}
                  title="화자 구분 기능 켜기/끄기"
                >
                  <Users size={12} />
                  <span className="text-[10px] font-bold">{useSpeakerLabels ? "구분 중" : "일반 모드"}</span>
                </button>

                {useSpeakerLabels && (
                  <div className="flex items-center animate-in slide-in-from-right-2 duration-300 gap-2">
                    {/* 실시간 음높이 모니터 (Hz) */}
                    {currentPitch > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-50 rounded-lg border border-zinc-100">
                        <Activity size={10} className="text-zinc-400" />
                        <span className="text-[9px] font-bold text-zinc-500">{currentPitch} Hz</span>
                      </div>
                    )}

                    {/* 자동 화자 감지 스위치 */}
                    <button 
                      onClick={() => setAutoDiarization(!autoDiarization)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all ${
                        autoDiarization 
                          ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" 
                          : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200"
                      }`}
                      title="음높이 기반 자동 감지"
                    >
                      <Sparkles size={10} className={autoDiarization ? "animate-pulse" : ""} />
                      <span className="text-[9px] font-bold">자동 감지</span>
                    </button>

                    {/* 화자 전환 컨트롤러 */}
                    <div className="flex items-center bg-zinc-50 p-0.5 rounded-lg border border-zinc-100">
                      <button 
                        onClick={() => {
                          setSpeakerRole("counselor");
                          setAutoDiarization(false); // 수동 조작 시 자동 감지 해제
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
                          setAutoDiarization(false); // 수동 조작 시 자동 감지 해제
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

                <button 
                  onClick={resetTranscript}
                  className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-300 hover:text-rose-400 transition-all flex items-center gap-1 group"
                  title="전사 내용 초기화"
                >
                  <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">기록 초기화</span>
                  <RotateCcw size={14} />
                </button>
                {isRecording && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Live Recording</span>
                  </div>
                )}
              </div>
            </div>
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
    </div>
  );
}

