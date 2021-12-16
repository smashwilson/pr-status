import type {GraphQL} from "../graphQL";
import {PullRequest} from "../pullRequest";
import { pullRequestSearchQuery, PullRequestSearchQueryResponse } from "./queries/pullRequestSearch";

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
    const pullRequestData = await this.graphql.query<PullRequestSearchQueryResponse>(pullRequestSearchQuery, {
      search: searchParts.join(" "),
    });

    return pullRequestData.search.nodes.map(node => {
      return new PullRequest(
        node.id,
        node.baseRepository.owner.login,
        node.baseRepository.name,
        node.number,
        node.title,
        node.url,
        node.isDraft,
      )
    })
  }
}
