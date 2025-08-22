'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';

interface ImportExportContentProps {
  organization: Organization;
  onDataChange?: () => void;
}

interface ExportData {
  version: string;
  exported_at: string;
  organization: {
    name: string;
    event_type: string;
    configuration: Record<string, unknown>;
    created_at: string;
  };
  guests: Array<{
    name: string;
    categories: string[];
    age_group?: string;
    food_preference?: string;
    confirmation_stage: string;
    custom_fields: Record<string, unknown>;
    display_order: number;
  }>;
  members: Array<{
    email: string;
    name?: string;
    role: string;
    joined_at: string;
  }>;
  invite_code: string;
}

export function ImportExportContent({ organization, onDataChange }: ImportExportContentProps) {
  const [activeTab, setActiveTab] = useState('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');

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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="export">
          <Download className="mr-2 h-4 w-4" />
          Export
        </TabsTrigger>
        <TabsTrigger value="import">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="export" className="space-y-4">
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
      </TabsContent>
      
      <TabsContent value="import" className="space-y-4">
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
      </TabsContent>
    </Tabs>
  );
}