import {
  PullRequestFragment,
  pullRequestFragment,
} from "./pullRequestFragment.js";

export const pullRequestByNumberQuery = `
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      ...pullRequestFragment
    }
  }
}

${pullRequestFragment}
`;

export interface PullRequestByNumberResponse {
  repository: {
    pullRequest: PullRequestFragment;
  };
}
