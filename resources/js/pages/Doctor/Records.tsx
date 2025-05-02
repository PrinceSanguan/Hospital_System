import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Search,
    Filter,
    ArrowUpDown
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserData } from '@/types';

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface MedicalRecord {
    id: number;
    patient: Patient;
    record_date: string;
    record_type: string;
    diagnosis: string;
    lab_results?: string | null;
    prescription?: string | null;
    notes?: string | null;
    status: string;
}

interface RecordsProps {
    user: UserData;
    medicalRecords: MedicalRecord[];
}

export default function Records({ user, medicalRecords = [] }: RecordsProps) {
    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Sample medical records data for UI demo
    const sampleMedicalRecords: MedicalRecord[] = [
        {
            id: 1,
            patient: {
                id: 101,
                name: "John Smith",
                email: "john.smith@example.com"
            },
            record_date: "2023-07-15",
            record_type: "medical_checkup",
            diagnosis: "Hypertension, Stage 1",
            prescription: "Lisinopril 10mg, once daily",
            notes: "Patient needs to monitor blood pressure weekly. Follow-up in 3 months.",
            status: "completed"
        },
        {
            id: 2,
            patient: {
                id: 102,
                name: "Maria Garcia",
                email: "maria.garcia@example.com"
            },
            record_date: "2023-07-28",
            record_type: "laboratory",
            diagnosis: "Anemia",
            lab_results: "Hemoglobin: 10.2 g/dL, Ferritin: 15 ng/mL",
            prescription: "Ferrous sulfate 325mg, twice daily",
            status: "completed"
        },
        {
            id: 3,
            patient: {
                id: 103,
                name: "Robert Johnson",
                email: "robert.johnson@example.com"
            },
            record_date: "2023-08-05",
            record_type: "medical_checkup",
            diagnosis: "Type 2 Diabetes",
            prescription: "Metformin 500mg, twice daily",
            notes: "Diet and exercise plan provided. Schedule follow-up in 1 month.",
            status: "pending_review"
        },
        {
            id: 4,
            patient: {
                id: 104,
                name: "Sarah Williams",
                email: "sarah.williams@example.com"
            },
            record_date: "2023-08-10",
            record_type: "laboratory",
            diagnosis: "Thyroid disorder",
            lab_results: "TSH: 5.8 mIU/L, T4: 0.9 ng/dL",
            prescription: "Levothyroxine 50mcg, once daily",
            status: "completed"
        },
        {
            id: 5,
            patient: {
                id: 105,
                name: "Michael Brown",
                email: "michael.brown@example.com"
            },
            record_date: "2023-08-12",
            record_type: "medical_checkup",
            diagnosis: "Upper respiratory infection",
            prescription: "Amoxicillin 500mg, three times daily for 7 days",
            notes: "Rest and increased fluid intake recommended.",
            status: "pending_review"
        }
    ];

    // Use either real data or sample data
    const displayRecords = medicalRecords.length > 0 ? medicalRecords : sampleMedicalRecords;

    // Get record type label
    const getRecordTypeLabel = (type: string): string => {
        switch (type) {
            case 'medical_checkup':
                return 'Medical Checkup';
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
                                <Button asChild>
                                <Link href={route('doctor.records.index')}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        New Record
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Tabs for different record views */}
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="mb-4 grid w-full grid-cols-4 md:w-auto md:grid-cols-4">
                                <TabsTrigger value="all">All Records</TabsTrigger>
                                <TabsTrigger value="checkups">Medical Checkups</TabsTrigger>
                                <TabsTrigger value="labs">Lab Results</TabsTrigger>
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
                                            />
                                            </div>
                                                <Select defaultValue="all">
                                            <SelectTrigger id="record-type">
                                                <Filter className="mr-2 h-4 w-4" />
                                                <span>Record Type</span>
                                                    </SelectTrigger>
                                            <SelectContent position="popper">
                                                        <SelectItem value="all">All Types</SelectItem>
                                                        <SelectItem value="medical_checkup">Medical Checkup</SelectItem>
                                                        <SelectItem value="laboratory">Laboratory Test</SelectItem>
                                                        <SelectItem value="vaccination">Vaccination</SelectItem>
                                                        <SelectItem value="surgery">Surgery</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                        <Select defaultValue="newest">
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
                                {displayRecords.length} record(s) found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                        {displayRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="py-3 px-2">
                                                    <div className="font-medium">{record.patient.name}</div>
                                                    <div className="text-xs text-gray-500">{record.patient.email}</div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    {getRecordTypeLabel(record.record_type)}
                                                </td>
                                                <td className="py-3 px-2">
                                                    {formatDate(record.record_date)}
                                                </td>
                                                <td className="py-3 px-2 max-w-[200px] truncate" title={record.diagnosis}>
                                                    {record.diagnosis}
                                                </td>
                                                <td className="py-3 px-2">
                                                            <Badge
                                                        variant={
                                                            record.status === 'completed' ? 'default' :
                                                            record.status === 'pending_review' ? 'outline' :
                                                            'default'
                                                        }
                                                    >
                                                        {record.status.replace('_', ' ')}
                                                            </Badge>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={route('doctor.records.index')}>
                                                            View
                                                        </Link>
                                                        </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                                    </div>
                                                </CardContent>
                                            </Card>
                    </div>
            </div>
        </DoctorLayout>
    );
}
