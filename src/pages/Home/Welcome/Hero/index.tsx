import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink } from 'react-router';
import dentalQuestionImg from '../../../../assets/d2.jpg';
import findDentistImg from '../../../../assets/d5.jpeg';

interface HeroItem {
  title: string;
  image: string;
  alt: string;
  link: string;
}

/**
 * Hero - Hero section component for the welcome page
 *
 * Clerk-style restraint: eyebrow label, quiet headline, one primary CTA
 * plus one secondary link, fine-bordered cards. No glow, no shine sweeps.
 */
const Hero: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const heroItems: HeroItem[] = [
    {
      title: "Ask a dental question",
      image: dentalQuestionImg,
      alt: "Dental Questions",
      link: "/chat"
    },
    {
      title: "Find a clinic",
      image: findDentistImg,
      alt: "Find a Clinic",
      link: "/find-a-clinic"
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ my: { xs: 2, sm: 3, md: 4 }, textAlign: 'center', px: { xs: 2, sm: 3 } }}>
      <Typography
        variant="body2"
        component="p"
        sx={{
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'primary.main',
          mb: { xs: 1, sm: 1.5 },
          fontSize: '0.75rem',
        }}
      >
        DentistDSS
      </Typography>
      <Typography
        variant={isMobile ? "h4" : "h3"}
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          mb: { xs: 1.5, sm: 2, md: 2.5 }
        }}
      >
        Dental Chat with AI Dentists
      </Typography>

      <Typography
        variant={isSmallMobile ? "body1" : "h6"}
        sx={{
          fontWeight: 400,
          color: 'text.secondary',
          maxWidth: 560,
          mx: 'auto',
          mb: { xs: 3, sm: 3.5, md: 4 },
        }}
      >
        Ask dental questions and find a clinic — assistant guidance when you
        need it, real clinics when it matters.
      </Typography>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        mb: { xs: 3, sm: 4, md: 5 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          component={RouterLink}
          to="/chat"
          variant="contained"
          color="primary"
          size={isMobile ? "medium" : "large"}
          fullWidth={isSmallMobile}
        >
          Ask a dental question
        </Button>
        <Button
          component={RouterLink}
          to="/find-a-clinic"
          variant="text"
          color="primary"
          size={isMobile ? "medium" : "large"}
          fullWidth={isSmallMobile}
        >
          Find a clinic →
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mt: { xs: 1, sm: 1.5, md: 2 }, justifyContent: 'center' }}>
        {heroItems.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                  boxShadow: theme.shadows[isDarkMode ? 6 : 3],
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: { xs: 2, sm: 2.5, md: 3 } }}>
                <CardMedia
                  component="img"
                  height={isMobile ? "240" : "360"}
                  image={item.image}
                  alt={item.alt}
                  sx={{
                    borderRadius: 2,
                    mb: { xs: 1.5, sm: 2 },
                    filter: isDarkMode ? 'brightness(0.9)' : 'none',
                    objectFit: 'cover'
                  }}
                />
                <Button
                  component={RouterLink}
                  to={item.link}
                  variant="contained"
                  color="primary"
                  size={isMobile ? "medium" : "large"}
                  fullWidth={isSmallMobile}
                >
                  {item.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Hero;
