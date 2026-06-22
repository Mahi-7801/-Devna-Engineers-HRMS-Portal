import supabase from './supabase'

// ============================
// EMPLOYEES
// ============================
export async function getEmployees() {
  const { data, error } = await supabase.from('employees').select('*').order('name')
  if (error) throw error
  return data
}

export async function getEmployee(employeeId) {
  const { data, error } = await supabase.from('employees').select('*').eq('employee_id', employeeId).single()
  if (error) throw error
  return data
}

export async function createEmployee(emp) {
  const { data, error } = await supabase.from('employees').insert(emp).select().single()
  if (error) throw error
  return data
}

export async function updateEmployee(employeeId, updates) {
  const { data, error } = await supabase.from('employees').update(updates).eq('employee_id', employeeId).select().single()
  if (error) throw error
  return data
}

export async function deleteEmployee(employeeId) {
  const { error } = await supabase.from('employees').delete().eq('employee_id', employeeId)
  if (error) throw error
}

// ============================
// SALARY DATA
// ============================
export async function getSalaryData() {
  const { data, error } = await supabase.from('salary_data').select('*')
  if (error) throw error
  return data
}

export async function getEmployeeSalary(employeeId) {
  const { data, error } = await supabase.from('salary_data').select('*').eq('employee_id', employeeId).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSalaryData(salary) {
  const existing = await supabase.from('salary_data').select('id').eq('employee_id', salary.employee_id).maybeSingle()
  if (existing.data) {
    const { data, error } = await supabase.from('salary_data').update(salary).eq('employee_id', salary.employee_id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('salary_data').insert(salary).select().single()
  if (error) throw error
  return data
}

export async function updateSalary(employeeId, updates) {
  const { data, error } = await supabase.from('salary_data').update(updates).eq('employee_id', employeeId).select()
  if (error) throw error
  return data
}

// ============================
// ASSET RECOVERIES
// ============================
export async function getAssetRecoveries() {
  const { data, error } = await supabase.from('asset_recoveries').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAssetRecovery(recovery) {
  const { data, error } = await supabase.from('asset_recoveries').insert(recovery).select().single()
  if (error) throw error
  return data
}

export async function updateAssetRecovery(id, updates) {
  const { data, error } = await supabase.from('asset_recoveries').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ============================
// ATTENDANCE
// ============================
export async function getAttendance(filters = {}) {
  let q = supabase.from('attendance').select('*, employees!inner(*)')
  if (filters.date) q = q.eq('date', filters.date)
  if (filters.employee_id) q = q.eq('employee_id', filters.employee_id)
  if (filters.status) q = q.eq('status', filters.status)
  const { data, error } = await q.order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function getTodayAttendance() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('attendance').select('*, employees(*)').eq('date', today)
  if (error) throw error
  return data
}

export async function upsertAttendance(record) {
  const { data, error } = await supabase.from('attendance').upsert(record, { onConflict: 'employee_id,date' }).select().single()
  if (error) throw error
  return data
}

export async function checkIn(employeeId) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toLocaleTimeString('en-IN', { hour12: false })
  const { data, error } = await supabase.from('attendance').upsert(
    { employee_id: employeeId, date: today, check_in: now, status: 'Present' },
    { onConflict: 'employee_id,date' }
  ).select().single()
  if (error) throw error
  return data
}

export async function checkOut(employeeId) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toLocaleTimeString('en-IN', { hour12: false })
  const { data, error } = await supabase.from('attendance').update({ check_out: now }).eq('employee_id', employeeId).eq('date', today).select().single()
  if (error) throw error
  return data
}

// ============================
// LEAVE REQUESTS
// ============================
export async function getLeaveRequests() {
  const { data, error } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createLeaveRequest(leave) {
  const { data, error } = await supabase.from('leave_requests').insert(leave).select().single()
  if (error) throw error
  return data
}

export async function updateLeaveRequest(id, updates) {
  const { data, error } = await supabase.from('leave_requests').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ============================
// LEAVE BALANCES
// ============================
export async function getLeaveBalances(employeeId) {
  const { data, error } = await supabase.from('leave_balances').select('*').eq('employee_id', employeeId)
  if (error) throw error
  return data
}

export async function getAllLeaveBalances() {
  const { data, error } = await supabase.from('leave_balances').select('*')
  if (error) throw error
  return data
}

export async function upsertLeaveBalance(balance) {
  const { data, error } = await supabase.from('leave_balances').upsert(balance, { onConflict: 'employee_id,leave_type' }).select().single()
  if (error) throw error
  return data
}

// ============================
// SHIFT SCHEDULES
// ============================
export async function getShiftSchedules() {
  const { data, error } = await supabase.from('shift_schedules').select('*').order('week_start', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertShiftSchedule(schedule) {
  const { data, error } = await supabase.from('shift_schedules').upsert(schedule, { onConflict: 'employee_id,week_start' }).select().single()
  if (error) throw error
  return data
}

// ============================
// OVERTIME
// ============================
export async function getOvertimeRecords() {
  const { data, error } = await supabase.from('overtime_records').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createOvertimeRecord(ot) {
  const { data, error } = await supabase.from('overtime_records').insert(ot).select().single()
  if (error) throw error
  return data
}

export async function updateOvertimeRecord(id, updates) {
  const { data, error } = await supabase.from('overtime_records').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ============================
// ASSETS
// ============================
export async function getAssets() {
  const { data, error } = await supabase.from('assets').select('*').order('name')
  if (error) throw error
  return data
}

export async function createAsset(asset) {
  const { data, error } = await supabase.from('assets').insert(asset).select().single()
  if (error) throw error
  return data
}

export async function updateAsset(assetId, updates) {
  const { data, error } = await supabase.from('assets').update(updates).eq('asset_id', assetId).select().single()
  if (error) throw error
  return data
}

// ============================
// ASSET ALLOCATIONS
// ============================
export async function getAssetAllocations() {
  const { data, error } = await supabase.from('asset_allocations').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAssetAllocation(allocation) {
  const { data, error } = await supabase.from('asset_allocations').insert(allocation).select().single()
  if (error) throw error
  return data
}

// ============================
// APPROVALS
// ============================
export async function getApprovals() {
  const { data, error } = await supabase.from('approvals').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createApproval(approval) {
  const { data, error } = await supabase.from('approvals').insert(approval).select().single()
  if (error) throw error
  return data
}

export async function updateApproval(id, updates) {
  const { data, error } = await supabase.from('approvals').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ============================
// PAYROLL
// ============================
export async function getPayrollRecords() {
  const { data, error } = await supabase.from('payroll_records').select('*').order('year', { ascending: false }).order('month', { ascending: false })
  if (error) throw error
  return data
}

export async function createPayrollRecord(record) {
  const { data, error } = await supabase.from('payroll_records').insert(record).select().single()
  if (error) throw error
  return data
}

// ============================
// DEPARTMENTS
// ============================
export async function getDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('name')
  if (error) throw error
  return data
}

export async function createDepartment(name) {
  const { data, error } = await supabase.from('departments').insert({ name }).select().single()
  if (error) throw error
  return data
}

// ============================
// NOTIFICATIONS
// ============================
export async function getNotifications(userId) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  return data
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}

export async function createNotification({ user_id, employee_id, title, message }) {
  const record = {
    title: title || '',
    message: message || '',
    read: false,
    created_at: new Date().toISOString()
  }
  if (user_id) record.user_id = user_id
  if (employee_id) record.user_id = `emp_${employee_id}`
  const { data, error } = await supabase.from('notifications').insert(record).select().single()
  if (error) throw error
  return data
}

export async function getAllNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  return data || []
}

export async function getEmployeeNotifications(employeeId) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', `emp_${employeeId}`).order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  return data
}

// ============================
// EMPLOYEE SESSIONS (Time Tracking)
// ============================
export async function getEmployeeSession(employeeId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('employee_sessions').select('*').eq('employee_id', employeeId).eq('date', today).maybeSingle()
  if (error) throw error
  return data
}

export async function startEmployeeSession(employeeId) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toLocaleTimeString('en-IN', { hour12: false })
  const existing = await supabase.from('employee_sessions')
    .select('id').eq('employee_id', employeeId).eq('date', today).maybeSingle()
  let data
  if (existing.data) {
    const { data: updated, error } = await supabase.from('employee_sessions')
      .update({ check_in: new Date().toISOString(), status: 'active' })
      .eq('id', existing.data.id).select().single()
    if (error) throw error
    data = updated
  } else {
    const { data: created, error } = await supabase.from('employee_sessions')
      .insert({ employee_id: employeeId, date: today, check_in: new Date().toISOString(), status: 'active' })
      .select().single()
    if (error) throw error
    data = created
  }
  try {
    await supabase.from('attendance').upsert(
      { employee_id: employeeId, date: today, check_in: now, status: 'Present' },
      { onConflict: 'employee_id,date' }
    )
  } catch (syncErr) {
    console.error('Failed to sync attendance on check-in:', syncErr)
  }
  return data
}

export async function endEmployeeSession(employeeId) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toLocaleTimeString('en-IN', { hour12: false })
  const { data, error } = await supabase.from('employee_sessions').update({
    check_out: new Date().toISOString(), status: 'completed'
  }).eq('employee_id', employeeId).eq('date', today).eq('status', 'active').select()
  if (error) throw error
  await supabase.from('attendance').update({ check_out: now }).eq('employee_id', employeeId).eq('date', today)
    .catch(err => console.error('Failed to sync attendance on check-out:', err))
  return data?.[0] || { check_out: new Date().toISOString() }
}

export async function getAttendanceReport({ dept, employeeId, fromDate, toDate } = {}) {
  let q = supabase.from('attendance').select('*, employees!inner(*)')
  if (fromDate) q = q.gte('date', fromDate)
  if (toDate) q = q.lte('date', toDate)
  if (employeeId) q = q.eq('employee_id', employeeId)
  if (dept && dept !== 'All') q = q.eq('employees.department', dept)
  const { data, error } = await q.order('date', { ascending: false })
  if (error) throw error
  return data
}

// ============================
// COMPANY SETTINGS
// ============================
export async function getCompanySettings() {
  const { data, error } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data || {}
}

export async function upsertCompanySettings(settings) {
  const { data, error } = await supabase.from('company_settings').upsert({ id: 1, ...settings, updated_at: new Date().toISOString() }).select().single()
  if (error) throw error
  return data
}

// ============================
// AUDIT LOGS
// ============================
export async function getAuditLogs(limit = 50) {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data || []
}

export async function createAuditLog({ action, table_name, record_id, performed_by, details }) {
  const { error } = await supabase.from('audit_logs').insert({
    action, table_name: table_name || null, record_id: record_id || null,
    performed_by: performed_by || null, details: details || null,
    created_at: new Date().toISOString()
  })
  if (error) console.error('Failed to create audit log:', error)
}

// ============================
// REAL-TIME SUBSCRIPTIONS
// ============================
export function subscribeToTable(table, callback, event = '*') {
  return supabase.channel(`${table}-changes`)
    .on('postgres_changes', { event, schema: 'public', table }, payload => {
      callback(payload)
    })
    .subscribe()
}

export function subscribeToEmployee(employeeId, callback) {
  return supabase.channel(`employee-${employeeId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', filter: `employee_id=eq.${employeeId}` }, callback)
    .subscribe()
}
