import { executeGraphQL } from './graphql.js';

export async function fetchCategories() {
  const query = `
    query {
      categories(first: 100) {
        edges {
          node {
            id
            name
            slug
            parent {
              id
            }
            level
            nopId: privateMetafield(key: "nopId")
            jolar: privateMetafield(key: "jolar")
            translation(languageCode: FR) {
              name
            }
          }
        }
      }
    }
  `;
  const response = await executeGraphQL(query, {});
  return response.categories.edges.map((edge) => edge.node);
}

export async function fetchCategoryTree() {
  const query = `
{
  categories(first: 10, level: 0) {
    edges {
      node {
        id
        name
        slug
        nopId: privateMetafield(key: "nopId")
        jolar: privateMetafield(key: "jolar")
        level
        translation(languageCode: FR) {
          name
        }
        children(first: 10) {
          edges {
            node {
              id
              name
              slug
              nopId: privateMetafield(key: "nopId")
              jolar: privateMetafield(key: "jolar")
              level
              translation(languageCode: FR) {
                name
              }
              children(first: 11) {
                edges {
                  node {
                    id
                    name
                    slug
                    nopId: privateMetafield(key: "nopId")
                    jolar: privateMetafield(key: "jolar")
                    level
                    translation(languageCode: FR) {
                      name
                    }
                  }
                }  
              }
            }
          }
        }
      }
    }
  }
}
  `;
  const response = await executeGraphQL(query, {});
  return response.categories.edges.map((edge) => edge.node);
}

export async function fetchChannel(slug) {
  const query = `
    query getChannel($slug: String) {
      channel(slug: $slug) {
        id
        name
        slug
      }
    }
  `;
  const response = await executeGraphQL(query, { variables: { slug } });
  return response.channel?.id;
}

export async function fetchMenuId(slug) {
  const query = `
   query Menu($slug: String) {
      menu(slug: $slug) {
            id
            name
            slug
            jolar: privateMetafield(key: "jolar")
            sd: privateMetafield(key: "sd")
      }
    }
`;
  const response = await executeGraphQL(query, { variables: { slug } });

  return response.menu?.id;
}

