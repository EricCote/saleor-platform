import sql from 'mssql';
import { executeGraphQL } from './graphql.js';
import slug from 'slug';
import 'dotenv/config';
import {
  fetchProductType,
  fetchAllCategories,
  fetchChannel,
  fetchWarehouse,
  fetchAllCollections,
} from './fetchers.js';
import fs from 'fs';

const importImages = true;
const productMin = readPositionFromFile();
const productMax = null;

const sqlconn_string = process.env.sqlconn_string;

const productType = await fetchProductType('Default Type');
const categories = await fetchAllCategories();
const collections = await fetchAllCollections();
const channelID = await fetchChannel('Default Channel'); // Assuming a default channel ID for simplicity
const warehouseID = await fetchWarehouse('Default'); // Assuming a default warehouse ID for simplicity

console.log('Using channel ID:', channelID);
console.log('Using warehouse ID:', warehouseID);

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

async function getProducts() {
  try {
    await sql.connect(sqlconn_string);
    const result = await sql.query`
-- (gros travail) with aggregate,  filters the "subjectToAcl" column instead of looking at acl

SELECT innerTable.*,
  STRING_AGG(   FORMAT(pic.id, '0000000') + '_' + pic.SeoFilename  + '.' + (case pic.mimetype WHEN 'image/png' THEN 'png' WHEN 'image/gif' THEN 'gif' ELSE 'jpg' END) ,', ') WITHIN GROUP (ORDER BY m2.productid, m2.displayOrder) AS pictures
FROM
  (
SELECT
    p.id  AS productID,
    p.name AS productName,
    lne.LocaleValue AS nameEn,
    lde.LocaleValue AS descriptionEn,
    lnf.LocaleValue AS nameFr,
    ldf.LocaleValue AS descriptionFr,
    pv.sku, pv.stockquantity, pv.id AS pvId, pv.price, pv.productCost, pv.upc, pv.name AS variantName,
    STRING_AGG(m.CategoryId  ,', ') WITHIN GROUP (ORDER BY m.displayOrder ASC) AS categoryIds

  FROM SDVariationsBiz.dbo.Product AS P
    LEFT JOIN SDVariationsBiz.dbo.Product_Category_Mapping AS M ON M.ProductId = P.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS C ON M.CategoryId = C.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS CP ON C.ParentCategoryId = CP.Id
    LEFT JOIN SDVariationsBiz.dbo.ProductVariant AS PV ON P.Id = PV.ProductId
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lne ON p.Id = lne.EntityId AND lne.LocaleKeyGroup = 'Product' AND lne.LocaleKey='Name' AND lne.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lde ON p.Id = lde.EntityId AND lde.LocaleKeyGroup = 'Product' AND lde.LocaleKey='FullDescription' AND lde.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lnf ON p.Id = lnf.EntityId AND lnf.LocaleKeyGroup = 'Product' AND lnf.LocaleKey='Name' AND lnf.LanguageId=2
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS ldf ON p.Id = ldf.EntityId AND ldf.LocaleKeyGroup = 'Product' AND ldf.LocaleKey='FullDescription' AND ldf.LanguageId=2
  WHERE
     (c.subjectToAcl = 0 or c.SubjectToAcl is null)
    AND (cp.subjectToAcl = 0 or cp.SubjectToAcl is null)
    AND p.subjectToAcl  = 0
    AND (CP.published = 1 OR CP.published is null)
    AND (CP.deleted = 0 OR CP.deleted IS NULL)
    AND (C.published = 1 OR C.published is null)
    AND (C.deleted = 0 OR C.deleted IS NULL)
    AND pv.published = 1
    AND pv.deleted = 0
    AND p.published = 1
    AND p.deleted = 0
    AND pv.price>0
    AND p.id not in (
    SELECT p2.id
    FROM SDVariationsBiz.dbo.Product AS P2
      JOIN SDVariationsBiz.dbo.Product_Category_Mapping M2 ON p2.id=m2.ProductId
    WHERE m2.CategoryId=48
  )

  GROUP BY p.id, p.name, lne.LocaleValue, lde.LocaleValue, lnf.LocaleValue, ldf.LocaleValue,   pv.sku, pv.stockquantity, pv.id, pv.price, pv.productCost, pv.upc,pv.name
) AS innerTable
  LEFT JOIN SDVariationsBiz.dbo.Product_Picture_Mapping AS M2 ON M2.ProductId = innerTable.ProductId
  LEFT JOIN SDVariationsBiz.dbo.Picture AS Pic ON Pic.Id = M2.PictureId
GROUP BY
    innerTable.ProductID,innerTable.ProductName, innerTable.NameEn,innerTable.DescriptionEn,innerTable.NameFr,innerTable.DescriptionFr,   innerTable.sku, innerTable.stockquantity, innerTable.pvId, innerTable.price, innerTable.productCost, innerTable.upc, innerTable.VariantName, innerTable.CategoryIds
ORDER BY innerTable.ProductId

    `;
    return result;
  } catch (err) {
    console.error('SQL error', err);
  } finally {
    await sql.close();
  }
}

