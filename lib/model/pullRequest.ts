import {Formatter} from "../formatter/formatter.js";
import {PullRequestFormatter} from "../formatter/pullRequestFormatter.js";
import {RequestedReview} from "./requestedReview.js";
import type {Status} from "./status.js";

export class PullRequest {
  id: string;
  repoOwner: string;
  repoName: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;

  statuses: Status[];
  requestedReviews: RequestedReview[];

  constructor(
    id: string,
    repoOwner: string,
    repoName: string,
    number: number,
    title: string,
    url: string,
    isDraft: boolean,
    statuses: Status[],
    requestedReviews: RequestedReview[]
  ) {
    this.id = id;
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.number = number;
    this.title = title;
    this.url = url;
    this.isDraft = isDraft;
    this.statuses = statuses;
    this.requestedReviews = requestedReviews;
  }

  isReadyToGo(): boolean {
    return !this.isDraft && this.buildsAreReady() && this.reviewsAreReady();
  }

  buildsAreReady(): boolean {
    return this.statuses.every(
      (status) => status.isCompleted() && !status.isFailed()
    );
  }

  okBuildCount(): number {
    let ok = 0;
    for (const status of this.statuses) {
      if (status.isSuccess() || status.isNeutral()) {
        ok++;
      }
    }
    return ok;
  }

  totalBuildCount(): number {
    return this.statuses.length;
  }

  reviewsAreReady(): boolean {
    return (
      this.requestedReviews.every((req) => req.isFulfilled()) &&
      this.requestedReviews.some((req) => req.hasApproval())
    );
  }

  okReviewCount(): number {
    let ok = 0;
    for (const req of this.requestedReviews) {
      if (req.isFulfilled()) {
        ok++;
      }
    }
    return ok;
  }

  totalReviewCount(): number {
    return this.requestedReviews.length;
  }

  formatter(verbose: boolean): Formatter {
    return new PullRequestFormatter(this, verbose);
  }
}
