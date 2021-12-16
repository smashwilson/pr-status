import type {Status} from "./status";

export class PullRequest {
  repoOwner: string;
  repoName: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;

  statuses: Status[] = [];

  constructor(
    repoOwner: string,
    repoName: string,
    number: number,
    title: string,
    url: string,
    isDraft: boolean
  ) {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.number = number;
    this.title = title;
    this.url = url;
    this.isDraft = isDraft;
  }
}
