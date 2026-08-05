export interface OFFProduct {
  name: string;
  calories_per_100g: number | null;
  serving_size_g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
    headers: { 'User-Agent': 'HikerHunger/1.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1) return null;

  const p = data.product;
  const name = (p.product_name_en || p.product_name || '').trim();
  const nutriments = p.nutriments ?? {};
  const num = (key: string): number | null => {
    const v = nutriments[key];
    return typeof v === 'number' ? v : null;
  };
  const calories_per_100g = num('energy-kcal_100g');
  const protein_per_100g = num('proteins_100g');
  const carbs_per_100g = num('carbohydrates_100g');
  const fat_per_100g = num('fat_100g');

  const servingMatch = (p.serving_size as string | undefined)?.match(/(\d+(?:\.\d+)?)\s*g/i);
  const serving_size_g = servingMatch ? Number(servingMatch[1]) : null;

  return { name, calories_per_100g, serving_size_g, protein_per_100g, carbs_per_100g, fat_per_100g };
}
