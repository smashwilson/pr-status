import {createBuilderClass} from "nested-builder";
import {PullRequestFragment} from "../../../../lib/service/queries/pullRequestFragment.js";
import {StatusCheckRollupFragmentBuilder} from "./statusCheckRollupFragmentBuilders.js";

type BaseRepositoryNode = PullRequestFragment["baseRepository"];
type ReviewNode = PullRequestFragment["reviews"]["nodes"][number];
type ReviewRequestNode = PullRequestFragment["reviewRequests"]["nodes"][number];
type CommitNode = PullRequestFragment["commits"]["nodes"][number];

const CommitNodeBuilder = createBuilderClass<CommitNode>()({
  commit: {
    nested: createBuilderClass<CommitNode["commit"]>()({
      statusCheckRollup: {
        nested: StatusCheckRollupFragmentBuilder,
      },
    }),
  },
});

export const PullRequestFragmentBuilder =
  createBuilderClass<PullRequestFragment>()({
    id: {default: "SRC000"},
    isDraft: {default: false},
    number: {default: 1},
    title: {default: "Pull Request Title"},
    url: {default: "https://github.com/owner/repo/pulls/1"},
    baseRepository: {
      nested: createBuilderClass<BaseRepositoryNode>()({
        name: {default: "repo"},
        owner: {
          nested: createBuilderClass<BaseRepositoryNode["owner"]>()({
            login: {default: "owner"},
          }),
        },
      }),
    },
    reviews: {
      nested: createBuilderClass<PullRequestFragment["reviews"]>()({
        nodes: {
          plural: true,
          nested: createBuilderClass<ReviewNode>()({
            author: {
              nested: createBuilderClass<ReviewNode["author"]>()({
                login: {default: "reviewer"},
              }),
            },
            state: {default: "COMMENTED"},
            onBehalfOf: {
              nested: createBuilderClass<ReviewNode["onBehalfOf"]>()({
                nodes: {
                  plural: true,
                  nested: createBuilderClass<
                    ReviewNode["onBehalfOf"]["nodes"][number]
                  >()({
                    slug: {default: "requested-team-slug"},
                  }),
                },
              }),
            },
          }),
        },
      }),
    },
    reviewRequests: {
      nested: createBuilderClass<PullRequestFragment["reviewRequests"]>()({
        nodes: {
          plural: true,
          nested: createBuilderClass<ReviewRequestNode>()({
            requestedReviewer: {
              nested: createBuilderClass<
                ReviewRequestNode["requestedReviewer"]
              >()({
                slug: {default: "requested-team-slug"},
              }),
            },
          }),
        },
      }),
    },
    commits: {
      nested: createBuilderClass<PullRequestFragment["commits"]>()({
        nodes: {
          plural: true,
          nested: CommitNodeBuilder,
          default: [new CommitNodeBuilder().build()],
        },
      }),
    },
  });
