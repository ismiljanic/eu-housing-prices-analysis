export interface ECBImpactResult {
  preECB: number | null;
  postECB: number | null;
  delta: number | null;
}

export function computeECBImpact(
  data: any[],
  ecbPivotYear = 2022,
  ecbPivotQuarter = 3
): ECBImpactResult {

  const isPostECB = (d: any) =>
    d.year > ecbPivotYear ||
    (d.year === ecbPivotYear && d.quarter >= ecbPivotQuarter);

  const pre = data.filter(d => !isPostECB(d) && d.hpi_qoq_change != null);
  const post = data.filter(d => isPostECB(d) && d.hpi_qoq_change != null);

  const avg = (arr: any[]) =>
    arr.length ? arr.reduce((s, d) => s + d.hpi_qoq_change, 0) / arr.length : null;

  const preECB = avg(pre);
  const postECB = avg(post);

  return {
    preECB,
    postECB,
    delta:
      preECB != null && postECB != null
        ? postECB - preECB
        : null
  };
}
