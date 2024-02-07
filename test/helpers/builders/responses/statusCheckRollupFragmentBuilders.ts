import {createBuilderClass} from "nested-builder";
import {
  CheckRunResponse,
  StatusCheckRollupFragment,
  StatusContextResponse,
} from "../../../../lib/service/queries/statusCheckRollupFragment.js";

export const CheckRunBuilder = createBuilderClass<CheckRunResponse>()({
  __typename: {default: "CheckRun"},
  id: {default: "ST000"},
  checkSuite: {
    nested: createBuilderClass<CheckRunResponse["checkSuite"]>()({
      app: {
        nested: createBuilderClass<CheckRunResponse["checkSuite"]["app"]>()({
          name: {default: "check-suite-app-name"},
        }),
      },
    }),
  },
  name: {default: "check-run-name"},
  title: {default: "check-run-title"},
  status: {default: "COMPLETED"},
  conclusion: {default: "SUCCESS"},
  detailsUrl: {default: "https://example.com"},
});

export const StatusContextBuilder = createBuilderClass<StatusContextResponse>()(
  {
    __typename: {default: "StatusContext"},
    id: {default: "ST001"},
    context: {default: "context"},
    state: {default: "SUCCESS"},
    targetUrl: {default: "https://example.com"},
  }
);

export const StatusCheckRollupFragmentBuilder = createBuilderClass<
  StatusCheckRollupFragment | undefined
>()({
  id: {default: "ST001"},
  contexts: {
    nested: createBuilderClass<StatusCheckRollupFragment["contexts"]>()({
      pageInfo: {
        nested: createBuilderClass<
          StatusCheckRollupFragment["contexts"]["pageInfo"]
        >()({
          endCursor: {default: "CUR000"},
          hasNextPage: {default: false},
        }),
      },
      nodes: {plural: true, nested: CheckRunBuilder},
    }),
  },
});
