function escapeCell(value: unknown) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Neutralize spreadsheet formula injection (OWASP): prefix risky leading chars.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}


export function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

export function downloadCsv(name: string, headers: string[], rows: unknown[][]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob(["\ufeff" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `swapspace-${name}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
