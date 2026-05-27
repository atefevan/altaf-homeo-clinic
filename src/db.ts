import { createClient } from "@supabase/supabase-js";
import { Patient, Visit, Prescription, MedicineMaster, InventoryItem, Billing, Appointment, DoctorSettings } from "./types";

const SUPABASE_URL = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_SUPABASE_URL || "https://znnubjhvhsglbvtodpvy.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_XxAMaGk1d3o8v-LWT5QhWg_XWrbMioK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const SEED_MEDICINES: MedicineMaster[] = [
  {
    id: "med-1",
    generic_name: "Paracetamol",
    brand_names: ["Napa", "Ace", "Pyrexin"],
    category: "analgesic",
    unit: "tablet",
    common_dosages: ["500mg", "665mg XR", "1g"]
  },
  {
    id: "med-2",
    generic_name: "Amoxicillin",
    brand_names: ["Fimoxyl", "Moxacil", "Amoxil"],
    category: "antibiotic",
    unit: "capsule",
    common_dosages: ["250mg", "500mg"]
  },
  {
    id: "med-3",
    generic_name: "Metformin",
    brand_names: ["Comet", "Metfo", "Glucomin"],
    category: "antidiabetic",
    unit: "tablet",
    common_dosages: ["500mg", "850mg", "1g"]
  },
  {
    id: "med-4",
    generic_name: "Esomeprazole",
    brand_names: ["Maxpro", "Sergel", "Esoral"],
    category: "antacid",
    unit: "capsule",
    common_dosages: ["20mg", "40mg"]
  },
  {
    id: "med-5",
    generic_name: "Amlodipine",
    brand_names: ["Camlodin", "Amlopin", "Amcard"],
    category: "antihypertensive",
    unit: "tablet",
    common_dosages: ["5mg", "10mg"]
  }
];

const SEED_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    medicine_id: "med-1",
    batch_number: "PR-901",
    expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    quantity: 120,
    low_stock_threshold: 150, 
    purchase_price: 0.8,
    sell_price: 1.2,
    supplier: "Square Pharmaceuticals Ltd."
  },
  {
    id: "inv-2",
    medicine_id: "med-2",
    batch_number: "AM-104",
    expiry_date: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 60,
    low_stock_threshold: 50,
    purchase_price: 4.5,
    sell_price: 6.0,
    supplier: "Beximco Pharma"
  },
  {
    id: "inv-3",
    medicine_id: "med-3",
    batch_number: "MT-302",
    expiry_date: new Date(Date.now() + 450 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 300,
    low_stock_threshold: 100,
    purchase_price: 1.5,
    sell_price: 2.2,
    supplier: "Incepta Pharmaceuticals Ltd."
  },
  {
    id: "inv-4",
    medicine_id: "med-4",
    batch_number: "ES-122",
    expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    quantity: 15, 
    low_stock_threshold: 80,
    purchase_price: 2.5,
    sell_price: 4.0,
    supplier: "Square Pharmaceuticals Ltd."
  },
  {
    id: "inv-5",
    medicine_id: "med-5",
    batch_number: "AL-508",
    expiry_date: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 180,
    low_stock_threshold: 50,
    purchase_price: 1.2,
    sell_price: 1.8,
    supplier: "Acme Laboratories Ltd."
  }
];

const SEED_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    patient_code: "ALT-0001",
    full_name: "মোঃ রফিকুল ইসলাম (Rafiqul Islam)",
    phone: "01712345678",
    dob: "1978-04-12",
    gender: "male",
    address: "Mirpur 10, Dhaka",
    allergies: ["Penicillin", "Sulfa Drugs"],
    chronic_conditions: ["Diabetes", "Hypertension"],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "pat-2",
    patient_code: "ALT-0002",
    full_name: "মোসাম্মৎ সুলতানা বেগম (Sultana Begum)",
    phone: "01987654321",
    dob: "1985-09-24",
    gender: "female",
    address: "Dhanmondi, Dhaka",
    allergies: ["Dust", "Aspirin"],
    chronic_conditions: ["Asthma"],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "pat-3",
    patient_code: "ALT-0003",
    full_name: "আনিসুর রহমান (Anisur Rahman)",
    phone: "01555444333",
    dob: "1994-11-05",
    gender: "male",
    address: "Uttara Sector 4, Dhaka",
    allergies: [],
    chronic_conditions: [],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];


