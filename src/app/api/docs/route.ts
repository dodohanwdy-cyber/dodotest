import { NextRequest, NextResponse } from 'next/server';
import { getDocBySlug } from '@/lib/docs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const content = await getDocBySlug(slug);

  if (content === null) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({ content });
}
