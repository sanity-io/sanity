# Changelog

## [3.87.0](https://github.com/sanity-io/sanity/compare/v3.86.1...v3.87.0) (2025-04-29)


### Features

* **cli:** add auto updates for app builds ([#9226](https://github.com/sanity-io/sanity/issues/9226)) ([8aaafb6](https://github.com/sanity-io/sanity/commit/8aaafb60a436f07a26141cee37d106a6677f5616))
* **core:** add `useProjectOrganizationId` hook ([#9288](https://github.com/sanity-io/sanity/issues/9288)) ([6f4bb67](https://github.com/sanity-io/sanity/commit/6f4bb6705e6d04b8f4b0c37c5d6f76a6796c2e2e))
* **structure:** add actions.action value to actions states ([#9290](https://github.com/sanity-io/sanity/issues/9290)) ([bab5a98](https://github.com/sanity-io/sanity/commit/bab5a98efbb930398a2523c20a52fcccabe90906))
* **structure:** adds `initialValueResolved` to DocumentActionProps ([#9291](https://github.com/sanity-io/sanity/issues/9291)) ([eab858b](https://github.com/sanity-io/sanity/commit/eab858be48e971bd6f42d8cc08546b3385a9a92a))


### Bug Fixes

* **core:** remove `renderEditable` from PTE inputs again ([d349183](https://github.com/sanity-io/sanity/commit/d349183734fd56476fa33e7db169ee0e585830a5))
* **deps:** update dependency @portabletext/block-tools to ^1.1.20 ([#9259](https://github.com/sanity-io/sanity/issues/9259)) ([95ae654](https://github.com/sanity-io/sanity/commit/95ae654f7f95ae59e115a6708be7f79d0bf36529))
* **deps:** update dependency @portabletext/block-tools to ^1.1.21 ([#9278](https://github.com/sanity-io/sanity/issues/9278)) ([9557eef](https://github.com/sanity-io/sanity/commit/9557eef7a1aff47624eb7103cee5d5a21715f4fc))
* **deps:** update dependency @portabletext/editor to ^1.47.15 ([#9279](https://github.com/sanity-io/sanity/issues/9279)) ([b0c9cc3](https://github.com/sanity-io/sanity/commit/b0c9cc369c04f8c5bc50b682860fa4f5ac05ebbd))
* **deps:** update dependency @portabletext/editor to ^1.48.0 ([#9293](https://github.com/sanity-io/sanity/issues/9293)) ([bfbc7a1](https://github.com/sanity-io/sanity/commit/bfbc7a1c499bc8cef5211da86df70f09f21cc405))
* **deps:** update dependency @sanity/client to ^6.29.1 ([#9281](https://github.com/sanity-io/sanity/issues/9281)) ([6c5dc7f](https://github.com/sanity-io/sanity/commit/6c5dc7f353688e4413b5b4ff9e891d187ece1e69))
* unpublished references fail validation ([#9215](https://github.com/sanity-io/sanity/issues/9215)) ([2f5f6ed](https://github.com/sanity-io/sanity/commit/2f5f6edd26efe121174154ad9fc1d472e66e7e0f))
* when no draft exists and last event was version pub, find the appropriate event ([#9277](https://github.com/sanity-io/sanity/issues/9277)) ([de1745e](https://github.com/sanity-io/sanity/commit/de1745ed74f93e3ea257a720602f9c828a1e4ce3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @sanity/cli bumped to 3.86.2
    * @sanity/migrate bumped to 3.86.2
    * @sanity/mutator bumped to 3.86.2
    * @sanity/schema bumped to 3.86.2
    * @sanity/types bumped to 3.86.2
    * @sanity/util bumped to 3.86.2

## [3.86.1](https://github.com/sanity-io/sanity/compare/v3.86.0...v3.86.1) (2025-04-23)


### Bug Fixes

* **deps:** update dependency @portabletext/editor to ^1.47.12 ([#9241](https://github.com/sanity-io/sanity/issues/9241)) ([95b9e92](https://github.com/sanity-io/sanity/commit/95b9e92ba83682aa6988c523e835a71c65d9e883))
* **deps:** update dependency @portabletext/editor to ^1.47.13 ([#9260](https://github.com/sanity-io/sanity/issues/9260)) ([6e6084b](https://github.com/sanity-io/sanity/commit/6e6084bd86d293bbac5e28313c2bef449ce54bf4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @sanity/cli bumped to 3.86.1
    * @sanity/diff bumped to 3.86.1
    * @sanity/migrate bumped to 3.86.1
    * @sanity/mutator bumped to 3.86.1
    * @sanity/schema bumped to 3.86.1
    * @sanity/types bumped to 3.86.1
    * @sanity/util bumped to 3.86.1
  * devDependencies
    * @sanity/codegen bumped to 3.86.1

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
