import {RequestedReview} from "../../../lib/model/requestedReview";
import {Review, ReviewState} from "../../../lib/model/review";
import {buildReview} from "./reviewBuilder";

export function buildRequestedReview(
  opts: {
    teamName?: string;
    receivedReviews?: Review[];
    receivedReviewStates?: ReviewState[];
  } = {}
) {
  const req = new RequestedReview(opts.teamName || "team");
  req.receivedReviews = opts.receivedReviews || [];
  for (const state of opts.receivedReviewStates || []) {
    req.receivedReviews.push(buildReview({state}));
  }
  return req;
}
