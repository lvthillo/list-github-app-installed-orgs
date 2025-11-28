# List GitHub App Installed Organizations

[![CI](https://github.com/lvthillo/list-github-app-installed-orgs/actions/workflows/ci.yml/badge.svg)](https://github.com/lvthillo/list-github-app-installed-orgs/actions/workflows/ci.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that retrieves all organizations where a GitHub App is
installed. Perfect for automating workflows that need to discover and operate
across multiple organizations managed by your app.

## What It Does

This action authenticates as a GitHub App and queries the GitHub API to retrieve
a list of all organizations where the app is currently installed. It returns the
organization login names as a JSON array, making it easy to use in subsequent
workflow steps.

## When to Use This Action

Use this action when you need to:

- Audit which organizations have your GitHub App installed
- Dynamically generate a matrix of organizations for parallel workflow jobs
- Automate operations across all organizations where your app is installed
- Monitor app installation status across your enterprise
- Build dashboards or reports about app adoption

## Usage

### Basic Example

```yaml
name: List App Organizations
on:
  workflow_dispatch:

jobs:
  list-orgs:
    runs-on: ubuntu-latest
    steps:
      - name: Get Organizations
        id: get-orgs
        uses: lvthillo/list-github-app-installed-orgs@v1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Display Organizations
        run: echo "Organizations: ${{ steps.get-orgs.outputs.organizations }}"
```

### Matrix Strategy Example

Use the output to run jobs across all organizations:

```yaml
name: Run Across All Organizations
on:
  workflow_dispatch:

jobs:
  get-organizations:
    runs-on: ubuntu-latest
    outputs:
      orgs: ${{ steps.get-orgs.outputs.organizations }}
    steps:
      - name: Get Organizations
        id: get-orgs
        uses: lvthillo/list-github-app-installed-orgs@v1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

  process-organizations:
    needs: get-organizations
    runs-on: ubuntu-latest
    strategy:
      matrix:
        org: ${{ fromJson(needs.get-organizations.outputs.orgs) }}
    steps:
      - name: Process Organization
        run: echo "Processing organization: ${{ matrix.org }}"
```

## Inputs

| Input         | Description                                    | Required |
| ------------- | ---------------------------------------------- | -------- |
| `app-id`      | The GitHub App ID (found in your app settings) | Yes      |
| `private-key` | The GitHub App private key in PEM format       | Yes      |

## Outputs

| Output          | Description                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `organizations` | JSON array of organization login names where the app is installed (e.g., `["org1", "org2", "org3"]`) |

## Setting Up Secrets

You will need to store your GitHub App credentials as secrets:

1. Go to your repository Settings > Secrets and variables > Actions
1. Add two secrets:
   - `APP_ID`: Your GitHub App ID
   - `APP_PRIVATE_KEY`: Your GitHub App private key (the entire PEM file
     contents)

To find your GitHub App credentials:

1. Navigate to your GitHub App settings (Settings > Developer settings > GitHub
   Apps)
1. Note the App ID at the top of the page
1. Generate a private key if you have not already (scroll down to "Private keys"
   section)

## Requirements

- A GitHub App with appropriate permissions
- The app must be installed on one or more organizations
- GitHub App credentials (App ID and private key)

## Permissions

Your GitHub App needs the following permissions:

- Organization permissions: Read-only access to organization metadata (this is
  typically granted by default)

## Contributing

Want to contribute or modify this action? See [CONTRIBUTING.md](CONTRIBUTING.md)
for development guidelines.

## License

MIT
