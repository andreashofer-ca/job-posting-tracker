import { NextResponse } from 'next/server';
import { getEmails, clearAllEmails } from '@/lib/data/emails-store';

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { emails } = body;
    
    if (emails && emails.length === 0) {
      await clearAllEmails();
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to clear emails:', error);
    return NextResponse.json(
      { error: 'Failed to clear emails' },
      { status: 500 }
    );
  }
}
