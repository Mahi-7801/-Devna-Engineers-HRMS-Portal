import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('approvals')
      .insert(req.body)
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('approvals')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Approval not found' })

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
