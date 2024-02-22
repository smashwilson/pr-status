import {assert} from "chai";
import {CheckRunStatus} from "../../lib/model/checkRunStatus.js";
import {ContextStatus} from "../../lib/model/contextStatus.js";
import {PullRequestLocator} from "../../lib/service/pullRequestLocator.js";
import {
  pullRequestSearchQuery,
  PullRequestSearchResponse,
} from "../../lib/service/queries/pullRequestSearch.js";
import {rollupPaginationQuery} from "../../lib/service/queries/rollupPagination.js";
import {
  CheckRunResponse,
  StatusContextResponse,
} from "../../lib/service/queries/statusCheckRollupFragment.js";
import {PullRequestSearchBuilder} from "../helpers/builders/responses/pullRequestSearchBuilders.js";
import {RollupPaginationBuilder} from "../helpers/builders/responses/rollupPaginationBuilders.js";
import {
  CheckRunBuilder,
  StatusContextBuilder,
} from "../helpers/builders/responses/statusCheckRollupFragmentBuilders.js";
import {CannedGraphQL} from "../helpers/cannedGraphQL.js";
import {pullRequestByNumberQuery} from "../../lib/service/queries/pullRequestByNumber.js";
import {PullRequestByNumberBuilder} from "../helpers/builders/responses/pullRequestByNumberBuilders.js";

