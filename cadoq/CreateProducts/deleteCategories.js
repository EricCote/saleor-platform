import { executeGraphQL } from '../../CreateProducts/graphql.js';
import 'dotenv/config';
import {
  fetchAllCategories,
  fetchAllCollections,
} from '../../CreateProducts/fetchers.js';

const collections = (await fetchAllCollections()).filter((col) => col.jolar);

const categories = (await fetchAllCategories()).filter((cat) => cat.jolar);

const response = await deleteCollections(collections);
console.log(response);

const response2 = await deleteCategories(categories);
console.log(response2);

async function deleteCollections(collections) {
  const collectionList = collections.map((c) => c.id);

  const query = `
      mutation DeleteBulkCollection($ids: [ID!]!) {
        collectionBulkDelete(ids: $ids) {
          count
          errors {
            field
            message
            code
          }
        }  
      }
    `;

  const variables = { ids: collectionList };
  const response = await executeGraphQL(query, { variables });

  return response;
}

async function deleteCategories(categories) {
  const categoryList = categories.map((c) => c.id);

  const query = `
      mutation DeleteBulkCategory($ids: [ID!]!) {
        categoryBulkDelete(ids: $ids) {
          count
          errors {
            field
            message
            code
          }
        }  
      }
    `;

  const variables = { ids: categoryList };
  const response = await executeGraphQL(query, { variables });

  return response;
}
