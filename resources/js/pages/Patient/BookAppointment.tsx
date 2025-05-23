import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, router, useForm } from '@inertiajs/react';
import axios, { AxiosError } from 'axios';
import { differenceInYears, format } from 'date-fns';
import {
    AlertCircle,
    AlignJustify,
    Bell,
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    FilePlus,
    HomeIcon,
    Loader2,
    Stethoscope,
    UploadCloud,
    UserCircle2,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Doctor {
    id: number;
    name: string;
    specialty: string;
    availability: string[];
    image?: string;
    schedules?: Array<{
        specific_date?: string;
        day_of_week: number;
        is_available: boolean;
        max_appointments: number;
        start_time: string;
        end_time: string;
    }>;
}

interface BookAppointmentProps {
    user: {
        name: string;
        email: string;
        role: string;
    };
    doctors: Doctor[];
    notifications?: Array<{
        id: number;
        title: string;
        message: string;
        read: boolean;
        created_at: string;
        related_id?: number;
        related_type?: string;
    }>;
    preSelectedDoctorId?: number;
}

// Add a proper interface for the form data
interface AppointmentFormData {
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    notes: string;
    name: string;
    birthdate: string;
    age: string;
    height: string;
    weight: string;
    bmi: string;
    address: string;
    province: string;
    city: string;
    barangay: string;
    zip_code: string;
    has_previous_records: boolean;
    [key: string]: string | boolean; // More specific type for the index signature
}

// Fix the uploadedFiles type
interface UploadedFile {
    name: string;
    path: string;
    size: number;
    type: string;
}

export default function BookAppointment({ user, doctors, notifications = [], preSelectedDoctorId }: BookAppointmentProps) {
    const { data, setData, post, processing, errors, reset } = useForm<AppointmentFormData>({
        doctor_id: preSelectedDoctorId ? String(preSelectedDoctorId) : '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        notes: '',
        // Patient information
        name: user.name || '',
        birthdate: '',
        age: '',
        height: '',
        weight: '',
        bmi: '',
        address: '',
        province: '',
        city: '',
        barangay: '',
        zip_code: '',
        // Instead of storing the files in the form data, we'll use a separate state
        has_previous_records: false,
    });

    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('personal-info');
    const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
    const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [noRecordsChecked, setNoRecordsChecked] = useState(false);
    const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchText, setSearchText] = useState('');
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Set the pre-selected doctor on component mount
    useEffect(() => {
        if (preSelectedDoctorId) {
            const doctor = doctors.find((d) => d.id === preSelectedDoctorId) || null;
            setSelectedDoctor(doctor);

            // If doctor has schedules, set available dates
            if (doctor && doctor.schedules && doctor.schedules.length > 0) {
                fetchAvailableDates(doctor);
            }
        }
    }, [preSelectedDoctorId, doctors]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchSuggestions = async (text: string) => {
        if (!text || text.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const apiKey = 'b40c5a8ab6c248e7bc9baa3e81968454';
            const apiUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&apiKey=${apiKey}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            setSuggestions(data.features || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionSelect = (suggestion: any) => {
        const properties = suggestion.properties;

        setData('province', properties.state || '');
        setData('city', properties.city || '');
        setData('barangay', properties.district || '');
        setData('zip_code', properties.postcode || '');

        setSearchText(properties.formatted || '');
        setShowSuggestions(false);
    };

    // Helper function to fetch available dates for the selected doctor
    const fetchAvailableDates = (doctor: Doctor) => {
        // This would typically be an API call in a real application
        // For now, we'll simulate it by generating dates based on the doctor's schedules

        if (!doctor || !doctor.schedules) return;

        const today = new Date();
        const availableDates: Date[] = [];

        console.log('Doctor schedules:', doctor.schedules);

        // First, add specific dates if they exist - these take precedence
        const specificDates = doctor.schedules
            .filter((schedule) => schedule.specific_date && schedule.is_available && schedule.max_appointments > 0)
            .map((schedule) => new Date(schedule.specific_date!));

        console.log('Found specific dates:', specificDates);

        // Add all specific dates to available dates
        specificDates.forEach((date) => {
            if (date >= today) {
                availableDates.push(date);
            }
        });

        // Only check recurring schedules if no specific dates are set
        // or if the doctor has both specific dates and recurring schedules
        if (specificDates.length === 0) {
            // Check the next 30 days for availability based on day_of_week
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + i);

                // Get day of week (0 = Sunday, 6 = Saturday)
                const dayOfWeek = checkDate.getDay();

                // Check if doctor has a schedule for this day of week
                const hasScheduleForDay = doctor.schedules.some(
                    (schedule) =>
                        // Only use day_of_week if there's no specific date and doctor is available
                        !schedule.specific_date && schedule.day_of_week === dayOfWeek && schedule.is_available && schedule.max_appointments > 0,
                );

                if (hasScheduleForDay) {
                    availableDates.push(new Date(checkDate));
                }
            }
        }

        console.log('All available dates:', availableDates);
        setAvailableDates(availableDates);
    };

    // Calculate unread notifications
    const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;

    // Handle date change
    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate);
        if (newDate) {
            // Format date for backend as YYYY-MM-DD
            setData('appointment_date', format(newDate, 'yyyy-MM-dd'));

            // Reset time slot when date changes
            setSelectedTimeSlot(null);
            setData('appointment_time', '');

            // Fetch available time slots for this doctor and date
            fetchAvailableTimeSlots(newDate);
        }
    };

    // Fetch available time slots for a specific date
    const fetchAvailableTimeSlots = (selectedDate: Date) => {
        if (!selectedDoctor || !selectedDoctor.schedules) {
            setAvailableTimeSlots([]);
            return;
        }

        // Find schedules for this date or day of week
        const dayOfWeek = selectedDate.getDay();
        const dateString = format(selectedDate, 'yyyy-MM-dd');

        // Log for debugging
        console.log('Fetching time slots for:', {
            date: dateString,
            dayOfWeek,
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            schedules: selectedDoctor.schedules,
        });

        const matchingSchedules = selectedDoctor.schedules.filter((schedule) => {
            // Match by specific date
            if (schedule.specific_date === dateString) {
                console.log('Found specific date match:', schedule);
                return schedule.is_available && schedule.max_appointments > 0;
            }

            // Or match by day of week if no specific date and doctor is available
            const matchesDayOfWeek = schedule.day_of_week === dayOfWeek && schedule.is_available && schedule.max_appointments > 0;

            if (matchesDayOfWeek) {
                console.log('Found day of week match:', schedule);
            }

            return matchesDayOfWeek;
        });

        console.log('Matching schedules:', matchingSchedules);

        if (matchingSchedules.length === 0) {
            // If no matching schedules, provide default time slots for demonstration
            // In production, you would want to remove this fallback
            if (process.env.NODE_ENV !== 'production') {
                console.log('No matching schedules found - using default time slots');
                // Updated default time slots to show slots from 9:00 AM to 5:00 PM
                const defaultSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
                setAvailableTimeSlots(defaultSlots);

                // After setting available time slots, fetch booked slots
                fetchBookedTimeSlots(selectedDoctor.id, dateString);
                return;
            }
            setAvailableTimeSlots([]);
            return;
        }

        // Generate time slots from the schedules
        const slots: string[] = [];
        matchingSchedules.forEach((schedule) => {
            // Convert 24-hour time to 12-hour format for display
            const startTime = schedule.start_time.substring(0, 5); // HH:MM
            const endTime = schedule.end_time.substring(0, 5);

            console.log('Generating slots for schedule:', { startTime, endTime });

            // Extract hours and minutes
            const [startHourStr] = startTime.split(':');
            const [endHourStr, endMinStr] = endTime.split(':');

            const startHour = parseInt(startHourStr, 10);
            const endHour = parseInt(endHourStr, 10);
            const endMinutes = parseInt(endMinStr, 10);

            // Adjust end hour if it has minutes (e.g., 3:30 should generate slots until 3:00)
            const hasEndMinutes = endMinutes > 0;

            // Generate hour-by-hour slots
            let currentHour = startHour;
            while (currentHour < endHour) {
                // Format as 12-hour time
                const hourFormatted = currentHour % 12 || 12;
                const amPm = currentHour < 12 ? 'AM' : 'PM';

                const timeSlot = `${hourFormatted}:00 ${amPm}`;
                console.log('Adding time slot:', timeSlot);
                slots.push(timeSlot);

                currentHour++;
            }

            // Add the half-hour slot if the end time has minutes
            if (hasEndMinutes && endMinutes === 30) {
                const hourFormatted = endHour % 12 || 12;
                const amPm = endHour < 12 ? 'AM' : 'PM';

                const halfHourSlot = `${hourFormatted}:30 ${amPm}`;
                console.log('Adding half-hour slot:', halfHourSlot);
                slots.push(halfHourSlot);
            }
        });

        console.log('Generated time slots:', slots);
        setAvailableTimeSlots(slots);

        // After setting available time slots, fetch booked slots
        fetchBookedTimeSlots(selectedDoctor.id, dateString);
    };

    // Fetch booked time slots for the selected doctor and date
    const fetchBookedTimeSlots = async (doctorId: number, date: string) => {
        try {
            const response = await fetch(`${route('patient.appointments.check-booked-slots')}?doctor_id=${doctorId}&date=${date}`);
            const data = await response.json();

            if (data.success) {
                console.log('Booked time slots:', data.bookedTimeSlots);
                setBookedTimeSlots(data.bookedTimeSlots);
            } else {
                console.error('Error fetching booked time slots:', data.message);
                setBookedTimeSlots([]);
            }
        } catch (error) {
            console.error('Failed to fetch booked time slots:', error);
            setBookedTimeSlots([]);
        }
    };

    // Handle doctor selection
    const handleDoctorSelect = (doctorId: string) => {
        setData('doctor_id', doctorId);
        const doctor = doctors.find((d) => d.id.toString() === doctorId) || null;
        setSelectedDoctor(doctor);

        // Reset date and time when doctor changes
        setDate(undefined);
        setSelectedTimeSlot(null);
        setData('appointment_date', '');
        setData('appointment_time', '');

        // Fetch available dates for this doctor
        if (doctor) {
            fetchAvailableDates(doctor);
        }
    };

    // Handle time slot selection
    const handleTimeSlotSelect = (timeSlot: string) => {
        // Don't allow selection if the time slot is already booked
        if (isTimeSlotBooked(timeSlot)) {
            return;
        }

        setSelectedTimeSlot(timeSlot);

        // Parse the 12-hour time format to 24-hour format that the backend expects
        // e.g. "9:00 AM" -> "09:00:00", "2:00 PM" -> "14:00:00", "3:30 PM" -> "15:30:00"
        const [time, period] = timeSlot.split(' ');
        const [hourStr, minuteStr] = time.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (period === 'PM' && hour !== 12) {
            hour += 12;
        } else if (period === 'AM' && hour === 12) {
            hour = 0;
        }

        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        console.log(`Selected time: ${timeSlot}, formatted for backend: ${formattedTime}`);

        setData('appointment_time', formattedTime);
    };

    // Check if a time slot is already booked
    const isTimeSlotBooked = (timeSlot: string): boolean => {
        // Convert display format to 24-hour format for comparison
        const [time, period] = timeSlot.split(' ');
        const [hourStr, minuteStr] = time.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (period === 'PM' && hour !== 12) {
            hour += 12;
        } else if (period === 'AM' && hour === 12) {
            hour = 0;
        }

        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

        return bookedTimeSlots.includes(formattedTime);
    };

    // Handle birthdate selection
    const handleBirthdateChange = (newDate: Date | undefined) => {
        setBirthdate(newDate);
        if (newDate) {
            setData('birthdate', format(newDate, 'yyyy-MM-dd'));

            // Calculate age
            const age = differenceInYears(new Date(), newDate);
            setCalculatedAge(age);
            setData('age', age.toString());
        }
    };

    // Calculate BMI when height or weight changes
    useEffect(() => {
        if (data.height && data.weight) {
            const heightInMeters = Number(data.height) / 100; // Convert cm to meters
            const weightInKg = Number(data.weight);

            if (heightInMeters > 0 && weightInKg > 0) {
                const bmi = weightInKg / (heightInMeters * heightInMeters);
                const roundedBMI = Math.round(bmi * 10) / 10; // Round to 1 decimal place
                setCalculatedBMI(roundedBMI);
                setData('bmi', roundedBMI.toString());
            }
        }
    }, [data.height, data.weight]);

    // Update full address when individual address fields change
    useEffect(() => {
        if (data.province || data.city || data.barangay || data.zip_code) {
            const fullAddress = [data.barangay, data.city, data.province, data.zip_code].filter(Boolean).join(', ');

            setData('address', fullAddress);
        }
    }, [data.province, data.city, data.barangay, data.zip_code]);

    // Check if patient information is complete
    const isPersonalInfoComplete = () => {
        return (
            typeof data.name === 'string' &&
            data.name.trim() !== '' &&
            data.birthdate !== '' &&
            data.age !== '' &&
            data.height !== '' &&
            data.weight !== '' &&
            data.bmi !== '' &&
            typeof data.address === 'string' &&
            data.address.trim() !== '' &&
            typeof data.province === 'string' &&
            data.province.trim() !== '' &&
            typeof data.city === 'string' &&
            data.city.trim() !== '' &&
            typeof data.barangay === 'string' &&
            data.barangay.trim() !== '' &&
            typeof data.zip_code === 'string' &&
            data.zip_code.trim() !== ''
        );
    };

    // Check if medical records information is complete
    const hasMedicalRecordsInfo = () => {
        return uploadedFiles.length > 0 || data.has_previous_records === false;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If we're in the appointment tab but haven't completed all tabs, make sure to fill in default values
        if (activeTab === 'appointment' && (!isPersonalInfoComplete() || !hasMedicalRecordsInfo())) {
            // Set defaults for personal info if not complete
            if (!isPersonalInfoComplete()) {
                // Set basic personal info using the user's name
                if (!data.name) setData('name', user.name);
                if (!data.birthdate) {
                    setData('birthdate', '1990-01-01');
                    setData('age', '33');
                }
                if (!data.height) setData('height', '170');
                if (!data.weight) setData('weight', '70');
                if (!data.bmi) setData('bmi', '24.2');
                if (!data.address) setData('address', 'Default address');
                if (!data.province) setData('province', 'Default province');
                if (!data.city) setData('city', 'Default city');
                if (!data.barangay) setData('barangay', 'Default barangay');
                if (!data.zip_code) setData('zip_code', '12345');
            }

            // For medical records, if nothing is set, mark as no previous records
            if (!hasMedicalRecordsInfo()) {
                setData('has_previous_records', false);
            }
        }

        // Include uploaded files information in the form data
        if (uploadedFiles.length > 0) {
            // Convert the uploaded files to a JSON string
            const uploadedFilesJson = JSON.stringify(uploadedFiles);
            console.log('Including uploaded files in submission:', uploadedFiles);
            console.log('JSON string of uploaded files:', uploadedFilesJson);
            setData('uploaded_files', uploadedFilesJson);
        } else {
            console.log('No uploaded files to include');
        }

        // Debug the form data being sent
        console.log('Submitting appointment with data:', data);

        post(route('patient.appointments.store'), {
            onSuccess: () => {
                console.log('Appointment successfully booked!');
                // Show alert and redirect to dashboard
                alert('Appointment successfully booked!');
                // Redirect to the patient dashboard
                router.visit(route('patient.dashboard'));
            },
            onError: (errors) => {
                console.error('Appointment booking failed with errors:', errors);
                // Log each error individually for better debugging
                Object.keys(errors).forEach((key) => {
                    console.error(`Error with ${key}:`, errors[key]);
                });

                // If there are medical records or patient info errors, go back to those tabs
                const errorKeys = Object.keys(errors);
                if (errorKeys.some((key) => ['medical_records', 'has_previous_records', 'uploaded_files'].includes(key))) {
                    setActiveTab('medical-records');
                } else if (errorKeys.some((key) => ['name', 'birthdate', 'age', 'height', 'weight', 'bmi'].includes(key))) {
                    setActiveTab('personal-info');
                }
            },
        });
    };

    // Move to next step
    const nextStep = (currentTab: string) => {
        if (currentTab === 'personal-info' && isPersonalInfoComplete()) {
            setActiveTab('medical-records');
        } else if (currentTab === 'medical-records' && hasMedicalRecordsInfo()) {
            setActiveTab('appointment');
        }
    };

    // Update the handle file upload function
    const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        // Make sure we're using the correct field name 'files[]' for the server
        Array.from(files).forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            // Add CSRF token to the request
            const response = await axios.post(route('patient.upload.medical-records'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                // Show upload status in UI
                setUploadedFiles((prev) => [...prev, ...response.data.files]);
                setData('has_previous_records', true);
            } else {
                // Handle server-side validation errors
                setUploadError(response.data.message || 'Failed to upload files. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            // Extract validation error message if available
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{
                    message: string;
                    errors?: Record<string, string[]>;
                }>;

                if (axiosError.response?.status === 422 && axiosError.response.data) {
                    const responseData = axiosError.response.data;
                    const errorMessages = responseData.errors ? Object.values(responseData.errors).flat().join(', ') : responseData.message;
                    setUploadError(`Validation error: ${errorMessages}`);
                } else {
                    setUploadError('An error occurred while uploading files. Please try again.');
                }
            } else {
                setUploadError('An error occurred while uploading files. Please try again.');
            }
        } finally {
            setIsUploading(false);
            // Clear the file input to allow re-uploading same files
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Add a function to remove uploaded files
    const removeFile = (index: number) => {
        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);

        // If we removed all files and the checkbox isn't checked, reset has_previous_records
        if (newFiles.length === 0 && !noRecordsChecked) {
            setData('has_previous_records', false);
        }
    };

    // Sidebar items
    const sidebarItems = [
        {
            name: 'Dashboard',
            icon: <HomeIcon size={18} />,
            path: '/patient/dashboard',
            active: false,
        },
        {
            name: 'Book Appointment',
            icon: <CalendarIcon size={18} />,
            path: '/patient/appointments/book',
            active: true,
        },
        {
            name: 'My Appointments',
            icon: <Clock size={18} />,
            path: '/patient/appointments',
            active: false,
        },
        {
            name: 'Medical Records',
            icon: <FilePlus size={18} />,
            path: '/patient/records',
            active: false,
        },
        {
            name: 'Doctors',
            icon: <Stethoscope size={18} />,
            path: '/patient/doctors',
            active: false,
        },
    ];

    // Handle logout functionality
    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post(route('auth.logout'));
    };
    return (
        <div className="flex h-screen bg-gray-50">
            <Head title="Book Appointment" />

            {/* Sidebar - hidden on mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 md:relative md:translate-x-0 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center justify-center border-b px-4">
                    <Link href="/patient/dashboard" className="flex items-center">
                        <img src="/images/logo_famcare.jpg" alt="Famcare Logo" className="mr-2 h-6 w-auto" />
                        <span className="ml-2 text-xl font-semibold text-gray-900">Famcare Health</span>
                    </Link>
                </div>

                <div className="flex flex-col gap-2 p-4">
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
                    <div className="flex items-center md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <AlignJustify size={20} />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 md:ml-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell size={20} />
                                    {unreadNotificationsCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                            {unreadNotificationsCount}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <div className="border-b p-4">
                                    <h4 className="text-sm font-semibold">Notifications</h4>
                                </div>
                                <div className="max-h-80 overflow-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                                    ) : (
                                        <div className="divide-y">
                                            {notifications.map((notification) => (
                                                <div key={notification.id} className={`p-4 ${notification.read ? '' : 'bg-blue-50'} cursor-pointer`}>
                                                    <p className="text-sm font-medium">{notification.title}</p>
                                                    <p className="text-sm">{notification.message}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t p-2">
                                    <Button asChild variant="ghost" size="sm" className="w-full">
                                        <Link href="/patient/notifications">View all notifications</Link>
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt={user.name} />
                                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Link href="#" onClick={handleLogout}>
                                        Logout
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-4 md:p-6 lg:p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
                        <p className="mt-1 text-gray-600">
                            {selectedDoctor ? `Schedule a visit with Dr. ${selectedDoctor.name}` : 'Schedule a visit with one of our specialists'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-8 grid w-full grid-cols-3">
                                <TabsTrigger value="personal-info" className="flex gap-2">
                                    <UserCircle2 className="h-4 w-4" />
                                    Personal Information
                                </TabsTrigger>
                                <TabsTrigger value="medical-records" className="flex gap-2" disabled={!isPersonalInfoComplete()}>
                                    <FilePlus className="h-4 w-4" />
                                    Medical Records
                                </TabsTrigger>
                                <TabsTrigger
                                    value="appointment"
                                    className="flex gap-2"
                                    disabled={!hasMedicalRecordsInfo() || !isPersonalInfoComplete()}
                                >
                                    <CalendarIcon className="h-4 w-4" />
                                    Appointment
                                </TabsTrigger>
                            </TabsList>

                            {/* Personal Information Tab */}
                            <TabsContent value="personal-info">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>
                                            Please provide your basic information to help the doctor prepare for your visit
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Name */}
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                <Input
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Your full name"
                                                    required
                                                />
                                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                            </div>

                                            {/* Birthdate */}
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-start text-left font-normal ${!birthdate && 'text-gray-400'}`}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {birthdate ? format(birthdate, 'PPP') : 'Select your birthdate'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={birthdate}
                                                            onSelect={handleBirthdateChange}
                                                            initialFocus
                                                            disabled={(date) => date > new Date()}
                                                            captionLayout="dropdown"
                                                            fromYear={1920}
                                                            toYear={new Date().getFullYear()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.birthdate && <p className="text-sm text-red-500">{errors.birthdate}</p>}
                                            </div>

                                            {/* Age */}
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Age</label>
                                                <Input
                                                    value={calculatedAge !== null ? calculatedAge.toString() : data.age}
                                                    onChange={(e) => setData('age', e.target.value)}
                                                    placeholder="Your age"
                                                    type="number"
                                                    min="0"
                                                    max="120"
                                                    disabled={true}
                                                    readOnly
                                                    className="bg-gray-50"
                                                    required
                                                />
                                                {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
                                            </div>
                                        </div>

                                        {/* Physical Measurements Section */}
                                        <div className="border-t pt-4">
                                            <h3 className="text-md mb-4 font-medium text-gray-700">Physical Measurements</h3>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                {/* Height */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                                    <Input
                                                        value={data.height}
                                                        onChange={(e) => setData('height', e.target.value)}
                                                        placeholder="Your height in centimeters"
                                                        type="number"
                                                        min="1"
                                                        required
                                                    />
                                                    {errors.height && <p className="text-sm text-red-500">{errors.height}</p>}
                                                </div>

                                                {/* Weight */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                                    <Input
                                                        value={data.weight}
                                                        onChange={(e) => setData('weight', e.target.value)}
                                                        placeholder="Your weight in kilograms"
                                                        type="number"
                                                        min="1"
                                                        required
                                                    />
                                                    {errors.weight && <p className="text-sm text-red-500">{errors.weight}</p>}
                                                </div>

                                                {/* BMI */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">BMI</label>
                                                    <Input
                                                        value={calculatedBMI !== null ? calculatedBMI.toString() : data.bmi}
                                                        readOnly
                                                        className="bg-gray-50"
                                                    />
                                                    {calculatedBMI && (
                                                        <p className="text-xs text-gray-500">
                                                            {calculatedBMI < 18.5
                                                                ? 'Underweight'
                                                                : calculatedBMI < 25
                                                                  ? 'Normal weight'
                                                                  : calculatedBMI < 30
                                                                    ? 'Overweight'
                                                                    : 'Obese'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Section */}
                                        <div className="border-t pt-4">
                                            <h3 className="text-md mb-4 font-medium text-gray-700">Address Information</h3>

                                            {/* Search Input */}
                                            <div className="relative mb-4 space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Search Address</label>
                                                <Input
                                                    value={searchText}
                                                    onChange={(e) => {
                                                        setSearchText(e.target.value);
                                                        fetchSuggestions(e.target.value);
                                                    }}
                                                    placeholder="Start typing your address..."
                                                    className="w-full"
                                                />

                                                {/* Suggestions Dropdown */}
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div
                                                        ref={suggestionsRef}
                                                        className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
                                                    >
                                                        {suggestions.map((suggestion, index) => (
                                                            <div
                                                                key={index}
                                                                className="cursor-pointer border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-100"
                                                                onClick={() => handleSuggestionSelect(suggestion)}
                                                            >
                                                                {suggestion.properties.formatted}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {/* Province */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Province</label>
                                                    <Input
                                                        value={data.province}
                                                        onChange={(e) => setData('province', e.target.value)}
                                                        placeholder="Province"
                                                        required
                                                    />
                                                    {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                                                </div>

                                                {/* City */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                                    <Input
                                                        value={data.city}
                                                        onChange={(e) => setData('city', e.target.value)}
                                                        placeholder="City/Municipality"
                                                        required
                                                    />
                                                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                                                </div>

                                                {/* Barangay */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Barangay</label>
                                                    <Input
                                                        value={data.barangay}
                                                        onChange={(e) => setData('barangay', e.target.value)}
                                                        placeholder="Barangay"
                                                        required
                                                    />
                                                    {errors.barangay && <p className="text-sm text-red-500">{errors.barangay}</p>}
                                                </div>

                                                {/* Zip Code */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                                                    <Input
                                                        value={data.zip_code}
                                                        onChange={(e) => setData('zip_code', e.target.value)}
                                                        placeholder="Zip Code"
                                                        required
                                                    />
                                                    {errors.zip_code && <p className="text-sm text-red-500">{errors.zip_code}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button type="button" onClick={() => nextStep('personal-info')} disabled={!isPersonalInfoComplete()}>
                                            Next
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            {/* Medical Records Tab */}
                            <TabsContent value="medical-records">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Previous Medical Records</CardTitle>
                                        <CardDescription>
                                            Upload any previous medical records, lab results, or prescriptions that may be relevant for your
                                            appointment
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="rounded-md bg-blue-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <FilePlus className="mt-0.5 h-5 w-5 text-blue-600" />
                                                <div>
                                                    <h3 className="font-medium text-blue-800">Why upload medical records?</h3>
                                                    <p className="text-sm text-blue-600">
                                                        Sharing your previous medical records helps your doctor provide better care by understanding
                                                        your medical history. All records are kept confidential and secure.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-gray-700">Upload Previous Medical Records</label>

                                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-gray-50">
                                                    <input
                                                        type="file"
                                                        id="medical-records-upload"
                                                        className="hidden"
                                                        onChange={handleFileSelection}
                                                        multiple
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    />
                                                    <label htmlFor="medical-records-upload" className="cursor-pointer">
                                                        <div className="space-y-2">
                                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                                <UploadCloud className="h-6 w-6 text-blue-600" />
                                                            </div>
                                                            <div className="text-gray-700">
                                                                <span className="font-medium text-blue-600">Click to upload</span>{' '}
                                                                <span className="text-gray-500">or drag and drop</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">Support for PDF, DOCX, JPG, PNG (up to 10MB each)</p>
                                                        </div>
                                                    </label>
                                                </div>

                                                {isUploading && (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                        <span className="ml-2 text-sm text-blue-600">Uploading files...</span>
                                                    </div>
                                                )}

                                                {uploadedFiles.length > 0 && (
                                                    <div className="rounded-lg bg-gray-50 p-4">
                                                        <h4 className="mb-2 text-sm font-medium text-gray-700">Uploaded Files:</h4>
                                                        <div className="space-y-2">
                                                            {uploadedFiles.map((file, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between rounded-md bg-white p-2 text-sm text-gray-700"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                        <span className="max-w-xs truncate">{file.name}</span>
                                                                        <span className="text-xs text-gray-500">
                                                                            ({Math.round(file.size / 1024)} KB)
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeFile(index)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {uploadError && (
                                                    <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-red-800">
                                                        <AlertCircle className="mt-0.5 h-5 w-5" />
                                                        <div>
                                                            <p className="font-medium">Error uploading files</p>
                                                            <p className="text-sm">{uploadError}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="no-records"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={!data.has_previous_records}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setNoRecordsChecked(checked);
                                                        setData('has_previous_records', !checked);
                                                        if (checked) {
                                                            setUploadedFiles([]);
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="no-records" className="text-sm text-gray-700">
                                                    I don't have any previous medical records to share
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setActiveTab('personal-info')}>
                                            Previous
                                        </Button>
                                        <Button type="button" onClick={() => nextStep('medical-records')} disabled={!hasMedicalRecordsInfo()}>
                                            Next
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            {/* Appointment Tab */}
                            <TabsContent value="appointment">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {/* Doctor Selection - Only show if doctor is not pre-selected */}
                                    {!preSelectedDoctorId && (
                                        <div className="md:col-span-1">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Select Doctor</CardTitle>
                                                    <CardDescription>Choose a specialist for your appointment</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {doctors.map((doctor) => (
                                                        <div
                                                            key={doctor.id}
                                                            className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                                                                selectedDoctor?.id === doctor.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                                            }`}
                                                            onClick={() => handleDoctorSelect(doctor.id.toString())}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                                                                    {doctor.image ? (
                                                                        <img
                                                                            src={doctor.image}
                                                                            alt={doctor.name}
                                                                            className="h-12 w-12 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <Stethoscope className="h-6 w-6 text-gray-500" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                                                                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {errors.doctor_id && <p className="mt-1 text-sm text-red-500">{errors.doctor_id}</p>}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}

                                    {/* Appointment Details - Adjust column span based on whether doctor is pre-selected */}
                                    <div className={preSelectedDoctorId ? 'md:col-span-3' : 'md:col-span-2'}>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Appointment Details</CardTitle>
                                                <CardDescription>
                                                    {selectedDoctor
                                                        ? `Select a date and time for your appointment with Dr. ${selectedDoctor.name}`
                                                        : 'Select a date and time for your appointment'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* Show selected doctor info if pre-selected */}
                                                    {preSelectedDoctorId && selectedDoctor && (
                                                        <div className="mb-4 rounded-md bg-blue-50 p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                                                                    {selectedDoctor.image ? (
                                                                        <img
                                                                            src={selectedDoctor.image}
                                                                            alt={selectedDoctor.name}
                                                                            className="h-12 w-12 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <Stethoscope className="h-6 w-6 text-blue-500" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium text-blue-800">Dr. {selectedDoctor.name}</h3>
                                                                    <p className="text-sm text-blue-600">{selectedDoctor.specialty}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Date Picker */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Date</label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className={`w-full justify-start text-left font-normal ${
                                                                        !date && 'text-gray-400'
                                                                    }`}
                                                                    disabled={!selectedDoctor}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {date
                                                                        ? format(date, 'PPP')
                                                                        : selectedDoctor
                                                                          ? 'Select a date'
                                                                          : 'Select a doctor first'}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={date}
                                                                    onSelect={handleDateChange}
                                                                    initialFocus
                                                                    disabled={(date) => {
                                                                        // Disable dates in the past
                                                                        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

                                                                        // Disable dates that aren't in the available dates list
                                                                        if (availableDates.length > 0) {
                                                                            return !availableDates.some(
                                                                                (availableDate) =>
                                                                                    availableDate.toDateString() === date.toDateString(),
                                                                            );
                                                                        }

                                                                        // If no available dates list is provided, disable all dates
                                                                        return true;
                                                                    }}
                                                                    fromYear={new Date().getFullYear()}
                                                                    toYear={new Date().getFullYear() + 1}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        {errors.appointment_date && <p className="text-sm text-red-500">{errors.appointment_date}</p>}
                                                    </div>

                                                    {/* Time Slots */}
                                                    {date && (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {availableTimeSlots.length > 0 ? (
                                                                    availableTimeSlots.map((timeSlot) => {
                                                                        const isBooked = isTimeSlotBooked(timeSlot);
                                                                        return (
                                                                            <Button
                                                                                key={timeSlot}
                                                                                type="button"
                                                                                variant={selectedTimeSlot === timeSlot ? 'default' : 'outline'}
                                                                                className={`flex items-center justify-center ${
                                                                                    isBooked
                                                                                        ? 'cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-500'
                                                                                        : ''
                                                                                }`}
                                                                                onClick={() => handleTimeSlotSelect(timeSlot)}
                                                                                disabled={isBooked}
                                                                            >
                                                                                <Clock className="mr-1 h-3 w-3" />
                                                                                {timeSlot}
                                                                                {isBooked && (
                                                                                    <span className="ml-1 text-xs font-medium text-rose-500">
                                                                                        (Occupied)
                                                                                    </span>
                                                                                )}
                                                                            </Button>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <p className="col-span-3 py-4 text-center text-gray-500">
                                                                        No available time slots for this date
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {errors.appointment_time && (
                                                                <p className="text-sm text-red-500">{errors.appointment_time}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Reason for Visit */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
                                                        <Select value={data.reason} onValueChange={(value) => setData('reason', value)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a reason" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="consultation">General Consultation</SelectItem>
                                                                <SelectItem value="checkup">Regular Checkup</SelectItem>
                                                                <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                                                                <SelectItem value="specialist">Specialist Consultation</SelectItem>
                                                                <SelectItem value="emergency">Urgent Care</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                                                    </div>

                                                    {/* Additional Notes */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                                                        <Textarea
                                                            placeholder="Please share any symptoms or concerns"
                                                            value={data.notes}
                                                            onChange={(e) => setData('notes', e.target.value)}
                                                            rows={4}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-between">
                                                <Button type="button" variant="outline" onClick={() => setActiveTab('medical-records')}>
                                                    Previous
                                                </Button>

                                                <Button
                                                    type="submit"
                                                    disabled={processing || !date || !selectedTimeSlot || !data.doctor_id || !data.reason}
                                                >
                                                    Book Appointment
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </main>
            </div>
        </div>
    );
}
