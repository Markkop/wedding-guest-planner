import { toast } from "sonner";

export const chatbotToast = {
  success: (message: string) => toast.success(message, { position: "bottom-left" }),
  error: (message: string) => toast.error(message, { position: "bottom-left" }),
  info: (message: string) => toast.info(message, { position: "bottom-left" }),
  warning: (message: string) => toast.warning(message, { position: "bottom-left" }),
};