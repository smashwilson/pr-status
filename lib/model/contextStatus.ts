import {ContextStatusFormatter} from "../formatter/contextStatusFormatter";
import {Formatter} from "../formatter/formatter";
import {Status} from "./status";

export type StatusState =
  | "EXPECTED"
  | "ERROR"
  | "FAILURE"
  | "PENDING"
  | "SUCCESS";

const PENDING_STATES: Set<StatusState> = new Set(["EXPECTED", "PENDING"]);

const FAILURE_STATES: Set<StatusState> = new Set(["ERROR", "FAILURE"]);

export class ContextStatus extends Status {
  context: string;
  state: StatusState;

  constructor(url: string, context: string, state: StatusState) {
    super(url);
    this.context = context;
    this.state = state;
  }

  isPending(): boolean {
    return PENDING_STATES.has(this.state);
  }

  isSuccess(): boolean {
    return this.state === "SUCCESS";
  }

  isFailed(): boolean {
    return FAILURE_STATES.has(this.state);
  }

  formatter(): Formatter {
    return new ContextStatusFormatter(this);
  }
}
