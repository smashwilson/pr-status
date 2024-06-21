import {createBuilderClass} from "nested-builder";
import {PullRequestByNumberResponse} from "../../../../lib/service/queries/pullRequestByNumber.js";
import {PullRequestFragmentBuilder} from "./pullRequestFragmentBuilders.js";

export const PullRequestByNumberBuilder =
  createBuilderClass<PullRequestByNumberResponse>()({
    repository: {
      nested: createBuilderClass<PullRequestByNumberResponse["repository"]>()({
        pullRequest: {
          nested: PullRequestFragmentBuilder,
        },
      }),
    },
  });
