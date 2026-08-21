export type Addon = {
  id: string;
  name: string;
  price: number;
};

export type AddonItem = Addon;

export type OptionChoice = {
  id: string;
  label: string;
  price?: number;
};

export type OptionGroup = {
  id: string;
  name: string;
  choices: OptionChoice[];
};

export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  spicy?: boolean;
  options?: OptionGroup[];
  addons?: Addon[];
  isAvailable?: boolean;
  isSpicy?: boolean;
  staff_note?: string | null;
  sort_order?: number;
};

export type MenuItemDB = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  image_url: string | null;
  category: string;
  is_available: boolean;
  is_spicy: boolean;
  sort_order: number;
  options: OptionGroup[] | null;
  addons: Addon[] | null;
  staff_note: string | null;
};

export type Protein = {
  id: string;
  name: string;
  price: number;
};

export type Topping = {
  id: string;
  name: string;
  price: number;
};

export type SizeItem = {
  id: string;
  name: string;
  price: number;
};

export type Category = {
  id: string;
  label: string;
  emoji?: string;
};
