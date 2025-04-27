import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/types';
import { ChevronLeft } from 'lucide-react';

interface UserFormProps {
  user?: User;
  roles: Record<string, string>;
}

export default function UserForm({ user, roles }: UserFormProps) {
  const isEditing = !!user;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
    user_role: user?.user_role || 'patient',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      put(route('admin.users.update', user.id));
    } else {
      post(route('admin.users.store'));
    }
  };

  return (
    <>
      <Head title={isEditing ? 'Edit User' : 'Create User'} />
      <div className="py-12">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center">
            <Button
              asChild
              variant="ghost"
              className="mr-4"
            >
              <Link href={route('admin.users.index')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to users
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditing ? 'Edit User' : 'Create New User'}
            </h1>
          </div>

          <div className="overflow-hidden rounded-lg bg-white p-6 shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{String(errors.name)}</p>}
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{String(errors.email)}</p>}
              </div>

              {/* Role Field */}
              <div>
                <Label htmlFor="user_role">Role</Label>
                <Select
                  value={data.user_role}
                  onValueChange={(value) => setData('user_role', value)}
                >
                  <SelectTrigger className={errors.user_role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roles).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_role && <p className="mt-1 text-xs text-red-500">{String(errors.user_role)}</p>}
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password">
                  {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className={errors.password ? 'border-red-500' : ''}
                  required={!isEditing}
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{String(errors.password)}</p>}
              </div>

              {/* Confirm Password Field */}
              <div>
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  required={!isEditing && data.password !== ''}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={processing}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                >
                  {processing ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
