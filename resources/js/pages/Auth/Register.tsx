import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Register() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('auth.register.store'));
  };

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
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-800 transition-all">Create a Patient Account</h2>

            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name Field */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-gray-700 font-medium text-sm">Name</Label>
                <Input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={e => setData('name', e.target.value)}
                  className={`w-full py-1 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.name)}</p>}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                  className={`w-full py-1 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.email)}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={data.password}
                  onChange={e => setData('password', e.target.value)}
                  className={`w-full py-1 transition-all focus:border-blue-500 focus:ring-blue-500 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && <p className="mt-0.5 text-xs text-red-500 transition-all">{String(errors.password)}</p>}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <Label htmlFor="password_confirmation" className="text-gray-700 font-medium text-sm">Confirm Password</Label>
                <Input
                  type="password"
                  id="password_confirmation"
                  value={data.password_confirmation}
                  onChange={e => setData('password_confirmation', e.target.value)}
                  className="w-full py-1 transition-all focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="mt-4 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                disabled={processing}
              >
                {processing ? 'Registering...' : 'Register'}
              </Button>

              <div className="mt-3 text-center text-xs">
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
