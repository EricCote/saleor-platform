import { executeGraphQL } from './graphql.js';
import 'dotenv/config';
import { fetchMenus } from './fetchers.js';

const menus = await fetchMenus();

const response = await deleteMenus(menus);
console.log(response);

async function deleteMenus(menus) {
  const menuList = menus.map((c) => c.id);

  const query = `
      mutation DeleteBulkMenus($ids: [ID!]!) {
        menuBulkDelete(ids: $ids) {
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
