with open(r'g:\재택근무\바이브코딩\src\app\manager\consultation\[id]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.splitlines(keepends=True)

# 현재 상태 확인
print(f"총 줄 수: {len(lines)}")
print(f"594줄: {lines[593]!r}")
print(f"618줄: {lines[617]!r}")
print(f"630줄: {lines[629]!r}")
