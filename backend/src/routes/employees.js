import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', req.params.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Employee not found' })

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
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
      .from('employees')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('employee_id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Employee not found' })

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('employee_id', req.params.id)

    if (error) throw error

    res.json({ message: 'Employee deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
