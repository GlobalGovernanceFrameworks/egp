# Contributing to the Emergent Governance Protocol (EGP)

First off, thank you for considering contributing to the Emergent Governance Protocol. This is an open, collaborative project building the Minimum Viable Grammar for a regenerative civilization. We are building this like Wikipedia, not Uber: for the common good. Every contribution, no matter how small, is valuable.

This document provides a set of guidelines for contributing to EGP. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [EGP Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to governance@globalgovernanceframeworks.org.

## How Can I Contribute?

We welcome thinkers and builders of all kinds. You don't have to be a developer to make a meaningful contribution.

### 🏛️ Governance Theorists & Community Organizers

  * **Refine the Logic:** Help refine the principles and logic of the protocol by participating in discussions on our Discord server.
  * **Pilot the EGP:** Help us pilot the protocol in real-world communities. You can start by following the "Getting Started in 3 Steps" guide:
    1.  **Practice Sensing**: Pick one stress signal your community faces and format it as a `sense()` operation.
    2.  **Try Proposing**: Create a proposal with test criteria and a sunset clause for that issue.
    3.  **Experiment with Adoption**: Run one small, consensual experiment and document what you learn.
  * **Improve Documentation:** If you find a part of the documentation confusing or that it could be improved, please open an issue or submit a pull request.

### 🎨 UI/UX Designers

  * **Design Intuitive Interfaces:** Help design accessible and intuitive interfaces for interacting with the protocol.
  * **Visualize Governance Flows:** Create diagrams and visualizations that make the `sense -> propose -> adopt` cycle easy to understand.
  * **Provide Feedback:** Review existing UI/UX mockups and provide constructive feedback.

### 💻 Developers

  * **Build Core Services:** We need developers skilled in Rust, Go, and TypeScript to build the core services and nodes.
  * **Work on Schemas:** The core data schemas are the first piece of the puzzle. Review the proposed schemas and suggest improvements.
  * **Develop the AI Co-Pilot:** Help build the AI that assists with pattern recognition and conflict flagging, while ensuring decisions remain in human hands.
  * **Write Tests:** Help us ensure the protocol is robust and reliable by writing and improving tests.

## Your First Contribution

Unsure where to begin contributing to EGP? You can start by looking through these `good first issue` issues:

  * **[Good first issues](https://github.com/GlobalGovernanceFrameworks/egp/issues?q=state%3Aopen%20label%3A%22good%20first%20issue%22)** - issues which should only require a few lines of code, and a test or two.

Here’s the basic workflow:

1.  **Join the community** on our [Discord server](https://discord.gg/MjnzCfh4mM) and introduce yourself in the `#introductions` channel.

2.  **Claim an issue**: Comment on the issue you want to work on to let others know.

3.  **Fork the repository**: Click the 'Fork' button in the top right of the repository page.

4.  **Clone your fork**:

    ```bash
    git clone https://github.com/ggf/egp.git
    cd egp
    ```

5.  **Create a new branch**: `git checkout -b your-branch-name`.

6.  **Make your changes**: Make your changes locally.

7.  **Test your changes**:

    ```bash
    npm install
    npm test
    ```

8.  **Commit your changes**: Use a clear and descriptive commit message.

9.  **Push to your fork**: `git push origin your-branch-name`.

10. **Submit a Pull Request**: Open a pull request from your fork's branch to our `main` branch.

## Pull Request Guidelines

  * Explain the "what" and "why" of your changes in the pull request description, not just the "how."
  * Link to any relevant issues.
  * Ensure the test suite passes (`npm test`).
  * If you add new functionality, please add corresponding tests.
  * Update the documentation if you are changing behavior or adding a new feature.

## Style Guides

### Commit Messages

Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for your commit messages. This allows for automated changelog generation and makes the project history easier to read.

### Code Style

We use Prettier for code formatting. Please run `npm run format` before committing to ensure your code matches the project's style.

### Documentation

All documentation is written in Markdown. Please use clear, concise language. When referencing EGP concepts, use the terminology from the [EGP Glossary](https://globalgovernanceframeworks.org/frameworks/emergent-governance-protocol#egp-glossary).

## 📜 License

The Emergent Governance Protocol is licensed under the **Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)**. By contributing, you agree that your contributions will be licensed under its CC BY-SA 4.0 license.
