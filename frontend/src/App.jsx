import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, RequireAuth } from './lib/AuthContext'
import Layout from './components/layout/Layout'
import Login from './components/Login'
import Landing from './components/Landing'
import Dashboard from './components/dashboard/Dashboard'
import EmployeeList from './components/employees/EmployeeList'
import EmployeeView from './components/employees/EmployeeView'
import EmployeeForm from './components/employees/EmployeeForm'
import PaySalary from './components/employees/PaySalary'
import SalaryIncreases from './components/employees/SalaryIncreases'
import EmployeeDashboard from './components/employee/EmployeeDashboard'
import Onboarding from './components/onboarding/Onboarding'
import AttendanceList from './components/attendance/AttendanceList'
import AttendanceReports from './components/attendance/AttendanceReports'
import LeaveManagement from './components/attendance/LeaveManagement'
import LeaveRequest from './components/attendance/LeaveRequest'
import ShiftScheduler from './components/shifts/ShiftScheduler'
import OvertimeManagement from './components/shifts/OvertimeManagement'
import AssetList from './components/assets/AssetList'
import AssetAllocation from './components/assets/AssetAllocation'
import AssetRecovery from './components/assets/AssetRecovery'
import ExitClearance from './components/assets/ExitClearance'
import ApprovalsCenter from './components/approvals/ApprovalsCenter'
import Reports from './components/reports/Reports'
import SelfService from './components/selfservice/SelfService'
import Settings from './components/settings/Settings'
import PayrollList from './components/payroll/PayrollList'
import PayrollProcess from './components/payroll/PayrollProcess'
import PayslipView from './components/payslip/PayslipView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/pay-salary" element={<PaySalary />} />
        <Route path="employees/salary-increases" element={<SalaryIncreases />} />
        <Route path="employees/:id" element={<EmployeeView />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="attendance" element={<AttendanceList />} />
        <Route path="attendance/reports" element={<AttendanceReports />} />
        <Route path="attendance/leave" element={<LeaveManagement />} />
        <Route path="attendance/leave/request" element={<LeaveRequest />} />
        <Route path="shifts" element={<ShiftScheduler />} />
        <Route path="shifts/overtime" element={<OvertimeManagement />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="assets/allocation" element={<AssetAllocation />} />
        <Route path="assets/recovery" element={<AssetRecovery />} />
        <Route path="assets/exit-clearance" element={<ExitClearance />} />
        <Route path="approvals" element={<ApprovalsCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="self-service" element={<SelfService />} />
        <Route path="settings" element={<Settings />} />
        <Route path="payroll" element={<PayrollList />} />
        <Route path="payroll/process" element={<PayrollProcess />} />
        <Route path="payroll/payslip/:id" element={<PayslipView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
