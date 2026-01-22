import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs } from '@/lib/data/jobs-store';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'matched' or null

    let jobs = await getAllJobs();

    // Filter if requested
    if (filter === 'matched') {
      jobs = jobs.filter(job => job.criteriaMatch);
    }

    // Generate CSV
    const headers = ['Date', 'Job Name', 'Company', 'URL', 'Match', 'Notes', 'Summary'];
    const rows = jobs.map(job => [
      job.emailDate,
      escapeCSV(job.jobName),
      escapeCSV(job.company),
      job.jobUrl,
      job.criteriaMatch ? 'Yes' : 'No',
      escapeCSV(job.followupDescription),
      escapeCSV(job.summary)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const filename = `linkedin-jobs-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export jobs' }, { status: 500 });
  }
}
