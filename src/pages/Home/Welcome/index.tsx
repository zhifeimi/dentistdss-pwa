import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Container,
  CardMedia,
  TextField,
  useTheme,
  useMediaQuery,
  CardActionArea
} from '@mui/material';
import { Link as RouterLink } from 'react-router';

import dentalCareKidsImg from '../../../assets/d6.jpg';
import Hero from './Hero';

interface DentalTip {
  title: string;
  text: string;
}

/**
 * Welcome - Main welcome page component
 * 
 * Features:
 * - Hero section with main call-to-action
 * - Dental health quiz promotion
 * - Appointment booking form
 * - Educational content about dental care
 * - Responsive design with dark mode support
 */
const Welcome: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const secondary_A100_t = (theme.palette.secondary && (theme.palette.secondary as any).A100_t) || 'rgba(77, 182, 172, 0.2)';

  const dentalTips: DentalTip[] = [
    {
      title: "How to Brush Properly",
      text: "Use circular motions, not hard scrubbing."
    },
    {
      title: "Avoid Sugary Snacks",
      text: "Sugar increases risk of cavities. Eat fresh fruits instead."
    },
    {
      title: "Benefits of Regular Dental Visits",
      text: "Detect issues early and maintain overall health."
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Hero />

      <Box sx={{
        bgcolor: isDarkMode ? theme.palette.grey[900] : theme.palette.grey[100],
        py: { xs: 3, sm: 4, md: 5 },
        my: { xs: 2, sm: 3, md: 4 },
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Container maxWidth="md">
          <CardActionArea
            component={RouterLink}
            to="/quiz"
            sx={{
              display: 'block',
              textDecoration: 'none',
              transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
              bgcolor: 'background.paper',
              border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
              borderRadius: 2,
              p: 4,
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: theme.shadows[isDarkMode ? 6 : 3]
              },
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h2"
              align="center"
              gutterBottom
              sx={{
                color: isDarkMode ? theme.palette.secondary.light : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: { xs: 2, sm: 2.5, md: 3 },
                textShadow: isDarkMode ? `0 0 8px ${secondary_A100_t}` : 'none',
                fontWeight: 'medium',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 }
              }}
            >
              <Box component="span">🦷</Box>
              <Box component="span">Dental Health Quiz</Box>
            </Typography>

            <Typography
              variant={isSmallMobile ? "body2" : "subtitle1"}
              align="center"
              sx={{
                mb: { xs: 2, sm: 2.5, md: 3 },
                fontWeight: 'medium',
                color: 'text.primary',
                px: { xs: 1, sm: 0 }
              }}
            >
              💭 Test your dental knowledge and learn more about oral health!
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size={isMobile ? "medium" : "large"}
              sx={{
                mt: { xs: 2, sm: 2.5, md: 3 },
                textTransform: 'none',
                py: { xs: 1.5, sm: 1.8 },
                minHeight: { xs: 48, sm: 52 },
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Start Dental Health Quiz
            </Button>
          </CardActionArea>
        </Container>
      </Box>

      {/* Book an Appointment Section */}
      <Container maxWidth="md" sx={{ my: { xs: 4, sm: 5, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h2"
          align="center"
          gutterBottom
          sx={{
            mb: { xs: 3, sm: 3.5, md: 4 },
            fontWeight: 'medium',
            color: 'text.primary',
            textShadow: isDarkMode ? `0 0 10px ${secondary_A100_t}` : 'none'
          }}
        >
          Book an Appointment
        </Typography>

        <Paper
          elevation={isDarkMode ? 4 : 2}
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none'
          }}
        >
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Your Name"
                variant="outlined"
                placeholder="Enter your full name"
                slotProps={{
                  htmlInput: {
                    autoComplete: 'name',
                    inputMode: 'text'
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                variant="outlined"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    min: new Date().toISOString().split('T')[0] // Prevent past dates
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? "medium" : "large"}
                fullWidth={isSmallMobile}
                sx={{
                  borderRadius: 1,
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.5, sm: 1.8 },
                  fontWeight: 'medium',
                  textShadow: isDarkMode ? '0 1px 3px rgba(0, 0, 0, 0.4)' : 'none',
                  minHeight: { xs: 48, sm: 52 },
                  minWidth: { xs: 'auto', sm: 120 }
                }}
              >
                Book Now
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Dental Care Image */}
      <Box sx={{ my: 6, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <CardMedia
            component="img"
            image={dentalCareKidsImg}
            alt="Dental Care for Kids"
            sx={{
              borderRadius: 2,
              maxHeight: '300px',
              objectFit: 'cover',
              filter: isDarkMode ? 'brightness(0.85)' : 'none',
              border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
              boxShadow: isDarkMode ? theme.shadows[3] : 'none'
            }}
          />
        </Container>
      </Box>

      {/* Learn About Dental Care Section */}
      <Container maxWidth="md" sx={{ my: 6 }}>
        <Typography
          variant="h4"
          component="h2"
          align="center"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 'medium',
            color: 'text.primary',
            textShadow: isDarkMode ? `0 0 10px ${secondary_A100_t}` : 'none'
          }}
        >
          Learn About Dental Care
        </Typography>

        <Grid container spacing={3}>
          {dentalTips.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Paper
                elevation={isDarkMode ? 3 : 1}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: isDarkMode ? theme.palette.grey[800] : theme.palette.grey[50],
                  border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none',
                  mb: index < 2 ? 2 : 0 // Add margin bottom to all but the last item
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: isDarkMode ? theme.palette.success.light : 'text.primary',
                    fontWeight: 'medium'
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '1.6rem' // Kept specific font size if intended
                  }}
                >
                  {item.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Welcome;
