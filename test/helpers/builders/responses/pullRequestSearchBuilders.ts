import {createBuilderClass} from "nested-builder";
import {PullRequestSearchResponse} from "../../../../lib/service/queries/pullRequestSearch";
import {StatusCheckRollupFragmentBuilder} from "./statusCheckRollupFragmentBuilders";

type PullRequestNode = PullRequestSearchResponse["search"]["nodes"][number];
type BaseRepositoryNode = PullRequestNode["baseRepository"];
type ReviewNode = PullRequestNode["reviews"]["nodes"][number];
type ReviewRequestNode = PullRequestNode["reviewRequests"]["nodes"][number];
type CommitNode = PullRequestNode["commits"]["nodes"][number];

const CommitNodeBuilder = createBuilderClass<CommitNode>()({
  commit: {
    nested: createBuilderClass<CommitNode["commit"]>()({
      statusCheckRollup: {
        nested: StatusCheckRollupFragmentBuilder,
      },
    }),
  },
});

export const PullRequestSearchBuilder =
  createBuilderClass<PullRequestSearchResponse>()({
    search: {
      nested: createBuilderClass<PullRequestSearchResponse["search"]>()({
        nodes: {
          plural: true,
          nested: createBuilderClass<PullRequestNode>()({
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
              nested: createBuilderClass<PullRequestNode["reviews"]>()({
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
              nested: createBuilderClass<PullRequestNode["reviewRequests"]>()({
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
              nested: createBuilderClass<PullRequestNode["commits"]>()({
                nodes: {
                  plural: true,
                  nested: CommitNodeBuilder,
                  default: [new CommitNodeBuilder().build()],
                },
              }),
            },
          }),
        },
      }),
    },
  });
