import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Sidebar } from '@/components/doctor/sidebar';
import { Header } from '@/components/doctor/header';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';

interface DoctorUser {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface Patient {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

interface Consultation {
    id: number;
    patient_id: number;
    assigned_doctor_id: number;
    status: string;
    appointment_date: string;
    appointment_time?: string;
    reason?: string;
    notes?: string;
    completed_at?: string;
    patient: Patient;
}

interface Props {
    user: DoctorUser;
    consultations: Consultation[];
}

export default function ConsultationHistory({ user, consultations }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sort consultations by id ascending (oldest first, newest last)
    const sortedConsultations = [...consultations].sort((a, b) => a.id - b.id);

    // Filter consultations based on search term
    const filteredConsultations = sortedConsultations.filter(
        (consultation) =>
            consultation.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (consultation.reason && consultation.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openConsultationDetails = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setIsModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM d, yyyy');
    };

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            <Head title="Consultation History" />
            <Sidebar user={user} />

            <div className="flex flex-col flex-1">
                <Header user={user} />

                <main className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">Consultation History</h1>
                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Previous Consultations</CardTitle>
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search patient or reason..."
                                        className="pl-8 w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booking #</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Completed On</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredConsultations.length > 0 ? (
                                        filteredConsultations.map((consultation) => (
                                            <TableRow key={consultation.id}>
                                                <TableCell>Booking #{consultation.id}</TableCell>
                                                <TableCell>{consultation.patient.name}</TableCell>
                                                <TableCell>{formatDate(consultation.appointment_date)}</TableCell>
                                                <TableCell>{consultation.appointment_time || 'N/A'}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {consultation.reason || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {consultation.completed_at ? formatDate(consultation.completed_at) : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openConsultationDetails(consultation)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4">
                                                No consultation history found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>

                {/* Consultation Details Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Consultation Details</DialogTitle>
                        </DialogHeader>
                        {selectedConsultation && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-500">Patient</h4>
                                        <p className="text-base">{selectedConsultation.patient.name}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-500">Booking #</h4>
                                        <p className="text-base">#{selectedConsultation.id}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-500">Date</h4>
                                        <p className="text-base">{formatDate(selectedConsultation.appointment_date)}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-500">Time</h4>
                                        <p className="text-base">{selectedConsultation.appointment_time || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-gray-500">Reason for Visit</h4>
                                    <p className="text-base">{selectedConsultation.reason || 'Not specified'}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-gray-500">Notes</h4>
                                    <p className="text-base">{selectedConsultation.notes || 'No notes available'}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-gray-500">Completed On</h4>
                                    <p className="text-base">
                                        {selectedConsultation.completed_at
                                            ? formatDate(selectedConsultation.completed_at)
                                            : 'Not recorded'}
                                    </p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
