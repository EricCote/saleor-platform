import { executeGraphQL } from '../../CreateProducts/graphql.js';
import slug from 'slug';

import 'dotenv/config';
import {
  fetchCategories,
  fetchChannel,
  updateCollectionChannelListing,
} from '../../CreateProducts/fetchers.js';

const level1 = [{ fr: 'Jolar', en: 'Jolar', og: 'Jolar' }];

const level2 = [
  { fr: 'Lingerie .', en: 'Lingerie', og: 'Lingerie', parent: 'Jolar' },
  { fr: 'Bas', en: 'Hosiery', og: 'Hosiery', parent: 'Jolar' },
  { fr: 'Costumes', en: 'Costumes', og: 'Costume', parent: 'Jolar' },
  { fr: 'Accessoires', en: 'Accessories', og: 'Accessorie', parent: 'Jolar' },
  { fr: 'Vêtements', en: 'Clothing', og: 'Clothing', parent: 'Jolar' },
  { fr: 'Maillots', en: 'Swimwear', og: 'Swimwear', parent: 'Jolar' },
];

const fournisseurs = [
  { fr: 'Dreamgirl', en: 'DreamGirl', og: 'Dg Brands' },
  { fr: 'Music Legs', en: 'Music Legs', og: 'Music Legs' },
  { fr: 'Grupo Espiral', en: 'Grupo Espiral', og: 'Grupo Espiral' },
  {
    fr: 'Fantasy Lingerie',
    en: 'Fantasy Lingerie',
    og: 'Fantasy Lingerie',
  },

  { fr: 'Magic Silk', en: 'Magic Silk', og: 'Magic Silk' },
  { fr: 'Male Power', en: 'Male Power', og: 'Male Power' },

  { fr: '665 Leather', en: '665 Leather', og: '665 Leather' },
  { fr: 'Taboo', en: 'Taboo', og: 'Taboo' },
];

const level3 = [
  { fr: 'Fetiche', en: 'Fetish', og: 'Fetish', parent: 'Accessorie' },
  { fr: 'Bas Stay Up', en: 'Stay Up', og: 'Stay Up', parent: 'Hosiery' },
  { fr: 'Bas Jarretelles', en: 'Thigh Hi', og: 'Thigh Hi', parent: 'Hosiery' },
  { fr: 'Bas Culottes', en: 'Pantyhose', og: 'Pantyhose', parent: 'Hosiery' },
  {
    fr: 'Bas Cheville',
    en: 'Ankle Hi',
    og: 'Ankle Hi',
    parent: 'Hosiery',
  },
  {
    fr: 'Bodystocking',
    en: 'Bodystocking',
    og: 'Bodystocking',
    parent: 'Lingerie',
  },
  { fr: 'Teddy', en: 'Teddy', og: 'Teddy', parent: 'Lingerie' },
  {
    fr: 'Bas Jarretelles Attaché',
    en: 'Suspender',
    og: 'Suspender',
    parent: 'Hosiery',
  },
  {
    fr: 'Babydoll & robe longue',
    en: 'Babydoll & Gown',
    og: 'Babydoll-Chemise',
    parent: 'Lingerie',
  },
  {
    fr: 'Corset & Bustier',
    en: 'Corset & Bustier',
    og: 'Corset & Bustier',
    parent: 'Lingerie',
  },
  {
    fr: 'Costume de chambre',
    en: 'Bedroom Costume',
    og: 'Bedroom Costume',
    parent: 'Lingerie',
  },
  {
    fr: 'Porte-jarretelle',
    en: 'Garterbelt',
    og: 'Garter',
    parent: 'Accessorie',
  },
  {
    fr: 'Multi pièces',
    en: 'Multi Piece',
    og: 'Multi Piece',
    parent: 'Lingerie',
  },
  { fr: 'Bas Culotte', en: 'Panty', og: 'Panty', parent: 'Lingerie' },
  { fr: 'Shorts', en: 'Shorts', og: 'Shorts', parent: 'Clothing' },
  {
    fr: 'Porte-jarretelles',
    en: 'Garterbelts',
    og: 'Garterbelts',
    parent: 'Lingerie',
  },
  { fr: 'Fantaisie', en: 'Fantasy', og: 'Fantasy', parent: 'Costume' },
  { fr: 'Perruques', en: 'Wig', og: 'Wig', parent: 'Accessorie' },
  { fr: 'Comedie', en: 'Comedy', og: 'Comedy', parent: 'Costume' },
  { fr: 'Valentine', en: 'Valentine', og: 'Valentine', parent: 'Lingerie' },
  { fr: 'Bas Sans Pieds', en: 'Footless', og: 'Footless', parent: 'Hosiery' },
  { fr: 'Temps des fêtes', en: 'Holiday', og: 'Holiday', parent: 'Hosiery' },
  { fr: 'Halloween', en: 'Halloween', og: 'Halloween', parent: 'Costume' },
  { fr: 'Gants', en: 'Gloves', og: 'Gloves', parent: 'Accessorie' },
  { fr: 'Mini Robes', en: 'Mini Dress', og: 'Mini Dress', parent: 'Lingerie' },
  { fr: 'Pastilles', en: 'Pasties', og: 'Pasties', parent: 'Accessorie' },
  //{ fr: 'Fournitures', en: 'Supply', og: 'Supply', parent: 'Accessorie' },
  { fr: 'Hauts', en: 'Top', og: 'Top', parent: 'Clothing' },
];

