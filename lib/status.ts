export class Status {
  isRequired: boolean;
  url: string;

  constructor(isRequired: boolean, url: string) {
    this.isRequired = isRequired;
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
      return "☑️";
    } else if (this.isFailed()) {
      return "❌";
    } else {
      return "❔";
    }
  }
}
