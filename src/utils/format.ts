export const number = (value: number | null | undefined, decimals = 0) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);

export const money = (value: number | null | undefined, decimals = 2) =>
  `S/ ${number(value, decimals)}`;

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.map(quote).join(","), ...rows.map((row) => headers.map((key) => quote(row[key])).join(","))].join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
