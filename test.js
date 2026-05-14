import { supabase } from './supabase.js'

async function test() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')

  console.log("DATA:", data)
  console.log("ERROR:", error)
}

test()