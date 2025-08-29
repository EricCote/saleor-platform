import { executeGraphQL } from './graphql.js';

import 'dotenv/config';
import {
  fetchAllCollections,
  fetchCategoryTree,
  fetchMenuId,
} from './fetchers.js';

const cats = await fetchCategoryTree();

const collections = await fetchAllCollections();

//check existing menus
let menuId = await fetchMenuId('navbar');
let footerId = await fetchMenuId('footer');

if (!menuId) {
  menuId = await createMenu('navbar');
}
if (!footerId) {
  footerId = await createMenu('footer');
}

await createMenuItems(cats);

function getCollectionId(nopId, collections) {
  return collections.find((col) => nopId == col.nopId)?.id;
}

async function createMenu(name) {
  const query = `
        mutation CreateMenu($input: MenuCreateInput!){
        menuCreate(input: $input){
          menu{
            id
            name
          }
          errors{
            field
            message
            code
          }
        }
      }
  `;
  const variables = { input: { name: name } };
  const result = await executeGraphQL(query, { variables });
  console.log(result);
  return result.menuCreate.menu.id;
}

async function createMenuItems(cats) {
  const queryMenu = `
      mutation CreateMenuItem($input: MenuItemCreateInput!){
        menuItemCreate(input: $input){
          menuItem{
            id
            name
          }
          errors{
            field
            message
            code
          }
        }
      }
`;
  const queryTr = `
        mutation TranslateMenuItem($id: ID!,$input: NameTranslationInput!, $languageCode: LanguageCodeEnum!) {
          menuItemTranslate(id: $id, input: $input, languageCode: $languageCode) {
            menuItem {
              id 
            }
            errors {
              field
              message
              code
            }
          }
        }
      `;

  const nouvelleCollectionID = getCollectionId(52, collections);

  for (const c of cats) {
    const variablesMenu = {
      input: {
        name: c.name,
        url: null,
        category: c.nopId != 52 ? c.id : null,
        collection: c.nopId == 52 ? nouvelleCollectionID : null,
        page: null,
        menu: menuId,
        parent: null,
      },
    };

    const result = await executeGraphQL(queryMenu, {
      variables: variablesMenu,
    });

    const menuItemId = result?.menuItemCreate?.menuItem?.id;
    if (!menuItemId) {
      console.error('Failed to create menu item for', c.name, result);
      break;
    }

    const variablesTr = {
      id: menuItemId,
      input: {
        name: c.translation.name,
      },
      languageCode: 'EN',
    };

    const resultTr = await executeGraphQL(queryTr, {
      variables: variablesTr,
    });
    //////////////
    variablesMenu.input.menu = footerId;

    const resultf = await executeGraphQL(queryMenu, {
      variables: variablesMenu,
    });

    const menuItemIdf = resultf?.menuItemCreate?.menuItem?.id;
    if (!menuItemIdf) {
      console.error('Failed to create footer menu item for', c.name, resultf);
      break;
    }

    variablesTr.id = menuItemIdf;

    const resultTrf = await executeGraphQL(queryTr, {
      variables: variablesTr,
    });

    for (const s of c.children.edges) {
      const variablesSubmenu = {
        input: {
          name: s.node.name,
          url: null,
          category: null,
          collection: getCollectionId(s.node.nopId, collections),
          page: null,
          menu: menuId,
          parent: menuItemId,
        },
      };

      const subResult = await executeGraphQL(queryMenu, {
        variables: variablesSubmenu,
      });

      const subMenuItemId = subResult?.menuItemCreate?.menuItem?.id;
      if (!subMenuItemId) {
        console.error(
          'Failed to create submenu item for',
          s.node.name,
          subResult
        );
        break;
      }
      const variablesTr = {
        id: subMenuItemId,
        input: {
          name: s.node.translation.name,
        },
        languageCode: 'EN',
      };

      const resultTr = await executeGraphQL(queryTr, {
        variables: variablesTr,
      });

      ///////

      variablesSubmenu.input.menu = footerId;
      variablesSubmenu.input.parent = menuItemIdf;

      const subResultf = await executeGraphQL(queryMenu, {
        variables: variablesSubmenu,
      });

      const subMenuItemIdf = subResultf?.menuItemCreate?.menuItem?.id;
      if (!subMenuItemIdf) {
        console.error(
          'Failed to create submenu item for',
          s.node.name,
          subResultf
        );
        break;
      }
      variablesTr.id.subMenuItemIdf;

      const resultTrf = await executeGraphQL(queryTr, {
        variables: variablesTr,
      });
    }
  }
}
