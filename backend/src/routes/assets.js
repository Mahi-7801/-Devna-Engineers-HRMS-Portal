import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('assets')
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
    const { data, error } = await supabase
      .from('assets')
      .insert(req.body)
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/:asset_id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('asset_id', req.params.asset_id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Asset not found' })

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
