import * as d3 from "d3";

const cardBase =
  "bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md";

interface TopCountriesMiniProps {
  data: { country: string; avgGrowth: number | null }[];
  selectedCountry: string;
}

export function TopCountriesMini({ data, selectedCountry, yearRange }: { data: { country: string; avgGrowth: number | null }[], selectedCountry: string, yearRange: [number, number] }) {
  const rangeText = yearRange[0] === yearRange[1] ? `Year: ${yearRange[0]}` : `Years: ${yearRange[0]}-${yearRange[1]}`;
  const sortedData = [...data].sort((a, b) => (b.avgGrowth ?? 0) - (a.avgGrowth ?? 0));
  const totalCountries = sortedData.length;

  const topGradient = ["#ff0000", "#f64d4d", "#f07a7a"];
  const bottomGradient = ["#64c587", "#51db83", "#13e761"];

  const colorScale = d3.scaleLinear<string>()
    .domain([1, totalCountries])
    .range(["#ff0000", "#13e761"])
    .interpolate(d3.interpolateRgb);

  const top = sortedData.slice(0, 3);
  const bottom = sortedData.slice(-3);
  const selected = sortedData.find(d => d.country === selectedCountry);

  const merged: typeof sortedData = [];
  top.forEach(d => merged.push(d));
  if (selected && !merged.find(d => d.country === selected.country)) merged.push(selected);
  bottom.forEach(d => {
    if (!merged.find(m => m.country === d.country)) merged.push(d);
  });

  merged.sort((a, b) => (b.avgGrowth ?? 0) - (a.avgGrowth ?? 0));

  return (
    <div className={`${cardBase} min-h-[250px]`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Avg HPI Growth — Top/Bottom</h3>
      <p className="text-xs text-gray-500 mb-3">{rangeText}</p>
      <div className="flex flex-col gap-2">
        {merged.map((d) => {
          const isSelected = d.country === selectedCountry;
          const rank = sortedData.findIndex(c => c.country === d.country) + 1;

          let barColor = colorScale(rank);

          if (top.findIndex(t => t.country === d.country) !== -1) {
            barColor = topGradient[top.findIndex(t => t.country === d.country)];
          } else if (bottom.findIndex(b => b.country === d.country) !== -1) {
            barColor = bottomGradient[bottom.findIndex(b => b.country === d.country)];
          }

          return (
            <div key={d.country} className="flex items-center gap-2">
              <span
                className={`w-12 text-sm ${isSelected ? "text-gray-900 font-semibold" : "text-gray-600"}`}
              >
                {d.country}
              </span>

              <div className="flex-1 bg-gray-100 h-3 rounded-full">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((d.avgGrowth ?? 0) * 10, 100)}%`, backgroundColor: barColor }}
                />
              </div>

              <span
                className={`w-10 text-right text-xs ${isSelected ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                {d.avgGrowth?.toFixed(2) ?? "N/A"}%
              </span>
            </div>
          );
        })}
      </div>

      {selected && (
        <p className="text-xs text-gray-500 mt-3">
          {selectedCountry} is ranked{" "}
          <span className="font-semibold">{sortedData.findIndex(d => d.country === selectedCountry) + 1}</span> of{" "}
          {sortedData.length} for avg HPI growth.
        </p>
      )}
    </div>
  );
}