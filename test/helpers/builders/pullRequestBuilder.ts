import {PullRequest} from "../../../lib/model/pullRequest.js";
import {RequestedReview} from "../../../lib/model/requestedReview.js";
import {Status} from "../../../lib/model/status.js";

export function buildPullRequest(
  opts: {
    id?: string;
    repoOwner?: string;
    repoName?: string;
    number?: number;
    title?: string;
    url?: string;
    isDraft?: boolean;
    statuses?: Status[];
    requestedReviews?: RequestedReview[];
  } = {}
) {
  return new PullRequest(
    opts.id || "==ABC123",
    opts.repoOwner || "owner",
    opts.repoName || "repo",
    opts.number || 1,
    opts.title || "title",
    opts.url || "https://github.com/owner/repo/pulls/1",
    opts.isDraft != undefined ? opts.isDraft : false,
    opts.statuses || [],
    opts.requestedReviews || []
  );
}
