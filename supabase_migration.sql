-- ============================================================
-- DEVNA ENGINEERS HRMS - Supabase Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT,
  dept TEXT,
  designation TEXT,
  status TEXT DEFAULT 'Active',
  doj TEXT,
  bank_name TEXT,
  bank_acc TEXT,
  ifsc TEXT,
  uan TEXT,
  esic TEXT,
  address TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SALARY DATA
CREATE TABLE IF NOT EXISTS salary_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  name TEXT,
  dept TEXT,
  shift TEXT,
  monthly_hrs REAL DEFAULT 0,
  per_day REAL DEFAULT 0,
  ot_hrs REAL DEFAULT 0,
  ot_rate REAL DEFAULT 0,
  ot_amount REAL DEFAULT 0,
  basic REAL DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ASSET RECOVERIES
CREATE TABLE IF NOT EXISTS asset_recoveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recovery_id TEXT UNIQUE NOT NULL,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  employee_name TEXT,
  asset_name TEXT,
  total REAL DEFAULT 0,
  paid REAL DEFAULT 0,
  emi REAL DEFAULT 0,
  next_due TEXT,
  status TEXT DEFAULT 'Active',
  months_left INTEGER DEFAULT 0,
  is_equipment BOOLEAN DEFAULT FALSE,
  is_joining_kit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT DEFAULT 'Present',
  ot_hours REAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- 5. LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  employee_name TEXT,
  leave_type TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  days INTEGER DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  attachment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEAVE BALANCES
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  total INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  remaining INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type)
);

-- 7. SHIFT SCHEDULES
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  employee_name TEXT,
  week_start TEXT NOT NULL,
  monday TEXT DEFAULT 'Morning',
  tuesday TEXT DEFAULT 'Morning',
  wednesday TEXT DEFAULT 'Morning',
  thursday TEXT DEFAULT 'Morning',
  friday TEXT DEFAULT 'Morning',
  saturday TEXT DEFAULT 'Morning',
  sunday TEXT DEFAULT 'Morning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, week_start)
);

-- 8. OVERTIME RECORDS
CREATE TABLE IF NOT EXISTS overtime_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  employee_name TEXT,
  dept TEXT,
  hours REAL DEFAULT 0,
  rate REAL DEFAULT 150,
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ASSETS INVENTORY
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tag TEXT,
  category TEXT,
  assignee TEXT,
  status TEXT,
  cost REAL DEFAULT 0,
  life_years INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ASSET ALLOCATIONS
CREATE TABLE IF NOT EXISTS asset_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT REFERENCES assets(asset_id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  allocated_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT DEFAULT 'Allocated',
  recovery_emi REAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. APPROVALS
CREATE TABLE IF NOT EXISTS approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  requester TEXT,
  action TEXT,
  date TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Normal',
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PAYROLL RECORDS
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  basic REAL DEFAULT 0,
  ot_amount REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_pay REAL DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- 13. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT DEFAULT 'Devna Engineers',
  registration_no TEXT DEFAULT '',
  gst_no TEXT DEFAULT '',
  pan TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  address TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  performed_by TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. EMPLOYEE SESSIONS (time tracking)
CREATE TABLE IF NOT EXISTS employee_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - Allow all access for authenticated users
-- ============================================================
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON salary_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON asset_recoveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON leave_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON shift_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON overtime_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON asset_allocations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON payroll_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON employee_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon access (for development)
CREATE POLICY "Allow all for anon" ON employees FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON salary_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON asset_recoveries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON attendance FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON leave_requests FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON leave_balances FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON shift_schedules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON overtime_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON assets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON asset_allocations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON approvals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON payroll_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON departments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON notifications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON company_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON employee_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- ENABLE REAL-TIME SUBSCRIPTIONS
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE salary_data;
ALTER PUBLICATION supabase_realtime ADD TABLE asset_recoveries;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE shift_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE overtime_records;
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE asset_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE payroll_records;
ALTER PUBLICATION supabase_realtime ADD TABLE departments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE company_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE employee_sessions;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(dept);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_salary_data_employee_id ON salary_data(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_recoveries_employee_id ON asset_recoveries(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_employee_id ON shift_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_employee_id ON overtime_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
