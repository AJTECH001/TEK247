-- migrate:up

-- =====================
-- USERS
-- 2 admins, 8 regular users
-- =====================
INSERT INTO users (id, full_name, email, password_hash, role) VALUES
(1, 'Admin One',        'admin1@ajtech.com',       'hashed_admin_password_1',  'admin'),
(2, 'Admin Two',        'admin2@ajtech.com',       'hashed_admin_password_2',  'admin'),
(3, 'John Doe',         'john.doe@email.com',      'hashed_password_3',        'user'),
(4, 'Sarah Williams',   'sarah.williams@email.com','hashed_password_4',        'user'),
(5, 'Mike Johnson',     'mike.johnson@email.com',  'hashed_password_5',        'user'),
(6, 'Emily Davis',      'emily.davis@email.com',   'hashed_password_6',        'user'),
(7, 'David Brown',      'david.brown@email.com',   'hashed_password_7',        'user'),
(8, 'Lisa Martinez',    'lisa.martinez@email.com', 'hashed_password_8',        'user'),
(9, 'James Anderson',   'james.anderson@email.com','hashed_password_9',        'user'),
(10,'Olivia Taylor',    'olivia.taylor@email.com', 'hashed_password_10',       'user');

-- =====================
-- SPEC CATEGORIES
-- 7 main categories
-- =====================
INSERT INTO spec_categories (id, name, description) VALUES
(1, 'Processor',     'The brain of the laptop, heavily influences performance'),
(2, 'RAM',           'Determines how many tasks the laptop can handle simultaneously'),
(3, 'Storage',       'Type and capacity affect boot times and program load speeds'),
(4, 'GPU',           'Processes visuals, either integrated or dedicated'),
(5, 'Display',       'Screen resolution and panel type'),
(6, 'Screen Size',   'Physical size of the display in inches'),
(7, 'Battery Life',  'How long the laptop lasts on a single charge');

-- =====================
-- SPEC OPTIONS
-- Options under each category
-- Category 1: Processor (options 1-6)
-- Category 2: RAM (options 7-10)
-- Category 3: Storage (options 11-15)
-- Category 4: GPU (options 16-20)
-- Category 5: Display (options 21-25)
-- Category 6: Screen Size (options 26-29)
-- Category 7: Battery Life (options 30-33)
-- =====================
INSERT INTO spec_options (id, category_id, name, description) VALUES
-- Processor options
(1,  1, 'Intel Core i3',      'Good for casual use, web browsing and basic office tasks'),
(2,  1, 'Intel Core i5',      'Sweet spot for multitasking and general productivity'),
(3,  1, 'Intel Core i7',      'Powerful for demanding tasks like video editing'),
(4,  1, 'Intel Core i9',      'Top tier for 3D rendering and high-end gaming'),
(5,  1, 'AMD Ryzen 5',        'Great alternative to i5 for general productivity'),
(6,  1, 'AMD Ryzen 7',        'High performance alternative to i7'),

-- RAM options
(7,  2, '8GB',                'Minimum for a budget system'),
(8,  2, '16GB',               'Recommended standard for most users in 2025'),
(9,  2, '32GB',               'Best for professional content creation'),
(10, 2, '64GB',               'For extreme professional workloads'),

-- Storage options
(11, 3, '256GB SSD',          'Good starting point for basic use'),
(12, 3, '512GB SSD',          'Recommended for most users'),
(13, 3, '1TB SSD',            'Ample space for applications and files'),
(14, 3, '2TB SSD',            'For users who store large files locally'),
(15, 3, '1TB HDD',            'Budget option but slower than SSD'),

-- GPU options
(16, 4, 'Intel Integrated',   'Built into CPU, fine for everyday tasks'),
(17, 4, 'AMD Integrated',     'Built into AMD CPU, good for light tasks'),
(18, 4, 'Nvidia RTX 4060',    'Great for gaming and video editing'),
(19, 4, 'Nvidia RTX 4070',    'Powerful for serious gaming and 3D rendering'),
(20, 4, 'Nvidia RTX 4090',    'Top tier for professional 3D work and gaming'),

