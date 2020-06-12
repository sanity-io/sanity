#### Table of Contents

- [Contributing](#contributing)
  - [Code of Conduct](#codeofconduct)
  - [What is the Sanity Studio](#whatisthesanitystudio)
- [Submitting requests or reporting issues](#submittingrequests-or-reporting-issues)
  - [Accepted contributions](#acceptedcontributions)
    - [Security issues](#securityissues)
    - [Bug reports](#bugreports)
    - [Feature Requests or enhancements](#featurerequestsorenhancements)
    - [Pull Request](#pullrequests)
- [Setting up Sanity locally](#settingupsanitylocally)
  - [Working on fixes or features](#workingonfixesorfeatures)
- [General info](#general-info)
  - [Troubleshooting](#troubleshooting)
  - [Testing](#testing)

# Contributing

Contributions to the Sanity Studio are highly appreciated, especially bug fixes and the likes. However, new features are unlikely to be accepted and are better developed and published as plugins that extend the existing functionality of the Sanity Studio.

Explore this guide to find out how to get started or join our [Slack community](https://slack.sanity.io) if you have any questions.

We would like to emphasize that writing code is not the only way you can contribute to Sanity. Submitting security issues, feature requests, and bug reports, as well as writing blog posts or tutorials, answering questions about Sanity, or organizing community events around Sanity are all considered meaningful, important and appreciated contributions to Sanity.

## Code of Conduct

Before contributing, please read our [code of conduct](https://github.com/sanity-io/sanity/blob/master/CODE_OF_CONDUCT.md). We require everyone who wants to contribute to Sanity to have read and understood our Code of Conduct. Violations of our Code of Conduct are taken seriously and will be dealt with accordingly.

## What is the Sanity Studio?

The [Sanity Studio](https://www.sanity.io/docs/sanity-studio) is an open-source editing environment built with React.

# Submitting requests or reporting issues

Want to submit a security issue, bug report or feature request? Please read the information below to get started.

## Accepted contributions

- Bug reports
- Feature requests
- Bug fixes
- Smaller improvements/enhancements of existing features
- New features
- Documentation improvements

New features are unlikely to be accepted and are better developed and published as plugins that extend the existing functionality of the Sanity Studio. See [New features](#new-features) for more info.

### Security issues

If you find a security vulnerability, do **NOT** open an issue.

Email security@sanity.io instead.

Any security issues should be submitted directly to security@sanity.io. In order to determine whether you are dealing with a security issue, ask yourself these two questions:

- Can I access something that's not mine, or something I shouldn't have access to?
- Can I disable something for other people?

If the answer to either of those two questions are "yes", then you're probably dealing with a security issue. Note that even if you answer "no" to both questions, you may still be dealing with a security issue, so if you're unsure, just email us at security@sanity.io.

### Bug reports

To submit a bug report, please create a new issue and use the provided template. Make sure your report answers these five questions:

- Which versions of Sanity are you using (`sanity versions`)?
- What operating system are you using?
- Which versions of Node.js / npm are you running?
- What did you do?
- What did you expect to see?
- What did you see instead?

### Feature Requests or Enhancements

Have you found yourself wishing for a feature that doesn't exist in Sanity? It's likely you are not alone in wanting a particular feature and you should submit a Feature Request. We appreciate and consider all feature requests, and many of the features that Sanity has today have been added because someone saw the need for them.

To submit a Feature Request, please make sure that a request like your own doesn't already exist by searching through our [open issues](https://github.com/sanity-io/sanity/issues), before you create a new one. If someone already submitted the same feature requests you wanted to submit, please let us know you also want this feature by reacting with/adding a :+1: on the original comment, or leave a new comment expressing your need/excitement for this feature.

If the same Feature Request doesn't already exist, create a new issue and use the Feature Requests template. Be sure to provide all the necessary information about your new feature to help us understand what you are requesting.

### Pull Requests

When you are done working on a fix or improvement to the Sanity Studio, make sure your branch is even with the `next` branch of the original Sanity repository by rebasing it against `next`.

```
git pull upstream next --rebase
```

Once this is done and there are no conflicts, push your changes and create a Pull Request from your branch and provide the necessary information for your fix or improvement. Be sure to follow the Pull Request template to the best of your ability, to help us easily review it and provide feedback faster.

# Setting up Sanity locally

Make sure you have _Node.js version 4 or newer_ and _npm version 5 or newer_.

To start contributing to the Sanity Studio, you need to set it up locally first. Fork this repository and clone it onto to your computer in your desired location.

```
git clone git@github.com:sanity-io/sanity.git
```

Then, at the root of the Sanity project folder, install dependencies with `npm install` from the terminal. When all dependencies have been installed, run `npm run init` to initialize the project.

```
npm install
npm run init
```

To start the Sanity Studio you need to configure the Test Studio (packages/test-studio) first. Add your own project ID and dataset name to the `sanity.json` config of the Test Studio (`packages/test-studio/sanity.json`) and save your changes.

Note that the Test Studio uses [spaces](https://www.sanity.io/docs/experimental/spaces), which is currently an experimental feature. If you want to test the Studio without this, remove the entire `__experimental_spaces` array. If you would like to use the Test Studio with spaces, be sure to create [datasets](https://www.sanity.io/docs/data-store/datasets) to use for each space and provide the appropriate names and titles. Each space should have a dataset name, and optionally a project ID.

```
// sanity.json
"__experimental_spaces": [
  {
    "name": "yourDatasetName1",
    "title": "Your Dataset Name 1",
    "default": true,
    "api": {
    	"dataset": "yourDataset1"
  	}
  },
  {
    "name": "yourDatasetName2",
    "title": "Your Dataset Name 2",
    "api": {
      "dataset": "yourDataset2"
    }
  }
],
"api": {
  "projectId": "yourProjectId",
  "dataset": "yourDataset1"
}
```

Next, start the Test Studio by running `npm run start` in the terminal (while still in the root folder) and open it in your favorite browser to see it live.

```
npm run start
```

## Working on fixes or features

Please create a new branch branch for the fix or feature/enhancement you want to work on and regularly push your work to this branch. Remember to also keep your branch up to date by rebasing it regularly against the original `next` branch. To do this, add the original Sanity repository as a remote (in our example we called it `upstream`).

```
git remote add upstream git@github.com:sanity-io/sanity.git
git pull upstream next --rebase
```

### New features

Please note that if you would like to develop a new feature for the Sanity Studio, it's unlikely that we will be able to accept your contribution. However, we highly recommend that you develop and publish your new feature as a plugin. Plugins can be [parts](https://www.sanity.io/docs/extending/parts), [custom input components](https://www.sanity.io/docs/extending/custom-input-widgets), [dashboard widgets](https://www.sanity.io/docs/dashboard/creating-your-own-widget), and [Studio themes](https://www.sanity.io/docs/guides/how-to-brand-your-studio) that you and others can use to customize and extend the functionality of the Studio.

# General info

- Anything in the `next` branch is scheduled for the next release
- To work on a fix or something new, create a descriptively named branch off of `next` (ie: feature/new-oauth2-scopes)
- Commit to that branch locally and regularly push your work to the same named branch
- Rebase your feature branch regularly against `next`. Make sure its even with `next` before creating a Pull Request or merging
- Pull Requests should be as ready as possible for merge and the Pull Request template should be filled out to the best of your ability or in a way that is appropriate. Unless stated otherwise, it should also be safe to assume that:
  - The changes/feature are reviewed and tested by you
  - You think it's production ready
  - The code is linted and the test suite is passing
  - It's fine to open a Pull Request to start a discussion/ask for help but it should be opened as a Draft Pull Request and clearly state that it's not yet ready for merge

## Troubleshooting

If you run into build issues, you might want to run `npm run init`, which will delete all `node_modules` folders, then run a fresh `npm run bootstrap` to install and cross-symlink all modules, followed by building all ES6 code to ES5.

## Testing

Some tests are based on compiled files, so you will need to build the repository first before running the tests:

```sh
 npm run build
 npm test
 ```

Note: this runs `npm test` for all the Sanity packages - the output can be quite hard to read. If you encounter an issue, it's usually best to figure out which module is failing, then run `npm test` in that individual module.