//console.log('Categories fetched successfully...', cats);
let categories = await fetchCategories();
await createCategories(level1);

categories = await fetchCategories();
//jus keep the parent categories and the ones created by us

console.log(categories);
await createCategories(level2);
categories = await fetchCategories();
console.log(categories);

await createCategories(level3);
categories = await fetchCategories();
console.log(categories);

await createCollections(fournisseurs);

//let subCats = [];
//await createSubCategories(subCats);
//await createCollections(subCats);

function getCatId(og) {
  return categories.find((cat) => og == cat.jolar)?.id;
}

async function createCategories(categories) {
  for (const category of categories) {
    const { fr: nameFr, en: nameEn, parent, og } = category;
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
        name: nameEn,
        slug: slug(nameEn),
        description: `{"blocks": [{"data": {"text": "Description for ${nameEn}."}, "type": "paragraph"}]}`,
        seo: { title: `${nameEn} Category` },
        privateMetadata: [{ key: 'jolar', value: og }],
      },
      parent: parent ? getCatId(parent) : null, // Set to null if no parent category
    };

    try {
      const response = await executeGraphQL(queryCat, {
        variables: variablesCat,
      });

      const variablesTr = {
        id: response.categoryCreate.category.id, // Use the ID from the category creation response
        input: {
          name: nameFr, // Use the ID from the category creation response
          seoTitle: `Catégorie ${nameFr}`, // Use the English name from the category data
          description: `{"blocks": [{"data": {"text": "Description pour ${nameFr}."}, "type": "paragraph"}]}`,
        },
        languageCode: 'FR',
      };
      const responseTr = await executeGraphQL(queryTr, {
        variables: variablesTr,
      });
      console.log(`Category ${nameEn} created successfully` /* response */);
    } catch (error) {
      console.error(`Error creating category ${nameEn}:`, error);
      break; // Stop on error to avoid overwhelming the server
    }
  }
}

async function createCollections(collections) {
  const channelID = await fetchChannel('default-channel');

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
        name: nameEn,
        slug: slug(nameEn),
        description: `{"blocks": [{"data": {"text": "Description for ${nameEn}."}, "type": "paragraph"}]}`,
        seo: { title: `${nameEn} Collection` },
        privateMetadata: [{ key: 'jolar', value: og }],
        metadata: [{ key: 'type', value: 'supplier' }],
      },
    };

    try {
      const response = await executeGraphQL(queryCol, { variables });

      const variablesTr = {
        id: response.collectionCreate.collection.id,
        input: {
          name: nameFr, // Use the ID from the category creation response
          seoTitle: `Collection ${nameFr}`, // Use the English name from the category data
          description: `{"blocks": [{"data": {"text": "Description pour ${nameFr}."}, "type": "paragraph"}]}`,
        },
        languageCode: 'FR',
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
      console.error(`Error creating collection ${nameEn}:`, error);
      throw error; // Stop on error to avoid overwhelming the server
    }
  }
}
