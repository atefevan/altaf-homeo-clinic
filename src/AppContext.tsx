import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Patient, Visit, Prescription, MedicineMaster, InventoryItem, Billing, Appointment, DoctorSettings } from "./types";
import { db, dbVault } from "./db";

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  patients: Patient[];
  visits: Visit[];
  prescriptions: Prescription[];
  medicines: MedicineMaster[];
  inventory: InventoryItem[];
  billing: Billing[];
  appointments: Appointment[];
  settings: DoctorSettings;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedVisitId: string | null;
  setSelectedVisitId: (id: string | null) => void;
  setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
  setBilling: React.Dispatch<React.SetStateAction<Billing[]>>;
  refreshData: () => Promise<void>;
  updateSettings: (vals: DoctorSettings) => void;
  toast: { message: string; type: "success" | "error" | "warning" | null };
  showToast: (msg: string, type: "success" | "error" | "warning") => void;
  themeMode: "light" | "dark";
  themeColor: string;
  setThemeMode: (mode: "light" | "dark") => void;
  setThemeColor: (color: string) => void;
  user: { username: string; fullname: string } | null;
  loginUser: (user: { username: string; fullname: string }) => void;
  logoutUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<MedicineMaster[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [billing, setBilling] = useState<Billing[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettingsState] = useState(dbVault.getSettings());

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const [user, setUser] = useState<{ username: string; fullname: string } | null>(() => {
    try {
      const savedUser = localStorage.getItem("altaf_clinic_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const loginUser = (userData: { username: string; fullname: string }) => {
    setUser(userData);
    localStorage.setItem("altaf_clinic_user", JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("altaf_clinic_user");
  };
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | null }>({
    message: "",
    type: null
  });

  const [themeMode, setThemeModeState] = useState<"light" | "dark">(
    () => (localStorage.getItem("altaf_theme_mode") as "light" | "dark") || "light"
  );
  const [themeColor, setThemeColorState] = useState<string>(
    () => localStorage.getItem("altaf_theme_color") || "blue"
  );

  const setThemeMode = (mode: "light" | "dark") => {
    setThemeModeState(mode);
    localStorage.setItem("altaf_theme_mode", mode);
  };

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
    localStorage.setItem("altaf_theme_color", color);
  };

  const showToast = (message: string, type: "success" | "error" | "warning") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: null });
    }, 4000);
  };

  const refreshData = async () => {
    try {
      const p = await db.getPatients();
      const v = await db.getVisits();
      const pr = await db.getPrescriptions();
      const m = await db.getMedicines();
      const i = await db.getInventory();
      const b = await db.getBilling();
      const a = await db.getAppointments();

      setPatients(p);
      setVisits(v);
      setPrescriptions(pr);
      setMedicines(m);
      setInventory(i);
      setBilling(b);
      setAppointments(a);
    } catch (e) {
      console.error("Failed to fetch fresh data: ", e);
      setPatients(dbVault.getPatients());
      setVisits(dbVault.getVisits());
      setPrescriptions(dbVault.getPrescriptions());
      setMedicines(dbVault.getMedicines());
      setInventory(dbVault.getInventory());
      setBilling(dbVault.getBilling());
      setAppointments(dbVault.getAppointments());
    }
  };

  const updateSettings = (vals: DoctorSettings) => {
    dbVault.setSettings(vals);
    setSettingsState(vals);
    showToast("Clinic settings updated successfully!", "success");
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        patients,
        visits,
        prescriptions,
        medicines,
        inventory,
        billing,
        appointments,
        settings,
        selectedPatientId,
        setSelectedPatientId,
        selectedVisitId,
        setSelectedVisitId,
        setPrescriptions,
        setBilling,
        refreshData,
        updateSettings,
        toast,
        showToast,
        themeMode,
        themeColor,
        setThemeMode,
        setThemeColor,
        user,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside an AppProvider");
  }
  return context;
}
