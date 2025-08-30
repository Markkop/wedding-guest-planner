import type { Organization, VisibleColumns, CustomFieldConfig } from '@/lib/types';

export type ColumnKey =
  | 'index'
  | 'name'
  | 'categories'
  | 'age'
  | 'food'
  | 'status'
  | 'actions'
  | `custom:${string}`;

export const COLUMN_HEAD_CLASSES: Record<string, string> = {
  index: 'w-12 pl-4',
  name: 'sticky left-0 bg-white z-10 border-r md:static md:bg-transparent md:border-r-0 w-auto md:min-w-[200px]',
  categories: 'w-40',
  age: 'w-24',
  food: 'w-32',
  status: 'w-32',
  actions: 'w-32',
  custom: 'w-32',
};

function separateAndSort(customFields: CustomFieldConfig[]) {
  const withOrder = customFields.filter(f => f.displayOrder !== undefined)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const withoutOrder = customFields.filter(f => f.displayOrder === undefined);
  return { withOrder, withoutOrder };
}

export function useColumnOrder(organization: Organization, visible: VisibleColumns): {
  keys: ColumnKey[];
  customFieldMap: Record<string, CustomFieldConfig>;
} {
  const config = organization.configuration || {};
  const customFields = config.customFields || [];

  const customFieldMap: Record<string, CustomFieldConfig> = {};
  customFields.forEach(f => { customFieldMap[f.id] = f; });

  const standard: ColumnKey[] = [
    'index',
    'name',
    ...(visible.categories ? ['categories'] as const : []),
    ...(visible.age && config.ageGroups?.enabled ? ['age'] as const : []),
    ...(visible.food && config.foodPreferences?.enabled ? ['food'] as const : []),
    ...(visible.confirmations && config.confirmationStages?.enabled ? ['status'] as const : []),
  ];

  const { withOrder, withoutOrder } = separateAndSort(customFields);

  const keys: ColumnKey[] = [...standard];
  withOrder.forEach(field => {
    const pos = Math.min(field.displayOrder ?? keys.length, keys.length);
    keys.splice(pos, 0, `custom:${field.id}`);
  });

  withoutOrder.forEach(field => keys.push(`custom:${field.id}`));
  keys.push('actions');

  return { keys, customFieldMap };
}
