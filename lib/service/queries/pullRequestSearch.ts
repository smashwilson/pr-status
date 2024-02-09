import {
  PullRequestFragment,
  pullRequestFragment,
} from "./pullRequestFragment.js"

export const pullRequestSearchQuery = `
query($search: String!, $rollupCursor: String) {
  search(query: $search, first: 30, type: ISSUE) {
    nodes {
      ...pullRequestFragment
    }
  }
}

${pullRequestFragment}
`;

export interface PullRequestSearchResponse {
  search: {
    nodes: PullRequestFragment[],
  };
}
