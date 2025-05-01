import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
import {
  Search,
  PlusCircle,
  Edit,
  Trash,
  FileText,
  Filter,
  Download,
  X,
  CalendarDays,
  Plus
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from '@/layouts/AdminLayout';

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface Doctor {
  id: number;
  name: string;
  specialty?: string;
}

interface Record {
  id: number;
  patient: Patient;
  assigned_doctor: Doctor | null;
  record_type: string;
  status: string;
  appointment_date: string;
  details: string | null;
  lab_results: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface RecordsManagementProps {
  user: any;
  records: {
    data: Record[];
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
  recordTypes: string[];
  statusOptions: string[];
  patients: Patient[];
  doctors: Doctor[];
  filters: any;
  pagination: any;
}

export default function RecordsManagement({ user, records, recordTypes, statusOptions, patients, doctors, filters, pagination }: RecordsManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  const { data, setData, post, put, errors, processing, reset } = useForm({
    id: "",
    patient_id: "",
    assigned_doctor_id: "",
    record_type: "",
    status: "pending",
    appointment_date: "",
    details: "",
    lab_results: {}
  });

  const handleCreate = () => {
    post(route('admin.records.store'), {
      onSuccess: () => {
        reset();
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleEdit = (record: Record) => {
    setData({
      id: record.id.toString(),
      patient_id: record.patient.id.toString(),
      assigned_doctor_id: record.assigned_doctor ? record.assigned_doctor.id.toString() : "",
      record_type: record.record_type,
      status: record.status,
      appointment_date: record.appointment_date,
      details: record.details || "",
      lab_results: record.lab_results || {}
    });
    setIsCreateModalOpen(true);
  };

  const handleUpdate = () => {
    put(route('admin.records.update', data.id), {
      onSuccess: () => {
        reset();
        setIsCreateModalOpen(false);
      },
    });
  };

  const confirmDelete = (record: Record) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedRecord) {
      post(route('admin.records.destroy', selectedRecord.id), {
        method: 'delete',
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSelectedRecord(null);
        },
      });
    }
  };

  const RecordTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'medical_checkup':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'laboratory':
        return <FileText className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = "";

    switch (status) {
      case 'pending':
        colorClass = "bg-yellow-100 text-yellow-800";
        break;
      case 'completed':
        colorClass = "bg-green-100 text-green-800";
        break;
      case 'cancelled':
        colorClass = "bg-red-100 text-red-800";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800";
    }

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Records Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Record
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search records..."
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Record Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {recordTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Records
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarDays className="mr-2 h-4 w-4" />
                Filter by Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Records Table */}
        <div className="overflow-hidden rounded-lg border shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {records.data.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900">{record.patient.name}</div>
                    <div className="text-sm text-gray-500">{record.patient.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {record.assigned_doctor ? (
                      <div>
                        <div className="font-medium text-gray-900">Dr. {record.assigned_doctor.name}</div>
                        {record.assigned_doctor.specialty && (
                          <div className="text-sm text-gray-500">{record.assigned_doctor.specialty}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <RecordTypeIcon type={record.record_type} />
                      <span className="ml-2 text-sm text-gray-900">
                        {record.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(record.appointment_date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={route('admin.records.show', record.id)}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => confirmDelete(record)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{records.current_page}</span> to{" "}
            <span className="font-medium">{Math.min(records.current_page * records.per_page, records.total)}</span> of{" "}
            <span className="font-medium">{records.total}</span> results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={records.current_page === 1}
              onClick={() => {
                // Handle pagination
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={records.current_page === records.last_page}
              onClick={() => {
                // Handle pagination
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Create/Edit Record Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{data.id ? 'Edit Record' : 'Create New Record'}</DialogTitle>
            <DialogDescription>
              {data.id
                ? 'Update the information for this record'
                : 'Fill in the details to create a new patient record'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="patient" className="text-right text-sm font-medium">
                Patient
              </label>
              <div className="col-span-3">
                <Select
                  value={data.patient_id}
                  onValueChange={(value) => setData('patient_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patient_id && <p className="mt-1 text-xs text-red-600">{errors.patient_id}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="doctor" className="text-right text-sm font-medium">
                Doctor
              </label>
              <div className="col-span-3">
                <Select
                  value={data.assigned_doctor_id}
                  onValueChange={(value) => setData('assigned_doctor_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No doctor assigned</SelectItem>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assigned_doctor_id && <p className="mt-1 text-xs text-red-600">{errors.assigned_doctor_id}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right text-sm font-medium">
                Record Type
              </label>
              <div className="col-span-3">
                <Select
                  value={data.record_type}
                  onValueChange={(value) => setData('record_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.record_type && <p className="mt-1 text-xs text-red-600">{errors.record_type}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right text-sm font-medium">
                Status
              </label>
              <div className="col-span-3">
                <Select
                  value={data.status}
                  onValueChange={(value) => setData('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right text-sm font-medium">
                Appointment Date
              </label>
              <div className="col-span-3">
                <Input
                  id="date"
                  type="datetime-local"
                  value={data.appointment_date}
                  onChange={e => setData('appointment_date', e.target.value)}
                />
                {errors.appointment_date && <p className="mt-1 text-xs text-red-600">{errors.appointment_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="details" className="text-right text-sm font-medium">
                Details
              </label>
              <div className="col-span-3">
                <textarea
                  id="details"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  rows={3}
                  value={data.details}
                  onChange={e => setData('details', e.target.value)}
                />
                {errors.details && <p className="mt-1 text-xs text-red-600">{errors.details}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={data.id ? handleUpdate : handleCreate} disabled={processing}>
              {data.id ? 'Update Record' : 'Create Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 rounded-md bg-red-50 p-4">
            {selectedRecord && (
              <div className="text-sm text-red-700">
                <p><strong>Patient:</strong> {selectedRecord.patient.name}</p>
                <p><strong>Type:</strong> {selectedRecord.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}</p>
                <p><strong>Date:</strong> {new Date(selectedRecord.appointment_date).toLocaleDateString()}</p>
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
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
