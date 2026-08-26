import React, { useState } from 'react';
import { Phone, Copy, Check, Search, Building, Smartphone, Info, Plus, Edit, Trash2, X, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { ContactItem } from '../types';

interface CustomerContactsProps {
  isAdmin?: boolean;
  contacts?: ContactItem[];
  onAddContact?: (item: Omit<ContactItem, 'id'>) => Promise<any>;
  onUpdateContact?: (item: ContactItem) => Promise<any>;
  onDeleteContact?: (id: string) => Promise<any>;
}

export const BACKUP_CONTACTS_DATA: ContactItem[] = [
  // Head & Regional
  { id: 'cc-2', name: 'North Region Office', phone: '011-126-7244', category: 'head_regional', locationInfo: 'Infront of Abune Petros Monument' },
  { id: 'cc-1', name: 'Head Office', phone: '011-636-6028', category: 'head_regional', locationInfo: 'Main Headquarters' },
  { id: 'cc-3', name: 'South Region Office', phone: '011-557-3175', category: 'head_regional', locationInfo: 'Infront of Global Hotel' },
  { id: 'cc-4', name: 'East Region Office', phone: '011-667-5875', category: 'head_regional', locationInfo: 'Kotebe Bireta Biret' },
  { id: 'cc-5', name: 'West Region Office', phone: '011-552-0231', category: 'head_regional', locationInfo: 'Fit Ber to Kazanchis turn' },

  // Sheger City
  { id: 'cc-6', name: 'Burayu', phone: '011-284-0614', category: 'sheger_city', locationInfo: 'Sheger City Burayu area branch' },
  { id: 'cc-7', name: 'Alemgena', phone: '011-338-1314', category: 'sheger_city', locationInfo: 'Sheger City Alemgena branch' },
  { id: 'cc-8', name: 'Welete', phone: '011-380-5250', category: 'sheger_city', locationInfo: 'Sheger City Welete branch' },
  { id: 'cc-9', name: 'Bishoftu 1', phone: '011-433-3181', category: 'sheger_city', locationInfo: 'Sheger City Bishoftu main line (Alternative lines: 011-433-8773 / 011-433-8075)' },
  { id: 'cc-10', name: 'Bishoftu 2', phone: '011-432-0335', category: 'sheger_city', locationInfo: 'Sheger City Bishoftu secondary branch' },
  { id: 'cc-11', name: 'Legatafo', phone: '011-218-0099', category: 'sheger_city', locationInfo: 'Sheger City Legatafo branch' },
  { id: 'cc-12', name: 'Sululta', phone: '011-161-7960', category: 'sheger_city', locationInfo: 'Sheger City Sululta branch' },
  { id: 'cc-13', name: 'Holeta', phone: '011-261-0345', category: 'sheger_city', locationInfo: 'Sheger City Holeta branch' },
  { id: 'cc-14', name: 'Sandafa', phone: '011-686-0564', category: 'sheger_city', locationInfo: 'Sheger City Sandafa branch' },

  // Regional hotlines
  { id: 'cc-15', name: 'Harari Region Support', phone: '025-666-0044', category: 'regional_hotline', locationInfo: 'Harari Regional office', hotlineShortCode: '9466' },
  { id: 'cc-16', name: 'Dire Dawa Administration', phone: '8145', category: 'regional_hotline', locationInfo: 'Dire Dawa Administration direct support line', hotlineShortCode: '8145' },
  { id: 'cc-17', name: 'Benishangul-Gumuz Region', phone: '9418', category: 'regional_hotline', locationInfo: 'Benishangul-Gumuz direct support line', hotlineShortCode: '9418' },
  { id: 'cc-18', name: 'Somali Region Support', phone: '9337', category: 'regional_hotline', locationInfo: 'Somali Region direct support line', hotlineShortCode: '9337' },
  { id: 'cc-19', name: 'Hawassa Region Office', phone: '046-220-0419', category: 'regional_hotline', locationInfo: 'Hawassa Region service hub' },
  { id: 'cc-20', name: 'Gambela Region Office', phone: '047-551-0098', category: 'regional_hotline', locationInfo: 'Gambela Region service hub' },
  { id: 'cc-21', name: 'Afar Region Office', phone: '033-666-0671', category: 'regional_hotline', locationInfo: 'Afar Region service hub' },
  { id: 'cc-22', name: 'Amhara Region Office', phone: '058-220-0077', category: 'regional_hotline', locationInfo: 'Amhara Region service hub' },
  { id: 'cc-23', name: 'Oromia Region Office', phone: '011-522-61-91', category: 'regional_hotline', locationInfo: 'Oromia Region service hub' },
];

export default function CustomerContacts({
  isAdmin = false,
  contacts = [],
  onAddContact,
  onUpdateContact,
  onDeleteContact
}: CustomerContactsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'head_regional' | 'sheger_city' | 'regional_hotline'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState<'head_regional' | 'sheger_city' | 'regional_hotline'>('head_regional');
  const [formLocationInfo, setFormLocationInfo] = useState('');
  const [formShortCode, setFormShortCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const rawDisplayContacts = contacts && contacts.length > 0 ? contacts : BACKUP_CONTACTS_DATA;
  const displayContacts = [...rawDisplayContacts].sort((a, b) => {
    const orderList = [
      'Head Office',
      'North Region Office',
      'East Region Office',
      'West Region Office',
      'South Region Office'
    ];
    const indexA = orderList.indexOf(a.name);
    const indexB = orderList.indexOf(b.name);
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  const handleCopy = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setFormName('');
    setFormPhone('');
    setFormCategory('head_regional');
    setFormLocationInfo('');
    setFormShortCode('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: ContactItem) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormCategory(contact.category);
    setFormLocationInfo(contact.locationInfo || '');
    setFormShortCode(contact.hotlineShortCode || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!onDeleteContact) return;
    if (confirm('Are you sure you want to delete this contact record?')) {
      try {
        await onDeleteContact(contactId);
      } catch (err: any) {
        console.error(err);
        alert('Failed to delete contact record.');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setErrorMsg('Name and Phone fields are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingContact) {
        if (onUpdateContact) {
          const updated: ContactItem = {
            id: editingContact.id,
            name: formName.trim(),
            phone: formPhone.trim(),
            category: formCategory,
            locationInfo: formLocationInfo.trim() || undefined,
            hotlineShortCode: formShortCode.trim() || undefined
          };
          await onUpdateContact(updated);
        }
      } else {
        if (onAddContact) {
          const payload = {
            name: formName.trim(),
            phone: formPhone.trim(),
            category: formCategory,
            locationInfo: formLocationInfo.trim() || undefined,
            hotlineShortCode: formShortCode.trim() || undefined
          };
          await onAddContact(payload);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to save contact record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = displayContacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.locationInfo && contact.locationInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.hotlineShortCode && contact.hotlineShortCode.includes(searchTerm));
    
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div id="customer-contacts-panel" className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-eeu-green/10 text-eeu-green rounded-xl">
              <Phone className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-display font-black text-gray-900 dark:text-white tracking-tight">
              Other Region Phone Number
            </h2>
          </div>
        </div>
      </div>

      {/* Filters, Search Bar & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="contacts-search-input"
            type="text"
            placeholder="Search by name, phone, landmark, or shortcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
          />
        </div>

        {/* Categories Tabs and Admin Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100/70 dark:bg-gray-900/40 rounded-2xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-eeu-green text-white shadow-sm'
                  : 'text-gray-650 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              All ({displayContacts.length})
            </button>
            <button
              onClick={() => setSelectedCategory('head_regional')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'head_regional'
                  ? 'bg-eeu-green text-white shadow-sm'
                  : 'text-gray-650 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Head & Regions
            </button>
            <button
              onClick={() => setSelectedCategory('sheger_city')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'sheger_city'
                  ? 'bg-eeu-green text-white shadow-sm'
                  : 'text-gray-650 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Sheger City
            </button>
            <button
              onClick={() => setSelectedCategory('regional_hotline')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'regional_hotline'
                  ? 'bg-eeu-green text-white shadow-sm'
                  : 'text-gray-650 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Regional
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-100/70 dark:bg-gray-900/40 rounded-2xl shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-eeu-green text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Horizontal List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-eeu-green text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Admin Add Contact button */}
          {isAdmin && (
            <button
              id="admin-add-contact-btn"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-eeu-green hover:bg-eeu-green/90 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-eeu-green/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      {filteredContacts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No contacts found</p>
          <p className="text-xs text-gray-500 mt-1">Try resetting your search query or picking another category tab.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:scale-[1.005] transition-all duration-200"
            >
              {/* Left Info: Category, Name & Landmark */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span 
                    style={{ fontSize: '11px' }}
                    className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
                    contact.category === 'head_regional'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                      : contact.category === 'sheger_city'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450'
                  }`}>
                    {contact.category === 'head_regional'
                      ? 'Head & Regional'
                      : contact.category === 'sheger_city'
                      ? 'Sheger City'
                      : 'Hotline / Region'}
                  </span>
                  
                  {contact.hotlineShortCode && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-eeu-green bg-eeu-green/10 px-2 py-0.5 rounded-lg border border-eeu-green/10 shrink-0">
                      <Smartphone className="w-3 h-3" />
                      Code: {contact.hotlineShortCode}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 
                    style={{ fontSize: '19px' }}
                    className="font-sans font-extrabold text-gray-900 dark:text-white leading-snug"
                  >
                    {contact.name}
                  </h3>
                  {contact.locationInfo && (
                    <p 
                      style={{ fontSize: '14px' }}
                      className="text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xl"
                    >
                      {contact.locationInfo}
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Right: Numbers */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Main Phone */}
                <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-gray-50/70 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-800/40">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span 
                    style={{ fontSize: '17px' }}
                    className="font-sans font-bold text-gray-800 dark:text-gray-200"
                  >
                    {contact.phone}
                  </span>
                  <button
                    onClick={() => handleCopy(contact.id, contact.phone)}
                    className="p-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-750 transition-all cursor-pointer"
                    title="Copy Number"
                  >
                    {copiedId === contact.id ? (
                      <Check className="w-3 h-3 text-eeu-green" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Shortcode if exists */}
                {contact.hotlineShortCode && (
                  <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-eeu-green/5 border border-eeu-green/10">
                    <Smartphone className="w-3.5 h-3.5 text-eeu-green" />
                    <span className="text-xs font-sans font-black text-eeu-green">
                      {contact.hotlineShortCode}
                    </span>
                    <button
                      onClick={() => handleCopy(`${contact.id}-short`, contact.hotlineShortCode || '')}
                      className="p-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 transition-all cursor-pointer"
                      title="Copy Shortcode"
                    >
                      {copiedId === `${contact.id}-short` ? (
                        <Check className="w-3 h-3 text-eeu-green" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Far Right: Admin Actions */}
              {isAdmin && (
                <div className="flex items-center gap-1 pl-2 border-l border-gray-100 dark:border-gray-800/60 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(contact)}
                    className="p-1.5 rounded bg-gray-50 hover:bg-amber-100 text-gray-500 hover:text-amber-750 dark:bg-slate-900 dark:hover:bg-amber-950/40 dark:text-gray-400 dark:hover:text-amber-400 transition-all cursor-pointer"
                    title="Edit Contact"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-1.5 rounded bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-650 dark:bg-slate-900 dark:hover:bg-red-950/40 dark:text-gray-400 dark:hover:text-red-400 transition-all cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-all duration-250 hover:shadow-lg dark:hover:shadow-black/20"
            >
              <div className="space-y-3">
                {/* Category Badge & Actions */}
                <div className="flex items-center justify-between">
                  <span 
                    style={{ fontSize: '11px' }}
                    className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    contact.category === 'head_regional'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                      : contact.category === 'sheger_city'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450'
                  }`}>
                    {contact.category === 'head_regional'
                      ? 'Head & Regional'
                      : contact.category === 'sheger_city'
                      ? 'Sheger City'
                      : 'Hotline / Region'}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {contact.hotlineShortCode && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-eeu-green bg-eeu-green/10 px-2 py-0.5 rounded-lg border border-eeu-green/10 mr-1">
                        <Smartphone className="w-3 h-3" />
                        Code: {contact.hotlineShortCode}
                      </span>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleOpenEditModal(contact)}
                          className="p-1 rounded bg-gray-50 hover:bg-amber-100 text-gray-500 hover:text-amber-750 dark:bg-slate-900 dark:hover:bg-amber-950/40 dark:text-gray-400 dark:hover:text-amber-400 transition-all cursor-pointer"
                          title="Edit Contact"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-1 rounded bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-650 dark:bg-slate-900 dark:hover:bg-red-950/40 dark:text-gray-400 dark:hover:text-red-400 transition-all cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <h3 
                    style={{ fontSize: '19px' }}
                    className="font-sans font-extrabold text-gray-900 dark:text-white leading-snug"
                  >
                    {contact.name}
                  </h3>
                  {contact.locationInfo && (
                    <p 
                      style={{ fontSize: '14px' }}
                      className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed"
                    >
                      {contact.locationInfo}
                    </p>
                  )}
                </div>
              </div>

              {/* Numbers Section with Copy Actions */}
              <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800/60 flex flex-col gap-2">
                {/* Main Phone Row */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 dark:bg-slate-900/40 border border-gray-100 dark:border-gray-800/40">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span 
                      style={{ fontSize: '17px' }}
                      className="font-sans font-bold text-gray-800 dark:text-gray-200"
                    >
                      {contact.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(contact.id, contact.phone)}
                      className="p-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 transition-all cursor-pointer"
                      title="Copy Number"
                    >
                      {copiedId === contact.id ? (
                        <Check className="w-3.5 h-3.5 text-eeu-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Secondary Hotline Row if exists */}
                {contact.hotlineShortCode && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-eeu-green/5 border border-eeu-green/10">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-eeu-green" />
                      <span className="text-xs font-sans font-black text-eeu-green">
                        Shortcode: {contact.hotlineShortCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(`${contact.id}-short`, contact.hotlineShortCode || '')}
                        className="p-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 transition-all cursor-pointer"
                        title="Copy Shortcode"
                      >
                        {copiedId === `${contact.id}-short` ? (
                          <Check className="w-3.5 h-3.5 text-eeu-green" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Overlay Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in-30">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-900">
              <h3 className="text-sm font-display font-black text-gray-900 dark:text-white">
                {editingContact ? 'Edit Directory Record' : 'Add Directory Record'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-350 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error state */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Category Group
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                >
                  <option value="head_regional">Head & Regional Offices</option>
                  <option value="sheger_city">Sheger City Offices</option>
                  <option value="regional_hotline">Regional Hotlines & Support</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Office Name / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Holeta Office or Harari Region Support"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 011-261-0345"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                />
              </div>

              {/* Hotline shortcode */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Hotline / Shortcode (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9466"
                  value={formShortCode}
                  onChange={(e) => setFormShortCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                />
              </div>

              {/* Description/Location info */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Landmarks / Support Info (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Infront of Global Hotel or Sheger City branch"
                  value={formLocationInfo}
                  onChange={(e) => setFormLocationInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 dark:hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-eeu-green hover:bg-eeu-green/95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
