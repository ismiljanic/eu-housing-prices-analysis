import { useState, useEffect, useMemo } from "react";
import LineChart from "./components/LineChart";
import DualAxisChart from "./components/DualAxis";
import ScatterPlot from "./components/ScatterPlot";
import ChoroplethMap from "./components/ChoroPlethMap";
import Papa from "papaparse";
import { FullChartModal } from "./utils/FullChartModal";
import { CountryDropdown } from "./utils/CountryDropdown";
import { computeRankings } from "./analysis/rankings";
import { addChanges } from "./analysis/changes";
import { computeECBImpact } from "./analysis/ecbImpact";
import { TopCountriesMini } from "./utils/TopCountriesMini";
import { ECBImpactMini } from "./utils/ECBImpactMini";
import { VolatilityMini } from "./utils/VolatilityMini";
import { CorrelationHintMini } from "./utils/CorrelationHintMini";
import * as d3 from "d3";

export default function App() {
  const [layout, setLayout] = useState<'asymmetric' | 'hero' | 'sidebar' | 'classic'>('asymmetric');
  const [selectedCountry, setSelectedCountry] = useState<string>('Croatia');
  const [sharedData, setSharedData] = useState<any[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2024]);
  const [focusedView, setFocusedView] = useState<null | 'dualAxis' | 'lineChart' | 'scatter' | 'map'>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const countries = Array.from(
    new Set(sharedData.map(d => d.countryName))
  ).sort();

  const filteredData = sharedData.filter(
    d =>
      d.countryName === selectedCountry &&
      d.year >= yearRange[0] &&
      d.year <= yearRange[1]
  );

  const mapData = sharedData.filter(
    d => d.year >= yearRange[0] && d.year <= yearRange[1]
  );

  const isoToName: Record<string, string> = {
    AT: "Austria",
    BE: "Belgium",
    BG: "Bulgaria",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DE: "Germany",
    DK: "Denmark",
    EE: "Estonia",
    ES: "Spain",
    FI: "Finland",
    FR: "France",
    HR: "Croatia",
    HU: "Hungary",
    IE: "Ireland",
    IT: "Italy",
    LT: "Lithuania",
    LU: "Luxembourg",
    LV: "Latvia",
    MT: "Malta",
    NL: "Netherlands",
    PL: "Poland",
    PT: "Portugal",
    RO: "Romania",
    SE: "Sweden",
    SI: "Slovenia",
    SK: "Slovakia"
  };

  useEffect(() => {
    fetch("/data/enriched/housing_macro_quarterly_enriched.csv")
      .then(res => res.text())
      .then(csvString => {
        const parsed = Papa.parse(csvString, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        setSharedData(parsed.data);
      });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedView(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const rankings = useMemo(
    () => computeRankings(sharedData, yearRange),
    [sharedData, yearRange]
  );

  useEffect(() => {
    fetch("/data/enriched/housing_macro_quarterly_enriched.csv")
      .then(res => res.text())
      .then(csvString => {
        const parsed = Papa.parse(csvString, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });

        const mappedData = parsed.data.map((d: any) => ({
          ...d,
          countryName: isoToName[d.country] || d.country
        }));

        setSharedData(mappedData);
      });
  }, []);

  const allAvg = useMemo(
    () =>
      rankings
        .map(r => ({
          country: r.country as string,
          avgGrowth: r.avgGrowth ?? null
        }))
        .sort((a, b) => (b.avgGrowth ?? 0) - (a.avgGrowth ?? 0)),
    [rankings]
  );

  const enrichedFilteredData = useMemo(
    () => addChanges(filteredData),
    [filteredData]
  );

  const ecbImpact = useMemo(
    () => computeECBImpact(enrichedFilteredData),
    [enrichedFilteredData]
  );

  const selectedCountryVolatility = useMemo(() => {
    const hpi = filteredData.map(d => d.hpi).filter(Boolean);
    return hpi.length > 1 ? d3.deviation(hpi) : null;
  }, [filteredData]);

  const averageEUVolatility = useMemo(() => {
    const vols: number[] = [];

    countries.forEach(country => {
      const hpi = sharedData
        .filter(d => d.country === country && d.year >= yearRange[0] && d.year <= yearRange[1])
        .map(d => d.hpi)
        .filter(Boolean);

      if (hpi.length > 1) vols.push(d3.deviation(hpi)!);
    });

    if (vols.length === 0) return null;
    return d3.mean(vols);
  }, [sharedData, countries, yearRange]);


  return (
    <div className="h-screen bg-gray-50 grid md:grid-cols-[auto_1fr]">

      {/* Header for Mobile */}
      <header className="md:hidden w-full bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">EU Housing Dashboard</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Slide-down Menu */}
      {sidebarOpen && (
        <div className="md:hidden bg-white p-4 space-y-3">
          {/* Country Selector */}
          <div>
            <label className="text-sm text-gray-700 font-medium">Country</label>
            <CountryDropdown
              countries={countries}
              selectedCountry={selectedCountry}
              onChange={setSelectedCountry}
            />
          </div>

          {/* Year Range */}
          <div className="space-y-3">
            <div className="flex flex-col">
              <label className="text-sm text-gray-700 font-medium mb-1">Start Year</label>
              <span className="text-sm text-gray-500 mb-1">{yearRange[0]}</span>
              <input
                type="range"
                min={2010}
                max={2024}
                value={yearRange[0]}
                onChange={e => {
                  const newStart = Number(e.target.value);
                  setYearRange([newStart, Math.max(newStart, yearRange[1])]);
                }}
                className="w-full"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-700 font-medium mb-1">End Year</label>
              <span className="text-sm text-gray-500 mb-1">{yearRange[1]}</span>
              <input
                type="range"
                min={2010}
                max={2024}
                value={yearRange[1]}
                onChange={e => {
                  const newEnd = Number(e.target.value);
                  setYearRange([Math.min(yearRange[0], newEnd), newEnd]);
                }}
                className="w-full"
              />
            </div>

            <p className="text-xs text-gray-500">
              Showing data from <span className="font-semibold">{yearRange[0]}</span> to <span className="font-semibold">{yearRange[1]}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setShowAnalysis(true);
              setSidebarOpen(false);
            }}
            className="w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
          >
            Show Analysis
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col justify-between h-[45vh] w-64 bg-white border-r border-gray-200 p-6
             sticky top-1/2 -translate-y-1/2 ml-6"
      >
        {/* Main Sidebar Container */}
        <div className="flex flex-col justify-between h-full overflow-hidden mx-auto">

          {/* Top Section */}
          <div className="flex flex-col space-y-6 ml-1">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                EU Housing Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                House prices, inflation & interest rates
              </p>
            </div>

            {/* Country Selector */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700 font-medium">Country</label>
              <CountryDropdown
                countries={countries}
                selectedCountry={selectedCountry}
                onChange={setSelectedCountry}
              />
            </div>

            {/* Year Range */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 font-medium mb-1">Start Year</label>
                <span className="text-sm text-gray-500 mb-1">{yearRange[0]}</span>
                <input
                  type="range"
                  min={2010}
                  max={2024}
                  value={yearRange[0]}
                  onChange={e => {
                    const newStart = Number(e.target.value);
                    setYearRange([newStart, Math.max(newStart, yearRange[1])]);
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 font-medium mb-1">End Year</label>
                <span className="text-sm text-gray-500 mb-1">{yearRange[1]}</span>
                <input
                  type="range"
                  min={2010}
                  max={2024}
                  value={yearRange[1]}
                  onChange={e => {
                    const newEnd = Number(e.target.value);
                    setYearRange([Math.min(yearRange[0], newEnd), newEnd]);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Analysis Button */}
            <button
              onClick={() => setShowAnalysis(true)}
              className="mt-4 w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
            >
              Show Analysis
            </button>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-400 mt-6 ml-2">
            Data Source: EU Housing Market
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col h-screen p-4 md:p-6 pb-16">
        <div className="grid grid-cols-12 gap-6 flex-1">

          {/* Top Row */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl text-gray-900 mb-2">
              HPI & Inflation Across EU
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Year-over-year housing price index (HPI) and inflation rates by country
            </p>
            <div className="w-full h-[30vh] md:h-[40vh] relative overflow-hidden rounded-lg">
              <ChoroplethMap
                data={mapData}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
                isoToName={isoToName}
              />
            </div>
          </div>

          <div
            className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setFocusedView('dualAxis')}
          >
            <h2 className="text-lg text-gray-900 mb-2">HPI vs ECB Interest Rate</h2>
            <p className="text-sm text-gray-500 mb-4">Quarterly housing price index alongside ECB rate changes</p>
            <div className="w-full h-[25vh] md:h-[30vh] relative overflow-hidden cursor-default">
              <DualAxisChart country={selectedCountry} data={filteredData} />
            </div>
            <p className="text-xs text-gray-400 mt-25">Click to enlarge</p>
          </div>

          {/* Bottom Row */}
          <div
            className="col-span-12 lg:col-span-4 bg-white rounded-2xl mb-4 shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
            onClick={() => setFocusedView('lineChart')}
          >
            <h2 className="text-lg text-gray-900 mb-2">Housing Price Index Timeline</h2>
            <p className="text-sm text-gray-500 mb-4">Quarterly HPI changes over time for the selected country</p>

            {/* Chart container grows to fill remaining space */}
            <div className="flex-1 w-full relative overflow-hidden">
              <LineChart country={selectedCountry} data={filteredData} className="w-full h-full" />
            </div>

            <p className="text-xs text-gray-400 mt-2">Click to enlarge</p>
          </div>

          <div
            className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer mb-4"
            onClick={() => setFocusedView('scatter')}
          >
            <h2 className="text-xl text-gray-900 mb-2">HPI vs Interest Rate Change</h2>
            <p className="text-sm text-gray-500 mb-4">Relationship between quarterly interest rate changes and HPI growth</p>
            <div className="w-full h-[20vh] md:h-[25vh] relative overflow-hidden">
              <ScatterPlot country={selectedCountry} data={filteredData} />
            </div>
            <p className="text-xs text-gray-400 mt-20">Click to enlarge</p>
          </div>
        </div>

        {/* Modals & Analysis remain the same */}
        {focusedView === 'dualAxis' && (
          <FullChartModal
            title={`HPI vs ECB Interest Rate — ${selectedCountry}`}
            onClose={() => setFocusedView(null)}
          >
            <DualAxisChart
              country={selectedCountry}
              data={filteredData}
              className="w-full max-h-[80vh] h-full min-h-[60vh]"
            />
          </FullChartModal>
        )}

        {focusedView === 'lineChart' && (
          <FullChartModal
            title={`HPI Timeline — ${selectedCountry}`}
            onClose={() => setFocusedView(null)}
          >
            <LineChart country={selectedCountry} data={filteredData} className="w-full max-h-[80vh] h-full min-h-[60vh]" />
          </FullChartModal>
        )}

        {focusedView === 'scatter' && (
          <FullChartModal
            title={`HPI vs Interest Rate Change — ${selectedCountry}`}
            onClose={() => setFocusedView(null)}
          >
            <ScatterPlot country={selectedCountry} data={filteredData} className="w-full max-h-[80vh] h-full min-h-[60vh]" />
          </FullChartModal>
        )}

        {showAnalysis && (
          <FullChartModal
            title={`Analytical Summary — ${selectedCountry} (${yearRange[0]}-${yearRange[1]})`}
            onClose={() => setShowAnalysis(false)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TopCountriesMini data={allAvg} selectedCountry={selectedCountry} yearRange={yearRange} />
              <ECBImpactMini pre={ecbImpact.preECB} post={ecbImpact.postECB} delta={ecbImpact.delta} selectedCountry={selectedCountry} yearRange={yearRange} />
              <VolatilityMini country={selectedCountry} volatility={selectedCountryVolatility} euAverage={averageEUVolatility} yearRange={yearRange} />
              <CorrelationHintMini data={enrichedFilteredData} selectedCountry={selectedCountry} />
            </div>
          </FullChartModal>
        )}

      </main>
    </div>
  );
}