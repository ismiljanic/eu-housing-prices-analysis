import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTooltip } from "../utils/Tooltip";

interface MapProps {
  data: any[];
  selectedCountry: string;
  onCountrySelect: (country: string) => void;
  className?: string;
}

export default function ChoroplethMap({
  data,
  selectedCountry,
  onCountrySelect,
  className
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

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

    const valueByCountry = d3.rollup(
      data,
      v => d3.mean(v, d => d.hpi),
      d => d.country
    );

    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(Array.from(valueByCountry.values())) as [number, number]);

    const tooltip = getTooltip("tooltip");

    d3.json("/data/europe.json").then((geoData: any) => {
      const countries = g.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", "#eee")
        .attr("stroke", "#666")
        .attr("stroke-width", 0.6)
        .style("cursor", d => valueByCountry.has(d.properties.iso_a2) ? "pointer" : "default")
        .on("click", (_, d: any) => {
          if (valueByCountry.has(d.properties.iso_a2)) {
            onCountrySelect(d.properties.iso_a2);
          }
        })
        .on("mouseover", (event, d: any) => {
          const v = valueByCountry.get(d.properties.iso_a2);
          tooltip
            .style("opacity", 1)
            .html(`<strong>${d.properties.name}</strong><br/>HPI: ${v ? v.toFixed(1) : "N/A"}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mousemove", event => {
          tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      countries.each(function () {
        const totalLength = (this as SVGPathElement).getTotalLength();
        d3.select(this)
          .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
          .attr("stroke-dashoffset", totalLength);
      });

      countries.transition()
        .duration(1000)
        .delay((d, i) => i * 15)
        .attr("stroke-dashoffset", 0)
        .on("end", function (d) {
          const v = valueByCountry.get(d.properties.iso_a2);
          d3.select(this)
            .transition()
            .duration(800)
            .attr("fill", v ? color(v) : "#eee")
            .attr("stroke", d.properties.iso_a2 === selectedCountry ? "#111" : "#666")
            .attr("stroke-width", d.properties.iso_a2 === selectedCountry ? 2.5 : 0.6)
            .attr("filter", d.properties.iso_a2 === selectedCountry ? "url(#glow)" : null)
            .attr("transform", d.properties.iso_a2 === selectedCountry ? "scale(1.03)" : "scale(1)")
            .attr("transform-origin", () => {
              const centroid = path.centroid(d as any);
              return `${centroid[0]}px ${centroid[1]}px`;
            });
        });

      countries.filter(d => d.properties.iso_a2 === selectedCountry)
        .transition()
        .duration(3000)
        .attr("fill", d => {
          const v = valueByCountry.get(d.properties.iso_a2);
          return v
            ? d3.interpolateReds(0.7 + 0.3 * (v / d3.max(Array.from(valueByCountry.values()))!))
            : "#ff6666";
        })
        .attr("stroke", "#111")
        .attr("stroke-width", 3)
        .attr("filter", "url(#glow)")
        .attr("transform", "scale(1.03)")
        .attr("transform-origin", d => {
          const centroid = path.centroid(d as any);
          return `${centroid[0]}px ${centroid[1]}px`;
        });

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 6])
        .on("zoom", event => g.attr("transform", event.transform));

      svg.call(zoom as any);
    });
  }, [data, selectedCountry]);

  return <div ref={containerRef} className={`w-full h-full ${className || ""}`}><svg ref={svgRef}></svg></div>;
}