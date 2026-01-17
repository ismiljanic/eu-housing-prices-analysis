export function addChanges(data: any[]) {
  return data.map((d, i, arr) => {
    const prevQ = arr[i - 1];
    const prevY = arr.find(
      x => x.country === d.country &&
           x.year === d.year - 1 &&
           x.quarter === d.quarter
    );

    return {
      ...d,
      qoq: prevQ ? d.hpi - prevQ.hpi : null,
      yoy: prevY ? d.hpi - prevY.hpi : null
    };
  });
}