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
      // 파일명에서 확장자를 제거하여 슬러그로 사용
      const slug = fileName.replace(/\.md$/, '');
      // 제목은 파일명에서 언더바나 대시를 공백으로 바꾸고 첫 글자를 대문자로
      const title = slug
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      
      return {
        slug,
        title,
        baseName: fileName,
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
