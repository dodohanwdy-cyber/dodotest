NEW_CODE = '''  // 어떤 값이든 안전하게 문자열로 추출 (객체면 null 반환)
  const extractString = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim() || null;
    if (typeof val === 'number') return String(val);
    return null;
  };

  // 객체에서 우선순위 필드명으로 값 추출, 없으면 모든 문자열 값 수집
  const extractItemTexts = (item: any): { title: string; desc: string } | null => {
    if (!item || typeof item !== 'object') return null;

    const TITLE_KEYS = ['제목', 'title', 'name', '단계', 'step', '정책명', '항목', 'label', '이름'];
    const DESC_KEYS  = ['추천이유', 'reason', '내용', 'description', 'desc', '설명', 'detail', 'summary', '요약', '이유'];
    const SKIP_KEYS  = ['ID', 'id', '_id'];

    let title = '';
    let desc  = '';

    for (const k of TITLE_KEYS) {
      const v = extractString(item[k]);
      if (v) { title = v; break; }
    }
    for (const k of DESC_KEYS) {
      const v = extractString(item[k]);
      if (v) { desc = v; break; }
    }

    if (!title && !desc) {
      const allStrings: string[] = [];
      for (const k of Object.keys(item)) {
        if (SKIP_KEYS.includes(k)) continue;
        const v = extractString(item[k]);
        if (v) allStrings.push(v);
      }
      if (allStrings.length === 0) return null;
      title = allStrings[0];
      desc  = allStrings.slice(1).join(' | ');
    }

    return { title: title || '(항목)', desc };
  };

  // 정책 배열/JSON문자열을 카드 형태로 렌더링
  const renderPolicyList = (rawData: any, sectionTitle: string, emptyMsg: string) => {
    if (rawData === null || rawData === undefined) return null;

    let items: any[] = [];
    let parseFailed = false;

    try {
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (typeof rawData === 'string') {
        const trimmed = rawData.trim();
        if (!trimmed || trimmed === '[object Object]') { parseFailed = true; }
        else {
          const parsed = JSON.parse(trimmed);
          items = Array.isArray(parsed) ? parsed : [parsed];
        }
      } else if (typeof rawData === 'object') {
        items = [rawData];
      }
    } catch {
      parseFailed = true;
    }

    if (parseFailed) {
      const str = typeof rawData === 'string' ? rawData.trim() : '';
      if (str && str !== '[object Object]') {
        return (
          <div className="space-y-2">
            <p className="text-sm font-bold text-indigo-900/70 uppercase tracking-wide">{sectionTitle}</p>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-sm">{str}</p>
          </div>
        );
      }
      return null;
    }

    const renderableItems = items
      .map((item, idx) => {
        if (typeof item === 'string') {
          const v = item.trim();
          if (!v || v === '[object Object]') return null;
          return { idx, title: v, desc: '' };
        }
        if (typeof item === 'number') {
          return { idx, title: String(item), desc: '' };
        }
        const texts = extractItemTexts(item);
        if (!texts) return null;
        return { idx, title: texts.title, desc: texts.desc };
      })
      .filter((r): r is { idx: number; title: string; desc: string } => r !== null);

    if (renderableItems.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-indigo-900/70 uppercase tracking-wide">{sectionTitle}</p>
        <div className="space-y-3">
          {renderableItems.map((r) => (
            <div
              key={r.idx}
              className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/60 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  {r.idx + 1}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-900 text-sm leading-snug">{r.title}</h4>
                  {r.desc && (
                    <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">{r.desc}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
'''

with open(r'g:\재택근무\바이브코딩\src\components\manager\ConsultationDetailPopup.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 69번째 줄(index 68) 부터 169번째 줄(index 168)까지를 새 코드로 교체
# extractString 시작: index 68 ("  // 어떤 값이든...")
# renderPolicyList 끝: index 168 ("  };")
# 총 101줄 (68~168 inclusive)
print(f"교체 전 총 줄 수: {len(lines)}")
print(f"68번 줄: {lines[68]!r}")
print(f"168번 줄: {lines[168]!r}")

lines[68:169] = [NEW_CODE]

with open(r'g:\재택근무\바이브코딩\src\components\manager\ConsultationDetailPopup.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"교체 후 총 줄 수: {len(lines)}")
print("완료")
