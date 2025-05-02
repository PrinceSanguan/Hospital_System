import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Schedule {
    id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Appointment {
    id: number;
  patient: {
    id: number;
    name: string;
  };
  appointment_date: string;
  status: string;
  notes?: string;
}

interface DashboardProps {
  user: UserData;
  upcomingAppointments: Appointment[];
  schedule: Schedule[];
    stats: {
    total_patients: number;
    upcoming_appointments: number;
    completed_appointments: number;
  };
}

export default function Dashboard({
  user,
  upcomingAppointments = [],
  schedule = [],
  stats = { total_patients: 0, upcoming_appointments: 0, completed_appointments: 0 }
}: DashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);

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

  // Check if date has schedule
  const hasSchedule = (date: Date) => {
    const dayOfWeek = date.getDay();
    return schedule.some(scheduleItem =>
      scheduleItem.day_of_week === dayOfWeek && scheduleItem.is_available
    );
  };

  // Check if date has appointments
  const hasAppointments = (date: Date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');
    return upcomingAppointments.some(appointment =>
      appointment.appointment_date === dateString
    );
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');
    return upcomingAppointments.filter(appointment =>
      appointment.appointment_date === dateString
    );
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

    return (
    <DoctorLayout user={user}>
      <Head title="Dashboard" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                        </div>

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
                            {hasSchedule(date) && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200 text-[10px]"
                              >
                                Available
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
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  Appointments for {selectedDate ? dayjs(selectedDate).format('MMMM D, YYYY') : ''}
                </DialogTitle>
                <DialogDescription>
                  {selectedDateAppointments.length
                    ? `You have ${selectedDateAppointments.length} appointment(s) scheduled for this day.`
                    : 'You have no appointments scheduled for this day.'}
                </DialogDescription>
              </DialogHeader>

              {selectedDateAppointments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDateAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.patient?.name}
                        </TableCell>
                        <TableCell>
                          {dayjs(appointment.appointment_date).format('h:mm A')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {appointment.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DoctorLayout>
    );
}
