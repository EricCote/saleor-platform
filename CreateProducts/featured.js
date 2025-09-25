import { executeGraphQL } from './graphql.js';
import slug from 'slug';

import 'dotenv/config';
import { fetchChannel, updateCollectionChannelListing } from './fetchers.js';

export async function listProductsInCollection(
  slug = 'nouveautes',
  last = 100
) {
  const query = `
    query ProductsInCollection($slug: String!, $last: Int = 100) {
      collection(slug: $slug) {
        id
        products(last: $last) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              name
              slug
              description
              thumbnail { url alt }
              productType { id name }
              variants { id name sku }
            }
          }
        }
      }
    }
  `;
  const variables = { slug, last };
  const res = await executeGraphQL(query, { variables });
  return res.collection?.products.edges.map((n) => n.node.id) || null;
}

async function createCollection() {
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

  const products = await listProductsInCollection('nouveautes', 25);

  const variables = {
    input: {
      name: 'En Vedette',
      slug: 'featured-products',
      description:
        '{"blocks":[{"data":{"text":"Collection des produits en vedette."},"type":"paragraph"}]}',
      seo: {
        title: 'En Vedette',
      },
      isPublished: true,
      products: products,
    },
  };

  console.dir(variables, { depth: null });

  const res = await executeGraphQL(query, { variables });

  const collectionId = res.collectionCreate.collection.id;

  const variablesTr = {
    id: collectionId, // Use the ID from the collection creation response
    input: {
      name: 'Featured Products',
      seoTitle: `Featured Products Collection`,
      description: `{"blocks": [{"data": {"text": "Description for Featured Products."}, "type": "paragraph"}]}`,
    },
    languageCode: 'EN',
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

console.dir(await createCollection(), { depth: null });
