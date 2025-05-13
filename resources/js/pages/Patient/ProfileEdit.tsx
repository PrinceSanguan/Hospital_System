import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserData } from '@/types';
import { FaCamera } from 'react-icons/fa';

interface ProfileEditProps {
  user: UserData & {
    profile_image: string | null;
  };
}

export default function ProfileEdit({ user }: ProfileEditProps) {
  const [passwordError, setPasswordError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(user.profile_image || null);

  const { data, setData, errors, post, processing } = useForm({
    name: user.name || '',
    email: user.email || '',
    password: '',
    password_confirmation: '',
    profile_image: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (data.password !== data.password_confirmation) {
      setPasswordError(true);
      return;
    }

    setPasswordError(false);
    post(route('patient.my-profile.update'), {
      forceFormData: true,
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      setData('profile_image', file);

      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <PatientLayout user={user}>
      <Head title="Edit Profile" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Image */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Image</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div
                    className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-100 cursor-pointer mb-4"
                    onClick={handleImageClick}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gray-200">
                        <span className="text-gray-500 text-5xl">{user.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full">
                      <FaCamera />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Click to upload a new profile image
                  </p>
                </CardContent>
              </Card>

              {/* Personal Information Form */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="password_confirmation">Confirm New Password</Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                      />
                      {passwordError && (
                        <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  );
}
