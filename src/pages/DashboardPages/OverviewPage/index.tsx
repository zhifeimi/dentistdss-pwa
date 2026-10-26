import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../../context/auth';
import { getStatusChip } from '../../../utils/chatUtils';
import api from '../../../services';
import dayjs, { type Dayjs } from '../../../utils/dayjs';
import { UserRole, Appointment, Clinic } from '../../../types';

interface OverviewPageProps {
  userRole?: UserRole;
}

interface PatientData {
  lastVisit?: string;
  [key: string]: any;
}

// Two things each role most often comes to the dashboard to do.
const ACTIONS: Record<UserRole, { label: string; to: string }[]> = {
  PATIENT: [
    { label: 'Book a visit', to: '/appointments?book=new' },
    { label: 'Find a clinic', to: '/find-a-clinic' },
  ],
  DENTIST: [
    { label: 'Open schedule', to: '/schedule' },
    { label: 'Summarise notes', to: '/ai-summarize' },
  ],
  RECEPTIONIST: [
    { label: 'Book an appointment', to: '/appointments' },
    { label: 'Patients', to: '/patients' },
  ],
  CLINIC_ADMIN: [
    { label: 'Review approvals', to: '/approvals' },
    { label: 'Working hours', to: '/working-hours' },
  ],
  SYSTEM_ADMIN: [
    { label: 'Review approvals', to: '/approvals' },
    { label: 'Users', to: '/users' },
  ],
};

const CLOSED = new Set(['CANCELLED', 'COMPLETED', 'NO_SHOW']);

const clock = (time?: string) => (time ? dayjs(`2000-01-01T${time}`).format('h:mm a') : '');
const startsAt = (a: Appointment) => dayjs(`${a.appointmentDate}T${a.startTime || '00:00:00'}`);
const byStart = (a: Appointment, b: Appointment) => startsAt(a).valueOf() - startsAt(b).valueOf();

const greeting = (role: UserRole, firstName?: string, lastName?: string) => {
  const hour = dayjs().hour();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = role === 'DENTIST' && lastName ? `Dr ${lastName}` : firstName;
  return name ? `${part}, ${name}` : part;
};

/** A ruled row of the day ledger: time in the gutter, who and what beside it. */
const AgendaRow: React.FC<{
  appointment: Appointment;
  showDentist: boolean;
  isNext: boolean;
  isPast: boolean;
  ruled: boolean;
}> = ({ appointment, showDentist, isNext, isPast, ruled }) => (
  <Box
    component="li"
    sx={(theme) => ({
      display: 'grid',
      gridTemplateColumns: { xs: '72px 1fr', sm: '88px 1fr auto' },
      columnGap: 2,
      rowGap: 0.75,
      alignItems: 'center',
      px: { xs: 2, sm: 2.5 },
      py: 1.75,
      borderTop: ruled ? 1 : 0,
      borderColor: 'divider',
      boxShadow: isNext ? `inset 3px 0 0 ${theme.palette.primary.main}` : 'none',
      bgcolor: isNext ? alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.1) : 'transparent',
      color: isPast ? 'text.secondary' : 'text.primary',
    })}
  >
    <Box sx={{ fontVariantNumeric: 'tabular-nums' }}>
      <Typography variant="subtitle2" component="p" sx={{ color: 'inherit' }}>
        {clock(appointment.startTime) || 'Time TBC'}
      </Typography>
      {appointment.endTime && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          to {clock(appointment.endTime)}
        </Typography>
      )}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" component="p" noWrap sx={{ color: 'inherit' }}>
        {appointment.patientName || 'Patient'}
        {isNext && (
          <Box component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 700 }}>
            Next
          </Box>
        )}
      </Typography>
      <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
        {[appointment.serviceName || appointment.serviceType || appointment.reasonForVisit, showDentist && appointment.dentistName]
          .filter(Boolean)
          .join(', ') || 'Appointment'}
      </Typography>
    </Box>
    {appointment.status && (
      <Box sx={{ gridColumn: { xs: 2, sm: 'auto' }, justifySelf: 'start' }}>
        {getStatusChip(appointment.status)}
      </Box>
    )}
  </Box>
);

