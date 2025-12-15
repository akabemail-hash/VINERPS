
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Product, Category, Brand, Customer, Supplier, 
  Invoice, Language, UserRole, Transaction, PaymentMethod, ExpenseCategory, InvoiceItem,
  Location, Unit, AppSettings, TransferDocument, TransferItem, BankAccount,
  Employee, LeaveRequest, Account, SystemLinkType, Role, CashRegister, Permission
} from '../types';
import { getTranslation } from '../utils/i18n';

interface StoreState {
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Theme
  darkMode: boolean;
  toggleTheme: () => void;

  currentUser: User | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  updateUserProfile: (id: string, data: Partial<User>) => void;
  checkPermission: (perm: Permission) => boolean;

  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  
  products: Product[];
  categories: Category[];
  brands: Brand[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  transactions: Transaction[];
  transfers: TransferDocument[];
  expenseCategories: ExpenseCategory[];
  users: User[];
  
  // Security & Location Management
  roles: Role[];
  addRole: (r: Role) => void;
  updateRole: (r: Role) => void;
  deleteRole: (id: string) => void;

  locations: Location[];
  cashRegisters: CashRegister[];
  addCashRegister: (cr: CashRegister) => void;
  updateCashRegister: (cr: CashRegister) => void;
  deleteCashRegister: (id: string) => void;

  units: Unit[];
  banks: BankAccount[];
  employees: Employee[];
  leaves: LeaveRequest[];
  accounts: Account[]; // Accounting
  
  // Kassa Brands List (Dynamic)
  kassaBrands: string[];
  addKassaBrand: (name: string) => void;
  updateKassaBrand: (oldName: string, newName: string) => void;
  deleteKassaBrand: (name: string) => void;

  // Actions
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  
  addBrand: (b: Brand) => void;
  updateBrand: (b: Brand) => void;
  deleteBrand: (id: string) => void;

  addLocation: (l: Location) => void;
  updateLocation: (l: Location) => void; 
  deleteLocation: (id: string) => void;
  
  addUnit: (u: Unit) => void;
  updateUnit: (u: Unit) => void;
  deleteUnit: (id: string) => void;

  addCustomer: (c: Customer) => void;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (s: Supplier) => void;
  updateSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;

  addInvoice: (inv: Invoice) => boolean; 
  updateInvoice: (inv: Invoice) => boolean;
  deleteInvoice: (id: string) => void;
  
  // Transaction / Expense Logic
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addExpenseCategory: (name: string) => void;
  updateExpenseCategory: (id: string, name: string) => void;
  deleteExpenseCategory: (id: string) => void;

  // Banks
  addBank: (b: BankAccount) => void;
  updateBank: (b: BankAccount) => void;
  deleteBank: (id: string) => void;

  // Stock Transfers
  addTransfer: (t: TransferDocument) => boolean;
  updateTransfer: (t: TransferDocument) => boolean;
  deleteTransfer: (id: string) => void;

  // HR
  addEmployee: (e: Employee) => void;
  updateEmployee: (e: Employee) => void;
  deleteEmployee: (id: string) => void;
  
  addLeave: (l: LeaveRequest) => void;
  updateLeave: (l: LeaveRequest) => void;
  deleteLeave: (id: string) => void;

  // Accounting
  addAccount: (a: Account) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

// --- INITIAL ROLES ---
const INITIAL_ROLES: Role[] = [
  { 
    id: 'admin_role', 
    name: 'Administrator', 
    permissions: [
      'view_dashboard', 'view_pos', 'view_products', 'view_sales', 'view_purchases',
      'view_returns', 'view_finance', 'view_accounting', 'view_transfer', 
      'view_hr', 'view_partners', 'view_reports', 'view_admin', 'manage_users'
    ] 
  },
  { 
    id: 'manager_role', 
    name: 'Store Manager', 
    permissions: [
      'view_dashboard', 'view_pos', 'view_products', 'view_sales', 'view_purchases',
      'view_returns', 'view_transfer', 'view_reports', 'view_partners'
    ] 
  },
  { 
    id: 'cashier_role', 
    name: 'Cashier', 
    permissions: ['view_pos', 'view_sales', 'view_returns'] 
  }
];

// --- INITIAL USERS ---
const INITIAL_USERS: User[] = [
    { 
      id: 'u1', username: 'admin', role: UserRole.ADMIN, roleId: 'admin_role', password: '1234', firstName: 'Admin', lastName: 'İstifadəçi',
      allowedStoreIds: ['loc2'], allowedWarehouseIds: ['loc1']
    },
    { 
      id: 'u2', username: 'staff', role: UserRole.STAFF, roleId: 'cashier_role', password: '1234', firstName: 'Elvin', lastName: 'Məmmədov',
      allowedStoreIds: ['loc2'] 
    }
];

const INITIAL_SETTINGS: AppSettings = {
    currency: '₼',
    allowNegativeStock: true,
    themeColor: 'blue',
    baseFontSize: 14,
    companyName: 'VinERP-POS Qlobal MMC',
    companyVoen: '9988776655',
    companyPhone: '+994 50 123 45 67',
    companyLogo: '',
    kassaConfig: { ip: '192.168.1.100', selectedBrand: 'Epson' }
};

const INITIAL_KASSA_BRANDS = ['Epson', 'Star', 'Bixolon', 'Custom'];

const INITIAL_CATEGORIES: Category[] = [
    { id: 'c1', name: 'Elektronika' },
    { id: 'c2', name: 'Geyim' },
    { id: 'c3', name: 'Ərzaq' }
];

const INITIAL_BRANDS: Brand[] = [
    { id: 'b1', name: 'Sony' },
    { id: 'b2', name: 'Samsung' },
    { id: 'b3', name: 'Nike' },
    { id: 'b4', name: 'Nestle' }
];

const INITIAL_LOCATIONS: Location[] = [
    { id: 'loc1', name: 'Əsas Anbar', type: 'WAREHOUSE' },
    { id: 'loc2', name: 'Mərkəz Mağaza', type: 'STORE', linkedWarehouseIds: ['loc1'] }
];

const INITIAL_CASH_REGISTERS: CashRegister[] = [
    { id: 'cr1', name: 'Kassa 1', storeId: 'loc2' },
    { id: 'cr2', name: 'Kassa 2', storeId: 'loc2' }
];

const INITIAL_UNITS: Unit[] = [
    { id: 'un1', name: 'Ədəd', shortName: 'əd' },
    { id: 'un2', name: 'Kiloqram', shortName: 'kq' }
];

const INITIAL_PRODUCTS: Product[] = [
    { 
        id: 'p1', code: 'P001', barcode: '123456789', name: 'Sony Qulaqlıq WH-1000XM5', 
        brandId: 'b1', categoryId: 'c1', unitId: 'un1', 
        salesPrice: 450.00, purchasePrice: 350.00, vatRate: 18, vatIncluded: true,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=200', 
        stock: 50, stocks: { 'loc1': 30, 'loc2': 20 }
    },
    { 
        id: 'p2', code: 'P002', barcode: '987654321', name: 'Samsung Galaxy S24', 
        brandId: 'b2', categoryId: 'c1', unitId: 'un1', 
        salesPrice: 2100.00, purchasePrice: 1800.00, vatRate: 18, vatIncluded: true,
        image: 'https://images.unsplash.com/photo-1610945265078-38584e269077?auto=format&fit=crop&q=80&w=200', 
        stock: 15, stocks: { 'loc1': 10, 'loc2': 5 }
    },
    { 
        id: 'p3', code: 'P003', barcode: '456123789', name: 'Nike Air Max', 
        brandId: 'b3', categoryId: 'c2', unitId: 'un1', 
        salesPrice: 250.00, purchasePrice: 120.00, vatRate: 18, vatIncluded: true,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200', 
        stock: 100, stocks: { 'loc1': 80, 'loc2': 20 }
    },
];

const INITIAL_CUSTOMERS: Customer[] = [
    { id: 'gen', name: 'Ümumi Müştəri', type: 'general', discountRate: 0, balance: 0 },
    { id: 'c1', name: 'Əliyev Vəli', type: 'individual', discountRate: 5, balance: 0, phone: '+994 55 555 55 55' },
    { id: 'c2', name: 'Texno MMC', type: 'corporate', discountRate: 10, balance: -500, phone: '+994 12 444 44 44', dueDay: 30 }
];

const INITIAL_SUPPLIERS: Supplier[] = [
    { id: 's1', name: 'Qlobal Elektronika MMC', balance: 2000, phone: '+994 12 333 33 33', contactPerson: 'Rəşad M.' }
];

const INITIAL_EXP_CATS: ExpenseCategory[] = [
    { id: 'ec1', name: 'İcarə haqqı' },
    { id: 'ec2', name: 'Kommunal' },
    { id: 'ec3', name: 'Maaşlar' },
    { id: 'ec4', name: 'Digər' }
];

const INITIAL_BANKS: BankAccount[] = [
    { id: 'bk1', name: 'Kapital Bank', accountNumber: 'AZ123456789012345678', currency: '₼', initialBalance: 5000 },
    { id: 'bk2', name: 'Paşa Bank', accountNumber: 'AZ098765432109876543', currency: '₼', initialBalance: 12000 }
];

const INITIAL_ACCOUNTS: Account[] = [
    // 1. ASSETS
    { id: 'ac1', code: '100', name: 'Aktivlər (Assets)', level: 1, systemLink: 'NONE' },
        { id: 'ac1-1', code: '101', name: 'Dövriyyə Vəsaitləri (Current Assets)', level: 2, parentId: 'ac1', systemLink: 'NONE' },
            { id: 'ac1-1-1', code: '101.1', name: 'Kassa (Cash)', level: 3, parentId: 'ac1-1', systemLink: 'CASH' },
                { id: 'ac1-1-1-1', code: '101.1.1', name: 'Kassa 1 (Main Store)', level: 4, parentId: 'ac1-1-1', systemLink: 'CASH_REGISTER', systemLinkId: 'cr1' },
            { id: 'ac1-1-2', code: '101.2', name: 'Bank Hesabları', level: 3, parentId: 'ac1-1', systemLink: 'NONE' },
                { id: 'ac1-1-2-1', code: '101.2.1', name: 'Kapital Bank', level: 4, parentId: 'ac1-1-2', systemLink: 'BANK', systemLinkId: 'bk1' },
                { id: 'ac1-1-2-2', code: '101.2.2', name: 'Paşa Bank', level: 4, parentId: 'ac1-1-2', systemLink: 'BANK', systemLinkId: 'bk2' },
            { id: 'ac1-1-3', code: '101.3', name: 'Anbar (Inventory)', level: 3, parentId: 'ac1-1', systemLink: 'NONE' },
                { id: 'ac1-1-3-1', code: '101.3.1', name: 'Elektronika', level: 4, parentId: 'ac1-1-3', systemLink: 'INVENTORY', systemLinkId: 'c1' },
                { id: 'ac1-1-3-2', code: '101.3.2', name: 'Geyim', level: 4, parentId: 'ac1-1-3', systemLink: 'INVENTORY', systemLinkId: 'c2' },
            { id: 'ac1-1-4', code: '101.4', name: 'Debitor Borclar (AR)', level: 3, parentId: 'ac1-1', systemLink: 'NONE' },
                { id: 'ac1-1-4-1', code: '101.4.1', name: 'Texno MMC Borcu', level: 4, parentId: 'ac1-1-4', systemLink: 'CUSTOMER_AR', systemLinkId: 'c2' },

    // 2. LIABILITIES
    { id: 'ac2', code: '200', name: 'Öhdəliklər (Liabilities)', level: 1, systemLink: 'NONE' },
        { id: 'ac2-1', code: '201', name: 'Kreditor Borclar (AP)', level: 2, parentId: 'ac2', systemLink: 'NONE' },

    // 3. EQUITY
    { id: 'ac3', code: '300', name: 'Kapital (Equity)', level: 1, systemLink: 'NONE' },

    // 4. INCOME
    { id: 'ac4', code: '400', name: 'Gəlirlər (Income)', level: 1, systemLink: 'NONE' },
        { id: 'ac4-1', code: '401', name: 'Satış Gəlirləri', level: 2, parentId: 'ac4', systemLink: 'NONE' },
            { id: 'ac4-1-1', code: '401.1', name: 'Müştəri Satışları (Texno)', level: 3, parentId: 'ac4-1', systemLink: 'SALES', systemLinkId: 'c2' },
            { id: 'ac4-1-2', code: '401.2', name: 'Ümumi Pərakəndə', level: 3, parentId: 'ac4-1', systemLink: 'SALES', systemLinkId: 'gen' },

    // 5. EXPENSES
    { id: 'ac5', code: '500', name: 'Xərclər (Expenses)', level: 1, systemLink: 'NONE' },
        { id: 'ac5-1', code: '501', name: 'İnzibati Xərclər', level: 2, parentId: 'ac5', systemLink: 'NONE' },
            { id: 'ac5-1-1', code: '501.1', name: 'İcarə (Rent)', level: 3, parentId: 'ac5-1', systemLink: 'EXPENSE', systemLinkId: 'ec1' },
            { id: 'ac5-1-2', code: '501.2', name: 'Kommunal', level: 3, parentId: 'ac5-1', systemLink: 'EXPENSE', systemLinkId: 'ec2' },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('az'); // Default to Azerbaijani for local context
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<TransferDocument[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(INITIAL_EXP_CATS);
  const [kassaBrands, setKassaBrands] = useState<string[]>(INITIAL_KASSA_BRANDS);
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>(INITIAL_CASH_REGISTERS);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [banks, setBanks] = useState<BankAccount[]>(INITIAL_BANKS);
  
  // HR & Accounting
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);

  const updateSettings = (s: AppSettings) => setSettings(s);

  // Theme & Appearance Effect
  useEffect(() => {
    // 1. Dark Mode Class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Apply Dynamic Theme Settings (Color & Font Size)
    const root = document.documentElement;
    
    // Font Size
    root.style.fontSize = `${settings.baseFontSize}px`;
    
    // Theme Color
    let color = '#2563eb'; // Default Blue
    switch(settings.themeColor) {
        case 'purple': color = '#9333ea'; break;
        case 'green': color = '#16a34a'; break;
        case 'red': color = '#dc2626'; break;
        default: color = '#2563eb';
    }
    root.style.setProperty('--color-primary', color);

  }, [darkMode, settings]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Auth
  const login = (u: string, p: string) => {
    const user = users.find(user => user.username === u && user.password === p);
    if (user) {
        setCurrentUser(user);
        return true;
    }
    return false;
  };

  const logout = () => {
      setCurrentUser(null);
  };

  const updateUserProfile = (id: string, data: Partial<User>) => {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      if (currentUser?.id === id) {
          setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      }
  };

  const checkPermission = (perm: Permission): boolean => {
      if (!currentUser) return false;
      const role = roles.find(r => r.id === currentUser.roleId);
      return role?.permissions.includes(perm) || false;
  };

  // Products
  const addProduct = (p: Product) => setProducts([...products, p]);
  const updateProduct = (p: Product) => setProducts(products.map(prod => prod.id === p.id ? p : prod));

  // --- Invoice Management (Add, Update, Delete with Stock Logic) ---

  const applyInvoiceEffects = (inv: Invoice, isReversal: boolean = false) => {
      const multiplier = isReversal ? -1 : 1;

      // 1. Stock Updates
      setProducts(prevProducts => prevProducts.map(p => {
          const item = inv.items.find(i => i.productId === p.id);
          if (item) {
              const qty = (item.returnedQuantity || item.quantity) * multiplier; // Use returnedQuantity for returns if available, else quantity
              let newStock = p.stock;
              let newLocStocks = { ...p.stocks };
              let locId = inv.locationId || 'loc1';

              if (inv.type === 'SALE') {
                  // Sale: Deduct stock. Reversal: Add stock.
                  newStock -= qty;
                  newLocStocks[locId] = (newLocStocks[locId] || 0) - qty;
              } else if (inv.type === 'PURCHASE') {
                  // Purchase: Add stock. Reversal: Deduct stock.
                  newStock += qty;
                  newLocStocks[locId] = (newLocStocks[locId] || 0) + qty;
              } else if (inv.type === 'SALE_RETURN') {
                  // Sale Return: Add stock (Customer returned). Reversal: Deduct stock.
                  newStock += qty;
                  newLocStocks[locId] = (newLocStocks[locId] || 0) + qty;
              } else if (inv.type === 'PURCHASE_RETURN') {
                  // Purchase Return: Deduct stock (Returned to supplier). Reversal: Add stock.
                  newStock -= qty;
                  newLocStocks[locId] = (newLocStocks[locId] || 0) - qty;
              }
              return { ...p, stock: newStock, stocks: newLocStocks };
          }
          return p;
      }));

      // 2. Financials (Transactions & Partner Balances)
      if (isReversal) {
          // Remove linked transactions
          setTransactions(prev => prev.filter(t => t.relatedInvoiceId !== inv.id));
          
          // Revert Partner Balance if Credit
          if (inv.paymentMethod === PaymentMethod.CREDIT) {
              const change = inv.total * multiplier; // if multiplier is -1 (reversal), we negate the original effect
              if (inv.type === 'SALE' || inv.type === 'SALE_RETURN') {
                   if (inv.type === 'SALE') {
                       updateCustomer(c => c.id === inv.partnerId ? { ...c, balance: c.balance - inv.total } : c);
                   }
              } else if (inv.type === 'PURCHASE') {
                   updateSupplier(s => s.id === inv.partnerId ? { ...s, balance: s.balance - inv.total } : s);
              }
          }
      } else {
          // ADD LOGIC (Copied and adapted from original addInvoice)
          
          // Add Transaction
          const isReturn = inv.type.includes('RETURN');
          let tType: 'INCOME' | 'EXPENSE' = 'INCOME';
          let cat = '';
          
          if (inv.type === 'SALE') { tType = 'INCOME'; cat = 'SALES'; }
          else if (inv.type === 'PURCHASE') { tType = 'EXPENSE'; cat = 'PURCHASE'; }
          else if (inv.type === 'SALE_RETURN') { tType = 'EXPENSE'; cat = 'SALES_RETURN'; } // Refund
          else if (inv.type === 'PURCHASE_RETURN') { tType = 'INCOME'; cat = 'PURCHASE_RETURN'; } // Refund received

          // Only add transaction if NOT credit (immediate payment)
          if (inv.paymentMethod !== PaymentMethod.CREDIT) {
                addTransaction({
                    id: `TRX-${inv.id}`, // Link ID to Invoice ID for easy deletion
                    date: inv.date,
                    type: tType,
                    category: cat,
                    amount: inv.total,
                    description: `${inv.type.replace('_', ' ')} Invoice #${inv.id}`,
                    source: inv.paymentMethod === PaymentMethod.CASH ? 'CASH_REGISTER' : 'BANK',
                    bankId: inv.bankId,
                    partnerId: inv.partnerId,
                    relatedInvoiceId: inv.id,
                    user: currentUser?.username || 'sys'
                });
          }

          // Update Partner Balance if Credit
          if (inv.paymentMethod === PaymentMethod.CREDIT) {
               if (inv.type === 'SALE') {
                   updateCustomer(c => c.id === inv.partnerId ? { ...c, balance: c.balance + inv.total } : c);
               } else if (inv.type === 'PURCHASE') {
                   updateSupplier(s => s.id === inv.partnerId ? { ...s, balance: s.balance + inv.total } : s);
               }
          }
      }
  };

  // Helper for functional updates
  const updateCustomer = (updater: (c: Customer) => Customer) => {
      setCustomers(prev => prev.map(updater));
  };
  const updateSupplier = (updater: (s: Supplier) => Supplier) => {
      setSuppliers(prev => prev.map(updater));
  };


  const addInvoice = (inv: Invoice): boolean => {
      // Validation for negative stock
      if ((inv.type === 'SALE' || inv.type === 'PURCHASE_RETURN') && !settings.allowNegativeStock) {
             const insufficient = inv.items.some(item => {
                 const prod = products.find(p => p.id === item.productId);
                 return prod && prod.stock < (item.returnedQuantity || item.quantity);
             });
             if (insufficient) {
                 alert("Insufficient Stock!");
                 return false;
             }
      }

      applyInvoiceEffects(inv, false);
      setInvoices([...invoices, inv]);
      return true;
  };

  const updateInvoice = (inv: Invoice): boolean => {
      const oldInv = invoices.find(i => i.id === inv.id);
      if (!oldInv) return false;

      // 1. Revert Old Invoice Effects
      applyInvoiceEffects(oldInv, true);

      // 2. Apply New Invoice Effects
      applyInvoiceEffects(inv, false);

      // 3. Update State
      setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i));
      return true;
  };

  const deleteInvoice = (id: string) => {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;

      // Revert Effects
      applyInvoiceEffects(inv, true);

      // Remove Invoice
      setInvoices(prev => prev.filter(i => i.id !== id));
  };

  // Basic CRUD Handlers
  const addCategory = (c: Category) => setCategories([...categories, c]);
  const updateCategory = (c: Category) => setCategories(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(x => x.id !== id));

  const addBrand = (b: Brand) => setBrands([...brands, b]);
  const updateBrand = (b: Brand) => setBrands(prev => prev.map(x => x.id === b.id ? b : x));
  const deleteBrand = (id: string) => setBrands(prev => prev.filter(x => x.id !== id));

  const addLocation = (l: Location) => setLocations([...locations, l]);
  const updateLocation = (l: Location) => setLocations(prev => prev.map(x => x.id === l.id ? l : x));
  const deleteLocation = (id: string) => setLocations(prev => prev.filter(x => x.id !== id));

  const addUnit = (u: Unit) => setUnits([...units, u]);
  const updateUnit = (u: Unit) => setUnits(prev => prev.map(x => x.id === u.id ? u : x));
  const deleteUnit = (id: string) => setUnits(prev => prev.filter(x => x.id !== id));

  const addCustomer = (c: Customer) => setCustomers([...customers, c]);
  const updateCustomerCRUD = (c: Customer) => setCustomers(prev => prev.map(x => x.id === c.id ? c : x)); // Renamed to avoid clash with helper
  const deleteCustomer = (id: string) => setCustomers(prev => prev.filter(x => x.id !== id));

  const addSupplier = (s: Supplier) => setSuppliers([...suppliers, s]);
  const updateSupplierCRUD = (s: Supplier) => setSuppliers(prev => prev.map(x => x.id === s.id ? s : x)); // Renamed
  const deleteSupplier = (id: string) => setSuppliers(prev => prev.filter(x => x.id !== id));

  const addTransaction = (t: Transaction) => {
      setTransactions(prev => [...prev, t]);
      // If payment from/to partner (Standalone transaction, not linked to Invoice via addInvoice logic)
      // Note: addInvoice handles its own transaction creation. This is for manual Finance page transactions.
      if (t.partnerId && !t.relatedInvoiceId) {
          const cust = customers.find(c => c.id === t.partnerId);
          if (cust) {
              const change = t.type === 'INCOME' ? -t.amount : t.amount; 
              updateCustomerCRUD({...cust, balance: cust.balance + change});
          }
          const supp = suppliers.find(s => s.id === t.partnerId);
          if (supp) {
              const change = t.type === 'EXPENSE' ? -t.amount : t.amount;
              updateSupplierCRUD({...supp, balance: supp.balance + change});
          }
      }
  };
  const updateTransaction = (t: Transaction) => setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(x => x.id !== id));

