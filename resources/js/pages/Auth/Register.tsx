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
      <Head title="Register" />
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Create a Patient Account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Join FarmCare Clinic and Laboratory
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                value={data.name}
                onChange={e => setData('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{String(errors.name)}</p>}
                    </div>

                    {/* Email Field */}
                    <div>
                        <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={data.email}
                onChange={e => setData('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{String(errors.email)}</p>}
                    </div>

                    {/* Password Field */}
                    <div>
                        <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={data.password}
                onChange={e => setData('password', e.target.value)}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{String(errors.password)}</p>}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                type="password"
                id="password_confirmation"
                value={data.password_confirmation}
                onChange={e => setData('password_confirmation', e.target.value)}
              />
                    </div>

                    {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={processing}>
              {processing ? 'Registering...' : 'Register'}
                    </Button>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href={route('auth.login')} className="text-blue-600 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
    );
}
