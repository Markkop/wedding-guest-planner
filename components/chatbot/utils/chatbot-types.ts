export interface ChatbotProps {
  organizationId: string;
}

export interface AudioRecordingState {
  isRecording: boolean;
  recordingTime: number;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  recordingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export interface ImageState {
  pastedImages: string[];
  setPastedImages: React.Dispatch<React.SetStateAction<string[]>>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
}