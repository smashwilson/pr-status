import {Formatter} from "../formatter/formatter";

export abstract class Status {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  isPending(): boolean {
    return true;
  }

  isCompleted(): boolean {
    return !this.isPending();
  }

  isSuccess(): boolean {
    return false;
  }

  isNeutral(): boolean {
    return false;
  }

  isFailed(): boolean {
    return false;
  }

  emoji(): string {
    if (this.isPending()) {
      return "⏳";
    } else if (this.isSuccess()) {
      return "✅";
    } else if (this.isNeutral()) {
      return "☑️ ";
    } else if (this.isFailed()) {
      return "❌";
    } else {
      return "❔";
    }
  }

  abstract formatter(): Formatter;
}
