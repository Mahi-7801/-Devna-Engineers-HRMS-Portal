import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

router.get('/', (req, res) => {
  res.json({ endpoints: ['POST /send-welcome'] })
})

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

router.post('/send-welcome', async (req, res) => {
  try {
    const { email, name, employeeId, password, department, designation, role, basicSalary, otRate, allocatedAssets, totalAssetCost, monthlyEMI, netSalary } = req.body

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' })
    }

    const roleLabel = {
      super_admin: 'Super Admin',
      hr_manager: 'HR Manager',
      manager: 'Manager',
      dept_manager: 'Department Manager',
      employee: 'Employee'
    }[role] || role || 'Employee'

    const assetsList = Array.isArray(allocatedAssets) && allocatedAssets.length > 0
      ? allocatedAssets.map(a => `<tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${a.name}</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569; text-align: right;">₹${Number(a.cost).toLocaleString()}</td></tr>`).join('')
      : ''

    const salarySection = basicSalary ? `
      <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 15px;">Compensation & Deductions Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Base Salary</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #059669; text-align: right; font-weight: bold;">₹${Number(basicSalary).toLocaleString()} / month</td>
          </tr>
          ${otRate ? `<tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Overtime Rate</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569; text-align: right;">₹${Number(otRate).toLocaleString()} / hour</td></tr>` : ''}
          ${totalAssetCost ? `<tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Allocated Gear Value</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569; text-align: right;">₹${Number(totalAssetCost).toLocaleString()}</td></tr>` : ''}
          ${monthlyEMI ? `<tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #fef2f2; font-weight: bold; color: #dc2626;">EMI Deduction (12 months)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #dc2626; text-align: right; font-weight: bold;">-₹${Number(monthlyEMI).toLocaleString()} / month</td></tr>` : ''}
          ${netSalary ? `<tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #2563eb; font-weight: bold; color: #ffffff;">Estimated Net Salary (in-hand)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #2563eb; color: #ffffff; text-align: right; font-weight: bold;">₹${Number(netSalary).toLocaleString()} / month</td></tr>` : ''}
        </table>
      </div>` : ''

    const assetsSection = assetsList ? `
      <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 15px;">Allocated Assets & Gear</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; color: #475569;">Item</th>
              <th style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${assetsList}
          </tbody>
        </table>
      </div>` : ''

    const mailOptions = {
      from: `"Devna Engineers HRMS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Devna Engineers — Your Onboarding is Complete',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563eb;">
            <h1 style="color: #2563eb; margin: 0;">Devna Engineers</h1>
            <p style="color: #64748b; margin: 4px 0 0;">HR Management System</p>
          </div>

          <div style="padding: 24px 0;">
            <h2 style="color: #1e293b;">Welcome, ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">Your employee profile has been successfully created in the Devna Engineers HRMS portal. Below is your complete onboarding summary:</p>

            <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
              <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 15px;">Profile Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b; width: 140px;">Employee ID</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${employeeId || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Full Name</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Email</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Department</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${department || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Designation</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${designation || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Access Level</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${roleLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; color: #1e293b;">Password</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569;">${password || '123456'}</td>
                </tr>
              </table>
            </div>

            ${salarySection}
            ${assetsSection}

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin: 0 0 8px;">Login Instructions</h3>
              <p style="color: #475569; margin: 0; line-height: 1.6;">
                <strong>Portal URL:</strong> <a href="https://Mahi7801-Devna-Engineers-HRMS-Portal.hf.space/login" style="color: #2563eb;">https://Mahi7801-Devna-Engineers-HRMS-Portal.hf.space/login</a><br>
                <strong>Email:</strong> ${email}<br>
                <strong>Password:</strong> ${password || '123456'}
              </p>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 20px;">
              For security reasons, please change your password after your first login. If you have any questions, please contact your HR department.
            </p>
          </div>

          <div style="text-align: center; padding: 16px 0; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Devna Engineers. All rights reserved.</p>
            <p style="margin: 4px 0 0;">This is an automated message, please do not reply directly.</p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    res.json({ success: true, message: 'Welcome email sent successfully' })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
    res.status(500).json({ error: 'Failed to send email', details: err.message })
  }
})

export default router
