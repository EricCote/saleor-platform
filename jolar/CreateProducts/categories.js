import { executeGraphQL } from './graphql.js';
import slug from 'slug';

import 'dotenv/config';
import {
  fetchCategories,
  fetchChannel,
  updateCollectionChannelListing,
} from './fetchers.js';

const cats = [{ fr: 'Jolar', en: 'Jolar' }];

const subCats = [
  { fr: 'Lingerie .', en: 'Lingerie', og: 'Lingerie' },
  { fr: 'Bas', en: 'Hosiery', og: 'Hosiery' },
  { fr: 'Costumes', en: 'Costumes', og: 'Costume' },
  { fr: 'Accessoires', en: 'Accessories', og: 'Accessorie' },
  { fr: 'Vêtements', en: 'Clothing', og: 'Clothing' },
  { fr: 'Maillots', en: 'Swimwear', og: 'Swimwear' },
];

const fournisseurs = [
  { fr: '665 Leather', en: '665 Leather', og: '665 Leather' },
  { fr: 'Dreamgirl', en: 'DreamGirl', og: 'Dg Brands' },
  {
    fr: 'Fantasy Lingerie',
    en: 'Fantasy Lingerie',
    og: 'Fantasy Lingerie',
  },
  { fr: 'Grupo Espiral', en: 'Grupo Espiral', og: 'Grupo Espiral' },
  { fr: 'Magic Silk', en: 'Magic Silk', og: 'Magic Silk' },
  { fr: 'Male Power', en: 'Male Power', og: 'Male Power' },
  { fr: 'Music Legs', en: 'Music Legs', og: 'Music Legs' },
  { fr: 'Taboo', en: 'Taboo', og: 'Taboo' },
];

const collections = [
  { fr: 'Fetiche', en: 'Fetish', og: 'Fetish' },
  { fr: 'Bas Stay Up', en: 'Stay Up', og: 'Stay Up' },
  { fr: 'Bas Jarretelles', en: 'Thigh Hi', og: 'Thigh Hi' },
  { fr: 'Bas Culottes', en: 'Pantyhose', og: 'Pantyhose' },
  { fr: 'Bodystocking', en: 'Bodystocking', og: 'Bodystocking' },
  { fr: 'Teddy', en: 'Teddy', og: 'Teddy' },
  { fr: 'Bas Jarretelles Attaché', en: 'Suspender', og: 'Suspender' },
  {
    fr: 'Babydoll & robe longue',
    en: 'Babydoll & Gown',
    og: 'Babydoll-Chemise',
  },
  {
    fr: 'Corset & Bustier',
    en: 'Corset & Bustier',
    og: 'Corset & Bustier',
  },
  {
    fr: 'Costume de chambre',
    en: 'Bedroom Costume',
    og: 'Bedroom Costume',
  },
  { fr: 'Porte-jarretelle', en: 'Garterbelt', og: 'Garter' },
  { fr: 'Multi pièces', en: 'Multi Piece', og: 'Multi Piece' },
  { fr: 'Bas Culotte', en: 'Panty', og: 'Panty' },
  { fr: 'Shorts', en: 'Shorts', og: 'Shorts' },
  { fr: 'Porte-jarretelles', en: 'Garterbelts', og: 'Garterbelts' },
  { fr: 'Fantaisie', en: 'Fantasy', og: 'Fantasy' },
  { fr: 'Perruques', en: 'Wig', og: 'Wig' },
  { fr: 'Comedie', en: 'Comedy', og: 'Comedy' },
  { fr: 'Valentine', en: 'Valentine', og: 'Valentine' },
  { fr: 'Bas Sans Pieds', en: 'Footless', og: 'Footless' },
  { fr: 'Temps des fêtes', en: 'Holiday', og: 'Holiday' },
  { fr: 'Halloween', en: 'Halloween', og: 'Halloween' },
  { fr: 'Gants', en: 'Gloves', og: 'Gloves' },
  { fr: 'Mini Robes', en: 'Mini Dress', og: 'Mini Dress' },
  { fr: 'Pastilles', en: 'Pasties', og: 'Pasties' },
  { fr: 'Fournitures', en: 'Supply', og: 'Supply' },
  { fr: 'Hauts', en: 'Top', og: 'Top' },
];

//console.log('Categories fetched successfully...', cats);

await createCategories(cats);

const categories = await fetchCategories();
//jus keep the parent categories and the ones created by us

const jolarCategoryId = categories.find((c) => c.slug == 'jolar').id;
console.log('Jolar category id : ', jolarCategoryId);

await createSubCategories(subCats);
await createCollections(collections);
await createCollections(fournisseurs);

//let subCats = [];
//await createSubCategories(subCats);
//await createCollections(subCats);

function getCatId(nopId, categories) {
  return categories.find((cat) => nopId == cat.nopId)?.id;
}

