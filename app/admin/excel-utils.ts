import ExcelJS from "exceljs";

const COLORS = {
  primary: "FF059669",
  dark: "FF374151",
  required: "FFDC2626",
  lightBg: "FFECFDF5",
  altRow: "FFF9FAFB",
  border: "FFD1D5DB",
  cellBorder: "FFE5E7EB",
} as const;

export type StyledColumn = {
  header: string;
  key: string;
  width?: number;
  required?: boolean;
  numFmt?: string;
  align?: "left" | "center" | "right";
};

function applyHeader(cell: ExcelJS.Cell, color: string) {
  cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } },
  };
}

function applyDataCell(
  cell: ExcelJS.Cell,
  opts: { alt?: boolean; align?: "left" | "center" | "right" } = {},
) {
  cell.font = { name: "Calibri", size: 10 };
  cell.alignment = { vertical: "middle", horizontal: opts.align ?? "left", wrapText: true };
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.cellBorder } },
    left: { style: "thin", color: { argb: COLORS.cellBorder } },
    bottom: { style: "thin", color: { argb: COLORS.cellBorder } },
    right: { style: "thin", color: { argb: COLORS.cellBorder } },
  };
  if (opts.alt) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.altRow } };
  }
}

export async function buildStyledWorkbook(opts: {
  sheetName: string;
  title: string;
  subtitle?: string;
  columns: StyledColumn[];
  rows: Record<string, any>[];
  emptyData?: boolean;
  extraSheets?: { name: string; columns: StyledColumn[]; rows: Record<string, any>[] }[];
}) {
  const { sheetName, title, subtitle, columns, rows, emptyData, extraSheets } = opts;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DUA Edu";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  const colCount = Math.max(columns.length, 1);

  // Row 1 — title
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
  sheet.getRow(1).height = 30;

  // Row 2 — subtitle / instructions
  sheet.mergeCells(2, 1, 2, colCount);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle ?? "";
  subtitleCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF374151" } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.lightBg } };
  sheet.getRow(2).height = subtitle ? 32 : 16;

  // Row 4 — header (importExcel reads from this row)
  const headerRow = sheet.getRow(4);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    applyHeader(cell, col.required ? COLORS.required : COLORS.dark);
  });
  headerRow.height = 28;

  // Data rows from row 5
  if (!emptyData) {
    rows.forEach((row, dataIdx) => {
      const excelRow = sheet.getRow(5 + dataIdx);
      columns.forEach((col, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        const val = row[col.key];
        if (val instanceof Date) {
          cell.value = val;
          cell.numFmt = col.numFmt ?? "dd/mm/yyyy hh:mm";
        } else if (val && typeof val === "string" && val.includes("T") && val.endsWith("Z")) {
          cell.value = new Date(val);
          cell.numFmt = col.numFmt ?? "dd/mm/yyyy hh:mm";
        } else {
          cell.value = val ?? "";
          if (col.numFmt) cell.numFmt = col.numFmt;
        }
        applyDataCell(cell, { alt: dataIdx % 2 === 1, align: col.align });
      });
    });
  }

  // Column widths
  columns.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = col.width ?? Math.max(col.header.length + 4, 16);
  });

  // Extra sheets (e.g., field guide)
  if (extraSheets) {
    extraSheets.forEach((extra) => {
      const s = workbook.addWorksheet(extra.name.slice(0, 31));
      extra.columns.forEach((col, idx) => {
        const cell = s.getRow(1).getCell(idx + 1);
        cell.value = col.header;
        applyHeader(cell, COLORS.primary);
        s.getColumn(idx + 1).width = col.width ?? Math.max(col.header.length + 4, 16);
      });
      s.getRow(1).height = 24;
      extra.rows.forEach((row, idx) => {
        const r = s.getRow(idx + 2);
        extra.columns.forEach((col, colIdx) => {
          const cell = r.getCell(colIdx + 1);
          cell.value = row[col.key] ?? "";
          applyDataCell(cell, { alt: idx % 2 === 1, align: col.align });
        });
      });
    });
  }

  return workbook;
}

export async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
