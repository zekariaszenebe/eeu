import React, { useState } from 'react';
import { 
  Gauge, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Zap, 
  Receipt, 
  Info, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  CreditCard,
  History,
  Calculator,
  Home,
  Building2
} from 'lucide-react';

// 2017 - 2020 EEU Tariff Matrices (Domestic)
const DOMESTIC_TARIFFS = {
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
};

// 2017 - 2020 EEU Tariff Matrices (Commercial)
const COMMERCIAL_TARIFFS = {
  '2017': { '1': 2.6057, '2': 3.0874, '3': 3.5691, '4': 4.0507 },
  '2018': { '1': 4.5324, '2': 5.0141, '3': 5.4958, '4': 5.9775 },
  '2019': { '1': 6.4592, '2': 6.9409, '3': 7.4225, '4': 7.9042 },
  '2020': { '1': 8.3859, '2': 8.8676, '3': 9.3493, '4': 9.8310 }
};

const PREPAID_SERVICE_CHARGES = {
  domestic: {
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
  },
  commercial: {
    '2017': { '1': 19.31, '2': 19.71, '3': 20.12, '4': 20.53 },
    '2018': { '1': 20.94, '2': 21.34, '3': 21.75, '4': 22.16 },
    '2019': { '1': 22.57, '2': 22.97, '3': 23.38, '4': 23.79 },
    '2020': { '1': 24.19, '2': 24.60, '3': 25.01, '4': 25.42 }
  }
};

const TIER_RANGES = [
  '0 – 50 kWh',
  '51 – 100 kWh',
  '101 – 200 kWh',
  '201 – 300 kWh',
  '301 – 400 kWh',
  '401 – 500 kWh',
  'Above 500 kWh'
];

interface TopUpStep {
  id: string;
  stepNumber: number;
  label: string;
  kwh: number;
}

