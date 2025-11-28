# Contributing to GitHub App Organization List

Thanks for your interest in contributing! This guide will help you get started
with development.

## Development Setup

### Prerequisites

- Node.js 24.x or later (see `.node-version` file)
- npm (comes with Node.js)

### Initial Setup

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

1. Install dependencies

   ```bash
   npm install
   ```

1. Build the action

   ```bash
   npm run bundle
   ```

1. Run tests

   ```bash
   npm test
   ```

## Development Workflow

### Project Structure

- `src/` - TypeScript source code
  - `main.ts` - Main action logic
  - `index.ts` - Entry point
- `__tests__/` - Jest test files
- `dist/` - Compiled JavaScript (generated, do not edit directly)
- `action.yml` - Action metadata and interface definition

### Making Changes

1. Create a new branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

1. Make your changes in the `src/` directory

1. Add or update tests in `__tests__/`

1. Run the full build and test suite

   ```bash
   npm run all
   ```

   This command will:
   - Format code with Prettier
   - Lint with ESLint
   - Run tests with Jest
   - Generate coverage report
   - Bundle the action with Rollup

### Testing Locally

You can test the action locally without pushing to GitHub:

1. Create a `.env` file with your test credentials

   ```bash
   cp .env.example .env
   ```

1. Edit `.env` and add your GitHub App credentials:

   ```env
   INPUT_APP_ID=your-app-id
   INPUT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
   your-private-key-content
   -----END RSA PRIVATE KEY-----
   ```

1. Run the action locally

   ```bash
   npm run local-action
   ```

### Available Scripts

- `npm run bundle` - Format and package the action
- `npm run format:write` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run ci-test` - Run tests in CI mode
- `npm run coverage` - Generate coverage badge
- `npm run package` - Bundle with Rollup
- `npm run package:watch` - Bundle with watch mode
- `npm run all` - Run all checks and build

## Code Quality

### Formatting

This project uses Prettier for code formatting. Run `npm run format:write` to
format all files.

### Linting

ESLint is configured to catch common issues. Run `npm run lint` to check your
code.

### Testing

- Write tests for new features and bug fixes
- Maintain or improve code coverage
- Tests are located in `__tests__/` and use Jest

### Type Safety

This project uses TypeScript. Ensure your code:

- Has proper type annotations
- Passes TypeScript compilation
- Avoids using `any` when possible

## Submitting Changes

1. Ensure all tests pass

   ```bash
   npm run all
   ```

1. Commit your changes

   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

1. Push to your fork

   ```bash
   git push origin feature/your-feature-name
   ```

1. Create a pull request
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure CI checks pass

## Building for Distribution

The `dist/` directory contains the bundled JavaScript that GitHub Actions will
execute. This must be updated whenever you change the source code.

```bash
npm run bundle
```

Always commit the updated `dist/` directory with your changes. The CI workflow
will verify that `dist/` is up to date.

## Debugging

### VS Code Debugging

This project includes VS Code debug configurations. See `.vscode/launch.json`
for available debug targets.

### Enable Debug Logging

When testing locally, you can enable debug logging by setting:

```bash
export RUNNER_DEBUG=1
```

## Release Process

Releases are managed using the `script/release` helper:

1. Update version in `package.json`
1. Run the release script

   ```bash
   ./script/release
   ```

1. Follow the prompts to create and push tags
1. Create a GitHub release with release notes

## Getting Help

- Check existing issues and pull requests
- Review the [GitHub Actions documentation](https://docs.github.com/en/actions)
- Review the [Octokit documentation](https://github.com/octokit/octokit.js)

## Code of Conduct

Be respectful and constructive in all interactions. We are all here to build
something useful together.
