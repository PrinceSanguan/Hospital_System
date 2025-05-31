import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

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

interface VitalSigns {
    blood_pressure?: string;
    heart_rate?: string;
    respiratory_rate?: string;
    temperature?: string;
    height?: string;
    weight?: string;
    bmi?: string;
}

interface PastRecord {
    id: number;
    record_type: string;
    appointment_date: string;
    details?: string;
    vital_signs?: VitalSigns;
    findings?: string;
    diagnosis?: string;
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
    vital_signs?: VitalSigns;
    past_records?: PastRecord[];
}

interface Props {
    user: DoctorUser;
    consultations: Consultation[];
}

export default function ConsultationHistory({ user, consultations }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Sort consultations by id ascending (oldest first, newest last)
    const sortedConsultations = [...consultations].sort((a, b) => a.id - b.id);

    // Filter consultations based on search term
    const filteredConsultations = sortedConsultations.filter(
        (consultation) =>
            consultation.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (consultation.reason && consultation.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openConsultationDetails = async (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setIsModalOpen(true);

        // Fetch patient's past medical records
        setLoading(true);
        try {
            const response = await axios.get(`/doctor/patient/${consultation.patient_id}/records`);
            if (response.data && response.data.records) {
                setSelectedConsultation({
                    ...consultation,
                    past_records: response.data.records
                });
            }
        } catch (error) {
            console.error('Error fetching patient records:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM d, yyyy');
    };

    // Extract vital signs from consultation details if available
    const getVitalSigns = (consultation: Consultation) => {
        if (!consultation) return null;

        try {
            if (consultation.vital_signs) {
                return consultation.vital_signs;
            }

            if (consultation.details) {
                const details = typeof consultation.details === 'string'
                    ? JSON.parse(consultation.details)
                    : consultation.details;

                if (details && details.vital_signs) {
                    return details.vital_signs;
                }
            }
        } catch (e) {
            console.error('Error parsing vital signs:', e);
        }

        return null;
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
                    <DialogContent className="sm:max-w-[650px]">
                        <DialogHeader>
                            <DialogTitle>Consultation Details</DialogTitle>
                        </DialogHeader>
                        {selectedConsultation && (
                            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
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

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-sm text-gray-500">Reason for Visit</h4>
                                    <p className="text-base">{selectedConsultation.reason || 'Not specified'}</p>
                                </div>

                                {/* Vital Signs Section */}
                                {getVitalSigns(selectedConsultation) && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-base mb-2 text-primary">Vital Signs</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {getVitalSigns(selectedConsultation)?.blood_pressure && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">Blood Pressure</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.blood_pressure}</p>
                                                </div>
                                            )}
                                            {getVitalSigns(selectedConsultation)?.heart_rate && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">Heart Rate</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.heart_rate} bpm</p>
                                                </div>
                                            )}
                                            {getVitalSigns(selectedConsultation)?.respiratory_rate && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">Respiratory Rate</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.respiratory_rate} breaths/min</p>
                                                </div>
                                            )}
                                            {getVitalSigns(selectedConsultation)?.temperature && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">Temperature</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.temperature}°C</p>
                                                </div>
                                            )}
                                            {getVitalSigns(selectedConsultation)?.height && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">Height</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.height} cm</p>
                                                </div>
                                            )}
                                            {getVitalSigns(selectedConsultation)?.weight && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">Weight</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.weight} kg</p>
                                                </div>
                                            )}
                                            {getVitalSigns(selectedConsultation)?.bmi && (
                                                <div>
                                                    <h5 className="font-medium text-sm text-gray-500">BMI</h5>
                                                    <p>{getVitalSigns(selectedConsultation)?.bmi}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Past Findings Section */}
                                {selectedConsultation.past_records && selectedConsultation.past_records.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-base mb-2 text-primary">Past Medical Records</h4>
                                        <div className="space-y-3">
                                            {selectedConsultation.past_records.slice(0, 3).map((record) => (
                                                <div key={record.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h5 className="font-medium">{record.record_type === 'medical_record' ? 'Medical Record' :
                                                                               record.record_type === 'laboratory' ? 'Laboratory Test' :
                                                                               'Medical Checkup'}</h5>
                                                        <span className="text-sm text-gray-500">{formatDate(record.appointment_date)}</span>
                                                    </div>
                                                    {record.diagnosis && (
                                                        <div className="mb-1">
                                                            <span className="text-sm font-medium text-gray-500">Diagnosis: </span>
                                                            <span>{record.diagnosis}</span>
                                                        </div>
                                                    )}
                                                    {record.findings && (
                                                        <div className="text-sm">
                                                            <span className="font-medium text-gray-500">Findings: </span>
                                                            <span>{record.findings}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {selectedConsultation.past_records.length > 3 && (
                                                <div className="text-center">
                                                    <Button variant="link" onClick={() => window.open(`/doctor/patient/${selectedConsultation.patient_id}/medical-records`, '_blank')}>
                                                        View All Medical Records
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-sm text-gray-500">Notes</h4>
                                    <p className="text-base">{selectedConsultation.notes || 'No notes available'}</p>
                                </div>

                                <div className="border-t pt-4">
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
