import {Review, ReviewState} from "../../../lib/model/review.js";

export function buildReview(
  opts: {reviewer?: string; state?: ReviewState} = {}
) {
  return new Review(opts.reviewer || "reviewer", opts.state || "PENDING");
}