const SEED_VISITS: Visit[] = [
  {
    id: "vis-1",
    patient_id: "pat-1",
    visited_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + "T10:30:00.000Z",
    chief_complaint: "High blood pressure, headache since 2 days",
    vitals: { bp: "150/95", temp: "98.4", weight: "82", pulse: "80", spo2: "99" },
    diagnosis: ["I10 (Essential Hypertension)", "E11 (Type 2 Diabetes)"],
    clinical_notes: "Advised salt restriction. Exercise daily 30 minutes.",
    visit_type: "walk-in",
    status: "completed"
  },
  {
    id: "vis-2",
    patient_id: "pat-2",
    visited_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + "T16:15:00.000Z",
    chief_complaint: "Productive cough, chest congestion, wheezing",
    vitals: { bp: "120/80", temp: "101.2", weight: "64", pulse: "88", spo2: "95" },
    diagnosis: ["J45 (Asthma)", "J20 (Acute Bronchitis)"],
    clinical_notes: "Chest clear but wheezing present. Cold avoidance is key.",
    visit_type: "walk-in",
    status: "completed"
  },
  {
    id: "vis-3",
    patient_id: "pat-1",
    visited_at: new Date(Date.now()).toISOString().split('T')[0] + "T11:00:00.000Z",
    chief_complaint: "Follow-up BP check and diabetes control",
    vitals: { bp: "135/85", temp: "98.6", weight: "81", pulse: "74", spo2: "98" },
    diagnosis: ["I10 (Essential Hypertension)"],
    clinical_notes: "Check BP weekly. HbA1c to be done next month.",
    visit_type: "follow-up",
    status: "in-progress"
  }
];

const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-1",
    visit_id: "vis-1",
    patient_id: "pat-1",
    medicines: [
      { name: "Camlodin 5mg", dose: "1+0+0", frequency: "Before Food", duration: "1 month", instructions: "Morning" },
      { name: "Comet 500mg", dose: "0+0+1", frequency: "After Food", duration: "1 month", instructions: "Night" }
    ],
    advice: "Avoid oily food, walk at least 30 mins each morning, restrict table salt intake.",
    follow_up_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    printed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rx-2",
    visit_id: "vis-2",
    patient_id: "pat-2",
    medicines: [
      { name: "Fimoxyl 500mg", dose: "1+1+1", frequency: "After Food", duration: "7 days", instructions: "Take with warm water" },
      { name: "Maxpro 20mg", dose: "1+0+1", frequency: "Before Food", duration: "14 days", instructions: "30 minutes before meal" }
    ],
    advice: "Gargle with warm water 3 times a day. Complete full course of antibiotic.",
    follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    printed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_BILLING: Billing[] = [
  {
    id: "bil-1",
    visit_id: "vis-1",
    consultation_fee: 500,
    medicine_charges: 180,
    discount: 50,
    total: 630,
    payment_status: "paid",
    payment_method: "cash"
  },
  {
    id: "bil-2",
    visit_id: "vis-2",
    consultation_fee: 500,
    medicine_charges: 420,
    discount: 0,
    total: 920,
    payment_status: "paid",
    payment_method: "bkash"
  }
];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: "app-1",
    patient_id: "pat-1",
    token_number: 1,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: "in-progress",
    visit_type: "follow-up"
  },
  {
    id: "app-2",
    patient_id: "pat-2",
    token_number: 2,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: "completed",
    visit_type: "walk-in"
  },
  {
    id: "app-3",
    patient_id: "pat-3",
    token_number: 3,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: "waiting",
    visit_type: "walk-in"
  }
];


