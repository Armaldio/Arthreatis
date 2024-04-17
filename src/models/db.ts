import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = 'https://wkoyslmrbixfnsfigjvc.supabase.co'
console.log('import.meta.env', import.meta.env)
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY ?? ''

console.log('supabaseKey', supabaseKey)

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)