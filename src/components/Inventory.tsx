import React, { useState } from "react";
import { useApp } from "../AppContext";
import { db } from "../db";
import { InventoryItem } from "../types";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  ShieldAlert, 
  Trash2, 
  User, 
  Calendar, 
  DollarSign,
  Pencil
} from "lucide-react";

export function Inventory() {
  const { medicines, inventory, refreshData, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);

  
  const [genericName, setGenericName] = useState("");
  const [brandNamesInput, setBrandNamesInput] = useState("");
  const [category, setCategory] = useState("analgesic");
  const [unit, setUnit] = useState("tablet");
  const [commonDosages, setCommonDosages] = useState("500mg");

  
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [lowStockThreshold, setLowStockThreshold] = useState("50");
  const [purchasePrice, setPurchasePrice] = useState("1.50");
  const [sellPrice, setSellPrice] = useState("2.50");
  const [supplier, setSupplier] = useState("");

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genericName) {
      showToast("Generic name is required to log drugs", "error");
      return;
    }

    try {
      
      const brandNames = brandNamesInput 
        ? brandNamesInput.split(",").map(b => b.trim()).filter(Boolean)
        : [];
      
      const existingItem = editingInventoryId ? inventory.find(i => i.id === editingInventoryId) : null;
      const mSaved = await db.saveMedicine({
        id: existingItem ? existingItem.medicine_id : undefined,
        generic_name: genericName,
        brand_names: brandNames,
        category,
        unit,
        common_dosages: [commonDosages]
      });

      
      await db.saveInventoryItem({
        id: editingInventoryId || undefined,
        medicine_id: mSaved.id,
        batch_number: batchNumber || `BAT-${Date.now().toString().slice(-4)}`,
        expiry_date: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: parseInt(quantity) || 100,
        low_stock_threshold: parseInt(lowStockThreshold) || 50,
        purchase_price: parseFloat(purchasePrice) || 1.5,
        sell_price: parseFloat(sellPrice) || 2.50,
        supplier: supplier || "Direct-Pharma Bangladesh"
      });

      if (editingInventoryId) {
        showToast(`Stock batch updated successfully!`, "success");
      } else {
        showToast(`Medicine and initial batch registered successfully!`, "success");
      }
      
      
      setGenericName("");
      setBrandNamesInput("");
      setBatchNumber("");
      setExpiryDate("");
      setQuantity("100");
      setLowStockThreshold("50");
      setPurchasePrice("1.50");
      setSellPrice("2.50");
      setSupplier("");
      setEditingInventoryId(null);
      setShowAddForm(false);

      await refreshData();
    } catch {
      showToast("Inventory logging failure.", "error");
    }
  };

  const startEditInventory = (item: InventoryItem) => {
    const med = medicines.find(m => m.id === item.medicine_id);
    if (!med) return;

    setGenericName(med.generic_name);
    setBrandNamesInput(med.brand_names?.join(", ") || "");
    setCategory(med.category);
    setUnit(med.unit);
    setCommonDosages(med.common_dosages?.[0] || "5000mg");
    setBatchNumber(item.batch_number);
    setExpiryDate(item.expiry_date);
    setQuantity(item.quantity.toString());
    setLowStockThreshold(item.low_stock_threshold.toString());
    setPurchasePrice(item.purchase_price.toString());
    setSellPrice(item.sell_price.toString());
    setSupplier(item.supplier || "");
    setEditingInventoryId(item.id);
    setShowAddForm(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteInventory = async (itemId: string, batchCode: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete batch "${batchCode}" from the pharmacy stock ledger?`);
    if (!confirmDelete) return;

    try {
      await db.deleteInventoryItem(itemId);
      showToast(`Stock batch "${batchCode}" deleted successfully.`, "success");
      await refreshData();
    } catch {
      showToast("Failed to delete stock batch.", "error");
    }
  };

  const getDaysUntilExpiry = (expiryDateString: string) => {
    const diff = new Date(expiryDateString).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpirySeverityStyles = (expiryDateString: string) => {
    const days = getDaysUntilExpiry(expiryDateString);
    if (days <= 0) {
      return { text: "Expired", bg: "bg-red-100 text-red-800 border-red-200" };
    }
    if (days <= 30) {
      return { text: `Critical Expiry: ${days} days`, bg: "bg-red-50 border-red-150 text-red-700 animate-pulse font-bold" };
    }
    if (days <= 60) {
      return { text: `Near Expiry: ${days} days`, bg: "bg-amber-100 border-amber-200 text-amber-800 font-semibold" };
    }
    return { text: `${days} days left`, bg: "bg-slate-100 text-slate-600 border-slate-200" };
  };

  const getStockSeverityStyles = (qty: number, threshold: number) => {
    if (qty <= 0) {
      return "bg-red-100 text-red-800 font-bold border-red-200";
    }
    if (qty <= threshold) {
      return "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-100 font-medium";
  };

  
  const filteredInventory = inventory.filter(item => {
    const med = medicines.find(m => m.id === item.medicine_id);
    if (!med) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      med.generic_name.toLowerCase().includes(q) ||
      med.brand_names.some(b => b.toLowerCase().includes(q)) ||
      item.batch_number.toLowerCase().includes(q)
    );
  });

  const getMedicineInfo = (id: string) => {
    return medicines.find(m => m.id === id);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-tab">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">Pharmacy Medication Inventory</h2>
          <p className="text-xs text-slate-400">Manage generic catalog lists, pricing ledger values, and batch shelf expiration alerts.</p>
        </div>

        <button
          onClick={() => {
            setEditingInventoryId(null);
            setGenericName("");
            setBrandNamesInput("");
            setBatchNumber("");
            setExpiryDate("");
            setQuantity("100");
            setLowStockThreshold("50");
            setPurchasePrice("1.50");
            setSellPrice("2.50");
            setSupplier("");
            setShowAddForm(!showAddForm);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto"
          id="add-medicine-btn"
        >
          <Plus className="h-4 w-4" /> Add Medication Batch
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-indigo-150 shadow-xs space-y-4 animate-fade-in" id="inventory-form-container">
          <h3 className="text-sm font-semibold text-sky-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Package className="h-4 w-4 text-indigo-600" /> {editingInventoryId ? "Edit Medication Batch Record" : "Catalog New Drug & Batch Record"}
          </h3>

          <form onSubmit={handleAddInventory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500">Generic Formula Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol, Amoxicillin, Esomeprazole"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Popular Brands list (separated by comma)</label>
              <input
                type="text"
                placeholder="e.g. Napa, Ace, Pyrexin"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={brandNamesInput}
                onChange={(e) => setBrandNamesInput(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Category</label>
              <select
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="analgesic">Analgesic (Antipyretic)</option>
                <option value="antibiotic">Antibiotic (Antibacterial)</option>
                <option value="antacid">Antacid (Acid reflux)</option>
                <option value="antidiabetic">Antidiabetic insulin assistance</option>
                <option value="antihypertensive">Antihypertensive (Cardio protection)</option>
                <option value="antihistamine">Antihistamine (Allergy control)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Unit Type</label>
              <select
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="tablet">Tablets (Pills)</option>
                <option value="capsule">Capsules (Shell capsules)</option>
                <option value="syrup">Liquid Syrup (Concentrate)</option>
                <option value="injection">Injections / Ampoules</option>
                <option value="ointment">Salves & Ointments</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Default Brand Strength</label>
              <input
                type="text"
                placeholder="e.g. 500mg, 20mg, 5ml"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={commonDosages}
                onChange={(e) => setCommonDosages(e.target.value)}
              />
            </div>

            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Batch Number Code</label>
              <input
                type="text"
                placeholder="e.g. BAT-209"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 text-red-600 flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" /> Expiration Date
              </label>
              <input
                type="date"
                required
                className="w-full text-sm border border-red-200 bg-red-50/10 rounded-lg p-2.5 focus:border-red-500 focus:outline-hidden text-red-700"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Stock Quantity (In-pack units)</label>
              <input
                type="number"
                required
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Alert Stock Threshold</label>
              <input
                type="number"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Unit Purchase Price (৳)</label>
              <input
                type="number"
                step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Retail Selling Price (৳)</label>
              <input
                type="number"
                step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-semibold text-slate-500">Supplier/Manufacturer Name</label>
              <input
                type="text"
                placeholder="e.g. Square Pharmaceuticals Ltd, Beximco, Incepta"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-600 focus:outline-hidden"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingInventoryId(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                {editingInventoryId ? "Save Batch Changes" : "Log to Ledger"}
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
            placeholder="Search catalog by brand name, generic formulation, batch code..."
            className="w-full text-sm focus:outline-hidden border-none text-slate-700 font-medium placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="inventory-search-field"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Clear
            </button>
          )}
        </div>

        
        <div className="overflow-x-auto divide-y divide-slate-150">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Formula Details</th>
                <th className="p-4">Brand Matches</th>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Audited Expiry</th>
                <th className="p-4 text-center">Remaining Stock</th>
                <th className="p-4 text-right">Cost (Cost/Sell)</th>
                <th className="p-4">Main Supplier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    No matching medicines in the catalog roster.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const m = getMedicineInfo(item.medicine_id);
                  if (!m) return null;
                  const expCheck = getExpirySeverityStyles(item.expiry_date);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">
                        <div className="text-sm font-bold text-slate-800">{m.generic_name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold capitalize mt-0.5">{m.category} • {m.unit}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {m.brand_names?.join(", ") || "No recorded brands"}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-500">{item.batch_number}</td>
                      <td className="p-4">
                        <span className={`inline-block border text-[10px] px-2.5 py-1 rounded-sm ${expCheck.bg}`}>
                          {expCheck.text}
                        </span>
                      </td>
                      <td className="p-4 text-center justify-center">
                        <span className={`inline-block border text-[10px] px-2.5 py-1 rounded-md ${getStockSeverityStyles(item.quantity, item.low_stock_threshold)}`}>
                          {item.quantity} units left
                        </span>
                        {item.quantity <= item.low_stock_threshold && (
                          <span className="block text-[10px] text-amber-600 font-bold mt-1">⚠️ Below limit</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-700">
                        <div>৳{item.sell_price?.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Buy: ৳{item.purchase_price?.toFixed(2)}</div>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{item.supplier || "—"}</td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEditInventory(item)}
                            title="Edit Batch"
                            className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-md transition-all cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInventory(item.id, item.batch_number)}
                            title="Delete Batch"
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-md transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      </div>

    </div>
  );
}
