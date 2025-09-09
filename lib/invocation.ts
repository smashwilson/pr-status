import args from "args";
import chalk from "chalk";
import {GraphQL} from "./graphQL.js";
import {PullRequest} from "./model/pullRequest.js";
import {PullRequestLocator} from "./service/pullRequestLocator.js";

export interface TerminationError extends Error {
  exitCode: number;
}

export interface OutputWriter {
  write(str: string): void;
}

interface PullRequestDesignator {
  owner: string;
  name: string;
  number: number;
}

const PULL_URL_RX = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

const PULL_SHORT_RX = /^([^/]+)\/([^#]+)#(\d+)$/;

export class Invocation {
  token: string;
  repos: string[];
  pullRequests: PullRequestDesignator[];
  wait: boolean;
  verbose: boolean;
  buildsToShow: number;
  graphql: GraphQL;
  output: OutputWriter;

  constructor(
    graphql: GraphQL,
    output: OutputWriter,
    token: string,
    repos: string[] = [],
    pullRequests: PullRequestDesignator[] = [],
    wait: false,
    verbose: false,
    buildsToShow: number
  ) {
    this.token = token;
    this.repos = repos;
    this.pullRequests = pullRequests;
    this.wait = wait;
    this.verbose = verbose;
    this.buildsToShow = buildsToShow;
    this.graphql = graphql;
    this.output = output;
  }

  static configuredFrom(argv: string[], env: NodeJS.ProcessEnv) {
    args
      .option(["t", "token"], "GitHub API token used for queries", "")
      .option(["r", "repo"], "Limit results to PRs in this repo", [])
      .option(
        ["p", "pull-request"],
        "Limit results to individually identified pull requests",
        []
      )
      .option(["n", "num-builds"], "Number of builds to show", 10)
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

    const pullRequests: PullRequestDesignator[] =
      this.parsePullRequestDesignatorsFrom(flags.p);
    if (pullRequests.length !== flags.p.length) {
      console.error("Pull requests may be specified by URL or reference text:");
      console.error("- https://github.com/repo/name/pull/1234");
      console.error("- repo/name#1234");

      const error = new Error(
        "Unable to parse pull request"
      ) as TerminationError;
      error.exitCode = 1;
      throw error;
    }

    const repos: string[] = flags.repo;

    if (
      repos.length === 0 &&
      pullRequests.length === 0 &&
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
      pullRequests,
      flags.wait,
      flags.verbose,
      flags.n
    );
  }

  private static parsePullRequestDesignatorsFrom(
    args: string[]
  ): PullRequestDesignator[] {
    return args.flatMap((arg) => {
      const pullUrlMatch = PULL_URL_RX.exec(arg);
      if (pullUrlMatch) {
        return [
          {
            owner: pullUrlMatch[1],
            name: pullUrlMatch[2],
            number: parseInt(pullUrlMatch[3], 10),
          },
        ];
      }

      const pullShortMatch = PULL_SHORT_RX.exec(arg);
      if (pullShortMatch) {
        return [
          {
            owner: pullShortMatch[1],
            name: pullShortMatch[2],
            number: parseInt(pullShortMatch[3], 10),
          },
        ];
      }

      return [];
    });
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
      const pullRequests = await this.queryPullRequests(locator);
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
    const pullRequests = await this.queryPullRequests(locator);
    this.writePullRequests(pullRequests);
  }

  async queryPullRequests(locator: PullRequestLocator): Promise<PullRequest[]> {
    const promises: Promise<PullRequest[]>[] = [];

    if (this.repos.length > 0) {
      promises.push(locator.inRepositories(this.repos));
    }

    for (const {owner, name, number} of this.pullRequests) {
      const byNumberFn = async () => {
        const pullRequest = await locator.byNumber(owner, name, number);
        if (pullRequest) {
          return [pullRequest];
        } else {
          return [];
        }
      };

      promises.push(byNumberFn());
    }

    const results = await Promise.all(promises);
    return results.flat(1);
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