-- Display options
(21, 5, 'Full HD 1080p IPS',  'Sharp image with good color accuracy and viewing angles'),
(22, 5, 'Full HD 1200p IPS',  'Slightly taller aspect ratio, great for productivity'),
(23, 5, 'QHD 1440p IPS',      'Higher detail for creative professionals'),
(24, 5, '4K UHD OLED',        'Superior contrast and vibrant colors'),
(25, 5, '4K UHD IPS',         'High resolution with good color accuracy'),

-- Screen Size options
(26, 6, '13.3 inch',          'Ultra portable and lightweight'),
(27, 6, '14.0 inch',          'Great balance of portability and usability'),
(28, 6, '15.6 inch',          'Ideal if the laptop mostly stays on a desk'),
(29, 6, '17.3 inch',          'Best for users who need a large display'),

-- Battery Life options
(30, 7, '6-8 hours',          'Average battery life for budget laptops'),
(31, 7, '8-10 hours',         'Good battery life for daily use'),
(32, 7, '10-12 hours',        'Excellent battery for professionals on the go'),
(33, 7, '12+ hours',          'Outstanding battery life for ultrabooks');

-- =====================
-- LAPTOP CONFIGURATIONS
-- 6 pre-built laptop setups
-- =====================
INSERT INTO laptop_configurations (id, name, short_summary, base_price) VALUES
(1, 'Budget Basics',          'Perfect for students doing research and light tasks',              599.99),
(2, 'Student Pro',            'Handles multitasking and productivity smoothly',                   899.99),
(3, 'Creative Studio',        'Built for designers and video editors',                           1299.99),
(4, 'Gaming Beast',           'High performance gaming laptop with dedicated GPU',               1799.99),
(5, 'Ultra Portable',         'Lightweight and sleek for professionals on the move',             1099.99),
(6, 'Workstation Master',     'Top tier specs for heavy professional workloads',                 2499.99);

-- =====================
-- LAPTOP CONFIGURATION SPECS
-- Links each laptop configuration to its spec options
-- =====================
INSERT INTO laptop_configuration_specs (configuration_id, spec_option_id) VALUES
-- Budget Basics
(1, 1),   -- Intel Core i3
(1, 7),   -- 8GB RAM
(1, 11),  -- 256GB SSD
(1, 16),  -- Intel Integrated GPU
(1, 21),  -- Full HD 1080p IPS
(1, 27),  -- 14.0 inch
(1, 31),  -- 8-10 hours battery

-- Student Pro
(2, 2),   -- Intel Core i5
(2, 8),   -- 16GB RAM
(2, 12),  -- 512GB SSD
(2, 16),  -- Intel Integrated GPU
(2, 21),  -- Full HD 1080p IPS
(2, 27),  -- 14.0 inch
(2, 32),  -- 10-12 hours battery

-- Creative Studio
(3, 3),   -- Intel Core i7
(3, 8),   -- 16GB RAM
(3, 13),  -- 1TB SSD
(3, 18),  -- Nvidia RTX 4060
(3, 23),  -- QHD 1440p IPS
(3, 28),  -- 15.6 inch
(3, 31),  -- 8-10 hours battery

-- Gaming Beast
(4, 3),   -- Intel Core i7
(4, 9),   -- 32GB RAM
(4, 13),  -- 1TB SSD
(4, 19),  -- Nvidia RTX 4070
(4, 24),  -- 4K UHD OLED
(4, 28),  -- 15.6 inch
(4, 30),  -- 6-8 hours battery

-- Ultra Portable
(5, 2),   -- Intel Core i5
(5, 8),   -- 16GB RAM
(5, 12),  -- 512GB SSD
(5, 16),  -- Intel Integrated GPU
(5, 22),  -- Full HD 1200p IPS
(5, 26),  -- 13.3 inch
(5, 33),  -- 12+ hours battery