export async function fetchProductType(name) {
  const query = `
    query ($filter: ProductTypeFilterInput) {
      productTypes(first: 1, filter: $filter) {
        edges {
          node {
            id
            name
            slug
            jolar: privateMetafield(key: "jolar")
            sd: privateMetafield(key: "sd")
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

export async function fetchAttribute(name) {
  const query = `
    query ($filter: AttributeFilterInput) {
      attributes(first: 1, filter: $filter) {
        edges {
          node {
            id
            name
            slug
            jolar: privateMetafield(key: "jolar")
            sd: privateMetafield(key: "sd")
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
    id = result.attributes.edges[0].node.id;
  } finally {
    return id;
  }
}

export async function fetchAllProductTypesExcept(slug) {
  const query = `
    query{
      productTypes(first: 100) {
        edges {
          node {
            id
            name
            slug
            jolar: privateMetafield(key: "jolar")
            sd: privateMetafield(key: "sd")
          }
        }
      }
    }
  `;

  const results = await executeGraphQL(query, {});

  let prodTypes = [];
  try {
    prodTypes = results.productTypes.edges
      .map((n) => n.node)
      .filter((n) => n.slug != slug);
  } finally {
    return prodTypes;
  }
}

export async function fetchAllAttributes() {
  const query = `
    query{
      attributes(first: 100) {
        edges {
          node {
            id
            name
            slug
            jolar: privateMetafield(key: "jolar")
            sd: privateMetafield(key: "sd")
          }
        }
      }
    }
  `;

  const results = await executeGraphQL(query, {});

  let attribs = [];
  try {
    attribs = results.attributes.edges.map((n) => n.node);
  } finally {
    return attribs;
  }
}

export async function fetchAllCategories() {
  const query = `
query MyQuery {
  categories(first: 100) {
    edges {
      node {
        id
        name
        slug
        nopId: privateMetafield(key: "nopId")
        jolar: privateMetafield(key: "jolar")
      }
    }
  }
}
  `;

  const result = await executeGraphQL(query, {});

  try {
    return result.categories.edges.map((n) => n.node);
  } catch {
    return result;
  }
}

export async function fetchAllCollections() {
  const query = `
    query MyQuery {
      collections(first: 100) {
        edges {
          node {
            id
            name
            nopId: privateMetafield(key: "nopId")
            jolar: privateMetafield(key: "jolar")
            type:  metafield(key: "type")
            translation(languageCode: FR){
              name
            }
          }
        }
      }
    }
  `;

  const result = await executeGraphQL(query, {});

  try {
    return result.collections.edges.map((n) => n.node);
  } catch {
    return result;
  }
}

export async function fetchMenuItems() {
  const query = `
    query MyQuery {
      menuItems(first: 100) {
        edges {
          node {
            id
            name
            sd: privateMetafield(key: "sd")
            jolar: privateMetafield(key: "jolar")
          }
        }
      }
    }
  `;

  const result = await executeGraphQL(query, {});
  return result.menuItems.edges.map((n) => n.node);
}

export async function fetchMenus() {
  const query = `
    query MyQuery {
      menus(first: 100) {
        edges {
          node {
            id
            name
            slug
            jolar: privateMetafield(key: "jolar")
            sd: privateMetafield(key: "sd")
          }
        }
      }
    }
  `;

  const result = await executeGraphQL(query, {});

  try {
    return result.menus.edges.map((n) => n.node);
  } catch {
    return result;
  }
}

export async function fetchWarehouse(name) {
  const query = `
  query MyQuery($name: String!) { 
  warehouses(first:10, filter: { search: $name }) {
    edges {
      node {
        id
        name
      }
    }
  }
}

`;
  const variables = { name: name };

  const response = await executeGraphQL(query, { variables });
  const warehouses = response.warehouses.edges;

  const warehouse = warehouses.find((w) =>
    w.node.name.toLowerCase().includes(name.toLowerCase())
  );

  return warehouse?.node.id;
}

export async function fetchShip(name) {
  const query = `
  query MyQuery($name: String!) { 
  shippingZones(first:10, filter: { search: $name }) {
    edges {
      node {
        id
        name
      }
    }
  }
}

`;
  const variables = { name: name };

  const response = await executeGraphQL(query, { variables });
  const shippingZones = response.shippingZones.edges;

  const shippingZone = shippingZones.find((w) =>
    w.node.name.toLowerCase().includes(name.toLowerCase())
  );

  return shippingZone?.node.id;
}

export async function fetchAllProducts() {
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
  return allProducts;
}

export async function updateCollectionChannelListing(
  collectionId,
  channelId,
  isPublished = true
) {
  const mutation = `mutation CollectionChannelListingUpdate($collectionId: ID!, $channelListings: CollectionChannelListingUpdateInput!) {
  collectionChannelListingUpdate(id: $collectionId, input: $channelListings) {
    collection {
      id
      name
      slug
      channelListings {
        channel {
          id
          name
          slug
        }
      }
    }
  }
}
`;
  const variables = {
    collectionId: collectionId,
    channelListings: {
      removeChannels: [],
      addChannels: [
        {
          channelId: channelId,
          isPublished: isPublished,
        },
      ],
    },
  };

  try {
    const data = await executeGraphQL(mutation, { variables });

    const result = data.collectionChannelListingUpdate;
    if (result.errors && result.errors.length > 0) {
      console.error('Product Errors:', result.errors);
      return null;
    }

    const collection = result.collection;
    console.log(
      `Successfully updated product channel listing for product: ${collection.name}`
    );
    return collection;
  } catch (error) {
    console.error('Failed to update collection channel listing:', error);
    return null;
  }
}
