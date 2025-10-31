// rename existing size attribute to sizeog (manual)
// get the list of sizes (in code)
// add size attribute with list choice
// assign size to clothing product type

// modify existing products for sizes2
// remove old size attribute
// rename size2 to size (name and slug)

import { executeGraphQL } from '../../CreateProducts/graphql.js';
import 'dotenv/config';
import {
  fetchProductType,
  fetchAttribute,
} from '../../CreateProducts/fetchers.js';

const mySizes = [
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

await modifySizeAttribute();

const productTypeId = await fetchProductType('Clothing');
const sizeId = await fetchAttribute('Size');

const result1 = await assignToProductType(sizeId, productTypeId);

const result2 = await updateAllVariantsWithSize();
// console.log(`Fetched ${result.length} variants.`);
// console.dir(result.slice(0, 10), { depth: null });
console.log('DONE! All variants updated.');
await deleteSizeOg();

await createFrenchTranslations();

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
      values: mySizes.map((s) => ({
        externalReference: s.id,
        name: s.en,
        //  slug: slug(s.en),
      })),
    },
  };

  async function createAttribute(variables, frName) {
    //Create Attribute
    const result = await executeGraphQL(mutation, { variables: variables });

    //Create Metadata
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
    const metaVar = {
      id: result.attributeCreate.attribute.id,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVar });

    // create translation for attribute
    const transVar = {
      id: result.attributeCreate.attribute.id,
      input: { name: frName },
      languageCode: 'FR',
    };

    //if size, add the sizes
    if (frName == 'Taille') {
      TranslateSizes(result.attributeCreate.attribute.id);
    }

    const transResult = await executeGraphQL(transMutation, {
      variables: transVar,
    });

    return result.attributeCreate.attribute.id;
  }

  const sizeId = await createAttribute(size, 'Taille');

  console.log('Created Size Attribute with ID:', sizeId);

  return sizeId;
}

//Connect attribute to product type
async function assignToProductType(attributeId, productTypeId) {
  const mutation = `
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

  const variables = {
    id: productTypeId,
    operations: [
      {
        id: attributeId,
        type: 'VARIANT',
      },
    ],
  };

  const mutation2 = `
mutation updateProductAttributeAssignment($id: ID!, $operations: [ProductAttributeAssignmentUpdateInput!]!) {
  productAttributeAssignmentUpdate(
    operations: $operations
    productTypeId: $id
  ) 
  {
    productType {
      id
      name
      assignedVariantAttributes(variantSelection: ALL) {
        variantSelection
        attribute {
          id
          name
        }
      }
    }
  }
}
  `;

  const variables2 = {
    id: productTypeId,
    operations: [{ id: attributeId, variantSelection: true }],
  };

  await executeGraphQL(mutation, { variables });
  await executeGraphQL(mutation2, { variables: variables2 });
}

async function TranslateSizes() {
  const sizes = mySizes.map((s) => ({
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

  const variables = { errorPolicy: 'REJECT_EVERYTHING', translations: sizes };

  const result = await executeGraphQL(mutation, {
    variables,
  });

  console.log('res: ', result);
}

async function modifySizeAttribute() {
  const mutation = `
    mutation UpdateAttribute($externalReference: String!, $input: AttributeUpdateInput!) {
      attributeUpdate(externalReference: $externalReference, input: $input) {
        attribute {
          id
          name
          externalReference
          slug
        }
      }
    }
  `;
  const variables = {
    externalReference: 'size',
    input: {
      name: 'Sizeog',
      slug: 'sizeog',
      externalReference: 'sizeog',
    },
  };
  await executeGraphQL(mutation, { variables });
  console.log('Size attribute modified');
}

async function updateAllVariantsWithSize() {
  const query = ` 
    query GetAllProductVariants($first: Int!, $after: String) {
      productVariants(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            externalReference
            sku
            assignedAttributes {
              ... on AssignedPlainTextAttribute {
                value
                fr: translation(languageCode: FR)
              }
            }
          }
        }
      }
    }
  `;

  let allVariants = [];
  let hasNextPage = true;
  let cursor = null;
  const pageSize = 100;

  while (hasNextPage) {
    const variables = {
      first: pageSize,
      after: cursor,
    };

    const data = await executeGraphQL(query, { variables });

    const variants = data.productVariants.edges.map((edge) => edge.node);
    allVariants = allVariants.concat(variants);

    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  console.log(`Fetched ${allVariants.length} variants.`);
  console.log('Working...');
  const variantMutation = `
  mutation updateProductVariant($id: ID, $input: ProductVariantInput!) {
  productVariantUpdate(id: $id, input: $input) {
    errors {
      field
      message
      code
    }
    productVariant {
      id
      name
    }
  }
}`;

  for (const v of allVariants) {
    const variables = {
      id: v.id,
      name: v.name,
      input: {
        attributes: [
          {
            id: sizeId,
            values: [v.assignedAttributes[0].value],
          },
        ],
      },
    };

    await executeGraphQL(variantMutation, { variables });
  }
}

async function deleteSizeOg() {
  const sizeOgId = await fetchAttribute('sizeog');

  const mutation = `
    mutation DeleteAttribute($id: ID!) {
      attributeDelete(id: $id) {
        errors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: sizeOgId,
  };

  await executeGraphQL(mutation, { variables });
  console.log('Deleted sizeog attribute');
}

async function createFrenchTranslations() {
  const query = ` 
    query GetAllProductVariants($first: Int!, $after: String) {
      productVariants(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            externalReference
            sku
            assignedAttributes {
              ... on AssignedSingleChoiceAttribute {
                attribute {
                  name
                  slug
                  externalReference
                }
                value {
                  en: name
                  fr: translation(languageCode: FR)
                  slug
                }
              }
            }
          }
        }
      }
    }
  `;

  let allVariants = [];
  let hasNextPage = true;
  let cursor = null;
  const pageSize = 100;

  while (hasNextPage) {
    const variables = {
      first: pageSize,
      after: cursor,
    };

    const data = await executeGraphQL(query, { variables });

    const variants = data.productVariants.edges.map((edge) => edge.node);
    allVariants = allVariants.concat(variants);

    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  const flatVariants = allVariants.map((v) => {
    const colorAttr = v.assignedAttributes.find(
      (attr) => attr.attribute.slug === 'color'
    );
    const colorName = colorAttr ? colorAttr.value.fr : null;
    const sizeAttr = v.assignedAttributes.find(
      (attr) => attr.attribute.slug === 'size'
    );
    const sizeName = sizeAttr ? sizeAttr.value.fr : null;

    return {
      id: v.id,
      input: { name: `${colorName} - ${sizeName}` },
      languageCode: 'FR',
    };
  });

  console.log(`Fetched ${flatVariants.length} variants.`);
  console.dir(flatVariants.slice(0, 10), { depth: null });
  console.log('Working on translations...');

  const translationMutation = `
  mutation translateProductVariant(
$id: ID!
$input: NameTranslationInput!
$languageCode: LanguageCodeEnum!)
{
  productVariantTranslate(id:$id, input:$input, languageCode: $languageCode){
    errors{
      field
      message 
      code}
    productVariant{
      id
    	name
      sku
    }
  }
  
}
  `;

  for (const variables of flatVariants) {
    await executeGraphQL(translationMutation, { variables });
  }
  console.log('All translations done.');
}
