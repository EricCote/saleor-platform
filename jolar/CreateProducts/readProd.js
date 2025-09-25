import util from 'util';
import { GetDataFromFile } from './excel.js';

const jsonData = GetDataFromFile('./data3.xlsx');

const TestWhenProductIsNull = jsonData.filter((el) => !el.Product);
showCount('When Product is null', TestWhenProductIsNull);

const TestWhenDfrHasInventory = jsonData.filter(
  (el) => el.Cat == 'DFR' && el['AT Ship'] > 0
);
showCount('When DFR has inventory', TestWhenDfrHasInventory);

const TestWhenDfrHasNoInventory = jsonData.filter(
  (el) => el.Cat == 'DFR' && el['AT Ship'] == 0
);
showCount('When DFR has no inventory', TestWhenDfrHasNoInventory);

const TestWhenDiscontinuedHasInventory = jsonData.filter(
  (el) => el.Discontinued == '1' && el['AT Ship'] > 0
);
showCount('When Discontinued has inventory', TestWhenDiscontinuedHasInventory);

const TestWhenDiscontinuedHasNoInventory = jsonData.filter(
  (el) => el.Discontinued == '1' && el['AT Ship'] == 0
);
showCount(
  'When Discontinued has no inventory',
  TestWhenDiscontinuedHasNoInventory
);

const TestWhenUpcAndEanAreBothNull = jsonData.filter(
  (el) => !el.EAN && !el.UPC //&& el['AT Ship'] > 0
);

showCount('When UPC and EAN are both null', TestWhenUpcAndEanAreBothNull);

const TestWhenEanHasValue = jsonData.filter(
  (el) => !el.UPC && el.EAN //&& el['AT Ship'] > 0
);
showCount('When only EAN has a value', TestWhenEanHasValue);

const TestWhenUpcHasValue = jsonData.filter(
  (el) => el.UPC && !el.EAN //&& el['AT Ship'] > 0
);
showCount('When only UPC has a value', TestWhenUpcHasValue);

const TestWhenBothHaveValue = jsonData.filter(
  (el) => el.UPC && el.EAN //&& el['AT Ship'] > 0
);
showCount('When both UPC and EAN have values', TestWhenBothHaveValue);

const TestWhenEanIsNotEqualToUpc = jsonData.filter(
  (el) => el.EAN && el.UPC && el.EAN !== el.UPC && el.EAN !== '0' + el.UPC
  //&& el['AT Ship'] > 0
);
showCount('  When UPC is not Equal to EAN', TestWhenEanIsNotEqualToUpc);

const TestWhenEanIsNearlyEqualToUpc = jsonData.filter(
  (el) => el.EAN && el.UPC && (el.EAN == el.UPC || el.EAN == '0' + el.UPC)
  //&& el['AT Ship'] > 0
);
showCount('  When UPC is nearly Equal to EAN', TestWhenEanIsNearlyEqualToUpc);

const TestWhenEanIsEqualToUpc = jsonData.filter(
  (el) => el.EAN && el.UPC && el.EAN == el.UPC
  //&& el['AT Ship'] > 0
);
showCount('  When UPC is completely Equal to EAN', TestWhenEanIsEqualToUpc);

groupStat(
  jsonData,
  (el) => (el.EAN ?? el.UPC ?? el.Product) + el.Color + el.Size,
  'Product grouped with color, size, NOT discontinued NOR Cat'
);

groupStat(
  jsonData,
  (el) =>
    (el.EAN ?? el.UPC ?? el.Product) + el.Color + el.Size + el.Discontinued,
  'Product grouped with color, size, discontinued NOR Cat'
);

groupStat(
  jsonData,
  (el) =>
    (el.EAN ?? el.UPC ?? el.Product) +
    el.Color +
    el.Size +
    el.Discontinued +
    el.Cat,
  'Stats on Product with color, size, discontinued and Cat'
);

const groupedByCat = Object.groupBy(jsonData, (el) => el.Cat);

const groupingByCat = Object.keys(groupedByCat).map((el) => ({
  key: el,
  count: groupedByCat[el].length,
}));

console.log(groupingByCat);

// showContent(jsonData, (p) => p.Size);
// showContent(jsonData, (p) => p.Color);
// showContent(jsonData, (p) => p.ProductClass);
// showContent(jsonData, (p) => p.PCollection);
// showContent(jsonData, (p) => p['Type Group']);
// showContent(jsonData, (p) => p.PType);
// showContent(jsonData, (p) => p.PGroup);

////////////////

// Major filter
// the main list keeps products that have more than 20 items, have a price and are not discontinued

const mainList = jsonData.filter(
  (p) =>
    p['AT Ship'] >= 20 &&
    p.Discontinued == 0 &&
    p.Price > 0 &&
    p.PType != 'Supply'
  // p.PGroup != 'Discontinué' &&
  // p.PGroup != 'Disc'
);

//groups the main list by product
const grouped = Object.groupBy(mainList, (p) => p.Product);
const uniqueProducts = Object.keys(grouped);

