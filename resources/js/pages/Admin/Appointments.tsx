import React, { useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import {
  Search,
  Filter,
  Eye,
  PencilLine,
  Trash,
  Download,
  CalendarPlus,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from '@/layouts/AdminLayout';
import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import axios from 'axios';

interface Patient {
  id: number;
  name: string;
  doctor: string;
}

interface Appointment {
  id: number;
  ref: string;
  date: string;
  time: string;
  patient: Patient;
  reason: string;
  status: string;
  approved_by?: number;
  approved_by_name?: string;
}

interface AppointmentsProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  appointments: Appointment[];
  statusOptions: string[];
  appointmentTypes: string[];
}

export default function Appointments({ user, appointments, statusOptions, appointmentTypes }: AppointmentsProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject'>('approve');
  const [appointmentIdToUpdate, setAppointmentIdToUpdate] = useState<number | null>(null);

  const { delete: destroy, processing } = useForm();

  // Filter appointments based on search query and filters
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All Statuses" || appointment.status === statusFilter.toLowerCase();

    // Type filter is based on the reason since we don't have a direct type field
    const matchesType = typeFilter === "All Types" ||
      appointment.reason.toLowerCase().includes(typeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType;
  });

  const confirmDelete = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };
  const handleDelete = () => {
    if (selectedAppointment) {
      destroy(route('admin.appointments.destroy', selectedAppointment.id), {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedAppointment(null);
          toast.success("Appointment deleted successfully");
        }
      });
    }
  };
    // Handle appointment status updates
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const response = await axios.put(route('admin.appointments.update', id), {
        status: newStatus,
        notes: `Status updated by admin: ${user.name}`,
        approved_by: user.id,
        approved_by_name: user.name
      });

      if (response.data.success) {
        // Update the appointment status in the local state
        const updatedAppointments = appointments.map(appointment => {
          if (appointment.id === id) {
            return {
              ...appointment,
              status: newStatus
            };
          }
          return appointment;
        });

        // Replace the appointments with updated data
        window.location.reload();

        // Show success message
        toast.success(`Appointment ${newStatus} successfully`);
      } else {
        toast.error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('An error occurred while updating the appointment status');
    }
  };

  // Function to open confirm modal for approve action
  const openApproveDialog = (id: number) => {
    setAppointmentIdToUpdate(id);
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  // Function to open confirm modal for deny action
  const openDenyDialog = (id: number) => {
    setAppointmentIdToUpdate(id);
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  // Function to confirm and execute the status update
  const confirmStatusUpdate = () => {
    if (appointmentIdToUpdate) {
      const newStatus = confirmAction === 'approve' ? 'confirmed' : 'cancelled';
      handleStatusUpdate(appointmentIdToUpdate, newStatus);
      setShowConfirmModal(false);
      setAppointmentIdToUpdate(null);
    }
  };

  // Function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let variant = "outline";

    switch (status.toLowerCase()) {
      case "completed":
        variant = "success";
        break;
      case "confirmed":
        variant = "info";
        break;
      case "pending":
        variant = "warning";
        break;
      case "cancelled":
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

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6">        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">Manage and respond to appointment requests</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by patient name or reference #"
                    className="w-full pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Statuses">All Statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Appointment Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Types">All Types</SelectItem>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-b bg-gray-50">
            <h3 className="text-lg font-semibold">Appointment List</h3>
            <p className="text-sm text-muted-foreground">
              Showing {filteredAppointments.length} appointments
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="p-4 font-medium text-gray-500">Appointment Ref #</th>
                  <th className="p-4 font-medium text-gray-500">Patient</th>
                  <th className="p-4 font-medium text-gray-500">Date & Time</th>
                  <th className="p-4 font-medium text-gray-500">Reasons</th>
                  <th className="p-4 font-medium text-gray-500">Status</th>
                  <th className="p-4 font-medium text-gray-500">Approved By</th>
                  <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{appointment.ref}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{appointment.patient.name}</div>
                          <div className="text-sm text-gray-500">{appointment.patient.doctor}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>{appointment.date}</div>
                        <div className="text-sm text-gray-500">{appointment.time}</div>
                      </td>
                      <td className="p-4">{appointment.reason}</td>                      <td className="p-4">{renderStatusBadge(appointment.status)}</td>
                      <td className="p-4">
                        {(appointment.status === 'confirmed' || appointment.status === 'cancelled') && appointment.approved_by_name ? (
                          <span className={appointment.status === 'confirmed' ? 'text-green-600' : 'text-red-600'}>
                            {appointment.approved_by_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end">                          {/* Status action buttons for pending appointments */}
                          {appointment.status === 'pending' && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mr-1 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                      onClick={() => openApproveDialog(appointment.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Accept
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Accept this appointment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mr-2 bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                      onClick={() => openDenyDialog(appointment.id)}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Decline
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Decline this appointment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.visit(route('admin.appointments.show', appointment.id))}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <PencilLine className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => window.open(route('admin.appointments.pdf', appointment.id), '_blank')}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive"
                                onClick={() => confirmDelete(appointment)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No appointments found. Try adjusting your filters or create a new appointment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
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
        </Dialog>        {/* Confirmation Modal for approve/deny */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmStatusUpdate}
          title={`Are you sure you want to ${confirmAction} this appointment?`}
          actionType={confirmAction}
        />
      </div>
    </AdminLayout>
  );
}
