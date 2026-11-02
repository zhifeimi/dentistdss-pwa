import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router';
import { articlePath, findArticle, relatedArticles } from '../../../content/articles';
import { OPEN_DENTABOT_EVENT } from '../../../components/Home/Helper';
import NotFound from '../../NotFound';

// Article bodies, bundled into this route's chunk so the prerendered HTML
// carries the full text. Only top-level files: ./drafts is never published.
const BODIES = import.meta.glob<string>('../../../content/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const bodyFor = (slug: string): string | undefined => BODIES[`../../../content/articles/${slug}.md`];

// UTC keeps the build-time render and the browser on the same date.
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`));

const markdown: Components = {
  p: ({ children }) => (
    <Typography component="p" sx={{ mb: 2.5, fontSize: '1.0625rem', lineHeight: 1.75 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="h5" component="h2" sx={{ mt: 5, mb: 1.5 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
      {children}
    </Typography>
  ),
  ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mt: 0, mb: 2.5 }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 3, mt: 0, mb: 2.5 }}>{children}</Box>,
  li: ({ children }) => (
    <Typography component="li" sx={{ mb: 1, fontSize: '1.0625rem', lineHeight: 1.7 }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }) => (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  ),
};

/**
 * LearnArticle — one oral health guide at /learn/<slug>, with breadcrumbs,
 * dates, related guides and a way to find a clinic. Metadata and structured
 * data come from the SEO registry (src/seo/pages.ts) via RouteSeo.
 */
const LearnArticle: React.FC = () => {
  const { slug } = useParams();
  const article = findArticle(slug);
  const body = article && bodyFor(article.slug);
  if (!article || !body) return <NotFound />;

  const related = relatedArticles(article);
  const updated = article.dateModified !== article.datePublished;

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
        <Link component={RouterLink} to="/learn" underline="hover" color="inherit">Learn</Link>
        <Typography color="text.primary" aria-current="page">{article.title}</Typography>
      </Breadcrumbs>

      <Box component="article">
        <Box sx={{ mb: 1.5 }}>
          {article.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
        </Box>
        <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
          {article.title}
        </Typography>
        <Typography sx={{ mt: 2, fontSize: '1.1875rem', color: 'text.secondary', lineHeight: 1.6 }}>
          {article.description}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          By the DentistDSS team · Published <time dateTime={article.datePublished}>{formatDate(article.datePublished)}</time>
          {updated && (
            <>
              {' · '}Updated <time dateTime={article.dateModified}>{formatDate(article.dateModified)}</time>
            </>
          )}
        </Typography>
        {article.reviewer && (
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Reviewed by {article.reviewer.name}, {article.reviewer.credentials}
          </Typography>
        )}

        <Box
          component="img"
          src={article.image.src}
          alt={article.image.alt}
          width={article.image.width}
          height={article.image.height}
          fetchPriority="high"
          sx={{
            display: 'block',
            width: '100%',
            height: 'auto',
            aspectRatio: '3 / 2',
            objectFit: 'cover',
            borderRadius: 2,
            my: 4,
          }}
        />

        <ReactMarkdown components={markdown}>{body}</ReactMarkdown>

        {article.references.length > 0 && (
          <Box component="section" aria-labelledby="sources-heading" sx={{ mt: 5 }}>
            <Typography id="sources-heading" variant="h6" component="h2" sx={{ mb: 1 }}>
              Sources
            </Typography>
            <Box component="ol" sx={{ pl: 3, m: 0 }}>
              {article.references.map((reference) => (
                <Typography key={reference.url} component="li" variant="body2" sx={{ mb: 0.5 }}>
                  <Link href={reference.url} target="_blank" rel="noopener noreferrer">
                    {reference.title}
                  </Link>
                  , {reference.publisher}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        <Box
          component="aside"
          sx={{ mt: 5, p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This guide is general information, not a diagnosis or treatment plan. For severe pain, swelling or
            bleeding that won't stop, contact a dentist or emergency service now.
          </Typography>
        </Box>
      </Box>

      <Box component="section" aria-labelledby="next-step-heading" sx={{ mt: 6 }}>
        <Typography id="next-step-heading" variant="h5" component="h2">
          Need to see a dentist?
        </Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary', maxWidth: '52ch' }}>
          Search clinics by suburb or treatment and book an open time online, or ask Dentabot first.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="/find-a-clinic" variant="contained" size="large">
            Find a clinic
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => window.dispatchEvent(new Event(OPEN_DENTABOT_EVENT))}
          >
            Ask Dentabot
          </Button>
        </Box>
      </Box>

      {related.length > 0 && (
        <Box component="section" aria-labelledby="related-heading" sx={{ mt: 7 }}>
          <Typography id="related-heading" variant="h5" component="h2" sx={{ mb: 2.5 }}>
            Related guides
          </Typography>
          <Grid container spacing={2.5}>
            {related.map((other) => (
              <Grid key={other.slug} size={{ xs: 12, sm: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea component={RouterLink} to={articlePath(other)} sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      image={other.image.card}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      sx={{ aspectRatio: '3 / 2', objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography component="h3" sx={{ fontWeight: 650, lineHeight: 1.35 }}>
                        {other.title}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ mt: 5 }}>
        <Link component={RouterLink} to="/learn">← All oral health guides</Link>
      </Box>
    </Container>
  );
};

export default LearnArticle;
