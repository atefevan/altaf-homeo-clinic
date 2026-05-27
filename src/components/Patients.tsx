import React, { useState, useEffect } from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { Patient } from "../types";
import { 
  Search, 
  UserPlus, 
  Plus, 
  ChevronRight, 
  Clock, 
  Trash2, 
  ShieldAlert, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Calendar, 
  HeartHandshake,
  Activity,
  Pencil
} from "lucide-react";


function PatientAvatar({ url, name, className = "w-9 h-9 rounded-full" }: { url?: string, name: string, className?: string }) {
  const [src, setSrc] = useState(url || "");

  useEffect(() => {
    setSrc(url || "");
  }, [url]);

  const handleError = () => {
    if (url) {
      
      try {
        const cached = localStorage.getItem(`fallback_photo_${url}`);
        if (cached && src !== cached) {
          setSrc(cached);
          return;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    
    setSrc("");
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} object-cover`}
        referrerPolicy="no-referrer"
        onError={handleError}
      />
    );
  }

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "P";
  const initialsSizeClass = className.includes("w-16") ? "text-2xl font-extrabold" : "text-xs font-bold";
  return (
    <div className={`${className} bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 select-none overflow-hidden shrink-0`}>
      <span className={initialsSizeClass}>{initial}</span>
    </div>
  );
}

export function Patients() {
  const { 
    patients, 
    visits, 
    prescriptions, 
    appointments, 
    setSelectedPatientId, 
    setSelectedVisitId, 
    setActiveTab, 
    refreshData, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [address, setAddress] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [selectedChronic, setSelectedChronic] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  
  const [chronicOptions, setChronicOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem("altaf_chronic_options");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      "Diabetes",
      "Hypertension",
      "Asthma",
      "Ischemic Heart Disease (IHD)",
      "Chronic Kidney Disease (CKD)",
      "COPD",
      "Arthritis"
    ];
  });
  const [newChronicInput, setNewChronicInput] = useState("");

  const handleAddChronicOption = () => {
    const val = newChronicInput.trim();
    if (!val) return;
    if (chronicOptions.includes(val)) {
      showToast("This condition option already exists!", "error");
      return;
    }
    const updated = [...chronicOptions, val];
    setChronicOptions(updated);
    localStorage.setItem("altaf_chronic_options", JSON.stringify(updated));
    setSelectedChronic([...selectedChronic, val]); 
    setNewChronicInput("");
    showToast(`Added "${val}" to conditions options`, "success");
  };

  const handleDeleteChronicOption = (cond: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chronicOptions.filter(o => o !== cond);
    setChronicOptions(updated);
    localStorage.setItem("altaf_chronic_options", JSON.stringify(updated));
    setSelectedChronic(selectedChronic.filter(c => c !== cond));
    showToast(`Removed "${cond}" condition option`, "info");
  };

  
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      p.phone.includes(q) ||
      p.full_name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q)
    );
  });

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      showToast("Patient Full Name is required", "error");
      return;
    }

    const allergies = allergiesInput
      ? allergiesInput.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      const saved = await db.savePatient({
        id: editingPatientId || undefined,
        full_name: fullName,
        phone,
        dob,
        gender,
        address,
        allergies,
        chronic_conditions: selectedChronic,
        photo_url: photoUrl
      });

      if (editingPatientId) {
        showToast(`Patient profile updated! Code: ${saved.patient_code}`, "success");
      } else {
        showToast(`Patient registered! Created code: ${saved.patient_code}`, "success");
      }
      
      
      setFullName("");
      setPhone("");
      setDob("");
      setGender("male");
      setAddress("");
      setAllergiesInput("");
      setSelectedChronic([]);
      setPhotoUrl("");
      setEditingPatientId(null);
      setShowRegForm(false);
      
      await refreshData();
      if (selectedPatient && selectedPatient.id === saved.id) {
        setSelectedPatient(saved);
      }
    } catch {
      showToast("Failed to save patient in secure vault", "error");
    }
  };

  const startEditPatient = (p: Patient) => {
    setFullName(p.full_name);
    setPhone(p.phone);
    setDob(p.dob);
    setGender(p.gender);
    setAddress(p.address || "");
    setAllergiesInput(p.allergies?.join(", ") || "");
    setSelectedChronic(p.chronic_conditions || []);
    setPhotoUrl(p.photo_url || "");
    setEditingPatientId(p.id);
    setShowRegForm(true);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePatient = async (patientId: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete patient "${name}"? This will delete medical entries in local and cloud records.`);
    if (!confirmDelete) return;

    try {
      await db.deletePatient(patientId);
      showToast(`Patient "${name}" has been deleted.`, "success");
      await refreshData();
      if (selectedPatient && selectedPatient.id === patientId) {
        setSelectedPatient(null);
      }
    } catch {
      showToast("Failed to delete patient.", "error");
    }
  };

  const handleAddToQueue = async (patientId: string, visitType: 'walk-in' | 'appointment' | 'follow-up' = 'walk-in') => {
    try {
      
      await db.saveAppointment({
        patient_id: patientId,
        status: "waiting",
        visit_type: visitType
      });
      showToast("Patient added to today's consultative appointments queue!", "success");
      await refreshData();
      setActiveTab("dashboard");
    } catch {
      showToast("Queue operation errored.", "error");
    }
  };

  const toggleChronic = (cond: string) => {
    if (selectedChronic.includes(cond)) {
      setSelectedChronic(selectedChronic.filter((c) => c !== cond));
    } else {
      setSelectedChronic([...selectedChronic, cond]);
    }
  };

  const getPatientAge = (dobString: string) => {
    if (!dobString) return "N/A";
    const birth = new Date(dobString);
    const diff = Date.now() - birth.getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return `${age} yrs`;
  };

  const getLastVisitedDate = (patientId: string) => {
    const pVisits = visits.filter((v) => v.patient_id === patientId);
    if (pVisits.length === 0) return "Never";
    const sorted = [...pVisits].sort(
      (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
    );
    return new Date(sorted[0].visited_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  
  const getPatientVisits = (patientId: string) => {
    return visits.filter((v) => v.patient_id === patientId);
  };

  const getPatientPrescriptions = (patientId: string) => {
    return prescriptions.filter((r) => r.patient_id === patientId);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="patients-tab">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">Patients & Visit Ledger</h2>
          <p className="text-xs text-slate-400">Search by phone, name, or code and view clinical logs.</p>
        </div>

        <button
          onClick={() => {
            setEditingPatientId(null);
            setFullName("");
            setPhone("");
            setDob("");
            setGender("male");
            setAddress("");
            setAllergiesInput("");
            setSelectedChronic([]);
            setShowRegForm(!showRegForm);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto"
          id="patient-reg-button"
        >
          <UserPlus className="h-4 w-4" /> Register New Patient
        </button>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className={`${selectedPatient ? "lg:col-span-7" : "lg:col-span-12"} space-y-4 transition-all duration-300`}>
          
          
          {showRegForm && (
            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm space-y-4 animate-fade-in" id="reg-form-container">
              <h3 className="text-sm font-semibold text-sky-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <UserPlus className="h-4 w-4 text-indigo-600" /> {editingPatientId ? "Edit Patient Profile" : "Patient Registry Form"}
              </h3>
              
              <form onSubmit={handleRegisterPatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-2 md:col-span-2 bg-slate-50/70 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center bg-slate-100 border border-slate-200">
                    {photoUrl ? (
                      <PatientAvatar url={photoUrl} name={fullName || "P"} className="w-full h-full" />
                    ) : (
                      <UserPlus className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Patient Profile Photo (Optional)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        id="file-photo-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploadingPhoto(true);
                            const uploadedUrl = await db.uploadPatientPhoto(file, file.name);
                            setPhotoUrl(uploadedUrl);
                            showToast("Patient photo uploaded successfully!", "success");
                          } catch (err) {
                            showToast("Image processing failed.", "error");
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }}
                      />
                      <label
                        htmlFor="file-photo-upload"
                        className="cursor-pointer bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-block hover:shadow-2xs active:scale-95"
                      >
                        {uploadingPhoto ? "Processing Upload..." : "Select Profile Photo"}
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl("")}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold hover:underline"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Will be uploaded to the Supabase storage <b>'patient-photos'</b> bucket (with automatic Base64 local fallback).</p>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Full Name (supports Bengali script)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. মোঃ রফিকুল ইসলাম (Rafiqul Islam)"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Phone Code (Key index lookup)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 017xxxxxxxx"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden text-slate-600"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Gender</label>
                  <div className="flex gap-4 p-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="radio" checked={gender === "male"} onChange={() => setGender("male")} /> Male
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="radio" checked={gender === "female"} onChange={() => setGender("female")} /> Female
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="radio" checked={gender === "other"} onChange={() => setGender("other")} /> Other
                    </label>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Postal Address</label>
                  <input
                    type="text"
                    placeholder="House, Area, Ward, City..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 text-red-600 flex items-center gap-1 font-medium">
                    <ShieldAlert className="h-3.5 w-3.5" /> High-Risk Allergies (separated by comma)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Aspirin, Dust"
                    className="w-full text-sm border border-red-200 bg-red-50/20 rounded-lg p-2.5 focus:border-red-500 focus:outline-hidden text-red-700 font-semibold"
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Ongoing Chronic Conditions</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {chronicOptions.map((co) => (
                      <div
                        key={co}
                        onClick={() => toggleChronic(co)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-2 cursor-pointer select-none ${
                          selectedChronic.includes(co)
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50"
                        }`}
                      >
                        <span>{co}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteChronicOption(co, e)}
                          className="text-[10px] bg-slate-200/95 hover:bg-red-500 hover:text-white text-slate-700 font-extrabold rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                          title={`Delete condition "${co}" from system list`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  
                  <div className="flex gap-2 max-w-sm mt-3.5">
                    <input 
                      type="text" 
                      placeholder="Type custom condition (e.g. Thyroid)..." 
                      className="text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-600 focus:outline-hidden flex-1"
                      value={newChronicInput}
                      onChange={(e) => setNewChronicInput(e.target.value)}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          handleAddChronicOption(); 
                        } 
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddChronicOption}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                    >
                      <Plus className="h-3 w-3" /> Add Option
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegForm(false);
                      setEditingPatientId(null);
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    {editingPatientId ? "Save Profile Changes" : "Confirm Registration"}
                  </button>
                </div>
              </form>
            </div>
          )}

          
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Phone-First Lookup (Type phone number, patient code ALT-xxxx or full name...)"
                className="w-full text-sm focus:outline-hidden border-none text-slate-700 font-medium placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="patient-search-field"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  Clear
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Reg Code</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Age/Gender</th>
                    <th className="p-4">Risk Flags</th>
                    <th className="p-4">Last Visited</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                        No matches found for phone/identity.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${selectedPatient?.id === p.id ? "bg-indigo-50/30" : ""}`}
                        onClick={() => setSelectedPatient(p)}
                      >
                        <td className="p-4 font-mono text-xs text-slate-600 font-semibold">{p.patient_code}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <PatientAvatar url={p.photo_url} name={p.full_name} className="w-9 h-9 rounded-full shrink-0 shadow-2xs" />
                            <div className="font-semibold text-slate-800 text-sm font-bengali">{p.full_name}</div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-500 font-mono">{p.phone}</td>
                        <td className="p-4 text-xs text-slate-600 capitalize">
                          {getPatientAge(p.dob)} / {p.gender}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {p.allergies.length > 0 && (
                              <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                Allergy
                              </span>
                            )}
                            {p.chronic_conditions.map((c) => (
                              <span key={c} className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] px-1.5 py-0.2 rounded-sm font-medium">
                                {c}
                              </span>
                            ))}
                            {p.allergies.length === 0 && p.chronic_conditions.length === 0 && (
                              <span className="text-slate-400 text-[11px] font-medium">—</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-600 font-semibold">
                          {getLastVisitedDate(p.id)}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditPatient(p)}
                              title="Edit Patient Profile"
                              className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-md transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePatient(p.id, p.full_name)}
                              title="Delete Patient Record"
                              className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-md transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setSelectedPatient(p); }}
                              className="text-slate-400 hover:text-slate-700 p-1"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        
        {selectedPatient && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-6 animate-fade-in self-start sticky top-4">
            
            
            <div className="flex items-start gap-4 border-b border-slate-100 pb-4 relative">
              <PatientAvatar url={selectedPatient.photo_url} name={selectedPatient.full_name} className="w-16 h-16 rounded-2xl shrink-0 shadow-xs" />
              <div className="space-y-1 flex-1 min-w-0 pr-16">
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                  {selectedPatient.patient_code}
                </span>
                <h3 className="text-md font-bold text-slate-800 font-bengali mt-1 truncate">{selectedPatient.full_name}</h3>
                <p className="text-xs text-slate-400">Created: {new Date(selectedPatient.created_at).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-xs border border-slate-200 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors absolute right-0 top-0 shrink-0"
                id="patient-deck-close-btn"
              >
                Close Deck
              </button>
            </div>

            
            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
              <div className="bg-slate-50/50 p-2.5 rounded-lg flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-indigo-500" />
                <span>{selectedPatient.phone || "No Number"}</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>{selectedPatient.dob} ({getPatientAge(selectedPatient.dob)})</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-lg flex items-center gap-2 col-span-2">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                <span className="truncate">{selectedPatient.address || "No recorded address"}</span>
              </div>
            </div>

            
            {selectedPatient.allergies.length > 0 ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-lg space-y-1.5" id="patient-allergy-alert-box">
                <h4 className="text-xs font-bold text-red-700 flex items-center gap-1 uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4 text-red-600" /> Vital Allergy Warning Check
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedPatient.allergies.map((a: string) => (
                    <span key={a} className="bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-emerald-600" /> Good standing: No core allergies logged.
              </div>
            )}

            
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comorbidities & Chronic Flags</h4>
              {selectedPatient.chronic_conditions && selectedPatient.chronic_conditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.chronic_conditions.map((c: string) => (
                    <span 
                      key={c} 
                      className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md border border-slate-200 font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>{c}</span>
                      <button
                        onClick={async () => {
                          const updatedConditions = selectedPatient.chronic_conditions.filter((item: string) => item !== c);
                          try {
                            const saved = await db.savePatient({
                              ...selectedPatient,
                              chronic_conditions: updatedConditions
                            });
                            setSelectedPatient(saved);
                            await refreshData();
                            showToast(`Condition "${c}" removed from patient record!`, "success");
                          } catch {
                            showToast("Failed to remove condition from patient.", "error");
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 font-bold hover:bg-slate-200 w-4 h-4 rounded-full inline-flex items-center justify-center transition-colors text-[10px]"
                        title={`Remove "${c}" from this patient`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">No chronic ailments catalogued.</p>
              )}
            </div>

            
            <div className="space-y-3.5">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Clinical Timeline ({getPatientVisits(selectedPatient.id).length})
              </h4>

              {getPatientVisits(selectedPatient.id).length === 0 ? (
                <p className="text-xs text-slate-400">This patient hasn't recorded any consultations yet.</p>
              ) : (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {getPatientVisits(selectedPatient.id).map((v) => {
                    const matchedRx = getPatientPrescriptions(selectedPatient.id).find((r) => r.visit_id === v.id);
                    return (
                      <div key={v.id} className="border-l-2 border-indigo-100 pl-4 space-y-1 relative">
                        <div className="absolute h-2.5 w-2.5 rounded-full bg-indigo-500 -left-[6px] top-1"></div>
                        <p className="text-[11px] font-bold text-slate-400">{new Date(v.visited_at).toLocaleDateString()} • {new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <h5 className="text-xs font-bold text-slate-700">{v.chief_complaint}</h5>
                        {v.vitals && (
                          <p className="text-[10px] text-slate-500 font-medium">Vitals: BP: {v.vitals.bp || "—"} | Temp: {v.vitals.temp || "—"}°F | Pulse: {v.vitals.pulse || "—"}</p>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic">{v.clinical_notes || "No clinical diary added."}</p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {v.diagnosis?.map((d) => (
                            <span key={d} className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 rounded font-medium">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={() => startEditPatient(selectedPatient)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs text-center transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Patient Profile
              </button>
              <button
                onClick={() => handleDeletePatient(selectedPatient.id, selectedPatient.full_name)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-4 rounded-xl text-xs text-center transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
