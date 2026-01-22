import { NextResponse } from 'next/server';
import { getEmails } from '@/lib/data/emails-store';

export async function GET() {
  try {
    const data = await getEmails();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get emails:', error);
    return NextResponse.json(
      { error: 'Failed to load emails' },
      { status: 500 }
    );
  }
}
