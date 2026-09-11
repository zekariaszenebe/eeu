import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Eye, ShieldAlert, MapPin, AlertTriangle, HelpCircle, 
  Clock, CheckCircle, ArrowUpDown, Grid, List, 
  SlidersHorizontal, CheckSquare, Square, Bell, CalendarClock, Info,
  Columns, Rows, Zap, Settings, Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Trash2, Edit3, Plus, MessageSquare, AlertCircle, Languages,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, Table, ChevronDown
} from 'lucide-react';
import { FeederInterruption, InterruptionType, InterruptionStatus, stripBrackets, TeamLeaderNote } from '../types';
import { INITIAL_DISTRICTS } from '../data/mockData';
import { addTeamLeaderNoteDoc, updateTeamLeaderNoteDoc, deleteTeamLeaderNoteDoc, subscribeToInterruptions } from '../lib/apiService';
import { LanguageMode, translateAmharicLocation, formatLocationDisplay } from '../utils/locationLanguage';

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  let processed = html;
  // Fallback: convert newlines to <br /> if there are absolutely no common HTML structural tags
  if (!html.includes('<p>') && !html.includes('<div>') && !html.includes('<br>') && !html.includes('<br />') && !html.includes('<table>')) {
    processed = html.replace(/\n/g, '<br />');
  }
  
  // Safe regex-based HTML clean up for custom admin rich content
  let cleaned = processed.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  return cleaned;
}

export function getCardinalDirection(district: string, feederName?: string): 'North' | 'East' | 'West' | 'South' | 'Sheger' {
  const d = district.toLowerCase();
  const f = (feederName || '').toUpperCase();

  // North list
  if (
    f.includes('ADE-08') ||
    f.includes('ADG-04') || f.includes('ADG-3') ||
    f.includes('ADN-01') || f.includes('ADN-02') || f.includes('ADN-03') || f.includes('ADN-04') || f.includes('ADN-06') ||
    f.includes('ADW-02') ||
    f.includes('BEL-01') || f.includes('BEL-03') || f.includes('BEL-05') || f.includes('BEL-06') ||
    f.includes('BLL-02') || f.includes('BLL-14') ||
    f.includes('SHG-01') || f.includes('SHG-02') || f.includes('SHG-05') || f.includes('SHG-06') || f.includes('SHG-07') || f.includes('SHG-09') || f.includes('SHG-10') ||
    f.includes('SUL-01')
  ) {
    return 'North';
  }

  // Sheger list (remove central and add sheger, matches ፊንፊኔ ዙሪያ/ፊዙዲ)
  if (
    f.includes('GEF-') || // GEF-01 to GEF-21
    f.includes('LEG-12') ||
    f.includes('ANF-06') ||
    f.includes('SEB-II-') || // SEB-II-1 to SEB-II-15
    f.includes('SHG-04') || f.includes('SHG-8') ||
    f.includes('SUL-02') || f.includes('SUL-03') || f.includes('SUL-04') || f.includes('SUL-05') || f.includes('SUL-06') ||
    d.includes('sheger') || d.includes('finfinne') || d.includes('ፊንፊኔ') || d.includes('ፊዙዲ')
  ) {
    return 'Sheger';
  }

  // West list
  if (
    f.includes('ADC-04') || f.includes('ADC-05') || f.includes('ADC-07') || f.includes('ADC-08') || f.includes('ADC-11') || f.includes('ADC-15') ||
    f.includes('ADE-10') ||
    f.includes('ADW-01') || f.includes('ADW-03') || f.includes('ADW-04') || f.includes('ADW-05') || f.includes('ADW-06') || f.includes('ADW-07') || f.includes('ADW-08') || f.includes('ADW-09') || f.includes('ADW-10') || f.includes('ADW-11') || f.includes('ADW-12') ||
    f.includes('ANF-03') ||
    f.includes('BOL ARA-1') ||
    f.includes('BLL-01') || f.includes('BLL-03') || f.includes('BLL-06') || f.includes('BLL-07') || f.includes('BLL-09') || f.includes('BLL-10') || f.includes('BLL-11') || f.includes('BLL-12') || f.includes('BLL-4') ||
    f.includes('NIF-01') || f.includes('NIF-03') ||
    f.includes('SEB-I-01') || f.includes('SEB-I-02') || f.includes('SEB-I-03') || f.includes('SEB-I-04') || f.includes('SEB-I-05') || f.includes('SEB-I-06') || f.includes('SEB-I-07') || f.includes('SEB-I-08') || f.includes('SEB-I-09') || f.includes('SEB-I-10') || f.includes('SEB-I-11') || f.includes('SEB-I-12') ||
    f.includes('SHG-5') || f.includes('SHG-9') ||
    f.includes('ALEM BANK')
  ) {
    return 'West';
  }

  // South list
  if (
    f.includes('AKA.I-') ||
    f.includes('GEL-') ||
    f.includes('GIS-') ||
    f.includes('GOF-') ||
    f.includes('KAL-') ||
    f.includes('KOY-') ||
    f.includes('MEK-') ||
    f.includes('NIF-04') || f.includes('NIF-06') || f.includes('NIF-07') || f.includes('NIF-08') || f.includes('NIF-09') || f.includes('NIF-10') ||
    f.includes('SEB-I-13') || f.includes('SEB-I-14') || f.includes('SEB-I-15') ||
    d.includes('south')
  ) {
    return 'South';
  }

  // East list
  if (
    f.includes('ADE-01') || f.includes('ADE-02') || f.includes('ADE-03') || f.includes('ADE-04') || f.includes('ADE-05') || f.includes('ADE-07') || f.includes('ADE-09') || f.includes('ADE-11') || f.includes('ADE-12') ||
    f.includes('ARB-') ||
    f.includes('AYT-') ||
    f.includes('BEL-02') || f.includes('BEL-04') ||
    f.includes('BLM-') ||
    f.includes('COT-') ||
    f.includes('LEG-') ||
    f.includes('WER-') ||
    f.includes('COTEBE') ||
    d.includes('east')
  ) {
    return 'East';
  }

  // Fallbacks:
  if (d.includes('north') || f.includes('NORTH')) return 'North';
  if (d.includes('east') || f.includes('EAST')) return 'East';
  if (d.includes('west') || f.includes('WEST')) return 'West';
  if (d.includes('south') || f.includes('SOUTH')) return 'South';

  return 'Sheger'; 
}

