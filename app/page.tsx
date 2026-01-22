'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/lib/data/types';
import { JobTable } from '@/components/job-table';
import { GmailSearchForm } from '@/components/gmail-search-form';
import { ExportButton } from '@/components/export-button';
import { JsonImportButton } from '@/components/json-import-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadJobs();
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

  const handleSearch = async (params: {
    dateFrom?: string;
    dateTo?: string;
    unreadOnly: boolean;
  }) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/gmail/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        if (typeof window !== 'undefined' && (window as any).gmailSearchSetSuccess) {
          (window as any).gmailSearchSetSuccess(
            `Found ${data.jobsFound} jobs from ${data.emailsFound} emails`
          );
        }
        await loadJobs();
      } else {
        // Show error message with details
        if (typeof window !== 'undefined' && (window as any).gmailSearchSetError) {
          (window as any).gmailSearchSetError(
            data.error || 'Search failed',
            data.instructions || data.suggestions || (data.details ? [data.details] : [])
          );
        }
        console.error('Search error:', data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      if (typeof window !== 'undefined' && (window as any).gmailSearchSetError) {
        (window as any).gmailSearchSetError(
          'Failed to search Gmail',
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

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">To Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{jobs.length - matchedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <GmailSearchForm onSearch={handleSearch} isLoading={isSearching} />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your Jobs</h2>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <ExportButton />
                <JsonImportButton onImportComplete={loadJobs} />
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
      </div>

      <footer className="text-center text-sm text-muted-foreground pt-8">
        <p>Note: This is a development version using mock Gmail data.</p>
        <p>Configure Gmail MCP server to connect your actual Gmail account.</p>
      </footer>
    </div>
  );
}
