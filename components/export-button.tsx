'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ExportButton() {
  const [filter, setFilter] = useState<'all' | 'matched'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const url = `/api/jobs/export${filter === 'matched' ? '?filter=matched' : ''}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `linkedin-jobs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'matched')}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Jobs</SelectItem>
          <SelectItem value="matched">Matched Only</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleExport} disabled={isExporting}>
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  );
}
