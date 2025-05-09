import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router } from '@inertiajs/react';
import { FormEvent, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import DoctorLayout from '@/layouts/DoctorLayout';
import { Head } from '@inertiajs/react';
import { UserData } from '@/types';
import axios from 'axios';

interface UserProfile extends UserData {
    specialty?: string;
    qualifications?: string;
    about?: string;
    phone_number?: string;
    address?: string;
    profile_image?: string;
    years_of_experience?: number;
    languages_spoken?: string;
    education?: string;
    is_visible?: boolean;
}

interface ServiceItem {
    id: number;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    is_active: boolean;
}

interface ProfileProps {
    user: UserProfile;
    services: ServiceItem[];
    flash?: {
        success?: string;
        error?: string;
    };
    specialties?: string[]; // Optional list of predefined specialties
}

export default function DoctorProfile({ user, services, flash, specialties = [] }: ProfileProps) {
    // Initialize state with user data
    const [formData, setFormData] = useState({
        name: user.name || '',
        phone_number: user.phone_number || '',
        specialty: user.specialty || '',
        custom_specialty: '',  // Added explicit custom specialty field
        qualifications: user.qualifications || '',
        address: user.address || '',
        about: user.about || '',
        years_of_experience: user.years_of_experience || 0,
        languages_spoken: user.languages_spoken || '',
        education: user.education || '',
        is_visible: user.is_visible || false,
    });
    
    // Debug logging to verify incoming user data
    useEffect(() => {
        console.log('User data from props:', user);
    }, [user]);
    
    // Update local state when props change
    useEffect(() => {
        setFormData({
            name: user.name || '',
            phone_number: user.phone_number || '',
            specialty: user.specialty || '',
            custom_specialty: '',  // Reset custom specialty on props change
            qualifications: user.qualifications || '',
            address: user.address || '',
            about: user.about || '',
            years_of_experience: user.years_of_experience || 0,
            languages_spoken: user.languages_spoken || '',
            education: user.education || '',
            is_visible: user.is_visible || false,
        });
    }, [user]);

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value === '' ? 0 : parseInt(value) }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        setFormData(prev => ({ ...prev, [id]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(e.target.files[0]);
        }
    };

    const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            specialty: value,
            // Reset custom specialty when a non-'other' option is selected
            custom_specialty: value === 'other' ? prev.custom_specialty : ''
        }));
    };

    const handleCustomSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            custom_specialty: value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);
        
        try {
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // Prepare form data
            const formDataToSend = new FormData();
            
            // Add method spoofing for Laravel
            formDataToSend.append('_method', 'PUT');
            
            // Handle specialty separately based on test case behavior
            if (formData.specialty === 'other') {
                // When "other" is selected, send both values
                // This matches your test_doctor_can_update_custom_specialty test
                formDataToSend.append('specialty', 'other');
                formDataToSend.append('custom_specialty', formData.custom_specialty.trim());
                console.log('Sending custom specialty:', formData.custom_specialty.trim());
            } else {
                // For predefined specialties, just send the value
                formDataToSend.append('specialty', formData.specialty);
                console.log('Sending predefined specialty:', formData.specialty);
            }
            
            // Add all other form fields with proper type conversion
            Object.entries(formData).forEach(([key, value]) => {
                // Skip fields we've already handled
                if (key === 'specialty' || key === 'custom_specialty') return;
                
                if (key === 'is_visible') {
                    // Convert boolean to a format Laravel can understand
                    formDataToSend.append(key, value ? '1' : '0');
                } else if (key === 'years_of_experience') {
                    // Ensure it's treated as a number
                    formDataToSend.append(key, String(Number(value) || 0));
                } else {
                    // Convert all other values to string
                    formDataToSend.append(key, String(value || ''));
                }
            });
            
            // Add profile image if selected
            if (profileImage) {
                formDataToSend.append('profile_image', profileImage);
            }
            
            // Log what's being sent (for debugging)
            console.log('Submitting form data:', Object.fromEntries(formDataToSend.entries()));
            
            // Use axios for the request
            const response = await axios.post('/doctor/profile', formDataToSend, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            console.log('Response:', response.data);
            
            // Handle success
            setSubmitSuccess('Profile updated successfully!');
            setProfileImage(null);
            
            // Reload the page after a short delay to show the success message
            setTimeout(() => {
                window.location.href = '/doctor/profile';
            }, 1500);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            setSubmitError('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DoctorLayout user={user}>
            <Head title="Professional Profile">
                {/* Ensure CSRF token is available */}
                <meta name="csrf-token" content={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} />
            </Head>
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Flash messages from props */}
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {flash.success}
                        </div>
                    )}
                    
                    {flash?.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {flash.error}
                        </div>
                    )}
                    
                    {/* Local state flash messages */}
                    {submitSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {submitSuccess}
                        </div>
                    )}
                    
                    {submitError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {submitError}
                        </div>
                    )}
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold mb-6">Professional Information</h1>
                        <p className="text-gray-600 mb-6">Update your professional details and credentials that will be displayed to patients</p>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div>
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
                                        <div className="mb-4">
                                            <Label htmlFor="name" className="block mb-1">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="phone_number" className="block mb-1">Phone Number</Label>
                                            <Input
                                                id="phone_number"
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="address" className="block mb-1">Address</Label>
                                            <Textarea
                                                id="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold mb-2">Professional Profile</h2>
                                        <div className="mb-4">
                                            <Label htmlFor="specialty" className="block mb-1">Specialty</Label>
                                            {specialties && specialties.length > 0 ? (
                                                <>
                                                    <select
                                                        id="specialty"
                                                        value={formData.specialty}
                                                        onChange={handleSpecialtyChange}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select a specialty</option>
                                                        {specialties.map(specialty => (
                                                            <option key={specialty} value={specialty}>
                                                                {specialty}
                                                            </option>
                                                        ))}
                                                        <option value="other">Other (specify)</option>
                                                    </select>
                                                    {formData.specialty === 'other' && (
                                                        <Input
                                                            id="custom_specialty"
                                                            value={formData.custom_specialty}
                                                            onChange={handleCustomSpecialtyChange}
                                                            className="w-full mt-2"
                                                            placeholder="Enter your specialty"
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <Input
                                                    id="specialty"
                                                    value={formData.specialty}
                                                    onChange={handleChange}
                                                    className="w-full"
                                                    placeholder="e.g., Cardiology, Dermatology, etc."
                                                />
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                This field is required to display your profile to patients
                                            </p>
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="qualifications" className="block mb-1">Qualifications</Label>
                                            <Textarea
                                                id="qualifications"
                                                value={formData.qualifications}
                                                onChange={handleChange}
                                                className="w-full"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="years_of_experience" className="block mb-1">Years of Experience</Label>
                                            <Input
                                                id="years_of_experience"
                                                type="number"
                                                min="0"
                                                value={formData.years_of_experience}
                                                onChange={handleNumberChange}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Right Column */}
                                <div>
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold mb-2">Profile Photo</h2>
                                        <div className="mb-4">
                                            <div className="flex items-center mb-2">
                                                {user.profile_image ? (
                                                    <img 
                                                        src={user.profile_image} 
                                                        alt={user.name} 
                                                        className="w-32 h-32 object-cover rounded-full" 
                                                    />
                                                ) : (
                                                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-400 text-5xl">{user.name?.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Label htmlFor="profile_image" className="block mb-1">Upload New Photo</Label>
                                            <Input
                                                id="profile_image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="w-full"
                                                key={user.profile_image} // Reset when prop changes
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Recommended: Square image, at least 300x300 pixels</p>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold mb-2">Additional Information</h2>
                                        <div className="mb-4">
                                            <Label htmlFor="languages_spoken" className="block mb-1">Languages Spoken</Label>
                                            <Input
                                                id="languages_spoken"
                                                value={formData.languages_spoken}
                                                onChange={handleChange}
                                                className="w-full"
                                                placeholder="English, Spanish, etc."
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="education" className="block mb-1">Education</Label>
                                            <Input
                                                id="education"
                                                value={formData.education}
                                                onChange={handleChange}
                                                className="w-full"
                                                placeholder="University of California, San Francisco"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="about" className="block mb-1">About Me</Label>
                                            <Textarea
                                                id="about"
                                                value={formData.about}
                                                onChange={handleChange}
                                                className="w-full"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="is_visible"
                                                    checked={formData.is_visible}
                                                    onChange={handleCheckboxChange}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <Label htmlFor="is_visible" className="ml-2 block text-sm text-gray-700">
                                                    Show my profile to patients
                                                </Label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">When enabled, patients can view your profile and book appointments</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button type="button" variant="outline" className="mr-2" onClick={() => router.visit('/doctor/dashboard')}>
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                    {/* Services Section */}
                    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Services Offered</h2>
                                <p className="text-gray-600">Manage the services you offer to patients</p>
                            </div>
                            <Button 
                                onClick={() => router.visit('/doctor/services/create')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Add New Service
                            </Button>
                        </div>
                        {services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map((service) => (
                                    <div key={service.id} className={`border rounded-lg p-4 flex justify-between ${service.is_active ? 'bg-white' : 'bg-gray-100'}`}>
                                        <div>
                                            <h3 className="font-semibold">{service.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {service.description.length > 100 
                                                    ? `${service.description.substring(0, 100)}...` 
                                                    : service.description}
                                            </p>
                                            <div className="mt-2 flex items-center">
                                                <span className="text-sm font-medium">${service.price.toFixed(2)}</span>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <span className="text-sm">{service.duration_minutes} minutes</span>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                    {service.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <button 
                                                onClick={() => router.visit(`/doctor/services/${service.id}/edit`)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-100 rounded-lg p-6 text-center">
                                <p className="text-gray-600">You haven't added any services yet. Add your first service to let patients know what you offer.</p>
                                <Button
                                    onClick={() => router.visit('/doctor/services/create')}
                                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Add Your First Service
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DoctorLayout>
    );
}
