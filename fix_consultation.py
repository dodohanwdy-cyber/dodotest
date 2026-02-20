import re

filepath = r'g:\재택근무\바이브코딩\src\app\manager\consultation\[id]\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original_count = content.count('console.log')

# console.log 줄 제거 (단독 줄인 경우)
# 1) console.log(...); 만 있는 줄 제거
content = re.sub(r'[ \t]*console\.log\([^)]*(?:\([^)]*\)[^)]*)*\);\s*\n', '', content)
# 2) 남은 console.group/groupEnd 제거
content = re.sub(r'[ \t]*console\.group\([^)]*\);\s*\n', '', content)
content = re.sub(r'[ \t]*console\.groupEnd\(\);\s*\n', '', content)

after_count = content.count('console.log')
print(f"console.log: {original_count} → {after_count}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("완료")
