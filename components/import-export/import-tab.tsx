'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';

interface ImportTabProps {
  organization: Organization;
  onDataChange?: () => void;
}

export function ImportTab({ organization }: ImportTabProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');

  const validateImportData = (text: string) => {
    try {
      const data = JSON.parse(text);
      
      // Basic validation
      if (!data.version || !data.organization || !Array.isArray(data.guests)) {
        throw new Error('Invalid data format');
      }
      
      if (!data.organization.name || !data.organization.configuration) {
        throw new Error('Missing required organization data');
      }

      return data;
    } catch {
      throw new Error('Invalid JSON format');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error('Please paste the export data');
      return;
    }

    setIsImporting(true);
    setImportStatus('validating');

    try {
      // Validate the data first
      const data = validateImportData(importText);
      
      const response = await fetch(`/api/organizations/${organization.id}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import data');
      }

      const result = await response.json();
      setImportStatus('success');
      toast.success(`Data imported successfully! ${result.summary.guests_imported} guests imported. Refreshing...`);
      
      // Hard refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      setImportStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to import data');
      setTimeout(() => setImportStatus('idle'), 3000);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Import Organization Data
          </CardTitle>
          <CardDescription>
            This will replace all current guests and update organization settings. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-data">Paste Export Data (JSON)</Label>
            <textarea
              id="import-data"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste the exported JSON data here..."
              className="w-full h-40 p-3 border rounded-md text-sm font-mono resize-none"
              disabled={isImporting}
            />
          </div>
          
          {importStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Data imported successfully!
            </div>
          )}
          
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Import failed. Please check the data format.
            </div>
          )}
          
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !importText.trim()}
            className="w-full"
            variant={importStatus === 'success' ? 'default' : 'destructive'}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting 
              ? importStatus === 'validating' 
                ? 'Validating...'
                : 'Importing...'
              : 'Import Data'
            }
          </Button>
        </CardContent>
      </Card>
      
      <div className="text-sm text-gray-600 space-y-2">
        <p><strong>What gets imported:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Organization settings and configuration</li>
          <li>All guest data (replaces existing guests)</li>
          <li>Invite code (if included)</li>
          <li>Member information (for reference only)</li>
        </ul>
      </div>
    </div>
  );
}