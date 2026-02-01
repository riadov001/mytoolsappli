--
-- PostgreSQL database dump
--

\restrict BhvhNW3rGq2wrsP9rMuKnROR889RVNvgRX5PT3x1wjTL4X14Vq4Wcp4bqleLbKL

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: application_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.application_settings (id, default_wheel_count, default_diameter, default_tax_rate, wheel_count_options, diameter_options, company_name, company_address, company_phone, company_email, company_siret, company_tva_number, created_at, updated_at) VALUES ('eca20b15-d45a-49b9-a0bc-3c1dc97eaf95', 4, '17', 20.00, '1,2,3,4', '14,15,16,17,18,19,20,21,22', 'MyJantes', NULL, NULL, NULL, NULL, NULL, '2025-12-04 01:14:59.468479', '2025-12-04 01:14:59.468479');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES ('85ed25d4-830b-46d8-bf5c-3d1a45b9d586', 'admin@myjantes.fr', '$2b$10$8DTue8bMAmGH584yZRdfFuGS0yBiH79UB3F1ZcAD.ekkVCLk4smMO', 'Admin', 'MyJantes', NULL, 'admin', NULL, NULL, NULL, NULL, '2025-12-03 17:58:20.561118', '2025-12-03 17:58:20.561118');
INSERT INTO public.users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES ('0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'client@myjantes.fr', NULL, 'Client', '1', NULL, 'client', NULL, NULL, NULL, NULL, '2025-12-03 18:01:54.319459', '2025-12-03 18:01:54.319459');
INSERT INTO public.users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES ('fae6504e-7c31-4de8-b566-95687a244f1f', 'employe@myjantes.fr', NULL, 'Employé ', '1', NULL, 'employe', NULL, NULL, NULL, NULL, '2025-12-03 18:02:19.515549', '2025-12-03 18:02:19.515549');
INSERT INTO public.users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES ('55d050bc-916c-4f97-aca5-52d83a1aaacd', 'admin2@myjantes.fr', NULL, 'Admin', '2', NULL, 'admin', NULL, NULL, NULL, NULL, '2025-12-03 18:02:37.403473', '2025-12-03 18:02:37.403473');
INSERT INTO public.users (id, email, password, first_name, last_name, profile_image_url, role, company_name, siret, tva_number, company_address, created_at, updated_at) VALUES ('56a27013-073c-4935-a12d-6955ed12166a', 'g@g.fr', NULL, 'G', 'F', NULL, 'client', NULL, NULL, NULL, NULL, '2025-12-03 20:57:04.691229', '2025-12-03 20:57:04.691229');


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, actor_name, summary, metadata, ip_address, user_agent, occurred_at) VALUES ('f2bed4f1-1f72-4a4e-89d0-c32835c9d7f9', 'invoice', '71e8d31a-1b87-4329-abfd-f287b5599fd5', 'updated', '85ed25d4-830b-46d8-bf5c-3d1a45b9d586', 'admin', 'admin@myjantes.fr', 'Facture mise à jour', NULL, '10.82.10.17', 'Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/142.0.7444.102 Mobile Safari/537.36 Replit-Bonsai/2.155.0 (Android 15)', '2025-12-04 02:29:22.433294');


--
-- Data for Name: audit_log_changes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.audit_log_changes (id, audit_log_id, field, previous_value, new_value) VALUES ('fdd2f0fe-8752-402a-86d5-f93680af3e5e', 'f2bed4f1-1f72-4a4e-89d0-c32835c9d7f9', 'updatedAt', '"2025-12-04T01:49:19.536Z"', '"2025-12-04T02:29:22.399Z"');


