import {createBuilderClass} from "nested-builder";
import {RollupPaginationResponse} from "../../../../lib/service/queries/rollupPagination.js";
import {StatusCheckRollupFragmentBuilder} from "./statusCheckRollupFragmentBuilders.js";

export const RollupPaginationBuilder =
  createBuilderClass<RollupPaginationResponse>()({
    node: {nested: StatusCheckRollupFragmentBuilder},
  });
