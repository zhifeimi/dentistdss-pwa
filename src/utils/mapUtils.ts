/**
 * Map utility functions for the FindAClinic component
 *
 * Features:
 * - PWA-aware navigation
 * - Platform-specific map app integration
 * - Fallback handling for different environments
 * - URL encoding for safe navigation
 */

interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  isMobile: boolean;
}

interface NavigationParams {
  latitude: number;
  longitude: number;
  name?: string;
}

/**
 * Detect if the app is running as a PWA
 */
const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Detect the user's platform
 */
const detectPlatform = (): PlatformInfo => {
  const ua = window.navigator.userAgent;
  
  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isMacOS: /Macintosh|MacIntel|MacPPC|Mac68K/.test(ua),
    isWindows: /Win32|Win64|Windows|WinCE/.test(ua),
    isMobile: /Mobi|Android/i.test(ua),
  };
};

/**
 * Generate appropriate maps URL based on platform and PWA status
 */
const generateMapsURL = ({ latitude, longitude, name }: NavigationParams): string => {
  const platform = detectPlatform();
  const isStandalone = isPWA();
  const encodedName = encodeURIComponent(name || 'Dental Clinic');
  
  // PWA installed - use native map apps
  if (isStandalone) {
    if (platform.isIOS) {
      // Apple Maps for iOS PWA
      return `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedName}`;
    } else if (platform.isAndroid) {
      // Google Maps intent for Android PWA
      return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`;
    }
  }
  
  // Browser fallback - always use Google Maps web
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
};

/**
 * Open directions to a location
 */
export const openDirections = ({ latitude, longitude, name }: NavigationParams): void => {
  if (!latitude || !longitude) {
    console.warn('Invalid coordinates provided for directions');
    return;
  }
  
  try {
    const url = generateMapsURL({ latitude, longitude, name });
    
    // Open in new tab/window
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Fallback if popup was blocked
    if (!newWindow) {
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error opening directions:', error);
    
    // Ultimate fallback - copy coordinates to clipboard
    if (navigator.clipboard) {
      const coords = `${latitude}, ${longitude}`;
      navigator.clipboard.writeText(coords).then(() => {
        alert(`Could not open maps. Coordinates copied to clipboard: ${coords}`);
      }).catch(() => {
        alert(`Could not open maps. Coordinates: ${latitude}, ${longitude}`);
      });
    } else {
      alert(`Could not open maps. Coordinates: ${latitude}, ${longitude}`);
    }
  }
};
