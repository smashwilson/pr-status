import { CheckConclusionState, CheckStatusState } from "../../checkRunStatus";
import { StatusState } from "../../contextStatus";

export const statusCheckRollupFragment = `
fragment statusCheckRollup on StatusCheckRollup {
  id
  contexts(first: 100, after: $rollupCursor) {
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      __typename
      ... on Node {
        id
      }
      ... on CheckRun {
        checkSuite {
          app {
            name
          }
        }
        name
        title
        status
        conclusion
        detailsUrl
      }
      ... on StatusContext {
        context
        state
        targetUrl
      }
    }
  }
}
`

export interface CheckRunResponse {
  __typename: string;
  id: string;
  checkSuite: {
    app: {
      name: string;
    };
  };
  name: string;
  title: string;
  status: CheckStatusState;
  conclusion: CheckConclusionState;
  detailsUrl: string;
}

export interface StatusContextResponse {
  __typename: string;
  id: string
  context: string;
  state: StatusState;
  targetUrl: string;
}

export interface StatusCheckRollupFragment {
  id: string;
  contexts: {
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
    };
    nodes: (CheckRunResponse | StatusContextResponse)[];
  };
}

export function isCheckRun(node: StatusCheckRollupFragment["contexts"]["nodes"][number]): node is CheckRunResponse {
  return node.__typename === "CheckRun";
}

export function isStatusContext(node: StatusCheckRollupFragment["contexts"]["nodes"][number]): node is StatusContextResponse {
  return node.__typename === "StatusContext";
}
