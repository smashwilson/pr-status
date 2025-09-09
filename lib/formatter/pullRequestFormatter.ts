import chalk from "chalk";
import {PullRequest} from "../model/pullRequest.js";
import {Formatter} from "./formatter.js";

export class PullRequestFormatter implements Formatter {
  pullRequest: PullRequest;
  verbose: boolean;
  buildsToShow: number;

  constructor(pullRequest: PullRequest, verbose: boolean, buildsToShow: number) {
    this.pullRequest = pullRequest;
    this.verbose = verbose;
    this.buildsToShow = buildsToShow;
  }

  string(): string {
    const lines = [chalk.underline(this.pullRequest.url), this.summaryLine()];

    const buildOutput = this.builds();
    if (buildOutput.length > 0) {
      lines.push(buildOutput);
    }

    const reviewOutput = this.reviews();
    if (reviewOutput.length > 0) {
      lines.push(reviewOutput);
    }

    return lines.join("\n");
  }

  private summaryLine(): string {
    const parts: string[] = [];
    if (this.pullRequest.isDraft) {
      parts.push(chalk.magenta("[DRAFT]"));
    }
    if (this.pullRequest.isReadyToGo()) {
      parts.push(chalk.green(chalk.bold(this.pullRequest.title)));
    } else {
      parts.push(chalk.bold(this.pullRequest.title));
    }

    if (
      !this.pullRequest.buildsAreReady() &&
      this.pullRequest.totalBuildCount() > 0
    ) {
      parts.push(
        `[builds ${this.pullRequest.okBuildCount()} / ${this.pullRequest.totalBuildCount()}]`
      );
    }

    if (
      !this.pullRequest.reviewsAreReady() &&
      this.pullRequest.totalReviewCount() > 0
    ) {
      parts.push(
        `[reviews ${this.pullRequest.okReviewCount()} / ${this.pullRequest.totalReviewCount()}]`
      );
    }

    return parts.join(" ");
  }

  private builds(): string {
    const lines: string[] = [];

    const includedBuilds = this.verbose
      ? this.pullRequest.statuses
      : this.pullRequest.statuses.filter(
          (status) => status.isPending() || status.isFailed()
        );
    const visibleBuilds = includedBuilds.slice(0, this.buildsToShow);

    const hiddenBuilds = new Set(this.pullRequest.statuses);
    for (const build of visibleBuilds) {
      lines.push(build.formatter().string());
      hiddenBuilds.delete(build);
    }

    if (hiddenBuilds.size > 0) {
      let pendingCount = 0;
      let failedCount = 0;
      let succeededCount = 0;
      let neutralCount = 0;

      for (const build of hiddenBuilds) {
        if (build.isPending()) {
          pendingCount++;
        } else if (build.isFailed()) {
          failedCount++;
        } else if (build.isSuccess()) {
          succeededCount++;
        } else if (build.isNeutral()) {
          neutralCount++;
        }
      }

      const parts: string[] = [];
      if (pendingCount > 0) parts.push(`${pendingCount} pending`);
      if (failedCount > 0) parts.push(`${failedCount} failed`);
      if (neutralCount > 0) parts.push(`${neutralCount} neutral`);
      if (succeededCount > 0) parts.push(`${succeededCount} succeeded`);
      lines.push(`[+ ${parts.join(" ")} builds]`);
    }

    return lines.map((line) => "  " + line).join("\n");
  }

  private reviews(): string {
    if (this.pullRequest.isDraft) {
      return "";
    }

    const lines: string[] = [];

    for (const requestedReview of this.pullRequest.requestedReviews) {
      lines.push(requestedReview.formatter().string());
    }

    return lines.map((line) => "  " + line).join("\n");
  }
}
