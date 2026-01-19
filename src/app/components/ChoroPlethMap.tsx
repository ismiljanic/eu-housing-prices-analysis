import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTooltip } from "../utils/Tooltip";

interface MapProps {
  data: any[];
  selectedCountry: string;
  onCountrySelect: (country: string) => void;
  className?: string;
  isoToName?: Record<string, string>;
}

export default function ChoroplethMap({
  data,
  selectedCountry,
  onCountrySelect,
  className,
  isoToName = {}
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const nameToIso = Object.fromEntries(Object.entries(isoToName).map(([iso, name]) => [name, iso]));

  const getCountryCode = (properties: any) => {
    return properties.iso_a2_eh || properties.wb_a2 || properties.fips_10 || properties.iso_a2;
  };

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    d3.selectAll(".tooltip").remove();

    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const defs = svg.append("defs");
    const glow = defs.append("filter").attr("id", "glow");
    glow.append("feGaussianBlur")
      .attr("stdDeviation", 4)
      .attr("result", "coloredBlur");
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const projection = d3.geoMercator()
      .center([10, 50])
      .scale(width / 1.4)
      .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
    const g = svg.append("g");

    const hpiGrowthByCountry = d3.rollup(
      data,
      v => {
        const sorted = v.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sorted.length < 2) return undefined;

        const last = +sorted[sorted.length - 1].hpi;
        const prev = +sorted[sorted.length - 2].hpi;
        if (isNaN(last) || isNaN(prev) || prev === 0) return undefined;
        return ((last - prev) / prev) * 100;
      },
      d => d.countryName
    );

    const inflationByCountry = d3.rollup(
      data,
      v => d3.mean(v, d => {
        const inf = +d.inflation;
        return isNaN(inf) ? undefined : inf;
      }),
      d => d.countryName
    );

    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(Array.from(hpiGrowthByCountry.values())) as [number, number]);


    const tooltip = getTooltip("tooltip");

    d3.json("/data/europe.json").then((geoData: any) => {
      const countries = g.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", "#eee")
        .attr("stroke", "#666")
        .attr("stroke-width", 0.6)
        .style("cursor", d => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          return hpiGrowthByCountry.has(name) ? "pointer" : "default";
        })
        .on("click", (_, d: any) => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          if (hpiGrowthByCountry.has(name)) {
            onCountrySelect(name);
          }
        })
        .on("mouseover", (event, d: any) => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          const hpiGrowth = hpiGrowthByCountry.get(name);
          const inflation = inflationByCountry.get(name);
          tooltip
            .style("opacity", 1)
            .html(`<strong>${name || d.properties.name}</strong><br/>
       HPI Growth: ${hpiGrowth != null ? hpiGrowth.toFixed(2) + "%" : "N/A"}<br/>
       Inflation: ${inflation != null ? inflation.toFixed(1) + "%" : "N/A"}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", event => {
          tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      countries.transition()
        .duration(1000)
        .attr("fill", d => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          const v = hpiGrowthByCountry.get(name);
          return name === selectedCountry
            ? d3.interpolateReds(0.7 + 0.3 * ((v || 0) / d3.max(Array.from(hpiGrowthByCountry.values()))!))
            : v
              ? color(v)
              : "#eee";
        })
        .attr("stroke", d => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          return name === selectedCountry ? "#111" : "#666";
        })
        .attr("stroke-width", d => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          return name === selectedCountry ? 2.5 : 0.6;
        })
        .attr("filter", d => {
          const code = getCountryCode(d.properties);
          const name = isoToName[code];
          return name === selectedCountry ? "url(#glow)" : null;
        });

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 6])
        .on("zoom", event => g.attr("transform", event.transform));

      svg.call(zoom as any);
    });
  }, [data, selectedCountry, isoToName]);

  return <div ref={containerRef} className={`w-full h-full ${className || ""}`}><svg ref={svgRef}></svg></div>;
}