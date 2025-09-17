import { executeGraphQL } from './graphql.js';
import 'dotenv/config';
import { GetDataFromFile } from './excel.js';

const jsonRef = GetDataFromFile('./dataRef.xlsx');

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
colorList.find((c) => c.en == 'Black-Vintage Rose').fr = 'Noir/Vieux Rose';
colorList.find((c) => c.en == 'Vintage Rose').fr = 'Rose Vieilli';
colorList.find((c) => c.en == 'Mauve').fr = 'Mauve.';

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
      name: 'Taille',
      slug: 'size',
      externalReference: 'size',
      type: 'PRODUCT_TYPE',
      inputType: 'PLAIN_TEXT', // or "TEXT", "BOOLEAN", etc.
      isVariantOnly: true,
    },
  };
  const color = {
    input: {
      name: 'Couleur',
      slug: 'color',
      externalReference: 'color',
      type: 'PRODUCT_TYPE',
      inputType: 'DROPDOWN', // or "TEXT", "BOOLEAN", etc.
      isVariantOnly: true,
      values: colorList.map((c) => ({ name: c.fr, externalReference: c.id })),
    },
  };
  const fabric = {
    input: {
      name: 'Tissu',
      slug: 'fabric',
      externalReference: 'fabric',
      type: 'PRODUCT_TYPE',
      inputType: 'PLAIN_TEXT', // or "TEXT", "BOOLEAN", etc.
    },
  };

  async function createAttribute(variables, enName) {
    const result = await executeGraphQL(mutation, { variables: variables });

    const metaVar = {
      id: result.attributeCreate.attribute.id,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVar });

    const transVar = {
      id: result.attributeCreate.attribute.id,
      input: { name: enName },
      languageCode: 'EN',
    };

    //if color
    if (enName == 'Color') {
      addEnglishColors(result.attributeCreate.attribute.id);
    }

    const transResult = await executeGraphQL(transMutation, {
      variables: transVar,
    });

    return result.attributeCreate.attribute.id;
  }

  const sizeId = await createAttribute(size, 'Size');

  const colorId = await createAttribute(color, 'Color');
  const fabricId = await createAttribute(fabric, 'Fabric');

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

async function addEnglishColors() {
  const colors = colorList.map((c) => ({
    externalReference: c.id,
    languageCode: 'EN',
    translationFields: { name: c.en },
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

  const variables = { errorPolicy: 'REJECT_EVERYTHING', translations: colors };

  const result = await executeGraphQL(mutation, {
    variables,
  });

  console.log('res: ', result);
}

const res = await createAttributes();
createProductType(
  'Vêtement',
  'garment',
  res.productAttributes,
  res.variantAttributes
);

addEnglishColors();