--
-- Data for Name: engagements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: invoice_counters; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoice_counters (id, payment_type, current_number, updated_at) VALUES ('ca245d6b-02dc-4d06-81c6-12add4c5f860', 'wire_transfer', 2, '2025-12-04 01:48:11.896');


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('43e9be0a-822e-4fc9-82f9-ae28acae05ef', 'Service 1', 'Service test 1 ', 100.00, 'Catégorie 1', true, NULL, '2025-12-03 18:04:06.428394', '2025-12-03 18:04:06.428394', NULL, NULL);
INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('969f0bf5-686c-4821-9526-11027158cb39', 'Réparation de jantes', 'Service complet de réparation de jantes endommagées', 80.00, 'jantes', true, NULL, '2025-12-04 01:58:18.494216', '2025-12-04 01:58:18.494216', 180, NULL);
INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('fb1561d6-67e7-4520-8ba5-72d2ccdc4a34', 'Peinture jantes', 'Peinture complète de jantes avec finition professionnelle', 70.00, 'jantes', true, NULL, '2025-12-04 01:58:18.807363', '2025-12-04 01:58:18.807363', 150, NULL);
INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('f5d3d3f2-1fb1-448e-be72-b7cc8e284d41', 'Personnalisation', 'Personnalisation sur mesure de vos jantes selon vos envies', 120.00, 'jantes', true, NULL, '2025-12-04 01:58:19.086279', '2025-12-04 01:58:19.086279', 240, NULL);
INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('c57d5e35-e138-4409-9d72-8fcd61cbbb6b', 'Débosselage / redressage', 'Redressage de jantes voilées ou déformées', 60.00, 'jantes', true, NULL, '2025-12-04 01:58:19.380645', '2025-12-04 01:58:19.380645', 90, NULL);
INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('d693af33-df69-4a49-bd56-0a29ed80255e', 'Dévoilage / équilibrage', 'Correction du voile et équilibrage dynamique', 50.00, 'jantes', true, NULL, '2025-12-04 01:58:19.594764', '2025-12-04 01:58:19.594764', 60, NULL);
INSERT INTO public.services (id, name, description, base_price, category, is_active, custom_form_fields, created_at, updated_at, estimated_duration, image_url) VALUES ('9dd83e63-6b1f-4f1d-816a-4513e12d013b', 'Nettoyage / polissage / rénovation esthétique', 'Rénovation esthétique complète de vos jantes', 40.00, 'jantes', true, NULL, '2025-12-04 01:58:19.772063', '2025-12-04 01:58:19.772063', 60, NULL);


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quotes (id, client_id, service_id, status, payment_method, request_details, quote_amount, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, notes, valid_until, created_at, updated_at) VALUES ('f13ed942-4d8a-4ae1-bda3-f5a752f7e222', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', '43e9be0a-822e-4fc9-82f9-ae28acae05ef', 'rejected', 'wire_transfer', NULL, 120.00, 4, '23', 100.00, 20.00, 20.00, '', '', NULL, '2025-12-04 01:47:44.999918', '2025-12-04 01:48:37.288');


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoices (id, quote_id, client_id, invoice_number, amount, payment_method, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, due_date, paid_at, notes, created_at, updated_at) VALUES ('71e8d31a-1b87-4329-abfd-f287b5599fd5', 'f13ed942-4d8a-4ae1-bda3-f5a752f7e222', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'VI-000002', 27.60, 'wire_transfer', 4, '23', 23.00, 20.00, 4.60, '', 'paid', '2026-01-03 00:00:00', NULL, '', '2025-12-04 01:48:11.91747', '2025-12-04 02:29:22.399');


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoice_items (id, invoice_id, description, quantity, unit_price_excluding_tax, total_excluding_tax, tax_rate, tax_amount, total_including_tax, created_at, updated_at) VALUES ('0d7a08f4-674e-4d3b-aac8-6b55841b5722', '71e8d31a-1b87-4329-abfd-f287b5599fd5', 'Bbbb', 1.00, 23.00, 23.00, 20.00, 4.60, 27.60, '2025-12-04 01:49:16.363903', '2025-12-04 01:49:16.363903');


--
-- Data for Name: invoice_media; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('4f94bcba-ffb3-41f1-b15e-0c47588cadad', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'reservation', 'Reservation Confirmed', 'Your reservation has been confirmed', '6bbbb612-a79f-4e07-9368-f186e9925cab', false, '2025-12-03 18:04:47.255081');
INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('0e4023f3-79f4-4df4-b3b9-1ef1e202f9a8', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'reservation', 'Réservation mise à jour', 'Votre réservation a été mise à jour - Statut: confirmed', '6bbbb612-a79f-4e07-9368-f186e9925cab', false, '2025-12-04 01:15:48.718978');
INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('6133164c-0076-48f5-a17d-0ae31868c833', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'quote', 'Nouveau devis', 'Un devis a été créé pour vous', 'f13ed942-4d8a-4ae1-bda3-f5a752f7e222', false, '2025-12-04 01:47:45.053684');
INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('e5b65fdc-f352-4448-85ef-46fe7385309a', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'quote', 'Quote Updated', 'Your quote has been approved', 'f13ed942-4d8a-4ae1-bda3-f5a752f7e222', false, '2025-12-04 01:47:52.669149');
INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('512e828f-9aed-4ab4-9a45-a05760e4e7c4', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'invoice', 'New Invoice', 'A new invoice has been generated', '71e8d31a-1b87-4329-abfd-f287b5599fd5', false, '2025-12-04 01:48:11.937333');
INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('1559e656-d77d-44b8-aa13-0cf757ab7e24', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'reservation', 'Reservation Confirmed', 'Your reservation has been confirmed', '0a5fa81c-d32f-4e82-aab7-e9cbb65c3c4c', false, '2025-12-04 01:48:29.463564');
INSERT INTO public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) VALUES ('100e6e8a-d873-4623-bc98-e79b24694c19', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', 'quote', 'Quote Updated', 'Your quote has been rejected', 'f13ed942-4d8a-4ae1-bda3-f5a752f7e222', false, '2025-12-04 01:48:37.31678');


--
-- Data for Name: quote_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quote_items (id, quote_id, description, quantity, unit_price_excluding_tax, total_excluding_tax, tax_rate, tax_amount, total_including_tax, created_at, updated_at) VALUES ('857d3b9a-23cc-47a1-a428-7acb0758e638', 'f13ed942-4d8a-4ae1-bda3-f5a752f7e222', 'Service 1', 1.00, 100.00, 100.00, 20.00, 20.00, 120.00, '2025-12-04 01:47:45.030722', '2025-12-04 01:47:45.030722');


--
-- Data for Name: quote_media; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reservations (id, quote_id, client_id, service_id, scheduled_date, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, notes, created_at, updated_at) VALUES ('6bbbb612-a79f-4e07-9368-f186e9925cab', NULL, '0ea5d567-005a-4ac6-bacb-57ccf60574fe', '43e9be0a-822e-4fc9-82f9-ae28acae05ef', '2025-12-03 19:04:00', 1, '23', 500.00, 20.00, 100.00, 'Détails ', 'confirmed', NULL, '2025-12-03 18:04:47.216517', '2025-12-04 01:15:48.689');
INSERT INTO public.reservations (id, quote_id, client_id, service_id, scheduled_date, wheel_count, diameter, price_excluding_tax, tax_rate, tax_amount, product_details, status, notes, created_at, updated_at) VALUES ('0a5fa81c-d32f-4e82-aab7-e9cbb65c3c4c', 'f13ed942-4d8a-4ae1-bda3-f5a752f7e222', '0ea5d567-005a-4ac6-bacb-57ccf60574fe', '43e9be0a-822e-4fc9-82f9-ae28acae05ef', '2025-12-11 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, 'confirmed', '', '2025-12-04 01:48:29.418636', '2025-12-04 01:48:29.418636');


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 'Workflow - Réparation de jantes', 'Étapes de travail pour Réparation de jantes', '2025-12-04 01:58:18.534169', '2025-12-04 01:58:18.534169', '969f0bf5-686c-4821-9526-11027158cb39');
INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('a329a3e1-440e-4a07-898e-ce7dc50ac906', 'Workflow - Peinture jantes', 'Étapes de travail pour Peinture jantes', '2025-12-04 01:58:18.842487', '2025-12-04 01:58:18.842487', 'fb1561d6-67e7-4520-8ba5-72d2ccdc4a34');
INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('4b86de52-479a-4360-a8be-38e917c3df51', 'Workflow - Personnalisation', 'Étapes de travail pour Personnalisation', '2025-12-04 01:58:19.122584', '2025-12-04 01:58:19.122584', 'f5d3d3f2-1fb1-448e-be72-b7cc8e284d41');
INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('6aa8f053-7a4b-4e35-8729-ad2398d1400e', 'Workflow - Débosselage / redressage', 'Étapes de travail pour Débosselage / redressage', '2025-12-04 01:58:19.416617', '2025-12-04 01:58:19.416617', 'c57d5e35-e138-4409-9d72-8fcd61cbbb6b');
INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 'Workflow - Dévoilage / équilibrage', 'Étapes de travail pour Dévoilage / équilibrage', '2025-12-04 01:58:19.630593', '2025-12-04 01:58:19.630593', 'd693af33-df69-4a49-bd56-0a29ed80255e');
INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('4d4fb7e1-e06f-49d3-a041-b126747984d6', 'Workflow - Nettoyage / polissage / rénovation esthétique', 'Étapes de travail pour Nettoyage / polissage / rénovation esthétique', '2025-12-04 01:58:19.805749', '2025-12-04 01:58:19.805749', '9dd83e63-6b1f-4f1d-816a-4513e12d013b');
INSERT INTO public.workflows (id, name, description, created_at, updated_at, service_id) VALUES ('28eb0b96-7400-4e54-b128-6fb1d26e786d', 'Workflow - Service 1', 'Workflow pour le service Service 1', '2025-12-04 02:15:57.408008', '2025-12-04 02:15:57.408008', '43e9be0a-822e-4fc9-82f9-ae28acae05ef');


