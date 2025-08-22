'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Download, Upload } from 'lucide-react';
import { ExportTab } from './import-export/export-tab';
import { ImportTab } from './import-export/import-tab';
import type { Organization } from '@/lib/types';

interface ImportExportContentProps {
  organization: Organization;
  onDataChange?: () => void;
}


export function ImportExportContent({ organization, onDataChange }: ImportExportContentProps) {
  const [activeTab, setActiveTab] = useState('export');


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
        <ExportTab organization={organization} />
      </TabsContent>
      
      <TabsContent value="import" className="space-y-4">
        <ImportTab organization={organization} onDataChange={onDataChange} />
      </TabsContent>
    </Tabs>
  );
}