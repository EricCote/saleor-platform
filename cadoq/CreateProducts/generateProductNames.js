import { GetDataFromFile } from './excel.js';
import fs from 'fs';

generateProductNames();

export function generateProductNames() {
  const data = GetDataFromFile('dataRef.xlsx');

  const grouping = Object.groupBy(data, (p) => p.Product);
  const grouped = Object.entries(grouping).map(([key, value]) => ({
    product: key,
    en: stripPromo(value[0]['Description 1']),
    fr: stripPromo(value[0]['Description 2']),
    fabric: value[0].Composition,
  }));

  fs.writeFileSync('productNames.json', JSON.stringify(grouped, null, 2));
}

function stripPromo(str) {
  return str.replace(/Promo\d\d-/gi, '');
}
