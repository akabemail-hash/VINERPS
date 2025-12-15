
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, Location, User, Role, Permission, CashRegister } from '../types';
import { getTranslation } from '../utils/i18n';
import { Trash2, Plus, Settings as SettingsIcon, Database, MapPin, Tag, Box, Building2, Monitor, Edit2, Palette, Type, DollarSign, X, Users, Lock, Shield } from 'lucide-react';

export const Admin = () => {
  const { 
    currentUser, settings, updateSettings, language,
    categories, addCategory, deleteCategory, updateCategory,
    brands, addBrand, deleteBrand, updateBrand,
    locations, addLocation, deleteLocation, updateLocation,
    units, addUnit, deleteUnit, updateUnit,
    kassaBrands, addKassaBrand, deleteKassaBrand, updateKassaBrand,
    expenseCategories, addExpenseCategory, deleteExpenseCategory, updateExpenseCategory,
    banks, users, addUser, updateUser, deleteUser, roles, addRole, updateRole, deleteRole,
    cashRegisters, addCashRegister, updateCashRegister, deleteCashRegister
  } = useStore();

  const t = (key: string) => getTranslation(language, key);
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'roles' | 'locations' | 'appearance' | 'kassa' | 'settings' | 'categories' | 'brands' | 'units' | 'expenses'>('users');

  // --- STATE FOR USERS ---
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // --- STATE FOR ROLES ---
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // --- STATE FOR LOCATIONS (Advanced) ---
  const [locId, setLocId] = useState<string | null>(null);
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<'WAREHOUSE' | 'STORE'>('WAREHOUSE');
  const [linkedWarehouses, setLinkedWarehouses] = useState<string[]>([]); // For Stores
  const [showLocModal, setShowLocModal] = useState(false);
  // Cash Register State (inside Location Modal)
  const [newRegName, setNewRegName] = useState('');

  // --- STATE FOR OTHERS ---
  const [newCategory, setNewCategory] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [newBrand, setNewBrand] = useState('');
  const [editBrandId, setEditBrandId] = useState<string | null>(null);
  const [newKassaBrand, setNewKassaBrand] = useState('');
  const [editKassaBrandOldName, setEditKassaBrandOldName] = useState<string | null>(null);
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShort, setNewUnitShort] = useState('');
  const [editUnitId, setEditUnitId] = useState<string | null>(null);

  if (currentUser?.role !== UserRole.ADMIN) {
      return <div className="text-red-500 font-bold p-10">{t('accessDenied')}</div>;
  }

  // --- USER HANDLERS ---
  const handleSaveUser = () => {
      if(!editingUser?.username || !editingUser.firstName) return;
      const user: User = {
          id: editingUser.id || `u-${Date.now()}`,
          username: editingUser.username!,
          role: editingUser.roleId === 'admin_role' ? UserRole.ADMIN : UserRole.STAFF, // Fallback for legacy
          roleId: editingUser.roleId || 'cashier_role',
          password: editingUser.password || '1234',
          firstName: editingUser.firstName,
          lastName: editingUser.lastName || '',
          phone: editingUser.phone || '',
          allowedStoreIds: editingUser.allowedStoreIds || [],
          allowedWarehouseIds: editingUser.allowedWarehouseIds || []
      };
      if(editingUser.id) updateUser(user); else addUser(user);
      setShowUserModal(false); setEditingUser(null);
  };

  const handleEditUser = (u: User) => {
      setEditingUser({...u});
      setShowUserModal(true);
  };

  // --- ROLE HANDLERS ---
  const handleSaveRole = () => {
      if(!editingRole?.name) return;
      const role: Role = {
          id: editingRole.id || `role-${Date.now()}`,
          name: editingRole.name!,
          permissions: editingRole.permissions || []
      };
      if(editingRole.id) updateRole(role); else addRole(role);
      setShowRoleModal(false); setEditingRole(null);
  };

  const togglePermission = (perm: Permission) => {
      if(!editingRole) return;
      const current = editingRole.permissions || [];
      if(current.includes(perm)) {
          setEditingRole({...editingRole, permissions: current.filter(p => p !== perm)});
      } else {
          setEditingRole({...editingRole, permissions: [...current, perm]});
      }
  };

  // --- LOCATION HANDLERS ---
  const openLocationModal = (l?: Location) => {
      if (l) {
          setLocId(l.id);
          setLocName(l.name);
          setLocType(l.type);
          setLinkedWarehouses(l.linkedWarehouseIds || []);
      } else {
          setLocId(null);
          setLocName('');
          setLocType('WAREHOUSE');
          setLinkedWarehouses([]);
      }
      setShowLocModal(true);
  };

  const handleSaveLocation = () => {
      if(!locName) return;
      const loc: Location = {
          id: locId || `loc-${Date.now()}`,
          name: locName,
          type: locType,
          linkedWarehouseIds: locType === 'STORE' ? linkedWarehouses : undefined
      };
      if (locId) updateLocation(loc); else addLocation(loc);
      setShowLocModal(false);
  };

  const handleAddRegister = () => {
      if(!newRegName || !locId) return;
      addCashRegister({
          id: `cr-${Date.now()}`,
          name: newRegName,
          storeId: locId
      });
      setNewRegName('');
  };

  // --- GENERIC HANDLERS (Categories, Brands, etc.) ---
  const handleSaveCategory = () => { if (!newCategory) return; editCategoryId ? updateCategory({ id: editCategoryId, name: newCategory }) : addCategory({ id: Date.now().toString(), name: newCategory }); setNewCategory(''); setEditCategoryId(null); };
  const handleSaveBrand = () => { if (!newBrand) return; editBrandId ? updateBrand({ id: editBrandId, name: newBrand }) : addBrand({ id: Date.now().toString(), name: newBrand }); setNewBrand(''); setEditBrandId(null); };
  const handleSaveUnit = () => { if(!newUnitName) return; editUnitId ? updateUnit({ id: editUnitId, name: newUnitName, shortName: newUnitShort }) : addUnit({ id: Date.now().toString(), name: newUnitName, shortName: newUnitShort }); setNewUnitName(''); setNewUnitShort(''); setEditUnitId(null); };
  const handleSaveExpense = () => { if(!newExpenseCat) return; editExpenseId ? updateExpenseCategory(editExpenseId, newExpenseCat) : addExpenseCategory(newExpenseCat); setNewExpenseCat(''); setEditExpenseId(null); };
  const handleSaveKassaBrand = () => { if (!newKassaBrand) return; editKassaBrandOldName ? updateKassaBrand(editKassaBrandOldName, newKassaBrand) : addKassaBrand(newKassaBrand); setNewKassaBrand(''); setEditKassaBrandOldName(null); }

  const tabs = [
      { id: 'users', icon: Users, label: t('usersAndRoles') }, 
      { id: 'locations', icon: MapPin, label: t('location') },
      { id: 'company', icon: Building2, label: t('companyInfo') },
      { id: 'appearance', icon: Palette, label: t('appearance') },
      { id: 'kassa', icon: Monitor, label: t('kassaSettings') },
      { id: 'expenses', icon: DollarSign, label: t('expenses') },
      { id: 'settings', icon: SettingsIcon, label: t('generalSettings') },
      { id: 'categories', icon: Tag, label: t('category') },
      { id: 'brands', icon: Database, label: t('brand') },
      { id: 'units', icon: Box, label: t('unit') },
  ];

  // Permission List
  const availablePermissions: {key: Permission, labelKey: string}[] = [
      { key: 'view_dashboard', labelKey: 'perm_view_dashboard' },
      { key: 'view_pos', labelKey: 'perm_view_pos' },
      { key: 'view_products', labelKey: 'perm_view_products' },
      { key: 'view_sales', labelKey: 'perm_view_sales' },
      { key: 'view_purchases', labelKey: 'perm_view_purchases' },
      { key: 'view_returns', labelKey: 'perm_view_returns' },
      { key: 'view_finance', labelKey: 'perm_view_finance' },
      { key: 'view_accounting', labelKey: 'perm_view_accounting' },
      { key: 'view_transfer', labelKey: 'perm_view_transfer' },
      { key: 'view_hr', labelKey: 'perm_view_hr' },
      { key: 'view_partners', labelKey: 'perm_view_partners' },
      { key: 'view_reports', labelKey: 'perm_view_reports' },
      { key: 'view_admin', labelKey: 'perm_view_admin' },
      { key: 'manage_users', labelKey: 'perm_manage_users' },
  ];

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-white">{t('admin')}</h2>
        
        {/* Navigation */}
        <div className="flex space-x-2 border-b dark:border-gray-700 overflow-x-auto pb-1">
            {tabs.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-4 py-2 whitespace-nowrap text-sm ${activeTab === tab.id ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <tab.icon size={16} className="mr-2"/> {tab.label}
                </button>
            ))}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">

            {/* --- USERS & ROLES TAB --- */}
            {activeTab === 'users' && (
                <div className="space-y-8">
                    {/* User Management */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg dark:text-white">{t('employees')} / {t('username')}</h3>
                            <button onClick={() => { setEditingUser({}); setShowUserModal(true); }} className="bg-primary text-white px-3 py-1.5 rounded text-sm flex items-center"><Plus size={16} className="mr-1"/> {t('add')}</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3">{t('username')}</th>
                                        <th className="p-3">{t('name')}</th>
                                        <th className="p-3">{t('roles')}</th>
                                        <th className="p-3 text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="border-t dark:border-gray-700">
                                            <td className="p-3 font-medium">{u.username}</td>
                                            <td className="p-3">{u.firstName} {u.lastName}</td>
                                            <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{roles.find(r => r.id === u.roleId)?.name || u.role}</span></td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleEditUser(u)} className="text-blue-500 mr-2"><Edit2 size={16}/></button>
                                                <button onClick={() => { if(confirm(t('deleteConfirm'))) deleteUser(u.id); }} className="text-red-500"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <hr className="dark:border-gray-700"/>

                    {/* Role Management */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg dark:text-white">{t('roles')} & {t('permissions')}</h3>
                            <button onClick={() => { setEditingRole({ permissions: [] }); setShowRoleModal(true); }} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-3 py-1.5 rounded text-sm flex items-center border dark:border-gray-600"><Plus size={16} className="mr-1"/> {t('addRole')}</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roles.map(role => (
                                <div key={role.id} className="border dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-primary">{role.name}</h4>
                                        <div className="flex space-x-1">
                                            <button onClick={() => { setEditingRole(role); setShowRoleModal(true); }} className="text-gray-500 hover:text-blue-500"><Edit2 size={14}/></button>
                                            <button onClick={() => deleteRole(role.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {role.permissions.slice(0, 5).map(p => (
                                            <span key={p} className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                                {t(`perm_${p}` as any)}
                                            </span>
                                        ))}
                                        {role.permissions.length > 5 && <span className="text-[10px] text-gray-500">+{role.permissions.length - 5} more</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- LOCATIONS TAB --- */}
            {activeTab === 'locations' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg dark:text-white">{t('allowedStores')} & {t('allowedWarehouses')}</h3>
                        <button onClick={() => openLocationModal()} className="bg-primary text-white px-4 py-2 rounded flex items-center"><Plus size={18} className="mr-2"/> {t('add')}</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {locations.map(l => (
                            <div key={l.id} className="border dark:border-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div>
                                    <div className="flex items-center">
                                        <span className={`p-2 rounded mr-3 ${l.type === 'STORE' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {l.type === 'STORE' ? <Building2 size={20}/> : <Box size={20}/>}
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-lg">{l.name}</h4>
                                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">{l.type}</span>
                                        </div>
                                    </div>
                                    {l.type === 'STORE' && (
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 ml-12">
                                            <p><span className="font-semibold">{t('linkedWarehouses')}:</span> {l.linkedWarehouseIds?.map(wid => locations.find(loc => loc.id === wid)?.name).join(', ') || t('linkNone')}</p>
                                            <p><span className="font-semibold">{t('cashRegisters')}:</span> {cashRegisters.filter(cr => cr.storeId === l.id).map(cr => cr.name).join(', ') || t('linkNone')}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => openLocationModal(l)} className="p-2 border rounded hover:bg-gray-100"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteLocation(l.id)} className="p-2 border rounded text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- COMPANY TAB --- */}
            {activeTab === 'company' && (
                <div className="space-y-4 max-w-lg">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">{t('companyInfo')}</h3>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('companyName')}</label><input className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.companyName} onChange={e => updateSettings({ ...settings, companyName: e.target.value })} /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('voen')}</label><input className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.companyVoen} onChange={e => updateSettings({ ...settings, companyVoen: e.target.value })} /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('companyPhone')}</label><input className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={settings.companyPhone} onChange={e => updateSettings({ ...settings, companyPhone: e.target.value })} /></div>
                </div>
            )}

            {/* --- APPEARANCE TAB --- */}
            {activeTab === 'appearance' && (
                <div className="space-y-6 max-w-lg">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">{t('appearance')}</h3>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">{t('themeColor')}</label>
                        <div className="flex gap-3">
                             <button onClick={() => updateSettings({...settings, themeColor: 'blue'})} className={`w-8 h-8 rounded-full bg-blue-600 ${settings.themeColor === 'blue' ? 'ring-2 ring-offset-2 ring-blue-600 dark:ring-offset-gray-800' : ''}`}></button>
                             <button onClick={() => updateSettings({...settings, themeColor: 'purple'})} className={`w-8 h-8 rounded-full bg-purple-600 ${settings.themeColor === 'purple' ? 'ring-2 ring-offset-2 ring-purple-600 dark:ring-offset-gray-800' : ''}`}></button>
                             <button onClick={() => updateSettings({...settings, themeColor: 'green'})} className={`w-8 h-8 rounded-full bg-green-600 ${settings.themeColor === 'green' ? 'ring-2 ring-offset-2 ring-green-600 dark:ring-offset-gray-800' : ''}`}></button>
                             <button onClick={() => updateSettings({...settings, themeColor: 'red'})} className={`w-8 h-8 rounded-full bg-red-600 ${settings.themeColor === 'red' ? 'ring-2 ring-offset-2 ring-red-600 dark:ring-offset-gray-800' : ''}`}></button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">{t('fontSize')}</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="12" 
                                max="18" 
                                step="1" 
                                value={settings.baseFontSize} 
                                onChange={(e) => updateSettings({ ...settings, baseFontSize: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                            <span className="text-sm font-medium dark:text-gray-300 min-w-[3rem] text-right">{settings.baseFontSize}px</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- KASSA TAB --- */}
            {activeTab === 'kassa' && (
                <div className="space-y-6 max-w-lg">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">{t('kassaSettings')}</h3>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('kassaIp')}</label>
                        <input 
                            className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            value={settings.kassaConfig.ip} 
                            onChange={e => updateSettings({ ...settings, kassaConfig: { ...settings.kassaConfig, ip: e.target.value } })} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('selectKassaBrand')}</label>
                        <select 
                            className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={settings.kassaConfig.selectedBrand}
                            onChange={e => updateSettings({ ...settings, kassaConfig: { ...settings.kassaConfig, selectedBrand: e.target.value } })}
                        >
                            {kassaBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="pt-4 border-t dark:border-gray-700">
                        <label className="block text-sm font-bold mb-2 dark:text-white">{t('defineKassaBrands')}</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                placeholder={t('newBrandName')}
                                value={newKassaBrand} 
                                onChange={e => setNewKassaBrand(e.target.value)} 
                            />
                            <button onClick={handleSaveKassaBrand} className="bg-primary text-white px-4 rounded">{editKassaBrandOldName ? <Edit2 size={18}/> : <Plus/>}</button>
                        </div>
                        <ul className="divide-y dark:divide-gray-700 border rounded dark:border-gray-700 overflow-hidden">
                            {kassaBrands.map(b => (
                                <li key={b} className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                    <span className="dark:text-gray-300">{b}</span>
                                    <div className="flex space-x-2">
                                        <button onClick={() => { setEditKassaBrandOldName(b); setNewKassaBrand(b); }} className="text-blue-500"><Edit2 size={16}/></button>
                                        <button onClick={() => deleteKassaBrand(b)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="space-y-6 max-w-lg">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">{t('generalSettings')}</h3>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('currency')}</label>
                        <input 
                            className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            value={settings.currency} 
                            onChange={e => updateSettings({ ...settings, currency: e.target.value })} 
                        />
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
                        <input 
                            type="checkbox" 
                            id="allowNegative"
                            className="w-4 h-4 text-primary rounded"
                            checked={settings.allowNegativeStock} 
                            onChange={e => updateSettings({ ...settings, allowNegativeStock: e.target.checked })} 
                        />
                        <label htmlFor="allowNegative" className="ml-3 text-sm font-medium dark:text-gray-300 cursor-pointer">{t('allowNegativeStock')}</label>
                    </div>
                </div>
            )}
            
            {/* Reuse existing blocks for Appearance, Kassa, Expenses, etc. */}
            {activeTab === 'categories' && (<div><div className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('category')} value={newCategory} onChange={e => setNewCategory(e.target.value)} /><button onClick={handleSaveCategory} className="bg-primary text-white px-4 rounded">{editCategoryId ? <Edit2 size={18}/> : <Plus/>}</button></div><ul className="divide-y dark:divide-gray-700 border rounded dark:border-gray-700">{categories.map(c => (<li key={c.id} className="p-3 flex justify-between items-center dark:text-gray-300"><span>{c.name}</span><div className="flex space-x-2"><button onClick={() => { setEditCategoryId(c.id); setNewCategory(c.name); }} className="text-blue-500"><Edit2 size={18}/></button><button onClick={() => deleteCategory(c.id)} className="text-red-500"><Trash2 size={18}/></button></div></li>))}</ul></div>)}
            {activeTab === 'brands' && (<div><div className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('brand')} value={newBrand} onChange={e => setNewBrand(e.target.value)} /><button onClick={handleSaveBrand} className="bg-primary text-white px-4 rounded">{editBrandId ? <Edit2 size={18}/> : <Plus/>}</button></div><ul className="divide-y dark:divide-gray-700 border rounded dark:border-gray-700">{brands.map(b => (<li key={b.id} className="p-3 flex justify-between items-center dark:text-gray-300"><span>{b.name}</span><div className="flex space-x-2"><button onClick={() => { setEditBrandId(b.id); setNewBrand(b.name); }} className="text-blue-500"><Edit2 size={18}/></button><button onClick={() => deleteBrand(b.id)} className="text-red-500"><Trash2 size={18}/></button></div></li>))}</ul></div>)}
            {activeTab === 'units' && (<div><div className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('name')} value={newUnitName} onChange={e => setNewUnitName(e.target.value)} /><input className="border p-2 rounded w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('shortName')} value={newUnitShort} onChange={e => setNewUnitShort(e.target.value)} /><button onClick={handleSaveUnit} className="bg-primary text-white px-4 rounded">{editUnitId ? <Edit2 size={18}/> : <Plus/>}</button></div><ul className="divide-y dark:divide-gray-700 border rounded dark:border-gray-700">{units.map(u => (<li key={u.id} className="p-3 flex justify-between items-center dark:text-gray-300"><span>{u.name} ({u.shortName})</span><div className="flex space-x-2"><button onClick={() => { setEditUnitId(u.id); setNewUnitName(u.name); setNewUnitShort(u.shortName); }} className="text-blue-500"><Edit2 size={18}/></button><button onClick={() => deleteUnit(u.id)} className="text-red-500"><Trash2 size={18}/></button></div></li>))}</ul></div>)}
            {activeTab === 'expenses' && (<div><div className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('newExpenseGroup')} value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} /><button onClick={handleSaveExpense} className="bg-primary text-white px-4 rounded">{editExpenseId ? <Edit2 size={18}/> : <Plus/>}</button></div><ul className="divide-y dark:divide-gray-700 border rounded dark:border-gray-700">{expenseCategories.map(c => (<li key={c.id} className="p-3 flex justify-between items-center dark:text-gray-300"><span>{c.name}</span><div className="flex space-x-2"><button onClick={() => { setEditExpenseId(c.id); setNewExpenseCat(c.name); }} className="text-blue-500"><Edit2 size={18}/></button><button onClick={() => deleteExpenseCategory(c.id)} className="text-red-500"><Trash2 size={18}/></button></div></li>))}</ul></div>)}

        </div>

        {/* --- MODALS --- */}

        {/* User Modal */}
        {showUserModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
                    <h3 className="font-bold text-xl mb-4 dark:text-white">{editingUser?.id ? t('edit') : t('add')} {t('username')}</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('firstName')} value={editingUser?.firstName || ''} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} />
                            <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('lastName')} value={editingUser?.lastName || ''} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} />
                        </div>
                        <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('username')} value={editingUser?.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
                        <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('password')} type="password" value={editingUser?.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('roles')}</label>
                            <select className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={editingUser?.roleId || ''} onChange={e => setEditingUser({...editingUser, roleId: e.target.value})}>
                                <option value="">{t('selectOption')}</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>

                        <div className="border-t pt-2 mt-2 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('allowedStores')}</label>
                            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto border p-2 rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
                                {locations.filter(l => l.type === 'STORE').map(l => (
                                    <label key={l.id} className="flex items-center text-sm dark:text-gray-300">
                                        <input 
                                            type="checkbox" 
                                            checked={editingUser?.allowedStoreIds?.includes(l.id)} 
                                            onChange={e => {
                                                const current = editingUser?.allowedStoreIds || [];
                                                const next = e.target.checked ? [...current, l.id] : current.filter(id => id !== l.id);
                                                setEditingUser({...editingUser, allowedStoreIds: next});
                                            }}
                                            className="mr-2"
                                        />
                                        {l.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('allowedWarehouses')}</label>
                            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto border p-2 rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
                                {locations.filter(l => l.type === 'WAREHOUSE').map(l => (
                                    <label key={l.id} className="flex items-center text-sm dark:text-gray-300">
                                        <input 
                                            type="checkbox" 
                                            checked={editingUser?.allowedWarehouseIds?.includes(l.id)} 
                                            onChange={e => {
                                                const current = editingUser?.allowedWarehouseIds || [];
                                                const next = e.target.checked ? [...current, l.id] : current.filter(id => id !== l.id);
                                                setEditingUser({...editingUser, allowedWarehouseIds: next});
                                            }}
                                            className="mr-2"
                                        />
                                        {l.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                        <button onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{t('cancel')}</button>
                        <button onClick={handleSaveUser} className="px-4 py-2 bg-primary text-white rounded">{t('save')}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-xl">
                    <h3 className="font-bold text-xl mb-4 dark:text-white">{editingRole?.id ? t('editRole') : t('addRole')}</h3>
                    <div className="space-y-4">
                        <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('roleName')} value={editingRole?.name || ''} onChange={e => setEditingRole({...editingRole, name: e.target.value})} />
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">{t('permissions')}</label>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
                                {availablePermissions.map(perm => (
                                    <label key={perm.key} className="flex items-center text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer dark:text-gray-300">
                                        <input 
                                            type="checkbox" 
                                            checked={editingRole?.permissions?.includes(perm.key)} 
                                            onChange={() => togglePermission(perm.key)}
                                            className="mr-2"
                                        />
                                        {t(perm.labelKey)}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                        <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{t('cancel')}</button>
                        <button onClick={handleSaveRole} className="px-4 py-2 bg-primary text-white rounded">{t('save')}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Location Modal */}
        {showLocModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
                    <h3 className="font-bold text-xl mb-4 dark:text-white">{locId ? t('edit') : t('add')} {t('location')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('name')}</label>
                            <input className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={locName} onChange={e => setLocName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('type')}</label>
                            <select className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={locType} onChange={e => setLocType(e.target.value as any)}>
                                <option value="WAREHOUSE">Warehouse</option>
                                <option value="STORE">Store</option>
                            </select>
                        </div>

                        {locType === 'STORE' && (
                            <>
                                <div className="border-t pt-4 dark:border-gray-700">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">{t('linkedWarehouses')}</label>
                                    <div className="space-y-1 bg-gray-50 dark:bg-gray-900 p-2 rounded border dark:border-gray-600 max-h-32 overflow-y-auto">
                                        {locations.filter(l => l.type === 'WAREHOUSE').map(wh => (
                                            <label key={wh.id} className="flex items-center text-sm dark:text-gray-300">
                                                <input 
                                                    type="checkbox" 
                                                    checked={linkedWarehouses.includes(wh.id)}
                                                    onChange={e => {
                                                        const next = e.target.checked ? [...linkedWarehouses, wh.id] : linkedWarehouses.filter(id => id !== wh.id);
                                                        setLinkedWarehouses(next);
                                                    }}
                                                    className="mr-2"
                                                />
                                                {wh.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Cash Registers Sub-section (Only visible if Editing existing store) */}
                                {locId && (
                                    <div className="border-t pt-4 dark:border-gray-700">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">{t('cashRegisters')}</label>
                                        <div className="flex gap-2 mb-2">
                                            <input className="border p-2 rounded flex-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('name')} value={newRegName} onChange={e => setNewRegName(e.target.value)} />
                                            <button onClick={handleAddRegister} className="bg-green-600 text-white px-3 rounded text-sm">{t('add')}</button>
                                        </div>
                                        <ul className="divide-y border rounded text-sm dark:divide-gray-700 dark:border-gray-600">
                                            {cashRegisters.filter(cr => cr.storeId === locId).map(cr => (
                                                <li key={cr.id} className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                                    <span className="dark:text-gray-300">{cr.name}</span>
                                                    <button onClick={() => deleteCashRegister(cr.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                                                </li>
                                            ))}
                                            {cashRegisters.filter(cr => cr.storeId === locId).length === 0 && <li className="p-2 text-gray-400 italic">No registers defined.</li>}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                        <button onClick={() => setShowLocModal(false)} className="px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{t('cancel')}</button>
                        <button onClick={handleSaveLocation} className="px-4 py-2 bg-primary text-white rounded">{t('save')}</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
