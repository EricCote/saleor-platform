import { executeGraphQL } from '../../CreateProducts/graphql.js';
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
} from '../../CreateProducts/fetchers.js';
import { GetDataFromFile } from './excel.js';

const args = process.argv;

const filePath = args[2];

if (!filePath) {
  console.error('Please provide the path to the Excel file as an argument.');
  process.exit(1);
}

// The first element (index 0) is 'node'
// The second element (index 1) is the full path to your script
// Subsequent elements (from index 2 onwards) are your custom arguments

const productType = await fetchProductType('clothing');

const categories = await fetchAllCategories();
const collections = await fetchAllCollections();
const attributes = await fetchAllAttributes();
const channelID = await fetchChannel('default-channel'); // Assuming a default channel ID for simplicity
const warehouseID = await fetchWarehouse('Default');
const namesMap = fs.readFileSync('productNames.json', 'utf-8');
const mapping = JSON.parse(namesMap);

const jsonData = GetDataFromFile(filePath);

let totalStockChanges = 0;
let totalCreateVariant = 0;
let totalCreateProduct = 0;

const mainList = jsonData.filter(
  (p) =>
    p['AT Ship'] >= 20 && //More than 20 in stock
    p.Discontinued == 0 && //Not discontinued
    p.Price > 0 && //Has a price
    p.PType != 'Supply' //Not a supply
  // p.PGroup != 'Discontinué' &&
  // p.PGroup != 'Disc'
);

//groups the main list by product
const grouped = Object.groupBy(mainList, (p) => p.Product);
const uniqueProducts = Object.keys(grouped);

showCount('Unique Products', uniqueProducts);
showCount('With variants over 20', mainList);

const existingProducts = await getExistingSaleorProducts();
const existingProductIds = existingProducts.map((p) => p.externalReference);

let productIdsToSync = [...uniqueProducts, ...existingProductIds];
productIdsToSync = Object.keys(Object.groupBy(productIdsToSync, (p) => p)); //remove duplicates

showCount('Existing products in Saleor', existingProducts);

const mainListWithVariants = jsonData.filter(
  (p) =>
    productIdsToSync.includes(p.Product) &&
    p.Discontinued == 0 &&
    p.Price > 0 &&
    p.PType != 'Supply' &&
    p['AT Ship'] >= 0 //include 0 stocks for sync
);

console.log(
  'products with no upc or ean:',
  mainListWithVariants
    .filter((p) => p.UPC == null && p.EAN == null)
    .map((p) => p.Product)
);

showCount('variants keeping similar variants >= 0', mainListWithVariants);

const groupingProducts = Object.groupBy(mainListWithVariants, (p) => p.Product);

const groupedProducts = Object.entries(groupingProducts).map(
  ([key, value]) => ({
    product: key,
    name: value[0].Description,
    variants: value,
  })
);

console.log(groupedProducts.length);

const newProducts = findNewProducts(groupedProducts);

for (const prod of newProducts) {
  await createProduct(prod);
}

const newVariants = findNewVariants(groupedProducts);
console.log(newVariants);

for (const p of newVariants) {
  await createVariants(p);
}

const existingVariants = await getExistingSaleorVariants();

await updateStocks(mainListWithVariants);

function findRemovedProducts(existingProducts, groupedProducts) {
  const removedProducts = existingProducts.filter(
    (ep) => !groupedProducts.find((gp) => gp.product == ep.externalReference)
  );
  console.log('Products to remove:', removedProducts.length);
  return removedProducts;
}

//console.log('New products to create:', newProducts.length);

//findNewVariants(groupedProducts);
//await GetDataFromInternet('TA1506');

