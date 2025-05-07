# Changelog

## [3.87.0](https://github.com/sanity-io/sanity/compare/v3.86.1...v3.87.0) (2025-05-07)


### Features

* **cli:** add auto updates for app builds ([#9226](https://github.com/sanity-io/sanity/issues/9226)) ([8aaafb6](https://github.com/sanity-io/sanity/commit/8aaafb60a436f07a26141cee37d106a6677f5616))
* **cli:** add env prefix for apps ([#9253](https://github.com/sanity-io/sanity/issues/9253)) ([7a9451a](https://github.com/sanity-io/sanity/commit/7a9451a0ff7bdab8a24565d131fa59a29a2085f2))
* **cli:** ask to auto update on sanity dev, build and deploy ([#9153](https://github.com/sanity-io/sanity/issues/9153)) ([f591c52](https://github.com/sanity-io/sanity/commit/f591c525477795657bc9399d4a41af0ad2819b84))
* **core:** add `useProjectOrganizationId` hook ([#9288](https://github.com/sanity-io/sanity/issues/9288)) ([6f4bb67](https://github.com/sanity-io/sanity/commit/6f4bb6705e6d04b8f4b0c37c5d6f76a6796c2e2e))
* **core:** adds canvas integration to studio. ([#9289](https://github.com/sanity-io/sanity/issues/9289)) ([5010099](https://github.com/sanity-io/sanity/commit/5010099d25019f3e912d82059513aaff4986b7f3))
* **core:** allow pulling metadata as configured on image type for ML assets ([#9350](https://github.com/sanity-io/sanity/issues/9350)) ([a22721e](https://github.com/sanity-io/sanity/commit/a22721eb0c62a3d0a76cc2b314403b6a0ae3a5c6))
* i18n for release tool presence tooltips ([#9301](https://github.com/sanity-io/sanity/issues/9301)) ([c14b714](https://github.com/sanity-io/sanity/commit/c14b714c175d63d895700a740b658b3835b831ef))
* sanity schema deploy|list|delete are now generally available ([#9298](https://github.com/sanity-io/sanity/issues/9298)) ([7c83278](https://github.com/sanity-io/sanity/commit/7c832784b078bd047c799efb28f092694f4c6c75))
* **sanity:** add "export media" command ([#9329](https://github.com/sanity-io/sanity/issues/9329)) ([d5a60fe](https://github.com/sanity-io/sanity/commit/d5a60fe346f8d96a3925ee6f064f1da1f787c566))
* **sanity:** add "import media" command ([#9329](https://github.com/sanity-io/sanity/issues/9329)) ([adb0ed4](https://github.com/sanity-io/sanity/commit/adb0ed44ef604a4e727551d5bd397ad350aa94d5))
* **sanity:** add `appendTitle` prop to `PaneHeader` ([#9334](https://github.com/sanity-io/sanity/issues/9334)) ([67a2e76](https://github.com/sanity-io/sanity/commit/67a2e76cba4360f47648c523b7fc2109718334a2))
* **sanity:** add `condition` prop to `CapabilityGate` ([#9334](https://github.com/sanity-io/sanity/issues/9334)) ([fe29018](https://github.com/sanity-io/sanity/commit/fe29018e0ffa1db33b4d7c0df9662388e77a6752))
* **sanity:** add `FavoriteToggle` ([#9334](https://github.com/sanity-io/sanity/issues/9334)) ([ca64600](https://github.com/sanity-io/sanity/commit/ca64600ad2bd8245d081d33afb1139a5878a8333))
* **sanity:** add `useManageFavorite` ([#9334](https://github.com/sanity-io/sanity/issues/9334)) ([c9c4e6a](https://github.com/sanity-io/sanity/commit/c9c4e6a3377f9341a20625c4017d74a9cdefaab4))
* **sanity:** add favourite toggle to documents when rendered inside Dashboard ([#9334](https://github.com/sanity-io/sanity/issues/9334)) ([e55fb19](https://github.com/sanity-io/sanity/commit/e55fb19c92f57fedbacd01ead61f9f24efa45307))
* **sanity:** export `CapabilityGate` ([#9334](https://github.com/sanity-io/sanity/issues/9334)) ([52e571e](https://github.com/sanity-io/sanity/commit/52e571e25fdf8219596a0804f2ffba5e6252ed1a))
* **sanity:** export `ProgressEvent` type ([#9329](https://github.com/sanity-io/sanity/issues/9329)) ([d76c381](https://github.com/sanity-io/sanity/commit/d76c381933208e041fbf6924a7cc20fdbbf9f75d))
* **sanity:** perform navigation upon `dashboard/v1/history/change-path` event ([#9346](https://github.com/sanity-io/sanity/issues/9346)) ([d5a8dce](https://github.com/sanity-io/sanity/commit/d5a8dce8fcde929f0a9f99c5d69096e59f7a21a6))
* **structure:** add actions.action value to actions states ([#9290](https://github.com/sanity-io/sanity/issues/9290)) ([bab5a98](https://github.com/sanity-io/sanity/commit/bab5a98efbb930398a2523c20a52fcccabe90906))
* **structure:** Add perspective stack to context in Structure builder ([#9347](https://github.com/sanity-io/sanity/issues/9347)) ([089cc34](https://github.com/sanity-io/sanity/commit/089cc34ffdd009688bf5c7efaf0049c69b73ab52))
* **structure:** adds `initialValueResolved` to DocumentActionProps ([#9291](https://github.com/sanity-io/sanity/issues/9291)) ([eab858b](https://github.com/sanity-io/sanity/commit/eab858be48e971bd6f42d8cc08546b3385a9a92a))


### Bug Fixes

* **cli:** fixes issue where cli would error if version is missing ([#9299](https://github.com/sanity-io/sanity/issues/9299)) ([484ff3d](https://github.com/sanity-io/sanity/commit/484ff3d8d168f1075664cb4c62862d4e10016e26))
* compare versions shows as disabled when no diff ([#9280](https://github.com/sanity-io/sanity/issues/9280)) ([af43391](https://github.com/sanity-io/sanity/commit/af433915b497f667a4e8d39d922e8ea215ea7882))
* **core:** catch error on getOrganizationId ([#9360](https://github.com/sanity-io/sanity/issues/9360)) ([20c2c98](https://github.com/sanity-io/sanity/commit/20c2c98525a16f813d8f8bbd01eb7b7dea62842f))
* **core:** remove `renderEditable` from PTE inputs again ([d349183](https://github.com/sanity-io/sanity/commit/d349183734fd56476fa33e7db169ee0e585830a5))
* **core:** unlink dialog crash ([#9338](https://github.com/sanity-io/sanity/issues/9338)) ([5276564](https://github.com/sanity-io/sanity/commit/5276564c3142f684abe94962c46e1a84eb7be020))
* **deps:** update dependency @portabletext/block-tools to ^1.1.20 ([#9259](https://github.com/sanity-io/sanity/issues/9259)) ([95ae654](https://github.com/sanity-io/sanity/commit/95ae654f7f95ae59e115a6708be7f79d0bf36529))
* **deps:** update dependency @portabletext/block-tools to ^1.1.21 ([#9278](https://github.com/sanity-io/sanity/issues/9278)) ([9557eef](https://github.com/sanity-io/sanity/commit/9557eef7a1aff47624eb7103cee5d5a21715f4fc))
* **deps:** update dependency @portabletext/block-tools to ^1.1.23 ([#9310](https://github.com/sanity-io/sanity/issues/9310)) ([cff199e](https://github.com/sanity-io/sanity/commit/cff199e799bb1689591db0f2e7c73a785bc42e15))
* **deps:** update dependency @portabletext/block-tools to ^1.1.24 ([#9363](https://github.com/sanity-io/sanity/issues/9363)) ([a812f2d](https://github.com/sanity-io/sanity/commit/a812f2d6bc166dd766610a2f4b916a9be3e0c64d))
* **deps:** update dependency @portabletext/editor to ^1.47.15 ([#9279](https://github.com/sanity-io/sanity/issues/9279)) ([b0c9cc3](https://github.com/sanity-io/sanity/commit/b0c9cc369c04f8c5bc50b682860fa4f5ac05ebbd))
* **deps:** update dependency @portabletext/editor to ^1.48.0 ([#9293](https://github.com/sanity-io/sanity/issues/9293)) ([bfbc7a1](https://github.com/sanity-io/sanity/commit/bfbc7a1c499bc8cef5211da86df70f09f21cc405))
* **deps:** update dependency @portabletext/editor to ^1.48.15 ([#9294](https://github.com/sanity-io/sanity/issues/9294)) ([68a2209](https://github.com/sanity-io/sanity/commit/68a2209d658f8776bd71033d3a125db4987ed6ff))
* **deps:** update dependency @sanity/client to ^6.29.1 ([#9281](https://github.com/sanity-io/sanity/issues/9281)) ([6c5dc7f](https://github.com/sanity-io/sanity/commit/6c5dc7f353688e4413b5b4ff9e891d187ece1e69))
* **deps:** update dependency @sanity/client to ^7.1.0 ([#9345](https://github.com/sanity-io/sanity/issues/9345)) ([9f7a4bc](https://github.com/sanity-io/sanity/commit/9f7a4bc4c547be65e50be57bad0f44887591a938))
* **deps:** update dependency @sanity/client to v7 ([#9317](https://github.com/sanity-io/sanity/issues/9317)) ([c7a8767](https://github.com/sanity-io/sanity/commit/c7a87671a816109e8a0b6174c4032ad7c70888d5))
* **deps:** update dependency @sanity/comlink to ^3.0.2 ([#9325](https://github.com/sanity-io/sanity/issues/9325)) ([b487474](https://github.com/sanity-io/sanity/commit/b487474a9c0cb4c3bb4cc6e8b8a44d4be0c9d64d))
* **deps:** update dependency @sanity/export to ^3.43.0 ([#9333](https://github.com/sanity-io/sanity/issues/9333)) ([9e81857](https://github.com/sanity-io/sanity/commit/9e81857e98e0f16ca7364bbdec8fad14704e51c3))
* **deps:** update dependency @sanity/insert-menu to v1.1.11 ([#9189](https://github.com/sanity-io/sanity/issues/9189)) ([f3ad935](https://github.com/sanity-io/sanity/commit/f3ad9355ccd6d7c0da738e46a0d0ecae6e9fd61f))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.18 ([#9326](https://github.com/sanity-io/sanity/issues/9326)) ([9979a35](https://github.com/sanity-io/sanity/commit/9979a3583ca06a8b9c1a722d6c31b478b992e550))
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.10 ([#9193](https://github.com/sanity-io/sanity/issues/9193)) ([664f69d](https://github.com/sanity-io/sanity/commit/664f69dd87e0a87823853e6d5c23599cb7a1bb3f))
* **deps:** update dependency @sanity/ui to ^2.15.14 ([#9311](https://github.com/sanity-io/sanity/issues/9311)) ([d7e0fad](https://github.com/sanity-io/sanity/commit/d7e0fad213f18277837369480ef9cb2ac387f5f4))
* **deps:** update dependency @sanity/ui to ^2.15.16 ([#9344](https://github.com/sanity-io/sanity/issues/9344)) ([9052a56](https://github.com/sanity-io/sanity/commit/9052a56a9556435eaa974455901483fb462b3c1f))
* **deps:** update dependency @sanity/ui to ^2.15.17 ([#9362](https://github.com/sanity-io/sanity/issues/9362)) ([115a21b](https://github.com/sanity-io/sanity/commit/115a21b1970ff72e2cf20886f03141427f8e7dd7))
* **deps:** update dependency react-rx to ^4.1.28 ([#9314](https://github.com/sanity-io/sanity/issues/9314)) ([d7be232](https://github.com/sanity-io/sanity/commit/d7be232f5993932c53bca07beb97cbd5c29a0a13))
* include publishing error message in ReleasePublishAllButton  ([#9331](https://github.com/sanity-io/sanity/issues/9331)) ([67819cd](https://github.com/sanity-io/sanity/commit/67819cd41fac159841d8067c888fb52c364c0d64))
* reverting release translog handling ([#9285](https://github.com/sanity-io/sanity/issues/9285)) ([1215b58](https://github.com/sanity-io/sanity/commit/1215b58c863b71cc7ff4c8e6bed6a8af2b28d3e1))
* **sanity:** remove redundant background colour from perspective label child ([#9364](https://github.com/sanity-io/sanity/issues/9364)) ([1df5b2f](https://github.com/sanity-io/sanity/commit/1df5b2f486b9105f04c97adc5398b3c522163dc5))
* **structure:** check that document is in scheduled release before showing banner ([#9312](https://github.com/sanity-io/sanity/issues/9312)) ([7a42cb9](https://github.com/sanity-io/sanity/commit/7a42cb9781f2d9635a5a35ad31b8830cf897044b))
* **structure:** don't show deleted banner until doc is ready ([#9361](https://github.com/sanity-io/sanity/issues/9361)) ([bd5b1ac](https://github.com/sanity-io/sanity/commit/bd5b1acb5015baaddd8d96c2abd1eaf579b3c904))
* **structure:** revert document view tabs placement and behavior ([#9313](https://github.com/sanity-io/sanity/issues/9313)) ([dfadcd0](https://github.com/sanity-io/sanity/commit/dfadcd026114b5e7992bceb8073d319e1c57566b))
* supporting passing an auth token via URL hash ([#9315](https://github.com/sanity-io/sanity/issues/9315)) ([5e0abb8](https://github.com/sanity-io/sanity/commit/5e0abb836fc2a4c46a8ec8b701dbd791c7ce58bb))
* unpublished references fail validation ([#9215](https://github.com/sanity-io/sanity/issues/9215)) ([2f5f6ed](https://github.com/sanity-io/sanity/commit/2f5f6edd26efe121174154ad9fc1d472e66e7e0f))
* when no draft exists and last event was version pub, find the appropriate event ([#9277](https://github.com/sanity-io/sanity/issues/9277)) ([de1745e](https://github.com/sanity-io/sanity/commit/de1745ed74f93e3ea257a720602f9c828a1e4ce3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @sanity/cli bumped to 3.87.0
    * @sanity/diff bumped to 3.88.1
    * @sanity/migrate bumped to 3.86.2
    * @sanity/mutator bumped to 3.88.1
    * @sanity/schema bumped to 3.88.1
    * @sanity/types bumped to 3.87.0
    * @sanity/util bumped to 3.86.2
  * devDependencies
    * @sanity/codegen bumped to 3.88.1

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
