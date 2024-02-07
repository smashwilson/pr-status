import {Formatter} from "../formatter/formatter.js";
import {ReviewRequestFormatter} from "../formatter/reviewRequestFormatter.js";
import {Review, ReviewState} from "./review.js";

const POSITIVE_STATES = new Set<ReviewState>(["APPROVED", "DISMISSED"]);

export class RequestedReview {
  teamName: string;
  receivedReviews: Review[] = [];
  private _summarizedState?: ReviewState;

  constructor(teamName: string) {
    this.teamName = teamName;
  }

  summarizedState(): ReviewState {
    if (this._summarizedState) return this._summarizedState;
    let state: ReviewState = "PENDING";
    for (const review of this.receivedReviews) {
      if (review.isOpinionated() || state === "PENDING") {
        state = review.state;
      }
    }
    this._summarizedState = state;
    return state;
  }

  reviewers(): string[] {
    return this.receivedReviews.map((review) => review.reviewer);
  }

  isFulfilled(): boolean {
    return POSITIVE_STATES.has(this.summarizedState());
  }

  hasApproval(): boolean {
    return this.summarizedState() === "APPROVED";
  }

  emoji(): string {
    const state = this.summarizedState();
    if (state === "PENDING") {
      return "⏳";
    } else if (state === "APPROVED") {
      return "✅";
    } else if (state === "DISMISSED") {
      return "☑️ ";
    } else if (state === "CHANGES_REQUESTED") {
      return "❌";
    } else if (state === "COMMENTED") {
      return "💬";
    } else {
      return "❔";
    }
  }

  formatter(): Formatter {
    return new ReviewRequestFormatter(this);
  }
}
