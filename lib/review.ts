export type ReviewState = 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED';

const POSITIVE_STATES = new Set<ReviewState>(
  ['APPROVED', 'DISMISSED'],
);

export class Review {
  reviewer: string;
  state: ReviewState;

  constructor(reviewer: string, state: ReviewState) {
    this.reviewer = reviewer;
    this.state = state;
  }

  isPositive(): boolean {
    return POSITIVE_STATES.has(this.state);
  }

  isApproval(): boolean {
    return this.state === 'APPROVED';
  }

  isDenial(): boolean {
    return this.state === 'CHANGES_REQUESTED';
  }
}