-- Workstation Master
(6, 4),   -- Intel Core i9
(6, 10),  -- 64GB RAM
(6, 14),  -- 2TB SSD
(6, 20),  -- Nvidia RTX 4090
(6, 25),  -- 4K UHD IPS
(6, 29),  -- 17.3 inch
(6, 31);  -- 8-10 hours battery

-- =====================
-- PRICE HISTORY
-- =====================
INSERT INTO price_history (configuration_id, old_price, new_price, changed_by) VALUES
(1, 649.99, 599.99, 1),   -- Budget Basics dropped by Admin One
(3, 1199.99, 1299.99, 2), -- Creative Studio increased by Admin Two
(4, 1899.99, 1799.99, 1), -- Gaming Beast dropped by Admin One
(6, 2599.99, 2499.99, 2); -- Workstation Master dropped by Admin Two

-- =====================
-- INVENTORY
-- =====================
INSERT INTO inventory (configuration_id, quantity_in_stock, restock_threshold) VALUES
(1, 25, 5),
(2, 18, 5),
(3, 10, 3),
(4, 8,  3),
(5, 15, 5),
(6, 3,  2);

-- =====================
-- SYSTEM REQUESTS
-- =====================
INSERT INTO system_requests (id, user_id, description, budget_min, budget_max, status) VALUES
(1, 3, 'I need a laptop for my son who is studying engineering. He needs to run CAD software like AutoCAD and SolidWorks for his projects.',  2000.00, 2500.00, 'recommended'),
(2, 3, 'My daughter is studying mass communication. She mostly needs it for research, writing papers, and browsing the internet. Something affordable.',  NULL, 900.00, 'purchased'),
(3, 4, 'I am a graphics designer working with Photoshop, Illustrator and video editing software like Premiere Pro. Need good display and performance.',  1200.00, 1500.00, 'recommended'),
(4, 6, 'I travel a lot for business meetings. Need something lightweight that I can carry easily with long battery life. Not for heavy work.',  900.00, 1200.00, 'pending'),
(5, 5, 'Just need a basic laptop for browsing the internet and checking emails. Budget is tight.',  NULL, 650.00, 'closed');

-- =====================
-- SYSTEM REQUEST RECOMMENDATIONS
-- =====================
INSERT INTO system_request_recommendations (system_request_id, configuration_id, rank, reason) VALUES
(1, 6, 1, 'Top tier specs perfect for CAD design and 3D modeling with RTX 4090'),
(1, 3, 2, 'Creative Studio is a solid alternative with RTX 4060 at a lower price'),
(1, 4, 3, 'Gaming Beast has strong GPU power that can also handle design work'),
(2, 2, 1, 'Student Pro is the perfect balance of performance and price for research'),
(2, 1, 2, 'Budget Basics can handle research and writing at the lowest price'),
(2, 5, 3, 'Ultra Portable is great if she needs to carry it around campus'),
(3, 3, 1, 'Creative Studio is built exactly for graphic design and video editing'),
(3, 4, 2, 'Gaming Beast has a better display with 4K OLED for color accuracy'),
(3, 6, 3, 'Workstation Master is overkill but offers the best performance'),
(4, 5, 1, 'Ultra Portable is lightweight with 12+ hours battery, perfect for travel'),
(4, 2, 2, 'Student Pro is a good alternative with 10-12 hours battery life'),
(5, 1, 1, 'Budget Basics is the most affordable option for basic tasks'),
(5, 2, 2, 'Student Pro offers better performance if budget allows');

-- =====================
-- ORDERS
-- =====================
INSERT INTO orders (id, user_id, system_request_id, status, total_amount) VALUES
(1, 3, 2, 'delivered', 1498.98),
(2, 4, 3, 'confirmed', 1299.99),
(3, 5, 5, 'cancelled', 599.99);

