import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('shift_schedules')
      .select('*')
      .order('week_start', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/upsert', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('shift_schedules')
      .upsert(req.body, { onConflict: 'employee_id,week_start' })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

export default router