describe("PullRequestLocator", function () {
  let graphQL: CannedGraphQL;
  let locator: PullRequestLocator;

  const emptySearchResponse = new PullRequestSearchBuilder().build();

  beforeEach(function () {
    graphQL = new CannedGraphQL();
    locator = new PullRequestLocator(graphQL);
  });

  describe("search query", function () {
    it("queries for all repositories when an empty array is passed", async function () {
      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open",
          rollupCursor: null,
        },
        emptySearchResponse
      );

      const pullRequests = await locator.inRepositories([]);
      assert.isEmpty(pullRequests);
    });

    it("queries for named repositories when an array of names-with-owners are passed", async function () {
      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open repo:aaa/bbb",
          rollupCursor: null,
        },
        emptySearchResponse
      );

      const pullRequests = await locator.inRepositories(["aaa/bbb"]);
      assert.isEmpty(pullRequests);
    });
  });

  describe("number query", function () {
    it("queries for a specific pull request", async function () {
      const response = new PullRequestByNumberBuilder().repository((repoB) => {
        repoB.pullRequest((prB) => {
          prB.id("PR0");
        });
      }).build();

      graphQL.expect(
        pullRequestByNumberQuery,
        {
          owner: "owner",
          name: "name",
          number: 123,
        },
        response
      );

      const pr = await locator.byNumber("owner", "name", 123);
      assert.isNotNull(pr);
      assert.strictEqual(pr!.id, "PR0");
    });
  });

  it("parses PullRequest models from the response data", async function () {
    const response = new PullRequestSearchBuilder()
      .search((searchB) => {
        searchB.nodes.add((prB) => {
          prB.id("PR000");
          prB.isDraft(true);
          prB.number(1);
          prB.title("First pull request");
          prB.baseRepository((repoB) => {
            repoB.owner((ownerB) => ownerB.login("zzz"));
            repoB.name("aaa");
          });
          prB.url("https://github.com/zzz/aaa/pulls/1");
        });
        searchB.nodes.add((prB) => {
          prB.id("PR001");
          prB.isDraft(false);
          prB.number(2);
          prB.title("Second pull request");
          prB.baseRepository((repoB) => {
            repoB.owner((ownerB) => ownerB.login("yyy"));
            repoB.name("bbb");
          });
          prB.url("https://github.com/yyy/bbb/pulls/2");
        });
      })
      .build();

    graphQL.expect(
      pullRequestSearchQuery,
      {
        search: "is:pr author:@me state:open",
        rollupCursor: null,
      },
      response
    );

    const prs = await locator.inRepositories([]);
    assert.lengthOf(prs, 2);

    const pr0 = prs[0];
    assert.strictEqual(pr0.id, "PR000");
    assert.isTrue(pr0.isDraft);
    assert.strictEqual(pr0.number, 1);
    assert.strictEqual(pr0.title, "First pull request");
    assert.strictEqual(pr0.repoOwner, "zzz");
    assert.strictEqual(pr0.repoName, "aaa");
    assert.strictEqual(pr0.url, "https://github.com/zzz/aaa/pulls/1");
    assert.isEmpty(pr0.statuses);
    assert.isEmpty(pr0.requestedReviews);

    const pr1 = prs[1];
    assert.strictEqual(pr1.id, "PR001");
    assert.isFalse(pr1.isDraft);
    assert.strictEqual(pr1.number, 2);
    assert.strictEqual(pr1.title, "Second pull request");
    assert.strictEqual(pr1.repoOwner, "yyy");
    assert.strictEqual(pr1.repoName, "bbb");
    assert.strictEqual(pr1.url, "https://github.com/yyy/bbb/pulls/2");
    assert.isEmpty(pr1.statuses);
    assert.isEmpty(pr1.requestedReviews);
  });

  describe("statuses", function () {
    function buildSearchResponse(
      results: (CheckRunResponse | StatusContextResponse)[],
      rollupId = "ROLL000",
      endCursor = "end-cursor",
      hasNextPage = false
    ): PullRequestSearchResponse {
      return new PullRequestSearchBuilder()
        .search((searchB) => {
          searchB.nodes.add((prB) => {
            prB.commits((commitB) => {
              commitB.nodes.add((nodeB) => {
                nodeB.commit((commitB) => {
                  commitB.statusCheckRollup((rollupB) => {
                    rollupB.id(rollupId);
                    rollupB.contexts((contextsB) => {
                      contextsB.pageInfo((pageInfoB) => {
                        pageInfoB.endCursor(endCursor);
                        pageInfoB.hasNextPage(hasNextPage);
                      });
                      contextsB.nodes(results);
                    });
                  });
                });
              });
            });
          });
        })
        .build();
    }

    function buildPaginationResponse(
      results: (CheckRunResponse | StatusContextResponse)[],
      rollupId = "ROLL000",
      endCursor = "end-cursor",
      hasNextPage = false
    ) {
      return new RollupPaginationBuilder()
        .node((nodeB) => {
          nodeB.id(rollupId);
          nodeB.contexts((contextB) => {
            contextB.pageInfo((pageB) => {
              pageB.endCursor(endCursor);
              pageB.hasNextPage(hasNextPage);
            });
            contextB.nodes(results);
          });
        })
        .build();
    }

    it("collects CI build statuses for each pull request", async function () {
      const checkRun = new CheckRunBuilder()
        .checkSuite((suiteB) => {
          suiteB.app((appB) => appB.name("app0"));
        })
        .name("the-check-run")
        .title("check run title")
        .status("REQUESTED")
        .conclusion("ACTION_REQUIRED")
        .detailsUrl("https://some-domain.org/check-run-details")
        .build();

      const statusContext = new StatusContextBuilder()
        .context("the-status-context")
        .state("EXPECTED")
        .targetUrl("https://another-domain.net/status-context-details")
        .build();

      const response = buildSearchResponse([checkRun, statusContext]);

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open",
          rollupCursor: null,
        },
        response
      );

      const prs = await locator.inRepositories([]);
      assert.lengthOf(prs, 1);
      const pr = prs[0];
      assert.lengthOf(pr.statuses, 2);

      const status0 = pr.statuses[0] as CheckRunStatus;
      assert.instanceOf(status0, CheckRunStatus);
      assert.strictEqual(status0.suiteName, "app0");
      assert.strictEqual(status0.runName, "the-check-run");
      assert.strictEqual(status0.status, "REQUESTED");
      assert.strictEqual(status0.conclusion, "ACTION_REQUIRED");
      assert.strictEqual(
        status0.url,
        "https://some-domain.org/check-run-details"
      );

      const status1 = pr.statuses[1] as ContextStatus;
      assert.instanceOf(status1, ContextStatus);
      assert.strictEqual(status1.context, "the-status-context");
      assert.strictEqual(status1.state, "EXPECTED");
      assert.strictEqual(
        status1.url,
        "https://another-domain.net/status-context-details"
      );
    });

    it("requests additional pages of statuses until there are no more pages", async function () {
      const statusesPage0 = ["context0-0", "context0-1", "context0-2"].map(
        (contextName) => new StatusContextBuilder().context(contextName).build()
      );
      const statusesPage1 = ["context1-0", "context1-1", "context1-2"].map(
        (contextName) => new StatusContextBuilder().context(contextName).build()
      );
      const statusesPage2 = ["context2-0", "context2-1"].map((contextName) =>
        new StatusContextBuilder().context(contextName).build()
      );

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open",
          rollupCursor: null,
        },
        buildSearchResponse(statusesPage0, "ROLL000", "CUR000", true)
      );
      graphQL.expect(
        rollupPaginationQuery,
        {rollupId: "ROLL000", rollupCursor: "CUR000"},
        buildPaginationResponse(statusesPage1, "ROLL000", "CUR001", true)
      );
      graphQL.expect(
        rollupPaginationQuery,
        {rollupId: "ROLL000", rollupCursor: "CUR001"},
        buildPaginationResponse(statusesPage2, "ROLL000", "CUR002", false)
      );

      const prs = await locator.inRepositories([]);
      assert.lengthOf(prs, 1);
      const pr = prs[0];

      assert.lengthOf(pr.statuses, 8);
      assert.deepEqual(
        [
          "context0-0",
          "context0-1",
          "context0-2",
          "context1-0",
          "context1-1",
          "context1-2",
          "context2-0",
          "context2-1",
        ],
        pr.statuses.map((status) => (status as ContextStatus).context)
      );
    });
  });

  describe("reviews", function () {
    it("collects requested reviews and collates them with received reviews", async function () {
      const response = new PullRequestSearchBuilder()
        .search((searchB) => {
          searchB.nodes.add((prB) => {
            prB.reviewRequests((reqConnB) => {
              reqConnB.nodes.add((reqB) => {
                reqB.requestedReviewer((revB) => revB.slug("team-0"));
              });
              reqConnB.nodes.add((reqB) => {
                reqB.requestedReviewer((revB) => revB.slug("team-1"));
              });
              reqConnB.nodes.add((reqB) => {
                reqB.requestedReviewer((revB) => revB.slug("team-2"));
              });
            });

            prB.reviews((revConnB) => {
              revConnB.nodes.add((revB) => {
                revB.author((authorB) => authorB.login("author-0"));
                revB.onBehalfOf((behalfB) => {
                  behalfB.nodes.add((teamB) => teamB.slug("team-2"));
                });
                revB.state("COMMENTED");
              });
              revConnB.nodes.add((revB) => {
                revB.author((authorB) => authorB.login("author-1"));
                revB.onBehalfOf((behalfB) => {
                  behalfB.nodes.add((teamB) => teamB.slug("team-0"));
                });
                revB.state("DISMISSED");
              });
              revConnB.nodes.add((revB) => {
                revB.author((authorB) => authorB.login("author-2"));
                revB.onBehalfOf((behalfB) => {
                  behalfB.nodes.add((teamB) => teamB.slug("team-2"));
                  behalfB.nodes.add((teamB) => teamB.slug("team-0"));
                });
                revB.state("APPROVED");
              });
              revConnB.nodes.add((revB) => {
                revB.author((authorB) => authorB.login("author-3"));
                revB.onBehalfOf((behalfB) => {
                  behalfB.nodes.add((teamB) => teamB.slug("team-999"));
                });
                revB.state("CHANGES_REQUESTED");
              });
            });
          });
        })
        .build();

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open",
          rollupCursor: null,
        },
        response
      );

      const prs = await locator.inRepositories([]);
      assert.lengthOf(prs, 1);
      const pr = prs[0];

      assert.lengthOf(pr.requestedReviews, 4);

      const rr0 = pr.requestedReviews[0];
      assert.strictEqual(rr0.teamName, "team-0");
      assert.lengthOf(rr0.receivedReviews, 2);
      assert.deepEqual(["author-1", "author-2"], rr0.reviewers());
      assert.strictEqual(rr0.summarizedState(), "APPROVED");

      const rr1 = pr.requestedReviews[1];
      assert.strictEqual(rr1.teamName, "team-1");
      assert.isEmpty(rr1.receivedReviews);

      const rr2 = pr.requestedReviews[2];
      assert.strictEqual(rr2.teamName, "team-2");
      assert.lengthOf(rr2.receivedReviews, 2);
      assert.deepEqual(["author-0", "author-2"], rr2.reviewers());
      assert.strictEqual(rr2.summarizedState(), "APPROVED");

      const rr3 = pr.requestedReviews[3];
      assert.strictEqual(rr3.teamName, "team-999");
      assert.lengthOf(rr3.receivedReviews, 1);
      assert.deepEqual(["author-3"], rr3.reviewers());
      assert.strictEqual(rr3.summarizedState(), "CHANGES_REQUESTED");
    });

    it("disregards non-team review requests", async function () {
      const response = new PullRequestSearchBuilder()
        .search((searchB) => {
          searchB.nodes.add((prB) => {
            prB.reviewRequests((reqConnB) => {
              reqConnB.nodes.add((reqB) => {
                reqB.requestedReviewer((revB) => revB.slug("team-0"));
              });
              reqConnB.nodes.add((reqB) => {
                reqB.requestedReviewer((revB) => revB.slug(undefined));
              });
            });
          });
        })
        .build();

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open",
          rollupCursor: null,
        },
        response
      );

      const prs = await locator.inRepositories([]);
      assert.lengthOf(prs, 1);
      const pr = prs[0];

      assert.lengthOf(pr.requestedReviews, 1);
      assert.strictEqual(pr.requestedReviews[0].teamName, "team-0");
    });

    it("disregards reviews not given on behalf of a team", async function () {
      const response = new PullRequestSearchBuilder()
        .search((searchB) => {
          searchB.nodes.add((prB) => {
            prB.reviewRequests((reqConnB) => {
              reqConnB.nodes.add((reqB) => {
                reqB.requestedReviewer((revB) => revB.slug("team-0"));
              });
            });

            prB.reviews((revConnB) => {
              revConnB.nodes.add((revB) => {
                revB.author((authorB) => authorB.login("author-0"));
                revB.state("APPROVED");
              });
            });
          });
        })
        .build();

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open",
          rollupCursor: null,
        },
        response
      );

      const prs = await locator.inRepositories([]);
      assert.lengthOf(prs, 1);
      const pr = prs[0];
      assert.lengthOf(pr.requestedReviews, 1);
      assert.strictEqual(pr.requestedReviews[0].teamName, "team-0");
      assert.isEmpty(pr.requestedReviews[0].receivedReviews);
    });
  });
});
