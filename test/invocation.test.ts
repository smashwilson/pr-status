import {assert} from "chai";
import {fileURLToPath} from "url";
import {Invocation} from "../lib/invocation.js";
import {pullRequestSearchQuery} from "../lib/service/queries/pullRequestSearch.js";
import {PullRequestSearchBuilder} from "./helpers/builders/responses/pullRequestSearchBuilders.js";
import {PullRequestByNumberBuilder} from "./helpers/builders/responses/pullRequestByNumberBuilders.js";
import {CannedGraphQL} from "./helpers/cannedGraphQL.js";
import {StringBuffer} from "./helpers/stringBuffer.js";
import {pullRequestByNumberQuery} from "../lib/service/queries/pullRequestByNumber.js";

describe("Invocation", function () {
  function args(...args: string[]) {
    const filename = fileURLToPath(import.meta.url);
    return [process.argv[0], filename, ...args];
  }

  describe("configuredFrom", function () {
    it("fails if no token can be located", function () {
      assert.throws(() => Invocation.configuredFrom(args(), {}));
    });

    it("accepts a token from the --token argument", function () {
      const i = Invocation.configuredFrom(args("--token", "RIGHTTOKEN"), {
        GH_GH_PAT: "WRONGTOKEN0",
        GITHUB_TOKEN: "WRONGTOKEN1",
      });
      assert.strictEqual(i.token, "RIGHTTOKEN");
    });

    it("finds a token from the GH_GH_PAT env var", function () {
      const i = Invocation.configuredFrom(args(), {
        GH_GH_PAT: "RIGHTTOKEN",
        GITHUB_TOKEN: "WRONGTOKEN1",
      });
      assert.strictEqual(i.token, "RIGHTTOKEN");
    });

    it("finds a token from the GITHUB_TOKEN env var", function () {
      const i = Invocation.configuredFrom(args(), {
        GITHUB_TOKEN: "RIGHTTOKEN",
      });
      assert.strictEqual(i.token, "RIGHTTOKEN");
    });

    it("accepts a single repository", function () {
      const i = Invocation.configuredFrom(args("-r", "smashwilson/pr-status"), {
        GITHUB_TOKEN: "RIGHTTOKEN",
      });
      assert.deepEqual(["smashwilson/pr-status"], i.repos);
      assert.isEmpty(i.pullRequests);
    });

    it("accepts multiple repositories", function () {
      const i = Invocation.configuredFrom(
        args(
          "--repo",
          "smashwilson/pr-status",
          "--repo",
          "smashwilson/nested-builder"
        ),
        {GITHUB_TOKEN: "RIGHTTOKEN"}
      );
      assert.deepEqual(i.repos, [
        "smashwilson/pr-status",
        "smashwilson/nested-builder",
      ]);
      assert.isEmpty(i.pullRequests);
    });

    it("accepts a single pull request by URL", function () {
      const i = Invocation.configuredFrom(
        args(
          "--pull-request",
          "https://github.com/smashwilson/pr-status/pull/122"
        ),
        {GITHUB_TOKEN: "RIGHTTOKEN"}
      );
      assert.isEmpty(i.repos);
      assert.deepEqual(i.pullRequests, [
        {owner: "smashwilson", name: "pr-status", number: 122},
      ]);
    });

    it("accepts a single pull request by short reference form", function () {
      const i = Invocation.configuredFrom(
        args("--pull-request", "the-repo/name#456"),
        {GITHUB_TOKEN: "RIGHTTOKEN"}
      );
      assert.isEmpty(i.repos);
      assert.deepEqual(i.pullRequests, [
        {owner: "the-repo", name: "name", number: 456},
      ]);
    });

    it("accepts multiple pull requests", function () {
      const i = Invocation.configuredFrom(
        args(
          "--pull-request",
          "found/by-short-string#100",
          "--pull-request",
          "https://github.com/found/by-url/pull/200",
          "--pull-request",
          "https://github.com/found/by-long-url/pull/300/checks"
        ),
        {GITHUB_TOKEN: "RIGHTTOKEN"}
      );
      assert.isEmpty(i.repos);
      assert.deepEqual(i.pullRequests, [
        {owner: "found", name: "by-short-string", number: 100},
        {owner: "found", name: "by-url", number: 200},
        {owner: "found", name: "by-long-url", number: 300},
      ]);
    });

    it("uses GITHUB_REPOSITORY when no repos or pull requests are specified", function () {
      const i = Invocation.configuredFrom(args(), {
        GITHUB_REPOSITORY: "smashwilson/pr-status",
        GITHUB_TOKEN: "RIGHTTOKEN",
      });
      assert.deepEqual(["smashwilson/pr-status"], i.repos);
      assert.isEmpty(i.pullRequests);
    });

    it("overrides GITHUB_REPOSITORY with any -r flags", function () {
      const i = Invocation.configuredFrom(args("--repo", "wat/huh"), {
        GITHUB_REPOSITORY: "smashwilson/pr-status",
        GITHUB_TOKEN: "RIGHTTOKEN",
      });
      assert.deepEqual(["wat/huh"], i.repos);
      assert.isEmpty(i.pullRequests);
    });

    it("overrides GITHUB_REPOSITORY with a -p flag", function () {
      const i = Invocation.configuredFrom(
        args("--pull-request", "wat/huh#123"),
        {
          GITHUB_REPOSITORY: "smashwilson/pr-status",
          GITHUB_TOKEN: "RIGHTTOKEN",
        }
      );
      assert.isEmpty(i.repos);
      assert.deepEqual(i.pullRequests, [
        {owner: "wat", name: "huh", number: 123},
      ]);
    });

    it("accepts the number of builds to show with the -n flag", function () {
      const i = Invocation.configuredFrom(
        args("-n", "17", "--repo", "smashwilson/pr-status"),
        {GITHUB_TOKEN: "RIGHTTOKEN"},
      );
      assert.strictEqual(17, i.buildsToShow);
    });

    it("defaults to 10 visible builds", function () {
      const i = Invocation.configuredFrom(
        args("--repo", "smashwilson/pr-status"),
        {GITHUB_TOKEN: "RIGHTTOKEN"},
      );
      assert.strictEqual(10, i.buildsToShow);
    });
  });

  describe("report", function () {
    it("queries the GraphQL API and reports all returned pull requests", async function () {
      const graphQL = new CannedGraphQL();
      const output = new StringBuffer();

      const searchResponse = new PullRequestSearchBuilder()
        .search((searchB) => {
          searchB.nodes.add((prB) => prB.title("Zero"));
          searchB.nodes.add((prB) => prB.title("One"));
          searchB.nodes.add((prB) => prB.title("Two"));
        })
        .build();

      const byNumberResponse = new PullRequestByNumberBuilder()
        .repository((repoB) => {
          repoB.pullRequest((prB) => prB.title("Three"));
        })
        .build();

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open repo:aaa/repo0 repo:aaa/repo1",
          rollupCursor: null,
        },
        searchResponse
      );

      graphQL.expect(
        pullRequestByNumberQuery,
        {
          owner: "the-owner",
          name: "a-name",
          number: 123,
        },
        byNumberResponse
      );

      const i = new Invocation(
        graphQL,
        output,
        "TOKEN",
        ["aaa/repo0", "aaa/repo1"],
        [{owner: "the-owner", name: "a-name", number: 123}],
        false,
        false,
        10,
      );
      await i.execute();

      assert.match(output.contents, /Zero/);
      assert.match(output.contents, /One/);
      assert.match(output.contents, /Two/);
      assert.match(output.contents, /Three/);
    });
  });
});
