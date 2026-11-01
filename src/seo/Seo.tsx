import React, { createContext, useContext } from 'react';
import { useLocation } from 'react-router';
import { findStaticPage } from './pages.ts';
import { buildSeoTags, type SeoProps } from './tags.ts';

/**
 * Set only by the build-time prerender: instead of rendering tags, <Seo>
 * records its props so the prerender can write them into the static <head>.
 */
export interface SeoCollector {
  current: SeoProps | null;
}
export const SeoCollectorContext = createContext<SeoCollector | null>(null);

/**
 * Page metadata. React 19 hoists <title>, <meta> and <link> into <head>, and
 * removes them again when the page unmounts, so client-side navigation keeps
 * the head in sync without a helmet library.
 */
export const Seo: React.FC<SeoProps> = (props) => {
  const collector = useContext(SeoCollectorContext);
  if (collector) {
    collector.current = props;
    return null;
  }

  return (
    <>
      {buildSeoTags(props).map((tag, index) => {
        switch (tag.tag) {
          case 'title':
            return <title key="title">{tag.text}</title>;
          case 'meta':
            return <meta key={`meta-${index}`} {...tag.attrs} />;
          case 'link':
            return <link key={`link-${index}`} {...tag.attrs} />;
          case 'script':
            return (
              <script
                key={`script-${index}`}
                {...tag.attrs}
                dangerouslySetInnerHTML={{ __html: tag.text }}
              />
            );
        }
      })}
    </>
  );
};

/**
 * Metadata for static public routes, looked up from the registry by path.
 * Dynamic pages (and the 404 page) render their own <Seo> instead.
 */
export const RouteSeo: React.FC = () => {
  const { pathname } = useLocation();
  const page = findStaticPage(pathname);
  return page ? <Seo {...page} /> : null;
};

export default Seo;
