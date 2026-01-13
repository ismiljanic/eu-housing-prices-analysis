import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface ScatterProps {
  country: string;
  data: any[];
}

export default function ScatterPlot({ country, data }: ScatterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !country || !containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const filteredData = data.filter(d =>
      d.country === country &&
      d.hpi_qoq_change != null && !isNaN(d.hpi_qoq_change) &&
      d.interest_rate_qoq_change != null && !isNaN(d.interest_rate_qoq_change)
    );
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", containerHeight);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (!filteredData.length) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("No data for this country");
      return;
    }

    const x = d3.scaleLinear().domain(d3.extent(filteredData, d => +d.interest_rate_qoq_change) as [number, number]).range([0, width]);
    const y = d3.scaleLinear().domain(d3.extent(filteredData, d => +d.hpi_qoq_change) as [number, number]).range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "5px 10px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    g.selectAll("circle")
      .data(filteredData)
      .join("circle")
      .attr("cx", d => x(+d.interest_rate_qoq_change))
      .attr("cy", d => y(+d.hpi_qoq_change))
      .attr("r", 4)
      .attr("fill", "steelblue")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`HPI QoQ: ${(+d.hpi_qoq_change).toFixed(2)}<br>Rate QoQ: ${(+d.interest_rate_qoq_change).toFixed(2)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

  }, [country, data, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  return <div ref={containerRef} className="w-full h-full"><svg ref={svgRef}></svg></div>;
}