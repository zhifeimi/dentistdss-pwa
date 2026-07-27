import React, { useState, useEffect, MouseEvent } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useSchedule } from '../hooks/useSchedule';
import type { UserRole } from '../types/common';

interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date | string;
  end: Date | string;
  date?: Date | string;
  type?: string;
  status?: string;
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  resource?: {
    type?: string;
    status?: string;
    dentistName?: string;
    notes?: string;
  };
}

interface AppointmentCalendarProps {
  viewType?: 'day' | 'week' | 'month';
  onAppointmentClick?: (appointment: CalendarEvent) => void;
  onNewAppointment?: () => void;
  userRole?: UserRole;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  viewType = 'month',
  onAppointmentClick,
  onNewAppointment,
  userRole = 'PATIENT'
}) => {
  const {
    availability,
    loading,
    error,
    selectedDate,
    calendarView,
    calendarEvents,
    changeSelectedDate,
    setCalendarView,
    getSlotsForDate
  } = useSchedule();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEvent | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState<boolean>(false);

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const navigateDate = (direction: number): void => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    changeSelectedDate(newDate);
  };

  const getStatusColor = (status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'REQUESTED':
      case 'RESCHEDULED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date: Date | null): void => {
    if (!date) return;
    changeSelectedDate(date);
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0) {
      setSelectedAppointment(dayAppointments[0]);
      setShowAppointmentDialog(true);
    } else {
      setSelectedAppointment(null);
      setShowAppointmentDialog(false);
    }
  };

  const handleAppointmentClick = (appointment: CalendarEvent): void => {
    setSelectedAppointment(appointment);
    setShowAppointmentDialog(true);
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const renderMonthView = (): React.ReactElement => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box>
        {/* Week day headers */}
        <Grid container sx={{ mb: 1 }}>
          {weekDays.map(day => (
            <Grid size={{ xs: 12 / 7 }} key={day}>
              <Typography
                variant="subtitle2"
                align="center"
                sx={{ py: 1, fontWeight: 'bold' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar grid */}
        <Grid container spacing={1}>
          {days.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            const isSelected = date && date.toDateString() === selectedDate.toDateString();

            return (
              <Grid size={1} key={index}>
                <Card
                  sx={{
                    minHeight: 100,
                    cursor: date ? 'pointer' : 'default',
                    bgcolor: isSelected ? 'primary.light' :
                      isToday ? 'secondary.light' :
                        date ? 'background.paper' : 'action.hover',
                    opacity: date ? 1 : 0.3,
                    border: isToday ? 2 : 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                  }}
                  onClick={() => handleDateClick(date)}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    {date && (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {date.getDate()}
                        </Typography>
                        {dayAppointments.map((apt, idx) => {
                          const timeToFormat = apt.date || apt.start;
                          const timeString = timeToFormat ? formatTime(new Date(timeToFormat)) : '';
                          const typeString = apt.type || apt.resource?.type || '';

                          return (
                            <Chip
                              key={idx}
                              label={`${timeString} ${typeString}`}
                              size="small"
                              color={getStatusColor(apt.status || apt.resource?.status)}
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                mb: 0.5,
                                display: 'block',
                                '& .MuiChip-label': { px: 1 }
                              }}
                              onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                handleAppointmentClick(apt);
                              }}
                            />
                          );
                        })}
                        {dayAppointments.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{dayAppointments.length - 2} more
                          </Typography>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderDayView = (): React.ReactElement => {
    const dayAppointments = getAppointmentsForDate(selectedDate);
    const timeSlots: Date[] = [];

    // Generate time slots from 8 AM to 6 PM
    for (let hour = 8; hour < 18; hour++) {
      timeSlots.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, 0));
      timeSlots.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, 30));
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {selectedDate.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>

        <List>
          {timeSlots.map((timeSlot, index) => {
            // Find the event that starts at this time slot
            const slotEvent = dayAppointments.find(event => {
              const eventStart = new Date(event.start);
              return eventStart.getHours() === timeSlot.getHours() &&
                eventStart.getMinutes() === timeSlot.getMinutes();
            });

            return (
              <ListItem
                key={index}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: slotEvent ? 'action.hover' : 'transparent'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1 }}>
                    {formatTime(timeSlot)}
                  </Box>
                  {slotEvent ? (
                    <Box>
                      <Typography variant="body2" fontWeight="medium" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {slotEvent.title} - {slotEvent.resource?.type || 'N/A'}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={slotEvent.resource?.status || 'Unknown'}
                          size="small"
                          color={getStatusColor(slotEvent.resource?.status)}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Available
                    </Typography>
                  )}
                </Box>
                {slotEvent && (
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleAppointmentClick(slotEvent)}
                    >
                      <EditIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigateDate(-1)}>
          <ChevronLeftIcon />
        </IconButton>

        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {viewType === 'month'
            ? currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
            : currentDate.toLocaleDateString()
          }
        </Typography>

        <IconButton onClick={() => navigateDate(1)}>
          <ChevronRightIcon />
        </IconButton>

        <Button
          startIcon={<TodayIcon />}
          onClick={() => setCurrentDate(new Date())}
          sx={{ ml: 2 }}
        >
          Today
        </Button>

        {(userRole === 'dentist' || userRole === 'receptionist') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewAppointment}
            sx={{ ml: 1 }}
          >
            New Appointment
          </Button>
        )}
      </Box>

      {/* Calendar Content */}
      {viewType === 'month' ? renderMonthView() : renderDayView()}

      {/* Appointment Details Dialog */}
      <Dialog
        open={showAppointmentDialog}
        onClose={() => setShowAppointmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon />
            Appointment Details
          </Box>
        </DialogTitle>

        {selectedAppointment && (
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Patient / Event Title</Typography>
                <Typography variant="body1">{selectedAppointment.title}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Associated Dentist</Typography>
                <Typography variant="body1">{selectedAppointment.resource?.dentistName || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                <Typography variant="body1">
                  {new Date(selectedAppointment.start).toLocaleDateString()} at {formatTime(new Date(selectedAppointment.start))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                <Typography variant="body1">
                  {/* Calculate duration from start and end times */}
                  {selectedAppointment.start && selectedAppointment.end ?
                    `${(new Date(selectedAppointment.end).getTime() - new Date(selectedAppointment.start).getTime()) / (1000 * 60)} minutes`
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{selectedAppointment.resource?.type || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedAppointment.resource?.status || 'Unknown'}
                  color={getStatusColor(selectedAppointment.resource?.status)}
                  size="small"
                />
              </Grid>
              {selectedAppointment.resource?.notes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{selectedAppointment.resource.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}

        <DialogActions>
          <Button onClick={() => setShowAppointmentDialog(false)}>
            Close
          </Button>
          {(userRole === 'dentist' || userRole === 'receptionist') && (
            <>
              <Button startIcon={<EditIcon />}>
                Edit
              </Button>
              <Button color="error" startIcon={<DeleteIcon />}>
                Cancel
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AppointmentCalendar;
