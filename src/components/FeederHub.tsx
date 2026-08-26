import React, { useState, useMemo } from 'react';
import { HUB_RECORDS, HubRecord } from '../data/hubData';
import { Search, MapPin, Compass, User, CreditCard, Download, Building, ShieldAlert, ArrowUpDown, Copy, Check, Edit, X, Save, FileSpreadsheet } from 'lucide-react';

function HighlightedText({ text, search }: { text: string; search: string }) {
  if (!search || !search.trim()) {
    return <>{text}</>;
  }
  
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-400/80 text-gray-900 rounded-[2px] px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function AddressCell({ text, search }: { text: string; search: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 200 || (text.match(/\n/g) || []).length >= 4;
  
  return (
    <div className="space-y-1">
      <div 
        className={`leading-relaxed text-[11px] whitespace-pre-wrap transition-all duration-200 ${
          !isExpanded && isLong ? 'max-h-[7.2rem] overflow-hidden' : ''
        }`}
        style={!isExpanded && isLong ? {
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
        } : undefined}
      >
        <HighlightedText text={text} search={search} />
      </div>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-eeu-green hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] font-extrabold uppercase hover:underline focus:outline-none cursor-pointer mt-1 inline-flex items-center gap-1"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
}

interface FeederHubProps {
  isAdmin?: boolean;
  hubRecords?: HubRecord[];
  onUpdateRecord?: (item: HubRecord) => Promise<void>;
}

export function FeederHub({ isAdmin = false, hubRecords = HUB_RECORDS, onUpdateRecord }: FeederHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof HubRecord>('no');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedBp, setCopiedBp] = useState<string | null>(null);
  const [copiedDispatcherId, setCopiedDispatcherId] = useState<string | null>(null);

  // Editing State
  const [editingRecord, setEditingRecord] = useState<HubRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSheetsInstructions, setShowSheetsInstructions] = useState(false);

  const handleCopyBp = (bp: string) => {
    navigator.clipboard.writeText(bp).then(() => {
      setCopiedBp(bp);
      setTimeout(() => {
        setCopiedBp(null);
      }, 2000);
    });
  };

  const handleCopyDispatcherId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedDispatcherId(id);
      setTimeout(() => {
        setCopiedDispatcherId(null);
      }, 2000);
    });
  };

  // Filter and Search logic
  const filteredRecords = useMemo(() => {
    const sourceRecords = hubRecords.length > 0 ? hubRecords : HUB_RECORDS;
    return sourceRecords.filter(record => {
      const matchRegion = selectedRegion === 'All' || record.region.toLowerCase() === selectedRegion.toLowerCase();
      
      const combinedText = `${record.address} ${record.region} ${record.csc} ${record.dummyBp} ${record.rsg} ${record.dispatcherName} ${record.dispatcherId} ${record.customerServiceTlId} ${record.officeLocation}`.toLowerCase();
      const matchSearch = combinedText.includes(searchTerm.toLowerCase());

      return matchRegion && matchSearch;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    });
  }, [hubRecords, searchTerm, selectedRegion, sortField, sortAsc]);

  const toggleSort = (field: keyof HubRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ["No", "ADDRESS", "REGION", "CSC", "DUMMY BP", "RSG", "DISPATCHER NAME", "DISPATCHER ID", "CUSTOMER SERVICE TL ID", "OFFICE LOCATION"];
    const sourceRecords = hubRecords.length > 0 ? hubRecords : HUB_RECORDS;
    const rows = sourceRecords.map(r => [
      r.no,
      `"${r.address.replace(/"/g, '""')}"`,
      r.region,
      r.csc,
      r.dummyBp,
      r.rsg,
      `"${r.dispatcherName.replace(/"/g, '""')}"`,
      r.dispatcherId,
      r.customerServiceTlId,
      `"${r.officeLocation.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eeu_hub_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInGoogleSheets = () => {
    const headers = ["No", "ADDRESS", "REGION", "CSC", "DUMMY BP", "RSG", "DISPATCHER NAME", "DISPATCHER ID", "CUSTOMER SERVICE TL ID", "OFFICE LOCATION"];
    const sourceRecords = hubRecords.length > 0 ? hubRecords : HUB_RECORDS;
    const rows = sourceRecords.map(r => [
      r.no,
      String(r.address ?? '').trim().replace(/[\r\n]+/g, ' '),
      r.region,
      r.csc,
      r.dummyBp,
      r.rsg,
      r.dispatcherName,
      r.dispatcherId,
      r.customerServiceTlId,
      String(r.officeLocation ?? '').trim().replace(/[\r\n]+/g, ' ')
    ]);

    // Format as Tab Separated Values for direct Google Sheets paste compatibility
    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(val => String(val ?? '').replace(/\t/g, ' ')).join('\t'))
    ].join('\r\n');

    navigator.clipboard.writeText(tsvContent)
      .then(() => {
        window.open('https://sheets.new', '_blank');
        setShowSheetsInstructions(true);
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard:', err);
      });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !onUpdateRecord) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateRecord(editingRecord);
      setShowSuccessToast(true);
      setEditingRecord(null);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeRecordsCount = hubRecords.length > 0 ? hubRecords.length : HUB_RECORDS.length;

  return (
    <div id="eeu-csc-address-panel" className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-eeu-green/10 text-eeu-green rounded-xl">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-display font-black text-gray-900 dark:text-white tracking-tight">
              CSC Address
            </h2>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 p-4 rounded-2xl bg-eeu-green text-white shadow-2xl flex items-center gap-3 z-55 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-xs">CSC Address Updated</p>
            <p className="text-[10px] opacity-90">Changes have been successfully saved to Firestore.</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row flex-1 gap-3 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 dark:text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search address landmarks, CSC code, dispatcher names or IDs..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
            />
          </div>

          {/* Region Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {['All', 'North', 'East', 'South', 'West'].map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedRegion === region
                    ? 'bg-eeu-green border-eeu-green text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {region === 'All' ? 'All Regions' : `${region} Region`}
              </button>
            ))}
          </div>
        </div>

        {/* Export options - Admin Only */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0 md:justify-end">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-eeu-green" />
              <span>EXPORT (.CSV)</span>
            </button>

            <button
              onClick={handleOpenInGoogleSheets}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
              <span>GOOGLE SHEETS</span>
            </button>
          </div>
        )}
      </div>

      {/* Table & Scrollable Area */}
      <div className="glass-card rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden bg-white dark:bg-gray-900">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full table-fixed text-left border-collapse min-w-[1250px]">
            <thead>
              <tr className="border-b border-gray-200/40 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-950/20 text-gray-500 dark:text-gray-400 text-[11px] font-black uppercase tracking-wider">
                {isAdmin && <th className="py-4 px-5 w-20 text-center">Action</th>}
                <th className="py-4 px-5 w-16 text-center">
                  <div className="flex items-center gap-1.5 justify-center">
                    <span>No</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-[470px] min-w-[470px]">
                  <div className="flex items-center gap-1.5">
                    <span>Landmark Address Scope</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-28">
                  <div className="flex items-center gap-1.5">
                    <span>Region</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-28">
                  <div className="flex items-center gap-1.5">
                    <span>CSC</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-32">
                  <div className="flex items-center gap-1.5">
                    <span>Dummy BP</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-32">
                  <div className="flex items-center gap-1.5">
                    <span>RSG Codes</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-[330px] min-w-[330px]">
                  <div className="flex items-center gap-1.5">
                    <span>Office Location Landmark</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-36">
                  <div className="flex items-center gap-1.5">
                    <span>Dispatcher ID</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-40">
                  <div className="flex items-center gap-1.5">
                    <span>CS TL ID</span>
                  </div>
                </th>
                <th className="py-4 px-5 w-44">
                  <div className="flex items-center gap-1.5">
                    <span>Dispatcher</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/30 dark:divide-gray-800/30 text-xs">
              {filteredRecords.map((item) => (
                <tr 
                  key={item.no}
                  className="hover:bg-gray-50/40 dark:hover:bg-gray-900/10 transition-colors"
                >
                  {/* Admin Edit Action Button */}
                  {isAdmin && (
                    <td className="py-3.5 px-5 text-center w-20">
                      <button
                        onClick={() => {
                          setEditingRecord({ ...item });
                          setSaveError(null);
                        }}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-eeu-green/10 text-gray-500 hover:text-eeu-green dark:bg-gray-800 dark:hover:bg-eeu-green/20 dark:text-gray-400 dark:hover:text-eeu-green transition-all cursor-pointer"
                        title="Edit CSC Address Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}

                  {/* No */}
                  <td className="py-3.5 px-5 font-bold text-center text-gray-500 bg-gray-50/20 dark:bg-gray-950/5 w-16">
                    {item.no}
                  </td>
                  
                  {/* Landmark Address Scope */}
                  <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-white w-[470px] min-w-[470px]">
                    <AddressCell text={item.address} search={searchTerm} />
                  </td>

                  {/* Region */}
                  <td className="py-3.5 px-5 w-28">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold uppercase text-[9px] ${
                      item.region.toLowerCase() === 'north'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : item.region.toLowerCase() === 'south'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : item.region.toLowerCase() === 'east'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
                    }`}>
                      <Compass className="w-3 h-3" />
                      {item.region}
                    </span>
                  </td>

                  {/* CSC */}
                  <td className="py-3.5 px-5 font-mono font-bold text-gray-800 dark:text-gray-300 w-28">
                    <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200/50 dark:border-gray-700/40">
                      {item.csc}
                    </span>
                  </td>

                  {/* Dummy BP */}
                  <td className="py-3.5 px-5 font-mono text-gray-650 dark:text-gray-400 font-semibold w-32">
                    <div className="flex items-center gap-1.5 group">
                      <span>{item.dummyBp}</span>
                      <button
                        onClick={() => handleCopyBp(item.dummyBp)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all opacity-50 group-hover:opacity-100 cursor-pointer"
                        title="Copy Dummy BP"
                      >
                        {copiedBp === item.dummyBp ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-450" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* RSG Codes */}
                  <td className="py-3.5 px-5 font-mono text-gray-600 dark:text-gray-450 w-32">
                    {item.rsg}
                  </td>

                  {/* Office Location Landmark */}
                  <td className="py-3.5 px-5 text-gray-700 dark:text-gray-350 leading-relaxed font-medium w-[330px] min-w-[330px]">
                    <div className="flex items-start gap-1.5 w-full">
                      <Building className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-3 text-[11px]">{item.officeLocation}</span>
                    </div>
                  </td>

                  {/* Dispatcher ID */}
                  <td className="py-3.5 px-5 font-mono text-gray-600 dark:text-gray-400 w-36">
                    <div className="flex items-center gap-1.5 group">
                      <span>{item.dispatcherId}</span>
                      {item.dispatcherId && item.dispatcherId !== '-' && item.dispatcherId !== 'N/A' && (
                        <button
                          onClick={() => handleCopyDispatcherId(item.dispatcherId)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all opacity-50 group-hover:opacity-100 cursor-pointer"
                          title="Copy Dispatcher ID"
                        >
                          {copiedDispatcherId === item.dispatcherId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-450" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Customer Service TL ID */}
                  <td className="py-3.5 px-5 font-mono text-gray-600 dark:text-gray-400 w-40">
                    {item.customerServiceTlId}
                  </td>

                  {/* Dispatcher Name */}
                  <td className="py-3.5 px-5 font-sans font-semibold text-gray-900 dark:text-gray-200 w-44">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>{item.dispatcherName}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="py-12 px-5 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-gray-300 dark:text-gray-700 animate-pulse" />
                      <p className="font-semibold text-sm">No Matching Operations Hub Records Found</p>
                      <p className="text-xs text-gray-400">Try modifying your search or choosing a different regional filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="py-3 px-5 border-t border-gray-200/40 dark:border-gray-800/40 bg-gray-50/50 dark:bg-gray-950/20 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <span>Showing <strong>{filteredRecords.length}</strong> of <strong>{activeRecordsCount}</strong> registered HUB lookup zones</span>
          <span>EEU Grid Database System</span>
        </div>
      </div>

      {/* Editing Modal / Dialog */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-eeu-green" />
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Edit CSC Address Details (Record #{editingRecord.no})
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveChanges} className="p-6 space-y-4">
              {saveError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Landmark Address Scope - Full Width */}
              <div className="space-y-1 text-left">
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Landmark Address Scope
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingRecord.address}
                  onChange={(e) => setEditingRecord({ ...editingRecord, address: e.target.value })}
                  placeholder="Enter detailed landmarks and address scopes..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all resize-none"
                />
              </div>

              {/* 2 Column Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Region */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Region
                  </label>
                  <select
                    value={editingRecord.region}
                    onChange={(e) => setEditingRecord({ ...editingRecord, region: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  >
                    <option value="North">North</option>
                    <option value="East">East</option>
                    <option value="South">South</option>
                    <option value="West">West</option>
                  </select>
                </div>

                {/* CSC */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.csc}
                    onChange={(e) => setEditingRecord({ ...editingRecord, csc: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>

                {/* Dummy BP */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dummy BP
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.dummyBp}
                    onChange={(e) => setEditingRecord({ ...editingRecord, dummyBp: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>

                {/* RSG */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RSG Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.rsg}
                    onChange={(e) => setEditingRecord({ ...editingRecord, rsg: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>

                {/* Dispatcher Name */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dispatcher Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.dispatcherName}
                    onChange={(e) => setEditingRecord({ ...editingRecord, dispatcherName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>

                {/* Dispatcher ID */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dispatcher ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.dispatcherId}
                    onChange={(e) => setEditingRecord({ ...editingRecord, dispatcherId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>

                {/* Customer Service TL ID */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer Service TL ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.customerServiceTlId}
                    onChange={(e) => setEditingRecord({ ...editingRecord, customerServiceTlId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>

                {/* Office Location */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Office Location Landmark
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.officeLocation}
                    onChange={(e) => setEditingRecord({ ...editingRecord, officeLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eeu-green/20 focus:border-eeu-green transition-all"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-eeu-green hover:bg-eeu-green/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Google Sheets Instructions Modal */}
      {showSheetsInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/10">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Opening in Google Sheets
                </h3>
              </div>
              <button
                onClick={() => setShowSheetsInstructions(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-semibold">
                📋 Registry Copied to Clipboard!
                <span className="block text-[10px] opacity-90 mt-1 font-medium">We have copied all Hub records in spreadsheet format and opened a blank Google Sheet in a new tab.</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">How to import your data:</h4>
                <ol className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4 leading-relaxed font-medium">
                  <li>In the new Google Sheet, select cell <strong className="text-gray-950 dark:text-white font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">A1</strong>.</li>
                  <li>Press <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-gray-800 dark:text-gray-200 shadow-sm">Ctrl + V</kbd> (or <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-gray-800 dark:text-gray-200 shadow-sm">Cmd + V</kbd> on Mac).</li>
                  <li>All columns, landmarks, and dispatcher IDs will automatically align perfectly into rows and cells!</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => window.open('https://sheets.new', '_blank')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Reopen Google Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSheetsInstructions(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