  const addExpenseCategory = (name: string) => setExpenseCategories([...expenseCategories, { id: Date.now().toString(), name }]);
  const updateExpenseCategory = (id: string, name: string) => setExpenseCategories(prev => prev.map(x => x.id === id ? { ...x, name } : x));
  const deleteExpenseCategory = (id: string) => setExpenseCategories(prev => prev.filter(x => x.id !== id));

  const addBank = (b: BankAccount) => setBanks([...banks, b]);
  const updateBank = (b: BankAccount) => setBanks(prev => prev.map(x => x.id === b.id ? b : x));
  const deleteBank = (id: string) => setBanks(prev => prev.filter(x => x.id !== id));

  // Security & Locations
  const addRole = (r: Role) => setRoles([...roles, r]);
  const updateRole = (r: Role) => setRoles(prev => prev.map(x => x.id === r.id ? r : x));
  const deleteRole = (id: string) => setRoles(prev => prev.filter(x => x.id !== id));

  const addCashRegister = (cr: CashRegister) => setCashRegisters([...cashRegisters, cr]);
  const updateCashRegister = (cr: CashRegister) => setCashRegisters(prev => prev.map(x => x.id === cr.id ? cr : x));
  const deleteCashRegister = (id: string) => setCashRegisters(prev => prev.filter(x => x.id !== id));

