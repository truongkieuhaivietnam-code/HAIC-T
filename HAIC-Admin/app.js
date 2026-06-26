// ============================================================
// app.js  –  HAI Multi Country Administration System
// ============================================================

// ── Constants ────────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN:     'super_admin',
  ADMIN:           'admin',
  COUNTRY_MANAGER: 'country_manager',
  EMPLOYEE:        'employee'
};

const COUNTRIES = ['Cambodia', 'Vietnam', 'Laos'];

const COUNTRY_FLAG = { Cambodia: '🇰🇭', Vietnam: '🇻🇳', Laos: '🇱🇦' };

const DEFAULT_CAMBODIA_POLICY = {
  country: 'Cambodia',
  currency: 'USD',
  working_days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  weekly_off: ['Sunday'],
  leave_days_per_month: 1,
  max_annual_leave: 12,
  unauthorized_multiplier: 2,
  holiday_multiplier: 2,
  ot_multiplier: 2,
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
    att_late:       'Late Arrival',
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
    ot_normal:      'Normal OT (×2)',
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
    att_late:       'Đi trễ',
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
    ot_normal:      'Tăng ca thường (×2)',
    ot_holiday:     'Ngày lễ (×2)',
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
  users:       () => db.collection('apps').doc('hr').collection('users'),
  leave:       () => db.collection('apps').doc('hr').collection('leave'),
  payroll:     () => db.collection('apps').doc('hr').collection('payroll'),
  attendance:  () => db.collection('apps').doc('hr').collection('attendance'),
  violations:  () => db.collection('apps').doc('hr').collection('violations'),
  violTypes:   () => db.collection('apps').doc('hr').collection('violation_types'),
  leaveBalance:() => db.collection('apps').doc('hr').collection('leave_balance'),
  ot:          () => db.collection('apps').doc('hr').collection('ot'),
  policy:      () => db.collection('apps').doc('hr').collection('country_policy'),
  holidays:    () => db.collection('apps').doc('hr').collection('holidays'),
  pendingUsers:() => db.collection('apps').doc('hr').collection('pending_users'),
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
    el.dataset.page = item.page;
    el.innerHTML = `
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
      ${item.badge ? `<span class="nav-badge" id="badge-${item.page}">${item.badge}</span>` : ''}
    `;
    el.addEventListener('click', () => {
      showPage(item.page);
      loadPageData(item.page);
    });
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
      { section: t('nav_finance'),   page: 'payroll',    icon: '💰', label: t('nav_payroll') },
      { section: t('nav_finance'),   page: 'reports',    icon: '📑', label: t('nav_reports') },
      { section: t('nav_settings'),  page: 'policies',   icon: '⚙️', label: t('nav_policies') }
    ];
  }
  if (role === ROLES.COUNTRY_MANAGER) {
    return [
      { section: t('nav_overview'),  page: 'dashboard',  icon: '📊', label: t('nav_dashboard') },
      { section: t('nav_people'),    page: 'employees',  icon: '👥', label: t('nav_employees') },
      { section: t('nav_people'),    page: 'leave',      icon: '🌴', label: t('nav_leave'), badge: '' },
      { section: t('nav_people'),    page: 'attendance', icon: '⏱️', label: t('nav_attendance') },
      { section: t('nav_people'),    page: 'violations', icon: '⚠️', label: t('nav_violations') },
      { section: t('nav_finance'),   page: 'payroll',    icon: '💰', label: t('nav_payroll') }
    ];
  }
  return [
    { section: t('nav_me'), page: 'my-profile',   icon: '👤', label: t('nav_my_profile') },
    { section: t('nav_me'), page: 'my-leave',     icon: '🌴', label: t('nav_my_leave') },
    { section: t('nav_me'), page: 'my-salary',    icon: '💵', label: t('nav_my_salary') },
    { section: t('nav_me'), page: 'my-penalties', icon: '⚠️', label: t('nav_my_penalties') }
  ];
}

