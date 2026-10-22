/**
 * Mobile optimization utilities for the dental clinic PWA
 * Provides constants, helpers, and responsive design utilities
 */

// Touch target sizes (following Material Design guidelines)
export const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum touch target size in pixels
  RECOMMENDED: 48, // Recommended touch target size for mobile
  LARGE: 56, // Large touch target for important actions
} as const;

// Mobile-specific spacing values
export const MOBILE_SPACING = {
  CONTAINER_PADDING: {
    xs: 2,
    sm: 3,
    md: 4,
  },
  SECTION_MARGIN: {
    xs: 2,
    sm: 3,
    md: 4,
  },
  FORM_SPACING: {
    xs: 2,
    sm: 2.5,
    md: 3,
  },
} as const;

// Type definitions
type SizeVariant = 'small' | 'medium' | 'large';

interface ResponsiveSpacing {
  xs: number;
  sm: number;
  md: number;
  [key: string]: number; // Add index signature for Material-UI compatibility
}

interface TouchFriendlyButtonProps {
  minHeight: number;
  padding: string;
}

/**
 * Get responsive padding based on screen size
 */
export const getResponsivePadding = (size: SizeVariant = 'medium'): ResponsiveSpacing => {
  const paddingMap: Record<SizeVariant, ResponsiveSpacing> = {
    small: { xs: 1, sm: 1.5, md: 2 },
    medium: { xs: 2, sm: 2.5, md: 3 },
    large: { xs: 2.5, sm: 3, md: 4 },
  };
  return paddingMap[size] || paddingMap.medium;
};

/**
 * Get responsive margin based on screen size
 */
export const getResponsiveMargin = (size: SizeVariant = 'medium'): ResponsiveSpacing => {
  const marginMap: Record<SizeVariant, ResponsiveSpacing> = {
    small: { xs: 1, sm: 1.5, md: 2 },
    medium: { xs: 2, sm: 2.5, md: 3 },
    large: { xs: 3, sm: 4, md: 5 },
  };
  return marginMap[size] || marginMap.medium;
};

/**
 * Get touch-friendly button props
 */
export const getTouchFriendlyButtonProps = (
  size: SizeVariant = 'medium', 
  isMobile: boolean = false
): TouchFriendlyButtonProps => {
  const sizeMap: Record<SizeVariant, TouchFriendlyButtonProps> = {
    small: {
      minHeight: isMobile ? TOUCH_TARGETS.MINIMUM : 36,
      padding: isMobile ? '10px 18px' : '8px 16px',
    },
    medium: {
      minHeight: isMobile ? TOUCH_TARGETS.RECOMMENDED : 44,
      padding: isMobile ? '14px 24px' : '12px 20px',
    },
    large: {
      minHeight: isMobile ? TOUCH_TARGETS.LARGE : 52,
      padding: isMobile ? '18px 32px' : '16px 28px',
    },
  };
  
  return sizeMap[size] || sizeMap.medium;
};
