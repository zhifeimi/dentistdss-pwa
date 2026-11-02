import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { ARTICLE_TAGS, ARTICLES, articlePath } from '../../../content/articles';

/**
 * Learn — the hub for the oral health guides. Each card links to the guide's
 * own page (/learn/<slug>), so every guide has a URL that search engines can
 * index and people can share. Topic chips filter the list.
 */
const Learn: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredArticles = activeFilters.length > 0
    ? ARTICLES.filter((article) => article.tags.some((tag) => activeFilters.includes(tag)))
    : ARTICLES;

  const handleFilterToggle = (tag: string) => {
    setActiveFilters((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  return (
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h2" component="h1">
        Learn about oral health
      </Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary', maxWidth: '60ch' }}>
        Plain-language guides to common dental problems, treatments and everyday care, written for
        patients.
      </Typography>

      <Box
        role="group"
        aria-label="Filter by topic"
        sx={{ mt: 3, mb: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', mr: 0.5 }}>
          Topics
        </Typography>
        {ARTICLE_TAGS.map((tag) => {
          const active = activeFilters.includes(tag);
          return (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleFilterToggle(tag)}
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              aria-pressed={active}
            />
          );
        })}
      </Box>

      <Grid container spacing={3}>
        {filteredArticles.length === 0 ? (
          <Box sx={{ width: '100%', py: 10, textAlign: 'center' }}>
            <Typography variant="h6" color="text.primary">
              No articles cover all of those topics
            </Typography>
            <Button variant="outlined" onClick={() => setActiveFilters([])} sx={{ mt: 2 }}>
              Clear topics
            </Button>
          </Box>
        ) : (
          filteredArticles.map((article, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={article.slug}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  component={RouterLink}
                  to={articlePath(article)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardMedia
                    component="img"
                    image={article.image.card}
                    alt={article.image.alt}
                    // Card images are the full image at half size.
                    width={article.image.width / 2}
                    height={Math.round(article.image.height / 2)}
                    // The first row is above the fold on wide screens.
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    sx={{ height: 180, objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                    <Box sx={{ mb: 1.5 }}>
                      {article.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h2"
                      gutterBottom
                      sx={{ fontSize: '1.125rem', lineHeight: 1.3 }}
                    >
                      {article.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {article.description}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 650 }}>
                      Read the guide →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default Learn;
