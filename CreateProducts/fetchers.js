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
            nopId: privateMetafield(key: "nopId")
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
  categories(first: 100, level: 0) {
    edges {
      node {
        id
        name
        slug
        nopId: privateMetafield(key: "nopId")
        level
        translation(languageCode: EN) {
          name
        }
        children(first: 100) {
          edges {
            node {
              id
              name
              slug
              nopId: privateMetafield(key: "nopId")
              level
              translation(languageCode: EN) {
                name
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

export async function fetchChannel(name) {
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

export async function fetchMenuId(name) {
  const query = `
   query Menu($slug: String) {
      menu(slug: $slug) {
            id
            name
            slug
      }
    }
`;
  const response = await executeGraphQL(query, { variables: { slug: name } });

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
export async function fetchAllCategories() {
  const query = `
query MyQuery {
  categories(first: 100) {
    edges {
      node {
        id
        name
        nopId: privateMetafield(key: "nopId")
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
            translation(languageCode: EN){
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

export async function fetchMenus() {
  const query = `
    query MyQuery {
      menus(first: 100) {
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
