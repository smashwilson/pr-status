import { RequestedReview } from "./requestedReview";
import type {Status} from "./status";

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
    requestedReviews: RequestedReview[],
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
}
