import { executeGraphQL } from '../../CreateProducts/graphql.js';
import 'dotenv/config';
import { fetchAllProducts } from '../../CreateProducts/fetchers.js';

const products = (await fetchAllProducts()).filter((p) => p.jolar);

const response = await deleteProducts(products);
console.log(response);

async function deleteProducts(products) {
  const productList = products.map((p) => p.id);

  const query = `
      mutation DeleteBulkProduct($ids: [ID!]!) {
        productBulkDelete(ids: $ids) {
          errors {
            field
            message
            code
          }
          count
        }
      }
    `;

  const variables = { ids: productList };
  const response = await executeGraphQL(query, { variables });

  return response;
}
