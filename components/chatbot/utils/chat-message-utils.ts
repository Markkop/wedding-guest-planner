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

export const generateToolActionDescription = (toolParts: Array<{ type: string; input?: unknown }>): string => {
  const toolActions = toolParts.map((part) => {
    const toolName = part.type.replace("tool-", "");
    const args = part.input || {};
    
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
  
  return toolActions;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};