--
-- Data for Name: service_workflows; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sessions (sid, sess, expire) VALUES ('Ygc8ysNgUXEi1dHmcZXUr55_EM5ZBUuD', '{"cookie": {"path": "/", "secure": false, "expires": "2025-12-10T17:59:28.492Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "85ed25d4-830b-46d8-bf5c-3d1a45b9d586"}}', '2025-12-11 02:34:38');
INSERT INTO public.sessions (sid, sess, expire) VALUES ('xET6O8q5NBaE9TlMflZTNvn6nLaq6BtA', '{"cookie": {"path": "/", "secure": false, "expires": "2025-12-11T01:41:07.148Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "85ed25d4-830b-46d8-bf5c-3d1a45b9d586"}}', '2025-12-11 01:41:36');


--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('adfb230e-dfd6-41b9-abc6-5a80d858e29b', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 1, 'Réception du véhicule / jante', 'Réception du véhicule / jante', '2025-12-04 01:58:18.55558', '2025-12-04 01:58:18.55558');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('5c100267-565a-49e6-9350-1f2528a9ff78', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 2, 'Diagnostic visuel et technique', 'Diagnostic visuel et technique', '2025-12-04 01:58:18.577502', '2025-12-04 01:58:18.577502');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('6477f182-9086-44be-beca-bbd300f0010c', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 3, 'Démontage du pneu', 'Démontage du pneu', '2025-12-04 01:58:18.595311', '2025-12-04 01:58:18.595311');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('7e296797-c97c-48ea-9dc1-20ce2e1ec812', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 4, 'Redressage / débosselage', 'Redressage / débosselage', '2025-12-04 01:58:18.611688', '2025-12-04 01:58:18.611688');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('384a6a2a-f682-47c9-ae2c-64f017317299', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 5, 'Soudure (si fissure)', 'Soudure (si fissure)', '2025-12-04 01:58:18.629719', '2025-12-04 01:58:18.629719');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('2b583aa3-0398-4385-b43d-522f59d98e17', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 6, 'Ponçage et mise à niveau', 'Ponçage et mise à niveau', '2025-12-04 01:58:18.647639', '2025-12-04 01:58:18.647639');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('30402d2c-3780-42b8-a9a3-4ef4403cc173', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 7, 'Préparation peinture / apprêt', 'Préparation peinture / apprêt', '2025-12-04 01:58:18.664768', '2025-12-04 01:58:18.664768');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('ecfdac2b-fa59-4bee-9a2c-8c73d5d61563', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 8, 'Peinture ou poudre epoxy', 'Peinture ou poudre epoxy', '2025-12-04 01:58:18.682106', '2025-12-04 01:58:18.682106');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('608db2ed-84ee-4d50-89fe-02987c16a4ef', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 9, 'Cuisson / séchage', 'Cuisson / séchage', '2025-12-04 01:58:18.699777', '2025-12-04 01:58:18.699777');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('356739ce-567d-4da4-b887-288551afff6c', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 10, 'Remontage du pneu', 'Remontage du pneu', '2025-12-04 01:58:18.717121', '2025-12-04 01:58:18.717121');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('bb4f6d67-30b7-459a-b447-efc7537a58df', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 11, 'Équilibrage', 'Équilibrage', '2025-12-04 01:58:18.733738', '2025-12-04 01:58:18.733738');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('5c2cb160-2b6d-451b-808e-49211bfbe5f0', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 12, 'Contrôle qualité final', 'Contrôle qualité final', '2025-12-04 01:58:18.751688', '2025-12-04 01:58:18.751688');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('f63fd107-99ee-4439-9540-992980c572ee', '4cad675d-a5fe-41f5-a79e-482c8cc22ec2', 13, 'Livraison au client', 'Livraison au client', '2025-12-04 01:58:18.769106', '2025-12-04 01:58:18.769106');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('475bca70-a52a-4944-84d4-1743c77d6ff4', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 1, 'Réception et inspection', 'Réception et inspection', '2025-12-04 01:58:18.860824', '2025-12-04 01:58:18.860824');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('a07f435c-19a3-4774-8120-8295a7385fe4', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 2, 'Démontage du pneu', 'Démontage du pneu', '2025-12-04 01:58:18.878725', '2025-12-04 01:58:18.878725');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('c3da809a-4132-42c4-a855-7529a558093b', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 3, 'Décapage complet', 'Décapage complet', '2025-12-04 01:58:18.896739', '2025-12-04 01:58:18.896739');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('b176c968-2933-46af-9349-c1e9cf8ad0ab', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 4, 'Sablage / microbillage', 'Sablage / microbillage', '2025-12-04 01:58:18.913642', '2025-12-04 01:58:18.913642');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('4323acb1-2021-433e-aeca-47cfe1cfafae', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 5, 'Préparation et apprêt', 'Préparation et apprêt', '2025-12-04 01:58:18.931162', '2025-12-04 01:58:18.931162');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('93c3d196-f8c7-48a2-bab3-3b7a0d7bb2d5', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 6, 'Application couleur / couches', 'Application couleur / couches', '2025-12-04 01:58:18.948928', '2025-12-04 01:58:18.948928');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('d4741197-1444-43a5-89da-591b8ee1e725', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 7, 'Application vernis', 'Application vernis', '2025-12-04 01:58:18.966516', '2025-12-04 01:58:18.966516');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('e44b4a4b-30e8-4936-9c92-b92ec4627249', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 8, 'Cuisson / séchage', 'Cuisson / séchage', '2025-12-04 01:58:18.984182', '2025-12-04 01:58:18.984182');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('a8225284-efc3-43bc-b5c4-525851f65f05', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 9, 'Contrôle qualité couleur/vernis', 'Contrôle qualité couleur/vernis', '2025-12-04 01:58:19.001548', '2025-12-04 01:58:19.001548');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('54a122e3-6a1f-4a99-9f60-9d5eaba1cf44', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 10, 'Remontage + équilibrage', 'Remontage + équilibrage', '2025-12-04 01:58:19.018891', '2025-12-04 01:58:19.018891');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('d9ed884a-075a-4566-8f6a-80ff09c7daeb', 'a329a3e1-440e-4a07-898e-ce7dc50ac906', 11, 'Livraison', 'Livraison', '2025-12-04 01:58:19.043422', '2025-12-04 01:58:19.043422');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('301d25f8-40c6-4abc-91d2-8b02ac6b9941', '4b86de52-479a-4360-a8be-38e917c3df51', 1, 'Brief client / choix du design', 'Brief client / choix du design', '2025-12-04 01:58:19.139773', '2025-12-04 01:58:19.139773');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('37393049-cfce-441b-8197-8d9813a0eeae', '4b86de52-479a-4360-a8be-38e917c3df51', 2, 'Création du modèle numérique (mockup)', 'Création du modèle numérique (mockup)', '2025-12-04 01:58:19.157031', '2025-12-04 01:58:19.157031');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('254b1f5f-82ec-4dc9-9fbb-f4dd10e120d2', '4b86de52-479a-4360-a8be-38e917c3df51', 3, 'Validation client du design', 'Validation client du design', '2025-12-04 01:58:19.174611', '2025-12-04 01:58:19.174611');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('59bcdb7b-ba8c-431f-86e6-a23c8be348d5', '4b86de52-479a-4360-a8be-38e917c3df51', 4, 'Démontage / nettoyage', 'Démontage / nettoyage', '2025-12-04 01:58:19.19341', '2025-12-04 01:58:19.19341');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('9727d15a-be6c-4f39-9ee4-98c208423989', '4b86de52-479a-4360-a8be-38e917c3df51', 5, 'Décapage complet', 'Décapage complet', '2025-12-04 01:58:19.222871', '2025-12-04 01:58:19.222871');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('10337892-2ad0-47c8-8dc5-5c5faa2c31c9', '4b86de52-479a-4360-a8be-38e917c3df51', 6, 'Masquage précis (zones à protéger)', 'Masquage précis (zones à protéger)', '2025-12-04 01:58:19.24171', '2025-12-04 01:58:19.24171');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('82e0f33d-135c-43c4-bcab-d1c04876e2cf', '4b86de52-479a-4360-a8be-38e917c3df51', 7, 'Peinture base', 'Peinture base', '2025-12-04 01:58:19.259225', '2025-12-04 01:58:19.259225');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('bcf82c72-5f62-4a34-8156-a65f9680f0b6', '4b86de52-479a-4360-a8be-38e917c3df51', 8, 'Peinture secondaire / motifs', 'Peinture secondaire / motifs', '2025-12-04 01:58:19.276085', '2025-12-04 01:58:19.276085');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('b5d924d9-995d-4495-b7eb-68f3cc3903ce', '4b86de52-479a-4360-a8be-38e917c3df51', 9, 'Finition et vernis', 'Finition et vernis', '2025-12-04 01:58:19.293511', '2025-12-04 01:58:19.293511');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('d09698ac-5eff-4ac5-813e-c55484fc3d8a', '4b86de52-479a-4360-a8be-38e917c3df51', 10, 'Séchage / cuisson', 'Séchage / cuisson', '2025-12-04 01:58:19.31109', '2025-12-04 01:58:19.31109');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('ca63b2ff-0302-4b1e-9784-f8218759cec2', '4b86de52-479a-4360-a8be-38e917c3df51', 11, 'Contrôle qualité esthétique', 'Contrôle qualité esthétique', '2025-12-04 01:58:19.328641', '2025-12-04 01:58:19.328641');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('376b78f5-1cdc-4ac1-b0e6-b432f76028c1', '4b86de52-479a-4360-a8be-38e917c3df51', 12, 'Livraison', 'Livraison', '2025-12-04 01:58:19.34622', '2025-12-04 01:58:19.34622');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('b771de94-7082-4d3f-a552-0af6ab06902a', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 1, 'Inspection et diagnostic', 'Inspection et diagnostic', '2025-12-04 01:58:19.436287', '2025-12-04 01:58:19.436287');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('84e9ef01-5bf9-46aa-a16f-c277e2ff2a8d', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 2, 'Mesure du voile / déformation', 'Mesure du voile / déformation', '2025-12-04 01:58:19.454119', '2025-12-04 01:58:19.454119');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('ad5dcc12-476d-4b36-98d5-012d56768bcb', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 3, 'Montage sur machine de redressage', 'Montage sur machine de redressage', '2025-12-04 01:58:19.471598', '2025-12-04 01:58:19.471598');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('d240beec-77e8-42fd-b9d5-9b6503fcd6d8', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 4, 'Redressage progressif', 'Redressage progressif', '2025-12-04 01:58:19.489193', '2025-12-04 01:58:19.489193');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('2fa9ef78-9354-4ed0-a13c-f20862c54e4a', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 5, 'Contrôle du voile', 'Contrôle du voile', '2025-12-04 01:58:19.507199', '2025-12-04 01:58:19.507199');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('acf726f4-366c-4d96-9397-e3845b7ea319', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 6, 'Ponçage léger si nécessaire', 'Ponçage léger si nécessaire', '2025-12-04 01:58:19.524898', '2025-12-04 01:58:19.524898');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('75af2162-f7ab-41ca-aa20-fe5abbd13c32', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 7, 'Contrôle final', 'Contrôle final', '2025-12-04 01:58:19.542143', '2025-12-04 01:58:19.542143');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('6f1a9400-cfff-4a3e-b13a-51f0dd32d98d', '6aa8f053-7a4b-4e35-8729-ad2398d1400e', 8, 'Livraison', 'Livraison', '2025-12-04 01:58:19.559682', '2025-12-04 01:58:19.559682');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('2efa5846-0caa-4964-8741-340918233ca6', 'c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 1, 'Diagnostic de vibrations / test', 'Diagnostic de vibrations / test', '2025-12-04 01:58:19.649604', '2025-12-04 01:58:19.649604');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('e8927d76-48d0-41f5-9eb6-99608832036e', 'c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 2, 'Mesure du voile', 'Mesure du voile', '2025-12-04 01:58:19.667283', '2025-12-04 01:58:19.667283');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('986dcdf4-b2b4-4d18-b76d-8065134f1cea', 'c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 3, 'Ajustement / dévoilage', 'Ajustement / dévoilage', '2025-12-04 01:58:19.683733', '2025-12-04 01:58:19.683733');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('410cdad5-3e13-4285-9149-931e9e9b75b7', 'c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 4, 'Équilibrage dynamique', 'Équilibrage dynamique', '2025-12-04 01:58:19.704129', '2025-12-04 01:58:19.704129');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('7341fb3c-0208-4af3-9bd6-bad8872013c0', 'c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 5, 'Contrôle final', 'Contrôle final', '2025-12-04 01:58:19.721647', '2025-12-04 01:58:19.721647');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('d3aea26a-d47a-49f0-99cb-b85168154fd7', 'c2a90e83-c9e3-4e30-86a8-865ffb7966ee', 6, 'Restitution', 'Restitution', '2025-12-04 01:58:19.73759', '2025-12-04 01:58:19.73759');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('fb756422-eccb-48d6-8d3c-7f979f2687d6', '4d4fb7e1-e06f-49d3-a041-b126747984d6', 1, 'Nettoyage chimique', 'Nettoyage chimique', '2025-12-04 01:58:19.823748', '2025-12-04 01:58:19.823748');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('b7649951-b3ac-4383-9a02-90adeb9ef3ec', '4d4fb7e1-e06f-49d3-a041-b126747984d6', 2, 'Décontamination', 'Décontamination', '2025-12-04 01:58:19.841589', '2025-12-04 01:58:19.841589');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('b1a13bf6-5171-4485-a2db-a3be996dfbec', '4d4fb7e1-e06f-49d3-a041-b126747984d6', 3, 'Polissage mécanique', 'Polissage mécanique', '2025-12-04 01:58:19.859271', '2025-12-04 01:58:19.859271');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('15f951c6-b126-48ca-a7cb-1bced59f2800', '4d4fb7e1-e06f-49d3-a041-b126747984d6', 4, 'Traitement / protection', 'Traitement / protection', '2025-12-04 01:58:19.876405', '2025-12-04 01:58:19.876405');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('81519600-b45c-4470-9824-37f845f20a57', '4d4fb7e1-e06f-49d3-a041-b126747984d6', 5, 'Contrôle brillance', 'Contrôle brillance', '2025-12-04 01:58:19.892669', '2025-12-04 01:58:19.892669');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('783b819a-b850-4ece-baff-64e1f5734239', '4d4fb7e1-e06f-49d3-a041-b126747984d6', 6, 'Livraison', 'Livraison', '2025-12-04 01:58:19.91005', '2025-12-04 01:58:19.91005');
INSERT INTO public.workflow_steps (id, workflow_id, step_number, title, description, created_at, updated_at) VALUES ('37fc88da-2de8-4398-ab10-a80abc686e40', '28eb0b96-7400-4e54-b128-6fb1d26e786d', 1, 'Tgh', '', '2025-12-04 02:27:33.95701', '2025-12-04 02:27:33.95701');


--
-- Data for Name: workshop_tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict BhvhNW3rGq2wrsP9rMuKnROR889RVNvgRX5PT3x1wjTL4X14Vq4Wcp4bqleLbKL

