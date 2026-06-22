const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oqnqygjqsbyflxwumvrt.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnF5Z2pxc2J5Zmx4d3VtdnJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg2Mzc0MywiZXhwIjoyMDk3NDM5NzQzfQ.rJsg1bJ_fR5NU4KPn0Ys-I9yic-wiUqcbCp_JoIYsgM'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupDatabase() {
  console.log('Creating auth users...')
  
  const users = [
    { email: 'admin@devna.com', password: 'admin123', name: 'Admin User', role: 'hr_manager', avatar: 'AU' },
    { email: 'super@devna.com', password: 'super123', name: 'Super Admin', role: 'super_admin', avatar: 'SA' },
  ]
  
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role, avatar: u.avatar }
    })
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`User ${u.email} already exists`)
      } else {
        console.error(`Error creating ${u.email}:`, error.message)
      }
    } else {
      console.log(`Created user: ${u.email}`)
    }
  }

  console.log('\nIMPORTANT: Database tables must be created manually.')
  console.log('Please follow these steps:')
  console.log('1. Go to https://supabase.com/dashboard/project/oqnqygjqsbyflxwumvrt')
  console.log('2. Open the SQL Editor')
  console.log('3. Copy the contents of supabase_migration.sql (in the root folder)')
  console.log('4. Paste and run it in the SQL Editor')
  console.log('5. All tables, RLS policies, real-time subscriptions, and seed data will be created')
}

setupDatabase().catch(console.error)
