import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/:employee_id', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('employee_sessions')
      .select('*')
      .eq('employee_id', req.params.employee_id)
      .eq('date', today)
      .maybeSingle()

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/start', async (req, res, next) => {
  try {
    const { employee_id } = req.body
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' })

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('employee_sessions')
      .insert({
        employee_id,
        date: today,
        check_in: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/end', async (req, res, next) => {
  try {
    const { employee_id } = req.body
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' })

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('employee_sessions')
      .update({
        check_out: new Date().toISOString(),
        status: 'completed',
      })
      .eq('employee_id', employee_id)
      .eq('date', today)
      .eq('status', 'active')
      .select()
      .maybeSingle()

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