-- =====================
-- ORDER ITEMS
-- =====================
INSERT INTO order_items (order_id, configuration_id, quantity, unit_price, subtotal) VALUES
(1, 4, 1, 899.99,  899.99),
(1, 3, 1, 599.99,  599.99),
(2, 3, 1, 1299.99, 1299.99),
(3, 1, 1, 599.99,  599.99);

-- =====================
-- ACCESSORIES
-- =====================
INSERT INTO accessories (id, name, category, description, price, quantity_in_stock) VALUES
(1,  'Laptop Backpack',          'bag',      'Padded laptop backpack for 15.6" laptops',           15000.00, 50),
(2,  'Laptop Sleeve 14"',        'bag',      'Protective sleeve for 14 inch laptops',               8000.00, 30),
(3,  'Wireless Mouse',           'mouse',    'USB wireless mouse with 2.4GHz receiver',             5000.00, 100),
(4,  'Wired Mouse',              'mouse',    'Basic USB wired mouse',                               2500.00, 80),
(5,  'USB Keyboard',             'keyboard', 'Full-size USB keyboard',                              8000.00, 40),
(6,  'Laptop Charger Universal', 'charger',  'Universal laptop charger 19V',                        25000.00, 25),
(7,  'HP Laptop Charger',        'charger',  'Original HP laptop charger',                          30000.00, 20),
(8,  'Dell Laptop Charger',      'charger',  'Original Dell laptop charger',                        30000.00, 15),
(9,  'External HDD 1TB',         'storage',  'Portable external hard drive 1TB',                    35000.00, 30),
(10, 'External HDD 2TB',         'storage',  'Portable external hard drive 2TB',                    55000.00, 20),
(11, 'Flash Drive 64GB',         'storage',  'USB 3.0 flash drive 64GB',                            8000.00, 100),
(12, 'Flash Drive 128GB',        'storage',  'USB 3.0 flash drive 128GB',                           12000.00, 60),
(13, 'USB Hub 4-Port',           'hub',      '4-port USB 3.0 hub',                                  6000.00, 50),
(14, 'USB-C Hub',                'hub',      'USB-C hub with HDMI, USB 3.0, card reader',           18000.00, 30),
(15, 'Laptop Cooling Pad',       'stand',    'Cooling pad with dual fans',                          12000.00, 25),
(16, 'Laptop Stand',             'stand',    'Adjustable aluminum laptop stand',                    15000.00, 20),
(17, 'HDMI Cable 2m',            'other',    'HDMI cable for connecting to monitor/TV',             3500.00, 60),
(18, 'Screen Cleaner Kit',       'other',    'Microfiber cloth and cleaning solution',              2000.00, 100);

-- =====================
-- ORDER ACCESSORIES
-- =====================
INSERT INTO order_accessories (order_id, accessory_id, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 15000.00, 15000.00),
(1, 3, 2, 5000.00,  10000.00),
(1, 9, 1, 35000.00, 35000.00),
(2, 2, 1, 8000.00,  8000.00),
(2, 3, 1, 5000.00,  5000.00);

-- =====================
-- REPAIR SERVICES
-- =====================
INSERT INTO repair_services (id, name, description, estimated_price, repair_type, estimated_duration) VALUES
(1,  'Screen Replacement',      'Replace cracked or damaged laptop screen',                   45000.00, 'screen',               '2-3 days'),
(2,  'Battery Replacement',     'Replace worn out laptop battery',                            25000.00, 'battery',              '1-2 days'),
(3,  'Keyboard Replacement',    'Replace faulty keyboard',                                    20000.00, 'keyboard',             '1-2 days'),
(4,  'Charging Port Repair',    'Fix loose or damaged charging port',                         15000.00, 'charging_port',        'Same day'),
(5,  'Motherboard Repair',      'Diagnose and repair motherboard issues',                     60000.00, 'motherboard',          '3-5 days'),
(6,  'Software Troubleshooting','Fix software issues, driver problems, boot errors',          10000.00, 'software',             'Same day'),
(7,  'Virus Removal',           'Remove viruses, malware, and clean system',                   8000.00, 'virus_removal',        'Same day'),
(8,  'Data Recovery',           'Recover lost or deleted files',                              50000.00, 'data_recovery',        '3-7 days'),
(9,  'General Maintenance',     'Clean laptop, replace thermal paste, optimize performance',  15000.00, 'general_maintenance',  '1-2 days'),
(10, 'RAM Upgrade',             'Upgrade laptop RAM (customer provides RAM or we source)',     5000.00, 'other',                'Same day');

