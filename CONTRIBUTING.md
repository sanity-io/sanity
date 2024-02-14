Want to file an issue? [Jump to _How to file an issue_ ⏬](#how-to-file-an-issue)

# Contributing

Contributions are always welcome, no matter how large or small.

## Getting started

Before contributing, please read our [code of conduct](https://github.com/sanity-io/sanity/blob/current/CODE_OF_CONDUCT.md).

Then make sure you have _Node.js version 16 or newer_. We currently use [Yarn](https://classic.yarnpkg.com/en/docs/install) 1 as our package manager, so make sure you have that installed as well.

```sh
git clone git@github.com:sanity-io/sanity.git
cd sanity
yarn
yarn build
yarn dev
```

# Release/workflow guidelines

- `current` always points to the last released version
- Anything in the `next` branch is scheduled for the next release and should always be ready to released
- To work on something new, create a descriptively named branch off of `next` (ie: `feat/some-new-feature`)
- Commit to that branch locally and regularly push your work to the same named branch on the remote
- Rebase your feature branch regularly against `next`. Make sure its even with `next` before merging
- Once it's done, open a pull request targeting `next`
- After at least two reviewers has approved the pull request, you can merge it into `next` when you feel ready (if you're on the Sanity team, obviously)
- Pull requests should be as ready as possible for merge. Unless stated otherwise, it should be safe to assume that:

  - The changes/feature are reviewed and tested by you
  - You think it's production ready
  - The code is linted and the test suite is passing

- It's fine to open a pull request to start a discussion / ask for help, but it should be stated clearly that it's not yet ready for merge.

## Merging

Prefer squash + merge. If it makes sense to keep individual commits (e.g. different people have been working on the same feature), rebase + merge is preferred. If possible, each individual commit message should be rewritten with the pull-request number in parenthesis, e.g. `fix(scope): some fixed thing (#22)`

## Branches

- `current`: This contains all the features and fixes included in the latest official release.
- `next`: This includes everything scheduled for the next, upcoming release.

# How to file an issue

If you find a security vulnerability, do **NOT** open an issue. Email security@sanity.io instead.

Any security issues should be submitted directly to security@sanity.io. In order to determine whether you are dealing with a security issue, ask yourself these two questions:

- Can I access something that's not mine, or something I shouldn't have access to?
- Can I disable something for other people?

If the answer to either of those two questions is "yes", then you're probably dealing with a security issue. Note that even if you answer "no" to both questions, you may still be dealing with a security issue, so if you're unsure, just email us at security@sanity.io.

## How to report a bug

When filing an issue, make sure to answer these six questions:

- Which versions of Sanity are you using (`sanity versions`)?
- What operating system are you using?
- Which versions of Node.js / npm are you running?
- What did you do?
- What did you expect to see?
- What did you see instead?

## How to suggest a feature or enhancement

If you find yourself wishing for a feature that doesn't exist in Sanity, you are probably not alone. There are bound to be others out there with similar needs. Many of the features that Sanity has today have been added because our users saw the need. Open an issue on our issues list on GitHub which describes the feature you would like to see, why you need it, and how it should work.

# Troubleshooting

If you run into build issues, you might want to run `yarn init`, which will delete all `node_modules` folders, then run a fresh `yarn bootstrap` to install and cross-symlink all modules, followed by building all ES6 code to ES5.

# Testing

Some tests are based on compiled files, so you will need to build the repository first before running the tests:

```sh
yarn build
yarn test
```

Note: this runs `yarn test` for all the Sanity packages - the output can be quite hard to read. If you encounter an issue, it's usually best to figure out which module is failing, then run `yarn test` in that individual module.
