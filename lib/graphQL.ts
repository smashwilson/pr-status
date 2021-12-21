import type {Response} from "node-fetch";
import fetch from "node-fetch";

export interface Variables {
  [name: string]: string | string[] | null;
}

export interface ServerError extends Error {
  response: Response;
}
interface ErrorField {
  message: string;
  type: string;
  path: string[];
}

export interface QueryError extends Error {
  errors: ErrorField[];
}

export class GraphQL {
  token: string;
  url: string;

  rateLimitLeft: number;
  rateLimitTotal: number;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
    this.rateLimitLeft = 0;
    this.rateLimitTotal = 0;
  }

  async query<R>(query: string, variables: Variables): Promise<R> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${this.token}`,
      },
      body: JSON.stringify({query, variables}),
    });

    const hRateLimitTotal = response.headers.get("X-RateLimit-Limit");
    if (hRateLimitTotal) {
      this.rateLimitTotal = parseInt(hRateLimitTotal, 10);
    }
    const hRateLimitLeft = response.headers.get("X-RateLimit-Remaining");
    if (hRateLimitLeft) {
      this.rateLimitLeft = parseInt(hRateLimitLeft, 10);
    }

    if (response.status !== 200) {
      const error = new Error("Unable to query GraphQL API") as ServerError;
      error.response = response;
      throw error;
    }

    const payload = await response.json();
    if (payload.errors) {
      const error = new Error(
        "The GraphQL query encountered errors"
      ) as QueryError;
      error.errors = payload.errors;
      throw error;
    }

    return payload.data;
  }
}
