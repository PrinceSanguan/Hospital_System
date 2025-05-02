// User types
export interface UserData {
  id?: number;
  name: string;
  email: string;
  role: string;
}

// Schedule types
export interface ScheduleData {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Service types
export interface ServiceData {
  id: number;
  doctor_id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  image_path?: string;
  created_at?: string;
  updated_at?: string;
}

// Patient Record types
export interface PatientRecordData {
  id: number;
  patient_id: number;
  assigned_doctor_id: number;
  record_type: string;
  status: string;
  appointment_date?: string;
  details?: any;
  lab_results?: any;
  vital_signs?: any;
  prescriptions?: any;
  created_at?: string;
  updated_at?: string;
  patient?: UserData;
  assignedDoctor?: UserData;
}

// Notification types
export interface NotificationData {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  related_id?: number;
  related_type?: string;
  created_at?: string;
  updated_at?: string;
}
