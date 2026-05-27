import React from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Plus, 
  ShoppingBag,
  Search,
  CheckCircle2,
  Sparkles,
  Printer,
  Pill,
  ShieldAlert
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from "recharts";

export function Dashboard() {
  const { 
    patients, 
    visits, 
    inventory, 
    medicines,
    billing, 
    appointments, 
    setActiveTab, 
    setSelectedPatientId,
    refreshData,
    showToast
  } = useApp();

  
  const todayStr = new Date().toISOString().split("T")[0];
  
  const todayAppointments = appointments.filter(a => a.scheduled_date === todayStr);
  const waitingCount = todayAppointments.filter(a => a.status === "waiting").length;
  const completedCount = todayAppointments.filter(a => a.status === "completed").length;
  const inProgressCount = todayAppointments.filter(a => a.status === "in-progress").length;

  const lowStockCount = inventory.filter(item => item.quantity <= item.low_stock_threshold).length;
  
  
  const nearExpiryCount = inventory.filter(item => {
    const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 60;
  }).length;

  
  const todayVisits = visits.filter(v => v.visited_at.startsWith(todayStr));
  const todayRevenue = billing.reduce((acc, curr) => {
    const linkedVisit = todayVisits.find(v => v.id === curr.visit_id);
    if (linkedVisit && curr.payment_status === "paid") {
      return acc + Number(curr.total);
    }
    return acc;
  }, 0);

  
  const peakTrafficData = [
    { hour: "09:00 AM", Patients: 1 },
    { hour: "10:00 AM", Patients: 5 }, 
    { hour: "11:00 AM", Patients: 8 }, 
    { hour: "12:00 PM", Patients: 4 },
    { hour: "01:00 PM", Patients: 2 },
    { hour: "04:00 PM", Patients: 3 },
    { hour: "05:00 PM", Patients: 6 }, 
    { hour: "06:00 PM", Patients: 9 }, 
    { hour: "07:00 PM", Patients: 4 },
    { hour: "08:00 PM", Patients: 2 },
  ];

  
  const getPatientInfo = (id: string) => {
    return patients.find(p => p.id === id);
  };

  const getMedicineInfo = (id: string) => {
    return medicines.find(m => m.id === id);
  };

  const handleStartConsultation = (patientId: string, appointmentId: string) => {
    setSelectedPatientId(patientId);
    
    
    const updatedAppointments = appointments.map(app => {
      if (app.id === appointmentId) {
        return { ...app, status: "in-progress" as const };
      }
      return app;
    });

    db.saveAppointment({
      id: appointmentId,
      patient_id: patientId,
      status: "in-progress",
      visit_type: appointments.find(a => a.id === appointmentId)?.visit_type || "walk-in"
    }).then(() => {
      refreshData();
      setActiveTab("consultation");
      showToast("Consultation loaded. Proceed to enter vitals.", "success");
    });
  };

  const getPatientAge = (dobString?: string) => {
    if (!dobString) return "—";
    const birthYear = new Date(dobString).getFullYear();
    if (isNaN(birthYear)) return dobString;
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear}y`;
  };

  const formatTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  
  const activeConsultationApp = todayAppointments.find(a => a.status === "in-progress");
  const activePatient = activeConsultationApp ? getPatientInfo(activeConsultationApp.patient_id) : null;
  const activeVisit = activeConsultationApp ? visits.find(v => v.patient_id === activePatient?.id && v.status === "in-progress") : null;

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-tab">
      
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col"> 
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">AltafShifakhana Dashboard</h1>
          <p className="text-slate-500 text-sm">Good morning, Dr. Altaf • {formatTodayDate()}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex items-center flex-1 md:flex-none">
            <Search className="absolute left-3 text-slate-400 h-4.5 w-4.5" />
            <input 
              type="text" 
              placeholder="Search patients folder..." 
              onClick={() => setActiveTab("patients")}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs font-semibold cursor-pointer"
              readOnly
            />
          </div>
          <button 
            onClick={() => setActiveTab("patients")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-all hover:shadow cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" /> New Visit
          </button>
        </div>
      </header>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div 
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400/50 hover:shadow-xs transition-all active:scale-[0.99]"
          onClick={() => setActiveTab("patients")}
          id="stat-queue-card"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultation Progress</p>
            <h3 className="text-3xl font-display font-black text-slate-800">
              {visits.length === 0 ? "0%" : `${Math.round((visits.filter(v => v.status === 'completed').length / visits.length) * 100)}%`}
            </h3>
            <p className="text-[10px] text-blue-650 flex items-center font-bold mt-2">
              <Activity className="h-3 w-3 mr-1" /> {visits.filter(v => v.status === 'completed').length} / {visits.length} Done
            </p>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        
        <div 
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-400/50 hover:shadow-xs transition-all active:scale-[0.99]"
          onClick={() => setActiveTab("billing")}
          id="stat-revenue-card"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Collections</p>
            <h3 className="text-3xl font-display font-black text-slate-800">৳{todayRevenue}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-2">
              From settled invoices
            </p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        
        <div 
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400/50 hover:shadow-xs transition-all active:scale-[0.99]"
          onClick={() => setActiveTab("inventory")}
          id="stat-stock-card"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Medicines</p>
            <h3 className="text-3xl font-display font-black text-slate-800">{lowStockCount}</h3>
            <p className="text-[10px] text-amber-600 flex items-center font-semibold mt-2">
              <AlertTriangle className="h-3 w-3 mr-1" /> Reorder items soon
            </p>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        
        <div 
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-red-400/50 hover:shadow-xs transition-all active:scale-[0.99]"
          onClick={() => setActiveTab("inventory")}
          id="stat-expiry-card"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Near Expiry Drugs</p>
            <h3 className="text-3xl font-display font-black text-red-600">{nearExpiryCount}<span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">batches</span></h3>
            <p className="text-[10px] text-red-500 flex items-center font-semibold mt-2">
              <Clock className="h-3 w-3 mr-1" /> Batches under 60d expiry
            </p>
          </div>
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-12 gap-6">
        
        
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-0.5">
                <h2 className="text-lg font-extrabold text-slate-800">Clinic Consultation Progress Logs</h2>
                <p className="text-xs text-slate-400">Chronological history and completeness progress checklist of patient consultation logs.</p>
              </div>
              <span className="px-3 py-1 bg-blue-150 text-blue-850 rounded-full text-[10px] font-extrabold uppercase tracking-wider">{visits.length} Visitations Total</span>
            </div>
            
            <div className="space-y-2">
              
              <div className="grid grid-cols-12 p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1"> 
                <div className="col-span-3">Visited At</div>
                <div className="col-span-4">Patient identity</div>
                <div className="col-span-3">Chief Complaint</div>
                <div className="col-span-2 text-right">Clinical Progress</div>
              </div>

              
              {visits.length === 0 ? (
                <div className="text-center p-12 text-slate-400 space-y-2">
                  <span className="text-sm font-semibold text-slate-500">No consultations logged yet!</span>
                  <p className="text-xs max-w-sm mx-auto">Go to the "Patients List" tab to add and check-in patient consult history cards.</p>
                </div>
              ) : (
                [...visits]
                  .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
                  .slice(0, 5)
                  .map((v) => {
                    const patient = getPatientInfo(v.patient_id);
                    if (!patient) return null;
                    return (
                      <div 
                        key={v.id} 
                        className="grid grid-cols-12 p-3 items-center rounded-xl transition-all border border-slate-100 hover:bg-slate-50/50"
                      >
                        <div className="col-span-3 text-[11px] font-semibold text-slate-500 font-mono">
                          {new Date(v.visited_at).toLocaleDateString()}
                          <span className="block text-[9.5px] font-normal text-slate-400">{new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black shrink-0 font-sans">
                            {patient.full_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="font-bold text-slate-800 text-xs truncate font-bengali leading-snug">{patient.full_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{patient.patient_code}</span>
                          </div>
                        </div>
                        <div className="col-span-3 truncate text-xs font-medium text-slate-700">
                          {v.chief_complaint || "—"}
                          {v.diagnosis && v.diagnosis.length > 0 && (
                            <span className="block text-[9px] text-indigo-500 font-bold truncate">Diag: {v.diagnosis.join(", ")}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                            v.status === "completed"
                              ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                              : "bg-amber-50 border border-amber-100 text-amber-700"
                          }`}>
                            {v.status === "completed" ? "Completed" : "Active"}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-xs text-slate-400">
            <span>Aggregates chronological clinic records automatically</span>
            <button 
              onClick={() => setActiveTab("patients")} 
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 text-xs"
            >
              View Patients Ledger <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-slate-800">Inventory Alerts</h2>
          
          <div className="flex-1 flex flex-col gap-3 justify-center">
            
            {inventory.filter(item => item.quantity <= item.low_stock_threshold).length > 0 ? (
              inventory
                .filter(item => item.quantity <= item.low_stock_threshold)
                .slice(0, 3)
                .map((item) => {
                  const med = getMedicineInfo(item.medicine_id);
                  const fillPercent = Math.min(100, Math.round((item.quantity / (item.low_stock_threshold || 10)) * 100)) || 15;
                  return (
                    <div key={item.id} className="p-3.5 bg-red-50 border border-red-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-red-950 font-sans tracking-tight">{med?.generic_name || "Antibiotics batch"}</span>
                          <span className="text-[9px] text-red-700 uppercase font-semibold font-mono tracking-wide">{med?.category || "Medication"} • Batch {item.batch_number}</span>
                        </div>
                        <span className="text-xs font-black text-red-700">{item.quantity} Left</span>
                      </div>
                      <div className="w-full h-1.5 bg-red-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-650" style={{ width: `${fillPercent}%` }}></div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-emerald-950">Normal Pharmacy Levels</span>
                    <span className="text-[9px] text-emerald-700 uppercase font-black font-mono">Stock Reserve Health Status</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700">Healthy</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 w-4/5"></div>
                </div>
              </div>
            )}

            
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-900">Analgesic batches check</span>
                  <span className="text-[10px] text-amber-700 uppercase font-medium">Expiring Soon alerts</span>
                </div>
                <span className="text-xs font-bold text-amber-700">45 Days</span>
              </div>
              <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-1/2"></div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-900">General Antacids Reserve</span>
                  <span className="text-[10px] text-blue-700 uppercase font-medium">Omeprazole master stock</span>
                </div>
                <span className="text-xs font-bold text-blue-700">820 Left</span>
              </div>
              <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-4/5"></div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-bold text-slate-800">Peak Traffic Heatmap</h3>
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <TrendingUp className="h-3.5 w-3.5" /> High: 10AM-12PM , 5PM-7PM
              </span>
            </div>
            <p className="text-xs text-slate-400">Hourly patient walk-ins frequency graph over daily clinic roster shifts</p>
          </div>

          <div className="h-[210px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakTrafficData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatientsBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#f8fafc" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#60a5fa" }}
                  itemStyle={{ color: "#ffffff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="Patients" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPatientsBlue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Morning peak hours</p>
              <h4 className="text-sm font-bold text-slate-700 mt-1">11:00 AM</h4>
              <span className="text-[10px] text-slate-400">Avg. 8 Patients</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-slate-405 uppercase tracking-widest">Evening peak hours</p>
              <h4 className="text-sm font-bold text-slate-700 mt-1">06:00 PM</h4>
              <span className="text-[10px] text-slate-400">Avg. 9 Patients</span>
            </div>
          </div>
        </div>

        
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Metrics</span>
            <span className="text-emerald-500 text-xs font-bold font-sans flex items-center gap-0.5">+14% vs yesterday</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-800">৳{todayRevenue}</span>
              <span className="text-slate-400 text-xs font-bold">collected today</span>
            </div>
            <p className="text-xs text-slate-405">Total clinic financial health aggregated from walk-ins and follow-ups</p>
          </div>

          <div className="flex gap-1 items-end h-8 mt-5">
            <div className="flex-1 bg-slate-100 rounded-t h-4"></div>
            <div className="flex-1 bg-slate-100 rounded-t h-6"></div>
            <div className="flex-1 bg-slate-100 rounded-t h-3"></div>
            <div className="flex-1 bg-slate-100 rounded-t h-5"></div>
            <div className="flex-1 bg-slate-100 rounded-t h-8"></div>
            <div className="flex-1 bg-blue-600 rounded-t h-7"></div>
            <div className="flex-1 bg-slate-200 rounded-t h-2"></div>
          </div>
        </div>

        
        <div 
          onClick={() => setActiveTab("billing")}
          className="col-span-12 lg:col-span-6 bg-blue-600 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg shadow-blue-150 hover:bg-blue-700 transition-all cursor-pointer select-none group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl group-hover:scale-105 transition-transform duration-250">
              <Printer className="h-5.5 w-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight">Invoice Settlement ledger</span>
              <span className="text-[10px] text-blue-105 uppercase tracking-wider font-bold">Process & print patient sales instantly</span>
            </div>
          </div>
          
          <button className="w-full mt-6 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-xs shadow-inner pointer-events-none">
            Open Billing Workspace
          </button>
        </div>

      </div>
    </div>
  );
}
