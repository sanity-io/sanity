# Contributing
Contributions are always welcome, no matter how large or small.

## Getting started
Before contributing, please read our [code of conduct](https://github.com/sanity-io/sanity/blob/master/CODE_OF_CONDUCT.md).

Then make sure you have *Node.js version 4 or newer* and *npm version 5 or newer*.

```
git clone git@github.com:sanity-io/sanity.git
cd sanity
npm install
npm run init
npm start
```

# Release/workflow guidelines

- Anything in the `master` branch can be released
- Anything in the `next` branch is scheduled for the next release
- To work on something new, create a descriptively named branch off of `next` (ie: feature/new-oauth2-scopes)
- Commit to that branch locally and regularly push your work to the same named branch on the server.
- Rebase your feature branch regularily against `next`. Make sure its even with `next` before merging.
- Once its done, open a pull request to merge your feature branch into `next`
- After someone else has reviewed and signed off on the pull request, you can merge it into `next`.
- Everything except minor *trivial* changes should go through pull-requests. If you're unsure whether it's a trivial change or not, submit a pull request just to be sure.
- Pull requests should be as ready as possible for merge. Unless stated otherwise, it should be safe to assume that:
	- The changes/feature are reviewed and tested by you
	- You think it's production ready
	- The code is linted and the test suite is passing
- It's fine to open a pull request to start a discussion / ask for help, but it should be stated clearly that it's not yet ready for merge.
- When the `next`-branch is throughly tested and ready to be released (either as a minor or major version bump), it should be merged into master and bumped.
- Critical fixes goes straight into master (preferably through a pull request)

## Publishing official releases
[**NOTE** Only publish _minor_ releases until Sanity passes the 1.0 mark]

When `next` is ready for release, run `npm run publish` and select version. After a successful release, remember to rebase `next` against `master`.

## Publishing a hotfix release from `master`
If we need to publish hotfix, a patch release should be done by running `npm run publish` from the project root, selecting "Patch" from the menu. Remember to rebase `next` against `master` after the release is completed.

## Publishing _prerelease_ versions from `next`
This is done by running `npm run publish` from the project root, selecting "Prerelease" from the menu and choosing a _Prerelease identifier_ (e.g. **alpha**, **beta** or **rc**). A prerelease can be tested in the studio by running e.g. `sanity upgrade --tag=beta --save-exact`

## Publishing _canary_ versions from feature branches
This can be done at any time by anyone and is done by `npm run publish-canary`. This will publish with the commit hash from HEAD, and can be installed with `sanity upgrade --tag=canary --save-exact`


# How to report a bug

If you find a security vulnerability, do **NOT** open an issue. Email security@sanity.io instead.

Any security issues should be submitted directly to security@sanity.io. In order to determine whether you are dealing with a security issue, ask yourself these two questions:
- Can I access something that's not mine, or something I shouldn't have access to?
- Can I disable something for other people?
If the answer to either of those two questions are "yes", then you're probably dealing with a security issue. Note that even if you answer "no" to both questions, you may still be dealing with a security issue, so if you're unsure, just email us at security@sanity.io.

## Filing an issue
When filing an issue, make sure to answer these five questions:

- Which versions of Sanity are you using (`sanity versions`)?
- What operating system and processor architecture are you using?
- Which versions of node/npm are you running?
- What did you do?
- What did you expect to see?
- What did you see instead?

## How to suggest a feature or enhancement

If you find yourself wishing for a feature that doesn't exist in Sanity, you are probably not alone. There are bound to be others out there with similar needs. Many of the features that Sanity has today have been added because our users saw the need. Open an issue on our issues list on GitHub which describes the feature you would like to see, why you need it, and how it should work.

# Troubleshooting

If you run into build issues, you might want to run `npm run init`, which will delete all `node_modules` folders, then run a fresh `npm run bootstrap` to install and cross-symlink all modules, followed by building all ES6 code to ES5.

# Testing

```
npm test
```

Note: this runs `npm test` for all the Sanity packages - the output can be quite hard to read. If you encounter an issue, it's usually best to figure out which module is failing, then run `npm test` in that individual module.
