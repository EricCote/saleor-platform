import { executeGraphQL } from '../../CreateProducts/graphql.js';
import 'dotenv/config';
import { GetDataFromFile } from './excel.js';

const jsonRef = GetDataFromFile('./dataRef.xlsx');

const sizeList = [
  { id: 's001', fr: 'Taille Unique', en: 'O/S', len: 100 },
  { id: 's002', fr: 'XS', en: 'XS', len: 100 },
  { id: 's003', fr: 'S', en: 'S', len: 100 },
  { id: 's004', fr: 'M', en: 'M', len: 100 },
  { id: 's005', fr: 'L', en: 'L', len: 100 },
  { id: 's006', fr: 'XL', en: 'XL', len: 100 },
  { id: 's007', fr: 'XXL', en: 'XXL', len: 100 },
  { id: 's008', fr: '1X', en: '1X', len: 100 },
  { id: 's009', fr: '2X', en: '2X', len: 100 },
  { id: 's010', fr: '3X', en: '3X', len: 100 },
  { id: 's011', fr: 'QUEEN', en: 'QUEEN', len: 100 },
  { id: 's012', fr: 'S/M', en: 'S/M', len: 100 },
  { id: 's013', fr: 'M/L', en: 'M/L', len: 100 },
  { id: 's014', fr: 'L/XL', en: 'L/XL', len: 100 },
  { id: 's015', fr: 'SM', en: 'SM', len: 100 },
  { id: 's016', fr: 'ML', en: 'ML', len: 100 },
  { id: 's017', fr: '1X/2X', en: '1X/2X', len: 100 },
  { id: 's018', fr: '2X/3X', en: '2X/3X', len: 100 },
  { id: 's019', fr: '3X/4X', en: '3X/4X', len: 100 },
];

const metaMutation = `
    mutation UpdatePrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
      updatePrivateMetadata(id: $id, input: $input) {
        errors {
          field 
          message 
          code
        }
        item {
          privateMetadata {
            key
            value
          }
        }
      }
    }
  `;

const colors1 = Object.groupBy(jsonRef, (c) => c.Color);
const colorList = Object.keys(colors1).map((el, idx) => ({
  id: `c${String(idx).padStart(3, '0')}`,
  fr: colors1[el][0].Color2,
  en: colors1[el][0].Color,
  len: colors1[el].length,
}));

//Remplace certaines traductions
//Seulement utile quand la langue par default est le francais
// colorList.find((c) => c.en == 'Black-Vintage Rose').fr = 'Noir/Vieux Rose';
// colorList.find((c) => c.en == 'Vintage Rose').fr = 'Rose Vieilli';
// colorList.find((c) => c.en == 'Mauve').fr = 'Mauve.';

// console.log('-------------------', colorList.length);

// const colors2 = Object.groupBy(colorList, (c) => c.fr);

// const colorList2 = Object.keys(colors2).map((el) => colors2[el]);
// console.log(colorList2.filter((el) => el.length > 1));

// exit();

