import { fetchToken, refreshToken } from './token.js';

const SALEOR_API_URL = 'http://localhost:8000/graphql/'; //
let token = await fetchToken();

export async function executeGraphQL(operation, options) {
  const { variables, headers, cache, revalidate } = options;

  //if token is older than 1 minute, refresh it
  if (token?.lastRefreshed.getTime() + 1000 * 60 < Date.now()) {
    token = await refreshToken();
  }

  const input = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept:
        'application/graphql-response+json;charset=utf-8, application/json;charset=utf-8',
      Authorization: `Bearer ${token.token}`,
      ...headers,
    },
    body: JSON.stringify({
      query: operation.toString(),
      variables,
    }),
    cache: cache,
    next: { revalidate },
  };

  const response = await fetch(SALEOR_API_URL, input);

  if (!response.ok) {
    const body = await (async () => {
      try {
        return await response.text();
      } catch {
        return '';
      }
    })();
    throw new HTTPError(response, body);
  }

  const body = await response.json();

  if ('errors' in body) {
    throw new GraphQLError(body);
  }

  // console.log(JSON.stringify(variables, null, 2));
  // console.log(JSON.stringify(body, null, 2));

  return body.data;
}

class GraphQLError extends Error {
  constructor(errorResponse) {
    const message = errorResponse.errors
      .map((error) => error.message)
      .join('\n');
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
class HTTPError extends Error {
  constructor(response, body) {
    const message = `HTTP error ${response.status}: ${response.statusText}\n${body}`;
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
