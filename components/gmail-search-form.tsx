'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

interface GmailSearchFormProps {
  onSearch: (params: {
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  isLoading: boolean;
}

export function GmailSearchForm({ onSearch, isLoading }: GmailSearchFormProps) {
  // Get current week dates (Monday to Sunday)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    
    const monday = new Date(today.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    return {
      from: formatDate(monday),
      to: formatDate(sunday)
    };
  };

  const weekDates = getWeekDates();
  const [dateFrom, setDateFrom] = useState(weekDates.from);
  const [dateTo, setDateTo] = useState(weekDates.to);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails([]);
    setSuccessMessage(null);

    // Basic validation
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      setError('From date must be before To date');
      return;
    }

    onSearch({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  // Expose error and success handlers to parent through window
  if (typeof window !== 'undefined') {
    (window as any).gmailSearchSetError = (msg: string, details?: string[]) => {
      setError(msg);
      setErrorDetails(details || []);
    };
    (window as any).gmailSearchSetSuccess = (msg: string) => {
      setSuccessMessage(msg);
      setError(null);
      setErrorDetails([]);
    };
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">{error}</h3>
              {errorDetails.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-red-800">
                  {errorDetails.map((detail, i) => (
                    <li key={i}>• {detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-2">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-2">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="h-9 md:mt-0 md:w-auto w-full">
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>
    </div>
  );
}