class LocalSecureVault {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage limits or error: ", e);
    }
  }

  initialize() {
    if (!localStorage.getItem("altaf_patients")) {
      this.set("altaf_patients", SEED_PATIENTS);
    }
    if (!localStorage.getItem("altaf_visits")) {
      this.set("altaf_visits", SEED_VISITS);
    }
    if (!localStorage.getItem("altaf_prescriptions")) {
      this.set("altaf_prescriptions", SEED_PRESCRIPTIONS);
    }
    if (!localStorage.getItem("altaf_medicines")) {
      this.set("altaf_medicines", SEED_MEDICINES);
    }
    if (!localStorage.getItem("altaf_inventory")) {
      this.set("altaf_inventory", SEED_INVENTORY);
    }
    if (!localStorage.getItem("altaf_billing")) {
      this.set("altaf_billing", SEED_BILLING);
    }
    if (!localStorage.getItem("altaf_appointments")) {
      this.set("altaf_appointments", SEED_APPOINTMENTS);
    }
    if (!localStorage.getItem("altaf_settings")) {
      this.set("altaf_settings", {
        doctor_name: "Dr. MD. Altaf Hussain",
        bmdc_number: "BMDC/Reg-89421A",
        qualifications: "MBBS, FCPS (Medicine)",
        clinic_name: "Altaf Shifakhana & Pharmacy",
        address: "Lane 4, Sector 10, Uttara, Dhaka",
        phone: "+8801711223344",
        consultation_fee: 500
      });
    }
  }

  getPatients(): Patient[] { return this.get("altaf_patients", []); }
  setPatients(items: Patient[]) { this.set("altaf_patients", items); }

  getVisits(): Visit[] { return this.get("altaf_visits", []); }
  setVisits(items: Visit[]) { this.set("altaf_visits", items); }

  getPrescriptions(): Prescription[] { return this.get("altaf_prescriptions", []); }
  setPrescriptions(items: Prescription[]) { this.set("altaf_prescriptions", items); }

  getMedicines(): MedicineMaster[] { return this.get("altaf_medicines", []); }
  setMedicines(items: MedicineMaster[]) { this.set("altaf_medicines", items); }

  getInventory(): InventoryItem[] { return this.get("altaf_inventory", []); }
  setInventory(items: InventoryItem[]) { this.set("altaf_inventory", items); }

  getBilling(): Billing[] { return this.get("altaf_billing", []); }
  setBilling(items: Billing[]) { this.set("altaf_billing", items); }

  getDeletedBillings(): string[] { return this.get("altaf_deleted_billings", []); }
  addDeletedBilling(id: string) {
    const list = this.getDeletedBillings();
    if (!list.includes(id)) {
      list.push(id);
      this.set("altaf_deleted_billings", list);
    }
  }

  getAppointments(): Appointment[] { return this.get("altaf_appointments", []); }
  setAppointments(items: Appointment[]) { this.set("altaf_appointments", items); }

  getSettings() {
    return this.get("altaf_settings", {
      doctor_name: "Dr. MD. Altaf Hussain",
      bmdc_number: "BMDC/Reg-89421A",
      qualifications: "MBBS, FCPS (Medicine)",
      clinic_name: "Altaf Shifakhana & Pharmacy",
      address: "Lane 4, Sector 10, Uttara, Dhaka",
      phone: "+8801711223344",
      consultation_fee: 500
    });
  }
  setSettings(value: DoctorSettings) { this.set("altaf_settings", value); }
}

export const dbVault = new LocalSecureVault();
if (typeof window !== "undefined") {
  dbVault.initialize();
}


