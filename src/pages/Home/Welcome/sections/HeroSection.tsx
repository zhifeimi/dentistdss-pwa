import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { OPEN_DENTABOT_EVENT } from '../../../../components/Home/Helper';
import HeroLedger from './HeroLedger';

/**
 * HeroSection — the patient's first task, front and centre: a working clinic
 * search that hands its query to /find-a-clinic, plus a way to ask Dentabot
 * first. The ledger on the right shows what booking looks like.
 */
const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/find-a-clinic?q=${encodeURIComponent(q)}` : '/find-a-clinic');
  };

  return (
    <Box component="section" sx={{ pt: { xs: 4, md: 8 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h1" sx={{ maxWidth: '14ch' }}>
              Find a dentist and book a time that suits you
            </Typography>
            <Typography
              sx={{ mt: 3, maxWidth: '44ch', fontSize: '1.125rem', color: 'text.secondary' }}
            >
              Search clinics by suburb, name or treatment, see who can take you, and book online. No
              phone queue.
            </Typography>

            <Box
              component="form"
              role="search"
              onSubmit={handleSubmit}
              sx={{
                mt: 4,
                display: 'flex',
                gap: 1.5,
                maxWidth: 560,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <TextField
                fullWidth
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Suburb, clinic or treatment"
                slotProps={{
                  htmlInput: { 'aria-label': 'Search clinics', enterKeyHint: 'search' },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button type="submit" variant="contained" size="large" sx={{ flexShrink: 0 }}>
                Search clinics
              </Button>
            </Box>

            <Typography variant="body2" sx={{ mt: 2.5, color: 'text.secondary' }}>
              Not sure it needs a visit?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => window.dispatchEvent(new Event(OPEN_DENTABOT_EVENT))}
                sx={{ verticalAlign: 'baseline', fontSize: 'inherit' }}
              >
                Ask Dentabot
              </Link>
              , our dental assistant, any time of day.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <HeroLedger />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;
