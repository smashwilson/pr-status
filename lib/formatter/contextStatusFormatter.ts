import chalk from "chalk";
import {ContextStatus} from "../model/contextStatus";
import {Formatter} from "./formatter";

export class ContextStatusFormatter implements Formatter {
  status: ContextStatus;

  constructor(status: ContextStatus) {
    this.status = status;
  }

  string(): string {
    const parts: string[] = [];

    parts.push(`${this.status.emoji()} ${this.status.context}`);

    if (this.status.isCompleted()) {
      parts.push(`[${this.status.state.toLocaleLowerCase()}]`);
    }

    if (this.status.isFailed()) {
      parts.push(chalk.underline(this.status.url));
    }

    return parts.join(" ");
  }
}