/** The current time, drawn in place of the rule between two rows. */
const NowLine: React.FC = () => (
  <Box
    component="li"
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '72px 1fr', sm: '88px 1fr' },
      columnGap: 2,
      alignItems: 'center',
      px: { xs: 2, sm: 2.5 },
      height: 20,
    }}
  >
    <Typography
      variant="caption"
      sx={{
        justifySelf: 'start',
        px: 0.75,
        borderRadius: 1,
        bgcolor: 'secondary.main',
        color: 'secondary.contrastText',
        fontWeight: 700,
        lineHeight: '18px',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Now, </Box>
      {dayjs().format('h:mm a')}
    </Typography>
    <Box sx={{ height: 2, bgcolor: 'secondary.main', borderRadius: 1 }} />
  </Box>
);

const Panel: React.FC<{ title: string; meta?: string; children: React.ReactNode }> = ({ title, meta, children }) => (
  <Box
    component="section"
    sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}
  >
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {meta && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {meta}
        </Typography>
      )}
    </Box>
    {children}
  </Box>
);

const Empty: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 4, borderTop: 1, borderColor: 'divider' }}>
    <Typography variant="subtitle1" component="p">
      {title}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', maxWidth: '52ch' }}>
      {text}
    </Typography>
  </Box>
);

/**
 * OverviewPage — the first screen after sign-in. Clinic roles get today's
 * appointments as a time-ruled ledger with a "now" line; patients get their
 * next visit. Two role-specific actions sit beside the greeting.
 */