async function createAttributes() {
  const mutation = `
    mutation AttributeCreate($input: AttributeCreateInput!) {
      attributeCreate(input: $input) {
        attribute {
          id
          name
          slug
          choices(first: 100) {
            edges {
              node {
                name
                id
              }
            }
          }
        }
        errors {
          field
          message
        }
      }
    }
  `;
  const transMutation = `
    mutation TranslateAttribute($id: ID!, $input: NameTranslationInput!, $languageCode: LanguageCodeEnum!) {
      attributeTranslate(id: $id, input: $input, languageCode: $languageCode) {
        attribute {
          id
          name
          slug
        }
        errors {
          field
          message
        }
      }
    }
  `;

  const size = {
    input: {
      name: 'Size',
      slug: 'size',
      externalReference: 'size',
      type: 'PRODUCT_TYPE',
      inputType: 'DROPDOWN', // or "TEXT", "BOOLEAN", etc.
      isVariantOnly: true,
      values: sizeList.map((s) => ({ name: s.en, externalReference: s.id })),
    },
  };
  const color = {
    input: {
      name: 'Color',
      slug: 'color',
      externalReference: 'color',
      type: 'PRODUCT_TYPE',
      inputType: 'DROPDOWN', // or "TEXT", "BOOLEAN", etc.
      isVariantOnly: true,
      values: colorList.map((c) => ({ name: c.en, externalReference: c.id })),
    },
  };
  const fabric = {
    input: {
      name: 'Fabric',
      slug: 'fabric',
      externalReference: 'fabric',
      type: 'PRODUCT_TYPE',
      inputType: 'PLAIN_TEXT', // or "TEXT", "BOOLEAN", etc.
    },
  };

  async function createAttribute(variables, frName) {
    const result = await executeGraphQL(mutation, { variables: variables });

    const metaVar = {
      id: result.attributeCreate.attribute.id,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVar });

    const transVar = {
      id: result.attributeCreate.attribute.id,
      input: { name: frName },
      languageCode: 'FR',
    };

    const transResult = await executeGraphQL(transMutation, {
      variables: transVar,
    });

    return result.attributeCreate.attribute.id;
  }

  const sizeId = await createAttribute(size, 'Taille');

  const colorId = await createAttribute(color, 'Couleur');
  const fabricId = await createAttribute(fabric, 'Tissu');

  return {
    productAttributes: [fabricId],
    variantAttributes: [sizeId, colorId],
  };
}

async function createProductType(name, slug, attributeList, variantList) {
  const mutation = `
    mutation CreateProductType($input: ProductTypeInput!) {
      productTypeCreate(input: $input) {
        productType {
          id
          name
        }
        errors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      name: name,
      slug: slug,
      hasVariants: true, // Set to true if your courses have variants (e.g., different levels)
      isDigital: false, // Set to true for digital products
      isShippingRequired: true, // Set to false if shipping is not required
      taxCode: 'TVQ', // Optional: set a tax code if needed
      productAttributes: attributeList,
    },
  };

  const result = await executeGraphQL(mutation, { variables });

  const myId = result.productTypeCreate.productType.id;

  const metaVar = {
    id: myId,
    input: [{ key: 'jolar', value: 'true' }],
  };

  await executeGraphQL(metaMutation, { variables: metaVar });

  const mutation2 = `
    mutation AssignProductAttribute(
      $id: ID!
      $operations: [ProductAttributeAssignInput!]!
    ) {
      productAttributeAssign(productTypeId: $id, operations: $operations) { 
        productType {
          id
        }
      }
    }
  `;

  const variables2 = {
    id: myId,
    operations: variantList.map((id) => ({
      id,
      type: 'VARIANT',
    })),
  };

  await executeGraphQL(mutation2, { variables: variables2 });
}

async function translateAttributes() {
  const colors = colorList.map((c) => ({
    externalReference: c.id,
    languageCode: 'FR',
    translationFields: { name: c.fr },
  }));
  const sizes = sizeList.map((s) => ({
    externalReference: s.id,
    languageCode: 'FR',
    translationFields: { name: s.fr },
  }));
  const mutation = `
    mutation BulkTranslateAttributeValue($errorPolicy: ErrorPolicyEnum, $translations: [AttributeValueBulkTranslateInput!]!){
      attributeValueBulkTranslate(errorPolicy: $errorPolicy, translations: $translations){
        count
        errors {
          path
          message
          code
        }         
      }
    }
  `;

  const variables = {
    errorPolicy: 'REJECT_EVERYTHING',
    translations: [...colors, ...sizes],
  };

  const result = await executeGraphQL(mutation, {
    variables,
  });

  console.log('res: ', result);
}

const res = await createAttributes();
createProductType(
  'Clothing',
  'clothing',
  res.productAttributes,
  res.variantAttributes
);

await translateAttributes();