// ── Authentication ────────────────────────────────────────────
auth.onAuthStateChanged(async user => {
  if (user) {
    state.currentUser = user;
    try {
      const doc = await col.users().doc(user.uid).get();
      if (!doc.exists) {
        toast('User profile not found. Contact administrator.', 'error');
        auth.signOut();
        return;
      }
      state.userProfile = { uid: user.uid, ...doc.data() };
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

// ── Sidebar toggle ────────────────────────────────────────────
$('sidebar-toggle').addEventListener('click', () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  $('sidebar').classList.toggle('collapsed', state.sidebarCollapsed);
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
              <input class="form-control" id="emp-salary" type="number" placeholder="500">
            </div>
            <div class="form-group">
              <label>${t('emp_allowance')}</label>
              <input class="form-control" id="emp-allowance" type="number" placeholder="0">
            </div>
          </div>
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
      <td class="td-mono">$${(e.salary || 0).toLocaleString()}</td>
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
  $('emp-country').value = state.userProfile.country || 'Cambodia';
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
  return `<tr>
    <td><strong>${r.employeeName || '–'}</strong></td>
    <td>${COUNTRY_FLAG[r.country] || ''} ${r.country || ''}</td>
    <td>${r.from || ''}</td>
    <td>${r.to || ''}</td>
    <td>${r.days || 1}</td>
    <td>${r.leaveType === 'paid' ? `🟢 ${t('leave_paid')}` : `🔴 ${t('leave_unpaid')}`}</td>
    <td style="max-width:200px;white-space:normal;">${r.reason || ''}</td>
    <td>${statusBadge}</td>
    <td>
      ${canAct ? `
        <button class="btn btn-sm btn-success" onclick="approveLeave('${r.id}')">${t('leave_approve')}</button>
        <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="rejectLeave('${r.id}')">${t('leave_reject')}</button>
      ` : '–'}
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
    await col.leave().doc(id).update({
      status: 'rejected',
      rejectedBy: state.userProfile.uid,
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason
    });
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
  const canAdd = isAdmin() || isCountryManager();
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
                <td><span class="badge badge-${r.status === 'processed' ? 'grey' : 'amber'}">${r.status || 'logged'}</span></td>
                <td>${r.notes || ''}</td>
              </tr>`) .join('')
            : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">⏱️</div><h4>No attendance records</h4></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" id="modal-attendance">
      <div class="modal">
        <div class="modal-header"><h3>Log Attendance Record</h3><button class="modal-close">×</button></div>
        <div class="modal-body">
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
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input class="form-control" type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Type</label>
              <select class="form-control" id="att-type">
                <option value="late">Late Arrival</option>
                <option value="unauthorized_absence">Unauthorized Absence</option>
              </select>
            </div>
          </div>
          <div class="form-group" id="att-late-group">
            <label>Minutes Late</label>
            <input class="form-control" type="number" id="att-minutes" placeholder="e.g. 20" oninput="calcLatePenalty()">
          </div>
          <div class="form-group">
            <label>Calculated Penalty</label>
            <input class="form-control" id="att-penalty" readonly placeholder="Auto-calculated">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-control" id="att-notes" rows="2" placeholder="Optional notes…"></textarea>
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
  if (!state.cache.employees) { loadEmployees().then(() => openModal('modal-attendance')); return; }
  openModal('modal-attendance');
};

window.calcLatePenalty = function() {
  const mins = parseInt($('att-minutes')?.value) || 0;
  const type = $('att-type')?.value;
  const sel  = $('att-uid');
  const salary = parseFloat(sel?.selectedOptions[0]?.dataset.salary || 0);
  const dailyRate = salary / 26; // ~26 working days

  let penalty = 0;
  if (type === 'late') {
    if (mins >= 60)      penalty = dailyRate;
    else if (mins >= 15) penalty = 10;
    else if (mins >= 1)  penalty = 5;
  } else if (type === 'unauthorized_absence') {
    penalty = dailyRate * 2;
  }
  const penEl = $('att-penalty');
  if (penEl) penEl.value = '$' + penalty.toFixed(2);
};

window.saveAttendance = async function() {
  const uid  = $('att-uid')?.value;
  const date = $('att-date')?.value;
  const type = $('att-type')?.value;
  const mins = parseInt($('att-minutes')?.value) || 0;
  if (!uid || !date) { toast('Employee and date required.', 'error'); return; }

  const sel = $('att-uid');
  const salary = parseFloat(sel?.selectedOptions[0]?.dataset.salary || 0);
  const empName = sel?.selectedOptions[0]?.textContent || '';
  const dailyRate = salary / 26;

  let penalty = 0;
  if (type === 'late') {
    if (mins >= 60) penalty = dailyRate;
    else if (mins >= 15) penalty = 10;
    else if (mins >= 1)  penalty = 5;
  } else penalty = dailyRate * 2;

  try {
    await col.attendance().add({
      uid, date, type, minutesLate: mins, penalty,
      employeeName: empName.split('(')[0].trim(),
      country: state.userProfile.country || '',
      notes: $('att-notes')?.value || '',
      status: 'logged',
      createdBy: state.userProfile.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Attendance record saved.', 'success');
    closeModal('modal-attendance');
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
          <thead><tr><th>Employee</th><th>Date</th><th>Violation</th><th>Penalty</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            ${violations.length ? violations.map(v => `
              <tr>
                <td>${v.employeeName || v.uid}</td>
                <td class="td-mono">${v.date || ''}</td>
                <td>${v.violationType || ''}</td>
                <td class="td-mono payroll-negative">$${(v.penalty || 0).toFixed(2)}</td>
                <td><span class="badge badge-${v.status==='processed'?'grey':'amber'}">${v.status||'logged'}</span></td>
                <td>${v.notes || ''}</td>
              </tr>`).join('')
            : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">⚠️</div><h4>No violations recorded</h4></div></td></tr>`}
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
        ${!isLocked ? `<button class="btn btn-gold" onclick="generatePayroll()">${t('pay_generate')}</button>` : ''}
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
                <td class="td-mono">$${(p.basic || e.salary || 0).toLocaleString()}</td>
                <td class="td-mono">$${(p.allowance || e.allowance || 0).toLocaleString()}</td>
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

window.editPayrollLine = function(uid) {
  toast('Manual payroll adjustment – coming soon.', 'info');
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
      <div class="form-group"><label>Currency</label>
        <input class="form-control" id="policy-currency" value="${p.currency||'USD'}"></div>
      <div class="form-group"><label>Leave Days Per Month</label>
        <input class="form-control" type="number" id="policy-leave" value="${p.leave_days_per_month??1}"></div>
    </div>
    <div class="form-group"><label>Working Days (comma-separated)</label>
      <input class="form-control" id="policy-working" value="${(p.working_days||[]).join(', ')}">
    </div>
    <div class="form-group"><label>Weekly Off Days</label>
      <input class="form-control" id="policy-off" value="${(p.weekly_off||[]).join(', ')}">
    </div>
  `;
  openModal('modal-policy');
};

window.savePolicy = async function() {
  const country = $('policy-country')?.value;
  if (!country) return;
  const data = {
    country,
    currency: $('policy-currency')?.value || 'USD',
    leave_days_per_month: parseInt($('policy-leave')?.value) || 1,
    working_days: ($('policy-working')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
    weekly_off:   ($('policy-off')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await col.policy().doc(country).set(data, { merge: true });
    toast('Policy saved.', 'success');
    closeModal('modal-policy');
    loadPolicies();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
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
        { icon:'👥', label:t('rep_employees'), action:'rptEmployees' },
        { icon:'💰', label:t('rep_payroll'),   action:'rptPayroll' },
        { icon:'🌴', label:t('rep_leave'),     action:'rptLeave' },
        { icon:'⚠️', label:t('rep_violations'),action:'rptViolations' },
        { icon:'📅', label:t('rep_holidays'),  action:'rptHolidays' }
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
window.rptLeave = function() { toast('Export leave – run loadLeave() then export.', 'info'); };
window.rptViolations = function() { toast('Export violations – coming soon.', 'info'); };
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
        ${profileField(t('my_salary'), `$${(p.salary||0).toLocaleString()}`)}
        ${profileField(t('my_allowance'), `$${(p.allowance||0).toLocaleString()}`)}
      </div>
    </div>
  `;
}

function profileField(label, value) {
  return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
    <span style="color:var(--text-muted);font-size:.84rem;">${label}</span>
    <strong style="font-size:.88rem;">${value}</strong>
  </div>`;
}

async function getLeaveBalance(uid) {
  const snap = await col.leaveBalance().doc(uid).get();
  if (snap.exists) return snap.data().balance ?? 0;
  return 0;
}

async function loadMyLeave() {
  const uid = state.userProfile.uid;
  const [reqSnap, balance] = await Promise.all([
    col.leave().where('uid','==',uid).orderBy('createdAt','desc').limit(50).get(),
    getLeaveBalance(uid)
  ]);
  const requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));

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
  if (!from || !to) { toast('From and To dates required.', 'error'); return; }

  const fromDate = new Date(from);
  const toDate   = new Date(to);
  if (toDate < fromDate) { toast('To date must be after From date.', 'error'); return; }

  const days = Math.ceil((toDate - fromDate) / 86400000) + 1;
  const balance = await getLeaveBalance(state.userProfile.uid);
  const leaveType = balance >= days ? 'paid' : 'unpaid';

  try {
    await col.leave().add({
      uid: state.userProfile.uid,
      employeeName: state.userProfile.name,
      country: state.userProfile.country,
      from, to, days, reason, leaveType,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('Leave request submitted.', 'success');
    closeModal('modal-my-leave');
    loadMyLeave();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
};

async function loadMySalary() {
  const uid = state.userProfile.uid;
  const snap = await col.payroll().where('uid','==',uid).orderBy('month','desc').limit(12).get();
  const records = snap.docs.map(d => d.data());

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
  const [attSnap, violSnap] = await Promise.all([
    col.attendance().where('uid','==',uid).orderBy('date','desc').limit(50).get(),
    col.violations().where('uid','==',uid).orderBy('date','desc').limit(50).get()
  ]);

  const att  = attSnap.docs.map(d => ({ ...d.data(), _type: 'late' }));
  const viol = violSnap.docs.map(d => ({ ...d.data(), _type: 'violation' }));
  const all  = [...att, ...viol].sort((a,b) => (b.date||'').localeCompare(a.date||''));

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
              <option value="normal">Normal OT (×2)</option>
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
  const multiplier = 2;                 // OT always ×2
  const otPay = hourlyRate * hours * multiplier;
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
  const otPay = hourlyRate * hours * 2;

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
  try {
    const doc = await col.leave().doc(id).get();
    if (!doc.exists) { toast('Request not found.', 'error'); return; }
    const req = doc.data();

    await col.leave().doc(id).update({
      status: 'approved',
      approvedBy: state.userProfile.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // If paid leave, deduct from balance
    if (req.leaveType === 'paid') {
      const remaining = await deductLeaveBalance(req.uid, req.days || 1);
      toast(`Leave approved. Remaining balance: ${remaining} days.`, 'success');
    } else {
      toast('Leave approved (unpaid).', 'success');
    }

    loadLeave();
  } catch(e) { toast('Error: ' + e.message, 'error'); }
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
              <div class="form-hint" style="margin-bottom:4px;">Currency</div>
              <strong>${p.currency || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Working Days</div>
              <strong style="font-size:.82rem;">${(p.working_days || []).join(', ') || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Weekly Off</div>
              <strong>${(p.weekly_off || []).join(', ') || '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Leave Days/Month</div>
              <strong>${p.leave_days_per_month ?? '–'}</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">OT Multiplier</div>
              <strong>${p.ot_multiplier || 2}×</strong>
            </div>
            <div>
              <div class="form-hint" style="margin-bottom:4px;">Holiday Multiplier</div>
              <strong>${p.holiday_multiplier || 2}×</strong>
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
