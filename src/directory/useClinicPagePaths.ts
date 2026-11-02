import { useEffect, useState } from 'react';
import { loadDirectoryIndex } from './useDirectoryPage';

/**
 * Clinic slug -> public page path, for clinics that have a page in this
 * build. Loaded on demand for each new result set, so a later search retries
 * a failed load; links only ever point at pages that exist.
 */
export function useClinicPagePaths(clinics: readonly { slug?: string | null }[]): ReadonlyMap<string, string> {
  const [paths, setPaths] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    if (!clinics.some((clinic) => Boolean(clinic.slug))) return;
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
  }, [clinics]);

  return paths;
}
