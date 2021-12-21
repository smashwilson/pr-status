import {CheckRunStatusFormatter} from "../formatter/checkRunStatusFormatter";
import {Formatter} from "../formatter/formatter";
import {Status} from "./status";

export type CheckStatusState =
  | "QUEUED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "WAITING"
  | "PENDING"
  | "REQUESTED";

export type CheckConclusionState =
  | "ACTION_REQUIRED"
  | "TIMED_OUT"
  | "CANCELLED"
  | "FAILURE"
  | "SUCCESS"
  | "NEUTRAL"
  | "SKIPPED"
  | "STARTUP_FAILURE"
  | "STALE";

const NEUTRAL_CONCLUSIONS: Set<CheckConclusionState> = new Set([
  "NEUTRAL",
  "STALE",
]);

const FAILURE_CONCLUSIONS: Set<CheckConclusionState> = new Set([
  "TIMED_OUT",
  "CANCELLED",
  "FAILURE",
  "STARTUP_FAILURE",
]);

export class CheckRunStatus extends Status {
  suiteName: string;
  runName: string;
  status: CheckStatusState;
  conclusion: CheckConclusionState;

  constructor(
    url: string,
    suiteName: string,
    runName: string,
    status: CheckStatusState,
    conclusion: CheckConclusionState
  ) {
    super(url);
    this.suiteName = suiteName;
    this.runName = runName;
    this.status = status;
    this.conclusion = conclusion;
  }

  isPending(): boolean {
    return this.status !== "COMPLETED";
  }

  isSuccess(): boolean {
    return this.isCompleted() && this.conclusion === "SUCCESS";
  }

  isNeutral(): boolean {
    return this.isCompleted() && NEUTRAL_CONCLUSIONS.has(this.conclusion);
  }

  isFailed(): boolean {
    return this.isCompleted() && FAILURE_CONCLUSIONS.has(this.conclusion);
  }

  formatter(): Formatter {
    return new CheckRunStatusFormatter(this);
  }
}
