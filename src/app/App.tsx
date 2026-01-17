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
import { ECBImpactMini } from "./utils/EcbImpactMini";
import { VolatilityMini } from "./utils/VolatilityMini";
import { CorrelationHintMini } from "./utils/CorrelationHintMini";
import * as d3 from "d3";

export default function App() {
  const [layout, setLayout] = useState<'asymmetric' | 'hero' | 'sidebar' | 'classic'>('asymmetric');
  const [selectedCountry, setSelectedCountry] = useState<string>('HR');
  const [sharedData, setSharedData] = useState<any[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2024]);
  const [focusedView, setFocusedView] = useState<null | 'dualAxis' | 'lineChart' | 'scatter' | 'map'>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const countries = Array.from(
    new Set(sharedData.map(d => d.country))
  ).sort();

  const filteredData = sharedData.filter(
    d =>
      d.country === selectedCountry &&
      d.year >= yearRange[0] &&
      d.year <= yearRange[1]
  );

  const mapData = sharedData.filter(
    d => d.year >= yearRange[0] && d.year <= yearRange[1]
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
    <div className="h-[90vh] grid grid-cols-[auto_1fr] gap-6 bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
    max-h-[70vh]
    bg-white border-r border-gray-200 p-6 flex flex-col justify-between
    transition-all duration-300
    ${sidebarOpen ? "w-64" : "w-0"}
    my-auto
    ml-5
  `}
      >
        {/* Main Sidebar Container */}
        <div className="flex flex-col justify-between overflow-hidden">

          {/* Top Section */}
          <div className="flex flex-col space-y-6">
            {/* Title */}
            {sidebarOpen && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  EU Housing Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  House prices, inflation & interest rates
                </p>
              </div>
            )}

            {/* Country Selector */}
            {sidebarOpen && (
              <div className="space-y-2">
                <label className="text-sm text-gray-700 font-medium">Country</label>
                <CountryDropdown
                  countries={countries}
                  selectedCountry={selectedCountry}
                  onChange={setSelectedCountry}
                />
              </div>
            )}

            {/* Year Range */}
            {sidebarOpen && (
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

                <p className="text-xs text-gray-500">
                  Showing data from <span className="font-semibold">{yearRange[0]}</span> to <span className="font-semibold">{yearRange[1]}</span>
                </p>
              </div>
            )}

            {/* Analysis Button */}
            {sidebarOpen && (
              <button
                onClick={() => setShowAnalysis(true)}
                className="mt-4 w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
              >
                Show Analysis
              </button>
            )}
          </div>

          {/* Footer */}
          {sidebarOpen && (
            <div className="text-xs text-gray-400 mt-6">
              Data Source: EU Housing Market
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col h-screen p-4 md:p-6">
        <div className="grid grid-cols-12 gap-6 flex-1">

          {/* Top Row */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl text-gray-900 mb-2">HPI Growth Across EU — Country Map</h2>
            <p className="text-sm text-gray-500 mb-4">Year-over-year housing price growth by country</p>
            <div className="w-full h-[30vh] md:h-[40vh] relative overflow-hidden rounded-lg">
              <ChoroplethMap
                data={mapData}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
            </div>
          </div>

          <div
            className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setFocusedView('dualAxis')}
          >
            <h2 className="text-lg text-gray-900 mb-2">HPI vs ECB Interest Rate — Dual-Axis</h2>
            <p className="text-sm text-gray-500 mb-4">Quarterly housing price index alongside ECB rate changes</p>
            <div className="w-full h-[25vh] md:h-[30vh] relative overflow-hidden cursor-default">
              <DualAxisChart country={selectedCountry} data={filteredData} />
            </div>
            <p className="text-xs text-gray-400 mt-20">Click to enlarge</p>
          </div>

          {/* Bottom Row */}
          <div
            className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setFocusedView('lineChart')}
          >
            <h2 className="text-lg text-gray-900 mb-2">Housing Price Index Timeline — Line Chart</h2>
            <p className="text-sm text-gray-500 mb-4">Quarterly HPI changes over time for the selected country</p>
            <div className="w-full h-[20vh] md:h-[25vh] relative overflow-hidden cursor-default">
              <LineChart country={selectedCountry} data={filteredData} />
            </div>
            <p className="text-xs text-gray-400 mt-7">Click to enlarge</p>
          </div>

          <div
            className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setFocusedView('scatter')}
          >
            <h2 className="text-xl text-gray-900 mb-2">HPI vs Interest Rate Change — Scatter Plot</h2>
            <p className="text-sm text-gray-500 mb-4">Relationship between quarterly interest rate changes and HPI growth</p>
            <div className="w-full h-[20vh] md:h-[25vh] relative overflow-hidden">
              <ScatterPlot country={selectedCountry} data={filteredData} />
            </div>
            <p className="text-xs text-gray-400 mt-20">Click to enlarge</p>
          </div>

        </div>

        {/* Modals for expanded charts */}
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

        {/* Analysis Modal */}
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