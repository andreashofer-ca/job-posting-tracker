'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/lib/data/types';
import { JobTable } from '@/components/job-table';
import { GmailSearchForm } from '@/components/gmail-search-form';
import { ExportButton } from '@/components/export-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [unparsedCount, setUnparsedCount] = useState(0);

  useEffect(() => {
    loadJobs();
    loadUnparsedCount();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnparsedCount = async () => {
    try {
      const response = await fetch('/api/emails');
      const data = await response.json();
      const unparsed = data.emails?.filter((e: any) => !e.parsed) || [];
      setUnparsedCount(unparsed.length);
    } catch (error) {
      console.error('Failed to load email count:', error);
    }
  };

  const handleFetchEmails = async (params: {
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/emails/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        if (typeof window !== 'undefined' && (window as any).gmailSearchSetSuccess) {
          (window as any).gmailSearchSetSuccess(
            `Fetched ${data.emailsSaved} emails from Gmail`
          );
        }
        await loadUnparsedCount();
      } else {
        // Show error message with details
        if (typeof window !== 'undefined' && (window as any).gmailSearchSetError) {
          (window as any).gmailSearchSetError(
            data.error || 'Fetch failed',
            data.instructions || data.suggestions || (data.details ? [data.details] : [])
          );
        }
        console.error('Fetch error:', data);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      if (typeof window !== 'undefined' && (window as any).gmailSearchSetError) {
        (window as any).gmailSearchSetError(
          'Failed to fetch emails',
          [(error as Error).message || 'Unknown error occurred']
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleParseEmails = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/emails/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        if (typeof window !== 'undefined' && (window as any).gmailSearchSetSuccess) {
          (window as any).gmailSearchSetSuccess(
            `Parsed ${data.emailsParsed} emails into ${data.jobsCreated} jobs`
          );
        }
        await loadJobs();
        await loadUnparsedCount();
      } else {
        // Show error message
        if (typeof window !== 'undefined' && (window as any).gmailSearchSetError) {
          (window as any).gmailSearchSetError(
            data.error || 'Parse failed',
            data.details ? [data.details] : []
          );
        }
        console.error('Parse error:', data);
      }
    } catch (error) {
      console.error('Parse failed:', error);
      if (typeof window !== 'undefined' && (window as any).gmailSearchSetError) {
        (window as any).gmailSearchSetError(
          'Failed to parse emails',
          [(error as Error).message || 'Unknown error occurred']
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Job>) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await response.json();
      if (data.job) {
        setJobs(jobs.map(job => job.id === id ? data.job : job));
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
      setJobs(jobs.filter(job => job.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const matchedCount = jobs.filter(job => job.criteriaMatch).length;

  return (
    <div className="container mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold mb-2">Job Posting Tracker</h1>
        <p className="text-muted-foreground">
          Search email for job search postings and track the applications
        </p>
      </header>

      <GmailSearchForm 
        onFetchEmails={handleFetchEmails} 
        onParseEmails={handleParseEmails}
        isLoading={isSearching}
        unparsedCount={unparsedCount}
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Jobs <span className="text-base font-normal text-muted-foreground ml-2">({jobs.length} Total, {matchedCount} Matched, {jobs.length - matchedCount} To Review)</span></h2>
          <div className="flex gap-2">
            <div className="flex gap-2">
              <ExportButton />

            </div>
            <Button 
              onClick={() => {
                if (confirm('Are you sure you want to clear all jobs? This cannot be undone.')) {
                  setJobs([]);
                  // Write empty jobs array to file
                  fetch('/api/jobs', { 
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobs: [] })
                  }).catch(err => console.error('Error clearing jobs:', err));
                }
              }}
            >
              Clear All
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading jobs...</p>
        ) : (
          <JobTable jobs={jobs} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </div>

      <footer className="text-center text-sm text-muted-foreground pt-8">
        <p>Note: This is a development version using mock Gmail data.</p>
        <p>Configure Gmail MCP server to connect your actual Gmail account.</p>
      </footer>
    </div>
  );
}
