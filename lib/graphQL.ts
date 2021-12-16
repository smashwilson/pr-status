import type {Response} from "node-fetch";
import fetch from "node-fetch";

export interface Variables {
  [name: string]: string;
}

export class ServerError {
  name: string = "ServerError";
  message: string;
  response: Response;

  constructor(message: string, response: Response) {
    this.message = message;
    this.response = response;
  }
}

interface ErrorField {
  message: string;
  type: string;
  path: string[];
}

export class QueryError {
  name: string = "QueryError";
  message: string;
  errors: ErrorField[];

  constructor(message: string, errors: ErrorField[]) {
    this.message = message;
    this.errors = errors;
  }
}

export class GraphQL {
  token: string;
  url: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async query<R>(query: string, variables: Variables): Promise<R> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${this.token}`,
      },
    });

    if (response.status !== 200) {
      throw new ServerError("Unable to query GraphQL API", response);
    }

    const payload = await response.json();
    if (payload.errors) {
      throw new QueryError(
        "The GraphQL query encountered errors",
        payload.errors
      );
    }

    return payload.data;
  }
}
