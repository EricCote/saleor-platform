import { executeGraphQL } from './graphql.js';
import slug from 'slug';
import 'dotenv/config';
import XLSX from 'xlsx';
import fs from 'fs';
import {
  fetchProductType,
  fetchAllCategories,
  fetchChannel,
  fetchWarehouse,
  fetchAllCollections,
  fetchAllAttributes,
} from './fetchers.js';

const importImages = true;
const productMin = readPositionFromFile();
const productMax = null;

const rawMap = fs.readFileSync('productMap.json', 'utf-8');
const mapping = JSON.parse(rawMap);

const rawPictures = fs.readFileSync('productPhotos.json', 'utf-8');
const mappingPhotos = JSON.parse(rawPictures);

const jsonData = GetDataFromFile('./data2.xlsx');

const jsonRef = GetDataFromFile('./dataRef.xlsx');

// the main list keeps products that have more than 20 items, have a price and are not discontinued

const mainList = jsonData.filter(
  (p) => p['AT Ship'] >= 20 && p.Discontinued == 0 && p.Price > 0
  // p.PGroup != 'Discontinué' &&
  // p.PGroup != 'Disc'
);

//groups the main list by product
const grouped = Object.groupBy(mainList, (p) => p.Product);
const uniqueProducts = Object.keys(grouped);

showCount('Unique Products', uniqueProducts);

showCount('With variants over 20', mainList);

const mainListWithVariants = jsonData.filter(
  (p) =>
    uniqueProducts.includes(p.Product) &&
    p.Discontinued == 0 &&
    p.Price > 0 &&
    p['AT Ship'] >= 6
);

showCount('variants keeping similar variants >= 6', mainListWithVariants);

