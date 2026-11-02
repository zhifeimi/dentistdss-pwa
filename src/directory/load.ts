/**
 * Build-time loader for the public clinic directory (imported by
 * vite.config.ts, never by the app).
 */
import { readFile } from 'node:fs/promises';
import type { PublicDirectory } from './types.ts';
import { validateDirectory } from './validate.ts';

export interface LoadDirectoryOptions {
  /** VITE_API_HOST. Only an https origin is fetched. */
  apiHost?: string;
  /** PUBLIC_CLINICS_FIXTURE: a JSON file used instead of the API (tests, local runs). */
  fixturePath?: string;
  fetchImpl?: typeof fetch;
  retries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  log?: (message: string) => void;
}

export interface LoadedDirectory {
  directory: PublicDirectory;
  source: 'api' | 'fixture' | 'none';
  dropped: string[];
}

const EMPTY: PublicDirectory = { generatedAt: new Date(0).toISOString(), clinics: [] };

/**
 * Fixture > API > nothing. When an API host is configured, every failure is
 * fatal: a production build that silently dropped all clinic pages would
 * turn them into 404s, while a failed build keeps the last good deployment.
 */
export async function loadDirectory(options: LoadDirectoryOptions): Promise<LoadedDirectory> {
  const log = options.log ?? (() => undefined);

  if (options.fixturePath) {
    const { directory, dropped } = validateDirectory(JSON.parse(await readFile(options.fixturePath, 'utf8')));
    return { directory, source: 'fixture', dropped };
  }

  const host = (options.apiHost ?? '').trim().replace(/\/+$/, '');
  if (!/^https:\/\/[^\s/]+$/.test(host)) {
    log('No https VITE_API_HOST: building without clinic pages.');
    return { directory: EMPTY, source: 'none', dropped: [] };
  }

  const url = `${host}/api/public/clinics`;
  const fetchImpl = options.fetchImpl ?? fetch;
  const attempts = (options.retries ?? 2) + 1;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { directory, dropped } = validateDirectory(await response.json());
      return { directory, source: 'api', dropped };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        log(`Fetching ${url} failed (${error instanceof Error ? error.message : error}); retrying.`);
        await new Promise((done) => setTimeout(done, (options.retryDelayMs ?? 1_000) * attempt));
      }
    }
  }
  throw new Error(`Could not load the public clinic directory from ${url}: ${
    lastError instanceof Error ? lastError.message : String(lastError)
  }`);
}
