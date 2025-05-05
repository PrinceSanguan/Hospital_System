import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserData } from '@/types';
import dayjs from 'dayjs';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Schedule {
    id: number;
  doctor_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  specific_date?: string;
  max_appointments?: number;
}

interface Appointment {
    id: number;
  patient: {
    id: number;
    name: string;
  };
  appointment_date: string;
  appointment_time?: string;
  status: string;
  notes?: string;
  reason?: string;
}

interface DashboardProps {
  user: UserData;
  upcomingAppointments: Appointment[];
  pendingAppointments: Appointment[];
  schedule: Schedule[];
    stats: {
    total_patients: number;
    upcoming_appointments: number;
    completed_appointments: number;
    pending_appointments: number;
  };
}

export default function Dashboard({
  user,
  upcomingAppointments = [],
  pendingAppointments = [],
  schedule = [],
  stats = { total_patients: 0, upcoming_appointments: 0, completed_appointments: 0, pending_appointments: 0 }
}: DashboardProps) {
  // Debug: Log schedule data received from backend
  console.log('Schedule data received:', schedule);

  // Set up state to track processed schedule data
  const [processedSchedule, setProcessedSchedule] = useState<Schedule[]>([]);

  // Process schedule data when component mounts or when schedule changes
  useEffect(() => {
    if (Array.isArray(schedule) && schedule.length > 0) {
      // Process schedule data to ensure consistent format
      const processed = schedule.map(item => {
        // If specific_date exists, make sure it's normalized
        if (item.specific_date) {
          // Create a standardized date format
          const dateString = dayjs(item.specific_date).format('YYYY-MM-DD');
          return { ...item, specific_date: dateString };
        }
        return item;
      });

      setProcessedSchedule(processed);
      console.log('Processed schedule data:', processed);
    }
  }, [schedule]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responseAction, setResponseAction] = useState<'approve' | 'deny' | null>(null);

  // Helper function to get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper function to get day of week for first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Check if date has a specific schedule (exact date match)
  const hasSpecificDateSchedule = (date: Date) => {
    if (!date || !Array.isArray(processedSchedule) || processedSchedule.length === 0) return false;

    const dateString = dayjs(date).format('YYYY-MM-DD');

    return processedSchedule.some(scheduleItem =>
      scheduleItem.specific_date === dateString && scheduleItem.is_available
    );
  };

  // Check if date has a recurring weekly schedule
  const hasWeeklySchedule = (date: Date) => {
    if (!date || !Array.isArray(processedSchedule) || processedSchedule.length === 0) return false;

    const dayOfWeek = date.getDay();

    return processedSchedule.some(scheduleItem =>
      scheduleItem.day_of_week === dayOfWeek &&
      scheduleItem.is_available &&
      !scheduleItem.specific_date
    );
  };

  // Check if date has schedule (either specific or weekly)
  const hasSchedule = (date: Date) => {
    return hasSpecificDateSchedule(date) || hasWeeklySchedule(date);
  };

  // Check if date has appointments - include both pending and confirmed
  const hasAppointments = (date: Date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');
    // Try substring for a date-time field or direct comparison for date-only fields
    const compareDate = (appDate: string) => {
      if (appDate.includes('T') || appDate.includes(' ')) {
        return appDate.substring(0, 10) === dateString;
      }
      return appDate === dateString;
    };

    return upcomingAppointments.some(appointment => compareDate(appointment.appointment_date))
      || pendingAppointments.some(appointment => compareDate(appointment.appointment_date));
  };

  // Get appointments for a specific date - include all appointments (pending and confirmed)
  const getAppointmentsForDate = (date: Date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');

    // Function to compare dates accounting for various formats
    const compareDate = (appDate: string) => {
      if (appDate.includes('T') || appDate.includes(' ')) {
        return appDate.substring(0, 10) === dateString;
      }
      return appDate === dateString;
    };

    // Get appointments from both pending and confirmed lists
    const upcomingForDate = upcomingAppointments.filter(appointment =>
      compareDate(appointment.appointment_date)
    );

    const pendingForDate = pendingAppointments.filter(appointment =>
      compareDate(appointment.appointment_date)
    );

    // Combine both arrays, removing any duplicates by ID
    const allAppointments = [...upcomingForDate, ...pendingForDate];
    const uniqueAppointments = Array.from(new Map(allAppointments.map(item => [item.id, item])).values());

    // Sort by time if available
    return uniqueAppointments.sort((a, b) => {
      if (a.appointment_time && b.appointment_time) {
        return a.appointment_time.localeCompare(b.appointment_time);
      }
      // If no time, sort by status (pending first)
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return 0;
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateAppointments = getAppointmentsForDate(date);
    setSelectedDateAppointments(dateAppointments);
    setShowAppointmentDialog(true);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
    };

  // Format date
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MMM D, YYYY');
  };

  // Format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';

    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle appointment response
  const handleAppointmentResponse = (appointment: Appointment, action: 'approve' | 'deny') => {
    setSelectedAppointment(appointment);
    setResponseAction(action);
    setResponseNotes('');
    setShowResponseDialog(true);
  };

  // Submit appointment response
  const submitAppointmentResponse = () => {
    if (!selectedAppointment || !responseAction) return;

    const status = responseAction === 'approve' ? 'confirmed' : 'cancelled';

    router.post(route('doctor.appointments.updateStatus'), {
      appointment_id: selectedAppointment.id,
      status: status,
      notes: responseNotes
    }, {
      onSuccess: () => {
        setShowResponseDialog(false);
        setSelectedAppointment(null);
        setResponseAction(null);
        setResponseNotes('');
        // Redirect to dashboard to refresh the data
        window.location.href = route('doctor.dashboard');
      }
    });
  };

  // Direct approve/deny without dialog
  const directAppointmentResponse = (appointment: Appointment, action: 'approve' | 'deny') => {
    const status = action === 'approve' ? 'confirmed' : 'cancelled';

    router.post(route('doctor.appointments.updateStatus'), {
      appointment_id: appointment.id,
      status: status
    }, {
      onSuccess: () => {
        // Redirect to dashboard to refresh the data
        window.location.href = route('doctor.dashboard');
      }
    });
  };

  return (
    <DoctorLayout user={user}>
      <Head title="Dashboard" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_patients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcoming_appointments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed_appointments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending_appointments}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Appointment Requests */}
          {pendingAppointments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Appointment Requests</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.patient.name}</TableCell>
                          <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                          <TableCell>{formatTime(appointment.appointment_time)}</TableCell>
                          <TableCell>{appointment.reason || 'N/A'}</TableCell>
                          <TableCell>{appointment.notes || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => directAppointmentResponse(appointment, 'approve')}
                              >
                                <CheckCircle size={16} />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => directAppointmentResponse(appointment, 'deny')}
                              >
                                <XCircle size={16} />
                                Deny
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Calendar</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                  >
                    Previous
                  </Button>
                  <div className="font-medium">
                    {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">Your upcoming appointments and schedule</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div
                    key={i}
                    className="text-center font-medium p-2 text-sm text-gray-500"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {generateCalendarDays().map((date, i) => (
                  <div
                    key={i}
                    className={`
                      min-h-[80px] p-1 border rounded-md
                      ${!date ? 'bg-gray-50' : 'bg-white cursor-pointer hover:bg-gray-50'}
                      ${date && dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? 'border-blue-500' : 'border-gray-200'}
                    `}
                    onClick={() => date && handleDateClick(date)}
                  >
                    {date && (
                      <>
                        <div className="flex justify-between items-start">
                          <span className={`
                            text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center
                            ${dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? 'bg-blue-500 text-white' : ''}
                          `}>
                            {date.getDate()}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {hasSpecificDateSchedule(date) && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200 text-[10px]"
                              >
                                Scheduled
                              </Badge>
                            )}
                            {!hasSpecificDateSchedule(date) && hasWeeklySchedule(date) && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-800 border-blue-200 text-[10px]"
                              >
                                Weekly
                              </Badge>
                            )}
                            {hasAppointments(date) && (
                              <Badge
                                className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]"
                              >
                                {getAppointmentsForDate(date).length} Appt
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appointment Dialog */}
          <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Appointments for {selectedDate && dayjs(selectedDate).format('MMMM D, YYYY')}
                </DialogTitle>
                <DialogDescription>
                  {selectedDateAppointments.length
                    ? `You have ${selectedDateAppointments.length} appointment(s) on this day.`
                    : 'You have no appointments on this day.'}
                  {selectedDate && hasSchedule(selectedDate) && (
                    <div className="mt-1">
                      <span className="text-green-600">
                        {hasSpecificDateSchedule(selectedDate) ? 'You have specifically scheduled this date.' : 'This is part of your weekly schedule.'}
                      </span>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              {selectedDateAppointments.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-sm font-semibold mb-1">Appointment Status:</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Confirmed: {selectedDateAppointments.filter(a => a.status.toLowerCase() === 'confirmed').length}
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending: {selectedDateAppointments.filter(a => a.status.toLowerCase() === 'pending').length}
                    </Badge>
                  </div>
                </div>
              )}

              {selectedDateAppointments.length > 0 && (
                <div className="space-y-4">
                  {selectedDateAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{appointment.patient.name}</h3>
                          <p className="text-sm text-gray-500">
                            {appointment.appointment_time ? formatTime(appointment.appointment_time) : 'No time specified'}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                      {appointment.reason && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Reason:</h4>
                          <p className="text-sm text-gray-600">{appointment.reason}</p>
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Notes:</h4>
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                      {appointment.status === 'pending' && (
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => directAppointmentResponse(appointment, 'approve')}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => directAppointmentResponse(appointment, 'deny')}
                          >
                            <XCircle size={16} />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Response Dialog */}
          <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {responseAction === 'approve' ? 'Approve Appointment' : 'Deny Appointment'}
                </DialogTitle>
                <DialogDescription>
                  {responseAction === 'approve'
                    ? 'You are about to approve this appointment request.'
                    : 'You are about to deny this appointment request.'}
                </DialogDescription>
              </DialogHeader>

              {selectedAppointment && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {responseAction === 'approve'
                        ? 'The patient will be notified that their appointment has been confirmed.'
                        : 'The patient will be notified that their appointment has been denied.'}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <p><strong>Patient:</strong> {selectedAppointment.patient.name}</p>
                    <p><strong>Date:</strong> {formatDate(selectedAppointment.appointment_date)}</p>
                    <p><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</p>
                    {selectedAppointment.reason && (
                      <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
                    )}
                    {selectedAppointment.notes && (
                      <p><strong>Patient Notes:</strong> {selectedAppointment.notes}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      {responseAction === 'approve' ? 'Additional instructions (optional)' : 'Reason for denial (optional)'}
                    </label>
                    <Textarea
                      id="notes"
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder={responseAction === 'approve'
                        ? 'Add any special instructions for the patient...'
                        : 'Explain why you are denying this appointment request...'}
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant={responseAction === 'approve' ? 'default' : 'destructive'}
                  onClick={submitAppointmentResponse}
                >
                  {responseAction === 'approve' ? 'Approve Appointment' : 'Deny Appointment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DoctorLayout>
  );
}

