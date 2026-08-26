import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Info, 
  FileText, 
  AlertTriangle, 
  Percent, 
  Coins, 
  Calendar, 
  Zap, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Printer,
  Receipt,
  Home,
  Building2,
  Gauge,
  CreditCard
} from 'lucide-react';

interface BlockCalculationRow {
  blockIndex: number;
  blockName: string;
  rangeText: string;
  originalSize: number;
  scaledSize: number;
  rate: number;
  consumed: number;
  cost: number;
}

// 2017 - 2020 EEU Tariff Matrices
const TARIFFS = {
  domestic: {
    '2017': {
      '1': [0.3537, 0.9478, 1.8864, 2.4597, 2.6580, 2.8474, 2.9173],
      '2': [0.4344, 1.1285, 2.1478, 2.9193, 3.1159, 3.2898, 3.3537],
      '3': [0.5150, 1.3093, 2.4092, 3.3790, 3.5739, 3.7321, 3.7900],
      '4': [0.5957, 1.4901, 2.6706, 3.8387, 4.0318, 4.1745, 4.2263]
    },
    '2018': {
      '1': [0.6764, 1.6708, 2.9320, 4.2983, 4.4898, 4.6169, 4.6627],
      '2': [0.7571, 1.8516, 3.1934, 4.7580, 4.9477, 5.0593, 5.0990],
      '3': [0.8377, 2.0324, 3.4549, 5.2177, 5.4057, 5.5017, 5.5354],
      '4': [0.9184, 2.2131, 3.7163, 5.6773, 5.8636, 5.9441, 5.9717]
    },
    '2019': {
      '1': [0.9991, 2.3939, 3.9777, 6.1370, 6.3216, 6.3864, 6.4080],
      '2': [1.0798, 2.5746, 4.2391, 6.5967, 6.7796, 6.8288, 6.8444],
      '3': [1.1604, 2.7554, 4.5005, 7.0563, 7.2375, 7.2712, 7.2807],
      '4': [1.2411, 2.9362, 4.7619, 7.5160, 7.6955, 7.7136, 7.7170]
    },
    '2020': {
      '1': [1.3218, 3.1169, 5.0233, 7.9754, 8.1534, 8.1560, 8.1534],
      '2': [1.4025, 3.2977, 5.2847, 8.4353, 8.5897, 8.5983, 8.6114],
      '3': [1.4831, 3.4785, 5.5461, 8.8950, 9.0260, 9.0407, 9.0693],
      '4': [1.5368, 3.6592, 5.8075, 9.3546, 9.4624, 9.4831, 9.5273]
    }
  },
  commercial: {
    '2017': {
      '1': 2.6057,
      '2': 3.0874,
      '3': 3.5691,
      '4': 4.0507
    },
    '2018': {
      '1': 4.5324,
      '2': 5.0141,
      '3': 5.4958,
      '4': 5.9775
    },
    '2019': {
      '1': 6.4592,
      '2': 6.9409,
      '3': 7.4225,
      '4': 7.9042
    },
    '2020': {
      '1': 8.3859,
      '2': 8.8676,
      '3': 9.3493,
      '4': 9.8310
    }
  }
};

const SERVICE_CHARGES = {
  domestic: {
    postpaid: {
      under50: {
        '2017': { '1': 10.24, '2': 10.47, '3': 10.71, '4': 10.95 },
        '2018': { '1': 10.19, '2': 11.42, '3': 11.66, '4': 11.9 },
        '2019': { '1': 12.14, '2': 12.37, '3': 12.61, '4': 12.85 },
        '2020': { '1': 13.08, '2': 13.32, '3': 13.56, '4': 13.8 }
      },
      above50: {
        '2017': { '1': 42.95, '2': 43.90, '3': 44.80, '4': 45.80 },
        '2018': { '1': 46.75, '2': 47.70, '3': 48.65, '4': 49.60 },
        '2019': { '1': 50.55, '2': 51.50, '3': 52.45, '4': 53.40 },
        '2020': { '1': 54.35, '2': 55.30, '3': 56.25, '4': 57.20 }
      }
    },
    prepaid: {
      under50: {
        '2017': { '1': 3.67, '2': 3.84, '3': 4.01, '4': 4.18 },
        '2018': { '1': 4.36, '2': 4.53, '3': 4.70, '4': 4.87 },
        '2019': { '1': 5.04, '2': 5.21, '3': 5.38, '4': 5.50 },
        '2020': { '1': 5.72, '2': 5.89, '3': 6.07, '4': 6.24 }
      },
      above50: {
        '2017': { '1': 15.02, '2': 15.33, '3': 15.65, '4': 15.97 },
        '2018': { '1': 16.28, '2': 16.60, '3': 16.92, '4': 17.23 },
        '2019': { '1': 17.55, '2': 17.87, '3': 18.18, '4': 18.50 },
        '2020': { '1': 18.82, '2': 19.13, '3': 19.45, '4': 19.77 }
      }
    }
  },
  commercial: {
    postpaid: {
      '2017': { '1': 55.13, '2': 56.38, '3': 57.57, '4': 58.75 },
      '2018': { '1': 61.13, '2': 61.32, '3': 62.32, '4': 63.51 },
      '2019': { '1': 64.70, '2': 65.89, '3': 67.07, '4': 68.26 },
      '2020': { '1': 69.45, '2': 70.64, '3': 71.83, '4': 73.02 }
    },
    prepaid: {
      '2017': { '1': 19.31, '2': 19.71, '3': 20.12, '4': 20.53 },
      '2018': { '1': 20.94, '2': 21.34, '3': 21.75, '4': 22.16 },
      '2019': { '1': 22.57, '2': 22.97, '3': 23.38, '4': 23.79 },
      '2020': { '1': 24.19, '2': 24.60, '3': 25.01, '4': 25.42 }
    }
  }
};

