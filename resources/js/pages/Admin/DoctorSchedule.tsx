import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { 
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Trash,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLayout from '@/layouts/AdminLayout';
import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface Schedule {
  id: number;
  doctor: {
    id: number;
    name: string;
  };
  day_date: string;
  time: string;
  status: string;
  notes: string;
}

interface DoctorScheduleProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  doctors: Doctor[];
  schedules: Schedule[];
  statusOptions: string[];
}

export default function DoctorSchedule({ user, doctors, schedules, statusOptions }: DoctorScheduleProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
    const { delete: destroy, put, processing, setData } = useForm();

  // Filter schedules based on search query, selected doctor and tab
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.day_date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.time.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDoctor = !selectedDoctor || selectedDoctor === "all" || 
      schedule.doctor.id.toString() === selectedDoctor;
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "pending" && schedule.status === "pending") ||
      (activeTab === "approved" && schedule.status === "approved");
    
    return matchesSearch && matchesDoctor && matchesTab;
  });
  const confirmDelete = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedSchedule) {
      destroy(route('admin.doctor-schedules.destroy', selectedSchedule.id), {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedSchedule(null);
        }
      });
    }
  };
  
  const handleApprove = (schedule: Schedule) => {
    setData({
      status: 'approved',
      notes: schedule.notes
    });
    
    put(route('admin.doctor-schedules.update', schedule.id));
  };
  
  const handleReject = (schedule: Schedule) => {
    setData({
      status: 'rejected',
      notes: schedule.notes
    });
    
    put(route('admin.doctor-schedules.update', schedule.id));
  };

  // Function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let variant = "outline";
    
    switch (status.toLowerCase()) {
      case "approved":
        variant = "success";
        break;
      case "pending":
        variant = "warning";
        break;
      case "rejected":
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }

    return (
      <Badge variant={variant as any} className="capitalize">
        {status}
      </Badge>
    );
  };

  // Group doctors by ID for easy access
  const doctorsById = doctors.reduce((acc, doctor) => {
    acc[doctor.id] = doctor;
    return acc;
  }, {} as Record<number, Doctor>);

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Doctor Schedule Management</h1>
          </div>
          <Button asChild>
            <Link href={route('admin.doctor-schedules.create')}>
              <Plus className="mr-2 h-4 w-4" /> Add New Schedule
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar for doctors list */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <h2 className="font-semibold text-lg mb-2">Doctors</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search doctors..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Button
                variant={selectedDoctor === "all" || !selectedDoctor ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedDoctor("all")}
              >
                All Doctors
              </Button>
              
              {doctors.map((doctor) => (
                <Button
                  key={doctor.id}
                  variant={selectedDoctor === doctor.id.toString() ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedDoctor(doctor.id.toString())}
                >
                  {doctor.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Main content area with schedule tabs */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">Pending Schedules</TabsTrigger>
                  <TabsTrigger value="approved">Approved Schedules</TabsTrigger>
                  <TabsTrigger value="all">All Schedules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="p-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-grow">
                        <h3 className="font-medium">Staff has the control to manage doctor schedules.</h3>
                        <p className="text-sm text-gray-600">You can add, edit, approve or reject schedule requests.</p>
                      </div>
                    </div>
                  </div>
                  {renderScheduleTable(filteredSchedules.filter(s => s.status === 'pending'))}
                </TabsContent>
                
                <TabsContent value="approved" className="p-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-grow">
                        <h3 className="font-medium">These schedules have been approved.</h3>
                        <p className="text-sm text-gray-600">Patients can book appointments during these time slots.</p>
                      </div>
                    </div>
                  </div>
                  {renderScheduleTable(filteredSchedules.filter(s => s.status === 'approved'))}
                </TabsContent>
                
                <TabsContent value="all" className="p-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-grow">
                        <h3 className="font-medium">Staff has the control to manage doctor schedules.</h3>
                        <p className="text-sm text-gray-600">You can add, edit, approve or reject schedule requests.</p>
                      </div>
                    </div>
                  </div>
                  {renderScheduleTable(filteredSchedules)}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this schedule? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={processing}
              >
                {processing ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
  
  function renderScheduleTable(schedules: Schedule[]) {
    return schedules.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-4 font-medium text-gray-500">Doctor</th>
              <th className="p-4 font-medium text-gray-500">Day/Date</th>
              <th className="p-4 font-medium text-gray-500">Time</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500">Notes</th>
              <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{schedule.doctor.name}</td>
                <td className="p-4">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {schedule.day_date}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    {schedule.time}
                  </div>
                </td>
                <td className="p-4">{renderStatusBadge(schedule.status)}</td>
                <td className="p-4">{schedule.notes || "-"}</td>
                <td className="p-4 text-right">
                  {schedule.status === 'pending' && (
                    <div className="flex justify-end gap-2">                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(schedule)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(schedule)}
                        disabled={processing}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600 ml-2"
                    onClick={() => confirmDelete(schedule)}
                  >
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        No schedules found. {activeTab === 'pending' ? 'No pending schedule requests.' : activeTab === 'approved' ? 'No approved schedules yet.' : 'Try selecting a different filter or create a new schedule.'}
      </div>
    );
  }
}
