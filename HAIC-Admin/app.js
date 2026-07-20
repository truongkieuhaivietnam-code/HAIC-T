// ============================================================
// app.js  –  HAI Multi Country Administration System
// ============================================================

// ── Telegram notifications ──────────────────────────────────
// Tạo bot qua @BotFather trên Telegram (chat với nó, gõ /newbot, làm theo
// hướng dẫn) để lấy TOKEN. Sau đó thêm bot vào nhóm chat muốn nhận thông
// báo, gửi 1 tin bất kỳ trong nhóm, rồi mở link sau (thay TOKEN thật vào)
// để lấy CHAT_ID (số âm, VD -1001234567890):
//   https://api.telegram.org/bot<TOKEN>/getUpdates
// LƯU Ý: token đặt ở đây sẽ hiện trong mã nguồn trình duyệt (ai xem được
// mã nguồn trang web đều thấy) — bot NÊN chỉ dùng riêng cho việc gửi
// thông báo này, không cấp thêm quyền nào khác cho nó.
const TELEGRAM_BOT_TOKEN = '8824623286:AAG6yzv-19SGYFMZde3aIwrX1jy6bBK1mas';
const TELEGRAM_CHAT_ID   = '-5572709840';

async function sendTelegramNotification(text) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.startsWith('DAN_')) {
    console.warn('Telegram chưa được cấu hình (thiếu TOKEN/CHAT_ID) — bỏ qua gửi thông báo.');
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' })
    });
  } catch (e) {
    // Gửi thông báo thất bại không nên chặn luồng chính (VD nộp đơn nghỉ
    // phép vẫn phải lưu thành công dù Telegram lỗi mạng) — chỉ ghi log.
    console.warn('Gửi thông báo Telegram thất bại:', e.message);
  }
}

// ── Constants ────────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN:     'super_admin',
  ADMIN:           'admin',
  COUNTRY_MANAGER: 'country_manager',
  EMPLOYEE:        'employee'
};

const COUNTRIES = ['Cambodia', 'Vietnam', 'Laos'];

const COUNTRY_FLAG = { Cambodia: '🇰🇭', Vietnam: '🇻🇳', Laos: '🇱🇦' };

// ── Currency helpers ─────────────────────────────────────────
const CURRENCY_BY_COUNTRY = {
  Cambodia: 'USD',
  Vietnam:  'VND',
  Laos:     'USD'
};

function formatCurrency(amount, currency) {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  }
  return '$' + (amount || 0).toLocaleString();
}

function getCurrency(country) {
  return CURRENCY_BY_COUNTRY[country] || 'USD';
}

const DEFAULT_CAMBODIA_POLICY = {
  country: 'Cambodia',
  currency: 'USD',
  working_days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  weekly_off: ['Sunday'],
  leave_days_per_month: 1,
  max_annual_leave: 12,
  unauthorized_multiplier: 2,
  holiday_multiplier: 1.5,
  ot_multiplier: 1.5,
  late_tiers: [
    { min: 0,  max: 15, penalty: 5,   type: 'fixed', label: '0–<15 min' },
    { min: 15, max: 60, penalty: 10,  type: 'fixed', label: '15–<60 min' },
    { min: 60, max: Infinity, penalty: 1, type: 'daily', label: '≥60 min' }
  ]
};

const CAMBODIA_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: 'International New Year Day' },
  { date: '2025-01-07', name: 'Day of Victory over Genocidal Regime' },
  { date: '2025-03-08', name: "International Women's Rights Day" },
  { date: '2025-04-14', name: 'Khmer New Year' },
  { date: '2025-04-15', name: 'Khmer New Year' },
  { date: '2025-04-16', name: 'Khmer New Year' },
  { date: '2025-05-01', name: 'International Labor Day' },
  { date: '2025-05-05', name: 'Royal Ploughing Ceremony' },
  { date: '2025-05-14', name: 'King Birthday' },
  { date: '2025-06-18', name: 'Queen Mother Birthday' },
  { date: '2025-09-24', name: 'Constitution Day' },
  { date: '2025-10-10', name: 'Pchum Ben Day' },
  { date: '2025-10-11', name: 'Pchum Ben Day' },
  { date: '2025-10-12', name: 'Pchum Ben Day' },
  { date: '2025-10-15', name: 'Late King Father Memorial Day' },
  { date: '2025-10-29', name: 'Coronation Day' },
  { date: '2025-11-09', name: 'National Independence Day' },
  { date: '2025-11-23', name: 'Water Festival' },
  { date: '2025-11-24', name: 'Water Festival' },
  { date: '2025-11-25', name: 'Water Festival' },
  { date: '2025-12-29', name: 'Peace Day' }
];

const DEFAULT_VIOLATIONS = [
  { id: 'v1', name: 'Smoking in prohibited area', penalty: 100, type: 'fixed' },
  { id: 'v2', name: 'No timemark report',          penalty: 5,   type: 'per_occurrence' },
  { id: 'v3', name: 'No Google Maps screenshot before site', penalty: 5, type: 'per_occurrence' },
  { id: 'v4', name: 'No Google Maps screenshot leaving site', penalty: 5, type: 'per_occurrence' }
];

// ══════════════════════════════════════════════════════════════
// i18n – LANGUAGE SYSTEM (EN / VI)
// ══════════════════════════════════════════════════════════════
const LANGS = {
  en: {
    // Nav
    nav_dashboard:   'Dashboard',
    nav_employees:   'Employees',
    nav_leave:       'Leave',
    nav_attendance:  'Attendance & Late',
    nav_violations:  'Violations',
    nav_payroll:     'Payroll',
    nav_reports:     'Reports',
    nav_policies:    'Policies',
    nav_my_profile:  'My Profile',
    nav_my_leave:    'My Leave',
    nav_my_salary:   'My Salary',
    nav_my_penalties:'My Penalties',
    nav_overview:    'Overview',
    nav_people:      'People',
    nav_finance:     'Finance',
    nav_settings:    'Settings',
    nav_me:          'Me',
    nav_apps:        'Other Apps',

    // Page titles
    page_dashboard:    'Dashboard',
    page_employees:    'Employees',
    page_leave:        'Leave Management',
    page_attendance:   'Attendance & Late',
    page_violations:   'Violations',
    page_payroll:      'Payroll',
    page_policies:     'Policy Settings',
    page_reports:      'Reports',
    page_my_profile:   'My Profile',
    page_my_leave:     'My Leave',
    page_my_salary:    'My Salary',
    page_my_penalties: 'My Penalties',

    // Auth
    auth_title:    'HAI Multi Country\nAdministration System',
    auth_subtitle: 'Cambodia · Vietnam · Laos',
    auth_email:    'Email Address',
    auth_password: 'Password',
    auth_signin:   'Sign In',
    auth_signing:  'Signing in…',
    auth_footer:   'HAI (Cambodia) Survey & Construction Co., Ltd',
    err_no_user:   'No account found with this email.',
    err_wrong_pw:  'Incorrect password.',
    err_invalid:   'Invalid email address.',
    err_too_many:  'Too many attempts. Try again later.',
    err_default:   'Sign in failed. Check your credentials.',
    err_no_profile:'User profile not found. Contact administrator.',

    // Dashboard
    dash_active_emp:   'Active Employees',
    dash_pending_leave:'Pending Leave Requests',
    dash_pending_viol: 'Pending Violations',
    dash_quick:        'Quick Actions',
    dash_manage_emp:   'Manage Employees',
    dash_review_leave: 'Review Leave',
    dash_view_payroll: 'View Payroll',
    dash_welcome:      'Welcome',
    dash_leave_bal:    'Leave Balance (days)',
    dash_pending_req:  'Pending Requests',

    // Employees
    emp_total:       'total',
    emp_add:         '+ Add Employee',
    emp_search:      'Search name, position…',
    emp_all_countries:'All Countries',
    emp_all_roles:   'All Roles',
    emp_all_status:  'Active & Inactive',
    emp_active_only: 'Active Only',
    emp_inactive_only:'Inactive Only',
    emp_name:        'Name',
    emp_country:     'Country',
    emp_dept:        'Department',
    emp_position:    'Position',
    emp_role:        'Role',
    emp_salary:      'Salary',
    emp_status:      'Status',
    emp_actions:     'Actions',
    emp_edit:        'Edit',
    emp_deactivate:  'Deactivate',
    emp_activate:    'Activate',
    emp_active:      'Active',
    emp_inactive:    'Inactive',
    emp_add_title:   'Add Employee',
    emp_edit_title:  'Edit Employee',
    emp_full_name:   'Full Name *',
    emp_email:       'Email *',
    emp_role_lbl:    'Role *',
    emp_country_lbl: 'Country *',
    emp_dept_lbl:    'Department',
    emp_pos_lbl:     'Position / Title',
    emp_basic_sal:   'Basic Salary (USD)',
    emp_allowance:   'Allowance (USD)',
    emp_schedule:    'Work Schedule Override',
    emp_sched_hint:  'Leave all unchecked to use country default schedule.',
    emp_password:    'Password (new employees only)',
    emp_pw_hint:     'Leave blank when editing an existing employee.',
    emp_active_chk:  'Active',
    emp_cancel:      'Cancel',
    emp_save:        'Save Employee',
    emp_confirm_deact:'Deactivate this employee?',
    emp_confirm_act: 'Activate this employee?',

    // Leave
    leave_requests:  'requests',
    leave_from:      'From',
    leave_to:        'To',
    leave_days:      'Days',
    leave_type:      'Type',
    leave_reason:    'Reason',
    leave_status:    'Status',
    leave_actions:   'Actions',
    leave_approve:   'Approve',
    leave_reject:    'Reject',
    leave_paid:      'Paid',
    leave_unpaid:    'Unpaid',
    leave_pending:   'Pending',
    leave_approved:  'Approved',
    leave_rejected:  'Rejected',
    leave_request_btn:'+ Request Leave',
    leave_balance:   'Balance',
    leave_submit:    'Submit Request',
    leave_from_date: 'From Date',
    leave_to_date:   'To Date',
    leave_reason_lbl:'Reason',
    leave_reason_ph: 'Reason for leave…',
    leave_hint:      'Leave balance: {bal} days. Submit at least 24h in advance.',
    leave_approved_msg:'Leave approved. Remaining balance: {bal} days.',
    leave_approved_unpaid:'Leave approved (unpaid).',
    leave_rejected_msg:'Leave rejected.',
    leave_reject_prompt:'Rejection reason (optional):',

    // Attendance
    att_records:    'records',
    att_log:        '+ Log Record',
    att_employee:   'Employee',
    att_date:       'Date',
    att_type:       'Type',
    att_minutes:    'Minutes Late',
    att_penalty:    'Penalty',
    att_status:     'Status',
    att_notes:      'Notes',
    att_late:       'Late (Approved)',
    att_late_approved: 'Late (Approved)',
    att_unauth:     'Unauthorized Absence',
    att_log_title:  'Log Attendance Record',
    att_select_emp: 'Select employee…',
    att_minutes_ph: 'e.g. 20',
    att_calc_pen:   'Calculated Penalty',
    att_notes_ph:   'Optional notes…',
    att_save:       'Save Record',
    att_no_records: 'No attendance records',

    // OT
    ot_total_pay:   'Total OT Pay',
    ot_log:         '+ Log OT',
    ot_hours:       'OT Hours',
    ot_daily_rate:  'Daily Rate',
    ot_pay:         'OT Pay (×2)',
    ot_log_title:   'Log Overtime',
    ot_hours_lbl:   'OT Hours',
    ot_type_lbl:    'OT Type',
    ot_normal:      'Normal OT (×1.5)',
    ot_holiday:     'Public Holiday (×2)',
    ot_calc:        'Calculated OT Pay',
    ot_notes_ph:    'Project / task…',
    ot_no_records:  'No OT records',

    // Violations
    viol_manage_types:'⚙️ Manage Types',
    viol_log:        '+ Log Violation',
    viol_employee:   'Employee',
    viol_date:       'Date',
    viol_type:       'Violation',
    viol_penalty:    'Penalty',
    viol_status:     'Status',
    viol_notes:      'Notes',
    viol_no_records: 'No violations recorded',
    viol_log_title:  'Log Violation',
    viol_type_lbl:   'Violation Type',
    viol_pen_lbl:    'Penalty Amount (USD)',
    viol_types_title:'Violation Types',
    viol_add_name:   'Name',
    viol_add_pen:    'Penalty (USD)',
    viol_add_btn:    'Add Type',
    viol_late:       'Late/Absence',
    viol_viol:       'Violation',

    // Payroll
    pay_month:       'Month',
    pay_generate:    '⚡ Generate',
    pay_export:      '📥 Export CSV',
    pay_lock:        '🔒 Lock',
    pay_employee:    'Employee',
    pay_country:     'Country',
    pay_basic:       'Basic',
    pay_allowance:   'Allowance',
    pay_ot:          'OT',
    pay_holiday:     'Holiday',
    pay_leave_ded:   'Leave Ded.',
    pay_late_ded:    'Late Ded.',
    pay_penalties:   'Penalties',
    pay_net:         'Net Salary',
    pay_edit:        'Edit',
    pay_confirm_gen: 'Generate payroll for all employees this month?',
    pay_confirm_lock:'Lock payroll? This cannot be undone.',
    pay_generated:   'Payroll generated for {n} employees ({month}).',

    // Policies
    pol_title:       'Policy Settings',
    pol_sub:         'Country-level payroll and HR policies',
    pol_accrue:      '🌴 Accrue Leave (Manual)',
    pol_seed:        '🌱 Seed Defaults',
    pol_currency:    'Currency',
    pol_working:     'Working Days',
    pol_off:         'Weekly Off',
    pol_leave_mo:    'Leave Days/Month',
    pol_ot_mult:     'OT Multiplier',
    pol_hol_mult:    'Holiday Multiplier',
    pol_holidays:    'Cambodia Holidays 2025',
    pol_edit:        'Edit',
    pol_edit_title:  'Edit Policy',
    pol_currency_lbl:'Currency',
    pol_leave_lbl:   'Leave Days Per Month',
    pol_working_lbl: 'Working Days (comma-separated)',
    pol_off_lbl:     'Weekly Off Days',
    pol_save:        'Save Policy',
    pol_seed_confirm:'Seed default Cambodia policy to Firestore?',
    pol_seed_done:   'Default policies and Cambodia holidays seeded.',
    pol_accrue_confirm:'Accrue 1 leave day for all active employees now?',
    pol_accrue_done: 'Leave accrued for {n} employees (max {max} days).',

    // Reports
    rep_title:       'Reports',
    rep_sub:         'Generate and export company reports',
    rep_employees:   'Employee List',
    rep_payroll:     'Payroll Summary',
    rep_leave:       'Leave Summary',
    rep_violations:  'Violations Report',
    rep_holidays:    'Holiday List',
    rep_export:      'Export CSV',

    // My profile
    my_email:        'Email',
    my_country:      'Country',
    my_dept:         'Department',
    my_position:     'Position',
    my_salary:       'Basic Salary',
    my_allowance:    'Allowance',
    my_leave_bal:    'My leave balance',
    my_no_leave:     'No leave requests',
    my_no_salary:    'No payroll records yet',
    my_no_penalties: 'No penalties on record',
    my_deductions:   'Deductions',

    // Status
    status_logged:    'Logged',
    status_processed: 'Processed',
    status_pending:   'Pending',

    // Roles
    role_super_admin:    'Super Admin',
    role_admin:          'Admin',
    role_country_manager:'Country Manager',
    role_employee:       'Employee',

    // Buttons
    btn_cancel: 'Cancel',
    btn_save:   'Save',
    btn_close:  'Close',
    btn_confirm:'Confirm',

    // Topbar
    topbar_operations: 'operations',
    // New modules
    nav_allowances:   'Allowances',
    nav_ot_manage:    'OT Management',
    nav_site:         'Site Records',
    page_allowances:  'Allowance Management',
    page_ot_manage:   'OT Management',
    page_site:        'Site Records',
    // Allowance
    allow_fixed:      'Fixed Allowances',
    allow_add_fixed:  '+ Add Fixed Allowance',
    allow_type:       'Type',
    allow_name:       'Allowance Name',
    allow_amount:     'Amount',
    allow_freq:       'Frequency',
    allow_monthly:    'Monthly',
    allow_employee:   'Employee',
    allow_no_data:    'No allowances configured',
    // Site
    site_add:         '+ Log Site Visit',
    site_project:     'Project',
    site_location:    'Location',
    site_start:       'Start Time',
    site_end:         'End Time',
    site_eligible:    'Eligible',
    site_not_eligible:'Not eligible',
    site_pp:          'Phnom Penh',
    site_province:    'Province',
    site_no_data:     'No site records',
    site_log_title:   'Log Site Visit',
    site_logic_hint:  'Eligible if: start ≤ 08:00 AND end ≥ 13:00',
    // OT
    ot_request:       '+ Submit OT',
    ot_start:         'Start Time',
    ot_end:           'End Time',
    ot_reason:        'Reason',
    ot_status:        'Status',
    ot_pending:       'Pending',
    ot_approved:      'Approved',
    ot_rejected:      'Rejected',
    ot_approve:       'Approve',
    ot_reject:        'Reject',
    ot_no_data:       'No OT records',
    ot_submit_title:  'Submit OT Request',
    ot_add_title:     'Log OT (Admin)',
    ot_calc_hint:     'Rate: Basic ÷ (26 days × 8h) × hours × 1.5',
  },

  vi: {
    // Nav
    nav_dashboard:   'Tổng quan',
    nav_employees:   'Nhân viên',
    nav_leave:       'Nghỉ phép',
    nav_attendance:  'Chuyên cần & Trễ',
    nav_violations:  'Vi phạm',
    nav_payroll:     'Bảng lương',
    nav_reports:     'Báo cáo',
    nav_policies:    'Chính sách',
    nav_my_profile:  'Hồ sơ của tôi',
    nav_my_leave:    'Nghỉ phép',
    nav_my_salary:   'Lương của tôi',
    nav_my_penalties:'Vi phạm của tôi',
    nav_overview:    'Tổng quan',
    nav_people:      'Nhân sự',
    nav_finance:     'Tài chính',
    nav_settings:    'Cài đặt',
    nav_me:          'Cá nhân',
    nav_apps:        'Ứng dụng khác',

    // Page titles
    page_dashboard:    'Tổng quan',
    page_employees:    'Nhân viên',
    page_leave:        'Quản lý nghỉ phép',
    page_attendance:   'Chuyên cần & Đi trễ',
    page_violations:   'Vi phạm',
    page_payroll:      'Bảng lương',
    page_policies:     'Cài đặt chính sách',
    page_reports:      'Báo cáo',
    page_my_profile:   'Hồ sơ của tôi',
    page_my_leave:     'Nghỉ phép của tôi',
    page_my_salary:    'Lương của tôi',
    page_my_penalties: 'Vi phạm của tôi',

    // Auth
    auth_title:    'Hệ thống Quản lý\nĐa Quốc Gia HAI',
    auth_subtitle: 'Campuchia · Việt Nam · Lào',
    auth_email:    'Địa chỉ Email',
    auth_password: 'Mật khẩu',
    auth_signin:   'Đăng nhập',
    auth_signing:  'Đang đăng nhập…',
    auth_footer:   'Công ty TNHH Khảo sát & Xây dựng HAI (Campuchia)',
    err_no_user:   'Không tìm thấy tài khoản với email này.',
    err_wrong_pw:  'Mật khẩu không đúng.',
    err_invalid:   'Địa chỉ email không hợp lệ.',
    err_too_many:  'Quá nhiều lần thử. Vui lòng thử lại sau.',
    err_default:   'Đăng nhập thất bại. Kiểm tra lại thông tin.',
    err_no_profile:'Không tìm thấy hồ sơ người dùng. Liên hệ quản trị viên.',

    // Dashboard
    dash_active_emp:   'Nhân viên đang làm',
    dash_pending_leave:'Yêu cầu nghỉ phép chờ duyệt',
    dash_pending_viol: 'Vi phạm chờ xử lý',
    dash_quick:        'Thao tác nhanh',
    dash_manage_emp:   'Quản lý nhân viên',
    dash_review_leave: 'Duyệt nghỉ phép',
    dash_view_payroll: 'Xem bảng lương',
    dash_welcome:      'Xin chào',
    dash_leave_bal:    'Số ngày phép còn lại',
    dash_pending_req:  'Yêu cầu đang chờ',

    // Employees
    emp_total:       'tổng cộng',
    emp_add:         '+ Thêm nhân viên',
    emp_search:      'Tìm tên, vị trí…',
    emp_all_countries:'Tất cả quốc gia',
    emp_all_roles:   'Tất cả vai trò',
    emp_all_status:  'Đang làm & Nghỉ việc',
    emp_active_only: 'Đang làm',
    emp_inactive_only:'Đã nghỉ việc',
    emp_name:        'Họ tên',
    emp_country:     'Quốc gia',
    emp_dept:        'Phòng ban',
    emp_position:    'Chức vụ',
    emp_role:        'Vai trò',
    emp_salary:      'Lương cơ bản',
    emp_status:      'Trạng thái',
    emp_actions:     'Thao tác',
    emp_edit:        'Sửa',
    emp_deactivate:  'Vô hiệu hóa',
    emp_activate:    'Kích hoạt',
    emp_active:      'Đang làm',
    emp_inactive:    'Đã nghỉ',
    emp_add_title:   'Thêm nhân viên',
    emp_edit_title:  'Sửa nhân viên',
    emp_full_name:   'Họ tên đầy đủ *',
    emp_email:       'Email *',
    emp_role_lbl:    'Vai trò *',
    emp_country_lbl: 'Quốc gia *',
    emp_dept_lbl:    'Phòng ban',
    emp_pos_lbl:     'Chức vụ / Danh hiệu',
    emp_basic_sal:   'Lương cơ bản (USD)',
    emp_allowance:   'Phụ cấp (USD)',
    emp_schedule:    'Lịch làm việc riêng',
    emp_sched_hint:  'Để trống để dùng lịch mặc định của quốc gia.',
    emp_password:    'Mật khẩu (chỉ cho nhân viên mới)',
    emp_pw_hint:     'Để trống khi chỉnh sửa nhân viên đã có.',
    emp_active_chk:  'Đang làm việc',
    emp_cancel:      'Hủy',
    emp_save:        'Lưu nhân viên',
    emp_confirm_deact:'Vô hiệu hóa nhân viên này?',
    emp_confirm_act: 'Kích hoạt lại nhân viên này?',

    // Leave
    leave_requests:  'yêu cầu',
    leave_from:      'Từ ngày',
    leave_to:        'Đến ngày',
    leave_days:      'Số ngày',
    leave_type:      'Loại',
    leave_reason:    'Lý do',
    leave_status:    'Trạng thái',
    leave_actions:   'Thao tác',
    leave_approve:   'Duyệt',
    leave_reject:    'Từ chối',
    leave_paid:      'Có lương',
    leave_unpaid:    'Không lương',
    leave_pending:   'Chờ duyệt',
    leave_approved:  'Đã duyệt',
    leave_rejected:  'Từ chối',
    leave_request_btn:'+ Xin nghỉ phép',
    leave_balance:   'Số ngày phép',
    leave_submit:    'Gửi yêu cầu',
    leave_from_date: 'Từ ngày',
    leave_to_date:   'Đến ngày',
    leave_reason_lbl:'Lý do',
    leave_reason_ph: 'Lý do xin nghỉ…',
    leave_hint:      'Số ngày phép còn: {bal} ngày. Nộp trước ít nhất 24 giờ.',
    leave_approved_msg:'Đã duyệt nghỉ phép. Còn lại: {bal} ngày.',
    leave_approved_unpaid:'Đã duyệt nghỉ không lương.',
    leave_rejected_msg:'Đã từ chối đơn nghỉ phép.',
    leave_reject_prompt:'Lý do từ chối (không bắt buộc):',

    // Attendance
    att_records:    'bản ghi',
    att_log:        '+ Ghi nhận',
    att_employee:   'Nhân viên',
    att_date:       'Ngày',
    att_type:       'Loại',
    att_minutes:    'Số phút trễ',
    att_penalty:    'Phạt',
    att_status:     'Trạng thái',
    att_notes:      'Ghi chú',
    att_late:       'Đi trễ có xin phép',
    att_late_approved: 'Đi trễ có xin phép',
    att_unauth:     'Vắng không phép',
    att_log_title:  'Ghi nhận chuyên cần',
    att_select_emp: 'Chọn nhân viên…',
    att_minutes_ph: 'VD: 20',
    att_calc_pen:   'Tiền phạt tính được',
    att_notes_ph:   'Ghi chú (không bắt buộc)…',
    att_save:       'Lưu bản ghi',
    att_no_records: 'Chưa có bản ghi chuyên cần',

    // OT
    ot_total_pay:   'Tổng tiền OT',
    ot_log:         '+ Ghi OT',
    ot_hours:       'Số giờ OT',
    ot_daily_rate:  'Lương ngày',
    ot_pay:         'Tiền OT (×2)',
    ot_log_title:   'Ghi nhận tăng ca',
    ot_hours_lbl:   'Số giờ OT',
    ot_type_lbl:    'Loại OT',
    ot_normal:      'Tăng ca thường (×1.5)',
    ot_holiday:     'Ngày lễ (×1.5)',
    ot_calc:        'Tiền OT tính được',
    ot_notes_ph:    'Dự án / công việc…',
    ot_no_records:  'Chưa có bản ghi OT',

    // Violations
    viol_manage_types:'⚙️ Quản lý loại vi phạm',
    viol_log:        '+ Ghi vi phạm',
    viol_employee:   'Nhân viên',
    viol_date:       'Ngày',
    viol_type:       'Vi phạm',
    viol_penalty:    'Phạt',
    viol_status:     'Trạng thái',
    viol_notes:      'Ghi chú',
    viol_no_records: 'Chưa có vi phạm nào',
    viol_log_title:  'Ghi nhận vi phạm',
    viol_type_lbl:   'Loại vi phạm',
    viol_pen_lbl:    'Số tiền phạt (USD)',
    viol_types_title:'Danh mục vi phạm',
    viol_add_name:   'Tên vi phạm',
    viol_add_pen:    'Tiền phạt (USD)',
    viol_add_btn:    'Thêm loại',
    viol_late:       'Trễ/Vắng',
    viol_viol:       'Vi phạm',

    // Payroll
    pay_month:       'Tháng',
    pay_generate:    '⚡ Tạo bảng lương',
    pay_export:      '📥 Xuất CSV',
    pay_lock:        '🔒 Khóa',
    pay_employee:    'Nhân viên',
    pay_country:     'Quốc gia',
    pay_basic:       'Lương cơ bản',
    pay_allowance:   'Phụ cấp',
    pay_ot:          'OT',
    pay_holiday:     'Ngày lễ',
    pay_leave_ded:   'Khấu trừ phép',
    pay_late_ded:    'Khấu trừ trễ',
    pay_penalties:   'Vi phạm',
    pay_net:         'Lương thực nhận',
    pay_edit:        'Sửa',
    pay_confirm_gen: 'Tạo bảng lương cho tất cả nhân viên tháng này?',
    pay_confirm_lock:'Khóa bảng lương? Không thể hoàn tác.',
    pay_generated:   'Đã tạo bảng lương cho {n} nhân viên ({month}).',

    // Policies
    pol_title:       'Cài đặt chính sách',
    pol_sub:         'Chính sách lương & nhân sự theo quốc gia',
    pol_accrue:      '🌴 Cộng phép (thủ công)',
    pol_seed:        '🌱 Khởi tạo mặc định',
    pol_currency:    'Đơn vị tiền tệ',
    pol_working:     'Ngày làm việc',
    pol_off:         'Ngày nghỉ hàng tuần',
    pol_leave_mo:    'Ngày phép/tháng',
    pol_ot_mult:     'Hệ số OT',
    pol_hol_mult:    'Hệ số ngày lễ',
    pol_holidays:    'Ngày lễ Campuchia 2025',
    pol_edit:        'Sửa',
    pol_edit_title:  'Sửa chính sách',
    pol_currency_lbl:'Đơn vị tiền tệ',
    pol_leave_lbl:   'Số ngày phép mỗi tháng',
    pol_working_lbl: 'Ngày làm việc (cách nhau bằng dấu phẩy)',
    pol_off_lbl:     'Ngày nghỉ hàng tuần',
    pol_save:        'Lưu chính sách',
    pol_seed_confirm:'Khởi tạo chính sách mặc định Campuchia?',
    pol_seed_done:   'Đã khởi tạo chính sách và ngày lễ Campuchia.',
    pol_accrue_confirm:'Cộng 1 ngày phép cho tất cả nhân viên?',
    pol_accrue_done: 'Đã cộng phép cho {n} nhân viên (tối đa {max} ngày).',

    // Reports
    rep_title:       'Báo cáo',
    rep_sub:         'Tạo và xuất báo cáo công ty',
    rep_employees:   'Danh sách nhân viên',
    rep_payroll:     'Tổng hợp lương',
    rep_leave:       'Tổng hợp nghỉ phép',
    rep_violations:  'Báo cáo vi phạm',
    rep_holidays:    'Danh sách ngày lễ',
    rep_export:      'Xuất CSV',

    // My profile
    my_email:        'Email',
    my_country:      'Quốc gia',
    my_dept:         'Phòng ban',
    my_position:     'Chức vụ',
    my_salary:       'Lương cơ bản',
    my_allowance:    'Phụ cấp',
    my_leave_bal:    'Số ngày phép của tôi',
    my_no_leave:     'Chưa có yêu cầu nghỉ phép',
    my_no_salary:    'Chưa có bảng lương',
    my_no_penalties: 'Chưa có vi phạm nào',
    my_deductions:   'Khấu trừ',

    // Status
    status_logged:    'Đã ghi',
    status_processed: 'Đã xử lý',
    status_pending:   'Chờ duyệt',

    // Roles
    role_super_admin:    'Quản trị tối cao',
    role_admin:          'Quản trị viên',
    role_country_manager:'Quản lý quốc gia',
    role_employee:       'Nhân viên',

    // Buttons
    btn_cancel: 'Hủy',
    btn_save:   'Lưu',
    btn_close:  'Đóng',
    btn_confirm:'Xác nhận',

    // Topbar
    topbar_operations: 'hoạt động',
    // New modules
    nav_allowances:   'Phụ cấp',
    nav_ot_manage:    'Quản lý OT',
    nav_site:         'Đi công trường',
    page_allowances:  'Quản lý phụ cấp',
    page_ot_manage:   'Quản lý tăng ca',
    page_site:        'Bản ghi đi công trường',
    // Allowance
    allow_fixed:      'Phụ cấp cố định',
    allow_add_fixed:  '+ Thêm phụ cấp',
    allow_type:       'Loại',
    allow_name:       'Tên phụ cấp',
    allow_amount:     'Số tiền',
    allow_freq:       'Chu kỳ',
    allow_monthly:    'Hàng tháng',
    allow_employee:   'Nhân viên',
    allow_no_data:    'Chưa có phụ cấp',
    // Site
    site_add:         '+ Ghi nhận đi công trường',
    site_project:     'Dự án',
    site_location:    'Địa điểm',
    site_start:       'Giờ vào',
    site_end:         'Giờ ra',
    site_eligible:    'Được hưởng',
    site_not_eligible:'Không đủ điều kiện',
    site_pp:          'Phnom Penh',
    site_province:    'Tỉnh khác',
    site_no_data:     'Chưa có bản ghi công trường',
    site_log_title:   'Ghi nhận đi công trường',
    site_logic_hint:  'Đủ điều kiện nếu: vào ≤ 08:00 VÀ ra ≥ 13:00',
    // OT
    ot_request:       '+ Đăng ký OT',
    ot_start:         'Giờ bắt đầu',
    ot_end:           'Giờ kết thúc',
    ot_reason:        'Lý do',
    ot_status:        'Trạng thái',
    ot_pending:       'Chờ duyệt',
    ot_approved:      'Đã duyệt',
    ot_rejected:      'Từ chối',
    ot_approve:       'Duyệt',
    ot_reject:        'Từ chối',
    ot_no_data:       'Chưa có bản ghi OT',
    ot_submit_title:  'Đăng ký tăng ca',
    ot_add_title:     'Ghi OT (Admin)',
    ot_calc_hint:     'Công thức: Lương ÷ (26 ngày × 8h) × số giờ × 1.5',
  }
};

