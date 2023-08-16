# Contributing to theme-tools

Thank you for your interest in contributing to theme-tools! Your contributions will help make this project better and more reliable. This document provides guidelines and instructions for setting up your development environment and contributing to the theme-tools repository.

## Table of Contents

- [Setting Up Your Environment](#setting-up-your-environment)
- [Setup for the VSCode Extension](#setup-for-the-vscode-extension)
- [Setup for the Online Store](#setup-for-the-online-store)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

## Setting Up Your Environment

Before you can start contributing to theme-tools, you'll need to set up your development environment. Follow these steps to get started:

1. **Clone the repository**: Clone the theme-tools repository to your local machine by running the following command in your terminal:

   ```bash
   git clone https://github.com/Shopify/theme-tools.git
   ```

2. **Install dependencies**: Navigate to the project directory and install the required dependencies by running:

   ```bash
   cd theme-tools
   yarn
   ```

3. **Build monorepo packages**: Ensure that all packages can be buildable:

   ```bash
   yarn build
   ```

4. **Run tests**: Ensure that all tests pass by running:

   ```bash
   yarn test
   ```
5. **Start developing**: If you're developing changes to test against the vscode extension, all you need to do is add a breakpoint anywhere in a package used within the VSCode extension, hit `f5` in VSCode and your development instance of theme-check will automatically open.

### Developing for online-store-web
This section has not been addressed since the unification effort that created this theme-tools repo. Please contact [Albert](https://github.com/albchu) if you have any questions here. He should be updating this section when he gets around to it. If you want to see what used to be documented for this section check out [the archives for theme-check-js](../archives/theme-check-js/CONTRIBUTING.md#setting-up-your-environment)

## Submitting a Pull Request

Once you've made changes to the codebase and are ready to submit a pull request (PR), follow these steps:

1. **Commit your changes**: Commit your changes with a descriptive commit message.

2. **Push your changes**: Push your changes to the theme-tools repository on GitHub.

3. **Create a pull request**: Go to the theme-tools repository and click on the "New Pull Request" button. Select the branch containing your changes as the head branch.

4. **Describe your changes**: Write a clear and concise description of the changes you made, the issue or feature request it addresses, and any additional information that may be helpful for reviewers.

5. **Submit your pull request**: Click the "Create Pull Request" button to submit your PR for review.

## Code of conduct

All developers who wish to contribute through code or issues, please first read our [Code of Conduct](./code-of-conduct.md).

## Reporting Issues

If you encounter any issues or have suggestions for improvements, please feel free to report them by creating a new issue in the theme-tools repository. When reporting an issue, please follow these guidelines to help us better understand and address your concerns:

1. **Check for existing issues**: Before creating a new issue, please search the existing issues to see if someone has already reported the problem or made the same suggestion.

2. **Choose the right issue template**: When creating a new issue, select the appropriate issue template (if available) to provide the necessary information.

3. **Provide a clear title**: Write a concise and descriptive title that briefly summarizes the issue or suggestion.

4. **Describe the issue in detail**: In the issue description, provide as much relevant information as possible. Include steps to reproduce the issue, any error messages, the expected behavior, and the actual behavior. If applicable, include screenshots or screen recordings to help illustrate the problem.

5. **Include your environment**: Mention the version of theme-tools you are using, as well as any relevant information about your operating system, Node.js version, and browser (if applicable).

By following these guidelines, you'll help us better understand the issue and address it more effectively. We appreciate your feedback and contributions!