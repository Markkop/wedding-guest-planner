import { useState, useRef } from "react";
import { chatbotToast } from "../utils/chatbot-toast";

export function useChatAudio(
  organizationId: string,
  sendMessage: (message: { text: string }) => void
) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Audio = e.target?.result as string;
        
        try {
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

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
  };
}