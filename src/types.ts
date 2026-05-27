export interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  allergies: string[];
  chronic_conditions: string[];
  photo_url?: string;
  created_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  visited_at: string;
  chief_complaint: string;
  vitals: {
    bp?: string;
    temp?: string;
    weight?: string;
    pulse?: string;
    spo2?: string;
  };
  diagnosis: string[];
  clinical_notes: string;
  visit_type: 'walk-in' | 'appointment' | 'follow-up';
  status: 'waiting' | 'in-progress' | 'completed';
}

export interface PrescriptionMedicine {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  visit_id: string;
  patient_id: string;
  medicines: PrescriptionMedicine[];
  advice?: string;
  follow_up_date?: string;
  pdf_url?: string;
  printed_at?: string;
}

export interface MedicineMaster {
  id: string;
  generic_name: string;
  brand_names: string[];
  category: string;
  unit: string;
  common_dosages: string[];
}

export interface InventoryItem {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  low_stock_threshold: number;
  purchase_price: number;
  sell_price: number;
  supplier?: string;
}

export interface Billing {
  id: string;
  visit_id: string;
  consultation_fee: number;
  medicine_charges: number;
  discount: number;
  total: number;
  payment_status: 'paid' | 'due' | 'waived';
  payment_method: 'cash' | 'bkash' | 'card';
}

export interface Appointment {
  id: string;
  patient_id: string;
  token_number: number;
  scheduled_date: string;
  status: 'waiting' | 'in-progress' | 'completed';
  visit_type: 'walk-in' | 'appointment' | 'follow-up';
}

export interface DoctorSettings {
  doctor_name: string;
  bmdc_number: string;
  qualifications: string;
  clinic_name: string;
  address: string;
  phone: string;
  consultation_fee: number;
}
