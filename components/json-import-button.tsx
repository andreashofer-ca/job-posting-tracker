'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface JsonImportButtonProps {
  onImportComplete: () => void;
}

export function JsonImportButton({ onImportComplete }: JsonImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: Array.isArray(data) ? data : [data] }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Successfully imported ${result.imported} jobs!`);
        onImportComplete();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to parse JSON: ${error}`);
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        id="json-upload"
        className="hidden"
      />
      <label htmlFor="json-upload">
        <Button asChild disabled={isImporting}>
          <span className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import JSON'}
          </span>
        </Button>
      </label>
    </div>
  );
}
