"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, User, Calculator, TrendingDown, Save, 
  Smartphone, RefreshCw, Trash2, CheckCircle, AlertCircle, LogOut 
} from 'lucide-react';

// --- Types & Interfaces ---
interface Transaction {
  id: number;
  date: string;
  type: 'bill' | 'credit' | 'accessories';
  customerName: string;
  sellPrice: number;
  costPrice: number;
  profit: number;
  isDebt: boolean;
  debtPaid: boolean;
  supplierPaid: boolean;
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
  const [activeTab, setActiveTab] = useState<'sales' | 'supplier' | 'expenses'>('sales');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplierHistory, setSupplierHistory] = useState<SupplierSettlement[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const [type, setType] = useState<Transaction['type']>('bill');
  const [customerName, setCustomerName] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [isDebt, setIsDebt] = useState<boolean>(false);

  const [expenseName, setExpenseName] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');

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

  // --- Calculations (13% Profit, 7% Anas) ---
  const calculateProfit = (sell: string): number => 
    Math.round(parseFloat(sell || '0') * 0.13);

  const calculateAnasShare = (sell: string): number =>
    Math.round(parseFloat(sell || '0') * 0.07);

  const supplierBalance = transactions
    .filter(t => (t.type === 'bill' || t.type === 'credit') && !t.supplierPaid)
    .reduce((sum, t) => sum + t.costPrice, 0);

  const totalDebts = transactions
    .filter(t => t.isDebt && !t.debtPaid)
    .reduce((sum, t) => sum + t.sellPrice, 0);

  const grossProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
  const totalExpensesVal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpensesVal;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellPrice) return;

    const currentSell = parseFloat(sellPrice);
    const newTrans: Transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type,
      customerName: customerName || 'زبون عام',
      sellPrice: currentSell,
      // إذا أدخلتِ كلفة يدوياً استخدميها، وإلا احسب 7% تلقائياً
      costPrice: costPrice ? parseFloat(costPrice) : calculateAnasShare(sellPrice),
      profit: calculateProfit(sellPrice),
      isDebt,
      debtPaid: false,
      supplierPaid: false
    };

    setTransactions([newTrans, ...transactions]);
    setCustomerName(''); setSellPrice(''); setCostPrice(''); setIsDebt(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;
    const newExp: Expense = {
      id: Date.now(),
      date: new Date().toISOString(),
      name: expenseName || 'مصروف عام',
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
      note: 'تصفية حساب المندوب (أنس)'
    };
    setSupplierHistory([settlement, ...supplierHistory]);
    setTransactions(transactions.map(t => 
      (t.type === 'bill' || t.type === 'credit') && !t.supplierPaid 
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

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
    
  const formatDate = (isoString: string) => 
    new Date(isoString).toLocaleDateString('ar-SY', { weekday: 'short', day: 'numeric', month: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right pb-24 select-none" dir="rtl">
      <header className="bg-indigo-700 text-white p-5 shadow-lg sticky top-0 z-20 rounded-b-[2rem]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Smartphone className="w-6 h-6" /> نظام المحل
            </h1>
            <p className="text-indigo-200 text-[10px] mt-1">حسابات دقيقة 13% | 7%</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/20">
            <div className="text-[10px] text-indigo-100 mb-1">صافي ربحي</div>
            <div className="text-lg font-black leading-none">{formatMoney(netProfit)}</div>
          </div>
        </div>
      </header>

      <div className="flex overflow-x-auto gap-3 p-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border-r-4 border-purple-500 flex-1 min-w-[140px]">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">للمندوب (أنس)</div>
          <div className="text-md font-black text-purple-700 mt-1">{formatMoney(supplierBalance)}</div>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border-r-4 border-orange-500 flex-1 min-w-[140px]">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">ديون لنا</div>
          <div className="text-md font-black text-orange-700 mt-1">{formatMoney(totalDebts)}</div>
        </div>
      </div>

      <main className="px-4">
        {activeTab === 'sales' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 mr-2">النوع</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold">
                      <option value="bill">فاتورة</option>
                      <option value="credit">رصيد</option>
                      <option value="accessories">إكسسوار</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 mr-2">اسم الزبون</label>
                    <input type="text" placeholder="اختياري" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 mr-2">المبلغ من الزبون</label>
                    <input 
                        type="number" 
                        placeholder="0" 
                        value={sellPrice} 
                        onChange={(e) => {
                            setSellPrice(e.target.value);
                            // ملء الكلفة تلقائياً بـ 7% للمساعدة
                            setCostPrice((Math.round(parseFloat(e.target.value || '0') * 0.07)).toString());
                        }} 
                        className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-green-600 text-lg" 
                        required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 mr-2">كلفة (أنس)</label>
                    <input type="number" placeholder="تلقائي 7%" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-red-500 text-lg" />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} className="sr-only" />
                    <div className={`w-10 h-6 rounded-full transition ${isDebt ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                    <span className="text-sm font-black text-gray-700">تسجيل كدين؟</span>
                  </label>
                  {sellPrice && (
                    <div className="text-right flex flex-col">
                      <span className="text-indigo-700 font-black text-[11px]">مربحي 13%: {formatMoney(calculateProfit(sellPrice))}</span>
                      <span className="text-purple-600 font-black text-[11px]">لأنس 7%: {formatMoney(calculateAnasShare(sellPrice))}</span>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-lg flex justify-center items-center gap-3 shadow-xl active:scale-95 transition-transform">
                  <Save size={24} /> حفظ العملية
                </button>
              </form>
            </div>

            <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-gray-800">آخر العمليات</h3>
                <button onClick={() => setShowResetConfirm(true)} className="text-red-400 text-[10px] font-bold"><LogOut size={12} className="inline ml-1"/> تصفير البيانات</button>
            </div>

            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex justify-between items-center group relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${t.type === 'bill' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {t.type === 'bill' ? <Calculator size={20}/> : <Smartphone size={20}/>}
                    </div>
                    <div>
                      <div className="font-black text-sm text-gray-800">{t.customerName}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{formatDate(t.date)} • كلفة أنس: {formatMoney(t.costPrice)}</div>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <div className="font-black text-indigo-700 text-lg leading-none">{formatMoney(t.sellPrice)}</div>
                    {t.isDebt && !t.debtPaid ? (
                      <button onClick={() => markDebtAsPaid(t.id)} className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full mt-2 font-black animate-pulse">تسديد الدين</button>
                    ) : (
                      <span className={`text-[10px] font-black mt-2 ${t.isDebt ? 'text-green-600' : 'text-gray-300'}`}>{t.isDebt ? 'تم السداد' : 'كاش'}</span>
                    )}
                  </div>
                  <button onClick={() => setShowDeleteConfirm(t.id)} className="absolute left-0 top-0 bottom-0 bg-red-50 text-red-500 px-3 opacity-0 group-hover:opacity-100 flex items-center">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="space-y-5">
            <div className="bg-purple-700 p-8 rounded-[2.5rem] text-white text-center shadow-2xl">
              <p className="text-purple-200 text-xs font-bold mb-2 uppercase italic">حساب المندوب: أنس معتوق</p>
              <h2 className="text-4xl font-black mb-6">{formatMoney(supplierBalance)}</h2>
              <button onClick={settleSupplierAccount} disabled={supplierBalance <= 0} className={`w-full py-4 rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 ${supplierBalance > 0 ? 'bg-white text-purple-700' : 'bg-purple-800 text-purple-400 opacity-50'}`}>
                <RefreshCw size={20} /> تصفية الحساب (دفع لأنس)
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-black text-gray-800 mb-4 border-b pb-3">تاريخ الدفعات</h3>
              <div className="space-y-3">
                {supplierHistory.map(h => (
                  <div key={h.id} className="flex justify-between items-center py-3 border-b last:border-0 text-sm">
                    <span className="text-gray-400 font-bold">{formatDate(h.date)}</span>
                    <span className="font-black text-purple-600">-{formatMoney(h.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-red-50">
              <h3 className="font-black text-gray-800 mb-5 text-lg flex items-center gap-2"><TrendingDown className="text-red-500"/> إضافة مصروف</h3>
              <div className="space-y-4">
                <input type="text" placeholder="اسم المصروف" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
                <input type="number" placeholder="المبلغ" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-red-600 text-lg" />
                <button onClick={handleAddExpense} className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100">تسجيل المصروف</button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-4 italic">
                <h3 className="font-black text-gray-800">سجل المصاريف</h3>
                <span className="text-red-600 font-black">{formatMoney(totalExpensesVal)}</span>
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

      {/* Modals & Navigation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center">
            <h4 className="font-black text-xl mb-6">حذف العملية؟</h4>
            <div className="flex gap-3">
              <button onClick={() => deleteTransaction(showDeleteConfirm)} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black">نعم</button>
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center">
            <h4 className="font-black text-xl mb-6 text-red-600">تصفير كل البيانات؟</h4>
            <p className="text-sm text-gray-500 mb-8 font-bold">سيتم حذف المبيعات والمصاريف وكل شيء نهائياً!</p>
            <div className="flex gap-3">
              <button onClick={resetAllData} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black">حذف الكل</button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black">تراجع</button>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t pb-8 pt-3 px-6 z-30 flex justify-around items-center rounded-t-[2.5rem] shadow-lg">
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'text-indigo-600' : 'text-gray-300'}`}>
          <PlusCircle size={28} /> <span className="text-[10px] font-black">العمليات</span>
        </button>
        <button onClick={() => setActiveTab('supplier')} className={`flex flex-col items-center gap-1 ${activeTab === 'supplier' ? 'text-purple-600' : 'text-gray-300'}`}>
          <User size={28} /> <span className="text-[10px] font-black">أنس</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 ${activeTab === 'expenses' ? 'text-red-500' : 'text-gray-300'}`}>
          <TrendingDown size={28} /> <span className="text-[10px] font-black">المصاريف</span>
        </button>
      </footer>
    </div>
  );
};

export default MobileShopSystem;