-- =====================
-- REPAIR REQUESTS
-- =====================
INSERT INTO repair_requests (id, user_id, laptop_brand, laptop_model, issue_description, repair_service_id, status, estimated_cost, final_cost, diagnosed_by, completed_by, completed_at) VALUES
(1, 5,  'HP',     'HP Pavilion 15', 'Screen is cracked after dropping the laptop',                       1, 'completed',      45000.00, 45000.00, 1, 2, '2026-02-02 15:30:00+01'),
(2, 6,  'Dell',   'Dell Inspiron',  'Battery drains very fast, only lasts 30 minutes',                   2, 'completed',      25000.00, 25000.00, 2, 1, '2026-02-03 10:15:00+01'),
(3, 7,  'Lenovo', 'ThinkPad',       'Laptop won''t charge, charging port seems loose',                   4, 'in_progress',    15000.00, NULL,     1, NULL, NULL),
(4, 8,  'Asus',   'VivoBook',       'Laptop is very slow, keeps freezing and showing pop-up ads',        7, 'diagnosed',       8000.00, NULL,     2, NULL, NULL),
(5, 9,  'HP',     'HP ProBook',     'Accidentally deleted important work files, need them recovered',    8, 'pending',        50000.00, NULL,     NULL, NULL, NULL),
(6, 10, 'Acer',   'Acer Aspire',    'Keyboard keys not working properly, some keys stuck',               3, 'awaiting_parts', 20000.00, NULL,     1, NULL, NULL);

-- =====================
-- REPAIR PAYMENTS
-- =====================
INSERT INTO repair_payments (repair_request_id, amount_paid, payment_method, payment_status) VALUES
(1, 45000.00, 'transfer', 'completed'),
(2, 25000.00, 'cash',     'completed');