showCount('Unique Products', uniqueProducts);

showCount('With variants over 20', mainList);

groupStat(mainList, (p) => p.Product, 'Grouping variants of products');

const mainListWithVariants = jsonData.filter(
  (p) =>
    uniqueProducts.includes(p.Product) &&
    p.Discontinued == 0 &&
    p.Price > 0 &&
    p['AT Ship'] >= 1
);

showCount('variants keeping similar variants >= 1', mainListWithVariants);
groupStat(
  mainListWithVariants,
  (p) => p.Product,
  'Grouping variants of products'
);

// showContent(mainListWithVariants, (p) => p.Size, 'Size');
// showContent(mainListWithVariants, (p) => p.Color, 'Color');
// showContent(mainListWithVariants, (p) => p.ProductClass, 'ProductClass');
// showContent(mainListWithVariants, (p) => p.PCollection, 'PCollection');
// showContent(mainListWithVariants, (p) => p['Type Group'], 'TypeGroup');
// showContent(mainListWithVariants, (p) => p.PType, 'PType');
// showContent(mainListWithVariants, (p) => p.PGroup, 'PGroupe');

//const sum = counting.reduce((acc, c) => acc + c.count, 0);

//console.log(jsonData.length, sum);

//////

const jsonRef = GetDataFromFile('./dataRef.xlsx');

const colors1 = Object.groupBy(jsonRef, (c) => c.Color);
const grouping = Object.keys(colors1).map((el) => ({
  fr: colors1[el][0].Color2,
  en: colors1[el][0].Color,
  count: colors1[el].length,
}));

//console.log('colors1:', util.inspect(grouping, { maxArrayLength: null }));

//exit();

const bigMainList = mainList.map((el) => {
  const refer = jsonRef.find(
    (r) =>
      r.Product == el.Product &&
      r.Color == el.Color &&
      r['Size Code'] == el.SizeRun &&
      lookupCat(r.Cat) == el.Cat &&
      !r['Publish To Web'] == el.Discontinued
  );
  if (!refer) {
    console.error(`ERROR Referrence ${el.Product}`);
  }
  return { ...refer, ...el };
});

groupCategories(mainListWithVariants);

const top100 = GetDataFromFile('./Top100.csv');

const top100mapped = top100.map((t) => ({
  prod: t.Product,
  desc: t.Description,
  included: !!mainList.find((p) => t.Product == p.Product),
}));

const included = top100mapped.filter((p) => p.included);
const notIncluded = top100mapped.filter((p) => !p.included);

console.log(`Inclus: ${included.length} Non-inclus: ${notIncluded.length}`);

//console.log(included.map((p) => p.desc));
//console.log(notIncluded.map((p) => p.desc));

//showDetails('liste finale: ', bigMainList.slice(0, 3));

//console.log('Other List', jsonRef.slice(0, 3));
groupDetails(
  jsonRef,
  (p) => p.Product + p.Color + p['Size Code'] + p['Publish To Web'] + p.Cat
);

function showCount(description, array) {
  console.log(description + ':', array.length);
}

function showDetails(description, array) {
  console.log(description + ':', array);
}

function groupStat(array, groupingFn, description) {
  const grouped = Object.groupBy(array, groupingFn);

  const grouping = Object.keys(grouped).map((el) => ({
    key: el,
    count: grouped[el].length,
  }));

  const counted = Object.groupBy(grouping, (k) => k.count);

  const counting = Object.keys(counted).map((el) => ({
    key: el,
    count: counted[el].length,
  }));

  console.log(description);
  console.log(
    counting.map((el) => `${el.count} products with ${el.key} variants`)
  );
}

function groupCategories(array, groupingFn) {
  const pGrouped = Object.groupBy(array, (p) => p.Product);

  const pGrouping = Object.keys(pGrouped).map((el) => ({
    prod: el,
    cat: pGrouped[el][0]['Type Group'],
    numVariants: pGrouped[el].length,
  }));
  const grouped = Object.groupBy(pGrouping, (p) => p.cat);
  const grouping = Object.keys(grouped).map((el) => ({
    key: el,
    count: grouped[el].length,
    variantCount: grouped[el].reduce((acc, p) => p.numVariants + acc, 0),
  }));

  console.log('répartition:', grouping);
}

function groupDetails(array, groupingFn, description) {
  const grouped = Object.groupBy(array, groupingFn);

  const grouping = Object.keys(grouped).map((el) => ({
    key: el,
    count: grouped[el].length,
    prod: grouped[el][0].Product,
  }));

  const group2 = Object.groupBy(
    grouping.filter((p) => p.count > 1),
    (p) => p.prod
  );

  const final = Object.keys(group2);

  console.log(description);
  console.log(final);
}

function showContent(array, fn) {
  const content = Object.groupBy(array, fn);
  console.log(Object.keys(content));
}

function lookupCat(cat) {
  if (cat == 'Duty Free') return 'DFR';
  else return 'REG';
}
