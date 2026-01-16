import { useState, useEffect } from "react";
import LineChart from "./components/LineChart";
import DualAxisChart from "./components/DualAxis";
import ScatterPlot from "./components/ScatterPlot";
import ChoroplethMap from "./components/ChoroPlethMap";
import Papa from "papaparse";
import { FullChartModal } from "./utils/FullChartModal";
import {CountryDropdown} from "./utils/CountryDropdown";

export default function App() {
  const [layout, setLayout] = useState<'asymmetric' | 'hero' | 'sidebar' | 'classic'>('asymmetric');
  const [selectedCountry, setSelectedCountry] = useState<string>('HR');
  const [sharedData, setSharedData] = useState<any[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2024]);
  const [focusedView, setFocusedView] = useState<null | 'dualAxis' | 'lineChart' | 'scatter' | 'map'>(null);

  const countries = Array.from(
    new Set(sharedData.map(d => d.country))
  ).sort();

  const filteredData = sharedData.filter(d =>
    d.country === selectedCountry &&
    d.year >= yearRange[0] &&
    d.year <= yearRange[1]
  );

  const mapData = sharedData.filter(d =>
    d.year >= yearRange[0] &&
    d.year <= yearRange[1]
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
      if (e.key === 'Escape') setFocusedView(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-6 py-4 flex items-center justify-between gap-6">

          {/* Title */}
          <div>
            <h1 className="text-2xl text-gray-900 tracking-tight">
              EU Housing Market Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              House prices, inflation and interest rates (quarterly)
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">

            <CountryDropdown
              countries={countries}
              selectedCountry={selectedCountry}
              onChange={setSelectedCountry}
            />

            {/* Year range */}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>{yearRange[0]}</span>
              <input
                type="range"
                min={2010}
                max={2024}
                value={yearRange[1]}
                onChange={e =>
                  setYearRange([yearRange[0], Number(e.target.value)])
                }
                className="w-32"
              />
              <span>{yearRange[1]}</span>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto px-6 py-8">

        {/* Asymmetric Layout */}
        {layout === 'asymmetric' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Featured Choropleth Map */}
            <div className="col-span-12 lg:col-span-8 lg:row-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 1: Map</h2>
              <p className="text-sm text-gray-500 mb-4">HPI growth YoY by country</p>
              <div className="w-full h-[500px]">
                <ChoroplethMap
                  data={mapData}
                  selectedCountry={selectedCountry}
                  onCountrySelect={setSelectedCountry}
                />
              </div>
            </div>

            {/* Dual-Axis Chart */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setFocusedView('dualAxis')}
            >
              <h2 className="text-lg text-gray-900 mb-2">Visualization 2: Dual-Axis</h2>
              <p className="text-sm text-gray-500 mb-4">HPI & ECB interest rate</p>
              <div
                className="w-full h-[230px] cursor-default"
              >
                <DualAxisChart country={selectedCountry} data={filteredData} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Click to enlarge
              </p>
            </div>

            {/* Line Chart */}
            <div
              className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setFocusedView('lineChart')}
            >
              <h2 className="text-lg text-gray-900 mb-2">Visualization 3: Line Chart</h2>
              <p className="text-sm text-gray-500 mb-4">HPI through time - Core baseline view</p>
              <div className="w-full h-[230px] cursor-default">
                <LineChart country={selectedCountry} data={filteredData} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Click to enlarge</p>
            </div>

            {/* Scatter Plot */}
            <div
              className="col-span-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setFocusedView('scatter')}
            >
              <h2 className="text-xl text-gray-900 mb-2">Visualization 4: Scatter Plot</h2>
              <p className="text-sm text-gray-500 mb-4">Interest rate change vs HPI change</p>
              <div className="w-full h-[350px] cursor-default">
                <ScatterPlot country={selectedCountry} data={filteredData} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Click to enlarge</p>
            </div>
            {focusedView === 'dualAxis' && (
              <FullChartModal
                title={`HPI vs ECB Interest Rate — ${selectedCountry}`}
                onClose={() => setFocusedView(null)}
              >
                <DualAxisChart country={selectedCountry} data={filteredData} />
              </FullChartModal>
            )}

            {focusedView === 'lineChart' && (
              <FullChartModal
                title={`HPI Timeline — ${selectedCountry}`}
                onClose={() => setFocusedView(null)}
              >
                <LineChart country={selectedCountry} data={filteredData} />
              </FullChartModal>
            )}

            {focusedView === 'scatter' && (
              <FullChartModal
                title={`HPI vs Interest Rate Change — ${selectedCountry}`}
                onClose={() => setFocusedView(null)}
              >
                <ScatterPlot country={selectedCountry} data={filteredData} />
              </FullChartModal>
            )}
          </div>
        )}
      </main>
    </div>
  );
}