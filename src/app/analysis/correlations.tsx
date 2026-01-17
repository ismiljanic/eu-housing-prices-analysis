import * as d3 from "d3";

export function pearson(x: number[], y: number[]) {
  const mx = d3.mean(x);
  const my = d3.mean(y);

  return d3.sum(x.map((xi, i) => (xi - mx) * (y[i] - my))) /
    Math.sqrt(
      d3.sum(x.map(xi => (xi - mx) ** 2)) *
      d3.sum(y.map(yi => (yi - my) ** 2))
    );
}