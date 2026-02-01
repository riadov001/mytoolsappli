-- ================================================
-- EXPORT DE LA BASE DE DONNÉES DE DÉVELOPPEMENT
-- MyJantes - Script d'import pour la production
-- Date: 2025-10-07
-- ================================================

-- INSTRUCTIONS D'UTILISATION :
-- 1. Ouvrez le panneau "Database" dans Replit
-- 2. Basculez vers la base de données de PRODUCTION
-- 3. Copiez et exécutez ce script SQL complet
-- 4. Vérifiez que les données ont été importées correctement

-- ================================================
-- DÉSACTIVATION TEMPORAIRE DES CONTRAINTES
-- ================================================
SET session_replication_role = 'replica';

-- ================================================
-- OPTION: NETTOYAGE DES TABLES (décommenter si nécessaire)
-- ATTENTION: Ceci supprimera toutes les données existantes en production!
-- ================================================
-- TRUNCATE TABLE invoice_media CASCADE;
-- TRUNCATE TABLE quote_media CASCADE;
-- TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE reservations CASCADE;
-- TRUNCATE TABLE invoices CASCADE;
-- TRUNCATE TABLE quotes CASCADE;
-- TRUNCATE TABLE invoice_counters CASCADE;
-- TRUNCATE TABLE services CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- ================================================
-- INSERTION DES UTILISATEURS
-- ================================================
INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at)
VALUES 
  ('7tUrV9', '7tUrV9@example.com', 'John', 'Doe', NULL, 'client', '2025-10-07 00:43:05.148732', '2025-10-07 00:43:05.148732'),
  ('admin_01', 'admin@example.com', 'Admin', 'User', NULL, 'admin', '2025-10-07 00:43:34.297015', '2025-10-07 00:44:20.394'),
  ('a97b4784-1471-45bf-a65f-295980173c52', 'rbelmahi90@gmail.com', 'Admin', 'MyJantes', NULL, 'admin', '2025-10-07 01:44:13.581815', '2025-10-07 01:44:13.581815'),
  ('fc4bea9b-d90c-49c2-b60b-269de9216180', 'admin@myjantes.fr', 'Admin', 'MyJantes', NULL, 'admin', '2025-10-07 04:40:18.772217', '2025-10-07 04:40:18.772217'),
  ('48083309', 'jantesapp@gmail.com', 'Ja', 'App', NULL, 'admin', '2025-10-07 00:16:04.572957', '2025-10-07 04:41:05.631'),
  ('0bb0df19-efb7-474e-8d0d-1d071c95eb12', 'contact@myjantes.com', 'Ilyess', NULL, NULL, 'admin', '2025-10-07 04:41:38.422384', '2025-10-07 04:41:38.422384')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  profile_image_url = EXCLUDED.profile_image_url,
  role = EXCLUDED.role,
  updated_at = EXCLUDED.updated_at;

-- ================================================
-- INSERTION DES SERVICES
-- ================================================
INSERT INTO services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at)
VALUES 
  ('f4bbbab7-d92d-42e9-8ff7-fb3def86ce84', 'Ufud', 'Jdjdj', 120.00, 'Jdjdj', true, NULL, '2025-10-07 03:02:12.566709', '2025-10-07 04:13:50.559')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  custom_form_fields = EXCLUDED.custom_form_fields,
  updated_at = EXCLUDED.updated_at;

