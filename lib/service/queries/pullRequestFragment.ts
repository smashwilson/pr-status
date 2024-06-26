import {ReviewState} from "../../model/review.js";
import {
  StatusCheckRollupFragment,
  statusCheckRollupFragment,
} from "./statusCheckRollupFragment.js";

export const pullRequestFragment = `
fragment pullRequestFragment on PullRequest {
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

${statusCheckRollupFragment}
`;

export interface PullRequestFragment {
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
      };
      state: ReviewState;
      onBehalfOf: {
        nodes: {
          slug: string;
        }[];
      };
    }[];
  };
  reviewRequests: {
    nodes: {
      requestedReviewer: {
        slug?: string;
      };
    }[];
  };
  commits: {
    nodes: {
      commit: {
        statusCheckRollup?: StatusCheckRollupFragment;
      };
    }[];
  };
}
