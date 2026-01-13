import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DualAxisProps {
  country: string;
  data: any[];
}

export default function DualAxisChart({ country, data }: DualAxisProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !country || !containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const filteredData = data.filter(d => d.country === country);
    if (!filteredData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", containerHeight);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse("%Y-Q%q");
    filteredData.forEach(d => d.date = parseDate(d.year + "-" + d.quarter));

    const x = d3.scaleTime().domain(d3.extent(filteredData, d => d.date) as [Date, Date]).range([0, width]);
    const yLeft = d3.scaleLinear()
      .domain([
        d3.min(filteredData, d => d.hpi) * 0.95,
        d3.max(filteredData, d => d.hpi) * 1.05
      ])
      .range([height, 0]);

    const yRight = d3.scaleLinear()
      .domain([
        d3.min(filteredData, d => d.interest_rate) * 1.1,
        d3.max(filteredData, d => d.interest_rate) * 1.1
      ])
      .range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(yLeft));
    g.append("g").attr("transform", `translate(${width},0)`).call(d3.axisRight(yRight));

    const lineHPI = d3.line().x(d => x(d.date)).y(d => yLeft(d.hpi));
    const lineRate = d3.line().x(d => x(d.date)).y(d => yRight(d.interest_rate));

    g.append("path").datum(filteredData).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2).attr("d", lineHPI);
    g.append("path").datum(filteredData).attr("fill", "none").attr("stroke", "orange").attr("stroke-width", 2).attr("d", lineRate);

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
      .attr("cx", d => x(d.date))
      .attr("cy", d => yLeft(d.hpi))
      .attr("r", 4)
      .attr("fill", "transparent")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Date: ${d.year}-${d.quarter}<br>HPI: ${d.hpi.toFixed(2)}<br>Rate: ${d.interest_rate.toFixed(2)}`)
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