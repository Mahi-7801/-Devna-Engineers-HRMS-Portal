import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

import { errorHandler } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import authRoutes from './routes/auth.js'
import employeeRoutes from './routes/employees.js'
import attendanceRoutes from './routes/attendance.js'
import leaveRoutes from './routes/leaves.js'
import leaveBalanceRoutes from './routes/leaveBalances.js'
import salaryRoutes from './routes/salary.js'
import assetRoutes from './routes/assets.js'
import assetAllocationRoutes from './routes/assetAllocations.js'
import assetRecoveryRoutes from './routes/assetRecoveries.js'
import departmentRoutes from './routes/departments.js'
import approvalRoutes from './routes/approvals.js'
import payrollRoutes from './routes/payroll.js'
import notificationRoutes from './routes/notifications.js'
import shiftRoutes from './routes/shifts.js'
import overtimeRoutes from './routes/overtime.js'
import employeeSessionRoutes from './routes/employeeSessions.js'
import emailRoutes from './routes/email.js'

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
})
app.use(limiter)

const frontendDist = path.join(__dirname, '..', 'public')
app.use(express.static(frontendDist))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/leave-balances', leaveBalanceRoutes)
app.use('/api/salary', salaryRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/asset-allocations', assetAllocationRoutes)
app.use('/api/asset-recoveries', assetRecoveryRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/shifts', shiftRoutes)
app.use('/api/overtime', overtimeRoutes)
app.use('/api/employee-sessions', employeeSessionRoutes)
app.use('/api/email', emailRoutes)

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})
