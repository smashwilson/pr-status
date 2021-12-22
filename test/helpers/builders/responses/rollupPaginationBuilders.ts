import {createBuilderClass} from "nested-builder";
import {RollupPaginationResponse} from "../../../../lib/service/queries/rollupPagination";
import {StatusCheckRollupFragmentBuilder} from "./statusCheckRollupFragmentBuilders";

export const RollupPaginationBuilder =
  createBuilderClass<RollupPaginationResponse>()({
    node: {nested: StatusCheckRollupFragmentBuilder},
  });
