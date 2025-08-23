"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatbotProps {
  organizationId: string;
  onGuestsUpdate?: () => void;
}

export function Chatbot({ organizationId, onGuestsUpdate }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState("");
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
      
      // Only trigger refresh if data actually changed
      if (hasDataChanges) {
        onGuestsUpdate?.();
        toast.success("Guest list updated");
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      console.log("🚨 Full error object:", error);
      console.log("🚨 Messages state at error:", messages);
      toast.error("Failed to send message");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status !== "ready") return;

    sendMessage({ text: inputValue });
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
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
      toast.error("Failed to access microphone");
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
      toast.info("Transcribing audio...");
      
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
          
          toast.success("Audio transcribed successfully");
        } catch (error) {
          console.error("Failed to transcribe audio:", error);
          toast.error("Failed to transcribe audio");
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Failed to process audio:", error);
      toast.error("Failed to process audio");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;

      // Send message with image context
      sendMessage({
        text: `I've uploaded an image with guest information. Please extract all the names and any other relevant details like categories, food preferences, or confirmation status from this image: ${imageData}`,
      });
    };

    reader.readAsDataURL(file);
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
                <li>&quot;Upload a screenshot of names&quot;</li>
                <li>&quot;Record audio with guest details&quot;</li>
              </ul>
            </div>
          )}

          {messages.map((message, index) => {
            console.log(`💬 Rendering message ${index}:`, message);
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
            
            // Skip rendering empty messages
            if (!textContent.trim()) {
              console.log(`💬 Skipping empty message ${index}`);
              return null;
            }
            
            return (
              <div
                key={message.id || `message-${index}`}
                className={cn(
                  "mb-4 flex gap-2",
                  message.role === "assistant" ? "justify-start" : "justify-end"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%]",
                    message.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {textContent}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
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
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type a message..."
              disabled={status !== "ready" || isRecording}
              className="flex-1"
            />

            {/* File Input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
                isRecording
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

