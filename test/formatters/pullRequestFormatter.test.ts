import {assert} from "chai";
import chalk from "chalk";
import {buildCheckRunStatus} from "../helpers/builders/checkRunStatusBuilder";
import {buildContextStatus} from "../helpers/builders/contextStatusBuilder";
import {buildPullRequest} from "../helpers/builders/pullRequestBuilder";
import {buildRequestedReview} from "../helpers/builders/requestedReviewBuilder";
import {buildReview} from "../helpers/builders/reviewBuilder";

describe("PullRequestFormatter", function () {
  it("renders a draft pull request with no statuses or reviews", function () {
    const pr = buildPullRequest({
      url: "https://github.com/smashwilson/pr-status/pulls/1",
      title: "Mock Pull Request Data",
      isDraft: true,
    });
    const formatted = pr.formatter(false).string();

    assert.strictEqual(
      formatted,
      [
        chalk.underline("https://github.com/smashwilson/pr-status/pulls/1"),
        chalk.magenta("[DRAFT]") + " " + chalk.bold("Mock Pull Request Data"),
      ].join("\n")
    );
  });

  it("renders a non-draft pull request with no statuses or reviews", function () {
    const pr = buildPullRequest({
      url: "https://github.com/smashwilson/pr-status/pulls/2",
      title: "More Pull Request Data",
      isDraft: false,
    });
    const formatted = pr.formatter(false).string();

    assert.strictEqual(
      formatted,
      [
        chalk.underline("https://github.com/smashwilson/pr-status/pulls/2"),
        chalk.bold("More Pull Request Data"),
      ].join("\n")
    );
  });

  it("renders a pull request with pending and completed builds and review requests non-verbosely", function () {
    const statuses = [
      buildCheckRunStatus({
        status: "PENDING",
        suiteName: "suite",
        runName: "status0",
      }),
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "SUCCESS",
        suiteName: "suite",
        runName: "status1",
      }),
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "FAILURE",
        suiteName: "suite",
        runName: "status2",
        url: "https://check-run.org/failed",
      }),
      buildContextStatus({
        context: "status3",
        state: "PENDING",
      }),
      buildContextStatus({
        context: "status4",
        state: "SUCCESS",
      }),
      buildContextStatus({
        context: "status5",
        state: "FAILURE",
        url: "https://context.net/failed",
      }),
    ];

    const requestedReviews = [
      buildRequestedReview({teamName: "slate"}),
      buildRequestedReview({
        teamName: "talc",
        receivedReviews: [
          buildReview({reviewer: "reviewer0", state: "APPROVED"}),
        ],
      }),
    ];

    const pr = buildPullRequest({
      url: "https://github.com/smashwilson/pr-status/pulls/3",
      title: "Mixed Pull Request Data",
      statuses,
      requestedReviews,
    });
    const formatted = pr.formatter(false).string();

    assert.strictEqual(
      formatted,
      [
        chalk.underline("https://github.com/smashwilson/pr-status/pulls/3"),
        chalk.bold("Mixed Pull Request Data") +
          " [builds 2 / 6] [reviews 1 / 2]",
        "  ⏳ suite / status0",
        "  ❌ suite / status2 [failure] " +
          chalk.underline("https://check-run.org/failed"),
        "  ⏳ status3",
        "  ❌ status5 [failure] " +
          chalk.underline("https://context.net/failed"),
        "  [+ 2 succeeded builds]",
        "  ⏳ slate",
        "  ✅ talc: @reviewer0",
      ].join("\n")
    );
  });

  it("renders a pull request with pending and completed builds and review requests verbosely", function () {
    const statuses = [
      buildCheckRunStatus({
        status: "PENDING",
        suiteName: "suite",
        runName: "status0",
      }),
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "SUCCESS",
        suiteName: "suite",
        runName: "status1",
      }),
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "FAILURE",
        suiteName: "suite",
        runName: "status2",
        url: "https://check-run.org/failed",
      }),
      buildContextStatus({
        context: "status3",
        state: "PENDING",
      }),
      buildContextStatus({
        context: "status4",
        state: "SUCCESS",
      }),
      buildContextStatus({
        context: "status5",
        state: "FAILURE",
        url: "https://context.net/failed",
      }),
    ];

    const requestedReviews = [
      buildRequestedReview({teamName: "slate"}),
      buildRequestedReview({
        teamName: "talc",
        receivedReviews: [
          buildReview({reviewer: "reviewer0", state: "APPROVED"}),
        ],
      }),
    ];

    const pr = buildPullRequest({
      url: "https://github.com/smashwilson/pr-status/pulls/3",
      title: "Mixed Pull Request Data",
      statuses,
      requestedReviews,
    });
    const formatted = pr.formatter(true).string();

    assert.strictEqual(
      formatted,
      [
        chalk.underline("https://github.com/smashwilson/pr-status/pulls/3"),
        chalk.bold("Mixed Pull Request Data") +
          " [builds 2 / 6] [reviews 1 / 2]",
        "  ⏳ suite / status0",
        "  ✅ suite / status1 [success]",
        "  ❌ suite / status2 [failure] " +
          chalk.underline("https://check-run.org/failed"),
        "  ⏳ status3",
        "  ✅ status4 [success]",
        "  ❌ status5 [failure] " +
          chalk.underline("https://context.net/failed"),
        "  ⏳ slate",
        "  ✅ talc: @reviewer0",
      ].join("\n")
    );
  });

  it("renders a pull request with fullfilled builds and reviews non-verbosely", function () {
    const statuses = [
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "SUCCESS",
      }),
      buildContextStatus({
        state: "SUCCESS",
      }),
    ];

    const requestedReviews = [
      buildRequestedReview({
        teamName: "malachite",
        receivedReviews: [
          buildReview({reviewer: "reviewer0", state: "APPROVED"}),
        ],
      }),
    ];

    const pr = buildPullRequest({
      url: "https://github.com/smashwilson/pr-status/pulls/4",
      title: "Completed Pull Request Data",
      statuses,
      requestedReviews,
    });
    const formatted = pr.formatter(false).string();

    assert.strictEqual(
      formatted,
      [
        chalk.underline("https://github.com/smashwilson/pr-status/pulls/4"),
        chalk.green(chalk.bold("Completed Pull Request Data")),
        "  [+ 2 succeeded builds]",
        "  ✅ malachite: @reviewer0",
      ].join("\n")
    );
  });

  it("renders a pull request with fullfilled builds and reviews verbosely", function () {
    const statuses = [
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "SUCCESS",
        suiteName: "suite",
        runName: "run",
      }),
      buildContextStatus({
        state: "SUCCESS",
        context: "context",
      }),
    ];

    const requestedReviews = [
      buildRequestedReview({
        teamName: "malachite",
        receivedReviews: [
          buildReview({reviewer: "reviewer0", state: "APPROVED"}),
        ],
      }),
    ];

    const pr = buildPullRequest({
      url: "https://github.com/smashwilson/pr-status/pulls/4",
      title: "Completed Pull Request Data",
      statuses,
      requestedReviews,
    });
    const formatted = pr.formatter(true).string();

    assert.strictEqual(
      formatted,
      [
        chalk.underline("https://github.com/smashwilson/pr-status/pulls/4"),
        chalk.green(chalk.bold("Completed Pull Request Data")),
        "  ✅ suite / run [success]",
        "  ✅ context [success]",
        "  ✅ malachite: @reviewer0",
      ].join("\n")
    );
  });
});
