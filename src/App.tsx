import React, { useState } from "react";
import { AppProvider, useApp } from "./AppContext";
import { Dashboard } from "./components/Dashboard";
import { Patients } from "./components/Patients";
import { Consultation } from "./components/Consultation";
import { PrescriptionEngine } from "./components/PrescriptionEngine";
import { Prescriptions } from "./components/Prescriptions";
import { Inventory } from "./components/Inventory";
import { Billing } from "./components/Billing";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { Login } from "./components/Login";

import { 
  Heart, 
  LayoutDashboard, 
  Users, 
  Clock, 
  Activity, 
  Clipboard, 
  Package, 
  Calculator, 
  TrendingUp, 
  Settings as SettingsIcon,
  Menu,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  Palette,
  LogOut
} from "lucide-react";

function ClinicalShell() {
  const { 
    activeTab, 
    setActiveTab, 
    toast, 
    settings, 
    themeMode, 
    themeColor, 
    setThemeMode, 
    setThemeColor,
    user,
    logoutUser
  } = useApp();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return (
      <>
        <Login />
        {toast.message && (
          <div 
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border animate-fade-in flex items-center gap-3 max-w-sm ${
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
            id="global-feedback-toast"
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            )}
            <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  
  const colorsList = [
    { id: "blue", name: "Blue", primary: "#2563eb", hover: "#1d4ed8", light: "#eff6ff", border: "#dbeafe" },
    { id: "emerald", name: "Green", primary: "#059669", hover: "#047857", light: "#ecfdf5", border: "#d1fae5" },
    { id: "violet", name: "Violet", primary: "#7c3aed", hover: "#6d28d9", light: "#f5f3ff", border: "#ede9fe" },
    { id: "amber", name: "Amber", primary: "#d97706", hover: "#b45309", light: "#fef3c7", border: "#fef3c7" },
    { id: "rose", name: "Rose", primary: "#e11d48", hover: "#be123c", light: "#fff1f2", border: "#ffe4e6" },
    { id: "charcoal", name: "Charcoal", primary: "#475569", hover: "#334155", light: "#f8fafc", border: "#e2e8f0" },
  ];

  const isCustomColor = !["blue", "emerald", "violet", "amber", "rose", "charcoal"].includes(themeColor);
  const activePreset = isCustomColor ? null : colorsList.find(c => c.id === themeColor);
  
  const primaryHex = activePreset ? activePreset.primary : themeColor;
  const hoverHex = activePreset ? activePreset.hover : themeColor;
  const lightHex = activePreset ? activePreset.light : `${themeColor}0f`;
  const borderHex = activePreset ? activePreset.border : `${themeColor}25`;

  
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "patients":
        return <Patients />;
      case "consultation":
        return <Consultation />;
      case "rx":
        return <PrescriptionEngine />;
      case "prescriptions":
        return <Prescriptions />;
      case "inventory":
        return <Inventory />;
      case "billing":
        return <Billing />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "patients", label: "Patients List", icon: Users },
    { id: "prescriptions", label: "Prescriptions", icon: Clipboard },
    { id: "inventory", label: "Medicine Inventory", icon: Package },
    { id: "billing", label: "Billing Section", icon: Calculator },
    
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];

  return (
    <div className={`min-h-screen md:h-screen md:overflow-hidden flex flex-col ${themeMode === 'dark' ? 'dark-mode-active' : ''} bg-[#f4f7f9] text-slate-900`}>
      
      
      <style>{`
        :root {
          --theme-primary: ${primaryHex};
          --theme-hover: ${hoverHex};
          --theme-light: ${lightHex};
          --theme-border-color: ${borderHex};
        }

        /* Overwrites to dynamically redirect standard theme classes to variable options */
        .text-indigo-600, .text-blue-600, .text-blue-700, .text-indigo-700, .text-indigo-900, .text-sky-950 {
          color: var(--theme-primary) !important;
        }
        .bg-indigo-600, .bg-blue-600, .bg-blue-700, .bg-indigo-700, .bg-indigo-900, .bg-sky-950 {
          background-color: var(--theme-primary) !important;
          color: #ffffff !important;
        }
        .bg-indigo-600:hover, .bg-blue-600:hover, .bg-blue-700:hover, .bg-indigo-700:hover,
        .hover\:bg-indigo-700:hover, .hover\:bg-blue-700:hover, .hover\:bg-indigo-800:hover, .hover\:bg-blue-800:hover {
          background-color: var(--theme-hover) !important;
        }
        .bg-indigo-50, .bg-blue-50, .bg-indigo-50\/40, .bg-blue-50\/40, .bg-indigo-50\/55, .bg-blue-50\/55 {
          background-color: var(--theme-light) !important;
        }
        .bg-indigo-50 .text-indigo-600, .bg-blue-50 .text-blue-600 {
          color: var(--theme-primary) !important;
        }
        .border-indigo-100, .border-blue-100, .border-blue-200, .border-[#60a5fa], .border-indigo-200, .border-blue-200\/60 {
          border-color: var(--theme-border-color) !important;
        }
        .text-blue-500 {
          color: var(--theme-primary) !important;
        }
        .border-blue-500 {
          border-color: var(--theme-primary) !important;
        }
        .focus\:border-indigo-600:focus, .focus\:ring-indigo-500:focus {
          border-color: var(--theme-primary) !important;
        }
        
        /* Dark mode overrides layout */
        .dark-mode-active {
          background-color: #0d1117 !important;
          color: #c9d1d9 !important;
        }
        .dark-mode-active header {
          background-color: #161b22 !important;
          border-color: #30363d !important;
        }
        .dark-mode-active aside {
          background-color: #161b22 !important;
          border-color: #30363d !important;
        }
        .dark-mode-active main {
          background-color: #0d1117 !important;
        }
        .dark-mode-active .bg-white {
          background-color: #161b22 !important;
          color: #c9d1d9 !important;
          border-color: #30363d !important;
        }
        .dark-mode-active .text-slate-900,
        .dark-mode-active .text-slate-800,
        .dark-mode-active .text-slate-700,
        .dark-mode-active .text-sky-950,
        .dark-mode-active .text-slate-600 {
          color: #c9d1d9 !important;
        }
        .dark-mode-active .text-slate-400,
        .dark-mode-active .text-slate-500 {
          color: #8b949e !important;
        }
        .dark-mode-active .border-slate-200,
        .dark-mode-active .border-slate-150,
        .dark-mode-active .border-slate-100,
        .dark-mode-active .border-slate-200\/80 {
          border-color: #30363d !important;
        }
        .dark-mode-active .bg-slate-50,
        .dark-mode-active .bg-slate-100,
        .dark-mode-active .bg-slate-[50]\/30,
        .dark-mode-active .bg-slate-50\/30,
        .dark-mode-active .bg-slate-50\/50,
        .dark-mode-active .bg-slate-50\/40,
        .dark-mode-active .bg-slate-50\/80,
        .dark-mode-active .bg-slate-50\/55 {
          background-color: #21262d !important;
          color: #c9d1d9 !important;
        }
        .dark-mode-active select,
        .dark-mode-active input,
        .dark-mode-active textarea {
          background-color: #0d1117 !important;
          color: #c9d1d9 !important;
          border-color: #30363d !important;
        }
        .dark-mode-active select option {
          background-color: #161b22 !important;
          color: #c9d1d9 !important;
        }
        .dark-mode-active .shadow-sm,
        .dark-mode-active .shadow-xs,
        .dark-mode-active .shadow-md {
          box-shadow: none !important;
        }
        /* Specific adjustments */
        .dark-mode-active table th {
          background-color: #21262d !important;
          color: #8b949e !important;
        }
        .dark-mode-active table td {
          border-color: #30363d !important;
        }
        .dark-mode-active #sidebar-doctor-footer {
          background-color: #161b22 !important;
          border-color: #30363d !important;
        }
        .dark-mode-active #sidebar-doctor-footer > div {
          border-color: #30363d !important;
          background-color: #0d1117 !important;
        }
      `}</style>

      
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40 no-print">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button 
            type="button" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-slate-500 hover:text-slate-800 focus:outline-hidden md:hidden"
            id="toggle-sidebar-mobile"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0 border border-emerald-100">
            <svg className="h-5 w-5 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 2C9.5 2 9.5 7 3.5 7C2.7 7 2 7.7 2 8.5V15.5C2 16.3 2.7 17 3.5 17H7.5V20.5C7.5 21.3 8.2 22 9 22H15C15.8 22 16.5 21.3 16.5 20.5V16.5H20.5C21.3 16.5 22 15.8 22 15V9C22 8.2 21.3 7.5 20.5 7.5H16.5V3.5C16.5 2.7 15.8 2 15 2H9.5Z" fill="currentColor" className="text-emerald-100" />
              <path d="M12.5 2C12.5 2 19 7 19 13C19 16.86 15.86 20 12 20C8.14 20 5 16.86 5 13C5 7 12.5 2 12.5 2Z" fill="currentColor" className="text-emerald-600" />
              <path d="M12.5 4.5C15 8 14.5 13 10.5 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xs sm:text-md font-extrabold text-slate-900 font-display tracking-tight flex items-center gap-1">
              AltafShifakhana <span className="hidden sm:inline-block text-[10px] bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.2 rounded-full font-sans font-bold">PRD v2.0</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium font-sans truncate max-w-[120px] xs:max-w-[170px] sm:max-w-none">
              Clinic & Pharmacy · Dr. MD. Altaf Hussain
            </p>
          </div>
        </div>

        
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
            className="p-1.5 sm:p-2 border border-slate-200 hover:border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
            title={themeMode === "light" ? "Switch to Dark Theme" : "Switch to Light Theme"}
          >
            {themeMode === "light" ? <Moon className="h-3.5 w-3.5 sm:h-4 w-4" /> : <Sun className="h-3.5 w-3.5 sm:h-4 w-4" />}
          </button>

          
          <div className="flex items-center gap-0.5 sm:gap-1 border border-slate-200 p-0.5 sm:p-1 rounded-lg bg-slate-50 shrink-0">
            {colorsList.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setThemeColor(preset.id)}
                className={`h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 rounded-full transition-all border shrink-0 cursor-pointer ${
                  themeColor === preset.id 
                    ? "border-slate-900 scale-110 shadow-3xs" 
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: preset.primary }}
                title={`Accent Color: ${preset.name}`}
              />
            ))}

            
            <div className="relative h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 rounded-full overflow-hidden border border-slate-300 hover:scale-105 cursor-pointer flex items-center justify-center shrink-0" title="Set any custom color">
              <input
                type="color"
                value={isCustomColor ? themeColor : "#312e81"}
                onChange={(e) => setThemeColor(e.target.value)}
                className="absolute inset-[0] opacity-0 cursor-pointer w-full h-full scale-150"
              />
              <Palette className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      
      <div className="flex-1 flex relative md:overflow-hidden">
        
        
        <aside 
          className={`bg-white border-r border-slate-200 w-64 flex flex-col justify-between shrink-0 no-print fixed md:static md:h-full md:overflow-hidden top-[69px] bottom-0 z-30 transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
          id="main-sidebar-navigation"
        >
          <nav className="p-4 space-y-1 overflow-y-auto md:overflow-hidden shrink-0">
            <div className="pb-3 mb-2 px-3 border-b border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core Command Desk</p>
            </div>
            {navItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left text-xs font-semibold py-2.5 px-3.5 rounded-xl flex items-center gap-3 transition-all border ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-600 border-blue-100/60 font-bold shadow-3xs"
                      : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  id={`nav-tab-${item.id}`}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 shrink-0" id="sidebar-doctor-footer">
            <div className="text-center p-3 border border-dashed border-slate-200 rounded-xl space-y-1">
              <h4 className="text-[10px] font-bold text-slate-700 font-sans">{settings.doctor_name}</h4>
              <p className="text-[9px] font-bold text-blue-600 font-mono mt-1">{settings.bmdc_number}</p>
            </div>
            <button
              onClick={() => logoutUser()}
              className="w-full text-left text-xs font-semibold py-2.5 px-3.5 rounded-xl flex items-center gap-3 transition-all text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 cursor-pointer"
              id="sidebar-signout-btn"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        
        <main className="flex-1 p-6 overflow-x-hidden overflow-y-auto md:h-full min-h-[calc(100vh-69px)] md:min-h-0">
          {renderActiveView()}
        </main>
      </div>

      
      {toast.message && (
        <div 
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border animate-fade-in flex items-center gap-3 max-w-sm ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
          id="global-feedback-toast"
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ClinicalShell />
    </AppProvider>
  );
}
