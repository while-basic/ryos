# Safari Audio Issues and Solutions

## Problem Description

Safari has strict audio policies that can cause audio to stop working when:
1. The page is backgrounded for extended periods
2. The user hasn't interacted with the page before audio attempts to play
3. The AudioContext gets suspended or closed during backgrounding
4. The page regains focus but the audio context isn't properly restored

## Root Causes

### 1. Safari's Autoplay Policy
Safari requires user interaction before allowing audio playback. This is more restrictive than other browsers.

### 2. AudioContext State Management
When Safari backgrounds a tab, it may:
- Suspend the AudioContext
- Close the AudioContext entirely (especially on iOS)
- Prevent audio from resuming when the page becomes visible again

### 3. iOS Safari Specific Issues
iOS Safari has additional restrictions:
- More aggressive audio context suspension
- Different handling of background/foreground transitions
- Stricter user interaction requirements

## Solutions Implemented

### 1. Enhanced AudioContext Management (`src/lib/audioContext.ts`)

**Key Features:**
- User interaction tracking for Safari compliance
- Automatic AudioContext recreation when closed
- Safari-specific state handling
- Global event listeners for visibility/focus changes

**New Functions:**
- `markUserInteraction()` - Marks that user has interacted with page
- `hasUserInteractedWithPage()` - Checks if user interaction occurred
- `handleSafariVisibilityChange()` - Safari-specific visibility handling

### 2. Safari-Specific Audio Utilities (`src/utils/safariAudio.ts`)

**Key Features:**
- Safari detection and iOS Safari detection
- Audio context recovery mechanisms
- Safari-compatible audio element creation
- Comprehensive error handling

**New Functions:**
- `recoverSafariAudioContext()` - Recovers suspended/closed contexts
- `ensureSafariAudioPlayback()` - Ensures audio can play in Safari
- `createSafariCompatibleAudio()` - Creates Safari-friendly audio elements
- `playSafariCompatibleAudio()` - Safely plays audio in Safari

### 3. Updated useSound Hook (`src/hooks/useSound.ts`)

**Key Changes:**
- Safari user interaction checks before playing sounds
- Integration with new audio context management
- Enhanced error handling for Safari scenarios

### 4. Updated useTerminalSounds Hook (`src/hooks/useTerminalSounds.ts`)

**Key Changes:**
- Safari audio playback validation
- Integration with Safari audio utilities
- Enhanced visibility change handling

## How It Works

### 1. User Interaction Detection
```typescript
// Automatically detects user interactions
document.addEventListener("click", markUserInteraction, { once: true });
document.addEventListener("touchstart", markUserInteraction, { once: true });
document.addEventListener("keydown", markUserInteraction, { once: true });
```

### 2. AudioContext Recovery
```typescript
// When page becomes visible, automatically recover audio
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    void handleSafariVisibilityChange();
  }
});
```

### 3. Safari-Specific Checks
```typescript
// Before playing any audio in Safari
if (isSafari && !hasUserInteractedWithPage()) {
  console.debug("Safari requires user interaction before audio playback");
  return;
}
```

## Testing Safari Audio Issues

### 1. Background/Foreground Test
1. Open the app in Safari
2. Interact with the page (click something)
3. Background the Safari tab for 30+ seconds
4. Return to the tab
5. Try to play audio - it should work

### 2. User Interaction Test
1. Open the app in Safari without any interaction
2. Try to play audio - it should be blocked
3. Click anywhere on the page
4. Try to play audio - it should work

### 3. iOS Safari Test
1. Test on iOS Safari device
2. Background the app completely
3. Return to the app
4. Audio should recover automatically

## Debugging

### Console Messages to Look For
- `[audioContext] Safari detected - waiting for user interaction`
- `[safariAudio] AudioContext was closed, attempting recovery`
- `[useSound] Safari detected - cannot play sound without user interaction`

### Common Issues and Fixes

1. **Audio still not working after user interaction**
   - Check if `markUserInteraction()` was called
   - Verify AudioContext state is "running"

2. **Audio stops after backgrounding**
   - Ensure `handleSafariVisibilityChange()` is being called
   - Check if AudioContext recreation is working

3. **iOS Safari specific issues**
   - Verify iOS Safari detection is working
   - Check for proper event listener setup

## Browser Compatibility

- **Safari (Desktop)**: Full support with enhanced handling
- **Safari (iOS)**: Full support with iOS-specific optimizations
- **Chrome**: Standard handling (no special Safari logic)
- **Firefox**: Standard handling (no special Safari logic)
- **Edge**: Standard handling (no special Safari logic)

## Future Improvements

1. **Audio Context Pooling**: Create multiple contexts for redundancy
2. **Progressive Enhancement**: Graceful degradation for older Safari versions
3. **Performance Monitoring**: Track audio context state changes
4. **User Feedback**: Inform users when audio is blocked by Safari policies