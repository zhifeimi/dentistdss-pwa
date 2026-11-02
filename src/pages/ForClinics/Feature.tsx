import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { findClinicFeature, FOR_CLINICS_PATH } from '../../content/forClinics';
import NotFound from '../NotFound';
import { ClinicSignupActions, OtherFeatures, PageBreadcrumbs } from './shared';

/**
 * ClinicFeature — one feature page under /for-clinics/<slug>, rendered from
 * src/content/forClinics.ts. Unknown slugs get the Not Found page.
 */
const ClinicFeature: React.FC = () => {
  const { feature: slug } = useParams();
  const feature = findClinicFeature(slug);
  if (!feature) return <NotFound />;

  return (
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <PageBreadcrumbs
        items={[{ name: 'Home', to: '/' }, { name: 'For clinics', to: FOR_CLINICS_PATH }, { name: feature.name }]}
      />
      <Grid container spacing={{ xs: 5, md: 8 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h2" component="h1" sx={{ maxWidth: '20ch' }}>
            {feature.heading}
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: '1.1875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {feature.intro}
          </Typography>

          {feature.sections.map((section) => (
            <Box key={section.heading} component="section" sx={{ mt: 5 }}>
              <Typography variant="h5" component="h2">{section.heading}</Typography>
              {section.paragraphs.map((paragraph) => (
                <Typography key={paragraph} sx={{ mt: 1.5, fontSize: '1.0625rem', lineHeight: 1.7 }}>
                  {paragraph}
                </Typography>
              ))}
              {section.bullets && (
                <Box component="ul" sx={{ pl: 3, mt: 1.5, mb: 0 }}>
                  {section.bullets.map((bullet) => (
                    <Typography key={bullet} component="li" sx={{ mb: 0.75, fontSize: '1.0625rem', lineHeight: 1.6 }}>
                      {bullet}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}

          <Box component="section" aria-labelledby="questions-heading" sx={{ mt: 6 }}>
            <Typography id="questions-heading" variant="h5" component="h2">Common questions</Typography>
            {feature.faqs.map(({ question, answer }) => (
              <Box key={question} sx={{ mt: 2.5 }}>
                <Typography component="h3" sx={{ fontWeight: 700, fontSize: '1.0625rem' }}>{question}</Typography>
                <Typography sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.7 }}>{answer}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 6 }}>
            <ClinicSignupActions />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 96 } }}>
            <Typography variant="overline" component="h2" sx={{ color: 'text.secondary' }}>
              More for clinics
            </Typography>
            <Box sx={{ mt: 1 }}>
              <OtherFeatures current={feature.slug} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ClinicFeature;
