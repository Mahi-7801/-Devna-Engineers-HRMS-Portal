import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    let query = supabase
      .from('attendance')
      .select('*, employees!inner(*)')

    if (req.query.date) query = query.eq('date', req.query.date)
    if (req.query.employee_id) query = query.eq('employee_id', req.query.employee_id)
    if (req.query.status) query = query.eq('status', req.query.status)

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/today', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('*, employees!inner(*)')
      .eq('date', today)

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/upsert', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(req.body, { onConflict: 'employee_id,date' })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/check-in', async (req, res, next) => {
  try {
    const { employee_id } = req.body
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' })

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toLocaleTimeString('en-IN', { hour12: false })

    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        { employee_id, date: today, check_in: now, status: 'Present' },
        { onConflict: 'employee_id,date' }
      )
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/check-out', async (req, res, next) => {
  try {
    const { employee_id } = req.body
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' })

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toLocaleTimeString('en-IN', { hour12: false })

    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out: now })
      .eq('employee_id', employee_id)
      .eq('date', today)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
