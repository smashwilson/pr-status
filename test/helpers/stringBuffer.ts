import {OutputWriter} from "../../lib/invocation.js";

export class StringBuffer implements OutputWriter {
  contents: string;
  writable = true;

  constructor() {
    this.contents = "";
  }

  write(str: string) {
    this.contents += str;
  }
}
