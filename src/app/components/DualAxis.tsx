import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTooltip } from "../utils/Tooltip";

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
    const margin = {
      top: containerHeight * 0.05,
      right: containerWidth * 0.07,
      bottom: containerHeight * 0.08,
      left: containerWidth * 0.08
    };

    const fontSize = Math.max(12, containerWidth * 0.012);
    const lineWidth = Math.max(2, containerWidth * 0.003);
    const circleRadius = Math.max(3, containerWidth * 0.006);
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
      .domain([d3.min(filteredData, d => d.hpi) * 0.95, d3.max(filteredData, d => d.hpi) * 1.05])
      .range([height, 0]);
    const yRight = d3.scaleLinear()
      .domain([d3.min(filteredData, d => d.interest_rate) * 1.1, d3.max(filteredData, d => d.interest_rate) * 1.1])
      .range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(yLeft));
    g.append("g").attr("transform", `translate(${width},0)`).call(d3.axisRight(yRight));

    const lineHPI = d3.line().x(d => x(d.date)).y(d => yLeft(d.hpi));
    const lineRate = d3.line().x(d => x(d.date)).y(d => yRight(d.interest_rate));

    const tooltip = getTooltip("dualAxis");

    function animateLine(path: d3.Selection<SVGPathElement, any, SVGGElement, unknown>, duration: number) {
      const totalLength = path.node()!.getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }

    const lineDuration = 1200;

    const hpiPath = g.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", lineWidth)
      .attr("d", lineHPI);

    const ratePath = g.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", lineWidth)
      .attr("d", lineRate);

    animateLine(hpiPath, lineDuration);
    animateLine(ratePath, lineDuration);

    const hpiCircles = g.selectAll(".hpi-circle")
      .data(filteredData)
      .join("circle")
      .attr("class", "hpi-circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => yLeft(d.hpi))
      .attr("r", 0)
      .attr("fill", "steelblue")
      .attr("opacity", 0.5);

    const rateCircles = g.selectAll(".rate-circle")
      .data(filteredData)
      .join("circle")
      .attr("class", "rate-circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => yRight(d.interest_rate))
      .attr("r", 0)
      .attr("fill", "orange")
      .attr("opacity", 0.5);

    setTimeout(() => {
      hpiCircles.transition().duration(800).attr("r", circleRadius);
      rateCircles.transition().duration(800).attr("r", circleRadius);
    }, lineDuration);

    hpiCircles.on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`<strong>${d.year} ${d.quarter}</strong><br>HPI: ${d.hpi.toFixed(2)}`)
        .style("left", `${event.clientX + 12}px`)
        .style("top", `${event.clientY + 12}px`);
    }).on("mousemove", (event) => {
      tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY + 12}px`);
    }).on("mouseout", () => tooltip.style("opacity", 0));

    rateCircles.on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`<strong>${d.year} ${d.quarter}</strong><br>Rate: ${d.interest_rate.toFixed(2)}%`)
        .style("left", `${event.clientX + 12}px`)
        .style("top", `${event.clientY + 12}px`);
    }).on("mousemove", (event) => {
      tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY + 12}px`);
    }).on("mouseout", () => tooltip.style("opacity", 0));

  }, [country, data, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  return <div ref={containerRef} className="w-full h-full"><svg ref={svgRef}></svg></div>;
}