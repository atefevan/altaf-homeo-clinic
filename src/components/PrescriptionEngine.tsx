import React, { useState, useEffect } from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { PrescriptionMedicine } from "../types";

interface MedSuggestion {
  generic_name: string;
  brand_names: string[];
  category: string;
  unit: string;
}
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Printer, 
  AlertTriangle, 
  Search, 
  Activity, 
  Layers, 
  PlusCircle, 
  Clipboard, 
  CheckCircle2, 
  AlertOctagon,
  FileCode
} from "lucide-react";

const translateFrequency = (freq?: string): string => {
  if (!freq) return "";
  const f = freq.trim().toLowerCase();
  const map: Record<string, string> = {
    "after food": "খাবার পরে",
    "before food": "খাবার আগে",
    "before breakfast": "সকালে খাবার আগে",
    "with food": "খাবার সঙ্গে"
  };
  return map[f] || freq;
};

const translateDuration = (dur?: string): string => {
  if (!dur) return "";
  const d = dur.trim().toLowerCase();
  const map: Record<string, string> = {
    "7 days": "৭ দিন",
    "3 days": "৩ দিন",
    "14 days": "১৪ দিন",
    "5 days": "৫ দিন",
    "1 month": "১ মাস",
    "continue": "চলবে"
  };
  return map[d] || dur;
};

const parseDurationDays = (durationStr?: string): number => {
  if (!durationStr) return 7;
  const banglaToEnglishMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  let cleaned = durationStr.toString().split('').map(char => banglaToEnglishMap[char] || char).join('');
  const num = parseInt(cleaned);
  if (!isNaN(num)) return num;
  if (durationStr.includes("মাস") || durationStr.toLowerCase().includes("month")) return 30;
  return 7;
};

