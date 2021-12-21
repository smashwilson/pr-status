import {
  CheckConclusionState,
  CheckRunStatus,
  CheckStatusState,
} from "../../../lib/model/checkRunStatus";

export function buildCheckRunStatus(
  opts: {
    url?: string;
    suiteName?: string;
    runName?: string;
    status?: CheckStatusState;
    conclusion?: CheckConclusionState;
  } = {}
): CheckRunStatus {
  return new CheckRunStatus(
    opts.url || "https://example.com",
    opts.suiteName || "suite",
    opts.runName || "run",
    opts.status || "COMPLETED",
    opts.conclusion || "NEUTRAL"
  );
}