function shrinkImage(file: File, maxW = 320, maxH = 320): Promise<{ blob: Blob; base64: string }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof FileReader === "undefined") {
      resolve({ blob: file, base64: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round(height * (maxW / width));
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round(width * (maxH / height));
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const base64 = canvas.toDataURL("image/jpeg", 0.82);
        canvas.toBlob((blob) => {
          resolve({ blob: blob || file, base64 });
        }, "image/jpeg", 0.82);
      };
      img.onerror = () => {
        resolve({ blob: file, base64: e.target?.result as string || "" });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve({ blob: file, base64: "" });
    };
    reader.readAsDataURL(file);
  });
}


export const db = {
  
  async getPatients(): Promise<Patient[]> {
    try {
      const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase getPatients failed:", error);
        return dbVault.getPatients();
      }
      if (!data || data.length === 0) {
        return dbVault.getPatients();
      }

      
      const localList = dbVault.getPatients();
      const mergedList = (data as Patient[]).map((dbPat) => {
        const localPat = localList.find((p) => p.id === dbPat.id);
        return {
          ...localPat,
          ...dbPat,
          address: dbPat.address || localPat?.address || "",
          photo_url: dbPat.photo_url || localPat?.photo_url || ""
        };
      });

      
      dbVault.setPatients(mergedList);
      return mergedList;
    } catch (e) {
      console.error("Supabase getPatients exception:", e);
      return dbVault.getPatients();
    }
  },

  async savePatient(patient: Omit<Patient, "id" | "patient_code" | "created_at"> & { id?: string, photo_url?: string }): Promise<Patient> {
    const list = dbVault.getPatients();
    const newId = patient.id || `pat-${Date.now()}`;
    const code = patient.id
      ? list.find((p) => p.id === patient.id)?.patient_code || `ALT-${String(list.length + 1).padStart(4, "0")}`
      : `ALT-${String(list.length + 1).padStart(4, "0")}`;

    const newPatient: Patient = {
      id: newId,
      patient_code: code,
      full_name: patient.full_name,
      phone: patient.phone,
      dob: patient.dob,
      gender: patient.gender,
      address: patient.address,
      allergies: patient.allergies || [],
      chronic_conditions: patient.chronic_conditions || [],
      photo_url: patient.photo_url,
      created_at: new Date().toISOString()
    };

    if (patient.id) {
      const index = list.findIndex((p) => p.id === patient.id);
      if (index !== -1) {
        
        newPatient.created_at = list[index].created_at || newPatient.created_at;
        list[index] = { ...list[index], ...newPatient };
      } else {
        list.push(newPatient);
      }
    } else {
      list.push(newPatient);
    }
    dbVault.setPatients(list);

    
    try {
      const { address, ...dbPatient } = newPatient;
      const { error } = await supabase.from("patients").upsert([dbPatient]);
      if (error) {
        console.warn("Supabase savePatient sync with photo_url failed, retrying without photo_url:", error);
        
        const { photo_url, ...dbPatientNoPhoto } = dbPatient;
        const { error: retryError } = await supabase.from("patients").upsert([dbPatientNoPhoto]);
        if (retryError) {
          console.error("Supabase savePatient retry sync failed too:", retryError);
        } else {
          console.log("Supabase savePatient sync successful (stored photo_url in local vault only)!");
        }
      } else {
        console.log("Supabase savePatient sync successful!");
      }
    } catch (e) {
      console.warn("Supabase backup failed, running on Local Secure Vault: ", e);
    }

    return newPatient;
  },

  async uploadPatientPhoto(file: File, filename: string): Promise<string> {
    try {
      
      const { blob, base64 } = await shrinkImage(file);
      
      const cleanName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      
      const { data, error } = await supabase.storage
        .from("patient-photos")
        .upload(cleanName, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      
      const { data: publicUrlData } = supabase.storage
        .from("patient-photos")
        .getPublicUrl(cleanName);

      if (publicUrlData && publicUrlData.publicUrl) {
        
        
        
        try {
          localStorage.setItem(`fallback_photo_${publicUrlData.publicUrl}`, base64);
        } catch (e) {
          console.warn("Could not save fallback base64 to localStorage: ", e);
        }
        return publicUrlData.publicUrl;
      }
      return base64;
    } catch (error) {
      console.warn("Supabase storage upload failed or bucket not ready, falling back to local base64 preview:", error);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => reject(new Error("Failed to read file as data URL"));
        reader.readAsDataURL(file);
      });
    }
  },

  async deletePatient(id: string): Promise<boolean> {
    const list = dbVault.getPatients();
    const updated = list.filter((p) => p.id !== id);
    dbVault.setPatients(updated);
    try {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) {
        console.error("Supabase deletePatient sync failed:", error);
      }
      return true;
    } catch (e) {
      console.warn("Supabase erase backup failed: ", e);
      return true;
    }
  },

  
  async getVisits(): Promise<Visit[]> {
    try {
      const { data, error } = await supabase.from("visits").select("*").order("visited_at", { ascending: false });
      if (error) {
        console.error("Supabase getVisits failed:", error);
        return dbVault.getVisits();
      }
      if (!data || data.length === 0) {
        return dbVault.getVisits();
      }
      
      return data.map((v: Visit) => ({
        ...v,
        visit_type: v.visit_type || "walk-in"
      }));
    } catch (e) {
      console.error("Supabase getVisits exception:", e);
      return dbVault.getVisits();
    }
  },

  async saveVisit(visit: Omit<Visit, "id" | "visited_at"> & { id?: string }): Promise<Visit> {
    const list = dbVault.getVisits();
    const newId = visit.id || `vis-${Date.now()}`;
    const newVisit: Visit = {
      id: newId,
      patient_id: visit.patient_id,
      visited_at: new Date().toISOString(),
      chief_complaint: visit.chief_complaint,
      vitals: visit.vitals,
      diagnosis: visit.diagnosis || [],
      clinical_notes: visit.clinical_notes,
      visit_type: visit.visit_type,
      status: visit.status
    };

    if (visit.id) {
      const index = list.findIndex((v) => v.id === visit.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...newVisit };
      } else {
        list.push(newVisit);
      }
    } else {
      list.push(newVisit);
    }
    dbVault.setVisits(list);

    
    try {
      const { visit_type, ...dbVisit } = newVisit;
      const { error } = await supabase.from("visits").upsert([dbVisit]);
      if (error) {
        console.error("Supabase saveVisit sync failed:", error);
      } else {
        console.log("Supabase saveVisit sync successful!");
      }
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
    }

    return newVisit;
  },

  
  async getPrescriptions(): Promise<Prescription[]> {
    const deletedIds = (() => {
      try {
        return JSON.parse(localStorage.getItem("altaf_deleted_prescription_ids") || "[]");
      } catch {
        return [];
      }
    })();

    const filterDeleted = (list: Prescription[]) => {
      return list.filter((rx) => !deletedIds.includes(rx.id));
    };

    try {
      const { data, error } = await supabase.from("prescriptions").select("*");
      if (error) {
        console.error("Supabase getPrescriptions failed:", error);
        return filterDeleted(dbVault.getPrescriptions());
      }
      if (!data || data.length === 0) {
        return filterDeleted(dbVault.getPrescriptions());
      }
      
      const mapped = data.map((rx: Prescription) => ({
        ...rx,
        advice: rx.advice ? (Array.isArray(rx.advice) ? rx.advice.join(", ") : rx.advice) : ""
      }));
      return filterDeleted(mapped);
    } catch (e) {
      console.error("Supabase getPrescriptions exception:", e);
      return filterDeleted(dbVault.getPrescriptions());
    }
  },

  async savePrescription(rx: Omit<Prescription, "id"> & { id?: string }): Promise<Prescription> {
    const list = dbVault.getPrescriptions();
    const newId = rx.id || `rx-${Date.now()}`;
    const newRx: Prescription = {
      id: newId,
      visit_id: rx.visit_id,
      patient_id: rx.patient_id,
      medicines: rx.medicines,
      advice: rx.advice,
      follow_up_date: rx.follow_up_date,
      pdf_url: rx.pdf_url,
      printed_at: rx.printed_at || new Date().toISOString()
    };

    if (rx.id) {
      const index = list.findIndex((r) => r.id === rx.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...newRx };
      } else {
        list.push(newRx);
      }
    } else {
      list.push(newRx);
    }
    dbVault.setPrescriptions(list);

    
    try {
      let deletedIds = JSON.parse(localStorage.getItem("altaf_deleted_prescription_ids") || "[]");
      if (deletedIds.includes(newId)) {
        deletedIds = deletedIds.filter((id: string) => id !== newId);
        localStorage.setItem("altaf_deleted_prescription_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn(e);
    }

    
    try {
      const dbAdvice = rx.advice
        ? (Array.isArray(rx.advice) ? rx.advice : [rx.advice].map(v => v.trim()).filter(Boolean))
        : [];
      const dbRx = {
        ...newRx,
        advice: dbAdvice
      };
      const { error } = await supabase.from("prescriptions").upsert([dbRx]);
      if (error) {
        console.error("Supabase savePrescription sync failed:", error);
      } else {
        console.log("Supabase savePrescription sync successful!");
      }
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
    }

    return newRx;
  },

  async deletePrescription(id: string): Promise<boolean> {
    const list = dbVault.getPrescriptions();
    const updated = list.filter((r) => r.id !== id);
    dbVault.setPrescriptions(updated);

    
    try {
      const deletedIds = JSON.parse(localStorage.getItem("altaf_deleted_prescription_ids") || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("altaf_deleted_prescription_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn("Blacklist write failed: ", e);
    }

    try {
      const { error } = await supabase.from("prescriptions").delete().eq("id", id);
      if (error) {
        console.error("Supabase deletePrescription failed:", error);
      }
      return true;
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
      return true;
    }
  },

  
  async getMedicines(): Promise<MedicineMaster[]> {
    try {
      const { data, error } = await supabase.from("medicines").select("*");
      if (error || !data || data.length === 0) {
        return dbVault.getMedicines();
      }
      return data ?? [];
    } catch {
      return dbVault.getMedicines();
    }
  },

  async saveMedicine(med: Omit<MedicineMaster, "id"> & { id?: string }): Promise<MedicineMaster> {
    const list = dbVault.getMedicines();
    const newId = med.id || `med-${Date.now()}`;
    const item: MedicineMaster = {
      id: newId,
      generic_name: med.generic_name,
      brand_names: med.brand_names,
      category: med.category,
      unit: med.unit,
      common_dosages: med.common_dosages || []
    };

    if (med.id) {
      const idx = list.findIndex((m) => m.id === med.id);
      if (idx !== -1) list[idx] = item;
    } else {
      list.push(item);
    }
    dbVault.setMedicines(list);

    try {
      await supabase.from("medicines").upsert([item]);
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
    }

    return item;
  },

  
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase.from("inventory").select("*");
      if (error || !data || data.length === 0) {
        return dbVault.getInventory();
      }
      return data;
    } catch {
      return dbVault.getInventory();
    }
  },

  async saveInventoryItem(inv: Omit<InventoryItem, "id"> & { id?: string }): Promise<InventoryItem> {
    const list = dbVault.getInventory();
    const newId = inv.id || `inv-${Date.now()}`;
    const item: InventoryItem = {
      id: newId,
      medicine_id: inv.medicine_id,
      batch_number: inv.batch_number,
      expiry_date: inv.expiry_date,
      quantity: inv.quantity,
      low_stock_threshold: inv.low_stock_threshold,
      purchase_price: inv.purchase_price,
      sell_price: inv.sell_price,
      supplier: inv.supplier
    };

    if (inv.id) {
      const index = list.findIndex((i) => i.id === inv.id);
      if (index !== -1) {
        list[index] = item;
      }
    } else {
      list.push(item);
    }
    dbVault.setInventory(list);

    try {
      await supabase.from("inventory").upsert([item]);
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
    }

    return item;
  },

  async deleteInventoryItem(id: string): Promise<boolean> {
    const list = dbVault.getInventory();
    const updated = list.filter((i) => i.id !== id);
    dbVault.setInventory(updated);
    try {
      await supabase.from("inventory").delete().eq("id", id);
      return true;
    } catch (e) {
      console.warn("Supabase inventory item deletion failed: ", e);
      return true;
    }
  },

  
  async getBilling(): Promise<Billing[]> {
    const blacklist = dbVault.getDeletedBillings();
    try {
      const { data, error } = await supabase.from("billing").select("*");
      if (error || !data || data.length === 0) {
        return dbVault.getBilling().filter((b) => !blacklist.includes(b.id));
      }
      return data.filter((b: Billing) => !blacklist.includes(b.id));
    } catch {
      return dbVault.getBilling().filter((b) => !blacklist.includes(b.id));
    }
  },

  async saveBilling(billing: Omit<Billing, "id"> & { id?: string }): Promise<Billing> {
    const list = dbVault.getBilling();
    const newId = billing.id || `bil-${Date.now()}`;
    const item: Billing = {
      id: newId,
      visit_id: billing.visit_id,
      consultation_fee: billing.consultation_fee,
      medicine_charges: billing.medicine_charges,
      discount: billing.discount,
      total: billing.total,
      payment_status: billing.payment_status,
      payment_method: billing.payment_method
    };

    if (billing.id) {
      const idx = list.findIndex((b) => b.id === billing.id);
      if (idx !== -1) list[idx] = item;
    } else {
      list.push(item);
    }
    dbVault.setBilling(list);

    try {
      await supabase.from("billing").upsert([item]);
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
    }

    return item;
  },

  async deleteBilling(id: string): Promise<boolean> {
    dbVault.addDeletedBilling(id);
    const list = dbVault.getBilling();
    const updated = list.filter((b) => b.id !== id);
    dbVault.setBilling(updated);
    try {
      await supabase.from("billing").delete().eq("id", id);
      return true;
    } catch (e) {
      console.warn("Supabase billing deletion failed: ", e);
      return true;
    }
  },

  
  async getAppointments(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase.from("appointments").select("*");
      if (error || !data || data.length === 0) {
        return dbVault.getAppointments();
      }
      return data;
    } catch {
      return dbVault.getAppointments();
    }
  },

  async saveAppointment(app: Omit<Appointment, "id" | "token_number" | "scheduled_date"> & { id?: string }): Promise<Appointment> {
    const list = dbVault.getAppointments();
    const newId = app.id || `app-${Date.now()}`;

    
    const countToday = list.filter((a) => a.scheduled_date === new Date().toISOString().split("T")[0]).length;
    const token = app.id
      ? list.find((a) => a.id === app.id)?.token_number || countToday + 1
      : countToday + 1;

    const item: Appointment = {
      id: newId,
      patient_id: app.patient_id,
      token_number: token,
      scheduled_date: new Date().toISOString().split("T")[0],
      status: app.status,
      visit_type: app.visit_type
    };

    if (app.id) {
      const idx = list.findIndex((a) => a.id === app.id);
      if (idx !== -1) list[idx] = item;
    } else {
      list.push(item);
    }
    dbVault.setAppointments(list);

    try {
      await supabase.from("appointments").upsert([item]);
    } catch (e) {
      console.warn("Supabase backup failed: ", e);
    }

    return item;
  },

  async authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: { username: string; fullname: string }; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("clinic_users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();
      if (error) {
        console.warn("Supabase auth error, falling back:", error);
      }
      if (data) {
        return { success: true, user: { username: data.username, fullname: data.fullname || data.username } };
      }
    } catch (e) {
      console.warn("Supabase auth exception, falling back:", e);
    }

    if (username === "Altaf" && password === "altaf123596") {
      return { success: true, user: { username: "Altaf", fullname: "Dr. Altaf Hossain" } };
    }
    return { success: false, error: "Invalid username or password" };
  }
};
