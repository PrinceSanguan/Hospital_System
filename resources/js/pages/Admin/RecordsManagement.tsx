import { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
  Search,
  Trash,
  FileText,
  Filter,
  Download,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from '@/layouts/AdminLayout';
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

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

interface LabTestResult {
  value: string;
  range: string;
  status: string;
  is_checked: boolean;
  result: string;
  remarks: string;
}

interface VitalSign {
  value: string;
  unit: string;
  range: string;
  status: string;
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicalRecord {
  id: number;
  patient: Patient;
  assigned_doctor: Doctor | null;
  record_type: string;
  status: string;
  appointment_date: string;
  details: string | null;
  lab_results: { [key: string]: LabTestResult } | null;
  vital_signs: { [key: string]: VitalSign } | null;
  prescriptions: Prescription[] | null;
  created_at: string;
  updated_at: string;
}

interface RecordsManagementProps {
  user: any;
  records: {
    data: MedicalRecord[];
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
  recordTypes: string[];
  statusOptions: string[];
  patients: Patient[];
  doctors: Doctor[];
}

interface FormData {
  id: string;
  patient_id: string;
  assigned_doctor_id: string;
  record_type: string;
  status: string;
  appointment_date: string;
  details: string;
  lab_results: { [key: string]: LabTestResult };
  vital_signs: { [key: string]: VitalSign };
  prescriptions: Prescription[];
}

export default function RecordsManagement({ user, records, recordTypes, statusOptions, patients, doctors }: RecordsManagementProps) {
  const { data, setData, post, put, errors, processing, reset } = useForm<FormData>({
    id: '',
    patient_id: '',
    assigned_doctor_id: '',
    record_type: recordTypes[0],
    status: statusOptions[0],
    appointment_date: '',
    details: '',
    lab_results: {},
    vital_signs: {},
    prescriptions: [],
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreate = () => {
    // Convert "none" back to empty string for the backend
    if (data.assigned_doctor_id === "none") {
      setData('assigned_doctor_id', "");
    }

    post(route('admin.records.store'), {
      onSuccess: () => {
        reset();
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleUpdate = () => {
    // Convert "none" back to empty string for the backend
    if (data.assigned_doctor_id === "none") {
      setData('assigned_doctor_id', "");
    }

    put(route('admin.records.update', data.id), {
      onSuccess: () => {
        reset();
        setIsCreateModalOpen(false);
      },
    });
  };

  const RecordTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'medical_checkup':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'laboratory':
        return <FileText className="h-5 w-5 text-purple-600" />;
      case 'medical_record':
        return <FileText className="h-5 w-5 text-green-600" />;
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
                  {type === 'medical_checkup' ? 'Medical Checkup' :
                   type === 'medical_record' ? 'Medical Record' : 'Laboratory Test'}
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
                        {record.record_type === 'medical_checkup' ? 'Medical Checkup' :
                         record.record_type === 'medical_record' ? 'Medical Record' : 'Laboratory Test'}
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
                      {/* Removed the delete button */}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{data.id ? 'Edit Record' : 'Create New Record'}</DialogTitle>
            <DialogDescription>
              {data.id
                ? 'Update the information for this record'
                : 'Fill in the details to create a new patient record'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="lab_results">Lab Results</TabsTrigger>
              <TabsTrigger value="vital_signs">Vital Signs</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
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
                        <SelectItem value="none">No doctor assigned</SelectItem>
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
                            {type === 'medical_checkup' ? 'Medical Checkup' :
                             type === 'medical_record' ? 'Medical Record' : 'Laboratory Test'}
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
            </TabsContent>

            <TabsContent value="lab_results">
              <div className="grid gap-4 py-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Laboratory Results</h3>
                  <p className="text-sm text-gray-500 mb-4">Add laboratory test results for this patient</p>

                  {data.record_type === 'medical_record' && (
                    <div className="mb-6 flex justify-center">
                      <img
                        src="/images/lab-results.jpg"
                        alt="Lab Results"
                        className="max-w-full h-auto max-h-48 rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    {Object.entries(data.lab_results).map(([test, result], index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <label className="text-sm font-medium">Test Name</label>
                            <Input
                              value={test}
                              onChange={(e) => {
                                const newLabResults = {...data.lab_results};
                                const value = newLabResults[test];
                                delete newLabResults[test];
                                newLabResults[e.target.value] = value;
                                setData('lab_results', newLabResults);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Result Value</label>
                            <Input
                              value={(result as any).value || ''}
                              onChange={(e) => {
                                const newLabResults = {...data.lab_results};
                                newLabResults[test] = {
                                  ...(newLabResults[test] as any),
                                  value: e.target.value
                                };
                                setData('lab_results', newLabResults);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <label className="text-sm font-medium">Reference Range</label>
                            <Input
                              value={(result as any).range || ''}
                              onChange={(e) => {
                                const newLabResults = {...data.lab_results};
                                newLabResults[test] = {
                                  ...(newLabResults[test] as any),
                                  range: e.target.value
                                };
                                setData('lab_results', newLabResults);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select
                              value={(result as any).status || 'normal'}
                              onValueChange={(value) => {
                                const newLabResults = {...data.lab_results};
                                newLabResults[test] = {
                                  ...(newLabResults[test] as any),
                                  status: value
                                };
                                setData('lab_results', newLabResults);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="abnormal">Abnormal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`test-${index}-checked`}
                              checked={(result as any).is_checked || false}
                              onCheckedChange={(checked) => {
                                const newLabResults = {...data.lab_results};
                                newLabResults[test] = {
                                  ...(newLabResults[test] as any),
                                  is_checked: checked
                                };
                                setData('lab_results', newLabResults);
                              }}
                            />
                            <label
                              htmlFor={`test-${index}-checked`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Show detailed results
                            </label>
                          </div>
                        </div>

                        {(result as any).is_checked && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            <div>
                              <label className="text-sm font-medium">Result</label>
                              <textarea
                                value={(result as any).result || ''}
                                onChange={(e) => {
                                  const newLabResults = {...data.lab_results};
                                  newLabResults[test] = {
                                    ...(newLabResults[test] as any),
                                    result: e.target.value
                                  };
                                  setData('lab_results', newLabResults);
                                }}
                                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                rows={3}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Remarks</label>
                              <textarea
                                value={(result as any).remarks || ''}
                                onChange={(e) => {
                                  const newLabResults = {...data.lab_results};
                                  newLabResults[test] = {
                                    ...(newLabResults[test] as any),
                                    remarks: e.target.value
                                  };
                                  setData('lab_results', newLabResults);
                                }}
                                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                rows={3}
                              />
                            </div>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newLabResults = {...data.lab_results};
                            delete newLabResults[test];
                            setData('lab_results', newLabResults);
                          }}
                          className="mt-2"
                        >
                          Remove Test
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      const newLabResults = {...data.lab_results};
                      const testNumber = Object.keys(newLabResults).length + 1;
                      newLabResults[`Test ${testNumber}`] = {
                        value: '',
                        range: '',
                        status: 'normal',
                        is_checked: false,
                        result: '',
                        remarks: ''
                      };
                      setData('lab_results', newLabResults);
                    }}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Test
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vital_signs">
              <div className="py-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Vital Signs</h3>
                  <p className="text-sm text-gray-500 mb-4">Record patient's vital signs</p>

                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    {Object.entries(data.vital_signs).map(([name, vitals], index) => (
                      <div key={index} className="p-4 border rounded-md mb-4 bg-white shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium">Measurement</label>
                            <Input
                              value={name}
                              onChange={(e) => {
                                const newVitalSigns = {...data.vital_signs};
                                const value = newVitalSigns[name];
                                delete newVitalSigns[name];
                                newVitalSigns[e.target.value] = value;
                                setData('vital_signs', newVitalSigns);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Value</label>
                            <Input
                              value={(vitals as any).value || ''}
                              onChange={(e) => {
                                const newVitalSigns = {...data.vital_signs};
                                newVitalSigns[name] = {
                                  ...(newVitalSigns[name] as any),
                                  value: e.target.value
                                };
                                setData('vital_signs', newVitalSigns);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium">Unit</label>
                            <Input
                              value={(vitals as any).unit || ''}
                              onChange={(e) => {
                                const newVitalSigns = {...data.vital_signs};
                                newVitalSigns[name] = {
                                  ...(newVitalSigns[name] as any),
                                  unit: e.target.value
                                };
                                setData('vital_signs', newVitalSigns);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Normal Range</label>
                            <Input
                              value={(vitals as any).range || ''}
                              onChange={(e) => {
                                const newVitalSigns = {...data.vital_signs};
                                newVitalSigns[name] = {
                                  ...(newVitalSigns[name] as any),
                                  range: e.target.value
                                };
                                setData('vital_signs', newVitalSigns);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select
                              value={(vitals as any).status || 'normal'}
                              onValueChange={(value) => {
                                const newVitalSigns = {...data.vital_signs};
                                newVitalSigns[name] = {
                                  ...(newVitalSigns[name] as any),
                                  status: value
                                };
                                setData('vital_signs', newVitalSigns);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="abnormal">Abnormal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newVitalSigns = {...data.vital_signs};
                            delete newVitalSigns[name];
                            setData('vital_signs', newVitalSigns);
                          }}
                          className="w-auto"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" className="w-full mt-4 flex items-center justify-center">
                        <Plus className="mr-2 h-4 w-4" /> Add Vital Sign
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Blood Pressure'] = {
                          value: '',
                          unit: 'mmHg',
                          range: '90-120/60-80',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Blood Pressure
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Heart Rate'] = {
                          value: '',
                          unit: 'bpm',
                          range: '60-100',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Heart Rate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Temperature'] = {
                          value: '',
                          unit: '°C',
                          range: '36.5-37.5',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Temperature
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Respiratory Rate'] = {
                          value: '',
                          unit: 'breaths/min',
                          range: '12-20',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Respiratory Rate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Oxygen Saturation'] = {
                          value: '',
                          unit: '%',
                          range: '95-100',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Oxygen Saturation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Weight'] = {
                          value: '',
                          unit: 'kg',
                          range: '',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Weight
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns['Height'] = {
                          value: '',
                          unit: 'cm',
                          range: '',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        Height
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newVitalSigns = {...data.vital_signs};
                        newVitalSigns[`Custom Vital Sign`] = {
                          value: '',
                          unit: '',
                          range: '',
                          status: 'normal'
                        };
                        setData('vital_signs', newVitalSigns);
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Custom Vital Sign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>
              </div>
            </TabsContent>

            <TabsContent value="prescriptions">
              <div className="grid gap-4 py-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Prescriptions</h3>
                  <p className="text-sm text-gray-500 mb-4">Add medications prescribed to the patient</p>

                  <div className="space-y-4">
                    {(data.prescriptions as any[]).map((prescription, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <label className="text-sm font-medium">Medication</label>
                            <Input
                              value={prescription.medication || ''}
                              onChange={(e) => {
                                const newPrescriptions = [...data.prescriptions as any[]];
                                newPrescriptions[index] = {
                                  ...newPrescriptions[index],
                                  medication: e.target.value
                                };
                                setData('prescriptions', newPrescriptions);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Dosage</label>
                            <Input
                              value={prescription.dosage || ''}
                              onChange={(e) => {
                                const newPrescriptions = [...data.prescriptions as any[]];
                                newPrescriptions[index] = {
                                  ...newPrescriptions[index],
                                  dosage: e.target.value
                                };
                                setData('prescriptions', newPrescriptions);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <label className="text-sm font-medium">Frequency</label>
                            <Input
                              value={prescription.frequency || ''}
                              onChange={(e) => {
                                const newPrescriptions = [...data.prescriptions as any[]];
                                newPrescriptions[index] = {
                                  ...newPrescriptions[index],
                                  frequency: e.target.value
                                };
                                setData('prescriptions', newPrescriptions);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Duration</label>
                            <Input
                              value={prescription.duration || ''}
                              onChange={(e) => {
                                const newPrescriptions = [...data.prescriptions as any[]];
                                newPrescriptions[index] = {
                                  ...newPrescriptions[index],
                                  duration: e.target.value
                                };
                                setData('prescriptions', newPrescriptions);
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="text-sm font-medium">Instructions</label>
                          <textarea
                            value={prescription.instructions || ''}
                            onChange={(e) => {
                              const newPrescriptions = [...data.prescriptions as any[]];
                              newPrescriptions[index] = {
                                ...newPrescriptions[index],
                                instructions: e.target.value
                              };
                              setData('prescriptions', newPrescriptions);
                            }}
                            className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newPrescriptions = [...data.prescriptions as any[]];
                            newPrescriptions.splice(index, 1);
                            setData('prescriptions', newPrescriptions);
                          }}
                          className="mt-2"
                        >
                          Remove Prescription
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      const newPrescriptions = [...data.prescriptions as any[]];
                      newPrescriptions.push({
                        medication: '',
                        dosage: '',
                        frequency: '',
                        duration: '',
                        instructions: ''
                      });
                      setData('prescriptions', newPrescriptions);
                    }}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Prescription
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
    </AdminLayout>
  );
}
