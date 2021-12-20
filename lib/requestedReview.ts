import { Review } from "./review";

export class RequestedReview {
  teamName: string;
  receivedReviews: Review[] = [];

  constructor(teamName: string) {
    this.teamName = teamName;
  }
}