const bigMainList = mainListWithVariants.map((el) => {
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

const productType = await fetchProductType('Vêtement');
const categories = await fetchAllCategories();
const collections = await fetchAllCollections();
const attributes = await fetchAllAttributes();
const channelID = await fetchChannel('Default Channel'); // Assuming a default channel ID for simplicity
const warehouseID = await fetchWarehouse('Default'); // Assuming a default warehouse ID for simplicity

console.log('Using channel ID:', channelID);
console.log('Using warehouse ID:', warehouseID);

//Creates out.txt with list of bad links
//const resProd = await createListBadLinks();

//Creates mapping file with corrrect list of links
//const fixedLinks = await fixBadLinks();

//await createPicturesFile(bigMainList);

await createProducts(bigMainList);

//console.log(await getPictureList('FE12577'));

async function getPictureList(product) {
  const map = mapping.find(
    (m) => m.prod.toLowerCase() == product.toLowerCase()
  );
  let newLink;
  if (map) newLink = map.newLink;
  else
    newLink = slug(
      product +
        ' ' +
        stripPromo(bigMainList.find((p) => p.Product == product)['Description'])
    );

  const resp = await fetch(`https://www.jolarspeck.com/en/${newLink}`);
  const html = await resp.text();

  const regex = /data-zoom="(.*?)"/g;
  let match = {};
  const photos = [];

  while ((match = regex.exec(html)) !== null) {
    photos.push(match[1]);
  }
  return photos;
}

// function listProductsWithDash(){
//   const products = bigMainList.filter((p) => p.Product.includes('-'));
//   console.log(products.map((p) => p.Product));
// }
async function createBadLinksFile() {
  const grouped2 = Object.groupBy(bigMainList, (p) => p.Product);
  const prods = Object.keys(grouped2).map((key) => ({
    ...grouped[key][0],
    variants: grouped[key],
  }));

  const mylist = prods.map((p) =>
    slug(p.Product + ' ' + stripPromo(p['Description']))
  );

  const fetchPromises = mylist.map((url) =>
    fetch(`https://www.jolarspeck.com/en/${url}`)
  );
  const responses = await Promise.all(fetchPromises);
  const data = responses.map((response) => {
    let r;
    if (!response.ok) {
      r = { link: response.url.split('/').pop(), status: response.status };
    } else {
      r = { link: response.url.split('/').pop(), status: 'OK' };
    }
    return r;
  });

  console.log('number of errors:', data.filter((d) => d.status != 'OK').length);
  fs.writeFileSync(
    'out.txt',
    JSON.stringify(
      data.filter((d) => d.status != 'OK'),
      null,
      2
    )
  );
}

async function fixBadLinksFiles() {
  const links = JSON.parse(fs.readFileSync('out.txt', 'utf-8'));
  const myLinks = links.map((l) => {
    let prod = l.link.split('-')[0];
    if (l.link.split('-')[1] == 'p' && prod == 'ml1783') prod = 'ml1783-p';
    if (prod == 'ml50024q') prod = 'ml50024x';
    return { prod, link: l.link };
  });

  const fetchPromises = myLinks.map((l) =>
    fetch(`https://www.jolarspeck.com/en/catalogsearch/result/?q=${l.prod}`)
  );

  const responses = await Promise.all(fetchPromises);

  for (let i = 0; i < responses.length; i++) {
    //responses.forEach(async (r, idx) => {
    const html = await responses[i].text();
    const regex = /product-top.*?href="(.+?)"/g;
    let match;
    const urls = [];

    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
    const prod = responses[i].url.split('=').pop();
    let theLink = urls.find((u) => {
      const res = u.includes(prod);
      return res;
    });
    if (theLink == undefined) {
      theLink = urls[0];
      if (theLink == undefined) {
        console.error('No link found for', prod);
        continue;
      }
    }

    myLinks[i].newLink = theLink.split('/').pop();
  }
  //console.log(myLinks);
  fs.writeFileSync('productMap.json', JSON.stringify(myLinks, null, 2));
  console.log(myLinks.length);
  return myLinks;
}

async function createPicturesFile(products) {
  const grouped = Object.groupBy(products, (p) => p.Product);
  const prods = Object.keys(grouped).map((key) => ({
    ...grouped[key][0],
    variants: grouped[key],
  }));

  let listProductPhotos = [];

  for (const p of prods) {
    const images = (await getPictureList(p.Product)).map((pic, num) => ({
      alt: (p.Description ?? p['Description 2']) + ' ' + (num + 1),
      mediaUrl: pic,
    }));
    listProductPhotos.push({ product: p.Product, images });
  }
  fs.writeFileSync(
    'productPhotos.json',
    JSON.stringify(listProductPhotos, null, 2)
  );
}

function GetDataFromFile(file) {
  // 1. Specify the path to your Excel file
  const excelFile = file;

  // 2. Read the workbook
  const workbook = XLSX.readFile(excelFile);

  // 3. Get the name of the first sheet
  const sheetName = workbook.SheetNames[0];

  // 4. Get the worksheet
  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, { defval: null });
}

function readPositionFromFile() {
  let productMin = 0;
  try {
    const posStr = fs.readFileSync('./currentProductPos.txt', 'utf8');
    const posNum = parseInt(posStr);
    if (!isNaN(posNum)) {
      productMin = posNum;
    }
  } catch (e) {
    // File does not exist or is unreadable, default to 0
  }
  return productMin;
}

async function createProducts(products) {
  const grouped = Object.groupBy(products, (p) => p.Product);
  const prods = Object.keys(grouped).map((key) => ({
    ...grouped[key][0],
    variants: grouped[key],
  }));

  const listProducts = prods.map((p) => ({
    name: p['Description 2'],
    productType: productType,
    attributes: [{ externalReference: 'fabric', plainText: p.Composition }],

    category: lookupCategory(p['Type Group']),
    collections: [lookupCollection(p.PType), lookupCollection(p.ProductClass)], // Add collections if needed
    media: mappingPhotos.find((m) => m.product == p.Product)?.images,
    slug: slug(p.Product),

    description: `{"blocks": [{"data": {"text": "Description pour ${p[
      'Description 2'
    ].replace(/"/g, '\\"')}."}, "type": "paragraph"}]}`,
    privateMetadata: [{ key: 'jolar', value: p.Product }],
    metadata: [
      {
        key: 'mdxFr',
        value: '<div>\n' + p['Web Description 2'] + '\n</div>',
      },
      { key: 'mdxEn', value: '<div>\n' + p['Web Description'] + '\n</div>' },
    ],

    externalReference: p.Product,
    channelListings: [
      {
        channelId: channelID,
        isPublished: true,
        visibleInListings: true,
        isAvailableForPurchase: true,
      },
    ],
    variants: p.variants.map((v) => ({
      attributes: [
        { externalReference: 'size', plainText: v.Size },
        { externalReference: 'color', dropdown: { value: v.Color } },
      ],
      sku:
        v.UPC ?? v.EAN ?? 'xxx' + Math.random().toString(36).substring(2, 15),
      name: v.Color + ' - ' + v.Size,
      //externalReference: p.pvId,
      metadata: v.UPC ? [{ key: 'upc', value: v.UPC }] : undefined,
      stocks: [{ warehouse: warehouseID, quantity: v['AT Ship'] }],
      channelListings: [
        {
          channelId: channelID,
          price: p.Price * 2,
          costPrice: p.Price,
        },
      ],
    })),
  }));

  const listTranslations = prods.map((p) => ({
    //id: 'asdf',
    externalReference: p.Product,
    languageCode: 'EN',
    translationFields: {
      name: p['Description 1'],
      description: `{"blocks": [{"data": {"text": "This is a description for ${p[
        'Description 1'
      ].replace(/"/g, '\\"')}."}, "type": "paragraph"}]}`,
      seoTitle: p['Description 1'],
      //seoDescription: '',
    },
  }));

  const query = `
      mutation CreateProduct($errorPolicy: ErrorPolicyEnum, $products: [ProductBulkCreateInput!]!) {
        productBulkCreate(errorPolicy: $errorPolicy, products: $products) {
          errors {
            path
            message
          }
          results { 
            product{
              id
              name
              slug
            }
          }
          count
        }
      }
    `;
  const variables = {
    errorPolicy: 'REJECT_EVERYTHING',
    products: listProducts,
  };

  let pos = productMin;
  let maxPos = productMax || listProducts.length;

  while (pos < maxPos) {
    const batch = listProducts.slice(pos, pos + 10);
    variables.products = batch;
    const batchTr = listTranslations.slice(pos, pos + 10);

    try {
      //console.log(variables.products[0]);
      const response = await executeGraphQL(query, { variables });
      pos += batch.length;
      fs.writeFileSync('./currentProductPos.txt', pos.toString(), 'utf8');
      console.log(`products created successfully up to : `, pos);
      createTranslations(batchTr);
    } catch (error) {
      console.error(`Error creating products: %o`, error);
      console.log(`Retrying from ${pos}`); // Stop on error to avoid overwhelming the server
      return;
    }
  }
}

async function createTranslations(translations) {
  const query = `
      mutation TranslateBulkProduct($errorPolicy: ErrorPolicyEnum, $translations: [ProductBulkTranslateInput!]!) {
        productBulkTranslate(errorPolicy: $errorPolicy, translations: $translations) {
          errors {
            path
            message
          }
          results { 
            translation{
              id
              language{
               code
              }
              name
              description
            }
          }
          count
        }
      }
    `;
  const variables = {
    errorPolicy: 'REJECT_EVERYTHING',
    translations: translations,
  };

  try {
    const response = await executeGraphQL(query, { variables });
    console.log(`translation created successfully`);
  } catch (error) {
    console.error(`Error creating products: %o`, error);
    throw error;
  }
}

function lookupCategory(og) {
  let id = null;
  id = categories.find((c) => c.jolar == og)?.id;
  return id;
}

function lookupCollection(og) {
  let id = null;
  id = collections.find((c) => c.jolar == og)?.id;
  return id;
}

function showCount(description, array) {
  console.log(description + ':', array.length);
}

function lookupCat(cat) {
  if (cat == 'Duty Free') return 'DFR';
  else return 'REG';
}

function lookupAttr(slug) {
  let attr = null;
  attr = attributes.find((a) => a.slug == slug);
  return attr;
}

// function lookupProduct(nopId) {
//   let id = null;
//   id = productsSaleor.find((c) => c.privateMetafield == nopId)?.id;
//   return id;
// }

function stripPromo(str) {
  return str.replace(/Promo\d\d-/gi, '');
}
