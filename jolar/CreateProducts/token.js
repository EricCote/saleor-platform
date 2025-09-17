import axios from 'axios';
import 'dotenv/config';

const sqlconn_string = process.env.sqlconn_string;

const SALEOR_API_URL = process.env.SALEOR_API_URL;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
let tokenObject = null;

export async function fetchToken() {
  const mutation = `
    mutation StaffTokenAuth($email: String!, $password: String!) {
      tokenCreate(email: $email, password: $password) {
        token
        refreshToken
        csrfToken
        user {
          id
          email
          firstName
          lastName
        } 
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

  tokenObject = response.data.data.tokenCreate;
  tokenObject.lastRefreshed = new Date();

  return tokenObject;
}

export async function refreshToken() {
  const mutation = `
    mutation RefreshToken($refreshToken: String) {
      tokenRefresh(refreshToken: $refreshToken) {
        token
        errors {
          message
          field
        }
      }
    }
  `;
  const variables = {
    refreshToken: tokenObject.refreshToken,
  };

  const response = await axios.post(SALEOR_API_URL, {
    query: mutation,
    variables,
  });

  tokenObject.token = response.data.data.tokenRefresh.token;
  tokenObject.lastRefreshed = new Date();
  return tokenObject;
}

export async function createHeaders() {
  const token = await fetchToken();
  return {
    //Authorization: `Bearer ${token}`,
    //"Content-Type": "application/json",
    Accept:
      'application/graphql-response+json;charset=utf-8, application/json;charset=utf-8',
    Authorization: `Bearer ${token.token}`,
  };
}

console.log('Headers created successfully');
console.log(JSON.stringify(await createHeaders(), null, 2));
