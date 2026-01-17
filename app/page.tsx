"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, User, TrendingDown, Save, 
  Smartphone, RefreshCw, Trash2, Package, LogOut, Wallet, Check, AlertTriangle
} from 'lucide-react';

// --- Types ---
interface Transaction {
  id: number;
  date: string;
  type: 'bill' | 'credit' | 'accessories';
  network?: 'mtn' | 'syriatel';
  customerName: string;
  sellPrice: number;
  profit: number; 
  isDebt: boolean;
  debtPaid: boolean;
}

const MobileShopSystem: React.FC = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState<'sales' | 'supplier' | 'expenses'>('sales');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // ديون أنس (107%)
  const [anasDebtMTN, setAnasDebtMTN] = useState<number>(0);
  const [anasDebtSyriatel, setAnasDebtSyriatel] = useState<number>(0);

  // إجمالي الرصيد المتوفر للبيع (120%)
  const [stockMTN, setStockMTN] = useState<number>(0);
  const [stockSyriatel, setStockSyriatel] = useState<number>(0);

  // Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form Inputs
  const [type, setType] = useState<Transaction['type']>('credit');
  const [network, setNetwork] = useState<'mtn' | 'syriatel'>('mtn');
  const [customerName, setCustomerName] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [manualCostPrice, setManualCostPrice] = useState<string>(''); 
  const [isDebt, setIsDebt] = useState<boolean>(false);

  // Supplier Form
  const [anasAmount, setAnasAmount] = useState<string>('');
  const [anasNetwork, setAnasNetwork] = useState<'mtn' | 'syriatel'>('mtn');

  // --- Persistence ---
  useEffect(() => {
    const saved = {
      trans: localStorage.getItem('shop_v3_trans'),
      dMTN: localStorage.getItem('shop_v3_dMTN'),
      dSYR: localStorage.getItem('shop_v3_dSYR'),
      sMTN: localStorage.getItem('shop_v3_sMTN'),
      sSYR: localStorage.getItem('shop_v3_sSYR'),
    };
    if (saved.trans) setTransactions(JSON.parse(saved.trans));
    if (saved.dMTN) setAnasDebtMTN(JSON.parse(saved.dMTN));
    if (saved.dSYR) setAnasDebtSyriatel(JSON.parse(saved.dSYR));
    if (saved.sMTN) setStockMTN(JSON.parse(saved.sMTN));
    if (saved.sSYR) setStockSyriatel(JSON.parse(saved.sSYR));
  }, []);

  useEffect(() => {
    localStorage.setItem('shop_v3_trans', JSON.stringify(transactions));
    localStorage.setItem('shop_v3_dMTN', JSON.stringify(anasDebtMTN));
    localStorage.setItem('shop_v3_dSYR', JSON.stringify(anasDebtSyriatel));
    localStorage.setItem('shop_v3_sMTN', JSON.stringify(stockMTN));
    localStorage.setItem('shop_v3_sSYR', JSON.stringify(stockSyriatel));
  }, [transactions, anasDebtMTN, anasDebtSyriatel, stockMTN, stockSyriatel]);

  // --- Handlers ---

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellPrice) return;

    const sellVal = parseFloat(sellPrice);
    let calculatedProfit = 0;

    if (type === 'credit') {
      const debt = network === 'mtn' ? anasDebtMTN : anasDebtSyriatel;
      
      // 1. خصم من إجمالي الرصيد المتوفر للبيع (Stock)
      if (network === 'mtn') setStockMTN(prev => Math.max(0, prev - sellVal));
      else setStockSyriatel(prev => Math.max(0, prev - sellVal));

      // 2. خصم من دين أنس وحساب الربح
      if (debt > 0) {
        if (sellVal <= debt) {
          // ما زلنا نسدد رأس المال لأنس
          if (network === 'mtn') setAnasDebtMTN(prev => prev - sellVal);
          else setAnasDebtSyriatel(prev => prev - sellVal);
          calculatedProfit = 0;
        } else {
          // جزء سدد الدين والباقي ربح صافي
          calculatedProfit = sellVal - debt;
          if (network === 'mtn') setAnasDebtMTN(0);
          else setAnasDebtSyriatel(0);
        }
      } else {
        // الدين صفر، كل البيع ربح
        calculatedProfit = sellVal;
      }
    } else {
      const costVal = manualCostPrice ? parseFloat(manualCostPrice) : 0;
      calculatedProfit = sellVal - costVal;
    }

    const newTrans: Transaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type,
      network: type === 'credit' ? network : undefined,
      customerName: customerName || 'زبون عام',
      sellPrice: sellVal,
      profit: calculatedProfit,
      isDebt,
      debtPaid: false
    };

    setTransactions([newTrans, ...transactions]);
    setSellPrice(''); setManualCostPrice(''); setCustomerName(''); setIsDebt(false);
  };

  const handleAddStockFromAnas = () => {
    if (!anasAmount) return;
    const rawAmount = parseFloat(anasAmount);
    
    // حسبة أنس (107%)
    const debtAmount = Math.round(rawAmount * 1.07);
    // حسبة البيع الكاملة (120%)
    const stockValue = Math.round(rawAmount * 1.20);
    
    if (anasNetwork === 'mtn') {
      setAnasDebtMTN(prev => prev + debtAmount);
      setStockMTN(prev => prev + stockValue);
    } else {
      setAnasDebtSyriatel(prev => prev + debtAmount);
      setStockSyriatel(prev => prev + stockValue);
    }
    
    setAnasAmount('');
    alert(`تمت إضافة الرصيد بنجاح`);
  };

  const resetEverything = () => {
    setTransactions([]);
    setAnasDebtMTN(0);
    setAnasDebtSyriatel(0);
    setStockMTN(0);
    setStockSyriatel(0);
    setShowResetConfirm(false);
    localStorage.clear();
  };

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-right pb-24" dir="rtl">
      
      {/* Header - نظام الخانات الأربعة الجديد */}
      <header className="bg-slate-900 text-white p-5 shadow-2xl sticky top-0 z-20 rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black text-indigo-400 flex items-center gap-2">
            <Wallet size={20}/> لؤلؤة الموبايل
          </h1>
          <button onClick={() => setShowResetConfirm(true)} className="p-2 bg-red-500/10 text-red-500 rounded-lg">
            <LogOut size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* MTN Group */}
          <div className="space-y-2">
            <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl">
              <div className="text-[8px] text-orange-300 font-bold uppercase">دين أنس MTN</div>
              <div className="text-sm font-black">{formatMoney(anasDebtMTN)}</div>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/40 p-2 rounded-xl">
              <div className="text-[8px] text-orange-100 font-bold uppercase">باقي رصيد MTN للبيع</div>
              <div className="text-sm font-black text-orange-400">{formatMoney(stockMTN)}</div>
            </div>
          </div>

          {/* Syriatel Group */}
          <div className="space-y-2">
            <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
              <div className="text-[8px] text-red-300 font-bold uppercase">دين أنس Syr</div>
              <div className="text-sm font-black">{formatMoney(anasDebtSyriatel)}</div>
            </div>
            <div className="bg-red-500/20 border border-red-500/40 p-2 rounded-xl">
              <div className="text-[8px] text-red-100 font-bold uppercase">باقي رصيد Syr للبيع</div>
              <div className="text-sm font-black text-red-400">{formatMoney(stockSyriatel)}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-6">
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Sales Form */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-3 bg-slate-100 rounded-xl text-sm font-bold border-none">
                    <option value="credit">رصيد</option>
                    <option value="accessories">إكسسوار</option>
                  </select>
                  {type === 'credit' ? (
                    <select value={network} onChange={(e) => setNetwork(e.target.value as any)} className="w-full p-3 bg-slate-100 rounded-xl text-sm font-bold border-none">
                      <option value="mtn">MTN</option>
                      <option value="syriatel">Syriatel</option>
                    </select>
                  ) : (
                    <input type="text" placeholder="اسم الزبون" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl text-sm border-none" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="سعر المبيع" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="col-span-1 p-4 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xl border-none" required />
                  {type !== 'credit' && (
                    <input type="number" placeholder="رأس المال" value={manualCostPrice} onChange={(e) => setManualCostPrice(e.target.value)} className="col-span-1 p-4 bg-red-50 text-red-600 rounded-xl font-black text-xl border-none" />
                  )}
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black flex items-center justify-center gap-2">
                  <Save size={18}/> حفظ العملية
                </button>
              </form>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-3">
              <h3 className="font-black text-gray-700">آخر العمليات</h3>
              {transactions.slice(0, 15).map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border-r-4 border-indigo-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-indigo-600">
                      {t.type === 'credit' ? <Smartphone size={18}/> : <Package size={18}/>}
                    </div>
                    <div>
                      <div className="text-sm font-black">{t.customerName} {t.network && `(${t.network})`}</div>
                      <div className={`text-[10px] font-bold ${t.profit > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {t.profit > 0 ? `صافي الربح: ${formatMoney(t.profit)}` : 'تسديد من الدين'}
                      </div>
                    </div>
                  </div>
                  <div className="text-left font-black">{formatMoney(t.sellPrice)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-purple-600">
                <RefreshCw /> استلام دفعة من أنس
              </h3>
              <div className="space-y-4">
                <select value={anasNetwork} onChange={(e) => setAnasNetwork(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none">
                  <option value="mtn">شركة MTN</option>
                  <option value="syriatel">شركة Syriatel</option>
                </select>
                <div className="space-y-1">
                   <label className="text-[10px] text-gray-400 mr-2 font-bold">المبلغ الخام (قبل النسبة)</label>
                   <input type="number" placeholder="مثلاً: 200,000" value={anasAmount} onChange={(e) => setAnasAmount(e.target.value)} className="w-full p-4 bg-purple-50 rounded-xl font-black text-purple-700 text-xl border-none" />
                </div>
                
                {anasAmount && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-dashed border-purple-200">
                    <div className="text-center">
                      <div className="text-[8px] font-bold text-gray-400">دين أنس (107%)</div>
                      <div className="text-xs font-black text-red-500">{formatMoney(Math.round(parseFloat(anasAmount)*1.07))}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[8px] font-bold text-gray-400">قيمة البيع (120%)</div>
                      <div className="text-xs font-black text-green-600">{formatMoney(Math.round(parseFloat(anasAmount)*1.20))}</div>
                    </div>
                  </div>
                )}

                <button onClick={handleAddStockFromAnas} className="w-full bg-purple-600 text-white p-4 rounded-xl font-black shadow-lg">إضافة للرصيد والدين</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { if(confirm('تسديد دين MTN بالكامل؟')) setAnasDebtMTN(0) }} className="bg-white p-4 rounded-2xl border-2 border-orange-100 text-orange-600 font-black flex flex-col items-center gap-2 shadow-sm">
                 <Check /> تصفية MTN
              </button>
              <button onClick={() => { if(confirm('تسديد دين Syriatel بالكامل؟')) setAnasDebtSyriatel(0) }} className="bg-white p-4 rounded-2xl border-2 border-red-100 text-red-600 font-black flex flex-col items-center gap-2 shadow-sm">
                 <Check /> تصفية Syr
              </button>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
             <TrendingDown size={60} />
             <p className="font-black mt-4">قسم المصاريف والتقارير</p>
          </div>
        )}
      </main>

      {/* Modal التصفير الكامل */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h4 className="font-black text-xl mb-2 text-red-600">مسح كل البيانات؟</h4>
            <p className="text-gray-500 text-sm mb-8 font-bold">سيتم تصفير الديون، الرصيد المتبقي، وسجل المبيعات نهائياً!</p>
            <div className="flex flex-col gap-2">
              <button onClick={resetEverything} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black">نعم، تصفير النظام</button>
              <button onClick={() => setShowResetConfirm(false)} className="w-full bg-gray-100 py-4 rounded-2xl font-black text-gray-600">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t pb-8 pt-4 px-6 flex justify-around rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'text-indigo-600' : 'text-gray-300'}`}>
          <PlusCircle size={24}/> <span className="text-[10px] font-black">المبيعات</span>
        </button>
        <button onClick={() => setActiveTab('supplier')} className={`flex flex-col items-center gap-1 ${activeTab === 'supplier' ? 'text-purple-600' : 'text-gray-300'}`}>
          <User size={24}/> <span className="text-[10px] font-black">أنس</span>
        </button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 ${activeTab === 'expenses' ? 'text-red-500' : 'text-gray-300'}`}>
          <TrendingDown size={24}/> <span className="text-[10px] font-black">المصاريف</span>
        </button>
      </footer>
    </div>
  );
};

export default MobileShopSystem;