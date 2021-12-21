import {assert} from "chai";
import {ReviewState} from "../../lib/model/review";
import {buildRequestedReview} from "../helpers/builders/requestedReviewBuilder";
import {buildReview} from "../helpers/builders/reviewBuilder";

describe("RequestedReview", function () {
  describe("summarizedState", function () {
    it("reports PENDING for requests that have no reviews yet", function () {
      assert.strictEqual(buildRequestedReview().summarizedState(), "PENDING");
    });

    it("reports COMMENTED if only COMMENTED reviews have been left", function () {
      const req = buildRequestedReview({receivedReviewStates: ["COMMENTED"]});

      assert.strictEqual(req.summarizedState(), "COMMENTED");
    });

    it("uses the most recent opinionated review state", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["COMMENTED", "DISMISSED", "APPROVED"],
      });

      assert.strictEqual(req.summarizedState(), "APPROVED");
    });
  });

  it("collects reviewers from received reviews", function () {
    const req = buildRequestedReview({
      receivedReviews: [
        buildReview({reviewer: "one"}),
        buildReview({reviewer: "two"}),
        buildReview({reviewer: "three"}),
      ],
    });

    assert.deepEqual(["one", "two", "three"], req.reviewers());
  });

  describe("isFulfilled", function () {
    it("returns false if no reviews have been provided", function () {
      assert.isFalse(buildRequestedReview().isFulfilled());
    });

    it("returns false if no opinionated reviews have been received", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["COMMENTED", "PENDING"],
      });

      assert.isFalse(req.isFulfilled());
    });

    it("returns false for a negative review", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["CHANGES_REQUESTED"],
      });

      assert.isFalse(req.isFulfilled());
    });

    it("returns true for a dismissed review", function () {
      const req = buildRequestedReview({receivedReviewStates: ["DISMISSED"]});

      assert.isTrue(req.isFulfilled());
    });

    it("returns true for an approving review", function () {
      const req = buildRequestedReview({receivedReviewStates: ["APPROVED"]});

      assert.isTrue(req.isFulfilled());
    });
  });

  describe("hasApproval", function () {
    it("returns false if no reviews have been provided", function () {
      assert.isFalse(buildRequestedReview().hasApproval());
    });

    it("returns false if no opinionated reviews have been received", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["PENDING", "COMMENTED", "COMMENTED"],
      });

      assert.isFalse(req.hasApproval());
    });

    it("returns false for a dismissed review", function () {
      const req = buildRequestedReview({receivedReviewStates: ["DISMISSED"]});

      assert.isFalse(req.hasApproval());
    });

    it("returns true with an approving review", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["DISMISSED", "APPROVED"],
      });

      assert.isTrue(req.hasApproval());
    });
  });

  describe("emoji", function () {
    it("returns a pending hourglass", function () {
      assert.strictEqual(buildRequestedReview().emoji(), "⏳");
    });

    it("returns a green check for approved", function () {
      const req = buildRequestedReview({receivedReviewStates: ["APPROVED"]});

      assert.strictEqual(req.emoji(), "✅");
    });

    it("returns a check for dismissed", function () {
      const req = buildRequestedReview({receivedReviewStates: ["DISMISSED"]});

      assert.strictEqual(req.emoji(), "☑️ ");
    });

    it("returns a red X for change requests", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["CHANGES_REQUESTED"],
      });

      assert.strictEqual(req.emoji(), "❌");
    });

    it("returns a speech bubble for commented", function () {
      const req = buildRequestedReview({receivedReviewStates: ["COMMENTED"]});

      assert.strictEqual(req.emoji(), "💬");
    });

    it("returns a question mark for unrecognized status", function () {
      const req = buildRequestedReview({
        receivedReviewStates: ["OOPS" as ReviewState],
      });

      assert.strictEqual(req.emoji(), "❔");
    });
  });
});
