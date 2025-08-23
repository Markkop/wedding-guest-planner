export const extractImagesFromMessage = (textContent: string): string[] => {
  const imageMatches = textContent.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g);
  return imageMatches || [];
};

export const cleanTextContent = (textContent: string, role: "user" | "assistant"): string => {
  // Clean text content by removing image data URLs
  let cleanText = textContent.replace(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g, '').trim();
  
  // For assistant messages, also clean up image analysis markers
  if (role === "assistant") {
    cleanText = cleanText.replace(/\[Image analyzed: ([^\]]+)\]/g, '📷 $1');
    cleanText = cleanText.replace(/\[Image could not be processed\]/g, '❌ Could not process image');
  }
  
  return cleanText;
};

export const generateToolActionDescription = (
  toolParts: Array<{ type: string; input?: unknown; output?: Record<string, unknown> }>
): string => {
  const toolActions = toolParts.map((part) => {
    const toolName = part.type.replace("tool-", "");
    const args = part.input || {};
    const result = part.output || {};
    
    switch (toolName) {
      case "createGuest":
        return `➕ Adding ${(args as { name?: string }).name || "guest"}`;
      case "updateGuest":
        const guestName = result.guestName as string || "guest";
        const updatedFields = result.updatedFields as string[] || [];
        const fieldsText = updatedFields.length > 0 
          ? ` (${updatedFields.join(", ")})` 
          : "";
        return `✏️ Updating ${guestName}${fieldsText}`;
      case "deleteGuest":
        const deletedGuestName = result.guestName as string || "guest";
        return `🗑️ Removing ${deletedGuestName}`;
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
  
  return toolActions;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};