export function EarthFaultIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="3" x2="12" y2="15" />
      <line x1="6" y1="15" x2="18" y2="15" />
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="11" y1="21" x2="13" y2="21" />
    </svg>
  );
}

export function getTypeBadgeStyles(type: InterruptionType) {
  switch (type) {
    case InterruptionType.EARTH_FAULT:
      return {
        bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-950/40',
        icon: EarthFaultIcon,
        colorClass: 'text-red-500'
      };
    case InterruptionType.SHORT_CIRCUIT:
      return {
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-950/30',
        icon: Zap,
        colorClass: 'text-blue-500'
      };
    case InterruptionType.PLANNED_INTERRUPTION:
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-950/30',
        icon: CalendarClock,
        colorClass: 'text-emerald-500'
      };
    case InterruptionType.OPERATIONAL_INTERRUPTION:
      return {
        bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-950/30',
        icon: Settings,
        colorClass: 'text-indigo-500'
      };
    case InterruptionType.DIFFERENTIAL:
      return {
        bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-950/30',
        icon: Zap,
        colorClass: 'text-purple-500'
      };
    case InterruptionType.OVER_CURRENT:
      return {
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-950/30',
        icon: Zap,
        colorClass: 'text-amber-500'
      };
    default:
      return {
        bg: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-gray-950/40',
        icon: HelpCircle,
        colorClass: 'text-gray-500'
      };
  }
}

