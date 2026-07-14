-- ════════════════════════════════════════════════════════
-- Migration 006: Menu Management Enhancements
-- เพิ่ม image_url column ใน menu_items
-- เพิ่ม staff_note column สำหรับหมายเหตุพนักงาน
-- ════════════════════════════════════════════════════════

-- เพิ่ม column image_url สำหรับ URL รูปจาก Supabase Storage
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- เพิ่ม column staff_note สำหรับหมายเหตุพนักงาน (วัตถุดิบ, ข้อสังเกต ฯลฯ)
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS staff_note TEXT;

-- เพิ่ม column capacity สำหรับจำนวนที่นั่ง restaurant_tables
ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 4;

-- เพิ่ม column table_type (normal/walkin)
ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS table_type TEXT NOT NULL DEFAULT 'normal'
  CHECK (table_type IN ('normal', 'walkin'));

-- ─── RLS Policies สำหรับ menu_items ───────────────────────────────────────
-- Allow anyone to read menu items (for customer page)
DO $$ BEGIN
  DROP POLICY IF EXISTS "menu_items_select_all" ON public.menu_items;
EXCEPTION WHEN undefined_object THEN NULL; END$$;

CREATE POLICY "menu_items_select_all" ON public.menu_items
  FOR SELECT USING (true);

-- Allow anon/authenticated to insert/update/delete (for staff management)
DO $$ BEGIN
  DROP POLICY IF EXISTS "menu_items_all_anon" ON public.menu_items;
EXCEPTION WHEN undefined_object THEN NULL; END$$;

CREATE POLICY "menu_items_all_anon" ON public.menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS on menu_items if not already enabled
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies สำหรับ restaurant_tables ────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "restaurant_tables_all_anon" ON public.restaurant_tables;
EXCEPTION WHEN undefined_object THEN NULL; END$$;

CREATE POLICY "restaurant_tables_all_anon" ON public.restaurant_tables
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- ─── Enable Realtime for menu_items ────────────────────────────────────────
-- (Run in Supabase Dashboard > Database > Replication to add menu_items to realtime)
-- This SQL enables the publication:
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_object THEN NULL;
         WHEN others THEN NULL;
END$$;

