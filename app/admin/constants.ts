import type { DataState, TableConfig } from "./types";

export const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";

export const storageKeys = {
  classId: "dua-edu-admin-class-id",
  search: "dua-edu-admin-search",
  scrollY: "dua-edu-admin-scroll-y",
  view: "dua-edu-admin-view",
  session: "dua-edu-admin-session",
  attendanceMode: "dua-edu-admin-attendance-mode",
};

export const courseTypeOptions = [
  { label: "Offline", value: "offline" },
  { label: "Online", value: "online" },
  { label: "E-learning", value: "elearning" },
  { label: "Tự học", value: "self_study" },
];

export const enrollmentStatusOptions = [
  { label: "Đang học", value: "active" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Bỏ học", value: "dropped" },
  { label: "Bảo lưu", value: "reserved" },
  { label: "Đã huỷ", value: "cancelled" },
];

export const certificateStatusOptions = [
  { label: "Chờ cấp", value: "pending" },
  { label: "Đã cấp", value: "issued" },
  { label: "Đã huỷ", value: "cancelled" },
  { label: "Thu hồi", value: "revoked" },
];

export const attendanceStatusOptions = [
  { label: "Chưa điểm danh", value: "" },
  { label: "Có mặt", value: "present" },
  { label: "Vắng", value: "absent" },
  { label: "Đi muộn", value: "late" },
  { label: "Có phép", value: "excused" },
];

export const chartColors = ["#059669", "#22c55e", "#14b8a6", "#84cc16", "#0f766e", "#65a30d"];
export const pageSizeOptions = [20, 50, 100];

export const tableConfigs: TableConfig[] = [
  {
    name: "students",
    label: "Học viên",
    description: "Quản lý thông tin học viên và liên hệ.",
    columns: ["full_name", "email", "account"],
    searchFields: ["full_name", "email", "phone"],
    fields: [
      { name: "full_name", label: "Họ tên", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "teachers",
    label: "Giảng viên",
    description: "Theo dõi hồ sơ, liên hệ và kinh nghiệm giảng viên.",
    columns: ["full_name", "email", "phone", "linkedin_url", "current_job", "created_at"],
    searchFields: ["full_name", "email", "phone", "linkedin_url", "current_job"],
    fields: [
      { name: "full_name", label: "Họ tên", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Số điện thoại", type: "text" },
      { name: "linkedin_url", label: "LinkedIn", type: "text" },
      { name: "avatar_url", label: "Avatar URL", type: "text" },
      { name: "current_job", label: "Công việc hiện tại", type: "text" },
      { name: "previous_job", label: "Công việc trước đây", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "courses",
    label: "Khoá học",
    description: "Quản lý chương trình học và phân loại khoá.",
    columns: ["name", "course_code", "course_type", "note", "created_at"],
    searchFields: ["name", "course_code", "course_type"],
    fields: [
      { name: "name", label: "Tên khoá học", type: "text", required: true },
      { name: "course_code", label: "Mã viết tắt", type: "text" },
      {
        name: "course_type",
        label: "Loại khoá",
        type: "select",
        required: true,
        options: courseTypeOptions,
      },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "classes",
    label: "Lớp học",
    description: "Gán lớp với khoá học và giảng viên phụ trách.",
    columns: [
      "class_name",
      "class_code",
      "course_id",
      "teacher_id",
      "start_date",
      "total_sessions",
      "schedule",
      "study_time",
      "total_assignments",
    ],
    searchFields: ["class_name", "class_code", "schedule", "study_time"],
    fields: [
      {
        name: "course_id",
        label: "Khoá học",
        type: "select",
        importKey: "course_code",
        exampleValue: "REACT",
        required: true,
        optionsKey: "courses",
        optionLabel: "name",
      },
      {
        name: "teacher_id",
        label: "Giảng viên",
        type: "select",
        importKey: "teacher_email",
        exampleValue: "teacher@dua-edu.com",
        required: true,
        optionsKey: "teachers",
        optionLabel: "full_name",
      },
      { name: "class_name", label: "Tên lớp", type: "text", required: true },
      { name: "class_code", label: "Mã lớp", type: "text" },
      { name: "start_date", label: "Ngày bắt đầu", type: "date" },
      { name: "total_sessions", label: "Số buổi học", type: "number" },
      { name: "total_assignments", label: "Số bài tập", type: "number" },
      { name: "schedule", label: "Lịch học", type: "text", exampleValue: "Thứ 2, 4, 6" },
      { name: "study_time", label: "Thời gian học", type: "text", exampleValue: "19:30 - 21:30" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "enrollments",
    label: "Ghi danh",
    description: "Quản lý học viên ghi danh vào từng lớp.",
    columns: ["student_id", "class_id", "status", "attendance_score", "note", "created_at"],
    searchFields: ["note"],
    fields: [
      {
        name: "student_id",
        label: "Học viên",
        type: "select",
        importKey: "student_email",
        exampleValue: "student@dua-edu.com",
        required: true,
        optionsKey: "students",
        optionLabel: "full_name",
      },
      {
        name: "class_id",
        label: "Lớp học",
        type: "select",
        importKey: "class_code",
        exampleValue: "REACT-K01",
        required: true,
        optionsKey: "classes",
        optionLabel: "class_name",
      },
      {
        name: "status",
        label: "Trạng thái",
        type: "select",
        required: true,
        options: enrollmentStatusOptions,
      },
      { name: "attendance_score", label: "Điểm chuyên cần", type: "number" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "certificates",
    label: "Chứng chỉ",
    description: "Phát hành và theo dõi chứng chỉ sau khoá học.",
    columns: ["enrollment_id", "certificate_type", "certificate_code", "status", "issued_at"],
    searchFields: ["certificate_type", "certificate_code", "status"],
    fields: [
      {
        name: "enrollment_id",
        label: "Ghi danh",
        type: "select",
        importKey: "enrollment_key",
        exampleValue: "student@dua-edu.com|REACT-K01",
        required: true,
        optionsKey: "enrollments",
        optionLabel: "id",
      },
      { name: "certificate_type", label: "Loại chứng chỉ", type: "text", required: true },
      { name: "certificate_code", label: "Mã chứng chỉ", type: "text", required: true },
      { name: "certificate_url", label: "Certificate URL", type: "text" },
      { name: "status", label: "Trạng thái", type: "text", required: true },
      { name: "issued_at", label: "Ngày cấp", type: "datetime-local" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
  {
    name: "class_sessions",
    label: "Quản lý buổi học",
    description: "Quản lý các buổi học, lịch học, link video của từng buổi.",
    columns: ["session_number", "session_title", "session_date", "time_range"],
    searchFields: ["session_title", "meeting_url", "recording_url", "note"],
    fields: [
      {
        name: "class_id",
        label: "Lớp học",
        type: "select",
        importKey: "class_code",
        exampleValue: "REACT-K01",
        required: true,
        optionsKey: "classes",
        optionLabel: "class_name",
      },
      { name: "session_number", label: "Buổi số", type: "number", required: true },
      { name: "session_title", label: "Tiêu đề buổi học", type: "text", required: true },
      { name: "session_date", label: "Ngày học", type: "date" },
      { name: "start_time", label: "Giờ bắt đầu", type: "time" },
      { name: "end_time", label: "Giờ kết thúc", type: "time" },
      { name: "meeting_url", label: "Link học online (Meeting URL)", type: "text" },
      { name: "recording_url", label: "Link video xem lại (Recording URL)", type: "text" },
      { name: "slide_url", label: "Link slide bài giảng", type: "text" },
      { name: "reference_url", label: "Link tài liệu tham khảo", type: "text" },
      { name: "assignment_url", label: "Link bài tập", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ],
  },
];

export const emptyData: DataState = {
  students: [],
  teachers: [],
  courses: [],
  classes: [],
  enrollments: [],
  certificates: [],
  class_sessions: [],
};
