import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5" />
        <h3 className="font-semibold">Guest Assistant</h3>
      </div>
      <Button
        onClick={onClose}
        size="icon"
        variant="ghost"
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}