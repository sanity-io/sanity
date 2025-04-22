# Changelog

## [3.86.0](https://github.com/sanity-io/sanity/compare/sanity-v3.85.1...sanity-v3.86.0) (2025-04-22)


### Features

* **core:** add image schema options for hotspot tool configuration ([#9185](https://github.com/sanity-io/sanity/issues/9185)) ([b829684](https://github.com/sanity-io/sanity/commit/b82968441c1d74692531b633ece970398cdd68a2))
* **core:** DatasetAssetSource uploading support ([ca2e705](https://github.com/sanity-io/sanity/commit/ca2e705222cfc3a6235c6c6d76541ecfa5910f2b))
* **core:** MediaLibraryAssetSource uploading support ([afe17db](https://github.com/sanity-io/sanity/commit/afe17db8b684054ef4984e0771b7c45fea1cb33d))
* **core:** refactor File Input and add asset source upload suppport ([daa13e6](https://github.com/sanity-io/sanity/commit/daa13e6c3f7ee54b4d6158fe30a22df248dd44c7))
* **core:** refactor Image Input and add asset source upload suppport ([cebfd82](https://github.com/sanity-io/sanity/commit/cebfd82d69941a968a990bc9e970417a236443f0))


### Bug Fixes

* **cli:** update copy for app undeploy ([#9214](https://github.com/sanity-io/sanity/issues/9214)) ([4ab836f](https://github.com/sanity-io/sanity/commit/4ab836fc65529ee55470f4ac59a915cd1dccf84f))
* **core:** remove files that should be deleted ([57ae7f5](https://github.com/sanity-io/sanity/commit/57ae7f5ce4882a382670c797b23551042bfa69ba))
* **core:** remove uneccesary disabled property ([84a6c14](https://github.com/sanity-io/sanity/commit/84a6c14036f4b6d0d9f2c20aff373cf1b53df637))
* **core:** remove unecessary eslint disable ([a789f85](https://github.com/sanity-io/sanity/commit/a789f851ea39cbb79e6e91c574f623d1b07b6d00))
* **core:** return if no files to upload ([7043d16](https://github.com/sanity-io/sanity/commit/7043d16eac8cabdc8ad448e689dd7bb92dbcad95))
* **core:** simplify return ([7e7846e](https://github.com/sanity-io/sanity/commit/7e7846e7539fd74ef8d731c58f93ac1c13e7bd2e))
* **core:** useDocumentVersions should use stable initial value ([#9213](https://github.com/sanity-io/sanity/issues/9213)) ([9e27921](https://github.com/sanity-io/sanity/commit/9e27921bb76ebee1461011b0feea44c8a5045a79))
* **deps:** update dependency @portabletext/block-tools to ^1.1.19 ([#9210](https://github.com/sanity-io/sanity/issues/9210)) ([6e2112e](https://github.com/sanity-io/sanity/commit/6e2112e6799eeb5ed210c19b8e46bff58f7f7208))
* **deps:** update dependency @portabletext/editor to ^1.47.11 ([#9211](https://github.com/sanity-io/sanity/issues/9211)) ([297f173](https://github.com/sanity-io/sanity/commit/297f1736b40d77b5e00ec0bf6a1db18fab58f67f))
* excluding query params from pathname check when routing to tool ([#9202](https://github.com/sanity-io/sanity/issues/9202)) ([bf07121](https://github.com/sanity-io/sanity/commit/bf0712199efb5cc547cb32d8a852e9dd23626952))
* **studio:** add missing negative margin to global perspective menu ([3146826](https://github.com/sanity-io/sanity/commit/3146826318ff361bc8ccb4652c19b1d504875527))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @sanity/cli bumped to 3.86.0
    * @sanity/diff bumped to 3.86.0
    * @sanity/migrate bumped to 3.86.0
    * @sanity/mutator bumped to 3.86.0
    * @sanity/schema bumped to 3.86.0
    * @sanity/types bumped to 3.86.0
    * @sanity/util bumped to 3.86.0
  * devDependencies
    * @sanity/codegen bumped to 3.86.0
