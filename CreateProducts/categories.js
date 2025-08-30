import sql from 'mssql';
import { executeGraphQL } from './graphql.js';
import slug from 'slug';

import 'dotenv/config';
import {
  fetchCategories,
  fetchChannel,
  updateCollectionChannelListing,
} from './fetchers.js';

const sqlconn_string = process.env.sqlconn_string;

//console.log('Connecting to SQL Server with connection string:', sqlconn_string);

//const randomNum = Math.floor(Math.random() * 1000);
//const randomBase64 = Buffer.from(String(randomNum)).toString('base64');

async function getCats() {
  try {
    await sql.connect(sqlconn_string);
    const result = await sql.query`
SELECT c.id, c.name, lp.localeValue as nameEn
FROM Category 
      AS c
  LEFT JOIN LocalizedProperty lp ON c.Id = lp.EntityId AND lp.LocaleKeyGroup = 'Category' AND lp.LanguageId=1
WHERE
     c.SubjectToAcl=0   AND parentCategoryId=0 AND [Deleted] = 0 AND [Published] = 1
ORDER BY c.DisplayOrder, c.Name
    `;
    return result;
  } catch (err) {
    console.error('SQL error', err);
  } finally {
    await sql.close();
  }
}

async function getSubcats() {
  try {
    await sql.connect(sqlconn_string);
    const result = await sql.query`
SELECT c.id, c.name, c.parentCategoryId, lp.localeValue as nameEn
FROM [SDVariationsBiz].[dbo].[Category] AS c
  LEFT JOIN Category AS Parent
  ON c.parentCategoryId = Parent.Id
  LEFT JOIN LocalizedProperty lp ON c.Id = lp.EntityId AND lp.LocaleKeyGroup = 'Category' AND lp.LanguageId=1
WHERE
  c.SubjectToAcl=0 AND parent.SubjectToAcl=0 AND c.parentCategoryId<>0
  AND c.[Deleted] = 0 AND c.[Published] = 1
  AND parent.[Deleted] = 0 AND parent.[Published] = 1
ORDER BY c.DisplayOrder, c.Name
    `;
    return result;
  } catch (err) {
    console.error('SQL error', err);
  } finally {
    await sql.close();
  }
}

const cats = await getCats();

//console.log('Categories fetched successfully...', cats);

await createCategories(cats);
await createCollections(cats);

const parentCategories = await fetchCategories();
//jus keep the parent categories and the ones created by us
const filteredParentCategories = parentCategories.filter(
  (cat) => !cat.parent && cat.nopId
);

const subCats = await getSubcats();

await createSubCategories(subCats);
await createCollections(subCats);

function getCatId(nopId, categories) {
  return categories.find((cat) => nopId == cat.nopId)?.id;
}

async function createCategories(categories) {
  for (const category of categories.recordset) {
    const { name, id, nameEn } = category;
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
        name: name,
        slug: slug(name),
        description: `{"blocks": [{"data": {"text": "Description pour ${name}."}, "type": "paragraph"}]}`,
        seo: { title: `Catégorie ${name}` },
        privateMetadata: [{ key: 'nopId', value: id }],
      },
      parent: null, // Set to null if no parent category
    };

    try {
      const response = await executeGraphQL(queryCat, {
        variables: variablesCat,
      });

      console.log('wow : ', response.categoryCreate.category.id);

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
      console.log(`Category ${name} created successfully` /* response */);
    } catch (error) {
      console.error(`Error creating category ${name}:`, error);
      break; // Stop on error to avoid overwhelming the server
    }
  }
}

async function createSubCategories(subCategories) {
  for (const category of subCategories.recordset) {
    const { name, id, nameEn, parentCategoryId } = category;
    const parentId = getCatId(parentCategoryId, filteredParentCategories);

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
        name: name,
        slug: slug(name),
        description: `{"blocks": [{"data": {"text": "Description pour ${name}."}, "type": "paragraph"}]}`,
        seo: { title: `Categorie ${name}` },
        privateMetadata: [{ key: 'nopId', value: id }],
      },
      parent: parentId, // Set to null if no parent category
    };

    try {
      const responseCat = await executeGraphQL(queryCat, {
        variables: variablesCat,
      });
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
      console.log(`SubCategory ${name} created successfully` /* response */);
    } catch (error) {
      console.error(`Error creating category ${name}:`, error);
      break; // Stop on error to avoid overwhelming the server
    }
  }
}

async function createCollections(categories) {
  const channelID = await fetchChannel('Default Channel');

  for (const category of categories.recordset) {
    const { id, parentCategoryId, nameEn } = category;
    let name = category.name;
    if (parentCategoryId == 1) {
      name = 'Dildo ' + name;
    }
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
        name: name,
        slug: slug(name),
        description: `{"blocks": [{"data": {"text": "Description pour ${name}."}, "type": "paragraph"}]}`,
        seo: { title: `Collection ${name}` },
        privateMetadata: [{ key: 'nopId', value: id }],
      },
    };

    try {
      const response = await executeGraphQL(queryCol, { variables });
      if (response.collectionCreate.errors.length > 0) {
        throw new Error(`Failed to create collection ${name}`);
        break;
      }

      const variablesTr = {
        id: response.collectionCreate.collection.id, // Use the ID from the category creation response
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
      if (responseTr.collectionTranslate.errors.length > 0) {
        console.error('error: ', response.collectionTranslate.errors);
        throw new Error(`Failed to translate collection ${name}`);
      }

      console.log(
        `Collection ${response.collectionCreate.collection?.name} created successfully` /* response */
      );

      await updateCollectionChannelListing(
        response.collectionCreate.collection.id,
        channelID
      );
    } catch (error) {
      console.error(`Error creating collection ${name}:`, error);
      throw error; // Stop on error to avoid overwhelming the server
    }
  }
}
