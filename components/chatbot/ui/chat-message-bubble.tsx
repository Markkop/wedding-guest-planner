import { marked } from "marked";
import { Bot, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Configure marked.js for safe HTML rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface MessageBubbleProps {
  content: string;
  images: string[];
  isFromAssistant: boolean;
  messageId?: string;
}

export function ChatMessageBubble({ content, images, isFromAssistant }: MessageBubbleProps) {
  if (!content && images.length === 0) return null;

  return (
    <div className={cn(
      "mb-1 flex gap-2",
      isFromAssistant ? "justify-start" : "justify-end"
    )}>
      {isFromAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
      )}
      
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[80%]",
          isFromAssistant
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {content && (
          <div 
            className="text-sm prose prose-sm max-w-none mb-1 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-base [&>h1]:font-semibold [&>h2]:text-sm [&>h2]:font-semibold [&>h3]:text-sm [&>h3]:font-medium [&>code]:text-xs [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:text-xs [&>pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ 
              __html: isFromAssistant ? marked.parse(content) : content 
            }}
          />
        )}
        
        {images.length > 0 && (
          <div className={cn(
            "grid gap-2",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}>
            {images.map((imageData, imgIndex) => (
              <Dialog key={imgIndex}>
                <DialogTrigger asChild>
                  <div className="relative group cursor-pointer">
                    <Image
                      src={imageData}
                      alt={`Uploaded image ${imgIndex + 1}`}
                      width={96}
                      height={96}
                      className={cn(
                        "w-24 h-24 rounded border-2 object-cover transition-all",
                        "hover:scale-105 hover:shadow-lg",
                        !isFromAssistant 
                          ? "border-primary/20 hover:border-primary/40" 
                          : "border-muted-foreground/20 hover:border-muted-foreground/40"
                      )}
                    />
                    <div className={cn(
                      "absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-medium transition-opacity",
                      "opacity-0 group-hover:opacity-100",
                      !isFromAssistant 
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground text-white"
                    )}>
                      {imgIndex + 1}
                    </div>
                    <div className={cn(
                      "absolute inset-0 rounded border-2 border-transparent",
                      "bg-black/0 group-hover:bg-black/10 transition-all",
                      "flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100"
                    )}>
                      <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
                        Click to expand
                      </span>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] p-4">
                  <DialogTitle className="sr-only">
                    Image {imgIndex + 1} - Full Size View
                  </DialogTitle>
                  <div className="flex items-center justify-center">
                    <Image
                      src={imageData}
                      alt={`Full size image ${imgIndex + 1}`}
                      width={800}
                      height={800}
                      className="max-w-full max-h-[80vh] object-contain rounded"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>

      {!isFromAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

interface ToolBubbleProps {
  description: string;
  messageId?: string;
  toolIndex: number;
}

export function ChatToolBubble({ description }: ToolBubbleProps) {
  return (
    <div className="mb-1 flex gap-2 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-lg px-3 py-2 bg-blue-50 text-blue-800 border border-blue-200 max-w-[80%]">
        <p className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-3 w-3 opacity-70" />{description}
        </p>
      </div>
    </div>
  );
}