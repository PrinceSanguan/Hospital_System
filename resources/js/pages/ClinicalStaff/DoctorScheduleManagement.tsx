import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import Layout from '@/layouts/ClinicalStaffLayout';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Doctor {
  id: number;
  name: string;
  user_role: string;
  email: string;
}

interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string;
  specific_date: string;
  is_approved: boolean;
  status: string;
  doctor?: Doctor;
}

interface SchedulesResponse {
  data: Schedule[];
  links: Record<string, unknown>;
}

interface PageProps {
  doctors: Doctor[];
  schedules: SchedulesResponse;
  flash: {
    success?: string;
    error?: string;
  };
}

const DoctorScheduleManagement: React.FC = () => {
  const { doctors, schedules, flash } = usePage<PageProps>().props;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctors);

  const [formData, setFormData] = useState({
    doctor_id: '',
    day_of_week: '',
    start_time: '09:00',
    end_time: '17:00',
    notes: '',
    specific_date: ''
  });

  useEffect(() => {
    if (schedules && schedules.data) {
      if (activeTab === 'pending') {
        setFilteredSchedules(schedules.data.filter((s: Schedule) => s.status === 'pending'));
      } else if (activeTab === 'approved') {
        setFilteredSchedules(schedules.data.filter((s: Schedule) => s.status === 'approved'));
      } else if (activeTab === 'all') {
        setFilteredSchedules(schedules.data);
      } else if (selectedDoctor) {
        setFilteredSchedules(schedules.data.filter((s: Schedule) => s.doctor_id === selectedDoctor));
      }
    }
  }, [activeTab, schedules, selectedDoctor]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setFilteredDoctors(
        doctors.filter((doctor) =>
          doctor.name.toLowerCase().includes(lowerCaseQuery)
        )
      );
    }
  }, [searchQuery, doctors]);

  const handleApprove = (scheduleId: number) => {
    router.post(route('staff.doctor-schedules.approve', scheduleId));
  };

  const openDeleteModal = (scheduleId: number) => {
    setSelectedScheduleId(scheduleId);
    setShowDeleteModal(true);
  };


  const openAddModal = () => {
    setFormData({
      doctor_id: doctors.length > 0 ? String(doctors[0].id) : '',
      day_of_week: '1', // Monday by default
      start_time: '09:00',
      end_time: '17:00',
      notes: '',
      specific_date: ''
    });
    setShowAddModal(true);
  };

  const handleDelete = () => {
    if (selectedScheduleId) {
      router.post(route('staff.doctor-schedules.delete', selectedScheduleId));
      setShowDeleteModal(false);
    }
  };

  const handleEdit = () => {
    if (selectedScheduleId) {
      router.put(route('staff.doctor-schedules.edit', selectedScheduleId), formData);
      setShowEditModal(false);
    }
  };

  const handleAdd = () => {
    router.post(route('staff.doctor-schedules.store'), formData);
    setShowAddModal(false);
  };

  const handleInputChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const formatTime = (time: string) => {
    return time ? new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  };

  const getDayName = (day: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[parseInt(day)] || day;
  };

  const filterByDoctor = (doctorId: number) => {
    setSelectedDoctor(doctorId);
    setActiveTab('doctor');
  };

  const handleTabSelect = (key: string | null) => {
    if (key) setActiveTab(key);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Layout>
      <Head title="Doctor Schedule Management" />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Doctor Schedule Management</h1>
          <Button onClick={openAddModal}>
            Add New Schedule
          </Button>
        </div>

        {flash.success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800" variant="default">
            <AlertDescription>{flash.success}</AlertDescription>
          </Alert>
        )}

        {flash.error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{flash.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Doctors</CardTitle>
                <div className="relative mt-2">
                  <div className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <Input
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <button
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      activeTab === 'all' ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Doctors
                  </button>
                  {filteredDoctors.map((doctor: Doctor) => (
                    <button
                      key={doctor.id}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                        selectedDoctor === doctor.id && activeTab === 'doctor'
                          ? 'bg-blue-50 text-blue-600'
                          : ''
                      }`}
                      onClick={() => filterByDoctor(doctor.id)}
                    >
                      {doctor.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-9">
            <Card>
              <CardHeader className="p-0">
                <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabSelect}>
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="pending">Pending Schedules</TabsTrigger>
                    <TabsTrigger value="approved">Approved Schedules</TabsTrigger>
                    <TabsTrigger value="all">All Schedules</TabsTrigger>
                    {selectedDoctor && activeTab === 'doctor' && (
                      <TabsTrigger value="doctor">
                        {doctors.find((d: Doctor) => d.id === selectedDoctor)?.name || 'Doctor'}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <AlertDescription>
                    <strong>Staff has the control to manage doctor schedules.</strong> You can add, edit, approve or reject schedule requests.
                  </AlertDescription>
                </Alert>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Day/Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            {schedule.doctor?.name || `Doctor #${schedule.doctor_id}`}
                          </TableCell>
                          <TableCell>
                            {schedule.specific_date
                              ? new Date(schedule.specific_date).toLocaleDateString()
                              : getDayName(schedule.day_of_week)}
                          </TableCell>
                          <TableCell>
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(schedule.status)}>
                              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{schedule.notes || 'No notes'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">

                              {schedule.status !== 'approved' && (
                                <Button
                                  variant="default"
                                  className="bg-green-500 text-white hover:bg-green-600"
                                  size="sm"
                                  onClick={() => handleApprove(schedule.id)}
                                >
                                  Approve
                                </Button>
                              )}


                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No schedules found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Doctor Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                name="doctor_id"
                value={formData.doctor_id}
                onValueChange={(value) => handleInputChange({ target: { name: 'doctor_id', value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor: Doctor) => (
                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onValueChange={(value) => handleInputChange({ target: { name: 'day_of_week', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Day" />
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

              <div className="space-y-2">
                <Label>Specific Date (Optional)</Label>
                <Input
                  type="date"
                  name="specific_date"
                  value={formData.specific_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this schedule..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formData.doctor_id || !formData.day_of_week || !formData.start_time || !formData.end_time}
            >
              Add Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                name="doctor_id"
                value={formData.doctor_id}
                disabled
              >
                <SelectTrigger>
                  <SelectValue>
                    {doctors.find(d => String(d.id) === formData.doctor_id)?.name}
                  </SelectValue>
                </SelectTrigger>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onValueChange={(value) => handleInputChange({ target: { name: 'day_of_week', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Day" />
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

              <div className="space-y-2">
                <Label>Specific Date (Optional)</Label>
                <Input
                  type="date"
                  name="specific_date"
                  value={formData.specific_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this schedule..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.day_of_week || !formData.start_time || !formData.end_time}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p>Are you sure you want to delete this schedule? This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DoctorScheduleManagement;
