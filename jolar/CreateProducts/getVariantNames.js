import { executeGraphQL } from '../../CreateProducts/graphql.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GraphQL query to get all product variants with their color attributes
const GET_VARIANTS_QUERY = `
query GetAllVariants($first: Int!, $after: String) {
  productVariants(first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        name
        sku
        product {
          id
          name
        }
        assignedAttributes {
          ... on AssignedPlainTextAttribute {
           attribute {
              name
              slug
            }  
					value
            fr: translation(languageCode: FR)
            attribute {
                name
            }
          }
          ... on AssignedSingleChoiceAttribute {
            
            attribute {
              name
              slug
            }
            choice: value {
              name
              fr: translation(languageCode: FR)
            }
          }
        }
      }
    }
  }
}
`;

async function getAllVariants() {
  let allVariants = [];
  let hasNextPage = true;
  let cursor = null;
  const pageSize = 50; // Adjust based on your needs

  console.log('Starting to fetch all product variants...');

  try {
    while (hasNextPage) {
      console.log(`Fetching variants... Current total: ${allVariants.length}`);

      const variables = {
        first: pageSize,
        after: cursor,
      };

      const data = await executeGraphQL(GET_VARIANTS_QUERY, { variables });

      //console.dir(data.productVariants.edges, { depth: null });

      const { edges, pageInfo } = data.productVariants;

      // Process each variant
      const variants = edges.map((edge) => {
        const variant = edge.node;

        // Find color attribute
        const colorAttribute = variant.assignedAttributes.find(
          (attr) => attr.attribute.slug === 'color'
        );

        const sizeAttribute = variant.assignedAttributes.find(
          (attr) => attr.attribute.slug === 'size'
        );

        return {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          productId: variant.product.id,
          productName: variant.product.name,
          color: colorAttribute ? colorAttribute.choice.name : null,
          colorFr: colorAttribute ? colorAttribute.choice.fr : null,
          size: sizeAttribute ? sizeAttribute.value : null,
          sizeFr: sizeAttribute ? sizeAttribute.fr : null,
        };
      });

      allVariants = allVariants.concat(variants);
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;

      // Add a small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\nCompleted! Found ${allVariants.length} variants total.`);
    return allVariants;
  } catch (error) {
    console.error('Error fetching variants:', error);
    throw error;
  }
}

async function displayVariantSummary(variants) {
  console.log('\n=== VARIANT SUMMARY ===');
  console.log(`Total variants: ${variants.length}`);

  // Group by size
  const sizeCounts = {};
  const sizes = Object.groupBy(variants, (v) => v.size);
  console.dir(sizes, { depth: 0 });

  // Show sample variants
}

async function exportToFile(variants, filename = 'variant_names_export.json') {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalVariants: variants.length,
      variants: variants,
    };

    const filePath = path.join(__dirname, filename);
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    console.log(`\nExport completed: ${filePath}`);

    // Also create a CSV for easier viewing
    const csvFilename = filename.replace('.json', '.csv');
    const csvPath = path.join(__dirname, csvFilename);
    const csvHeader = 'ID,Name,SKU,Product Name,Color Value,Color Slug\n';
    const csvRows = variants
      .map(
        (v) =>
          `"${v.id}","${v.name}","${v.sku}","${v.productName}","${v.color}", "${v.size}"`
      )
      .join('\n');

    await fs.writeFile(csvPath, csvHeader + csvRows);
    console.log(`CSV export completed: ${csvPath}`);
  } catch (error) {
    console.error('Error exporting to file:', error);
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting variant enumeration...');

    const variants = await getAllVariants();
    await displayVariantSummary(variants);
    await exportToFile(variants);

    console.log('\n✅ Variant enumeration completed successfully!');
  } catch (error) {
    console.error('❌ Error during variant enumeration:', error);
    process.exit(1);
  }
}

// Run if called directly

main();
