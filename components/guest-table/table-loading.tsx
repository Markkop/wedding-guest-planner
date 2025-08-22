import { TableRowSkeleton } from '@/components/ui/loading-spinner';

interface TableLoadingProps {
  columnCount: number;
}

export function TableLoading({ columnCount }: TableLoadingProps) {
  return (
    <>
      <TableRowSkeleton columns={columnCount} />
      <TableRowSkeleton columns={columnCount} />
      <TableRowSkeleton columns={columnCount} />
    </>
  );
}