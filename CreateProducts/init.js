import { executeGraphQL } from './graphql.js';
import { fetchChannel, fetchWarehouse, fetchShip } from './fetchers.js';

const defChannelId = await fetchChannel('default-channel');
let channelId;
const shipId = await fetchShip('Default');
const warehouseId = await fetchWarehouse('Default');

//let's delete the old default channel if it's already there
if (defChannelId) {
  const result = await deleteChannel(defChannelId);
  console.log('Delete channel result: %o', result);
}

//Let's create a new default channel
//with canadian money, using the default shipping and the default warehouse
channelId = await fetchChannel('default-channel');
if (!channelId) {
  const res2 = await createDefaultChannel();
  console.log('Create channel result: %o', res2);
}

//let's connect the default shipping to the default warehouse
const res3 = await updateShipping(shipId, warehouseId);

console.log('Update shipping result: %o', res3);

await createTVQ();
await createGST();

async function deleteChannel(channelId) {
  const query = `
    mutation DeleteChannel($id: ID!) {
      channelDelete(id: $id) {
        channel {
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
  const variables = { id: channelId };

  return await executeGraphQL(query, { variables });
}

async function createDefaultChannel() {
  const query = `
    mutation CreateChannel($input: ChannelCreateInput!) {
      channelCreate(input: $input) {
        channel {
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
  const variables = {
    input: {
      name: 'Default Channel',
      slug: 'default-channel',
      currencyCode: 'CAD',
      defaultCountry: 'CA',
      isActive: true,
      addShippingZones: [shipId],
      addWarehouses: [warehouseId],
    },
  };

  return await executeGraphQL(query, { variables });
}

async function updateShipping(shipId, warehouseId) {
  const query = `
  mutation UpdateShippingZone($id: ID!, $input: ShippingZoneUpdateInput!){
  shippingZoneUpdate(id: $id, input: $input) {
    shippingZone {
      id
      name
      countries {
        code
        country
      }
    }
  }
}
  `;
  let variables = {
    id: shipId,
    input: {
      description: 'Canadian shipping zone',
      countries: ['CA', 'US'],
      addWarehouses: [warehouseId],
    },
  };

  console.log('Updating shipping zone with variables:', variables);

  try {
    // Execute the GraphQL mutation
    const response = await executeGraphQL(query, { variables });
    console.log('Shipping zone updated successfully:', response);
    return response;
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    throw error; // Re-throw the error for further handling if needed
  }
}

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
