import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Zap, 
  Printer
} from 'lucide-react';

interface TariffDataRow {
  no?: number | string;
  categoryGroup: 'Domestic' | 'Commercial';
  categoryLabel: string;
  unit: string;
  rates: {
    '2017': [number, number, number, number];
    '2018': [number, number, number, number];
    '2019': [number, number, number, number];
    '2020': [number, number, number, number];
  };
  highlight2020?: boolean[]; // Quarters in 2020 that are highlighted in pink/salmon like in the official schedule
}

const TARIFF_DATA: TariffDataRow[] = [
  {
    no: '1',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -1)   0 - 50 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [0.3537, 0.4344, 0.5150, 0.5957],
      '2018': [0.6764, 0.7571, 0.8377, 0.9184],
      '2019': [0.9991, 1.0798, 1.1604, 1.2411],
      '2020': [1.3218, 1.4025, 1.4831, 1.5638]
    },
    highlight2020: [false, false, false, false]
  },
  {
    no: '',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -2 )  51 - 100 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [0.9478, 1.1285, 1.3093, 1.4901],
      '2018': [1.6708, 1.8516, 2.0324, 2.2131],
      '2019': [2.3939, 2.5746, 2.7554, 2.9362],
      '2020': [3.1169, 3.2977, 3.4785, 3.6592]
    },
    highlight2020: [false, false, false, false]
  },
  {
    no: '',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -3 )  101 - 200 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [1.8864, 2.1478, 2.4092, 2.6706],
      '2018': [2.9320, 3.1934, 3.4549, 3.7163],
      '2019': [3.9777, 4.2391, 4.5005, 4.7619],
      '2020': [5.0233, 5.2847, 5.5461, 5.8075]
    },
    highlight2020: [false, false, false, false]
  },
  {
    no: '',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -4 )  201 - 300 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [2.4597, 2.9193, 3.3790, 3.8387],
      '2018': [4.2983, 4.7580, 5.2177, 5.6773],
      '2019': [6.1370, 6.5967, 7.0563, 7.5160],
      '2020': [7.9756, 8.4353, 8.8950, 9.3546]
    },
    highlight2020: [false, false, false, false]
  },
  {
    no: '',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -5 )  301 - 400 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [2.6580, 3.1159, 3.5739, 4.0318],
      '2018': [4.4898, 4.9477, 5.4057, 5.8636],
      '2019': [6.3216, 6.7796, 7.2375, 7.6955],
      '2020': [8.1534, 8.5897, 9.0260, 9.4624]
    },
    highlight2020: [false, true, true, true]
  },
  {
    no: '',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -6 )  401 - 500 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [2.8474, 3.2898, 3.7321, 4.1745],
      '2018': [4.6169, 5.0593, 5.5017, 5.9441],
      '2019': [6.3864, 6.8288, 7.2712, 7.7136],
      '2020': [8.1560, 8.5983, 9.0407, 9.4831]
    },
    highlight2020: [false, true, true, true]
  },
  {
    no: '',
    categoryGroup: 'Domestic',
    categoryLabel: '(blk -7)  Above 500 kwh',
    unit: 'Birr/kwh',
    rates: {
      '2017': [2.9173, 3.3537, 3.7900, 4.2263],
      '2018': [4.6627, 5.0990, 5.5354, 5.9717],
      '2019': [6.4080, 6.8444, 7.2807, 7.7170],
      '2020': [8.1534, 8.6114, 9.0693, 9.5273]
    },
    highlight2020: [false, true, true, true]
  },
  {
    no: '2',
    categoryGroup: 'Commercial',
    categoryLabel: 'Commercial (General )',
    unit: 'Birr/kwh',
    rates: {
      '2017': [2.6057, 3.0874, 3.5691, 4.0507],
      '2018': [4.5324, 5.0141, 5.4958, 5.9775],
      '2019': [6.4592, 6.9409, 7.4225, 7.9042],
      '2020': [8.3859, 8.8676, 9.3493, 9.8310]
    },
    highlight2020: [false, false, false, false]
  }
];

const YEARS = ['2017', '2018', '2019', '2020'] as const;
type YearKey = typeof YEARS[number];

