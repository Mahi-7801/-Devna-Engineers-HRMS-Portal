import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Department name is required' })

    const { data, error } = await supabase
      .from('departments')
      .insert({ name })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

export default router
