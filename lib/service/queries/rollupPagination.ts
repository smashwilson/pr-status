import {
  StatusCheckRollupFragment,
  statusCheckRollupFragment,
} from "./statusCheckRollupFragment";

export const rollupPaginationQuery = `
query($rollupId: ID!, $rollupCursor: String) {
  node(id: $rollupId) {
    ...statusCheckRollup
  }
}

${statusCheckRollupFragment}
`;

export interface RollupPaginationResponse {
  node?: StatusCheckRollupFragment;
}