const ETHIOPIAN_MONTHS = [
  { name: 'Meskerem', days: 30 },
  { name: 'Tikimt', days: 30 },
  { name: 'Hidar', days: 30 },
  { name: 'Tahsas', days: 30 },
  { name: 'Tir', days: 30 },
  { name: 'Yekatit', days: 30 },
  { name: 'Megabit', days: 30 },
  { name: 'Miazia', days: 30 },
  { name: 'Ginbot', days: 30 },
  { name: 'Sene', days: 30 },
  { name: 'Hamle', days: 30 },
  { name: 'Nehase', days: 30 },
  { name: 'Pagumen', days: 5 },
  { name: 'Custom / Standard Cycle', days: 30 }
];

export default function BillCalculator() {
  // Inputs state
  const [category, setCategory] = useState<'domestic' | 'commercial'>('domestic');
  const [connectionType, setConnectionType] = useState<'postpaid' | 'prepaid'>('postpaid');
  const [year, setYear] = useState<'2017' | '2018' | '2019' | '2020'>('2019');
  const [quarter, setQuarter] = useState<'1' | '2' | '3' | '4'>('1');
  const [ethiopianMonth, setEthiopianMonth] = useState<string>('Custom / Standard Cycle');
  const [billDays, setBillDays] = useState<number>(30);
  const [inputMode, setInputMode] = useState<'direct' | 'readings'>('direct');
  
  // Readings inputs
  const [prevReading, setPrevReading] = useState<string>('');
  const [currReading, setCurrReading] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [totalKwh, setTotalKwh] = useState<string>('');

  // Calculation method state (Domestic only)
  const [calcMethod, setCalcMethod] = useState<'progressive' | 'flat-tier'>('flat-tier');

  // Outputs state
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [actualKwh, setActualKwh] = useState<number>(0);
  const [normalizedKwh, setNormalizedKwh] = useState<number>(0);
  const [baseEnergyBill, setBaseEnergyBill] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [regulatoryFee, setRegulatoryFee] = useState<number>(0);
  const [vatTaxableAmount, setVatTaxableAmount] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [ebcFee, setEbcFee] = useState<number>(0);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [blockBreakdown, setBlockBreakdown] = useState<BlockCalculationRow[]>([]);

  // UI state
  const [showMatrixInfo, setShowMatrixInfo] = useState<boolean>(false);
  const [showBlockTable, setShowBlockTable] = useState<boolean>(false);

  // Auto-set billing days when month changes
  useEffect(() => {
    const selected = ETHIOPIAN_MONTHS.find(m => m.name === ethiopianMonth);
    if (selected && selected.name !== 'Custom / Standard Cycle') {
      setBillDays(selected.days);
    }
  }, [ethiopianMonth]);

  // Load specific customer example (150 kWh, 2018 Quarter 4)
  const loadCustomerExample = () => {
    setCategory('domestic');
    setConnectionType('postpaid');
    setYear('2018');
    setQuarter('4');
    setEthiopianMonth('Custom / Standard Cycle');
    setBillDays(30);
    setInputMode('direct');
    setTotalKwh('150');
    setCalcMethod('flat-tier');

    const kwh = 150;
    setActualKwh(kwh);
    setNormalizedKwh(kwh);

    const rates = TARIFFS.domestic['2018']['4'];
    const rate = rates[2]; // Block 3 rate (3.7163)
    const eCharge = kwh * rate; // 557.445

    const breakdown: BlockCalculationRow[] = [];
    const blockSizes = [50, 50, 100, 100, 100, 100, Infinity];
    const ranges = [
      '0 - 50 kWh',
      '51 - 100 kWh',
      '101 - 200 kWh',
      '201 - 300 kWh',
      '301 - 400 kWh',
      '401 - 500 kWh',
      'Above 500 kWh'
    ];

    for (let i = 0; i < rates.length; i++) {
      const isActive = i === 2; // Block 3
      breakdown.push({
        blockIndex: i + 1,
        blockName: `Block ${i + 1}`,
        rangeText: ranges[i] + (isActive ? ' [Active Tier]' : ''),
        originalSize: blockSizes[i],
        scaledSize: blockSizes[i],
        rate: rates[i],
        consumed: isActive ? kwh : 0,
        cost: isActive ? eCharge : 0
      });
    }

    setBaseEnergyBill(eCharge);
    setBlockBreakdown(breakdown);

    // Domestic PostPaid above 50 kWh in 2018 Quarter 4
    const rawSCharge = SERVICE_CHARGES.domestic.postpaid.above50['2018']['4'];
    setServiceCharge(rawSCharge);

    const rFee = (eCharge + rawSCharge) * 0.005;
    setRegulatoryFee(rFee);

    // EBC TV Fee = 10 Birr flat (for 150 kWh > 50)
    setEbcFee(10);

    // 150 kWh is ≤ 200 kWh exemption limit, so only service charge is subject to VAT
    const vatBase = rawSCharge;
    const vat = vatBase * 0.15;

    setVatTaxableAmount(vatBase);
    setVatAmount(vat);
    setTotalDue(eCharge + rawSCharge + rFee + vat + 10);
    setIsCalculated(true);
  };

  // Load specific customer example 2 (165 kWh, 22 Days, 2018 Quarter 4)
  const loadShortCycleExample = () => {
    setCategory('domestic');
    setConnectionType('postpaid');
    setYear('2018');
    setQuarter('4');
    setEthiopianMonth('Custom / Standard Cycle');
    setBillDays(22);
    setInputMode('direct');
    setTotalKwh('165');
    setCalcMethod('flat-tier');

    const kwh = 165;
    const days = 22;
    const prFactor = days / 30;
    setActualKwh(kwh);

    // Normalized: 165 kWh * 30 / 22 = 225 kWh
    const normKwh = kwh * (30 / days);
    setNormalizedKwh(normKwh);

    const rates = TARIFFS.domestic['2018']['4'];
    const rate = rates[3]; // Block 4 rate (5.6773)
    const eCharge = kwh * rate; // 936.7545

    const breakdown: BlockCalculationRow[] = [];
    const blockSizes = [50, 50, 100, 100, 100, 100, Infinity];
    const ranges = [
      '0 - 50 kWh',
      '51 - 100 kWh',
      '101 - 200 kWh',
      '201 - 300 kWh',
      '301 - 400 kWh',
      '401 - 500 kWh',
      'Above 500 kWh'
    ];

    for (let i = 0; i < rates.length; i++) {
      const isActive = i === 3; // Block 4 is active because normalized is 225 kWh
      breakdown.push({
        blockIndex: i + 1,
        blockName: `Block ${i + 1}`,
        rangeText: ranges[i] + (isActive ? ' [Active Tier]' : ''),
        originalSize: blockSizes[i],
        scaledSize: blockSizes[i] * prFactor,
        rate: rates[i],
        consumed: isActive ? kwh : 0,
        cost: isActive ? eCharge : 0
      });
    }

    setBaseEnergyBill(eCharge);
    setBlockBreakdown(breakdown);

    // Domestic PostPaid above 50 kWh in 2018 Quarter 4 (monthly raw is 48.65)
    const rawSCharge = SERVICE_CHARGES.domestic.postpaid.above50['2018']['4'];
    const sCharge = rawSCharge * prFactor; // 48.65 * 22 / 30 = 35.6767 Birr
    setServiceCharge(sCharge);

    const rFee = (eCharge + sCharge) * 0.005; // (936.7545 + 35.6767) * 0.005 = 4.8622 Birr
    setRegulatoryFee(rFee);

    // EBC TV Right fee = 10 * 22 / 30 = 7.3333 Birr
    const ebc = 10 * prFactor;
    setEbcFee(ebc);

    // VAT calculation: Exemption limit for 22 days is 200 * 22 / 30 = 146.6667 kWh
    const scaledExemptionAllowance = 200 * prFactor;
    // New Domestic VAT rule: if kwh > exemption allowance, VAT is (total Consumption * Tarif) * 15%
    const vatBase = kwh > scaledExemptionAllowance ? eCharge : sCharge;
    const vat = vatBase * 0.15;

    setVatTaxableAmount(vatBase);
    setVatAmount(vat);
    setTotalDue(eCharge + sCharge + rFee + vat + ebc);
    setIsCalculated(true);
  };

  // Handle direct calculation on inputs update
  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Determine total kWh used
    let kwh = 0;
    if (inputMode === 'direct') {
      kwh = parseFloat(totalKwh) || 0;
    } else {
      const prev = parseFloat(prevReading) || 0;
      const curr = parseFloat(currReading) || 0;
      kwh = Math.max(0, curr - prev) * multiplier;
    }

    setActualKwh(kwh);

    // Bill pro-rata factor
    const days = Math.max(1, billDays);
    const prFactor = days / 30;

    // Normalized 30-day equivalent consumption (important for selecting service charges and flat tier thresholds!)
    const normKwh = kwh * (30 / days);
    setNormalizedKwh(normKwh);

    let eCharge = 0;
    const breakdown: BlockCalculationRow[] = [];
    const blockSizes = [50, 50, 100, 100, 100, 100, Infinity];
    const ranges = [
      '0 - 50 kWh',
      '51 - 100 kWh',
      '101 - 200 kWh',
      '201 - 300 kWh',
      '301 - 400 kWh',
      '401 - 500 kWh',
      'Above 500 kWh'
    ];

    if (category === 'domestic') {
      const rates = TARIFFS.domestic[year][quarter];

      if (calcMethod === 'progressive') {
        // Progressive multi-tier blocks
        let remaining = kwh;
        // Scale block sizes based on days (pro-rata block widths!)
        const scaledBlockSizes = blockSizes.map(size => size === Infinity ? Infinity : size * prFactor);

        for (let i = 0; i < rates.length; i++) {
          const rate = rates[i];
          const maxBlockSize = scaledBlockSizes[i];
          const consumedInBlock = remaining > 0 ? Math.min(remaining, maxBlockSize) : 0;
          const costInBlock = consumedInBlock * rate;

          breakdown.push({
            blockIndex: i + 1,
            blockName: `Block ${i + 1}`,
            rangeText: ranges[i],
            originalSize: blockSizes[i],
            scaledSize: maxBlockSize,
            rate: rate,
            consumed: consumedInBlock,
            cost: costInBlock
          });

          eCharge += costInBlock;
          remaining -= consumedInBlock;
        }
      } else {
        // Flat-tier rate based on normalized 30-day consumption level (User custom example)
        let tierIndex = 0;
        if (normKwh > 500) tierIndex = 6;
        else if (normKwh > 400) tierIndex = 5;
        else if (normKwh > 300) tierIndex = 4;
        else if (normKwh > 200) tierIndex = 3;
        else if (normKwh > 100) tierIndex = 2;
        else if (normKwh > 50) tierIndex = 1;

        const rate = rates[tierIndex];
        eCharge = kwh * rate;

        // Generate visual block array reflecting the single active selected tier
        for (let i = 0; i < rates.length; i++) {
          const isActive = i === tierIndex;
          breakdown.push({
            blockIndex: i + 1,
            blockName: `Block ${i + 1}`,
            rangeText: ranges[i] + (isActive ? ' [Active Tier]' : ''),
            originalSize: blockSizes[i],
            scaledSize: blockSizes[i] * prFactor,
            rate: rates[i],
            consumed: isActive ? kwh : 0,
            cost: isActive ? eCharge : 0
          });
        }
      }
    } else {
      // Commercial Flat Rate
      const rate = TARIFFS.commercial[year][quarter];
      eCharge = kwh * rate;

      breakdown.push({
        blockIndex: 1,
        blockName: 'Commercial Flat Rate',
        rangeText: 'Flat consumption charge',
        originalSize: Infinity,
        scaledSize: Infinity,
        rate: rate,
        consumed: kwh,
        cost: eCharge
      });
    }

    setBaseEnergyBill(eCharge);
    setBlockBreakdown(breakdown);

    // Step 2: Service Charge (pro-rated by days / 30)
    let sCharge = 0;
    if (category === 'domestic') {
      const domesticSCharges = SERVICE_CHARGES.domestic[connectionType];
      // Lookup determined by whether normalized 30-day consumption is > 50 kWh
      const level = normKwh > 50 ? 'above50' : 'under50';
      const rawSCharge = domesticSCharges[level][year][quarter];
      sCharge = rawSCharge * prFactor;
    } else {
      const commSCharges = SERVICE_CHARGES.commercial[connectionType];
      const rawSCharge = commSCharges[year][quarter];
      sCharge = rawSCharge * prFactor;
    }
    setServiceCharge(sCharge);

    // Step 3: Regulatory Fee (0.5% of total consumption bill + service charge)
    const rFee = (eCharge + sCharge) * 0.005;
    setRegulatoryFee(rFee);

    // Step 4: VAT (15%)
    let vatBase = 0;
    let vat = 0;

    if (category === 'domestic') {
      // Domestic users get a 200 kWh exemption allowance on energy charge.
      // Pro-rate the 200 kWh allowance to the billing days!
      const scaledExemptionAllowance = 200 * prFactor;

      if (kwh > scaledExemptionAllowance) {
        // If consumption exceeds the pro-rated 200 kWh limit, VAT is 15% on the sum of the energy bill and the service charge: (Energy Bill + Service Charge) × 15%
        vatBase = eCharge + sCharge;
      } else {
        // Consumption is below or equal to the pro-rated 200 kWh exemption. VAT is 0.
        vatBase = 0;
      }
    } else {
      // Commercial: VAT is 15% on the entire sum of energy bill and service charge
      vatBase = eCharge + sCharge;
    }

    vatBase = Math.max(0, vatBase);
    vat = vatBase * 0.15;

    setVatTaxableAmount(vatBase);
    setVatAmount(vat);

    // Step 5: EBC TV Fee (applied ONLY to domestic customers if actual consumption exceeds 50 kWh, 10 Birr monthly pro-rated)
    let ebc = 0;
    if (category === 'domestic' && kwh > 50) {
      ebc = 10 * prFactor;
    }
    setEbcFee(ebc);

    // Step 6: Grand Total
    const grandTotal = eCharge + sCharge + rFee + vat + ebc;
    setTotalDue(grandTotal);

    setIsCalculated(true);
  };

  const handleReset = () => {
    setTotalKwh('');
    setPrevReading('');
    setCurrReading('');
    setEbcFee(0);
    setIsCalculated(false);
  };

  const activeTariffDomestic = TARIFFS.domestic[year][quarter];
  const activeTariffCommercial = TARIFFS.commercial[year][quarter];

  return (
    <div id="eeu-bill-calculator-root" className="max-w-7xl mx-auto space-y-6">
      
      {/* Expanded Reference Sheets / Rates Matrices */}
      {showMatrixInfo && (
        <div className="p-6 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/20 rounded-2xl space-y-4 animate-in slide-in-from-top-3 duration-200">
          <h2 className="text-sm font-bold text-[#5FA354] flex items-center gap-2">
            <Info className="w-4 h-4" />
            Active Sheet Reference: {year} Quarter {quarter} Tariff Rates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">Domestic Tiers (Birr/kWh)</h3>
              <div className="border border-gray-150 rounded-xl overflow-hidden text-xs bg-white dark:bg-gray-950 font-mono">
                <div className="grid grid-cols-2 bg-gray-50 p-2 border-b border-gray-150 font-bold">
                  <span>Consumption Range</span>
                  <span className="text-right">Tariff Rate</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-900">
                  <div className="grid grid-cols-2 p-2"><span>0 - 50 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[0].toFixed(4)} Birr</span></div>
                  <div className="grid grid-cols-2 p-2 bg-gray-50/40"><span>51 - 100 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[1].toFixed(4)} Birr</span></div>
                  <div className="grid grid-cols-2 p-2"><span>101 - 200 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[2].toFixed(4)} Birr</span></div>
                  <div className="grid grid-cols-2 p-2 bg-gray-50/40"><span>201 - 300 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[3].toFixed(4)} Birr</span></div>
                  <div className="grid grid-cols-2 p-2"><span>301 - 400 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[4].toFixed(4)} Birr</span></div>
                  <div className="grid grid-cols-2 p-2 bg-gray-50/40"><span>401 - 500 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[5].toFixed(4)} Birr</span></div>
                  <div className="grid grid-cols-2 p-2"><span>Above 500 kWh</span><span className="text-right font-bold text-gray-800">{activeTariffDomestic[6].toFixed(4)} Birr</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Commercial Rates (General flat rates)</h3>
                <div className="border border-gray-150 rounded-xl p-3 text-xs bg-white dark:bg-gray-950 font-mono flex items-center justify-between">
                  <span>Flat Consumption Tariff:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{activeTariffCommercial.toFixed(4)} Birr/kWh</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Quarterly Flat Service Charges (30-day equivalent)</h3>
                <div className="border border-gray-150 rounded-xl overflow-hidden text-xs bg-white dark:bg-gray-950 font-mono">
                  <div className="grid grid-cols-2 bg-gray-50 p-2 border-b border-gray-150 font-bold">
                    <span>Category & Level</span>
                    <span className="text-right">Service Charge</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-900">
                    <div className="grid grid-cols-2 p-2">
                      <span>Domestic PostPaid (≤ 50 kWh)</span>
                      <span className="text-right font-bold text-gray-800">{SERVICE_CHARGES.domestic.postpaid.under50[year][quarter].toFixed(2)} Birr</span>
                    </div>
                    <div className="grid grid-cols-2 p-2 bg-gray-50/40">
                      <span>Domestic PostPaid (&gt; 50 kWh)</span>
                      <span className="text-right font-bold text-gray-800">{SERVICE_CHARGES.domestic.postpaid.above50[year][quarter].toFixed(2)} Birr</span>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <span>Domestic PrePaid (≤ 50 kWh)</span>
                      <span className="text-right font-bold text-gray-800">{SERVICE_CHARGES.domestic.prepaid.under50[year][quarter].toFixed(2)} Birr</span>
                    </div>
                    <div className="grid grid-cols-2 p-2 bg-gray-50/40">
                      <span>Domestic PrePaid (&gt; 50 kWh)</span>
                      <span className="text-right font-bold text-gray-800">{SERVICE_CHARGES.domestic.prepaid.above50[year][quarter].toFixed(2)} Birr</span>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <span>Commercial PostPaid</span>
                      <span className="text-right font-bold text-gray-800">{SERVICE_CHARGES.commercial.postpaid[year][quarter].toFixed(2)} Birr</span>
                    </div>
                    <div className="grid grid-cols-2 p-2 bg-gray-50/40">
                      <span>Commercial PrePaid</span>
                      <span className="text-right font-bold text-gray-800">{SERVICE_CHARGES.commercial.prepaid[year][quarter].toFixed(2)} Birr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Form Inputs */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border-none rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-150/80 dark:border-zinc-900 bg-gray-50/40 dark:bg-zinc-900/10 flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-850 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-sans">
              <Receipt className="w-4 h-4 text-[#5FA354]" />
              Bill Parameters
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMatrixInfo(!showMatrixInfo)}
                className="text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-[#5FA354] dark:hover:text-emerald-400 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {showMatrixInfo ? 'Hide Rates' : 'Tariff Rates'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-gray-500 hover:text-red-500 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Form
              </button>
            </div>
          </div>

          <form onSubmit={handleCalculate} className="p-6 space-y-5">
            {/* Customer Category Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                Customer Category
              </label>
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl relative">
                <button
                  type="button"
                  onClick={() => setCategory('domestic')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    category === 'domestic'
                      ? 'bg-[#078930] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  <span>Domestic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('commercial')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    category === 'commercial'
                      ? 'bg-[#078930] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Commercial</span>
                </button>
              </div>
            </div>

            {/* Connection Type Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                Connection Type
              </label>
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl relative">
                <button
                  type="button"
                  onClick={() => setConnectionType('postpaid')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    connectionType === 'postpaid'
                      ? 'bg-[#078930] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>PostPaid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionType('prepaid')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    connectionType === 'prepaid'
                      ? 'bg-[#078930] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>PrePaid</span>
                </button>
              </div>
            </div>

            {/* Year & Quarter Matrix Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                  Tariff Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer transition-all"
                >
                  <option value="2017">2017 Year Matrix</option>
                  <option value="2018">2018 Year Matrix</option>
                  <option value="2019">2019 Year Matrix</option>
                  <option value="2020">2020 Year Matrix</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                  Quarter Period
                </label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value as any)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer transition-all"
                >
                  <option value="1">Quarter 1 (Hamle - Meskerem)</option>
                  <option value="2">Quarter 2 (Tikimt - Tahsas)</option>
                  <option value="3">Quarter 3 (Tir - Megabit)</option>
                  <option value="4">Quarter 4 (Miazia - Sene)</option>
                </select>
              </div>
            </div>

            {/* Ethiopian Month Helpers & Billing Days Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                  Ethiopian Month
                </label>
                <select
                  value={ethiopianMonth}
                  onChange={(e) => setEthiopianMonth(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer transition-all"
                >
                  {ETHIOPIAN_MONTHS.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.name !== 'Custom / Standard Cycle' ? `(${m.days} days)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                  Billing Cycle Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={billDays}
                  onChange={(e) => {
                    setBillDays(Math.max(1, parseInt(e.target.value) || 30));
                    setEthiopianMonth('Custom / Standard Cycle');
                  }}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Consumption Input Mode Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                Consumption Input Mode
              </label>
              <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl relative">
                <button
                  type="button"
                  onClick={() => setInputMode('direct')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    inputMode === 'direct'
                      ? 'bg-[#078930] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Total kWh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('readings')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    inputMode === 'readings'
                      ? 'bg-[#078930] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5 shrink-0" />
                  <span>Meter Readings</span>
                </button>
              </div>
            </div>

            {/* Main Consumption input fields */}
            {inputMode === 'direct' ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 font-sans">
                  Total Consumption
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={totalKwh}
                    onChange={(e) => setTotalKwh(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm font-semibold p-2.5 pr-14 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 absolute right-4 pointer-events-none select-none">kWh</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-gray-50/50 dark:bg-zinc-900/10 p-4 rounded-2xl border border-gray-150/60 dark:border-zinc-850">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 font-sans">
                      Previous Reading
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={prevReading}
                      onChange={(e) => setPrevReading(e.target.value)}
                      placeholder="e.g. 1240"
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 font-sans">
                      Current Reading
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={currReading}
                      onChange={(e) => setCurrReading(e.target.value)}
                      placeholder="e.g. 1405"
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 font-sans">
                    Multiplier Factor
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-2 leading-relaxed">
                    Typically 1 for domestic, higher for high-capacity meters.
                  </span>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              className="w-full bg-[#078930] hover:bg-[#067227] text-white py-3 px-4 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs hover:shadow-md active:scale-[0.98] font-sans"
            >
              <Calculator className="w-4 h-4" />
              Calculate
            </button>
          </form>
        </div>

        {/* Right Column - Results, Audit Summary and Math Breakdowns */}
        <div className="lg:col-span-7 space-y-6">
          {!isCalculated ? (
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#5FA354] flex items-center justify-center border border-emerald-100">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Waiting Input</h3>
              </div>
              <div className="pt-2 text-xs text-gray-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-eeu-green" /> Only Domestic & Commercial categories supported.
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Primary Results Panel with modern SaaS layout */}
              <div className="bg-white dark:bg-zinc-950 border border-gray-150 dark:border-zinc-900 rounded-2xl shadow-xs overflow-hidden">
                {/* Large clear total display */}
                <div className="p-8 text-center sm:text-left border-b border-gray-100 dark:border-zinc-900/50">
                  <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Total Audited Charge
                  </span>
                  <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-1.5 font-sans">
                    {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-bold text-gray-500">ETB</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-2">
                    Based on {actualKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh consumed in a {billDays} Days billing cycle
                  </p>
                </div>

                {/* 4-column micro-metric grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900/50">
                  <div className="p-5 text-center sm:text-left">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Actual Consumption</span>
                    <span className="text-base font-bold text-gray-800 dark:text-zinc-200 mt-1 block font-sans">{actualKwh.toFixed(1)} kWh</span>
                  </div>
                  <div className="p-5 text-center sm:text-left">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">30-Day Normalized</span>
                    <span className="text-base font-bold text-gray-800 dark:text-zinc-200 mt-1 block font-sans">{normalizedKwh.toFixed(1)} kWh</span>
                  </div>
                  <div className="p-5 text-center sm:text-left">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Service Charge</span>
                    <span className="text-base font-bold text-gray-800 dark:text-zinc-200 mt-1 block font-sans">{serviceCharge.toFixed(2)} ETB</span>
                  </div>
                  <div className="p-5 text-center sm:text-left">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Other Fees & Taxes</span>
                    <span className="text-base font-bold text-gray-800 dark:text-zinc-200 mt-1 block font-sans">{(regulatoryFee + vatAmount + ebcFee).toFixed(2)} ETB</span>
                  </div>
                </div>

                {/* Perfectly aligned itemized cost table */}
                <div className="p-6 bg-white dark:bg-zinc-950">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    Itemized Cost Breakdown
                  </h3>

                  <div className="border border-gray-200/60 dark:border-zinc-850/60 rounded-xl overflow-hidden text-xs font-sans">
                    <div className="grid grid-cols-2 bg-gray-50/50 dark:bg-zinc-900/30 p-3.5 border-b border-gray-150/60 dark:border-zinc-850/60 font-semibold text-gray-500 dark:text-zinc-400">
                      <span>Invoice Item Description</span>
                      <span className="text-right">Charge Amount</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-900 text-gray-700 dark:text-zinc-300">
                      <div className="grid grid-cols-2 p-3.5">
                        <span className="font-medium">Energy Consumption Cost</span>
                        <span className="text-right font-semibold text-gray-950 dark:text-white">{baseEnergyBill.toFixed(2)} ETB</span>
                      </div>
                      <div className="grid grid-cols-2 p-3.5 bg-gray-50/20 dark:bg-zinc-900/10">
                        <span className="font-medium">Service Charge</span>
                        <span className="text-right font-semibold text-gray-950 dark:text-white">{serviceCharge.toFixed(2)} ETB</span>
                      </div>
                      <div className="grid grid-cols-2 p-3.5">
                        <span className="font-medium">Regulatory Fee (0.5%)</span>
                        <span className="text-right font-semibold text-gray-950 dark:text-white">{regulatoryFee.toFixed(2)} ETB</span>
                      </div>
                      <div className="grid grid-cols-2 p-3.5 bg-gray-50/20 dark:bg-zinc-900/10">
                        <span className="font-medium">Value Added Tax (15%)</span>
                        <span className="text-right font-semibold text-gray-950 dark:text-white">{vatAmount.toFixed(2)} ETB</span>
                      </div>
                      <div className="grid grid-cols-2 p-3.5">
                        <span className="font-medium">EBC TV Right Fee</span>
                        <span className="text-right font-semibold text-gray-950 dark:text-white">{ebcFee.toFixed(2)} ETB</span>
                      </div>
                      {/* Distinct bold total row with soft, professional accent background */}
                      <div className="grid grid-cols-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold text-emerald-900 dark:text-emerald-300 border-t border-emerald-150/60 dark:border-emerald-900/30 text-[15px]">
                        <span>Total Due Billing Amount</span>
                        <span className="text-right font-extrabold">{totalDue.toFixed(2)} ETB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-step explanation formulas container */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-450 dark:text-zinc-500" />
                  Mathematical Audit & Formulas Applied
                </h3>

                {/* STEP 1: Energy Consumption */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px]">1</div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Energy Consumption Bill</h4>
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {baseEnergyBill.toFixed(2)} ETB
                    </span>
                  </div>

                  {/* Clean key-value pairs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-slate-100/50 dark:border-zinc-900/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Usage</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{actualKwh.toFixed(2)} kWh</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Billing Period</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{billDays} Days</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Rate Matrix</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{category === 'domestic' ? 'Domestic (Tiered)' : 'Commercial (Flat)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Calculation</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{calcMethod === 'progressive' ? 'Progressive' : 'Flat Tier'}</span>
                    </div>
                  </div>

                  {/* Discreet View calculation details expandable details tag */}
                  <details className="group border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-180 text-slate-400" />
                        View calculation details
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-600 dark:text-zinc-400 space-y-3 border-t border-slate-100/50 dark:border-zinc-900/50">
                      {billDays !== 30 && (
                        <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 rounded-lg text-blue-700 dark:text-blue-300 border border-blue-100/30 space-y-1">
                          <p className="font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            Pro-Rata Cycle Normalization:
                          </p>
                          <p className="font-mono text-[10px]">
                            Normalized: {actualKwh.toFixed(2)} kWh × (30 / {billDays}) = {normalizedKwh.toFixed(2)} kWh
                          </p>
                          <p className="opacity-90 text-[10.5px]">
                            This normalized equivalent determines block tier thresholds and service charges for a 30-day equivalent, then scaled by {(billDays/30).toFixed(4)} to match your {billDays}-day cycle.
                          </p>
                        </div>
                      )}

                      {category === 'domestic' ? (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                              {calcMethod === 'progressive' ? (
                                <span>
                                  <strong>Progressive Block:</strong> Splits consumption into scaled blocks. Each block is charged its respective tariff rate.
                                </span>
                              ) : (
                                <span>
                                  <strong>Flat-Tier Selected Rate:</strong> Because normalized consumption is {normalizedKwh.toFixed(1)} kWh, the entire actual consumption is charged at the selected block rate.
                                </span>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowBlockTable(!showBlockTable)}
                              className="text-[10px] font-bold text-slate-500 hover:text-neutral-800 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded-lg shrink-0 cursor-pointer flex items-center gap-1 transition-all"
                            >
                              {showBlockTable ? 'Hide Block Table' : 'Show Block Table'}
                            </button>
                          </div>

                          {showBlockTable && (
                            <div className="border border-slate-150 dark:border-zinc-800 rounded-xl overflow-hidden text-[11px] bg-white dark:bg-zinc-900">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-150 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-bold font-sans">
                                    <th className="p-2 pl-3">Block Range</th>
                                    <th className="p-2 text-right">Scaled Limit</th>
                                    <th className="p-2 text-right">Tariff (Birr)</th>
                                    <th className="p-2 text-right">Consumed</th>
                                    <th className="p-2 text-right pr-3">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono text-[10.5px]">
                                  {blockBreakdown.map((block) => {
                                    const isActive = block.consumed > 0;
                                    return (
                                      <tr 
                                        key={block.blockName}
                                        className={isActive ? 'bg-slate-50/50 dark:bg-zinc-900/30 font-bold text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-600'}
                                      >
                                        <td className="p-2 pl-3 font-sans">{block.blockName} ({block.rangeText})</td>
                                        <td className="p-2 text-right font-sans">
                                          {block.scaledSize === Infinity ? 'Unlimited' : `${block.scaledSize.toFixed(1)} kWh`}
                                        </td>
                                        <td className="p-2 text-right">{block.rate.toFixed(4)}</td>
                                        <td className="p-2 text-right">{block.consumed.toFixed(2)}</td>
                                        <td className="p-2 text-right pr-3">{block.cost.toFixed(2)} ETB</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[10.5px] font-sans space-y-1">
                            <div className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[9px] mb-1">
                              Energy Summation Math
                            </div>
                            {calcMethod === 'progressive' ? (
                              <>
                                <div>Energy Bill = Sum of (Consumed in Block × Rate)</div>
                                <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px] break-all">
                                  = {blockBreakdown.filter(b => b.consumed > 0).map(b => `(${b.consumed.toFixed(2)} × ${b.rate.toFixed(4)})`).join(' + ')}
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  = {baseEnergyBill.toFixed(2)} ETB
                                </div>
                              </>
                            ) : (
                              <>
                                <div>Energy Bill = Total Actual kWh × Selected Tier Rate</div>
                                <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                                  = {actualKwh.toFixed(2)} kWh × {blockBreakdown.find(b => b.consumed > 0)?.rate.toFixed(4)} Birr
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  = {baseEnergyBill.toFixed(2)} ETB
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[10.5px] font-sans space-y-1">
                          <div className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[9px] mb-1">
                            Commercial Energy Math
                          </div>
                          <div>Energy Bill = Total Actual kWh × Commercial Rate</div>
                          <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                            = {actualKwh.toFixed(2)} kWh × {activeTariffCommercial.toFixed(4)} Birr
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            = {baseEnergyBill.toFixed(2)} ETB
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                {/* STEP 2: Service Charge */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px]">2</div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Fixed Service Charge</h4>
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {serviceCharge.toFixed(2)} ETB
                    </span>
                  </div>

                  {/* Clean key-value pairs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-slate-100/50 dark:border-zinc-900/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Base Monthly Rate</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200 font-sans">
                        {category === 'domestic' 
                          ? `${SERVICE_CHARGES.domestic[connectionType][normalizedKwh > 50 ? 'above50' : 'under50'][year][quarter].toFixed(2)} ETB` 
                          : `${SERVICE_CHARGES.commercial[connectionType][year][quarter].toFixed(2)} ETB`
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Category</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{category === 'domestic' ? 'Domestic' : 'Commercial'} ({connectionType})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Pro-rata Period</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{billDays} / 30 Days</span>
                    </div>
                  </div>

                  {/* Discreet details */}
                  <details className="group border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-180 text-slate-400" />
                        View calculation details
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-600 dark:text-zinc-400 space-y-3 border-t border-slate-100/50 dark:border-zinc-900/50">
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                        The service charge is determined based on customer category, connection payment mode, and billing cycle. It is pro-rated dynamically for non-standard 30-day periods.
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[10.5px] font-sans space-y-1">
                        <div className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[9px] mb-1">
                          Service Charge Pro-rating Math
                        </div>
                        {category === 'domestic' ? (
                          <>
                            <div>Domestic Rate Type: {normalizedKwh > 50 ? 'Above 50 kWh (> 50)' : 'Up to 50 kWh (≤ 50)'}</div>
                            <div>Pro-rated Charge = Monthly Rate × (Days / 30)</div>
                            <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                              = {SERVICE_CHARGES.domestic[connectionType][normalizedKwh > 50 ? 'above50' : 'under50'][year][quarter].toFixed(2)} × ({billDays} / 30)
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              = {serviceCharge.toFixed(2)} ETB
                            </div>
                          </>
                        ) : (
                          <>
                            <div>Commercial Flat Rate = {SERVICE_CHARGES.commercial[connectionType][year][quarter].toFixed(2)} ETB</div>
                            <div>Pro-rated Charge = Monthly Rate × (Days / 30)</div>
                            <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                              = {SERVICE_CHARGES.commercial[connectionType][year][quarter].toFixed(2)} × ({billDays} / 30)
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              = {serviceCharge.toFixed(2)} ETB
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </details>
                </div>

                {/* STEP 3: Regulatory Fees */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px]">3</div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-sans">Regulatory Fees</h4>
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                      {regulatoryFee.toFixed(2)} ETB
                    </span>
                  </div>

                  {/* Clean key-value pairs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-slate-100/50 dark:border-zinc-900/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Regulatory Rate</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">0.5%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Taxable Base</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{(baseEnergyBill + serviceCharge).toFixed(2)} ETB</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Calculation Formula</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">(Energy Bill + Service Charge) × 0.5%</span>
                    </div>
                  </div>

                  {/* Discreet details */}
                  <details className="group border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-180 text-slate-400" />
                        View calculation details
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-600 dark:text-zinc-400 space-y-3 border-t border-slate-100/50 dark:border-zinc-900/50">
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        <strong>Regulatory Fee (0.5%):</strong> Flat regulatory support levy applied dynamically to the combined amount of the energy consumption charge and the fixed monthly service charge.
                      </p>

                      <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[10.5px] font-sans space-y-3">
                        <div>
                          <div className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[9px] mb-1">
                            Regulatory Levy Math
                          </div>
                          <div>Regulatory Fee = (Energy Bill + Service Charge) × 0.5%</div>
                          <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                            = ({baseEnergyBill.toFixed(2)} + {serviceCharge.toFixed(2)}) × 0.005
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            = {regulatoryFee.toFixed(2)} ETB
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* STEP 4: Value Added Tax (VAT) */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px]">4</div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-sans">Value Added Tax (VAT)</h4>
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                      {vatAmount.toFixed(2)} ETB
                    </span>
                  </div>

                  {/* Clean key-value pairs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-slate-100/50 dark:border-zinc-900/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">VAT Rate</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">15%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Taxable Base</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">{vatTaxableAmount.toFixed(2)} ETB</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">VAT Exemption</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">
                        {category === 'domestic' ? `${(200 * (billDays / 30)).toFixed(1)} kWh` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">VAT Status</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">
                        {category === 'domestic' && actualKwh <= 200 * (billDays / 30) ? 'Fully Exempt (0 ETB)' : 'Fully Taxable'}
                      </span>
                    </div>
                  </div>

                  {/* Discreet details */}
                  <details className="group border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-180 text-slate-400" />
                        View calculation details
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-600 dark:text-zinc-400 space-y-3 border-t border-slate-100/50 dark:border-zinc-900/50">
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        <strong>VAT (15%):</strong> Standard value-added tax rate. 
                        For Commercial accounts, VAT is fully applicable on both the energy bill and the service charge.
                        For Domestic accounts, both energy charges and service charges are fully exempt from VAT if actual consumption is less than or equal to 200 kWh (scaled pro-rata based on billing cycle days).
                      </p>

                      <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[10.5px] font-sans space-y-3">
                        <div className="pt-2">
                          <div className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[9px] mb-1">
                            VAT Calculation Math
                          </div>
                          {category === 'domestic' ? (
                            <>
                              <div>Exemption threshold for {billDays} Days = 200 kWh × ({billDays} / 30) = {(200 * (billDays/30)).toFixed(2)} kWh</div>
                              {actualKwh <= 200 * (billDays/30) ? (
                                <>
                                  <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                                    Usage ({actualKwh.toFixed(1)} kWh) ≤ {(200 * (billDays/30)).toFixed(1)} kWh. Exemption Active!
                                  </div>
                                  <div>Taxable Base = 0.00 ETB (Fully Exempt)</div>
                                  <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                                    VAT = 0.00 × 15%
                                  </div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    = 0.00 ETB
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                                    Usage ({actualKwh.toFixed(1)} kWh) &gt; {(200 * (billDays/30)).toFixed(1)} kWh limit. Exemption Removed!
                                  </div>
                                  <div>Taxable Base = Energy Bill + Service Charge = {(baseEnergyBill + serviceCharge).toFixed(2)} ETB</div>
                                  <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                                    VAT = (Energy Bill + Service Charge) × 15% = ({baseEnergyBill.toFixed(2)} + {serviceCharge.toFixed(2)}) × 15%
                                  </div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    = {vatAmount.toFixed(2)} ETB
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <div>Taxable Base = Energy Bill + Service Charge = {vatTaxableAmount.toFixed(2)} ETB</div>
                              <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                                VAT = {vatTaxableAmount.toFixed(2)} × 15%
                              </div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                = {vatAmount.toFixed(2)} ETB
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* STEP 5: Broadcasting Service Fee */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px]">5</div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Broadcasting Service Fee</h4>
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {ebcFee.toFixed(2)} ETB
                    </span>
                  </div>

                  {/* Clean key-value pairs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-slate-100/50 dark:border-zinc-900/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">EBC TV Fee Rate</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">
                        {category === 'domestic' ? '10.00 ETB / month' : '0.00 ETB (N/A)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Customer Category</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">
                        {category === 'domestic' ? 'Domestic' : 'Commercial (Exempt)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Status</span>
                      <span className="font-bold text-neutral-800 dark:text-zinc-200">
                        {category !== 'domestic' ? 'Exempt (Domestic Only)' : actualKwh <= 50 ? 'Exempted (≤ 50 kWh)' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Discreet details */}
                  <details className="group border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-180 text-slate-400" />
                        View calculation details
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1.5 text-[11px] text-slate-600 dark:text-zinc-400 space-y-3 border-t border-slate-100/50 dark:border-zinc-900/50">
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                        The broadcasting support fee (10.00 Birr per month pro-rated) applies strictly to Domestic customers exceeding 50 kWh. Commercial and non-domestic customer categories are exempt from EBC TV fees.
                      </p>

                      <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-[10.5px] font-sans space-y-1">
                        <div className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[9px] mb-1">
                          EBC TV Right Levy Math
                        </div>
                        {category !== 'domestic' ? (
                          <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                            Commercial Customer: EBC Broadcasting Fee applies only to domestic customers. EBC Fee = 0.00 ETB
                          </div>
                        ) : actualKwh <= 50 ? (
                          <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                            Domestic Consumption ({actualKwh.toFixed(1)} kWh) ≤ 50 kWh limit. Fully Exempted!
                          </div>
                        ) : (
                          <>
                            <div>EBC Fee = 10.00 Birr × (Bill Days / 30)</div>
                            <div className="text-slate-450 dark:text-zinc-500 font-mono text-[10px]">
                              = 10.00 × ({billDays} / 30)
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              = {ebcFee.toFixed(2)} ETB
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </details>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
