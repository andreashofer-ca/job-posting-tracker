import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs, addJob, updateJob, deleteJob } from '@/lib/data/jobs-store';
import { Job } from '@/lib/data/types';

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newJob = await addJob(body);
    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const updatedJob = await updateJob(id, updates);
    if (!updatedJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }
    const deleted = await deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
