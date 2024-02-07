#!/usr/bin/env node

import {main} from "./invocation.js";

main(process.argv, process.env).catch((error) => {
  if (error.exitCode) {
    process.exit(error.exitCode);
  } else {
    console.error("Unhandled exception");
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
});
