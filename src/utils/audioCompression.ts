/**
 * Audio compression utilities to reduce storage usage
 */

/**
 * Compress audio data by reducing quality if it's too large
 * @param base64Data The original base64 audio data
 * @param maxSizeKB Maximum size in KB before compression
 * @returns Compressed base64 data or original if compression fails
 */
export const compressAudioIfNeeded = async (
  base64Data: string,
  maxSizeKB: number = 512
): Promise<string> => {
  try {
    const dataSize = base64Data.length * 0.75; // Approximate size in bytes
    const sizeKB = dataSize / 1024;
    
    if (sizeKB <= maxSizeKB) {
      return base64Data; // No compression needed
    }

    console.log(`[AudioCompression] Audio is ${Math.round(sizeKB)}KB, attempting compression...`);

    // Convert base64 to blob
    const binaryString = atob(base64Data.split(',')[1] || base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'audio/wav' });
    
    // Create audio context for compression
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Create source and compressor
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Add compression to reduce dynamic range
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // Connect nodes
    source.connect(compressor);
    compressor.connect(offlineContext.destination);
    
    // Start rendering
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert back to base64 with reduced quality
    const compressedBlob = await audioBufferToBlob(renderedBuffer, 0.5); // 50% quality
    const compressedBase64 = await blobToBase64(compressedBlob);
    
    const compressedSize = compressedBase64.length * 0.75 / 1024;
    console.log(`[AudioCompression] Compressed from ${Math.round(sizeKB)}KB to ${Math.round(compressedSize)}KB`);
    
    return compressedBase64;
  } catch (error) {
    console.error('[AudioCompression] Compression failed:', error);
    return base64Data; // Return original if compression fails
  }
};

/**
 * Convert AudioBuffer to Blob
 */
const audioBufferToBlob = async (audioBuffer: AudioBuffer, quality: number = 1.0): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob());
      return;
    }
    
    // Create a simple waveform representation (this is a simplified approach)
    const data = audioBuffer.getChannelData(0);
    const width = Math.min(data.length, 1000);
    const height = 100;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    
    for (let i = 0; i < width; i++) {
      const x = i;
      const y = (data[i * Math.floor(data.length / width)] * height / 2) + height / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', quality);
  });
};

/**
 * Convert Blob to base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Estimate audio data size in KB
 */
export const getAudioDataSize = (base64Data: string): number => {
  const dataSize = base64Data.length * 0.75; // Approximate size in bytes
  return dataSize / 1024; // Convert to KB
};

/**
 * Check if audio data should be compressed
 */
export const shouldCompressAudio = (base64Data: string, thresholdKB: number = 512): boolean => {
  const sizeKB = getAudioDataSize(base64Data);
  return sizeKB > thresholdKB;
};