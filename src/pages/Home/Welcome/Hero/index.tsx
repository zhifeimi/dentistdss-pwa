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
  Divider
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
 * Features:
 * - Main title with animated styling
 * - Two primary action cards (Ask Questions, Find Clinic)
 * - Responsive design with dark mode support
 * - Hover animations and visual effects
 */
const Hero: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const white_t = (theme.palette.common as any).white_t || 'rgba(255, 255, 255, 0.2)';
  const secondary_A100_t = (theme.palette.secondary && (theme.palette.secondary as any).A100_t) || 'rgba(77, 182, 172, 0.2)';

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
        variant={isMobile ? "h5" : "h4"}
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          mb: { xs: 2, sm: 2.5, md: 3 }
        }}
      >
        <Box
          component="span"
          sx={{
            textShadow: isDarkMode
              ? '0 0 10px rgba(0, 230, 180, 0.6), 0 0 20px rgba(0, 230, 180, 0.4)'
              : '0 0 10px rgba(1, 52, 39, 0.3), 0 0 20px rgba(1, 52, 39, 0.2)',
            letterSpacing: '0.5px',
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '3px',
              background: isDarkMode
                ? `linear-gradient(90deg, transparent, ${theme.palette.secondary.light}, transparent)`
                : `linear-gradient(90deg, transparent, ${theme.palette.primary.dark}, transparent)`,
              borderRadius: '2px'
            }
          }}
        >
          Dental Chat
        </Box>
        <Box
          component="span"
          sx={{
            color: isDarkMode ? theme.palette.text.secondary : 'inherit'
          }}
        >
          {' with AI Dentists'}
        </Box>
      </Typography>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: { xs: 2, sm: 2.5, md: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography
          variant={isSmallMobile ? "body1" : "h6"}
          sx={{
            mx: { xs: 0, sm: 2 },
            fontWeight: 'medium',
            color: isDarkMode ? theme.palette.success.light : 'primary.main',
            textAlign: 'center'
          }}
        >
          Ask Dental Questions
        </Typography>
        {!isSmallMobile && (
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              borderColor: isDarkMode ? theme.palette.secondary.light : 'primary.main',
              display: { xs: 'none', sm: 'block' }
            }}
          />
        )}
        <Typography
          variant={isSmallMobile ? "body1" : "h6"}
          sx={{
            mx: { xs: 0, sm: 2 },
            fontWeight: 'medium',
            color: isDarkMode ? theme.palette.success.light : 'primary.main',
            textAlign: 'center'
          }}
        >
          Find a Clinic
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mt: { xs: 1, sm: 1.5, md: 2 }, justifyContent: 'center' }}>
        {heroItems.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
            <Card
              elevation={isDarkMode ? 4 : 2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[isDarkMode ? 8 : 4],
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
                  sx={{
                    borderRadius: 8,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 2 },
                    minHeight: { xs: 48, sm: 52 },
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: theme.shadows[6]
                    },
                    textShadow: isDarkMode
                      ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 1px 2px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: isDarkMode
                        ? `linear-gradient(90deg, transparent, ${secondary_A100_t}, transparent)`
                        : `linear-gradient(90deg, transparent, ${white_t}, transparent)`,
                      transition: 'all 0.5s ease'
                    },
                    '&:hover::before': {
                      left: '100%'
                    }
                  }}
                >
                  <Box sx={{ fontWeight: 'medium', display: 'inline-block', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {item.title}
                  </Box>
                </Button>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  click here
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Hero;
