import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { UserData } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Alert } from '@/components/ui/alert';

interface ScheduleData {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
  notes?: string;
  specific_date?: string;
}

interface Props {
  user: UserData;
  schedules: ScheduleData[];
  flash?: {
    success?: string;
    error?: string;
  };
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DateTimeSlots {
  date: Date;
  timeSlots: TimeSlot[];
}

interface ScheduleFormData {
  dateTimeSlots: DateTimeSlots[];
  is_available: boolean;
  max_appointments: number;
  notes: string;
}

const Schedule: React.FC<Props> = ({ schedules, flash }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [formData, setFormData] = useState<ScheduleFormData>({
    dateTimeSlots: [],
    is_available: true,
    max_appointments: 10,
    notes: '',
  });

  // Group schedules by date for display in list view
  const groupedSchedules = useMemo(() => {
    const groupedByDate: Record<string, ScheduleData[]> = {};

    schedules.forEach(schedule => {
      // Use specific_date as the key, or day_of_week if no specific date
      const key = schedule.specific_date || `day_${schedule.day_of_week}`;

      if (!groupedByDate[key]) {
        groupedByDate[key] = [];
      }

      groupedByDate[key].push(schedule);
    });

    // Sort each group by start time
    Object.keys(groupedByDate).forEach(key => {
      groupedByDate[key].sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
    });

    return groupedByDate;
  }, [schedules]);

  // Helper function to convert 24-hour format to 12-hour for display
  const formatTimeToAmPm = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') return '';

    // If timeStr is already in HH:MM format
    let hours = 0;
    let minutes = 0;

    if (timeStr.length >= 5 && timeStr.indexOf(':') === 2) {
      const [h, m] = timeStr.substring(0, 5).split(':');
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Add a time slot to a specific date
  const addTimeSlot = (dateIndex: number) => {
    setFormData(prev => {
      const updatedDateTimeSlots = [...prev.dateTimeSlots];

      // If dateIndex is valid, add a time slot to that specific date
      if (dateIndex >= 0 && dateIndex < updatedDateTimeSlots.length) {
        updatedDateTimeSlots[dateIndex] = {
          ...updatedDateTimeSlots[dateIndex],
          timeSlots: [
            ...updatedDateTimeSlots[dateIndex].timeSlots,
            { startTime: '09:00', endTime: '17:00' }
          ]
        };
      }

      return {
        ...prev,
        dateTimeSlots: updatedDateTimeSlots
      };
    });
  };

  // Remove a time slot from a specific date
  const removeTimeSlot = (dateIndex: number, timeSlotIndex: number) => {
    setFormData(prev => {
      const updatedDateTimeSlots = [...prev.dateTimeSlots];

      if (dateIndex >= 0 && dateIndex < updatedDateTimeSlots.length) {
        updatedDateTimeSlots[dateIndex] = {
          ...updatedDateTimeSlots[dateIndex],
          timeSlots: updatedDateTimeSlots[dateIndex].timeSlots.filter((_, i) => i !== timeSlotIndex)
        };
      }

      return {
        ...prev,
        dateTimeSlots: updatedDateTimeSlots
      };
    });
  };

  // Update a time slot for a specific date
  const updateTimeSlot = (dateIndex: number, timeSlotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => {
      const updatedDateTimeSlots = [...prev.dateTimeSlots];

      if (dateIndex >= 0 && dateIndex < updatedDateTimeSlots.length) {
        const timeSlots = [...updatedDateTimeSlots[dateIndex].timeSlots];

        if (timeSlotIndex >= 0 && timeSlotIndex < timeSlots.length) {
          timeSlots[timeSlotIndex] = {
            ...timeSlots[timeSlotIndex],
            [field]: value
          };

          updatedDateTimeSlots[dateIndex] = {
            ...updatedDateTimeSlots[dateIndex],
            timeSlots: timeSlots
          };
        }
      }

      return {
        ...prev,
        dateTimeSlots: updatedDateTimeSlots
      };
    });
  };

  // Remove a date
  const removeDate = (dateIndex: number) => {
    setFormData(prev => ({
      ...prev,
      dateTimeSlots: prev.dateTimeSlots.filter((_, i) => i !== dateIndex)
    }));
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      dateTimeSlots: [],
      is_available: true,
      max_appointments: 10,
      notes: '',
    });
    setEditingId(null);
    setSelectedSingleDate(null);
    setErrors({});
    setShowDialog(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate form
    const validationErrors: Record<string, string> = {};

    if (formData.dateTimeSlots.length === 0) {
      validationErrors.dates = 'Please select at least one date';
    }

    // Validate each date has at least one time slot
    formData.dateTimeSlots.forEach((dateTimeSlot, dateIndex) => {
      if (dateTimeSlot.timeSlots.length === 0) {
        validationErrors[`date_${dateIndex}`] = `Please add at least one time slot for ${format(dateTimeSlot.date, 'MMM d, yyyy')}`;
      }

      // Validate time slots
      dateTimeSlot.timeSlots.forEach((slot, slotIndex) => {
        if (slot.startTime >= slot.endTime) {
          validationErrors[`dateTimeSlot_${dateIndex}_${slotIndex}`] = 'End time must be after start time';
        }
      });
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Process form data for submission
      const schedulesToSubmit = formData.dateTimeSlots.flatMap(dateTimeSlot => {
        return dateTimeSlot.timeSlots.map(timeSlot => ({
          day_of_week: dateTimeSlot.date.getDay(),
          start_time: timeSlot.startTime,
          end_time: timeSlot.endTime,
          is_available: formData.is_available,
          max_appointments: Number(formData.max_appointments),
          notes: formData.notes,
          specific_date: format(dateTimeSlot.date, 'yyyy-MM-dd')
        }));
      });

      // Submit the data
      if (editingId) {
        // If editing a specific schedule, update just that one
        const scheduleToUpdate = schedulesToSubmit[0];
        router.put(`/doctor/schedule/${editingId}`, scheduleToUpdate, {
          onSuccess: () => {
            resetForm();
            setIsSubmitting(false);
          },
          onError: (errors: Record<string, string>) => {
            console.error('Error updating schedule:', errors);
            setErrors(errors);
            setIsSubmitting(false);
          }
        });
      } else {
        // Otherwise, create multiple schedules
        router.post('/doctor/schedule/multiple', { schedules: schedulesToSubmit }, {
          onSuccess: () => {
            resetForm();
            setIsSubmitting(false);
          },
          onError: (errors: Record<string, string>) => {
            console.error('Error creating schedules:', errors);
            setErrors(errors);
            setIsSubmitting(false);
          }
        });
      }
    } catch (error) {
      console.error('Error processing form data:', error);
      setErrors({
        general: 'An error occurred while processing your request. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Handle edit schedule
  const handleEdit = (schedule: ScheduleData) => {
    // Convert schedule data to form data
    let date;

    // If there's a specific date, use it
    if (schedule.specific_date) {
      date = new Date(schedule.specific_date);
      setSelectedSingleDate(date);
    } else {
      // Otherwise calculate from day of week
      date = new Date();
      date.setDate(date.getDate() + (schedule.day_of_week - date.getDay() + 7) % 7);
      setSelectedSingleDate(null);
    }

    setFormData({
      dateTimeSlots: [
        {
          date,
          timeSlots: [{
            startTime: schedule.start_time.substring(0, 5), // Extract HH:MM part
            endTime: schedule.end_time.substring(0, 5)      // Extract HH:MM part
          }]
        }
      ],
      is_available: schedule.is_available,
      max_appointments: schedule.max_appointments,
      notes: schedule.notes || '',
    });

    setEditingId(schedule.id);
    setShowDialog(true);
  };

  // Handle delete schedule
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      router.delete(`/doctor/schedule/${id}`);
    }
  };

  // Open the dialog with a specific date
  const openDialogWithDate = (date: Date) => {
    setSelectedSingleDate(date);
    setFormData({
      dateTimeSlots: [
        {
          date,
          timeSlots: [{ startTime: '09:00', endTime: '17:00' }]
        }
      ],
      is_available: true,
      max_appointments: 10,
      notes: '',
    });
    setEditingId(null);
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head title="Manage Your Schedule" />

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">Manage Your Schedule</h1>
          <div>
            <Link href={route('staff.doctor-schedules.index')} className="btn btn-outline-primary me-2">
              <i className="bi bi-calendar-plus"></i> Manage Doctor Schedules
            </Link>
            <Button onClick={() => setShowDialog(true)}>
              <i className="bi bi-plus"></i> Add Schedule
            </Button>
          </div>
        </div>

        {flash?.success && (
          <Alert className="mb-4">
            {flash.success}
          </Alert>
        )}

        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`border-transparent px-3 py-2 ${activeTab === 'calendar'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('calendar')}
              >
                Calendar View
              </button>
              <button
                className={`border-transparent px-3 py-2 ${activeTab === 'list'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('list')}
              >
                List View
              </button>
            </nav>
          </div>

          {activeTab === 'calendar' && (
            <div className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="alert alert-info mb-4">
                    <strong>Your Schedule</strong> - Calendar view of your availability. Click on a date to add or edit your schedule for that day.
                    <br />
                    <small>
                      <strong>Note:</strong> You can manage doctor schedules by clicking the "Manage Doctor Schedules" button above.
                    </small>
                  </div>

                  <div className="flex flex-col items-center">
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          // When a date is clicked, open the dialog to add times for that date
                          openDialogWithDate(date);
                        }
                      }}
                      className="rounded-md border cursor-pointer"
                      classNames={{
                        day_today: "bg-primary/10 text-primary font-bold",
                      }}
                      modifiers={{
                        booked: (date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const dayOfWeek = date.getDay();

                          // Check if there's a specific schedule for this date
                          const hasSpecificSchedule = schedules.some(s => s.specific_date === dateStr);

                          // Check if there's a recurring schedule for this day of the week
                          const hasRecurringSchedule = schedules.some(s => s.day_of_week === dayOfWeek && !s.specific_date);

                          return hasSpecificSchedule || hasRecurringSchedule;
                        }
                      }}
                      modifiersStyles={{
                        booked: { backgroundColor: '#ecfdf5', color: '#065f46', fontWeight: 'bold' }
                      }}
                    />
                    <div className="text-sm text-gray-500 mt-4">
                      <p className="mb-2">
                        <span className="inline-block w-3 h-3 bg-green-100 rounded-full mr-2"></span>
                        Green dates have scheduled availability
                      </p>
                      <p className="mb-2">
                        <span className="inline-block w-3 h-3 bg-primary/10 rounded-full mr-2"></span>
                        Today's date
                      </p>
                      <p className="font-medium text-center mt-3">Click on any date to add or edit your schedule</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule List</CardTitle>
                  <CardDescription>
                    All your scheduled days and time slots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Max Appointments</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(groupedSchedules).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                            No schedules found. Add your first schedule using the "Add Schedule" button.
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(groupedSchedules).map(([dateKey, dateSchedules]) => {
                          // Get date information from the first schedule in the group
                          const firstSchedule = dateSchedules[0];
                          const isSpecificDate = !!firstSchedule.specific_date;
                          const displayDate = isSpecificDate
                            ? format(new Date(firstSchedule.specific_date!), 'MMM d, yyyy')
                            : dayNames[firstSchedule.day_of_week];

                          // Format all time slots for this date
                          const timeSlots = dateSchedules.map(schedule =>
                            `${formatTimeToAmPm(schedule.start_time)} - ${formatTimeToAmPm(schedule.end_time)}`
                          ).join(', ');

                          return (
                            <TableRow key={dateKey}>
                              <TableCell className="font-medium">
                                {displayDate}
                              </TableCell>
                              <TableCell>
                                {timeSlots}
                              </TableCell>
                              <TableCell>{firstSchedule.max_appointments}</TableCell>
                              <TableCell>
                                <Badge className={firstSchedule.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                  {firstSchedule.is_available ? 'Available' : 'Unavailable'}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {firstSchedule.notes || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {dateSchedules.map(schedule => (
                                    <div key={schedule.id} className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(schedule)}
                                        className="h-7 px-2 text-xs"
                                        title="Edit this time slot"
                                      >
                                        {formatTimeToAmPm(schedule.start_time)}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(schedule.id)}
                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                                        title="Delete this time slot"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="w-full max-w-[95%] sm:max-w-[500px] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId
                  ? 'Edit Schedule'
                  : selectedSingleDate
                    ? <>Schedule for <span className="text-primary">{format(selectedSingleDate, 'EEEE, MMMM d, yyyy')}</span></>
                    : 'Add New Schedule'
                }
              </DialogTitle>
              <DialogDescription>
                {selectedSingleDate
                  ? 'Set your availability times for this specific date.'
                  : 'Set your availability by selecting dates. Each date can have its own set of time slots.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!selectedSingleDate && (
                <div className="space-y-2">
                  <Label htmlFor="calendar">Select Dates</Label>
                  <div className="border rounded-md p-2 sm:p-4 overflow-x-auto">
                    <Calendar
                      mode="multiple"
                      selected={formData.dateTimeSlots.map(dt => dt.date)}
                      onSelect={(dates: Date[] | undefined) => {
                        if (dates) {
                          // Create a new dateTimeSlots array based on selected dates
                          const updatedDateTimeSlots: DateTimeSlots[] = [];

                          // Keep existing dates and their time slots if still selected
                          formData.dateTimeSlots.forEach(existingDateTimeSlot => {
                            const existingDateStr = format(existingDateTimeSlot.date, 'yyyy-MM-dd');
                            const stillSelected = dates.some(date =>
                              format(date, 'yyyy-MM-dd') === existingDateStr
                            );

                            if (stillSelected) {
                              updatedDateTimeSlots.push(existingDateTimeSlot);
                            }
                          });

                          // Add new dates with default time slots
                          dates.forEach(date => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const alreadyExists = updatedDateTimeSlots.some(dt =>
                              format(dt.date, 'yyyy-MM-dd') === dateStr
                            );

                            if (!alreadyExists) {
                              updatedDateTimeSlots.push({
                                date,
                                timeSlots: [{ startTime: '09:00', endTime: '17:00' }]
                              });
                            }
                          });

                          setFormData(prev => ({
                            ...prev,
                            dateTimeSlots: updatedDateTimeSlots
                          }));
                        }
                      }}
                      className="rounded-md border w-full"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.7rem] sm:text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-8 w-8 sm:h-9 sm:w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100",
                      }}
                    />
                  </div>
                  {errors.dates && (
                    <p className="text-red-500 text-sm">{errors.dates}</p>
                  )}
                </div>
              )}

              {formData.dateTimeSlots.length > 0 && (
                <div className="space-y-6">
                  {formData.dateTimeSlots.map((dateTimeSlot, dateIndex) => (
                    <div
                      key={dateIndex}
                      className="p-4 border rounded-md bg-gray-50 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-primary">
                          {format(dateTimeSlot.date, 'EEEE, MMMM d, yyyy')}
                        </h3>
                        {!selectedSingleDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDate(dateIndex)}
                            className="h-6 w-6"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      {errors[`date_${dateIndex}`] && (
                        <p className="text-red-500 text-xs">{errors[`date_${dateIndex}`]}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Time Slots</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addTimeSlot(dateIndex)}
                            className="h-7 text-xs px-2 py-1"
                          >
                            <X className="h-3 w-3 mr-1" /> Add Time
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {dateTimeSlot.timeSlots.map((slot, timeSlotIndex) => (
                            <div key={timeSlotIndex} className="p-2 border rounded bg-white">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Slot #{timeSlotIndex + 1}</span>
                                {dateTimeSlot.timeSlots.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTimeSlot(dateIndex, timeSlotIndex)}
                                    className="h-5 w-5"
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                                <div className="grow">
                                  <Label htmlFor={`startTime-${dateIndex}-${timeSlotIndex}`} className="text-xs">
                                    Start Time <span className="text-gray-500">(24-hour format)</span>
                                  </Label>
                                  <Input
                                    id={`startTime-${dateIndex}-${timeSlotIndex}`}
                                    type="time"
                                    value={slot.startTime}
                                    onChange={e => updateTimeSlot(dateIndex, timeSlotIndex, 'startTime', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="grow">
                                  <Label htmlFor={`endTime-${dateIndex}-${timeSlotIndex}`} className="text-xs">
                                    End Time <span className="text-gray-500">(24-hour format)</span>
                                  </Label>
                                  <Input
                                    id={`endTime-${dateIndex}-${timeSlotIndex}`}
                                    type="time"
                                    value={slot.endTime}
                                    onChange={e => updateTimeSlot(dateIndex, timeSlotIndex, 'endTime', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              {errors && errors[`dateTimeSlot_${dateIndex}_${timeSlotIndex}`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`dateTimeSlot_${dateIndex}_${timeSlotIndex}`]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-gray-500 text-xs mt-1">
                    Note: Enter times in 24-hour format (e.g., 13:00 for 1:00 PM). Times will be displayed in 12-hour format on the schedule.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="max_appointments">Max Appointments Per Slot</Label>
                <Input
                  id="max_appointments"
                  name="max_appointments"
                  type="number"
                  min="1"
                  value={formData.max_appointments}
                  onChange={handleChange}
                  className="max-w-[150px]"
                />
                {errors.max_appointments && (
                  <p className="text-red-500 text-sm">{errors.max_appointments}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any special instructions or notes about your availability"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_available"
                  name="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      is_available: checked === true
                    }))
                  }
                />
                <Label htmlFor="is_available" className="cursor-pointer">
                  Available for Appointments
                </Label>
              </div>

              {errors.general && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
                  <p className="text-red-600">{errors.general}</p>
                </div>
              )}

              <DialogFooter className="sm:justify-end flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || formData.dateTimeSlots.length === 0}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingId
                      ? 'Update Schedule'
                      : selectedSingleDate
                        ? 'Add Time Slots'
                        : 'Add Schedule'
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Schedule;
