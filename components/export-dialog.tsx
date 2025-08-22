'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import { ImportExportContent } from '@/components/import-export-content';
import type { Organization } from '@/lib/types';

interface ExportDialogProps {
  organization: Organization;
  onDataChange?: () => void;
}

export function ExportDialog({ organization, onDataChange }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import/Export Organization Data</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <ImportExportContent 
            organization={organization} 
            onDataChange={onDataChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}