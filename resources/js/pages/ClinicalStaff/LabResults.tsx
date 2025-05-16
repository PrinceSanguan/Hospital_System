import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import debounce from 'lodash/debounce';
import PatientSearch from '@/components/PatientSearch';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';

interface Patient {
    id: number;
    name: string;
    reference_number: string;
}

interface LabResult {
    id: number;
    patient: {
        id: number;
        name: string;
        reference_number: string;
    };
    test_type: string;
    test_date: string;
    file_path: string;
    notes: string;
}

interface Props {
    labResults: {
        data: LabResult[];
    };
    patient?: Patient;
    isPatientView?: boolean;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        }
    }
}

export default function LabResults({ labResults, patient, isPatientView, auth }: Props) {
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { data, setData, processing, errors, reset } = useForm({
        patient_id: patient?.id?.toString() || '',
        test_type: '',
        test_date: '',
        scan_file: null as File | null,
        notes: '',
    });

    const searchPatients = debounce(async (term: string) => {
        if (term.length > 2) {
            try {
                await axios.get(route('api.patients.search', { term }));
                // We'll use the response data in another function
            } catch (error) {
                console.error('Error searching patients:', error);
            }
        }
    }, 300);

    useEffect(() => {
        searchPatients(searchTerm);
    }, [searchTerm]);

    const handlePatientSelect = (patient: Patient) => {
        setData('patient_id', patient.id?.toString() || '');
        setSearchTerm('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            // Check file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('File size exceeds 10MB limit');
                return;
            }

            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setUploadError('File type not supported. Please upload PDF, JPG, or PNG files only.');
                return;
            }

            setUploadError(null);
            setData('scan_file', file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitted(true);
        setUploadError(null);

        console.log('Form submission started');

        // Form validation
        if (!data.patient_id && !isPatientView) {
            console.error('Patient ID is required');
            setUploadError('Patient ID is required');
            setFormSubmitted(false);
            return;
        }

        if (!data.test_type) {
            console.error('Test type is required');
            setUploadError('Test type is required');
            setFormSubmitted(false);
            return;
        }

        if (!data.test_date) {
            console.error('Test date is required');
            setUploadError('Test date is required');
            setFormSubmitted(false);
            return;
        }

        if (!data.scan_file) {
            console.error('Scan file is required');
            setUploadError('Scan file is required');
            setFormSubmitted(false);
            return;
        }

        // Create a FormData object for the multipart form submission
        const formData = new FormData();
        formData.append('patient_id', data.patient_id || (patient?.id?.toString() || ''));
        formData.append('test_type', data.test_type);
        formData.append('test_date', data.test_date);
        if (data.scan_file) {
            formData.append('scan_file', data.scan_file);
            console.log('File added to form data:', data.scan_file.name, data.scan_file.type, data.scan_file.size);
        }
        formData.append('notes', data.notes || '');

        console.log('Submitting form data to server');

        // Use axios for direct form submission
        axios.post(route('staff.lab-results.store'), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            }
        })
        .then(response => {
            console.log('Lab result saved successfully', response);
            reset();
            setIsImportOpen(false);
            setFormSubmitted(false);
            window.location.reload();
        })
        .catch(error => {
            console.error('Form submission errors:', error);
            console.error('Response data:', error.response?.data);
            setFormSubmitted(false);

            // Set detailed error message
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                if (Array.isArray(firstError) && firstError.length > 0) {
                    setUploadError(firstError[0]);
                } else {
                    setUploadError('Error uploading file. Please try again.');
                }
            } else if (error.response?.data?.message) {
                setUploadError(error.response.data.message);
            } else {
                setUploadError('Error uploading file. Please try again.');
            }
        });
    };

    return (
        <>
            <Head title="Lab Results" />

            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar user={auth.user} />

                <div className="flex flex-1 flex-col">
                    <Header user={auth.user} />

                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">
                                            {isPatientView ? `Lab Results for ${patient?.name}` : 'Lab Results'}
                                        </h2>
                                        {isPatientView && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Patient Reference #: {patient?.reference_number}
                                            </p>
                                        )}
                                    </div>
                                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
                                                Import Lab Result
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Import Lab Result</DialogTitle>
                                                <DialogDescription>
                                                    Upload a lab result for a patient. Fill in all required fields.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                {!isPatientView && (
                                                    <PatientSearch
                                                        onSelect={handlePatientSelect}
                                                        required={true}
                                                    />
                                                )}

                                                {uploadError && (
                                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                                        {uploadError}
                                                    </div>
                                                )}

                                                <div>
                                                    <Label htmlFor="test_type">Test Type</Label>
                                                    <Input
                                                        id="test_type"
                                                        type="text"
                                                        value={data.test_type}
                                                        onChange={e => setData('test_type', e.target.value)}
                                                        required
                                                    />
                                                    {errors.test_type && (
                                                        <p className="text-sm text-red-600">{errors.test_type}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="test_date">Test Date</Label>
                                                    <Input
                                                        id="test_date"
                                                        type="datetime-local"
                                                        value={data.test_date}
                                                        onChange={e => setData('test_date', e.target.value)}
                                                        required
                                                    />
                                                    {errors.test_date && (
                                                        <p className="text-sm text-red-600">{errors.test_date}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="scan_file">Scan File</Label>
                                                    <Input
                                                        id="scan_file"
                                                        type="file"
                                                        onChange={handleFileChange}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        required
                                                    />
                                                    {errors.scan_file && (
                                                        <p className="text-sm text-red-600">{errors.scan_file}</p>
                                                    )}
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Accepted formats: PDF, JPG, JPEG, PNG (max 10MB)
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes">Notes</Label>
                                                    <Input
                                                        id="notes"
                                                        type="text"
                                                        value={data.notes}
                                                        onChange={e => setData('notes', e.target.value)}
                                                    />
                                                    {errors.notes && (
                                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                                    )}
                                                </div>
                                                <Button type="submit" disabled={processing || formSubmitted}>
                                                    {formSubmitted ? 'Saving...' : 'Import'}
                                                </Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="mb-4">
                                    <PatientSearch
                                        onSelect={(patient) => {
                                            setSearchTerm(patient?.reference_number || '');
                                        }}
                                        label="Filter Results"
                                        placeholder="Search by patient name or reference number..."
                                        className="max-w-sm"
                                    />
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {!isPatientView && (
                                                <>
                                                    <TableHead>Patient Name</TableHead>
                                                    <TableHead>Reference #</TableHead>
                                                </>
                                            )}
                                            <TableHead>Test Type</TableHead>
                                            <TableHead>Test Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {labResults.data.length > 0 ? (
                                            labResults.data.map((result) => (
                                                <TableRow key={result.id}>
                                                    {!isPatientView && (
                                                        <>
                                                            <TableCell>{result.patient.name}</TableCell>
                                                            <TableCell>{result.patient.reference_number}</TableCell>
                                                        </>
                                                    )}
                                                    <TableCell>{result.test_type}</TableCell>
                                                    <TableCell>
                                                        {format(new Date(result.test_date), 'PPpp')}
                                                    </TableCell>
                                                    <TableCell className="space-x-2">
                                                        <Link href={route('staff.lab-results.show', result.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                                View Lab Result
                                                            </Button>
                                                        </Link>
                                                        <a href={route('staff.lab-results.download', result.id)} download>
                                                            <Button variant="outline" size="sm">
                                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                const url = route('staff.lab-results.destroy', result.id);
                                                                router.delete(url);
                                                            }}
                                                            className="inline-block"
                                                        >
                                                            <Button variant="outline" size="sm" type="submit">
                                                                <TrashIcon className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={isPatientView ? 3 : 5} className="text-center py-6 text-gray-500">
                                                    No lab results found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