-- ─── Seed initial menu_items from MENU constant (if table is empty) ─────────
INSERT INTO public.menu_items (id, name, description, price, image, category, is_available, is_spicy, sort_order, options, addons)
VALUES
  ('m_krapao_pork',       'กระเพราหมูสับ (ข้าวราด)',          'กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ',                                       60,  '/meal/krapao.jpg',       'signature',  true, true,  1,  '[{"id":"spicy","name":"ระดับความเผ็ด","choices":[{"id":"0","label":"ไม่เผ็ด"},{"id":"1","label":"เผ็ดน้อย"},{"id":"2","label":"เผ็ดกลาง"},{"id":"3","label":"เผ็ดมาก"}]}]', '[{"id":"egg","name":"ไข่ดาว","price":10},{"id":"bacon","name":"หมูกรอบ","price":20}]'),
  ('m_pad_nam_prik_pao',  'ผัดพริกเผา (ข้าวราด)',              'ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว',                          65,  '/meal/pad_tua_sea.jpg',  'signature',  true, false, 2,  NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_pad_nam_oil',       'ผัดน้ำมันหอย (ข้าว/เส้น)',          'ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ',                              65,  '/meal/khao_moo_garlic.jpg','main',      true, false, 3,  NULL, NULL),
  ('m_pad_see_ew',        'ผัดซีอิ๊ว (เส้นใหญ่)',              'เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน',                                    70,  '/meal/pad_see_ew.jpg',   'noodles',    true, false, 4,  NULL, NULL),
  ('m_fried_rice',        'ข้าวผัดกระเทียม (ข้าวผัด)',         'ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้',                                70,  '/meal/fried_rice.jpg',   'rice',       true, false, 5,  NULL, NULL),
  ('m_pad_phong_kari',    'ผัดผงกะหรี่ (ไก่/หมู)',             'ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ',                                                    75,  '/meal/pad_pong_gari.jpg','main',       true, false, 6,  NULL, NULL),
  ('m_pad_pak',           'ผัดผักรวม (กับข้าว)',               'ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย',                                                  55,  '/meal/pad_pak.jpg',      'vegetarian', true, false, 7,  NULL, NULL),
  ('m_pad_prik_gaeng',    'ผัดพริกแกง (ตามสั่ง)',              'ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้',                                          80,  '/meal/pad_tua_sea.jpg',  'signature',  true, true,  8,  NULL, NULL),
  ('d_water',             'น้ำเปล่า',                          'น้ำดื่มเย็นๆ ขวดเล็ก',                                                                            15,  '/meal/water.jpg',        'drinks',     true, false, 9,  NULL, NULL),
  ('d_coke',              'โค้ก (ขวด)',                        'น้ำอัดลม ซีโร่/ปกติ ตามสต็อก',                                                                    35,  '/meal/coke.jpg',         'drinks',     true, false, 10, NULL, NULL),
  ('d_luangyai',          'น้ำลำไย',                           'น้ำลำไยหวานหอม เสิร์ฟเย็น',                                                                       45,  '/meal/longan_juice.jpg', 'drinks',     true, false, 11, NULL, NULL),
  ('d_orange',            'น้ำส้มคั้น',                        'น้ำส้มคั้นสด หวานอมเปรี้ยว',                                                                       50,  '/meal/orange_juice.jpg', 'drinks',     true, false, 12, NULL, NULL),
  ('dess_grass_jelly',    'เฉาก๊วย',                           'เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม',                                                       40,  '/meal/grass_jelly.webp', 'dessert',    true, false, 13, NULL, NULL),
  ('dess_shaved_ice',     'น้ำแข็งไส',                         'น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย',                                                                  55,  '/meal/shaved_ice.jpg',   'dessert',    true, false, 14, NULL, NULL),
  ('m_krapao_crispy_pork','กระเพราหมูกรอบ (ข้าวราด)',          'กระเพราหมูกรอบหนังสามชั้นกรอบนอกนุ่มใน ผัดใบกระเพราแท้รสจัดจ้าน เสิร์ฟราดข้าวหอมมะลิร้อนๆ',  70,  '/meal/krapao.jpg',       'signature',  true, true,  15, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_kana_crispy_pork',  'ผัดคะน้าหมูกรอบ (ข้าวราด)',         'ผัดคะน้าใบเขียวสดกรอบกับหมูกรอบสามชั้น ปรุงรสกลมกล่อม ราดข้าวหอมมะลิร้อนๆ',                  70,  '/meal/pad_pak.jpg',      'main',       true, false, 16, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_prik_gaeng_crispy_pork','ผัดพริกแกงหมูกรอบ (ข้าวราด)',  'พริกแกงรสเข้มข้นผัดคลุกเคล้ากับหมูกรอบและถั่วฝักยาว ราดข้าวหอมมะลิร้อนๆ',                      70,  '/meal/pad_tua_sea.jpg',  'main',       true, true,  17, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_garlic_sliced_pork','กระเทียมพริกไทยหมูชิ้น (ข้าวราด)', 'หมูชิ้นนุ่มๆ ผัดซอสกระเทียมพริกไทยรสเข้มข้น หอมกระเทียมเจียว ราดข้าว',                         60,  '/meal/khao_moo_garlic.jpg','main',      true, false, 18, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_pong_kari_sea',     'ผัดผงกะหรี่ทะเล (ข้าวราด)',         'เนื้อกุ้งและปลาหมึกสดผัดผงกะหรี่เข้มข้น ไข่นุ่มละมุนลิ้น ราดข้าวหอมมะลิ',                    70,  '/meal/pad_pong_gari.jpg','signature',  true, false, 19, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_khua_prik_beef',    'คั่วพริกแกงเนื้อ (ข้าวราด)',        'เนื้อวัวเกรดดีผัดคั่วพริกแกงตำมือ รสจัดจ้านถึงใจ สมุนไพรไทยครบเครื่อง ราดข้าว',               60,  '/meal/pad_tua_sea.jpg',  'main',       true, true,  20, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_see_ew_crispy_pork','ผัดซีอิ๊วเส้นใหญ่หมูกรอบ',          'เส้นใหญ่เหนียวนุ่มผัดซีอิ๊วดำหอมกลิ่นกระทะ คลุกเคล้ากับหมูกรอบและคะน้าสด',                   75,  '/meal/pad_see_ew.jpg',   'noodles',    true, false, 21, NULL, NULL),
  ('m_mama_prik_gaeng_shrimp','มาม่าผัดคั่วพริกแกงกุ้ง',      'เส้นมาม่าเหนียวนุ่มผัดซอสพริกแกงเข้มข้นและกุ้งสดเด้งๆ สมุนไพรหอมกรุ่น',                       65,  '/meal/pad_tua_sea.jpg',  'noodles',    true, true,  22, NULL, NULL),
  ('m_prik_pao_clam',     'ผัดพริกเผาหอยลาย (ข้าวราด)',        'หอยลายสดผัดน้ำพริกเผาสูตรเด็ด รสชาติหวานเค็มเผ็ดลงตัว หอมใบโหระพา ราดข้าว',                  60,  '/meal/pad_tua_sea.jpg',  'main',       true, false, 23, NULL, '[{"id":"egg","name":"ไข่ดาว","price":10}]'),
  ('m_pad_pak_no_meat',   'ผัดผักรวมมิตร (ข้าวราด / มังสวิรัติ)','ผัดผักสดรวมมิตรรสชาติเบาๆ สุขภาพดี ปรุงด้วยซีอิ๊วขาวและน้ำมันหอยสูตรเจ ราดข้าว',           50,  '/meal/pad_pak.jpg',      'vegetarian', true, false, 24, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
