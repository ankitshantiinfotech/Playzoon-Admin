import { format } from "date-fns";

export type ExportFormat = "csv" | "xls" | "pdf" | "txt" | "sql";

export const EXPORT_FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: "csv", label: "CSV" },
  { id: "xls", label: "XLS" },
  { id: "pdf", label: "PDF" },
  { id: "txt", label: "TXT" },
  { id: "sql", label: "SQL" },
];

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCsvCell(s: string): string {
  const v = String(s ?? "");
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function rowsToCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map((c) => escapeCsvCell(c ?? "")).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

export function rowsToTxt(headers: string[], rows: string[][]): string {
  const sep = "  |  ";
  let out = headers.join(sep) + "\n";
  out += "-".repeat(Math.min(100, out.length)) + "\n";
  for (const row of rows) {
    out += row.map((c, i) => String(c ?? "").padEnd(Math.max(8, (headers[i]?.length ?? 8) + 2))).join(sep) + "\n";
  }
  return out;
}

export function rowsToSpreadsheetML(headers: string[], rows: string[][]): string {
  const esc = escapeXml;
  let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>\n`;
  xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`;
  xml += `<Worksheet ss:Name="Export"><Table>`;
  xml += `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>`;
  for (const row of rows) {
    xml += `<Row>${row.map((c) => `<Cell><Data ss:Type="String">${esc(String(c ?? ""))}</Data></Cell>`).join("")}</Row>`;
  }
  xml += `</Table></Worksheet></Workbook>`;
  return xml;
}

export function rowsToSql(tableName: string, headers: string[], rows: string[][]): string {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "_") || "export";
  const cols = headers.map((h) => `\`${String(h).replace(/`/g, "")}\``).join(", ");
  const lines: string[] = [`-- Export: ${safeTable}`, ""];
  for (const row of rows) {
    const vals = row.map((v) => {
      if (v === null || v === undefined || v === "") return "NULL";
      return "'" + String(v).replace(/'/g, "''") + "'";
    });
    lines.push(`INSERT INTO \`${safeTable}\` (${cols}) VALUES (${vals.join(", ")});`);
  }
  return lines.join("\n");
}

function sanitizeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/^_|_$/g, "").slice(0, 64) || "export";
}

export async function exportTable(options: {
  format: ExportFormat;
  filenamePrefix: string;
  sqlTableName: string;
  pdfTitle: string;
  headers: string[];
  rows: string[][];
}): Promise<void> {
  const { format: fmt, filenamePrefix, sqlTableName, pdfTitle, headers, rows } = options;
  const stamp = format(new Date(), "yyyy-MM-dd-HHmm");
  const base = sanitizeFilename(filenamePrefix);

  switch (fmt) {
    case "csv":
      downloadBlob(rowsToCsv(headers, rows), `${base}-${stamp}.csv`, "text/csv;charset=utf-8");
      return;
    case "xls":
      downloadBlob(
        rowsToSpreadsheetML(headers, rows),
        `${base}-${stamp}.xls`,
        "application/vnd.ms-excel",
      );
      return;
    case "txt":
      downloadBlob(rowsToTxt(headers, rows), `${base}-${stamp}.txt`, "text/plain;charset=utf-8");
      return;
    case "sql":
      downloadBlob(rowsToSql(sqlTableName, headers, rows), `${base}-${stamp}.sql`, "text/plain;charset=utf-8");
      return;
    case "pdf": {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({
        orientation: rows.length > 25 ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });
      doc.setFontSize(11);
      doc.text(pdfTitle, 14, 14);
      autoTable(doc, {
        startY: 20,
        head: [headers],
        body: rows,
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [0, 59, 149] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`${base}-${stamp}.pdf`);
      return;
    }
    default:
      return;
  }
}
