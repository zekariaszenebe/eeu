import { FeederInterruption, InterruptionType, InterruptionStatus, SystemNotification, ContactItem } from '../types';
import { INITIAL_FEEDERS_LIST } from './feedersList';

export { INITIAL_FEEDERS_LIST };

export const INITIAL_DISTRICTS = [
  'Team A',
  'Team B',
  'Team C',
  'Team D'
];

const getPastHoursString = (hours: number): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.round(hours * 60));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getFutureHoursString = (hours: number): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Math.round(hours * 60));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const INITIAL_INTERRUPTIONS: FeederInterruption[] = [
  {
    id: 'f-1',
    feederName: 'ADDIS CENTER - ADC-15',
    district: 'Team A',
    type: InterruptionType.EARTH_FAULT,
    status: InterruptionStatus.ACTIVE,
    startTime: getPastHoursString(1.5),
    estimatedRestorationTime: getFutureHoursString(2),
    affectedArea: 'ለገሐር፣ ቤተዛታ ሆስፒታል፣ ኦሮሚያ ባሕል ማዕከልጀርባ ፣ ጊዮን ሆቴል፣ እስጢፋኖስ ድልድይ አካባቢ፣ እስጢፋኖስ ቤተክርስቲያን ፤ ካሳንቺስ ግራንድ ፓላስ ሆቴል አካባቢ',
    remark: 'Ground fault detected on Legihar overhead node. Protection relays opened line breaker 15. Patrol team tracing cables.',
    lastUpdated: getPastHoursString(0.2)
  },
  {
    id: 'f-2',
    feederName: 'ADDIS EAST - ADE-05',
    district: 'Team B',
    type: InterruptionType.SHORT_CIRCUIT,
    status: InterruptionStatus.ACTIVE,
    startTime: getPastHoursString(3),
    estimatedRestorationTime: getFutureHoursString(1.5),
    affectedArea: 'ጋቦን ኢንባሲ ፤ 24 ስፖርት ኮሚሽን ፤አደይ አበባ ስታዲየም ፤ 24 ኮንዶሚኒየም ፤ጨጨሆ የባህል አዳራሽ ፤ መሶብ ፤ ቦሌ መድሀኒአለም ፤ ቦሌ 2ተኛ ደረጃ ትምህርት ቤት ፤ ሬድዋን ህንጻ ፤ ሞኪንኮ ጀርባ ፤ ሰላም ህንጻ ፤ ኦሮሚያ ታወር ፤ ዮጎ ቸርች ፤ ቀነኒሳ ሆቴል ፤ ብርሀነ አደሬ ህንጻ ፤ አርመን ሆቴል ፤ ሞሞና ሆቴል ፤ ካሌብ ሆቴል ፤ መድሀኒአለም ታወር ፤',
    remark: 'Transient overhead contact due to windstorm. Line inspection under progress.',
    lastUpdated: getPastHoursString(0.5)
  },
  {
    id: 'f-3',
    feederName: 'BLACK LINE - BLL-03',
    district: 'Team A',
    type: InterruptionType.OPERATIONAL_INTERRUPTION,
    status: InterruptionStatus.UNDER_INVESTIGATION,
    startTime: getPastHoursString(0.5),
    estimatedRestorationTime: getFutureHoursString(3.5),
    affectedArea: 'ጥቁር አንበሳ ሆስፒታል ሙሉ እስከ ተክለሀይማኖት ፓርክ ድረስ ፤ 40/60 ሰንጋ ተራ ኮንዶሚኒየም ፤ 5ተኛ እስከ ጌጃ ድረስ ፤ ብሔራርዊ',
    remark: 'Oil temperature threshold alarm reported at Black Lion hospital sector transformers. Auxiliary crews isolating.',
    lastUpdated: getPastHoursString(0.1)
  },
  {
    id: 'f-4',
    feederName: 'ADDIS NORTH - ADN-06',
    district: 'Team C',
    type: InterruptionType.EARTH_FAULT,
    status: InterruptionStatus.ACTIVE,
    startTime: getPastHoursString(2.5),
    estimatedRestorationTime: getFutureHoursString(1.2),
    affectedArea: 'ሀግቤስ አራት መንታ፣ ጎጃም በረንዳ ጫፍ ፣ ጅንአድ፣ አበበች ጎበና ፣ ቄጤማ ተራ፣ ፓስተር አደባባይ፤ ጳውሎስ ሆስፒታል፣ አቤት ሆስፒታል፣ ቅዱስ ዮሐንስ ቤ/ክ፣',
    remark: 'Low-impedance earth leakage detected on primary feeder trunk. Sector crews dispatched for insulation scans.',
    lastUpdated: getPastHoursString(1)
  },
  {
    id: 'f-5',
    feederName: 'WEREGENU - WER-04',
    district: 'Team B',
    type: InterruptionType.PLANNED_INTERRUPTION,
    status: InterruptionStatus.ACTIVE,
    startTime: getPastHoursString(1),
    estimatedRestorationTime: getFutureHoursString(4),
    affectedArea: 'ሳሚ ህንጻ ፤ ስካይ ላይት ሆቴል ፤ ሚሊኒየም አዳራሽ ፤ አለም ሲኒማ ፤ አባሳደር ሆቴል ፤ ጁፒተር ሆቴል እና አካባቢው',
    remark: 'Authorized Weregenu sub-station line rehabilitation: breaker contact replacement and thermal scanning.',
    lastUpdated: getPastHoursString(1)
  },
  {
    id: 'f-6',
    feederName: 'MEKANISA - MEK-02',
    district: 'Team D',
    type: InterruptionType.SHORT_CIRCUIT,
    status: InterruptionStatus.RESTORED,
    startTime: getPastHoursString(5),
    estimatedRestorationTime: getPastHoursString(0.5),
    affectedArea: 'ለቡ ፤ ቻድ ኢንባሲ ፤ 72 መንደር በሙሉ ፤ ተክለ ሀይማኖት ቤተክርስቲያ ፤ ሁጃድ ቻይና ድርጅት (camp) ፤ ጀሞ 3 ፤ ጀሞ ፌደራል ሆስፒታል ድረስ',
    remark: 'Replaced bird protection guards and localized insulation sleeves. Grid re-energization logged completely stable.',
    lastUpdated: getPastHoursString(0.5)
  },
  {
    id: 'f-7',
    feederName: 'BELLA - BEL-03',
    district: 'Team C',
    type: InterruptionType.PLANNED_INTERRUPTION,
    status: InterruptionStatus.RESTORED,
    startTime: getPastHoursString(6),
    estimatedRestorationTime: getPastHoursString(1),
    affectedArea: 'ቤላ ሰብስቴሽን ፊት ለፊት ፤ ጣሊያን ኢምባሲ ፤ ጀርመን ኢንባሲ ፤ ሚኒሊክ ሆስፒታል ፤ 6 ኪሎ ፤ ያሬድ ሙዚቃ ቤት ፤ 5ኪሎ ዩኒቨርስቲ ፤ ግ ንፍሌ ፤ 4ኪሎ ዪኒቨርስቲ ፤ ቅድስት ስላሴ ቤተክርስቲያን ድረስ',
    remark: 'Scheduled double circuit line tree branch clearing completed successfully to secure overhead lines safety clearance.',
    lastUpdated: getPastHoursString(1)
  },
  {
    id: 'f-8',
    feederName: 'ADDIS CENTER - ADC-04',
    district: 'Team A',
    type: InterruptionType.SHORT_CIRCUIT,
    status: InterruptionStatus.ACTIVE,
    startTime: getPastHoursString(0.8),
    estimatedRestorationTime: getFutureHoursString(2.5),
    affectedArea: 'ሜክሲኮ ደብረወርቅ ሕንጻ፣ ለገሐር ጀርባ ፣ ለገሐር አሸዋ ተራ ፣ ኤግዝቢሽን ሴንተር፣ ፍላሚንጎ፣ኦሎምፒያ ፣ ደንበል፣ ደንበል ጀርባ፣ ፐርፕል ካፌ ፣ ቦሌ ማተሚያ ቤት ፤ ወሎ ሰፈር በከፊል',
    remark: 'Transformer trip flagged due to load surges near Flamingo/Olympia segments. Emergency response dispatched.',
    lastUpdated: getPastHoursString(0.1)
  },
  {
    id: 'f-9',
    feederName: 'GEFERESA - GEF-20',
    district: 'Team D',
    type: InterruptionType.EARTH_FAULT,
    status: InterruptionStatus.ACTIVE,
    startTime: getPastHoursString(1.2),
    estimatedRestorationTime: getFutureHoursString(3.2),
    affectedArea: 'ድሬ ከአስፋልት በታች፣ ጉዳ፣ ኬላ፣ ጉዮ፣ ታጠቅ ኢንዱስትሪ መንደር በከፊል ፣ቶልቻ ፤ ሰሪፊ ፤ ጉጄ ፤ ቶልቻ ፤ ታጠቅ ኢንዱስትሪ ፤ ፌስቱላ ማዕከል እና አካባቢው',
    remark: 'Permanent earth fault on Burayu path. Patrol crew tracking insulator breakdown near heavy factories.',
    lastUpdated: getPastHoursString(0.4)
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n-2',
    feederId: 'f-1',
    type: 'new',
    title: 'Active Fault: ADDIS CENTER ADC-15',
    message: 'Breaker trip reporting phase imbalance at Legihar train station. Line patrol crew dispatched immediately.',
    timestamp: getPastHoursString(1.5),
    read: false
  },
  {
    id: 'n-3',
    feederId: 'f-6',
    type: 'resolve',
    title: 'Feeder Line Restored',
    message: 'MEKANISA MEK-02 re-energized after replacing wet insulation gaskets. Voltage levels normal.',
    timestamp: getPastHoursString(0.5),
    read: false
  },
  {
    id: 'n-4',
    feederId: 'f-5',
    type: 'update',
    title: 'Bole / Weregenu Work Commenced',
    message: 'Authorized Weregenu substation downtime scheduled in Bole Edna Mall Sector.',
    timestamp: getPastHoursString(1),
    read: true
  }
];

export const INITIAL_CUSTOMER_CONTACTS: ContactItem[] = [
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
  { id: 'cc-23', name: 'Oromia Region Office', phone: '011-522-61-91', category: 'regional_hotline', locationInfo: 'Oromia Region service hub' }
];
