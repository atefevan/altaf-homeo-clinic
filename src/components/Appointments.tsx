import React from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { 
  Users, 
  Play, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  ChevronRight, 
  CornerDownRight 
} from "lucide-react";

export function Appointments() {
  const { patients, appointments, refreshData, setSelectedPatientId, setActiveTab, showToast } = useApp();

  const getPatientInfo = (id: string) => {
    return patients.find(p => p.id === id);
  };

  const handleUpdateStatus = async (appId: string, status: 'waiting' | 'in-progress' | 'completed') => {
    const app = appointments.find(a => a.id === appId);
    if (!app) return;

    try {
      await db.saveAppointment({
        id: appId,
        patient_id: app.patient_id,
        status: status,
        visit_type: app.visit_type
      });
      showToast(`Token status updated to ${status}`, "success");
      await refreshData();
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleBeginConsult = (patientId: string, appId: string) => {
    setSelectedPatientId(patientId);
    handleUpdateStatus(appId, "in-progress").then(() => {
      setActiveTab("consultation");
    });
  };

  
  const waitingApps = appointments.filter(a => a.status === "waiting");
  const activeApps = appointments.filter(a => a.status === "in-progress");
  const completedApps = appointments.filter(a => a.status === "completed");

  return (
    <div className="space-y-6 animate-fade-in" id="appointments-tab">
      
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Clinic Board & Live Queue scheduler</h2>
        <p className="text-xs text-slate-400">Tokens tracker for managing waiting, active consultations, and completed discharges.</p>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span> Waiting Room ({waitingApps.length})
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg font-bold">Queue</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {waitingApps.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                Waiting room is currently vacant.
              </div>
            ) : (
              waitingApps.map(a => {
                const patient = getPatientInfo(a.patient_id);
                if (!patient) return null;
                return (
                  <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-3xs transition-all hover:border-blue-400/50 space-y-3">
                    <div className="flex items-start justify-between">
                       <div className="space-y-0.5">
                        <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-md font-mono">
                          Token #{a.token_number}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 font-bengali mt-2">{patient.full_name}</h4>
                        <p className="text-xs text-slate-405 font-mono">{patient.patient_code} • {patient.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleBeginConsult(patient.id, a.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs"
                      >
                        <Play className="h-3 w-3 shrink-0" /> Call Inside
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Calling Inside ({activeApps.length})
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold">Active</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {activeApps.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No active patient encounters in progress.
              </div>
            ) : (
              activeApps.map(a => {
                const patient = getPatientInfo(a.patient_id);
                if (!patient) return null;
                return (
                  <div key={a.id} className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-150 shadow-2xs space-y-3">
                     <div className="space-y-0.5">
                      <span className="text-[10px] bg-emerald-100 text-emerald-850 font-bold px-2 py-0.5 rounded-md font-mono">
                        Token #{a.token_number}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 font-bengali mt-2">{patient.full_name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{patient.patient_code} • {patient.phone}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/40">
                      <button
                        onClick={() => { setSelectedPatientId(patient.id); setActiveTab("consultation"); }}
                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-3xs"
                      >
                        Resume Consultation <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span> Discharged Today ({completedApps.length})
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg font-bold font-sans">Done</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {completedApps.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No completed consults yet today.
              </div>
            ) : (
              completedApps.map(a => {
                const patient = getPatientInfo(a.patient_id);
                if (!patient) return null;
                return (
                  <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors opacity-85 space-y-1">
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded font-mono">
                      Token #{a.token_number}
                    </span>
                    <h4 className="text-sm font-bold text-slate-600 font-bengali mt-2">{patient.full_name}</h4>
                    <span className="text-[10px] text-emerald-600 flex items-center font-bold mt-2">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" /> Discharged
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
