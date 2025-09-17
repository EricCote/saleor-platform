import { executeGraphQL } from './graphql.js';

import 'dotenv/config';
import {
  fetchAllCollections,
  fetchCategoryTree,
  fetchMenuId,
} from './fetchers.js';

const cats = (await fetchCategoryTree()).filter((cat) => cat.jolar);

const collections = (await fetchAllCollections()).filter((coll) => coll.jolar);

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

function getCollectionId(og, collections) {
  return collections.find((col) => og == col.jolar)?.id;
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

  return result.menuCreate.menu.id;
}

async function createMenuItems(cats) {
  const createMenuMutation = `
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
  const metaMutation = `
    mutation UpdatePrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
      updatePrivateMetadata(id: $id, input: $input) {
        errors {
          field 
          message 
          code
        }
        item {
          privateMetadata {
            key
            value
          }
        }
      }
    }
  `;

  const transMutation = `
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

  for (const c of cats) {
    const variablesMenu = {
      input: {
        name: c.name,
        url: null,
        category: c.id,
        page: null,
        menu: menuId,
        parent: null,
      },
    };

    const result = await executeGraphQL(createMenuMutation, {
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

    const resultTr = await executeGraphQL(transMutation, {
      variables: variablesTr,
    });

    const metaVar = {
      id: menuItemId,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVar });

    //////////////
    variablesMenu.input.menu = footerId;

    const resultf = await executeGraphQL(createMenuMutation, {
      variables: variablesMenu,
    });

    const menuItemIdf = resultf?.menuItemCreate?.menuItem?.id;
    if (!menuItemIdf) {
      console.error('Failed to create footer menu item for', c.name, resultf);
      break;
    }

    variablesTr.id = menuItemIdf;

    const resultTrf = await executeGraphQL(transMutation, {
      variables: variablesTr,
    });

    const metaVarf = {
      id: menuItemIdf,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVarf });

    for (const s of c.children.edges) {
      const variablesSubmenu = {
        input: {
          name: s.node.name,
          url: null,
          category: s.node.id,
          collection: null,
          page: null,
          menu: menuId,
          parent: menuItemId,
        },
      };

      const subResult = await executeGraphQL(createMenuMutation, {
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

      const resultTr = await executeGraphQL(transMutation, {
        variables: variablesTr,
      });

      const metaSubVar = {
        id: subMenuItemId,
        input: [{ key: 'jolar', value: 'true' }],
      };

      await executeGraphQL(metaMutation, { variables: metaSubVar });

      ///////

      variablesSubmenu.input.menu = footerId;
      variablesSubmenu.input.parent = menuItemIdf;

      const subResultf = await executeGraphQL(createMenuMutation, {
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
      variablesTr.id = subMenuItemIdf;

      const resultTrf = await executeGraphQL(transMutation, {
        variables: variablesTr,
      });

      const metaSubVar2 = {
        id: subMenuItemIdf,
        input: [{ key: 'jolar', value: 'true' }],
      };

      await executeGraphQL(metaMutation, { variables: metaSubVar2 });
    }
  }
}
