-- ==================== HOTEL RESERVATION SYSTEM - FRESH SCHEMA ====================
-- This script drops all existing tables and creates a fresh schema with new requirements
-- WARNING: This will DELETE ALL existing data!

-- ==================== DROP ALL EXISTING TABLES ====================

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservation_rooms CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS reservations_new CASCADE;
DROP TABLE IF EXISTS reservations_old CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS users_old CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS trigger_update_guests_updated_at ON guests;
DROP TRIGGER IF EXISTS trigger_update_staff_updated_at ON staff;
DROP TRIGGER IF EXISTS trigger_update_room_types_updated_at ON room_types;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_or_get_guest(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_reservation_with_rooms(INTEGER, UUID, INTEGER[], DATE, DATE, DECIMAL, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- ==================== CREATE NEW TABLES ====================

-- Guests table (separate from authentication)
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table (linked to auth.users)
CREATE TABLE staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'admin', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room types table
CREATE TABLE room_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table (with room_type_id)
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number TEXT UNIQUE NOT NULL,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  price_per_night DECIMAL(10, 2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  description TEXT,
  amenities TEXT[],
  image_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations table (with guest_id and staff_id)
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  num_guests INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Junction table for multi-room reservations
CREATE TABLE reservation_rooms (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reservation_id, room_id)
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'cash', 'online')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table (with guest_id)
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== CREATE INDEXES ====================

CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservations_staff_id ON reservations(staff_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_rooms_reservation_id ON reservation_rooms(reservation_id);
CREATE INDEX idx_reservation_rooms_room_id ON reservation_rooms(room_id);
CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_reviews_guest_id ON reviews(guest_id);
CREATE INDEX idx_reviews_room_id ON reviews(room_id);

-- ==================== CREATE FUNCTIONS ====================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== CREATE TRIGGERS ====================

CREATE TRIGGER trigger_update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_room_types_updated_at
  BEFORE UPDATE ON room_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== ENABLE ROW LEVEL SECURITY ====================

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ==================== CREATE RLS POLICIES ====================

-- Guests policies
CREATE POLICY "Anyone can view guests" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert guests" ON guests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

CREATE POLICY "Staff can update guests" ON guests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

-- Staff policies
CREATE POLICY "Authenticated users can view staff" ON staff
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Staff can view their own record" ON staff
  FOR SELECT USING (
    id = auth.uid()
  );

CREATE POLICY "Admins can manage staff" ON staff
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
  );

-- Room types policies
CREATE POLICY "Anyone can view room types" ON room_types
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage room types" ON room_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
  );

-- Rooms policies
CREATE POLICY "Anyone can view available rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'admin')
  );

-- Reservations policies
CREATE POLICY "Staff can view all reservations" ON reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create reservations" ON reservations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid()) AND
    staff_id = auth.uid()
  );

CREATE POLICY "Staff can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

-- Reservation rooms policies
CREATE POLICY "Staff can view reservation rooms" ON reservation_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

CREATE POLICY "Staff can manage reservation rooms" ON reservation_rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

-- Payments policies
CREATE POLICY "Staff can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Guests can create reviews" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Guests can update their reviews" ON reviews
  FOR UPDATE USING (true);

-- ==================== INSERT SAMPLE DATA ====================

-- Insert room types
INSERT INTO room_types (name, description, base_price, capacity, amenities, image_url) VALUES
('single', 'Cozy single room perfect for solo travelers', 80.00, 1, ARRAY['WiFi', 'TV', 'AC', 'Mini Fridge'], 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'),
('double', 'Spacious double room with comfortable amenities', 120.00, 2, ARRAY['WiFi', 'TV', 'AC', 'Mini Fridge', 'Coffee Maker'], 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'),
('suite', 'Luxury suite with separate living area', 200.00, 4, ARRAY['WiFi', 'TV', 'AC', 'Living Room', 'Kitchen', 'Balcony', 'Jacuzzi'], 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800'),
('deluxe', 'Deluxe room with premium amenities', 180.00, 3, ARRAY['WiFi', 'TV', 'AC', 'Mini Bar', 'Coffee Maker', 'Bathtub'], 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800');

-- Insert sample rooms
INSERT INTO rooms (room_number, room_type_id, price_per_night, capacity, description, amenities, image_url, status) VALUES
('101', 1, 2500, 1, 'Cozy single room with city view', ARRAY['WiFi', 'TV', 'AC', 'Mini Fridge'], 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 'available'),
('102', 1, 2500, 1, 'Comfortable single room', ARRAY['WiFi', 'TV', 'AC'], 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'available'),
('201', 2, 3800, 2, 'Spacious double room with queen bed', ARRAY['WiFi', 'TV', 'AC', 'Mini Fridge', 'Coffee Maker'], 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 'available'),
('202', 2, 3800, 2, 'Modern double room with balcony', ARRAY['WiFi', 'TV', 'AC', 'Balcony', 'Mini Fridge'], 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800', 'available'),
('203', 2, 5000, 2, 'Deluxe double room with ocean view', ARRAY['WiFi', 'TV', 'AC', 'Ocean View', 'Mini Fridge', 'Coffee Maker'], 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'available'),
('301', 3, 6500, 4, 'Luxury suite with separate living area', ARRAY['WiFi', 'TV', 'AC', 'Living Room', 'Kitchen', 'Balcony', 'Jacuzzi'], 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800', 'available'),
('302', 3, 8500, 4, 'Presidential suite with panoramic view', ARRAY['WiFi', 'TV', 'AC', 'Living Room', 'Kitchen', 'Balcony', 'Jacuzzi', 'City View'], 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'available'),
('401', 4, 4200, 3, 'Deluxe room with premium amenities', ARRAY['WiFi', 'TV', 'AC', 'Mini Bar', 'Coffee Maker', 'Bathtub'], 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', 'available'),
('402', 4, 4200, 3, 'Elegant deluxe room with modern design', ARRAY['WiFi', 'TV', 'AC', 'Mini Bar', 'Coffee Maker', 'Work Desk'], 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800', 'available'),
('501', 3, 15000, 4, 'Penthouse suite with rooftop access', ARRAY['WiFi', 'TV', 'AC', 'Living Room', 'Kitchen', 'Rooftop Access', 'Jacuzzi', 'Premium View'], 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'available');

-- ==================== SUCCESS MESSAGE ====================
SELECT 'Database schema created successfully!' AS status;
SELECT 'Tables created: guests, staff, room_types, rooms, reservations, reservation_rooms, payments, reviews' AS info;
SELECT 'Sample data: 4 room types, 10 rooms' AS sample_data;
SELECT 'Next step: Add yourself as staff using the staff table' AS next_step;
