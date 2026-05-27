import React, { useState, useEffect } from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { 
  Users, 
  Activity, 
  Sparkles, 
  Info, 
  ArrowRight, 
  ShieldAlert, 
  Save 
} from "lucide-react";

export function Consultation() {
  const { 
    patients, 
    visits, 
    appointments, 
    selectedPatientId, 
    setSelectedPatientId, 
    setSelectedVisitId, 
    setActiveTab, 
    refreshData, 
    showToast 
  } = useApp();

  const currentPatient = patients.find((p) => p.id === selectedPatientId);

  
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [weight, setWeight] = useState("");
  const [pulse, setPulse] = useState("");
  const [spo2, setSpo2] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosisQuery, setDiagnosisQuery] = useState("");
  const [diagnosisList, setDiagnosisList] = useState<string[]>([]);
  const [visitType, setVisitType] = useState<"walk-in" | "appointment" | "follow-up">("walk-in");

  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  
  const activeAppointment = appointments.find(
    (a) => a.patient_id === selectedPatientId && a.status !== "completed"
  );

  
  useEffect(() => {
    if (selectedPatientId) {
      
      const patientVisits = visits.filter(v => v.patient_id === selectedPatientId);
      if (patientVisits.length > 0) {
        const latest = patientVisits[0];
        setWeight(latest.vitals?.weight || "");
        setBp(latest.vitals?.bp || "");
        setPulse(latest.vitals?.pulse || "");
        setSpo2(latest.vitals?.spo2 || "");
        setVisitType("follow-up");
      } else {
        setWeight("");
        setBp("");
        setPulse("");
        setSpo2("");
        setVisitType("walk-in");
      }
      setChiefComplaint("");
      setClinicalNotes("");
      setDiagnosisList([]);
      setAiSuggestions([]);
    }
  }, [selectedPatientId]);

  const handleFetchAiDiagnosis = async () => {
    if (!chiefComplaint) {
      showToast("Please enter a chief complaint first to analyze", "warning");
      return;
    }
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "diagnose",
          complaint: chiefComplaint
        })
      });

      const data = await res.json();
      if (data.diagnosis) {
        setAiSuggestions(data.diagnosis);
        showToast("Gemini diagnosis candidates suggested successfully!", "success");
      } else {
        showToast("AI diagnosis suggestion failed.", "error");
      }
    } catch {
      showToast("API communication failure. LOCAL expert heuristics loaded.", "warning");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddDiagnosisItem = (diag: string) => {
    if (diag && !diagnosisList.includes(diag)) {
      setDiagnosisList([...diagnosisList, diag]);
    }
    setDiagnosisQuery("");
  };

  const handleRemoveDiagnosisItem = (idx: number) => {
    setDiagnosisList(diagnosisList.filter((_, i) => i !== idx));
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast("No active patient loaded.", "error");
      return;
    }

    try {
      
      const savedVisit = await db.saveVisit({
        patient_id: selectedPatientId,
        chief_complaint: chiefComplaint,
        vitals: { bp, temp, weight, pulse, spo2 },
        diagnosis: diagnosisList,
        clinical_notes: clinicalNotes,
        visit_type: visitType,
        status: "completed"
      });

      setSelectedVisitId(savedVisit.id);

      
      if (activeAppointment) {
        await db.saveAppointment({
          id: activeAppointment.id,
          patient_id: selectedPatientId,
          status: "completed",
          visit_type: visitType
        });
      }

      showToast("Consultation encounter saved! Proceeding to Prescription Maker.", "success");
      await refreshData();
      
      
      setActiveTab("rx");
    } catch (e) {
      console.error(e);
      showToast("Failed to save patient consultation record.", "error");
    }
  };

  
  const activeQueuedAppointments = appointments.filter((a) => a.status !== "completed");

  const getPatientInfo = (id: string) => {
    return patients.find((p) => p.id === id);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="consultation-tab">
      
      
      {!selectedPatientId ? (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 text-center" id="no-consult-patient-box">
          <Activity className="h-10 w-10 text-indigo-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">No Patient Session Loaded</h3>
            <p className="text-sm text-slate-500">Pick a waiting patient from today's queue below to start their OPD check-in.</p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg text-left">
            {activeQueuedAppointments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No active patients waiting in the queue. Go to Patients directory to add one.
              </div>
            ) : (
              activeQueuedAppointments.map((app) => {
                const patient = getPatientInfo(app.patient_id);
                if (!patient) return null;
                return (
                  <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 font-bengali">{patient.full_name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{patient.patient_code} • Token #{app.token_number} • {app.visit_type}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                    >
                      Call Patient <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // Active consultation form
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          
          <form onSubmit={handleSaveConsultation} className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-md font-bold text-slate-800">OPD Consultation Entry</h3>
                <p className="text-xs text-slate-400">Review vitals and complaints to build active diagnostic profiles.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100 font-mono">
                  Token #{activeAppointment?.token_number || "-"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs border border-slate-200 px-2 py-1 rounded"
                >
                  Unload
                </button>
              </div>
            </div>

            
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                Clinical Vitals HUD
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400">BP (mmHg)</label>
                  <input
                    type="text"
                    placeholder="e.g. 120/80"
                    className="w-full text-xs font-mono bg-transparent border-none p-0 focus:outline-hidden text-slate-800 font-bold placeholder-slate-300"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400">Temp (°F)</label>
                  <input
                    type="text"
                    placeholder="e.g. 98.6"
                    className="w-full text-xs font-mono bg-transparent border-none p-0 focus:outline-hidden text-slate-800 font-bold placeholder-slate-300"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400">Weight (kg)</label>
                  <input
                    type="text"
                    placeholder="e.g. 72"
                    className="w-full text-xs font-mono bg-transparent border-none p-0 focus:outline-hidden text-slate-800 font-bold placeholder-slate-300"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400">Pulse (BPM)</label>
                  <input
                    type="text"
                    placeholder="e.g. 74"
                    className="w-full text-xs font-mono bg-transparent border-none p-0 focus:outline-hidden text-slate-800 font-bold placeholder-slate-300"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-0.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400">SpO2 (%)</label>
                  <input
                    type="text"
                    placeholder="e.g. 98"
                    className="w-full text-xs font-mono bg-transparent border-none p-0 focus:outline-hidden text-slate-800 font-bold placeholder-slate-300"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                  />
                </div>
              </div>
            </div>

            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Chief complaints / Present Symptoms</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cough, runny nose, fever, head pain since 3 days"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleFetchAiDiagnosis}
                    disabled={aiLoading}
                    className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiLoading ? "Consulting..." : "AI Diagnosis Code Suggestions"}
                  </button>
                </div>
              </div>

              
              {aiSuggestions.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg space-y-2 animate-fade-in">
                  <div className="text-[11px] font-bold text-indigo-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> GEMINI AI DIAGNOSIS INTEGRATION SUGGESTIONS:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((as) => (
                      <button
                        key={as}
                        type="button"
                        onClick={() => handleAddDiagnosisItem(as)}
                        className="text-xs bg-white hover:bg-slate-50 border border-indigo-200 text-slate-700 py-1 px-2 rounded-md font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        + Add "{as}"
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">All predictions require validation and active Doctor approval before printing on Rx papers.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Manual ICD-10 / Custom Diagnosis Code</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. I10 (Essential Hypertension)"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-600 focus:outline-hidden"
                      value={diagnosisQuery}
                      onChange={(e) => setDiagnosisQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDiagnosisItem(diagnosisQuery)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>

                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {diagnosisList.map((dl, idx) => (
                      <span
                        key={dl}
                        className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs py-1 px-2.5 rounded-lg font-semibold inline-flex items-center gap-1.5"
                      >
                        {dl}
                        <button
                          type="button"
                          onClick={() => handleRemoveDiagnosisItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Visit Category</label>
                  <select
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden bg-white text-slate-700"
                    value={visitType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVisitType(e.target.value as "walk-in" | "appointment" | "follow-up")}
                  >
                    <option value="walk-in">Walk-in General consultation</option>
                    <option value="appointment">Booked Appointment Slot</option>
                    <option value="follow-up">Follow-up checkback</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Clinical notes & Examination Findings</label>
                <textarea
                  rows={4}
                  placeholder="Note symptoms, signs, heart sounds, chest congestion, patient advices, salt/diabetes alerts..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-3.5 focus:border-indigo-600 focus:outline-hidden text-slate-700 placeholder-slate-400"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                id="save-consultation-btn"
              >
                <Save className="h-4 w-4" /> Save Consultation & Build Rx <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4 self-start">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Patient Context</h3>
            
            {currentPatient && (
              <div className="space-y-4 font-sans text-sm text-slate-700">
                <div className="space-y-1">
                  <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                    {currentPatient.patient_code}
                  </span>
                  <h4 className="text-md font-bold text-slate-800 font-bengali mt-1">{currentPatient.full_name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{currentPatient.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3 text-slate-600">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">GENDER</span>
                    <span className="font-semibold capitalize">{currentPatient.gender}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">BIRTHDAY</span>
                    <span className="font-semibold">{currentPatient.dob}</span>
                  </div>
                </div>

                
                {currentPatient.allergies.length > 0 ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-lg space-y-1.5" id="consult-allergy-warning">
                    <h4 className="text-[10px] font-bold text-red-700 flex items-center gap-1 uppercase tracking-wider">
                      <ShieldAlert className="h-3.5 w-3.5" /> High-Risk Allergies Active
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {currentPatient.allergies.map((a: string) => (
                        <span key={a} className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 p-2 text-xs font-bold rounded flex items-center gap-1.5 border border-emerald-100">
                    <Info className="h-4 w-4 text-emerald-600" /> Checked: No known allergy hazards.
                  </div>
                )}

                
                {currentPatient.chronic_conditions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Comorbidities</span>
                    <div className="flex flex-wrap gap-1">
                      {currentPatient.chronic_conditions.map((c: string) => (
                        <span key={c} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
