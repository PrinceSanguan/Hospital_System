import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { route } from 'ziggy-js';

interface LoginProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Login({ flash }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const [authError, setAuthError] = useState<string | null>(null);
    const [flashMessage, setFlashMessage] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });

    // Check for flash messages
    useEffect(() => {
        if (flash?.success) {
            setFlashMessage({
                type: 'success',
                message: flash.success,
            });
        } else if (flash?.error) {
            setFlashMessage({
                type: 'error',
                message: flash.error,
            });
        } else {
            setFlashMessage({ type: null, message: null });
        }
    }, [flash]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setFlashMessage({ type: null, message: null });

        post(route('auth.login.store'), {
            onError: (errors) => {
                // If we received an authentication error from the backend
                if (errors.auth) {
                    setAuthError(errors.auth);
                }
            },
        });
    };

    return (
        <>
            <Head title="Login">
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
            <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
                        alt="Hospital Building"
                        className="w-full h-full object-cover brightness-50 scale-105 animate-subtle-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-blue-900/30 mix-blend-multiply"></div>
                </div>

                <div className="w-full max-w-md px-4 sm:px-0 relative z-10 animate-fade-in">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">FarmCare</h1>
                        <p className="text-blue-200">Quality Healthcare for Everyone</p>
                    </div>

                    <Card className="w-full rounded-2xl shadow-2xl backdrop-blur-sm bg-white/95 border-0 transition-all duration-300 hover:shadow-blue-900/20">
                        <CardContent className="p-6 sm:p-8">
                            <h2 className="mb-6 text-center text-2xl sm:text-3xl font-bold text-blue-800 transition-all">
                                Welcome Back!
                            </h2>

                            {/* Show flash messages */}
                            {flashMessage.message && (
                                <Alert variant={flashMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4 transition-all">
                                    <AlertDescription>{flashMessage.message}</AlertDescription>
                                </Alert>
                            )}

                            {/* Show authentication error if any */}
                            {authError && (
                                <Alert variant="destructive" className="mb-4 transition-all">
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 font-medium">Gmail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="yourname@gmail.com"
                                        className="w-full transition-all focus:border-blue-500 focus:ring-blue-500"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-500 transition-all">{errors.email}</p>}
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full transition-all focus:border-blue-500 focus:ring-blue-500"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-500 transition-all">{errors.password}</p>}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="mt-6 w-full py-6 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                    disabled={processing}
                                >
                                    {processing ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>

                            {/* Signup Link */}
                            <p className="mt-6 text-center text-sm text-gray-600">
                                Don't have an account?{' '}
                                <a href={route('auth.register')} className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                                    Sign up
                                </a>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
