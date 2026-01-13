import { useState, useEffect } from "react";
import LineChart from "./components/LineChart";
import DualAxisChart from "./components/DualAxis";
import ScatterPlot from "./components/ScatterPlot";
import ChoroplethMap from "./components/ChoroPlethMap";
import sharedData from "../../data/enriched/housing_macro_quarterly_enriched.csv";
import Papa from "papaparse";

export default function App() {
  const [layout, setLayout] = useState<'asymmetric' | 'hero' | 'sidebar' | 'classic'>('asymmetric');
  const [selectedCountry, setSelectedCountry] = useState<string>('HR');
  const [sharedData, setSharedData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/data/enriched/housing_macro_quarterly_enriched.csv")
      .then(res => res.text())
      .then(csvString => {
        const parsed = Papa.parse(csvString, { header: true, dynamicTyping: true });
        setSharedData(parsed.data);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Layout Switcher */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 tracking-tight">HPI Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">European House Price Index & Interest Rate Analysis</p>
          </div>
          {/* Layout Switcher */}
          <div className="flex gap-2">
            {['asymmetric', 'hero', 'sidebar', 'classic'].map(l => (
              <button
                key={l}
                onClick={() => setLayout(l as any)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${layout === l ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">

        {/* Asymmetric Layout */}
        {layout === 'asymmetric' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Featured Line Chart */}
            <div className="col-span-12 lg:col-span-8 lg:row-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 1: Map</h2>
              <p className="text-sm text-gray-500 mb-4">HPI growth YoY by country</p>
              <div className="w-full h-[500px]">
                <ChoroplethMap />
              </div>
            </div>

            {/* Dual-Axis Chart */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 2: Dual-Axis</h2>
              <p className="text-sm text-gray-500 mb-4">HPI & ECB interest rate</p>
              <div className="w-full h-[230px]">
                <DualAxisChart country={selectedCountry} data={sharedData} />
              </div>
            </div>

            {/* Choropleth Map */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl text-gray-900 mb-2">Visualization 3: Line Chart</h2>
              <p className="text-sm text-gray-500 mb-4">HPI through time - Core baseline view</p>
              <div className="w-full h-[230px]">
                <LineChart country={selectedCountry} data={sharedData} />
              </div>
            </div>

            {/* Scatter Plot */}
            <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl text-gray-900 mb-2">Visualization 4: Scatter Plot</h2>
              <p className="text-sm text-gray-500 mb-4">Interest rate change vs HPI change</p>
              <div className="w-full h-[350px]">
                <ScatterPlot country={selectedCountry} data={sharedData} />
              </div>
            </div>
          </div>
        )}

        {/* Hero Layout */}
        {layout === 'hero' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
              <h2 className="text-2xl text-gray-900 mb-2">Visualization 1:  ChoroPleth Map</h2>
              <p className="text-gray-500 mb-6">Primary insight: Negative correlation strengthens post-2022</p>
              <div className="w-full h-[500px]">
                <ChoroplethMap />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base text-gray-900 mb-2">Line Chart</h3>
                <div className="w-full h-[200px]"><LineChart country={selectedCountry} data={sharedData} /></div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base text-gray-900 mb-2">Dual-Axis</h3>
                <div className="w-full h-[200px]"><DualAxisChart country={selectedCountry} data={sharedData} /></div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base text-gray-900 mb-2">Scatter Plot</h3>
                <div className="w-full h-[200px]"><ScatterPlot country={selectedCountry} data={sharedData} /></div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Layout */}
        {layout === 'sidebar' && (
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-4">Visualizations</h3>
                <nav className="space-y-2">
                  {['Line Chart', 'Dual-Axis', 'Choropleth', 'Scatter Plot'].map((viz, i) => (
                    <a key={i} href={`#viz${i + 1}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">{viz}</div>
                      </div>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              <div id="viz1" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl text-gray-900 mb-4">Visualization 1: Line Chart</h2>
                <div className="w-full h-[400px]"><LineChart country={selectedCountry} data={sharedData} /></div>
              </div>
              <div id="viz2" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl text-gray-900 mb-4">Visualization 2: Dual-Axis</h2>
                <div className="w-full h-[400px]"><DualAxisChart country={selectedCountry} data={sharedData} /></div>
              </div>
              <div id="viz3" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl text-gray-900 mb-4">Visualization 3: Choropleth Map</h2>
                <div className="w-full h-[400px]"><ChoroplethMap /></div>
              </div>
              <div id="viz4" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl text-gray-900 mb-4">Visualization 4: Scatter Plot</h2>
                <div className="w-full h-[400px]"><ScatterPlot country={selectedCountry} data={sharedData} /></div>
              </div>
            </div>
          </div>
        )}

        {/* Classic Layout */}
        {layout === 'classic' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 1: Line Chart</h2>
              <p className="text-sm text-gray-500 mb-4">HPI through time with QoQ changes</p>
              <div className="w-full h-[350px]"><LineChart country={selectedCountry} data={sharedData} /></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 2: Dual-Axis Chart</h2>
              <p className="text-sm text-gray-500 mb-4">HPI vs ECB interest rate</p>
              <div className="w-full h-[350px]"><DualAxisChart country={selectedCountry} data={sharedData} /></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 3: Choropleth Map</h2>
              <p className="text-sm text-gray-500 mb-4">HPI growth YoY by country</p>
              <div className="w-full h-[350px]"><ChoroplethMap /></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg text-gray-900 mb-2">Visualization 4: Scatter Plot</h2>
              <p className="text-sm text-gray-500 mb-4">Interest rate vs HPI correlation</p>
              <div className="w-full h-[350px]"><ScatterPlot country={selectedCountry} data={sharedData} /></div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}