async function createCategories(categories) {
  for (const category of categories) {
    const { fr: nameFr, en: nameEn } = category;
    const queryCat = `
      mutation CreateCategory($input: CategoryInput!, $parent: ID) {
        categoryCreate(input: $input, parent: $parent) {
          category {
            id
            name
            slug
          }
          errors {
            field
            message
            attributes
            code
            values
          }
        }
      }
    `;
    const queryTr = `
        mutation TranslateCategory($id: ID!,$input: TranslationInput!, $languageCode: LanguageCodeEnum!) {
          categoryTranslate(id: $id, input: $input, languageCode: $languageCode) {
            category {
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
    const variablesCat = {
      input: {
        name: nameFr,
        slug: slug(nameFr),
        description: `{"blocks": [{"data": {"text": "Description pour ${nameFr}."}, "type": "paragraph"}]}`,
        seo: { title: `Catégorie ${nameFr}` },
        privateMetadata: [{ key: 'jolar', value: 'true' }],
      },
      parent: null, // Set to null if no parent category
    };

    try {
      const response = await executeGraphQL(queryCat, {
        variables: variablesCat,
      });

      const variablesTr = {
        id: response.categoryCreate.category.id, // Use the ID from the category creation response
        input: {
          name: nameEn, // Use the ID from the category creation response
          seoTitle: `${nameEn} Category`, // Use the English name from the category data
          description: `{"blocks": [{"data": {"text": "Description for ${nameEn}."}, "type": "paragraph"}]}`,
        },
        languageCode: 'EN',
      };
      const responseTr = await executeGraphQL(queryTr, {
        variables: variablesTr,
      });
      console.log(`Category ${nameFr} created successfully` /* response */);
    } catch (error) {
      console.error(`Error creating category ${nameFr}:`, error);
      break; // Stop on error to avoid overwhelming the server
    }
  }
}

async function createSubCategories(subCategories) {
  for (const category of subCategories) {
    const { fr: nameFr, en: nameEn, og: og } = category;

    const parentId = jolarCategoryId;

    const queryCat = `
      mutation CreateCategory($input: CategoryInput!, $parent: ID) {
        categoryCreate(input: $input, parent: $parent) {
          category {
            id
            name
            slug
            parent { 
              id 
              name 
            }
          }
          errors {
            field
            message
            attributes
            code
            values
          }
        }
      }
    `;
    const queryTr = `
       mutation TranslateCategory($id: ID!,$input: TranslationInput!, $languageCode: LanguageCodeEnum!) {
          categoryTranslate(id: $id, input: $input, languageCode: $languageCode) {
            category {
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
    const variablesCat = {
      input: {
        name: nameFr,
        slug: slug(nameFr),
        description: `{"blocks": [{"data": {"text": "Description pour ${nameFr}."}, "type": "paragraph"}]}`,
        seo: { title: `Categorie ${nameFr}` },

        privateMetadata: [{ key: 'jolar', value: og }],
      },
      parent: parentId, // Set to null if no parent category
    };

    try {
      const responseCat = await executeGraphQL(queryCat, {
        variables: variablesCat,
      });
      // console.log(responseCat.categoryCreate.errors);
      // exit();
      const variablesTr = {
        id: responseCat.categoryCreate.category.id, // Use the ID from the category creation response
        input: {
          name: nameEn, // Use the ID from the category creation response
          seoTitle: `${nameEn} Category`, // Use the English name from the category data
          description: `{"blocks": [{"data": {"text": "Description for ${nameEn}."}, "type": "paragraph"}]}`,
        },
        languageCode: 'EN',
      };
      const responseTr = await executeGraphQL(queryTr, {
        variables: variablesTr,
      });
      console.log(`SubCategory ${nameFr} created successfully` /* response */);
    } catch (error) {
      console.error(`Error creating category ${nameFr}:`, error);
      break; // Stop on error to avoid overwhelming the server
    }
  }
}

async function createCollections(collections) {
  const channelID = await fetchChannel('Default Channel');

  for (const collection of collections) {
    const { en: nameEn, fr: nameFr, og: og } = collection;

    const queryCol = `
      mutation CreateCollection($input: CollectionCreateInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            name
            slug
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
        name: nameFr,
        slug: slug(nameFr),
        description: `{"blocks": [{"data": {"text": "Description pour ${nameFr}."}, "type": "paragraph"}]}`,
        seo: { title: `Collection ${nameFr}` },
        privateMetadata: [{ key: 'jolar', value: og }],
      },
    };

    try {
      const response = await executeGraphQL(queryCol, { variables });

      const variablesTr = {
        id: response.collectionCreate.collection.id,
        input: {
          name: nameEn, // Use the ID from the category creation response
          seoTitle: `${nameEn} Collection`, // Use the English name from the category data
          description: `{"blocks": [{"data": {"text": "Description for ${nameEn}."}, "type": "paragraph"}]}`,
        },
        languageCode: 'EN',
      };

      const responseTr = await executeGraphQL(queryTr, {
        variables: variablesTr,
      });

      console.log(
        `Collection ${response.collectionCreate.collection?.name} created successfully` /* response */
      );

      await updateCollectionChannelListing(
        response.collectionCreate.collection.id,
        channelID
      );
    } catch (error) {
      console.error(`Error creating collection ${nameFr}:`, error);
      throw error; // Stop on error to avoid overwhelming the server
    }
  }
}
