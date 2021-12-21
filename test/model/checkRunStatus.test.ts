import {assert} from "chai";
import {buildCheckRunStatus} from "../helpers/builders/checkRunStatusBuilder";

describe("CheckRunStatus", function () {
  it("determines if the check run is pending based on state", function () {
    assert.isTrue(buildCheckRunStatus({status: "QUEUED"}).isPending());
    assert.isTrue(buildCheckRunStatus({status: "IN_PROGRESS"}).isPending());
    assert.isTrue(buildCheckRunStatus({status: "WAITING"}).isPending());
    assert.isTrue(buildCheckRunStatus({status: "PENDING"}).isPending());
    assert.isTrue(buildCheckRunStatus({status: "REQUESTED"}).isPending());

    assert.isFalse(buildCheckRunStatus({status: "COMPLETED"}).isPending());
  });

  it("identifies completed check runs that are successful", function () {
    assert.isFalse(
      buildCheckRunStatus({status: "QUEUED", conclusion: "SUCCESS"}).isSuccess()
    );
    assert.isFalse(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "NEUTRAL",
      }).isSuccess()
    );

    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "SUCCESS",
      }).isSuccess()
    );
  });

  it("identifies completed check runs that are neutral", function () {
    assert.isFalse(
      buildCheckRunStatus({status: "QUEUED", conclusion: "NEUTRAL"}).isNeutral()
    );
    assert.isFalse(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "CANCELLED",
      }).isNeutral()
    );

    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "NEUTRAL",
      }).isNeutral()
    );
    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "STALE",
      }).isNeutral()
    );
  });

  it("identifies completed check runs that are failures", function () {
    assert.isFalse(
      buildCheckRunStatus({status: "QUEUED", conclusion: "FAILURE"}).isFailed()
    );
    assert.isFalse(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "SUCCESS",
      }).isFailed()
    );

    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "TIMED_OUT",
      }).isFailed()
    );
    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "CANCELLED",
      }).isFailed()
    );
    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "FAILURE",
      }).isFailed()
    );
    assert.isTrue(
      buildCheckRunStatus({
        status: "COMPLETED",
        conclusion: "STARTUP_FAILURE",
      }).isFailed()
    );
  });

  it("generates appropriate emoji based on its state and conclusion", function () {
    assert.strictEqual(
      buildCheckRunStatus({status: "IN_PROGRESS"}).emoji(),
      "⏳"
    );
    assert.strictEqual(
      buildCheckRunStatus({status: "COMPLETED", conclusion: "SUCCESS"}).emoji(),
      "✅"
    );
    assert.strictEqual(
      buildCheckRunStatus({status: "COMPLETED", conclusion: "NEUTRAL"}).emoji(),
      "☑️ "
    );
    assert.strictEqual(
      buildCheckRunStatus({status: "COMPLETED", conclusion: "FAILURE"}).emoji(),
      "❌"
    );
  });
});
