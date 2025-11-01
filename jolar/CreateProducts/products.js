import slug from 'slug';
import 'dotenv/config';
import fs from 'fs';
import { executeGraphQL } from '../../CreateProducts/graphql.js';
import {
  fetchProductType,
  fetchAllCategories,
  fetchChannel,
  fetchWarehouse,
  fetchAllCollections,
  fetchAllAttributes,
} from '../../CreateProducts/fetchers.js';

import { GetDataFromFile } from './excel.js';

const importImages = true;
const productMin = readPositionFromFile();
const productMax = null;

const namesMap = fs.readFileSync('productNames.json', 'utf-8');
const mapping = JSON.parse(namesMap);

const jsonData = GetDataFromFile('./data1.xlsx');

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

const mainListWithVariants = jsonData.filter(
  (p) =>
    uniqueProducts.includes(p.Product) &&
    p.Discontinued == 0 &&
    p.Price > 0 &&
    p.PType != 'Supply' &&
    p['AT Ship'] >= 1 &&
    p.Product != 'DG0233' // this product was removed from internet (no link found on search results page)
);

fixList(mainListWithVariants);

showCount('variants keeping similar variants >= 1', mainListWithVariants);

const productType = await fetchProductType('clothing');

const categories = await fetchAllCategories();
const collections = await fetchAllCollections();
const attributes = await fetchAllAttributes();
const channelID = await fetchChannel('default-channel'); // Assuming a default channel ID for simplicity
const warehouseID = await fetchWarehouse('Default'); // Assuming a default warehouse ID for simplicity

console.log('Using channel ID:', channelID);
console.log('Using warehouse ID:', warehouseID);

//Creates out.txt with list of bad links
//const resProd = await createListBadLinks();

//Creates mapping file with corrrect list of links
//const fixedLinks = await fixBadLinks();

//await createPicturesFile(bigMainList);

await createProducts(mainListWithVariants);

//console.log(await getPictureList('FE12577'));

async function GetDataFromInternet(productStr) {
  // console.log(productStr);

  if (productStr == 'ML50024Q') {
    productStr = 'ML50024X';
  }

  const result = await fetch(
    `https://www.jolarspeck.com/en/catalogsearch/result/?q=${productStr}`
  );
  const html1 = await result.text();

  const regex = /product-top.*?href="(.+?)"/g;
  let match;
  const urls = [];

  while ((match = regex.exec(html1)) !== null) {
    urls.push(match[1]);
  }
  let theLink = urls.find((u) => u.includes(productStr));
  if (!theLink) {
    theLink = urls[0];
    if (!theLink) {
      console.error('No link found for', productStr);
    }
  }

  const enLink = theLink;
  const frLink = theLink.replace('/en/', '/fr/');

  const enResp = await fetch(enLink);
  const frResp = await fetch(frLink);
  const html = await enResp.text();
  const frHtml = await frResp.text();

  const regex2 = /data-zoom="(.*?)"/g;
  match = undefined;
  const photos = [];

  while ((match = regex2.exec(html)) !== null) {
    photos.push(match[1]);
  }

  const regex3 =
    /itemprop="description">\s*(.*?)\s*<\/div><\/div>   <div class="product-sub-infomation /gms;
  match = undefined;
  let description = [];

  while ((match = regex3.exec(html)) !== null) {
    description.push(match[1]);
  }
  while ((match = regex3.exec(frHtml)) !== null) {
    description.push(match[1]);
  }

  if (description[0] == description[1]) {
    //if not translated, just keep the english one
    description = [description[0]];
  }

  const regex4 = /data-th="Composition">(.*?)<\/td>/;
  match = regex4.exec(frHtml);
  const compositionFr = match ? match[1] : null;
  match = regex4.exec(html);
  const compositionEn = match ? match[1] : null;
  if (compositionEn !== compositionFr) {
    console.log(compositionEn);
  }
  return {
    photos,
    descriptionEn: description[0],
    descriptionFr: description[1],
    compositionEn,
    compositionFr,
  };
}

// async function getPictureList(product) {
//   const map = mapping.find(
//     (m) => m.prod.toLowerCase() == product.toLowerCase()
//   );
//   let newLink;
//   if (map) newLink = map.newLink;
//   else
//     newLink = slug(
//       product +
//         ' ' +
//         stripPromo(bigMainList.find((p) => p.Product == product)['Description'])
//     );

