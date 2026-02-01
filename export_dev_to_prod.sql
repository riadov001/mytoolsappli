-- ============================================
-- SCRIPT D'EXPORT DE LA BASE DE DÉVELOPPEMENT
-- Généré le: $(date)
-- ============================================
-- INSTRUCTIONS:
-- 1. Ouvrez le panneau "Database" dans Replit
-- 2. Sélectionnez votre base de données PRODUCTION
-- 3. Cliquez sur "Query" ou "Console"
-- 4. Copiez-collez ce script et exécutez-le
-- ============================================

-- Désactiver temporairement les contraintes de clé étrangère
SET session_replication_role = 'replica';

-- NETTOYER LES DONNÉES EXISTANTES (ATTENTION!)
-- Décommentez ces lignes si vous voulez supprimer les données existantes avant import
-- TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE reservations CASCADE;
-- TRUNCATE TABLE invoices CASCADE;
-- TRUNCATE TABLE quotes CASCADE;
-- TRUNCATE TABLE services CASCADE;
-- TRUNCATE TABLE users CASCADE;

