import type { Selection } from "d3-selection";
import * as d3 from "d3";

export function getTooltip(className: string) {
  let tooltip: Selection<HTMLDivElement, unknown, HTMLElement, any> =
    d3.select<HTMLDivElement, unknown>(`.${className}`);

  if (tooltip.empty()) {
    tooltip = d3
      .select("body")
      .append<HTMLDivElement>("div")
      .attr("class", className)
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
  }

  return tooltip;
}