async function createProducts(products) {
  const listProducts = products.recordset.map((p) => ({
    name: p.nameFr ?? p.productName,
    productType,
    attributes: [],

    category: lookupCategory(p.categoryIds?.split(', ')[0]), // Use the first category for simplicity
    collections: p.categoryIds?.split(', ').map((c) => lookupCollection(c)), // Add collections if needed
    media: importImages
      ? p.pictures?.split(', ').map((pic, num) => ({
          alt: (p.nameFr ?? p.productName) + ' ' + (num + 1),
          mediaUrl: `https://www.sdvariations.com/content/images/thumbs/${pic}`,
        }))
      : undefined,

    slug: slug(p.nameFr ?? p.productName),

    description: `{"blocks": [{"data": {"text": "Description pour ${(
      p.nameFr ?? p.productName
    ).replace(/"/g, '\\"')}."}, "type": "paragraph"}]}`,
    privateMetadata: [{ key: 'nopId', value: p.productID }],
    metadata: [
      { key: 'mdxFr', value: '<div>\n' + p.descriptionFr + '\n</div>' },
      { key: 'mdxEn', value: '<div>\n' + p.descriptionEn + '\n</div>' },
    ],

    externalReference: p.productID,
    channelListings: [
      {
        channelId: channelID,
        isPublished: true,
        visibleInListings: true,
        isAvailableForPurchase: true,
      },
    ],
    variants: [
      {
        attributes: [],
        sku: p.sku,
        name: p.variantName,
        externalReference: p.pvId,
        metadata: p.upc ? [{ key: 'upc', value: p.upc }] : undefined,
        privateMetadata: [{ key: 'nopId', value: p.pvId }],
        stocks: [{ warehouse: warehouseID, quantity: p.stockquantity }],
        channelListings: [
          {
            channelId: channelID,
            price: p.price,
            costPrice: p.productCost,
          },
        ],
      },
    ],
  }));

  const listTranslations = products.recordset.map((p) => ({
    //id: 'asdf',
    externalReference: p.productID,
    languageCode: 'EN',
    translationFields: {
      name: p.nameEn ?? p.name,
      description: `{"blocks": [{"data": {"text": "This is a description for ${(
        p.nameEn ?? p.productName
      ).replace(/"/g, '\\"')}."}, "type": "paragraph"}]}`,
      seoTitle: p.nameEn ?? p.name,
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
    }
  }
}

const products = await getProducts();
const resProd = await createProducts(products);

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

function lookupCategory(nopId) {
  let id = null;
  id = categories.find((c) => c.nopId == nopId)?.id;
  return id;
}

function lookupCollection(nopId) {
  let id = null;
  id = collections.find((c) => c.nopId == nopId)?.id;
  return id;
}

// function lookupProduct(nopId) {
//   let id = null;
//   id = productsSaleor.find((c) => c.privateMetafield == nopId)?.id;
//   return id;
// }
