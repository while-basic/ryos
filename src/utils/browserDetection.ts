export const isSafari = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  const ua = navigator.userAgent;
  const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua) || 
    (/Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua));
  
  return isSafariBrowser;
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const getEmojiFont = (): string => {
  if (isSafari() || isIOS()) {
    // For Safari, prioritize system emoji fonts
    return '"Apple Color Emoji", "Segoe UI Emoji", "SerenityOS-Emoji"';
  }
  // For other browsers, SerenityOS-Emoji can be prioritized
  return '"SerenityOS-Emoji", "Apple Color Emoji", "Segoe UI Emoji"';
};