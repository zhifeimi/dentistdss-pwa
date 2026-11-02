import { useEffect, useState } from 'react';
import { loadDirectoryIndex } from './useDirectoryPage';

/**
 * Clinic slug -> public page path, for clinics that have a page in this
 * build. Loaded on demand; empty until then (or if the directory fails to
 * load), so links only ever point at pages that exist.
 */
export function useClinicPagePaths(enabled: boolean): ReadonlyMap<string, string> {
  const [paths, setPaths] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadDirectoryIndex().then(
      (index) => {
        if (cancelled) return;
        const next = new Map<string, string>();
        for (const page of index.pages) if (page.kind === 'clinic') next.set(page.clinic.slug, page.path);
        setPaths(next);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return paths;
}