  const addUser = (u: User) => setUsers([...users, u]);
  const updateUser = (u: User) => {
      setUsers(prev => prev.map(x => x.id === u.id ? u : x));
      // Update current user if self-edit (handled lightly here)
      if (currentUser?.id === u.id) setCurrentUser(u);
  };
  const deleteUser = (id: string) => setUsers(prev => prev.filter(x => x.id !== id));

  // Kassa Brands
  const addKassaBrand = (name: string) => setKassaBrands([...kassaBrands, name]);
  const updateKassaBrand = (oldName: string, newName: string) => setKassaBrands(prev => prev.map(b => b === oldName ? newName : b));
  const deleteKassaBrand = (name: string) => setKassaBrands(prev => prev.filter(b => b !== name));

  // Transfers
  const addTransfer = (t: TransferDocument): boolean => {
      // Validate Stock
      const possible = t.items.every(item => {
          const p = products.find(prod => prod.id === item.productId);
          return p && (p.stocks?.[t.sourceLocationId] || 0) >= item.quantity;
      });
      if(!possible && !settings.allowNegativeStock) {
          alert('Insufficient stock at source location!');
          return false;
      }

      // Execute Transfer
      setProducts(prev => prev.map(p => {
          const item = t.items.find(i => i.productId === p.id);
          if (item) {
              const newStocks = { ...p.stocks };
              newStocks[t.sourceLocationId] = (newStocks[t.sourceLocationId] || 0) - item.quantity;
              newStocks[t.targetLocationId] = (newStocks[t.targetLocationId] || 0) + item.quantity;
              return { ...p, stocks: newStocks };
          }
          return p;
      }));
      setTransfers([...transfers, t]);
      return true;
  };
  const updateTransfer = (t: TransferDocument) => { setTransfers(prev => prev.map(x => x.id === t.id ? t : x)); return true; };
  const deleteTransfer = (id: string) => setTransfers(prev => prev.filter(x => x.id !== id));

