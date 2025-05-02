import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserData } from '@/types';
import { Search, User } from 'lucide-react';

interface PatientSearchProps {
  user: UserData;
  searchTerm?: string;
  patients?: Array<{
    id: number;
    name: string;
    email: string;
    created_at: string;
  }>;
}

const PatientSearch = ({ user, searchTerm = '', patients = [] }: PatientSearchProps) => {
  const { data, setData, get, processing } = useForm({
    search: searchTerm,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    get(route('doctor.patients.search'), {
      preserveState: true,
    });
  };

  return (
    <DoctorLayout user={user}>
      <Head title="Patient Search" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Patient Search</h1>

          {/* Search Form */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search patients by name or email..."
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={processing}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>

              {patients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm ? 'No patients found matching your search criteria.' : 'Enter a search term to find patients.'}
                </div>
              ) : (
                <div className="divide-y">
                  {patients.map((patient) => (
                    <div key={patient.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{patient.name}</h3>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        asChild
                      >
                        <a href={route('doctor.patients.show', patient.id)}>View Profile</a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default PatientSearch;
