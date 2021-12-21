import {assert} from "chai";
import {buildContextStatus} from "../helpers/builders/contextStatusBuilder";

describe("ContextStatus", function () {
  it("identifies a pending status", function () {
    assert.isTrue(buildContextStatus({state: "EXPECTED"}).isPending());
    assert.isTrue(buildContextStatus({state: "PENDING"}).isPending());

    assert.isFalse(buildContextStatus({state: "ERROR"}).isPending());
    assert.isFalse(buildContextStatus({state: "FAILURE"}).isPending());
    assert.isFalse(buildContextStatus({state: "SUCCESS"}).isPending());
  });

  it("identifies a successful status", function () {
    assert.isTrue(buildContextStatus({state: "SUCCESS"}).isSuccess());

    assert.isFalse(buildContextStatus({state: "EXPECTED"}).isSuccess());
    assert.isFalse(buildContextStatus({state: "PENDING"}).isSuccess());
    assert.isFalse(buildContextStatus({state: "ERROR"}).isSuccess());
    assert.isFalse(buildContextStatus({state: "FAILURE"}).isSuccess());
  });

  it("identifies a failed status", function () {
    assert.isTrue(buildContextStatus({state: "FAILURE"}).isFailed());
    assert.isTrue(buildContextStatus({state: "ERROR"}).isFailed());

    assert.isFalse(buildContextStatus({state: "SUCCESS"}).isFailed());
    assert.isFalse(buildContextStatus({state: "EXPECTED"}).isFailed());
    assert.isFalse(buildContextStatus({state: "PENDING"}).isFailed());
  });

  it("is never neutral", function () {
    assert.isFalse(buildContextStatus({state: "FAILURE"}).isNeutral());
    assert.isFalse(buildContextStatus({state: "SUCCESS"}).isNeutral());
    assert.isFalse(buildContextStatus({state: "EXPECTED"}).isNeutral());
    assert.isFalse(buildContextStatus({state: "PENDING"}).isNeutral());
    assert.isFalse(buildContextStatus({state: "ERROR"}).isNeutral());
  });
});
