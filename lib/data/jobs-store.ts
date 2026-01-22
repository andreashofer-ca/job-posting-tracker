/**
 * Jobs Data Store
 * 
 * Manages the jobs database (jobs.json) with functions for
 * storing, retrieving, and updating job records.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Job, JobsData } from './types';

const JOBS_FILE_PATH = path.join(process.cwd(), 'data', 'jobs.json');

async function readJobsFile(): Promise<JobsData> {
  try {
    const data = await fs.readFile(JOBS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    return { jobs: [], lastSync: null, version: '1.0.0' };
  }
}

async function writeJobsFile(data: JobsData): Promise<void> {
  await fs.writeFile(JOBS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllJobs(): Promise<Job[]> {
  const data = await readJobsFile();
  return data.jobs;
}

export async function getJobById(id: string): Promise<Job | null> {
  const data = await readJobsFile();
  return data.jobs.find(job => job.id === id) || null;
}

export async function addJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
  const data = await readJobsFile();
  const newJob: Job = {
    ...job,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.jobs.push(newJob);
  await writeJobsFile(data);
  return newJob;
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
  const data = await readJobsFile();
  const index = data.jobs.findIndex(job => job.id === id);
  if (index === -1) return null;

  data.jobs[index] = {
    ...data.jobs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeJobsFile(data);
  return data.jobs[index];
}

export async function deleteJob(id: string): Promise<boolean> {
  const data = await readJobsFile();
  const initialLength = data.jobs.length;
  data.jobs = data.jobs.filter(job => job.id !== id);
  if (data.jobs.length === initialLength) return false;
  await writeJobsFile(data);
  return true;
}

export async function updateLastSync(): Promise<void> {
  const data = await readJobsFile();
  data.lastSync = new Date().toISOString();
  await writeJobsFile(data);
}
