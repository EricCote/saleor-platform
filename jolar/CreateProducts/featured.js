import { executeGraphQL } from '../../CreateProducts/graphql.js';

import 'dotenv/config';
import {
  fetchChannel,
  updateCollectionChannelListing,
} from '../../CreateProducts/fetchers.js';

export async function listProductsWithVariants() {
  let allProducts = [];
  let hasNextPage = true;
  let endCursor = null;

  const query = `
query ProductsWithMostVariants($after: String) {
  products(after: $after, first:100) {
    pageInfo {
      hasNextPage     
      endCursor
    }
    edges {
      node {
        id
        name
        variants {
          id
        }
      }
    }
  }
}
  `;

  while (hasNextPage) {
    const variables = {
      after: endCursor,
    };

    const res = await executeGraphQL(query, { variables });
    const products = res.products.edges.map((n) => ({
      id: n.node.id,
      name: n.node.name,
      countVariants: n.node.variants.length,
    }));
    allProducts = allProducts.concat(products);
    hasNextPage = res.products.pageInfo.hasNextPage;
    endCursor = res.products.pageInfo.endCursor;
  }

  return allProducts
    .sort((a, b) => b.countVariants - a.countVariants)
    .filter((p) => p.countVariants >= 5);
}

async function createCollection(prods) {
  const query = `
    mutation CreateCollection($input: CollectionCreateInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          name
          slug
          products(first: 100){
            totalCount
          }
        }
        errors {
          field
          message
          code

        }
      }
    }
  `;
  const queryTr = `
       mutation TranslateCollection($id: ID!,$input: TranslationInput!, $languageCode: LanguageCodeEnum!) {
          collectionTranslate(id: $id, input: $input, languageCode: $languageCode) {
            collection {
              id 
              name
            }
            errors {
              field
              message
              code
            }
          }
        }
      `;

  const variables = {
    input: {
      name: 'Featured Products',
      slug: 'featured-products',
      description:
        '{"blocks":[{"data":{"text":"Featured Products Collection"},"type":"paragraph"}]}',
      seo: {
        title: 'Featured Products',
      },
      isPublished: true,
      products: prods,
    },
  };

  const res = await executeGraphQL(query, { variables });

  const collectionId = res.collectionCreate.collection.id;

  const variablesTr = {
    id: collectionId, // Use the ID from the collection creation response
    input: {
      name: 'En Vedette',
      seoTitle: `Collection de produits en vedette`,
      description: `{"blocks": [{"data": {"text": "Description pour les poduits en vedette."}, "type": "paragraph"}]}`,
    },
    languageCode: 'FR',
  };
  const resTr = await executeGraphQL(queryTr, {
    variables: variablesTr,
  });

  const resCh = await updateCollectionChannelListing(
    collectionId,
    await fetchChannel('default-channel'),
    true
  );

  return { res, resTr, resCh };
}

//console.dir(prods, { depth: null });
const prods = (await listProductsWithVariants()).map((p) => p.id);
await createCollection(prods);
