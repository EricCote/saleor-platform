import { executeGraphQL } from './graphql.js';

const SALEOR_API_URL = 'http://localhost:8000/graphql/';
const randomNum = Math.floor(Math.random() * 1000);
const randomBase64 = Buffer.from(String(randomNum)).toString('base64');

async function createAttributes() {
  let productAttributes = [];
  let privateAttributes = [];

  const mutation = `
    mutation AttributeCreate($input: AttributeCreateInput!) {
      attributeCreate(input: $input) {
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
  const startDate = {
    input: {
      name: 'Start Date',
      slug: 'start-date',
      type: 'PRODUCT_TYPE',
      inputType: 'DATE', // or "TEXT", "BOOLEAN", etc.
      filterableInDashboard: true, // Set to true if you want this attribute to be filterable in the dashboard
      filterableInStorefront: true, // Set to true if you want this attribute to be filterable in the storefront
      valueRequired: true, // Set to true if the attribute is required
    },
  };

  const result1 = await executeGraphQL(mutation, { variables: startDate });

  privateAttributes.push(result1.attributeCreate.attribute.id);

  const duration = {
    input: {
      name: 'Duration',
      slug: 'duration',
      type: 'PRODUCT_TYPE',
      inputType: 'NUMERIC', // or "TEXT", "BOOLEAN", etc.
      //  filterableInDashboard: true, // Set to true if you want this attribute to be filterable in the dashboard
      //   filterableInStorefront: true, // Set to true if you want this attribute to be filterable in the storefront

      valueRequired: true, // Set to true if the attribute is required
    },
  };

  const result2 = await executeGraphQL(mutation, { variables: duration });
  productAttributes.push(result2.attributeCreate.attribute.id);
  return { productAttributes, privateAttributes };
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
      isDigital: true, // Set to true for digital products
      isShippingRequired: false, // Set to false if shipping is not required
      taxCode: 'general', // Optional: set a tax code if needed
      productAttributes: attributeList.productAttributes,
    },
  };

  const result = await executeGraphQL(mutation, { variables });

  const myId = result.productTypeCreate.productType.id;

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
    operations: attributeList.privateAttributes.map((id) => ({
      id,
      type: 'VARIANT',
    })),
  };

  await executeGraphQL(mutation2, { variables: variables2 });
}

async function fetchChannel(name) {
  const query = `
   query  {
      channels {
            id
            name
            slug
            currencyCode
      }
    }
`;
  const response = await executeGraphQL(query, {});
  const channels = response.channels;
  const channel = channels.find((c) =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );
  return channel?.id;
}

async function fetchCategories() {
  const query = `
    query {
      categories(first: 10) {
        edges {
          node {
            id
            name
            slug
          }
        }
      }
    }
  `;
  const response = await executeGraphQL(query, {});
  return response.categories.edges.map((edge) => edge.node);
}

async function fetchProductType(name) {
  const query = `
    query ($filter: ProductTypeFilterInput) {
      productTypes(first: 1, filter: $filter) {
        edges {
          node {
            id
            name
            slug
          }
        }
      }
    }
  `;
  const variables = {
    filter: { search: name },
  };

  const result = await executeGraphQL(query, { variables });

  let id;
  try {
    id = result.productTypes.edges[0].node.id;
  } finally {
    return id;
  }
}

async function fetchAttribute(search = '') {
  const query = `
    query ($filter: AttributeFilterInput) {
      attributes(first: 20, filter: $filter) {
        edges {
          node {
            id
            name
            slug
            type
            inputType
          }
        }
      }
    }
  `;
  const variables = search ? { filter: { search } } : {};
  const response = await executeGraphQL(query, { variables });
  return response.attributes.edges[0].node.id;
}

async function createProduct(
  productName,
  slug,
  attributes = [],
  productType,
  category,
  channel
) {
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const mutation = `
    mutation CreateProduct($input: ProductCreateInput!) {
      productCreate(input: $input) {
        product {
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

  const randomNum = Math.floor(Math.random() * 1000);
  const randomBase64 = Buffer.from(String(randomNum)).toString('base64');

  const myDescription = {
    time: Date.now(),
    blocks: [
      {
        type: 'header',
        data: {
          text: 'This is a heading',
          level: 1,
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'This is <b>bold</b> text, <i>italic</i> and <s>strike</s>.',
        },
      },
    ],
    version: '2.30.7',
  };

  const variables = {
    input: {
      name: `${productName} ${randomBase64}`,
      description: JSON.stringify(myDescription),
      productType: productType, // Replace with your productType ID
      category: category,
      attributes,

      slug: `${slug}-${randomBase64}`,
    },
  };

  let response;

  try {
    response = await executeGraphQL(mutation, { variables });
    // console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    // console.log(JSON.stringify(variables, null, 2));
    console.error(error.response ? error.response : error.message);
  }

  console.log('Response:', JSON.stringify(response, null, 2));
  return response.productCreate.product.id;
}

async function updateProductChannelListing(
  productId,
  channelId,
  isPublished = true,
  isAvailableForPurchase = true
) {
  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD

  const mutation = `mutation ProductChannelListingUpdate($productId: ID!, $channelListings: ProductChannelListingUpdateInput!) {
  productChannelListingUpdate(id: $productId, input: $channelListings) {
    product {
      id
      name
      channelListings {
        channel {
          id
          name
          slug
        }
        isPublished
        publicationDate
        isAvailableForPurchase
      }
    }
  }
}
`;
  const variables = {
    productId: productId,
    channelListings: {
      removeChannels: [],
      updateChannels: [
        {
          channelId: channelId,
          isPublished: isPublished,
          isAvailableForPurchase: isAvailableForPurchase,
        },
      ],
    },
  };
  console.log('variables:', JSON.stringify(variables, null, 2));

  try {
    const data = await executeGraphQL(mutation, { variables });

    const productUpdateResult = data.productChannelListingUpdate;
    if (
      productUpdateResult.productErrors &&
      productUpdateResult.productErrors.length > 0
    ) {
      console.error('Product Errors:', productUpdateResult.productErrors);
      return null;
    }

    const product = productUpdateResult.product;
    console.log(
      `Successfully updated product channel listing for product ID: ${product.id}`
    );
    console.log(`Product Name: ${product.name}`);

    return product;
  } catch (error) {
    console.error('Failed to update product channel listing:', error);
    return null;
  }
}

async function variantCreate(name, sku, productId, attStartDate) {
  const mutation = `
    mutation ProductVariantCreate($input: ProductVariantCreateInput!) {
      productVariantCreate(input: $input) {
        productVariant {
          id
          name
          sku
}}}`;
  const variables = {
    input: {
      product: productId,
      name: name,
      sku: sku,
      attributes: [
        {
          id: attStartDate,
          date: '2025-09-01',
        },
      ],
      trackInventory: true,
    },
  };

  const response = await executeGraphQL(mutation, { variables, details: true });
  console.log('Variant created:', JSON.stringify(response, null, 2));

  return response.productVariantCreate.productVariant.id;
}

async function updateVariantChannelListing(
  variantId,
  channelId,
  costPrice,
  price
) {
  const mutation = `
    mutation ProductVariantChannelListingUpdate($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
      productVariantChannelListingUpdate(id: $id, input: $input) {
        variant {
          id
          name
        }
      }
    }
`;

  const variables = {
    id: variantId,
    input: [
      {
        channelId: channelId,
        costPrice: costPrice,
        price: price,
        // isPublished: true,
        // isAvailableForPurchase: true,
      },
    ],
  };

  const response = await executeGraphQL(mutation, { variables });
  console.log(
    'Variant channel listing updated:',
    JSON.stringify(response, null, 2)
  );
}

//const attributeList = await createAttributes();

//await createProductType('Course', `course`, attributeList);

const categories = await fetchCategories();
const productType = await fetchProductType('Course');
const channel = await fetchChannel('Default');

const attDuration = await fetchAttribute('Duration');
const attStartDate = await fetchAttribute('Start Date');

//console.log('date:', attDate);
//console.log('categories:', categories);
//console.log('productTypes:', productType);
console.log('------------------------------------');

// You can now use categories[0].id and productTypes[0].id for product creation
const productId = await createProduct(
  'React Fundamentals',
  'react-fundamentals',
  [
    { id: attDuration, values: ['2'] },
    //    { id: attDate, date: '2026-01-01' },
  ], // Example attribute value
  productType,
  categories[0].id,
  channel
);

await updateProductChannelListing(productId, channel);

const variant1 = await variantCreate(
  'September Course',
  `rf-2025-09-01-${randomBase64}`,
  productId,
  attStartDate
);

await updateVariantChannelListing(variant1, channel, 900, 1000);

const warehouse = fetchWarehouse('Default Warehouse'); // Replace with your warehouse name

async function fetchWarehouse(name) {
  const query = `
    query ($filter: WarehouseFilterInput) {
      warehouses(first: 10, filter: $filter) {  
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;
  const variables = {
    filter: { search: name },
  };
  const response = await executeGraphQL(query, { variables });
  return response.warehouses.edges[0].node.id;
}

addStocksToVariant(variant1, warehouse, 10);

async function addStocksToVariant(variantId, warehouse, quantity) {
  const mutation = `
    mutation StockCreate($stocks: [StockInput!]!
  $variantId: ID!) {
      productVariantStocksCreate(stocks: $stocks
  variantId: $variantId) {
        productVariant {
          id
        }

      }
    }
  `;

  const variables = {
    variantId: variantId,
    stocks: [
      {
        warehouse: warehouse,
        quantity: quantity,
      },
    ],
  };

  return await executeGraphQL(mutation, { variables })
    .then((response) => {
      console.log('Stock added:');
    })
    .catch((error) => {
      console.error('Error adding stock:', error);
    });
}
