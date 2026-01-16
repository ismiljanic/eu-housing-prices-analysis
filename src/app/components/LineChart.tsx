import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTooltip } from "../utils/Tooltip";

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

    const margin = { top: 40, right: 30, bottom: 30, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const fontSize = Math.max(12, containerWidth * 0.012);
    const circleRadius = Math.max(3, containerWidth * 0.006);
    const lineWidth = Math.max(1, containerWidth * 0.002);

    const filteredData = data.filter(d => d.country === country);
    if (!filteredData.length) return;

    const parseDate = d3.timeParse("%Y-Q%q");
    filteredData.forEach(d => d.date = parseDate(d.year + "-" + d.quarter));

    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(filteredData, d => d.hpi) * 0.95, d3.max(filteredData, d => d.hpi) * 1.05])
      .range([height, 0]);

    const xAxis = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));

    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    xAxis.selectAll("text").style("font-size", fontSize);
    yAxis.selectAll("text").style("font-size", fontSize);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""))
      .attr("opacity", 0.1);

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.hpi));

    const lineDuration = 1200;

    const path = g.selectAll(".line-path").data([filteredData]);

    path.join(
      enter => enter.append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", lineWidth)
        .attr("d", line)
        .each(function () {
          const totalLength = (this as SVGPathElement).getTotalLength();
          d3.select(this)
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(lineDuration)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", () => {
              g.selectAll(".data-circle")
                .transition()
                .duration(800)
                .attr("r", circleRadius);
            });
        }),
      update => update
        .attr("d", line)
        .each(function () {
          const totalLength = (this as SVGPathElement).getTotalLength();
          d3.select(this)
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(lineDuration)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", () => {
              g.selectAll(".data-circle")
                .transition()
                .duration(800)
                .attr("r", circleRadius);
            });
        })
    );

    const tooltip = getTooltip("line-tooltip");
    const circles = g.selectAll(".data-circle").data(filteredData);

    circles.join(
      enter => enter.append("circle")
        .attr("class", "data-circle")
        .attr("r", 0)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.hpi))
        .attr("fill", "steelblue"),
      update => update
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.hpi))
        .attr("r", 0)
    );

    circles.on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`<strong>${d.year} ${d.quarter}</strong><br>HPI: ${d.hpi.toFixed(2)}`)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY + 12}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left + width / 2 - 40}, ${margin.top / 2})`);

    legend.append("rect").attr("width", 12).attr("height", 12).attr("fill", "steelblue");
    legend.append("text").attr("x", 18).attr("y", 10).style("font-size", fontSize).text("HPI");

  }, [country, data, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  return <div ref={containerRef} className="w-full h-full"><svg ref={svgRef}></svg></div>;
}