import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
  Search,
  PlusCircle,
  Edit,
  Trash,
  User,
  UserCog,
  ShieldCheck,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AdminLayout from '@/layouts/AdminLayout';

interface UserProps {
  id: number;
  name: string;
  email: string;
  role: string;
  user_role?: string;
  phone: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserManagementProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  users: {
    data: UserProps[];
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
  roles: string[];
}

export default function UserManagement({ user, users, roles }: UserManagementProps) {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProps | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserProps[]>(users.data || []);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, setData, post, put, errors, processing, reset } = useForm({
    id: "",
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    user_role: "patient"
  });

  // Helper function to get user's role
  const getUserRole = (user: UserProps): string => {
    return user.user_role || user.role || 'unknown';
  };

  useEffect(() => {
    console.log('Initial users data:', users);

    let result = users.data || [];

    console.log('All users from server:', result);

    // Filter by role if not on "all" tab
    if (activeTab !== "all") {
      result = result.filter(user =>
        getUserRole(user) === activeTab
      );
      console.log(`Filtered users for ${activeTab}:`, result);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
      console.log(`Search filtered users for "${searchQuery}":`, result);
    }

    setFilteredUsers(result);
  }, [users.data, activeTab, searchQuery]);

  const handleCreate = () => {
    // Reset form error
    setFormError(null);

    // Check that all required fields are filled
    if (!data.name || !data.email || !data.password || !data.password_confirmation) {
      console.log('Missing required fields');
      setFormError("Please fill in all required fields.");
      return;
    }

    // Check if passwords match
    if (data.password !== data.password_confirmation) {
      console.error('Passwords do not match');
      setFormError("Passwords do not match.");
      return;
    }

    console.log('Submitting user data:', data);
    post(route('admin.users.store'), {
      onSuccess: (response) => {
        console.log('User created successfully:', response);
        reset();
        setIsUserModalOpen(false);
        // Force refresh the page to show the new user
        window.location.reload();
      },
      onError: (errors) => {
        console.error('Create user errors:', errors);
        setFormError(Object.values(errors).join(', '));
      }
    });
  };

  const handleEdit = (user: UserProps) => {
    setSelectedUser(user);
    setData({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: "",
      password_confirmation: "",
      user_role: getUserRole(user)
    });
    setIsUserModalOpen(true);
  };

  const handleUpdate = () => {
    // Reset form error
    setFormError(null);

    console.log('Updating user data:', data);
    put(route('admin.users.update', data.id), {
      onSuccess: (response) => {
        console.log('User updated successfully:', response);
        reset();
        setIsUserModalOpen(false);
        setSelectedUser(null);
      },
      onError: (errors) => {
        console.error('Update user errors:', errors);
        setFormError(Object.values(errors).join(', '));
      }
    });
  };

  const confirmDelete = (user: UserProps) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser) {
      console.log('Deleting user:', selectedUser);
      post(route('admin.users.destroy', selectedUser.id), {
        method: 'delete',
        onSuccess: (response) => {
          console.log('User deleted successfully:', response);
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        },
        onError: (errors) => {
          console.error('Delete user errors:', errors);
          setFormError(Object.values(errors).join(', '));
        }
      });
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <Button onClick={() => {
            reset();
            setSelectedUser(null);
            setIsUserModalOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create User
          </Button>
        </div>

        {/* Tabs and Filters */}
        <div className="mb-6">
          <Tabs
            defaultValue="all"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="flex justify-between">
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                {roles.map(role => (
                  <TabsTrigger key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      Verified Users
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Recently Added
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Alphabetical
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="all" className="mt-6">
              <UserTable
                users={filteredUsers}
                onEdit={handleEdit}
                onDelete={confirmDelete}
              />
            </TabsContent>

            {roles.map(role => (
              <TabsContent key={role} value={role} className="mt-6">
                <UserTable
                  users={filteredUsers}
                  onEdit={handleEdit}
                  onDelete={confirmDelete}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredUsers.length}</span> of{" "}
            <span className="font-medium">{users.total}</span> users
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={users.current_page === 1}
              onClick={() => {
                // Handle pagination
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={users.current_page === users.last_page}
              onClick={() => {
                // Handle pagination
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? 'Update the user information or change role'
                : 'Fill in the details to create a new user'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name
              </label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={data.name}
                  onChange={e => setData('name', e.target.value)}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right text-sm font-medium">
                Email
              </label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="password" className="text-right text-sm font-medium">
                Password
              </label>
              <div className="col-span-3">
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={e => setData('password', e.target.value)}
                  placeholder={selectedUser ? "Leave blank to keep current password" : ""}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="password_confirmation" className="text-right text-sm font-medium">
                Confirm Password
              </label>
              <div className="col-span-3">
                <Input
                  id="password_confirmation"
                  type="password"
                  value={data.password_confirmation}
                  onChange={e => setData('password_confirmation', e.target.value)}
                />
                {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="user_role" className="text-right text-sm font-medium">
                Role
              </label>
              <div className="col-span-3">
                <Select
                  value={data.user_role}
                  onValueChange={(value) => setData('user_role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_role && <p className="mt-1 text-xs text-red-600">{errors.user_role}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={selectedUser ? handleUpdate : handleCreate} disabled={processing}>
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will remove all their associated data.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="mt-4 rounded-md bg-red-50 p-4">
            {selectedUser && (
              <div className="text-sm text-red-700">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {getUserRole(selectedUser).charAt(0).toUpperCase() + getUserRole(selectedUser).slice(1)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={processing}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// User Table Component
function UserTable({
  users,
  onEdit,
  onDelete
}: {
  users: UserProps[],
  onEdit: (user: UserProps) => void,
  onDelete: (user: UserProps) => void
}) {
  console.log('Rendering UserTable with users:', users);

  // Function to get actual role regardless of whether it's in role or user_role
  const getUserRole = (user: UserProps): string => {
    return user.user_role || user.role || 'unknown';
  };

  return (
    <div className="overflow-hidden rounded-lg border shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Joined
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        {getUserRole(user) === 'admin' ? (
                          <ShieldCheck className="h-5 w-5 text-purple-600" />
                        ) : getUserRole(user) === 'doctor' ? (
                          <UserCog className="h-5 w-5 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    {(() => {
                      switch (getUserRole(user)) {
                        case 'admin':
                          return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
                        case 'doctor':
                          return <Badge className="bg-blue-100 text-blue-800">Doctor</Badge>;
                        case 'clinical_staff':
                          return <Badge className="bg-green-100 text-green-800">Staff</Badge>;
                        case 'patient':
                          return <Badge className="bg-gray-100 text-gray-800">Patient</Badge>;
                        default:
                          return <Badge className="bg-gray-100 text-gray-800">{getUserRole(user)}</Badge>;
                      }
                    })()}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => onDelete(user)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
