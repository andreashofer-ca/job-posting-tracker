'use client';

import { useState, useMemo } from 'react';
import { Job } from '@/lib/data/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface JobTableProps {
  jobs: Job[];
  onUpdate: (id: string, updates: Partial<Job>) => void;
  onDelete: (id: string) => void;
}

type SortBy = 'date' | 'jobName' | 'company' | 'match';

export function JobTable({ jobs, onUpdate, onDelete }: JobTableProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleNotesChange = (id: string, notes: string) => {
    onUpdate(id, { followupDescription: notes });
    setEditingNotes(null);
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedJobs = useMemo(() => {
    const sorted = [...jobs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.emailDate).getTime();
          bValue = new Date(b.emailDate).getTime();
          break;
        case 'jobName':
          aValue = a.jobName.toLowerCase();
          bValue = b.jobName.toLowerCase();
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'match':
          aValue = a.criteriaMatch ? 1 : 0;
          bValue = b.criteriaMatch ? 1 : 0;
          break;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [jobs, sortBy, sortDirection]);

  const SortIndicator = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 inline ml-1" /> : 
      <ArrowDown className="h-4 w-4 inline ml-1" />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('date')}>
              Date <SortIndicator column="date" />
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('jobName')}>
              Job Name <SortIndicator column="jobName" />
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('company')}>
              Company <SortIndicator column="company" />
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('match')}>
              Match <SortIndicator column="match" />
            </TableHead>
            <TableHead>Followup Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No jobs found. Search Gmail to get started.
              </TableCell>
            </TableRow>
          ) : (
            sortedJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(job.emailDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">{job.jobName}</TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell>
                  <Select
                    value={job.criteriaMatch ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      onUpdate(job.id, { criteriaMatch: value === 'yes' })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {editingNotes === job.id ? (
                    <Input
                      defaultValue={job.followupDescription}
                      onBlur={(e) => handleNotesChange(job.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNotesChange(job.id, e.currentTarget.value);
                        }
                      }}
                      autoFocus
                      className="max-w-xs"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingNotes(job.id)}
                      className="cursor-pointer hover:bg-muted p-2 rounded min-h-[2rem]"
                    >
                      {job.followupDescription || <span className="text-muted-foreground">Add notes...</span>}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => window.open(job.jobUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
