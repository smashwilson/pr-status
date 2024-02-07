import {assert} from "chai";
import {buildRequestedReview} from "../helpers/builders/requestedReviewBuilder.js";
import {buildReview} from "../helpers/builders/reviewBuilder.js";

describe("ReviewRequestFormatter", function () {
  it("renders a review request with no reviews", function () {
    const req = buildRequestedReview({
      teamName: "teen-girl-squad",
    });
    const formatted = req.formatter().string();

    assert.strictEqual(formatted, "⏳ teen-girl-squad");
  });

  it("renders a review request with summarized state and reviewers", function () {
    const req = buildRequestedReview({
      teamName: "teen-girl-squad",
      receivedReviews: [
        buildReview({reviewer: "reviewer-0", state: "COMMENTED"}),
        buildReview({reviewer: "reviewer-1", state: "DISMISSED"}),
        buildReview({reviewer: "reviewer-2", state: "APPROVED"}),
      ],
    });
    const formatted = req.formatter().string();

    assert.strictEqual(
      formatted,
      "✅ teen-girl-squad: @reviewer-0, @reviewer-1, @reviewer-2"
    );
  });
});
