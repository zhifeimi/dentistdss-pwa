import React from 'react';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { OPEN_DENTABOT_EVENT } from '../../../../components/Home/Helper';
import ChatPreviewCard from './ChatPreviewCard';

/** DentabotSection — what the assistant is for, and what it isn't. */
const DentabotSection: React.FC = () => (
  <Box component="section" aria-labelledby="dentabot-heading" sx={{ py: { xs: 8, md: 12 } }}>
    <Container maxWidth="lg">
      <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
          <Typography id="dentabot-heading" variant="h2" sx={{ maxWidth: '16ch' }}>
            Not sure it needs a dentist?
          </Typography>
          <Typography sx={{ mt: 2.5, color: 'text.secondary', fontSize: '1.125rem', maxWidth: '44ch' }}>
            Describe what you feel in plain words. Dentabot explains the likely causes, suggests safe
            self-care and tells you when it's time to book.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', maxWidth: '50ch' }}>
            Dentabot gives general information, not a diagnosis. For severe pain, swelling or
            bleeding that won't stop, contact a clinic or emergency service now.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            sx={{ mt: 4 }}
            onClick={() => window.dispatchEvent(new Event(OPEN_DENTABOT_EVENT))}
          >
            Ask Dentabot
          </Button>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
          <ChatPreviewCard />
        </Grid>
      </Grid>
    </Container>
  </Box>
);

export default DentabotSection;
