import { executeGraphQL } from './graphql.js';
import 'dotenv/config';

async function createGST() {
  const query = `
   mutation UpdateTaxCountryConfiguration($countryCode: CountryCode!, $updateTaxClassRates: [TaxClassRateInput!]! ) {
    taxCountryConfigurationUpdate(countryCode: $countryCode, updateTaxClassRates: $updateTaxClassRates) {
      taxCountryConfiguration{
        country{
          country
        }
        taxClassCountryRates{
          rate
        }
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
    countryCode: 'CA',
    updateTaxClassRates: [{ rate: '5.0' }],
  };
  const response = await executeGraphQL(query, { variables });
  console.log(response);
  return response;
}

async function createTVQ() {
  const query = `
   mutation CreateTaxClass( $input: TaxClassCreateInput!) {
    taxClassCreate(input: $input) {
      taxClass{
        id
        name
        countries{
          country{
            code 
            country
          }
          rate
          taxClass {
            id
            name
          }
        }
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
      name: 'TVQ',
      createCountryRates: [{ countryCode: 'CA', rate: '9.975' }],
    },
  };
  const response = await executeGraphQL(query, { variables });
  console.log(response);
  return response;
}

createTVQ();
createGST();
