import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { getTranslation } from '../utils/i18n';
import { FileText, Calendar, Filter, Download, Package, Wallet, Landmark, ChevronDown, Printer, ShoppingCart, Truck, RefreshCcw } from 'lucide-react';
import { Pagination } from '../components/Pagination';

export const Reports = () => {
  const { language, products, invoices, locations, transactions, customers, suppliers, settings, categories } = useStore();
  const t = (key: string) => getTranslation(language, key);

  const [activeTab, setActiveTab] = useState<'stock' | 'sales' | 'purchase' | 'sales_return' | 'purchase_return' | 'cash' | 'bank'>('stock');

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // --- FILTERS STATE ---
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Transaction Filters
  const [transType, setTransType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  // Reset pagination when tab/filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, startDate, endDate, selectedLocation, transType, selectedPartnerId]);

  // --- DATA PROCESSING ---

  // 1. STOCK REPORT
  const stockReportData = useMemo(() => {
    return products.filter(p => {
       if (selectedLocation) {
           return true; 
       }
       return true;
    });
  }, [products, selectedLocation]);

  // 2. INVOICE REPORTS (Sales, Purchase, Returns)
  const invoiceReportData = useMemo(() => {
     let type = '';
     if (activeTab === 'sales') type = 'SALE';
     else if (activeTab === 'purchase') type = 'PURCHASE';
     else if (activeTab === 'sales_return') type = 'SALE_RETURN';
     else if (activeTab === 'purchase_return') type = 'PURCHASE_RETURN';
     else return [];

     return invoices.filter(inv => {
         const dateMatch = inv.date >= startDate && inv.date <= endDate + 'T23:59:59';
         const typeMatch = inv.type === type;
         const partnerMatch = selectedPartnerId ? inv.partnerId === selectedPartnerId : true;
         return dateMatch && typeMatch && partnerMatch;
     }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, activeTab, startDate, endDate, selectedPartnerId]);

  // 3. FINANCE REPORTS (Cash, Bank)
  const financeReportData = useMemo(() => {
      let source = '';
      if (activeTab === 'cash') source = 'CASH_REGISTER';
      else if (activeTab === 'bank') source = 'BANK';
      else return [];

      return transactions.filter(tr => {
          const dateMatch = tr.date >= startDate && tr.date <= endDate + 'T23:59:59';
          const sourceMatch = tr.source === source;
          const typeMatch = transType === 'ALL' || tr.type === transType;
          return dateMatch && sourceMatch && typeMatch;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activeTab, startDate, endDate, transType]);

  // PAGINATION LOGIC
  const currentData = activeTab === 'stock' ? stockReportData : (
      ['sales', 'purchase', 'sales_return', 'purchase_return'].includes(activeTab) ? invoiceReportData : financeReportData
  );
  
  const paginatedData = currentData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // EXPORT
  const handleExport = () => {
      // Basic CSV export
      const csvContent = "data:text/csv;charset=utf-8," + 
          currentData.map(row => Object.values(row).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${activeTab}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const getPartnerOptions = () => {
      if (activeTab.includes('sales')) return customers;
      if (activeTab.includes('purchase')) return suppliers;
      return [...customers, ...suppliers]; // For mixed context if needed
  };

  const filteredPartnerOptions = getPartnerOptions().filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()));

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Detailed analysis and records.</p>
            </div>
            <button onClick={handleExport} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg flex items-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                <Download size={18} className="mr-2"/> {t('exportExcel')}
            </button>
        </div>

        {/* TABS */}
        <div className="flex overflow-x-auto pb-2 space-x-2 border-b border-gray-200 dark:border-gray-700">
             {[
                 { id: 'stock', icon: Package, label: t('stockReport') },
                 { id: 'sales', icon: ShoppingCart, label: t('salesReport') },
                 { id: 'purchase', icon: Truck, label: t('purchaseReport') },
                 { id: 'sales_return', icon: RefreshCcw, label: t('salesReturnReport') },
                 { id: 'purchase_return', icon: RefreshCcw, label: t('purchaseReturnReport') },
                 { id: 'cash', icon: Wallet, label: t('cashReport') },
                 { id: 'bank', icon: Landmark, label: t('bankReport') },
             ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-4 py-2 whitespace-nowrap rounded-t-lg text-sm font-bold transition-colors ${
                        activeTab === tab.id 
                        ? 'bg-primary text-white' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                 >
                     <tab.icon size={16} className="mr-2"/> {tab.label}
                 </button>
             ))}
        </div>

        {/* FILTERS BAR */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-end">
             {/* Date Range (Not for Stock) */}
             {activeTab !== 'stock' && (
                 <>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('startDate')}</label>
                        <input type="date" className="border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('endDate')}</label>
                        <input type="date" className="border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                 </>
             )}

             {/* Location Filter (Stock Only) */}
             {activeTab === 'stock' && (
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('location')}</label>
                     <select className="border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                         <option value="">{t('allTypes')}</option>
                         {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                     </select>
                 </div>
             )}

             {/* Partner Filter (Invoice Reports) */}
             {['sales', 'purchase', 'sales_return', 'purchase_return'].includes(activeTab) && (
                 <div className="relative min-w-[200px]">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('partner')}</label>
                     <div 
                         className="w-full border p-2 rounded text-sm flex justify-between items-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         onClick={() => setShowPartnerDropdown(!showPartnerDropdown)}
                     >
                         <span>{getPartnerOptions().find(p => p.id === selectedPartnerId)?.name || t('allTypes')}</span>
                         <ChevronDown size={14} className="text-gray-400" />
                     </div>
                     {showPartnerDropdown && (
                         <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
                             <div className="p-2 sticky top-0 bg-white dark:bg-gray-700 border-b dark:border-gray-600">
                                 <input 
                                     className="w-full border p-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                     placeholder={t('searchPlaceholder')}
                                     value={partnerSearch}
                                     onChange={e => setPartnerSearch(e.target.value)}
                                     autoFocus
                                 />
                             </div>
                             <div 
                                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-500 dark:text-gray-400 italic"
                                 onClick={() => { setSelectedPartnerId(''); setShowPartnerDropdown(false); }}
                             >
                                 {t('allTypes')}
                             </div>
                             {filteredPartnerOptions.map(p => (
                                 <div 
                                     key={p.id} 
                                     className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm ${selectedPartnerId === p.id ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : 'dark:text-gray-200'}`}
                                     onClick={() => { setSelectedPartnerId(p.id); setShowPartnerDropdown(false); setPartnerSearch(''); }}
                                 >
                                     {p.name}
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             )}

             {/* Transaction Type Filter (Cash/Bank) */}
             {['cash', 'bank'].includes(activeTab) && (
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('type')}</label>
                     <select className="border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={transType} onChange={e => setTransType(e.target.value as any)}>
                         <option value="ALL">{t('allTypes')}</option>
                         <option value="INCOME">{t('income')}</option>
                         <option value="EXPENSE">{t('expense')}</option>
                     </select>
                 </div>
             )}
        </div>

        {/* REPORT TABLE */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="overflow-x-auto">
                 {activeTab === 'stock' && (
                     <table className="w-full text-left">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
                             <tr>
                                 <th className="p-4">{t('name')}</th>
                                 <th className="p-4">{t('category')}</th>
                                 <th className="p-4">{t('stock')} {selectedLocation ? `(${locations.find(l=>l.id===selectedLocation)?.name})` : '(Total)'}</th>
                                 <th className="p-4">{t('stockValueBuy')}</th>
                                 <th className="p-4">{t('stockValueSell')}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                             {paginatedData.map((p: any) => {
                                 const stock = selectedLocation ? (p.stocks?.[selectedLocation] || 0) : p.stock;
                                 const valBuy = stock * p.purchasePrice;
                                 const valSell = stock * p.salesPrice;
                                 return (
                                     <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                         <td className="p-4 dark:text-gray-200">{p.name} <span className="text-xs text-gray-400 block">{p.code}</span></td>
                                         <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{categories.find((c: any) => c.id === p.categoryId)?.name}</td>
                                         <td className="p-4 font-bold">{stock}</td>
                                         <td className="p-4 text-sm">{settings.currency}{valBuy.toFixed(2)}</td>
                                         <td className="p-4 text-sm font-bold text-green-600">{settings.currency}{valSell.toFixed(2)}</td>
                                     </tr>
                                 );
                             })}
                         </tbody>
                     </table>
                 )}

                 {['sales', 'purchase', 'sales_return', 'purchase_return'].includes(activeTab) && (
                     <table className="w-full text-left">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
                             <tr>
                                 <th className="p-4">{t('date')}</th>
                                 <th className="p-4">ID</th>
                                 <th className="p-4">{t('partner')}</th>
                                 <th className="p-4 text-right">{t('totalAmount')}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                             {paginatedData.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-400">{t('noRecords')}</td></tr> :
                             paginatedData.map((inv: any) => (
                                 <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                     <td className="p-4 dark:text-gray-300">{new Date(inv.date).toLocaleDateString()}</td>
                                     <td className="p-4 font-mono text-sm dark:text-gray-400">{inv.id.substring(0, 10)}...</td>
                                     <td className="p-4 dark:text-gray-200">{inv.partnerName}</td>
                                     <td className="p-4 text-right font-bold dark:text-white">{settings.currency}{inv.total.toFixed(2)}</td>
                                 </tr>
                             ))}
                             {/* Total Row */}
                             <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                                 <td colSpan={3} className="p-4 text-right">{t('total')}:</td>
                                 <td className="p-4 text-right dark:text-white">
                                     {settings.currency}{paginatedData.reduce((sum: number, i: any) => sum + i.total, 0).toFixed(2)}
                                     <span className="text-xs font-normal text-gray-500 block">(Page)</span>
                                 </td>
                             </tr>
                         </tbody>
                     </table>
                 )}

                 {['cash', 'bank'].includes(activeTab) && (
                     <table className="w-full text-left">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
                             <tr>
                                 <th className="p-4">{t('date')}</th>
                                 <th className="p-4">{t('type')}</th>
                                 <th className="p-4">{t('category')}</th>
                                 <th className="p-4">{t('description')}</th>
                                 <th className="p-4 text-right">{t('amount')}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                             {paginatedData.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-400">{t('noRecords')}</td></tr> :
                             paginatedData.map((tr: any) => (
                                 <tr key={tr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                     <td className="p-4 dark:text-gray-300">{new Date(tr.date).toLocaleDateString()}</td>
                                     <td className="p-4">
                                         <span className={`px-2 py-1 rounded text-xs font-bold ${tr.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                             {t(tr.type.toLowerCase())}
                                         </span>
                                     </td>
                                     <td className="p-4 dark:text-gray-300">{tr.category}</td>
                                     <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{tr.description}</td>
                                     <td className={`p-4 text-right font-bold ${tr.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{settings.currency}{tr.amount.toFixed(2)}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 )}
             </div>
             <Pagination 
                currentPage={currentPage} 
                totalItems={currentData.length} 
                pageSize={pageSize} 
                onPageChange={setCurrentPage} 
             />
        </div>
    </div>
  );
};
