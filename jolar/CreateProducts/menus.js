import { executeGraphQL } from '../../CreateProducts/graphql.js';

import 'dotenv/config';
import {
  fetchAllCollections,
  fetchCategoryTree,
  fetchMenuId,
} from '../../CreateProducts/fetchers.js';

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

await createMenuItems(
  cats[0].children.edges.map((e) => e.node),
  menuId,
  null
);
await createMenuItems(
  cats[0].children.edges.map((e) => e.node),
  footerId,
  null
);

await createMenuItemsSuppliers(collections);

//await createSubMenuItems(collections);

//console.log(cats);
//console.log(collections);

function getCollectionId(og) {
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

//This creates menu items and subitems, both in the main menu and in the footer
async function createMenuItems(cats, menuId, parentId) {
  for (const c of cats) {
    const variablesMenu = {
      input: {
        name: c.name,
        url: null,
        category: c.id,
        page: null,
        menu: menuId,
        parent: parentId,
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
      languageCode: 'FR',
    };

    const resultTr = await executeGraphQL(transMutation, {
      variables: variablesTr,
    });

    const metaVar = {
      id: menuItemId,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVar });

    if (c.children?.edges)
      await createMenuItems(
        c.children.edges.map((e) => e.node),
        menuId,
        menuItemId
      );
  }
}

async function createMenuItemsSuppliers(collections) {
  const variablesMenu = {
    input: {
      name: 'Suppliers',
      url: null,
      category: null,
      page: null,
      menu: footerId,
      parent: null,
    },
  };

  const result = await executeGraphQL(createMenuMutation, {
    variables: variablesMenu,
  });

  const supMenuItemId = result?.menuItemCreate?.menuItem?.id;
  if (!supMenuItemId) {
    console.error('Failed to create menu item for', c.name, result);
    return;
  }

  const variablesTr = {
    id: supMenuItemId,
    input: {
      name: 'Fournisseurs',
    },
    languageCode: 'FR',
  };

  const resultTr = await executeGraphQL(transMutation, {
    variables: variablesTr,
  });

  const metaVar = {
    id: supMenuItemId,
    input: [{ key: 'jolar', value: 'true' }],
  };

  await executeGraphQL(metaMutation, { variables: metaVar });

  ////

  for (const coll of collections) {
    const variablesMenu2 = {
      input: {
        name: coll.name,
        url: null,
        category: null,
        collection: coll.id,
        page: null,
        menu: footerId,
        parent: supMenuItemId,
      },
    };

    const result2 = await executeGraphQL(createMenuMutation, {
      variables: variablesMenu2,
    });

    const menuItemId = result2?.menuItemCreate?.menuItem?.id;
    if (!menuItemId) {
      console.error('Failed to create menu item for', c.name, result);
      return;
    }

    const variablesTr2 = {
      id: menuItemId,
      input: {
        name: coll.translation.name,
      },
      languageCode: 'FR',
    };

    const resultTr2 = await executeGraphQL(transMutation, {
      variables: variablesTr2,
    });

    const metaVar2 = {
      id: menuItemId,
      input: [{ key: 'jolar', value: 'true' }],
    };

    await executeGraphQL(metaMutation, { variables: metaVar2 });
  }
}
