import { executeGraphQL } from '../../CreateProducts/graphql.js';
import 'dotenv/config';
import {
  fetchAllAttributes,
  fetchAllProductTypesExcept,
} from '../../CreateProducts/fetchers.js';

async function deleteProdTypes(productTypes) {
  const productTypeList = productTypes.map((p) => p.id);

  const query = `
      mutation DeleteBulkProductType($ids: [ID!]!) {
        productTypeBulkDelete(ids: $ids) {
          count
          errors {
            field
            message
            code
          }
        }
      }
    `;

  const variables = { ids: productTypeList };
  const response = await executeGraphQL(query, { variables });

  return response;
}

async function deleteAttributes(attributes) {
  const attributeList = attributes.map((p) => p.id);

  const query = `
    mutation DeleteBulkAttribute($ids: [ID!]!) {
      attributeBulkDelete(ids: $ids) {
        count
        errors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = { ids: attributeList };
  const response = await executeGraphQL(query, { variables });

  return response;
}

const prodTypes = (await fetchAllProductTypesExcept('default-type')).filter(
  (pt) => pt.jolar == 'true'
);
const attributes = (await fetchAllAttributes()).filter(
  (pt) => pt.jolar == 'true'
);

const response1 = await deleteProdTypes(prodTypes);
console.log(response1);

const response2 = await deleteAttributes(attributes);
console.log(response2);
