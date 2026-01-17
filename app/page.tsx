"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, User, Calculator, TrendingDown, Save, 
  Smartphone, RefreshCw, Trash2, Package, FileText, LogOut, Wallet
} from 'lucide-react';

// --- Types ---
interface Transaction {
  id: number;
  date: string;
  type: 'bill' | 'credit' | 'accessories';
  customerName: string;
  sellPrice: number;
  costPrice: number; // في الرصيد: هي حصة أنس | في الإكسسوار: هي رأس المال
  profit: number;
  isDebt: boolean;
  debtPaid: boolean;
  supplierPaid: boolean; // خاصة بحساب أنس فقط
}

interface Expense {
  id: number;
  date: string;
  name: string;
  amount: number;
}

interface SupplierSettlement {
  id: number;
  date: string;
  amount: number;
  note: string;
}

const MobileShopSystem: React.FC = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState<'sales' | 'supplier' | 'expenses'>('sales');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplierHistory, setSupplierHistory] = useState<SupplierSettlement[]>([]);
  
  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Form Inputs
  const [type, setType] = useState<Transaction['type']>('credit'); // Default to credit based on usage
  const [customerName, setCustomerName] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [manualCostPrice, setManualCostPrice] = useState<string>(''); // For Accessories/Bills
  const [isDebt, setIsDebt] = useState<boolean>(false);

  // Expenses Form
  const [expenseName, setExpenseName] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');

  // --- Persistence ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTrans = localStorage.getItem('shop_transactions');
      const savedExp = localStorage.getItem('shop_expenses');
      const savedSupp = localStorage.getItem('shop_supplier');
      if (savedTrans) setTransactions(JSON.parse(savedTrans));
      if (savedExp) setExpenses(JSON.parse(savedExp));
      if (savedSupp) setSupplierHistory(JSON.parse(savedSupp));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shop_transactions', JSON.stringify(transactions));
      localStorage.setItem('shop_expenses', JSON.stringify(expenses));
      localStorage.setItem('shop_supplier', JSON.stringify(supplierHistory));
    }
  }, [transactions, expenses, supplierHistory]);

  // --- Core Calculations ---
  
  // 1. حساب أنس (فقط لعمليات الرصيد)
  // الرصيد: الكلفة تلقائية 7%، وهو الوحيد الذي يدخل في حساب المندوب
  const supplierBalance = transactions
    .filter(t => t.type === 'credit' && !t.supplierPaid)
    .reduce((sum, t) => sum + t.costPrice, 0);

  // 2. الديون التي لنا عند الزبائن
  const totalDebts = transactions
    .filter(t => t.isDebt && !t.debtPaid)
    .reduce((sum, t) => sum + t.sellPrice, 0);

  // 3. إجمالي الأرباح (مربح الرصيد + مربح الإكسسوارات والفواتير)
  const grossProfit = transactions.reduce((sum, t) => sum + t.profit, 0);

  // 4. المصاريف التشغيلية (أجار، كهرباء...)
  const totalOpsExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 5. كلفة البضاعة المباعة (فقط للإكسسوارات والفواتير) - هذا هو "رأس المال" الذي خرج من المحل
  const totalMerchandiseCost = transactions
    .filter(t => t.type === 'accessories' || t.type === 'bill')
    .reduce((sum, t) => sum + t.costPrice, 0);

  // 6. خانة "المصاريف الكلية" المطلوبة (مصاريف تشغيلية + رأس مال بضاعة مباعة) - بدون أنس
  const totalExpensesDisplay = totalOpsExpenses + totalMerchandiseCost;

  // 7. صافي الربح النهائي (الربح الإجمالي - المصاريف التشغيلية)
  // ملاحظة: لا نطرح رأس مال البضاعة هنا لأننا طرحناه مسبقاً لحساب الـ Profit في كل عملية
  const netProfit = grossProfit - totalOpsExpenses;


  // --- Handlers ---

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellPrice) return;

    const currentSell = parseFloat(sellPrice);
    let calculatedCost = 0;
    let calculatedProfit = 0;

    // المنطق الجديد حسب النوع
    if (type === 'credit') {
      // رصيد: معادلة ثابتة
      calculatedCost = Math.round(currentSell * 0.07); // حصة أنس
      calculatedProfit = Math.round(currentSell * 0.13); // ربحي
    } else {
      // إكسسوار أو فاتورة: إدخال يدوي
      calculatedCost = manualCostPrice ? parseFloat(manualCostPrice) : 0; // رأس المال
      calculatedProfit = currentSell - calculatedCost; // الربح الصافي
    }

    const newTrans: Transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type,
      customerName: customerName || 'زبون عام',
      sellPrice: currentSell,
      costPrice: calculatedCost,
      profit: calculatedProfit,
      isDebt,
      debtPaid: false,
      supplierPaid: false
    };

    setTransactions([newTrans, ...transactions]);
    // Reset Form
    setCustomerName(''); setSellPrice(''); setManualCostPrice(''); setIsDebt(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;
    const newExp: Expense = {
      id: Date.now(),
      date: new Date().toISOString(),
      name: expenseName || 'مصروف',
      amount: parseFloat(expenseAmount)
    };
    setExpenses([newExp, ...expenses]);
    setExpenseName(''); setExpenseAmount('');
  };

  const markDebtAsPaid = (id: number) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, debtPaid: true } : t));
  };

  const deleteTransaction = (id: number) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setShowDeleteConfirm(null);
  };

  const settleSupplierAccount = () => {
    if (supplierBalance <= 0) return;
    const settlement: SupplierSettlement = {
      id: Date.now(),
      date: new Date().toISOString(),
      amount: supplierBalance,
      note: 'تصفية حساب الرصيد (أنس)'
    };
    setSupplierHistory([settlement, ...supplierHistory]);
    // فقط عمليات الرصيد هي التي يتم تصفيتها مع أنس
    setTransactions(transactions.map(t => 
      (t.type === 'credit') && !t.supplierPaid 
      ? { ...t, supplierPaid: true } : t
    ));
  };

  const resetAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      setTransactions([]);
      setExpenses([]);
      setSupplierHistory([]);
      setShowResetConfirm(false);
    }
  };

  // --- UI Helpers ---
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
    
  const formatDate = (isoString: string) => 
    new Date(isoString).toLocaleDateString('ar-SY', { weekday: 'short', day: 'numeric', month: 'numeric' });

  // Get Icon based on type
  const getTypeIcon = (t: Transaction['type']) => {
    if (t === 'credit') return <Smartphone size={20} />;
    if (t === 'accessories') return <Package size={20} />;
    return <FileText size={20} />;
  };

  const getTypeName = (t: Transaction['type']) => {
    if (t === 'credit') return 'رصيد';
    if (t === 'accessories') return 'إكسسوار';
    return 'فاتورة';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right pb-24 select-none" dir="rtl">
      
      {/* Header Statisctics */}
      <header className="bg-indigo-700 text-white p-5 shadow-lg sticky top-0 z-20 rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Wallet className="w-6 h-6" /> لؤلؤة الموبايل
            </h1>
            <p className="text-indigo-200 text-[10px] mt-1">نظام إدارة المحل الذكي</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/20 min-w-[100px]">
            <div className="text-[10px] text-indigo-100 mb-1">صافي الأرباح</div>
            <div className="text-xl font-black leading-none text-green-300">{formatMoney(netProfit)}</div>
          </div>
        </div>

        {/* The New Expenses Box Requested */}
        <div className="grid grid-cols-3 gap-2">
          {/* Box 1: المصاريف الكلية (تشغيلية + رأس مال بضاعة) */}
          <div className="bg-red-500/20 border border-red-500/30 p-2 rounded-xl text-center">
             <div className="text-[9px] text-red-100 font-bold mb-1">كل المصاريف</div>
             <div className="text-sm font-black text-white">{formatMoney(totalExpensesDisplay)}</div>
          </div>
          
          {/* Box 2: ديون لنا */}
          <div className="bg-orange-500/20 border border-orange-500/30 p-2 rounded-xl text-center">
             <div className="text-[9px] text-orange-100 font-bold mb-1">ديون ع الزبائن</div>
             <div className="text-sm font-black text-white">{formatMoney(totalDebts)}</div>
          </div>

          {/* Box 3: حساب أنس (رصيد فقط) */}
          <div className="bg-purple-500/20 border border-purple-500/30 p-2 rounded-xl text-center">
             <div className="text-[9px] text-purple-100 font-bold mb-1">للمندوب (أنس)</div>
             <div className="text-sm font-black text-white">{formatMoney(supplierBalance)}</div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-6">
        {activeTab === 'sales' && (
          <div className="space-y-5">
            {/* Sales Form */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <form onSubmit={handleAddTransaction} className="space-y-4">
                
                {/* Type & Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 mr-2">نوع العملية</label>
                    <select 
                      value={type} 
                      onChange={(e) => {
                        setType(e.target.value as any);
                        setManualCostPrice(''); // Reset manual cost when switching
                      }} 
                      className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                    >
                      <option value="credit">رصيد (نسبة)</option>
                      <option value="accessories">إكسسوار (ربح)</option>
                      <option value="bill">فاتورة (ربح)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 mr-2">اسم الزبون</label>
                    <input type="text" placeholder="عام" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
                  </div>
                </div>

                {/* Conditional Inputs based on Type */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {type === 'credit' ? (
                     // --- Credit Mode (Auto Calc) ---
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 mr-2">المبلغ (رصيد محول)</label>
                       <input 
                           type="number" 
                           placeholder="مثلاً: 5000" 
                           value={sellPrice} 
                           onChange={(e) => setSellPrice(e.target.value)} 
                           className="w-full p-3 bg-white border-none rounded-xl font-black text-indigo-600 text-lg shadow-sm" 
                           required 
                       />
                       <div className="flex justify-between px-2 mt-2">
                          <span className="text-[10px] text-purple-500 font-bold">لأنس (7%): {sellPrice ? formatMoney(Math.round(parseFloat(sellPrice)*0.07)) : '0'}</span>
                          <span className="text-[10px] text-green-600 font-bold">ربحي (13%): {sellPrice ? formatMoney(Math.round(parseFloat(sellPrice)*0.13)) : '0'}</span>
                       </div>
                     </div>
                  ) : (
                    // --- Accessories/Bill Mode (Manual) ---
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 mr-2">سعر المبيع</label>
                        <input 
                            type="number" 
                            placeholder="بعنا بـ..." 
                            value={sellPrice} 
                            onChange={(e) => setSellPrice(e.target.value)} 
                            className="w-full p-3 bg-white border-none rounded-xl font-black text-green-600 text-lg shadow-sm" 
                            required 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 mr-2">رأس المال</label>
                        <input 
                            type="number" 
                            placeholder="علينا بـ..." 
                            value={manualCostPrice} 
                            onChange={(e) => setManualCostPrice(e.target.value)} 
                            className="w-full p-3 bg-white border-none rounded-xl font-black text-red-500 text-lg shadow-sm" 
                            required 
                        />
                      </div>
                      
                      {/* Live Profit Preview */}
                      <div className="col-span-2 text-center mt-1">
                        {sellPrice && manualCostPrice && (
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            صافي الربح: {formatMoney(parseFloat(sellPrice) - parseFloat(manualCostPrice))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl flex-1">
                    <input type="checkbox" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                    <span className="text-xs font-bold text-gray-600">تسجيل دين؟</span>
                  </label>
                  
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white p-3 rounded-xl font-black text-md shadow-lg shadow-indigo-200 active:scale-95 transition-transform">
                    <Save size={18} className="inline ml-2" /> حفظ
                  </button>
                </div>
              </form>
            </div>

            {/* Transactions List */}
            <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-gray-800">سجل الحركة اليومي</h3>
                <button onClick={() => setShowResetConfirm(true)} className="text-red-400 text-[10px] font-bold flex items-center gap-1"><LogOut size={12}/> تصفير</button>
            </div>

            <div className="space-y-3 pb-8">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex justify-between items-center group relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      t.type === 'credit' ? 'bg-purple-50 text-purple-600' :
                      t.type === 'accessories' ? 'bg-orange-50 text-orange-600' : 
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {getTypeIcon(t.type)}
                    </div>
                    <div>
                      <div className="font-black text-sm text-gray-800 flex items-center gap-2">
                        {t.customerName}
                        <span className="text-[9px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-normal">{getTypeName(t.type)}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold mt-1">
                        {formatDate(t.date)} • 
                        <span className="text-green-600 mr-1">ربح: {formatMoney(t.profit)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <div className="font-black text-gray-800 text-lg leading-none">{formatMoney(t.sellPrice)}</div>
                    {t.isDebt && !t.debtPaid ? (
                      <button onClick={() => markDebtAsPaid(t.id)} className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full mt-2 font-black animate-pulse">تسديد الدين</button>
                    ) : (
                      <span className={`text-[9px] font-black mt-2 ${t.isDebt ? 'text-green-600' : 'text-gray-300'}`}>{t.isDebt ? 'تم السداد' : 'كاش'}</span>
                    )}
                  </div>
                  <button onClick={() => setShowDeleteConfirm(t.id)} className="absolute left-0 top-0 bottom-0 bg-red-50 text-red-500 px-4 opacity-0 group-hover:opacity-100 flex items-center transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-10 text-gray-300 text-sm font-bold">لا توجد عمليات اليوم</div>
              )}
            </div>
          </div>
        )}

        {/* --- Supplier (Anas) Tab --- */}
        {activeTab === 'supplier' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-8 rounded-[2.5rem] text-white text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-purple-200 text-xs font-bold mb-2 uppercase italic">حساب الرصيد والوحدات</p>
              <h2 className="text-4xl font-black mb-6">{formatMoney(supplierBalance)}</h2>
              <div className="text-[10px] text-purple-300 mb-6 bg-black/20 inline-block px-3 py-1 rounded-full">
                * يشمل فقط حصة 7% من عمليات الرصيد
              </div>
              <button onClick={settleSupplierAccount} disabled={supplierBalance <= 0} className={`w-full py-4 rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 transition-all ${supplierBalance > 0 ? 'bg-white text-purple-900 hover:scale-105' : 'bg-white/10 text-white/50 cursor-not-allowed'}`}>
                <RefreshCw size={20} /> تصفية ودفع لأنس
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-black text-gray-800 mb-4 border-b pb-3">سجل الدفعات لأنس</h3>
              <div className="space-y-3">
                {supplierHistory.map(h => (
                  <div key={h.id} className="flex justify-between items-center py-3 border-b last:border-0 text-sm">
                    <span className="text-gray-400 font-bold">{formatDate(h.date)}</span>
                    <span className="font-black text-green-600">تم دفع {formatMoney(h.amount)}</span>
                  </div>
                ))}
                {supplierHistory.length === 0 && <p className="text-gray-300 text-xs text-center">لا توجد دفعات سابقة</p>}
              </div>
            </div>
          </div>
        )}

        {/* --- Expenses Tab --- */}
        {activeTab === 'expenses' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-red-50">
              <h3 className="font-black text-gray-800 mb-5 text-lg flex items-center gap-2"><TrendingDown className="text-red-500"/> مصاريف تشغيلية</h3>
              <p className="text-xs text-gray-400 mb-4">هنا تسجل أجار المحل، الكهرباء، الضيافة... (رأس مال البضاعة يسجل تلقائياً من المبيعات)</p>
              <div className="space-y-4">
                <input type="text" placeholder="اسم المصروف (كهرباء، غداء...)" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                <input type="number" placeholder="المبلغ" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-red-600 text-lg" />
                <button onClick={handleAddExpense} className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 transition-colors">تسجيل المصروف</button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-4 italic">
                <h3 className="font-black text-gray-800">سجل المصاريف التشغيلية</h3>
                <span className="text-red-600 font-black">{formatMoney(totalOpsExpenses)}</span>
              </div>
              <div className="space-y-3">
                {expenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl text-sm font-bold">
                    <span className="text-gray-600">{e.name}</span>
                    <span className="font-black text-red-600">-{formatMoney(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
            <h4 className="font-black text-xl mb-2">حذف العملية؟</h4>
            <p className="text-gray-400 text-xs mb-6">لا يمكن التراجع عن هذا الإجراء</p>
            <div className="flex gap-3">
              <button onClick={() => deleteTransaction(showDeleteConfirm)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black">نعم، حذف</button>
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-black text-gray-600">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center border-2 border-red-100">
            <h4 className="font-black text-xl mb-6 text-red-600">فورمات كامل للنظام؟</h4>
            <p className="text-sm text-gray-500 mb-8 font-bold">سيتم مسح كل الأرقام والديون وحساب أنس!</p>
            <div className="flex gap-3">
              <button onClick={resetAllData} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-200">نعم، فرمتة</button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 pt-4 px-6 z-30 flex justify-around items-center rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'sales' ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}>
          <PlusCircle size={28} strokeWidth={activeTab === 'sales' ? 2.5 : 2} /> 
          <span className="text-[10px] font-black">البيع</span>
        </button>
        <button onClick={() => setActiveTab('supplier')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'supplier' ? 'text-purple-600 scale-110' : 'text-gray-300'}`}>
          <User size={28} strokeWidth={activeTab === 'supplier' ? 2.5 : 2} /> 
          <span className="text-[10px] font-black">أنس</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'expenses' ? 'text-red-500 scale-110' : 'text-gray-300'}`}>
          <TrendingDown size={28} strokeWidth={activeTab === 'expenses' ? 2.5 : 2} /> 
          <span className="text-[10px] font-black">المصاريف</span>
        </button>
      </footer>
    </div>
  );
};

export default MobileShopSystem;