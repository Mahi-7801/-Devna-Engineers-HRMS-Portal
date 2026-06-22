import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ endpoints: ['POST /login', 'POST /logout', 'GET /me'] })
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      await supabase.auth.admin.signOut(token)
    }

    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({
      id: user.id,
      email: user.email,
      ...user.user_metadata,
    })
  } catch (err) {
    next(err)
  }
})

export default router