  // HR
  const addEmployee = (e: Employee) => setEmployees([...employees, e]);
  const updateEmployee = (e: Employee) => setEmployees(prev => prev.map(x => x.id === e.id ? e : x));
  const deleteEmployee = (id: string) => setEmployees(prev => prev.filter(x => x.id !== id));
  
  const addLeave = (l: LeaveRequest) => setLeaves([...leaves, l]);
  const updateLeave = (l: LeaveRequest) => setLeaves(prev => prev.map(x => x.id === l.id ? l : x));
  const deleteLeave = (id: string) => setLeaves(prev => prev.filter(x => x.id !== id));

  // Accounting
  const addAccount = (a: Account) => setAccounts([...accounts, a]);
  const updateAccount = (a: Account) => setAccounts(prev => prev.map(x => x.id === a.id ? a : x));
  const deleteAccount = (id: string) => setAccounts(prev => prev.filter(x => x.id !== id));


  return (
    <StoreContext.Provider value={{
      language, setLanguage, darkMode, toggleTheme, currentUser, login, logout, updateUserProfile, checkPermission,
      settings, updateSettings, products, addProduct, updateProduct, categories, addCategory, updateCategory, deleteCategory,
      brands, addBrand, updateBrand, deleteBrand, customers, addCustomer, updateCustomer: updateCustomerCRUD, deleteCustomer,
      suppliers, addSupplier, updateSupplier: updateSupplierCRUD, deleteSupplier, invoices, addInvoice, updateInvoice, deleteInvoice, transactions, addTransaction, updateTransaction, deleteTransaction,
      transfers, addTransfer, updateTransfer, deleteTransfer, expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
      kassaBrands, addKassaBrand, updateKassaBrand, deleteKassaBrand, users, addUser, updateUser, deleteUser,
      locations, addLocation, updateLocation, deleteLocation,
      cashRegisters, addCashRegister, updateCashRegister, deleteCashRegister,
      roles, addRole, updateRole, deleteRole,
      units, addUnit, updateUnit, deleteUnit, banks, addBank, updateBank, deleteBank,
      employees, addEmployee, updateEmployee, deleteEmployee, leaves, addLeave, updateLeave, deleteLeave,
      accounts, addAccount, updateAccount, deleteAccount
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
