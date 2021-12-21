import {assert} from "chai";
import {buildCheckRunStatus} from "../helpers/builders/checkRunStatusBuilder";
import {buildContextStatus} from "../helpers/builders/contextStatusBuilder";
import {buildPullRequest} from "../helpers/builders/pullRequestBuilder";
import {buildRequestedReview} from "../helpers/builders/requestedReviewBuilder";

describe("PullRequest", function () {
  it("counts successful or neutral and total builds", function () {
    const pr = buildPullRequest({
      statuses: [
        buildCheckRunStatus({status: "IN_PROGRESS"}),
        buildCheckRunStatus({conclusion: "FAILURE"}),
        buildCheckRunStatus({conclusion: "SUCCESS"}), // +1
        buildCheckRunStatus({conclusion: "NEUTRAL"}), // +1
        buildCheckRunStatus({conclusion: "STALE"}), // +1
        buildContextStatus({state: "EXPECTED"}),
        buildContextStatus({state: "ERROR"}),
        buildContextStatus({state: "SUCCESS"}), // +1
      ],
    });

    assert.strictEqual(pr.okBuildCount(), 4);
    assert.strictEqual(pr.totalBuildCount(), 8);
  });

  it("counts successful and total requested reviews", function () {
    const pr = buildPullRequest({
      requestedReviews: [
        buildRequestedReview({receivedReviewStates: ["PENDING"]}),
        buildRequestedReview({receivedReviewStates: ["COMMENTED"]}),
        buildRequestedReview({receivedReviewStates: ["COMMENTED", "APPROVED"]}), // +1
        buildRequestedReview({
          receivedReviewStates: ["COMMENTED", "CHANGES_REQUESTED"],
        }),
        buildRequestedReview({receivedReviewStates: ["DISMISSED"]}), // +1
      ],
    });

    assert.strictEqual(pr.okReviewCount(), 2);
    assert.strictEqual(pr.totalReviewCount(), 5);
  });

  describe("buildsAreReady", function () {
    it("returns true if there are no builds", function () {
      assert.isTrue(buildPullRequest().buildsAreReady());
    });

    it("returns false if any build is pending", function () {
      const pr = buildPullRequest({
        statuses: [
          buildCheckRunStatus({conclusion: "SUCCESS"}),
          buildCheckRunStatus({status: "PENDING"}),
          buildCheckRunStatus({conclusion: "SUCCESS"}),
        ],
      });

      assert.isFalse(pr.buildsAreReady());
    });

    it("returns false if any build is failing", function () {
      const pr = buildPullRequest({
        statuses: [
          buildCheckRunStatus({conclusion: "NEUTRAL"}),
          buildContextStatus({state: "ERROR"}),
          buildCheckRunStatus({conclusion: "SUCCESS"}),
        ],
      });

      assert.isFalse(pr.buildsAreReady());
    });

    it("returns true if all builds are either neutral or successful", function () {
      const pr = buildPullRequest({
        statuses: [
          buildCheckRunStatus({conclusion: "NEUTRAL"}),
          buildCheckRunStatus({conclusion: "SUCCESS"}),
          buildContextStatus({state: "SUCCESS"}),
        ],
      });

      assert.isTrue(pr.buildsAreReady());
    });
  });

  describe("reviewsAreReady", function () {
    it("returns false if there are no reviews", function () {
      assert.isFalse(buildPullRequest().reviewsAreReady());
    });

    it("returns false if any review is unfulfilled", function () {
      const pr = buildPullRequest({
        requestedReviews: [
          buildRequestedReview({
            receivedReviewStates: ["COMMENTED", "APPROVED"],
          }),
          buildRequestedReview({
            receivedReviewStates: ["COMMENTED"],
          }),
          buildRequestedReview({
            receivedReviewStates: ["COMMENTED", "APPROVED"],
          }),
        ],
      });

      assert.isFalse(pr.reviewsAreReady());
    });

    it("returns false if no review is an approval", function () {
      const pr = buildPullRequest({
        requestedReviews: [
          buildRequestedReview({
            receivedReviewStates: ["COMMENTED", "DISMISSED"],
          }),
          buildRequestedReview({
            receivedReviewStates: ["DISMISSED"],
          }),
          buildRequestedReview({
            receivedReviewStates: ["DISMISSED"],
          }),
        ],
      });

      assert.isFalse(pr.reviewsAreReady());
    });

    it("returns true if all reviews are fulfilled and at least one has an approval", function () {
      const pr = buildPullRequest({
        requestedReviews: [
          buildRequestedReview({
            receivedReviewStates: ["COMMENTED", "DISMISSED"],
          }),
          buildRequestedReview({
            receivedReviewStates: ["APPROVED"],
          }),
          buildRequestedReview({
            receivedReviewStates: ["DISMISSED"],
          }),
        ],
      });

      assert.isTrue(pr.reviewsAreReady());
    });
  });

  describe("isReadyToGo", function () {
    it("returns false for a draft PR", function () {
      const pr = buildPullRequest({
        isDraft: true,
        statuses: [buildContextStatus({state: "SUCCESS"})],
        requestedReviews: [
          buildRequestedReview({receivedReviewStates: ["APPROVED"]}),
        ],
      });

      assert.isFalse(pr.isReadyToGo());
    });

    it("returns true if statuses and reviews are ready", function () {
      const pr = buildPullRequest({
        statuses: [buildContextStatus({state: "SUCCESS"})],
        requestedReviews: [
          buildRequestedReview({receivedReviewStates: ["APPROVED"]}),
        ],
      });

      assert.isTrue(pr.isReadyToGo());
    });
  });
});
