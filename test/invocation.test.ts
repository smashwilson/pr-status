import {assert} from "chai";
import {fileURLToPath} from "url";
import {Invocation} from "../lib/invocation.js";
import {pullRequestSearchQuery} from "../lib/service/queries/pullRequestSearch.js";
import {PullRequestSearchBuilder} from "./helpers/builders/responses/pullRequestSearchBuilders.js";
import {CannedGraphQL} from "./helpers/cannedGraphQL.js";
import {StringBuffer} from "./helpers/stringBuffer.js";

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
    });

    it("uses GITHUB_REPOSITORY when no repos are specified", function () {
      const i = Invocation.configuredFrom(args(), {
        GITHUB_REPOSITORY: "smashwilson/pr-status",
        GITHUB_TOKEN: "RIGHTTOKEN",
      });
      assert.deepEqual(["smashwilson/pr-status"], i.repos);
    });

    it("overrides GITHUB_REPOSITORY with any -r flags", function () {
      const i = Invocation.configuredFrom(args("--repo", "wat/huh"), {
        GITHUB_REPOSITORY: "smashwilson/pr-status",
        GITHUB_TOKEN: "RIGHTTOKEN",
      });
      assert.deepEqual(["wat/huh"], i.repos);
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

      graphQL.expect(
        pullRequestSearchQuery,
        {
          search: "is:pr author:@me state:open repo:aaa/repo0 repo:aaa/repo1",
          rollupCursor: null,
        },
        searchResponse
      );

      const i = new Invocation(
        graphQL,
        output,
        "TOKEN",
        ["aaa/repo0", "aaa/repo1"],
        false,
        false
      );
      await i.execute();

      assert.match(output.contents, /Zero/);
      assert.match(output.contents, /One/);
      assert.match(output.contents, /Two/);
    });
  });
});
