import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface DeferredSectionProps {
  children: React.ReactNode;
  /** Reserved height in px rendered before the section loads — prevents CLS. */
  minHeight: number;
  /** IntersectionObserver rootMargin; section loads this far before entering view. */
  preloadMargin?: string;
}

/**
 * Wraps a React.lazy child so its placeholder height survives until the
 * section has actually rendered. DeferredSection controls when the import
 * starts (IntersectionObserver); the fallback it renders keeps minHeight
 * until Suspense resolves, so below-fold sections mounting never shift the
 * footer or surrounding content.
 */
const DeferredSection: React.FC<DeferredSectionProps> = ({
  children,
  minHeight,
  preloadMargin = '400px',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setShouldRender(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: preloadMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRender, preloadMargin]);

  return (
    <Box ref={ref}>
      {shouldRender ? (
        <Suspense fallback={<Box sx={{ minHeight }} />}>
          {children}
        </Suspense>
      ) : (
        <Box sx={{ minHeight }} />
      )}
    </Box>
  );
};

export default DeferredSection;
