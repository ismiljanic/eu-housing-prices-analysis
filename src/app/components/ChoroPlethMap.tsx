import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface MapProps {
  country?: string;
}

export default function ChoroplethMap({ country }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", containerHeight);

    const projection = d3.geoMercator()
      .center([10, 50])
      .scale(containerWidth / 1.5)
      .translate([containerWidth / 2, containerHeight / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "5px 10px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    d3.json("/data/europe.json").then((geoData: any) => {
      g.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", "#ddd")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d: any) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`Country: ${d.properties.iso_a2}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom as any);
    }).catch(err => {
      svg.append("text")
        .attr("x", containerWidth / 2)
        .attr("y", containerHeight / 2)
        .attr("text-anchor", "middle")
        .text("Map failed to load");
      console.error(err);
    });
  }, [containerRef.current]);

  return <div ref={containerRef} className="w-full h-full"><svg ref={svgRef}></svg></div>;
}