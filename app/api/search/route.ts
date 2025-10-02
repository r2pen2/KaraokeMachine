import { NextRequest } from 'next/server';

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing YOUTUBE_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!q.trim()) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const url = new URL(YT_SEARCH_URL);
  url.searchParams.set('key', key);
  url.searchParams.set('q', q);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '10');

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}



