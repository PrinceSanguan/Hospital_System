import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    FileText,
    Search,
    Filter,
    ArrowUpDown,
    Download
} from "lucide-react";
import { Link } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

interface User {
    name: string;
    email: string;
    role?: string;
}

interface RecordsProps {
    user: User;
    medicalRecords: MedicalRecord[];
}

export default function DoctorRecords({ user, medicalRecords = [] }: RecordsProps) {
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
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header user={user} />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Records</h1>
                                <p className="text-gray-500 dark:text-gray-400">
                                    View and manage patient medical records
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild>
                                    <Link href={route('doctor.records.create')}>
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
                                        <div className="grid gap-4 md:grid-cols-4 items-end">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium leading-none">Date Range</label>
                                                <Select defaultValue="last3Months">
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select period" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="thisMonth">This Month</SelectItem>
                                                        <SelectItem value="last3Months">Last 3 Months</SelectItem>
                                                        <SelectItem value="last6Months">Last 6 Months</SelectItem>
                                                        <SelectItem value="lastYear">Last Year</SelectItem>
                                                        <SelectItem value="custom">Custom Range</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-medium leading-none">Record Type</label>
                                                <Select defaultValue="all">
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Filter by type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Types</SelectItem>
                                                        <SelectItem value="medical_checkup">Medical Checkup</SelectItem>
                                                        <SelectItem value="laboratory">Laboratory Test</SelectItem>
                                                        <SelectItem value="vaccination">Vaccination</SelectItem>
                                                        <SelectItem value="surgery">Surgery</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-medium leading-none">Search</label>
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                    <Input
                                                        type="search"
                                                        placeholder="Search by patient name or diagnosis..."
                                                        className="w-full bg-white pl-8"
                                                    />
                                                </div>
                                            </div>

                                            <Button variant="outline" className="flex items-center gap-1">
                                                <Filter className="h-4 w-4" />
                                                Apply Filters
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Records List */}
                                <div className="space-y-4">
                                    {displayRecords.map(record => (
                                        <Card key={record.id}>
                                            <CardContent className="p-4">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                            <h3 className="text-lg font-medium">
                                                                {record.patient.name} - {getRecordTypeLabel(record.record_type)}
                                                            </h3>
                                                            <Badge
                                                                className={`ml-2 ${
                                                                    record.status === 'completed'
                                                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                                }`}
                                                            >
                                                                {record.status === 'completed' ? 'Completed' : 'Pending Review'}
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-500">Created on {formatDate(record.record_date)}</p>
                                                        <div className="mt-3">
                                                            <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                                                            {record.prescription && (
                                                                <p className="text-sm mt-1"><span className="font-medium">Prescription:</span> {record.prescription}</p>
                                                            )}
                                                            {record.lab_results && (
                                                                <p className="text-sm mt-1"><span className="font-medium">Lab Results:</span> {record.lab_results}</p>
                                                            )}
                                                            {record.notes && (
                                                                <p className="text-sm mt-1"><span className="font-medium">Notes:</span> {record.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 gap-2">
                                                        <Button variant="outline" size="sm">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Export
                                                        </Button>
                                                        <Button variant="outline" size="sm">
                                                            View
                                                        </Button>
                                                        <Button variant="outline" size="sm">
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="checkups">
                                <div className="space-y-4">
                                    {displayRecords
                                        .filter(record => record.record_type === 'medical_checkup')
                                        .map(record => (
                                            <Card key={record.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-5 w-5 text-blue-600" />
                                                                <h3 className="text-lg font-medium">
                                                                    {record.patient.name} - Medical Checkup
                                                                </h3>
                                                                <Badge
                                                                    className={`ml-2 ${
                                                                        record.status === 'completed'
                                                                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                                    }`}
                                                                >
                                                                    {record.status === 'completed' ? 'Completed' : 'Pending Review'}
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-500">Created on {formatDate(record.record_date)}</p>
                                                            <div className="mt-3">
                                                                <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                                                                {record.prescription && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Prescription:</span> {record.prescription}</p>
                                                                )}
                                                                {record.notes && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Notes:</span> {record.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 gap-2">
                                                            <Button variant="outline" size="sm">
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Export
                                                            </Button>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="labs">
                                <div className="space-y-4">
                                    {displayRecords
                                        .filter(record => record.record_type === 'laboratory')
                                        .map(record => (
                                            <Card key={record.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-5 w-5 text-blue-600" />
                                                                <h3 className="text-lg font-medium">
                                                                    {record.patient.name} - Laboratory Test
                                                                </h3>
                                                                <Badge
                                                                    className={`ml-2 ${
                                                                        record.status === 'completed'
                                                                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                                    }`}
                                                                >
                                                                    {record.status === 'completed' ? 'Completed' : 'Pending Review'}
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-500">Created on {formatDate(record.record_date)}</p>
                                                            <div className="mt-3">
                                                                <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                                                                {record.lab_results && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Lab Results:</span> {record.lab_results}</p>
                                                                )}
                                                                {record.prescription && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Prescription:</span> {record.prescription}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 gap-2">
                                                            <Button variant="outline" size="sm">
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Export
                                                            </Button>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="pending">
                                <div className="space-y-4">
                                    {displayRecords
                                        .filter(record => record.status === 'pending_review')
                                        .map(record => (
                                            <Card key={record.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-5 w-5 text-blue-600" />
                                                                <h3 className="text-lg font-medium">
                                                                    {record.patient.name} - {getRecordTypeLabel(record.record_type)}
                                                                </h3>
                                                                <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                                    Pending Review
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-500">Created on {formatDate(record.record_date)}</p>
                                                            <div className="mt-3">
                                                                <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                                                                {record.prescription && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Prescription:</span> {record.prescription}</p>
                                                                )}
                                                                {record.lab_results && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Lab Results:</span> {record.lab_results}</p>
                                                                )}
                                                                {record.notes && (
                                                                    <p className="text-sm mt-1"><span className="font-medium">Notes:</span> {record.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 gap-2">
                                                            <Button variant="outline" size="sm">
                                                                Review
                                                            </Button>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
