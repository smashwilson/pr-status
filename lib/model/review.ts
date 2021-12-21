export type ReviewState =
  | "PENDING"
  | "COMMENTED"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "DISMISSED";

const OPINIONATED_STATES = new Set<ReviewState>([
  "APPROVED",
  "CHANGES_REQUESTED",
  "DISMISSED",
]);

export class Review {
  reviewer: string;
  state: ReviewState;

  constructor(reviewer: string, state: ReviewState) {
    this.reviewer = reviewer;
    this.state = state;
  }

  isOpinionated(): boolean {
    return OPINIONATED_STATES.has(this.state);
  }
}
