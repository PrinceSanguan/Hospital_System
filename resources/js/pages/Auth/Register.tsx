import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function Register() {
  const [activeTab, setActiveTab] = useState(0);

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('auth.register.store'));
  };

  const nextTab = () => {
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
      <div className="flex h-screen items-center justify-center p-4 sm:p-6 relative overflow-hidden">
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
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-white mb-1">Famcare</h1>
            <p className="text-blue-200 text-sm">Quality Healthcare for Everyone</p>
          </div>

          <div className="w-full rounded-2xl shadow-2xl backdrop-blur-sm bg-white/95 border-0 transition-all duration-300 hover:shadow-blue-900/20 p-5 sm:p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-800 transition-all">Create a Patient Account</h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex-1 py-2 font-medium text-sm transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Information Tab */}
              {activeTab === 0 && (
                <>
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-gray-700 font-medium text-sm">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      value={data.name}
                      onChange={e => setData('name', e.target.value)}
                      className={`w-full py-2 px-3 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.name)}</p>}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      value={data.email}
                      onChange={e => setData('email', e.target.value)}
                      className={`w-full py-2 px-3 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="example@email.com"
                    />
                    {errors.email && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.email)}</p>}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Password</Label>
                    <Input
                      type="password"
                      id="password"
                      value={data.password}
                      onChange={e => setData('password', e.target.value)}
                      className={`w-full py-2 px-3 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    {errors.password && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.password)}</p>}
                  </div>

                  {/* Password Confirmation Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password_confirmation" className="text-gray-700 font-medium text-sm">Confirm Password</Label>
                    <Input
                      type="password"
                      id="password_confirmation"
                      value={data.password_confirmation}
                      onChange={e => setData('password_confirmation', e.target.value)}
                      className="w-full py-2 px-3 transition-all focus:border-blue-500 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* Next Button */}
                  <Button
                    type="button"
                    className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={nextTab}
                  >
                    Next
                  </Button>
                </>
              )}

              {/* Personal Information Tab */}
              {activeTab === 1 && (
                <>
                  {/* Date of Birth Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth" className="text-gray-700 font-medium text-sm">Date of Birth</Label>
                    <Input
                      type="date"
                      id="date_of_birth"
                      value={data.date_of_birth}
                      onChange={e => setData('date_of_birth', e.target.value)}
                      className={`w-full py-2 px-3 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.date_of_birth ? 'border-red-500' : ''}`}
                    />
                    {errors.date_of_birth && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.date_of_birth)}</p>}
                  </div>

                  {/* Gender Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-gray-700 font-medium text-sm">Gender</Label>
                    <select
                      id="gender"
                      value={data.gender}
                      onChange={e => setData('gender', e.target.value)}
                      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.gender ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.gender)}</p>}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">Phone Number</Label>
                    <Input
                      type="tel"
                      id="phone"
                      value={data.phone}
                      onChange={e => setData('phone', e.target.value)}
                      className={`w-full py-2 px-3 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.phone)}</p>}
                  </div>

                  {/* Address Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-gray-700 font-medium text-sm">Address</Label>
                    <textarea
                      id="address"
                      value={data.address}
                      onChange={e => setData('address', e.target.value)}
                      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] ${errors.address ? 'border-red-500' : ''}`}
                      placeholder="Enter your address"
                    />
                    {errors.address && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.address)}</p>}
                  </div>

                  {/* Button Group */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Button
                      type="button"
                      className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                      onClick={prevTab}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      disabled={processing}
                    >
                      {processing ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                </>
              )}

              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link
                  href={route('auth.login')}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
