import * as XLSX from "xlsx";
// SheetJS dùng cho PARSE (đọc file user upload) — ổn định trong browser/Next.js.
// ExcelJS qua buildStyledWorkbook dùng cho WRITE (xuất file đẹp).
import { buildStyledWorkbook, downloadWorkbook, type StyledColumn } from "../excel-utils";

export type ParsedQuiz = {
  session_number: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  pass_pct: number;
  open_at: string | null;
  close_at: string | null;
  shuffle_questions: boolean;
  items: ParsedItem[];
};

export type ParsedItem = {
  order: number;
  content: string;
  options: string[];
  correct_indices: number[];
  explanation: string;
};

const QUIZ_COLUMNS: StyledColumn[] = [
  { header: "Buổi", key: "session", width: 8, required: true, align: "center" },
  { header: "Tiêu đề", key: "title", width: 36, required: true },
  { header: "Mô tả", key: "description", width: 38 },
  { header: "Thời gian (phút)", key: "time_limit", width: 16, align: "center", numFmt: "0" },
  { header: "Đạt khi (%)", key: "pass_pct", width: 12, align: "center", numFmt: "0" },
  { header: "Mở từ", key: "open_at", width: 18, align: "center", numFmt: "dd/mm/yyyy hh:mm" },
  { header: "Đóng lúc", key: "close_at", width: 18, align: "center", numFmt: "dd/mm/yyyy hh:mm" },
  { header: "Đảo câu (Y/N)", key: "shuffle", width: 14, align: "center" },
];

const MAX_OPTIONS = 6;
const ITEM_COLUMNS: StyledColumn[] = [
  { header: "Buổi", key: "session", width: 8, required: true, align: "center" },
  { header: "STT", key: "order", width: 6, align: "center", numFmt: "0" },
  { header: "Nội dung câu hỏi", key: "content", width: 50, required: true },
  ...Array.from({ length: MAX_OPTIONS }, (_, i) => ({
    header: `Đáp án ${String.fromCharCode(65 + i)}`,
    key: `opt_${i}`,
    width: 22,
  })),
  { header: 'Đáp án đúng (vd: A hoặc "A,C")', key: "correct", width: 18, required: true, align: "center" },
  { header: "Giải thích", key: "explanation", width: 40 },
];

const GUIDE_COLUMNS: StyledColumn[] = [
  { header: "Trường", key: "field", width: 24 },
  { header: "Bắt buộc?", key: "required", width: 12, align: "center" },
  { header: "Mô tả & ví dụ", key: "desc", width: 60 },
];

const GUIDE_ROWS = [
  { field: "Buổi", required: "Có", desc: "Số buổi học (vd 1, 2, 3, ...). Trùng số buổi giữa 2 sheet để map quiz - câu hỏi." },
  { field: "Tiêu đề", required: "Có", desc: "Tiêu đề quiz. VD: 'Quiz ôn buổi 3 - Vòng lặp'." },
  { field: "Mô tả", required: "Không", desc: "Hướng dẫn ngắn cho học viên." },
  { field: "Thời gian (phút)", required: "Không", desc: "Mặc định 15 nếu để trống. 0 = không giới hạn thời gian." },
  { field: "Đạt khi (%)", required: "Không", desc: "Mặc định 40. Học viên đúng ≥ ngưỡng này thì được chuyển vắng → có phép (+0.5 điểm chuyên cần)." },
  { field: "Mở từ / Đóng lúc", required: "Không", desc: "Định dạng dd/mm/yyyy hh:mm. Để trống = luôn mở." },
  { field: "Đảo câu (Y/N)", required: "Không", desc: "Y/Yes/TRUE = đảo thứ tự câu hỏi cho mỗi học viên. Mặc định Y." },
  { field: "Đáp án A..F", required: "Tối thiểu 2 đáp án", desc: "Nội dung từng đáp án. Để trống đáp án nào thì bỏ qua." },
  { field: "Đáp án đúng", required: "Có", desc: "Ký tự A-F. Chọn nhiều thì cách nhau bằng dấu phẩy. VD: 'A' hoặc 'A,C'." },
  { field: "Giải thích", required: "Không", desc: "Hiện cho học viên sau khi nộp bài." },
];

function toBool(v: any, dflt = true): boolean {
  if (v == null || v === "") return dflt;
  const s = String(v).trim().toLowerCase();
  if (["y", "yes", "true", "1", "có", "co", "x"].includes(s)) return true;
  if (["n", "no", "false", "0", "không", "khong"].includes(s)) return false;
  return dflt;
}

function correctIndicesToLetters(idxArr: number[]): string {
  return idxArr.slice().sort((a, b) => a - b).map((i) => String.fromCharCode(65 + i)).join(",");
}

function lettersToIndices(value: any): number[] {
  if (value == null) return [];
  return String(value)
    .split(/[,\s;]+/)
    .map((p) => p.trim().toUpperCase())
    .filter((p) => p.length > 0)
    .map((p) => p.charCodeAt(0) - 65)
    .filter((i) => i >= 0 && i < MAX_OPTIONS);
}

function readCellAsDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  if (!s) return null;
  // Try ISO
  const iso = new Date(s);
  if (!Number.isNaN(iso.getTime())) return iso;
  // Try dd/mm/yyyy hh:mm
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s*(\d{1,2})?:?(\d{1,2})?/);
  if (m) {
    const [, dd, mm, yyyy, hh = "0", mi = "0"] = m;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi));
  }
  return null;
}

export async function exportQuizzesXlsx(opts: {
  classInfo: { code: string; name: string; course?: string | null };
  quizzes: Array<{
    session_number: number;
    title: string;
    description: string | null;
    time_limit_minutes: number;
    pass_threshold: number;
    open_at: string | null;
    close_at: string | null;
    shuffle_questions: boolean;
    quiz_items: Array<{ order_index: number; content: string; options: string[]; correct_indices: number[]; explanation: string | null }>;
  }>;
}) {
  const { classInfo, quizzes } = opts;
  const subtitle = `Lớp ${classInfo.code} · ${classInfo.course ?? classInfo.name} · Tổng ${quizzes.length} quiz`;

  const sortedQuizzes = quizzes.slice().sort((a, b) => a.session_number - b.session_number);

  const quizRows = sortedQuizzes.map((q) => ({
    session: q.session_number,
    title: q.title,
    description: q.description ?? "",
    time_limit: q.time_limit_minutes,
    pass_pct: Math.round(Number(q.pass_threshold) * 100),
    open_at: q.open_at ? new Date(q.open_at) : "",
    close_at: q.close_at ? new Date(q.close_at) : "",
    shuffle: q.shuffle_questions ? "Y" : "N",
  }));

  const itemRows: Record<string, any>[] = [];
  sortedQuizzes.forEach((q) => {
    const items = (q.quiz_items ?? []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    items.forEach((it, idx) => {
      const row: Record<string, any> = {
        session: q.session_number,
        order: idx + 1,
        content: it.content,
        correct: correctIndicesToLetters(it.correct_indices ?? []),
        explanation: it.explanation ?? "",
      };
      for (let i = 0; i < MAX_OPTIONS; i++) {
        row[`opt_${i}`] = (it.options ?? [])[i] ?? "";
      }
      itemRows.push(row);
    });
  });

  const workbook = await buildStyledWorkbook({
    sheetName: "Quiz",
    title: `BỘ QUIZ - ${classInfo.code}`,
    subtitle,
    columns: QUIZ_COLUMNS,
    rows: quizRows,
    emptyData: false,
    extraSheets: [
      { name: "Câu hỏi", columns: ITEM_COLUMNS, rows: itemRows },
      { name: "Hướng dẫn", columns: GUIDE_COLUMNS, rows: GUIDE_ROWS },
    ],
  });

  const safeCode = classInfo.code.replace(/[^a-zA-Z0-9_-]+/g, "_");
  await downloadWorkbook(workbook, `Quiz_${safeCode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportQuizTemplateXlsx(opts: {
  classInfo: { code: string; name: string };
  sessionNumber?: number;
}) {
  const { classInfo, sessionNumber } = opts;
  const targetSession = sessionNumber ?? 1;
  const otherSession = sessionNumber == null ? 2 : null;

  const sampleQuiz: any[] = [
    { session: targetSession, title: `Quiz buổi ${targetSession}`, description: "Mô tả ngắn cho học viên (tùy chọn)", time_limit: 15, pass_pct: 40, open_at: "", close_at: "", shuffle: "Y" },
  ];
  const sampleItems: any[] = [
    { session: targetSession, order: 1, content: "Nội dung câu hỏi 1?", opt_0: "Đáp án A", opt_1: "Đáp án B", opt_2: "Đáp án C", opt_3: "Đáp án D", opt_4: "", opt_5: "", correct: "B", explanation: "Giải thích ngắn (tùy chọn)" },
    { session: targetSession, order: 2, content: "Câu hỏi có nhiều đáp án đúng?", opt_0: "Phương án A", opt_1: "Phương án B", opt_2: "Phương án C", opt_3: "Phương án D", opt_4: "", opt_5: "", correct: "A,C", explanation: "" },
  ];
  if (otherSession != null) {
    sampleQuiz.push({ session: otherSession, title: `Quiz buổi ${otherSession}`, description: "", time_limit: 10, pass_pct: 50, open_at: "", close_at: "", shuffle: "Y" });
    sampleItems.push({ session: otherSession, order: 1, content: "Câu hỏi ví dụ buổi 2?", opt_0: "A", opt_1: "B", opt_2: "C", opt_3: "D", opt_4: "", opt_5: "", correct: "B", explanation: "" });
  }

  const titleSuffix = sessionNumber != null ? `BUỔI ${sessionNumber}` : "TẤT CẢ BUỔI";
  const workbook = await buildStyledWorkbook({
    sheetName: "Quiz",
    title: `MẪU IMPORT QUIZ - ${classInfo.code} - ${titleSuffix}`,
    subtitle: "Điền dữ liệu theo mẫu này rồi tải lên. Sheet 'Hướng dẫn' giải thích từng cột.",
    columns: QUIZ_COLUMNS,
    rows: sampleQuiz,
    extraSheets: [
      { name: "Câu hỏi", columns: ITEM_COLUMNS, rows: sampleItems },
      { name: "Hướng dẫn", columns: GUIDE_COLUMNS, rows: GUIDE_ROWS },
    ],
  });

  const safeCode = classInfo.code.replace(/[^a-zA-Z0-9_-]+/g, "_");
  const fileSuffix = sessionNumber != null ? `_buoi-${sessionNumber}` : "";
  await downloadWorkbook(workbook, `Mau_Quiz_${safeCode}${fileSuffix}.xlsx`);
}

export async function parseQuizzesXlsx(file: File): Promise<ParsedQuiz[]> {
  const arrayBuffer = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  } catch (err: any) {
    console.error("SheetJS read error:", err);
    const detail = err?.message || String(err);
    throw new Error(
      `Không đọc được file Excel (${detail}). File phải là .xlsx hợp lệ — thử mở trong Excel/Google Sheets rồi Tải xuống lại định dạng .xlsx.`
    );
  }

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error("File Excel rỗng — không có sheet nào.");
  }

  const sheetToRows = (name: string, fallbackIdx: number): any[][] => {
    const sheetName = wb.SheetNames.find((n) => n === name) ?? wb.SheetNames[fallbackIdx];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "", blankrows: false, raw: true });
  };

  const quizRows = sheetToRows("Quiz", 0);
  const itemRows = sheetToRows("Câu hỏi", 1);

  if (quizRows.length === 0) throw new Error("Không tìm thấy dữ liệu sheet 'Quiz'.");
  if (itemRows.length === 0) throw new Error("Không tìm thấy dữ liệu sheet 'Câu hỏi'.");

  // Tìm row data đầu tiên (sau row có header "Buổi" ở cột đầu).
  const findDataStart = (rows: any[][]): number => {
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const v = rows[r]?.[0];
      if (v != null && String(v).trim().toLowerCase().startsWith("buổi")) {
        return r + 1;
      }
    }
    return 4; // fallback nếu không tìm thấy header (sheet chính có title + subtitle)
  };

  const quizStart = findDataStart(quizRows);
  const itemStart = findDataStart(itemRows);
  const quizMap = new Map<number, ParsedQuiz>();

  for (let r = quizStart; r < quizRows.length; r++) {
    const row = quizRows[r] ?? [];
    const sessionRaw = row[0];
    const titleRaw = row[1];
    if (sessionRaw == null || sessionRaw === "" || titleRaw == null || titleRaw === "") continue;
    const session_number = Number(sessionRaw);
    if (!Number.isFinite(session_number)) continue;
    const title = String(titleRaw).trim();
    if (!title) continue;
    const description = String(row[2] ?? "").trim();
    const timeRaw = row[3];
    const passRaw = row[4];
    const openRaw = row[5];
    const closeRaw = row[6];
    const shuffleRaw = row[7];
    const time_limit_minutes = timeRaw == null || timeRaw === "" ? 15 : Math.max(0, Math.floor(Number(timeRaw)));
    const pass_pct = passRaw == null || passRaw === "" ? 40 : Math.max(0, Math.min(100, Number(passRaw)));
    const openDate = readCellAsDate(openRaw);
    const closeDate = readCellAsDate(closeRaw);

    quizMap.set(session_number, {
      session_number,
      title,
      description,
      time_limit_minutes,
      pass_pct,
      open_at: openDate ? openDate.toISOString() : null,
      close_at: closeDate ? closeDate.toISOString() : null,
      shuffle_questions: toBool(shuffleRaw, true),
      items: [],
    });
  }

  for (let r = itemStart; r < itemRows.length; r++) {
    const row = itemRows[r] ?? [];
    const sessionRaw = row[0];
    const contentRaw = row[2];
    if (sessionRaw == null || sessionRaw === "" || contentRaw == null || contentRaw === "") continue;
    const session_number = Number(sessionRaw);
    if (!Number.isFinite(session_number)) continue;
    const quiz = quizMap.get(session_number);
    if (!quiz) continue;

    const orderRaw = row[1];
    const order = orderRaw == null || orderRaw === "" ? quiz.items.length + 1 : Number(orderRaw);

    const options: string[] = [];
    for (let i = 0; i < MAX_OPTIONS; i++) {
      const v = row[3 + i];
      const s = v == null ? "" : String(v).trim();
      if (s) options.push(s);
    }

    const correctRaw = row[3 + MAX_OPTIONS];
    const correct_indices = lettersToIndices(correctRaw).filter((i) => i < options.length);

    const explanationRaw = row[4 + MAX_OPTIONS];
    const explanation = explanationRaw == null ? "" : String(explanationRaw).trim();

    quiz.items.push({
      order,
      content: String(contentRaw).trim(),
      options,
      correct_indices,
      explanation,
    });
  }

  const result: ParsedQuiz[] = [];
  for (const q of quizMap.values()) {
    if (q.items.length === 0) continue;
    q.items.sort((a, b) => a.order - b.order);
    result.push(q);
  }
  result.sort((a, b) => a.session_number - b.session_number);
  return result;
}
