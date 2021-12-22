import {assert} from "chai";
import chalk from "chalk";
import {buildCheckRunStatus} from "../helpers/builders/checkRunStatusBuilder";

describe("CheckRunStatusFormatter", function () {
  it("renders a pending run", function () {
    const checkRun = buildCheckRunStatus({
      status: "PENDING",
      suiteName: "suite",
      runName: "run",
    });
    const formatted = checkRun.formatter().string();
    assert.strictEqual(formatted, "⏳ suite / run");
  });

  it("renders a successful run", function () {
    const checkRun = buildCheckRunStatus({
      status: "COMPLETED",
      conclusion: "SUCCESS",
      suiteName: "suite",
      runName: "run",
    });
    const formatted = checkRun.formatter().string();
    assert.strictEqual(formatted, "✅ suite / run [success]");
  });

  it("renders a failed run", function () {
    const checkRun = buildCheckRunStatus({
      status: "COMPLETED",
      conclusion: "STARTUP_FAILURE",
      suiteName: "suite",
      runName: "run",
      url: "https://pushbot.party/",
    });
    const formatted = checkRun.formatter().string();
    assert.strictEqual(
      formatted,
      "❌ suite / run [startup_failure] " +
        chalk.underline("https://pushbot.party/")
    );
  });
});