//   const resp = await fetch(`https://www.jolarspeck.com/en/${newLink}`);
//   const html = await resp.text();

//   const regex = /data-zoom="(.*?)"/g;
//   let match = {};
//   const photos = [];

//   while ((match = regex.exec(html)) !== null) {
//     photos.push(match[1]);
//   }
//   return photos;
// }

// function listProductsWithDash(){
//   const products = bigMainList.filter((p) => p.Product.includes('-'));
//   console.log(products.map((p) => p.Product));
// }

// async function createBadLinksFile() {
//   const grouped2 = Object.groupBy(bigMainList, (p) => p.Product);
//   const prods = Object.keys(grouped2).map((key) => ({
//     ...grouped[key][0],
//     variants: grouped[key],
//   }));

//   const mylist = prods.map((p) =>
//     slug(p.Product + ' ' + stripPromo(p['Description']))
//   );

//   const fetchPromises = mylist.map((url) =>
//     fetch(`https://www.jolarspeck.com/en/${url}`)
//   );
//   const responses = await Promise.all(fetchPromises);
//   const data = responses.map((response) => {
//     let r;
//     if (!response.ok) {
//       r = { link: response.url.split('/').pop(), status: response.status };
//     } else {
//       r = { link: response.url.split('/').pop(), status: 'OK' };
//     }
//     return r;
//   });

//   console.log('number of errors:', data.filter((d) => d.status != 'OK').length);
//   fs.writeFileSync(
//     'out.txt',
//     JSON.stringify(
//       data.filter((d) => d.status != 'OK'),
//       null,
//       2
//     )
//   );
// // }

// async function fixBadLinksFiles() {
//   const links = JSON.parse(fs.readFileSync('out.txt', 'utf-8'));
//   const myLinks = links.map((l) => {
//     let prod = l.link.split('-')[0];
//     if (l.link.split('-')[1] == 'p' && prod == 'ml1783') prod = 'ml1783-p';
//     if (prod == 'ml50024q') prod = 'ml50024x';
//     return { prod, link: l.link };
//   });

//   const fetchPromises = myLinks.map((l) =>
//     fetch(`https://www.jolarspeck.com/en/catalogsearch/result/?q=${l.prod}`)
//   );

//   const responses = await Promise.all(fetchPromises);

//   // Cannot use forEach with async/await
//   //responses.forEach(async (r, idx) => {
//   for (let i = 0; i < responses.length; i++) {
//     // get the url of every link after the div with class="product-top"
//     const html = await responses[i].text();
//     const regex = /product-top.*?href="(.+?)"/g;
//     let match;
//     const urls = [];

//     while ((match = regex.exec(html)) !== null) {
//       urls.push(match[1]);
//     }
//     const prod = responses[i].url.split('=').pop();
//     let theLink = urls.find((u) => {
//       const res = u.includes(prod);
//       return res;
//     });
//     if (theLink == undefined) {
//       theLink = urls[0];
//       if (theLink == undefined) {
//         console.error('No link found for', prod);
//         continue;
//       }
//     }

//     myLinks[i].newLink = theLink.split('/').pop();
//   }
//   //console.log(myLinks);
//   fs.writeFileSync('productMap.json', JSON.stringify(myLinks, null, 2));
//   console.log(myLinks.length);
//   return myLinks;
// // }

// async function createPicturesFile(products) {
//   const grouped = Object.groupBy(products, (p) => p.Product);
//   const prods = Object.keys(grouped).map((key) => ({
//     ...grouped[key][0],
//     variants: grouped[key],
//   }));

//   let listProductPhotos = [];

