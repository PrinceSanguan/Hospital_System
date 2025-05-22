import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

// Helper function to create asset URLs
const asset = (path: string): string => {
    // Base URL from window location
    const baseUrl = window.location.origin;
    // Join the base URL and path, ensuring no double slashes
    return `${baseUrl}/${path.replace(/^\/+/, '')}`;
};

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
    file_info?: {
        path: string;
        extension: string;
        filename: string;
        filesize: number;
    };
}

interface Props {
    labResult: LabResult;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        }
    }
}

export default function LabResultDetail({ labResult, auth }: Props) {
    const [fileType, setFileType] = useState<'pdf' | 'image' | 'unknown'>('unknown');
    const [viewUrl, setViewUrl] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        // Get the file extension
        const extension = labResult.file_info?.extension ||
                         labResult.file_path.split('.').pop()?.toLowerCase();

        // Set the file type based on extension
        if (extension === 'pdf') {
            setFileType('pdf');
        } else if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
            setFileType('image');
        } else {
            setFileType('unknown');
        }

        // Generate URLs for file operations
        setViewUrl(route('staff.lab-results.view', labResult.id));
    }, [labResult]);

    // Function to render the file preview based on file type
    const renderFilePreview = () => {
        // Function to get a valid URL
        const getValidUrl = () => {
            // Use the file_path as is from the asset helper
            return asset(labResult.file_path);
        };

        // Using direct path for more reliable rendering
        switch (fileType) {
            case 'pdf':
                return (
                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                        <iframe
                            src={viewUrl} // Use the view route directly
                            width="100%"
                            height="100%"
                            className="w-full h-full"
                            onError={(e) => {
                                console.error('PDF load error, trying fallback');
                                // If the view route fails, try direct download
                                (e.target as HTMLIFrameElement).src = route('staff.lab-results.direct-download', labResult.id);

                                toast({
                                    title: "Preview Notice",
                                    description: "Using fallback preview method",
                                    duration: 5000,
                                });
                            }}
                        >
                            <p className="p-4 text-center">
                                Your browser doesn't support PDF preview.
                                <Button
                                    variant="link"
                                    onClick={handleDownload}
                                    className="text-blue-600 underline ml-1"
                                >
                                    Download the PDF
                                </Button>
                            </p>
                        </iframe>
                    </div>
                );
            case 'image':
                return (
                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden p-2">
                        <img
                            src={getValidUrl()}
                            alt={`${labResult.test_type} result`}
                            className="mx-auto max-h-[600px] object-contain"
                            onError={(e) => {
                                console.error('Image load error, trying fallback');
                                // Try the view route as a fallback
                                (e.target as HTMLImageElement).src = viewUrl;

                                toast({
                                    title: "Preview Notice",
                                    description: "Using fallback preview method",
                                    duration: 5000,
                                });
                            }}
                        />
                    </div>
                );
            default:
                return (
                    <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
                        <DocumentIcon className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-600">
                            Preview not available for this file type
                        </p>
                    </div>
                );
        }
    };

    const handleDownload = async () => {
        try {
            setIsDownloading(true);

            // Show loading toast
            toast({
                title: "Downloading...",
                description: "Please wait while we prepare your file",
                duration: 3000,
            });

            console.log('Starting download for lab result ID:', labResult.id);

            // First, get the public URL for the file
            const urlResponse = await axios.get(route('staff.lab-results.public-url', labResult.id));

            console.log('URL response received:', urlResponse.data);

            if (!urlResponse.data || !urlResponse.data.url) {
                throw new Error('Failed to get download URL');
            }

            // Create a link and trigger download using the direct URL
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlResponse.data.url;
            a.download = urlResponse.data.filename || `${labResult.test_type.replace(/\s+/g, '-')}_result.${labResult.file_info?.extension || 'pdf'}`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
            }, 100);

            // Show success toast
            toast({
                title: "Download Complete",
                description: "Your file has been downloaded successfully",
                duration: 3000,
            });
        } catch (error: unknown) {
            console.error('Download error:', error);

            // Extract more details from the error if possible
            let errorMessage = "Could not download the file. Please try again later.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            // Check if it's an axios error
            const axiosError = error as {
                response?: {
                    status: number,
                    data: Record<string, unknown> | string | null
                }
            };
            if (axiosError.response) {
                console.error('Error response:', axiosError.response);
                errorMessage = `Server error: ${axiosError.response.status}`;
                if (axiosError.response.data && typeof axiosError.response.data === 'object') {
                    errorMessage = (axiosError.response.data as Record<string, unknown>).error as string || errorMessage;
                }
            }

            // Show error toast
            toast({
                title: "Download Failed",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setIsDownloading(false);
        }
    };

    // Add or modify a viewFile function that properly opens files in a new tab
    const viewFile = () => {
        const viewUrl = route('staff.lab-results.view', labResult.id);

        try {
            // First try the direct view route in a new tab
            const newWindow = window.open(viewUrl, '_blank');

            // Check if window was successfully opened
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                // If popup was blocked or failed, show a toast with download option
                toast({
                    title: "Popup may be blocked",
                    description: (
                        <div>
                            <p>Unable to open in new tab. Try direct download instead.</p>
                            <Button
                                className="mt-2"
                                variant="outline"
                                onClick={() => window.location.href = route('staff.lab-results.direct-download', labResult.id)}
                            >
                                Download File
                            </Button>
                        </div>
                    ),
                    duration: 5000,
                });
            } else {
                toast({
                    title: "Opening document",
                    description: "The document should open in a new tab",
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Error opening file:', error);

            // Fallback to direct download on error
            toast({
                title: "Error Opening File",
                description: (
                    <div>
                        <p>There was a problem opening the file. Try downloading instead.</p>
                        <Button
                            className="mt-2"
                            variant="outline"
                            onClick={() => window.location.href = route('staff.lab-results.direct-download', labResult.id)}
                        >
                            Download File
                        </Button>
                    </div>
                ),
                duration: 5000,
            });
        }
    };

    return (
        <>
            <Head title={`Lab Result - ${labResult.test_type}`} />

            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar user={auth.user} />

                <div className="flex flex-1 flex-col">
                    <Header user={auth.user} />

                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="mb-6">
                                    <Link href={route('staff.lab-results.index')}>
                                        <Button variant="outline" size="sm">
                                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                            Back to Lab Results
                                        </Button>
                                    </Link>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">
                                            Lab Result Details
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Test Type: {labResult.test_type}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Patient Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Name:</span>{' '}
                                                {labResult.patient.name}
                                            </p>
                                            <p>
                                                <span className="font-medium">Reference Number:</span>{' '}
                                                {labResult.patient.reference_number}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Test Details</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Test Date:</span>{' '}
                                                {format(new Date(labResult.test_date), 'PPpp')}
                                            </p>
                                            <p>
                                                <span className="font-medium">Notes:</span>{' '}
                                                {labResult.notes || 'No notes provided'}
                                            </p>
                                            {labResult.file_info && (
                                                <p>
                                                    <span className="font-medium">File Type:</span>{' '}
                                                    {labResult.file_info.extension.toUpperCase()}
                                                    {labResult.file_info.filesize > 0 && (
                                                        <span className="ml-2">
                                                            ({Math.round(labResult.file_info.filesize / 1024)} KB)
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Lab Result File</h3>

                                        {/* File Preview */}
                                        {renderFilePreview()}

                                        {/* Download Button */}
                                        <div className="mt-4">
                                            <Button
                                                onClick={handleDownload}
                                                disabled={isDownloading}
                                            >
                                                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                                                {isDownloading ? 'Downloading...' : 'Download Lab Result'}
                                            </Button>
                                        </div>

                                        {/* View Button */}
                                        <div className="mt-4">
                                            <Button
                                                onClick={viewFile}
                                            >
                                                <DocumentIcon className="mr-2 h-4 w-4" />
                                                View Lab Result
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
