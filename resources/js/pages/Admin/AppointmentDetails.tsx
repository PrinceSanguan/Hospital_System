import React from "react";
import { router } from "@inertiajs/react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  FileText,
  UserSquare,
  Mail,
  Phone,
  CalendarDays,
  UserCircle,
  AlertCircle,
  Download,
  Eye,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AdminLayout from '@/layouts/AdminLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ConfirmationModal from '@/components/ConfirmationModal';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface AppointmentDetails {
  appointment_time?: string;
  reason?: string;
  notes?: string;
  patient_info?: {
    name?: string;
    birthdate?: string;
    age?: number;
    height?: number;
    weight?: number;
    bmi?: number;
    address?: string;
  };
  vital_signs?: {
    temperature?: number;
    pulse_rate?: number;
    respiratory_rate?: number;
    blood_pressure?: string;
    oxygen_saturation?: number;
    recorded_at?: string;
  };
  service?: {
    id?: number;
    name?: string;
    price?: number;
    duration_minutes?: number;
  };
  uploaded_files?: Array<{
    name: string;
    path: string;
    size?: number;
    type?: string;
    url?: string;
  }>;
  medical_records?: {
    diagnosis?: string;
    treatment?: string;
    prescription?: string;
    notes?: string;
    follow_up?: string;
    history?: string;
    lab_results?: Array<{
      test_name?: string;
      result?: string;
      normal_range?: string;
      unit?: string;
      is_abnormal?: boolean;
      notes?: string;
    }>;
  };
  status_notes?: string;
  status_updated_by?: string;
  status_updated_at?: string;
}

interface AppointmentData {
  id: number;
  reference_number: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  patient: Patient;
  doctor: Doctor | null;
  details: AppointmentDetails;
  created_at: string;
  updated_at: string;
  approved_by?: number;
  approved_by_name?: string;
}

interface AppointmentDetailsProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  appointment: AppointmentData;
}

