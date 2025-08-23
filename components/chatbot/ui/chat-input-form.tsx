import { Send, Mic, MicOff, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PastedImagesIndicator } from "./pasted-images-indicator";
import { formatTime } from "../utils/chat-message-utils";

interface ChatInputFormProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: string;
  pastedImages: string[];
  onClearImages: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function ChatInputForm({
  inputValue,
  onInputChange,
  onPaste,
  onSubmit,
  status,
  pastedImages,
  onClearImages,
  fileInputRef,
  onImageUpload,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
}: ChatInputFormProps) {
  return (
    <form onSubmit={onSubmit} className="border-t p-4">
      <PastedImagesIndicator
        imageCount={pastedImages.length}
        onClear={onClearImages}
      />
      
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={onInputChange}
          onPaste={onPaste}
          placeholder={pastedImages.length > 0 ? `Type a message to send with ${pastedImages.length} image(s)...` : "Type a message..."}
          disabled={status !== "ready" || isRecording}
          className={cn(
            "flex-1",
            pastedImages.length > 0 && "border-blue-300 bg-blue-50/50"
          )}
        />

        {/* File Input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onImageUpload}
          className="hidden"
        />

        {/* Image Upload Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={status !== "ready" || isRecording}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        {/* Audio Recording Button */}
        <Button
          type="button"
          size="icon"
          variant={isRecording ? "destructive" : "outline"}
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={status !== "ready"}
        >
          {isRecording ? (
            <>
              <MicOff className="h-4 w-4" />
              <span className="absolute -top-2 -right-2 text-xs bg-destructive text-destructive-foreground rounded-full px-1">
                {formatTime(recordingTime)}
              </span>
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={
            status !== "ready" ||
            !inputValue ||
            !inputValue.trim() ||
            isRecording ||
            (pastedImages.length > 0 && !inputValue.trim())
          }
        >
          {status !== "ready" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}