-- =====================
-- NOTIFICATIONS
-- =====================
INSERT INTO notifications (id, user_id, title, message, notification_type, related_entity_type, related_entity_id, is_read, created_at) VALUES
(1,  5, 'Repair Diagnosed',             'Your HP Pavilion 15 has been diagnosed. Screen replacement required. Estimated cost: ₦45,000. Please approve to proceed.',                                  'repair_status',        'repair_request', 1, TRUE,  '2026-02-01 10:30:00+01'),
(2,  5, 'Repair Started',               'Good news! We have started working on your HP Pavilion 15.',                                                                                                'repair_status',        'repair_request', 1, TRUE,  '2026-02-02 09:00:00+01'),
(3,  5, 'Repair Completed!',            'Your HP Pavilion 15 is ready for pickup at our store!',                                                                                                     'repair_status',        'repair_request', 1, TRUE,  '2026-02-02 15:30:00+01'),
(4,  6, 'Repair Diagnosed',             'Your Dell Inspiron has been diagnosed. Battery replacement required. Estimated cost: ₦25,000.',                                                             'repair_status',        'repair_request', 2, TRUE,  '2026-02-02 11:00:00+01'),
(5,  6, 'Repair Completed!',            'Your Dell Inspiron is ready for pickup!',                                                                                                                   'repair_status',        'repair_request', 2, TRUE,  '2026-02-03 10:15:00+01'),
(6,  7, 'Repair In Progress',           'We are currently working on your Lenovo ThinkPad charging port repair.',                                                                                     'repair_status',        'repair_request', 3, FALSE, '2026-02-03 14:00:00+01'),
(7,  8, 'Repair Diagnosed',             'Your Asus VivoBook has been diagnosed. Issue: Malware and adware infection. Estimated cost: ₦8,000 for virus removal.',                                     'repair_status',        'repair_request', 4, FALSE, '2026-02-04 09:30:00+01'),
(8,  9, 'Repair Request Received',      'We have received your data recovery request for HP ProBook. Our technician will diagnose it within 24 hours.',                                               'repair_status',        'repair_request', 5, FALSE, '2026-02-04 11:00:00+01'),
(9,  3, 'Order Confirmed',              'Your order has been confirmed and is being prepared for delivery.',                                                                                          'order_status',         'order',          1, TRUE,  '2026-01-28 16:00:00+01'),
(10, 3, 'Order Shipped',                'Your order is on the way! Expected delivery in 2-3 days.',                                                                                                  'order_status',         'order',          1, TRUE,  '2026-01-30 10:00:00+01'),
(11, 3, 'Order Delivered',              'Your order has been delivered. Enjoy your new laptops!',                                                                                                    'order_status',         'order',          1, TRUE,  '2026-02-01 14:30:00+01'),
(12, 4, 'Order Confirmed',              'Your order for Creative Studio laptop has been confirmed.',                                                                                                  'order_status',         'order',          2, TRUE,  '2026-02-02 12:00:00+01'),
(13, 4, 'Laptop Recommendations Ready', 'We have found 3 laptops that match your requirements for graphic design and video editing. Check them out!',                                                 'system_recommendation', 'system_request', 3, FALSE, '2026-02-01 15:00:00+01'),
(14, 6, 'Laptop Recommendations Ready', 'We have found 2 portable laptops perfect for your travel needs. View recommendations now.',                                                                  'system_recommendation', 'system_request', 4, FALSE, '2026-02-03 16:00:00+01'),
(15, 3, 'Price Drop Alert!',            'Good news! The Gaming Beast laptop you were interested in has dropped from ₦1,899,999 to ₦1,799,999.',                                                       'price_drop',           NULL,             NULL, FALSE, '2026-02-03 18:00:00+01');

-- =====================
-- PAYMENTS
-- =====================
INSERT INTO payments (id, order_id, amount_paid, payment_method, payment_status, transaction_reference, paid_at, verified_by, verified_at) VALUES
(1, 1, 1498980.00, 'transfer', 'completed', 'TXN20260128150045', '2026-01-28 15:00:45+01', 1, '2026-01-28 15:30:00+01'),
(2, 2, 1299990.00, 'pos',      'completed', 'POS20260202120134', '2026-02-02 12:01:34+01', 2, '2026-02-02 12:05:00+01'),
(3, 3,  599990.00, 'transfer', 'refunded',  'TXN20260203080012', '2026-02-03 08:00:12+01', 1, '2026-02-03 08:30:00+01');

-- =====================
-- DELIVERIES
-- =====================
INSERT INTO deliveries (id, order_id, delivery_method, courier_name, tracking_number, recipient_name, recipient_phone, delivery_address, delivery_state, delivery_lga, delivery_status, estimated_delivery_date, actual_delivery_date, delivered_to, assigned_to, created_at) VALUES
(1, 1, 'courier',       'GIG Logistics',  'GIG2026012890123',  'John Doe',       '08012345678', '123 Ademola Street, Lekki Phase 1',   'Lagos', 'Eti-Osa',         'delivered', '2026-02-01', '2026-02-01', 'John Doe (Self)', 1, '2026-01-28 16:30:00+01'),
(2, 2, 'dispatch_rider','Kwik Delivery',  'KWIK20260202456',   'Sarah Williams', '08098765432', '45 Gimbiya Street, Area 11, Garki',   'FCT',   'Abuja Municipal', 'in_transit', '2026-02-05', NULL,         NULL,             2, '2026-02-02 13:00:00+01');

