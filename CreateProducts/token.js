import axios from 'axios';

const SALEOR_API_URL = 'http://localhost:8000/graphql/'; // Update with your Saleor GraphQL endpoint
const EMAIL = 'eric@coteexpert.com'; // Replace with your Saleor API token
const PASSWORD = 'af123123123';

export async function fetchToken() {
  const mutation = `
    mutation StaffTokenAuth($email: String!, $password: String!) {
      tokenCreate(email: $email, password: $password) {
        token
        refreshToken
        errors {
          message
          field
        }
      }
    }
  `;
  const variables = {
    email: EMAIL,
    password: PASSWORD,
  };

  const response = await axios.post(SALEOR_API_URL, {
    query: mutation,
    variables,
  });

  return response.data.data.tokenCreate.token;
}

export async function createHeaders() {
  const token = await fetchToken();
  return {
    //Authorization: `Bearer ${token}`,
    //"Content-Type": "application/json",
    Accept:
      'application/graphql-response+json;charset=utf-8, application/json;charset=utf-8',
    'Authorization-Bearer': `${token}`,
  };
}

console.log(JSON.stringify(await createHeaders(), null, 2));
