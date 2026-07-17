import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MENU = [
  {
    id: "m_krapao_pork",
    name: "กระเพราหมูสับ (ข้าวราด)",
    desc: "กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ",
    price: 60,
    image: '/meal/krapao.jpg',
    category: "signature",
    spicy: true,
    options: [
      { id: "spicy", name: "ระดับความเผ็ด", choices: [{ id: "0", label: "ไม่เผ็ด" }, { id: "1", label: "เผ็ดน้อย" }, { id: "2", label: "เผ็ดกลาง" }, { id: "3", label: "เผ็ดมาก" }] }
    ],
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }, { id: "bacon", name: "หมูกรอบ", price: 20 }],
  },
  {
    id: "m_pad_nam_prik_pao",
    name: "ผัดพริกเผา (ข้าวราด)",
    desc: "ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว",
    price: 65,
    image: '/meal/pad_tua_sea.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pad_nam_oil",
    name: "ผัดน้ำมันหอย (ข้าว/เส้น)",
    desc: "ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ",
    price: 65,
    image: '/meal/khao_moo_garlic.jpg',
    category: "main",
  },
  {
    id: "m_pad_see_ew",
    name: "ผัดซีอิ๊ว (เส้นใหญ่)",
    desc: "เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน",
    price: 70,
    image: '/meal/pad_see_ew.jpg',
    category: "noodles",
  },
  {
    id: "m_fried_rice",
    name: "ข้าวผัดกระเทียม (ข้าวผัด)",
    desc: "ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้",
    price: 70,
    image: '/meal/fried_rice.jpg',
    category: "rice",
  },
  {
    id: "m_pad_phong_kari",
    name: "ผัดผงกะหรี่ (ไก่/หมู)",
    desc: "ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ",
    price: 75,
    image: '/meal/pad_pong_gari.jpg',
    category: "main",
  },
  {
    id: "m_pad_pak",
    name: "ผัดผักรวม (กับข้าว)",
    desc: "ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย",
    price: 55,
    image: '/meal/pad_pak.jpg',
    category: "vegetarian",
  },
  {
    id: "m_pad_prik_gaeng",
    name: "ผัดพริกแกง (ตามสั่ง)",
    desc: "ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้",
    price: 80,
    image: '/meal/pad_tua_sea.jpg',
    category: "signature",
    spicy: true
  },
  {
    id: "d_water",
    name: "น้ำเปล่า",
    desc: "น้ำดื่มเย็นๆ ขวดเล็ก",
    price: 15,
    image: '/meal/water.jpg',
    category: "drinks",
  },
  {
    id: "d_coke",
    name: "โค้ก (ขวด)",
    desc: "น้ำอัดลม ซีโร่/ปกติ ตามสต็อก",
    price: 35,
    image: '/meal/coke.jpg',
    category: "drinks",
  },
  {
    id: "d_luangyai",
    name: "น้ำลำไย",
    desc: "น้ำลำไยหวานหอม เสิร์ฟเย็น",
    price: 45,
    image: '/meal/longan_juice.jpg',
    category: "drinks",
  },
  {
    id: "d_orange",
    name: "น้ำส้มคั้น",
    desc: "น้ำส้มคั้นสด หวานอมเปรี้ยว",
    price: 50,
    image: '/meal/orange_juice.jpg',
    category: "drinks",
  },
  {
    id: "dess_grass_jelly",
    name: "เฉาก๊วย",
    desc: "เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม",
    price: 40,
    image: '/meal/grass_jelly.webp',
    category: "dessert",
  },
  {
    id: "dess_shaved_ice",
    name: "น้ำแข็งไส",
    desc: "น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย",
    price: 55,
    image: '/meal/shaved_ice.jpg',
    category: "dessert",
  }
];

async function seedMenu() {
  console.log("Seeding menu to Supabase...");
  let sort_order = 1;
  for (const item of MENU) {
    const { error } = await supabase.from('menu_items').upsert({
      id: item.id,
      name: item.name,
      description: item.desc,
      price: item.price,
      image_url: item.image,
      category: item.category,
      is_available: true,
      is_spicy: item.spicy || false,
      sort_order: sort_order++,
      options: item.options ? item.options : null,
      addons: item.addons ? item.addons : null
    });
    
    if (error) {
      console.error(`Error inserting ${item.name}:`, error);
    } else {
      console.log(`Successfully seeded ${item.name}`);
    }
  }
  console.log("Seeding complete!");
}

seedMenu();
