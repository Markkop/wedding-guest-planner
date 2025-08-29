import type { VisibleColumns, Organization } from '@/lib/types';

export function useColumnCount(visibleColumns: VisibleColumns, organization: Organization): number {
  let count = 3; // base columns (drag, #, name)
  
  if (visibleColumns.categories) count++;
  if (visibleColumns.age && organization.configuration?.ageGroups?.enabled) count++;
  if (visibleColumns.food && organization.configuration?.foodPreferences?.enabled) count++;
  if (visibleColumns.confirmations && organization.configuration?.confirmationStages?.enabled) count++;
  
  // Add custom fields
  const customFieldCount = organization.configuration?.customFields?.length || 0;
  count += customFieldCount;
  
  count++; // actions column
  
  return count;
}