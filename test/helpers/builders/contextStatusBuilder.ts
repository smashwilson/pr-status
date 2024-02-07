import {ContextStatus, StatusState} from "../../../lib/model/contextStatus.js";

export function buildContextStatus(
  opts: {url?: string; context?: string; state?: StatusState} = {}
) {
  return new ContextStatus(
    opts.url || "https://example.com",
    opts.context || "context",
    opts.state || "SUCCESS"
  );
}
