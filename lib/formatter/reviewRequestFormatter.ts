import {RequestedReview} from "../model/requestedReview.js";
import {Formatter} from "./formatter.js";

export class ReviewRequestFormatter implements Formatter {
  reviewRequest: RequestedReview;

  constructor(reviewRequest: RequestedReview) {
    this.reviewRequest = reviewRequest;
  }

  string(): string {
    const prefix = `${this.reviewRequest.emoji()} ${
      this.reviewRequest.teamName
    }`;
    if (this.reviewRequest.receivedReviews.length > 0) {
      return (
        prefix +
        `: ${this.reviewRequest
          .reviewers()
          .map((reviewer) => "@" + reviewer)
          .join(", ")}`
      );
    } else {
      return prefix;
    }
  }
}
