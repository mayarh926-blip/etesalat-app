"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, User, Calculator, TrendingDown, Save, 
  Smartphone, RefreshCw, Trash2, Package, FileText, LogOut, Wallet, Check
} from 'lucide-react';

// --- Types ---
interface Transaction {
  id: number;
  date: string;
  type: 'bill' | 'credit' | 'accessories';
  network?: 'mtn' | 'syriatel'; // خاصة بالرصيد فقط
  customerName: string;
  sellPrice: number;
  costPrice: number; // رأس المال للاكسسوارات أو المبلغ المخصوم من دين أنس
  profit: number; 
  isDebt: boolean;
  debtPaid: boolean;
}

interface Expense {
  id: number;
  date: string;
  name: string;
  amount: number;
}

const MobileShopSystem: React.FC = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState<'sales' | 'supplier' | 'expenses'>('sales');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // ديون أنس المستقلة
  const [anasDebtMTN, setAnasDebtMTN] = useState<number>(0);
  const [anasDebtSyriatel, setAnasDebtSyriatel] = useState<number>(0);

  // Form Inputs
  const [type, setType] = useState<Transaction['type']>('credit');
  const [network, setNetwork] = useState<'mtn' | 'syriatel'>('mtn');
  const [customerName, setCustomerName] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [manualCostPrice, setManualCostPrice] = useState<string>(''); 
  const [isDebt, setIsDebt] = useState<boolean>(false);

  // Supplier Form
  const [anasAmount, setAnasAmount] = useState<string>('');
  const [anasDay, setAnasDay] = useState<'الأربعاء' | 'السبت'>('الأربعاء');
  const [anasNetwork, setAnasNetwork] = useState<'mtn' | 'syriatel'>('mtn');

  // --- Persistence ---
  useEffect(() => {
    const savedTrans = localStorage.getItem('shop_trans_v2');
    const savedExp = localStorage.getItem('shop_exp_v2');
    const savedDebtMTN = localStorage.getItem('anas_mtn');
    const savedDebtSYR = localStorage.getItem('anas_syr');

    if (savedTrans) setTransactions(JSON.parse(savedTrans));
    if (savedExp) setExpenses(JSON.parse(savedExp));
    if (savedDebtMTN) setAnasDebtMTN(JSON.parse(savedDebtMTN));
    if (savedDebtSYR) setAnasDebtSyriatel(JSON.parse(savedDebtSYR));
  }, []);

  useEffect(() => {
    localStorage.setItem('shop_trans_v2', JSON.stringify(transactions));
    localStorage.setItem('shop_exp_v2', JSON.stringify(expenses));
    localStorage.setItem('anas_mtn', JSON.stringify(anasDebtMTN));
    localStorage.setItem('anas_syr', JSON.stringify(anasDebtSyriatel));
  }, [transactions, expenses, anasDebtMTN, anasDebtSyriatel]);

  // --- Calculations ---

  // ديون الزبائن لنا
  const totalCustomerDebts = transactions
    .filter(t => t.isDebt && !t.debtPaid)
    .reduce((sum, t) => sum + t.sellPrice, 0);

  // إجمالي أرباح المحل (صافي)
  const totalNetProfit = transactions.reduce((sum, t) => sum + t.profit, 0) - 
                        expenses.reduce((sum, e) => sum + e.amount, 0);

  // المصاريف الكلية (رأس مال الاكسسوارات + المصاريف التشغيلية)
  const totalExpensesDisplay = expenses.reduce((sum, e) => sum + e.amount, 0) + 
                              transactions.filter(t => t.type !== 'credit').reduce((sum, t) => sum + t.costPrice, 0);

  // --- Handlers ---

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellPrice) return;

    const sellVal = parseFloat(sellPrice);
    let calculatedProfit = 0;
    let costForHistory = 0;

    if (type === 'credit') {
      const currentDebt = network === 'mtn' ? anasDebtMTN : anasDebtSyriatel;
      
      if (currentDebt > 0) {
        if (sellVal <= currentDebt) {
          // البيع أقل من أو يساوي الدين -> لا ربح حالياً، كله يذهب لتسديد أنس
          if (network === 'mtn') setAnasDebtMTN(prev => prev - sellVal);
          else setAnasDebtSyriatel(prev => prev - sellVal);
          calculatedProfit = 0;
          costForHistory = sellVal;
        } else {
          // البيع أكبر من الدين -> نسدد الدين والزيادة هي ربح
          const profitPart = sellVal - currentDebt;
          if (network === 'mtn') setAnasDebtMTN(0);
          else setAnasDebtSyriatel(0);
          calculatedProfit = profitPart;
          costForHistory = currentDebt;
        }
      } else {
        // الدين صفر أصلاً -> كل البيع ربح صافي
        calculatedProfit = sellVal;
        costForHistory = 0;
      }
    } else {
      // إكسسوار أو فاتورة
      const costVal = manualCostPrice ? parseFloat(manualCostPrice) : 0;
      calculatedProfit = sellVal - costVal;
      costForHistory = costVal;
    }

    const newTrans: Transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type,
      network: type === 'credit' ? network : undefined,
      customerName: customerName || 'زبون عام',
      sellPrice: sellVal,
      costPrice: costForHistory,
      profit: calculatedProfit,
      isDebt,
      debtPaid: false
    };

    setTransactions([newTrans, ...transactions]);
    setSellPrice(''); setManualCostPrice(''); setCustomerName(''); setIsDebt(false);
  };

  const handleAddStockFromAnas = () => {
    if (!anasAmount) return;
    const amountWithCommission = Math.round(parseFloat(anasAmount) * 1.07);
    
    if (anasNetwork === 'mtn') {
      setAnasDebtMTN(prev => prev + amountWithCommission);
    } else {
      setAnasDebtSyriatel(prev => prev + amountWithCommission);
    }
    
    // تسجيل عملية وهمية في السجل للذكرى
    alert(`تمت إضافة دين ${anasNetwork} بمبلغ ${amountWithCommission} لـ يوم ${anasDay}`);
    setAnasAmount('');
  };

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right pb-24" dir="rtl">
      
      {/* Header مع ديون أنس */}
      <header className="bg-indigo-800 text-white p-5 shadow-2xl sticky top-0 z-20 rounded-b-[2.5rem]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl font-black">لؤلؤة الموبايل</h1>
            <p className="text-[10px] text-indigo-200">الإصدار المحاسبي 2026</p>
          </div>
          <div className="bg-green-500/20 p-3 rounded-2xl border border-green-500/30 text-center">
            <div className="text-[10px] text-green-100">أرباحي الصافية</div>
            <div className="text-lg font-black">{formatMoney(totalNetProfit)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-600/30 border border-purple-400/30 p-3 rounded-2xl">
            <div className="text-[10px] font-bold text-purple-200 mb-1">دين أنس (MTN)</div>
            <div className="text-md font-black">{formatMoney(anasDebtMTN)}</div>
          </div>
          <div className="bg-blue-600/30 border border-blue-400/30 p-3 rounded-2xl">
            <div className="text-[10px] font-bold text-blue-200 mb-1">دين أنس (Syr)</div>
            <div className="text-md font-black">{formatMoney(anasDebtSyriatel)}</div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-6">
        {activeTab === 'sales' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">النوع</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border-none">
                      <option value="credit">رصيد (وحدات)</option>
                      <option value="accessories">إكسسوارات</option>
                      <option value="bill">فواتير</option>
                    </select>
                  </div>
                  {type === 'credit' ? (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">الشركة</label>
                      <select value={network} onChange={(e) => setNetwork(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border-none">
                        <option value="mtn">MTN</option>
                        <option value="syriatel">Syriatel</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">اسم الزبون</label>
                      <input type="text" placeholder="اختياري" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border-none" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">سعر المبيع للزبون</label>
                    <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="w-full p-4 bg-indigo-50 text-indigo-700 rounded-xl font-black text-lg border-none" required />
                  </div>
                  {type !== 'credit' && (
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">رأس المال</label>
                      <input type="number" value={manualCostPrice} onChange={(e) => setManualCostPrice(e.target.value)} className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-black text-lg border-none" />
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">
                  حفظ العملية
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-gray-700 px-1">سجل مبيعات اليوم</h3>
              {transactions.slice(0, 10).map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'credit' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                      {t.type === 'credit' ? <Smartphone size={18}/> : <Package size={18}/>}
                    </div>
                    <div>
                      <div className="text-sm font-black">{t.customerName} {t.network && `(${t.network})`}</div>
                      <div className="text-[9px] text-gray-400 font-bold">{t.profit > 0 ? `ربح: ${formatMoney(t.profit)}` : 'تسديد دين لأنس'}</div>
                    </div>
                  </div>
                  <div className="text-left font-black text-indigo-600">{formatMoney(t.sellPrice)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2"><User className="text-purple-600"/> استلام رصيد من أنس</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <select value={anasDay} onChange={(e) => setAnasDay(e.target.value as any)} className="p-3 bg-slate-50 rounded-xl font-bold border-none">
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="السبت">السبت</option>
                  </select>
                  <select value={anasNetwork} onChange={(e) => setAnasNetwork(e.target.value as any)} className="p-3 bg-slate-50 rounded-xl font-bold border-none">
                    <option value="mtn">MTN</option>
                    <option value="syriatel">Syriatel</option>
                  </select>
                </div>
                <input type="number" placeholder="المبلغ المستلم (مثلاً 100,000)" value={anasAmount} onChange={(e) => setAnasAmount(e.target.value)} className="w-full p-4 bg-purple-50 rounded-xl font-black text-purple-700 border-none" />
                <div className="text-[10px] text-gray-400 text-center font-bold italic">
                   سيتم تسجيل دين عليك بقيمة: {anasAmount ? formatMoney(Math.round(parseFloat(anasAmount)*1.07)) : '0'}
                </div>
                <button onClick={handleAddStockFromAnas} className="w-full bg-purple-600 text-white p-4 rounded-xl font-black">إضافة للدين</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { if(confirm('تصفير دين MTN؟')) setAnasDebtMTN(0) }} className="bg-white p-4 rounded-2xl border-2 border-purple-100 text-purple-600 font-black flex flex-col items-center gap-2">
                 <Check /> تصفية MTN
              </button>
              <button onClick={() => { if(confirm('تصفير دين Syriatel؟')) setAnasDebtSyriatel(0) }} className="bg-white p-4 rounded-2xl border-2 border-blue-100 text-blue-600 font-black flex flex-col items-center gap-2">
                 <Check /> تصفية Syriatel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-5">
             <div className="bg-white p-6 rounded-[2rem] shadow-sm">
              <h3 className="font-black text-gray-800 mb-4">إجمالي مصاريف المحل</h3>
              <div className="text-3xl font-black text-red-500 mb-4">{formatMoney(totalExpensesDisplay)}</div>
              <p className="text-[10px] text-gray-400 italic">تشمل رأس مال الاكسسوارات + المصاريف التي تسجلها يدوياً</p>
             </div>
             {/* هنا يمكنك نسخ كود المصاريف القديم لإضافة أجار المحل وغيره */}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t pb-8 pt-4 px-6 flex justify-around rounded-t-[2.5rem] shadow-inner">
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center ${activeTab === 'sales' ? 'text-indigo-600' : 'text-gray-300'}`}>
          <PlusCircle size={24}/> <span className="text-[10px] font-bold">البيع</span>
        </button>
        <button onClick={() => setActiveTab('supplier')} className={`flex flex-col items-center ${activeTab === 'supplier' ? 'text-purple-600' : 'text-gray-300'}`}>
          <User size={24}/> <span className="text-[10px] font-bold">أنس</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center ${activeTab === 'expenses' ? 'text-red-500' : 'text-gray-300'}`}>
          <TrendingDown size={24}/> <span className="text-[10px] font-bold">المصاريف</span>
        </button>
      </footer>
    </div>
  );
};

export default MobileShopSystem;