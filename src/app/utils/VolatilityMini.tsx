const cardBase =
  "bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md";

interface VolatilityMiniProps {
  volatility?: number | null;
  country: string;
  euAverage?: number | null;
  yearRange: [number, number];
}

export function VolatilityMini({ volatility, country, euAverage, yearRange }: VolatilityMiniProps) {
  const comparisonLabel =
    euAverage != null
      ? volatility! > euAverage
        ? "higher"
        : "lower"
      : volatility! > 5
      ? "high"
      : "moderate";

  const comparisonColor =
    comparisonLabel === "higher" || comparisonLabel === "high"
      ? "text-red-600"
      : "text-green-600";

  return (
    <div className={`${cardBase} min-h-[250px] flex flex-col justify-between`}>
      {/* Header / Title */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Volatility — {country}
        </h3>

        {/* Main Metric: color-coded */}
        <p className={`text-2xl font-bold mb-1 ${euAverage != null ? comparisonColor : "text-gray-900"}`}>
          {volatility?.toFixed(2) ?? "N/A"}
        </p>

        {/* Supporting Context */}
        <p className="text-xs text-gray-500 mb-3">
          Standard deviation of quarterly HPI growth. <br/>
          <strong>Interpretation:</strong> Across {yearRange[0]}-{yearRange[1]}, volatility measures how much housing prices fluctuated. 
          High volatility (red) indicates rapid swings in HPI — potentially risky or unstable market conditions. 
          Low volatility (green) suggests a more stable housing market.
        </p>
      </div>

      {/* Comparison / Insight Section */}
      {volatility != null && (
        <div className={`rounded-md p-2 text-s ${comparisonLabel === "higher" || comparisonLabel === "high" ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
          <p>
            {country}'s volatility is <span className="font-semibold">{comparisonLabel}</span> compared to {euAverage != null ? "EU average" : "typical benchmark"}.
          </p>
          {euAverage != null && (
            <p className="text-s mt-1">
              EU Average: <span className="font-bold">{euAverage?.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}