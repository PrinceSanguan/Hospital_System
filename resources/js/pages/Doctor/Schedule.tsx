import React, { FormEvent, useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { UserData } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import DoctorLayout from '@/layouts/DoctorLayout';
import axios from 'axios';

// Define TypeScript interfaces for our data structures
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  specialization: string;
  is_active: boolean;
}

interface Schedule {
  id: number;
  doctor_id: number;
  staff_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
  specific_date: string | null;
  notes: string | null;
}

interface SchedulePageProps {
  user: User;
  schedules: Schedule[];
  staff: StaffMember[];
}

const SchedulePage: React.FC<SchedulePageProps> = ({ user, schedules, staff }) => {
  // State for filtering and modals
  const [filteredStaffId, setFilteredStaffId] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isMultipleModalOpen, setIsMultipleModalOpen] = useState<boolean>(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Form state for single schedule
  const [formData, setFormData] = useState<Omit<Schedule, 'id' | 'doctor_id'>>({
    staff_id: staff.length > 0 ? staff[0].id : 0,
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    max_appointments: 1,
    specific_date: null,
    notes: null,
  });

  // Form state for multiple schedules
  const [multipleSchedules, setMultipleSchedules] = useState<Omit<Schedule, 'id' | 'doctor_id'>[]>([
    {
      staff_id: staff.length > 0 ? staff[0].id : 0,
      day_of_week: 0,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      max_appointments: 1,
      specific_date: null,
      notes: null,
    },
  ]);

  // Helper functions for rendering
  const getDayName = (dayNumber: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const getStaffName = (staffId: number): string => {
    const staffMember = staff.find((s) => s.id === staffId);
    return staffMember ? staffMember.name : 'Unknown Staff';
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Form handling for single schedule
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_available: checked }));
  };

  // Form handling for multiple schedules
  const handleMultipleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const updatedSchedules = [...multipleSchedules];
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updatedSchedules[index] = { ...updatedSchedules[index], [name]: checked };
    } else {
      updatedSchedules[index] = { ...updatedSchedules[index], [name]: value };
    }
    setMultipleSchedules(updatedSchedules);
  };

  const handleMultipleSelectChange = (index: number, value: string, name: string) => {
    const updatedSchedules = [...multipleSchedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [name]: value };
    setMultipleSchedules(updatedSchedules);
  };

  const handleMultipleCheckboxChange = (index: number, checked: boolean) => {
    const updatedSchedules = [...multipleSchedules];
    updatedSchedules[index] = { ...updatedSchedules[index], is_available: checked };
    setMultipleSchedules(updatedSchedules);
  };

  const addScheduleForm = () => {
    setMultipleSchedules([
      ...multipleSchedules,
      {
        staff_id: staff.length > 0 ? staff[0].id : 0,
        day_of_week: 0,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
        max_appointments: 1,
        specific_date: null,
        notes: null,
      },
    ]);
  };

  const removeScheduleForm = (index: number) => {
    setMultipleSchedules(multipleSchedules.filter((_, i) => i !== index));
  };

  // Filter schedules based on selected staff using useMemo
  const filteredSchedules = useMemo(() => {
    return filteredStaffId === 'all'
      ? schedules
      : schedules.filter((schedule) => schedule.staff_id === parseInt(filteredStaffId, 10));
  }, [filteredStaffId, schedules]);

  // Create a new schedule
  const handleCreateSchedule = (e: FormEvent) => {
    e.preventDefault();
    router.post(route('doctor.schedule.store'), formData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        toast({
          title: 'Success',
          description: 'Schedule created successfully',
        });
        resetForm();
      },
      onError: (errors) => {
        console.error(errors);
        toast({
          title: 'Error',
          description: errors.specific_date || 'Failed to create schedule',
          variant: 'destructive',
        });
      },
    });
  };

  // Edit an existing schedule
  const handleEditSchedule = (e: FormEvent) => {
    e.preventDefault();
    if (!currentSchedule) return;
    router.put(route('doctor.schedule.update', currentSchedule.id), formData, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
        resetForm();
      },
      onError: (errors) => {
        console.error(errors);
        toast({
          title: 'Error',
          description: 'Failed to update schedule',
          variant: 'destructive',
        });
      },
    });
  };

  // Delete a schedule
  const handleDeleteSchedule = () => {
    if (!currentSchedule) return;
    router.delete(route('doctor.schedule.destroy', currentSchedule.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete schedule',
          variant: 'destructive',
        });
      },
    });
  };

  // Create multiple schedules
  const handleCreateMultipleSchedules = (e: FormEvent) => {
    e.preventDefault();
    router.post(route('doctor.schedule.storeMultiple'), { schedules: multipleSchedules }, {
      onSuccess: () => {
        setIsMultipleModalOpen(false);
        toast({
          title: 'Success',
          description: 'Schedules created successfully',
        });
        setMultipleSchedules([
          {
            staff_id: staff.length > 0 ? staff[0].id : 0,
            day_of_week: 0,
            start_time: '09:00',
            end_time: '17:00',
            is_available: true,
            max_appointments: 1,
            specific_date: null,
            notes: null,
          },
        ]);
      },
      onError: (errors) => {
        console.error(errors);
        toast({
          title: 'Error',
          description: 'Failed to create schedules',
          variant: 'destructive',
        });
      },
    });
  };

  // View staff schedule
  const viewStaffSchedule = (staffId: number) => {
    router.get(route('doctor.schedule.viewStaffSchedule', staffId));
  };

  // Open edit modal and populate form with selected schedule data
  const openEditModal = (schedule: Schedule) => {
    setCurrentSchedule(schedule);
    setFormData({
      staff_id: schedule.staff_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_available: schedule.is_available,
      max_appointments: schedule.max_appointments,
      specific_date: schedule.specific_date,
      notes: schedule.notes,
    });
    setIsEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (schedule: Schedule) => {
    setCurrentSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      staff_id: staff.length > 0 ? staff[0].id : 0,
      day_of_week: 0,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      max_appointments: 1,
      specific_date: null,
      notes: null,
    });
    setCurrentSchedule(null);
  };

  return (
    <DoctorLayout>
      <Head title="Doctor Schedule" />
      <Header title="Doctor Schedule Management" />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        <main className="container mx-auto py-6 flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Management</CardTitle>
              <CardDescription>Manage staff scheduling and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                </TabsList>

                {/* Table View */}
                <TabsContent value="table">
                  <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <div className="w-full md:w-1/3">
                      <Select value={filteredStaffId} onValueChange={(value) => setFilteredStaffId(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filter by Staff Member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff Members</SelectItem>
                          {staff.map((staffMember) => (
                            <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                              {staffMember.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Schedule
                      </Button>
                      <Button onClick={() => setIsMultipleModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Multiple Schedules
                      </Button>
                    </div>
                  </div>

                  {/* Schedules Table */}
                  <div className="rounded-md border">
                    {filteredSchedules.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Max Appointments</TableHead>
                            <TableHead>Specific Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchedules.map((schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell className="font-medium">{getStaffName(schedule.staff_id)}</TableCell>
                              <TableCell>{getDayName(schedule.day_of_week)}</TableCell>
                              <TableCell>
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={schedule.is_available ? 'success' : 'destructive'}>
                                  {schedule.is_available ? 'Available' : 'Unavailable'}
                                </Badge>
                              </TableCell>
                              <TableCell>{schedule.max_appointments}</TableCell>
                              <TableCell>{formatDate(schedule.specific_date)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditModal(schedule)}>
                                    Edit
                                  </Button>

                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => viewStaffSchedule(schedule.staff_id)}
                                  >
                                    View Staff
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-6 px-4 text-center text-sm text-gray-500">
                        No schedules found. Click "Add Schedule" to create one.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Calendar View */}
                <TabsContent value="calendar">
                  <Card>
                    <CardHeader>
                      <CardTitle>Calendar View</CardTitle>
                      <CardDescription>View schedules by date</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/3">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                          />
                        </div>
                        <div className="md:w-2/3">
                          <h3 className="text-lg font-medium mb-4">
                            Schedules for {selectedDate ? format(selectedDate, 'PPPP') : 'Selected Date'}
                          </h3>
                          {filteredSchedules
                            .filter((schedule) =>
                              selectedDate && schedule.specific_date
                                ? format(new Date(schedule.specific_date), 'yyyy-MM-dd') ===
                                  format(selectedDate, 'yyyy-MM-dd')
                                : true
                            )
                            .map((schedule) => (
                              <div key={schedule.id} className="mb-4 p-4 border rounded-md">
                                <p>
                                  <strong>Staff:</strong> {getStaffName(schedule.staff_id)}
                                </p>
                                <p>
                                  <strong>Time:</strong> {formatTime(schedule.start_time)} -{' '}
                                  {formatTime(schedule.end_time)}
                                </p>
                                <p>
                                  <strong>Status:</strong>{' '}
                                  {schedule.is_available ? 'Available' : 'Unavailable'}
                                </p>
                                <p>
                                  <strong>Max Appointments:</strong> {schedule.max_appointments}
                                </p>
                                {schedule.notes && (
                                  <p>
                                    <strong>Notes:</strong> {schedule.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          {filteredSchedules.filter((schedule) =>
                            selectedDate && schedule.specific_date
                              ? format(new Date(schedule.specific_date), 'yyyy-MM-dd') ===
                                format(selectedDate, 'yyyy-MM-dd')
                              : true
                          ).length === 0 && (
                            <p className="text-gray-500">No schedules for this date.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Schedule Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Schedule</DialogTitle>
            <DialogDescription>Create a new schedule for staff availability</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSchedule} className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff_id">Staff Member</Label>
                <Select
                  value={formData.staff_id.toString()}
                  onValueChange={(value) => handleSelectChange(value, 'staff_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                        {staffMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day_of_week">Day of Week</Label>
                <Select
                  value={formData.day_of_week.toString()}
                  onValueChange={(value) => handleSelectChange(value, 'day_of_week')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_appointments">Maximum Appointments</Label>
                <Input
                  type="number"
                  id="max_appointments"
                  name="max_appointments"
                  value={formData.max_appointments}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specific_date">Specific Date (Optional)</Label>
                <Input
                  type="date"
                  id="specific_date"
                  name="specific_date"
                  value={formData.specific_date || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="is_available">Available for appointments</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>Modify the selected schedule</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSchedule} className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff_id">Staff Member</Label>
                <Select
                  value={formData.staff_id.toString()}
                  onValueChange={(value) => handleSelectChange(value, 'staff_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                        {staffMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day_of_week">Day of Week</Label>
                <Select
                  value={formData.day_of_week.toString()}
                  onValueChange={(value) => handleSelectChange(value, 'day_of_week')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_appointments">Maximum Appointments</Label>
                <Input
                  type="number"
                  id="max_appointments"
                  name="max_appointments"
                  value={formData.max_appointments}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specific_date">Specific Date (Optional)</Label>
                <Input
                  type="date"
                  id="specific_date"
                  name="specific_date"
                  value={formData.specific_date || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="is_available">Available for appointments</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>



      {/* Create Multiple Schedules Modal */}
      <Dialog open={isMultipleModalOpen} onOpenChange={setIsMultipleModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Multiple Schedules</DialogTitle>
            <DialogDescription>Create multiple schedules at once</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMultipleSchedules} className="space-y-4 py-4">
            {multipleSchedules.map((schedule, index) => (
              <div key={index} className="space-y-4 border-b pb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Schedule {index + 1}</h3>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeScheduleForm(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`staff_id_${index}`}>Staff Member</Label>
                  <Select
                    value={schedule.staff_id.toString()}
                    onValueChange={(value) => handleMultipleSelectChange(index, value, 'staff_id')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((staffMember) => (
                        <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                          {staffMember.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`day_of_week_${index}`}>Day of Week</Label>
                  <Select
                    value={schedule.day_of_week.toString()}
                    onValueChange={(value) => handleMultipleSelectChange(index, value, 'day_of_week')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`start_time_${index}`}>Start Time</Label>
                    <Input
                      type="time"
                      id={`start_time_${index}`}
                      name="start_time"
                      value={schedule.start_time}
                      onChange={(e) => handleMultipleInputChange(index, e)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`end_time_${index}`}>End Time</Label>
                    <Input
                      type="time"
                      id={`end_time_${index}`}
                      name="end_time"
                      value={schedule.end_time}
                      onChange={(e) => handleMultipleInputChange(index, e)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`max_appointments_${index}`}>Maximum Appointments</Label>
                  <Input
                    type="number"
                    id={`max_appointments_${index}`}
                    name="max_appointments"
                    value={schedule.max_appointments}
                    onChange={(e) => handleMultipleInputChange(index, e)}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`specific_date_${index}`}>Specific Date (Optional)</Label>
                  <Input
                    type="date"
                    id={`specific_date_${index}`}
                    name="specific_date"
                    value={schedule.specific_date || ''}
                    onChange={(e) => handleMultipleInputChange(index, e)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`is_available_${index}`}
                    checked={schedule.is_available}
                    onCheckedChange={(checked) => handleMultipleCheckboxChange(index, !!checked)}
                  />
                  <Label htmlFor={`is_available_${index}`}>Available for appointments</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes_${index}`}>Notes (Optional)</Label>
                  <Textarea
                    id={`notes_${index}`}
                    name="notes"
                    rows={3}
                    value={schedule.notes || ''}
                    onChange={(e) => handleMultipleInputChange(index, e)}
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addScheduleForm} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add Another Schedule
            </Button>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMultipleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Schedules</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DoctorLayout>
  );
};

export default SchedulePage;
