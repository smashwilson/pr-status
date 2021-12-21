import args from "args";
import chalk from "chalk";
import {GraphQL} from "./graphQL";
import {PullRequest} from "./model/pullRequest";
import {PullRequestLocator} from "./service/pullRequestLocator";

export interface TerminationError extends Error {
  exitCode: number;
}

class Invocation {
  token: string;
  repos: string[];
  wait: boolean;
  verbose: boolean;
  graphql: GraphQL;
  output: NodeJS.WritableStream;

  constructor(
    graphql: GraphQL,
    output: NodeJS.WritableStream,
    token: string,
    repos: string[] = [],
    wait: false,
    verbose: false
  ) {
    this.token = token;
    this.repos = repos;
    this.wait = wait;
    this.verbose = verbose;
    this.graphql = graphql;
    this.output = output;
  }

  static configuredFrom(argv: string[], env: NodeJS.ProcessEnv) {
    args
      .option(["t", "token"], "GitHub API token used for queries", "")
      .option(["r", "repo"], "Limit results to PRs in this repo", [])
      .option(["w", "wait"], "Poll for updates", false)
      .option(["v", "verbose"], "Include successful builds in output", false);
    const flags = args.parse(argv);

    const token: string = flags.token || env.GH_GH_PAT || env.GITHUB_TOKEN;
    if (!token) {
      console.error("You must specify an access token via one of:");
      console.error("- $GITHUB_TOKEN");
      console.error("- $GH_GH_PAT");
      console.error("- The -t/--token command line argument");

      const error = new Error("Token not provided") as TerminationError;
      error.exitCode = 1;
      throw error;
    }

    const repos: string[] = flags.repo;
    if (
      repos.length === 0 &&
      env.GITHUB_REPOSITORY &&
      env.GITHUB_REPOSITORY.length > 0
    ) {
      repos.push(env.GITHUB_REPOSITORY);
    }

    const graphql = new GraphQL("https://api.github.com/graphql", token);

    return new this(
      graphql,
      process.stdout,
      token,
      repos,
      flags.wait,
      flags.verbose
    );
  }

  execute(): Promise<void> {
    const locator = new PullRequestLocator(this.graphql);

    if (this.wait) {
      return this.poll(locator);
    } else {
      return this.report(locator);
    }
  }

  async poll(locator: PullRequestLocator): Promise<void> {
    while (true) {
      const pullRequests = await locator.inRepositories(this.repos);
      const ts = new Date();

      this.clear();
      this.write(
        `⌚️ ${this.formatTime(ts)} ${chalk.dim(this.formatRateLimit())}\n\n`
      );
      this.writePullRequests(pullRequests);

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  async report(locator: PullRequestLocator): Promise<void> {
    const pullRequests = await locator.inRepositories(this.repos);
    this.writePullRequests(pullRequests);
  }

  private write(text: string): this {
    this.output.write(text);
    return this;
  }

  private clear(): this {
    return this.write("\x1b[2J\x1b[0f");
  }

  private writePullRequests(pullRequests: PullRequest[]): this {
    return this.write(
      pullRequests
        .map(
          (pullRequest) => pullRequest.formatter(this.verbose).string() + "\n"
        )
        .join("\n")
    );
  }

  // Because it's silly to pull in an entire dependency just for this.
  private formatTime(date: Date): string {
    let timeString = "";
    let ampm = "am";

    let hours = date.getHours();
    if (hours > 12) {
      ampm = "pm";
      hours -= 12;
    }
    if (hours < 10) timeString += "0";
    timeString += hours.toString(10);

    timeString += ":";

    const minutes = date.getMinutes();
    if (minutes < 10) timeString += "0";
    timeString += minutes.toString(10);

    timeString += ":";

    const seconds = date.getSeconds();
    if (seconds < 10) timeString += "0";
    timeString += seconds.toString(10);

    timeString += " ";
    timeString += ampm;

    return timeString;
  }

  private formatRateLimit(): string {
    let limitString = "[rate limit ";

    const leftString = this.graphql.rateLimitLeft.toString(10);
    const totalString = this.graphql.rateLimitTotal.toString(10);

    for (let i = 0; i < totalString.length - leftString.length; i++) {
      limitString += " ";
    }
    limitString += leftString;
    limitString += "/";
    limitString += totalString;
    limitString += "]";
    return limitString;
  }
}

export function main(argv: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return Invocation.configuredFrom(argv, env).execute();
}
