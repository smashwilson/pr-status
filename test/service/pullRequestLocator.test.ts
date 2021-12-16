import {assert} from "chai";

import {PullRequestLocator} from "../../lib/service/pullRequestLocator";
import {
  pullRequestSearchQuery,
  PullRequestSearchQueryResponse,
} from "../../lib/service/queries/pullRequestSearch";
import {CannedGraphQL} from "../helpers/cannedGraphQL";

describe("PullRequestLocator", function () {
  let graphql: CannedGraphQL;
  let locator: PullRequestLocator;

  beforeEach(function () {
    graphql = new CannedGraphQL();
    locator = new PullRequestLocator(graphql);
  });

  it("finds pull requests authored by you in a specific repository", async function () {
    graphql.expect<PullRequestSearchQueryResponse>(
      pullRequestSearchQuery,
      {search: "is:pr author:@me state:open repo:aaa/bbb"},
      {
        search: {
          nodes: [
            {
              id: "00aa",
              isDraft: true,
              number: 1,
              title: "One",
              url: "https://github.com/aaa/bbb/1",
              baseRepository: {
                name: "bbb",
                owner: {
                  login: "aaa",
                },
              },
            },
            {
              id: "11bb",
              isDraft: false,
              number: 2,
              title: "Two",
              url: "https://github.com/aaa/bbb/2",
              baseRepository: {
                name: "bbb",
                owner: {
                  login: "aaa",
                },
              },
            },
          ],
        },
      }
    );

    const pullRequests = await locator.inRepositories(["aaa/bbb"]);

    assert.lengthOf(pullRequests, 2);
    const pr0 = pullRequests[0];
    assert.strictEqual("00aa", pr0.id);
    assert.isTrue(pr0.isDraft);
    assert.strictEqual(pr0.number, 1);
    assert.strictEqual(pr0.title, "One");
    assert.strictEqual(pr0.url, "https://github.com/aaa/bbb/1");
    assert.strictEqual(pr0.repoOwner, "aaa");
    assert.strictEqual(pr0.repoName, "bbb");

    const pr1 = pullRequests[1];
    assert.strictEqual("11bb", pr1.id);
    assert.isFalse(pr1.isDraft);
    assert.strictEqual(pr1.number, 2);
    assert.strictEqual(pr1.title, "Two");
    assert.strictEqual(pr1.url, "https://github.com/aaa/bbb/2");
    assert.strictEqual(pr1.repoOwner, "aaa");
    assert.strictEqual(pr1.repoName, "bbb");
  });

  it("finds pull requests authored by you in several repositories", async function () {
    graphql.expect<PullRequestSearchQueryResponse>(
      pullRequestSearchQuery,
      {search: "is:pr author:@me state:open repo:aaa/zzz repo:bbb/yyy"},
      {
        search: {
          nodes: [
            {
              id: "123",
              isDraft: false,
              number: 11,
              title: "One",
              url: "https://github.com/aaa/zzz/11",
              baseRepository: {
                name: "zzz",
                owner: {
                  login: "aaa",
                },
              },
            },
            {
              id: "456",
              isDraft: false,
              number: 22,
              title: "Two",
              url: "https://github.com/bbb/yyy/22",
              baseRepository: {
                name: "yyy",
                owner: {
                  login: "bbb",
                },
              },
            },
          ],
        },
      }
    );

    const pullRequests = await locator.inRepositories(["aaa/zzz", "bbb/yyy"]);

    assert.lengthOf(pullRequests, 2);
    const pr0 = pullRequests[0];
    assert.strictEqual(pr0.id, "123");
    assert.isFalse(pr0.isDraft);
    assert.strictEqual(pr0.number, 11);
    assert.strictEqual(pr0.title, "One");
    assert.strictEqual(pr0.url, "https://github.com/aaa/zzz/11");
    assert.strictEqual(pr0.repoOwner, "aaa");
    assert.strictEqual(pr0.repoName, "zzz");

    const pr1 = pullRequests[1];
    assert.strictEqual(pr1.id, "456");
    assert.isFalse(pr1.isDraft);
    assert.strictEqual(pr1.number, 22);
    assert.strictEqual(pr1.title, "Two");
    assert.strictEqual(pr1.url, "https://github.com/bbb/yyy/22");
    assert.strictEqual(pr1.repoOwner, "bbb");
    assert.strictEqual(pr1.repoName, "yyy");
  });

  it("finds pull requests authored by you in all repositories", async function () {
    graphql.expect<PullRequestSearchQueryResponse>(
      pullRequestSearchQuery,
      {search: "is:pr author:@me state:open"},
      {
        search: {
          nodes: [
            {
              id: "000",
              isDraft: false,
              number: 11,
              title: "One",
              url: "https://github.com/aaa/zzz/11",
              baseRepository: {
                name: "zzz",
                owner: {
                  login: "aaa",
                },
              },
            },
            {
              id: "111",
              isDraft: false,
              number: 22,
              title: "Two",
              url: "https://github.com/bbb/yyy/22",
              baseRepository: {
                name: "yyy",
                owner: {
                  login: "bbb",
                },
              },
            },
          ],
        },
      }
    );

    const pullRequests = await locator.inRepositories([]);

    assert.lengthOf(pullRequests, 2);
    const pr0 = pullRequests[0];
    assert.strictEqual("000", pr0.id);
    assert.isFalse(pr0.isDraft);
    assert.strictEqual(pr0.number, 11);
    assert.strictEqual(pr0.title, "One");
    assert.strictEqual(pr0.url, "https://github.com/aaa/zzz/11");
    assert.strictEqual(pr0.repoOwner, "aaa");
    assert.strictEqual(pr0.repoName, "zzz");

    const pr1 = pullRequests[1];
    assert.strictEqual("111", pr1.id);
    assert.isFalse(pr1.isDraft);
    assert.strictEqual(pr1.number, 22);
    assert.strictEqual(pr1.title, "Two");
    assert.strictEqual(pr1.url, "https://github.com/bbb/yyy/22");
    assert.strictEqual(pr1.repoOwner, "bbb");
    assert.strictEqual(pr1.repoName, "yyy");
  });
});
