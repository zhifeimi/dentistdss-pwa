import { describe, expect, it } from 'vitest';
import { shellSeoHtml } from '../../src/seo/build';
import { findStaticPage, NOT_FOUND_PAGE } from '../../src/seo/pages';
import { buildPageHtml, findPrerenderProblems, type RenderResult } from '../../src/seo/prerender';
import { DEFAULT_SITE_URL } from '../../src/seo/site';

const SHELL = `<!DOCTYPE html>
<html lang="en-AU">
  <head>
    ${shellSeoHtml(DEFAULT_SITE_URL)}
    <script type="module" src="/assets/index.js"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

const learn = findStaticPage('/learn')!;
const login = findStaticPage('/login')!;
const result = (h1: string): RenderResult => ({
  html: `<main><h1>${h1}</h1><p>Plain-language guides.</p></main>`,
  styles: '<style data-emotion="css abc">.css-abc{color:red}</style>',
  seo: null,
});

describe('prerendered page HTML', () => {
  const html = buildPageHtml(SHELL, result('Learn about oral health'), learn, DEFAULT_SITE_URL);

  it('puts the page content inside #root', () => {
    expect(html).toContain('<div id="root"><main><h1>Learn about oral health</h1>');
  });

  it('swaps the shell defaults for the page tags, keeping one title and description', () => {
    expect(html.match(/<title/g)).toHaveLength(1);
    expect(html).toContain(`<title data-seo>${learn.title.replace('&', '&amp;')}</title>`);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).toContain('<link data-seo rel="canonical" href="https://dentist.zhifei.org/learn" />');
  });

  it('inlines the critical CSS in <head> and drops the no-JavaScript notice', () => {
    expect(html.indexOf('data-emotion')).toBeLessThan(html.indexOf('</head>'));
    expect(html).not.toContain('<noscript>');
  });

  it('passes the SEO checks', () => {
    expect(findPrerenderProblems([{ path: '/learn', index: true, html }], DEFAULT_SITE_URL)).toEqual([]);
  });
});

describe('prerender SEO checks', () => {
  const page = (path: string, h1: string, seo = findStaticPage(path)!) => ({
    path,
    index: seo.index,
    html: buildPageHtml(SHELL, result(h1), seo, DEFAULT_SITE_URL),
  });

  it('accepts indexable and noindex pages that are well formed', () => {
    const pages = [page('/learn', 'Learn'), page('/login', 'Log in'), {
      ...page('/404', 'Not found', NOT_FOUND_PAGE),
    }];
    expect(findPrerenderProblems(pages, DEFAULT_SITE_URL)).toEqual([]);
  });

  it('flags a missing or repeated h1', () => {
    const none = { ...page('/learn', 'x'), html: page('/learn', 'x').html.replace(/<\/?h1>/g, '') };
    const two = { ...page('/quiz', 'x'), html: page('/quiz', 'x').html.replace('</main>', '<h1>again</h1></main>') };
    expect(findPrerenderProblems([none, two], DEFAULT_SITE_URL)).toEqual([
      '/learn: needs exactly one <h1> in the page content',
      '/quiz: needs exactly one <h1> in the page content',
    ]);
  });

  it('flags duplicate titles, a wrong canonical, a missing noindex and broken JSON-LD', () => {
    const copy = { ...page('/learn', 'Learn'), path: '/learn-copy' };
    const loginIndexed = { ...page('/login', 'Log in'), index: true };
    const loginNoRobots = { ...page('/login', 'Log in'), html: page('/login', 'Log in').html.replace('noindex, follow', 'all') };
    const brokenJson = {
      ...page('/', 'Home'),
      html: page('/', 'Home').html.replace('"@type":"WebSite"', '"@type":WebSite'),
    };
    const problems = findPrerenderProblems(
      [page('/learn', 'Learn'), copy, loginNoRobots, brokenJson],
      DEFAULT_SITE_URL,
    );
    expect(problems).toContain('/learn-copy: duplicates the title of /learn');
    expect(problems).toContain('/learn-copy: is missing its canonical link');
    expect(problems).toContain('/login: should carry noindex');
    expect(problems).toContain('/: has invalid JSON-LD');
    expect(findPrerenderProblems([loginIndexed], DEFAULT_SITE_URL)).toContain(
      '/login: is missing its canonical link',
    );
    expect(login.index).toBe(false);
  });
});
