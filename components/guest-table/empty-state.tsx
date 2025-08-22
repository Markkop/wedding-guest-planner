interface EmptyStateProps {
  columnCount: number;
}

export function EmptyState({ columnCount }: EmptyStateProps) {
  return (
    <tr>
      <td 
        colSpan={columnCount}
        className="text-center py-8 text-muted-foreground"
      >
        No guests added yet. Add your first guest below.
      </td>
    </tr>
  );
}