
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { getTranslation } from '../utils/i18n';
import { Product, PaymentMethod, Invoice, InvoiceItem } from '../types';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, User, FileText, Printer, CheckCircle, Unlock, Lock, ChevronDown } from 'lucide-react';

// Simple beep using Web Audio API
const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1500;
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(() => osc.stop(), 100);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const POS = () => {
  const { products, categories, customers, language, addInvoice, settings, banks } = useStore();
  const t = (key: string) => getTranslation(language, key);

  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('gen'); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Searchable Customer State
  const [custSearch, setCustSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Bank Selection for Card
  const [showBankSelect, setShowBankSelect] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('');
  
  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  // Computed Values
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.barcode.includes(searchQuery) || 
                            p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);
  
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()));

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = currentCustomer ? (subtotal * currentCustomer.discountRate / 100) : 0;
  const total = subtotal - discountAmount;

  // Actions
  const addToCart = (product: Product) => {
    playBeep(); // Audio Feedback
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { 
          ...item, 
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.price 
        } : item);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.salesPrice,
        total: product.salesPrice,
        returnedQuantity: 0
      }];
    });
  };

  const updateQty = (prodId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === prodId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (prodId: string) => {
    setCart(prev => prev.filter(item => item.productId !== prodId));
  };

  const initiateCheckout = (method: PaymentMethod) => {
      if (cart.length === 0) return;
      if (method === PaymentMethod.CARD) {
          // Check for default bank or open selector
          if (settings.defaultBankId) {
              handleCheckout(method, settings.defaultBankId);
          } else {
              setSelectedBankId(banks[0]?.id || '');
              setShowBankSelect(true);
          }
      } else {
          handleCheckout(method);
      }
  };

  const handleCheckout = (method: PaymentMethod, bankId?: string) => {
    setIsProcessing(true);

    const invoice: Invoice = {
      id: Date.now().toString(),
      type: 'SALE',
      date: new Date().toISOString(),
      partnerId: selectedCustomerId,
      partnerName: currentCustomer?.name || 'Unknown',
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
      paymentMethod: method,
      bankId: bankId,
      locationId: 'loc1' // Defaulting to main warehouse
    };

    const success = addInvoice(invoice);
    
    if (success) {
        setLastInvoice(invoice);
        // Clear and Show Receipt
        setTimeout(() => {
            setCart([]);
            setSelectedCustomerId('gen');
            setCustSearch(''); // Reset search
            setIsProcessing(false);
            setShowBankSelect(false);
            setShowReceipt(true);
        }, 300);
    } else {
        setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full gap-4 relative">
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b flex space-x-2 overflow-x-auto">
           <button 
             onClick={() => setSelectedCategory('ALL')}
             className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${selectedCategory === 'ALL' ? 'bg-dark text-white' : 'bg-gray-100 text-gray-700'}`}
           >
             {t('allTypes')}
           </button>
           {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setSelectedCategory(cat.id)}
               className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
             >
               {cat.name}
             </button>
           ))}
        </div>
        <div className="p-4 border-b">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder={t('scanProduct')}
               className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
               value={searchQuery}
               onChange={e => {
                   setSearchQuery(e.target.value);
                   // Instant Scan Logic
                   const exactMatch = products.find(p => p.barcode === e.target.value);
                   if (exactMatch) {
                       addToCart(exactMatch);
                       setSearchQuery('');
                   }
               }}
               autoFocus
             />
           </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="bg-white p-3 rounded-lg shadow hover:shadow-md cursor-pointer transition-transform transform hover:-translate-y-1 flex flex-col items-center text-center group h-full"
                >
                  <div className="h-24 w-full flex items-center justify-center mb-2 bg-gray-100 rounded overflow-hidden">
                     <img src={product.image} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5em]">{product.name}</h4>
                  <div className="mt-auto pt-2 w-full">
                    <span className="block text-primary font-bold text-lg">{settings.currency}{product.salesPrice.toFixed(2)}</span>
                    <span className={`text-xs block ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {product.stock > 0 ? `${product.stock} ${t('available')}` : t('outOfStock')}
                    </span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-1/3 min-w-[350px] bg-white rounded-lg shadow flex flex-col">
         {/* Customer Selector (Searchable) */}
         <div className="p-4 border-b bg-gray-50 relative">
            <label className="text-xs text-gray-500 flex items-center mb-1">
                <User size={12} className="mr-1"/> {t('customer')}
            </label>
            <div className="relative">
                <div 
                    className="w-full border rounded p-2 text-sm bg-white flex justify-between items-center cursor-pointer"
                    onClick={() => setShowCustDropdown(!showCustDropdown)}
                >
                    <span>{customers.find(c => c.id === selectedCustomerId)?.name || t('selectCustomer')}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                {showCustDropdown && (
                    <div className="absolute top-full left-0 w-full bg-white border rounded shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
                        <div className="p-2 sticky top-0 bg-white border-b">
                            <input 
                                className="w-full border p-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder={t('searchPlaceholder')}
                                value={custSearch}
                                onChange={e => setCustSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {filteredCustomers.map(c => (
                            <div 
                                key={c.id} 
                                className={`p-2 hover:bg-gray-100 cursor-pointer text-sm ${selectedCustomerId === c.id ? 'bg-blue-50 font-bold' : ''}`}
                                onClick={() => {
                                    setSelectedCustomerId(c.id);
                                    setShowCustDropdown(false);
                                    setCustSearch('');
                                }}
                            >
                                {c.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <FileText size={40} />
                    </div>
                    <p>{t('emptyCart')}</p>
                    <p className="text-xs">{t('scanToStart')}</p>
                </div>
            ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 shadow-sm">
                    <div className="flex-1">
                       <p className="font-medium text-sm leading-tight">{item.productName}</p>
                       <p className="text-xs text-gray-500 mt-1">{item.quantity} x {settings.currency}{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-1 mx-2">
                       <button onClick={() => updateQty(item.productId, -1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-red-50 text-red-500"><Minus size={14}/></button>
                       <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                       <button onClick={() => updateQty(item.productId, 1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-green-50 text-green-500"><Plus size={14}/></button>
                    </div>
                    <div className="flex flex-col items-end min-w-[60px]">
                       <span className="font-bold text-sm">{settings.currency}{item.total.toFixed(2)}</span>
                       <button onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-500 mt-1"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))
            )}
         </div>

         {/* Footer */}
         <div className="p-4 border-t bg-gray-50">
            <div className="space-y-1 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>{t('subtotal')}:</span>
                    <span>{settings.currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                    <span>{t('discount')} {currentCustomer && currentCustomer.discountRate > 0 && `(${currentCustomer.discountRate}%)`}:</span>
                    <span>-{settings.currency}{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-2xl text-dark mt-2 pt-2 border-t border-gray-200">
                    <span>{t('totalAmount')}:</span>
                    <span>{settings.currency}{total.toFixed(2)}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
               <button 
                 disabled={cart.length === 0 || isProcessing}
                 onClick={() => initiateCheckout(PaymentMethod.CASH)}
                 className="flex flex-col items-center justify-center py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
               >
                 <Banknote size={20} className="mb-1" />
                 <span className="text-xs font-bold">{t('cash')}</span>
               </button>
               <button 
                 disabled={cart.length === 0 || isProcessing}
                 onClick={() => initiateCheckout(PaymentMethod.CARD)}
                 className="flex flex-col items-center justify-center py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
               >
                 <CreditCard size={20} className="mb-1" />
                 <span className="text-xs font-bold">{t('card')}</span>
               </button>
               <button 
                 disabled={cart.length === 0 || isProcessing}
                 onClick={() => initiateCheckout(PaymentMethod.CREDIT)}
                 className="flex flex-col items-center justify-center py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
               >
                 <User size={20} className="mb-1" />
                 <span className="text-xs font-bold">{t('credit')}</span>
               </button>
            </div>

            {/* Extra POS Actions */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
               <button 
                 className="flex flex-col items-center justify-center py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors shadow-sm"
                 onClick={() => alert("Opening Cash Drawer...")}
               >
                 <Unlock size={16} className="mb-1" />
                 <span className="text-[10px] font-bold uppercase">{t('posOpen')}</span>
               </button>
               <button 
                 className="flex flex-col items-center justify-center py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm"
                 onClick={() => alert("Closing Register (Z Report)...")}
               >
                 <Lock size={16} className="mb-1" />
                 <span className="text-[10px] font-bold uppercase">{t('posClose')}</span>
               </button>
               <button 
                 className="flex flex-col items-center justify-center py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors shadow-sm"
                 onClick={() => alert("Printing X Report...")}
               >
                 <FileText size={16} className="mb-1" />
                 <span className="text-[10px] font-bold uppercase">{t('xReport')}</span>
               </button>
            </div>
         </div>
      </div>

      {/* BANK SELECTION MODAL */}
      {showBankSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">{t('selectBank')}</h3>
                  <select 
                    className="w-full border p-2 rounded mb-4"
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                  >
                      {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
                  <div className="flex justify-end space-x-2">
                      <button onClick={() => setShowBankSelect(false)} className="px-4 py-2 border rounded">{t('cancel')}</button>
                      <button 
                        onClick={() => {
                            if(!selectedBankId) {
                                alert(t('noBankSelected'));
                                return;
                            }
                            handleCheckout(PaymentMethod.CARD, selectedBankId);
                        }} 
                        className="px-4 py-2 bg-primary text-white rounded"
                      >
                          {t('confirm')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && lastInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-lg shadow-xl overflow-hidden animate-fade-in-up">
                  <div className="bg-green-600 p-4 text-white text-center">
                      <CheckCircle size={48} className="mx-auto mb-2 opacity-90"/>
                      <h3 className="text-xl font-bold">{t('saleSuccessful')}</h3>
                  </div>
                  <div className="p-6">
                      <div className="text-center mb-6">
                          <p className="text-gray-500 text-sm">{t('totalAmount')}</p>
                          <p className="text-3xl font-bold text-gray-800">{settings.currency}{lastInvoice.total.toFixed(2)}</p>
                      </div>
                      
                      <div className="space-y-2 mb-6 text-sm border-t border-b py-4">
                          <div className="flex justify-between"><span>{t('date')}:</span> <span>{new Date(lastInvoice.date).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>{t('invoice')} #:</span> <span className="font-mono">{lastInvoice.id.slice(-6)}</span></div>
                          <div className="flex justify-between"><span>{t('customer')}:</span> <span>{lastInvoice.partnerName}</span></div>
                          <div className="flex justify-between"><span>{t('paymentTerms')}:</span> <span>{t(lastInvoice.paymentMethod.toLowerCase())}</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <button 
                              onClick={handlePrint}
                              className="flex items-center justify-center py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium"
                          >
                              <Printer size={18} className="mr-2"/> {t('printReceipt')}
                          </button>
                          <button 
                              onClick={() => setShowReceipt(false)}
                              className="flex items-center justify-center py-2 bg-primary text-white rounded hover:bg-indigo-700 font-medium"
                          >
                              {t('newSale')}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