// Active language (persisted in localStorage)
let lang = localStorage.getItem('haic_lang') || 'en';

// Translate helper
function t(key, vars = {}) {
  let str = (LANGS[lang] && LANGS[lang][key]) || (LANGS['en'] && LANGS['en'][key]) || key;
  Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  return str;
}

function setLang(l) {
  lang = l;
  localStorage.setItem('haic_lang', l);
  // Update toggle buttons
  $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
  // Re-render current page
  buildNav();
  updateTopbarLang();
  loadPageData(state.activePage);
  // Update auth screen if visible
  renderAuthLang();
}

function renderAuthLang() {
  const titleEl = document.querySelector('.auth-logo h1');
  const subEl   = document.querySelector('.auth-logo p');
  const footEl  = document.querySelector('.auth-card > p');
  if (titleEl) titleEl.innerHTML = t('auth_title').replace('\n', '<br>');
  if (subEl)   subEl.textContent = t('auth_subtitle');
  if (footEl)  footEl.textContent = t('auth_footer');
  const emailLbl = document.querySelector('label[for="login-email"]');
  const pwLbl    = document.querySelector('label[for="login-password"]');
  const btn      = $('login-btn');
  if (emailLbl) emailLbl.textContent = t('auth_email');
  if (pwLbl)    pwLbl.textContent    = t('auth_password');
  if (btn && btn.textContent !== t('auth_signing')) btn.textContent = t('auth_signin');
}

function updateTopbarLang() {
  const titleEl = $('topbar-title');
  if (titleEl) titleEl.textContent = t('page_' + state.activePage.replace('-','_')) || pageTitle(state.activePage);
}

// ══════════════════════════════════════════════════════════════
// FIRESTORE PATH HELPERS
// Structure: apps (collection) → hr (document) → xxx (subcollection)
// ══════════════════════════════════════════════════════════════

// Shorthand helpers — returns CollectionReference
const col = {
  users:        () => db.collection('apps').doc('hr').collection('users'),
  leave:        () => db.collection('apps').doc('hr').collection('leave'),
  payroll:      () => db.collection('apps').doc('hr').collection('payroll'),
  attendance:   () => db.collection('apps').doc('hr').collection('attendance'),
  violations:   () => db.collection('apps').doc('hr').collection('violations'),
  violTypes:    () => db.collection('apps').doc('hr').collection('violation_types'),
  leaveBalance: () => db.collection('apps').doc('hr').collection('leave_balance'),
  ot:           () => db.collection('apps').doc('hr').collection('ot'),
  policy:       () => db.collection('apps').doc('hr').collection('country_policy'),
  holidays:     () => db.collection('apps').doc('hr').collection('holidays'),
  pendingUsers: () => db.collection('apps').doc('hr').collection('pending_users'),
  // ── New modules ─────────────────────────────────────────────
  empAllowances:() => db.collection('apps').doc('hr').collection('employee_allowances'),
  siteRecords:  () => db.collection('apps').doc('hr').collection('site_records'),
  otRequests:   () => db.collection('apps').doc('hr').collection('ot_requests'),
  // KPI tổng hợp từ Lab System (ghi bởi script kpi-sync.js chạy tay,
  // XEM ĐỂ THAM KHẢO — không có logic tự động trừ/thưởng lương ở đây).
  labKpi:       () => db.collection('apps').doc('hr').collection('lab_kpi'),
};

// ── App State ─────────────────────────────────────────────────
const state = {
  currentUser:   null,
  userProfile:   null,
  activePage:    'dashboard',
  sidebarCollapsed: false,
  cache: {
    employees: null,
    policies: {},
    payroll: {}
  }
};

// ── DOM helpers ───────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showPage(pageId) {
  $$('.page-content').forEach(p => p.classList.remove('active'));
  const page = $(`page-${pageId}`);
  if (page) {
    page.classList.add('active');
    state.activePage = pageId;
  }
  $$('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  $('topbar-title').textContent = pageTitle(pageId);
}

function pageTitle(id) {
  const key = 'page_' + id.replace(/-/g, '_');
  return t(key) || id.charAt(0).toUpperCase() + id.slice(1);
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = 'default') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', default: '📢' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || icons.default}</span><span>${msg}</span>`;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

// ── Loader ────────────────────────────────────────────────────
function showLoader()  { $('loader').classList.add('show'); }
function hideLoader()  { $('loader').classList.remove('show'); }

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
  if (e.target.classList.contains('modal-close'))   closeModal(e.target.closest('.modal-overlay').id);
});

// ── Role helpers ──────────────────────────────────────────────
function isSuperAdmin()     { return state.userProfile?.role === ROLES.SUPER_ADMIN; }
function isAdmin()          { return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(state.userProfile?.role); }
function isCountryManager() { return state.userProfile?.role === ROLES.COUNTRY_MANAGER; }
function isEmployee()       { return state.userProfile?.role === ROLES.EMPLOYEE; }

function canManageCountry(country) {
  if (isAdmin()) return true;
  if (isCountryManager()) return state.userProfile?.country === country;
  return false;
}

function roleLabel(role) {
  return t('role_' + role) || role;
}

function roleBadgeClass(role) {
  const m = {
    super_admin:     'role-super-admin',
    admin:           'role-admin',
    country_manager: 'role-country-manager',
    employee:        'role-employee'
  };
  return `topbar-role-badge ${m[role] || ''}`;
}

