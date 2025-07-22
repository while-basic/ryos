import { useState, useRef, useCallback } from "react";
import { getSupportedMimeType, base64FromBlob } from "../utils/audio";

interface UseAudioRecorderProps {
  onRecordingComplete: (base64Data: string) => void;
  selectedDeviceId: string;
  setRecordingState: (isRecording: boolean) => void;
}

export const useAudioRecorder = ({
  onRecordingComplete,
  selectedDeviceId,
  setRecordingState,
}: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not available. Please ensure you are using HTTPS and a supported browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
            }
          : true, // Fix constraint logic
      });

      setMicPermissionGranted(true);
      const mimeType = getSupportedMimeType();
      
      // Check if MediaRecorder is available
      if (typeof MediaRecorder === 'undefined') {
        throw new Error("MediaRecorder API not available in this browser.");
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      // Reset chunks when starting new recording
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64Data = await base64FromBlob(blob);
        onRecordingComplete(base64Data);
        // Cleanup media stream
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null; // Clear media recorder reference
        setIsRecording(false);
        setRecordingState(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingState(true);
      mediaRecorder.start(200);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMicPermissionGranted(false);
      setIsRecording(false);
      setRecordingState(false);
    }
  }, [selectedDeviceId, onRecordingComplete, setRecordingState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    micPermissionGranted,
    startRecording,
    stopRecording,
  };
};
