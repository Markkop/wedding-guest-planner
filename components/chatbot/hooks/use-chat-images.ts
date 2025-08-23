import { useState, useRef, useEffect } from "react";
import { chatbotToast } from "../utils/chatbot-toast";

export function useChatImages(organizationId: string) {
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear pasted images when component unmounts or org changes
  useEffect(() => {
    return () => {
      setPastedImages([]);
    };
  }, [organizationId]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        try {
          if (file.size > 5 * 1024 * 1024) {
            chatbotToast.error("Image too large. Please use an image smaller than 5MB.");
            continue;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const imageData = e.target?.result as string;
            
            if (imageData.length > 7 * 1024 * 1024) {
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

            if (file.size > 5 * 1024 * 1024) {
              chatbotToast.error("Image too large. Please use an image smaller than 5MB.");
              return resolve();
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              const imageData = e.target?.result as string;

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

  const clearPastedImages = () => {
    setPastedImages([]);
    chatbotToast.info("Pasted images cleared");
  };

  return {
    pastedImages,
    setPastedImages,
    fileInputRef,
    handlePaste,
    handleImageUpload,
    clearPastedImages,
  };
}