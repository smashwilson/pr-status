import chalk from "chalk";
import {CheckRunStatus} from "../model/checkRunStatus.js";
import {Formatter} from "./formatter.js";

export class CheckRunStatusFormatter implements Formatter {
  status: CheckRunStatus;

  constructor(status: CheckRunStatus) {
    this.status = status;
  }

  string(): string {
    const parts: string[] = [];

    parts.push(
      `${this.status.emoji()} ${this.status.suiteName} / ${this.status.runName}`
    );

    if (!this.status.isPending()) {
      parts.push(`[${this.status.conclusion.toLocaleLowerCase()}]`);
    }

    if (this.status.isFailed()) {
      parts.push(chalk.underline(this.status.url));
    }

    return parts.join(" ");
  }
}