export function InterruptionTypeBadge({ type }: { type: InterruptionType }) {
  const styles = getTypeBadgeStyles(type);
  const Icon = styles.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${styles.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${styles.colorClass}`} />
      <span>{type}</span>
    </span>
  );
}

interface AgentViewProps {
  interruptions?: FeederInterruption[];
  onTriggerMockIncident?: () => void;
  isAdmin?: boolean;
  teamLeaderNotes?: TeamLeaderNote[];
}

export default function AgentView({ interruptions, onTriggerMockIncident, isAdmin = false, teamLeaderNotes = [] }: AgentViewProps) {
  // Real-time interruptions state listener via onSnapshot
  const [liveInterruptions, setLiveInterruptions] = useState<FeederInterruption[]>(interruptions || []);

  useEffect(() => {
    if (interruptions) {
      setLiveInterruptions(interruptions);
    }
  }, [interruptions]);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToInterruptions((items) => {
      if (isMounted) {
        setLiveInterruptions(items);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Filters & Search controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDirection, setSelectedDirection] = useState<string>('All');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name'>('latest');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('am');

  // Affected Location Area Directory state controls
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isDirectoryExpanded, setIsDirectoryExpanded] = useState(false);

  // View state (horizontal vs grid vs table)
  const [viewLayout, setViewLayout] = useState<'horizontal' | 'grid' | 'table'>('horizontal');

  // Team Leader Notes state controls
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteIsUrgent, setNoteIsUrgent] = useState(false);
  const [noteAuthor, setNoteAuthor] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState<'write' | 'preview'>('write');
  const [showTableMenu, setShowTableMenu] = useState(false);

  // Undo/Redo history tracking for rich text
  const [noteHistory, setNoteHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize state changes to contentEditable
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== noteContent) {
        editorRef.current.innerHTML = noteContent;
      }
    }
  }, [noteContent]);

  const updateNoteContentWithHistory = (newContent: string) => {
    let processedContent = newContent;
    if (typeof document !== 'undefined' && newContent.includes('<table')) {
      const container = document.createElement('div');
      container.innerHTML = newContent;
      const tables = container.querySelectorAll('table');
      tables.forEach((table) => {
        table.classList.add('w-full', 'table-fixed');
        const rows = Array.from(table.rows);
        if (rows.length > 0) {
          let maxCols = 0;
          rows.forEach(row => {
            if (row.cells.length > maxCols) {
              maxCols = row.cells.length;
            }
          });
          if (maxCols > 0) {
            const widthPercentage = (100 / maxCols).toFixed(2) + '%';
            const firstRow = rows[0];
            if (firstRow) {
              Array.from(firstRow.cells).forEach((cell) => {
                cell.style.width = widthPercentage;
              });
            }
          }
        }
      });
      processedContent = container.innerHTML;
    }

    setNoteContent(processedContent);
    const nextHistory = noteHistory.slice(0, historyIndex + 1);
    if (nextHistory[nextHistory.length - 1] !== processedContent) {
      nextHistory.push(processedContent);
      setNoteHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setNoteContent(noteHistory[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < noteHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setNoteContent(noteHistory[nextIndex]);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
    }
    document.execCommand(command, false, value);
    if (editor) {
      updateNoteContentWithHistory(editor.innerHTML);
    }
  };

  const applyInlineStyle = (styleName: string, styleValue: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      if (selectedText) {
        const span = document.createElement('span');
        span.style.setProperty(styleName, styleValue);
        span.textContent = selectedText;
        range.deleteContents();
        range.insertNode(span);
        
        // Restore caret
        const nextRange = document.createRange();
        nextRange.selectNode(span);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      } else {
        const span = document.createElement('span');
        span.style.setProperty(styleName, styleValue);
        span.innerHTML = '&#8203;'; // zero width space
        range.insertNode(span);
        
        const nextRange = document.createRange();
        if (span.firstChild) {
          nextRange.setStart(span.firstChild, 1);
          nextRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(nextRange);
        }
      }
    }
    if (editorRef.current) {
      updateNoteContentWithHistory(editorRef.current.innerHTML);
    }
  };

  const handleClearFormatting = () => {
    executeCommand('removeFormat');
  };

  const insertHtmlAtSelection = (html: string) => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      
      if (lastNode) {
        const nextRange = range.cloneRange();
        nextRange.setStartAfter(lastNode);
        nextRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      }
    } else if (editor) {
      editor.innerHTML += html;
    }
    if (editor) {
      updateNoteContentWithHistory(editor.innerHTML);
    }
  };

  const handleInsertTable = () => {
    const tableTemplate = `<table class="w-full table-fixed text-xs border border-gray-250 dark:border-gray-800 border-collapse my-2 bg-white dark:bg-gray-900/60">
  <thead>
    <tr class="bg-gray-50 dark:bg-gray-800/80">
      <th class="border border-gray-200 dark:border-gray-800 p-2 font-bold text-left" style="width: 50.00%;">Header 1</th>
      <th class="border border-gray-200 dark:border-gray-800 p-2 font-bold text-left" style="width: 50.00%;">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-200 dark:border-gray-800 p-2">Item A</td>
      <td class="border border-gray-200 dark:border-gray-800 p-2">Item B</td>
    </tr>
  </tbody>
</table><br/>`;
    insertHtmlAtSelection(tableTemplate);
  };

  const getClosestTableCell = (): HTMLTableCellElement | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node: Node | null = selection.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node as HTMLTableCellElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  const getClosestTable = (): HTMLTableElement | null => {
    const cell = getClosestTableCell();
    if (!cell) return null;
    let node: Node | null = cell;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TABLE') {
        return node as HTMLTableElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  const handleAddRow = () => {
    const cell = getClosestTableCell();
    const table = getClosestTable();
    if (cell && table) {
      const row = cell.parentElement as HTMLTableRowElement;
      const rowIndex = row.rowIndex;
      const newRow = table.insertRow(rowIndex + 1);
      const colCount = row.cells.length;
      for (let i = 0; i < colCount; i++) {
        const newCell = newRow.insertCell(i);
        newCell.className = "border border-gray-200 dark:border-gray-800 p-2";
        newCell.innerHTML = "New cell";
      }
      if (editorRef.current) {
        updateNoteContentWithHistory(editorRef.current.innerHTML);
      }
    } else {
      const activeTable = editorRef.current?.querySelector('table');
      if (activeTable) {
        const lastRow = activeTable.rows[activeTable.rows.length - 1];
        const colCount = lastRow ? lastRow.cells.length : 2;
        const newRow = activeTable.insertRow(-1);
        for (let i = 0; i < colCount; i++) {
          const newCell = newRow.insertCell(i);
          newCell.className = "border border-gray-200 dark:border-gray-800 p-2";
          newCell.innerHTML = "New cell";
        }
        if (editorRef.current) {
          updateNoteContentWithHistory(editorRef.current.innerHTML);
        }
      } else {
        handleInsertTable();
      }
    }
  };

  const handleAddColumn = () => {
    const cell = getClosestTableCell();
    const table = getClosestTable();
    if (cell && table) {
      const colIndex = cell.cellIndex;
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const isHeader = row.parentElement?.tagName === 'THEAD' || row.cells[colIndex]?.tagName === 'TH';
        let newCell;
        if (isHeader) {
          newCell = document.createElement('th');
          newCell.className = "border border-gray-200 dark:border-gray-800 p-2 font-bold text-left";
          newCell.innerHTML = "New Header";
          row.insertBefore(newCell, row.cells[colIndex + 1] || null);
        } else {
          newCell = row.insertCell(colIndex + 1);
          newCell.className = "border border-gray-200 dark:border-gray-800 p-2";
          newCell.innerHTML = "New cell";
        }
      }
      if (editorRef.current) {
        updateNoteContentWithHistory(editorRef.current.innerHTML);
      }
    } else {
      const activeTable = editorRef.current?.querySelector('table');
      if (activeTable) {
        for (let i = 0; i < activeTable.rows.length; i++) {
          const row = activeTable.rows[i];
          const isHeader = row.parentElement?.tagName === 'THEAD';
          let newCell;
          if (isHeader) {
            newCell = document.createElement('th');
            newCell.className = "border border-gray-200 dark:border-gray-800 p-2 font-bold text-left";
            newCell.innerHTML = "New Header";
            row.appendChild(newCell);
          } else {
            newCell = row.insertCell(-1);
            newCell.className = "border border-gray-200 dark:border-gray-800 p-2";
            newCell.innerHTML = "New cell";
          }
        }
        if (editorRef.current) {
          updateNoteContentWithHistory(editorRef.current.innerHTML);
        }
      } else {
        handleInsertTable();
      }
    }
  };

  const handleDeleteRow = () => {
    const cell = getClosestTableCell();
    const table = getClosestTable();
    if (cell && table) {
      const row = cell.parentElement as HTMLTableRowElement;
      table.deleteRow(row.rowIndex);
      if (table.rows.length === 0) {
        table.remove();
      }
      if (editorRef.current) {
        updateNoteContentWithHistory(editorRef.current.innerHTML);
      }
    }
  };

  const handleDeleteColumn = () => {
    const cell = getClosestTableCell();
    const table = getClosestTable();
    if (cell && table) {
      const colIndex = cell.cellIndex;
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        if (row.cells[colIndex]) {
          row.deleteCell(colIndex);
        }
      }
      if (table.rows[0]?.cells.length === 0) {
        table.remove();
      }
      if (editorRef.current) {
        updateNoteContentWithHistory(editorRef.current.innerHTML);
      }
    }
  };

  const getCleanErrorMessage = (err: unknown): string => {
    if (!err) return '';
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith('{')) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed && typeof parsed === 'object' && parsed.error) {
          let finalMsg = String(parsed.error);
          if (finalMsg.toLowerCase().includes('permission') || finalMsg.toLowerCase().includes('insufficient')) {
            return "Permissions issue: Please ensure you are logged in as an administrator to post messages to the board.";
          }
          return finalMsg;
        }
      } catch (e) {
        // Fallback
      }
    }
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('insufficient')) {
      return "Permissions issue: Please ensure you are logged in as an administrator to post messages to the board.";
    }
    return msg;
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setNoteError("Access denied: Only administrators are authorized to post briefing notices.");
      return;
    }
    if (!noteContent.trim()) return;
    setIsSubmittingNote(true);
    setNoteError('');
    try {
      const authorToUse = noteAuthor.trim() || (isAdmin ? "Team Leader (Admin)" : "Shift Lead");
      await addTeamLeaderNoteDoc(noteContent.trim(), authorToUse, noteIsUrgent);
      setNoteContent('');
      setNoteAuthor('');
      setNoteIsUrgent(false);
      setIsAddingNote(false);
      setNoteHistory(['']);
      setHistoryIndex(0);
      setActiveEditorTab('write');
    } catch (err) {
      console.error("Failed to add note: ", err);
      setNoteError(getCleanErrorMessage(err));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setNoteError("Access denied: Only administrators are authorized to edit briefing notices.");
      return;
    }
    if (!editingNoteId || !noteContent.trim()) return;
    setIsSubmittingNote(true);
    setNoteError('');
    try {
      await updateTeamLeaderNoteDoc(editingNoteId, noteContent.trim(), noteIsUrgent);
      setNoteContent('');
      setNoteAuthor('');
      setNoteIsUrgent(false);
      setEditingNoteId(null);
      setNoteHistory(['']);
      setHistoryIndex(0);
      setActiveEditorTab('write');
    } catch (err) {
      console.error("Failed to update note: ", err);
      setNoteError(getCleanErrorMessage(err));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!isAdmin) {
      console.warn("Access denied: Only administrators are authorized to delete briefing notices.");
      return;
    }
    try {
      await deleteTeamLeaderNoteDoc(id);
    } catch (err) {
      console.error("Failed to delete note: ", err);
    }
  };

  const startEditNote = (note: TeamLeaderNote) => {
    if (!isAdmin) return;
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setNoteIsUrgent(note.isUrgent);
    setNoteAuthor(note.author);
    setIsAddingNote(false);
    setNoteError('');
    setNoteHistory([note.content]);
    setHistoryIndex(0);
    setActiveEditorTab('write');
  };

  const cancelNoteForm = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
    setNoteContent('');
    setNoteIsUrgent(false);
    setNoteAuthor('');
    setNoteError('');
    setNoteHistory(['']);
    setHistoryIndex(0);
    setActiveEditorTab('write');
  };

  // Direct source of truth for interruptions: use passed interruptions prop if provided
  const displayInterruptions = interruptions !== undefined ? interruptions : liveInterruptions;

  // Process filters & search query - The Interruption Dashboard only displays ACTIVE / UNDER_INVESTIGATION outages.
  // Restored outages are automatically cleared from the dashboard and archived in the Restored Feeders tab.
  const filteredItems = displayInterruptions.filter((item) => {
    // Exclude restored items from the active interruption dashboard
    if (item.status === InterruptionStatus.RESTORED) {
      return false;
    }

    const query = searchQuery.toLowerCase();
    const englishArea = translateAmharicLocation(item.affectedArea).toLowerCase();
    // 1. Search Query Match (matches Feeder name, Amharic affected area, English translated area, and remarks)
    const matchesSearch = item.feederName.toLowerCase().includes(query) ||
                          item.affectedArea.toLowerCase().includes(query) ||
                          englishArea.includes(query) ||
                          item.remark.toLowerCase().includes(query);

    // 2. District Filter Match
    const matchesDistrict = selectedDistrict === 'All' || item.district === selectedDistrict;

    // 3. Type Filter Match
    const matchesType = selectedType === 'All' || item.type === selectedType;

    // 4. Cardinal Direction Filter Match
    const itemDir = getCardinalDirection(item.district, item.feederName);
    const matchesDirection = selectedDirection === 'All' || itemDir === selectedDirection;

    return matchesSearch && matchesDistrict && matchesType && matchesDirection;
  });

  // Process Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Put restored items at the bottom
    const aRestored = a.status === InterruptionStatus.RESTORED;
    const bRestored = b.status === InterruptionStatus.RESTORED;
    if (aRestored && !bRestored) return 1;
    if (!aRestored && bRestored) return -1;

    if (sortBy === 'name') {
      return a.feederName.localeCompare(b.feederName);
    }
    
    // Chronological comparison
    if (sortBy === 'latest') {
      return (b.lastUpdated || '').localeCompare(a.lastUpdated || '');
    } else {
      return (a.lastUpdated || '').localeCompare(b.lastUpdated || '');
    }
  });

  // Extract unique granular locations only from current active/investigating feeders
  // Restored locations are cleared from this active directory map
  const uniqueLocations: Array<{
    name: string;
    englishName: string;
    district: string;
    feederName: string;
    feederId: string;
    status: InterruptionStatus;
  }> = [];

  displayInterruptions
    .filter((item) => item.status !== InterruptionStatus.RESTORED)
    .forEach((item) => {
      // Split the affectedArea on typical Amharic and English delimiter characters
      const rawParts = item.affectedArea.split(/[፣、፤,;]+/);
      
      rawParts.forEach((part) => {
        let trimmed = part.trim();
        
        // Clear final punctuation or helper phrases
        if (trimmed.endsWith('።')) {
          trimmed = trimmed.replace(/።+$/, '');
        }
        
        // Filter out short texts, pure English or Amharic helper terms that aren't locations
        if (
          trimmed.length > 2 && 
          !trimmed.startsWith('በክፊል') && 
          !trimmed.startsWith('በከፊል') &&
          !trimmed.endsWith('ያልቃል') &&
          !trimmed.startsWith('እና አካባቢው')
        ) {
          const englishTrans = translateAmharicLocation(trimmed);
          // Prevent duplicate location tags for the same feeder
          const exists = uniqueLocations.some(
            (loc) => (loc.name.toLowerCase() === trimmed.toLowerCase() || loc.englishName.toLowerCase() === englishTrans.toLowerCase()) && loc.feederId === item.id
          );
          if (!exists) {
            uniqueLocations.push({
              name: trimmed,
              englishName: englishTrans,
              district: item.district,
              feederName: item.feederName,
              feederId: item.id,
              status: item.status
            });
          }
        }
      });
    });

  // Filter unique locations by directory search query and selected district
  const filteredUniqueLocations = uniqueLocations.filter((loc) => {
    const locQuery = locationSearchQuery.trim().toLowerCase();
    if (!locQuery) {
      return selectedDistrict === 'All' || loc.district === selectedDistrict;
    }

    const cleanLocQuery = locQuery.replace(/[\s\-_.]/g, '');
    const cleanEnglishName = loc.englishName.toLowerCase().replace(/[\s\-_.]/g, '');
    const cleanAmharicName = loc.name.toLowerCase();
    const cleanFeederName = loc.feederName.toLowerCase();
    const cleanDistrict = loc.district.toLowerCase();

    // Check direct match, English match, cleaned spaceless match, feeder, and district
    const matchesSearch = 
      cleanAmharicName.includes(locQuery) || 
      loc.englishName.toLowerCase().includes(locQuery) ||
      cleanEnglishName.includes(cleanLocQuery) ||
      cleanFeederName.includes(locQuery) ||
      cleanDistrict.includes(locQuery);

    const matchesDistrict = selectedDistrict === 'All' || loc.district === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  // Compute direction statistics based on all current active interruptions
  const directionStats = {
    North: { active: 0, restored: 0, total: 0, areas: [] as string[] },
    East: { active: 0, restored: 0, total: 0, areas: [] as string[] },
    West: { active: 0, restored: 0, total: 0, areas: [] as string[] },
    South: { active: 0, restored: 0, total: 0, areas: [] as string[] },
    Sheger: { active: 0, restored: 0, total: 0, areas: [] as string[] },
  };

  displayInterruptions.forEach((item) => {
    const dir = getCardinalDirection(item.district, item.feederName);
    const isActive = item.status !== InterruptionStatus.RESTORED;
    
    if (isActive) {
      directionStats[dir].total += 1;
      directionStats[dir].active += 1;

      // Capture unique clean location names for preview inside direction card only for active outages
      const rawParts = item.affectedArea.split(/[፣、፤,;]+/);
      rawParts.forEach((part) => {
        let trimmed = part.trim();
        
        if (trimmed.endsWith('።')) {
          trimmed = trimmed.replace(/።+$/, '');
        }
        
        if (
          trimmed.length > 2 && 
          !trimmed.startsWith('በክፊል') && 
          !trimmed.startsWith('በከፊል') && 
          !trimmed.endsWith('ያልቃል') && 
          !trimmed.startsWith('እና አካባቢው')
        ) {
          if (!directionStats[dir].areas.includes(trimmed)) {
            directionStats[dir].areas.push(trimmed);
          }
        }
      });
    } else {
      directionStats[dir].restored += 1;
    }
  });

  return (
    <div id="agent-dashboard-view" className="flex flex-col gap-6">
      
      {/* Filters Drawer */}
      <div className="glass-card rounded-3xl px-6 py-5 order-2">
        {/* Filters and sorting row */}
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px] grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Direction Filter */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs font-sans text-gray-500 dark:text-gray-400 whitespace-nowrap">Direction:</span>
              <select
                id="filter-direction"
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="text-xs rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:ring-1.5 focus:ring-eeu-green cursor-pointer w-full"
              >
                <option value="All">All Directions</option>
                <option value="North">North Addis Ababa</option>
                <option value="East">East Addis Ababa</option>
                <option value="West">West Addis Ababa</option>
                <option value="South">South Addis Ababa</option>
                <option value="Sheger">Sheger Region</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs font-sans text-gray-500 dark:text-gray-400 whitespace-nowrap">Type:</span>
              <select
                id="filter-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:ring-1.5 focus:ring-eeu-green w-full"
              >
                <option value="All">All Causes</option>
                {Object.values(InterruptionType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Sort Order dropdown */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs font-sans text-gray-500 dark:text-gray-400 whitespace-nowrap">Sort:</span>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:ring-1.5 focus:ring-eeu-green w-full"
              >
                <option value="latest">Latest Updates</option>
                <option value="oldest">Oldest Incidents</option>
                <option value="name">Station Name</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Language Selector for Communities & Landmarks (2 Languages: English & Amharic) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-sans text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-eeu-green" />
                <span className="hidden sm:inline">Language:</span>
              </span>
              <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold">
                <button
                  id="lang-am-btn"
                  onClick={() => setLanguageMode('am')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    languageMode === 'am'
                      ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                  title="Amharic Only"
                >
                  <span>አማርኛ</span>
                  <span className="text-[9px] opacity-75 font-mono">AM</span>
                </button>

                <button
                  id="lang-en-btn"
                  onClick={() => setLanguageMode('en')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    languageMode === 'en'
                      ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                  title="English Spelling"
                >
                  <span>English</span>
                  <span className="text-[9px] opacity-75 font-mono">EN</span>
                </button>
              </div>
            </div>

            {/* Layout view controls */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
              <button
                id="layout-horizontal-btn"
                onClick={() => setViewLayout('horizontal')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'horizontal' ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Horizontal List Feed"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                id="layout-grid-btn"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'grid' ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Bento Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                id="layout-table-btn"
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'table' ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Sleek Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>







      {/* AFFECTED AREAS DIRECTORY & CATALOG */}
      <div id="affected-areas-directory-card" className="glass-card rounded-3xl p-5 border border-gray-250/50 dark:border-gray-850/70 space-y-4 shadow-sm select-none order-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5 text-[17px]">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-950/20 text-[#F48B20] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-950 dark:text-white text-[17px] tracking-tight leading-tight flex items-center gap-2">
                Affected Areas
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Directory sub-filter search inputs */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <input
                id="directory-subsearch-input"
                type="text"
                placeholder="Search area (English / አማርኛ, e.g. Bole, ሜክሲኮ)..."
                value={locationSearchQuery}
                onChange={(e) => {
                  setLocationSearchQuery(e.target.value);
                  if (e.target.value && !isDirectoryExpanded) {
                    setIsDirectoryExpanded(true);
                  }
                }}
                className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#5FA354] w-64 sm:w-72 font-sans font-medium transition-all"
              />
              {locationSearchQuery && (
                <button 
                  onClick={() => setLocationSearchQuery('')}
                  className="absolute right-2 top-1.5 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold px-1"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Toggle show/collapse helper */}
            <button
              id="toggle-directory-btn"
              onClick={() => setIsDirectoryExpanded(!isDirectoryExpanded)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-950 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1.5"
            >
              <span>{isDirectoryExpanded ? 'Hide Directory List' : 'Show Directory List'}</span>
              <span className="text-[10.5px] font-sans font-bold bg-[#5FA354]/15 text-[#5FA354] px-2 py-0.2 rounded-full">
                {filteredUniqueLocations.length} locations
              </span>
            </button>
          </div>
        </div>

        {isDirectoryExpanded && (
          <div className="space-y-4 border-t border-gray-100 dark:border-gray-900/60 pt-4">
            {filteredUniqueLocations.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 italic">
                {locationSearchQuery ? 'No matching affected area found in our system registry' : 'No active affected location areas recorded under the current active filter state'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[195px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredUniqueLocations.map((loc, idx) => {
                  const isRestored = loc.status === InterruptionStatus.RESTORED;
                  const isUnderInvestigation = loc.status === InterruptionStatus.UNDER_INVESTIGATION;
                  const isActiveSelection = searchQuery.toLowerCase() === loc.name.toLowerCase() || searchQuery.toLowerCase() === loc.englishName.toLowerCase();

                  return (
                    <button
                      key={`dir-loc-${loc.feederId}-${idx}`}
                      onClick={() => {
                        if (isActiveSelection) {
                          setSearchQuery('');
                        } else {
                          setSearchQuery(languageMode === 'en' ? loc.englishName : loc.name);
                        }
                      }}
                      className={`text-[11.5px] px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all text-left cursor-pointer ${
                        isActiveSelection 
                          ? 'bg-[#5FA354] border-[#5FA354] text-white font-bold ring-2 ring-[#5FA354]/40 shadow-sm'
                          : isRestored
                          ? 'bg-gray-100/50 dark:bg-gray-950/20 hover:bg-gray-100/50 border-gray-200 dark:border-gray-900 text-gray-400 dark:text-gray-600 line-through'
                          : isUnderInvestigation
                          ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-300/40 text-amber-700 dark:text-amber-400 font-medium'
                          : 'bg-red-500/5 hover:bg-red-500/10 border-red-200/50 dark:border-red-950/40 text-red-600 dark:text-red-400 font-medium'
                      }`}
                      title={`Feeder Station: ${stripBrackets(loc.feederName)} | EN: ${loc.englishName}`}
                    >
                      {/* Live flashing status pulse marker */}
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        {!isRestored && !isUnderInvestigation && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          isRestored 
                            ? 'bg-gray-400' 
                            : isUnderInvestigation
                            ? 'bg-amber-400'
                            : 'bg-red-500'
                        }`} />
                      </span>
                      
                      {languageMode === 'en' ? (
                        <span className="font-sans font-bold">{loc.englishName}</span>
                      ) : (
                        <span className="font-sans font-bold">{loc.name}</span>
                      )}
                      
                      <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded uppercase ${
                        isActiveSelection 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-200/50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold'
                      }`}>
                        {loc.district.replace(' Addis Ababa', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Directory sub-panel footer */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-mono gap-4 flex-wrap">
              <div className="flex items-center gap-3.5 flex-wrap">
                <span className="flex items-center gap-1.5 font-arial">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Active Outage
                </span>
                <span className="flex items-center gap-1.5 font-arial">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Partially Connected
                </span>
                <span className="flex items-center gap-1.5 font-georgia">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Restored Location
                </span>
              </div>
              <span className="text-right font-arial">Click any area tag once to isolate; click again to clear search filters.</span>
            </div>
          </div>
        )}
      </div>



      {/* Main Results Board */}
      <div className="order-4 w-full flex flex-col gap-6">
        {sortedItems.length === 0 ? (
          <div id="no-results-panel" className="glass-card rounded-3xl p-10 text-center max-w-xl mx-auto my-6 border border-gray-200/80 dark:border-gray-800">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">
              {searchQuery || selectedDistrict !== 'All' || selectedType !== 'All' || selectedDirection !== 'All' 
                ? 'No Outages Match Active Filter' 
                : 'No outages'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              {searchQuery || selectedDistrict !== 'All' || selectedType !== 'All' || selectedDirection !== 'All'
                ? 'Try clearing your search query or resetting the district / direction filters.'
                : 'All electrical distribution feeder lines are normal.'}
            </p>
            {(searchQuery || selectedDistrict !== 'All' || selectedType !== 'All' || selectedDirection !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDistrict('All');
                  setSelectedType('All');
                  setSelectedDirection('All');
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
        <>
          {(() => {
            const directionsToRender = selectedDirection !== 'All' 
              ? [selectedDirection] 
              : (['North', 'East', 'West', 'South', 'Sheger'] as const);

            const renderDirHeader = (dir: string, count: number) => {
              let amStyle = "text-sky-600 bg-sky-500/10 dark:text-sky-400";
              let amName = "ሰሜን አዲስ አበባ";

              if (dir === 'North') {
                amStyle = "text-sky-600 bg-sky-500/10 dark:text-sky-400";
                amName = "ሰሜን አዲስ አበባ";
              } else if (dir === 'East') {
                amStyle = "text-amber-600 bg-amber-500/10 dark:text-amber-400";
                amName = "ምሥራቅ አዲስ አበባ";
              } else if (dir === 'South') {
                amStyle = "text-red-650 bg-red-500/10 dark:text-red-400";
                amName = "ደቡብ አዲስ አበባ";
              } else if (dir === 'West') {
                amStyle = "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400";
                amName = "ምዕራብ አዲስ አበባ";
              } else {
                amStyle = "text-purple-600 bg-purple-500/10 dark:text-purple-400";
                amName = "ሸገር ክልል";
              }

              return (
                <div key={`group-heading-${dir}`} className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-2.5 mt-8 mb-4 first:mt-2">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <h3 className="font-display font-black text-gray-900 dark:text-white text-xl tracking-tight flex items-center gap-2">
                        {dir === 'Sheger' ? 'Sheger Region' : `${dir} Addis Ababa`}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            };

          if (viewLayout === 'horizontal') {
            return (
              <div id="outages-horizontal-layout" className="space-y-8">
                {directionsToRender.map((dir) => {
                  const itemsInDir = sortedItems.filter(item => getCardinalDirection(item.district, item.feederName) === dir);
                  if (itemsInDir.length === 0) return null;

                  return (
                    <div key={`horizontal-dir-group-${dir}`} className="space-y-4">
                      {renderDirHeader(dir, itemsInDir.length)}
                      <div className="space-y-4">
                        {itemsInDir.map((item) => {
                          const isRestored = item.status === InterruptionStatus.RESTORED;

                          return (
                            <div
                              id={`feeder-wide-card-${item.id}`}
                              key={`wide-${item.id}`}
                              className={`glass-card p-5 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${
                                isRestored ? 'opacity-60 border-gray-250/30' : 'border-l-4 border-l-eeu-green'
                              }`}
                            >
                              {/* Left Column: Feeder & District details */}
                              <div className="lg:w-1/4 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                                    item.status === InterruptionStatus.ACTIVE
                                      ? 'bg-red-500/10 text-red-600'
                                      : item.status === InterruptionStatus.UNDER_INVESTIGATION
                                      ? 'bg-amber-500/10 text-amber-600'
                                      : 'bg-green-500/10 text-green-600'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      item.status === InterruptionStatus.ACTIVE
                                        ? 'bg-red-500 animate-pulse'
                                        : item.status === InterruptionStatus.UNDER_INVESTIGATION
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                                    }`} />
                                    {item.status}
                                  </span>
                                </div>

                                <h3 className="font-display font-bold text-gray-950 dark:text-white text-base leading-tight">
                                  {stripBrackets(item.feederName)}
                                </h3>
                                <div className="pt-0.5">
                                  <InterruptionTypeBadge type={item.type} />
                                </div>
                              </div>

                              {/* Center Column: Affected Neighborhoods & Remark */}
                              <div className="flex-1 space-y-2">
                                <div className="p-3.5 rounded-2xl bg-gray-100/40 dark:bg-gray-950/40 border border-gray-200/30 dark:border-gray-850/40 text-xs lg:w-[670px] w-full">
                                  <div className="font-semibold text-gray-400 dark:text-gray-500 uppercase text-[9px] tracking-wider mb-1.5 font-sans flex items-center justify-between">
                                    <span>Affected Communities & Landmark Areas</span>
                                    <span className="font-mono text-[9px] text-eeu-green bg-eeu-green/10 px-1.5 py-0.2 rounded font-bold">
                                      {languageMode === 'en' ? 'EN' : 'አማ'}
                                    </span>
                                  </div>
                                  
                                  {languageMode === 'en' ? (
                                    <p className="font-sans text-[14px] text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
                                      {translateAmharicLocation(item.affectedArea)}
                                    </p>
                                  ) : (
                                    <p className="font-sans text-[14.5px] text-gray-900 dark:text-gray-100 leading-relaxed">
                                      {item.affectedArea}
                                    </p>
                                  )}
                                </div>

                                <div className="text-xs text-gray-500 dark:text-gray-400 italic pl-3 border-l-2 border-gray-200 dark:border-gray-800">
                                  &ldquo;{item.remark}&rdquo;
                                </div>
                              </div>

                              {/* Right Column: Timing details & Index Ref */}
                              <div className="lg:w-1/4 flex flex-col justify-center gap-4 lg:text-right border-t lg:border-t-0 lg:border-l border-gray-150/40 dark:border-gray-800/60 pt-4 lg:pt-0 lg:pl-6 leading-loose">
                                <div className="space-y-1.5">
                                  <div className="text-gray-400 dark:text-gray-500 flex lg:justify-end items-center gap-1 font-semibold uppercase text-[9px] tracking-wider">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Duration Details</span>
                                  </div>
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 font-sans space-y-1">
                                    <div className="flex justify-between lg:justify-end gap-3">
                                      <span className="text-gray-400">Start Time:</span>
                                      <span className="text-gray-800 dark:text-gray-300">{item.startTime}</span>
                                    </div>
                                    {item.type !== 'Earth Fault' && item.type !== 'Short Circuit' && (
                                      <div className="flex justify-between lg:justify-end gap-3">
                                        <span className="text-gray-400">Est. Restore:</span>
                                        <span className="text-eeu-green font-semibold">{item.estimatedRestorationTime}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-sans text-right flex flex-col justify-end leading-normal">
                                  <span>Last Updated: {item.lastUpdated}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else if (viewLayout === 'grid') {
            return (
              <div id="outages-grid-grouped" className="space-y-8">
                {directionsToRender.map((dir) => {
                  const itemsInDir = sortedItems.filter(item => getCardinalDirection(item.district, item.feederName) === dir);
                  if (itemsInDir.length === 0) return null;

                  return (
                    <div key={`grid-dir-group-${dir}`} className="space-y-4">
                      {renderDirHeader(dir, itemsInDir.length)}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {itemsInDir.map((item) => {
                          const isRestored = item.status === InterruptionStatus.RESTORED;

                          return (
                            <div
                              id={`feeder-card-${item.id}`}
                              key={item.id}
                              className={`glass-card ${
                                isRestored 
                                  ? 'opacity-70' 
                                  : 'border-l-4 border-l-eeu-green'
                              } rounded-3xl h-full p-5 flex flex-col justify-between`}
                            >
                              <div className="space-y-3.5">
                                {/* Card top bar */}
                                <div className="flex items-start justify-between gap-3">
                                  {/* Operational badge */}
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    item.status === InterruptionStatus.ACTIVE
                                      ? 'bg-red-500/10 text-red-655 dark:bg-red-955/20 dark:text-red-400'
                                      : item.status === InterruptionStatus.UNDER_INVESTIGATION
                                      ? 'bg-amber-500/10 text-amber-655 dark:bg-amber-955/20 dark:text-amber-400'
                                      : 'bg-eeu-green/10 text-eeu-green'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      item.status === InterruptionStatus.ACTIVE
                                        ? 'bg-red-500 animate-pulse'
                                        : item.status === InterruptionStatus.UNDER_INVESTIGATION
                                        ? 'bg-amber-500'
                                        : 'bg-eeu-green'
                                    }`} />
                                    {item.status}
                                  </span>
                                </div>

                                {/* Feeder Name */}
                                <div>
                                  <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white leading-tight">
                                    {stripBrackets(item.feederName)}
                                  </h3>
                                  <div className="pt-1.5">
                                    <InterruptionTypeBadge type={item.type} />
                                  </div>
                                </div>

                                {/* Affected Area details */}
                                <div className="p-3 rounded-xl bg-gray-100/50 dark:bg-gray-950/40 border border-gray-200/50 dark:border-gray-850/60 text-xs">
                                  <div className="font-semibold text-gray-500 dark:text-gray-450 uppercase text-[9px] tracking-wider mb-1.5 font-mono flex items-center justify-between">
                                    <span>Affected Communities</span>
                                    <span className="text-[8.5px] font-mono text-eeu-green font-bold">
                                      {languageMode === 'en' ? 'EN' : 'አማ'}
                                    </span>
                                  </div>
                                  
                                  {languageMode === 'en' ? (
                                    <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed font-sans text-xs">
                                      {translateAmharicLocation(item.affectedArea)}
                                    </p>
                                  ) : (
                                    <p className="text-gray-850 dark:text-gray-200 leading-relaxed font-sans text-xs">
                                      {item.affectedArea}
                                    </p>
                                  )}
                                </div>

                                {/* Remarks details */}
                                <div className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed italic border-l-2 border-gray-300 dark:border-gray-800 pl-3">
                                  &ldquo;{item.remark}&rdquo;
                                </div>
                              </div>

                              {/* Timing panel at bottom */}
                              <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3 text-[11px]">
                                <div className={(item.type === 'Earth Fault' || item.type === 'Short Circuit') ? 'col-span-2' : ''}>
                                  <div className="text-gray-400 dark:text-gray-500 flex items-center gap-1 font-semibold uppercase text-[9px]">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span>Start Time</span>
                                  </div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300 block mt-0.5 font-mono">{item.startTime}</span>
                                </div>
                                {item.type !== 'Earth Fault' && item.type !== 'Short Circuit' && (
                                  <div>
                                    <div className="text-gray-400 dark:text-gray-500 flex items-center gap-1 font-semibold uppercase text-[9px]">
                                      <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                                      <span>Est. Restore</span>
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 block mt-0.5 font-mono">{item.estimatedRestorationTime}</span>
                                  </div>
                                )}
                                <div className="col-span-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-850 text-[10px] text-gray-400 dark:text-gray-500 font-mono flex items-center justify-end">
                                  <span>Last Update: {item.lastUpdated}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // Sleek Industrial Grouped Table View
            return (
              <div id="outages-table" className="glass-card rounded-2xl overflow-hidden shadow-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-sans font-bold text-gray-400 dark:text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-950/20">
                        <th className="py-3.5 px-5">Feeder Station Details</th>
                        <th className="py-3.5 px-5">Interruption Cause</th>
                        <th className="py-3.5 px-5">Timeline (Start / Restoration)</th>
                        <th className="py-3.5 px-5 w-[500px]">Affected Location Area / Remarks</th>
                        <th className="py-3.5 px-5">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                      {directionsToRender.map((dir) => {
                        const itemsInDir = sortedItems.filter(item => getCardinalDirection(item.district, item.feederName) === dir);
                        if (itemsInDir.length === 0) return null;

                        return (
                          <React.Fragment key={`table-dir-group-${dir}`}>
                            <tr className="bg-gray-100/50 dark:bg-gray-950/40 font-bold">
                              <td colSpan={5} className="py-3 px-5 text-xs text-gray-900 dark:text-gray-100 font-sans uppercase">
                                ⚡ {dir === 'Sheger' ? 'SHEGER REGION' : `${dir.toUpperCase()} ADDIS ABABA`} SECTOR OUTAGES ({itemsInDir.length})
                              </td>
                            </tr>
                            {itemsInDir.map((item) => {
                              const isRestored = item.status === InterruptionStatus.RESTORED;
                              return (
                                <tr 
                                  key={item.id} 
                                  className={`hover:bg-gray-50/35 dark:hover:bg-gray-950/20 transition-all ${
                                    isRestored ? 'bg-gray-50/40 dark:bg-gray-950/10 opacity-70' : ''
                                  }`}
                                >
                                  <td className="py-4 px-5 font-semibold text-gray-950 dark:text-white">
                                    {stripBrackets(item.feederName)}
                                  </td>
                                  <td className="py-4 px-5">
                                    <InterruptionTypeBadge type={item.type} />
                                  </td>
                                  <td className="py-4 px-5 text-gray-650 dark:text-gray-400 text-xs font-sans">
                                    <div className="flex flex-col gap-1.5 leading-none">
                                      <div className="flex items-center">
                                        <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono w-14">Start:</span>
                                        <span className="font-sans font-medium">{item.startTime}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono w-14">Est. End:</span>
                                        <span className="font-sans font-medium">{(item.type === 'Earth Fault' || item.type === 'Short Circuit') ? 'N/A' : item.estimatedRestorationTime}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-5 max-w-sm">
                                    {languageMode === 'en' ? (
                                      <div className="text-xs text-gray-800 dark:text-gray-200 font-medium">
                                        {translateAmharicLocation(item.affectedArea)}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                                        {item.affectedArea}
                                      </div>
                                    )}
                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 italic truncate mt-1" title={item.remark}>
                                      Remark: {item.remark}
                                    </div>
                                  </td>
                                  <td className="py-4 px-5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      item.status === InterruptionStatus.ACTIVE
                                        ? 'bg-red-100/70 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                        : item.status === InterruptionStatus.UNDER_INVESTIGATION
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                        : 'bg-green-100/70 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        item.status === InterruptionStatus.ACTIVE
                                          ? 'bg-red-500'
                                          : item.status === InterruptionStatus.UNDER_INVESTIGATION
                                          ? 'bg-amber-500 animate-pulse'
                                          : 'bg-green-500'
                                      }`} />
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
        })()}
      </>
    )}
  </div>

    </div>
  );
}
