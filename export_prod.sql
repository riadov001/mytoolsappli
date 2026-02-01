-- ============================================
-- SCRIPT D'EXPORT VERS PRODUCTION
-- Généré le: 2025-10-24
-- ============================================
-- INSTRUCTIONS:
-- 1. Ouvrez le panneau "Database" dans Replit
-- 2. Sélectionnez votre base de données PRODUCTION
-- 3. Cliquez sur "Query" ou "Console"
-- 4. Copiez-collez ce script et exécutez-le
-- 
-- ⚠️  IMPORTANT - SÉCURITÉ:
-- Les mots de passe ne sont PAS inclus dans cet export.
-- Après l'import, exécutez: npm run setup-admins
-- pour recréer les comptes admin@myjantes.fr et administrateur@myjantes.fr
-- ============================================

-- Désactiver temporairement les contraintes
SET session_replication_role = 'replica';

-- ============================================
-- UTILISATEURS (sans mots de passe pour sécurité)
-- ============================================

-- Compte admin principal
INSERT INTO users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES
('fc4bea9b-d90c-49c2-b60b-269de9216180', 'admin@myjantes.fr', NULL, 'Admin', 'MyJantes', NULL, 'admin', NULL, NULL, NULL, NULL, '2025-10-07 04:40:18.772217', '2025-10-07 04:40:18.772217')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- Compte administrateur secondaire
INSERT INTO users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES
('9d72d8a3-8216-4e3b-8208-7b165162ea8e', 'administrateur@myjantes.fr', NULL, 'Riad', 'Belmahi', NULL, 'admin', NULL, NULL, NULL, NULL, '2025-10-14 23:04:42.795219', '2025-10-14 23:07:13.899')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- Autres utilisateurs (exemple de client test)
INSERT INTO users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES
('7tUrV9', '7tUrV9@example.com', NULL, 'John', 'Doe', NULL, 'client', NULL, NULL, NULL, NULL, '2025-10-07 00:43:05.148732', '2025-10-07 00:43:05.148732')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- ============================================
-- SERVICES
-- ============================================

INSERT INTO services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at) VALUES
('f4bbbab7-d92d-42e9-8ff7-fb3def86ce84', 'Ufud', 'Jdjdj', 120.00, 'Jdjdj', true, NULL, '2025-10-07 03:02:12.566709', '2025-10-07 04:13:50.559')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;

-- ============================================
-- DEVIS
-- ============================================

INSERT INTO quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES
('2d71545e-89b8-4b50-828f-9b11ad643f1a', '7tUrV9', 'f4bbbab7-d92d-42e9-8ff7-fb3def86ce84', 'approved', 'cash', '{"notes": "Hjjjj"}'::jsonb, 250.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 03:46:18.143508', '2025-10-07 03:46:27.776')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  quote_amount = EXCLUDED.quote_amount,
  notes = EXCLUDED.notes;

INSERT INTO quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES
('ea12ee94-26ea-4d75-9e11-e9944011bb61', '9d72d8a3-8216-4e3b-8208-7b165162ea8e', 'f4bbbab7-d92d-42e9-8ff7-fb3def86ce84', 'approved', 'cash', '{"message": "Jsjsns"}'::jsonb, 125.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Fddd', NULL, '2025-10-14 23:05:19.59742', '2025-10-24 16:03:28.122')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  quote_amount = EXCLUDED.quote_amount,
  notes = EXCLUDED.notes;

-- ============================================
-- FACTURES
-- ============================================

INSERT INTO invoices (id, quote_id, client_id, invoice_number, amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, due_date, paid_at, notes, created_at, updated_at) VALUES
('2ed8ca58-009b-4205-b260-1964876dadaa', '2d71545e-89b8-4b50-828f-9b11ad643f1a', '7tUrV9', 'MY-INV-ESP00000001', 250.00, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', '2025-10-15 00:00:00', NULL, 'Hdjdjd', '2025-10-07 04:14:15.84795', '2025-10-07 04:14:15.84795')
ON CONFLICT (id) DO UPDATE SET 
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  notes = EXCLUDED.notes;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- ============================================
-- ✅ IMPORT TERMINÉ
-- ============================================
-- PROCHAINE ÉTAPE OBLIGATOIRE:
-- Exécutez cette commande pour créer les mots de passe admin:
--   npm run setup-admins
--
-- Cela créera les comptes avec le mot de passe: admin123
-- - admin@myjantes.fr
-- - administrateur@myjantes.fr
-- ============================================
