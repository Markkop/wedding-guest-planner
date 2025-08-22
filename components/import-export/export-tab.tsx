'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization, ExportData } from '@/lib/types';

interface ExportTabProps {
  organization: Organization;
}

export function ExportTab({ organization }: ExportTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/export`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export data');
      }

      const result = await response.json();
      setExportData(result.data);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const copyExportData = async () => {
    if (!exportData) return;
    
    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast.success('Export data copied to clipboard!');
    } catch {
      toast.error('Failed to copy data to clipboard');
    }
  };

  const downloadExportData = () => {
    if (!exportData) return;

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    toast.success('Export file downloaded!');
  };

  const formatJsonPreview = (data: ExportData) => {
    const preview = {
      organization: data.organization.name,
      guests_count: data.guests.length,
      members_count: data.members.length,
      exported_at: new Date(data.exported_at).toLocaleString(),
    };
    return JSON.stringify(preview, null, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export Organization Data</CardTitle>
        <CardDescription>
          Export all your organization data including guests, settings, and configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!exportData ? (
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Export Preview</Label>
              <div className="bg-gray-50 p-3 rounded-md text-sm font-mono max-h-40 overflow-y-auto">
                <pre>{formatJsonPreview(exportData)}</pre>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={copyExportData} variant="outline" className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
              <Button onClick={downloadExportData} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download File
              </Button>
            </div>
            
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              {isExporting ? 'Exporting...' : 'Export Again'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}