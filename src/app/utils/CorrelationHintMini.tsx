import * as d3 from "d3";
import { pearson } from "../analysis/correlations";

const cardBase = "bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md";

interface CorrelationHintMiniProps {
    data: any[];
    selectedCountry: string;
}

export function CorrelationHintMini({ data, selectedCountry }: CorrelationHintMiniProps) {
    const validPairs = data
        .map(d => ({
            year: d.year,
            hpi: d.hpi_qoq_change,
            rate: d.interest_rate_qoq_change
        }))
        .filter(d => typeof d.hpi === "number" && typeof d.rate === "number" && typeof d.year === "number");

    const hpi = validPairs.map(d => d.hpi);
    const rates = validPairs.map(d => d.rate);

    const years = validPairs.map(d => d.year);
    const minYear = years.length ? Math.min(...years) : null;
    const maxYear = years.length ? Math.max(...years) : null;

    const corr = hpi.length > 1 ? pearson(hpi, rates) : null;

    const trendColor = corr !== null ? (corr > 0 ? "text-red-600" : "text-green-600") : "text-gray-400";
    const trendLabel = corr !== null ? (corr > 0 ? "Positive" : "Negative") : "N/A";

    const selectedData = data.find(d => d.country === selectedCountry);
    const selectedCorr = selectedData
        ? selectedData.hpi_qoq_change! * selectedData.interest_rate_qoq_change! > 0
            ? "Positive"
            : "Negative"
        : null;
    const comparisonColor = selectedCorr === trendLabel ? "text-green-600" : "text-red-600";

    return (
        <div className={`${cardBase} min-h-[250px] flex flex-col justify-between`}>

            {/* Header / Title */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Rate ↔ HPI Correlation — {selectedCountry}
                </h3>

                {/* Main Metric */}
                <p className={`text-2xl font-bold ${trendColor} mb-1`}>
                    {trendLabel} {corr !== null && `(${corr.toFixed(2)})`}
                </p>

                {/* Explanation / Supporting Context */}
                <p className="text-xs text-gray-500 mb-3">
                    <strong>Interpretation:</strong>  
                    {corr !== null 
                        ? ` Across ${minYear}-${maxYear}, the correlation of HPI changes and interest rate changes is ${corr.toFixed(2)}. ` +
                          `Positive correlation (red) indicates housing prices tend to rise when rates rise — potential overheating. ` +
                          `Negative correlation (green) indicates housing prices tend to rise while rates fall — more controlled, stabilizing trend.`
                        : "Not enough data to calculate correlation."}
                </p>
            </div>

            {/* Comparison Section */}
            {selectedData && selectedCorr && (
                <div className="bg-gray-50 rounded-md p-2 text-s">
                    <p>
                        <span className="font-semibold">{selectedCountry}</span>'s trend
                        <span className={`${comparisonColor} font-bold ml-1`}>
                            {selectedCorr === trendLabel ? "aligns ↑" : "diverges ↓"}
                        </span>
                        the EU average.
                    </p>
                </div>
            )}

        </div>
    );
}