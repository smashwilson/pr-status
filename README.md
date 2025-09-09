# pr-status

Command-line script to produce a report of your open pull requests, including the current status of builds and requested code reviews. It can optionally poll for updates.

## Installation

pr-status is tested on [Node.JS 20](https://nodejs.org/en/). Use `npm` to install:

```bash
npm install -g @smashwilson/pr-status
```

## Usage

You must provide a valid [GitHub API token](https://github.com/settings/tokens), with at least the `repo` permission, for the script to use. You may provide this token in one of three ways:

- An environment variable called `GITHUB_TOKEN`;
- An environment variable called `GH_GH_PAT`;
- Or by passing it as an argument to the `-t` or `--token` command-line arguments.

Queried pull requests may optionally be scoped by repository or specified individually. Specify `-r` or `--repo` several times to only include pull requests within the named repositories. Use `-p` or `--pull-request` to indicate pull requests individually, using either the full pull request URL for your browser (`https://github.com/smashwilson/pr-status/pull/123`; any subpage will work) or a short reference string (`smashwilson/pr-status#123`).

If omitted and a `GITHUB_REPOSITORY` environment variable is present and non-empty (such as within a Codespace), its value will be used.

Otherwise, here's the usage:

```
Usage: pr status [options] [command]

Commands:
  help     Display help
  version  Display version

Options:
  -h, --help                 Output usage information
  -n, --num-builds <n>       Number of builds to show (defaults to 10)
  -p, --pull-request <list>  Limit results to individually identified pull requests (defaults to [])
  -r, --repo <list>          Limit results to PRs in this repo (defaults to [])
  -t, --token                GitHub API token used for queries (defaults to "")
  -v, --verbose              Include successful builds in output (disabled by default)
  -V, --version              Output the version number
  -w, --wait                 Poll for updates (disabled by default)
```