// ── Ứng dụng khác trong hệ HAIC — mở nhanh sang app khác (link ngoài,
// mở tab mới). KHÔNG đụng gì tới dữ liệu/quyền — chỉ là nút điều hướng.
const EXTERNAL_APPS = [
  { icon: '🧪', label: 'Lab System',      url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/HAIC_Lab_Management.html' },
  { icon: '🛠️', label: 'Equipment',       url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/HAI%20Equipment%20Management/index.html' },
  { icon: '💰', label: 'Staff Finance',   url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/HAIC_Staff_Finance.html' },
  { icon: '📐', label: 'Point Load Test', url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/point-load-test.html' },
  { icon: '🧱', label: 'Concrete Test',   url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/concrete-test.html' },
  { icon: '🏖️', label: 'Sand Cone Test',  url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/sand-cone-test.html' },
  { icon: '📦', label: 'Sample Handover', url: 'https://truongkieuhaivietnam-code.github.io/HAIC-T/sample-handover.html' },
];

function getExternalAppNavItems() {
  return EXTERNAL_APPS.map(app => ({
    section: t('nav_apps'),
    externalUrl: app.url,
    icon: app.icon,
    label: app.label, // tên riêng, không dịch
  }));
}

// ── Sidebar nav build ─────────────────────────────────────────
function buildNav() {
  const role = state.userProfile?.role;
  const navData = getNavItems(role);
  const nav = $('sidebar-nav');
  nav.innerHTML = '';

  let lastSection = '';
  navData.forEach(item => {
    if (item.section && item.section !== lastSection) {
      const label = document.createElement('div');
      label.className = 'nav-section-label';
      label.textContent = item.section;
      nav.appendChild(label);
      lastSection = item.section;
    }
    const el = document.createElement('div');
    el.className = 'nav-item';
    if (item.page) el.dataset.page = item.page;
    el.innerHTML = `
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
      ${item.badge ? `<span class="nav-badge" id="badge-${item.page}">${item.badge}</span>` : ''}
      ${item.externalUrl ? `<span class="nav-external-icon" title="${t('nav_apps')}">↗</span>` : ''}
    `;
    if (item.externalUrl) {
      // Link ngoài — mở tab mới, KHÔNG điều hướng nội bộ (showPage/loadPageData)
      el.addEventListener('click', () => {
        window.open(item.externalUrl, '_blank', 'noopener');
      });
    } else {
      el.addEventListener('click', () => {
        showPage(item.page);
        loadPageData(item.page);
      });
    }
    nav.appendChild(el);
  });
}

function getNavItems(role) {
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
    return [
      { section: t('nav_overview'),  page: 'dashboard',  icon: '📊', label: t('nav_dashboard') },
      { section: t('nav_people'),    page: 'employees',  icon: '👥', label: t('nav_employees') },
      { section: t('nav_people'),    page: 'leave',      icon: '🌴', label: t('nav_leave'), badge: '' },
      { section: t('nav_people'),    page: 'attendance', icon: '⏱️', label: t('nav_attendance') },
      { section: t('nav_people'),    page: 'violations', icon: '⚠️', label: t('nav_violations') },
      { section: t('nav_finance'),   page: 'allowances', icon: '🎁', label: t('nav_allowances') },
      { section: t('nav_finance'),   page: 'ot-manage',  icon: '⏰', label: t('nav_ot_manage') },
      { section: t('nav_finance'),   page: 'site',       icon: '🏗️', label: t('nav_site') },
      { section: t('nav_finance'),   page: 'payroll',    icon: '💰', label: t('nav_payroll') },
      { section: t('nav_finance'),   page: 'reports',    icon: '📑', label: t('nav_reports') },
      { section: t('nav_people'),    page: 'lab-kpi',    icon: '🧪', label: lang === 'vi' ? 'KPI Lab System' : 'Lab System KPI' },
      { section: t('nav_settings'),  page: 'policies',   icon: '⚙️', label: t('nav_policies') },
      ...getExternalAppNavItems()
    ];
  }
  if (role === ROLES.COUNTRY_MANAGER) {
    return [
      { section: t('nav_overview'),  page: 'dashboard',  icon: '📊', label: t('nav_dashboard') },
      { section: t('nav_people'),    page: 'employees',  icon: '👥', label: t('nav_employees') },
      { section: t('nav_people'),    page: 'leave',      icon: '🌴', label: t('nav_leave'), badge: '' },
      { section: t('nav_people'),    page: 'attendance', icon: '⏱️', label: t('nav_attendance') },
      { section: t('nav_people'),    page: 'violations', icon: '⚠️', label: t('nav_violations') },
      { section: t('nav_finance'),   page: 'allowances', icon: '🎁', label: t('nav_allowances') },
      { section: t('nav_finance'),   page: 'ot-manage',  icon: '⏰', label: t('nav_ot_manage') },
      { section: t('nav_finance'),   page: 'site',       icon: '🏗️', label: t('nav_site') },
      { section: t('nav_finance'),   page: 'payroll',    icon: '💰', label: t('nav_payroll') },
      { section: t('nav_people'),    page: 'lab-kpi',    icon: '🧪', label: lang === 'vi' ? 'KPI Lab System' : 'Lab System KPI' },
      ...getExternalAppNavItems()
    ];
  }
  return [
    { section: t('nav_me'), page: 'my-profile',   icon: '👤', label: t('nav_my_profile') },
    { section: t('nav_me'), page: 'my-leave',     icon: '🌴', label: t('nav_my_leave') },
    { section: t('nav_me'), page: 'my-salary',    icon: '💵', label: t('nav_my_salary') },
    { section: t('nav_me'), page: 'my-penalties', icon: '⚠️', label: t('nav_my_penalties') },
    { section: t('nav_me'), page: 'attendance',   icon: '⏱️', label: t('nav_attendance') },
    { section: t('nav_me'), page: 'ot-manage',    icon: '⏰', label: t('nav_ot_manage') },
    { section: t('nav_me'), page: 'site',         icon: '🏗️', label: t('nav_site') },
    ...getExternalAppNavItems()
  ];
}

// ── Profile helper ────────────────────────────────────────────
async function fetchUserProfile(uid) {
  const doc = await col.users().doc(uid).get();
  if (!doc.exists) return null;
  return { uid, ...doc.data() };
}

// Gọi trước mọi write operation — đảm bảo profile luôn có
// Đặc biệt quan trọng trên iOS/Android khi app resume từ background
async function ensureProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  // Profile đã có và đúng uid → dùng luôn
  if (state.userProfile && state.userProfile.uid === currentUser.uid) {
    return state.userProfile;
  }
  // Re-fetch nếu bị mất (mobile hay xảy ra)
  try {
    const profile = await fetchUserProfile(currentUser.uid);
    if (profile) { state.userProfile = profile; return profile; }
  } catch(e) { console.error('ensureProfile:', e); }
  return null;
}

// ── Authentication ────────────────────────────────────────────
auth.onAuthStateChanged(async user => {
  if (user) {
    state.currentUser = user;
    try {
      const profile = await fetchUserProfile(user.uid);
      if (!profile) {
        toast('User profile not found. Contact administrator.', 'error');
        auth.signOut();
        return;
      }
      state.userProfile = profile;
      initApp();
    } catch (err) {
      toast('Error loading profile: ' + err.message, 'error');
    }
  } else {
    state.currentUser = null;
    state.userProfile = null;
    showAuthScreen();
  }
});

function showAuthScreen() {
  $('auth-screen').style.display = 'flex';
  $('app-screen').classList.remove('visible');
}

function initApp() {
  $('auth-screen').style.display = 'none';
  $('app-screen').classList.add('visible');

  // Topbar
  const p = state.userProfile;
  $('topbar-role-badge').className = roleBadgeClass(p.role);
  $('topbar-role-badge').textContent = roleLabel(p.role);

  if (p.country) {
    $('topbar-country').style.display = 'flex';
    $('topbar-country').innerHTML = `${COUNTRY_FLAG[p.country] || '🌏'} ${p.country}`;
  } else {
    $('topbar-country').style.display = 'none';
  }

  // Lang toggle
  const langToggle = $('lang-toggle');
  if (langToggle) {
    langToggle.innerHTML = `
      <button class="lang-btn ${lang==='en'?'active':''}" data-lang="en" onclick="setLang('en')">EN</button>
      <button class="lang-btn ${lang==='vi'?'active':''}" data-lang="vi" onclick="setLang('vi')">VI</button>
    `;
  }

  // Sidebar user info
  const initials = (p.name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  $('user-avatar').textContent = initials;
  $('user-name').textContent = p.name || 'User';
  $('user-role-label').textContent = roleLabel(p.role);

  buildNav();

  const defaultPage = isSuperAdmin() || isAdmin() || isCountryManager()
    ? 'dashboard'
    : 'my-profile';
  showPage(defaultPage);
  loadPageData(defaultPage);
}

// ── Login ─────────────────────────────────────────────────────
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = $('login-email').value.trim();
  const password = $('login-password').value;
  $('auth-error').classList.remove('show');
  $('login-btn').disabled = true;
  $('login-btn').textContent = t('auth_signing');
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    $('auth-error').textContent = friendlyAuthError(err.code);
    $('auth-error').classList.add('show');
  } finally {
    $('login-btn').disabled = false;
    $('login-btn').textContent = t('auth_signin');
  }
});

function friendlyAuthError(code) {
  const m = {
    'auth/user-not-found':    t('err_no_user'),
    'auth/wrong-password':    t('err_wrong_pw'),
    'auth/invalid-email':     t('err_invalid'),
    'auth/too-many-requests': t('err_too_many')
  };
  return m[code] || t('err_default');
}

$('logout-btn').addEventListener('click', () => auth.signOut());

// ── Sidebar toggle (desktop: collapse to icon-only) ────────────
$('sidebar-toggle').addEventListener('click', () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  $('sidebar').classList.toggle('collapsed', state.sidebarCollapsed);
});

// ── Mobile sidebar drawer (≤900px) — nút menu mở ra sidebar đầy đủ chữ,
// bấm ra ngoài (backdrop) hoặc chọn 1 mục thì tự đóng lại. ─────────────
function openMobileSidebar() {
  $('sidebar').classList.add('mobile-open');
  $('sidebar-backdrop').classList.add('active');
}
function closeMobileSidebar() {
  $('sidebar').classList.remove('mobile-open');
  $('sidebar-backdrop').classList.remove('active');
}
$('mobile-menu-btn').addEventListener('click', () => {
  const isOpen = $('sidebar').classList.contains('mobile-open');
  if (isOpen) closeMobileSidebar(); else openMobileSidebar();
});
$('sidebar-backdrop').addEventListener('click', closeMobileSidebar);
// Tự đóng ngăn kéo sau khi bấm chọn 1 mục trong menu (chỉ áp dụng trên di động)
$('sidebar-nav').addEventListener('click', (e) => {
  if (e.target.closest('.nav-item') && window.innerWidth <= 900) {
    closeMobileSidebar();
  }
});

// ── Page router ───────────────────────────────────────────────
function loadPageData(page) {
  switch (page) {
    case 'dashboard':   loadDashboard();   break;
    case 'employees':   loadEmployees();   break;
    case 'leave':       loadLeave();       break;
    case 'attendance':  loadAttendance();  break;
    case 'violations':  loadViolations();  break;
    case 'payroll':     loadPayroll();     break;
    case 'policies':    loadPolicies();    break;
    case 'reports':     loadReports();     break;
    case 'my-profile':  loadMyProfile();   break;
    case 'my-leave':    loadMyLeave();     break;
    case 'my-salary':   loadMySalary();    break;
    case 'my-penalties':loadMyPenalties(); break;
    case 'allowances':  loadAllowances();   break;
    case 'ot-manage':   loadOTManage();     break;
    case 'site':        loadSiteRecords();  break;
    case 'lab-kpi':     loadLabKpi();       break;
  }
}

// navigateTo: called from buttons inside page content
window.navigateTo = function(page) {
  showPage(page);
  loadPageData(page);
};

// Nav clicks are attached per-item inside buildNav(), not here.
// (Avoid duplicate listeners that would fire loadPageData twice.)

// ── DASHBOARD ─────────────────────────────────────────────────
async function loadDashboard() {
  if (isEmployee()) { loadEmployeeDashboard(); return; }

  showLoader();
  try {
    let query = col.users().where('active', '==', true);
    if (isCountryManager()) query = query.where('country', '==', state.userProfile.country);

    const snap = await query.get();
    const employees = snap.docs.map(d => d.data());
    const total = employees.length;

    // Country breakdown
    const byCo = { Cambodia: 0, Vietnam: 0, Laos: 0 };
    employees.forEach(e => { if (byCo[e.country] !== undefined) byCo[e.country]++; });

    // Pending leaves
    let leaveQ = col.leave().where('status', '==', 'pending');
    if (isCountryManager()) leaveQ = leaveQ.where('country', '==', state.userProfile.country);
    const leavePending = (await leaveQ.get()).size;

    // Pending violations
    let violQ = col.violations().where('status', '==', 'pending');
    if (isCountryManager()) violQ = violQ.where('country', '==', state.userProfile.country);
    const violPending = (await violQ.get()).size;

    renderDashboard({ total, byCo, leavePending, violPending });
  } catch (err) {
    toast('Error loading dashboard: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

function renderDashboard({ total, byCo, leavePending, violPending }) {
  const page = $('page-dashboard');
  const country = state.userProfile.country || (lang==='vi' ? 'Tất cả quốc gia' : 'All Countries');
  page.innerHTML = `
    <div class="page-header">
      <div>
        <h2>${t('page_dashboard')}</h2>
        <p>${country} ${t('topbar_operations')}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card navy">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">${t('dash_active_emp')}</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">🌴</div>
        <div class="stat-value">${leavePending}</div>
        <div class="stat-label">${t('dash_pending_leave')}</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value">${violPending}</div>
        <div class="stat-label">${t('dash_pending_viol')}</div>
      </div>
    </div>

    ${isAdmin() ? `
    <div class="country-grid">
      ${COUNTRIES.map(c => `
        <div class="country-card ${c.toLowerCase()}">
          <div class="country-flag">${COUNTRY_FLAG[c]}</div>
          <div class="country-name">${c}</div>
          <div class="country-count">${byCo[c] || 0}</div>
          <div class="stat-label">${t('nav_employees')}</div>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="card">
      <div class="card-header"><h3>${t('dash_quick')}</h3></div>
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="navigateTo('employees')">👥 ${t('dash_manage_emp')}</button>
        <button class="btn btn-gold" onclick="navigateTo('leave')">🌴 ${t('dash_review_leave')}</button>
        <button class="btn btn-outline" onclick="navigateTo('payroll')">💰 ${t('dash_view_payroll')}</button>
        <button class="btn btn-outline" onclick="navigateTo('violations')">⚠️ ${t('nav_violations')}</button>
      </div>
    </div>
  `;
}

async function loadEmployeeDashboard() {
  const p = state.userProfile;
  const leaveSnap = await col.leave()
    .where('uid', '==', p.uid).where('status', '==', 'pending').get();

  $('page-dashboard').innerHTML = `
    <div class="page-header">
      <div><h2>${t('dash_welcome')}, ${p.name}</h2><p>${p.position || ''} · ${p.department || ''} · ${p.country || ''}</p></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card navy"><div class="stat-icon">🌴</div>
        <div class="stat-value" id="my-leave-balance">–</div>
        <div class="stat-label">${t('dash_leave_bal')}</div></div>
      <div class="stat-card gold"><div class="stat-icon">📋</div>
        <div class="stat-value">${leaveSnap.size}</div>
        <div class="stat-label">${t('dash_pending_req')}</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>${t('dash_quick')}</h3></div>
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="navigateTo('my-leave')">🌴 ${t('leave_request_btn')}</button>
        <button class="btn btn-outline" onclick="navigateTo('my-salary')">💵 ${t('nav_my_salary')}</button>
        <button class="btn btn-outline" onclick="navigateTo('my-penalties')">⚠️ ${t('nav_my_penalties')}</button>
      </div>
    </div>
  `;

  // Load leave balance
  const bal = await getLeaveBalance(p.uid);
  const el = document.getElementById('my-leave-balance');
  if (el) el.textContent = bal;
}

// ── EMPLOYEES ─────────────────────────────────────────────────
async function loadEmployees() {
  showLoader();
  try {
    let query = col.users();
    if (isCountryManager()) query = query.where('country', '==', state.userProfile.country);
    const snap = await query.get();
    state.cache.employees = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    renderEmployeeTable(state.cache.employees);
  } catch (err) {
    toast('Error loading employees: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

function renderEmployeeTable(employees) {
  const canAdd = isAdmin() || isCountryManager();
  $('page-employees').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_employees')}</h2><p>${employees.length} ${t('emp_total')}</p></div>
      <div class="page-actions">
        ${canAdd ? `<button class="btn btn-primary" onclick="openAddEmployee()">${t('emp_add')}</button>` : ''}
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input class="form-control search-input" id="emp-search" placeholder="${t('emp_search')}" oninput="filterEmployees()">
      </div>
      ${isAdmin() ? `
      <select class="form-control" id="emp-filter-country" onchange="filterEmployees()">
        <option value="">${t('emp_all_countries')}</option>
        ${COUNTRIES.map(c=>`<option>${c}</option>`).join('')}
      </select>` : ''}
      <select class="form-control" id="emp-filter-role" onchange="filterEmployees()">
        <option value="">${t('emp_all_roles')}</option>
        ${Object.values(ROLES).map(r=>`<option value="${r}">${roleLabel(r)}</option>`).join('')}
      </select>
      <select class="form-control" id="emp-filter-active" onchange="filterEmployees()">
        <option value="">${t('emp_all_status')}</option>
        <option value="true">${t('emp_active_only')}</option>
        <option value="false">${t('emp_inactive_only')}</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table id="emp-table">
          <thead>
            <tr>
              <th>${t('emp_name')}</th>
              <th>${t('emp_country')}</th>
              <th>${t('emp_dept')}</th>
              <th>${t('emp_position')}</th>
              <th>${t('emp_role')}</th>
              <th>${t('emp_salary')}</th>
              <th>${t('emp_status')}</th>
              <th>${t('emp_actions')}</th>
            </tr>
          </thead>
          <tbody id="emp-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Employee Modal -->
    <div class="modal-overlay" id="modal-employee">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 id="modal-emp-title">Add Employee</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="emp-uid">
          <div class="form-row">
            <div class="form-group">
              <label>${t('emp_full_name')}</label>
              <input class="form-control" id="emp-name" placeholder="Nguyen Van A">
            </div>
            <div class="form-group">
              <label>${t('emp_email')}</label>
              <input class="form-control" id="emp-email" type="email" placeholder="email@company.com">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('emp_role_lbl')}</label>
              <select class="form-control" id="emp-role" onchange="onEmpRoleChange()">
                ${buildRoleOptions()}
              </select>
            </div>
            <div class="form-group">
              <label>${t('emp_country_lbl')}</label>
              <select class="form-control" id="emp-country">
                ${COUNTRIES.map(c=>`<option>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('emp_dept_lbl')}</label>
              <input class="form-control" id="emp-department" placeholder="Engineering">
            </div>
            <div class="form-group">
              <label>${t('emp_pos_lbl')}</label>
              <input class="form-control" id="emp-position" placeholder="Senior Technician">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('emp_basic_sal')}</label>
              <div style="display:flex;gap:6px;">
                <input class="form-control" id="emp-salary" type="number" placeholder="500" style="flex:1;">
                <select class="form-control" id="emp-currency" style="width:90px;" onchange="onCurrencyChange()">
                  <option value="USD">$ USD</option>
                  <option value="VND">₫ VNĐ</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>${t('emp_allowance')}</label>
              <div style="display:flex;gap:6px;align-items:center;">
                <input class="form-control" id="emp-allowance" type="number" placeholder="0" style="flex:1;">
                <span id="emp-allowance-currency" style="font-size:.84rem;color:var(--text-muted);width:90px;text-align:center;">USD</span>
              </div>
            </div>
          </div>
          <div id="emp-salary-hint" class="form-hint" style="margin-top:-8px;margin-bottom:8px;"></div>
          <div class="form-group">
            <label>${t('emp_schedule')}</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
              ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
                `<label style="display:flex;align-items:center;gap:4px;font-size:.84rem;font-weight:400;">
                  <input type="checkbox" value="${d}" class="schedule-chk"> ${d}
                </label>`
              ).join('')}
            </div>
            <p class="form-hint">${t('emp_sched_hint')}</p>
          </div>
          <div class="form-group">
            <label>${t('emp_password')}</label>
            <input class="form-control" id="emp-password" type="password" placeholder="Min 6 characters">
            <p class="form-hint">${t('emp_pw_hint')}</p>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;font-weight:400;cursor:pointer;">
              <input type="checkbox" id="emp-active" checked> ${t('emp_active_chk')}
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="saveEmployee()">${t('emp_save')}</button>
        </div>
      </div>
    </div>
  `;
  renderEmployeeRows(employees);
}

function buildRoleOptions() {
  let roles = Object.values(ROLES);
  if (!isSuperAdmin()) roles = roles.filter(r => r !== ROLES.SUPER_ADMIN);
  return roles.map(r => `<option value="${r}">${roleLabel(r)}</option>`).join('');
}

function renderEmployeeRows(list) {
  const tbody = $('emp-tbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">👥</div><h4>No employees found</h4><p>Adjust filters or add a new employee.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(e => `
    <tr>
      <td><strong>${e.name || '–'}</strong><br><small class="td-mono" style="color:var(--text-muted)">${e.email || ''}</small></td>
      <td>${COUNTRY_FLAG[e.country] || ''} ${e.country || '–'}</td>
      <td>${e.department || '–'}</td>
      <td>${e.position || '–'}</td>
      <td><span class="${roleBadgeClass(e.role)}" style="font-size:.70rem;">${roleLabel(e.role)}</span></td>
      <td class="td-mono">${formatCurrency(e.salary || 0, e.currency || getCurrency(e.country))}</td>
      <td>${e.active !== false
        ? `<span class="badge badge-green">${t('emp_active')}</span>`
        : `<span class="badge badge-grey">${t('emp_inactive')}</span>`}</td>
      <td>
        ${canManageCountry(e.country) ? `
          <button class="btn btn-sm btn-outline" onclick="editEmployee('${e.uid}')">${t('emp_edit')}</button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="toggleEmployeeStatus('${e.uid}', ${e.active !== false})">
            ${e.active !== false ? t('emp_deactivate') : t('emp_activate')}
          </button>
          <button class="btn btn-sm btn-outline" style="margin-left:4px" onclick="resetEmployeePassword('${e.uid}', '${e.name}')">🔑</button>` : '–'}
      </td>
    </tr>
  `).join('');
}

window.filterEmployees = function() {
  const search  = ($('emp-search')?.value || '').toLowerCase();
  const country = $('emp-filter-country')?.value || '';
  const role    = $('emp-filter-role')?.value || '';
  const active  = $('emp-filter-active')?.value || '';
  let list = state.cache.employees || [];
  if (search)  list = list.filter(e => (e.name + e.email + e.position + e.department).toLowerCase().includes(search));
  if (country) list = list.filter(e => e.country === country);
  if (role)    list = list.filter(e => e.role === role);
  if (active)  list = list.filter(e => String(e.active !== false) === active);
  renderEmployeeRows(list);
};

window.openAddEmployee = function() {
  $('modal-emp-title').textContent = 'Add Employee';
  $('emp-uid').value = '';
  ['name','email','department','position','password'].forEach(f => $(`emp-${f}`).value = '');
  $('emp-salary').value = '';
  $('emp-allowance').value = '';
  $('emp-active').checked = true;
  $('emp-role').value = ROLES.EMPLOYEE;
  const defaultCountry = state.userProfile.country || 'Cambodia';
  $('emp-country').value = defaultCountry;
  // Auto-set currency based on country
  const curSelNew = $('emp-currency');
  if (curSelNew) {
    curSelNew.value = getCurrency(defaultCountry);
    onCurrencyChange();
  }
  $$('.schedule-chk').forEach(c => c.checked = false);
  openModal('modal-employee');
};

window.editEmployee = function(uid) {
  const e = state.cache.employees?.find(x => x.uid === uid);
  if (!e) return;
  $('modal-emp-title').textContent = 'Edit Employee';
  $('emp-uid').value    = uid;
  $('emp-name').value   = e.name || '';
  $('emp-email').value  = e.email || '';
  $('emp-role').value   = e.role || ROLES.EMPLOYEE;
  $('emp-country').value = e.country || 'Cambodia';
  $('emp-department').value = e.department || '';
  $('emp-position').value   = e.position || '';
  $('emp-salary').value     = e.salary || '';
  $('emp-allowance').value  = e.allowance || '';
  $('emp-active').checked   = e.active !== false;
  $('emp-password').value   = '';
  // Pre-fill currency
  const curSel = $('emp-currency');
  if (curSel) {
    curSel.value = e.currency || getCurrency(e.country);
    onCurrencyChange();
  }
  const sched = e.schedule || [];
  $$('.schedule-chk').forEach(c => { c.checked = sched.includes(c.value); });
  openModal('modal-employee');
};

window.saveEmployee = async function() {
  const uid      = $('emp-uid').value;
  const name     = $('emp-name').value.trim();
  const email    = $('emp-email').value.trim();
  const role     = $('emp-role').value;
  const password = $('emp-password').value;

  if (!name || !email) { toast('Name and email are required.', 'error'); return; }
  if (!uid && !password) { toast('Password required for new employee.', 'error'); return; }
  if (!uid && password.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }

  const schedule = [...$$('.schedule-chk')].filter(c => c.checked).map(c => c.value);

  showLoader();
  try {
    if (uid) {
      // ── EDIT existing employee ──────────────────────────────
      if (!isSuperAdmin() && state.cache.employees?.find(x=>x.uid===uid)?.role === ROLES.SUPER_ADMIN) {
        toast('Cannot modify Super Admin.', 'error'); hideLoader(); return;
      }
      const updateData = {
        name, role,
        country:    $('emp-country').value,
        department: $('emp-department').value.trim(),
        position:   $('emp-position').value.trim(),
        salary:     parseFloat($('emp-salary').value) || 0,
        allowance:  parseFloat($('emp-allowance').value) || 0,
        currency:   $('emp-currency')?.value || getCurrency($('emp-country').value),
        schedule:   schedule.length ? schedule : [],
        active:     $('emp-active').checked,
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
      };
      await col.users().doc(uid).update(updateData);
      toast('Employee updated successfully.', 'success');

    } else {
      // ── CREATE new employee ───────────────────────────────
      // Lưu thông tin admin hiện tại để re-login sau
      const adminUser    = auth.currentUser;
      const adminEmail   = adminUser.email;
      // Lấy password admin từ form login (không lưu được từ trước)
      // → dùng phương án: lưu Firestore trước, tạo Auth sau bằng
      //   secondary Firebase app instance

      // Khởi tạo secondary Firebase app
      let secondaryApp;
      try {
        secondaryApp = firebase.initializeApp(
          firebase.app().options,
          'emp_create_' + Date.now()
        );
      } catch(e) {
        // App name conflict — dùng app đã có
        secondaryApp = firebase.app('emp_create_' + Date.now());
      }

      const secondaryAuth = secondaryApp.auth();
      let newUID;

      try {
        // Tạo Auth account bằng secondary app
        const cred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
        newUID = cred.user.uid;

        // Đóng secondary app ngay — không ảnh hưởng admin session
        await secondaryAuth.signOut();
        await secondaryApp.delete();

      } catch(authErr) {
        try { await secondaryApp.delete(); } catch(e) {}

        if (authErr.code === 'auth/email-already-in-use') {
          // Email đã có Auth account (từ app khác cùng project)
          // → Hỏi admin nhập UID để chỉ tạo Firestore profile
          hideLoader();
          const existingUID = prompt(
            `Email "${email}" đã có tài khoản trong hệ thống.\n\n` +
            `Để thêm nhân viên này vào HAIC Admin:\n` +
            `1. Vào Firebase Console → Authentication → Users\n` +
            `2. Tìm email "${email}" → copy UID\n` +
            `3. Paste UID vào đây:\n`
          );
          if (!existingUID || !existingUID.trim()) {
            toast('Đã hủy. Vui lòng nhập UID để tiếp tục.', 'info');
            return;
          }
          newUID = existingUID.trim();
          showLoader();
        } else {
          toast('Tạo tài khoản thất bại: ' + authErr.message, 'error');
          hideLoader();
          return;
        }
      }

      // Tạo Firestore profile — dùng admin credentials (vẫn đang login)
      const profile = {
        uid:        newUID,
        name,
        email:      email.toLowerCase().trim(),
        role,
        country:    $('emp-country').value,
        department: $('emp-department').value.trim(),
        position:   $('emp-position').value.trim(),
        salary:     parseFloat($('emp-salary').value) || 0,
        allowance:  parseFloat($('emp-allowance').value) || 0,
        currency:   $('emp-currency')?.value || getCurrency($('emp-country').value),
        schedule:   schedule.length ? schedule : [],
        active:     $('emp-active').checked,
        createdBy:  adminUser.uid,
        createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
      };

      await col.users().doc(newUID).set(profile);

      // Khởi tạo leave balance = 0
      await col.leaveBalance().doc(newUID).set({
        uid:          newUID,
        employeeName: name,
        country:      $('emp-country').value,
        balance:      0,
        createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
      });

      toast(`✅ Đã tạo nhân viên ${name} thành công!`, 'success');
    }

    closeModal('modal-employee');
    loadEmployees();
  } catch (err) {
    // Cloud Function errors come as err.message
    const msg = err.message || err.details || 'Save failed.';
    toast(msg, 'error');
  } finally {
    hideLoader();
  }
};

window.toggleEmployeeStatus = async function(uid, currentlyActive) {
  if (!confirm(currentlyActive ? t('emp_confirm_deact') : t('emp_confirm_act'))) return;
  try {
    await col.users().doc(uid).update({ active: !currentlyActive });
    toast('Status updated.', 'success');
    loadEmployees();
  } catch (err) {
    toast('Update failed: ' + err.message, 'error');
  }
};

window.onEmpRoleChange = function() {};

window.onCurrencyChange = function() {
  const cur = $('emp-currency')?.value || 'USD';
  const hint = $('emp-salary-hint');
  const allowCur = $('emp-allowance-currency');
  if (allowCur) allowCur.textContent = cur;
  if (hint) {
    if (cur === 'VND') {
      hint.textContent = lang === 'vi'
        ? '💡 Nhập lương theo VNĐ, ví dụ: 8000000 = 8 triệu đồng'
        : '💡 Enter salary in VND, e.g. 8000000 = 8 million VND';
    } else {
      hint.textContent = '';
    }
  }
};

// Auto-set currency based on country selection
document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'emp-country') {
    const country = e.target.value;
    const currency = getCurrency(country);
    const curSel = $('emp-currency');
    if (curSel) {
      curSel.value = currency;
      onCurrencyChange();
    }
  }
});

// ── LEAVE MANAGEMENT ──────────────────────────────────────────
async function loadLeave() {
  showLoader();
  try {
    let query = col.leave().orderBy('createdAt', 'desc').limit(100);
    if (isCountryManager()) query = col.leave()
      .where('country', '==', state.userProfile.country)
      .orderBy('createdAt', 'desc').limit(100);

    const snap = await query.get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLeave(requests);
  } catch (err) {
    toast('Error loading leave: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

function renderLeave(requests) {
  $('page-leave').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_leave')}</h2><p>${requests.length} ${t('leave_requests')}</p></div>
    </div>
    <div class="filter-bar">
      <select class="form-control" id="leave-filter-status" onchange="filterLeave()">
        <option value="">${lang==='vi'?'Tất cả trạng thái':'All Status'}</option>
        <option value="pending">${t('leave_pending')}</option>
        <option value="approved">${t('leave_approved')}</option>
        <option value="rejected">${t('leave_rejected')}</option>
      </select>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('att_employee')}</th><th>${t('emp_country')}</th>
            <th>${t('leave_from')}</th><th>${t('leave_to')}</th>
            <th>${t('leave_days')}</th><th>${t('leave_type')}</th>
            <th>${t('leave_reason')}</th><th>${t('leave_status')}</th><th>${t('emp_actions')}</th>
          </tr></thead>
          <tbody id="leave-tbody">
            ${requests.map(r => leaveRow(r)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function leaveRow(r) {
  const statusBadge = {
    pending:  `<span class="badge badge-amber">${t('leave_pending')}</span>`,
    approved: `<span class="badge badge-green">${t('leave_approved')}</span>`,
    rejected: `<span class="badge badge-red">${t('leave_rejected')}</span>`
  }[r.status] || '';

  const canAct = r.status === 'pending' && canManageCountry(r.country);
  const canEdit = isSuperAdmin() || (isAdmin() && canManageCountry(r.country));
  return `<tr>
    <td><strong>${r.employeeName || '–'}</strong></td>
    <td>${COUNTRY_FLAG[r.country] || ''} ${r.country || ''}</td>
    <td>${r.from || ''}</td>
    <td>${r.to || ''}</td>
    <td>${r.days || 1}</td>
    <td>${r.leaveType === 'paid' ? `🟢 ${t('leave_paid')}` : `🔴 ${t('leave_unpaid')}`}</td>
    <td style="max-width:200px;white-space:normal;">${r.reason || ''}</td>
    <td>${statusBadge}</td>
    <td style="white-space:nowrap;">
      ${canAct ? `
        <button class="btn btn-sm btn-success" onclick="approveLeave('${r.id}')">${t('leave_approve')}</button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="rejectLeave('${r.id}')">${t('leave_reject')}</button>
      ` : ''}
      ${canEdit ? `
        <button class="btn btn-sm btn-outline" style="margin-left:4px" onclick="editLeaveRecord('${r.id}','${r.status}','${r.leaveType}')">✏️</button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteRecord('leave','${r.id}')">🗑️</button>
      ` : (!canAct ? '–' : '')}
    </td>
  </tr>`;
}

window.filterLeave = function() {
  // reload with filter applied – simplified
  loadLeave();
};

window.approveLeave = async function(id) {
  try {
    await col.leave().doc(id).update({
      status: 'approved',
      approvedBy: state.userProfile.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Leave approved.', 'success');
    loadLeave();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.rejectLeave = async function(id) {
  const reason = prompt(t('leave_reject_prompt')) || '';
  try {
    const docSnap = await col.leave().doc(id).get();
    const req = docSnap.exists ? docSnap.data() : null;
    await col.leave().doc(id).update({
      status: 'rejected',
      rejectedBy: state.userProfile.uid,
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason
    });
    if (req) {
      sendTelegramNotification(
        lang==='vi'
          ? `❌ <b>Đơn nghỉ phép bị từ chối</b>\n👤 ${req.employeeName || ''}\n📅 ${req.from} → ${req.to}${reason ? `\n📝 Lý do: ${reason}` : ''}`
          : `❌ <b>Leave Request Rejected</b>\n👤 ${req.employeeName || ''}\n📅 ${req.from} → ${req.to}${reason ? `\n📝 Reason: ${reason}` : ''}`
      );
    }
    toast('Leave rejected.', 'success');
    loadLeave();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ── ATTENDANCE & LATE ─────────────────────────────────────────
async function loadAttendance() {
  showLoader();
  try {
    let query = col.attendance().orderBy('date', 'desc').limit(100);
    if (isCountryManager()) query = col.attendance()
      .where('country', '==', state.userProfile.country)
      .orderBy('date', 'desc').limit(100);
    // Nhân viên thường chỉ xem được bản ghi chấm công của CHÍNH MÌNH — dữ
    // liệu chuyên cần/trễ ảnh hưởng trực tiếp lương cá nhân, không nên
    // thấy của người khác.
    if (!isAdmin() && !isCountryManager()) query = col.attendance()
      .where('uid', '==', state.userProfile.uid)
      .orderBy('date', 'desc').limit(100);

    const snap = await query.get();
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAttendance(records);
  } catch (err) {
    toast('Error loading attendance: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

function renderAttendance(records) {
  const isAdminLike = isAdmin() || isCountryManager();
  // Mọi người đều tự khai báo được — nhân viên thường thì tự khai cho
  // CHÍNH MÌNH, chờ admin duyệt mới tính vào lương.
  const canAdd = true;
  $('page-attendance').innerHTML = `
    <div class="page-header">
      <div><h2>Attendance & Late Records</h2><p>${records.length} records</p></div>
      <div class="page-actions">
        ${canAdd ? `<button class="btn btn-primary" onclick="openAddAttendance()">+ Log Record</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Employee</th><th>Date</th><th>Type</th><th>Minutes Late</th>
            <th>Penalty</th><th>Status</th><th>Notes</th>
          </tr></thead>
          <tbody>
            ${records.length ? records.map(r => `
              <tr>
                <td>${r.employeeName || r.uid}</td>
                <td class="td-mono">${r.date || ''}</td>
                <td>${r.type || ''}</td>
                <td>${r.minutesLate ?? '–'}</td>
                <td class="td-mono payroll-negative">$${(r.penalty || 0).toFixed(2)}</td>
                <td>
                  ${r.status === 'pending'
                    ? `<span class="badge badge-amber">${lang==='vi'?'Chờ duyệt':'Pending'}</span>`
                    : r.status === 'rejected'
                    ? `<span class="badge badge-red">${lang==='vi'?'Từ chối':'Rejected'}</span>`
                    : `<span class="badge badge-${r.status === 'processed' ? 'grey' : 'green'}">${r.status === 'processed' ? (lang==='vi'?'Đã tính lương':'Processed') : (lang==='vi'?'Đã duyệt':'Approved')}</span>`}
                </td>
                <td>${r.notes || ''}</td>
                <td style="white-space:nowrap;">
                  ${r.status === 'pending' && isAdminLike ? `
                    <button class="btn btn-sm btn-primary" onclick="approveAttendance('${r.id}')">✓ ${lang==='vi'?'Duyệt':'Approve'}</button>
                    <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="rejectAttendance('${r.id}')">✕ ${lang==='vi'?'Từ chối':'Reject'}</button>
                  ` : ''}
                  ${isAdminLike ? `
                    <button class="btn btn-sm btn-outline" style="margin-left:4px" onclick="editAttendanceRecord('${r.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteRecord('attendance','${r.id}')">🗑️</button>
                  ` : (!isAdminLike && !['pending'].includes(r.status) ? '–' : '')}
                </td>
              </tr>`) .join('')
            : `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⏱️</div><h4>${lang==='vi'?'Chưa có bản ghi chuyên cần':'No attendance records'}</h4></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" id="modal-attendance">
      <div class="modal">
        <div class="modal-header"><h3>Log Attendance Record</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          ${isAdminLike ? `
          <div class="form-group">
            <label>Employee</label>
            <select class="form-control" id="att-uid">
              <option value="">Select employee…</option>
              ${(state.cache.employees || [])
                .filter(e => canManageCountry(e.country) && e.active !== false)
                .map(e => `<option value="${e.uid}" data-salary="${e.salary||0}">${e.name} (${e.country})</option>`)
                .join('')}
            </select>
          </div>
          ` : `
          <div class="card" style="margin-bottom:var(--gap);background:var(--bg);">
            <div class="card-body" style="font-size:.8rem;padding:10px 14px;">
              ${lang==='vi'
                ? `Bạn đang tự khai báo cho <strong>chính mình</strong> (${state.userProfile.name}). Bản ghi sẽ ở trạng thái <strong>Chờ duyệt</strong> — chỉ tính vào lương sau khi Admin/Quản lý xác nhận.`
                : `You are logging this record for <strong>yourself</strong> (${state.userProfile.name}). It will be marked <strong>Pending</strong> — only counted toward payroll once an Admin/Manager approves it.`}
            </div>
          </div>
          <input type="hidden" id="att-uid" value="${state.userProfile.uid}" data-salary="${state.userProfile.salary||0}">
          `}
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input class="form-control" type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Type</label>
              <select class="form-control" id="att-type" onchange="calcLatePenalty()">
                <option value="late_approved">${lang==='vi'?'Đi trễ có xin phép':'Late (Approved)'}</option>
                <option value="unauthorized_absence">${lang==='vi'?'Vắng mặt không phép':'Unauthorized Absence'}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>${lang==='vi'?'Số phút':'Minutes'}</label>
            <input class="form-control" type="number" id="att-minutes"
              placeholder="${lang==='vi'?'VD: 20':'e.g. 20'}" oninput="calcLatePenalty()">
            <p class="form-hint" id="att-penalty-desc" style="margin-top:4px;color:var(--amber);"></p>
          </div>
          <div class="form-group">
            <label>${lang==='vi'?'Tiền phạt tính được':'Calculated Penalty'}</label>
            <input class="form-control" id="att-penalty" readonly placeholder="${lang==='vi'?'Tự động tính':'Auto-calculated'}">
          </div>
          <div class="card" style="margin-bottom:var(--gap);background:var(--bg);">
            <div class="card-body" style="font-size:.78rem;color:var(--text-muted);padding:10px 14px;">
              <strong>${lang==='vi'?'Quy định:':'Policy:'}</strong><br>
              🟡 ${lang==='vi'?'Trễ có xin phép':'Late (approved)'}:
                ${lang==='vi'?'Trừ lương theo tỉ lệ thời gian trễ':'Deduct proportional to late time'}<br>
              🔴 ${lang==='vi'?'Vắng không phép 0–15 phút':'Unauth 0–15 min'}: $5<br>
              🔴 ${lang==='vi'?'Vắng không phép 16–60 phút':'Unauth 16–60 min'}: $10<br>
              🔴 ${lang==='vi'?'Vắng không phép ≥61 phút':'Unauth ≥61 min'}:
                ${lang==='vi'?'Trừ 1 ngày lương':'1 day deduction'}
            </div>
          </div>
          <div class="form-group">
            <label>${lang==='vi'?'Ghi chú':'Notes'}</label>
            <textarea class="form-control" id="att-notes" rows="2"
              placeholder="${lang==='vi'?'Ghi chú (không bắt buộc)…':'Optional notes…'}"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button class="btn btn-primary" onclick="saveAttendance()">Save Record</button>
        </div>
      </div>
    </div>
  `;
}

window.openAddAttendance = function() {
  const isAdminLike = isAdmin() || isCountryManager();
  if (isAdminLike && !state.cache.employees) { loadEmployees().then(() => openModal('modal-attendance')); return; }
  openModal('modal-attendance');
};

window.calcLatePenalty = function() {
  const mins   = parseInt($('att-minutes')?.value) || 0;
  const type   = $('att-type')?.value;
  const sel    = $('att-uid');
  const salary = parseFloat(sel?.selectedOptions?.[0]?.dataset.salary || sel?.dataset?.salary || 0);
  const dailyRate = salary / 26; // 26 working days

  let penalty = 0;
  let desc    = '';

  if (type === 'late_approved') {
    // Đi trễ có xin phép → trừ lương × 1 (theo số phút thực tế)
    penalty = (mins / (8 * 60)) * dailyRate; // tỉ lệ thời gian trễ × lương ngày
    desc = lang==='vi'
      ? `Trễ có phép: ${mins} phút × (lương ngày ÷ 480) = $${penalty.toFixed(2)}`
      : `Approved late: ${mins} min × (daily rate ÷ 480) = $${penalty.toFixed(2)}`;
  } else if (type === 'unauthorized_absence') {
    // Vắng mặt không phép: theo tier
    if (mins >= 61) {
      penalty = dailyRate;
      desc = lang==='vi'
        ? `≥61 phút: trừ 1 ngày lương = $${penalty.toFixed(2)}`
        : `≥61 min: 1 day deduction = $${penalty.toFixed(2)}`;
    } else if (mins >= 16) {
      penalty = 10;
      desc = lang==='vi' ? '16–60 phút: phạt $10' : '16–60 min: $10 penalty';
    } else if (mins >= 1) {
      penalty = 5;
      desc = lang==='vi' ? '0–15 phút: phạt $5' : '0–15 min: $5 penalty';
    }
  }

  const penEl  = $('att-penalty');
  const descEl = $('att-penalty-desc');
  if (penEl)  penEl.value = '$' + penalty.toFixed(2);
  if (descEl) descEl.textContent = desc;
};

window.saveAttendance = async function() {
  const isAdminLike = isAdmin() || isCountryManager();
  const uid  = $('att-uid')?.value;
  const date = $('att-date')?.value;
  const type = $('att-type')?.value;
  const mins = parseInt($('att-minutes')?.value) || 0;
  if (!uid || !date) { toast('Employee and date required.', 'error'); return; }

  const sel = $('att-uid');
  const salary = parseFloat(sel?.dataset?.salary || sel?.selectedOptions?.[0]?.dataset.salary || 0);
  const empName = isAdminLike
    ? (sel?.selectedOptions?.[0]?.textContent || '').split('(')[0].trim()
    : (state.userProfile.name || '');
  const dailyRate = salary / 26;

  let penalty = 0;
  if (type === 'late_approved') {
    // Trễ có phép: trừ theo tỉ lệ
    penalty = (mins / (8 * 60)) * dailyRate;
  } else {
    // Vắng không phép: theo tier
    if (mins >= 61)      penalty = dailyRate;
    else if (mins >= 16) penalty = 10;
    else if (mins >= 1)  penalty = 5;
    else                 penalty = dailyRate; // không nhập phút = tính cả ngày
  }

  try {
    await col.attendance().add({
      uid, date, type, minutesLate: mins, penalty,
      employeeName: empName,
      country: state.userProfile.country || '',
      notes: $('att-notes')?.value || '',
      // Admin/Quản lý tự khai (cho mình hoặc người khác) -> tin cậy ngay,
      // tính vào lương luôn ("logged"). Nhân viên thường tự khai cho CHÍNH
      // MÌNH -> phải chờ Admin/Quản lý duyệt ("pending") mới tính vào lương.
      status: isAdminLike ? 'logged' : 'pending',
      selfReported: !isAdminLike,
      createdBy: state.userProfile.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast(isAdminLike ? 'Attendance record saved.' : (lang==='vi'?'Đã gửi, chờ duyệt.':'Submitted, pending approval.'), 'success');
    closeModal('modal-attendance');
    loadAttendance();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.approveAttendance = async function(id) {
  if (!(isAdmin() || isCountryManager())) return;
  try {
    await col.attendance().doc(id).update({
      status: 'logged',
      approvedBy: state.userProfile.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast(lang==='vi'?'Đã duyệt — đã tính vào lương.':'Approved — now counted toward payroll.', 'success');
    loadAttendance();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.rejectAttendance = async function(id) {
  if (!(isAdmin() || isCountryManager())) return;
  if (!confirm(lang==='vi' ? 'Từ chối bản ghi này? Sẽ không tính vào lương.' : 'Reject this record? It will not count toward payroll.')) return;
  try {
    await col.attendance().doc(id).update({
      status: 'rejected',
      rejectedBy: state.userProfile.uid,
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast(lang==='vi'?'Đã từ chối.':'Rejected.', 'success');
    loadAttendance();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ── VIOLATIONS ────────────────────────────────────────────────
async function loadViolations() {
  showLoader();
  try {
    const [vSnap, typeSnap] = await Promise.all([
      (isCountryManager()
        ? col.violations().where('country','==',state.userProfile.country)
        : col.violations()
      ).orderBy('createdAt','desc').limit(100).get(),
      col.violTypes().get()
    ]);

    const violations = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vtypes = typeSnap.docs.length
      ? typeSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      : DEFAULT_VIOLATIONS;

    renderViolations(violations, vtypes);
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

function renderViolations(violations, vtypes) {
  $('page-violations').innerHTML = `
    <div class="page-header">
      <div><h2>Violations</h2></div>
      <div class="page-actions">
        <button class="btn btn-outline" onclick="openViolationTypes()">⚙️ Manage Types</button>
        <button class="btn btn-primary" onclick="openAddViolation()">+ Log Violation</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('viol_employee')}</th>
            <th>${t('viol_date')}</th>
            <th>${t('viol_type')}</th>
            <th>${t('viol_penalty')}</th>
            <th>${t('viol_status')}</th>
            <th>${t('viol_notes')}</th>
            <th>${t('emp_actions')}</th>
          </tr></thead>
          <tbody>
            ${violations.length ? violations.map(v => `
              <tr>
                <td><strong>${v.employeeName || v.uid}</strong></td>
                <td class="td-mono">${v.date || ''}</td>
                <td>${v.violationType || ''}</td>
                <td class="td-mono payroll-negative">$${(v.penalty || 0).toFixed(2)}</td>
                <td><span class="badge badge-${v.status==='processed'?'grey':'amber'}">
                  ${v.status==='processed'
                    ? (lang==='vi'?'Đã xử lý':'Processed')
                    : (lang==='vi'?'Đã ghi':'Logged')}
                </span></td>
                <td>${v.notes || ''}</td>
                <td style="white-space:nowrap;">
                  <button class="btn btn-sm btn-outline" onclick="editViolation('${v.id}')">✏️</button>
                  <button class="btn btn-sm btn-danger" style="margin-left:4px"
                    onclick="deleteRecord('violations','${v.id}')">🗑️</button>
                </td>
              </tr>`).join('')
            : `<tr><td colspan="7"><div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h4>${t('viol_no_records')}</h4>
              </div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Violation Modal -->
    <div class="modal-overlay" id="modal-violation">
      <div class="modal">
        <div class="modal-header"><h3>Log Violation</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>Employee</label>
            <select class="form-control" id="viol-uid">
              <option value="">Select…</option>
              ${(state.cache.employees||[]).filter(e=>canManageCountry(e.country)&&e.active!==false)
                .map(e=>`<option value="${e.uid}">${e.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input class="form-control" type="date" id="viol-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Violation Type</label>
              <select class="form-control" id="viol-type" onchange="onViolTypeChange()">
                ${vtypes.map(v=>`<option value="${v.id}" data-penalty="${v.penalty}">${v.name} ($${v.penalty})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Penalty Amount (USD)</label>
            <input class="form-control" type="number" id="viol-penalty">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-control" id="viol-notes" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button class="btn btn-primary" onclick="saveViolation()">Save</button>
        </div>
      </div>
    </div>

    <!-- Violation Types Modal -->
    <div class="modal-overlay" id="modal-vtypes">
      <div class="modal">
        <div class="modal-header"><h3>Violation Types</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div id="vtypes-list">
            ${vtypes.map(v=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
                <span>${v.name}</span>
                <span class="td-mono payroll-negative">$${v.penalty}</span>
              </div>`).join('')}
          </div>
          <hr style="margin:16px 0;border-color:var(--border)">
          <h4 style="font-size:.88rem;margin-bottom:8px;">Add New Type</h4>
          <div class="form-row">
            <div class="form-group"><label>Name</label><input class="form-control" id="new-vtype-name" placeholder="Violation name"></div>
            <div class="form-group"><label>Penalty (USD)</label><input class="form-control" type="number" id="new-vtype-penalty" placeholder="0"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">Close</button>
          <button class="btn btn-primary" onclick="addViolationType()">Add Type</button>
        </div>
      </div>
    </div>
  `;

  // Set default penalty
  const vtSel = $('viol-type');
  if (vtSel?.selectedOptions[0]) {
    $('viol-penalty').value = vtSel.selectedOptions[0].dataset.penalty;
  }
}

window.onViolTypeChange = function() {
  const sel = $('viol-type');
  if (sel?.selectedOptions[0]) $('viol-penalty').value = sel.selectedOptions[0].dataset.penalty;
};

window.openAddViolation = function() { openModal('modal-violation'); };
window.openViolationTypes = function() { openModal('modal-vtypes'); };

window.addViolationType = async function() {
  const name = $('new-vtype-name')?.value.trim();
  const penalty = parseFloat($('new-vtype-penalty')?.value) || 0;
  if (!name) { toast('Name required.', 'error'); return; }
  try {
    await col.violTypes().add({ name, penalty, type: 'fixed', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    toast('Violation type added.', 'success');
    closeModal('modal-vtypes');
    loadViolations();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

window.saveViolation = async function() {
  const uid = $('viol-uid')?.value;
  const date = $('viol-date')?.value;
  const typeSel = $('viol-type');
  const typeName = typeSel?.selectedOptions[0]?.textContent.split('(')[0].trim();
  const penalty = parseFloat($('viol-penalty')?.value) || 0;
  if (!uid || !date) { toast('Employee and date required.', 'error'); return; }

  const emp = state.cache.employees?.find(e => e.uid === uid);
  try {
    await col.violations().add({
      uid, date, violationType: typeName, penalty,
      employeeName: emp?.name || '',
      country: emp?.country || '',
      notes: $('viol-notes')?.value || '',
      status: 'logged',
      createdBy: state.userProfile.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Violation logged.', 'success');
    closeModal('modal-violation');
    loadViolations();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ── PAYROLL ───────────────────────────────────────────────────
async function loadPayroll() {
  showLoader();
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;

    let empQuery = col.users().where('active','==',true);
    if (isCountryManager()) empQuery = empQuery.where('country','==',state.userProfile.country);
    const empSnap = await empQuery.get();
    const employees = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    // Load existing payroll for month
    let prQuery = col.payroll().where('month','==',month);
    if (isCountryManager()) prQuery = prQuery.where('country','==',state.userProfile.country);
    const prSnap = await prQuery.get();
    const existing = {};
    prSnap.docs.forEach(d => { existing[d.data().uid] = { id: d.id, ...d.data() }; });

    renderPayroll(employees, existing, month);
  } catch(err) {
    toast('Error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

function renderPayroll(employees, existing, month) {
  const isLocked = Object.values(existing).some(p => p.locked);
  $('page-payroll').innerHTML = `
    <div class="page-header">
      <div><h2>Payroll</h2><p>Month: ${month}</p></div>
      <div class="page-actions">
        ${!isLocked ? `
          <button class="btn btn-gold" onclick="generatePayroll()">${t('pay_generate')}</button>
          <button class="btn btn-outline" onclick="unlockPayroll()" style="display:${Object.values(existing).some(p=>p.locked)?'inline-flex':'none'}">
            🔓 ${lang==='vi'?'Mở khóa':'Unlock'}
          </button>
        ` : `
          <button class="btn btn-outline" onclick="unlockPayroll()">
            🔓 ${lang==='vi'?'Mở khóa để sửa':'Unlock to Edit'}
          </button>
        `}
        <button class="btn btn-outline" onclick="exportPayrollCSV()">${t('pay_export')}</button>
        ${isAdmin() && !isLocked ? `<button class="btn btn-primary" onclick="lockPayroll()">${t('pay_lock')}</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table id="payroll-table">
          <thead><tr>
            <th>${t('pay_employee')}</th><th>${t('pay_country')}</th><th>${t('pay_basic')}</th><th>${t('pay_allowance')}</th>
            <th>${t('pay_ot')}</th><th>${t('pay_holiday')}</th><th>${t('pay_leave_ded')}</th><th>${t('pay_late_ded')}</th>
            <th>${t('pay_penalties')}</th><th class="payroll-total">${t('pay_net')}</th>
            ${!isLocked ? '<th></th>' : ''}
          </tr></thead>
          <tbody>
            ${employees.map(e => {
              const p = existing[e.uid] || {};
              return `<tr>
                <td><strong>${e.name}</strong></td>
                <td>${COUNTRY_FLAG[e.country]||''} ${e.country}</td>
                <td class="td-mono">${formatCurrency(p.basic || e.salary || 0, e.currency || getCurrency(e.country))}</td>
                <td class="td-mono">${formatCurrency(p.allowance || e.allowance || 0, e.currency || getCurrency(e.country))}</td>
                <td class="td-mono payroll-positive">+$${(p.ot || 0).toFixed(2)}</td>
                <td class="td-mono payroll-positive">+$${(p.holiday || 0).toFixed(2)}</td>
                <td class="td-mono payroll-negative">-$${(p.leaveDeduction || 0).toFixed(2)}</td>
                <td class="td-mono payroll-negative">-$${(p.lateDeduction || 0).toFixed(2)}</td>
                <td class="td-mono payroll-negative">-$${(p.penalties || 0).toFixed(2)}</td>
                <td class="td-mono payroll-total">$${(p.net || (e.salary||0) + (e.allowance||0)).toLocaleString()}</td>
                ${!isLocked ? `<td><button class="btn btn-sm btn-outline" onclick="editPayrollLine('${e.uid}')">Edit</button></td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.generatePayroll = async function() {
  if (!confirm(t('pay_confirm_gen'))) return;
  showLoader();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  try {
    let empQuery = col.users().where('active','==',true);
    if (isCountryManager()) empQuery = empQuery.where('country','==',state.userProfile.country);
    const empSnap = await empQuery.get();
    const employees = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    // Aggregate deductions from attendance & violations
    const [attSnap, violSnap] = await Promise.all([
      col.attendance().where('date','>=',`${month}-01`).where('date','<=',`${month}-31`).get(),
      col.violations().where('date','>=',`${month}-01`).where('date','<=',`${month}-31`).get()
    ]);

    const lateByUID = {};
    attSnap.docs.forEach(d => {
      const rec = d.data();
      // QUAN TRỌNG: bản ghi "pending" (nhân viên tự khai, chưa duyệt) hoặc
      // "rejected" (bị từ chối) KHÔNG được tính vào lương — chỉ những bản
      // ghi do admin/quản lý tạo (status "logged"/"processed") hoặc đã
      // được duyệt mới tính.
      if (rec.status === 'pending' || rec.status === 'rejected') return;
      lateByUID[rec.uid] = (lateByUID[rec.uid] || 0) + (rec.penalty || 0);
    });

    const violByUID = {};
    violSnap.docs.forEach(d => {
      const rec = d.data();
      violByUID[rec.uid] = (violByUID[rec.uid] || 0) + (rec.penalty || 0);
    });

    const batch = db.batch();
    for (const e of employees) {
      const basic      = e.salary || 0;
      const allowance  = e.allowance || 0;
      const lateDeduction = lateByUID[e.uid] || 0;
      const penalties  = violByUID[e.uid] || 0;
      const net = basic + allowance - lateDeduction - penalties;

      const ref = col.payroll().doc(`${month}_${e.uid}`);
      batch.set(ref, {
        uid: e.uid,
        employeeName: e.name,
        country: e.country,
        month,
        basic, allowance,
        ot: 0, holiday: 0,
        leaveDeduction: 0,
        lateDeduction, penalties, net,
        locked: false,
        generatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
    toast('Payroll generated.', 'success');
    loadPayroll();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

window.unlockPayroll = async function() {
  if (!isSuperAdmin()) {
    toast(lang==='vi'?'Chỉ Super Admin mới có thể mở khóa.':'Only Super Admin can unlock payroll.', 'error');
    return;
  }
  if (!confirm(lang==='vi'?'Mở khóa bảng lương để chỉnh sửa?':'Unlock payroll for editing?')) return;
  const now   = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  showLoader();
  try {
    const snap  = await col.payroll().where('month','==',month).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, {
      locked:     false,
      unlockedBy: state.userProfile.uid,
      unlockedAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    await batch.commit();
    toast(lang==='vi'?'✅ Đã mở khóa bảng lương.':'✅ Payroll unlocked.', 'success');
    loadPayroll();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.lockPayroll = async function() {
  if (!confirm(t('pay_confirm_lock'))) return;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const snap = await col.payroll().where('month','==',month).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { locked: true }));
  await batch.commit();
  toast('Payroll locked.', 'success');
  loadPayroll();
};

window.exportPayrollCSV = function() {
  const table = $('payroll-table');
  if (!table) return;
  let csv = '';
  table.querySelectorAll('tr').forEach(row => {
    const cols = [...row.querySelectorAll('th,td')].map(c => `"${c.textContent.trim()}"`);
    csv += cols.join(',') + '\n';
  });
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `payroll_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};

window.editPayrollLine = async function(uid) {
  const now   = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const docId = `${month}_${uid}`;

  showLoader();
  try {
    const snap = await col.payroll().doc(docId).get();
    const p    = snap.exists ? snap.data() : {};
    const emp  = state.cache.employees?.find(e => e.uid === uid);
    const cur  = emp?.currency || getCurrency(emp?.country) || 'USD';
    hideLoader();

    // Build modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'modal-edit-payroll';
    overlay.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>✏️ ${lang==='vi'?'Chỉnh sửa lương':'Edit Payroll'} — ${emp?.name || uid} (${month})</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--amber-bg);border-radius:var(--r-sm);padding:10px 14px;
            font-size:.82rem;color:var(--amber);margin-bottom:var(--gap);">
            ⚠️ ${lang==='vi'
              ? 'Chỉnh sửa thủ công sẽ ghi đè giá trị tự tính. Net Salary sẽ tự cập nhật.'
              : 'Manual edits override auto-calculated values. Net Salary updates automatically.'}
          </div>

          <div style="font-size:.78rem;font-weight:700;color:var(--text-muted);
            text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">
            ${lang==='vi'?'Khoản cộng':'Additions'}
          </div>
          <div class="form-row three">
            <div class="form-group">
              <label>${t('pay_basic')} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-basic"
                value="${p.basic ?? emp?.salary ?? 0}" oninput="recalcNetPreview()">
            </div>
            <div class="form-group">
              <label>${lang==='vi'?'PC cố định':'Fixed Allow.'} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-fixed"
                value="${p.fixedAllowance ?? 0}" oninput="recalcNetPreview()">
            </div>
            <div class="form-group">
              <label>${lang==='vi'?'PC công trường':'Site Allow.'} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-site"
                value="${p.siteAllowance ?? 0}" oninput="recalcNetPreview()">
            </div>
          </div>
          <div class="form-row three">
            <div class="form-group">
              <label>${lang==='vi'?'PC điện thoại':'Phone Allow.'} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-phone"
                value="${p.phoneAllowance ?? 0}" oninput="recalcNetPreview()">
            </div>
            <div class="form-group">
              <label>OT ${lang==='vi'?'thường':'Normal'} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-ot"
                value="${p.otNormal ?? p.ot ?? 0}" oninput="recalcNetPreview()">
            </div>
            <div class="form-group">
              <label>OT ${lang==='vi'?'ngày lễ':'Holiday'} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-holiday"
                value="${p.otHoliday ?? p.holiday ?? 0}" oninput="recalcNetPreview()">
            </div>
          </div>

          <div style="font-size:.78rem;font-weight:700;color:var(--text-muted);
            text-transform:uppercase;letter-spacing:.05em;margin:var(--gap) 0 10px;">
            ${lang==='vi'?'Khoản trừ':'Deductions'}
          </div>
          <div class="form-row three">
            <div class="form-group">
              <label>${t('pay_leave_ded')} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-leave"
                value="${p.leaveDeduction ?? 0}" oninput="recalcNetPreview()">
            </div>
            <div class="form-group">
              <label>${t('pay_late_ded')} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-late"
                value="${p.lateDeduction ?? 0}" oninput="recalcNetPreview()">
            </div>
            <div class="form-group">
              <label>${t('pay_penalties')} (${cur})</label>
              <input class="form-control ep-field" type="number" id="ep-penalty"
                value="${p.penalties ?? 0}" oninput="recalcNetPreview()">
            </div>
          </div>

          <div class="form-group">
            <label>${lang==='vi'?'Ghi chú điều chỉnh':'Adjustment Notes'}</label>
            <textarea class="form-control" id="ep-notes" rows="2"
              placeholder="${lang==='vi'?'Lý do chỉnh sửa…':'Reason for adjustment…'}">${p.adjustmentNotes||''}</textarea>
          </div>

          <!-- Net preview -->
          <div style="margin-top:var(--gap);padding:var(--gap);background:var(--bg);
            border-radius:var(--r);border:1.5px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:.84rem;color:var(--text-muted);">
                ${lang==='vi'?'Lương thực nhận (preview)':'Net Salary (preview)'}
              </span>
              <span id="ep-net-preview" style="font-size:1.3rem;font-weight:800;color:var(--navy);">
                ${formatCurrency(p.net ?? 0, cur)}
              </span>
            </div>
            <div id="ep-formula" style="font-size:.74rem;color:var(--text-muted);margin-top:6px;"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-outline" onclick="regenerateOneEmployee('${uid}','${month}')">
            🔄 ${lang==='vi'?'Tính lại tự động':'Re-calculate Auto'}
          </button>
          <button class="btn btn-primary" onclick="savePayrollEdit('${uid}','${month}','${cur}')">
            💾 ${lang==='vi'?'Lưu chỉnh sửa':'Save Changes'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    recalcNetPreview();
  } catch(e) {
    hideLoader();
    toast('Error: ' + e.message, 'error');
  }
};

// Live net preview inside edit modal
window.recalcNetPreview = function() {
  const get = id => parseFloat($(id)?.value || 0);
  const basic   = get('ep-basic');
  const fixed   = get('ep-fixed');
  const site    = get('ep-site');
  const phone   = get('ep-phone');
  const ot      = get('ep-ot');
  const holiday = get('ep-holiday');
  const leave   = get('ep-leave');
  const late    = get('ep-late');
  const penalty = get('ep-penalty');

  const additions   = basic + fixed + site + phone + ot + holiday;
  const deductions  = leave + late + penalty;
  const net         = Math.max(additions - deductions, 0);

  const previewEl = $('ep-net-preview');
  const formulaEl = $('ep-formula');

  // Get currency from the select inside the modal (use USD fallback)
  if (previewEl) {
    previewEl.textContent = `$${net.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    previewEl.style.color = net > 0 ? 'var(--navy)' : 'var(--red)';
  }
  if (formulaEl) {
    formulaEl.innerHTML = `
      ${lang==='vi'?'Cộng':'Add'}: ${basic} + ${fixed} + ${site} + ${phone} + ${ot} + ${holiday}
      = <strong>${additions.toFixed(2)}</strong> &nbsp;|&nbsp;
      ${lang==='vi'?'Trừ':'Deduct'}: ${leave} + ${late} + ${penalty}
      = <strong style="color:var(--red)">${deductions.toFixed(2)}</strong> &nbsp;|&nbsp;
      <strong style="color:var(--green)">Net = ${net.toFixed(2)}</strong>
    `;
  }
};

// Save manual edits to payroll
window.savePayrollEdit = async function(uid, month, cur) {
  const get = id => parseFloat($(id)?.value || 0);

  const basic      = get('ep-basic');
  const fixedAllow = get('ep-fixed');
  const siteAllow  = get('ep-site');
  const phoneAllow = get('ep-phone');
  const otNormal   = get('ep-ot');
  const otHoliday  = get('ep-holiday');
  const leaveDed   = get('ep-leave');
  const lateDed    = get('ep-late');
  const penalties  = get('ep-penalty');
  const notes      = $('ep-notes')?.value.trim() || '';

  const net = Math.max(
    basic + fixedAllow + siteAllow + phoneAllow + otNormal + otHoliday
    - leaveDed - lateDed - penalties,
    0
  );

  showLoader();
  try {
    await col.payroll().doc(`${month}_${uid}`).set({
      uid, month, currency: cur || 'USD',
      basic,
      fixedAllowance:  fixedAllow,
      siteAllowance:   siteAllow,
      phoneAllowance:  phoneAllow,
      otNormal,
      otHoliday,
      leaveDeduction:  leaveDed,
      lateDeduction:   lateDed,
      penalties,
      net,
      adjustmentNotes: notes,
      manuallyEdited:  true,
      editedBy:        state.userProfile.uid,
      editedAt:        firebase.firestore.FieldValue.serverTimestamp(),
      locked:          false,
    }, { merge: true });

    toast(
      lang==='vi'
        ? `✅ Đã lưu. Lương thực nhận: ${formatCurrency(net, cur)}`
        : `✅ Saved. Net salary: ${formatCurrency(net, cur)}`,
      'success'
    );
    document.getElementById('modal-edit-payroll')?.remove();
    loadPayroll();
  } catch(e) {
    toast('Save failed: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// Re-calculate one employee automatically (pull fresh from all sources)
window.regenerateOneEmployee = async function(uid, month) {
  if (!confirm(lang==='vi'
    ? 'Tính lại lương tự động từ dữ liệu Attendance, OT, Allowance, Site? Sẽ ghi đè chỉnh sửa thủ công.'
    : 'Re-calculate from Attendance, OT, Allowance, Site data? Manual edits will be overwritten.')) return;

  showLoader();
  const monthStart = `${month}-01`;
  const monthEnd   = `${month}-31`;

  try {
    const emp = state.cache.employees?.find(e => e.uid === uid);
    if (!emp) { toast('Employee not found.', 'error'); return; }

    const now = new Date(month + '-01');
    const weeksInMonth = countWeeksInMonth(now.getFullYear(), now.getMonth());

    const [attSnap, violSnap, otSnap, allowSnap, siteSnap] = await Promise.all([
      col.attendance().where('uid','==',uid).where('date','>=',monthStart).where('date','<=',monthEnd).get(),
      col.violations().where('uid','==',uid).where('date','>=',monthStart).where('date','<=',monthEnd).get(),
      col.otRequests().where('employeeId','==',uid).where('date','>=',monthStart).where('date','<=',monthEnd).where('status','==','approved').get(),
      col.empAllowances().where('employeeId','==',uid).get(),
      col.siteRecords().where('employeeId','==',uid).where('date','>=',monthStart).where('date','<=',monthEnd).where('eligible','==',true).where('status','==','approved').get(),
    ]);

    const lateDed    = attSnap.docs.reduce((s,d) => s + (d.data().penalty||0), 0);
    const penalties  = violSnap.docs.reduce((s,d) => s + (d.data().penalty||0), 0);
    let otNormal = 0, otHoliday = 0;
    otSnap.docs.forEach(d => {
      const r = d.data();
      if (r.otType === 'holiday') otHoliday += r.otPay||0;
      else otNormal += r.otPay||0;
    });
    const fixedAllow  = allowSnap.docs.filter(d=>d.data().frequency==='monthly').reduce((s,d)=>s+(d.data().amount||0),0);
    const siteAllow   = siteSnap.docs.reduce((s,d)=>s+(d.data().amount||0),0);
    const cur         = emp.currency || getCurrency(emp.country);
    const phoneAllow  = cur === 'USD' ? weeksInMonth : 0;
    const basic       = emp.salary || 0;
    const net         = Math.max(basic + fixedAllow + siteAllow + phoneAllow + otNormal + otHoliday - lateDed - penalties, 0);

    await col.payroll().doc(`${month}_${uid}`).set({
      uid, month, currency: cur,
      employeeName: emp.name, country: emp.country,
      basic, fixedAllowance: fixedAllow, siteAllowance: siteAllow,
      phoneAllowance: phoneAllow, otNormal, otHoliday,
      leaveDeduction: 0, lateDeduction: lateDed, penalties, net,
      weeksInMonth, manuallyEdited: false, locked: false,
      generatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    toast(
      lang==='vi'
        ? `✅ Đã tính lại lương cho ${emp.name}: ${formatCurrency(net, cur)}`
        : `✅ Re-calculated for ${emp.name}: ${formatCurrency(net, cur)}`,
      'success'
    );
    document.getElementById('modal-edit-payroll')?.remove();
    loadPayroll();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── POLICIES ──────────────────────────────────────────────────
async function loadPolicies() {
  if (!isAdmin()) { toast('Access denied.', 'error'); return; }
  showLoader();
  try {
    const snap = await col.policy().get();
    const policies = {};
    snap.docs.forEach(d => { policies[d.id] = d.data(); });
    renderPolicies(policies);
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
}

function renderPolicies(policies) {
  $('page-policies').innerHTML = `
    <div class="page-header">
      <div><h2>Policy Settings</h2><p>Country-level payroll and HR policies</p></div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="seedDefaultPolicies()">🌱 Seed Defaults</button>
      </div>
    </div>
    ${COUNTRIES.map(c => {
      const p = policies[c] || {};
      return `
      <div class="card" style="margin-bottom:var(--gap);">
        <div class="card-header">
          <h3>${COUNTRY_FLAG[c]} ${c} Policy</h3>
          <button class="btn btn-sm btn-outline" onclick="editPolicy('${c}')">Edit</button>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Currency</div>
              <strong>${p.currency || 'USD'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Working Days</div>
              <strong>${(p.working_days || []).join(', ') || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Weekly Off</div>
              <strong>${(p.weekly_off || []).join(', ') || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Leave Days/Month</div>
              <strong>${p.leave_days_per_month ?? 1}</strong>
            </div>
          </div>
        </div>
      </div>`;
    }).join('')}

    <div class="modal-overlay" id="modal-policy">
      <div class="modal">
        <div class="modal-header"><h3 id="modal-policy-title">Edit Policy</h3><button class="modal-close">×</button></div>
        <div class="modal-body" id="modal-policy-body"></div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button class="btn btn-primary" onclick="savePolicy()">Save Policy</button>
        </div>
      </div>
    </div>
  `;
}

window.editPolicy = async function(country) {
  const snap = await col.policy().doc(country).get();
  const p = snap.exists ? snap.data() : DEFAULT_CAMBODIA_POLICY;
  $('modal-policy-title').textContent = `${country} Policy`;
  $('modal-policy-body').innerHTML = `
    <input type="hidden" id="policy-country" value="${country}">
    <div class="form-row">
      <div class="form-group">
        <label>${lang==='vi'?'Đơn vị tiền tệ':'Currency'}</label>
        <input class="form-control" id="policy-currency" value="${p.currency||'USD'}">
      </div>
      <div class="form-group">
        <label>${lang==='vi'?'Số ngày phép/tháng':'Leave Days Per Month'}</label>
        <input class="form-control" type="number" id="policy-leave" value="${p.leave_days_per_month??1}">
      </div>
    </div>
    <div class="form-group">
      <label>${lang==='vi'?'Ngày làm việc (cách nhau bởi dấu phẩy)':'Working Days (comma-separated)'}</label>
      <input class="form-control" id="policy-working" value="${(p.working_days||[]).join(', ')}">
    </div>
    <div class="form-group">
      <label>${lang==='vi'?'Ngày nghỉ hàng tuần':'Weekly Off Days'}</label>
      <input class="form-control" id="policy-off" value="${(p.weekly_off||[]).join(', ')}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${lang==='vi'?'Hệ số OT (ngoài giờ)':'OT Multiplier'}</label>
        <select class="form-control" id="policy-ot-mult">
          <option value="1.5" ${(p.ot_multiplier||1.5)==1.5?'selected':''}>×1.5</option>
          <option value="2"   ${(p.ot_multiplier||1.5)==2?'selected':''}>×2</option>
        </select>
        <p class="form-hint">${lang==='vi'?'Áp dụng cho OT thường':'Applied to normal OT'}</p>
      </div>
      <div class="form-group">
        <label>${lang==='vi'?'Hệ số ngày lễ/nghỉ':'Holiday Multiplier'}</label>
        <select class="form-control" id="policy-holiday-mult">
          <option value="1.5" ${(p.holiday_multiplier||1.5)==1.5?'selected':''}>×1.5</option>
          <option value="2"   ${(p.holiday_multiplier||1.5)==2?'selected':''}>×2</option>
        </select>
        <p class="form-hint">${lang==='vi'?'Làm việc ngày lễ/ngày nghỉ':'Working on holidays/days off'}</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${lang==='vi'?'Phụ cấp điện thoại ($/tuần)':'Phone Allowance ($/week)'}</label>
        <input class="form-control" type="number" id="policy-phone" 
          value="${p.phone_allowance_per_week??1}" step="0.5">
        <p class="form-hint">${lang==='vi'?'Tự động tính vào bảng lương':'Auto-calculated in payroll'}</p>
      </div>
      <div class="form-group">
        <label>${lang==='vi'?'Số ngày công/tháng':'Working Days Per Month'}</label>
        <input class="form-control" type="number" id="policy-work-days" 
          value="${p.working_days_per_month??26}">
        <p class="form-hint">${lang==='vi'?'Dùng để tính lương ngày':'Used for daily rate calculation'}</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${lang==='vi'?'Phụ cấp công trường Phnom Penh ($/ngày)':'Site Allowance Phnom Penh ($/day)'}</label>
        <input class="form-control" type="number" id="policy-site-pp" 
          value="${p.site_allowance_pp??5}" step="0.5">
      </div>
      <div class="form-group">
        <label>${lang==='vi'?'Phụ cấp công trường Tỉnh ($/ngày)':'Site Allowance Province ($/day)'}</label>
        <input class="form-control" type="number" id="policy-site-prov" 
          value="${p.site_allowance_province??6}" step="0.5">
      </div>
    </div>
  `;
  openModal('modal-policy');
};

window.savePolicy = async function() {
  const country = $('policy-country')?.value;
  if (!country) return;

  const data = {
    country,
    currency:              $('policy-currency')?.value || 'USD',
    leave_days_per_month:  parseInt($('policy-leave')?.value) || 1,
    working_days:          ($('policy-working')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
    weekly_off:            ($('policy-off')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
    ot_multiplier:         parseFloat($('policy-ot-mult')?.value) || 1.5,
    holiday_multiplier:    parseFloat($('policy-holiday-mult')?.value) || 1.5,
    phone_allowance_per_week: parseFloat($('policy-phone')?.value) || 1,
    working_days_per_month:   parseInt($('policy-work-days')?.value) || 26,
    site_allowance_pp:        parseFloat($('policy-site-pp')?.value) || 5,
    site_allowance_province:  parseFloat($('policy-site-prov')?.value) || 6,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  showLoader();
  try {
    await col.policy().doc(country).set(data, { merge: true });
    toast(lang==='vi'?'✅ Đã lưu chính sách.':'✅ Policy saved.', 'success');
    closeModal('modal-policy');
    loadPolicies();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

window.seedDefaultPolicies = async function() {
  if (!confirm('Seed default Cambodia policy to Firestore?')) return;
  try {
    await col.policy().doc('Cambodia').set(DEFAULT_CAMBODIA_POLICY, { merge: true });
    // Seed holidays
    const batch = db.batch();
    CAMBODIA_HOLIDAYS_2025.forEach(h => {
      const ref = col.holidays().doc(`Cambodia_${h.date}`);
      batch.set(ref, { ...h, country: 'Cambodia', paid: true });
    });
    await batch.commit();
    toast('Default policies and Cambodia holidays seeded.', 'success');
    loadPolicies();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ── REPORTS ───────────────────────────────────────────────────
function loadReports() {
  $('page-reports').innerHTML = `
    <div class="page-header"><div><h2>${t('rep_title')}</h2><p>${t('rep_sub')}</p></div></div>
    <div class="card card-body" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--gap);">
      ${[
        { icon:'👥', label:t('rep_employees'),                                      action:'rptEmployees' },
        { icon:'💰', label:t('rep_payroll'),                                        action:'rptPayroll' },
        { icon:'🌴', label:t('rep_leave'),                                          action:'rptLeave' },
        { icon:'⚠️', label:t('rep_violations'),                                    action:'rptViolations' },
        { icon:'⏰', label:(lang==='vi'?'Báo cáo OT':'OT Report'),                 action:'rptOT' },
        { icon:'⏱️', label:(lang==='vi'?'Báo cáo chuyên cần':'Attendance Report'), action:'rptAttendance' },
        { icon:'🏗️', label:(lang==='vi'?'Báo cáo công trường':'Site Report'),      action:'rptSite' },
        { icon:'📅', label:t('rep_holidays'),                                       action:'rptHolidays' }
      ].map(r => `
        <div class="stat-card navy" style="cursor:pointer;" onclick="${r.action}()">
          <div class="stat-icon">${r.icon}</div>
          <div class="stat-label" style="font-size:.9rem;font-weight:600;color:var(--navy);">${r.label}</div>
          <div class="form-hint" style="margin-top:4px;">${t('rep_export')}</div>
        </div>`).join('')}
    </div>
  `;
}

window.rptEmployees = function() {
  if (!state.cache.employees?.length) { toast('Load employees first.', 'info'); return; }
  const rows = [['Name','Email','Role','Country','Department','Position','Salary','Active']];
  state.cache.employees.forEach(e => rows.push([e.name,e.email,roleLabel(e.role),e.country,e.department,e.position,e.salary,e.active]));
  downloadCSV(rows, 'employees_report');
};
window.rptPayroll = function() { exportPayrollCSV(); };
window.rptLeave = async function() {
  showLoader();
  try {
    let query = col.leave().orderBy('createdAt','desc').limit(500);
    if (isCountryManager()) query = col.leave()
      .where('country','==',state.userProfile.country)
      .orderBy('createdAt','desc').limit(500);
    const snap = await query.get();
    const rows = [[
      lang==='vi'?'Nhân viên':'Employee',
      lang==='vi'?'Quốc gia':'Country',
      lang==='vi'?'Từ ngày':'From',
      lang==='vi'?'Đến ngày':'To',
      lang==='vi'?'Số ngày':'Days',
      lang==='vi'?'Loại':'Type',
      lang==='vi'?'Lý do':'Reason',
      lang==='vi'?'Trạng thái':'Status',
    ]];
    snap.docs.forEach(d => {
      const r = d.data();
      rows.push([
        r.employeeName || '',
        r.country || '',
        r.from || '',
        r.to || '',
        r.days || 1,
        r.leaveType === 'paid'
          ? (lang==='vi'?'Có lương':'Paid')
          : (lang==='vi'?'Không lương':'Unpaid'),
        r.reason || '',
        r.status || '',
      ]);
    });
    downloadCSV(rows, lang==='vi'?'bao_cao_nghi_phep':'leave_report');
    toast(lang==='vi'?`✅ Xuất ${snap.size} bản ghi nghỉ phép.`:`✅ Exported ${snap.size} leave records.`, 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

window.rptViolations = async function() {
  showLoader();
  try {
    let query = col.violations().orderBy('date','desc').limit(500);
    if (isCountryManager()) query = col.violations()
      .where('country','==',state.userProfile.country)
      .orderBy('date','desc').limit(500);
    const snap = await query.get();
    const rows = [[
      lang==='vi'?'Nhân viên':'Employee',
      lang==='vi'?'Quốc gia':'Country',
      lang==='vi'?'Ngày':'Date',
      lang==='vi'?'Vi phạm':'Violation',
      lang==='vi'?'Tiền phạt':'Penalty',
      lang==='vi'?'Trạng thái':'Status',
      lang==='vi'?'Ghi chú':'Notes',
    ]];
    snap.docs.forEach(d => {
      const r = d.data();
      rows.push([
        r.employeeName || '',
        r.country || '',
        r.date || '',
        r.violationType || '',
        r.penalty || 0,
        r.status || '',
        r.notes || '',
      ]);
    });
    downloadCSV(rows, lang==='vi'?'bao_cao_vi_pham':'violations_report');
    toast(lang==='vi'?`✅ Xuất ${snap.size} bản ghi vi phạm.`:`✅ Exported ${snap.size} violation records.`, 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};
window.rptOT = async function() {
  showLoader();
  try {
    let query = col.otRequests().orderBy('date','desc').limit(500);
    if (isCountryManager()) query = col.otRequests()
      .where('country','==',state.userProfile.country)
      .orderBy('date','desc').limit(500);
    const snap = await query.get();
    const rows = [[
      lang==='vi'?'Nhân viên':'Employee',
      lang==='vi'?'Quốc gia':'Country',
      lang==='vi'?'Ngày':'Date',
      lang==='vi'?'Giờ bắt đầu':'Start',
      lang==='vi'?'Giờ kết thúc':'End',
      lang==='vi'?'Số giờ':'Hours',
      lang==='vi'?'Loại OT':'OT Type',
      lang==='vi'?'Tiền OT':'OT Pay',
      lang==='vi'?'Lý do':'Reason',
      lang==='vi'?'Trạng thái':'Status',
    ]];
    snap.docs.forEach(d => {
      const r = d.data();
      rows.push([
        r.employeeName||'', r.country||'', r.date||'',
        r.startTime||'', r.endTime||'',
        (r.hours||0).toFixed(1),
        r.otType||'normal',
        (r.otPay||0).toFixed(2),
        r.reason||'', r.status||'',
      ]);
    });
    downloadCSV(rows, lang==='vi'?'bao_cao_ot':'ot_report');
    toast(lang==='vi'?`✅ Xuất ${snap.size} bản ghi OT.`:`✅ Exported ${snap.size} OT records.`, 'success');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.rptAttendance = async function() {
  showLoader();
  try {
    let query = col.attendance().orderBy('date','desc').limit(500);
    if (isCountryManager()) query = col.attendance()
      .where('country','==',state.userProfile.country)
      .orderBy('date','desc').limit(500);
    const snap = await query.get();
    const rows = [[
      lang==='vi'?'Nhân viên':'Employee',
      lang==='vi'?'Quốc gia':'Country',
      lang==='vi'?'Ngày':'Date',
      lang==='vi'?'Loại':'Type',
      lang==='vi'?'Số phút trễ':'Minutes Late',
      lang==='vi'?'Tiền phạt':'Penalty',
      lang==='vi'?'Ghi chú':'Notes',
    ]];
    snap.docs.forEach(d => {
      const r = d.data();
      rows.push([
        r.employeeName||'', r.country||'', r.date||'',
        r.type||'', r.minutesLate||0,
        (r.penalty||0).toFixed(2),
        r.notes||'',
      ]);
    });
    downloadCSV(rows, lang==='vi'?'bao_cao_chuyen_can':'attendance_report');
    toast(lang==='vi'?`✅ Xuất ${snap.size} bản ghi chuyên cần.`:`✅ Exported ${snap.size} attendance records.`, 'success');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.rptSite = async function() {
  showLoader();
  try {
    let query = col.siteRecords().orderBy('date','desc').limit(500);
    if (isCountryManager()) query = col.siteRecords()
      .where('country','==',state.userProfile.country)
      .orderBy('date','desc').limit(500);
    const snap = await query.get();
    const rows = [[
      lang==='vi'?'Nhân viên':'Employee',
      lang==='vi'?'Quốc gia':'Country',
      lang==='vi'?'Ngày':'Date',
      lang==='vi'?'Dự án':'Project',
      lang==='vi'?'Địa điểm':'Location',
      lang==='vi'?'Giờ vào':'Start',
      lang==='vi'?'Giờ ra':'End',
      lang==='vi'?'Đủ điều kiện':'Eligible',
      lang==='vi'?'Phụ cấp':'Allowance',
      lang==='vi'?'Trạng thái':'Status',
    ]];
    snap.docs.forEach(d => {
      const r = d.data();
      rows.push([
        r.employeeName||'', r.country||'', r.date||'',
        r.project||'', r.location||'',
        r.startTime||'', r.endTime||'',
        r.eligible ? (lang==='vi'?'Có':'Yes') : (lang==='vi'?'Không':'No'),
        (r.amount||0).toFixed(2),
        r.status||'approved',
      ]);
    });
    downloadCSV(rows, lang==='vi'?'bao_cao_cong_truong':'site_report');
    toast(lang==='vi'?`✅ Xuất ${snap.size} bản ghi công trường.`:`✅ Exported ${snap.size} site records.`, 'success');
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.rptHolidays = function() {
  const rows = [['Date','Holiday','Country','Paid']];
  CAMBODIA_HOLIDAYS_2025.forEach(h => rows.push([h.date, h.name, 'Cambodia', 'Yes']));
  downloadCSV(rows, 'holidays_cambodia_2025');
};

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// ── EMPLOYEE SELF-SERVICE ─────────────────────────────────────
async function loadMyProfile() {
  const p = state.userProfile;
  $('page-my-profile').innerHTML = `
    <div class="page-header"><div><h2>${t('page_my_profile')}</h2></div></div>
    <div class="card" style="max-width:520px;">
      <div class="card-body">
        <div style="text-align:center;margin-bottom:var(--gap-lg);">
          <div class="user-avatar" style="width:72px;height:72px;font-size:1.6rem;margin:0 auto var(--gap-sm);">
            ${(p.name||'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <h3>${p.name||'–'}</h3>
          <span class="${roleBadgeClass(p.role)}">${roleLabel(p.role)}</span>
        </div>
        ${profileField(t('my_email'), p.email)}
        ${profileField(t('my_country'), `${COUNTRY_FLAG[p.country]||''} ${p.country||'–'}`)}
        ${profileField(t('my_dept'), p.department||'–')}
        ${profileField(t('my_position'), p.position||'–')}
        ${profileField(t('my_salary'), formatCurrency(p.salary||0, p.currency||getCurrency(p.country)))}
        ${profileField(t('my_allowance'), formatCurrency(p.allowance||0, p.currency||getCurrency(p.country)))}
      </div>
      <div class="card-footer" style="justify-content:flex-end;">
        <button class="btn btn-outline" onclick="openChangePassword()">
          🔑 ${lang==='vi' ? 'Đổi mật khẩu' : 'Change Password'}
        </button>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal-overlay" id="modal-change-password">
      <div class="modal">
        <div class="modal-header">
          <h3>🔑 ${lang==='vi' ? 'Đổi mật khẩu' : 'Change Password'}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>${lang==='vi' ? 'Mật khẩu hiện tại' : 'Current Password'}</label>
            <input class="form-control" type="password" id="pw-current"
              placeholder="${lang==='vi' ? 'Nhập mật khẩu hiện tại…' : 'Enter current password…'}">
          </div>
          <div class="form-group">
            <label>${lang==='vi' ? 'Mật khẩu mới' : 'New Password'}</label>
            <input class="form-control" type="password" id="pw-new"
              placeholder="${lang==='vi' ? 'Tối thiểu 6 ký tự' : 'Minimum 6 characters'}">
          </div>
          <div class="form-group">
            <label>${lang==='vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</label>
            <input class="form-control" type="password" id="pw-confirm"
              placeholder="${lang==='vi' ? 'Nhập lại mật khẩu mới…' : 'Re-enter new password…'}">
          </div>
          <div id="pw-error" style="display:none;color:var(--red);font-size:.82rem;
            background:var(--red-bg);padding:8px 12px;border-radius:var(--r-sm);margin-top:4px;">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">
            ${lang==='vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button class="btn btn-primary" onclick="submitChangePassword()">
            ${lang==='vi' ? 'Xác nhận đổi mật khẩu' : 'Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  `;
}

window.openChangePassword = function() {
  // Clear fields
  ['pw-current','pw-new','pw-confirm'].forEach(id => {
    const el = $(id); if (el) el.value = '';
  });
  const errEl = $('pw-error');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  openModal('modal-change-password');
};

window.submitChangePassword = async function() {
  const currentPw = $('pw-current')?.value;
  const newPw     = $('pw-new')?.value;
  const confirmPw = $('pw-confirm')?.value;
  const errEl     = $('pw-error');

  const showErr = (msg) => {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  };

  // Validate
  if (!currentPw) {
    showErr(lang==='vi' ? 'Vui lòng nhập mật khẩu hiện tại.' : 'Please enter current password.');
    return;
  }
  if (!newPw || newPw.length < 6) {
    showErr(lang==='vi' ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : 'New password must be at least 6 characters.');
    return;
  }
  if (newPw !== confirmPw) {
    showErr(lang==='vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
    return;
  }
  if (newPw === currentPw) {
    showErr(lang==='vi' ? 'Mật khẩu mới phải khác mật khẩu hiện tại.' : 'New password must be different from current password.');
    return;
  }

  showLoader();
  try {
    const user  = auth.currentUser;
    const email = user.email;

    // Re-authenticate với mật khẩu hiện tại trước
    const credential = firebase.auth.EmailAuthProvider.credential(email, currentPw);
    await user.reauthenticateWithCredential(credential);

    // Đổi mật khẩu
    await user.updatePassword(newPw);

    closeModal('modal-change-password');
    toast(
      lang==='vi' ? '✅ Đổi mật khẩu thành công!' : '✅ Password changed successfully!',
      'success'
    );
  } catch(err) {
    let msg = err.message;
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = lang==='vi' ? 'Mật khẩu hiện tại không đúng.' : 'Current password is incorrect.';
    } else if (err.code === 'auth/weak-password') {
      msg = lang==='vi' ? 'Mật khẩu mới quá yếu.' : 'New password is too weak.';
    } else if (err.code === 'auth/requires-recent-login') {
      msg = lang==='vi'
        ? 'Phiên đăng nhập quá lâu. Vui lòng đăng xuất và đăng nhập lại.'
        : 'Session expired. Please sign out and sign in again.';
    }
    const errEl = $('pw-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  } finally {
    hideLoader();
  }
};

function profileField(label, value) {
  return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
    <span style="color:var(--text-muted);font-size:.84rem;">${label}</span>
    <strong style="font-size:.88rem;">${value}</strong>
  </div>`;
}

async function getLeaveBalance(uid) {
  try {
    const snap = await col.leaveBalance().doc(uid).get();
    if (snap.exists) return snap.data().balance ?? 0;
    return 0;
  } catch(e) {
    console.error('getLeaveBalance error:', e);
    return 0;
  }
}

async function loadMyLeave() {
  const uid = state.userProfile.uid;
  showLoader();
  let requests = [], balance = 0;
  try {
    const [reqSnap, bal] = await Promise.all([
      col.leave().where('uid','==',uid).limit(50).get(),
      getLeaveBalance(uid)
    ]);
    requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    balance  = bal;
  } catch(e) {
    console.error('loadMyLeave error:', e);
    toast(lang==='vi' ? 'Lỗi tải nghỉ phép: ' + e.message : 'Error loading leave: ' + e.message, 'error');
  } finally { hideLoader(); }

  $('page-my-leave').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_my_leave')}</h2><p>${t('leave_balance')}: <strong>${balance} ${lang==='vi'?'ngày':'days'}</strong></p></div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openRequestLeave()">${t('leave_request_btn')}</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('leave_from')}</th><th>${t('leave_to')}</th><th>${t('leave_days')}</th>
            <th>${t('leave_type')}</th><th>${t('leave_reason')}</th><th>${t('leave_status')}</th>
          </tr></thead>
          <tbody>
            ${requests.length ? requests.map(r=>`
              <tr>
                <td>${r.from}</td><td>${r.to}</td><td>${r.days}</td>
                <td>${r.leaveType==='paid'?`🟢 ${t('leave_paid')}`:`🔴 ${t('leave_unpaid')}`}</td>
                <td>${r.reason||''}</td>
                <td><span class="badge badge-${r.status==='approved'?'green':r.status==='rejected'?'red':'amber'}">${
                  r.status==='approved'?t('leave_approved'):r.status==='rejected'?t('leave_rejected'):t('leave_pending')
                }</span></td>
              </tr>`).join('')
            : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🌴</div><h4>${t('my_no_leave')}</h4></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" id="modal-my-leave">
      <div class="modal">
        <div class="modal-header"><h3>${t('leave_request_btn')}</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label>${t('leave_from_date')}</label><input class="form-control" type="date" id="leave-from"></div>
            <div class="form-group"><label>${t('leave_to_date')}</label><input class="form-control" type="date" id="leave-to"></div>
          </div>
          <div class="form-group"><label>${t('leave_reason_lbl')}</label><textarea class="form-control" id="leave-reason" rows="3" placeholder="${t('leave_reason_ph')}"></textarea></div>
          <p class="form-hint">${t('leave_hint', {bal: balance})}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="submitLeaveRequest()">${t('leave_submit')}</button>
        </div>
      </div>
    </div>
  `;
}

window.openRequestLeave = function() { openModal('modal-my-leave'); };

window.submitLeaveRequest = async function() {
  const from   = $('leave-from')?.value;
  const to     = $('leave-to')?.value;
  const reason = $('leave-reason')?.value.trim();

  // Validate
  if (!from || !to) {
    toast(lang==='vi' ? 'Vui lòng chọn ngày bắt đầu và kết thúc.' : 'Please select from and to dates.', 'error');
    return;
  }

  const fromDate = new Date(from);
  const toDate   = new Date(to);
  if (toDate < fromDate) {
    toast(lang==='vi' ? 'Ngày kết thúc phải sau ngày bắt đầu.' : 'End date must be after start date.', 'error');
    return;
  }
  if (!reason) {
    toast(lang==='vi' ? 'Vui lòng nhập lý do nghỉ phép.' : 'Please enter a reason.', 'error');
    return;
  }

  const days    = Math.ceil((toDate - fromDate) / 86400000) + 1;

  // Đảm bảo profile có — quan trọng trên mobile
  const profileCheck = await ensureProfile();
  if (!profileCheck) {
    toast(lang==='vi'?'Phiên đăng nhập hết hạn.':'Session expired.', 'error');
    return;
  }

  const balance = await getLeaveBalance(auth.currentUser.uid);
  const leaveType = balance >= days ? 'paid' : 'unpaid';

  showLoader();
  try {
    await col.leave().add({
      uid:          auth.currentUser.uid,
      employeeName: state.userProfile.name || '',
      country:      state.userProfile.country || '',
      from, to, days, reason, leaveType,
      status:    'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Gửi thông báo Telegram cho cả nhóm — không chặn luồng chính nếu lỗi.
    sendTelegramNotification(
      lang==='vi'
        ? `🌴 <b>Đơn xin nghỉ phép mới</b>\n👤 ${state.userProfile.name || ''} (${state.userProfile.country || ''})\n📅 ${from} → ${to} (${days} ngày, ${leaveType==='paid'?'có lương':'không lương'})\n📝 Lý do: ${reason}`
        : `🌴 <b>New Leave Request</b>\n👤 ${state.userProfile.name || ''} (${state.userProfile.country || ''})\n📅 ${from} → ${to} (${days} day(s), ${leaveType})\n📝 Reason: ${reason}`
    );

    toast(
      lang==='vi'
        ? `✅ Đã gửi đơn xin nghỉ ${days} ngày (${leaveType==='paid'?'có lương':'không lương'}). Chờ phê duyệt.`
        : `✅ Leave request submitted: ${days} day(s) (${leaveType}). Pending approval.`,
      'success'
    );
    closeModal('modal-my-leave');
    loadMyLeave();
  } catch(e) {
    console.error('Leave submit error:', e);
    toast(
      lang==='vi'
        ? 'Gửi đơn thất bại: ' + e.message
        : 'Submit failed: ' + e.message,
      'error'
    );
  } finally {
    hideLoader();
  }
};

async function loadMySalary() {
  const uid = state.userProfile.uid;
  showLoader();
  let records = [];
  try {
    const snap = await col.payroll().where('uid','==',uid).limit(12).get();
    records = snap.docs.map(d => d.data());
  } catch(e) {
    console.error('loadMySalary error:', e);
    toast(lang==='vi' ? 'Lỗi tải bảng lương: ' + e.message : 'Error loading salary: ' + e.message, 'error');
  } finally { hideLoader(); }

  $('page-my-salary').innerHTML = `
    <div class="page-header"><div><h2>${t('page_my_salary')}</h2></div></div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('pay_month')}</th><th>${t('pay_basic')}</th><th>${t('pay_allowance')}</th><th>${t('pay_ot')}</th>
            <th>${t('my_deductions')}</th><th class="payroll-total">${t('pay_net')}</th>
          </tr></thead>
          <tbody>
            ${records.length ? records.map(r=>`
              <tr>
                <td class="td-mono">${r.month}</td>
                <td class="td-mono">$${(r.basic||0).toLocaleString()}</td>
                <td class="td-mono">$${(r.allowance||0).toLocaleString()}</td>
                <td class="td-mono payroll-positive">+$${(r.ot||0).toFixed(2)}</td>
                <td class="td-mono payroll-negative">-$${((r.leaveDeduction||0)+(r.lateDeduction||0)+(r.penalties||0)).toFixed(2)}</td>
                <td class="td-mono payroll-total">$${(r.net||0).toLocaleString()}</td>
              </tr>`).join('')
            : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💵</div><h4>${t('my_no_salary')}</h4></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadMyPenalties() {
  const uid = state.userProfile.uid;
  showLoader();
  let att = [], viol = [];
  try {
    const [attSnap, violSnap] = await Promise.all([
      col.attendance().where('uid','==',uid).limit(50).get(),
      col.violations().where('uid','==',uid).limit(50).get()
    ]);
    att  = attSnap.docs.map(d => ({ ...d.data(), _type: 'late' }));
    viol = violSnap.docs.map(d => ({ ...d.data(), _type: 'violation' }));
  } catch(e) {
    console.error('loadMyPenalties error:', e);
    toast(lang==='vi' ? 'Lỗi tải dữ liệu phạt: ' + e.message : 'Error loading penalties: ' + e.message, 'error');
  } finally { hideLoader(); }

  const all = [...att, ...viol].sort((a,b) => (b.date||'').localeCompare(a.date||''));

  const total = all.reduce((s,r) => s + (r.penalty||0), 0);

  $('page-my-penalties').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_my_penalties')}</h2><p>${lang==='vi'?'Tổng cộng':'Total'}: <strong class="payroll-negative">$${total.toFixed(2)}</strong></p></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('att_date')}</th><th>${t('att_type')}</th>
            <th>${lang==='vi'?'Chi tiết':'Detail'}</th><th>${t('att_penalty')}</th>
          </tr></thead>
          <tbody>
            ${all.length ? all.map(r=>`
              <tr>
                <td class="td-mono">${r.date||''}</td>
                <td><span class="badge badge-${r._type==='late'?'amber':'red'}">${r._type==='late'?t('viol_late'):t('viol_viol')}</span></td>
                <td>${r.type||r.violationType||''}</td>
                <td class="td-mono payroll-negative">$${(r.penalty||0).toFixed(2)}</td>
              </tr>`).join('')
            : `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">✅</div><h4>${t('my_no_penalties')}</h4></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// OT (Overtime) MODULE
// ═══════════════════════════════════════════════════════════════

async function loadOT() {
  showLoader();
  try {
    let query = col.ot().orderBy('date', 'desc').limit(100);
    if (isCountryManager()) query = col.ot()
      .where('country', '==', state.userProfile.country)
      .orderBy('date', 'desc').limit(100);

    const snap = await query.get();
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOT(records);
  } catch (err) {
    toast('Error loading OT: ' + err.message, 'error');
  } finally { hideLoader(); }
}

function renderOT(records) {
  const canAdd = isAdmin() || isCountryManager();
  const totalPay = records.reduce((s, r) => s + (r.otPay || 0), 0);

  $('page-attendance').innerHTML += ''; // OT is sub-tab of attendance for now
  // Render as standalone section inside attendance page
  const existingContent = $('page-attendance').innerHTML;

  const otSection = `
    <div class="card" style="margin-top:var(--gap);">
      <div class="card-header">
        <h3>⏰ Overtime Records</h3>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="form-hint">Total OT Pay: <strong class="payroll-positive">$${totalPay.toFixed(2)}</strong></span>
          ${canAdd ? `<button class="btn btn-sm btn-primary" onclick="openAddOT()">+ Log OT</button>` : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Employee</th><th>Date</th><th>OT Hours</th>
            <th>Daily Rate</th><th>OT Pay (×2)</th><th>Notes</th>
          </tr></thead>
          <tbody>
            ${records.length ? records.map(r => `
              <tr>
                <td>${r.employeeName || r.uid}</td>
                <td class="td-mono">${r.date || ''}</td>
                <td class="td-mono">${r.hours || 0}h</td>
                <td class="td-mono">$${(r.dailyRate || 0).toFixed(2)}</td>
                <td class="td-mono payroll-positive">+$${(r.otPay || 0).toFixed(2)}</td>
                <td>${r.notes || ''}</td>
              </tr>`).join('')
            : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">⏰</div><h4>No OT records</h4></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add OT Modal -->
    <div class="modal-overlay" id="modal-ot">
      <div class="modal">
        <div class="modal-header"><h3>Log Overtime</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>Employee</label>
            <select class="form-control" id="ot-uid" onchange="calcOTPay()">
              <option value="">Select employee…</option>
              ${(state.cache.employees || [])
                .filter(e => canManageCountry(e.country) && e.active !== false)
                .map(e => `<option value="${e.uid}" data-salary="${e.salary||0}" data-name="${e.name}">${e.name} (${e.country})</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input class="form-control" type="date" id="ot-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>OT Hours</label>
              <input class="form-control" type="number" id="ot-hours" step="0.5" placeholder="e.g. 2.5" oninput="calcOTPay()">
            </div>
          </div>
          <div class="form-group">
            <label>OT Type</label>
            <select class="form-control" id="ot-type" onchange="calcOTPay()">
              <option value="normal">Normal OT (×1.5)</option>
              <option value="holiday">Public Holiday (×2)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Calculated OT Pay</label>
            <input class="form-control" id="ot-pay" readonly placeholder="Auto-calculated">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-control" id="ot-notes" rows="2" placeholder="Project / task…"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button class="btn btn-primary" onclick="saveOT()">Save OT</button>
        </div>
      </div>
    </div>
  `;

  $('page-attendance').insertAdjacentHTML('beforeend', otSection);
}

window.openAddOT = function() {
  if (!state.cache.employees) { loadEmployees().then(() => openModal('modal-ot')); return; }
  openModal('modal-ot');
};

window.calcOTPay = function() {
  const sel = $('ot-uid');
  const salary = parseFloat(sel?.selectedOptions[0]?.dataset.salary || 0);
  const hours  = parseFloat($('ot-hours')?.value) || 0;
  const dailyRate = salary / 26;        // 26 working days
  const hourlyRate = dailyRate / 8;     // 8h work day
  const multiplier = 1.5;               // OT always ×1.5
  const otPay = hourlyRate * hours * 1.5;
  const payEl = $('ot-pay');
  if (payEl) payEl.value = `$${otPay.toFixed(2)} (Daily rate: $${dailyRate.toFixed(2)} | Hourly: $${hourlyRate.toFixed(2)})`;
};

window.saveOT = async function() {
  const sel  = $('ot-uid');
  const uid  = sel?.value;
  const date = $('ot-date')?.value;
  const hours = parseFloat($('ot-hours')?.value) || 0;
  if (!uid || !date || !hours) { toast('Employee, date, and hours required.', 'error'); return; }

  const salary = parseFloat(sel?.selectedOptions[0]?.dataset.salary || 0);
  const empName = sel?.selectedOptions[0]?.dataset.name || '';
  const emp = state.cache.employees?.find(e => e.uid === uid);
  const dailyRate = salary / 26;
  const hourlyRate = dailyRate / 8;
  const otPay = hourlyRate * hours * 1.5;

  try {
    await col.ot().add({
      uid, date, hours, dailyRate, hourlyRate, otPay,
      otType: $('ot-type')?.value || 'normal',
      employeeName: empName,
      country: emp?.country || '',
      notes: $('ot-notes')?.value || '',
      createdBy: state.userProfile.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast(`OT logged: +$${otPay.toFixed(2)} for ${empName}`, 'success');
    closeModal('modal-ot');
    loadAttendance(); // reload whole attendance page
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ═══════════════════════════════════════════════════════════════
// LEAVE BALANCE ACCRUAL ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Accrue 1 leave day per month for all active employees.
 * Called by Super Admin from Policies page.
 * In production: trigger monthly via a Cloud Scheduler + Cloud Function.
 */
window.accrueLeaveBalances = async function() {
  if (!isAdmin()) { toast('Admin access required.', 'error'); return; }
  if (!confirm('Accrue 1 leave day for all active employees now?')) return;
  showLoader();

  try {
    const empSnap = await col.users().where('active', '==', true).get();
    const employees = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    const MAX_BALANCE = 12; // carry-forward cap
    let updated = 0;

    for (const e of employees) {
      const balDoc = await col.leaveBalance().doc(e.uid).get();
      const current = balDoc.exists ? (balDoc.data().balance || 0) : 0;
      const newBalance = Math.min(current + 1, MAX_BALANCE);

      await col.leaveBalance().doc(e.uid).set({
        uid: e.uid,
        employeeName: e.name,
        country: e.country,
        balance: newBalance,
        lastAccruedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      updated++;
    }

    toast(`Leave accrued for ${updated} employees (max ${MAX_BALANCE} days).`, 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

/**
 * Deduct leave balance when a paid leave is approved.
 * Called internally when approving leave requests.
 */
async function deductLeaveBalance(uid, days) {
  const ref = col.leaveBalance().doc(uid);
  const doc = await ref.get();
  const current = doc.exists ? (doc.data().balance || 0) : 0;
  const newBalance = Math.max(current - days, 0);
  await ref.set({ balance: newBalance }, { merge: true });
  return newBalance;
}

// Override approveLeave to also deduct balance
const _origApproveLeave = window.approveLeave;
window.approveLeave = async function(id) {
  showLoader();
  try {
    const docSnap = await col.leave().doc(id).get();
    if (!docSnap.exists) { toast(lang==='vi'?'Không tìm thấy yêu cầu.':'Request not found.', 'error'); return; }
    const req = docSnap.data();

    await col.leave().doc(id).update({
      status:     'approved',
      approvedBy: state.userProfile.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Deduct leave balance if paid
    if (req.leaveType === 'paid') {
      const remaining = await deductLeaveBalance(req.uid, req.days || 1);
      sendTelegramNotification(
        lang==='vi'
          ? `✅ <b>Đơn nghỉ phép đã được duyệt</b>\n👤 ${req.employeeName || ''}\n📅 ${req.from} → ${req.to} (${req.days||1} ngày, có lương)`
          : `✅ <b>Leave Request Approved</b>\n👤 ${req.employeeName || ''}\n📅 ${req.from} → ${req.to} (${req.days||1} day(s), paid)`
      );
      toast(
        lang==='vi'
          ? `✅ Đã duyệt. Số ngày phép còn lại: ${remaining} ngày.`
          : `✅ Approved. Remaining balance: ${remaining} days.`,
        'success'
      );
    } else {
      sendTelegramNotification(
        lang==='vi'
          ? `✅ <b>Đơn nghỉ phép đã được duyệt</b>\n👤 ${req.employeeName || ''}\n📅 ${req.from} → ${req.to} (${req.days||1} ngày, không lương)`
          : `✅ <b>Leave Request Approved</b>\n👤 ${req.employeeName || ''}\n📅 ${req.from} → ${req.to} (${req.days||1} day(s), unpaid)`
      );
      toast(lang==='vi' ? '✅ Đã duyệt nghỉ không lương.' : '✅ Approved (unpaid).', 'success');
    }
    loadLeave();
  } catch(e) {
    toast((lang==='vi'?'Lỗi: ':'Error: ') + e.message, 'error');
  } finally { hideLoader(); }
};

// ═══════════════════════════════════════════════════════════════
// PAYROLL: include OT in generation
// ═══════════════════════════════════════════════════════════════

// Extend generatePayroll to pull OT records per employee per month
const _origGeneratePayroll = window.generatePayroll;
window.generatePayroll = async function() {
  if (!confirm('Generate payroll for all employees this month?')) return;
  showLoader();

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthStart = `${month}-01`;
  const monthEnd   = `${month}-31`;

  try {
    let empQuery = col.users().where('active', '==', true);
    if (isCountryManager()) empQuery = empQuery.where('country', '==', state.userProfile.country);
    const empSnap = await empQuery.get();
    const employees = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    // Load all records for the month
    const [attSnap, violSnap, otSnap, holidayOTSnap] = await Promise.all([
      col.attendance()
        .where('date', '>=', monthStart).where('date', '<=', monthEnd).get(),
      col.violations()
        .where('date', '>=', monthStart).where('date', '<=', monthEnd).get(),
      col.ot().where('otType', '==', 'normal')
        .where('date', '>=', monthStart).where('date', '<=', monthEnd).get(),
      col.ot().where('otType', '==', 'holiday')
        .where('date', '>=', monthStart).where('date', '<=', monthEnd).get()
    ]);

    // Aggregate per UID
    const agg = {};
    const ensure = uid => {
      if (!agg[uid]) agg[uid] = { late: 0, violations: 0, ot: 0, holiday: 0 };
    };

    attSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].late += (r.penalty || 0);
    });
    violSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].violations += (r.penalty || 0);
    });
    otSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].ot += (r.otPay || 0);
    });
    holidayOTSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].holiday += (r.otPay || 0);
    });

    const batch = db.batch();
    for (const e of employees) {
      const a = agg[e.uid] || { late: 0, violations: 0, ot: 0, holiday: 0 };
      const basic     = e.salary || 0;
      const allowance = e.allowance || 0;
      const net = basic + allowance + a.ot + a.holiday - a.late - a.violations;

      const ref = col.payroll().doc(`${month}_${e.uid}`);
      batch.set(ref, {
        uid: e.uid,
        employeeName: e.name,
        country: e.country,
        month,
        basic, allowance,
        ot: a.ot,
        holiday: a.holiday,
        leaveDeduction: 0,
        lateDeduction: a.late,
        penalties: a.violations,
        net: Math.max(net, 0),  // net salary floor = 0
        locked: false,
        generatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    toast(t('pay_generated', {n: employees.length, month}), 'success');
    loadPayroll();
  } catch(e) {
    toast('Error generating payroll: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ═══════════════════════════════════════════════════════════════
// POLICIES PAGE: add accrual button
// ═══════════════════════════════════════════════════════════════

const _origLoadPolicies = loadPolicies;
async function loadPolicies() {
  if (!isAdmin()) { toast('Access denied.', 'error'); return; }
  showLoader();
  try {
    const snap = await col.policy().get();
    const policies = {};
    snap.docs.forEach(d => { policies[d.id] = d.data(); });
    renderPolicies(policies);
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
}

function renderPolicies(policies) {
  $('page-policies').innerHTML = `
    <div class="page-header">
      <div><h2>Policy Settings</h2><p>Country-level payroll and HR policies</p></div>
      <div class="page-actions">
        <button class="btn btn-outline" onclick="accrueLeaveBalances()">🌴 Accrue Leave (Manual)</button>
        <button class="btn btn-primary" onclick="seedDefaultPolicies()">🌱 Seed Defaults</button>
      </div>
    </div>

    ${COUNTRIES.map(c => {
      const p = policies[c] || {};
      return `
      <div class="card" style="margin-bottom:var(--gap);">
        <div class="card-header">
          <h3>${COUNTRY_FLAG[c]} ${c} Policy</h3>
          <button class="btn btn-sm btn-outline" onclick="editPolicy('${c}')">Edit</button>
        </div>
        <div class="card-body">
          <div class="form-row three">
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Tiền tệ':'Currency'}</div>
              <strong>${p.currency || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Ngày làm việc':'Working Days'}</div>
              <strong style="font-size:.82rem;">${(p.working_days || []).join(', ') || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Ngày nghỉ':'Weekly Off'}</div>
              <strong>${(p.weekly_off || []).join(', ') || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Ngày phép/tháng':'Leave Days/Month'}</div>
              <strong>${p.leave_days_per_month ?? '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Hệ số OT':'OT Multiplier'}</div>
              <strong style="color:var(--green)">×${p.ot_multiplier || 1.5}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Hệ số ngày lễ':'Holiday Multiplier'}</div>
              <strong style="color:var(--green)">×${p.holiday_multiplier || 1.5}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'PC điện thoại':'Phone Allow.'}</div>
              <strong>$${p.phone_allowance_per_week ?? 1}/${lang==='vi'?'tuần':'week'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'Ngày công/tháng':'Work Days/Month'}</div>
              <strong>${p.working_days_per_month ?? 26} ${lang==='vi'?'ngày':'days'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'PC site Phnom Penh':'Site PP'}</div>
              <strong>$${p.site_allowance_pp ?? 5}/${lang==='vi'?'ngày':'day'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">${lang==='vi'?'PC site Tỉnh':'Site Province'}</div>
              <strong>$${p.site_allowance_province ?? 6}/${lang==='vi'?'ngày':'day'}</strong>
            </div>
          </div>
        </div>
      </div>`;
    }).join('')}

    <div class="card">
      <div class="card-header"><h3>📅 Cambodia Holidays 2025</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;">
          ${CAMBODIA_HOLIDAYS_2025.map(h => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
              <span style="font-size:.82rem;">${h.name}</span>
              <span class="td-mono" style="font-size:.78rem;color:var(--text-muted);">${h.date}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="modal-policy">
      <div class="modal">
        <div class="modal-header"><h3 id="modal-policy-title">Edit Policy</h3><button class="modal-close">×</button></div>
        <div class="modal-body" id="modal-policy-body"></div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">Cancel</button>
          <button class="btn btn-primary" onclick="savePolicy()">Save Policy</button>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// GENERIC DELETE RECORD
// ═══════════════════════════════════════════════════════════════
window.deleteRecord = async function(colName, id) {
  if (!confirm(lang==='vi'?'Xóa bản ghi này?':'Delete this record?')) return;
  showLoader();
  try {
    await col[colName]().doc(id).delete();
    toast(lang==='vi'?'✅ Đã xóa.':'✅ Deleted.', 'success');
    // Reload current page
    loadPageData(state.activePage);
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── Edit Leave Record ─────────────────────────────────────────
window.editLeaveRecord = async function(id, currentStatus, currentType) {
  const newStatus = prompt(
    (lang==='vi'?'Trạng thái mới (pending/approved/rejected):':'New status (pending/approved/rejected):'),
    currentStatus
  );
  if (!newStatus) return;
  if (!['pending','approved','rejected'].includes(newStatus)) {
    toast(lang==='vi'?'Trạng thái không hợp lệ.':'Invalid status.', 'error');
    return;
  }
  const newType = prompt(
    (lang==='vi'?'Loại nghỉ (paid/unpaid):':'Leave type (paid/unpaid):'),
    currentType
  );
  if (!newType) return;
  showLoader();
  try {
    await col.leave().doc(id).update({
      status:    newStatus,
      leaveType: newType,
      editedBy:  state.userProfile.uid,
      editedAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã cập nhật.':'✅ Updated.', 'success');
    loadLeave();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── Edit Attendance Record ────────────────────────────────────
window.editAttendanceRecord = async function(id) {
  showLoader();
  let rec;
  try {
    const snap = await col.attendance().doc(id).get();
    if (!snap.exists) { toast('Not found.', 'error'); hideLoader(); return; }
    rec = snap.data();
  } catch(e) { hideLoader(); toast('Error: ' + e.message, 'error'); return; }
  hideLoader();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'modal-edit-att';
  const salary = state.cache.employees?.find(e=>e.uid===rec.uid)?.salary || 0;
  const dailyRate = salary / 26;

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>✏️ ${lang==='vi'?'Sửa bản ghi chuyên cần':'Edit Attendance'} — ${rec.employeeName||''}</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>${lang==='vi'?'Ngày':'Date'}</label>
          <input class="form-control" type="date" id="ea-date" value="${rec.date||''}">
        </div>
        <div class="form-group">
          <label>${lang==='vi'?'Loại':'Type'}</label>
          <select class="form-control" id="ea-type" onchange="recalcAttPenalty(${dailyRate})">
            <option value="late_approved" ${rec.type==='late_approved'?'selected':''}>${lang==='vi'?'Đi trễ có xin phép':'Late (Approved)'}</option>
            <option value="unauthorized_absence" ${rec.type==='unauthorized_absence'?'selected':''}>${lang==='vi'?'Vắng không phép':'Unauthorized Absence'}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${lang==='vi'?'Số phút':'Minutes'}</label>
          <input class="form-control" type="number" id="ea-minutes" value="${rec.minutesLate||0}"
            oninput="recalcAttPenalty(${dailyRate})">
        </div>
        <div class="form-group">
          <label>${lang==='vi'?'Tiền phạt':'Penalty'} ($)</label>
          <input class="form-control" type="number" id="ea-penalty" value="${(rec.penalty||0).toFixed(2)}">
          <p class="form-hint" id="ea-hint"></p>
        </div>
        <div class="form-group">
          <label>${lang==='vi'?'Ghi chú':'Notes'}</label>
          <textarea class="form-control" id="ea-notes" rows="2">${rec.notes||''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
        <button class="btn btn-primary" onclick="saveAttendanceEdit('${id}')">
          💾 ${lang==='vi'?'Lưu':'Save'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
  recalcAttPenalty(dailyRate);
};

window.recalcAttPenalty = function(dailyRate) {
  const type = $('ea-type')?.value;
  const mins = parseInt($('ea-minutes')?.value) || 0;
  let penalty = 0, hint = '';

  if (type === 'late_approved') {
    penalty = (mins / 480) * dailyRate;
    hint = lang==='vi' ? `Trễ có phép × tỉ lệ = $${penalty.toFixed(2)}` : `Approved late rate = $${penalty.toFixed(2)}`;
  } else {
    if (mins >= 61)      { penalty = dailyRate; hint = lang==='vi'?`≥61 phút = 1 ngày lương ($${dailyRate.toFixed(2)})`:`≥61 min = 1 day ($${dailyRate.toFixed(2)})`; }
    else if (mins >= 16) { penalty = 10; hint = lang==='vi'?'16–60 phút = $10':'16–60 min = $10'; }
    else if (mins >= 1)  { penalty = 5;  hint = lang==='vi'?'0–15 phút = $5':'0–15 min = $5'; }
    else                 { penalty = dailyRate; hint = lang==='vi'?`Vắng cả ngày = $${dailyRate.toFixed(2)}`:`Full day absence = $${dailyRate.toFixed(2)}`; }
  }
  const penEl  = $('ea-penalty');
  const hintEl = $('ea-hint');
  if (penEl)  penEl.value = penalty.toFixed(2);
  if (hintEl) hintEl.textContent = hint;
};

window.saveAttendanceEdit = async function(id) {
  showLoader();
  try {
    await col.attendance().doc(id).update({
      date:        $('ea-date')?.value,
      type:        $('ea-type')?.value,
      minutesLate: parseInt($('ea-minutes')?.value) || 0,
      penalty:     parseFloat($('ea-penalty')?.value) || 0,
      notes:       $('ea-notes')?.value.trim(),
      editedBy:    state.userProfile.uid,
      editedAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã cập nhật.':'✅ Updated.', 'success');
    document.getElementById('modal-edit-att')?.remove();
    loadAttendance();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── Edit Site Record ──────────────────────────────────────────
window.editSiteRecord = async function(id) {
  showLoader();
  let rec;
  try {
    const snap = await col.siteRecords().doc(id).get();
    if (!snap.exists) { hideLoader(); toast('Not found.','error'); return; }
    rec = snap.data();
  } catch(e) { hideLoader(); toast('Error: '+e.message,'error'); return; }
  hideLoader();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'modal-edit-site';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>✏️ ${lang==='vi'?'Sửa bản ghi công trường':'Edit Site Record'} — ${rec.employeeName||''}</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>${lang==='vi'?'Ngày':'Date'}</label>
            <input class="form-control" type="date" id="es-date" value="${rec.date||''}">
          </div>
          <div class="form-group">
            <label>${t('site_location')}</label>
            <select class="form-control" id="es-location" onchange="recalcSiteEdit()">
              <option value="Phnom Penh" ${rec.location==='Phnom Penh'?'selected':''}>${t('site_pp')} ($5)</option>
              <option value="Province" ${rec.location==='Province'?'selected':''}>${t('site_province')} ($6)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>${t('site_project')}</label>
          <input class="form-control" id="es-project" value="${rec.project||''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('site_start')}</label>
            <input class="form-control" type="time" id="es-start" value="${rec.startTime||'07:30'}" oninput="recalcSiteEdit()">
          </div>
          <div class="form-group">
            <label>${t('site_end')}</label>
            <input class="form-control" type="time" id="es-end" value="${rec.endTime||'14:00'}" oninput="recalcSiteEdit()">
          </div>
        </div>
        <div id="es-result" style="padding:10px;background:var(--bg);border-radius:6px;font-size:.84rem;margin-top:8px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
        <button class="btn btn-primary" onclick="saveSiteEdit('${id}')">💾 ${lang==='vi'?'Lưu':'Save'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
  recalcSiteEdit();
};

window.recalcSiteEdit = function() {
  const start    = $('es-start')?.value || '';
  const end      = $('es-end')?.value   || '';
  const location = $('es-location')?.value || 'Phnom Penh';
  const eligible = calcSiteEligible(start, end);
  const rate     = SITE_RATES[location] || 5;
  const el       = $('es-result');
  if (!el) return;
  el.innerHTML = eligible
    ? `✅ <strong>${lang==='vi'?'Đủ điều kiện':'Eligible'}</strong> → <strong class="payroll-positive">+$${rate}</strong>`
    : `❌ <span style="color:var(--text-muted)">${lang==='vi'?'Không đủ điều kiện':'Not eligible'}</span>`;
};

window.saveSiteEdit = async function(id) {
  const start    = $('es-start')?.value;
  const end      = $('es-end')?.value;
  const location = $('es-location')?.value || 'Phnom Penh';
  const eligible = calcSiteEligible(start, end);
  const amount   = eligible ? (SITE_RATES[location]||5) : 0;
  showLoader();
  try {
    await col.siteRecords().doc(id).update({
      date:      $('es-date')?.value,
      location,
      project:   $('es-project')?.value.trim(),
      startTime: start, endTime: end,
      eligible, amount,
      editedBy:  state.userProfile.uid,
      editedAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã cập nhật.':'✅ Updated.', 'success');
    document.getElementById('modal-edit-site')?.remove();
    loadSiteRecords();
  } catch(e) { toast('Error: '+e.message,'error'); }
  finally { hideLoader(); }
};

// ═══════════════════════════════════════════════════════════════
// RESET PASSWORD via Cloud Function
// ═══════════════════════════════════════════════════════════════
window.resetEmployeePassword = async function(uid, empName) {
  // Lấy email của nhân viên từ cache
  const emp = state.cache.employees?.find(e => e.uid === uid);
  if (!emp?.email) { toast('Không tìm thấy email nhân viên.', 'error'); return; }

  if (!confirm(`Gửi email đặt lại mật khẩu cho ${empName} (${emp.email})?`)) return;

  showLoader();
  try {
    await auth.sendPasswordResetEmail(emp.email);
    toast(`Đã gửi email đặt lại mật khẩu tới ${emp.email}`, 'success');
  } catch(e) {
    toast('Gửi email thất bại: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT: Escape closes any open modal
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

// ═══════════════════════════════════════════════════════════════
// RESPONSIVE: re-collapse sidebar on small screens after navigate
// ═══════════════════════════════════════════════════════════════
function checkResponsive() {
  if (window.innerWidth <= 900 && !state.sidebarCollapsed) {
    // Already collapsed by CSS; keep state consistent
  }
}
window.addEventListener('resize', checkResponsive);

// ════════════════════════════════════════════════════════════════
// MODULE: ALLOWANCE MANAGEMENT
// Collections: apps/hr/employee_allowances
// Types: fixed (monthly), phone (auto-calculated), site (per record)
// ════════════════════════════════════════════════════════════════

// ── LAB KPI (chỉ xem — ghi bởi script kpi-sync.js chạy tay) ────
async function loadLabKpi() {
  showLoader();
  try {
    let query = col.labKpi();
    const [kpiSnap, empSnap] = await Promise.all([
      query.get(),
      col.users().where('active', '==', true).get(),
    ]);
    const kpiByUid = {};
    kpiSnap.docs.forEach(d => { kpiByUid[d.id] = d.data(); });

    let employees = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
    if (isCountryManager()) employees = employees.filter(e => e.country === state.userProfile.country);

    renderLabKpi(employees, kpiByUid);
  } catch (e) {
    toast((lang === 'vi' ? 'Lỗi tải KPI Lab: ' : 'Error loading Lab KPI: ') + e.message, 'error');
  } finally { hideLoader(); }
}

function renderLabKpi(employees, kpiByUid) {
  const withKpi = employees.filter(e => kpiByUid[e.uid]);
  const period = withKpi.length > 0 ? withKpi[0].period : null;

  $('page-lab-kpi').innerHTML = `
    <div class="page-header">
      <div><h2>${lang === 'vi' ? 'KPI Lab System' : 'Lab System KPI'}</h2>
        <p>${lang === 'vi'
          ? 'Số liệu tham khảo, tổng hợp thủ công từ Lab System' + (period ? ` — kỳ ${period}` : '') + '. KHÔNG tự động trừ/thưởng lương — Admin tự xem và quyết định.'
          : 'Reference only, manually synced from Lab System' + (period ? ` — period ${period}` : '') + '. Does NOT auto-adjust payroll — Admin reviews and decides.'}
        </p>
      </div>
    </div>
    ${withKpi.length === 0 ? `
      <div class="empty-state"><div class="empty-icon">🧪</div>
        <h4>${lang === 'vi' ? 'Chưa có dữ liệu KPI' : 'No KPI data yet'}</h4>
        <p>${lang === 'vi' ? 'Chạy script kpi-sync.js --apply để đồng bộ từ Lab System.' : 'Run kpi-sync.js --apply to sync from Lab System.'}</p>
      </div>` : `
    <div class="card">
      <table class="data-table">
        <thead><tr>
          <th>${lang === 'vi' ? 'Nhân viên' : 'Employee'}</th>
          <th>${lang === 'vi' ? 'Vai trò Lab' : 'Lab role'}</th>
          <th>${lang === 'vi' ? 'Việc được giao' : 'Assigned'}</th>
          <th>${lang === 'vi' ? 'Đã xong' : 'Done'}</th>
          <th>${lang === 'vi' ? 'Quá hạn' : 'Overdue'}</th>
          <th>${lang === 'vi' ? '% Hoàn thành' : 'Completion %'}</th>
          <th>${lang === 'vi' ? 'Báo cáo vấn đề (tháng này)' : 'Problem reports (this month)'}</th>
        </tr></thead>
        <tbody>
          ${withKpi.map(e => {
            const k = kpiByUid[e.uid];
            const pct = k.completionRate;
            const pctColor = pct === null ? '' : pct >= 90 ? 'var(--success,#2a8f4d)' : pct >= 60 ? 'var(--warn,#c98a1a)' : 'var(--danger,#c0392b)';
            return `<tr>
              <td>${e.name || ''}</td>
              <td>${k.role || ''}</td>
              <td>${k.tasksAssigned}</td>
              <td>${k.tasksDone}</td>
              <td>${k.tasksOverdue > 0 ? `<b style="color:var(--danger,#c0392b)">${k.tasksOverdue}</b>` : '0'}</td>
              <td>${pct === null ? '—' : `<b style="color:${pctColor}">${pct}%</b>`}</td>
              <td>${k.problemReportsThisMonth > 0 ? `<b style="color:var(--danger,#c0392b)">${k.problemReportsThisMonth}</b>` : '0'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}

async function loadAllowances() {
  showLoader();
  try {
    let query = col.empAllowances().orderBy('createdAt','desc');
    if (isCountryManager()) query = col.empAllowances()
      .where('country','==', state.userProfile.country)
      .orderBy('createdAt','desc');

    const [snap, empSnap] = await Promise.all([
      query.get(),
      (isCountryManager()
        ? col.users().where('country','==',state.userProfile.country)
        : col.users()
      ).where('active','==',true).get()
    ]);

    const allowances = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const employees  = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
    state.cache.employees = employees;
    renderAllowances(allowances, employees);
  } catch(e) {
    toast((lang==='vi'?'Lỗi tải phụ cấp: ':'Error loading allowances: ') + e.message, 'error');
  } finally { hideLoader(); }
}

function renderAllowances(allowances, employees) {
  // Group by employee
  const byEmp = {};
  allowances.forEach(a => {
    if (!byEmp[a.employeeId]) byEmp[a.employeeId] = [];
    byEmp[a.employeeId].push(a);
  });

  $('page-allowances').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_allowances')}</h2>
        <p>${lang==='vi'?'Phụ cấp cố định theo nhân viên':'Fixed allowances per employee'}</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openAddAllowance()">${t('allow_add_fixed')}</button>
      </div>
    </div>

    ${employees.length === 0 ? `<div class="empty-state"><div class="empty-icon">🎁</div><h4>${t('allow_no_data')}</h4></div>` :
      employees.filter(e => byEmp[e.uid]?.length > 0 || true).map(e => {
        const empAllows = byEmp[e.uid] || [];
        const total = empAllows.reduce((s,a) => s + (a.amount||0), 0);
        const cur = e.currency || getCurrency(e.country);
        return `
        <div class="card" style="margin-bottom:var(--gap);">
          <div class="card-header">
            <div>
              <h3>${e.name}</h3>
              <span style="font-size:.78rem;color:var(--text-muted);">
                ${e.position||''} · ${COUNTRY_FLAG[e.country]||''} ${e.country||''}
                · ${lang==='vi'?'Tổng phụ cấp':'Total allowances'}:
                <strong>${formatCurrency(total, cur)}/tháng</strong>
              </span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="openAddAllowance('${e.uid}')">
              + ${lang==='vi'?'Thêm':'Add'}
            </button>
          </div>
          ${empAllows.length > 0 ? `
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>${t('allow_name')}</th>
                <th>${t('allow_type')}</th>
                <th>${t('allow_freq')}</th>
                <th>${t('allow_amount')}</th>
                <th>${t('emp_actions')}</th>
              </tr></thead>
              <tbody>
                ${empAllows.map(a => `
                  <tr>
                    <td>${a.name||'–'}</td>
                    <td><span class="badge badge-blue">${a.allowanceType||'fixed'}</span></td>
                    <td>${a.frequency==='monthly'?t('allow_monthly'):a.frequency||'–'}</td>
                    <td class="td-mono payroll-positive">+${formatCurrency(a.amount||0, cur)}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" onclick="deleteAllowance('${a.id}')">
                        ${lang==='vi'?'Xóa':'Delete'}
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : `
          <div class="card-body" style="color:var(--text-muted);font-size:.84rem;">
            ${lang==='vi'?'Chưa có phụ cấp cố định':'No fixed allowances yet'}
          </div>`}
        </div>`;
      }).join('')}

    <!-- Add Allowance Modal -->
    <div class="modal-overlay" id="modal-allowance">
      <div class="modal">
        <div class="modal-header">
          <h3>${t('allow_add_fixed')}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>${t('allow_employee')}</label>
            <select class="form-control" id="allow-emp">
              <option value="">${lang==='vi'?'Chọn nhân viên…':'Select employee…'}</option>
              ${employees.map(e=>`<option value="${e.uid}" data-country="${e.country}" data-currency="${e.currency||getCurrency(e.country)}">${e.name} (${e.country})</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('allow_name')}</label>
              <input class="form-control" id="allow-name" placeholder="${lang==='vi'?'VD: Phụ cấp điện thoại':'e.g. Phone Allowance'}">
            </div>
            <div class="form-group">
              <label>${t('allow_type')}</label>
              <select class="form-control" id="allow-type">
                <option value="position">${lang==='vi'?'Phụ cấp chức vụ':'Position Allowance'}</option>
                <option value="phone">${lang==='vi'?'Phụ cấp điện thoại':'Phone Allowance'}</option>
                <option value="transport">${lang==='vi'?'Phụ cấp xăng xe':'Transport Allowance'}</option>
                <option value="responsibility">${lang==='vi'?'Phụ cấp trách nhiệm':'Responsibility Allowance'}</option>
                <option value="other">${lang==='vi'?'Khác':'Other'}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('allow_amount')} (USD)</label>
              <input class="form-control" type="number" id="allow-amount" placeholder="0">
            </div>
            <div class="form-group">
              <label>${t('allow_freq')}</label>
              <select class="form-control" id="allow-freq">
                <option value="monthly">${t('allow_monthly')}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="saveAllowance()">${t('btn_save')}</button>
        </div>
      </div>
    </div>
  `;
}

window.openAddAllowance = function(presetUid = '') {
  const sel = $('allow-emp');
  if (sel && presetUid) sel.value = presetUid;
  openModal('modal-allowance');
};

window.saveAllowance = async function() {
  const empId = $('allow-emp')?.value;
  const name  = $('allow-name')?.value.trim();
  const amount= parseFloat($('allow-amount')?.value) || 0;
  if (!empId || !name) {
    toast(lang==='vi'?'Vui lòng chọn nhân viên và nhập tên phụ cấp.':'Employee and name required.', 'error');
    return;
  }
  const emp = state.cache.employees?.find(e => e.uid === empId);
  showLoader();
  try {
    await col.empAllowances().add({
      employeeId:    empId,
      employeeName:  emp?.name || '',
      country:       emp?.country || '',
      name,
      allowanceType: $('allow-type')?.value || 'other',
      amount,
      currency:      emp?.currency || getCurrency(emp?.country),
      frequency:     $('allow-freq')?.value || 'monthly',
      createdBy:     state.userProfile.uid,
      createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã thêm phụ cấp.':'✅ Allowance added.', 'success');
    closeModal('modal-allowance');
    loadAllowances();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── Edit Violation ───────────────────────────────────────────
window.editViolation = async function(id) {
  showLoader();
  let rec;
  try {
    const snap = await col.violations().doc(id).get();
    if (!snap.exists) { hideLoader(); toast('Not found.','error'); return; }
    rec = snap.data();
  } catch(e) { hideLoader(); toast('Error: '+e.message,'error'); return; }
  hideLoader();

  // Load violation types for dropdown
  let vtypes = [];
  try {
    const vtSnap = await col.violTypes().get();
    vtypes = vtSnap.docs.length
      ? vtSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      : DEFAULT_VIOLATIONS;
  } catch(e) { vtypes = DEFAULT_VIOLATIONS; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'modal-edit-viol';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>✏️ ${lang==='vi'?'Sửa vi phạm':'Edit Violation'} — ${rec.employeeName||''}</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>${lang==='vi'?'Ngày':'Date'}</label>
            <input class="form-control" type="date" id="ev-date" value="${rec.date||''}">
          </div>
          <div class="form-group">
            <label>${t('viol_type')}</label>
            <select class="form-control" id="ev-type" onchange="onEvTypeChange()">
              ${vtypes.map(v =>
                `<option value="${v.name}" data-penalty="${v.penalty}"
                  ${rec.violationType===v.name?'selected':''}>
                  ${v.name} ($${v.penalty})
                </option>`
              ).join('')}
              <option value="__custom__" ${!vtypes.find(v=>v.name===rec.violationType)?'selected':''}>
                ${lang==='vi'?'Khác (nhập tay)':'Other (manual)'}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group" id="ev-custom-group"
          style="display:${!vtypes.find(v=>v.name===rec.violationType)?'block':'none'}">
          <label>${lang==='vi'?'Tên vi phạm (nhập tay)':'Violation name (manual)'}</label>
          <input class="form-control" id="ev-custom-name" value="${rec.violationType||''}">
        </div>
        <div class="form-group">
          <label>${t('viol_penalty')} (USD)</label>
          <input class="form-control" type="number" id="ev-penalty" value="${rec.penalty||0}">
        </div>
        <div class="form-group">
          <label>${lang==='vi'?'Trạng thái':'Status'}</label>
          <select class="form-control" id="ev-status">
            <option value="logged" ${rec.status==='logged'||!rec.status?'selected':''}>
              ${lang==='vi'?'Đã ghi':'Logged'}
            </option>
            <option value="processed" ${rec.status==='processed'?'selected':''}>
              ${lang==='vi'?'Đã xử lý':'Processed'}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>${t('viol_notes')}</label>
          <textarea class="form-control" id="ev-notes" rows="2">${rec.notes||''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
        <button class="btn btn-primary" onclick="saveViolationEdit('${id}')">
          💾 ${lang==='vi'?'Lưu':'Save'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
};

window.onEvTypeChange = function() {
  const sel = $('ev-type');
  const isCustom = sel?.value === '__custom__';
  const customGroup = $('ev-custom-group');
  const penEl = $('ev-penalty');
  if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
  if (!isCustom && penEl && sel?.selectedOptions[0]) {
    penEl.value = sel.selectedOptions[0].dataset.penalty || 0;
  }
};

window.saveViolationEdit = async function(id) {
  const typeSel   = $('ev-type');
  const isCustom  = typeSel?.value === '__custom__';
  const typeName  = isCustom
    ? ($('ev-custom-name')?.value.trim() || 'Other')
    : (typeSel?.value || '');
  const penalty   = parseFloat($('ev-penalty')?.value) || 0;
  const status    = $('ev-status')?.value || 'logged';
  const notes     = $('ev-notes')?.value.trim() || '';

  if (!typeName) {
    toast(lang==='vi'?'Vui lòng chọn hoặc nhập loại vi phạm.':'Please select or enter violation type.', 'error');
    return;
  }

  showLoader();
  try {
    await col.violations().doc(id).update({
      date:          $('ev-date')?.value,
      violationType: typeName,
      penalty,
      status,
      notes,
      editedBy:  state.userProfile.uid,
      editedAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã cập nhật vi phạm.':'✅ Violation updated.', 'success');
    document.getElementById('modal-edit-viol')?.remove();
    loadViolations();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

window.deleteAllowance = async function(id) {
  if (!confirm(lang==='vi'?'Xóa phụ cấp này?':'Delete this allowance?')) return;
  try {
    await col.empAllowances().doc(id).delete();
    toast(lang==='vi'?'Đã xóa.':'Deleted.', 'success');
    loadAllowances();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ════════════════════════════════════════════════════════════════
// MODULE: OT MANAGEMENT (Request → Approve → Payroll)
// Collection: apps/hr/ot_requests
// ════════════════════════════════════════════════════════════════

async function loadOTManage() {
  showLoader();
  try {
    // iOS Safari fix: wait for auth before any Firestore read
    const currentUser = auth.currentUser;
    console.log('[OT] auth.currentUser:', currentUser ? currentUser.uid : 'NULL');

    if (!currentUser) {
      console.warn('[OT] auth not ready, waiting...');
      hideLoader();
      await new Promise(resolve => {
        const unsub = auth.onAuthStateChanged(user => { unsub(); resolve(user); });
      });
      loadOTManage();
      return;
    }

    // Reload profile if missing (happens on iOS after app resume)
    if (!state.userProfile || !state.userProfile.uid) {
      const doc = await col.users().doc(currentUser.uid).get();
      if (doc.exists) state.userProfile = { uid: currentUser.uid, ...doc.data() };
      else { toast('Profile not found.', 'error'); hideLoader(); return; }
    }

    const uid = currentUser.uid; // always from Firebase Auth, not state
    let query;

    if (isEmployee()) {
      console.log('[OT] Employee query: employeeId ==', uid);
      query = col.otRequests().where('employeeId','==',uid).limit(100);
    } else if (isCountryManager()) {
      query = col.otRequests()
        .where('country','==',state.userProfile.country)
        .orderBy('date','desc').limit(100);
    } else {
      query = col.otRequests().orderBy('date','desc').limit(100);
    }

    const snap = await query.get();
    console.log('[OT] Query OK, docs:', snap.size);
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!isEmployee() && !state.cache.employees) {
      const es = await col.users().where('active','==',true).get();
      state.cache.employees = es.docs.map(d => ({ uid: d.id, ...d.data() }));
    }
    renderOTManage(records);
  } catch(e) {
    console.error('[OT] error:', e.code, e.message);
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
}

function renderOTManage(records) {
  const canAdmin = isAdmin() || isCountryManager();
  const isEmp    = isEmployee();
  const employees = state.cache.employees || [];

  $('page-ot-manage').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_ot_manage')}</h2><p>${records.length} ${lang==='vi'?'bản ghi':'records'}</p></div>
      <div class="page-actions">
        ${isEmp ? `<button class="btn btn-primary" onclick="openSubmitOT()">${t('ot_request')}</button>` : ''}
        ${canAdmin ? `<button class="btn btn-outline" onclick="openAdminAddOT()">📋 ${t('ot_add_title')}</button>` : ''}
      </div>
    </div>

    <div class="filter-bar">
      <select class="form-control" id="ot-filter-status" onchange="filterOTRecords()">
        <option value="">${lang==='vi'?'Tất cả trạng thái':'All Status'}</option>
        <option value="pending">${t('ot_pending')}</option>
        <option value="approved">${t('ot_approved')}</option>
        <option value="rejected">${t('ot_rejected')}</option>
      </select>
      <select class="form-control" id="ot-filter-type" onchange="filterOTRecords()">
        <option value="">${lang==='vi'?'Tất cả loại':'All Types'}</option>
        <option value="normal">Normal OT</option>
        <option value="holiday">Holiday OT</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table id="ot-table">
          <thead><tr>
            <th>${t('allow_employee')}</th>
            <th>${t('att_date')}</th>
            <th class="ot-hide-mobile">${t('ot_start')}</th>
            <th class="ot-hide-mobile">${t('ot_end')}</th>
            <th>${lang==='vi'?'Số giờ':'Hours'}</th>
            <th class="ot-hide-mobile">${lang==='vi'?'Loại':'Type'}</th>
            <th>${lang==='vi'?'Tiền OT':'OT Pay'}</th>
            <th class="ot-hide-mobile">${t('ot_reason')}</th>
            <th>${t('ot_status')}</th>
            ${canAdmin ? `<th>${t('emp_actions')}</th>` : ''}
          </tr></thead>
          <tbody id="ot-tbody">
            ${renderOTRows(records, canAdmin)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Employee Submit OT Modal -->
    <div class="modal-overlay" id="modal-submit-ot">
      <div class="modal">
        <div class="modal-header"><h3>${t('ot_submit_title')}</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>${t('att_date')}</label>
            <input class="form-control" type="date" id="ot-req-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('ot_start')}</label>
              <input class="form-control" type="time" id="ot-req-start" value="17:00" oninput="calcOTHours('req')">
            </div>
            <div class="form-group">
              <label>${t('ot_end')}</label>
              <input class="form-control" type="time" id="ot-req-end" value="20:00" oninput="calcOTHours('req')">
            </div>
          </div>
          <div class="form-group">
            <label>${lang==='vi'?'Loại OT':'OT Type'}</label>
            <select class="form-control" id="ot-req-type">
              <option value="normal">Normal OT (×1.5)</option>
              <option value="holiday">Holiday OT (×1.5)</option>
            </select>
          </div>
          <div class="form-group">
            <label>${t('ot_reason')}</label>
            <textarea class="form-control" id="ot-req-reason" rows="2" placeholder="${lang==='vi'?'Lý do tăng ca…':'Reason for OT…'}"></textarea>
          </div>
          <div class="form-hint" id="ot-req-calc" style="margin-top:8px;"></div>
          <p class="form-hint">${t('ot_calc_hint')}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="submitOTRequest()">${lang==='vi'?'Gửi đăng ký':'Submit Request'}</button>
        </div>
      </div>
    </div>

    <!-- Admin Add OT Modal -->
    <div class="modal-overlay" id="modal-admin-ot">
      <div class="modal">
        <div class="modal-header"><h3>${t('ot_add_title')}</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>${t('allow_employee')}</label>
            <select class="form-control" id="ot-adm-emp" onchange="calcOTHours('adm')">
              <option value="">${lang==='vi'?'Chọn nhân viên…':'Select employee…'}</option>
              ${employees.filter(e=>canManageCountry(e.country)&&e.active!==false)
                .map(e=>`<option value="${e.uid}"
                  data-salary="${e.salary||0}"
                  data-name="${e.name}"
                  data-country="${e.country}"
                  data-currency="${e.currency||getCurrency(e.country)}"
                  >${e.name} — ${formatCurrency(e.salary||0, e.currency||getCurrency(e.country))} (${e.country})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('att_date')}</label>
            <input class="form-control" type="date" id="ot-adm-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('ot_start')}</label>
              <input class="form-control" type="time" id="ot-adm-start" value="17:00" oninput="calcOTHours('adm')">
            </div>
            <div class="form-group">
              <label>${t('ot_end')}</label>
              <input class="form-control" type="time" id="ot-adm-end" value="20:00" oninput="calcOTHours('adm')">
            </div>
          </div>
          <div class="form-group">
            <label>${lang==='vi'?'Loại OT':'OT Type'}</label>
            <select class="form-control" id="ot-adm-type">
              <option value="normal">Normal OT (×1.5)</option>
              <option value="holiday">Holiday OT (×1.5)</option>
            </select>
          </div>
          <div class="form-group">
            <label>${t('ot_reason')}</label>
            <textarea class="form-control" id="ot-adm-reason" rows="2"></textarea>
          </div>
          <div class="form-hint" id="ot-adm-calc" style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="adminSaveOT()">${lang==='vi'?'Lưu & Duyệt':'Save & Approve'}</button>
        </div>
      </div>
    </div>
  `;

  // Initial calc
  calcOTHours('req');
}

function renderOTRows(records, canAdmin) {
  if (!records.length) return `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">⏰</div><h4>${t('ot_no_data')}</h4></div></td></tr>`;
  return records.map(r => {
    const statusBadge = {
      pending:  `<span class="badge badge-amber">${t('ot_pending')}</span>`,
      approved: `<span class="badge badge-green">${t('ot_approved')}</span>`,
      rejected: `<span class="badge badge-red">${t('ot_rejected')}</span>`,
    }[r.status] || '';
    const canAct = canAdmin && r.status === 'pending';
    return `<tr>
      <td><strong>${r.employeeName||'–'}</strong></td>
      <td class="td-mono">${r.date||'–'}</td>
      <td class="td-mono ot-hide-mobile">${r.startTime||'–'}</td>
      <td class="td-mono ot-hide-mobile">${r.endTime||'–'}</td>
      <td class="td-mono">${(r.hours||0).toFixed(1)}h</td>
      <td class="ot-hide-mobile"><span class="badge badge-${r.otType==='holiday'?'amber':'blue'}">${r.otType||'normal'}</span></td>
      <td class="td-mono payroll-positive">+${formatCurrency(r.otPay||0, r.currency||'USD')}</td>
      <td class="ot-hide-mobile" style="max-width:160px;white-space:normal;font-size:.80rem;">${r.reason||'–'}</td>
      <td>${statusBadge}</td>
      ${canAdmin ? `<td style="white-space:nowrap;">
        ${canAct ? `
          <button class="btn btn-sm btn-success" onclick="approveOT('${r.id}')">${t('ot_approve')}</button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="rejectOT('${r.id}')">${t('ot_reject')}</button>
        ` : ''}
        ${isSuperAdmin() || isAdmin() ? `
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteRecord('otRequests','${r.id}')">🗑️</button>
        ` : (!canAct ? '–' : '')}
      </td>` : ''}
    </tr>`;
  }).join('');
}

window.filterOTRecords = function() { loadOTManage(); };

window.openSubmitOT = function() {
  calcOTHours('req');
  openModal('modal-submit-ot');
};

window.openAdminAddOT = function() {
  openModal('modal-admin-ot');
};

window.calcOTHours = function(prefix) {
  const startEl = document.getElementById(`ot-${prefix}-start`);
  const endEl   = document.getElementById(`ot-${prefix}-end`);
  const calcEl  = document.getElementById(`ot-${prefix}-calc`);
  if (!startEl || !endEl || !calcEl) return;

  const startVal = startEl.value || '17:00';
  const endVal   = endEl.value   || '20:00';
  const [sh, sm] = startVal.split(':').map(Number);
  const [eh, em] = endVal.split(':').map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);

  if (totalMins <= 0) {
    calcEl.innerHTML = `<span style="color:var(--red)">${lang==='vi'?'Giờ kết thúc phải sau giờ bắt đầu':'End time must be after start time'}</span>`;
    calcEl.dataset.hours = 0;
    calcEl.dataset.pay   = 0;
    return;
  }
  const hours = totalMins / 60;

  // Get salary — admin mode reads from employee dropdown data attributes
  let salary = 0;
  let cur    = 'USD';
  let empName = '';

  if (prefix === 'adm') {
    const sel = document.getElementById('ot-adm-emp');
    if (sel && sel.selectedIndex > 0) {
      const opt = sel.options[sel.selectedIndex];
      salary  = parseFloat(opt.dataset.salary || 0);
      cur     = opt.dataset.currency || 'USD';
      empName = opt.dataset.name || '';
    }
  } else {
    salary  = parseFloat(state.userProfile?.salary) || 0;
    cur     = state.userProfile?.currency || getCurrency(state.userProfile?.country);
    empName = state.userProfile?.name || '';
  }

  const workDays   = 26;
  const workHours  = 8;
  const dailyRate  = salary / workDays;
  const hourlyRate = dailyRate / workHours;
  const otPay      = hourlyRate * hours * 1.5;

  if (salary === 0 && prefix === 'adm') {
    calcEl.innerHTML = `<span style="color:var(--amber)">
      ⚠️ ${lang==='vi'?'Vui lòng chọn nhân viên để tính tiền OT':'Please select an employee to calculate OT pay'}
    </span>`;
    calcEl.dataset.hours = hours;
    calcEl.dataset.pay   = 0;
    return;
  }

  calcEl.innerHTML = `
    <div style="line-height:1.8;">
      <span style="color:var(--text-muted);font-size:.78rem;">
        ${empName ? `<strong>${empName}</strong> · ` : ''}
        ${lang==='vi'?'Lương':'Salary'}: ${formatCurrency(salary, cur)} ÷ ${workDays} ${lang==='vi'?'ngày':'days'} ÷ ${workHours}h
        = ${formatCurrency(hourlyRate, cur)}/${lang==='vi'?'giờ':'h'}
      </span><br>
      <strong>${hours.toFixed(1)}h</strong> × ${formatCurrency(hourlyRate, cur)} × 1.5 =
      <strong class="payroll-positive" style="font-size:1rem;">
        +${formatCurrency(otPay, cur)}
      </strong>
    </div>
  `;
  calcEl.dataset.hours   = hours;
  calcEl.dataset.pay     = otPay;
  calcEl.dataset.daily   = dailyRate;
  calcEl.dataset.hourly  = hourlyRate;
};

window.submitOTRequest = async function() {
  const date    = $('ot-req-date')?.value;
  const start   = $('ot-req-start')?.value;
  const end     = $('ot-req-end')?.value;
  const reason  = $('ot-req-reason')?.value.trim();
  const otType  = $('ot-req-type')?.value || 'normal';
  const calcEl  = $('ot-req-calc');

  if (!date || !start || !end) {
    toast(lang==='vi'?'Vui lòng điền đầy đủ thông tin.':'Please fill all fields.', 'error');
    return;
  }
  const hours  = parseFloat(calcEl?.dataset.hours || 0);
  const otPay  = parseFloat(calcEl?.dataset.pay   || 0);
  if (hours <= 0) {
    toast(lang==='vi'?'Giờ kết thúc phải sau giờ bắt đầu.':'End time must be after start time.', 'error');
    return;
  }

  // Đảm bảo profile luôn có — dùng ensureProfile()
  const p = await ensureProfile();
  if (!p) {
    toast(lang==='vi'?'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.':'Session expired.', 'error');
    return;
  }
  const safeUid = auth.currentUser.uid;
  showLoader();
  try {
    await col.otRequests().add({
      employeeId:   safeUid,
      employeeName: p.name || '',
      country:      p.country || '',
      currency:     p.currency || getCurrency(p.country),
      date, startTime: start, endTime: end,
      hours, otPay, otType, reason,
      salary:       p.salary || 0,
      status:       'pending',
      submittedBy:  p.uid,
      createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã gửi đăng ký OT. Chờ duyệt.':'✅ OT request submitted. Pending approval.', 'success');
    closeModal('modal-submit-ot');
    loadOTManage();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

window.adminSaveOT = async function() {
  const sel    = $('ot-adm-emp');
  const empId  = sel?.value;
  const date   = $('ot-adm-date')?.value;
  const start  = $('ot-adm-start')?.value;
  const end    = $('ot-adm-end')?.value;
  const otType = $('ot-adm-type')?.value || 'normal';
  const reason = $('ot-adm-reason')?.value.trim();
  const calcEl = $('ot-adm-calc');

  if (!empId || !date) {
    toast(lang==='vi'?'Vui lòng chọn nhân viên và ngày.':'Employee and date required.', 'error');
    return;
  }

  calcOTHours('adm');
  const hours  = parseFloat(calcEl?.dataset.hours || 0);
  const otPay  = parseFloat(calcEl?.dataset.pay || 0);
  const emp    = state.cache.employees?.find(e => e.uid === empId);
  const cur    = sel?.selectedOptions[0]?.dataset.currency || 'USD';

  showLoader();
  try {
    await col.otRequests().add({
      employeeId:   empId,
      employeeName: emp?.name || '',
      country:      emp?.country || '',
      currency:     cur,
      date, startTime: start, endTime: end,
      hours, otPay, otType, reason,
      salary:       emp?.salary || 0,
      status:       'approved', // admin adds = auto-approved
      approvedBy:   state.userProfile.uid,
      approvedAt:   firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy:  state.userProfile.uid,
      createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã lưu và duyệt OT.':'✅ OT saved and approved.', 'success');
    closeModal('modal-admin-ot');
    loadOTManage();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

window.approveOT = async function(id) {
  showLoader();
  try {
    await col.otRequests().doc(id).update({
      status:     'approved',
      approvedBy: state.userProfile.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã duyệt OT.':'✅ OT approved.', 'success');
    loadOTManage();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.rejectOT = async function(id) {
  const reason = prompt(lang==='vi'?'Lý do từ chối (không bắt buộc):':'Rejection reason (optional):') || '';
  showLoader();
  try {
    await col.otRequests().doc(id).update({
      status:     'rejected',
      rejectedBy: state.userProfile.uid,
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason,
    });
    toast(lang==='vi'?'Đã từ chối OT.':'OT rejected.', 'success');
    loadOTManage();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

// ════════════════════════════════════════════════════════════════
// MODULE: SITE RECORDS (Allowance công trường)
// Collection: apps/hr/site_records
// Logic: eligible if startTime <= 08:00 AND endTime >= 13:00
// ════════════════════════════════════════════════════════════════

const SITE_RATES = { 'Phnom Penh': 5, 'Province': 6 };

function calcSiteEligible(startTime, endTime) {
  if (!startTime || !endTime) return false;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins   = eh * 60 + em;
  return startMins <= 8 * 60 && endMins >= 13 * 60;
}

async function loadSiteRecords() {
  showLoader();
  try {
    // ── Step 1: Ensure auth.currentUser is available ──────────
    const currentUser = auth.currentUser;
    console.log('[Site] auth.currentUser:', currentUser ? currentUser.uid : 'NULL');

    if (!currentUser) {
      // iOS Safari: auth not ready yet — wait and retry
      console.warn('[Site] auth.currentUser is null, waiting for auth state...');
      hideLoader();
      await new Promise(resolve => {
        const unsub = auth.onAuthStateChanged(user => {
          unsub();
          resolve(user);
        });
      });
      loadSiteRecords(); // retry after auth ready
      return;
    }

    // ── Step 2: Ensure profile is loaded ──────────────────────
    if (!state.userProfile || !state.userProfile.uid) {
      console.warn('[Site] userProfile missing, fetching...');
      const doc = await col.users().doc(currentUser.uid).get();
      if (doc.exists) {
        state.userProfile = { uid: currentUser.uid, ...doc.data() };
        console.log('[Site] profile reloaded:', state.userProfile.role);
      } else {
        toast('Profile not found.', 'error');
        hideLoader();
        return;
      }
    }

    // ── Step 3: Build query based on role ─────────────────────
    let query;
    const uid = currentUser.uid; // always use auth uid, not state.userProfile.uid

    if (isEmployee()) {
      console.log('[Site] Employee query: employeeId ==', uid);
      // Simple where query — no orderBy to avoid composite index on iOS
      query = col.siteRecords()
        .where('employeeId', '==', uid)
        .limit(100);
    } else if (isCountryManager()) {
      console.log('[Site] CM query: country ==', state.userProfile.country);
      query = col.siteRecords()
        .where('country', '==', state.userProfile.country)
        .orderBy('date', 'desc').limit(100);
    } else {
      console.log('[Site] Admin query: all records');
      query = col.siteRecords().orderBy('date', 'desc').limit(100);
    }

    // ── Step 4: Execute query ──────────────────────────────────
    console.log('[Site] Executing query...');
    const snap = await query.get();
    console.log('[Site] Query OK, docs:', snap.size);
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Only load employees list for admin/CM (employees don't need it)
    if (!isEmployee() && !state.cache.employees) {
      const es = await col.users().where('active','==',true).get();
      state.cache.employees = es.docs.map(d => ({ uid: d.id, ...d.data() }));
    }

    renderSiteRecords(records);
  } catch(e) {
    console.error('[Site] loadSiteRecords error:', e.code, e.message);
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
}

function renderSiteRecords(records) {
  const employees   = state.cache.employees || [];
  const canApprove   = isAdmin() || isCountryManager();
  const isEmp        = isEmployee();
  const totalEligible = records.filter(r => r.eligible && r.status==='approved').reduce((s,r) => s + (r.amount||0), 0);
  const pendingCount  = records.filter(r => r.status === 'pending').length;

  $('page-site').innerHTML = `
    <div class="page-header">
      <div>
        <h2>${t('page_site')}</h2>
        <p>${lang==='vi'?'Tổng phụ cấp đã duyệt tháng này':'Total approved allowance this month'}:
          <strong class="payroll-positive">$${totalEligible.toFixed(2)}</strong>
          ${pendingCount > 0 ? ` &nbsp;·&nbsp; <span style="color:var(--amber)">${pendingCount} ${lang==='vi'?'chờ duyệt':'pending'}</span>` : ''}
        </p>
      </div>
      <div class="page-actions">
        ${isEmp ? `<button class="btn btn-primary" onclick="openLogSite()">${t('site_add')}</button>` : ''}
        ${canApprove ? `<button class="btn btn-outline" onclick="openAdminLogSite()">📋 ${lang==='vi'?'Ghi hộ (Admin)':'Log for Employee'}</button>` : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--gap);background:var(--amber-bg);border-color:var(--amber);">
      <div class="card-body" style="font-size:.84rem;color:var(--amber);">
        ℹ️ <strong>${lang==='vi'?'Điều kiện hưởng phụ cấp':'Eligibility rule'}:</strong>
        ${lang==='vi'
          ? 'Vào ≤ 08:00 VÀ ra ≥ 13:00 → Phnom Penh: $5/ngày · Tỉnh: $6/ngày'
          : 'Start ≤ 08:00 AND End ≥ 13:00 → Phnom Penh: $5/day · Province: $6/day'}
      </div>
    </div>

    <div class="filter-bar">
      <select class="form-control" id="site-filter-status" onchange="filterSiteRecords()">
        <option value="">${lang==='vi'?'Tất cả trạng thái':'All Status'}</option>
        <option value="pending">${lang==='vi'?'Chờ duyệt':'Pending'}</option>
        <option value="approved">${lang==='vi'?'Đã duyệt':'Approved'}</option>
        <option value="rejected">${lang==='vi'?'Từ chối':'Rejected'}</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t('allow_employee')}</th>
            <th>${t('att_date')}</th>
            <th>${t('site_project')}</th>
            <th>${t('site_location')}</th>
            <th>${t('site_start')}</th>
            <th>${t('site_end')}</th>
            <th>${t('site_eligible')}</th>
            <th>${lang==='vi'?'Phụ cấp':'Allowance'}</th>
            <th>${lang==='vi'?'Trạng thái':'Status'}</th>
            <th>${t('emp_actions')}</th>
          </tr></thead>
          <tbody>
            ${renderSiteRows(records, canApprove)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Employee: Log Site Visit Modal -->
    <div class="modal-overlay" id="modal-site">
      <div class="modal">
        <div class="modal-header"><h3>${t('site_log_title')}</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>${t('att_date')}</label>
              <input class="form-control" type="date" id="site-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>${t('site_location')}</label>
              <select class="form-control" id="site-location" onchange="calcSiteAllowance()">
                <option value="Phnom Penh">${t('site_pp')} ($5)</option>
                <option value="Province">${t('site_province')} ($6)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>${t('site_project')}</label>
            <input class="form-control" id="site-project" placeholder="${lang==='vi'?'Tên dự án':'Project name'}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('site_start')}</label>
              <input class="form-control" type="time" id="site-start" value="07:30" oninput="calcSiteAllowance()">
            </div>
            <div class="form-group">
              <label>${t('site_end')}</label>
              <input class="form-control" type="time" id="site-end" value="14:00" oninput="calcSiteAllowance()">
            </div>
          </div>
          <div id="site-calc-result" style="margin-top:8px;padding:10px;background:var(--bg);border-radius:6px;font-size:.84rem;"></div>
          <p class="form-hint">${t('site_logic_hint')}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="saveSiteRecord()">
            ${lang==='vi'?'Gửi ghi nhận':'Submit Record'}
          </button>
        </div>
      </div>
    </div>

    <!-- Admin: Log for Employee Modal -->
    <div class="modal-overlay" id="modal-admin-site">
      <div class="modal">
        <div class="modal-header"><h3>📋 ${lang==='vi'?'Ghi nhận đi công trường (Admin)':'Log Site Visit (Admin)'}</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>${t('allow_employee')}</label>
            <select class="form-control" id="adm-site-emp">
              <option value="">${lang==='vi'?'Chọn nhân viên…':'Select employee…'}</option>
              ${employees.filter(e=>canManageCountry(e.country)&&e.active!==false)
                .map(e=>`<option value="${e.uid}" data-name="${e.name}" data-country="${e.country}">${e.name} (${e.country})</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('att_date')}</label>
              <input class="form-control" type="date" id="adm-site-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>${t('site_location')}</label>
              <select class="form-control" id="adm-site-location" onchange="calcAdminSiteAllowance()">
                <option value="Phnom Penh">${t('site_pp')} ($5)</option>
                <option value="Province">${t('site_province')} ($6)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>${t('site_project')}</label>
            <input class="form-control" id="adm-site-project" placeholder="${lang==='vi'?'Tên dự án':'Project name'}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${t('site_start')}</label>
              <input class="form-control" type="time" id="adm-site-start" value="07:30" oninput="calcAdminSiteAllowance()">
            </div>
            <div class="form-group">
              <label>${t('site_end')}</label>
              <input class="form-control" type="time" id="adm-site-end" value="14:00" oninput="calcAdminSiteAllowance()">
            </div>
          </div>
          <div id="adm-site-calc-result" style="margin-top:8px;padding:10px;background:var(--bg);border-radius:6px;font-size:.84rem;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline modal-close">${t('btn_cancel')}</button>
          <button class="btn btn-primary" onclick="adminSaveSiteRecord()">
            ${lang==='vi'?'Lưu & Duyệt':'Save & Approve'}
          </button>
        </div>
      </div>
    </div>

    <!-- View Photo Modal (placeholder for future GPS/photo evidence) -->
  `;
  calcSiteAllowance();
}

function renderSiteRows(records, canApprove) {
  if (!records.length) {
    return `<tr><td colspan="10"><div class="empty-state">
      <div class="empty-icon">🏗️</div>
      <h4>${t('site_no_data')}</h4>
    </div></td></tr>`;
  }
  return records.map(r => {
    const statusBadge = {
      pending:  `<span class="badge badge-amber">${lang==='vi'?'Chờ duyệt':'Pending'}</span>`,
      approved: `<span class="badge badge-green">${lang==='vi'?'Đã duyệt':'Approved'}</span>`,
      rejected: `<span class="badge badge-red">${lang==='vi'?'Từ chối':'Rejected'}</span>`,
    }[r.status || 'approved'] || `<span class="badge badge-green">${lang==='vi'?'Đã duyệt':'Approved'}</span>`;

    const canAct = canApprove && r.status === 'pending';
    const canEdit = canApprove;

    return `<tr>
      <td><strong>${r.employeeName||'–'}</strong></td>
      <td class="td-mono">${r.date||'–'}</td>
      <td>${r.project||'–'}</td>
      <td>${r.location||'–'}</td>
      <td class="td-mono">${r.startTime||'–'}</td>
      <td class="td-mono">${r.endTime||'–'}</td>
      <td>${r.eligible
        ? `<span class="badge badge-green">✓ ${t('site_eligible')}</span>`
        : `<span class="badge badge-grey">✗ ${t('site_not_eligible')}</span>`}
      </td>
      <td class="td-mono ${r.eligible && r.status!=='rejected' ?'payroll-positive':''}">
        ${r.eligible && r.status!=='rejected' ? `+$${(r.amount||0).toFixed(2)}` : '–'}
      </td>
      <td>${statusBadge}</td>
      <td style="white-space:nowrap;">
        ${canAct ? `
          <button class="btn btn-sm btn-success" onclick="approveSiteRecord('${r.id}')">${lang==='vi'?'Duyệt':'Approve'}</button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="rejectSiteRecord('${r.id}')">${lang==='vi'?'Từ chối':'Reject'}</button>
        ` : ''}
        ${canEdit ? `
          <button class="btn btn-sm btn-outline" style="margin-left:4px" onclick="editSiteRecord('${r.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="deleteRecord('siteRecords','${r.id}')">🗑️</button>
        ` : (!canAct ? '–' : '')}
      </td>
    </tr>`;
  }).join('');
}

window.filterSiteRecords = function() { loadSiteRecords(); };

window.calcSiteAllowance = function() {
  const start    = $('site-start')?.value || '';
  const end      = $('site-end')?.value   || '';
  const location = $('site-location')?.value || 'Phnom Penh';
  const eligible = calcSiteEligible(start, end);
  const rate     = SITE_RATES[location] || 5;
  const resultEl = $('site-calc-result');
  if (!resultEl) return;
  if (eligible) {
    resultEl.innerHTML = `✅ <strong>${lang==='vi'?'Đủ điều kiện':'Eligible'}</strong> →
      <strong class="payroll-positive">+$${rate}/${lang==='vi'?'ngày':'day'}</strong>
      (${location === 'Phnom Penh' ? (lang==='vi'?'Mức Phnom Penh':'Phnom Penh rate') : (lang==='vi'?'Mức tỉnh':'Province rate')})`;
  } else {
    resultEl.innerHTML = `❌ <span style="color:var(--text-muted)">
      ${lang==='vi'
        ? 'Không đủ điều kiện — cần vào ≤ 08:00 VÀ ra ≥ 13:00'
        : 'Not eligible — need start ≤ 08:00 AND end ≥ 13:00'}
    </span>`;
  }
};

window.calcAdminSiteAllowance = function() {
  const start    = $('adm-site-start')?.value || '';
  const end      = $('adm-site-end')?.value   || '';
  const location = $('adm-site-location')?.value || 'Phnom Penh';
  const eligible = calcSiteEligible(start, end);
  const rate     = SITE_RATES[location] || 5;
  const resultEl = $('adm-site-calc-result');
  if (!resultEl) return;
  if (eligible) {
    resultEl.innerHTML = `✅ <strong>${lang==='vi'?'Đủ điều kiện':'Eligible'}</strong> →
      <strong class="payroll-positive">+$${rate}/${lang==='vi'?'ngày':'day'}</strong>`;
  } else {
    resultEl.innerHTML = `❌ <span style="color:var(--text-muted)">
      ${lang==='vi'?'Không đủ điều kiện':'Not eligible'}
    </span>`;
  }
};

window.openLogSite = function() {
  calcSiteAllowance();
  openModal('modal-site');
};

window.openAdminLogSite = function() {
  calcAdminSiteAllowance();
  openModal('modal-admin-site');
};

// ── Employee submits site visit (status: pending) ──────────────
window.saveSiteRecord = async function() {
  const date     = $('site-date')?.value;
  const location = $('site-location')?.value || 'Phnom Penh';
  const start    = $('site-start')?.value;
  const end      = $('site-end')?.value;
  const project  = $('site-project')?.value.trim();

  if (!date) {
    toast(lang==='vi'?'Vui lòng chọn ngày.':'Date required.', 'error');
    return;
  }

  // Đảm bảo profile luôn có — dùng ensureProfile() cho cả iOS & Android
  const p = await ensureProfile();
  if (!p) {
    toast(lang==='vi'?'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.':'Session expired. Please sign in again.', 'error');
    return;
  }
  const safeUid     = auth.currentUser.uid; // luôn lấy từ Firebase Auth
  const safeName    = p.name || '';
  const safeCountry = p.country || '';

  const eligible = calcSiteEligible(start, end);
  const amount   = eligible ? (SITE_RATES[location] || 5) : 0;

  // Debug info — hiện trước khi ghi để xác nhận data đúng
  console.log('[Site] Writing:', {
    employeeId: safeUid,
    employeeName: safeName,
    country: safeCountry,
    date, location, start, end, eligible, amount
  });

  showLoader();
  try {
    await col.siteRecords().add({
      employeeId:   safeUid,
      employeeName: safeName,
      country:      safeCountry,
      date, location,
      project:      project || '',
      startTime:    start || '',
      endTime:      end || '',
      eligible,
      amount,
      status:       'pending',
      submittedBy:  safeUid,
      createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(
      lang==='vi'
        ? `✅ Đã gửi ghi nhận đi công trường. Chờ duyệt.${eligible ? ` (Dự kiến: +$${amount})` : ''}`
        : `✅ Site visit submitted. Pending approval.${eligible ? ` (Estimated: +$${amount})` : ''}`,
      'success'
    );
    closeModal('modal-site');
    loadSiteRecords();
  } catch(e) {
    console.error('[Site] Error:', e.code, e.message);
    // Hiện alert trên điện thoại để xem lỗi cụ thể
    alert('Debug Error:\nCode: ' + (e.code||'none') + '\nMessage: ' + e.message + '\nUID: ' + safeUid + '\nCountry: ' + safeCountry);
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── Admin logs on behalf of employee (auto-approved) ────────────
window.adminSaveSiteRecord = async function() {
  const sel      = $('adm-site-emp');
  const empId    = sel?.value;
  const date     = $('adm-site-date')?.value;
  const location = $('adm-site-location')?.value || 'Phnom Penh';
  const start    = $('adm-site-start')?.value;
  const end      = $('adm-site-end')?.value;
  const project  = $('adm-site-project')?.value.trim();

  if (!empId || !date) {
    toast(lang==='vi'?'Vui lòng chọn nhân viên và ngày.':'Employee and date required.', 'error');
    return;
  }

  const eligible = calcSiteEligible(start, end);
  const amount   = eligible ? (SITE_RATES[location] || 5) : 0;
  const emp      = state.cache.employees?.find(e => e.uid === empId);

  showLoader();
  try {
    await col.siteRecords().add({
      employeeId:   empId,
      employeeName: emp?.name || '',
      country:      emp?.country || '',
      date, location, project,
      startTime: start, endTime: end,
      eligible, amount,
      status:      'approved', // admin-logged = auto-approved
      submittedBy: state.userProfile.uid,
      approvedBy:  state.userProfile.uid,
      approvedAt:  firebase.firestore.FieldValue.serverTimestamp(),
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(
      eligible
        ? (lang==='vi'?`✅ Đã lưu và duyệt. Phụ cấp: +$${amount}`:`✅ Saved & approved. Allowance: +$${amount}`)
        : (lang==='vi'?'Đã lưu (không đủ điều kiện hưởng phụ cấp).':'Saved (not eligible for allowance).'),
      eligible ? 'success' : 'info'
    );
    closeModal('modal-admin-site');
    loadSiteRecords();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally { hideLoader(); }
};

// ── Admin/Manager approve/reject pending submissions ────────────
window.approveSiteRecord = async function(id) {
  showLoader();
  try {
    await col.siteRecords().doc(id).update({
      status:     'approved',
      approvedBy: state.userProfile.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast(lang==='vi'?'✅ Đã duyệt.':'✅ Approved.', 'success');
    loadSiteRecords();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.rejectSiteRecord = async function(id) {
  const reason = prompt(lang==='vi'?'Lý do từ chối (không bắt buộc):':'Rejection reason (optional):') || '';
  showLoader();
  try {
    await col.siteRecords().doc(id).update({
      status:          'rejected',
      rejectedBy:      state.userProfile.uid,
      rejectedAt:      firebase.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason,
    });
    toast(lang==='vi'?'Đã từ chối.':'Rejected.', 'success');
    loadSiteRecords();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
};

window.deleteSiteRecord = async function(id) {
  if (!confirm(lang==='vi'?'Xóa bản ghi này?':'Delete this record?')) return;
  try {
    await col.siteRecords().doc(id).delete();
    toast(lang==='vi'?'Đã xóa.':'Deleted.', 'success');
    loadSiteRecords();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

// ════════════════════════════════════════════════════════════════
// PAYROLL ENGINE v2 — 5 sources: Basic + Allowance + OT + Site + Phone
//                              − Leave − Late − Violation
// ════════════════════════════════════════════════════════════════

window.generatePayroll = async function() {
  if (!confirm(t('pay_confirm_gen'))) return;
  showLoader();

  const now   = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthStart = `${month}-01`;
  const monthEnd   = `${month}-31`;

  // Count weeks in month for phone allowance
  const weeksInMonth = countWeeksInMonth(now.getFullYear(), now.getMonth());

  try {
    let empQuery = col.users().where('active','==',true);
    if (isCountryManager()) empQuery = empQuery.where('country','==',state.userProfile.country);
    const empSnap = await empQuery.get();
    const employees = empSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    // Load all 5 data sources for the month
    const [attSnap, violSnap, otSnap, allowSnap, siteSnap] = await Promise.all([
      col.attendance().where('date','>=',monthStart).where('date','<=',monthEnd).get(),
      col.violations().where('date','>=',monthStart).where('date','<=',monthEnd).get(),
      col.otRequests().where('date','>=',monthStart).where('date','<=',monthEnd).where('status','==','approved').get(),
      col.empAllowances().get(),
      col.siteRecords().where('date','>=',monthStart).where('date','<=',monthEnd).where('eligible','==',true).where('status','==','approved').get(),
    ]);

    // Aggregate per UID
    const agg = {};
    const ensure = uid => {
      if (!agg[uid]) agg[uid] = { late: 0, violations: 0, otNormal: 0, otHoliday: 0, siteAllowance: 0, fixedAllowance: 0, phoneAllowance: 0 };
    };

    console.log(`[Payroll] Data: att=${attSnap.size} viol=${violSnap.size} ot=${otSnap.size} allow=${allowSnap.size} site=${siteSnap.size}`);

    attSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].late += r.penalty || 0;
    });
    violSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].violations += r.penalty || 0;
    });
    otSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      if (r.otType === 'holiday') agg[r.uid].otHoliday += r.otPay || 0;
      else agg[r.uid].otNormal += r.otPay || 0;
    });
    siteSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.uid);
      agg[r.uid].siteAllowance += r.amount || 0;
    });
    // Fixed allowances — monthly frequency only
    allowSnap.docs.forEach(d => {
      const r = d.data(); ensure(r.employeeId);
      if (r.frequency === 'monthly') agg[r.employeeId].fixedAllowance += r.amount || 0;
    });

    const batch = db.batch();
    for (const e of employees) {
      ensure(e.uid);
      const a = agg[e.uid];
      const basic     = e.salary || 0;
      const currency  = e.currency || getCurrency(e.country);

      // Phone allowance: from policy (default $1/week × weeks in month)
      // Works for both USD and VND employees per their profile currency
      const phoneRate = currency === 'USD' ? 1 : 0;
      a.phoneAllowance = phoneRate * weeksInMonth;

      console.log(`[Payroll] ${e.name}: basic=${basic} fixed=${a.fixedAllowance} site=${a.siteAllowance} phone=${a.phoneAllowance} ot=${a.otNormal}/${a.otHoliday} late=${a.late} viol=${a.violations}`);

      const totalAdditions  = basic + a.fixedAllowance + a.siteAllowance + a.phoneAllowance + a.otNormal + a.otHoliday;
      const totalDeductions = a.late + a.violations;
      const net = Math.max(totalAdditions - totalDeductions, 0);

      const ref = col.payroll().doc(`${month}_${e.uid}`);
      batch.set(ref, {
        uid: e.uid, employeeName: e.name, country: e.country, currency, month,
        basic,
        fixedAllowance:  a.fixedAllowance,
        siteAllowance:   a.siteAllowance,
        phoneAllowance:  a.phoneAllowance,
        otNormal:        a.otNormal,
        otHoliday:       a.otHoliday,
        lateDeduction:   a.late,
        penalties:       a.violations,
        leaveDeduction:  0,
        net,
        weeksInMonth,
        locked:  false,
        generatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    toast(t('pay_generated', { n: employees.length, month }), 'success');
    loadPayroll();
  } catch(e) {
    toast('Error generating payroll: ' + e.message, 'error');
  } finally { hideLoader(); }
};

function countWeeksInMonth(year, month) {
  // Count ISO weeks that have Monday in the given month
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let weeks = 0;
  const d = new Date(firstDay);
  while (d <= lastDay) {
    if (d.getDay() === 1) weeks++; // Monday
    d.setDate(d.getDate() + 1);
  }
  return weeks || 4; // fallback to 4
}

// ── Update payroll table to show new columns ──────────────────
function renderPayroll(employees, existing, month) {
  const isLocked = Object.values(existing).some(p => p.locked);
  $('page-payroll').innerHTML = `
    <div class="page-header">
      <div><h2>${t('page_payroll')}</h2><p>${lang==='vi'?'Tháng':'Month'}: ${month}</p></div>
      <div class="page-actions">
        ${!isLocked ? `<button class="btn btn-gold" onclick="generatePayroll()">${t('pay_generate')}</button>` : ''}
        <button class="btn btn-outline" onclick="exportPayrollCSV()">${t('pay_export')}</button>
        ${isAdmin() && !isLocked ? `<button class="btn btn-primary" onclick="lockPayroll()">${t('pay_lock')}</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table id="payroll-table">
          <thead><tr>
            <th>${t('pay_employee')}</th>
            <th>${t('pay_country')}</th>
            <th>${t('pay_basic')}</th>
            <th>${lang==='vi'?'PC cố định':'Fixed Allow.'}</th>
            <th>${lang==='vi'?'PC công trường':'Site Allow.'}</th>
            <th>${lang==='vi'?'PC điện thoại':'Phone Allow.'}</th>
            <th>OT</th>
            <th>${lang==='vi'?'OT ngày lễ':'Holiday OT'}</th>
            <th>${t('pay_late_ded')}</th>
            <th>${t('pay_penalties')}</th>
            <th class="payroll-total">${t('pay_net')}</th>
            ${!isLocked ? '<th></th>' : ''}
          </tr></thead>
          <tbody>
            ${employees.map(e => {
              const p      = existing[e.uid] || {};
              const cur    = p.currency || e.currency || getCurrency(e.country);
              const hasGen = !!existing[e.uid]; // has been generated
              return `<tr style="${!hasGen?'opacity:.7':''}">
                <td>
                  <strong>${e.name}</strong>
                  ${!hasGen ? `<br><span style="font-size:.72rem;color:var(--amber);">
                    ⚠️ ${lang==='vi'?'Chưa tạo bảng lương':'Not generated yet'}
                  </span>` : ''}
                </td>
                <td>${COUNTRY_FLAG[e.country]||''} ${e.country}</td>
                <td class="td-mono">${formatCurrency(p.basic ?? e.salary ?? 0, cur)}</td>
                <td class="td-mono ${p.fixedAllowance>0?'payroll-positive':''}">
                  ${hasGen ? `+${formatCurrency(p.fixedAllowance||0, cur)}` : '–'}
                </td>
                <td class="td-mono ${p.siteAllowance>0?'payroll-positive':''}">
                  ${hasGen ? `+${formatCurrency(p.siteAllowance||0, cur)}` : '–'}
                </td>
                <td class="td-mono ${p.phoneAllowance>0?'payroll-positive':''}">
                  ${hasGen ? `+${formatCurrency(p.phoneAllowance||0, cur)}` : '–'}
                </td>
                <td class="td-mono ${p.otNormal>0?'payroll-positive':''}">
                  ${hasGen ? `+${formatCurrency(p.otNormal||0, cur)}` : '–'}
                </td>
                <td class="td-mono ${p.otHoliday>0?'payroll-positive':''}">
                  ${hasGen ? `+${formatCurrency(p.otHoliday||0, cur)}` : '–'}
                </td>
                <td class="td-mono ${p.lateDeduction>0?'payroll-negative':''}">
                  ${hasGen ? `-${formatCurrency(p.lateDeduction||0, cur)}` : '–'}
                </td>
                <td class="td-mono ${p.penalties>0?'payroll-negative':''}">
                  ${hasGen ? `-${formatCurrency(p.penalties||0, cur)}` : '–'}
                </td>
                <td class="td-mono payroll-total">
                  ${hasGen
                    ? formatCurrency(p.net ?? 0, cur)
                    : `<span style="color:var(--text-muted);font-size:.80rem;">${lang==='vi'?'Chưa tạo':'Pending'}</span>`}
                </td>
                ${!isLocked ? `<td>
                  ${hasGen
                    ? `<button class="btn btn-sm btn-outline" onclick="editPayrollLine('${e.uid}')">${t('pay_edit')}</button>`
                    : `<button class="btn btn-sm btn-gold" onclick="regenerateOneEmployee('${e.uid}','${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}')"
                        title="${lang==='vi'?'Tạo lương cho nhân viên này':'Generate for this employee'}">
                        ⚡
                      </button>`}
                </td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
