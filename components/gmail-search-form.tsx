'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

interface GmailSearchFormProps {
  onSearch: (params: {
    dateFrom?: string;
    dateTo?: string;
    unreadOnly: boolean;
  }) => void;
  isLoading: boolean;
}

export function GmailSearchForm({ onSearch, isLoading }: GmailSearchFormProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
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
      unreadOnly,
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
    <Card>
      <CardHeader>
        <CardTitle>Search Gmail for LinkedIn Jobs</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Note: Requires Gmail credentials configured in .env.local. See SIMPLE_GMAIL_SETUP.md
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">{successMessage}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="unread"
              checked={unreadOnly}
              onCheckedChange={(checked) => setUnreadOnly(checked as boolean)}
            />
            <label htmlFor="unread" className="text-sm font-medium cursor-pointer">
              Unread only
            </label>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search Gmail'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
