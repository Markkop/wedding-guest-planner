import { useRef, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UIMessage } from "@ai-sdk/react";
import { ChatMessageBubble, ChatToolBubble } from "./chat-message-bubble";
import { 
  extractImagesFromMessage, 
  cleanTextContent, 
  generateToolActionDescription 
} from "../utils/chat-message-utils";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("🚀 Messages updated:", messages);
    console.log("🚀 Messages length:", messages.length);
    messages.forEach((msg, i) => {
      console.log(`🚀 Message ${i}:`, {
        role: msg.role,
        parts: msg.parts,
        id: msg.id
      });
    });
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
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
        const images = extractImagesFromMessage(textContent);
        
        // Clean text content by removing image data URLs
        const cleanText = cleanTextContent(textContent, message.role as "user" | "assistant");
        
        // Generate tool action descriptions if no text but has tool calls
        let toolActionDescription = "";
        if (isFromAssistant && !cleanText && toolParts.length > 0) {
          const simplifiedToolParts = toolParts.map(part => ({
            type: part.type,
            input: (part as { input?: unknown }).input,
            output: (part as { output?: Record<string, unknown> }).output
          }));
          
          toolActionDescription = generateToolActionDescription(simplifiedToolParts);
        }
        
        // Skip rendering if no clean text, no images, and no tool actions
        if (!cleanText && images.length === 0 && !toolActionDescription) {
          console.log(`💬 Skipping empty message ${index}`);
          return null;
        }
        
        // Build array of message bubble nodes
        const bubbles: React.ReactNode[] = [];

        // Main text bubble
        if (cleanText || images.length > 0) {
          bubbles.push(
            <ChatMessageBubble
              key={`${message.id}-main`}
              content={cleanText}
              images={images}
              isFromAssistant={isFromAssistant}
              messageId={message.id}
            />
          );
        }

        // Tool bubbles
        if (isFromAssistant) {
          toolParts.forEach((part, toolIdx) => {
            const toolName = part.type.replace("tool-", "");
            const args = (part as { input?: unknown }).input as Record<string, unknown> || {};
            let description = `⚙️ Processing ${toolName}`;
            
            // Look for the corresponding tool result (the same tool part contains both input and output)
            const toolPart = part as { output?: Record<string, unknown>; input?: unknown };
            const result = toolPart.output as Record<string, unknown> || {};
            
            switch (toolName) {
              case "createGuest":
                description = `➕ Adding ${(args as { name?: string }).name || "guest"}`;
                break;
              case "updateGuest":
                const guestName = result.guestName as string || "guest";
                const updatedFields = result.updatedFields as string[] || [];
                const fieldsText = updatedFields.length > 0 
                  ? ` (${updatedFields.join(", ")})` 
                  : "";
                description = `✏️ Updating ${guestName}${fieldsText}`;
                break;
              case "deleteGuest":
                const deletedGuestName = result.guestName as string || "guest";
                description = `🗑️ Removing ${deletedGuestName}`;
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
            
            bubbles.push(
              <ChatToolBubble
                key={`${message.id}-tool-${toolIdx}`}
                description={description}
                messageId={message.id}
                toolIndex={toolIdx}
              />
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
  );
}