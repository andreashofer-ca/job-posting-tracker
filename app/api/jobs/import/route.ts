import { NextRequest, NextResponse } from 'next/server';
import { addJob } from '@/lib/data/jobs-store';

export async function POST(request: NextRequest) {
  try {
    const { jobs } = await request.json();

    if (!Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Invalid format. Expected { jobs: [...] }' },
        { status: 400 }
      );
    }

    const imported = [];
    for (const job of jobs) {
      const created = await addJob({
        emailDate: job.emailDate || new Date().toISOString(),
        jobName: job.jobName || 'Unknown Job',
        company: job.company || 'Unknown Company',
        jobUrl: job.jobUrl || '',
        criteriaMatch: job.criteriaMatch || false,
        followupDescription: job.followupDescription || '',
        summary: job.summary || '',
        emailSubject: job.emailSubject || '',
        emailId: job.emailId || '',
      });
      imported.push(created);
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      jobs: imported,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import jobs', details: error.message },
      { status: 500 }
    );
  }
}
