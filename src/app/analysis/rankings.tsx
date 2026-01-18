import * as d3 from "d3";

export function computeRankings(data: any[], yearRange?: [number, number]) {
    let filteredData = data;

    if (yearRange) {
        const [start, end] = yearRange;
        filteredData = data.filter(d => d.year >= start && d.year <= end);
    }

    const byCountry = d3.group(filteredData, d => d.countryName);

    return Array.from(byCountry, ([countryName, values]) => {
        const hpi = values.map(v => v.hpi).filter(Boolean);

        return {
            country: countryName,
            avgGrowth: d3.mean(hpi),
            volatility: d3.deviation(hpi),
            lastYearGrowth: d3.mean(
                values
                    .filter(v => v.year === Math.max(...values.map(v => v.year)))
                    .map(v => v.hpi)
            )
        };
    });
}