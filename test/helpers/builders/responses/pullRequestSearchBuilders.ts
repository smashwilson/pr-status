import {createBuilderClass} from "nested-builder";
import {PullRequestSearchResponse} from "../../../../lib/service/queries/pullRequestSearch.js";
import {PullRequestFragmentBuilder} from "./pullRequestFragmentBuilders.js";

export const PullRequestSearchBuilder =
  createBuilderClass<PullRequestSearchResponse>()({
    search: {
      nested: createBuilderClass<PullRequestSearchResponse["search"]>()({
        nodes: {
          plural: true,
          nested: PullRequestFragmentBuilder,
        },
      }),
    },
  });
