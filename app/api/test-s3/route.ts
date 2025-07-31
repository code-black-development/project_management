import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const testUrls = [
    `https://codeflow-codeblack.s3.eu-central-1.amazonaws.com/test.txt`,
    `https://s3.eu-central-1.amazonaws.com/codeflow-codeblack/test.txt`,
  ];

  const results = [];

  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      results.push({
        url,
        status: response.status,
        accessible: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });
    } catch (error) {
      results.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        accessible: false,
      });
    }
  }

  return NextResponse.json({ results });
}
