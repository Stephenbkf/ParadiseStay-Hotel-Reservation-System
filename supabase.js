// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase configuration
const supabaseUrl = 'https://juyastfivdbgjhylzsey.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eWFzdGZpdmRiZ2poeWx6c2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTQ4MTYsImV4cCI6MjA5NDIzMDgxNn0.k1OgeWZIhrOMp6u7KzahjzH-bGAuoc7-rmyiRKfWXT8'

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// ==================== AUTHENTICATION ====================

/**
 * Sign up a new user
 */
export async function signUp(email, password, userData = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

/**
 * Sign in an existing user
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the current user session
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// ==================== ROOMS ====================

/**
 * Get all available rooms
 */
export async function getRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true })
  return { data, error }
}

/**
 * Get a specific room by ID
 */
export async function getRoomById(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()
  return { data, error }
}

/**
 * Get available rooms for specific dates
 */
export async function getAvailableRooms(checkIn, checkOut) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('status', 'available')
  
  // Additional filtering for date conflicts can be done here
  // by checking against reservations table
  return { data, error }
}

/**
 * Add a new room (admin only)
 */
export async function addRoom(roomData) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([roomData])
    .select()
  return { data, error }
}

/**
 * Update room information (admin only)
 */
export async function updateRoom(roomId, updates) {
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
  return { data, error }
}

/**
 * Delete a room (admin only)
 */
export async function deleteRoom(roomId) {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)
  return { error }
}

// ==================== RESERVATIONS ====================

/**
 * Create a new reservation with multiple rooms
 */
export async function createReservationWithRooms(reservationData, roomIds) {
  // Create reservation
  const { data: reservation, error: reservationError } = await supabase
    .from('reservations')
    .insert([reservationData])
    .select()
    .single()
  
  if (reservationError) return { data: null, error: reservationError }
  
  // Add rooms to reservation
  const roomAssociations = roomIds.map(roomId => ({
    reservation_id: reservation.id,
    room_id: roomId
  }))
  
  const { error: roomsError } = await supabase
    .from('reservation_rooms')
    .insert(roomAssociations)
  
  if (roomsError) {
    // Rollback: delete the reservation if room association fails
    await supabase.from('reservations').delete().eq('id', reservation.id)
    return { data: null, error: roomsError }
  }
  
  return { data: reservation, error: null }
}

/**
 * Create a new reservation (legacy - single room)
 */
export async function createReservation(reservationData) {
  const { data, error } = await supabase
    .from('reservations')
    .insert([reservationData])
    .select()
  return { data, error }
}

/**
 * Get all reservations with rooms and guest info
 */
export async function getReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      guests (*),
      staff:staff_id (full_name, email),
      reservation_rooms (
        room_id,
        rooms (*)
      )
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Get reservations for a specific guest
 */
export async function getGuestReservations(guestId) {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      guests (*),
      staff:staff_id (full_name, email),
      reservation_rooms (
        room_id,
        rooms (*)
      )
    `)
    .eq('guest_id', guestId)
    .order('check_in', { ascending: true })
  return { data, error }
}

/**
 * Get reservations handled by a specific staff member
 */
export async function getStaffReservations(staffId) {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      guests (*),
      staff:staff_id (full_name, email),
      reservation_rooms (
        room_id,
        rooms (*)
      )
    `)
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Get reservations for a specific user (legacy compatibility)
 */
export async function getUserReservations(userId) {
  // This is for backward compatibility - now we use guest_id
  return getStaffReservations(userId)
}

/**
 * Get a specific reservation by ID
 */
export async function getReservationById(reservationId) {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      guests (*),
      staff:staff_id (full_name, email),
      reservation_rooms (
        room_id,
        rooms (*)
      )
    `)
    .eq('id', reservationId)
    .single()
  return { data, error }
}

/**
 * Get rooms for a specific reservation
 */
export async function getReservationRooms(reservationId) {
  const { data, error } = await supabase
    .from('reservation_rooms')
    .select(`
      *,
      rooms (*)
    `)
    .eq('reservation_id', reservationId)
  return { data, error }
}

/**
 * Update reservation status
 */
export async function updateReservation(reservationId, updates) {
  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId)
    .select()
  return { data, error }
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(reservationId) {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)
    .select()
  return { data, error }
}

/**
 * Delete a reservation (admin only)
 */
export async function deleteReservation(reservationId) {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)
  return { error }
}

// ==================== GUESTS ====================

/**
 * Create or get guest by email
 */
export async function createOrGetGuest(fullName, email = null, phone = null) {
  // Try to find existing guest by email
  if (email) {
    const { data: existing } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existing) return { data: existing, error: null }
  }
  
  // Create new guest
  const { data, error } = await supabase
    .from('guests')
    .insert([{ full_name: fullName, email, phone }])
    .select()
    .single()
  
  return { data, error }
}

/**
 * Get all guests
 */
export async function getGuests() {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Get guest by ID
 */
export async function getGuestById(guestId) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single()
  return { data, error }
}

/**
 * Update guest information
 */
export async function updateGuest(guestId, updates) {
  const { data, error } = await supabase
    .from('guests')
    .update(updates)
    .eq('id', guestId)
    .select()
  return { data, error }
}

/**
 * Search guests by name, email, or phone
 */
export async function searchGuests(query) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
  return { data, error }
}

// ==================== STAFF ====================

/**
 * Get all staff members
 */
export async function getStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

/**
 * Get staff member by ID
 */
export async function getStaffById(staffId) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .single()
  return { data, error }
}

// ==================== ROOM TYPES ====================

/**
 * Get all room types
 */
export async function getRoomTypes() {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .order('name', { ascending: true })
  return { data, error }
}

/**
 * Get room type by ID
 */
export async function getRoomTypeById(roomTypeId) {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('id', roomTypeId)
    .single()
  return { data, error }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to room changes
 */
export function subscribeToRooms(callback) {
  return supabase
    .channel('rooms-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'rooms' },
      callback
    )
    .subscribe()
}

/**
 * Subscribe to reservation changes
 */
export function subscribeToReservations(callback) {
  return supabase
    .channel('reservations-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      callback
    )
    .subscribe()
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if room is available for given dates
 */
export async function checkRoomAvailability(roomId, checkIn, checkOut) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('room_id', roomId)
    .neq('status', 'cancelled')
    .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`)
  
  if (error) return { available: false, error }
  return { available: data.length === 0, conflictingReservations: data }
}


