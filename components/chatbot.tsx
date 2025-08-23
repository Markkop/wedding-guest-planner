"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
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

// Custom toast function for chatbot with left positioning
const chatbotToast = {
  success: (message: string) => toast.success(message, { position: "bottom-left" }),
  error: (message: string) => toast.error(message, { position: "bottom-left" }),
  info: (message: string) => toast.info(message, { position: "bottom-left" }),
  warning: (message: string) => toast.warning(message, { position: "bottom-left" }),
};

interface ChatbotProps {
  organizationId: string;
}

export function Chatbot({ organizationId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const { messages, sendMessage, status } = useChat({
    id: `chat-${organizationId}`, // Maintain conversation state per organization
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        organizationId,
      },
    }),
    onFinish: (message) => {
      console.log("🔥 onFinish called with message:", message);
      console.log("🔥 onFinish message.message:", message.message);
      console.log("🔥 onFinish message.message.parts:", message.message.parts);
      
      // Check if any tools were called (indicates data changes)
      const hasDataChanges = message.message.parts?.some((part) => 
        part.type.startsWith("tool-")
      ) || false;
      
      console.log("🔥 hasDataChanges:", hasDataChanges);
      
      // Show success message when data changed (real-time updates handle the rest)
      if (hasDataChanges) {
        chatbotToast.success("Guest list updated");
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      console.log("🚨 Full error object:", error);
      console.log("🚨 Messages state at error:", messages);
      chatbotToast.error("Failed to send message");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status !== "ready") return;

    // If there are pasted images, combine them with the text message
    if (pastedImages.length > 0) {
      // Format images without brackets to match backend regex pattern
      const imageContext = pastedImages.join(' ');
      
      sendMessage({
        text: `${inputValue} ${imageContext}`,
      });
      
      // Clear pasted images after sending
      setPastedImages([]);
      chatbotToast.success(`Message sent with ${pastedImages.length} image(s)`);
    } else {
      sendMessage({ text: inputValue });
    }
    
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Prevent default paste behavior for images
        
        const file = item.getAsFile();
        if (!file) continue;

        try {
          // Check file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            chatbotToast.error("Image too large. Please use an image smaller than 5MB.");
            continue;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const imageData = e.target?.result as string;
            
            // Additional check on base64 data size
            if (imageData.length > 7 * 1024 * 1024) { // ~5MB base64 encoded
              chatbotToast.error("Image data too large after encoding.");
              return;
            }
            
            setPastedImages(prev => [...prev, imageData]);
            console.log(`Image pasted, size: ${file.size} bytes, encoded length: ${imageData.length}`);
          };
          
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
            chatbotToast.error("Failed to read image file");
          };
          
          reader.readAsDataURL(file);
          
          chatbotToast.success(`Image pasted! Type a message to send it.`);
        } catch (error) {
          console.error("Failed to process pasted image:", error);
          chatbotToast.error("Failed to process pasted image");
        }
      }
    }
  };

  useEffect(() => {
    console.log("🚀 Messages updated:", messages);
    console.log("🚀 Messages length:", messages.length);
    messages.forEach((msg, i) => {
      console.log(`🚀 Message ${i}:`, {
        role: msg.role,
        // content: msg.content, // content property doesn't exist on UIMessage
        parts: msg.parts,
        id: msg.id
      });
    });
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log("🏢 Organization ID changed:", organizationId);
    console.log("🏢 Current messages when org changed:", messages.length);
  }, [organizationId, messages.length]);

  // Clear pasted images when component unmounts or org changes
  useEffect(() => {
    return () => {
      setPastedImages([]);
    };
  }, [organizationId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      chatbotToast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    try {
      console.log("🎤 Starting audio transcription");
      chatbotToast.info("Transcribing audio...");
      
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Audio = e.target?.result as string;
        
        try {
          // Make a direct API call to transcribe the audio first
          const transcriptionResponse = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Audio,
              organizationId
            })
          });
          
          if (!transcriptionResponse.ok) {
            throw new Error('Transcription failed');
          }
          
          const { transcription } = await transcriptionResponse.json();
          console.log("🎤 Audio transcribed:", transcription);
          
          // Now send the transcribed text as a normal message
          sendMessage({
            text: transcription,
          });
          
          chatbotToast.success("Audio transcribed successfully");
        } catch (error) {
          console.error("Failed to transcribe audio:", error);
          chatbotToast.error("Failed to transcribe audio");
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Failed to process audio:", error);
      chatbotToast.error("Failed to process audio");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    let addedCount = 0;

    await Promise.all(
      files.map(
        (file) =>
          new Promise<void>((resolve) => {
            if (!file.type.startsWith("image/")) {
              chatbotToast.error("Please upload image files only");
              return resolve();
            }

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
              chatbotToast.error("Image too large. Please use an image smaller than 5MB.");
              return resolve();
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              const imageData = e.target?.result as string;

              // Additional check on base64 data size (~5MB base64 encoded)
              if (imageData.length > 7 * 1024 * 1024) {
                chatbotToast.error("Image data too large after encoding.");
                return resolve();
              }

              console.log(
                `Image selected, size: ${file.size} bytes, encoded length: ${imageData.length}`
              );
              setPastedImages((prev) => {
                addedCount += 1;
                return [...prev, imageData];
              });
              resolve();
            };

            reader.onerror = (error) => {
              console.error("FileReader error:", error);
              chatbotToast.error("Failed to read image file");
              resolve();
            };

            reader.readAsDataURL(file);
          })
      )
    );

    // Clear the file input so the same file can be selected again
    event.target.value = "";

    if (addedCount > 0) {
      chatbotToast.success(
        `${addedCount} image${addedCount > 1 ? "s" : ""} added! Type a message to send.`
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all",
          "hover:scale-110 hover:shadow-xl",
          isOpen && "scale-0"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      <Card
        className={cn(
          "fixed bottom-4 right-4 z-50 w-96 transition-all duration-300",
          "shadow-xl border-2",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">Guest Assistant</h3>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="h-96 p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              <Bot className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">
                Hi! I can help you manage your guest list.
              </p>
              <p className="text-xs mt-2">Try:</p>
              <ul className="text-xs mt-1 space-y-1">
                <li>&quot;Add John Doe and Jane Smith&quot;</li>
                <li>&quot;Upload or paste images with guest info&quot;</li>
                <li>&quot;Record audio with guest details&quot;</li>
              </ul>
            </div>
          )}

          {messages.map((message, index) => {
            console.log(`💬 Rendering message ${index}:`, message);
            const isFromAssistant = message.role !== "user";
            
            // Check for tool calls in the message
            const toolParts = message.parts?.filter((part) => 
              part.type.startsWith("tool-") && part.type !== "tool-result"
            ) || [];
            
            const textContent = (() => {
              // Handle message parts
              if (message.parts) {
                const textParts = message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => (part as { text: string }).text)
                  .join("");
                console.log(`💬 Message ${index} text from parts:`, textParts);
                return textParts;
              }
              console.log(`💬 Message ${index} no parts found`);
              return "";
            })();
            
            // Extract images from message content
            const imageMatches = textContent.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g);
            const images = imageMatches || [];
            
            // Clean text content by removing image data URLs
            let cleanTextContent = textContent.replace(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g, '').trim();
            
            // For assistant messages, also clean up image analysis markers
            if (message.role === "assistant") {
              cleanTextContent = cleanTextContent.replace(/\[Image analyzed: ([^\]]+)\]/g, '📷 $1');
              cleanTextContent = cleanTextContent.replace(/\[Image could not be processed\]/g, '❌ Could not process image');
            }
            
            // Generate tool action descriptions if no text but has tool calls
            let toolActionDescription = "";
            if (isFromAssistant && !cleanTextContent && toolParts.length > 0) {
              const toolCallParts = toolParts.filter((part) => part.type.startsWith("tool-"));
              
              if (toolCallParts.length > 0) {
                const toolActions = toolCallParts.map((part) => {
                  // Extract tool name from type (e.g., "tool-createGuest" -> "createGuest")
                  const toolName = part.type.replace("tool-", "");
                  const args = (part as { input?: Record<string, unknown> }).input || {};
                  
                  // Generate user-friendly descriptions based on tool name
                  switch (toolName) {
                    case "createGuest":
                      return `➕ Adding ${(args as { name?: string }).name || "guest"}`;
                    case "createMultipleGuests":
                      return `➕ Adding ${Array.isArray((args as { guests?: unknown[] }).guests) ? (args as { guests: unknown[] }).guests.length : "multiple"} guests`;
                    case "updateGuest":
                      return `✏️ Updating guest`;
                    case "deleteGuest":
                      return `🗑️ Removing guest`;
                    case "bulkUpdateGuests":
                      return `✏️ Updating ${Array.isArray((args as { guestIds?: unknown[] }).guestIds) ? (args as { guestIds: unknown[] }).guestIds.length : "multiple"} guests`;
                    case "bulkUpdateGuestsIndividually":
                      return `✏️ Applying individual updates to ${Array.isArray((args as { updates?: unknown[] }).updates) ? (args as { updates: unknown[] }).updates.length : "multiple"} guests`;
                    case "bulkDeleteGuests":
                      return `🗑️ Removing ${Array.isArray((args as { guestIds?: unknown[] }).guestIds) ? (args as { guestIds: unknown[] }).guestIds.length : "multiple"} guests`;
                    case "getGuests":
                      return `📋 Fetching guest list`;
                    case "findGuest":
                      return `🔍 Searching for ${(args as { name?: string }).name || "guest"}`;
                    case "getOrganizationInfo":
                      return `ℹ️ Getting organization details`;
                    default:
                      return `⚙️ Processing ${toolName || "action"}`;
                  }
                }).join("\n");
                
                toolActionDescription = toolActions;
              }
            }
            
            // Skip rendering if no clean text, no images, and no tool actions
            if (!cleanTextContent && images.length === 0 && !toolActionDescription) {
              console.log(`💬 Skipping empty message ${index}`);
              return null;
            }
            
            // Build array of message bubble nodes
            const bubbles: React.ReactNode[] = [];

            const addBubble = (content: React.ReactNode, key: string) => {
              bubbles.push(
                <div
                  key={key}
                  className={cn(
                    "mb-1 flex gap-2",
                    isFromAssistant ? "justify-start" : "justify-end"
                  )}
                >
                  {isFromAssistant && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  {content}
                  {!isFromAssistant && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              );
            };

            // Main text bubble
            if (cleanTextContent || images.length > 0) {
              addBubble(
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%]",
                    isFromAssistant
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {cleanTextContent && (
                    <div 
                      className="text-sm prose prose-sm max-w-none mb-1 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-base [&>h1]:font-semibold [&>h2]:text-sm [&>h2]:font-semibold [&>h3]:text-sm [&>h3]:font-medium [&>code]:text-xs [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:text-xs [&>pre]:overflow-x-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: isFromAssistant ? marked.parse(cleanTextContent) : cleanTextContent 
                      }}
                    />
                  )}
                  {images.length > 0 && (
                    <div className={cn(
                      "grid gap-2",
                      images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>{/* image rendering kept unchanged */}
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
                              {/* Click to expand hint */}
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
                </div>,
                `${message.id}-main`
              );
            }

            // Tool bubbles
            if (isFromAssistant) {
              toolParts.forEach((part, toolIdx) => {
                const toolName = part.type.replace("tool-", "");
                const args = (part as { input?: Record<string, unknown> }).input || {};
                let description = `⚙️ Processing ${toolName}`;
                switch (toolName) {
                  case "createGuest":
                    description = `➕ Adding ${(args as { name?: string }).name || "guest"}`;
                    break;
                  case "createMultipleGuests":
                    description = `➕ Adding ${Array.isArray((args as { guests?: unknown[] }).guests) ? (args as { guests: unknown[] }).guests.length : "multiple"} guests`;
                    break;
                  case "updateGuest":
                    description = "✏️ Updating guest";
                    break;
                  case "deleteGuest":
                    description = "🗑️ Removing guest";
                    break;
                  case "bulkUpdateGuests":
                    description = `✏️ Updating ${Array.isArray((args as { guestIds?: unknown[] }).guestIds) ? (args as { guestIds: unknown[] }).guestIds.length : "multiple"} guests`;
                    break;
                  case "bulkDeleteGuests":
                    description = `🗑️ Removing ${Array.isArray((args as { guestIds?: unknown[] }).guestIds) ? (args as { guestIds: unknown[] }).guestIds.length : "multiple"} guests`;
                    break;
                  case "getGuests":
                    description = "📋 Fetching guest list";
                    break;
                  case "findGuest":
                    description = `🔍 Searching for ${(args as { name?: string }).name || "guest"}`;
                    break;
                  case "getOrganizationInfo":
                    description = "ℹ️ Getting organization details";
                    break;
                }
                addBubble(
                  <div className="rounded-lg px-3 py-2 bg-blue-50 text-blue-800 border border-blue-200 max-w-[80%]">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-3 w-3 opacity-70" />{description}
                    </p>
                  </div>,
                  `${message.id}-tool-${toolIdx}`
                );
              });
            }

            // Wrap bubbles with spacing between messages
            return (
              <div key={message.id || `message-${index}`} className="mb-4 space-y-1">
                {bubbles}
              </div>
            );
          })}

          {status !== "ready" && (
            <div className="flex gap-2 items-center text-muted-foreground">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-sm">Processing your request...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          {/* Pasted Images Indicator */}
          {pastedImages.length > 0 && (
            <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded-md border border-blue-200">
              <span className="text-sm text-blue-700">
                📎 {pastedImages.length} image(s) ready to send
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPastedImages([]);
                  chatbotToast.info("Pasted images cleared");
                }}
                className="h-6 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onPaste={handlePaste}
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
              onChange={handleImageUpload}
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
              onClick={isRecording ? stopRecording : startRecording}
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
                (pastedImages.length > 0 && !inputValue.trim()) // Require text when images are pasted
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
      </Card>
    </>
  );
}