export default function AppointmentDetails({ user, appointment }: AppointmentDetailsProps) {
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'approve' | 'reject'>('approve');
  const [showMedicalRecordsModal, setShowMedicalRecordsModal] = React.useState(false);

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
      <Badge variant={variant as any} className="capitalize ml-2">
        {status}
      </Badge>
    );
  };

  // Function to open confirm modal for approve action
  const openApproveDialog = () => {
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  // Function to open confirm modal for deny action
  const openDenyDialog = () => {
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  // Handle appointment status updates
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await axios.put(route('admin.appointments.update', appointment.id), {
        status: newStatus,
        notes: `Status updated by admin: ${user.name}`,
        approved_by: user.id,
        approved_by_name: user.name
      });

      if (response.data.success) {
        toast.success(`Appointment ${newStatus} successfully`);

        // Redirect back to the appointments list after a brief delay
        setTimeout(() => {
          router.visit(route('admin.appointments'));
        }, 2000);
      } else {
        toast.error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('An error occurred while updating the appointment status');
    }
  };

  // Function to confirm and execute the status update
  const confirmStatusUpdate = () => {
    const newStatus = confirmAction === 'approve' ? 'confirmed' : 'cancelled';
    handleStatusUpdate(newStatus);
    setShowConfirmModal(false);
  };
  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="mr-4"
              onClick={() => router.visit(route('admin.appointments'))}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center">
                Appointment Details
                {renderStatusBadge(appointment.status)}
              </h1>
              <p className="text-muted-foreground">
                Reference: {appointment.reference_number}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open(route('admin.appointments.pdf', appointment.id), '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main appointment information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Appointment Information</CardTitle>
              <CardDescription>Complete details about this appointment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{appointment.date}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{appointment.time || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-start mb-2">
                  <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Reason for Visit</p>
                    <p className="font-medium">{appointment.reason}</p>
                  </div>
                </div>
              </div>

              {appointment.doctor && (
                <>
                  <Separator />

                  <div className="flex items-start">
                    <UserSquare className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Assigned Doctor</p>
                      <p className="font-medium">{appointment.doctor.name}</p>
                      <p className="text-sm text-gray-500">{appointment.doctor.email}</p>
                    </div>
                  </div>
                </>
              )}

              {appointment.details && appointment.details.status_notes && (
                <>
                  <Separator />

                  <div className="flex items-start">
                    <FileText className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Status Notes</p>
                      <p className="font-medium">{appointment.details.status_notes}</p>
                      {appointment.details.status_updated_at && (
                        <p className="text-xs text-gray-500">
                          Updated {appointment.details.status_updated_at} by {appointment.details.status_updated_by}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Display who approved the appointment */}
              {appointment.status === 'confirmed' && appointment.approved_by_name && (
                <>
                  <Separator />
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <div>
                      <p className="text-sm text-green-600">Approved By</p>
                      <p className="font-medium">{appointment.approved_by_name}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Display who declined the appointment */}
              {appointment.status === 'cancelled' && appointment.approved_by_name && (
                <>
                  <Separator />
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 mr-2 text-red-500" />
                    <div>
                      <p className="text-sm text-red-600">Declined By</p>
                      <p className="font-medium">{appointment.approved_by_name}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Additional appointment details */}
              {appointment.details && appointment.details.vital_signs && (
                <>
                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Vital Signs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {appointment.details.vital_signs.temperature && (
                        <div>
                          <p className="text-sm text-gray-500">Temperature</p>
                          <p className="font-medium">{appointment.details.vital_signs.temperature} °C</p>
                        </div>
                      )}
                      {appointment.details.vital_signs.pulse_rate && (
                        <div>
                          <p className="text-sm text-gray-500">Pulse Rate</p>
                          <p className="font-medium">{appointment.details.vital_signs.pulse_rate} bpm</p>
                        </div>
                      )}
                      {appointment.details.vital_signs.respiratory_rate && (
                        <div>
                          <p className="text-sm text-gray-500">Respiratory Rate</p>
                          <p className="font-medium">{appointment.details.vital_signs.respiratory_rate} breaths/min</p>
                        </div>
                      )}
                      {appointment.details.vital_signs.blood_pressure && (
                        <div>
                          <p className="text-sm text-gray-500">Blood Pressure</p>
                          <p className="font-medium">{appointment.details.vital_signs.blood_pressure}</p>
                        </div>
                      )}
                      {appointment.details.vital_signs.oxygen_saturation && (
                        <div>
                          <p className="text-sm text-gray-500">Oxygen Saturation</p>
                          <p className="font-medium">{appointment.details.vital_signs.oxygen_saturation}%</p>
                        </div>
                      )}
                    </div>
                    {appointment.details.vital_signs.recorded_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Recorded: {appointment.details.vital_signs.recorded_at}
                      </p>
                    )}
                  </div>
                </>
              )}              {/* Medical Records Section */}
              {appointment.details && appointment.details.medical_records && (
                <>
                  <Separator />

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        Medical Records
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => setShowMedicalRecordsModal(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                      Click the "View Details" button to see full medical records
                    </p>
                  </div>
                </>
              )}

              {/* File Attachments Section */}
              {appointment.details && appointment.details.uploaded_files && appointment.details.uploaded_files.length > 0 && (
                <>
                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Attached Files</h3>
                    <div className="space-y-2">
                      {appointment.details.uploaded_files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url || file.path, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <div className="text-xs text-gray-500">
                Created: {appointment.created_at}<br />
                Last Updated: {appointment.updated_at}
              </div>

              {appointment.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                    onClick={openApproveDialog}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                    onClick={openDenyDialog}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Deny
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>

          {/* Patient information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{appointment.patient.name}</p>
                    <p className="text-sm text-gray-500">Patient ID: {appointment.patient.id}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{appointment.patient.email}</p>
                  </div>
                </div>

                {appointment.patient.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{appointment.patient.phone}</p>
                    </div>
                  </div>
                )}

                {appointment.patient.birthdate && (
                  <div className="flex items-start">
                    <CalendarDays className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{appointment.patient.birthdate}</p>
                    </div>
                  </div>
                )}

                {appointment.patient.gender && (
                  <div className="flex items-start">
                    <UserCircle className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{appointment.patient.gender}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Implement view patient details functionality here
                    toast.error("Patient details view not implemented yet.");
                  }}
                >
                  View Full Patient Record
                </Button>
              </CardFooter>
            </Card>

            {/* Additional information or quick actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.visit(route('admin.appointments'))}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Appointments
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(route('admin.appointments.pdf', appointment.id), '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Appointment PDF
                </Button>

                {appointment.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                      onClick={openApproveDialog}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                      onClick={openDenyDialog}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Deny Appointment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirmation Modal for approve/deny */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmStatusUpdate}
          title={`Are you sure you want to ${confirmAction} this appointment?`}
          actionType={confirmAction}
        />

        {/* Medical Records Modal */}
        <Dialog open={showMedicalRecordsModal} onOpenChange={setShowMedicalRecordsModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Medical Records
              </DialogTitle>
              <DialogDescription>
                Details of patient's medical records for this appointment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {appointment.details && appointment.details.medical_records ? (
                <>
                  {/* Diagnosis */}
                  {appointment.details.medical_records.diagnosis && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Diagnosis</h3>
                      <p className="whitespace-pre-line">{appointment.details.medical_records.diagnosis}</p>
                    </div>
                  )}

                  {/* Treatment */}
                  {appointment.details.medical_records.treatment && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Treatment</h3>
                      <p className="whitespace-pre-line">{appointment.details.medical_records.treatment}</p>
                    </div>
                  )}

                  {/* Prescription */}
                  {appointment.details.medical_records.prescription && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Prescription</h3>
                      <p className="whitespace-pre-line">{appointment.details.medical_records.prescription}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {appointment.details.medical_records.notes && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Notes</h3>
                      <p className="whitespace-pre-line">{appointment.details.medical_records.notes}</p>
                    </div>
                  )}

                  {/* Follow Up */}
                  {appointment.details.medical_records.follow_up && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Follow Up</h3>
                      <p className="whitespace-pre-line">{appointment.details.medical_records.follow_up}</p>
                    </div>
                  )}

                  {/* Medical History */}
                  {appointment.details.medical_records.history && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Medical History</h3>
                      <p className="whitespace-pre-line">{appointment.details.medical_records.history}</p>
                    </div>
                  )}

                  {/* Lab Results */}
                  {appointment.details.medical_records.lab_results &&
                   appointment.details.medical_records.lab_results.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h3 className="font-medium text-lg mb-2 text-slate-800">Lab Results</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-200">
                              <th className="p-2 text-left">Test</th>
                              <th className="p-2 text-left">Result</th>
                              <th className="p-2 text-left">Normal Range</th>
                              <th className="p-2 text-left">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointment.details.medical_records.lab_results.map((result, index) => (
                              <tr
                                key={index}
                                className={`${result.is_abnormal ? 'bg-red-50' : 'bg-green-50'}`}
                              >
                                <td className="p-2 border-b border-slate-200">{result.test_name}</td>
                                <td className={`p-2 border-b border-slate-200 ${result.is_abnormal ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                  {result.result} {result.unit}
                                </td>
                                <td className="p-2 border-b border-slate-200">{result.normal_range || 'N/A'}</td>
                                <td className="p-2 border-b border-slate-200">{result.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* No data message */}
                  {!appointment.details.medical_records.diagnosis &&
                   !appointment.details.medical_records.treatment &&
                   !appointment.details.medical_records.prescription &&
                   !appointment.details.medical_records.notes &&
                   !appointment.details.medical_records.follow_up &&
                   !appointment.details.medical_records.history &&
                   (!appointment.details.medical_records.lab_results ||
                    appointment.details.medical_records.lab_results.length === 0) && (
                    <div className="text-center p-8 bg-slate-50 rounded-md">
                      <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900">No medical records available</p>
                      <p className="text-gray-500 mt-1">
                        There are no detailed medical records for this appointment.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 bg-slate-50 rounded-md">
                  <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No medical records available</p>
                  <p className="text-gray-500 mt-1">
                    There are no medical records for this appointment.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowMedicalRecordsModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
