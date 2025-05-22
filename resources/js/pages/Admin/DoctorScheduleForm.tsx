import React, { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ChevronLeft, Calendar, Clock } from "lucide-react";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface DoctorScheduleFormProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  doctors: Doctor[];
}

export default function DoctorScheduleForm({ user, doctors }: DoctorScheduleFormProps) {
  const { data, setData, post, processing, errors } = useForm({
    doctor_id: "",
    date: "",
    start_time: "",
    end_time: "",
    status: "pending",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.doctor-schedules.store'));
  };

  // Format today's date as YYYY-MM-DD for the date input min value
  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={route('admin.doctor-schedules')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Doctor Schedules
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create New Doctor Schedule</h1>
              <p className="text-muted-foreground">Add a new time slot for a doctor's availability</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Information</CardTitle>
              <CardDescription>
                Enter the details for the doctor's schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="doctor_id">Doctor</Label>
                    <Select 
                      value={data.doctor_id} 
                      onValueChange={value => setData('doctor_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doctor => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            Dr. {doctor.name} ({doctor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.doctor_id && (
                      <p className="text-sm text-red-500">{errors.doctor_id}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="date">Schedule Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          min={today}
                          className="pl-9"
                          value={data.date}
                          onChange={(e) => setData('date', e.target.value)}
                        />
                      </div>
                      {errors.date && (
                        <p className="text-sm text-red-500">{errors.date}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="start_time"
                          type="time"
                          className="pl-9"
                          value={data.start_time}
                          onChange={(e) => setData('start_time', e.target.value)}
                        />
                      </div>
                      {errors.start_time && (
                        <p className="text-sm text-red-500">{errors.start_time}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="end_time"
                          type="time"
                          className="pl-9"
                          value={data.end_time}
                          onChange={(e) => setData('end_time', e.target.value)}
                        />
                      </div>
                      {errors.end_time && (
                        <p className="text-sm text-red-500">{errors.end_time}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Schedule Status</Label>
                    <Select 
                      value={data.status} 
                      onValueChange={value => setData('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-500">{errors.status}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Any additional notes or instructions for this schedule"
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? "Creating..." : "Create Schedule"}
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
