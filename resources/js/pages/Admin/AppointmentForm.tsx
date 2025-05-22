import React, { useState, useEffect } from "react";
import { useForm, Link } from "@inertiajs/react";
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface RecordType {
  value: string;
  label: string;
}

interface AppointmentFormProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  patients: Patient[];
  doctors: Doctor[];
  recordTypes: RecordType[];
}

export default function AppointmentForm({ user, patients, doctors, recordTypes }: AppointmentFormProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    patient_id: "",
    assigned_doctor_id: "",
    record_type: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add effect to handle errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please check the form for errors");
    }
  }, [errors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    const newErrors: Record<string, string> = {};
    
    if (!data.patient_id) {
      newErrors.patient_id = "Please select a patient";
    }
    
    if (!data.record_type) {
      newErrors.record_type = "Please select an appointment type";
    }
    
    if (!data.appointment_date) {
      newErrors.appointment_date = "Please select a date";
    }
    
    if (!data.appointment_time) {
      newErrors.appointment_time = "Please select a time";
    }
    
    if (!data.reason) {
      newErrors.reason = "Please enter a reason for the appointment";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    toast.promise(
      new Promise((resolve) => {
        post(route('admin.appointments.store'), {
          onSuccess: () => {
            resolve(true);
          },
          onError: () => {
            setIsSubmitting(false);
            resolve(false);
          },
          onFinish: () => {
            setIsSubmitting(false);
          }
        });
      }),
      {
        loading: 'Creating appointment...',
        success: 'Appointment created successfully!',
        error: 'Failed to create appointment.'
      }
    );
  };

  // Format today's date as YYYY-MM-DD for the date input min value
  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={route('admin.appointments')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Appointments
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create New Appointment</h1>
              <p className="text-muted-foreground">Schedule a new appointment for a patient</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Information</CardTitle>
              <CardDescription>
                Fill in the details for the new appointment
              </CardDescription>
            </CardHeader>            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FormLabel htmlFor="patient_id">Patient <span className="text-red-500">*</span></FormLabel>
                      <Select 
                        value={data.patient_id} 
                        onValueChange={value => {
                          setData('patient_id', value);
                          if (formErrors.patient_id) {
                            setFormErrors({...formErrors, patient_id: ""});
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.name} ({patient.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(errors.patient_id || formErrors.patient_id) && (
                        <p className="text-sm text-red-500">{errors.patient_id || formErrors.patient_id}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="assigned_doctor_id">Doctor</FormLabel>
                      <Select 
                        value={data.assigned_doctor_id} 
                        onValueChange={value => setData('assigned_doctor_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a doctor (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(doctor => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                              Dr. {doctor.name} ({doctor.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.assigned_doctor_id && (
                        <p className="text-sm text-red-500">{errors.assigned_doctor_id}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FormLabel htmlFor="appointment_date">Appointment Date <span className="text-red-500">*</span></FormLabel>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="appointment_date"
                          type="date"
                          min={today}
                          className="pl-9"
                          value={data.appointment_date}
                          onChange={(e) => {
                            setData('appointment_date', e.target.value);
                            if (formErrors.appointment_date) {
                              setFormErrors({...formErrors, appointment_date: ""});
                            }
                          }}
                        />
                      </div>
                      {(errors.appointment_date || formErrors.appointment_date) && (
                        <p className="text-sm text-red-500">{errors.appointment_date || formErrors.appointment_date}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="appointment_time">Appointment Time <span className="text-red-500">*</span></FormLabel>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="appointment_time"
                          type="time"
                          className="pl-9"
                          value={data.appointment_time}
                          onChange={(e) => {
                            setData('appointment_time', e.target.value);
                            if (formErrors.appointment_time) {
                              setFormErrors({...formErrors, appointment_time: ""});
                            }
                          }}
                        />
                      </div>
                      {(errors.appointment_time || formErrors.appointment_time) && (
                        <p className="text-sm text-red-500">{errors.appointment_time || formErrors.appointment_time}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="record_type">Appointment Type <span className="text-red-500">*</span></FormLabel>
                    <Select 
                      value={data.record_type} 
                      onValueChange={value => {
                        setData('record_type', value);
                        if (formErrors.record_type) {
                          setFormErrors({...formErrors, record_type: ""});
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select appointment type" />
                      </SelectTrigger>
                      <SelectContent>                        {recordTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(errors.record_type || formErrors.record_type) && (
                      <p className="text-sm text-red-500">{errors.record_type || formErrors.record_type}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="reason">Reason for Visit <span className="text-red-500">*</span></FormLabel>
                    <Input
                      id="reason"
                      value={data.reason}
                      onChange={(e) => {
                        setData('reason', e.target.value);
                        if (formErrors.reason) {
                          setFormErrors({...formErrors, reason: ""});
                        }
                      }}
                      placeholder="Brief reason for the appointment"
                    />
                    {(errors.reason || formErrors.reason) && (
                      <p className="text-sm text-red-500">{errors.reason || formErrors.reason}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="notes">Additional Notes</FormLabel>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Any additional notes or instructions"
                      rows={4}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-500">{errors.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={processing || isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {processing || isSubmitting ? "Creating..." : "Create Appointment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
