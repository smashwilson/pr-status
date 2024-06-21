import {CheckRunStatus} from "../model/checkRunStatus.js";
import {ContextStatus} from "../model/contextStatus.js";
import type {GraphQL} from "../graphQL.js";
import {PullRequest} from "../model/pullRequest.js";
import {RequestedReview} from "../model/requestedReview.js";
import {Review} from "../model/review.js";
import {Status} from "../model/status.js";
import {
  pullRequestSearchQuery,
  PullRequestSearchResponse,
} from "./queries/pullRequestSearch.js";
import {
  rollupPaginationQuery,
  RollupPaginationResponse,
} from "./queries/rollupPagination.js";
import {
  isCheckRun,
  isStatusContext,
  StatusCheckRollupFragment,
} from "./queries/statusCheckRollupFragment.js";
import {
  pullRequestByNumberQuery,
  PullRequestByNumberResponse,
} from "./queries/pullRequestByNumber.js";

interface RollupPageRequest {
  rollupId: string;
  rollupCursor: string;
  pullRequest: PullRequest;
}

export class PullRequestLocator {
  graphql: GraphQL;

  constructor(graphql: GraphQL) {
    this.graphql = graphql;
  }

  async inRepositories(nwos: string[]): Promise<PullRequest[]> {
    const searchParts = ["is:pr author:@me state:open"];
    for (const nwo of nwos) {
      searchParts.push(`repo:${nwo}`);
    }
    const pullRequestData = await this.graphql.query<PullRequestSearchResponse>(
      pullRequestSearchQuery,
      {
        search: searchParts.join(" "),
        rollupCursor: null,
      }
    );

    const pullRequests: PullRequest[] = [];
    const rollupPages: Set<RollupPageRequest> = new Set();
    for (const node of pullRequestData.search.nodes) {
      const rollup = node.commits.nodes[0].commit.statusCheckRollup;

      const pullRequest = new PullRequest(
        node.id,
        node.baseRepository.owner.login,
        node.baseRepository.name,
        node.number,
        node.title,
        node.url,
        node.isDraft,
        this.statuses(rollup),
        this.requestedReviews(node)
      );

      const rollupPageInfo = rollup?.contexts.pageInfo;
      if (rollup && rollupPageInfo?.hasNextPage) {
        rollupPages.add({
          rollupId: rollup.id,
          rollupCursor: rollupPageInfo.endCursor,
          pullRequest,
        });
      }

      pullRequests.push(pullRequest);
    }

    await this.collectRollupPages(rollupPages);

    return pullRequests;
  }

  async byNumber(
    owner: string,
    name: string,
    number: number
  ): Promise<PullRequest | null> {
    const pullRequestData =
      await this.graphql.query<PullRequestByNumberResponse>(
        pullRequestByNumberQuery,
        {
          owner: owner,
          name: name,
          number: number,
        }
      );

    const node = pullRequestData.repository?.pullRequest;
    if (!node) {
      return null;
    }

    const rollup = node.commits.nodes[0].commit.statusCheckRollup;

    const pullRequest = new PullRequest(
      node.id,
      node.baseRepository.owner.login,
      node.baseRepository.name,
      node.number,
      node.title,
      node.url,
      node.isDraft,
      this.statuses(rollup),
      this.requestedReviews(node)
    );

    const rollupPageInfo = rollup?.contexts.pageInfo;
    if (rollup && rollupPageInfo?.hasNextPage) {
      await this.collectRollupPages(
        new Set([
          {
            rollupId: rollup.id,
            rollupCursor: rollupPageInfo.endCursor,
            pullRequest,
          },
        ])
      );
    }

    return pullRequest;
  }

  private requestedReviews(
    pullRequestNode: PullRequestSearchResponse["search"]["nodes"][number]
  ): RequestedReview[] {
    const requestedReviewsById = new Map<string, RequestedReview>();
    for (const reviewRequestNode of pullRequestNode.reviewRequests.nodes) {
      const teamName = reviewRequestNode.requestedReviewer.slug;
      if (teamName) {
        requestedReviewsById.set(teamName, new RequestedReview(teamName));
      }
    }

    for (const reviewNode of pullRequestNode.reviews.nodes) {
      const review = new Review(reviewNode.author.login, reviewNode.state);

      for (const onBehalfOfNode of reviewNode.onBehalfOf.nodes) {
        const teamName = onBehalfOfNode.slug;
        let requestedReview = requestedReviewsById.get(teamName);
        if (!requestedReview) {
          requestedReview = new RequestedReview(teamName);
          requestedReviewsById.set(teamName, requestedReview);
        }
        requestedReview.receivedReviews.push(review);
      }
    }

    return Array.from(requestedReviewsById.values());
  }

  private statuses(rollupNode?: StatusCheckRollupFragment): Status[] {
    if (!rollupNode) {
      return [];
    }

    const statuses: Status[] = [];
    for (const contextNode of rollupNode.contexts.nodes) {
      if (isCheckRun(contextNode)) {
        statuses.push(
          new CheckRunStatus(
            contextNode.detailsUrl,
            contextNode.checkSuite.app.name,
            contextNode.name,
            contextNode.status,
            contextNode.conclusion
          )
        );
      } else if (isStatusContext(contextNode)) {
        statuses.push(
          new ContextStatus(
            contextNode.targetUrl,
            contextNode.context,
            contextNode.state
          )
        );
      }
    }
    return statuses;
  }

  private async collectRollupPages(pending: Set<RollupPageRequest>) {
    let currentRollups = pending;
    while (currentRollups.size > 0) {
      const nextRollups = new Set<RollupPageRequest>();
      await Promise.all(
        Array.from(currentRollups, async (rollup) => {
          const nextRollup = await this.getNextRollupPage(rollup);
          if (nextRollup) {
            nextRollups.add(nextRollup);
          }
        })
      );
      currentRollups = nextRollups;
    }
  }

  private async getNextRollupPage(
    rollup: RollupPageRequest
  ): Promise<RollupPageRequest | null> {
    const nextRollupPage = await this.graphql.query<RollupPaginationResponse>(
      rollupPaginationQuery,
      {
        rollupId: rollup.rollupId,
        rollupCursor: rollup.rollupCursor,
      }
    );

    const nextRollup = nextRollupPage.node;
    if (!nextRollup) {
      return null;
    }

    rollup.pullRequest.statuses.push(...this.statuses(nextRollupPage.node));

    const pageInfo = nextRollup.contexts.pageInfo;
    if (pageInfo.hasNextPage) {
      return {
        rollupId: nextRollup.id,
        rollupCursor: pageInfo.endCursor,
        pullRequest: rollup.pullRequest,
      };
    } else {
      return null;
    }
  }
}
