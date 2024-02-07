import {GraphQL, Variables} from "../../lib/graphQL.js";

class ExpectedQuery<R> {
  query: string;
  variables: Variables;
  response: R;

  constructor(query: string, variables: Variables, response: R) {
    this.query = query;
    this.variables = variables;
    this.response = response;
  }

  matches(query: string, variables: Variables) {
    if (this.query !== query) {
      return false;
    }

    for (const variableName of Object.keys(this.variables)) {
      if (variables[variableName] !== this.variables[variableName]) {
        return false;
      }
    }

    return true;
  }
}

export class CannedGraphQL extends GraphQL {
  expectations: ExpectedQuery<any>[] = [];

  constructor() {
    super("https://example.com", "AAAA");
  }

  expect<R>(query: string, variables: Variables, response: R): CannedGraphQL {
    this.expectations.push(
      new ExpectedQuery<R>(query, variables || {}, response)
    );
    return this;
  }

  async query<R>(query: string, variables: Variables): Promise<R> {
    for (const expectation of this.expectations) {
      if (expectation.matches(query, variables)) {
        return Promise.resolve(expectation.response);
      }
    }
    throw new Error("Unexpected query performed in test");
  }
}
