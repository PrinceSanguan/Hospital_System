import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Define error type that includes database errors
interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    date_of_birth?: string;
    gender?: string;
    phone?: string;
    province?: string;
    city?: string;
    barangay?: string;
    zip_code?: string;
    address?: string;
    database?: string;
    [key: string]: string | undefined; // Allow other error properties
}

export default function Register() {
    const [activeTab, setActiveTab] = useState(0);
    const [databaseError, setDatabaseError] = useState<string | null>(null);
    const [passwordMismatch, setPasswordMismatch] = useState<boolean>(false);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchText, setSearchText] = useState('');
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        province: '',
        city: '',
        barangay: '',
        zip_code: '',
        address: '',
    });

    // Check if passwords match whenever either password field changes
    useEffect(() => {
        if (data.password && data.password_confirmation) {
            setPasswordMismatch(data.password !== data.password_confirmation);
        } else {
            setPasswordMismatch(false);
        }
    }, [data.password, data.password_confirmation]);

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

    // Update address whenever address components change
    useEffect(() => {
        if (data.barangay || data.city || data.province || data.zip_code) {
            updateAddress();
        }
    }, [data.barangay, data.city, data.province, data.zip_code]);

    const updateAddress = () => {
        const fullAddress = [data.barangay, data.city, data.province, data.zip_code].filter(Boolean).join(', ');

        setData('address', fullAddress);
        return fullAddress; // Return the address for immediate use
    };

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

    // Handle changes to address fields
    const handleAddressChange = (field: 'province' | 'city' | 'barangay' | 'zip_code', value: string) => {
        setData(field, value);
        // We don't call updateAddress() here anymore as it's handled by the useEffect
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted with data:', data);

        // Client-side validation for password match
        if (data.password !== data.password_confirmation) {
            setPasswordMismatch(true);
            return;
        }

        setDatabaseError(null);

        // Force update address right before submission to ensure it's current
        const finalAddress = updateAddress();
        console.log('Final address to be saved:', finalAddress);

        // Manually set the address field to ensure it's included in the submission
        setData('address', finalAddress);

        // Save the data with the combined address - using the correct API
        post(route('auth.register.store'), {
            onSuccess: () => {
                console.log('Registration successful');
                reset();
            },
            onError: (formErrors: FormErrors) => {
                console.error('Registration failed with errors:', formErrors);

                // Special handling for database errors
                if (formErrors.database) {
                    let errorMessage = formErrors.database;

                    // Clean up the error message to be more user-friendly
                    if (errorMessage.includes('Unable to connect to the database')) {
                        errorMessage = errorMessage.replace(/SQLSTATE\[\d+\]: .+?: /, '');
                        setDatabaseError(errorMessage);
                    } else {
                        setDatabaseError(errorMessage);
                    }
                }

                // Handle password confirmation separately
                if (formErrors.password_confirmation) {
                    setPasswordMismatch(true);
                }
            },
            preserveScroll: true,
        });
    };

    const nextTab = () => {
        // Before moving to next tab, validate current tab fields
        if (activeTab === 0) {
            // Check required fields on first tab
            if (!data.name || !data.email || !data.password || !data.password_confirmation) {
                return;
            }

            // Check password match
            if (data.password !== data.password_confirmation) {
                setPasswordMismatch(true);
                return;
            }
        }

        setActiveTab(1);
    };

    const prevTab = () => {
        setActiveTab(0);
    };

    const tabs = [
        { name: 'Account Information', id: 0 },
        { name: 'Personal Information', id: 1 },
    ];

    return (
        <>
            <Head title="Register">
                <style>{`
          @keyframes subtle-zoom {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }

          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .animate-subtle-zoom {
            animation: subtle-zoom 15s ease-in-out infinite alternate;
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }
        `}</style>
            </Head>
            <div className="relative flex h-screen items-center justify-center overflow-hidden p-2 sm:p-4">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
                        alt="Hospital Building"
                        className="animate-subtle-zoom h-full w-full scale-105 object-cover brightness-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-blue-900/30 mix-blend-multiply"></div>
                </div>

                <div className="animate-fade-in relative z-10 w-full max-w-md px-2 sm:px-0">
                    <div className="mb-3 text-center">
                        <h1 className="mb-0.5 text-xl font-bold text-white">Famcare</h1>
                        <p className="text-xs text-blue-200">Quality Healthcare for Everyone</p>
                    </div>

                    <div className="w-full rounded-xl border-0 bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-blue-900/20">
                        <div className="mb-4 text-center">
                            <h2 className="text-lg font-bold text-blue-800 transition-all">Create a Patient Account</h2>
                        </div>

                        {/* Display global errors if any */}
                        {databaseError && (
                            <Alert className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{databaseError}</Alert>
                        )}

                        {/* Tab Navigation */}
                        <div className="mb-4 flex border-b">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`flex-1 border-b-2 py-1.5 text-xs font-medium transition-all ${
                                        activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Account Information Tab */}
                            {activeTab === 0 && (
                                <div className="space-y-2.5">
                                    {/* Name Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                                            Name
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={`w-full px-2 py-1.5 text-sm transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.name && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.name)}</p>}
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                                            Email
                                        </Label>
                                        <Input
                                            type="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className={`w-full px-2 py-1.5 text-sm transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                                            placeholder="example@email.com"
                                        />
                                        {errors.email && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.email)}</p>}
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-xs font-medium text-gray-700">
                                            Password
                                        </Label>
                                        <Input
                                            type="password"
                                            id="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className={`w-full px-2 py-1.5 text-sm transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.password || passwordMismatch ? 'border-red-500' : ''}`}
                                            placeholder="••••••••"
                                        />
                                        {errors.password && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.password)}</p>}
                                    </div>

                                    {/* Password Confirmation Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="password_confirmation" className="text-xs font-medium text-gray-700">
                                            Confirm Password
                                        </Label>
                                        <Input
                                            type="password"
                                            id="password_confirmation"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className={`w-full px-2 py-1.5 text-sm transition-all focus:border-blue-500 focus:ring-blue-500 ${passwordMismatch ? 'border-red-500' : ''}`}
                                            placeholder="••••••••"
                                        />
                                        {passwordMismatch && (
                                            <p className="mt-0.5 text-xs text-red-500 transition-all">The password confirmation does not match.</p>
                                        )}
                                    </div>

                                    {/* Next Button */}
                                    <Button
                                        type="button"
                                        className="focus:ring-opacity-50 mt-3 w-full rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        onClick={nextTab}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}

                            {/* Personal Information Tab */}
                            {activeTab === 1 && (
                                <div className="space-y-2.5">
                                    {/* Date of Birth Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="date_of_birth" className="text-xs font-medium text-gray-700">
                                            Date of Birth
                                        </Label>
                                        <Input
                                            type="date"
                                            id="date_of_birth"
                                            value={data.date_of_birth}
                                            onChange={(e) => setData('date_of_birth', e.target.value)}
                                            className={`w-full px-2 py-1 text-sm transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.date_of_birth ? 'border-red-500' : ''}`}
                                        />
                                        {errors.date_of_birth && (
                                            <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.date_of_birth)}</p>
                                        )}
                                    </div>

                                    {/* Gender Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="gender" className="text-xs font-medium text-gray-700">
                                            Gender
                                        </Label>
                                        <select
                                            id="gender"
                                            value={data.gender}
                                            onChange={(e) => setData('gender', e.target.value)}
                                            className={`border-input bg-background focus:ring-ring h-8 w-full rounded-md border px-2 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${errors.gender ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.gender && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.gender)}</p>}
                                    </div>

                                    {/* Phone Field */}
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                                            Phone Number
                                        </Label>
                                        <Input
                                            type="tel"
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className={`w-full px-2 py-1 text-sm transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : ''}`}
                                            placeholder="Enter your phone number"
                                        />
                                        {errors.phone && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.phone)}</p>}
                                    </div>

                                    {/* Address Information */}
                                    <div className="space-y-1.5">
                                        <h3 className="mt-1 text-xs font-medium text-gray-700">Address Information</h3>

                                        {/* Search Input */}
                                        <div className="relative space-y-0.5">
                                            <Label htmlFor="address_search" className="text-xs">
                                                Search Address
                                            </Label>
                                            <Input
                                                id="address_search"
                                                value={searchText}
                                                onChange={(e) => {
                                                    setSearchText(e.target.value);
                                                    fetchSuggestions(e.target.value);
                                                }}
                                                placeholder="Start typing your address..."
                                                className="h-8 px-2 py-1 text-sm"
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

                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                            {/* Province */}
                                            <div className="space-y-0.5">
                                                <Label htmlFor="province" className="text-xs">
                                                    Province
                                                </Label>
                                                <Input
                                                    id="province"
                                                    value={data.province}
                                                    onChange={(e) => handleAddressChange('province', e.target.value)}
                                                    placeholder="Province"
                                                    className={`h-8 px-2 py-1 text-sm ${errors.province ? 'border-red-500' : ''}`}
                                                />
                                            </div>

                                            {/* City */}
                                            <div className="space-y-0.5">
                                                <Label htmlFor="city" className="text-xs">
                                                    City
                                                </Label>
                                                <Input
                                                    id="city"
                                                    value={data.city}
                                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                                    placeholder="City"
                                                    className={`h-8 px-2 py-1 text-sm ${errors.city ? 'border-red-500' : ''}`}
                                                />
                                            </div>

                                            {/* Barangay */}
                                            <div className="space-y-0.5">
                                                <Label htmlFor="barangay" className="text-xs">
                                                    Barangay
                                                </Label>
                                                <Input
                                                    id="barangay"
                                                    value={data.barangay}
                                                    onChange={(e) => handleAddressChange('barangay', e.target.value)}
                                                    placeholder="Barangay"
                                                    className={`h-8 px-2 py-1 text-sm ${errors.barangay ? 'border-red-500' : ''}`}
                                                />
                                            </div>

                                            {/* Zip Code */}
                                            <div className="space-y-0.5">
                                                <Label htmlFor="zip_code" className="text-xs">
                                                    Zip Code
                                                </Label>
                                                <Input
                                                    id="zip_code"
                                                    value={data.zip_code}
                                                    onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                                                    placeholder="Zip Code"
                                                    className={`h-8 px-2 py-1 text-sm ${errors.zip_code ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Button Group */}
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            className="focus:ring-opacity-50 w-full rounded-md bg-gray-200 py-1.5 text-sm font-medium text-gray-800 transition-all duration-200 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                                            onClick={prevTab}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="focus:ring-opacity-50 w-full rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            disabled={processing}
                                        >
                                            {processing ? 'Registering...' : 'Register'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
