import type { DirectoryPage } from './model.ts';

/** Id of the <script type="application/json"> holding a prerendered /dentists page's data. */
export const DIRECTORY_EMBED_ID = 'dentistdss-directory-page';

/** Same-origin copy of the public directory, written by the build. */
export const DIRECTORY_DATA_PATH = '/data/directory.json';

/** The page data as an inline JSON script ("<" escaped so it can't end the element). */
export function embedDirectoryPage(page: DirectoryPage): string {
  const json = JSON.stringify(page).replace(/</g, '\\u003c');
  return `<script type="application/json" id="${DIRECTORY_EMBED_ID}">${json}</script>`;
}