const OverviewPage: React.FC<OverviewPageProps> = ({ userRole = 'PATIENT' }) => {
  const [clinicDetails, setClinicDetails] = useState<Clinic | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { currentUser } = useAuth() || {};

  // Load dashboard data based on user role
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.id) {
        setError('User information not available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Independent requests fire concurrently so the dashboard's first
        // paint waits on the slowest single request instead of the serial
        // sum. Each section keeps its own failure fallback: a failed request
        // warns and leaves that section empty without blocking the others.
        const tasks: Promise<void>[] = [];
        const today = dayjs().format('YYYY-MM-DD');

        if (currentUser?.clinicId) {
          tasks.push(
            api.clinic.getClinicById(currentUser.clinicId)
              .then((clinicData) => setClinicDetails(clinicData))
              .catch((err) => {
                console.warn('Could not load clinic data:', err);
              })
          );
        }

        if (userRole === 'DENTIST') {
          tasks.push(
            api.appointment.getDentistAppointments(currentUser.id, today)
              .then((response) => setAppointments(response || []))
              .catch((err) => {
                console.warn('Could not load dentist appointments:', err);
                setAppointments([]);
              })
          );
        } else if ((userRole === 'RECEPTIONIST' || userRole === 'CLINIC_ADMIN') && currentUser.clinicId) {
          tasks.push(
            api.appointment.getClinicAppointments(Number(currentUser.clinicId), today)
              .then((response) => setAppointments(response || []))
              .catch((err) => {
                console.warn('Could not load clinic appointments:', err);
                setAppointments([]);
              })
          );
        } else if (userRole === 'PATIENT') {
          tasks.push(
            Promise.allSettled([
              api.appointment.getPatientAppointments(currentUser.id),
              api.user.getProfile(currentUser.id),
            ]).then(([appointmentsResult, profileResult]) => {
              if (appointmentsResult.status === 'fulfilled') {
                setAppointments(appointmentsResult.value || []);
              } else {
                console.warn('Could not load patient appointments:', appointmentsResult.reason);
                setAppointments([]);
              }
              if (profileResult.status === 'fulfilled') {
                setPatientData(profileResult.value || null);
              } else {
                console.warn('Could not load patient profile:', profileResult.reason);
                setPatientData(null);
              }
            })
          );
        }

        await Promise.all(tasks);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.id, currentUser?.clinicId, userRole]);

  if (loading) {
    return (
      <Box aria-busy="true" aria-label="Loading your overview">
        <Skeleton width={160} />
        <Skeleton variant="text" sx={{ fontSize: '2rem', maxWidth: 360 }} />
        <Skeleton variant="rounded" height={88} sx={{ mt: 3 }} />
        <Skeleton variant="rounded" height={280} sx={{ mt: 3 }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const clinicName = clinicDetails?.name || currentUser?.clinicName;
  const now = dayjs();
  const showsAgenda = userRole === 'DENTIST' || userRole === 'RECEPTIONIST' || userRole === 'CLINIC_ADMIN';

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mb: { xs: 3, md: 4 },
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {now.format('dddd D MMMM')}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ mt: 0.5 }}>
            {greeting(userRole, currentUser?.firstName, currentUser?.lastName)}
          </Typography>
          {clinicName && userRole !== 'PATIENT' && (
            <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>{clinicName}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {ACTIONS[userRole]?.map((action, index) => (
            <Button
              key={action.to}
              component={RouterLink}
              to={action.to}
              variant={index === 0 ? 'contained' : 'outlined'}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Box>

      {showsAgenda && (
        <StaffToday
          appointments={appointments}
          showDentist={userRole !== 'DENTIST'}
          now={now}
          noClinic={userRole !== 'DENTIST' && !currentUser?.clinicId}
        />
      )}

      {userRole === 'PATIENT' && (
        <PatientUpcoming appointments={appointments} lastVisit={patientData?.lastVisit} now={now} />
      )}

      {userRole === 'SYSTEM_ADMIN' && (
        <Panel title="Platform">
          <Empty
            title="Approvals and accounts"
            text="Clinic and staff sign-ups waiting for a decision are under Approvals. Accounts and roles are under Users."
          />
        </Panel>
      )}
    </Box>
  );
};

const StaffToday: React.FC<{
  appointments: Appointment[];
  showDentist: boolean;
  now: Dayjs;
  noClinic: boolean;
}> = ({ appointments, showDentist, now, noClinic }) => {
  const day = [...appointments].sort(byStart);
  const open = day.filter((a) => !CLOSED.has(String(a.status)));
  const awaiting = open.filter((a) => a.status === 'REQUESTED').length;
  const confirmed = open.filter((a) => a.status === 'CONFIRMED').length;
  const next = open.find((a) => a.startTime && startsAt(a).isAfter(now));
  const nowIndex = day.findIndex((a) => !a.startTime || startsAt(a).isAfter(now));

  const stats = [
    { label: 'Booked today', value: String(open.length) },
    { label: 'Confirmed', value: String(confirmed) },
    { label: 'Awaiting confirmation', value: String(awaiting), attention: awaiting > 0 },
    {
      label: 'Next',
      value: next ? clock(next.startTime) : open.length ? 'Done for today' : 'Nothing booked',
      detail: next?.patientName,
    },
  ];

  return (
    <>
      <Box
        component="dl"
        sx={{
          m: 0,
          mb: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
          // Hairlines between cells, whichever way the grid wraps
          gap: '1px',
          bgcolor: 'divider',
        }}
      >
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: 'background.paper', px: { xs: 2, sm: 2.5 }, py: 2 }}>
            <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>
              {stat.label}
            </Typography>
            <Typography
              component="dd"
              sx={{
                m: 0,
                mt: 0.5,
                fontSize: '1.625rem',
                fontWeight: 700,
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
                color: stat.attention ? 'secondary.main' : 'text.primary',
              }}
            >
              {stat.value}
              {stat.detail && (
                <Typography component="span" variant="body2" sx={{ display: 'block', color: 'text.secondary', fontWeight: 500 }}>
                  {stat.detail}
                </Typography>
              )}
            </Typography>
          </Box>
        ))}
      </Box>

      <Panel title="Today's appointments" meta={day.length ? `${day.length} in total` : undefined}>
        {noClinic ? (
          <Empty
            title="Your account isn't linked to a clinic yet"
            text="Once your clinic approves your account, its appointments for the day will show here."
          />
        ) : day.length === 0 ? (
          <Empty
            title="No appointments today"
            text="New bookings appear here as patients make them."
          />
        ) : (
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {day.map((appointment, index) => (
              <React.Fragment key={appointment.id ?? index}>
                {index === nowIndex && <NowLine />}
                <AgendaRow
                  appointment={appointment}
                  showDentist={showDentist}
                  isNext={appointment === next}
                  ruled={index !== nowIndex}
                  isPast={Boolean(appointment.endTime) && dayjs(`${appointment.appointmentDate}T${appointment.endTime}`).isBefore(now)}
                />
              </React.Fragment>
            ))}
          </Box>
        )}
      </Panel>
    </>
  );
};

