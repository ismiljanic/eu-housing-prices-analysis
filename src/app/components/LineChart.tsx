import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface LineChartProps {
  country: string;
  data: any[];
}

export default function LineChart({ country, data }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !country || !containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    const margin = { top: 20, right: 30, bottom: 30, left: 50 },
      width = containerWidth - margin.left - margin.right,
      height = containerHeight - margin.top - margin.bottom;

    const filteredData = data.filter(d => d.country === country);
    if (!filteredData.length) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse("%Y-Q%q");
    filteredData.forEach(d => d.date = parseDate(d.year + "-" + d.quarter));

    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(filteredData, d => d.hpi) * 0.95, d3.max(filteredData, d => d.hpi) * 1.05])
      .range([height, 0]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5));
    svg.append("g").call(d3.axisLeft(y));

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.hpi));

    svg.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "5px 10px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    svg.selectAll("circle")
      .data(filteredData)
      .join("circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.hpi))
      .attr("r", 4)
      .attr("fill", "transparent")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Date: ${d.year}-${d.quarter}<br>HPI: ${d.hpi.toFixed(2)}<br>Interest: ${d.interest_rate?.toFixed(2) || 'N/A'}`)
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