
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getTranslation } from '../utils/i18n';
import { Invoice, InvoiceItem, PaymentMethod, Product } from '../types';
import { Search, Plus, ArrowLeftRight, Trash2, Truck, CheckCircle, ChevronDown } from 'lucide-react';
import { Pagination } from '../components/Pagination';

export const Purchases = () => {
  const { invoices, suppliers, products, addInvoice, language, settings, banks } = useStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [view, setView] = useState<'list' | 'new'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Return State
  const [returnMode, setReturnMode] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<InvoiceItem[]>([]);

  // New Purchase State
  const [newPurchaseCart, setNewPurchaseCart] = useState<InvoiceItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  // Searchable Supplier State
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));

  // Bank Select for Purchase
  const [showBankSelect, setShowBankSelect] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const purchaseInvoices = invoices.filter(i => 
    i.type === 'PURCHASE' && 
    (i.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.includes(searchQuery))
  );

  const paginatedInvoices = purchaseInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- SEARCH LOGIC ---
  const handleProductSearch = (term: string) => {
    setProductSearch(term);
    const exactMatch = products.find(p => p.barcode === term || p.code === term);
    if (exactMatch) {
        addToPurchaseCart(exactMatch);
        setProductSearch('');
    }
  };

  const searchResults = productSearch.length > 1 ? products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch)
  ).slice(0, 5) : [];

  // --- NEW PURCHASE LOGIC ---
  const addToPurchaseCart = (product: Product) => {
      const existing = newPurchaseCart.find(item => item.productId === product.id);
      if(existing) return; 

      setNewPurchaseCart([...newPurchaseCart, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.purchasePrice,
          total: product.purchasePrice,
          returnedQuantity: 0
      }]);
  };

  const updatePurchaseItem = (id: string, field: 'quantity' | 'price', value: number) => {
      setNewPurchaseCart(prev => prev.map(item => {
          if(item.productId === id) {
              const updated = { ...item, [field]: value };
              updated.total = updated.quantity * updated.price;
              return updated;
          }
          return item;
      }));
  };

  const initiatePurchase = () => {
      if(!selectedSupplierId || newPurchaseCart.length === 0) return;
      if (paymentMethod === PaymentMethod.CARD) {
          setSelectedBankId(banks[0]?.id || '');
          setShowBankSelect(true);
      } else {
          submitPurchase();
      }
  };

  const submitPurchase = (bankId?: string) => {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      const total = newPurchaseCart.reduce((sum, i) => sum + i.total, 0);
      
      const invoice: Invoice = {
          id: `PUR-${Date.now()}`,
          type: 'PURCHASE',
          partnerId: selectedSupplierId,
          partnerName: supplier?.name || 'Unknown',
          date: new Date().toISOString(),
          items: newPurchaseCart,
          subtotal: total,
          tax: 0, discount: 0, total: total,
          paymentMethod: paymentMethod,
          bankId: bankId
      };
      
      const success = addInvoice(invoice);
      if (success) {
          alert(t('purchaseInvoiceSaved'));
          setView('list');
          setNewPurchaseCart([]);
          setSelectedSupplierId('');
          setSupplierSearch('');
          setShowBankSelect(false);
      }
  };

  // --- RETURN LOGIC ---
  const handleStartReturn = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReturnItems(invoice.items.map(item => ({...item, returnedQuantity: 0}))); 
    setReturnMode(true);
  };

  const submitReturn = () => {
    if (!selectedInvoice) return;
    const itemsToReturn = returnItems.filter(i => i.returnedQuantity > 0).map(i => ({
        ...i,
        quantity: i.returnedQuantity,
        total: i.price * i.returnedQuantity
    }));
    if (itemsToReturn.length === 0) return;
    const returnInvoice: Invoice = {
        id: `RET-P-${Date.now()}`,
        type: 'PURCHASE_RETURN',
        partnerId: selectedInvoice.partnerId,
        partnerName: selectedInvoice.partnerName,
        date: new Date().toISOString(),
        items: itemsToReturn,
        subtotal: itemsToReturn.reduce((sum, i) => sum + i.total, 0),
        tax: 0, discount: 0, total: itemsToReturn.reduce((sum, i) => sum + i.total, 0),
        paymentMethod: PaymentMethod.CASH,
        parentInvoiceId: selectedInvoice.id
    };
    
    const success = addInvoice(returnInvoice);
    if (success) {
        setReturnMode(false);
        setSelectedInvoice(null);
    }
  };

  // --- RENDER ---
  if (returnMode && selectedInvoice) {
      // Reuse Return UI 
      return (
        <div className="bg-white p-6 rounded shadow">
             <h3 className="text-xl font-bold mb-4">{t('returns')}: {t('invoice')} #{selectedInvoice.id}</h3>
             <table className="w-full text-left mb-4">
                 <thead className="bg-gray-100">
                     <tr><th>{t('name')}</th><th>{t('salesQty')}</th><th>{t('returnQty')}</th><th>{t('refund')}</th></tr>
                 </thead>
                 <tbody>
                     {returnItems.map(item => (
                         <tr key={item.productId} className="border-t">
                             <td className="p-2">{item.productName}</td>
                             <td className="p-2">{item.quantity}</td>
                             <td className="p-2">
                                 <input type="number" min="0" max={item.quantity} className="border w-20 p-1 rounded"
                                     value={item.returnedQuantity}
                                     onChange={(e) => {
                                         const qty = parseInt(e.target.value) || 0;
                                         setReturnItems(prev => prev.map(pi => pi.productId === item.productId ? {...pi, returnedQuantity: Math.min(qty, item.quantity)} : pi));
                                     }}
                                 />
                             </td>
                             <td className="p-2">{settings.currency}{(item.price * item.returnedQuantity).toFixed(2)}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
             <div className="flex justify-end space-x-3">
                 <button onClick={() => setReturnMode(false)} className="px-4 py-2 border rounded">{t('cancel')}</button>
                 <button onClick={submitReturn} className="px-4 py-2 bg-red-600 text-white rounded">{t('confirmReturn')}</button>
             </div>
        </div>
      );
  }

  if (view === 'new') {
      return (
          <div className="bg-white p-6 rounded shadow h-full flex flex-col relative">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-xl font-bold flex items-center"><Truck className="mr-2"/> {t('newPurchase')}</h3>
                  <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800">{t('close')}</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                      <label className="block text-sm font-bold mb-2 text-gray-700">{t('supplier')}</label>
                      <div className="relative">
                          <div 
                              className="border w-full p-2 rounded focus:ring-2 focus:ring-primary flex justify-between items-center cursor-pointer bg-white"
                              onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                          >
                              <span>{suppliers.find(s => s.id === selectedSupplierId)?.name || t('selectOption')}</span>
                              <ChevronDown size={16} className="text-gray-400" />
                          </div>
                          {showSupplierDropdown && (
                              <div className="absolute top-full left-0 w-full bg-white border rounded shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
                                  <div className="p-2 sticky top-0 bg-white border-b">
                                      <input 
                                          className="w-full border p-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                          placeholder={t('searchPlaceholder')}
                                          value={supplierSearch}
                                          onChange={e => setSupplierSearch(e.target.value)}
                                          autoFocus
                                      />
                                  </div>
                                  {filteredSuppliers.map(s => (
                                      <div 
                                          key={s.id} 
                                          className={`p-2 hover:bg-gray-100 cursor-pointer text-sm ${selectedSupplierId === s.id ? 'bg-blue-50 font-bold' : ''}`}
                                          onClick={() => {
                                              setSelectedSupplierId(s.id);
                                              setShowSupplierDropdown(false);
                                              setSupplierSearch('');
                                          }}
                                      >
                                          {s.name}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="relative">
                      <label className="block text-sm font-bold mb-2 text-gray-700">{t('scanProduct')}</label>
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input 
                              type="text" 
                              className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-primary"
                              placeholder={t('scanProduct')}
                              value={productSearch}
                              onChange={e => handleProductSearch(e.target.value)}
                          />
                      </div>
                      {/* Search Dropdown */}
                      {searchResults.length > 0 && (
                         <div className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
                             {searchResults.map(p => (
                                 <div 
                                     key={p.id} 
                                     className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                     onClick={() => { addToPurchaseCart(p); setProductSearch(''); }}
                                 >
                                     <div>
                                         <p className="font-bold text-sm">{p.name}</p>
                                         <p className="text-xs text-gray-500">{p.code}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto border rounded mb-4 bg-gray-50">
                  <table className="w-full text-left">
                      <thead className="bg-gray-100 sticky top-0 text-sm text-gray-600">
                          <tr><th className="p-3">{t('name')}</th><th className="p-3">{t('stock')}</th><th className="p-3">{t('purchasePrice')}</th><th className="p-3">{t('totalAmount')}</th><th className="p-3"></th></tr>
                      </thead>
                      <tbody className="bg-white divide-y">
                          {newPurchaseCart.length === 0 ? (
                               <tr><td colSpan={5} className="p-8 text-center text-gray-400">{t('emptyCart')}</td></tr>
                          ) : (
                              newPurchaseCart.map(item => (
                                  <tr key={item.productId}>
                                      <td className="p-3 font-medium">{item.productName}</td>
                                      <td className="p-3"><input type="number" min="1" value={item.quantity} onChange={e => updatePurchaseItem(item.productId, 'quantity', parseInt(e.target.value))} className="w-20 border p-1 rounded text-center" /></td>
                                      <td className="p-3"><input type="number" min="0" value={item.price} onChange={e => updatePurchaseItem(item.productId, 'price', parseFloat(e.target.value))} className="w-24 border p-1 rounded" /></td>
                                      <td className="p-3 font-bold text-gray-800">{settings.currency}{item.total.toFixed(2)}</td>
                                      <td className="p-3 text-right"><button onClick={() => setNewPurchaseCart(prev => prev.filter(p => p.productId !== item.productId))} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button></td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
              
              <div className="flex justify-between items-center border-t pt-4">
                  <div className="w-1/3">
                      <label className="block text-sm font-bold mb-1 text-gray-700">{t('paymentTerms')}</label>
                      <select 
                        className="border w-full p-2 rounded" 
                        value={paymentMethod} 
                        onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      >
                          <option value="CASH">{t('cash')}</option>
                          <option value="CARD">{t('card')}</option>
                          <option value="CREDIT">{t('credit')}</option>
                      </select>
                  </div>
                  <div className="flex items-center">
                      <div className="mr-6 text-right">
                          <p className="text-sm text-gray-500">{t('totalCost')}</p>
                          <p className="text-2xl font-bold">{settings.currency}{newPurchaseCart.reduce((s, i) => s + i.total, 0).toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={initiatePurchase} 
                        disabled={!selectedSupplierId || newPurchaseCart.length === 0} 
                        className="bg-primary text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 flex items-center shadow"
                      >
                          <CheckCircle className="mr-2" size={20}/> {t('saveInvoice')}
                      </button>
                  </div>
              </div>

              {/* Bank Select Modal */}
              {showBankSelect && (
                  <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center p-6">
                      <div className="bg-white border w-full max-w-sm rounded-lg shadow-xl p-6">
                          <h3 className="text-lg font-bold mb-4">{t('selectBank')}</h3>
                          <select className="w-full border p-2 rounded mb-4" value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)}>
                              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <div className="flex justify-end space-x-2">
                              <button onClick={() => setShowBankSelect(false)} className="px-4 py-2 border rounded">{t('cancel')}</button>
                              <button onClick={() => submitPurchase(selectedBankId)} className="px-4 py-2 bg-primary text-white rounded">{t('confirm')}</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('purchases')}</h2>
        <button onClick={() => setView('new')} className="bg-primary text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700 shadow-sm">
            <Plus size={18} className="mr-2"/> {t('newPurchase')}
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
         <div className="mb-4 relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder={t('searchPlaceholder')}
               className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-primary"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
         </div>

         <table className="w-full text-left">
             <thead className="bg-gray-50">
                 <tr>
                     <th className="p-3">ID</th>
                     <th className="p-3">{t('date')}</th>
                     <th className="p-3">{t('supplier')}</th>
                     <th className="p-3">{t('totalAmount')}</th>
                     <th className="p-3"></th>
                 </tr>
             </thead>
             <tbody>
                 {paginatedInvoices.length === 0 ? (
                     <tr><td colSpan={5} className="p-4 text-center text-gray-400">{t('noRecords')}</td></tr>
                 ) : (
                     paginatedInvoices.map(inv => (
                         <tr key={inv.id} className="border-t hover:bg-gray-50">
                             <td className="p-3 font-mono text-sm">{inv.id.substring(0,8)}...</td>
                             <td className="p-3">{new Date(inv.date).toLocaleDateString()}</td>
                             <td className="p-3">{inv.partnerName}</td>
                             <td className="p-3 font-bold">{settings.currency}{inv.total.toFixed(2)}</td>
                             <td className="p-3">
                                 <button onClick={() => handleStartReturn(inv)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-sm flex items-center">
                                     <ArrowLeftRight size={14} className="mr-1"/> {t('returnItem')}
                                 </button>
                             </td>
                         </tr>
                     ))
                 )}
             </tbody>
         </table>
         <Pagination 
            currentPage={currentPage} 
            totalItems={purchaseInvoices.length} 
            pageSize={pageSize} 
            onPageChange={setCurrentPage} 
         />
      </div>
    </div>
  );
};
