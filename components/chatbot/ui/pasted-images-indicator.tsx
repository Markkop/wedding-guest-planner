import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PastedImagesIndicatorProps {
  imageCount: number;
  onClear: () => void;
}

export function PastedImagesIndicator({ imageCount, onClear }: PastedImagesIndicatorProps) {
  if (imageCount === 0) return null;

  return (
    <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded-md border border-blue-200">
      <span className="text-sm text-blue-700">
        📎 {imageCount} image(s) ready to send
      </span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="h-6 text-blue-600 hover:text-blue-800"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}