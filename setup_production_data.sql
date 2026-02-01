-- ============================================
-- SCRIPT DE CRÉATION DES DONNÉES DE PRODUCTION
-- MyJantes - Base de données de production
-- Date: 2025-10-24
-- ============================================
-- 
-- INSTRUCTIONS POUR EXÉCUTER EN PRODUCTION:
-- 1. Ouvrez le panneau "Database" dans Replit
-- 2. Sélectionnez votre base de données PRODUCTION
-- 3. Cliquez sur "Query" ou "Console SQL"
-- 4. Copiez-collez ce script complet
-- 5. Exécutez-le
-- 
-- ⚠️  ATTENTION: Ce script va créer des données de test.
-- Si vous avez déjà des données, utilisez ON CONFLICT pour éviter les doublons.
-- ============================================

-- Désactiver temporairement les contraintes
SET session_replication_role = 'replica';

-- ============================================
-- 1. UTILISATEURS ADMINISTRATEURS
-- ============================================
-- Mot de passe pour tous les admins: admin123
-- Hash bcrypt de "admin123": $2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa

-- Admin principal
INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('fc4bea9b-d90c-49c2-b60b-269de9216180', 'admin@myjantes.fr', '$2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa', 'Admin', 'MyJantes', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  password = EXCLUDED.password,
  updated_at = NOW();

-- Administrateur secondaire
INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('9d72d8a3-8216-4e3b-8208-7b165162ea8e', 'administrateur@myjantes.fr', '$2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa', 'Riad', 'Belmahi', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  password = EXCLUDED.password,
  updated_at = NOW();

-- ============================================
-- 2. CLIENTS EXEMPLES
-- ============================================

INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('client-001', 'jean.dupont@email.fr', '$2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa', 'Jean', 'Dupont', 'client', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('client-002', 'marie.martin@email.fr', '$2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa', 'Marie', 'Martin', 'client', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('client-003', 'pierre.bernard@email.fr', '$2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa', 'Pierre', 'Bernard', 'client', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('client-004', 'sophie.leclerc@email.fr', '$2b$10$Tqe1Auf1Y.Bd4BHAGXxefOu.t.kM1F/AIgNijEYjV9DmAn6auy0pa', 'Sophie', 'Leclerc', 'client', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. SERVICES
-- ============================================

INSERT INTO services (id, name, description, base_price, category, is_active, created_at, updated_at) VALUES
('service-001', 'Montage de jantes', 'Montage et équilibrage de jantes complètes', 80.00, 'Montage', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO services (id, name, description, base_price, category, is_active, created_at, updated_at) VALUES
('service-002', 'Stockage de jantes', 'Stockage saisonnier de vos jantes (hiver/été)', 120.00, 'Stockage', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO services (id, name, description, base_price, category, is_active, created_at, updated_at) VALUES
('service-003', 'Réparation de jantes', 'Réparation de jantes en alliage (rayures, impacts)', 150.00, 'Réparation', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO services (id, name, description, base_price, category, is_active, created_at, updated_at) VALUES
('service-004', 'Customisation', 'Peinture et personnalisation de jantes', 250.00, 'Customisation', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- 4. DEVIS EXEMPLES
-- ============================================

-- Devis approuvé pour Jean Dupont
INSERT INTO quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES
('quote-001', 'client-001', 'service-001', 'approved', 'cash', '{"message": "Montage jantes été 17 pouces"}'::jsonb, 320.00, 4, '17"', 266.67, 20.00, 53.33, 'Jantes alliage 17" avec pneus été Michelin', 'Client régulier - Priorité haute', NOW() + INTERVAL '30 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  quote_amount = EXCLUDED.quote_amount,
  updated_at = NOW();

-- Devis en attente pour Marie Martin
INSERT INTO quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES
('quote-002', 'client-002', 'service-002', 'pending', 'other', '{"message": "Stockage jantes hiver jusqu''à avril"}'::jsonb, NULL, 4, '18"', NULL, NULL, NULL, 'Jantes hiver BMW 18"', NULL, NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Devis approuvé pour Pierre Bernard
INSERT INTO quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES
('quote-003', 'client-003', 'service-003', 'approved', 'cash', '{"message": "Réparation rayure profonde jante avant gauche"}'::jsonb, 180.00, 1, '19"', 150.00, 20.00, 30.00, 'Jante alliage Audi 19" - Réparation impact', 'Réparation urgente demandée', NOW() + INTERVAL '30 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  quote_amount = EXCLUDED.quote_amount,
  updated_at = NOW();

-- Devis approuvé pour Sophie Leclerc
INSERT INTO quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES
('quote-004', 'client-004', 'service-004', 'approved', 'other', '{"message": "Customisation jantes noir mat avec liseré rouge"}'::jsonb, 600.00, 4, '20"', 500.00, 20.00, 100.00, 'Jantes Mercedes 20" - Peinture noir mat + liseré rouge', 'Delai: 2 semaines', NOW() + INTERVAL '30 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  quote_amount = EXCLUDED.quote_amount,
  updated_at = NOW();

-- ============================================
-- 5. FACTURES EXEMPLES
-- ============================================

-- Facture payée pour Jean Dupont (devis quote-001)
INSERT INTO invoices (id, quote_id, client_id, invoice_number, amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, due_date, paid_at, notes, created_at, updated_at) VALUES
('invoice-001', 'quote-001', 'client-001', 'MYJ-2025-001', 320.00, 4, '17"', 266.67, 20.00, 53.33, 'Jantes alliage 17" avec pneus été Michelin', 'paid', NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 days', 'Paiement reçu par virement bancaire', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  paid_at = EXCLUDED.paid_at,
  updated_at = NOW();

-- Facture en attente pour Pierre Bernard (devis quote-003)
INSERT INTO invoices (id, quote_id, client_id, invoice_number, amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, due_date, paid_at, notes, created_at, updated_at) VALUES
('invoice-002', 'quote-003', 'client-003', 'MYJ-2025-002', 180.00, 1, '19"', 150.00, 20.00, 30.00, 'Jante alliage Audi 19" - Réparation impact', 'pending', NOW() + INTERVAL '30 days', NULL, 'En attente de paiement', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  updated_at = NOW();

-- Facture en attente pour Sophie Leclerc (devis quote-004)
INSERT INTO invoices (id, quote_id, client_id, invoice_number, amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, due_date, paid_at, notes, created_at, updated_at) VALUES
('invoice-003', 'quote-004', 'client-004', 'MYJ-2025-003', 600.00, 4, '20"', 500.00, 20.00, 100.00, 'Jantes Mercedes 20" - Peinture noir mat + liseré rouge', 'pending', NOW() + INTERVAL '45 days', NULL, 'Acompte de 200€ reçu', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- 6. RÉSERVATIONS EXEMPLES
-- ============================================

-- Réservation confirmée pour Jean Dupont
INSERT INTO reservations (id, quote_id, client_id, service_id, scheduled_date, status, notes, created_at, updated_at) VALUES
('reservation-001', 'quote-001', 'client-001', 'service-001', NOW() + INTERVAL '3 days', 'confirmed', 'Rendez-vous à 10h00 - Durée estimée: 2h', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  scheduled_date = EXCLUDED.scheduled_date,
  updated_at = NOW();

-- Réservation en attente pour Marie Martin
INSERT INTO reservations (id, quote_id, client_id, service_id, scheduled_date, status, notes, created_at, updated_at) VALUES
('reservation-002', 'quote-002', 'client-002', 'service-002', NOW() + INTERVAL '7 days', 'pending', 'En attente de confirmation du client', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Réservation complétée pour Pierre Bernard
INSERT INTO reservations (id, quote_id, client_id, service_id, scheduled_date, status, notes, created_at, updated_at) VALUES
('reservation-003', 'quote-003', 'client-003', 'service-003', NOW() - INTERVAL '2 days', 'completed', 'Travail terminé - Client satisfait', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- 7. NOTIFICATIONS EXEMPLES
-- ============================================

INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES
('notif-001', 'fc4bea9b-d90c-49c2-b60b-269de9216180', 'info', 'Nouveau devis reçu', 'Un nouveau devis a été soumis par Marie Martin pour un stockage de jantes', false, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES
('notif-002', 'fc4bea9b-d90c-49c2-b60b-269de9216180', 'success', 'Paiement reçu', 'Facture MYJ-2025-001 payée par Jean Dupont (320.00€)', true, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES
('notif-003', 'client-001', 'success', 'Réservation confirmée', 'Votre rendez-vous pour le montage de jantes est confirmé pour le ' || TO_CHAR(NOW() + INTERVAL '3 days', 'DD/MM/YYYY') || ' à 10h00', false, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES
('notif-004', 'client-003', 'warning', 'Facture en attente', 'Votre facture MYJ-2025-002 (180.00€) est en attente de paiement. Échéance: ' || TO_CHAR(NOW() + INTERVAL '30 days', 'DD/MM/YYYY'), false, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- ============================================
-- ✅ CRÉATION DES DONNÉES TERMINÉE
-- ============================================
-- 
-- RÉCAPITULATIF:
-- ✓ 2 comptes administrateurs créés
--   - admin@myjantes.fr (mot de passe: admin123)
--   - administrateur@myjantes.fr (mot de passe: admin123)
-- 
-- ✓ 4 clients exemples créés
-- ✓ 4 services créés (Montage, Stockage, Réparation, Customisation)
-- ✓ 4 devis créés (3 approuvés, 1 en attente)
-- ✓ 3 factures créées (1 payée, 2 en attente)
-- ✓ 3 réservations créées (1 confirmée, 1 en attente, 1 complétée)
-- ✓ 4 notifications créées
-- 
-- Vous pouvez maintenant vous connecter avec:
-- Email: admin@myjantes.fr
-- Mot de passe: admin123
-- ============================================