async function getExistingSaleorProducts() {
  const allProducts = [];
  const BATCH_SIZE = 100;
  let hasNextPage = true;
  let endCursor = null;

  const query = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          slug
          nopId: privateMetafield(key: "nopId")
          jolar: privateMetafield(key: "jolar")
          translation(languageCode: FR) {
            description
            name
          }
          externalReference
          description
          media(sortBy: {direction: ASC, field: ID}) {
            alt
            id
            url
          }
          productVariants(first: 50) {
            edges {
              node {
                name
                stocks {
                  quantity
                  id
                }
                sku
                quantityAvailable(countryCode: CA)
                externalReference
                id
                channelListings {
                  channel {
                    name
                    id
                    isActive
                  }
                  costPrice {
                    amount
                    currency
                  }
                  price {
                    amount
                    currency
                  }
                  priorPrice {
                    amount
                    currency
                  }
                }
              }
            }
          }
          metadata {
            key
            value
          }
        }
      }
    }
  }

  `;

  while (hasNextPage) {
    const variables = {
      first: BATCH_SIZE,
      channel: 'default-channel',
      after: endCursor,
    };

    try {
      const result = await executeGraphQL(query, { variables });

      allProducts.push(...result.products.edges.map((edge) => edge.node));

      hasNextPage = result.products.pageInfo.hasNextPage;
      endCursor = result.products.pageInfo.endCursor;
    } catch (error) {
      console.error('Error fetching products:', error);
      hasNextPage = false; // Stop on error to avoid infinite loop
    }
  }
  return allProducts.filter((p) => p.jolar != null);
}

async function getExistingSaleorVariants() {
  const allVariants = [];
  const BATCH_SIZE = 100;
  let hasNextPage = true;
  let endCursor = null;

  const query = `
  query ProductVariants($first: Int!, $after: String, $channel: String) {
     productVariants (first: $first, after: $after, channel: $channel) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          jolar: privateMetafield(key: "jolar")
          externalReference
        }
      }
    }
  }
  `;

  while (hasNextPage) {
    const variables = {
      first: BATCH_SIZE,
      channel: 'default-channel',
      after: endCursor,
    };

    try {
      const result = await executeGraphQL(query, { variables });

      allVariants.push(
        ...result.productVariants.edges.map((edge) => edge.node)
      );

      hasNextPage = result.productVariants.pageInfo.hasNextPage;
      endCursor = result.productVariants.pageInfo.endCursor;
    } catch (error) {
      console.error('Error fetching products:', error);
      hasNextPage = false; // Stop on error to avoid infinite loop
    }
  }
  return allVariants; //allVariants.filter((v) => v.jolar != null);
}

///////

//Finds the list of products to add to Saleor
function findNewProducts(groupedProducts) {
  const newProducts = groupedProducts.filter(
    (p) => !existingProducts.find((e) => e.externalReference == p.product)
  );
  return newProducts;
}

function findNewVariants(groupedProducts) {
  let total = 0;
  const newCollectedVariants = [];
  for (const prod of groupedProducts) {
    const newVariants = [];
    for (const v of prod.variants.filter((v) => v['AT Ship'] > 0)) {
      if (
        !existingProducts

          .flatMap((e) => e.productVariants.edges.map((edge) => edge.node))
          .find(
            (ev) =>
              ev.externalReference ==
              (v.UPC ?? v.EAN ?? v.Product + v.Size + v.Color)
          )
      ) {
        if (existingProducts.find((p) => p.externalReference == prod.product)) {
          newVariants.push(v);
        }
      }
      if (newVariants.length > 0) {
        newCollectedVariants.push({
          product: prod.product,
          variants: newVariants,
        });
        total += newVariants.length;
      }
    }
    console.log('Total new variants to create:', total);
    return newCollectedVariants;
  }
}

async function updateStocks(variants) {
  let stocks = variants.map((v) => ({
    warehouseId: warehouseID,
    variantExternalReference: v.UPC ?? v.EAN ?? v.Product + v.Size + v.Color,
    quantity: v['AT Ship'],
  }));

  stocks = stocks.filter((s) =>
    existingVariants.find(
      (ev) => ev.externalReference == s.variantExternalReference
    )
  );

  const mutation = `
    mutation UpdateStocks($errorPolicy: ErrorPolicyEnum, $stocks: [StockBulkUpdateInput!]!) {
      stockBulkUpdate(
      errorPolicy: $errorPolicy,
      stocks: $stocks
      ) {
        errors {
          field
          message
          code
        }
        count
      } 
    }
    `;

  const variables = {
    errorPolicy: 'REJECT_EVERYTHING',
    stocks,
  };

  //fs.writeFileSync('out.txt', JSON.stringify(variables, null, 2));
  const result = await executeGraphQL(mutation, { variables });
  totalStockChanges = result.stockBulkUpdate.count;
  //console.log('Stocks updated:', result.stockBulkUpdate.count);
}

async function GetDataFromInternet(productStr) {
  console.log('Fetching data for', productStr);
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

async function checkVariantExistance(variants) {
  for (const v of variants) {
    const query = `
    query MyQuery($sku: String) {
      productVariant(sku: $sku) {
        id
        externalReference
        sku
        name
        channelListings {
          price {
            amount
            currency
          }
          costPrice {
            amount
            currency
          }
        }
        pricing {
          price {
            net {
              amount
              currency
            }
            gross {
              amount
              currency
            }
          }
        }
        stocks {
          quantity
          warehouse {
            name
            slug
          }
        }
      }
    }