export default function EEUBillTariff() {
  const [selectedYear, setSelectedYear] = useState<'ALL' | YearKey>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'Domestic' | 'Commercial'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRate, setCopiedRate] = useState<string | null>(null);

  // Quick rate finder state
  const [calcYear, setCalcYear] = useState<YearKey>('2020');
  const [calcQuarter, setCalcQuarter] = useState<number>(4);
  const [calcCategoryIdx, setCalcCategoryIdx] = useState<number>(0);

  const filteredData = useMemo(() => {
    return TARIFF_DATA.filter(row => {
      const matchesGroup = selectedGroup === 'ALL' || row.categoryGroup === selectedGroup;
      const matchesSearch = row.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            row.categoryGroup.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);

  const handleCopyRate = (val: number, label: string) => {
    navigator.clipboard.writeText(`${val.toFixed(4)} Birr/kwh`);
    setCopiedRate(label);
    setTimeout(() => setCopiedRate(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedCategory = TARIFF_DATA[calcCategoryIdx];
  const calculatedRate = selectedCategory ? selectedCategory.rates[calcYear][calcQuarter - 1] : 0;

  return (
    <div id="eeu-bill-tariff-container" className="space-y-6 text-left">
      {/* QUICK RATE LOOKUP CALCULATOR / FINDER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 border border-emerald-500/20 dark:border-emerald-500/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Instant Tariff Lookup</span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
              Select category, year, and quarter to inspect the precise official unit rate instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Category Selector */}
            <div className="flex-1 sm:flex-none">
              <label className="block text-[9px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 mb-1">
                Category / Block
              </label>
              <select
                id="lookup-category-select"
                value={calcCategoryIdx}
                onChange={(e) => setCalcCategoryIdx(Number(e.target.value))}
                className="w-full text-xs font-semibold rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green cursor-pointer"
              >
                {TARIFF_DATA.map((row, idx) => (
                  <option key={idx} value={idx}>
                    {row.categoryGroup === 'Domestic' ? `[Domestic] ${row.categoryLabel}` : `[Commercial] ${row.categoryLabel}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-[9px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 mb-1">
                Year
              </label>
              <select
                id="lookup-year-select"
                value={calcYear}
                onChange={(e) => setCalcYear(e.target.value as YearKey)}
                className="text-xs font-semibold rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-eeu-green cursor-pointer"
              >
                {YEARS.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Quarter Selector */}
            <div>
              <label className="block text-[9px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 mb-1">
                Quarter
              </label>
              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                {[1, 2, 3, 4].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setCalcQuarter(q)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      calcQuarter === q 
                        ? 'bg-eeu-green text-white shadow-xs' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Q{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-900 p-2 px-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                <span className="text-[9px] uppercase font-mono font-bold text-gray-400 block">Unit Rate</span>
                <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {calculatedRate.toFixed(4)} <span className="text-[10px] font-sans font-normal text-gray-500">Birr/kWh</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year Filter Tabs */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold">
            <button
              id="tariff-year-all"
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedYear === 'ALL'
                  ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              All Years (2017-2020)
            </button>
            {YEARS.map(yr => (
              <button
                key={yr}
                id={`tariff-year-${yr}`}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Group Filter */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold">
            <button
              id="tariff-group-all"
              onClick={() => setSelectedGroup('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'ALL'
                  ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              All
            </button>
            <button
              id="tariff-group-domestic"
              onClick={() => setSelectedGroup('Domestic')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'Domestic'
                  ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              Domestic
            </button>
            <button
              id="tariff-group-commercial"
              onClick={() => setSelectedGroup('Commercial')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedGroup === 'Commercial'
                  ? 'bg-white dark:bg-gray-800 text-eeu-green shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              Commercial
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            id="tariff-search-input"
            type="text"
            placeholder="Search block or rate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1.5 focus:ring-eeu-green w-full sm:w-60"
          />
        </div>
      </div>

      {/* COMPLETE INTERACTIVE TARIFF TABLE */}
      <div className="rounded-2xl border border-gray-300 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950 shadow-md text-base font-sans font-['Inter',sans-serif]">
        
        {/* BANNER HEADER MATCHING OFFICIAL EEU STYLE */}
        <div className="bg-[#F48B20] text-gray-950 px-6 py-2.5 text-center font-sans font-black text-sm md:text-base tracking-wide border-b border-gray-300 dark:border-gray-800">
          Energy Consumption Bill
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            {/* TABLE HEADER ROW 1: Super Headers */}
            <thead>
              <tr className="bg-[#5FA354] text-white font-bold border-b border-emerald-700/60 text-center">
                <th rowSpan={2} className="py-2 px-2 border-r border-emerald-700/50 w-12 min-w-[48px] max-w-[48px] text-center font-sans sticky left-0 z-30 bg-[#5FA354]">
                  No
                </th>
                <th rowSpan={2} className="py-2 px-4 border-r border-emerald-700/50 text-center w-56 min-w-[224px] max-w-[224px] font-sans sticky left-[48px] z-30 bg-[#5FA354]">
                  Category
                </th>
                <th rowSpan={2} className="py-2 px-3 border-r-2 border-emerald-800 text-center w-20 min-w-[80px] max-w-[80px] font-sans sticky left-[272px] z-30 bg-[#5FA354] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)]">
                  Unit
                </th>
                
                {(selectedYear === 'ALL' || selectedYear === '2017') && (
                  <th colSpan={4} className="py-1.5 px-2 border-r border-emerald-700/50 bg-[#4e8944] text-center font-sans font-bold">
                    2017
                  </th>
                )}
                {(selectedYear === 'ALL' || selectedYear === '2018') && (
                  <th colSpan={4} className="py-1.5 px-2 border-r border-emerald-700/50 bg-[#4e8944] text-center font-sans font-bold">
                    2018
                  </th>
                )}
                {(selectedYear === 'ALL' || selectedYear === '2019') && (
                  <th colSpan={4} className="py-1.5 px-2 border-r border-emerald-700/50 bg-[#4e8944] text-center font-sans font-bold">
                    2019
                  </th>
                )}
                {(selectedYear === 'ALL' || selectedYear === '2020') && (
                  <th colSpan={4} className="py-1.5 px-2 border-r border-emerald-700/50 bg-[#4e8944] text-center font-sans font-bold">
                    2020
                  </th>
                )}
              </tr>

              {/* TABLE HEADER ROW 2: Quarters */}
              <tr className="bg-[#56974b] text-white text-[11px] font-semibold border-b border-gray-300 dark:border-gray-800 text-center font-sans">
                {(selectedYear === 'ALL' || selectedYear === '2017') && (
                  <>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">1</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">2</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">3</th>
                    <th className="py-1 px-2 border-r border-emerald-700/50 font-sans">4</th>
                  </>
                )}
                {(selectedYear === 'ALL' || selectedYear === '2018') && (
                  <>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">1</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">2</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">3</th>
                    <th className="py-1 px-2 border-r border-emerald-700/50 font-sans">4</th>
                  </>
                )}
                {(selectedYear === 'ALL' || selectedYear === '2019') && (
                  <>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">1</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">2</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">3</th>
                    <th className="py-1 px-2 border-r border-emerald-700/50 font-sans">4</th>
                  </>
                )}
                {(selectedYear === 'ALL' || selectedYear === '2020') && (
                  <>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">1</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">2</th>
                    <th className="py-1 px-2 border-r border-emerald-700/40 font-sans">3</th>
                    <th className="py-1 px-2 border-r border-emerald-700/50 font-sans">4</th>
                  </>
                )}
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-sans text-[12px]">
              {filteredData.map((row, rIdx) => {
                const isDomesticFirst = row.categoryGroup === 'Domestic' && rIdx === 0;
                const domesticRowCount = filteredData.filter(d => d.categoryGroup === 'Domestic').length;

                return (
                  <tr 
                    key={rIdx}
                    className="group hover:bg-[#F4984A]/20 dark:hover:bg-[#F4984A]/25 transition-colors"
                  >
                    {/* Optional Merged Domestic Vertical Label or Row No */}
                    {row.categoryGroup === 'Domestic' ? (
                      isDomesticFirst ? (
                        <td 
                          rowSpan={domesticRowCount} 
                          className="py-3 px-2 border-r border-gray-300 dark:border-gray-800 text-center font-sans font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 align-middle sticky left-0 z-20 w-12 min-w-[48px] max-w-[48px]"
                        >
                          <div className="[writing-mode:vertical-rl] rotate-180 text-xs tracking-wider uppercase font-sans">
                            Domestic
                          </div>
                        </td>
                      ) : null
                    ) : (
                      <td className="py-3 px-2 border-r border-gray-300 dark:border-gray-800 text-center font-sans font-bold text-gray-800 dark:text-gray-200 sticky left-0 z-20 bg-white dark:bg-gray-950 group-hover:bg-[#fde8d7] dark:group-hover:bg-[#3f2b20] transition-colors w-12 min-w-[48px] max-w-[48px]">
                        {row.no || '2'}
                      </td>
                    )}

                    {/* Category Label */}
                    <td className="py-2.5 px-4 border-r border-gray-300 dark:border-gray-800 font-sans text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap sticky left-[48px] z-20 bg-white dark:bg-gray-950 group-hover:bg-[#fde8d7] dark:group-hover:bg-[#3f2b20] transition-colors w-56 min-w-[224px] max-w-[224px]">
                      {row.categoryLabel}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3 border-r-2 border-gray-300 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-[11px] font-sans sticky left-[272px] z-20 bg-white dark:bg-gray-950 group-hover:bg-[#fde8d7] dark:group-hover:bg-[#3f2b20] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] transition-colors w-20 min-w-[80px] max-w-[80px]">
                      {row.unit}
                    </td>

                    {/* 2017 Quarters */}
                    {(selectedYear === 'ALL' || selectedYear === '2017') && (
                      <>
                        {row.rates['2017'].map((val, qIdx) => (
                          <td 
                            key={`2017-${qIdx}`} 
                            onClick={() => handleCopyRate(val, `2017-Q${qIdx+1}-${rIdx}`)}
                            title="Click to copy rate"
                            className="py-2.5 px-2 border-r border-gray-200 dark:border-gray-800 text-center hover:bg-[#F4984A] hover:text-white dark:hover:text-gray-950 hover:font-bold cursor-pointer transition-colors font-sans"
                          >
                            {val.toFixed(4)}
                          </td>
                        ))}
                      </>
                    )}

                    {/* 2018 Quarters */}
                    {(selectedYear === 'ALL' || selectedYear === '2018') && (
                      <>
                        {row.rates['2018'].map((val, qIdx) => (
                          <td 
                            key={`2018-${qIdx}`} 
                            onClick={() => handleCopyRate(val, `2018-Q${qIdx+1}-${rIdx}`)}
                            title="Click to copy rate"
                            className="py-2.5 px-2 border-r border-gray-200 dark:border-gray-800 text-center hover:bg-[#F4984A] hover:text-white dark:hover:text-gray-950 hover:font-bold cursor-pointer transition-colors font-sans"
                          >
                            {val.toFixed(4)}
                          </td>
                        ))}
                      </>
                    )}

                    {/* 2019 Quarters */}
                    {(selectedYear === 'ALL' || selectedYear === '2019') && (
                      <>
                        {row.rates['2019'].map((val, qIdx) => (
                          <td 
                            key={`2019-${qIdx}`} 
                            onClick={() => handleCopyRate(val, `2019-Q${qIdx+1}-${rIdx}`)}
                            title="Click to copy rate"
                            className="py-2.5 px-2 border-r border-gray-200 dark:border-gray-800 text-center hover:bg-[#F4984A] hover:text-white dark:hover:text-gray-950 hover:font-bold cursor-pointer transition-colors font-sans"
                          >
                            {val.toFixed(4)}
                          </td>
                        ))}
                      </>
                    )}

                    {/* 2020 Quarters */}
                    {(selectedYear === 'ALL' || selectedYear === '2020') && (
                      <>
                        {row.rates['2020'].map((val, qIdx) => {
                          const isPinkHighlight = row.highlight2020 && row.highlight2020[qIdx];
                          return (
                            <td 
                              key={`2020-${qIdx}`} 
                              onClick={() => handleCopyRate(val, `2020-Q${qIdx+1}-${rIdx}`)}
                              title="Click to copy rate"
                              className={`py-2.5 px-2 border-r border-gray-200 dark:border-gray-800 text-center cursor-pointer transition-colors font-sans ${
                                isPinkHighlight 
                                  ? 'bg-[#fbb4b4]/60 dark:bg-rose-950/40 font-bold text-rose-950 dark:text-rose-200 hover:bg-[#F4984A] hover:text-white dark:hover:text-gray-950' 
                                  : 'hover:bg-[#F4984A] hover:text-white dark:hover:text-gray-950 hover:font-bold'
                              }`}
                            >
                              {val.toFixed(4)}
                            </td>
                          );
                        })}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER INFO BAR */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-end text-[11px] text-gray-500 dark:text-gray-400 gap-2 font-sans">
          <div className="font-sans text-[10px] text-gray-400">
            Unit: Ethiopian Birr (ETB) per kWh
          </div>
        </div>
      </div>

    </div>
  );
}
