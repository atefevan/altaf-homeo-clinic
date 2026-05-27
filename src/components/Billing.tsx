import React, { useState, useEffect } from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { Billing as BillingType } from "../types";
import { 
  FileText, 
  DollarSign, 
  Percent, 
  Printer, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  CreditCard,
  User,
  ShoppingBag,
  Pencil,
  Trash2,
  Calendar
} from "lucide-react";

export function Billing() {
  const { 
    patients, 
    visits, 
    prescriptions, 
    billing, 
    setBilling,
    inventory, 
    settings, 
    refreshData, 
    showToast 
  } = useApp();

  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [consultationFee, setConsultationFee] = useState(settings.consultation_fee.toString());
  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'due' | 'waived'>("paid");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'card'>("cash");
  const [editingBillingId, setEditingBillingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<BillingType | null>(null);

  
  useEffect(() => {
    setConsultationFee(settings.consultation_fee.toString());
  }, [settings]);

  
  const getMedicineCostForVisit = (visitId: string) => {
    const rx = prescriptions.find(p => p.visit_id === visitId);
    if (!rx) return 0;

    let subtotal = 0;
    rx.medicines.forEach(m => {
      
      const matchedInv = inventory.find(inv => {
        const medNameDetail = m.name.toLowerCase();
        
        return medNameDetail.includes(inv.batch_number.toLowerCase()); 
      });

      if (matchedInv) {
        
        const dailyCount = m.dose.split("+").reduce((acc: number, curr: string) => acc + (parseInt(curr) || 0), 0);
        const durationDays = parseInt(m.duration) || 7;
        const totalPill = (dailyCount || 2) * durationDays;
        subtotal += totalPill * matchedInv.sell_price;
      } else {
        
        const dailyCount = m.dose.split("+").reduce((acc: number, curr: string) => acc + (parseInt(curr) || 0), 0);
        const durationDays = parseInt(m.duration) || 7;
        const totalPill = (dailyCount || 2) * durationDays;
        subtotal += totalPill * 8; 
      }
    });

    return subtotal;
  };

  const calculatedMedCharges = selectedVisitId ? getMedicineCostForVisit(selectedVisitId) : 0;
  const computedTotal = Math.max(0, (parseFloat(consultationFee) || 0) + calculatedMedCharges - (parseFloat(discount) || 0));

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId) {
      showToast("Please select a patient visit session.", "error");
      return;
    }

    try {
      await db.saveBilling({
        id: editingBillingId || undefined,
        visit_id: selectedVisitId,
        consultation_fee: parseFloat(consultationFee) || 0,
        medicine_charges: calculatedMedCharges,
        discount: parseFloat(discount) || 0,
        total: computedTotal,
        payment_status: paymentStatus,
        payment_method: paymentMethod
      });

      if (editingBillingId) {
        showToast("Invoice updated successfully!", "success");
      } else {
        showToast("Invoice processed and saved successfully!", "success");
      }
      
      
      setSelectedVisitId("");
      setDiscount("0");
      setPaymentStatus("paid");
      setPaymentMethod("cash");
      setEditingBillingId(null);
      setShowInvoiceCreator(false);

      await refreshData();
    } catch {
      showToast("Invoice logging failed.", "error");
    }
  };

  const startEditBilling = (b: BillingType) => {
    setSelectedVisitId(b.visit_id);
    setConsultationFee(b.consultation_fee.toString());
    setDiscount(b.discount.toString());
    setPaymentStatus(b.payment_status);
    setPaymentMethod(b.payment_method);
    setEditingBillingId(b.id);
    setShowInvoiceCreator(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBilling = async (id: string) => {
    setDeleteConfirmId(null);
    setBilling((prev) => prev.filter((b) => b.id !== id));
    showToast(`Receipt "${id}" deleted successfully.`, "success");

    try {
      await db.deleteBilling(id);
      await refreshData();
    } catch {
      showToast("Failed to delete invoice.", "error");
    }
  };

  const getPatientInfoForVisit = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return null;
    return patients.find(p => p.id === visit.patient_id);
  };

  const getBillingDate = (b: BillingType) => {
    const visit = visits.find(v => v.id === b.visit_id);
    if (visit?.visited_at) {
      return new Date(visit.visited_at);
    }
    if (b.id && b.id.startsWith("bil-")) {
      const ts = parseInt(b.id.substring(4));
      if (!isNaN(ts)) return new Date(ts);
    }
    return new Date();
  };

  const [filterMode, setFilterMode] = useState<'month' | 'date'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filteredBilling = billing.filter(b => {
    const bDate = getBillingDate(b);
    if (filterMode === 'date') {
      const filterYMD = selectedDate;
      const bYMD = bDate.toISOString().split('T')[0];
      return bYMD === filterYMD;
    } else {
      const now = new Date();
      return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
    }
  });

  
  const totalRevenue = filteredBilling.filter(b => b.payment_status === "paid").reduce((sum, item) => sum + Number(item.total), 0);
  const duesOutstanding = filteredBilling.filter(b => b.payment_status === "due").reduce((sum, item) => sum + Number(item.total), 0);
  
  const cashVolume = filteredBilling.filter(b => b.payment_status === "paid" && b.payment_method === "cash").reduce((sum, item) => sum + Number(item.total), 0);
  const bkashVolume = filteredBilling.filter(b => b.payment_status === "paid" && b.payment_method === "bkash").reduce((sum, item) => sum + Number(item.total), 0);
  const cardVolume = filteredBilling.filter(b => b.payment_status === "paid" && b.payment_method === "card").reduce((sum, item) => sum + Number(item.total), 0);

  
  const unbilledVisits = visits.filter(v => !billing.some(b => b.visit_id === v.id));

  const handlePrintSingleInvoice = (inv: BillingType) => {
    setSelectedInvoiceForPrint(inv);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="billing-tab">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">Pharmacy Receipts & Billing Desk</h2>
          <p className="text-xs text-slate-400">Generate prescription medicine invoices, track bKash or card collections, and view daily register settlements.</p>
        </div>

        <button
          onClick={() => {
            setEditingBillingId(null);
            setSelectedVisitId("");
            setDiscount("0");
            setPaymentStatus("paid");
            setPaymentMethod("cash");
            setConsultationFee(settings.consultation_fee.toString());
            setShowInvoiceCreator(!showInvoiceCreator);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto"
          id="new-invoice-btn"
        >
          <Plus className="h-4 w-4" /> Collect New Bill/Payment
        </button>
      </div>

      
      <div className="bg-white px-4 sm:px-5 py-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
            <Calendar className="h-4 w-4 text-theme-primary" /> Filter Billing Ledger:
          </span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-250/20 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('month')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer ${
                filterMode === 'month'
                  ? 'bg-white text-indigo-600 shadow-3xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('date')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer ${
                filterMode === 'date'
                  ? 'bg-white text-indigo-600 shadow-3xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Check Specific Date
            </button>
          </div>
        </div>

        {filterMode === 'date' && (
          <div className="flex items-center gap-2 animate-fade-in self-start lg:self-auto shrink-0">
            <span className="text-xs font-semibold text-slate-400">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 text-xs font-bold font-mono rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-700 bg-white cursor-pointer"
            />
          </div>
        )}

        <div className="text-left lg:text-right shrink-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 sm:px-2.5 py-1 rounded-md font-mono inline-block">
            {filterMode === 'month' 
              ? `Range: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} (Default)`
              : `Day: ${new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}`
            }
          </span>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-center space-y-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Collections</h4>
          <p className="text-2xl font-display font-bold text-slate-800">৳{totalRevenue}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-center space-y-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Dues</h4>
          <p className="text-2xl font-display font-medium text-amber-600">৳{duesOutstanding}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-center space-y-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Register</h4>
          <p className="text-2xl font-display font-bold text-emerald-600">৳{cashVolume}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-center space-y-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">bKash Account</h4>
          <p className="text-2xl font-display font-bold text-pink-600">৳{bkashVolume}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-center space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Settlement</div>
          <p className="text-2xl font-display font-bold text-indigo-600">৳{cardVolume}</p>
        </div>
      </div>

      {showInvoiceCreator && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-xs space-y-4 animate-fade-in no-print" id="billing-form-container">
          <h3 className="text-sm font-semibold text-sky-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <FileText className="h-4 w-4 text-indigo-600" /> {editingBillingId ? `Edit Bill Checkout / Receipt ${editingBillingId}` : "New Bill Checkout Form"}
          </h3>

          <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-semibold text-slate-500">Link Patient Visit (Sessions with no billed invoices)</label>
              <select
                required
                className="w-full text-xs border border-slate-200 rounded-lg p-3 bg-white text-slate-700"
                value={selectedVisitId}
                onChange={(e) => setSelectedVisitId(e.target.value)}
              >
                <option value="">-- Choose active unbilled session --</option>
                {editingBillingId && (() => {
                  const item = billing.find(b => b.id === editingBillingId);
                  const linkedVisit = visits.find(v => v.id === item?.visit_id);
                  const pat = linkedVisit ? patients.find(p => p.id === linkedVisit.patient_id) : null;
                  if (linkedVisit && pat) {
                    return (
                      <option value={linkedVisit.id}>
                        [ACTIVE EDIT] {pat.full_name} ({pat.patient_code}) — {new Date(linkedVisit.visited_at).toLocaleDateString()} — "{linkedVisit.chief_complaint}"
                      </option>
                    );
                  }
                  return null;
                })()}
                {unbilledVisits.map((v) => {
                  const pat = patients.find(p => p.id === v.patient_id);
                  return (
                    <option key={v.id} value={v.id}>
                      {pat?.full_name} ({pat?.patient_code}) — {new Date(v.visited_at).toLocaleDateString()} — "{v.chief_complaint}"
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 flex flex-col justify-center gap-1">
              <span className="flex items-center justify-between text-slate-400">MEDICINE DISPENSING CHARGES</span>
              <span className="text-lg text-slate-800 font-display">৳{calculatedMedCharges}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Consultation Fee (৳)</label>
              <input
                type="number"
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Clinical Discount (৳)</label>
              <input
                type="number"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Payment Status</label>
              <select
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 font-bold"
                value={paymentStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentStatus(e.target.value as 'paid' | 'due' | 'waived')}
              >
                <option value="paid">✅ Paid (Authorized Settlement)</option>
                <option value="due">⚠️ Due outstanding</option>
                <option value="waived">Waived (No Fee Charge)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 font-bold text-pink-700">bKash/Cash Payment Method</label>
              <select
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 font-bold"
                value={paymentMethod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value as 'cash' | 'bkash' | 'card')}
              >
                <option value="cash">💵 Liquid Cash</option>
                <option value="bkash">📱 bKash (Mobile Account Pay)</option>
                <option value="card">💳 Visa/Debit Card</option>
              </select>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between col-span-2">
              <div>
                <span className="block text-[10px] font-bold text-indigo-500 uppercase">Grand Total to collect</span>
                <span className="text-2xl font-display font-extrabold text-indigo-900">৳{computedTotal}</span>
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs"
              >
                Save Receipt
              </button>
            </div>

          </form>
        </div>
      )}

      
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        <div className="px-6 py-4 border-b border-indigo-50/50 bg-slate-50/30">
          <h3 className="text-sm font-semibold text-slate-800">Historic Transactions ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Patient identity</th>
                <th className="p-4 text-right">Consult Charge</th>
                <th className="p-4 text-right">Dispensing Cost</th>
                <th className="p-4 text-right">Discount</th>
                <th className="p-4 text-right">Total Fee collected</th>
                <th className="p-4">Settlement Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBilling.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No billing logs found for the selected time range. Use the checkout form to log patient sales.
                  </td>
                </tr>
              ) : (
                filteredBilling.map((b) => {
                  const pat = getPatientInfoForVisit(b.visit_id);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-500">{b.id}</td>
                      <td className="p-4 font-semibold text-slate-800 font-bengali">
                        {pat ? pat.full_name : "Unlinked Patient"}
                        <span className="block text-[10px] font-normal text-slate-400 font-mono">{pat?.patient_code}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold">৳{b.consultation_fee?.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-slate-500">৳{b.medicine_charges?.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-red-500">-৳{b.discount?.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-extrabold text-indigo-900 text-sm">৳{b.total?.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          b.payment_status === "paid" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : b.payment_status === "due"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          <span className="capitalize">{b.payment_status}</span> • <span className="uppercase">{b.payment_method}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {deleteConfirmId === b.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-lg animate-fade-in">
                              <span className="text-[10px] font-bold text-red-700 px-1">Delete?</span>
                              <button
                                onClick={() => handleDeleteBilling(b.id)}
                                title="Confirm Delete"
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                title="Cancel"
                                className="px-2 py-0.5 bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded transition-all cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditBilling(b)}
                                title="Edit Invoice"
                                className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-md transition-all cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(b.id)}
                                title="Delete Invoice"
                                className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-md transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      
      
      {selectedInvoiceForPrint && (
        <div className="hidden print:block print-area text-black font-sans leading-relaxed text-xs max-w-sm mx-auto p-4 border-2 border-black" id="print-invoice-receipt">
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-black">
            <h2 className="text-base font-bold uppercase">{settings.clinic_name}</h2>
            <p className="text-[10px]">{settings.address}</p>
            <p className="text-[10px]">Tel: {settings.phone}</p>
            <h3 className="text-[11px] font-bold border border-black inline-block px-1.5 mt-1">PATIENT CASH RECEIPT</h3>
          </div>

          <div className="py-3 text-[10px] space-y-1 font-semibold border-b border-dashed border-black">
            <p><strong>Receipt ID:</strong> <span className="font-mono">{selectedInvoiceForPrint.id}</span></p>
            <p><strong>Patient code:</strong> <span className="font-mono">{getPatientInfoForVisit(selectedInvoiceForPrint.visit_id)?.patient_code}</span></p>
            <p><strong>Patient Name:</strong> <span className="font-bengali">{getPatientInfoForVisit(selectedInvoiceForPrint.visit_id)?.full_name}</span></p>
            <p><strong>Date Code:</strong> {new Date().toLocaleDateString()}</p>
          </div>

          <table className="w-full text-left py-2 font-semibold">
            <thead>
              <tr className="border-b border-black text-[9px] uppercase">
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Amount BDT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-[10px]">
                <td className="py-1.5">General consultation fees (Dr. Altaf)</td>
                <td className="py-1.5 text-right">৳{selectedInvoiceForPrint.consultation_fee?.toFixed(2)}</td>
              </tr>
              <tr className="text-[10px]">
                <td className="py-1.5">Pharmacy Dispensed Medicines Subtotal</td>
                <td className="py-1.5 text-right">৳{selectedInvoiceForPrint.medicine_charges?.toFixed(2)}</td>
              </tr>
              {selectedInvoiceForPrint.discount > 0 && (
                <tr className="text-[10px] text-slate-600">
                  <td className="py-1.5">Doctor's Discount applied</td>
                  <td className="py-1.5 text-right">-৳{selectedInvoiceForPrint.discount?.toFixed(2)}</td>
                </tr>
              )}
              <tr className="border-t border-black font-extrabold text-[11px]">
                <td className="py-2">Grand Total Fee Charged</td>
                <td className="py-2 text-right">৳{selectedInvoiceForPrint.total?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-3 border-t border-dashed border-black space-y-1">
            <p className="text-center font-bold">Payment Method: <span className="uppercase">{selectedInvoiceForPrint.payment_method}</span> ({selectedInvoiceForPrint.payment_status === "paid" ? "PAID IN FULL" : "DUE"})</p>
            <p className="text-[9px] text-center text-slate-500 mt-2">✨ Thank you for choosing Altaf Shifakhana & Pharmacy! Stay healthy. ✨</p>
          </div>
        </div>
      )}

    </div>
  );
}
