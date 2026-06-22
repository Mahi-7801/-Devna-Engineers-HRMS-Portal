import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('salary_data')
      .select('*')

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/:employee_id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('salary_data')
      .select('*')
      .eq('employee_id', req.params.employee_id)
      .maybeSingle()

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.put('/upsert', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('salary_data')
      .upsert(req.body, { onConflict: 'employee_id' })
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/:employee_id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('salary_data')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('employee_id', req.params.employee_id)
      .select()

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