//   for (const p of prods) {
//     const images = (await getPictureList(p.Product)).map((pic, num) => ({
//       alt: (p.Description ?? p['Description 2']) + ' ' + (num + 1),
//       mediaUrl: pic,
//     }));
//     listProductPhotos.push({ product: p.Product, images });
//   }
//   fs.writeFileSync(
//     'productPhotos.json',
//     JSON.stringify(listProductPhotos, null, 2)
//   );
// }

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

  const promises = prods.map(async (p) => {
    const prodData = await GetDataFromInternet(p.Product);
    const prodNames = lookupName(p.Product);
    return {
      name: prodNames.en,
      productType: productType, // clothing for everything
      attributes: [
        {
          externalReference: 'fabric',
          plainText: prodData.compositionEn ?? prodNames.fabric,
        },
      ],

      category: lookupCategory(p.PType),
      collections: [lookupCollection(p.ProductClass)], // Add a collection for the manufacturer
      media: prodData.photos.map((url, index) => ({
        alt: prodNames.en + ' ' + (index + 1),
        mediaUrl: url,
      })),
      slug: slug(p.Product),

      description: `{"blocks": [{"data": {"text": "Description for ${
        prodNames.en.replace(/"/g, '\\"') // replace quotes to avoid JSON issues
      }."}, "type": "paragraph"}]}`,
      privateMetadata: [{ key: 'jolar', value: p.Product }],

      metadata: [
        {
          key: 'mdxFr',
          value: prodData.descriptionFr ?? prodData.descriptionEn,
        },
        { key: 'mdxEn', value: prodData.descriptionEn },
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
          { externalReference: 'size', dropdown: { value: v.Size } },
          { externalReference: 'color', dropdown: { value: v.Color } },
        ],
        sku: v.UPC ?? v.EAN ?? v.Product + v.Size + v.Color,
        externalReference: v.UPC ?? v.EAN ?? v.Product + v.Size + v.Color,
        name: v.Color + ' - ' + v.Size,
        metadata: v.UPC ? [{ key: 'upc', value: v.UPC }] : undefined,
        stocks: [{ warehouse: warehouseID, quantity: v['AT Ship'] }],
        channelListings: [
          {
            channelId: channelID,
            price: v.Price * 2,
            costPrice: v.Price,
          },
        ],
      })),
    };
  });
  console.log(
    `getting ${promises.length * 2} internet pages for ${
      promises.length
    } products`
  );
  const listProducts = await Promise.all(promises);

  const translationList = prods.map((p) => {
    const prodNames = lookupName(p.Product);
    return {
      //id: 'asdf',
      externalReference: p.Product,
      languageCode: 'FR',
      translationFields: {
        name: prodNames.fr,
        description: `{"blocks": [{"data": {"text": "Description pour ${prodNames.fr.replace(
          /"/g,
          '\\"'
        )}."}, "type": "paragraph"}]}`,
        seoTitle: prodNames.fr,
        seoDescription: `Description pour ${prodNames.fr}.`,
      },
    };
  });

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

  if (pos >= maxPos) {
    console.log(
      'All products have already been processed in "./currentProductPos.txt"'
    );
    return;
  }

  while (pos < maxPos) {
    const batch = listProducts.slice(pos, pos + 10);
    variables.products = batch;
    const batchTr = translationList.slice(pos, pos + 10);

    try {
      //console.log(variables.products[0]);
      const response = await executeGraphQL(query, { variables });
      pos += batch.length;
      fs.writeFileSync('./currentProductPos.txt', pos.toString(), 'utf8');
      console.log(`products created successfully up to : `, pos);
      createProductTranslations(batchTr);
    } catch (error) {
      console.error(`Error creating products: %o`, error);
      console.log(`Retrying from ${pos}`); // Stop on error to avoid overwhelming the server
      return;
    }
  }
}

async function createProductTranslations(translations) {
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

async function createVariantTranslations(translations) {
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

function lookupName(productStr) {
  return mapping.find(
    (m) => m.product.toLowerCase() == productStr.toLowerCase()
  );
}

function showCount(description, array) {
  console.log(description + ':', array.length);
}

// function fixCat(cat) {
//   if (cat == 'Duty Free') return 'DFR';
//   else return 'REG';
// }

// function lookupAttr(slug) {
//   let attr = null;
//   attr = attributes.find((a) => a.slug == slug);
//   return attr;
// }

// function lookupProduct(nopId) {
//   let id = null;
//   id = productsSaleor.find((c) => c.privateMetafield == nopId)?.id;
//   return id;
// }

function stripPromo(str) {
  return str.replace(/Promo\d\d-/gi, '');
}

function fixList(list) {
  const result = list.find((p) => p.EAN == '4711168808204' && !p.UPC);
  if (result) {
    result.UPC = '849450065470';
    console.log('Fixed UPC for', result.Product);
  }
}
