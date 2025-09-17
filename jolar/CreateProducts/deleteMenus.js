import { executeGraphQL } from './graphql.js';
import 'dotenv/config';
import { fetchMenuItems } from './fetchers.js';

const menus = (await fetchMenuItems()).filter((m) => m.jolar);

const response = await deleteMenuItems(menus);
console.log(response);

async function deleteMenuItems(menus) {
  const menuList = menus.map((c) => c.id);

  const query = `
      mutation DeleteBulkMenuItems($ids: [ID!]!) {
        menuItemBulkDelete(ids: $ids) {
          count
          errors {
            field
            message
            code
          }
        }  
      }
    `;

  const variables = { ids: menuList };
  const response = await executeGraphQL(query, { variables });

  return response;
}
