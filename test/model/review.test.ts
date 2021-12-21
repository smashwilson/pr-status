import {assert} from "chai";
import {buildReview} from "../helpers/builders/reviewBuilder";

describe("Review", function () {
  it("identifies a non-neutral review", function () {
    assert.isTrue(buildReview({state: "APPROVED"}).isOpinionated());
    assert.isTrue(buildReview({state: "CHANGES_REQUESTED"}).isOpinionated());
    assert.isTrue(buildReview({state: "DISMISSED"}).isOpinionated());

    assert.isFalse(buildReview({state: "PENDING"}).isOpinionated());
    assert.isFalse(buildReview({state: "COMMENTED"}).isOpinionated());
  });
});
