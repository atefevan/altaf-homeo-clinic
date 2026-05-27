import React, { useState } from "react";
import { useApp } from "../AppContext";
import { 
  BarChart as ReBarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  TrendingDown, 
  PieChart as LucidePie, 
  Sparkles,
  Award
} from "lucide-react";

export function Reports() {
  const { patients, visits, billing, showToast } = useApp();

  const [dateRange, setDateRange] = useState("30");

  
  const weeklyTrendData = [
    { day: "May 16", Patients: 12, Revenue: 11200 },
    { day: "May 17", Patients: 15, Revenue: 13900 },
    { day: "May 18", Patients: 9,  Revenue: 8400 },
    { day: "May 19", Patients: 18, Revenue: 16500 },
    { day: "May 20", Patients: 22, Revenue: 19800 },
    { day: "May 21", Patients: 14, Revenue: 13150 },
    { day: "May 22", Patients: 19, Revenue: 17820 }
  ];

  
  const topDiagnosesData = [
    { name: "Hypertension (I10)", Count: 14, fill: "#6366f1" },
    { name: "Type-2 Diabetes (E11)", Count: 11, fill: "#3b82f6" },
    { name: "Asthma Bronchitis (J45)", Count: 8, fill: "#10b981" },
    { name: "Acid Reflux (K21)", Count: 7, fill: "#f59e0b" },
    { name: "Acute Fever (R50)", Count: 5, fill: "#ec4899" }
  ];

  
  const channelBreakdown = [
    { name: "Cash (💵)", value: 45, color: "#10b981" },
    { name: "bKash (📱)", value: 35, color: "#ec4899" },
    { name: "Visa Card (💳)", value: 20, color: "#6366f1" }
  ];

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Invoice ID,Visit ID,Consultation Fee,Medicine Charges,Discount,Total,Status,Method\r\n";
      
      billing.forEach((b) => {
        csvContent += `${b.id},${b.visit_id},${b.consultation_fee},${b.medicine_charges},${b.discount},${b.total},${b.payment_status},${b.payment_method}\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `AltafShifakhana_TransactionReport_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Clinical Transaction Report downloaded as CSV!", "success");
    } catch {
      showToast("Export process crashed in sandbox.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="reports-tab">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">Business performance metrics</h2>
          <p className="text-xs text-slate-400">View demographic charts, peak clinic traffic patterns, and financial accounts audits.</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <select
            className="text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-700 font-semibold"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 Days (Past week)</option>
            <option value="30">Last 30 Days (Current month)</option>
            <option value="90">Last 90 Days (Quarterly performance)</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            id="export-csv-btn"
          >
            <Download className="h-3.5 w-3.5" /> Export Ledgers to CSV
          </button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-500" /> Patient Flow & Revenue Streams
            </h3>
            <p className="text-[11px] text-slate-400">Daily patient counts tracked alongside gross revenue collections</p>
          </div>

          <div className="h-[230px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#a5b4fc" }}
                  itemStyle={{ fontSize: "12px", color: "#ffffff" }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Patients" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-500" /> Common Diagnosed Conditions (OPD Profiles)
            </h3>
            <p className="text-[11px] text-slate-400">Total case counts mapping the top 5 clinical ICD-10 symptoms matches</p>
          </div>

          <div className="h-[230px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={topDiagnosesData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#0f172a" fontSize={9} tickLine={false} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none" }}
                  itemStyle={{ fontSize: "12px", color: "#ffffff" }}
                />
                <Bar dataKey="Count" radius={[0, 4, 4, 0]}>
                  {topDiagnosesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <LucidePie className="h-4 w-4 text-indigo-500" /> Ledger Settlement Distribution
            </h3>
            <p className="text-[11px] text-slate-400">Breakdown of gross transaction volumes by Cash vs Card vs bKash mobile pay</p>
          </div>

          <div className="h-[200px] w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#ffffff" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clinical Practice Insights</h3>
            <h4 className="text-base font-bold text-slate-800">Your practice is highly active on Monday mornings.</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Based on historical patient registration schedules, patient traffic flow peaks decisively between <strong>10:00 AM - 12:00 PM</strong> in the morning and <strong>5:00 PM - 7:00 PM</strong> in the evening. 
            </p>
          </div>

          <div className="space-y-3.5 border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Patient Return/Repeat Visit ratio</span>
              <span className="text-indigo-600">68.5% (High loyalty Retention)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Average Consultation duration</span>
              <span className="text-indigo-600">8.4 minutes / patient</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Average Dispensed Medicine Value</span>
              <span className="text-indigo-600">৳380 per prescription sheet</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
