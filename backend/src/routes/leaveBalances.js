import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/:employee_id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', req.params.employee_id)

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/upsert', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leave_balances')
      .upsert(req.body, { onConflict: 'employee_id,leave_type' })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

export default router
