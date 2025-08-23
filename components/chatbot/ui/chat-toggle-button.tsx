import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatToggleButton({ isOpen, onClick }: ChatToggleButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all",
        "hover:scale-110 hover:shadow-xl",
        isOpen && "scale-0"
      )}
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}