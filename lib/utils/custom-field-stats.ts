import type { Guest, CustomFieldConfig } from '@/lib/types';

export interface FieldCardStats {
  title: string;
  value: string | number;
  subtitle: string;
}

export function getCustomFieldCardStats(field: CustomFieldConfig, guests: Guest[]): FieldCardStats | null {
  const data = guests.map(g => g.custom_fields?.[field.id]);

  switch (field.cardType) {
    case 'at-least-one': {
      if (field.type !== 'multi-select') return null;
      const count = data.filter(v => Array.isArray(v) && v.length > 0).length;
      return { title: field.label, value: count, subtitle: '' };
    }
    case 'total-count': {
      let total = 0;
      data.forEach(v => {
        if (Array.isArray(v)) total += v.length;
        else if (v !== null && v !== undefined && v !== '') total += 1;
      });
      return { title: field.label, value: total, subtitle: 'total selections' };
    }
    case 'most-popular': {
      const counts: Record<string, number> = {};
      data.forEach(v => {
        if (Array.isArray(v)) v.forEach(x => typeof x === 'string' && (counts[x] = (counts[x] || 0) + 1));
        else if (typeof v === 'string' && v) counts[v] = (counts[v] || 0) + 1;
      });
      const top = Object.entries(counts).reduce(
        (max, [option, count]) => (count > max.count ? { option, count } : max),
        { option: 'None', count: 0 }
      );
      const displayLabel = field.options?.find(o => o.value === top.option)?.label ?? top.option;
      return { title: field.label, value: `${displayLabel} (${top.count})`, subtitle: 'most popular' };
    }
    case 'filled-count': {
      if (field.type !== 'text' && field.type !== 'number') return null;
      const count = data.filter(v => v !== null && v !== undefined && v !== '').length;
      return { title: field.label, value: count, subtitle: 'with values' };
    }
    case 'average': {
      if (field.type !== 'number') return null;
      const nums = data
        .filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))
        .map(v => Number(v));
      if (nums.length === 0) return { title: field.label, value: 'N/A', subtitle: 'average' };
      const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
      return { title: field.label, value: avg.toFixed(1), subtitle: 'average' };
    }
    case 'options-breakdown': {
      const counts: Record<string, number> = {};
      field.options?.forEach(opt => { counts[opt.value] = 0; }); // Use value key (fix)
      data.forEach(v => {
        if (Array.isArray(v)) v.forEach(x => typeof x === 'string' && (counts[x] = (counts[x] || 0) + 1));
        else if (typeof v === 'string' && v) counts[v] = (counts[v] || 0) + 1;
      });
      const parts: string[] = [];
      let total = 0;
      field.options?.forEach(opt => {
        const c = counts[opt.value] || 0;
        total += c;
        parts.push(String(c));
      });
      return { title: field.label, value: parts.join(' / ') + (field.options?.length ? ` (${total})` : ''), subtitle: '' };
    }
    default:
      return null;
  }
}
