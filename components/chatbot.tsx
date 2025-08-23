"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Import refactored components and hooks
import { ChatToggleButton } from "./chatbot/ui/chat-toggle-button";
import { ChatHeader } from "./chatbot/ui/chat-header";
import { ChatMessages } from "./chatbot/ui/chat-messages";
import { ChatInputForm } from "./chatbot/ui/chat-input-form";
import { useChatAudio } from "./chatbot/hooks/use-chat-audio";
import { useChatImages } from "./chatbot/hooks/use-chat-images";
import { chatbotToast } from "./chatbot/utils/chatbot-toast";
import type { ChatbotProps } from "./chatbot/utils/chatbot-types";

export function Chatbot({ organizationId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Use custom hooks for audio and image handling
  const {
    pastedImages,
    setPastedImages,
    fileInputRef,
    handlePaste,
    handleImageUpload,
    clearPastedImages,
  } = useChatImages(organizationId);
  const { messages, sendMessage, status } = useChat({
    id: `chat-${organizationId}`,
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
      
      const hasDataChanges = message.message.parts?.some((part) => 
        part.type.startsWith("tool-")
      ) || false;
      
      console.log("🔥 hasDataChanges:", hasDataChanges);
      
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

  // Use audio hook
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
  } = useChatAudio(organizationId, sendMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status !== "ready") return;

    if (pastedImages.length > 0) {
      const imageContext = pastedImages.join(' ');
      
      sendMessage({
        text: `${inputValue} ${imageContext}`,
      });
      
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


  useEffect(() => {
    console.log("🏢 Organization ID changed:", organizationId);
    console.log("🏢 Current messages when org changed:", messages.length);
  }, [organizationId, messages.length]);


  return (
    <>
      <ChatToggleButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />

      <Card
        className={cn(
          "fixed bottom-4 right-4 z-50 w-96 transition-all duration-300",
          "shadow-xl border-2",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <ChatHeader onClose={() => setIsOpen(false)} />
        
        <ChatMessages messages={messages} status={status} />
        
        <ChatInputForm
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onPaste={handlePaste}
          onSubmit={handleSubmit}
          status={status}
          pastedImages={pastedImages}
          onClearImages={clearPastedImages}
          fileInputRef={fileInputRef}
          onImageUpload={handleImageUpload}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      </Card>
    </>
  );
}