const PatientUpcoming: React.FC<{
  appointments: Appointment[];
  lastVisit?: string;
  now: Dayjs;
}> = ({ appointments, lastVisit, now }) => {
  const today = now.format('YYYY-MM-DD');
  const upcoming = appointments
    .filter((a) => Boolean(a.appointmentDate) && a.appointmentDate >= today && !CLOSED.has(String(a.status)))
    .sort(byStart);
  const [next, ...later] = upcoming;

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' }, alignItems: 'start' }}>
      <Panel title="Your next visit">
        {next ? (
          <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5 }}>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>
              {dayjs(next.appointmentDate).format('dddd D MMMM')}
            </Typography>
            <Typography sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
              {clock(next.startTime)}
              {next.endTime && ` to ${clock(next.endTime)}`}
            </Typography>
            <Box component="dl" sx={{ m: 0, mt: 2, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.75 }}>
              {[
                ['Clinic', next.clinicName],
                ['Dentist', next.dentistName],
                ['For', next.serviceName || next.serviceType || next.reasonForVisit],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <React.Fragment key={label}>
                    <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>
                      {label}
                    </Typography>
                    <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }}>
                      {value}
                    </Typography>
                  </React.Fragment>
                ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {next.status && getStatusChip(next.status)}
              <Button component={RouterLink} to="/appointments" size="small">
                Manage appointments
              </Button>
            </Box>
          </Box>
        ) : (
          <Empty
            title="No visits booked"
            text="Book a check-up with a clinic near you. Most clinics recommend one every six to twelve months."
          />
        )}
        {lastVisit && (
          <Typography variant="body2" sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, borderTop: 1, borderColor: 'divider', color: 'text.secondary' }}>
            Last visit {dayjs(lastVisit).isValid() ? dayjs(lastVisit).format('D MMMM YYYY') : lastVisit}
          </Typography>
        )}
      </Panel>

      <Panel title="Later" meta={later.length ? `${later.length} booked` : undefined}>
        {later.length === 0 ? (
          <Empty title="Nothing else booked" text="Visits you book after your next one will be listed here." />
        ) : (
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {later.map((appointment, index) => (
              <Box
                component="li"
                key={appointment.id ?? index}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '88px 1fr', sm: '104px 1fr auto' },
                  columnGap: 2,
                  rowGap: 0.75,
                  alignItems: 'center',
                  px: { xs: 2, sm: 2.5 },
                  py: 1.75,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  <Typography variant="subtitle2" component="p">
                    {dayjs(appointment.appointmentDate).format('ddd D MMM')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {clock(appointment.startTime)}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" component="p" noWrap>
                    {appointment.serviceName || appointment.serviceType || 'Appointment'}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                    {[appointment.dentistName, appointment.clinicName].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                {appointment.status && (
                  <Box sx={{ gridColumn: { xs: 2, sm: 'auto' }, justifySelf: 'start' }}>
                    {getStatusChip(appointment.status)}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Panel>
    </Box>
  );
};

export default OverviewPage;
