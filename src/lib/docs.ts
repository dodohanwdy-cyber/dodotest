import fs from 'fs';
import path from 'path';

const docsDirectory = path.join(process.cwd(), 'docs');

export interface DocMetadata {
  slug: string;
  title: string;
  baseName: string;
}

/**
 * docs 폴더 내의 모든 .md 파일 목록을 가져옵니다.
 */
export function getAllDocs(): DocMetadata[] {
  if (!fs.existsSync(docsDirectory)) return [];

  const fileNames = fs.readdirSync(docsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(docsDirectory, fileName);
      const content = fs.readFileSync(fullPath, 'utf8');

      // 제목 추출: 첫 번째 # 으로 시작하는 라인
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const displayTitle = titleMatch ? titleMatch[1].trim() : slug;

      // 설명 추출: 제목 이후 첫 번째 빈 줄이 아닌 문단 (최대 100자)
      // 메타데이터(**작성일** 등)는 제외하고 본문 텍스트만 찾음
      const lines = content.split('\n');
      let description = '';
      for (let i = (titleMatch ? content.substring(0, titleMatch.index).split('\n').length : 0); i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('*') && !line.startsWith('>')) {
          description = line.substring(0, 120) + (line.length > 120 ? '...' : '');
          break;
        }
      }

      return {
        slug,
        title: displayTitle,
        baseName: fileName,
        description: description || '상세 내용을 확인하려면 클릭하세요.'
      };
    });
}

/**
 * 특정 슬러그에 해당하는 문서의 내용을 가져옵니다.
 */
export async function getDocBySlug(slug: string): Promise<string | null> {
  try {
    const fullPath = path.join(docsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) return null;
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return fileContents;
  } catch (error) {
    console.error(`Error reading doc ${slug}:`, error);
    return null;
  }
}