-- =====================
-- DELIVERY UPDATES
-- =====================
INSERT INTO delivery_updates (delivery_id, status, location, notes, updated_by, created_at) VALUES
(1, 'pending',          'Tek247 Store - Ikeja',       'Order packaged and ready for pickup',                             1,    '2026-01-28 16:30:00+01'),
(1, 'picked_up',        'Tek247 Store - Ikeja',       'Package picked up by GIG Logistics courier',                      1,    '2026-01-29 09:00:00+01'),
(1, 'in_transit',       'GIG Hub - Yaba',             'Package arrived at sorting hub',                                  NULL, '2026-01-30 10:30:00+01'),
(1, 'in_transit',       'GIG Hub - Lekki',            'Package transferred to Lekki hub for final delivery',             NULL, '2026-01-31 14:00:00+01'),
(1, 'out_for_delivery', 'Lekki Phase 1 Area',         'Out for delivery to customer address',                            NULL, '2026-02-01 08:00:00+01'),
(1, 'delivered',        '123 Ademola Street, Lekki',  'Package delivered successfully. Received by customer.',           NULL, '2026-02-01 14:30:00+01'),
(2, 'pending',          'Tek247 Store - Abuja',       'Order ready for dispatch',                                        2,    '2026-02-02 13:00:00+01'),
(2, 'picked_up',        'Tek247 Store - Abuja',       'Package picked up by Kwik delivery rider',                        2,    '2026-02-03 08:00:00+01'),
(2, 'in_transit',       'Wuse 2 Hub',                 'Package at intermediate hub',                                     NULL, '2026-02-03 16:00:00+01');

-- =====================
-- RESET SEQUENCES
-- After inserting rows with explicit IDs, PostgreSQL sequences are
-- unaware of them and will start from 1, causing duplicate key errors.
-- This resets each sequence to the current max ID so the next
-- auto-generated ID continues cleanly from where the seed left off.
-- =====================
SELECT setval('users_id_seq',                (SELECT MAX(id) FROM users));
SELECT setval('spec_categories_id_seq',      (SELECT MAX(id) FROM spec_categories));
SELECT setval('spec_options_id_seq',         (SELECT MAX(id) FROM spec_options));
SELECT setval('laptop_configurations_id_seq',(SELECT MAX(id) FROM laptop_configurations));
SELECT setval('system_requests_id_seq',      (SELECT MAX(id) FROM system_requests));
SELECT setval('orders_id_seq',               (SELECT MAX(id) FROM orders));
SELECT setval('accessories_id_seq',          (SELECT MAX(id) FROM accessories));
SELECT setval('repair_services_id_seq',      (SELECT MAX(id) FROM repair_services));
SELECT setval('repair_requests_id_seq',      (SELECT MAX(id) FROM repair_requests));
SELECT setval('notifications_id_seq',        (SELECT MAX(id) FROM notifications));
SELECT setval('payments_id_seq',             (SELECT MAX(id) FROM payments));
SELECT setval('deliveries_id_seq',           (SELECT MAX(id) FROM deliveries));

-- migrate:down

DELETE FROM delivery_updates;
DELETE FROM deliveries;
DELETE FROM payments;
DELETE FROM notifications;
DELETE FROM repair_payments;
DELETE FROM repair_requests;
DELETE FROM repair_services;
DELETE FROM order_accessories;
DELETE FROM accessories;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM system_request_recommendations;
DELETE FROM system_requests;
DELETE FROM inventory;
DELETE FROM price_history;
DELETE FROM laptop_configuration_specs;
DELETE FROM laptop_configurations;
DELETE FROM spec_options;
DELETE FROM spec_categories;
DELETE FROM users;
