import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserData } from '@/types';
import { Plus, User, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PatientsProps {
  user: UserData;
  patients: Array<{
    id: number;
    name: string;
    email: string;
    created_at: string;
  }>;
}

const Patients = ({ user, patients = [] }: PatientsProps) => {
  // State for the dialog
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Inertia form handler
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    medical_history: '',
    allergies: '',
    emergency_contact: '',
    emergency_contact_phone: ''
  });

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // The correct route should match the case of the folders as defined in routes
    post('/doctor/patients', {
      onSuccess: () => {
        reset();
        setIsCreateModalOpen(false);
      },
      onError: (errors) => {
        console.error('Form submission errors:', errors);
      }
    });
  };

  return (
    <DoctorLayout user={user}>
      <Head title="My Patients" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Patients</h1>
            <div className="flex space-x-2">
              <Button asChild variant="outline">
                <Link href={route('doctor.patients.search')}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Patients
                </Link>
              </Button>
            </div>
          </div>

          {/* Patients List */}
          <Card>
            <CardContent className="p-6">
              {patients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No patients assigned to you yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 px-2">Patient</th>
                        <th className="pb-3 px-2">Email</th>
                        <th className="pb-3 px-2">Registered On</th>
                        <th className="pb-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {patients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="py-4 px-2">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                              <span className="font-medium">{patient.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-gray-600">{patient.email}</td>
                          <td className="py-4 px-2 text-gray-600">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-2 text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link href={route('doctor.patients.show', patient.id)}>
                                View Profile
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Patient Dialog */}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's personal information and basic medical history. You can add detailed medical records after creating the patient.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Full Name
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="phone"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date_of_birth" className="text-right">
                      Date of Birth
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={data.date_of_birth}
                        onChange={(e) => setData('date_of_birth', e.target.value)}
                        className={errors.date_of_birth ? "border-red-500" : ""}
                      />
                      {errors.date_of_birth && (
                        <p className="mt-1 text-xs text-red-500">{errors.date_of_birth}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gender" className="text-right">
                      Gender
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={data.gender}
                        onValueChange={(value) => setData('gender', value)}
                      >
                        <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="address"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        className={errors.address ? "border-red-500" : ""}
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="medical_history" className="text-right pt-2">
                      Medical History
                    </Label>
                    <div className="col-span-3">
                      <textarea
                        id="medical_history"
                        value={data.medical_history}
                        onChange={(e) => setData('medical_history', e.target.value)}
                        className={`w-full min-h-[80px] rounded-md border ${errors.medical_history ? "border-red-500" : "border-input"} px-3 py-2 text-sm`}
                      />
                      {errors.medical_history && (
                        <p className="mt-1 text-xs text-red-500">{errors.medical_history}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="allergies" className="text-right pt-2">
                      Allergies
                    </Label>
                    <div className="col-span-3">
                      <textarea
                        id="allergies"
                        value={data.allergies}
                        onChange={(e) => setData('allergies', e.target.value)}
                        className={`w-full min-h-[80px] rounded-md border ${errors.allergies ? "border-red-500" : "border-input"} px-3 py-2 text-sm`}
                      />
                      {errors.allergies && (
                        <p className="mt-1 text-xs text-red-500">{errors.allergies}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emergency_contact" className="text-right">
                      Emergency Contact
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="emergency_contact"
                        value={data.emergency_contact}
                        onChange={(e) => setData('emergency_contact', e.target.value)}
                        className={errors.emergency_contact ? "border-red-500" : ""}
                      />
                      {errors.emergency_contact && (
                        <p className="mt-1 text-xs text-red-500">{errors.emergency_contact}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emergency_contact_phone" className="text-right">
                      Emergency Contact Phone
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="emergency_contact_phone"
                        value={data.emergency_contact_phone}
                        onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                        className={errors.emergency_contact_phone ? "border-red-500" : ""}
                      />
                      {errors.emergency_contact_phone && (
                        <p className="mt-1 text-xs text-red-500">{errors.emergency_contact_phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    Register Patient
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Patients;
