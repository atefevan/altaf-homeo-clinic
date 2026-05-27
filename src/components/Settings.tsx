import React, { useState } from "react";
import { useApp } from "../AppContext";
import { 
  Settings as LucideSettings, 
  Tag, 
  Save, 
  MapPin, 
  Phone, 
  DollarSign, 
  GraduationCap 
} from "lucide-react";

export function Settings() {
  const { settings, updateSettings, showToast } = useApp();

  
  const [doctorName, setDoctorName] = useState(settings.doctor_name);
  const [bmdcNumber, setBmdcNumber] = useState(settings.bmdc_number);
  const [qualifications, setQualifications] = useState(settings.qualifications);
  const [clinicName, setClinicName] = useState(settings.clinic_name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [consultationFee, setConsultationFee] = useState(settings.consultation_fee.toString());

  const hasChanges = 
    doctorName !== settings.doctor_name ||
    bmdcNumber !== settings.bmdc_number ||
    qualifications !== settings.qualifications ||
    clinicName !== settings.clinic_name ||
    address !== settings.address ||
    phone !== settings.phone ||
    (parseFloat(consultationFee) || 0) !== settings.consultation_fee;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !bmdcNumber || !clinicName) {
      showToast("Doctor Name, BMDC Registration, and Clinic Header are required.", "error");
      return;
    }

    updateSettings({
      doctor_name: doctorName,
      bmdc_number: bmdcNumber,
      qualifications: qualifications,
      clinic_name: clinicName,
      address: address,
      phone: phone,
      consultation_fee: parseFloat(consultationFee) || 500
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="settings-tab">
      
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-800">Clinic Profile & Letterhead settings</h2>
        <p className="text-xs text-slate-400">Configure prescription printing headers, mandatory BMDC credentials registration, and default fee parameters.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <LucideSettings className="h-5 w-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-sky-950">Letterhead & Practitioner Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">Doctor Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 pl-3 focus:border-indigo-600 focus:outline-hidden text-slate-700 font-semibold"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Qualifications & Degrees</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 pl-3 focus:border-indigo-600 focus:outline-hidden text-slate-700 font-semibold"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 text-red-600 font-bold">BMDC Registration Number (Mandatory on print header)</label>
            <input
              type="text"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden text-slate-700 font-bold"
              value={bmdcNumber}
              onChange={(e) => setBmdcNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">Clinic Name (Letterhead title)</label>
            <input
              type="text"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden text-slate-700 font-bold"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">Practice Address</label>
            <textarea
              rows={2}
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-3.5 focus:border-indigo-600 focus:outline-hidden text-slate-700 placeholder-slate-400"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></textarea>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Contact Number</label>
            <input
              type="text"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Default Consultation Fee (৳)</label>
            <input
              type="number"
              required
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden font-bold"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
            />
          </div>

        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400 font-medium">Saved profiles are encoded locally in your Secure Vault and synchronized on print sheets.</p>
          <button
            type="submit"
            disabled={!hasChanges}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all self-end cursor-pointer"
            id="save-settings-btn"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>

      </form>

    </div>
  );
}
