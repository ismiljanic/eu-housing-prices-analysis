const cardBase =
  "bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md";

interface ECBImpactMiniProps {
  pre: number | null;
  post: number | null;
  delta: number | null;
  selectedCountry: string;
  yearRange: [number, number];
}

export function ECBImpactMini({ pre, post, delta, selectedCountry, yearRange }: ECBImpactMiniProps) {
  const deltaColor =
    delta != null
      ? delta > 0
        ? "text-red-600"
        : "text-green-600"
      : "text-gray-900";

  const preColor = pre != null && post != null ? "text-gray-700" : "text-gray-700";
  const postColor =
    post != null
      ? delta! > 0
        ? "text-red-600"
        : "text-green-600"
      : "text-gray-700";

  const preDesc = `Pre-ECB describes the average quarterly HPI change in ${selectedCountry} before ECB tightening`;
  const postDesc = `Post-ECB describes the average quarterly HPI change in ${selectedCountry} after ECB tightening`;
  const deltaDesc =
    delta != null
      ? delta > 0
        ? "HPI accelerated post-ECB — potential overheating risk"
        : "HPI slowed post-ECB — cooling effect"
      : "Insufficient data to interpret impact";

  const insightBg =
    delta != null
      ? delta > 0
        ? "bg-red-50 text-red-600"
        : "bg-green-50 text-green-600"
      : "bg-gray-50 text-gray-400";

  return (
    <div className={`${cardBase} min-h-[250px] flex flex-col justify-between`}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          ECB Tightening Impact — {selectedCountry}
        </h3>

        {/* Values */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Pre-ECB</span>
            <span className={preColor}>{pre?.toFixed(2) ?? "N/A"}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Post-ECB</span>
            <span className={postColor}>{post?.toFixed(2) ?? "N/A"}%</span>
          </div>
          <div className={`text-sm font-bold mt-1 ${deltaColor}`}>
            Δ Change: {delta?.toFixed(2) ?? "N/A"}%
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-xs text-gray-500 mt-3 space-y-1">
          <p>
            <strong>Interpretation:</strong> Across {yearRange[0]}-{yearRange[1]}, {preDesc}.
          </p>
          <p>{postDesc}.</p>
        </div>
      </div>
      {/* Color-coded insight */}
      {delta != null && (
        <div className={`rounded-md p-2 text-s mt-2 ${insightBg}`}>
          <p>
            Current impact: <span className="font-semibold">{deltaDesc}</span>.
          </p>
        </div>
      )}
    </div>
  );
}