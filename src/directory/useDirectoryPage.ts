import { createContext, useContext, useEffect, useState } from 'react';
import config from '../config';
import { normalizePath } from '../seo/site';
import { DIRECTORY_DATA_PATH, DIRECTORY_EMBED_ID } from './embed';
import { buildDirectory, type DirectoryIndex, type DirectoryPage } from './model';
import type { PublicDirectory } from './types';
import { validateDirectory } from './validate';

/** Set by the build-time prerender with the page being rendered. */
export const DirectoryPageContext = createContext<DirectoryPage | null>(null);

export type DirectoryPageState =
  | { status: 'ready'; page: DirectoryPage }
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' };

/** The data a prerendered page carries, read once at startup. */
let embedded: DirectoryPage | null | undefined;
function readEmbedded(): DirectoryPage | null {
  if (embedded !== undefined) return embedded;
  embedded = null;
  if (typeof document === 'undefined') return embedded;
  const script = document.getElementById(DIRECTORY_EMBED_ID);
  try {
    embedded = script?.textContent ? JSON.parse(script.textContent) as DirectoryPage : null;
  } catch {
    embedded = null;
  }
  return embedded;
}

let directoryRequest: Promise<DirectoryIndex> | null = null;

/**
 * The whole directory, for pages reached by client-side navigation: the
 * build's same-origin copy, or the API itself in development.
 */
export function loadDirectoryIndex(): Promise<DirectoryIndex> {
  directoryRequest ??= (async () => {
    const url = import.meta.env.DEV ? `${config.api.baseUrl}/api/public/clinics` : DIRECTORY_DATA_PATH;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { directory } = validateDirectory(await response.json() as PublicDirectory);
    return buildDirectory(directory);
  })().catch((error) => {
    directoryRequest = null;
    throw error;
  });
  return directoryRequest;
}

/**
 * Data for the /dentists page at `pathname`: what the build rendered, what
 * the prerendered HTML carries, or (after client-side navigation) the
 * directory loaded on demand.
 */
export function useDirectoryPage(pathname: string): DirectoryPageState {
  const path = normalizePath(pathname);
  const rendered = useContext(DirectoryPageContext);
  const initial = rendered?.path === path ? rendered : readEmbedded()?.path === path ? readEmbedded() : null;
  const [state, setState] = useState<DirectoryPageState>(
    initial ? { status: 'ready', page: initial } : { status: 'loading' },
  );

  useEffect(() => {
    if (state.status === 'ready' && state.page.path === path) return;
    let cancelled = false;
    setState({ status: 'loading' });
    loadDirectoryIndex().then(
      (index) => {
        if (cancelled) return;
        const page = index.byPath.get(path);
        setState(page ? { status: 'ready', page } : { status: 'missing' });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
    // Re-run only when the path changes; `state` is read for the fast path.
  }, [path]);

  return state.status === 'ready' && state.page.path !== path ? { status: 'loading' } : state;
}