export function PrescriptionEngine() {
  const { 
    patients, 
    visits, 
    prescriptions, 
    selectedPatientId, 
    selectedVisitId, 
    settings, 
    refreshData, 
    setActiveTab, 
    showToast 
  } = useApp();

  const currentPatient = patients.find(p => p.id === selectedPatientId);
  const currentVisit = visits.find(v => v.id === selectedVisitId);

  
  const getPatientAge = (dobString?: string) => {
    if (!dobString) return "—";
    const birthYear = new Date(dobString).getFullYear();
    if (isNaN(birthYear)) return dobString;
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear} Yrs`;
  };

  
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  
  const [selectedMedName, setSelectedMedName] = useState("");
  const [dose, setDose] = useState("1+0+1");
  const [frequency, setFrequency] = useState("খাবার পরে");
  const [duration, setDuration] = useState("৭ দিন");
  const [instructions, setInstructions] = useState("");

  
  const [medsList, setMedsList] = useState<PrescriptionMedicine[]>([]);
  const [advice, setAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<string[]>([]);

  
  useEffect(() => {
    if (selectedVisitId) {
      const existingRx = prescriptions.find(r => r.visit_id === selectedVisitId);
      if (existingRx) {
        setMedsList(existingRx.medicines || []);
        setAdvice(existingRx.advice || "");
        setFollowUpDate(existingRx.follow_up_date || "");
      } else {
        setMedsList([]);
        setAdvice("");
        setFollowUpDate("");
      }
      setSafetyAlerts([]);
    }
  }, [selectedVisitId, prescriptions]);

  
  const handleQueryChange = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autocomplete", query: val })
      });
      const data = await res.json();
      if (data.results) {
        setSuggestions(data.results);
      }
    } catch {
      
      const samples = [
        { generic_name: "Paracetamol", brand_names: ["Napa", "Ace"], category: "analgesic", unit: "tablet" },
        { generic_name: "Amoxicillin", brand_names: ["Fimoxyl"], category: "antibiotic", unit: "capsule" },
        { generic_name: "Esomeprazole", brand_names: ["Sergel", "Maxpro"], category: "antacid", unit: "capsule" }
      ];
      setSuggestions(samples.filter(s => s.generic_name.toLowerCase().includes(val.toLowerCase())));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectMedFromSuggestions = (item: { generic_name: string; brand_names?: string[] }) => {
    
    const name = item.brand_names?.length ? `${item.brand_names[0]} (${item.generic_name})` : item.generic_name;
    setSelectedMedName(name);
    setQuery("");
    setSuggestions([]);
  };

  const handleAddMedToList = () => {
    const medName = selectedMedName || query;
    if (!medName) {
      showToast("Please select or type a medication name.", "warning");
      return;
    }

    const newItem = {
      name: medName,
      dose,
      frequency,
      duration,
      instructions
    };

    setMedsList([...medsList, newItem]);
    
    
    setSelectedMedName("");
    setQuery("");
    setInstructions("");
    showToast("Medication added to Rx card", "success");
  };

  const handleRemoveMedFromList = (idx: number) => {
    setMedsList(medsList.filter((_, i) => i !== idx));
  };

  const handleTriggerSafetyAudit = async () => {
    if (medsList.length === 0) {
      showToast("Add medicines to audit safety profiles.", "warning");
      return;
    }
    setSafetyLoading(true);
    setSafetyAlerts([]);

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interactions",
          medicines: medsList,
          allergies: currentPatient?.allergies || []
        })
      });
      const data = await res.json();
      if (data.alerts) {
        setSafetyAlerts(data.alerts);
        showToast("AI safety checks compiled successfully!", "success");
      }
    } catch (e) {
      showToast("Safety check api error.", "error");
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!selectedVisitId || !selectedPatientId) {
      showToast("No active patient consultation loaded, save consultation first.", "error");
      return;
    }

    try {
      await db.savePrescription({
        visit_id: selectedVisitId,
        patient_id: selectedPatientId,
        medicines: medsList,
        advice,
        follow_up_date: followUpDate
      });

      
      const currentInventory = await db.getInventory();
      const masterMeds = await db.getMedicines();
      
      for (const m of medsList) {
        
        const matchedMed = masterMeds.find(master => 
          m.name.toLowerCase().includes(master.generic_name.toLowerCase()) ||
          master.brand_names.some(b => m.name.toLowerCase().includes(b.toLowerCase()))
        );

        if (matchedMed) {
          const invItem = currentInventory.find(item => item.medicine_id === matchedMed.id);
          if (invItem && invItem.quantity > 0) {
            
            const dailyCount = m.dose.split("+").reduce((acc: number, curr: string) => acc + (parseInt(curr) || 0), 0);
            const durationDays = parseDurationDays(m.duration);
            const totalDeduct = (dailyCount || 2) * durationDays;
            
            await db.saveInventoryItem({
              id: invItem.id,
              medicine_id: invItem.medicine_id,
              batch_number: invItem.batch_number,
              expiry_date: invItem.expiry_date,
              quantity: Math.max(0, invItem.quantity - totalDeduct),
              low_stock_threshold: invItem.low_stock_threshold,
              purchase_price: invItem.purchase_price,
              sell_price: invItem.sell_price,
              supplier: invItem.supplier
            });
          }
        }
      }

      showToast("Dr. Altaf, prescription saved and stock levels synchronized!", "success");
      await refreshData();
    } catch {
      showToast("Failed to save prescription.", "error");
    }
  };

  const handleTriggerPrint = () => {
    
    handleSavePrescription().then(() => {
      
      window.print();
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="prescription-tab">
      
      
      {!selectedVisitId ? (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-4">
          <AlertOctagon className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Patient Consultation Visit Active</h3>
          <p className="text-sm text-slate-500">You must register a patient consultation record of vitals and complaints under 'OPD Consultation' prior to building active prescriptions.</p>
          <button 
            onClick={() => setActiveTab("consultation")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-5 rounded-lg transition-colors inline-block"
          >
            Open Consultation Desk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
          
          
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
            
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-md font-bold text-slate-800">Prescription Architect</h3>
                <p className="text-xs text-slate-400">Add medicines, assemble frequencies, and perform clinical checks.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-100 font-bold">
                  Rx Active: {currentPatient?.full_name}
                </span>
              </div>
            </div>

            
            <div className="space-y-2 relative">
              <label className="text-xs font-semibold text-slate-500">Query Medicine (Lookup Brand or Generic autocomplete)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Generic (e.g. Paracetamol) or Brand (e.g. Napa, Maxpro)..."
                    className="w-full text-sm border border-slate-200 rounded-lg pl-9 p-2.5 focus:border-indigo-600 focus:outline-hidden"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                  />
                </div>
                {selectedMedName && (
                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                    <span className="font-bold">{selectedMedName}</span>
                    <button onClick={() => setSelectedMedName("")} className="text-red-500 font-bold hover:text-red-700 text-sm">×</button>
                  </div>
                )}
              </div>

              
              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectMedFromSuggestions(m)}
                      className="p-3 hover:bg-indigo-50/50 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{m.brand_names?.join(", ") || m.generic_name}</span>
                        <span className="text-slate-400 font-medium ml-2">({m.generic_name})</span>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded capitalize text-[10px]">{m.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dose Struct</label>
                <select
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden text-slate-700 font-bold"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                >
                  <option value="1+0+1">1+0+1 (Twice daily)</option>
                  <option value="1+1+1">1+1+1 (Thrice daily)</option>
                  <option value="1+0+0">1+0+0 (Morning only)</option>
                  <option value="0+0+1">0+0+1 (Bedtime only)</option>
                  <option value="0+1+0">0+1+0 (Noon only)</option>
                  <option value="1+1+1+1">1+1+1+1 (Four times daily)</option>
                  <option value="As needed">As needed (PRN)</option>
                  <option value="2 tsp Thrice">2 tsp Thrice (Syrup)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Relativity</label>
                <select
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden text-slate-700 font-bold"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="খাবার পরে">খাবার পরে</option>
                  <option value="খাবার আগে">খাবার আগে</option>
                  <option value="সকালে খাবার আগে">সকালে খাবার আগে</option>
                  <option value="খাবার সঙ্গে">খাবার সঙ্গে</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                <select
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden text-slate-700 font-bold"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="৭ দিন">৭ দিন</option>
                  <option value="১৪ দিন">১৪ দিন</option>
                  <option value="৩ দিন">৩ দিন</option>
                  <option value="৫ দিন">৫ দিন</option>
                  <option value="১ মাস">১ মাস</option>
                  <option value="চলবে">চলবে</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Special Manual Directives</label>
                <input
                  type="text"
                  placeholder="e.g. গরম পানি দিয়ে, with milk"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-hidden text-slate-700"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              <div className="col-span-2 md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddMedToList}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" /> Add to Prescription Sheet
                </button>
              </div>
            </div>

            
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">℞ Selected Medicines Output</h4>
              
              {medsList.length === 0 ? (
                <div className="p-8 border border-slate-100 rounded-xl text-center text-slate-400 text-xs">
                  No medicines prescribed yet. Fill the builder form above to append.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {medsList.map((m, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-slate-800">{m.name}</div>
                        <div className="text-xs text-indigo-600 font-semibold flex items-center gap-2">
                          <span>{m.dose}</span>
                          <span>•</span>
                          <span>{translateFrequency(m.frequency)}</span>
                          <span>•</span>
                          <span>{translateDuration(m.duration)}</span>
                          {m.instructions && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 italic font-medium">{m.instructions}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMedFromList(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-sm hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">General Advice printed on Rx paper</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Rest, avoid cold drinks, consult again if temp goes above 102F..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                ></textarea>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Follow-up Revisit Date</label>
                  <input
                    type="date"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-600 focus:outline-hidden text-slate-600"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerSafetyAudit}
                    disabled={safetyLoading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" /> 
                    {safetyLoading ? "Auditing clinically..." : "⚡ AI Clinical Safety Audit"}
                  </button>
                  <button
                    onClick={handleSavePrescription}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-xs"
                  >
                    Save Progress
                  </button>
                </div>
              </div>
            </div>

            
            {safetyAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 animate-fade-in" id="safety-audit-panel">
                <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Prescriptive Audit Warnings Check
                </h4>
                <div className="space-y-1">
                  {safetyAlerts.map((sa, idx) => (
                    <p key={idx} className="text-xs text-amber-900 font-semibold flex items-start gap-1.5">
                      <span className="shrink-0 text-amber-600">•</span> {sa}
                    </p>
                  ))}
                </div>
                <p className="text-[10px] text-amber-600 font-medium italic mt-2">All decisions require final manual verification and Doctor Altaf's professional override before paper prints are handed over.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-400 font-medium">Auto-inventory deduction handles matching generic products upon print-save.</p>
              <button
                onClick={handleTriggerPrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all self-end"
                id="rx-trigger-print-btn"
              >
                <Printer className="h-4 w-4" /> Print A5 Paper Rx Sheet
              </button>
            </div>

          </div>

          
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col justify-between shadow-inner">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clipboard className="h-4 w-4" /> Live A5 Print Preview
              </h4>
              
              
              <div className="bg-white border border-slate-200 p-4 shadow-sm text-[10px] font-sans text-slate-700 space-y-4 rounded-md">
                
                
                <div className="border-b-2 border-slate-800 pb-2 text-center text-slate-800">
                  <h3 className="font-extrabold text-xs">{settings.doctor_name}</h3>
                  <p className="text-[8px] font-bold">{settings.qualifications}</p>
                  <p className="text-[7px] text-indigo-700 font-mono font-bold uppercase tracking-wider">{settings.bmdc_number}</p>
                  <p className="text-[8px] text-slate-400 mt-1">{settings.clinic_name}</p>
                </div>

                
                <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded text-[8px] text-slate-600 font-medium">
                  <div>Pat: <span className="font-bold text-slate-800 font-bengali">{currentPatient?.full_name}</span></div>
                  <div>Code: <span className="font-mono font-bold">{currentPatient?.patient_code}</span></div>
                  <div>Age/Gen: <span className="font-bold">{currentPatient ? `${currentPatient.gender} (${currentPatient.dob})` : ""}</span></div>
                  <div>Date: <span className="font-bold">{new Date().toLocaleDateString()}</span></div>
                </div>

                
                <div className="grid grid-cols-12 gap-2 min-h-[140px]">
                  <div className="col-span-4 border-r border-slate-100 pr-1 space-y-2">
                    <p className="font-bold border-b border-slate-200 pb-0.5 text-[7px] text-slate-400 uppercase">Vitals</p>
                    <p className="font-mono text-[7px] text-slate-500">BP: {currentVisit?.vitals?.bp || "—"}</p>
                    <p className="font-mono text-[7px] text-slate-500">Temp: {currentVisit?.vitals?.temp || "—"} F</p>
                    <p className="font-mono text-[7px] text-slate-500">Pulse: {currentVisit?.vitals?.pulse || "—"}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase border-b border-indigo-50 pt-2 pb-0.5">Diagnose</p>
                    {currentVisit?.diagnosis?.map(d => (
                      <p key={d} className="text-[7px] font-bold text-indigo-700">{d}</p>
                    ))}
                  </div>

                  <div className="col-span-8 pl-1 space-y-2">
                    <span className="font-serif text-lg text-slate-800 font-bold block italic">℞</span>
                    {medsList.length === 0 ? (
                      <p className="text-[8px] text-slate-400 italic">No drugs selected yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {medsList.map((m, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <p className="font-bold text-slate-800">{idx+1}. {m.name}</p>
                            <p className="text-indigo-600 font-bold font-mono text-[7px]">{m.dose} • {m.frequency} • {m.duration}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                
                <div className="border-t border-slate-100 pt-2 text-[8px] space-y-1 text-slate-500">
                  <p><strong>Advice:</strong> {advice || "None"}</p>
                  {followUpDate && <p><strong>Follow-up:</strong> {followUpDate}</p>}
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      
      
      
      <div 
        className="hidden print:flex w-[8.5in] h-[11in] bg-white text-black p-[5px_20px] flex-col overflow-hidden relative"
        style={{ fontFamily: "'Hind Siliguri', sans-serif", fontSize: "14px" }}
        id="native-print-sheet"
      >
        
        <div className="h-[100px] flex mb-[2px] border-none shrink-0" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          
          <div className="w-[50%] p-[24px_24px] flex flex-col justify-center">
            <div className="text-[#1e3a8a] font-bold text-[20px] leading-[1.2] font-bengali">ডা: মো: আলতাফ হোসেন</div>
            <div className="text-[11px] text-black leading-[1.3] font-semibold mt-[2px] font-bengali">
              ডি এইচ এম এস, আল্ট্রামাইন্ড গ্রাজুয়েট<br />
              এলএল.বি (অনার্স), এলএল.এম<br />
              <span className="text-[#059669] font-bold text-[12px] font-bengali">আলতাফ হোমিও ক্লিনিক (০১৬৭৮০৯৪৮০৮, ০১৮৩৮৩৯৭৫৭৫)</span><br />
              <span className="text-[#059669] font-semibold text-[12px] font-bengali">হোল্ডিং-৩৩, মাজার রোড, বনমালা, টঙ্গী, গাজীপুর।</span>
            </div>
          </div>

          
          <div className="w-[50%] p-[24px_24px] flex flex-col justify-center items-end text-right">
            <div className="text-[#dc2626] font-bold text-[20px] leading-[1.2]">Dr. MD. Altaf Hossain</div>
            <div className="text-[11px] text-black leading-[1.3] font-normal mt-[2px]">
              DHMS, Ultramind Graduate<br />
              LL.B(Hon's), LL.M.<br />
              <span className="text-[#059669] font-bold text-[12px]">Altafshifakhana (01678094808, 01838397575)</span><br />
              <span className="text-[#059669] font-semibold text-[12px]">Hold-33, Mazar Road, Banmala, Tongi, Gazipur.</span>
            </div>
          </div>
        </div>

        
        <div className="h-[32px] flex bg-[#dbeafe] border-t border-b border-[#60a5fa] items-center text-black shrink-0">
          <div className="w-[48%] h-full flex items-center px-[15px] border-r border-[#60a5fa] font-semibold">
            <span className="font-bold mr-[5px] text-[14px]">নাম :</span> 
            <span className="font-bengali font-bold text-[14px]">{currentPatient?.full_name || "—"}</span>
          </div>
          <div className="w-[22%] h-full flex items-center px-[15px] border-r border-[#60a5fa] font-semibold">
            <span className="font-bold mr-[5px] text-[14px]">বয়স :</span> 
            <span className="font-bold text-[14px]">{currentPatient ? getPatientAge(currentPatient.dob) : "—"}</span>
          </div>
          <div className="w-[30%] h-full flex items-center px-[15px] font-semibold">
            <span className="font-bold mr-[5px] text-[14px]">তারিখ :</span> 
            <span className="font-mono text-[14px]">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        
        <div className="flex flex-1 border-b border-[#d36090]">
          
          
          <div className="w-[calc(40%+4vw)] bg-[#f8fafc] border-r border-[#d36090] p-[25px_10px] space-y-[120px]">
            
            
            <div className="pl-[5px] space-y-2">
              <div className="font-bold text-[15px]">C/C:</div>
              <div className="text-[12px] font-semibold leading-relaxed text-slate-800 break-words whitespace-pre-wrap">
                {currentVisit?.chief_complaint || "—"}
              </div>
            </div>

            
            <div className="pl-[5px] space-y-2.5">
              <div className="font-bold text-[15px]">O/E:</div>
              {currentVisit?.vitals && (
                <div className="text-[12px] font-semibold leading-relaxed text-slate-700 font-mono space-y-1">
                  {currentVisit?.vitals?.bp && (
                    <p>BP: {currentVisit?.vitals?.bp} mmHg</p>
                  )}
                  {currentVisit?.vitals?.temp && (
                    <p>Temp: {currentVisit?.vitals?.temp} °F</p>
                  )}
                  {currentVisit?.vitals?.pulse && (
                    <p>Pulse: {currentVisit?.vitals?.pulse} bpm</p>
                  )}
                  {currentVisit?.vitals?.weight && (
                    <p>Wt: {currentVisit?.vitals?.weight} kg</p>
                  )}
                  {currentVisit?.vitals?.spo2 && (
                    <p>SpO2: {currentVisit?.vitals?.spo2} %</p>
                  )}
                </div>
              )}
              {currentVisit?.diagnosis && currentVisit.diagnosis.length > 0 && (
                <div className="text-[11.5px] font-bold text-indigo-950 mt-4 space-y-1">
                  <p className="underline text-[12px] text-black">Diagnosis:</p>
                  {currentVisit.diagnosis.map(d => (
                    <p key={d} className="pl-1">✓ {d}</p>
                  ))}
                </div>
              )}
            </div>

            
            <div className="pl-[5px] space-y-2">
              <div className="font-bold text-[15px]">Adv:</div>
              <div className="text-[12px] font-medium leading-[1.4] text-slate-755 whitespace-pre-wrap">
                {advice || "None recorded"}
              </div>
              {followUpDate && (
                <div className="text-[12px] font-extrabold text-[#1e3a8a] font-mono mt-3">
                  Follow Up: {new Date(followUpDate).toLocaleDateString()}
                </div>
              )}
            </div>

          </div>

          
          <div className="w-[calc(85%-4vw)] relative p-[25px_30px] bg-white flex flex-col justify-between">
            
            
            <div className="space-y-4 relative z-10 w-full">
              <div className="text-[32px] font-bold font-serif italic text-black leading-none mb-4">Rx</div>
              
              
              <div className="space-y-6 pt-2 font-sans">
                {medsList.map((m, idx) => (
                  <div key={idx} className="border-b border-dashed border-slate-100 pb-3 leading-relaxed flex flex-col gap-1">
                    <div className="font-bold text-[15px] text-slate-900 flex items-center justify-between">
                      <span>{idx + 1}. {m.name}</span>
                      <span className="text-[12px] font-semibold text-slate-700">({translateDuration(m.duration)})</span>
                    </div>
                    <div className="text-[12.5px] text-indigo-950 font-semibold flex items-center gap-4 pl-4 font-mono">
                      <span className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.2">{m.dose}</span>
                      <span className="border-b border-black/30 pb-0.2 font-sans">{translateFrequency(m.frequency)}</span>
                      {m.instructions && (
                        <span className="text-slate-500 italic font-normal text-[11.5px]">({m.instructions})</span>
                      )}
                    </div>
                  </div>
                ))}
                {medsList.length === 0 && (
                  <p className="text-slate-400 italic text-xs">No active medicines registered under prescription.</p>
                )}
              </div>
            </div>

            
            <div className="absolute bottom-6 right-6 flex flex-col items-center bg-white p-2.5 border border-slate-200/80 rounded-xl shadow-xs text-center z-15">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                  `Altaf Shifakhana Verification\n-----------------------\nRx ID: ${selectedVisitId || 'Direct'}\nPatient: ${currentPatient?.full_name || 'Walkin'}\nCode: ${currentPatient?.patient_code || '—'}\nDate: ${new Date().toLocaleDateString()}\nAdvice: ${advice || '—'}\nMedicines:\n${medsList.map((m, i) => `${i+1}. ${m.name} (${m.dose})`).join('\n')}`
                )}`} 
                alt="QR verification scan" 
                className="w-[90px] h-[90px] object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">VERIFIED PRESCRIPTION</span>
              <span className="text-[7px] font-mono text-slate-400 uppercase tracking-widest">{(selectedVisitId || 'vis-direct').slice(-8)}</span>
            </div>

            
            <div className="watermark-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] w-[400px] h-[400px] pointer-events-none z-0">
              <svg viewBox="0 0 100 100" fill="none" stroke="#000" strokeWidth="1.5">
                 <path d="M30 60 C30 80, 70 80, 70 60 C70 40, 50 40, 50 30 L50 20" />
                 <path d="M50 15 L50 20" />
                 <path d="M80 80 C85 80, 90 75, 90 70 C90 65, 85 60, 80 60 C75 60, 70 65, 70 70 C70 75, 75 80, 80 80 Z" fill="#fff" />
                 <path d="M10 60 L20 60" />
                 <path d="M10 60 C5 60, 5 70, 10 70 L20 70" />
                 <path d="M10 65 L15 65" />
              </svg>
            </div>

          </div>

        </div>

        
        <div className="h-[100px] flex bg-[#fdf2f8] border-t border-[#d36090] shrink-0 space-between">
          
          <div className="w-[50%] p-[18px_20px] flex flex-col justify-center border-r border-[#d36090]/15">
            <div>
              <span className="bg-[#16a34a] text-white p-[1px_10px] rounded-[6px] text-[12px] font-bold inline-block mb-[2px]">চেম্বার :</span>
              <div className="text-[13px] leading-[1.4] font-medium mt-[4px] text-black">
                <strong>আলতাফ হোমিও ক্লিনিক</strong><br />
                হোল্ডিং-৩৩, মধুর মা'র মাজার রোড, বনমালা, টঙ্গী, গাজীপুর।
              </div>
            </div>
          </div>

          
          <div className="w-[30%] flex justify-center items-center border-r border-[#d36090]/15 pr-[30px] pt-[15px]">
            <div className="bg-[#db2777] text-white p-[3px_15px] rounded-[15px] text-[12px] font-bold">
              সিরিয়ালের জন্য ০১৬৭৮০৯৪৮০৮
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
