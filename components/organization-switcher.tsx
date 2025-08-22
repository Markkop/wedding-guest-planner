'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/lib/types';

interface OrganizationSwitcherProps {
  currentOrganization: Organization;
  onOrganizationChange: (organization: Organization) => void;
  onCreateNew?: () => void;
}

export function OrganizationSwitcher({ 
  currentOrganization, 
  onOrganizationChange,
  onCreateNew 
}: OrganizationSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org: Organization) => {
    onOrganizationChange(org);
    toast.success(`Switched to ${org.name}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              <span className="hidden sm:inline">{currentOrganization.name}</span>
              <span className="sm:hidden">
                {currentOrganization.name.length > 12 
                  ? `${currentOrganization.name.slice(0, 12)}...` 
                  : currentOrganization.name
                }
              </span>
            </span>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {currentOrganization.role}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <div className="px-2 py-1.5 text-sm font-semibold">
          Organizations
        </div>
        <DropdownMenuSeparator />
        
        {loading ? (
          <DropdownMenuItem disabled>
            Loading organizations...
          </DropdownMenuItem>
        ) : (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrganization(org)}
              className={`flex items-center justify-between ${
                org.id === currentOrganization.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{org.name}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {org.role}
              </Badge>
            </DropdownMenuItem>
          ))
        )}
        
        {onCreateNew && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Organization
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}