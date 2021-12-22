import {assert} from "chai";
import chalk from "chalk";
import {buildContextStatus} from "../helpers/builders/contextStatusBuilder";

describe("ContextStatusFormatter", function () {
  it("renders a pending context status", function () {
    const context = buildContextStatus({
      context: "the-context",
      state: "PENDING",
    });
    const formatted = context.formatter().string();

    assert.strictEqual(formatted, "⏳ the-context");
  });

  it("renders a successful context status", function () {
    const context = buildContextStatus({
      context: "the-context",
      state: "SUCCESS",
    });
    const formatted = context.formatter().string();

    assert.strictEqual(formatted, "✅ the-context [success]");
  });

  it("renders a failed context status", function () {
    const context = buildContextStatus({
      context: "the-context",
      state: "ERROR",
      url: "https://github.com/",
    });
    const formatted = context.formatter().string();

    assert.strictEqual(
      formatted,
      "❌ the-context [error] " + chalk.underline("https://github.com/")
    );
  });
});
