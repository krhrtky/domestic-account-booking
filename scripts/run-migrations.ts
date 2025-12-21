import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    const files = fs.readdirSync(migrationsDir).sort()
    
    console.log('Running migrations...')
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue
      
      console.log(`  Applying ${file}...`)
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      try {
        await client.query(sql)
        console.log(`  ✓ ${file} applied`)
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`  ⊘ ${file} skipped (already applied)`)
        } else {
          throw error
        }
      }
    }
    
    console.log('✓ All migrations applied')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
