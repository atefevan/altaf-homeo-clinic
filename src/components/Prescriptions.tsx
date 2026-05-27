import React, { useState, useEffect } from "react";

import html2pdf from "html2pdf.js";
import { useApp } from "../AppContext";
import { db } from "../db";
import { Patient, Prescription, Visit, PrescriptionMedicine, MedicineMaster, InventoryItem } from "../types";
import { 
  Search, 
  Printer, 
  Pencil, 
  Trash2, 
  Calendar, 
  X, 
  Plus, 
  Check, 
  User, 
  FileText, 
  ShieldAlert, 
  RefreshCw, 
  Inbox, 
  Activity, 
  CheckSquare, 
  Square,
  PackageCheck
} from "lucide-react";

const cleanBanglaName = (name: string) => {
  if (!name) return "";
  
  let cleaned = name.replace(/\([^)]*\)/g, "");
  
  cleaned = cleaned.replace(/[a-zA-Z]/g, "");
  
  return cleaned.replace(/\s+/g, " ").trim();
};

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

export function Prescriptions() {
  const { 
    patients, 
    visits, 
    prescriptions, 
    medicines, 
    inventory, 
    setPrescriptions,
    refreshData, 
    showToast,
    setActiveTab,
    setSelectedPatientId,
    setSelectedVisitId
  } = useApp();

  
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);

  
  const [isSelectPatientOpen, setIsSelectPatientOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  
  
  const [activePrintRx, setActivePrintRx] = useState<Prescription | null>(null);
  const [activeEditRx, setActiveEditRx] = useState<Prescription | null>(null);
  const [rxToDelete, setRxToDelete] = useState<string | null>(null);

  
  const [currentPage, setCurrentPage] = useState(1);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  
  const [editMedicines, setEditMedicines] = useState<PrescriptionMedicine[]>([]);
  const [editAdvice, setEditAdvice] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [editChronicConditions, setEditChronicConditions] = useState<string[]>([]);
  
  
  const [newDrugQuery, setNewDrugQuery] = useState("");
  const [drugSuggestions, setDrugSuggestions] = useState<MedicineMaster[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<MedicineMaster | null>(null);
  const [dose, setDose] = useState("1+0+1");
  const [frequency, setFrequency] = useState("খাবার পরে");
  const [duration, setDuration] = useState("৭ দিন");
  const [instructions, setInstructions] = useState("");

  
  useEffect(() => {
    const linkId = "bengali-font-prescription";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.href = "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  
  const CHRONIC_OPTIONS = [
    "Diabetes",
    "Hypertension",
    "Asthma",
    "Ischemic Heart Disease (IHD)",
    "Chronic Kidney Disease (CKD)",
    "COPD",
    "Arthritis"
  ];

  
  const getPatientForRx = (rx: Prescription) => {
    return patients.find(p => p.id === rx.patient_id);
  };

  const getVisitForRx = (rx: Prescription) => {
    return visits.find(v => v.id === rx.visit_id);
  };

  const getPatientAge = (dobString?: string) => {
    if (!dobString) return "—";
    const birthYear = new Date(dobString).getFullYear();
    if (isNaN(birthYear)) return dobString;
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear} Yrs`;
  };

  
  const filteredPrescriptions = prescriptions.filter(rx => {
    const pat = getPatientForRx(rx);
    const vis = getVisitForRx(rx);
    const q = searchTerm.toLowerCase();
    
    if (!q) return true;
    
    const nameMatch = pat?.full_name?.toLowerCase().includes(q);
    const codeMatch = pat?.patient_code?.toLowerCase().includes(q);
    const phoneMatch = pat?.phone?.includes(q);
    const medicineMatch = rx.medicines?.some(m => m.name.toLowerCase().includes(q));
    const diagnosisMatch = vis?.diagnosis?.some(d => d.toLowerCase().includes(q));
    const complaintMatch = vis?.chief_complaint?.toLowerCase().includes(q);

    return nameMatch || codeMatch || phoneMatch || medicineMatch || diagnosisMatch || complaintMatch;
  });

  
  useEffect(() => {
    if (newDrugQuery.length < 2) {
      setDrugSuggestions([]);
      return;
    }
    const filtered = medicines.filter(m => 
      m.generic_name.toLowerCase().includes(newDrugQuery.toLowerCase()) ||
      m.brand_names.some(b => b.toLowerCase().includes(newDrugQuery.toLowerCase()))
    );
    setDrugSuggestions(filtered);
  }, [newDrugQuery, medicines]);

  
  const handleStartEdit = (rx: Prescription) => {
    setActiveEditRx(rx);
    setEditMedicines([...(rx.medicines || [])]);
    setEditAdvice(rx.advice || "");
    setEditFollowUp(rx.follow_up_date || "");
    
    
    const pat = getPatientForRx(rx);
    if (pat) {
      setEditChronicConditions(pat.chronic_conditions || []);
    } else {
      setEditChronicConditions([]);
    }

    
    setNewDrugQuery("");
    setSelectedDrug(null);
    setInstructions("");
  };

  
  const handleRemoveMed = (idx: number) => {
    setEditMedicines(editMedicines.filter((_, i) => i !== idx));
  };

  const handleSelectSuggestedDrug = (m: MedicineMaster) => {
    setSelectedDrug(m);
    setNewDrugQuery("");
    setDrugSuggestions([]);
  };

  const handleAddMed = () => {
    const drugName = selectedDrug 
      ? `${selectedDrug.brand_names[0] || ""} (${selectedDrug.generic_name})`
      : newDrugQuery;
      
    if (!drugName.trim()) {
      showToast("Medication name cannot be empty.", "warning");
      return;
    }

    const item: PrescriptionMedicine = {
      name: drugName,
      dose,
      frequency,
      duration,
      instructions
    };

    setEditMedicines([...editMedicines, item]);
    setSelectedDrug(null);
    setNewDrugQuery("");
    setInstructions("");
    showToast("Medicine appended to record pending save.", "success");
  };

  
  const handleToggleChronicCheck = (disease: string) => {
    if (editChronicConditions.includes(disease)) {
      setEditChronicConditions(editChronicConditions.filter(d => d !== disease));
    } else {
      setEditChronicConditions([...editChronicConditions, disease]);
    }
  };

  
  const handleSaveRxEdits = async () => {
    if (!activeEditRx) return;
    
    try {
      
      const updatedRx = await db.savePrescription({
        ...activeEditRx,
        medicines: editMedicines,
        advice: editAdvice,
        follow_up_date: editFollowUp
      });

      
      
      
      const freshInventory = await db.getInventory();
      for (const m of editMedicines) {
        
        const matchedCatalog = medicines.find(cat => 
          m.name.toLowerCase().includes(cat.generic_name.toLowerCase()) ||
          cat.brand_names.some(b => m.name.toLowerCase().includes(b.toLowerCase()))
        );

        if (matchedCatalog) {
          const invItem = freshInventory.find(inv => inv.medicine_id === matchedCatalog.id);
          if (invItem && invItem.quantity > 0) {
            
            const parts = m.dose.split("+");
            const dailyCount = parts.reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
            const durationDays = parseDurationDays(m.duration);
            const totalDeduct = (dailyCount || 1) * durationDays;

            await db.saveInventoryItem({
              ...invItem,
              quantity: Math.max(0, invItem.quantity - totalDeduct)
            });
          }
        }
      }

      
      const originalPatient = getPatientForRx(activeEditRx);
      if (originalPatient) {
        
        const mergedConditions = Array.from(new Set([
          ...(originalPatient.chronic_conditions || []),
          ...editChronicConditions
        ]));

        await db.savePatient({
          ...originalPatient,
          chronic_conditions: mergedConditions
        });
      }

      
      const originalVisit = getVisitForRx(activeEditRx);
      if (originalVisit) {
        
        await db.saveVisit({
          ...originalVisit,
          clinical_notes: originalVisit.clinical_notes + (editAdvice ? `\n\n[Advice Update]: ${editAdvice}` : "")
        });
      }

      showToast("Prescription updated, stock levels updated, and patient conditions synced!", "success");
      setActiveEditRx(null);
      await refreshData();
    } catch (e) {
      console.error(e);
      showToast("Failed to compile and update prescription.", "error");
    }
  };

  const handleDeleteRx = async (id: string) => {
    const ok = window.confirm("Are you sure you want to permanently delete this prescription record?");
    if (!ok) return;

    try {
      await db.deletePrescription(id);
      showToast("Prescription erased successfully.", "success");
      await refreshData();
    } catch {
      showToast("Failed to erase record.", "error");
    }
  };

  const handlePrintCommand = (rx: Prescription) => {
    const patient = getPatientForRx(rx);
    const visit = getVisitForRx(rx);
    const displayPatientName = patient?.full_name || 'Patient';
    const patientFilenameSeed = patient?.full_name ? patient.full_name.replace(/\s+/g, '_') : 'Patient';
    const patientCode = patient?.patient_code || rx.id.slice(-8);

    const docTitle = `Prescription_${patientCode}_${patientFilenameSeed}`;

    
    const dobString = patient?.dob;
    const patientAge = dobString ? (() => {
      const birthYear = new Date(dobString).getFullYear();
      if (isNaN(birthYear)) return dobString;
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} Yrs`;
    })() : "—";

    
    const rawGender = patient?.gender;
    const formattedSex = rawGender && typeof rawGender === "string" && rawGender !== "—"
      ? (rawGender.toLowerCase() === "female" ? "Female" : (rawGender.toLowerCase() === "male" ? "Male" : rawGender.charAt(0).toUpperCase() + rawGender.slice(1)))
      : "";
    const sexSuffix = formattedSex ? ` (${formattedSex})` : "";

    const rxDate = rx.printed_at 
      ? new Date(rx.printed_at).toLocaleDateString()
      : new Date().toLocaleDateString();

    const chiefComplaint = visit?.chief_complaint || "—";
    
    let vitalsHTML = "";
    if (visit?.vitals) {
      if (visit.vitals.bp) vitalsHTML += `<p style="margin: 3px 0;">BP: ${visit.vitals.bp} mmHg</p>`;
      if (visit.vitals.temp) vitalsHTML += `<p style="margin: 3px 0;">Temp: ${visit.vitals.temp} °F</p>`;
      if (visit.vitals.pulse) vitalsHTML += `<p style="margin: 3px 0;">Pulse: ${visit.vitals.pulse} bpm</p>`;
      if (visit.vitals.weight) vitalsHTML += `<p style="margin: 3px 0;">Wt: ${visit.vitals.weight} kg</p>`;
      if (visit.vitals.spo2) vitalsHTML += `<p style="margin: 3px 0;">SpO2: ${visit.vitals.spo2} %</p>`;
    }

    let diagnosisHTML = "";
    if (visit?.diagnosis && visit.diagnosis.length > 0) {
      diagnosisHTML += `
        <div style="font-size: 11.5px; font-weight: bold; color: rgb(30, 27, 75); margin-top: 16px;">
          <p style="text-decoration: underline; font-size: 12px; color: black; margin-bottom: 4px;">Diagnosis:</p>
          ${visit.diagnosis.map(d => `<p style="padding-left: 4px; margin: 2px 0;">✓ ${d}</p>`).join("")}
        </div>
      `;
    }

    const adviceStr = rx.advice || "None recorded";
    const followUpHTML = rx.follow_up_date 
      ? `<div style="font-size: 12px; font-weight: 800; color: rgb(30, 58, 138); font-family: monospace; margin-top: 12px;">
           Follow Up: ${new Date(rx.follow_up_date).toLocaleDateString()}
         </div>`
      : "";

    const medicinesHTML = rx.medicines && rx.medicines.length > 0
      ? rx.medicines.map((m, idx) => `
          <div style="border-bottom: 1px dashed rgb(241, 245, 249); padding-bottom: 12px; line-height: 1.6; display: flex; flex-direction: column; gap: 4px; width: 100%;">
            <div style="font-weight: bold; font-size: 15px; color: rgb(15, 23, 42); display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span>${idx + 1}. ${m.name}</span>
              <span style="font-size: 11.5px; font-weight: bold; color: rgb(30, 27, 75);">(${translateDuration(m.duration)})</span>
            </div>
            <div style="font-size: 12.5px; color: rgb(30, 27, 75); font-weight: bold; display: flex; align-items: center; gap: 16px; padding-left: 16px;">
              <span style="background-color: rgb(248, 250, 252); border: 1px solid rgb(226, 232, 240); border-radius: 6px; padding: 2px 6px; font-family: monospace;">${m.dose}</span>
              <span style="border-bottom: 1px solid rgba(0, 0, 0, 0.3); padding-bottom: 1px;">${translateFrequency(m.frequency)}</span>
              ${m.instructions ? `<span style="color: rgb(100, 116, 139); font-style: italic; font-weight: normal; font-size: 11px;">(${m.instructions})</span>` : ""}
            </div>
          </div>
        `).join("")
      : `<p style="color: rgb(156, 163, 175); font-style: italic; font-size: 12px;">No active medicines registered under prescription.</p>`;

    const qrData = `Altaf Shifakhana Verification\n-----------------------\nRx ID: ${rx.id}\nPatient: ${displayPatientName}\nCode: ${patientCode}\nDate: ${rxDate}\nAdvice: ${adviceStr}\nMedicines:\n${rx.medicines?.map((m, i) => `${i+1}. ${m.name} (${m.dose})`).join('\n')}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: letter portrait;
        margin: 0;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Hind Siliguri', 'Inter', sans-serif;
      font-size: 13.5px;
      color: black;
      background-color: white;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .prescription-sheet {
      width: 8.5in;
      height: 11in;
      background: white;
      padding: 10px 0px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    .header-main {
      height: 100px;
      display: flex;
      margin-bottom: 2px;
      flex-shrink: 0;
    }
    .header-left {
      width: 50%;
      padding: 24px 15px 24px 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .bengali-title {
      color: #1e3a8a;
      font-weight: bold;
      font-size: 20px;
      line-height: 1.2;
    }
    .bengali-subs {
      font-size: 11px;
      color: black;
      line-height: 1.3;
      font-weight: 600;
      margin-top: 2px;
    }
    .bengali-highlight {
      color: #059669;
      font-weight: bold;
      font-size: 11.5px;
    }
    .bengali-sub-address {
      color: #059669;
      font-weight: 600;
      font-size: 11.5px;
    }
    .header-right {
       width: 50%;
       padding: 24px 60px 24px 15px;
       display: flex;
       flex-direction: column;
       justify-content: center;
       align-items: flex-end;
       text-align: right;
    }
    .english-title {
      color: #dc2626;
      font-weight: bold;
      font-size: 20px;
      line-height: 1.2;
    }
    .english-subs {
      font-size: 11px;
      color: black;
      line-height: 1.3;
      font-weight: normal;
      margin-top: 2px;
    }
    .english-highlight {
      color: #059669;
      font-weight: bold;
      font-size: 11.5px;
    }
    .english-sub-address {
      color: #059669;
      font-weight: 600;
      font-size: 11.5px;
    }
    .patient-row {
      height: 32px;
      display: flex;
      background-color: #dbeafe;
      border-top: 1px solid #60a5fa;
      border-bottom: 1px solid #60a5fa;
      align-items: center;
      color: black;
      flex-shrink: 0;
    }
    .patient-col-1 {
      width: 45%;
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 60px;
      padding-right: 15px;
      border-right: 1px solid #60a5fa;
      font-weight: 600;
    }
    .patient-col-2 {
      width: 25%;
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 15px;
      padding-right: 15px;
      border-right: 1px solid #60a5fa;
      font-weight: 600;
    }
    .patient-col-3 {
      width: 30%;
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 15px;
      padding-right: 60px;
      font-weight: 600;
    }
    .patient-label {
      font-weight: bold;
      margin-right: 5px;
      font-size: 14px;
    }
    .patient-val {
      font-weight: bold;
      font-size: 14px;
    }
    .main-body {
      display: flex;
      flex: 1;
      border-bottom: 1px solid #d36090;
    }
    .sidebar {
      width: calc(40% + 4vw + 45px);
      background-color: #f8fafc;
      border-right: 1px solid #d36090;
      padding: 25px 12px 25px 57px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .sidebar-section {
      padding-left: 5px;
    }
    .sidebar-title {
      font-weight: bold;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .sidebar-content {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.5;
      color: #1e293b;
      overflow-wrap: break-word;
      white-space: pre-wrap;
      }
    .medication-area {
      width: calc(85% - 4vw + 45px);
      position: relative;
      padding: 25px 75px 25px 30px;
      background-color: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .rx-sign {
      font-size: 32px;
      font-weight: bold;
      font-family: serif;
      font-style: italic;
      color: black;
      line-height: 1;
      margin-bottom: 16px;
    }
    .medicines-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }
    .qr-badge {
      position: absolute;
      bottom: 24px;
      right: 69px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: white;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      text-align: center;
      z-index: 15;
    }
    .qr-badge img {
      width: 90px;
      height: 90px;
      object-fit: contain;
    }
    .qr-badge span.verified-label {
      font-size: 8px;
      font-family: monospace;
      font-weight: bold;
      color: #64748b;
      margin-top: 4px;
    }
    .qr-badge span.rx-short-id {
      font-size: 7px;
      font-family: monospace;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .watermark-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.08;
      width: 400px;
      height: 400px;
      pointer-events: none;
      z-index: 0;
    }
    .watermark-container svg {
      width: 100%;
      height: 100%;
    }
    .chamber-footer {
      height: 100px;
      display: flex;
      justify-content: space-between;
      background-color: #fdf2f8;
      border-top: 1px solid #d36090;
      flex-shrink: 0;
    }
    .chamber-left {
      width: 50%;
      padding: 18px 15px 18px 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-right: 1px solid rgba(211, 96, 144, 0.15);
    }
    .chamber-badge-green {
      background-color: #16a34a;
      color: white;
      padding: 1px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      width: fit-content;
      margin-bottom: 2px;
    }
    .chamber-text {
      font-size: 13px;
      line-height: 1.4;
      font-weight: 500;
      margin-top: 4px;
      color: black;
    }
    .chamber-center {
      width: 30%;
      display: flex;
      justify-content: center;
      align-items: center;
      border-right: 1px solid rgba(211, 96, 144, 0.15);
      padding-right: 30px;
      padding-top: 15px;
    }
    .chamber-badge-serial {
      background-color: #db2777;
      color: white;
      padding: 3px 15px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: bold;
    }
    .schedule-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .chamber-badge-blue {
      background-color: #1e3a8a;
      color: white;
      padding: 1px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      margin-bottom: 2px;
    }
    .schedule-text {
      font-size: 13px;
      font-weight: bold;
      line-height: 1.4;
      text-align: center;
      margin-top: 2px;
      color: black;
    }
  </style>
</head>
<body>
  <div class="prescription-sheet">
    
    <!-- HEADER MAIN -->
    <div class="header-main">
      <div class="header-left">
        <div class="bengali-title">ডা: মো: আলতাফ হোসেন</div>
        <div class="bengali-subs">
          ডি এইচ এম এস, আল্ট্রামাইন্ড গ্রাজুয়েট<br />
          এলএল.বি (অনার্স), এলএল.এম<br />
          <span class="bengali-highlight">আলতাফ হোমিও ক্লিনিক (০১৬৭৮০৯৪৮০৮, ০১৮৩৮৩৯৭৫৭৫)</span><br />
          <span class="bengali-sub-address">হোল্ডিং-৩৩, মাজার রোড, বনমালা, টঙ্গী, গাজীপুর।</span>
        </div>
      </div>
      
      <div class="header-right">
        <div class="english-title">Dr. MD. Altaf Hossain</div>
        <div class="english-subs">
          DHMS, Ultramind Graduate<br />
          LL.B(Hon's), LL.M.<br />
          <span class="english-highlight">Altafshifakhana (01678094808, 01838397575)</span><br />
          <span class="english-sub-address">Hold-33, Mazar Road, Banmala, Tongi, Gazipur.</span>
        </div>
      </div>
    </div>

    <!-- PATIENT DEMOGRAPHICS ROW -->
    <div class="patient-row">
      <div class="patient-col-1">
        <span class="patient-label">নাম :</span> 
        <span class="patient-val">${displayPatientName}</span>
      </div>
      <div class="patient-col-2">
        <span class="patient-label">বয়স :</span> 
        <span class="patient-val">${patientAge}${sexSuffix}</span>
      </div>
      <div class="patient-col-3">
        <span class="patient-label">তারিখ :</span> 
        <span class="patient-val" style="font-family: monospace;">${rxDate}</span>
      </div>
    </div>

    <!-- MAIN BODY -->
    <div class="main-body">
      
      <!-- Sidebar -->
      <div class="sidebar">
        <!-- Complaints -->
        <div class="sidebar-section">
          <div class="sidebar-title">C/C:</div>
          <div class="sidebar-content">${chiefComplaint}</div>
        </div>
        
        <!-- Vitals -->
        <div class="sidebar-section">
          <div class="sidebar-title">O/E:</div>
          <div class="sidebar-content" style="font-family: monospace;">
            ${vitalsHTML || "—"}
            ${diagnosisHTML}
          </div>
        </div>

        <!-- Advice -->
        <div class="sidebar-section">
          <div class="sidebar-title">Adv:</div>
          <div class="sidebar-content" style="font-weight: 500;">
            ${adviceStr}
          </div>
          ${followUpHTML}
        </div>
      </div>

      <!-- Core Medication Content area -->
      <div class="medication-area">
        <div style="z-index: 10; width: 100%;">
          <div class="medicines-list">
            ${medicinesHTML}
          </div>
        </div>

        <!-- Verification Badge -->
        <div class="qr-badge">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrData)}" alt="QR Code" referrerPolicy="no-referrer">
          <span class="verified-label">VERIFIED PRESCRIPTION</span>
          <span class="rx-short-id">${rx.id.slice(-8)}</span>
        </div>

        <!-- Watermark -->
        <div class="watermark-container">
          <svg viewBox="0 0 100 100" fill="none" stroke="#000" stroke-width="1.5">
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

    <!-- PIXEL PERFECT CHAMBER FOOTER -->
    <div class="chamber-footer">
      <div class="chamber-left">
        <span class="chamber-badge-green">চেম্বার :</span>
        <div class="chamber-text">
          <strong>আলতাফ হোমিও ক্লিনিক</strong><br />
          হোল্ডিং-৩৩, মধুর মা'র মাজার রোড, বনমালা, টঙ্গী, গাজীপুর।
        </div>
      </div>
      
      <div class="chamber-center">
        <div class="chamber-badge-serial">
          প্রয়োজনে কল করুন ০১৬৭৮০৯৪৮০৮
        </div>
      </div>
    </div>

  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    try {
      showToast("Preparing prescription print preview...", "info");
      const printWindow: Window | null = window.open("", "VENUX");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        showToast("Prescription ready! Choose 'Save as PDF' to download.", "success");
      } else {
        
        showToast("Popup blocked! Loading inline print view...", "warning");
        setActivePrintRx(rx);
        setTimeout(() => {
          window.print();
          setActivePrintRx(null);
        }, 500);
      }
    } catch (err) {
      console.error("Popup window exception:", err);
      setActivePrintRx(rx);
      setTimeout(() => {
        window.print();
        setActivePrintRx(null);
      }, 500);
    }
  };

  useEffect(() => {}, [activePrintRx]);

  const handleSelectPatientForNewRx = async (patientId: string) => {
    setSelectedPatientId(patientId);
    
    
    const patientVisits = visits.filter(v => v.patient_id === patientId && v.status !== "scheduled");
    if (patientVisits.length > 0) {
      
      setSelectedVisitId(patientVisits[0].id);
    } else {
      
      try {
        const tempVisit = await db.saveVisit({
          patient_id: patientId,
          chief_complaint: "General Consult Checkup",
          vitals: { bp: "", temp: "", weight: "", pulse: "", spo2: "" },
          diagnosis: [],
          clinical_notes: "Direct outpatient prescription requested.",
          visit_type: "walk-in",
          status: "completed"
        });
        setSelectedVisitId(tempVisit.id);
      } catch (e) {
        console.error("Auto provisional visit creation failed:", e);
      }
    }
    
    
    setActiveTab("rx");
    showToast("Opening Prescription Architect for patient...", "success");
    setIsSelectPatientOpen(false);
    setPatientSearchQuery("");
  };

  const itemsPerPage = 6;
  const totalItems = filteredPrescriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexStart = (currentPage - 1) * itemsPerPage;
  const indexEnd = indexStart + itemsPerPage;
  const paginatedPrescriptions = filteredPrescriptions.slice(indexStart, indexEnd);

  return (
    <div className="space-y-6">
      
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-6 rounded-xl border border-slate-200/85 shadow-2xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" /> Prescriptions Ledger & Dispatch Desk
          </h2>
          <p className="text-xs text-slate-400">
            Chronological log of clinical prescriptions, automatic stock deductions, patient timeline audits, and pixel-perfect print.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSelectPatientOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs animate-fade-in"
          >
            <Plus className="h-4 w-4" /> Create Prescription
          </button>
          <button 
            onClick={refreshData}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-3xs no-print">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Filter prescriptions (search patient name, phone, card code, medicines, or diagnosis)..."
          className="w-full text-xs text-slate-750 font-medium placeholder-slate-400 focus:outline-hidden"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")} 
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
      </div>

      
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Registry Date</th>
                <th className="p-4">Patient Code</th>
                <th className="p-4">Patient Info</th>
                <th className="p-4">Primary Complaints / diagnosis</th>
                <th className="p-4">Prescribed Medicines</th>
                <th className="p-4">Advice & Follow Up</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No patient prescriptions indexed in local or cloud secure vaults.
                  </td>
                </tr>
              ) : (
                paginatedPrescriptions.map(rx => {
                  const patient = getPatientForRx(rx);
                  const visit = getVisitForRx(rx);
                  
                  return (
                    <tr key={rx.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-500 font-mono">
                        {rx.printed_at 
                          ? new Date(rx.printed_at).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"})
                          : "Legacy Document"
                        }
                      </td>
                      <td className="p-4 font-mono font-bold text-indigo-700">
                        {patient?.patient_code || "ALT-TEMP"}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 font-bengali">{patient ? cleanBanglaName(patient.full_name) : "Unknown Patient"}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">বয়স: {getPatientAge(patient?.dob)}  ·  {patient?.phone || "—"}</div>
                      </td>
                      <td className="p-4 max-w-[220px]">
                        <div className="font-medium text-slate-700 truncate" title={visit?.chief_complaint}>
                          {visit?.chief_complaint || "—"}
                        </div>
                        {visit?.diagnosis && visit.diagnosis.length > 0 && (
                           <div className="flex flex-wrap gap-1 mt-1">
                             {visit.diagnosis.map(d => (
                               <span key={d} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                 {d}
                               </span>
                             ))}
                           </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 max-w-[200px]">
                          {rx.medicines?.map((m, i) => (
                            <div key={i} className="text-[11px] font-semibold text-slate-800 truncate">
                              🔹 {m.name} <span className="text-[10px] font-mono text-slate-400">({m.dose})</span>
                            </div>
                          ))}
                          {(!rx.medicines || rx.medicines.length === 0) && (
                            <span className="text-slate-400 italic">No drugs catalogued</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-[180px]">
                        <div className="text-[11px] text-slate-600 truncate" title={rx.advice}>
                          {rx.advice || "—"}
                        </div>
                        {rx.follow_up_date && (
                          <div className="text-[10px] font-bold text-emerald-600 font-mono mt-1">
                            📅 Revisit: {new Date(rx.follow_up_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handlePrintCommand(rx)}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg transition-colors"
                            title="Interactive Print"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(rx)}
                            className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 rounded-lg transition-colors"
                            title="Edit / Update Prescription"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRxToDelete(rx.id)}
                            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-700 border border-slate-200 rounded-lg transition-colors"
                            title="Erase Log"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        
        {totalPages > 1 && (
          <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
            <div className="text-[11px] text-slate-400 font-bold leading-none uppercase tracking-wide">
              Showing <span className="text-slate-700 text-xs font-black">{indexStart + 1}</span> to{" "}
              <span className="text-slate-700 text-xs font-black">{Math.min(indexEnd, totalItems)}</span> of{" "}
              <span className="text-indigo-650 text-xs font-black">{totalItems}</span> prescriptions
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-250 rounded-lg shadow-3xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-indigo-600 text-white font-black shadow-xs shadow-indigo-200"
                      : "bg-white border border-slate-200 text-slate-550 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-250 rounded-lg shadow-3xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      
      {activeEditRx && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs overflow-y-auto no-print">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col max-h-[90vh]">
            
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Pencil className="h-4 w-4 text-amber-500" /> Edit & Update Prescription
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Modify Rx sheet dosages. Saved changes automatically recalculate stock levels and patients chronic histories.
                </p>
              </div>
              <button 
                onClick={() => setActiveEditRx(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-indigo-950">
                <div>Patient: <span className="font-extrabold text-indigo-900 font-bengali">{getPatientForRx(activeEditRx)?.full_name}</span></div>
                <div>Code: <span className="font-mono">{getPatientForRx(activeEditRx)?.patient_code}</span></div>
                <div>Gender: <span className="capitalize">{getPatientForRx(activeEditRx)?.gender}</span></div>
                <div>Age: <span>{getPatientAge(getPatientForRx(activeEditRx)?.dob)}</span></div>
              </div>

              
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Append New Medicine</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative">
                  
                  <div className="md:col-span-5 space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-500">Query Product (Generic or Brand)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Napa, Paracetamol, Maxpro..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden"
                      value={newDrugQuery}
                      onChange={(e) => setNewDrugQuery(e.target.value)}
                    />
                    {selectedDrug && (
                      <div className="bg-indigo-100 border border-indigo-200 text-indigo-950 text-[10px] font-bold px-2 py-1 rounded mt-1 flex items-center justify-between">
                        <span>Selected Catalog Code: {selectedDrug.brand_names[0]} ({selectedDrug.generic_name})</span>
                        <button onClick={() => setSelectedDrug(null)} className="text-red-500">×</button>
                      </div>
                    )}

                    
                    {drugSuggestions.length > 0 && (
                      <div className="absolute z-60 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-[160px] overflow-y-auto divide-y divide-slate-105">
                        {drugSuggestions.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handleSelectSuggestedDrug(item)}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer text-[10px] flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-800">{item.brand_names.join(", ") || item.generic_name}</span>
                            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1 rounded uppercase tracking-wider">{item.category}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Dose</label>
                    <select
                      className="w-full text-[11px] border border-slate-200 rounded-lg p-2.5 bg-white font-bold"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                    >
                      <option value="1+0+1">1+0+1</option>
                      <option value="1+1+1">1+1+1</option>
                      <option value="1+0+0">1+0+0</option>
                      <option value="0+0+1">0+0+1</option>
                      <option value="0+1+0">0+1+0</option>
                      <option value="1+1+1+1">1+1+1+1</option>
                      <option value="As needed">As needed (PRN)</option>
                      <option value="2 tsp Thrice">2 tsp Thrice</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Frequency</label>
                    <select
                      className="w-full text-[11px] border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-hidden"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    >
                      <option value="খাবার পরে">খাবার পরে</option>
                      <option value="খাবার আগে">খাবার আগে</option>
                      <option value="সকালে খাবার আগে">সকালে খাবার আগে</option>
                      <option value="খাবার সঙ্গে">খাবার সঙ্গে</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Duration</label>
                    <select
                      className="w-full text-[11px] border border-slate-200 rounded-lg p-2.5 bg-white"
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

                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-lg flex items-center justify-center transition-colors"
                      title="Add to current edit list"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <input 
                    type="text" 
                    placeholder="Extra directives or guidelines (e.g., হালকা গরম পানি দিয়ে...)"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>

              
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <PackageCheck className="h-4 w-4 text-emerald-600" /> Prescribed Drugs Matrix
                </h4>
                
                {editMedicines.length === 0 ? (
                  <p className="text-slate-400 italic text-xs p-6 text-center border rounded-xl border-dashed">No medications catalogued. Add some using the composer above.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white shadow-3xs overflow-hidden">
                    {editMedicines.map((m, i) => (
                      <div key={i} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                          <p className="text-xs text-indigo-600 font-bold flex items-center gap-2 mt-0.5">
                            <span>{m.dose}</span>
                            <span>•</span>
                            <span>{translateFrequency(m.frequency)}</span>
                            <span>•</span>
                            <span>{translateDuration(m.duration)}</span>
                            {m.instructions && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 font-medium italic">({m.instructions})</span>
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMed(i)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded bg-slate-50 border border-slate-200 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">General Clinical Advice</label>
                  <textarea
                    rows={3}
                    placeholder="Dietary instructions, rest, general caution guidelines..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                    value={editAdvice}
                    onChange={(e) => setEditAdvice(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Follow Up date</label>
                  <input
                    type="date"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-600 focus:outline-hidden text-slate-600"
                    value={editFollowUp}
                    onChange={(e) => setEditFollowUp(e.target.value)}
                  />
                </div>
              </div>

              
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-500" /> Patient Ongoing Previous Medical Conditions
                </h4>
                <p className="text-[11px] text-slate-400">
                  Update/append chronic conditions to this patient's master record. Checked items automatically save to their ongoing clinical condition dashboard.
                </p>
                
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {CHRONIC_OPTIONS.map(disease => {
                    const checked = editChronicConditions.includes(disease);
                    return (
                      <button
                        key={disease}
                        type="button"
                        onClick={() => handleToggleChronicCheck(disease)}
                        className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 font-semibold transition-all shadow-3xs ${
                          checked 
                            ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="h-4 w-4 text-rose-600 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-350 shrink-0" />
                        )}
                        {disease}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
              <button
                onClick={() => setActiveEditRx(null)}
                className="px-5 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-lg text-xs"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveRxEdits}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
              >
                Commit Changes & Update Vault
              </button>
            </div>

          </div>
        </div>
      )}

      
      {rxToDelete && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print" 
          onClick={() => setRxToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200/80 p-6 space-y-5 animation-scale-in" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900">Erase Prescription Record?</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-normal">
                  Are you sure you want to permanently delete this prescription? This action will immediately remove the record from local storage and cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button 
                type="button"
                onClick={() => setRxToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                No, Keep Record
              </button>
              <button 
                type="button"
                onClick={() => {
                  const id = rxToDelete;
                  // Optimistically update prescription list immediately
                  setPrescriptions(prev => prev.filter(r => r.id !== id));
                  setRxToDelete(null);
                  showToast("Prescription erased successfully.", "success");
                  
                  // Fire the actual database call asynchronously in background
                  db.deletePrescription(id).then(() => {
                    // silently sync other data in background if needed, but do not block UI
                    refreshData();
                  }).catch((err) => {
                    console.error("Prescription background delete failed: ", err);
                    showToast("Failed to sync deletion to server.", "error");
                  });
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer select-none"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      
      
      
      {activePrintRx && (
        <div 
          className="w-[8.5in] h-[11in] bg-white text-black py-[10px] px-0 flex flex-col overflow-hidden relative animate-fade-in"
          style={{ 
            fontFamily: "'Hind Siliguri', sans-serif", 
            fontSize: "14px",
            position: "fixed",
            left: "-9999px",
            top: "0",
            zIndex: 9999,
            pointerEvents: "none"
          }}
          id="native-a3-print-layout"
        >
          
          <div className="h-[100px] flex mb-[2px] border-none shrink-0" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            
            <div className="w-[50%] pt-[24px] pb-[24px] pr-[15px] pl-[60px] flex flex-col justify-center">
              <div className="text-[#1e3a8a] font-bold text-[20px] leading-[1.2] font-bengali">ডা: মো: আলতাফ হোসেন</div>
              <div className="text-[11px] text-black leading-[1.3] font-semibold mt-[2px] font-bengali">
                ডি এইচ এম এস, আল্ট্রামাইন্ড গ্রাজুয়েট<br />
                এলএল.বি (অনার্স), এলএল.এম<br />
                <span className="text-[#059669] font-bold text-[12px] font-bengali">আলতাফ হোমিও ক্লিনিক (০১৬৭৮০৯৪৮০৮, ০১৮৩৮৩৯৭৫৭৫)</span><br />
                <span className="text-[#059669] font-semibold text-[12px] font-bengali">হোল্ডিং-৩৩, মাজার রোড, বনমালা, টঙ্গী, গাজীপুর।</span>
                
              </div>
            </div>

            
            <div className="w-[50%] pt-[24px] pb-[24px] pl-[15px] pr-[60px] flex flex-col justify-center items-end text-right">
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
            <div className="w-[48%] h-full flex items-center pl-[60px] pr-[15px] border-r border-[#60a5fa] font-semibold">
              <span className="font-bold mr-[5px] text-[14px]">নাম :</span> 
              <span className="font-bengali font-bold text-[14px]">{getPatientForRx(activePrintRx)?.full_name || "—"}</span>
            </div>
            <div className="w-[22%] h-full flex items-center px-[15px] border-r border-[#60a5fa] font-semibold">
              <span className="font-bold mr-[5px] text-[14px]">বয়স :</span> 
              <span className="font-bold text-[14px]">{getPatientAge(getPatientForRx(activePrintRx)?.dob)}</span>
            </div>
            <div className="w-[30%] h-full flex items-center pl-[15px] pr-[60px] font-semibold">
              <span className="font-bold mr-[5px] text-[14px]">তারিখ :</span> 
              <span className="font-mono text-[14px]">
                {activePrintRx.printed_at 
                  ? new Date(activePrintRx.printed_at).toLocaleDateString()
                  : new Date().toLocaleDateString()
                }
              </span>
            </div>
          </div>

          
          <div className="flex flex-1 border-b border-[#d36090]">
            
            
            <div className="w-[calc(40%+4vw+45px)] bg-[#f8fafc] border-r border-[#d36090] pt-[25px] pb-[25px] pr-[10px] pl-[55px] space-y-[120px]">
              
              
              <div className="pl-[5px] space-y-2">
                <div className="font-bold text-[15px]">C/C:</div>
                <div className="text-[12px] font-semibold leading-relaxed text-slate-800 break-words whitespace-pre-wrap">
                  {getVisitForRx(activePrintRx)?.chief_complaint || "—"}
                </div>
              </div>

              
              <div className="pl-[5px] space-y-2.5">
                <div className="font-bold text-[15px]">O/E:</div>
                {getVisitForRx(activePrintRx)?.vitals && (
                  <div className="text-[12px] font-semibold leading-relaxed text-slate-700 font-mono space-y-1">
                    {getVisitForRx(activePrintRx)?.vitals?.bp && (
                      <p>BP: {getVisitForRx(activePrintRx)?.vitals?.bp} mmHg</p>
                    )}
                    {getVisitForRx(activePrintRx)?.vitals?.temp && (
                      <p>Temp: {getVisitForRx(activePrintRx)?.vitals?.temp} °F</p>
                    )}
                    {getVisitForRx(activePrintRx)?.vitals?.pulse && (
                      <p>Pulse: {getVisitForRx(activePrintRx)?.vitals?.pulse} bpm</p>
                    )}
                    {getVisitForRx(activePrintRx)?.vitals?.weight && (
                      <p>Wt: {getVisitForRx(activePrintRx)?.vitals?.weight} kg</p>
                    )}
                    {getVisitForRx(activePrintRx)?.vitals?.spo2 && (
                      <p>SpO2: {getVisitForRx(activePrintRx)?.vitals?.spo2} %</p>
                    )}
                  </div>
                )}
                {getVisitForRx(activePrintRx)?.diagnosis && (getVisitForRx(activePrintRx)?.diagnosis || []).length > 0 && (
                  <div className="text-[11.5px] font-bold text-indigo-950 mt-4 space-y-1">
                    <p className="underline text-[12px] text-black">Diagnosis:</p>
                    {getVisitForRx(activePrintRx)?.diagnosis?.map(d => (
                      <p key={d} className="pl-1">✓ {d}</p>
                    ))}
                  </div>
                )}
              </div>

              
              <div className="pl-[5px] space-y-2">
                <div className="font-bold text-[15px]">Adv:</div>
                <div className="text-[12px] font-medium leading-[1.4] text-slate-755 whitespace-pre-wrap">
                  {activePrintRx.advice || "None recorded"}
                </div>
                {activePrintRx.follow_up_date && (
                  <div className="text-[12px] font-extrabold text-[#1e3a8a] font-mono mt-3">
                    Follow Up: {new Date(activePrintRx.follow_up_date).toLocaleDateString()}
                  </div>
                )}
              </div>

            </div>

            
            <div className="w-[calc(85%-4vw+45px)] relative pt-[25px] pb-[25px] pl-[30px] pr-[75px] bg-white flex flex-col justify-between">
              
              
              <div className="space-y-4 relative z-10 w-full">
                <div className="text-[32px] font-bold font-serif italic text-black leading-none mb-4">Rx</div>
                
                
                <div className="space-y-6 pt-2 font-sans">
                  {activePrintRx.medicines?.map((m, idx) => (
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
                  {(!activePrintRx.medicines || activePrintRx.medicines.length === 0) && (
                    <p className="text-slate-400 italic text-xs">No active medicines registered under prescription.</p>
                  )}
                </div>
              </div>

              
              <div className="absolute bottom-6 right-[69px] flex flex-col items-center bg-white p-2.5 border border-slate-200/80 rounded-xl shadow-xs text-center z-15">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                    `Altaf Shifakhana Verification\n-----------------------\nRx ID: ${activePrintRx.id}\nPatient: ${getPatientForRx(activePrintRx)?.full_name}\nCode: ${getPatientForRx(activePrintRx)?.patient_code || '—'}\nDate: ${activePrintRx.printed_at ? new Date(activePrintRx.printed_at).toLocaleDateString() : '—'}\nAdvice: ${activePrintRx.advice || '—'}\nMedicines:\n${activePrintRx.medicines?.map((m, i) => `${i+1}. ${m.name} (${m.dose})`).join('\n')}`
                  )}`} 
                  alt="QR verification scan" 
                  className="w-[90px] h-[90px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">VERIFIED PRESCRIPTION</span>
                <span className="text-[7px] font-mono text-slate-450 uppercase tracking-widest">{activePrintRx.id.slice(-8)}</span>
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
            
            <div className="w-[50%] pt-[18px] pb-[18px] pr-[15px] pl-[60px] flex flex-col justify-center border-r border-[#d36090]/15">
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
      )}

      
      {isSelectPatientOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print" onClick={() => setIsSelectPatientOpen(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Select Patient for Prescription</h3>
                  <p className="text-[10px] text-slate-400">Choose patient to write prescription or create outpatient encounter</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsSelectPatientOpen(false);
                  setPatientSearchQuery("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all bg-slate-50/30">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Type name, phone number, or patient code..."
                  className="w-full text-xs font-semibold placeholder-slate-400 bg-transparent text-slate-850 focus:outline-hidden text-slate-900"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  autoFocus
                />
                {patientSearchQuery && (
                  <button 
                    onClick={() => setPatientSearchQuery("")}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold bg-slate-100 rounded-full h-4 w-4 flex items-center justify-center p-0"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/40">
              {(() => {
                const query = patientSearchQuery.trim().toLowerCase();
                const matches = patients.filter(p => {
                  if (!query) return true;
                  return p.full_name?.toLowerCase().includes(query) ||
                         p.phone?.toLowerCase().includes(query) ||
                         p.patient_code?.toLowerCase().includes(query);
                });

                if (matches.length === 0) {
                  return (
                    <div className="text-center py-8 bg-white border border-dashed rounded-xl border-slate-200">
                      <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium font-sans animate-fade-in">No matching patients discovered.</p>
                      <button 
                        onClick={() => {
                          setIsSelectPatientOpen(false);
                          setActiveTab("patients");
                          showToast("Transferring to Patients module to register new file.", "warning");
                        }}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-150/40 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Register New Patient
                      </button>
                    </div>
                  );
                }

                return matches.slice(0, 15).map(p => {
                  const patientVisits = visits.filter(v => v.patient_id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatientForNewRx(p.id)}
                      className="w-full text-left bg-white border border-slate-200/75 hover:border-indigo-300 text-slate-800 p-3 rounded-xl flex items-center justify-between hover:bg-slate-50/80 transition-all focus:outline-hidden hover:shadow-3xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs font-bengali">
                          <span>{cleanBanglaName(p.full_name)}</span>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-bold border border-indigo-100/40">{p.patient_code}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 font-mono flex items-center gap-2">
                          <span>বয়স: {p.dob ? getPatientAge(p.dob) : 'N/A'}</span>
                          <span>•</span>
                          <span>{p.phone || 'No phone'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-150/50 px-2 py-1 rounded-lg">
                          {patientVisits.length} {patientVisits.length === 1 ? 'visit' : 'visits'}
                        </span>
                        <div className="text-[9px] text-indigo-600 font-extrabold mt-1.5 underline">Write Rx →</div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            
            <div className="border-t border-slate-100 bg-slate-50/70 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Tip: If writing directly for walked-in prescription, we'll auto-log a general consult.</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
