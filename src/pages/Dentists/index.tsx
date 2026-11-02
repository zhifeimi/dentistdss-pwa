import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router';
import RouteFallback from '../../components/RouteFallback';
import type { ClinicSummary, DirectoryPage, SuburbSummary } from '../../directory/model';
import { DIRECTORY_PATH } from '../../directory/paths';
import { useDirectoryPage } from '../../directory/useDirectoryPage';
import { Seo } from '../../seo/Seo';
import NotFound from '../NotFound';
import { PageBreadcrumbs } from '../ForClinics/shared';

type PageOf<K extends DirectoryPage['kind']> = Extract<DirectoryPage, { kind: K }>;

// Monday first, as Australian clinics list their hours.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

// UTC keeps the build-time render and the browser on the same date.
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(iso));

const pageSx = { py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3, md: 4 } } as const;

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ mt: 4, p: 3, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
    <Typography sx={{ color: 'text.secondary' }}>{children}</Typography>
    <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
      <Button component={RouterLink} to="/find-a-clinic" variant="outlined">Search all clinics</Button>
      <Button component={RouterLink} to="/for-clinics">List your clinic</Button>
    </Box>
  </Box>
);

const SuburbList: React.FC<{ suburbs: SuburbSummary[] }> = ({ suburbs }) => (
  <Grid container spacing={2}>
    {suburbs.map((suburb) => (
      <Grid key={suburb.path} size={{ xs: 12, sm: 6, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardActionArea component={RouterLink} to={suburb.path} sx={{ height: '100%' }}>
            <CardContent>
              <Typography component="h3" sx={{ fontWeight: 700 }}>{suburb.name}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {plural(suburb.clinicCount, 'clinic')}
                {suburb.postcodes.length > 0 && ` · ${suburb.postcodes.join(', ')}`}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    ))}
  </Grid>
);

const ClinicCard: React.FC<{ clinic: ClinicSummary; heading?: 'h2' | 'h3' }> = ({ clinic, heading = 'h2' }) => (
  <Card sx={{ height: '100%' }}>
    <CardActionArea component={RouterLink} to={clinic.path} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component={heading}>{clinic.name}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {[clinic.street, clinic.postcode].filter(Boolean).join(' ') || 'Address on the clinic page'}
        </Typography>
        {clinic.services.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            {clinic.services.map((service) => (
              <Chip key={service} label={service} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
        )}
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          {clinic.openDays > 0 ? `Open ${plural(clinic.openDays, 'day')} a week` : 'Opening hours not listed'}
          {clinic.acceptsOnlineBooking && ' · Books online'}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

const CountryView: React.FC<{ page: PageOf<'country'> }> = ({ page }) => (
  <Container component="main" maxWidth="lg" sx={pageSx}>
    <PageBreadcrumbs items={[{ name: 'Home', to: '/' }, { name: 'Dentists' }]} />
    <Typography variant="h2" component="h1">Find a dentist by state</Typography>
    <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: '60ch' }}>
      Browse dental clinics on DentistDSS by state and suburb, see their opening hours and services, and book online.
    </Typography>
    {page.states.length === 0
      ? <EmptyState>No clinics are listed yet. Clinics on DentistDSS can choose to appear here.</EmptyState>
      : (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {page.states.map((state) => (
            <Grid key={state.code} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={state.path} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component="h2">{state.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {plural(state.clinicCount, 'clinic')} in {plural(state.suburbCount, 'suburb')}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
  </Container>
);

const StateView: React.FC<{ page: PageOf<'state'> }> = ({ page }) => (
  <Container component="main" maxWidth="lg" sx={pageSx}>
    <PageBreadcrumbs items={[{ name: 'Home', to: '/' }, { name: 'Dentists', to: DIRECTORY_PATH }, { name: page.state.name }]} />
    <Typography variant="h2" component="h1">Dentists in {page.state.name}</Typography>
    <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: '60ch' }}>
      {plural(page.state.clinicCount, 'dental clinic')} across {plural(page.state.suburbCount, 'suburb')} in{' '}
      {page.state.name}. Choose a suburb to compare clinics, opening hours and services.
    </Typography>
    <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>Suburbs</Typography>
    <SuburbList suburbs={page.suburbs} />
  </Container>
);

const SuburbView: React.FC<{ page: PageOf<'suburb'> }> = ({ page }) => {
  const { state, suburb, clinics } = page;
  return (
    <Container component="main" maxWidth="lg" sx={pageSx}>
      <PageBreadcrumbs
        items={[
          { name: 'Home', to: '/' },
          { name: 'Dentists', to: DIRECTORY_PATH },
          { name: state.name, to: state.path },
          { name: suburb.name },
        ]}
      />
      <Typography variant="h2" component="h1">Dentists in {suburb.name}, {state.code}</Typography>
      <Typography sx={{ mt: 1.5, color: 'text.secondary', maxWidth: '62ch' }}>
        {plural(clinics.length, 'dental clinic')} in {suburb.name}
        {suburb.postcodes.length > 0 && ` (${suburb.postcodes.join(', ')})`} list their hours and services on DentistDSS
        {clinics.some((clinic) => clinic.acceptsOnlineBooking) ? ', and you can book online with them' : ''}.
      </Typography>
      <Grid container spacing={2.5} sx={{ mt: 3 }}>
        {clinics.map((clinic) => (
          <Grid key={clinic.slug} size={{ xs: 12, md: 6 }}>
            <ClinicCard clinic={clinic} />
          </Grid>
        ))}
      </Grid>
      {page.nearby.length > 0 && (
        <Box component="section" aria-labelledby="nearby-heading" sx={{ mt: 6 }}>
          <Typography id="nearby-heading" variant="h5" component="h2" sx={{ mb: 2 }}>
            Other suburbs in {state.name}
          </Typography>
          <SuburbList suburbs={page.nearby} />
        </Box>
      )}
    </Container>
  );
};

const ClinicView: React.FC<{ page: PageOf<'clinic'> }> = ({ page }) => {
  const { clinic, state, suburb } = page;
  const address = [clinic.address.street, `${clinic.address.suburb} ${clinic.address.state} ${clinic.address.postcode ?? ''}`.trim()]
    .filter(Boolean).join(', ');
  const directions = clinic.location
    ? `https://www.google.com/maps/search/?api=1&query=${clinic.location.latitude},${clinic.location.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${address}`)}`;
  const hours = new Map(clinic.operatingHours.map((day) => [day.dayOfWeek, day]));
  const websiteHost = clinic.website ? new URL(clinic.website).host.replace(/^www\./, '') : null;

  return (
    <Container component="main" maxWidth="lg" sx={pageSx}>
      <PageBreadcrumbs
        items={[
          { name: 'Home', to: '/' },
          { name: 'Dentists', to: DIRECTORY_PATH },
          { name: state.name, to: state.path },
          { name: suburb.name, to: suburb.path },
          { name: clinic.name },
        ]}
      />
      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h2" component="h1">{clinic.name}</Typography>
          <Typography sx={{ mt: 1, fontSize: '1.125rem', color: 'text.secondary' }}>
            Dentist in {clinic.address.suburb}, {clinic.address.state}
          </Typography>
          {clinic.description && (
            <Typography sx={{ mt: 3, fontSize: '1.0625rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {clinic.description}
            </Typography>
          )}
          {clinic.services.length > 0 && (
            <Box component="section" aria-labelledby="services-heading" sx={{ mt: 4 }}>
              <Typography id="services-heading" variant="h5" component="h2" sx={{ mb: 1.5 }}>Services</Typography>
              <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                {clinic.services.map((service) => (
                  <Typography key={service} component="li" sx={{ mb: 0.5 }}>{service}</Typography>
                ))}
              </Box>
            </Box>
          )}
          <Box component="section" aria-labelledby="hours-heading" sx={{ mt: 4 }}>
            <Typography id="hours-heading" variant="h5" component="h2" sx={{ mb: 1 }}>Opening hours</Typography>
            {clinic.operatingHours.length === 0
              ? <Typography sx={{ color: 'text.secondary' }}>The clinic hasn't listed its hours. Call to check.</Typography>
              : (
                <Table size="small" sx={{ maxWidth: 420 }}>
                  <TableBody>
                    {WEEK.map((day) => {
                      const entry = hours.get(day);
                      return (
                        <TableRow key={day}>
                          <TableCell component="th" scope="row" sx={{ pl: 0, fontWeight: 600 }}>{DAY_NAMES[day]}</TableCell>
                          <TableCell sx={{ pr: 0 }}>
                            {entry?.isOpen ? `${entry.openTime} – ${entry.closeTime}` : 'Closed'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="h6" component="h2">Visit or book</Typography>
            <Typography sx={{ mt: 1.5 }}>{address}</Typography>
            <Link href={directions} target="_blank" rel="noopener noreferrer" variant="body2">Get directions</Link>
            {clinic.phone && (
              <Typography sx={{ mt: 2 }}>
                Phone: <Link href={`tel:${clinic.phone.replace(/\s+/g, '')}`}>{clinic.phone}</Link>
              </Typography>
            )}
            {clinic.website && websiteHost && (
              <Typography sx={{ mt: 1 }}>
                Website:{' '}
                <Link href={clinic.website} target="_blank" rel="nofollow noopener noreferrer">{websiteHost}</Link>
              </Typography>
            )}
            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {clinic.acceptsOnlineBooking
                ? (
                  <Button component={RouterLink} to={`/appointments?book=${encodeURIComponent(clinic.slug)}`} variant="contained" size="large">
                    Book online
                  </Button>
                )
                : clinic.phone && (
                  <Button href={`tel:${clinic.phone.replace(/\s+/g, '')}`} variant="contained" size="large">
                    Call to book
                  </Button>
                )}
            </Box>
            {clinic.acceptsOnlineBooking && (
              <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                You'll log in or create a patient account, then choose a dentist and time.
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Details provided by the clinic
            {clinic.updatedAt && ` · Updated ${formatDate(clinic.updatedAt)}`}
          </Typography>
        </Grid>
      </Grid>

      {page.others.length > 0 && (
        <Box component="section" aria-labelledby="others-heading" sx={{ mt: 7 }}>
          <Typography id="others-heading" variant="h5" component="h2" sx={{ mb: 2 }}>
            Other dentists in {suburb.name}
          </Typography>
          <Grid container spacing={2.5}>
            {page.others.slice(0, 6).map((other) => (
              <Grid key={other.slug} size={{ xs: 12, md: 6 }}>
                <ClinicCard clinic={other} heading="h3" />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

/**
 * Dentists — the public clinic directory at /dentists, /dentists/{state},
 * /dentists/{state}/{suburb} and /dentists/{state}/{suburb}/{clinic}. Pages
 * are prerendered from GET /api/public/clinics at build time (src/directory).
 */
const Dentists: React.FC = () => {
  const { pathname } = useLocation();
  const state = useDirectoryPage(pathname);

  if (state.status === 'loading') return <RouteFallback />;
  if (state.status === 'missing') return <NotFound />;
  if (state.status === 'error') {
    return (
      <Container component="main" maxWidth="md" sx={pageSx}>
        <Typography variant="h2" component="h1">Clinics didn't load</Typography>
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Check your connection and <Link href={pathname}>try again</Link>.
        </Typography>
      </Container>
    );
  }

  const { page } = state;
  return (
    <>
      <Seo {...page.seo} />
      {page.kind === 'country' && <CountryView page={page} />}
      {page.kind === 'state' && <StateView page={page} />}
      {page.kind === 'suburb' && <SuburbView page={page} />}
      {page.kind === 'clinic' && <ClinicView page={page} />}
    </>
  );
};

export default Dentists;
