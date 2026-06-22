import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/:user_id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.user_id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)

    if (error) throw error

    res.json({ message: 'Notification marked as read' })
  } catch (err) {
    next(err)
  }
})

export default router