-- ================================================
-- INSERTION DES DEVIS
-- ================================================
INSERT INTO quotes (id, client_id, service_id, status, request_details, quote_amount, notes, valid_until, created_at, updated_at, payment_method, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details)
VALUES 
  ('2d71545e-89b8-4b50-828f-9b11ad643f1a', '7tUrV9', 'f4bbbab7-d92d-42e9-8ff7-fb3def86ce84', 'approved', '{"notes": "Hjjjj"}', '250.00', NULL, NULL, '2025-10-07 03:46:18.143508', '2025-10-07 03:46:27.776', 'cash', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  service_id = EXCLUDED.service_id,
  status = EXCLUDED.status,
  request_details = EXCLUDED.request_details,
  quote_amount = EXCLUDED.quote_amount,
  notes = EXCLUDED.notes,
  valid_until = EXCLUDED.valid_until,
  updated_at = EXCLUDED.updated_at,
  payment_method = EXCLUDED.payment_method,
  wheel_count = EXCLUDED.wheel_count,
  diameter = EXCLUDED.diameter,
  price_excluding_tax = EXCLUDED.price_excluding_tax,
  tax_rate = EXCLUDED.tax_rate,
  tax_amount = EXCLUDED.tax_amount,
  product_details = EXCLUDED.product_details;

-- ================================================
-- INSERTION DES FACTURES
-- ================================================
INSERT INTO invoices (id, quote_id, client_id, invoice_number, amount, status, due_date, paid_at, notes, created_at, updated_at, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details)
VALUES 
  ('2ed8ca58-009b-4205-b260-1964876dadaa', '2d71545e-89b8-4b50-828f-9b11ad643f1a', '7tUrV9', 'MY-INV-ESP00000001', '250.00', 'pending', '2025-10-15 00:00:00', NULL, 'Hdjdjd', '2025-10-07 04:14:15.84795', '2025-10-07 04:14:15.84795', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  quote_id = EXCLUDED.quote_id,
  client_id = EXCLUDED.client_id,
  invoice_number = EXCLUDED.invoice_number,
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  paid_at = EXCLUDED.paid_at,
  notes = EXCLUDED.notes,
  updated_at = EXCLUDED.updated_at,
  wheel_count = EXCLUDED.wheel_count,
  diameter = EXCLUDED.diameter,
  price_excluding_tax = EXCLUDED.price_excluding_tax,
  tax_rate = EXCLUDED.tax_rate,
  tax_amount = EXCLUDED.tax_amount,
  product_details = EXCLUDED.product_details;

-- ================================================
-- INSERTION DES RÉSERVATIONS
-- ================================================
-- (Aucune réservation dans les données actuelles)

-- ================================================
-- INSERTION DES NOTIFICATIONS
-- ================================================
INSERT INTO notifications (id, user_id, type, title, message, related_id, is_read, created_at)
VALUES 
  ('984d9d46-30a7-4448-8b5b-006faf9f2ba5', '7tUrV9', 'quote', 'Nouveau devis', 'Un devis a été créé pour vous', '2d71545e-89b8-4b50-828f-9b11ad643f1a', false, '2025-10-07 03:46:18.215271'),
  ('54c8c900-d90f-4563-ac36-d7f29c4018f1', '7tUrV9', 'quote', 'Quote Updated', 'Your quote has been approved', '2d71545e-89b8-4b50-828f-9b11ad643f1a', false, '2025-10-07 03:46:27.870613'),
  ('34d13cb4-d630-4625-ac8a-861cf903377f', '7tUrV9', 'invoice', 'New Invoice', 'A new invoice has been generated', '2ed8ca58-009b-4205-b260-1964876dadaa', false, '2025-10-07 04:14:15.911223')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  related_id = EXCLUDED.related_id,
  is_read = EXCLUDED.is_read,
  created_at = EXCLUDED.created_at;

-- ================================================
-- INSERTION DES MÉDIAS DE DEVIS
-- ================================================
-- (Aucun média de devis dans les données actuelles)

-- ================================================
-- INSERTION DES MÉDIAS DE FACTURES
-- ================================================
-- (Aucun média de facture dans les données actuelles)

-- ================================================
-- INSERTION DES COMPTEURS DE FACTURES
-- ================================================
INSERT INTO invoice_counters (id, payment_type, current_number, updated_at)
VALUES 
  ('99501f76-cfb9-404b-a225-48409780c9cb', 'cash', 1, '2025-10-07 04:14:15.781203')
ON CONFLICT (id) DO UPDATE SET
  payment_type = EXCLUDED.payment_type,
  current_number = EXCLUDED.current_number,
  updated_at = EXCLUDED.updated_at;

-- ================================================
-- RÉACTIVATION DES CONTRAINTES
-- ================================================
SET session_replication_role = 'origin';

-- ================================================
-- FIN DU SCRIPT
-- ================================================
-- Vérification : Comptez le nombre d'enregistrements importés
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'invoice_counters', COUNT(*) FROM invoice_counters;

-- ================================================
-- RÉSUMÉ :
-- - 6 utilisateurs
-- - 1 service
-- - 1 devis
-- - 1 facture
-- - 0 réservation
-- - 3 notifications
-- - 1 compteur de factures
-- ================================================
