import { ReviewState } from "../../review";
import { StatusCheckRollupFragment, statusCheckRollupFragment } from "./statusCheckRollupFragment";

export const pullRequestSearchQuery = `
query($search: String!, $rollupCursor: String) {
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

        # Reviews

        reviews(first: 20) {
          nodes {
            author {
              login
            }
            state
            onBehalfOf(first: 5) {
              nodes {
                slug
              }
            }
          }
        }
        reviewRequests(first: 20) {
          nodes {
            asCodeOwner
            requestedReviewer {
              ... on Team {
                slug
              }
            }
          }
        }
  
        # Build statuses
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                ...statusCheckRollup
              }
            }
          }
        }
  
      }
    }
  }
}

${statusCheckRollupFragment}
`;

export interface PullRequestSearchResponse {
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
      reviews: {
        nodes: {
          author: {
            login: string;
          }
          state: ReviewState;
          onBehalfOf: {
            nodes: {
              slug: string;
            }[],
          },
        }[],
      };
      reviewRequests: {
        nodes: {
          asCodeOwner: boolean;
          requestedReviewer: {
            slug?: string;
          };
        }[];
      },
      commits: {
        nodes: {
          commit: {
            statusCheckRollup?: StatusCheckRollupFragment;
          };
        }[];
      };
    }[];
  }
}
