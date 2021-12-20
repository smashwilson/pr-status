import args from "args";
import { GraphQL } from "./graphQL";
import { PullRequestLocator } from "./service/pullRequestLocator";
import { inspect } from "util";

export class TerminationError {
  name: string = "TerminationError";
  message: string = "Throw to terminate the process with an abnormal exit status";
  exitCode: number;

  constructor(exitCode: number = 1) {
    this.exitCode = exitCode;
  }
}

export async function main(argv: string[]): Promise<void> {
  args
    .option(["t", "token"], "GitHub API token used for queries", "")
    .option(["r", "repo"], "Limit results to PRs in this repo", [])
    .option(["w", "wait"], "Poll for updates", false);
  const flags = args.parse(argv);

  const token: string = flags.token || process.env.GH_GH_PAT || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("You must specify an access token via one of:")
    console.error("- $GITHUB_TOKEN")
    console.error("- $GH_GH_PAT")
    console.error("- The -t/--token command line argument")
    throw new TerminationError();
  }

  const repos: string[] = flags.repo;
  if (repos.length === 0 && process.env.GITHUB_REPOSITORY) {
    repos.push(process.env.GITHUB_REPOSITORY);
  }

  const graphql = new GraphQL("https://api.github.com/graphql", token);

  const locator = new PullRequestLocator(graphql);
  const prs = await locator.inRepositories(repos);
  console.log(inspect(prs, { depth: undefined, colors: true }));
}
