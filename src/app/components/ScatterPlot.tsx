import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTooltip } from "../utils/Tooltip";

interface ScatterProps {
  country: string;
  data: any[];
  className?: string;
}

export default function ScatterPlot({ country, data, className }: ScatterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !country || !containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    const fontSize = Math.max(12, containerWidth * 0.012);
    const marginScale = 0.7;
    const margin = {
      top: containerHeight * 0.05,
      right: containerWidth * 0.07,
      bottom: containerHeight * 0.08,
      left: containerWidth * 0.08
    };

    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const circleRadius = Math.max(4, containerWidth * 0.008);
    const lineWidth = Math.max(1.2, containerWidth * 0.003);


    const filteredData = data.filter(d =>
      d.country === country &&
      d.hpi_qoq_change != null && !isNaN(d.hpi_qoq_change) &&
      d.interest_rate_qoq_change != null && !isNaN(d.interest_rate_qoq_change)
    );

    const svg = d3.select(svgRef.current).attr("width", containerWidth).attr("height", containerHeight);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (!filteredData.length) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", fontSize)
        .text("No data for this country");
      return;
    }

    const x = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => +d.interest_rate_qoq_change) as [number, number])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => +d.hpi_qoq_change) as [number, number])
      .range([height, 0]);

    g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", height).attr("stroke", "#aaa").attr("stroke-width", lineWidth).attr("stroke-dasharray", "3 3");
    g.append("line").attr("y1", y(0)).attr("y2", y(0)).attr("x1", 0).attr("x2", width).attr("stroke", "#aaa").attr("stroke-width", lineWidth).attr("stroke-dasharray", "3 3");

    const tooltip = getTooltip("scatter-tooltip");

    const points = g.selectAll<SVGCircleElement, any>(".scatter-circle").data(filteredData);

    const xAxis = g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text").style("font-size", `${fontSize}px`);

    const yAxis = g.append("g")
      .call(d3.axisLeft(y));

    yAxis.selectAll("text").style("font-size", `${fontSize}px`);

    xAxis.append("text")
      .attr("x", width / 2)
      .attr("y", fontSize)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("font-size", `${fontSize}px`)

    yAxis.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -5)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("font-size", `${fontSize}px`);

    points.join(
      enter => {
        const c = enter.append("circle")
          .attr("class", "scatter-circle")
          .attr("r", 0)
          .attr("cx", d => x(+d.interest_rate_qoq_change))
          .attr("cy", d => y(+d.hpi_qoq_change))
          .attr("fill", "steelblue")
          .attr("opacity", 0.6)
          .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
              .html(`<strong>${d.year} ${d.quarter}</strong><br>HPI QoQ: ${(+d.hpi_qoq_change).toFixed(2)}<br>Rate QoQ: ${(+d.interest_rate_qoq_change).toFixed(2)}`);
          })
          .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 12}px`)
              .style("top", `${event.pageY + 12}px`);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));

        c.transition().duration(800).attr("r", circleRadius);
        return c;
      },
      update => {
        update.transition().duration(800)
          .attr("cx", d => x(+d.interest_rate_qoq_change))
          .attr("cy", d => y(+d.hpi_qoq_change))
          .attr("r", circleRadius);
        return update;
      }
    );

    // Legend
    const legend = svg.append("g").attr("transform", `translate(${margin.left + width / 2 - 40}, ${margin.top / 2})`);
    legend.append("rect").attr("width", 12).attr("height", 12).attr("fill", "steelblue");
    legend.append("text").attr("x", 18).attr("y", 10).style("font-size", fontSize).text("HPI vs Rate Change");

  }, [country, data, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  return <div ref={containerRef} className={`w-full h-full ${className || ""}`}><svg ref={svgRef}></svg></div>;
}