export default function SmartMeterCalculator() {
  const [category, setCategory] = useState<'domestic' | 'commercial'>('domestic');
  const [year, setYear] = useState<'2017' | '2018' | '2019' | '2020'>('2019');
  const [quarter, setQuarter] = useState<'1' | '2' | '3' | '4'>('1');
  
  // Top-up sessions list
  const [topUpSteps, setTopUpSteps] = useState<TopUpStep[]>([
    { id: '1', stepNumber: 1, label: '1st Top-Up', kwh: 0 }
  ]);

  const [newKwhInput, setNewKwhInput] = useState<string>('');
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // Active tariff array based on selected year & quarter
  const currentRates = DOMESTIC_TARIFFS[year][quarter];
  const currentCommercialRate = COMMERCIAL_TARIFFS[year][quarter];

  // Helper to get block tier index from cumulative kWh
  const getTierIndex = (cumulativeKwh: number): number => {
    if (cumulativeKwh > 500) return 6;
    if (cumulativeKwh > 400) return 5;
    if (cumulativeKwh > 300) return 4;
    if (cumulativeKwh > 200) return 3;
    if (cumulativeKwh > 100) return 2;
    if (cumulativeKwh > 50) return 1;
    return 0;
  };

  // Compute multi-step progressive/incremental smart meter top-up results
  let accumulatedKwh = 0;
  let previousCumulativeTotalCost = 0;

  const calculatedSteps = topUpSteps.map((step, idx) => {
    const kwhAdded = Math.max(0, step.kwh);
    const cumulativeKwh = accumulatedKwh + kwhAdded;
    
    let tierIdx = 0;
    let tierRange = '';
    let rate = 0;
    let energyCharge = 0;
    let serviceCharge = 0;
    let ebcFee = 0;
    let vatBase = 0;

    if (category === 'domestic') {
      tierIdx = getTierIndex(cumulativeKwh);
      tierRange = TIER_RANGES[tierIdx];
      rate = currentRates[tierIdx];
      energyCharge = cumulativeKwh * rate;

      const level = cumulativeKwh > 50 ? 'above50' : 'under50';
      serviceCharge = cumulativeKwh > 0 ? PREPAID_SERVICE_CHARGES.domestic[level][year][quarter] : 0;
      ebcFee = cumulativeKwh > 50 ? 10.00 : 0.00;
      vatBase = cumulativeKwh > 200 ? (energyCharge + serviceCharge) : 0;
    } else {
      tierIdx = 0;
      tierRange = 'Commercial Flat Rate';
      rate = currentCommercialRate;
      energyCharge = cumulativeKwh * rate;

      serviceCharge = cumulativeKwh > 0 ? PREPAID_SERVICE_CHARGES.commercial[year][quarter] : 0;
      ebcFee = 0.00; // Commercial exempt
      vatBase = cumulativeKwh > 0 ? (energyCharge + serviceCharge) : 0;
    }

    // 4. Regulatory Fee (0.5% of Energy Charge + Service Charge, applies when cumulativeKwh > 0)
    const regulatoryFee = cumulativeKwh > 0 ? (energyCharge + serviceCharge) * 0.005 : 0;

    // 5. VAT (15%)
    const vatAmount = vatBase * 0.15;

    // 6. Cumulative Total Cost for cumulativeKwh
    const cumulativeTotalCost = cumulativeKwh > 0 ? (energyCharge + serviceCharge + ebcFee + regulatoryFee + vatAmount) : 0;

    // 7. Net amount customer pays in this specific top-up session
    const customerPaysNow = Math.max(0, cumulativeTotalCost - previousCumulativeTotalCost);

    const stepResult = {
      ...step,
      stepNumber: idx + 1,
      kwhAdded,
      previousKwh: accumulatedKwh,
      cumulativeKwh,
      tierIdx,
      tierRange,
      rate,
      energyCharge,
      serviceCharge,
      ebcFee,
      regulatoryFee,
      vatBase,
      vatAmount,
      cumulativeTotalCost,
      previousCumulativeTotalCost,
      customerPaysNow
    };

    // Update accumulators for next iteration
    accumulatedKwh = cumulativeKwh;
    previousCumulativeTotalCost = cumulativeTotalCost;

    return stepResult;
  });

  const totalKwhPurchased = accumulatedKwh;
  const totalPaidMonth = previousCumulativeTotalCost;

  // Add new top-up step
  const handleAddTopUp = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const parsed = parseFloat(newKwhInput);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed;

    setTopUpSteps(prev => {
      // If there is an existing step with 0 kWh (e.g., initial 1st step), update it instead of adding a new step
      const zeroIdx = prev.findIndex(s => s.kwh === 0);
      if (zeroIdx !== -1) {
        const updated = [...prev];
        updated[zeroIdx] = { ...updated[zeroIdx], kwh: val };
        return updated;
      }

      const nextNumber = prev.length + 1;
      const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      const label = `${ordinals[nextNumber - 1] || `${nextNumber}th`} Top-Up`;

      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          stepNumber: nextNumber,
          label,
          kwh: val
        }
      ];
    });
    setNewKwhInput('');
  };

  // Quick add helper
  const handleQuickAdd = (kwhVal: number) => {
    const nextNumber = topUpSteps.length + 1;
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const label = `${ordinals[nextNumber - 1] || `${nextNumber}th`} Top-Up`;

    setTopUpSteps(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        stepNumber: nextNumber,
        label,
        kwh: kwhVal
      }
    ]);
  };

  // Remove top-up step
  const handleRemoveStep = (id: string) => {
    if (topUpSteps.length <= 1) return;
    setTopUpSteps(prev => prev.filter(s => s.id !== id));
  };

  // Update step kWh
  const handleUpdateStepKwh = (id: string, newKwh: number) => {
    setTopUpSteps(prev => prev.map(s => s.id === id ? { ...s, kwh: Math.max(0, newKwh) } : s));
  };

  // Reset to prompt example scenario (50 + 50 + 50 kWh, 2018 Q3)
  const handleLoadExampleScenario = () => {
    setYear('2018');
    setQuarter('3');
    setTopUpSteps([
      { id: '1', stepNumber: 1, label: '1st Top-Up', kwh: 50 },
      { id: '2', stepNumber: 2, label: '2nd Top-Up', kwh: 50 },
      { id: '3', stepNumber: 3, label: '3rd Top-Up', kwh: 50 }
    ]);
    setNewKwhInput('50');
  };

  return (
    <div id="smart-meter-calculator-root" className="max-w-7xl mx-auto space-y-6">
      
      {/* Main Grid: Inputs & Sequence on Left, Digital LCD Meter & Audit Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Top-Up Sessions Entry, Controls & Tariff Reference */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tariff Settings & Add Top-Up Card */}
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl shadow-xs overflow-hidden">
            <div className="h-[58px] px-4 border-b border-gray-150 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/20 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-sans">
                <Gauge className="w-4 h-4 text-[#5FA354] dark:text-emerald-400" />
                Tariff Period & Top-Ups
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTopUpSteps([{ id: '1', stepNumber: 1, label: '1st Top-Up', kwh: 0 }]);
                    setNewKwhInput('');
                  }}
                  className="text-xs text-gray-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer font-sans transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Customer Category & Tariff Period Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 font-sans">
                  Customer Category
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCategory('domestic')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      category === 'domestic'
                        ? 'bg-[#078930] text-white shadow-xs'
                        : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    <span>Domestic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('commercial')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      category === 'commercial'
                        ? 'bg-[#078930] text-white shadow-xs'
                        : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Commercial</span>
                  </button>
                </div>
              </div>

              {/* Year & Quarter Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 font-sans">
                    Tariff Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="2017">2017 Year Matrix</option>
                    <option value="2018">2018 Year Matrix</option>
                    <option value="2019">2019 Year Matrix</option>
                    <option value="2020">2020 Year Matrix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 font-sans">
                    Quarter Period
                  </label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="1">Quarter 1 (Hamle - Meskerem)</option>
                    <option value="2">Quarter 2 (Tikimt - Tahsas)</option>
                    <option value="3">Quarter 3 (Tir - Megabit)</option>
                    <option value="4">Quarter 4 (Miazia - Sene)</option>
                  </select>
                </div>
              </div>

              {/* Add Top-Up Input Form */}
              <form onSubmit={handleAddTopUp} className="space-y-3 pt-2 border-t border-gray-150 dark:border-zinc-900">
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-300 font-sans">
                  Add Incremental Top-Up (kWh)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newKwhInput}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                          setNewKwhInput(val.replace(/^0+/, ''));
                        } else {
                          setNewKwhInput(val);
                        }
                      }}
                      placeholder="Enter kWh"
                      className="w-full text-sm font-bold p-2.5 pr-12 rounded-xl border border-gray-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-gray-400 absolute right-3.5 top-3 pointer-events-none">kWh</span>
                  </div>
                  <button
                    id="add-topup-step-btn"
                    type="button"
                    onClick={handleAddTopUp}
                    className="bg-[#078930] hover:bg-[#067227] active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Step
                  </button>
                </div>


              </form>

              {/* Dynamic Top-Up Steps List */}
              <div className="space-y-3 pt-3 border-t border-gray-150 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 font-sans uppercase tracking-wider">
                    Monthly Top-Up Sequence ({topUpSteps.length})
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">
                    Total: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{totalKwhPurchased} kWh</strong>
                  </span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {topUpSteps.map((step, idx) => {
                    const stepCalc = calculatedSteps[idx];
                    return (
                      <div
                        key={step.id}
                        className="p-3 bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-200/80 dark:border-zinc-850 rounded-xl flex items-center justify-between gap-3 transition-all hover:border-emerald-500/30"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate font-sans">
                              {step.label}
                            </div>
                            <div className="text-[10.5px] text-gray-500 dark:text-zinc-400 font-sans">
                              Cum: <span className="font-mono font-semibold text-gray-700 dark:text-zinc-300">{stepCalc?.cumulativeKwh} kWh</span> ({stepCalc?.tierRange})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                            <input
                              type="number"
                              min="0"
                              value={step.kwh === 0 ? '' : step.kwh}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = parseFloat(raw);
                                handleUpdateStepKwh(step.id, isNaN(parsed) ? 0 : parsed);
                              }}
                              className="w-16 p-1 text-center text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-400 pr-2 select-none font-medium">kWh</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStep(step.id)}
                            disabled={topUpSteps.length <= 1}
                            className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
                            title="Remove Step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Step-by-Step Audit Cards & Total Monthly Top-Up Balance */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step-By-Step Incremental Top-Up Calculation Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-sans">
                <Calculator className="w-4 h-4 text-[#5FA354] dark:text-emerald-400" />
                Step-by-Step Calculation Audit ({calculatedSteps.length} Steps)
              </h2>
              <button
                type="button"
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
              >
                {showFormulaDetails ? 'Hide Formulas' : 'Show Formulas'}
              </button>
            </div>

            <div className="space-y-4">
              {calculatedSteps.map((step) => {
                return (
                  <div
                    key={`audit-step-${step.id}`}
                    className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl p-5 shadow-xs space-y-4 transition-all hover:border-emerald-500/30"
                  >
                    {/* Step Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-150 dark:border-zinc-900 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-[#078930] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          {step.stepNumber}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white font-sans">
                            Step {step.stepNumber}: Customer tops up {step.kwhAdded} kWh
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-sans mt-0.5">
                            {step.previousKwh === 0 ? (
                              <span>First top-up of the month = <strong className="font-mono text-gray-700 dark:text-zinc-300">{step.kwhAdded} kWh</strong></span>
                            ) : (
                              <span>Previous {step.previousKwh} kWh + new {step.kwhAdded} kWh = <strong className="font-mono text-gray-700 dark:text-zinc-300">{step.cumulativeKwh} kWh Total Cumulative</strong></span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Customer Pays Badge */}
                      <div className="text-left sm:text-right bg-[#078930] p-2.5 px-3.5 rounded-xl shrink-0">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                          Customer Purchased
                        </span>
                        <span className="text-lg font-extrabold text-white font-sans">
                          {step.customerPaysNow.toFixed(2)} ETB
                        </span>
                      </div>
                    </div>

                    {/* Mathematical Formula Walkthrough */}
                    {showFormulaDetails && (
                      <div className="animate-in fade-in-50 duration-200">
                        <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2.5 text-xs font-sans text-gray-800 dark:text-zinc-200">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Step {step.stepNumber} EEU Billing Formula
                          </div>

                          <div className="space-y-1.5 text-xs leading-relaxed font-sans">
                            <div>
                              1. Cumulative Consumption: <span className="font-mono font-bold text-gray-900 dark:text-white">{step.previousKwh} + {step.kwhAdded} = {step.cumulativeKwh} kWh</span>
                            </div>
                            <div>
                              2. Energy Charge: <span className="font-mono font-bold text-gray-900 dark:text-white">{step.cumulativeKwh} kWh × {step.rate.toFixed(4)} = {step.energyCharge.toFixed(3)} ETB</span>
                            </div>
                            <div>
                              3. Service Charge (Prepaid): <span className="font-mono font-bold text-gray-900 dark:text-white">{step.serviceCharge.toFixed(2)} ETB</span>
                            </div>
                            <div>
                              4. TV (EBC) Fee: <span className="font-mono font-bold text-gray-900 dark:text-white">{step.ebcFee.toFixed(2)} ETB</span> {step.cumulativeKwh > 50 ? '(> 50 kWh)' : '(≤ 50 kWh Exempt)'}
                            </div>
                            <div>
                              5. Regulatory Fee (0.5%): <span className="font-mono font-bold text-gray-900 dark:text-white">({step.energyCharge.toFixed(3)} + {step.serviceCharge.toFixed(2)}) × 0.5% = {step.regulatoryFee.toFixed(6)} ETB</span>
                            </div>
                            <div>
                              6. VAT (15%): <span className="font-mono font-bold text-gray-900 dark:text-white">{step.vatAmount > 0 ? `(${step.energyCharge.toFixed(3)} + {step.serviceCharge.toFixed(2)}) × 15% = ${step.vatAmount.toFixed(6)} ETB` : '0.00 ETB (≤ 200 kWh Exempt)'}</span>
                            </div>
                            <div>
                              7. Cumulative Total Bill: <span className="font-mono font-bold text-gray-900 dark:text-white">{step.cumulativeTotalCost.toFixed(6)} ETB</span>
                            </div>
                            {step.previousCumulativeTotalCost > 0 ? (
                              <div>
                                8. Deduct previously paid amount ({step.previousCumulativeTotalCost.toFixed(6)} ETB):
                                <br />
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md mt-1.5 inline-block border border-emerald-500/20">
                                  {step.cumulativeTotalCost.toFixed(6)} – {step.previousCumulativeTotalCost.toFixed(6)} = {step.customerPaysNow.toFixed(6)} ETB
                                </span>
                              </div>
                            ) : (
                              <div>
                                8. Net amount payable for Step {step.stepNumber}:
                                <br />
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md mt-1.5 inline-block border border-emerald-500/20">
                                  {step.customerPaysNow.toFixed(6)} ETB
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Monthly Summary Banner */}
            <div className="px-5 sm:px-6 py-4 h-[115.5px] bg-gradient-to-r from-[#078930] to-[#5FA354] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div>
                <span className="text-xs uppercase font-sans font-bold text-emerald-100 block tracking-wider">
                  Total Monthly Top-Up Balance
                </span>
                <h3 className="text-2xl font-black font-sans tracking-tight mt-0.5">
                  {totalKwhPurchased.toFixed(1)} kWh Total Purchased
                </h3>
                <p className="text-xs text-emerald-100 mt-1 font-medium">
                  Cumulative total paid across all {calculatedSteps.length} top-up steps
                </p>
              </div>

              <div className="text-right shrink-0 bg-white/10 p-4 rounded-xl border border-white/20">
                <span className="text-[11px] font-sans font-bold text-emerald-100 uppercase block">Total ETB Paid</span>
                <span className="text-3xl font-extrabold font-mono text-white">
                  {totalPaidMonth.toFixed(2)} <span className="text-sm font-bold">ETB</span>
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
