import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Search,
    Filter,
    ArrowUpDown,
    Eye
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserData } from '@/types';
import RecordForm from '@/components/doctor/RecordForm';

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface MedicalRecord {
    id: number;
    patient: Patient;
    patient_id: number;
    assigned_doctor_id: number;
    appointment_date: string;
    record_type: string;
    diagnosis?: string;
    details: string;
    lab_results?: Record<string, unknown>;
    vital_signs?: Record<string, unknown>;
    prescriptions?: Record<string, unknown>[];
    status: string;
    created_at: string;
}

interface Pagination {
    current_page: number;
    data: MedicalRecord[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{url: string | null, label: string, active: boolean}>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

interface RecordsProps {
    user: UserData;
    medicalRecords: Pagination;
    patients?: Patient[];
}

export default function Records({ user, medicalRecords, patients = [] }: RecordsProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [recordTypeFilter, setRecordTypeFilter] = useState('all');
    const [sortOption, setSortOption] = useState('newest');

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get record type label
    const getRecordTypeLabel = (type: string): string => {
        switch (type) {
            case 'medical_checkup':
                return 'Medical Checkup';
            case 'medical_record':
                return 'Medical Record';
            case 'laboratory':
                return 'Laboratory Test';
            case 'vaccination':
                return 'Vaccination';
            case 'surgery':
                return 'Surgery';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
        }
    };

    // Extract diagnosis from details if available
    const getDiagnosis = (record: MedicalRecord) => {
        // If diagnosis is explicitly set, use it
        if (record.diagnosis) {
            return record.diagnosis;
        }

        // Check if details is a JSON string
        if (record.details && typeof record.details === 'string') {
            // First try to parse it as JSON
            try {
                const detailsObj = JSON.parse(record.details);

                // Try to extract relevant information
                if (detailsObj.diagnosis) {
                    return detailsObj.diagnosis;
                } else if (detailsObj.reason) {
                    return detailsObj.reason;
                } else if (detailsObj.doctor_notes) {
                    return detailsObj.doctor_notes;
                } else if (detailsObj.notes) {
                    return detailsObj.notes;
                }
            } catch {
                // Not valid JSON or no relevant fields found
            }

            // Check if it looks like JSON but couldn't be parsed
            if (record.details.startsWith('{') && record.details.includes(':')) {
                // Try to extract a key/value manually
                const reasonMatch = /["']?reason["']?\s*:\s*["'](.+?)["']/i.exec(record.details);
                if (reasonMatch && reasonMatch[1]) {
                    return reasonMatch[1];
                }

                // Try to format it for better readability
                return record.details
                    .replace(/[{}]/g, '')  // Remove braces
                    .replace(/['"]/g, '')  // Remove quotes
                    .replace(/:/g, ': ')   // Add space after colons
                    .replace(/,/g, ', ')   // Add space after commas
                    .replace(/appointment_time/g, 'Time')
                    .replace(/reason/g, 'Reason');
            }
        }

        // Return a portion of details as fallback
        return record.details?.length > 50
            ? record.details.substring(0, 50) + '...'
            : record.details || 'No details provided';
    };

    // Safely access the actual records from pagination data
    const recordsData = Array.isArray(medicalRecords)
        ? medicalRecords
        : (medicalRecords?.data || []);

    // Filter records based on search and filter settings
    const filteredRecords = recordsData.filter(record => {
        // Ensure record exists before filtering
        if (!record || !record.patient) return false;

        // Search filter
        const matchesSearch = searchTerm === '' ||
            record.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (record.details && record.details.toLowerCase().includes(searchTerm.toLowerCase()));

        // Record type filter
        const matchesType = recordTypeFilter === 'all' || record.record_type === recordTypeFilter;

        return matchesSearch && matchesType;
    });

    // Sort the filtered records
    const sortedRecords = [...filteredRecords].sort((a, b) => {
        switch (sortOption) {
            case 'newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'oldest':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'patient_asc':
                return a.patient.name.localeCompare(b.patient.name);
            case 'patient_desc':
                return b.patient.name.localeCompare(a.patient.name);
            default:
                return 0;
        }
    });

    return (
        <DoctorLayout user={user}>
            <Head title="Medical Records" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Records</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                View and manage patient medical records
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Record
                            </Button>
                        </div>
                    </div>

                    {/* Tabs for different record views */}
                    <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setRecordTypeFilter(value)}>
                        <TabsList className="mb-4 grid w-full grid-cols-4 md:w-auto md:grid-cols-4">
                            <TabsTrigger value="all">All Records</TabsTrigger>
                            <TabsTrigger value="medical_checkup">Medical Checkups</TabsTrigger>
                            <TabsTrigger value="laboratory">Lab Results</TabsTrigger>
                            <TabsTrigger value="pending">Pending Review</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {/* Filter and Search */}
                            <Card className="mb-6">
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            <Input
                                                type="search"
                                                placeholder="Search records..."
                                                className="w-full bg-white pl-8 dark:bg-gray-950"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
                                            <SelectTrigger id="record-type">
                                                <Filter className="mr-2 h-4 w-4" />
                                                <span>Record Type</span>
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="medical_checkup">Medical Checkup</SelectItem>
                                                <SelectItem value="laboratory">Laboratory Test</SelectItem>
                                                <SelectItem value="medical_record">Medical Record</SelectItem>
                                                <SelectItem value="vaccination">Vaccination</SelectItem>
                                                <SelectItem value="surgery">Surgery</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={sortOption} onValueChange={setSortOption}>
                                            <SelectTrigger id="sort-order">
                                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                                <span>Sort By</span>
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="newest">Newest First</SelectItem>
                                                <SelectItem value="oldest">Oldest First</SelectItem>
                                                <SelectItem value="patient_asc">Patient Name (A-Z)</SelectItem>
                                                <SelectItem value="patient_desc">Patient Name (Z-A)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Records Table */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Records</CardTitle>
                            <CardDescription>
                                {sortedRecords.length} record(s) found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sortedRecords.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b text-sm">
                                                <th className="py-3 px-2 text-left font-medium">Patient</th>
                                                <th className="py-3 px-2 text-left font-medium">Record Type</th>
                                                <th className="py-3 px-2 text-left font-medium">Date</th>
                                                <th className="py-3 px-2 text-left font-medium">Diagnosis</th>
                                                <th className="py-3 px-2 text-left font-medium">Status</th>
                                                <th className="py-3 px-2 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sortedRecords.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="py-3 px-2">
                                                        <div className="font-medium">{record.patient.name}</div>
                                                        <div className="text-sm text-gray-500">{record.patient.email}</div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        {getRecordTypeLabel(record.record_type)}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        {formatDate(record.appointment_date)}
                                                    </td>
                                                    <td className="py-3 px-2 max-w-[200px] truncate">
                                                        {getDiagnosis(record)}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <Badge variant={record.status === 'completed' ? 'default' : 'outline'}>
                                                            {record.status === 'completed' ? 'Completed' : 'Pending Review'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link href={route('doctor.records.show', record.id)}>
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">No medical records found</p>
                                    <Button onClick={() => setIsCreateModalOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create First Record
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Record Form Modal */}
            <RecordForm
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                patients={patients}
            />
        </DoctorLayout>
    );
}