`;
    const variables = {
      sku: v.UPC ?? v.EAN ?? v.Product + v.Size + v.Color,
    };
    const result = await executeGraphQL(query, { variables });
    if (result.productVariant) {
      if (v['AT Ship'] != result.productVariant.stocks[0]?.quantity) {
        // console.log('Need to update stock for', v.UPC);
        totalStockChanges++;
      } else {
        //  console.log('Stock stays for', v.UPC);
        totalStockStays++;
      }
      //   await checkPriceChange(v);
    } else {
      await createVariant(v);
    }
  }
}

async function updateStock(variant) {}

async function createVariants(product) {
  const mutation = `
    mutation CreateProductVariant($errorPolicy: ErrorPolicyEnum, $product: ID!, $variants: [ProductVariantBulkCreateInput!]!) {
      productVariantBulkCreate(
        errorPolicy: $errorPolicy
        product: $product
        variants: $variants
      ) {
        errors {
          field
          message
          code
        }
        productVariants {
          id
          name
          sku
        }
        count
      }
    }
  `;

  const variantList = product.variants.map((v) => ({
    attributes: [
      { externalReference: 'size', plainText: v.Size },
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
  }));

  const variables = {
    errorPolicy: 'REJECT_EVERYTHING',
    product: lookupProductId(product.product),
    variants: variantList,
  };

  console.log(JSON.stringify(variables, null, 2));

  const result = await executeGraphQL(mutation, { variables });

  totalCreateVariant += result.productVariantBulkCreate.count;
}

async function createProduct(prod) {
  const p = prod;
  const prodData = await GetDataFromInternet(p.product);
  const prodNames = lookupName(p.product);
  const productToCreate = [
    {
      name: prodNames.en,
      productType: productType, // clothing for everything
      attributes: [
        {
          externalReference: 'fabric',
          plainText: prodData.compositionEn ?? prodNames.fabric,
        },
      ],

      category: lookupCategory(p.variants[0].PType),
      collections: [lookupCollection(p.variants[0].ProductClass)], // Add a collection for the manufacturer
      media: prodData.photos.map((url, index) => ({
        alt: prodNames.en + ' ' + (index + 1),
        mediaUrl: url,
      })),
      slug: slug(p.product),

      description: `{"blocks": [{"data": {"text": "Description for ${
        prodNames.en.replace(/"/g, '\\"') // replace quotes to avoid JSON issues
      }."}, "type": "paragraph"}]}`,
      privateMetadata: [{ key: 'jolar', value: p.product }],

      metadata: [
        {
          key: 'mdxFr',
          value: prodData.descriptionFr ?? prodData.descriptionEn,
        },
        { key: 'mdxEn', value: prodData.descriptionEn },
      ],

      externalReference: p.product,
      channelListings: [
        {
          channelId: channelID,
          isPublished: true,
          visibleInListings: true,
          isAvailableForPurchase: true,
        },
      ],
      variants: p.variants
        .filter((v) => v['AT Ship'] > 0)
        .map((v) => ({
          attributes: [
            { externalReference: 'size', plainText: v.Size },
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
    },
  ];

  const mutation = `
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
    products: productToCreate,
  };

  const result = await executeGraphQL(mutation, { variables });
  const newId = result.productBulkCreate.results[0].product.id;
  console.log('Created product ID:', newId);

  const mutationTr = `
      mutation TranslateProduct($id: ID!, $input: TranslationInput!, $languageCode: LanguageCodeEnum!) {
        productTranslate(id: $id, input: $input, languageCode: $languageCode) {
          errors {
            field
            message
            code
          }
          product { 
            id
            slug
          }
        }
      }
    `;
  const variablesTr = {
    id: newId,
    input: {
      name: prodNames.fr,
      description: `{"blocks": [{"data": {"text": "Description pour ${prodNames.fr.replace(
        /"/g,
        '\\"'
      )}."}, "type": "paragraph"}]}`,
      seoTitle: prodNames.fr,
      seoDescription: `Description pour ${prodNames.fr}`,
    },
    languageCode: 'FR',
  };

  const resultTr = await executeGraphQL(mutationTr, { variables: variablesTr });
  totalCreateProduct++;
  console.log('Created product:', p.product, prodNames.en, prodNames.fr);
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

function lookupProductId(productStr) {
  return existingProducts.find((p) => p.externalReference == productStr)?.id;
}

function showCount(description, array) {
  console.log(description + ':', array.length);
}

//Block to detect products with same UPC
function detectSameUPC() {
  const groupingUPC = Object.groupBy(
    mainListWithVariants,
    (p) => p.UPC ?? p.EAN ?? p.Product + p.Size + p.Color
  );
  const groupedUPC = Object.entries(groupingUPC).map(([key, value]) => ({
    key,
    variants: value,
  }));
  const filteredUPC = groupedUPC.filter((g) => g.variants.length > 1);
  console.log(
    'products with same UPC: ',
    filteredUPC.map((p) => p.key)
  );
}

console.log('--- SUMMARY ---');
console.log('products to Create', totalCreateProduct);
console.log('variants to Create', totalCreateVariant);
console.log('Stock changes needed:', totalStockChanges);
