import React, { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'react-toastify';
import { Calendar, Clock, User, Trash2, Edit } from 'lucide-react';

// Define TypeScript interfaces
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

interface Props {
  user: User;
  schedules: Schedule[];
  staff: StaffMember[];
}

const Schedule: React.FC<Props> = ({ user, schedules, staff }) => {
  // State for filtering and form
  const [filteredStaffId, setFilteredStaffId] = useState<string>('all');
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
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Helper functions
  const getDayName = (dayNumber: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const getStaffName = (staffId: number): string => {
    const staffMember = staff.find(s => s.id === staffId);
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
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter schedules
  const filteredSchedules = filteredStaffId === 'all'
    ? schedules
    : schedules.filter(schedule => schedule.staff_id === parseInt(filteredStaffId, 10));

  // Form handling
  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      router.put(`/doctor/schedule/${editingSchedule.id}`, formData, {
        onSuccess: () => {
          toast.success('Schedule updated successfully');
          resetForm();
        },
        onError: () => toast.error('Failed to update schedule'),
      });
    } else {
      router.post('/doctor/schedule', formData, {
        onSuccess: () => {
          toast.success('Schedule created successfully');
          resetForm();
        },
        onError: () => toast.error('Failed to create schedule'),
      });
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingScheduleise(react).useState({
      staff_id: schedule.staff_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_available: schedule.is_available,
      max_appointments: schedule.max_appointments,
      specific_date: schedule.specific_date,
      notes: schedule.notes,
    });
    setEditingSchedule(schedule);
  };

  const handleDelete = (scheduleId: number) => {
    router.delete(`/doctor/schedule/${scheduleId}`, {
      onSuccess: () => toast.success('Schedule deleted successfully'),
      onError: () => toast.error('Failed to delete schedule'),
    });
  };

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
    setEditingSchedule(null);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedule Management</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage doctor schedules and availability
              </p>
            </div>

            <div className="grid gap-6">
              {/* Filter and Schedule Form */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</CardTitle>
                  <CardDescription>
                    {editingSchedule ? 'Update existing schedule details' : 'Create a new schedule for a staff member'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="staff_id">Staff Member</Label>
                        <Select
                          value={formData.staff_id.toString()}
                          onValueChange={(value) => handleInputChange('staff_id', parseInt(value))}
                        >
                          <SelectTrigger id="staff_id">
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

                      <div>
                        <Label htmlFor="day_of_week">Day of Week</Label>
                        <Select
                          value={formData.day_of_week.toString()}
                          onValueChange={(value) => handleInputChange('day_of_week', parseInt(value))}
                        >
                          <SelectTrigger id="day_of_week">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_time">Start Time</Label>
                          <Input
                            type="time"
                            id="start_time"
                            value={formData.start_time}
                            onChange={(e) => handleInputChange('start_time', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">End Time</Label>
                          <Input
                            type="time"
                            id="end_time"
                            value={formData.end_time}
                            onChange={(e) => handleInputChange('end_time', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="max_appointments">Maximum Appointments</Label>
                        <Input
                          type="number"
                          id="max_appointments"
                          value={formData.max_appointments}
                          onChange={(e) => handleInputChange('max_appointments', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="specific_date">Specific Date (Optional)</Label>
                        <Input
                          type="date"
                          id="specific_date"
                          value={formData.specific_date || ''}
                          onChange={(e) => handleInputChange('specific_date', e.target.value || null)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is_available">Available for Appointments</Label>
                          <p className="text-sm text-gray-500">Enable or disable appointment booking</p>
                        </div>
                        <Switch
                          id="is_available"
                          checked={formData.is_available}
                          onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          value={formData.notes || ''}
                          onChange={(e) => handleInputChange('notes', e.target.value || null)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      {editingSchedule && (
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                      )}
                      <Button type="submit">
                        {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Schedules Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedules</CardTitle>
                  <CardDescription>View and manage all doctor schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label htmlFor="staff-filter">Filter by Staff Member</Label>
                    <Select
                      value={filteredStaffId}
                      onValueChange={setFilteredStaffId}
                    >
                      <SelectTrigger id="staff-filter">
                        <SelectValue placeholder="All Staff Members" />
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
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {getStaffName(schedule.staff_id)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {getDayName(schedule.day_of_week)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  schedule.is_available
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {schedule.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </TableCell>
                            <TableCell>{schedule.max_appointments}</TableCell>
                            <TableCell>{formatDate(schedule.specific_date)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(schedule)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>

                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-6 text-center text-sm text-gray-500">
                      No schedules found. Create a new schedule above.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Schedule;
