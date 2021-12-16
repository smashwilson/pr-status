export const pullRequestSearchQuery = `
query($search: String!) {
  search(query: $search, first: 30, type: ISSUE) {
    nodes {
      ... on PullRequest {
        id
        isDraft
        number
        title
        url
        baseRepository {
          name
          owner {
            login
          }
        }
      }
    }
  }
}
`;

export interface PullRequestSearchQueryResponse {
  search: {
    nodes: {
      id: string;
      isDraft: boolean;
      number: number;
      title: string;
      url: string;
      baseRepository: {
        name: string;
        owner: {
          login: string;
        };
      };
    }[];
  }
}
