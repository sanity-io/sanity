# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.0](https://github.com/sanity-io/sanity/compare/v3.99.0...v4.0.0) (2025-07-14)


### ⚠ BREAKING CHANGES

* remove node 18, make base 20 (#9804)

### Features

* **cli): feat(cli:** add docs search and read commands ([#9910](https://github.com/sanity-io/sanity/issues/9910)) ([d2742dd](https://github.com/sanity-io/sanity/commit/d2742dd38013c3f5516ba15886471f0b89d786b8))


### Bug Fixes

* **deps:** update dependency @portabletext/editor to ^1.58.0 ([#9954](https://github.com/sanity-io/sanity/issues/9954)) ([662eadf](https://github.com/sanity-io/sanity/commit/662eadf9f097f83ab7ef94b8b74dfed030a540ca))
* **deps:** update dependency @sanity/comlink to ^3.0.6 ([#9943](https://github.com/sanity-io/sanity/issues/9943)) ([4c64287](https://github.com/sanity-io/sanity/commit/4c642873525212bedbf6d0866f6de78086038b07))
* **deps:** update dependency @sanity/comlink to ^3.0.7 ([#9957](https://github.com/sanity-io/sanity/issues/9957)) ([31876da](https://github.com/sanity-io/sanity/commit/31876da2fb30fb82ac60c34cadc7362e7544287f))
* **deps:** update dependency @sanity/import to ^3.38.3 ([#9937](https://github.com/sanity-io/sanity/issues/9937)) ([ce13bc1](https://github.com/sanity-io/sanity/commit/ce13bc16a50c87b85b58b505c850afa66048523f))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.22 ([#9945](https://github.com/sanity-io/sanity/issues/9945)) ([19eaa1f](https://github.com/sanity-io/sanity/commit/19eaa1f0299a980b568804ec74f0c871fc765729))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.23 ([#9958](https://github.com/sanity-io/sanity/issues/9958)) ([f8ddff1](https://github.com/sanity-io/sanity/commit/f8ddff1239bf4cc9099ef3913545e7f7b65b48d8))
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.12 ([#9946](https://github.com/sanity-io/sanity/issues/9946)) ([df90799](https://github.com/sanity-io/sanity/commit/df907993458f02fef88385b1a93b4c57c7571c35))
* **deps:** update dependency @sanity/ui to ^2.16.7 ([#9953](https://github.com/sanity-io/sanity/issues/9953)) ([57f922a](https://github.com/sanity-io/sanity/commit/57f922a1535ed2f9629486a9d985e79ea658a311))
* feedback on algolia example ([#9964](https://github.com/sanity-io/sanity/issues/9964)) ([0c63bd2](https://github.com/sanity-io/sanity/commit/0c63bd2e34c0761ef2961bce003e3e764d97e802))
* remove node 18, make base 20 ([#9804](https://github.com/sanity-io/sanity/issues/9804)) ([8fa2157](https://github.com/sanity-io/sanity/commit/8fa2157bf7d5f1390f0e1663cb32bb1ffd361188))
* **sanity:** ensure global document reference preview configuration is present for serialized `sanity.video` schema type ([b1cfbb6](https://github.com/sanity-io/sanity/commit/b1cfbb613dd5b527d826b46dccf3f1a66f2bab2e))



## [3.99.0](https://github.com/sanity-io/sanity/compare/v3.98.1...v3.99.0) (2025-07-11)


### Features

* **core:** keep values when clicking off create release modal ([#9871](https://github.com/sanity-io/sanity/issues/9871)) ([fe8330e](https://github.com/sanity-io/sanity/commit/fe8330eb8fe214b4ca575a7ac367171708278713))
* **examples:** Algolia-Sync to the function recipes  ([#9731](https://github.com/sanity-io/sanity/issues/9731)) ([fed1a8d](https://github.com/sanity-io/sanity/commit/fed1a8da2e1725f39cbfae3ada53936f3bf7da70))
* **examples:** generate a summary with ai-agents functions recipe ([#9758](https://github.com/sanity-io/sanity/issues/9758)) ([95d60fe](https://github.com/sanity-io/sanity/commit/95d60feb6d927dd57dd6a187d10fc90f5525b7b9))
* Media Library video integration ([#9909](https://github.com/sanity-io/sanity/issues/9909)) ([5342858](https://github.com/sanity-io/sanity/commit/534285836c3f1c7a5fe9772ed732731adc16992b))


### Bug Fixes

* **cli:** add document-id flag to functions test ([#9944](https://github.com/sanity-io/sanity/issues/9944)) ([b9e7fcd](https://github.com/sanity-io/sanity/commit/b9e7fcd9c017a2051b09e299e1d21ad1cb7eb37b))
* **deps:** update dependency @portabletext/block-tools to ^1.1.38 ([#9940](https://github.com/sanity-io/sanity/issues/9940)) ([3dd90d5](https://github.com/sanity-io/sanity/commit/3dd90d539e2287162f7d5cf98fde53b868f17285))
* **deps:** update dependency @portabletext/editor to ^1.57.5 ([#9941](https://github.com/sanity-io/sanity/issues/9941)) ([892da2b](https://github.com/sanity-io/sanity/commit/892da2b9304ac9bbfd3842fa199bccd5f6e78f35))
* **deps:** update dependency @sanity/ui to ^2.16.4 ([#9934](https://github.com/sanity-io/sanity/issues/9934)) ([3967361](https://github.com/sanity-io/sanity/commit/39673611a02253d2ea4c2a6cdc018431b9353130))
* pinning conventional-commits to v7 for CJS compatibility with lerna@8 ([#9951](https://github.com/sanity-io/sanity/issues/9951)) ([97c80b8](https://github.com/sanity-io/sanity/commit/97c80b8f4430e31cbfc0ed036238a422742ce80e))



## <small>3.98.1 (2025-07-09)</small>

* fix: add commit-message field to release PR workflow (#9922) ([23b4a3a](https://github.com/sanity-io/sanity/commit/23b4a3a)), closes [#9922](https://github.com/sanity-io/sanity/issues/9922)
* fix: correcting yaml syntax to git tag on publish (#9914) ([b9f0224](https://github.com/sanity-io/sanity/commit/b9f0224)), closes [#9914](https://github.com/sanity-io/sanity/issues/9914)
* fix: handling where no templates available and not showing create doc button (#9933) ([d2f9810](https://github.com/sanity-io/sanity/commit/d2f9810)), closes [#9933](https://github.com/sanity-io/sanity/issues/9933)
* fix(deps): update dependency @portabletext/block-tools to ^1.1.36 (#9918) ([46a7d9d](https://github.com/sanity-io/sanity/commit/46a7d9d)), closes [#9918](https://github.com/sanity-io/sanity/issues/9918)
* fix(deps): update dependency @portabletext/block-tools to ^1.1.37 (#9927) ([c545a1b](https://github.com/sanity-io/sanity/commit/c545a1b)), closes [#9927](https://github.com/sanity-io/sanity/issues/9927)
* fix(deps): update dependency @portabletext/editor to ^1.57.0 (#9913) ([e124c21](https://github.com/sanity-io/sanity/commit/e124c21)), closes [#9913](https://github.com/sanity-io/sanity/issues/9913)
* fix(deps): update dependency @portabletext/editor to ^1.57.1 (#9919) ([32ebd0c](https://github.com/sanity-io/sanity/commit/32ebd0c)), closes [#9919](https://github.com/sanity-io/sanity/issues/9919)
* fix(deps): update dependency @portabletext/editor to ^1.57.3 (#9928) ([ea2b66d](https://github.com/sanity-io/sanity/commit/ea2b66d)), closes [#9928](https://github.com/sanity-io/sanity/issues/9928)
* fix(deps): update dependency @sanity/ui to ^2.16.3 (#9931) ([d2b3cf5](https://github.com/sanity-io/sanity/commit/d2b3cf5)), closes [#9931](https://github.com/sanity-io/sanity/issues/9931)
* test: remove flag from cli token tests (#9925) ([6b4088a](https://github.com/sanity-io/sanity/commit/6b4088a)), closes [#9925](https://github.com/sanity-io/sanity/issues/9925)
* test(cli): update to use pnpm to install instead of npm  (#9929) ([ebba8b0](https://github.com/sanity-io/sanity/commit/ebba8b0)), closes [#9929](https://github.com/sanity-io/sanity/issues/9929)
* chore: fix vercel pnpm install issues with recast (#9930) ([c1041cd](https://github.com/sanity-io/sanity/commit/c1041cd)), closes [#9930](https://github.com/sanity-io/sanity/issues/9930)
* chore: using lerna full for creating release PR (#9917) ([82b3fbc](https://github.com/sanity-io/sanity/commit/82b3fbc)), closes [#9917](https://github.com/sanity-io/sanity/issues/9917)
* chore(deps): update dependency esbuild to v0.25.6 (#9908) ([90821b1](https://github.com/sanity-io/sanity/commit/90821b1)), closes [#9908](https://github.com/sanity-io/sanity/issues/9908)
* docs: Marketing/add function examples (#9760) ([ca1d50e](https://github.com/sanity-io/sanity/commit/ca1d50e)), closes [#9760](https://github.com/sanity-io/sanity/issues/9760)





## [3.98.0](https://github.com/sanity-io/sanity/compare/v3.97.1...v3.98.0) (2025-07-07)

### Features

* synchronize schema to the server ([#9622](https://github.com/sanity-io/sanity/issues/9622)) ([2d6d901](https://github.com/sanity-io/sanity/commit/2d6d9014029b30616fb82da9b992dbc6c7f87e65)) by Magnus Holm (judofyr@gmail.com)

### Bug Fixes

* **actions:** add write permissions to actions ([#9894](https://github.com/sanity-io/sanity/issues/9894)) ([8797698](https://github.com/sanity-io/sanity/commit/879769839acef9f31ff47ad672a229e8fe395d57)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** actions flickering- remove cleanup step for hook states on change ([#9885](https://github.com/sanity-io/sanity/issues/9885)) ([2ab9505](https://github.com/sanity-io/sanity/commit/2ab95059b09d4b4b922879f98297878d9eb5b631)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.35 ([#9897](https://github.com/sanity-io/sanity/issues/9897)) ([d21610b](https://github.com/sanity-io/sanity/commit/d21610bb51e925632ab3141811db0fd0bb7b3b39)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.56.0 ([#9889](https://github.com/sanity-io/sanity/issues/9889)) ([9cfd35d](https://github.com/sanity-io/sanity/commit/9cfd35dd5965c476ea6d91818cd3835444265e97)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.97.1](https://github.com/sanity-io/sanity/compare/v3.97.0...v3.97.1) (2025-07-04)

**Note:** Version bump only for package sanity-root

## [3.97.0](https://github.com/sanity-io/sanity/compare/v3.96.0...v3.97.0) (2025-07-04)

### Features

* **cli:** add --project-id as alias of --project to init ([#9799](https://github.com/sanity-io/sanity/issues/9799)) ([af00ad2](https://github.com/sanity-io/sanity/commit/af00ad21343f9b93da1890c8d2be6c627726fd1f)) by Rune Botten (rbotten@gmail.com)
* **cli:** add `sanity projects create` command ([#9830](https://github.com/sanity-io/sanity/issues/9830)) ([af20bbf](https://github.com/sanity-io/sanity/commit/af20bbf4af983f60e1a57c1a8c01ba2a7a90b597)) by Rune Botten (rbotten@gmail.com)
* **cli:** add API tokens management commands ([#9821](https://github.com/sanity-io/sanity/issues/9821)) ([6494f59](https://github.com/sanity-io/sanity/commit/6494f59c505e9bafa69a01db09c1f0ebf4c93a62)) by Rune Botten (rbotten@gmail.com)

### Bug Fixes

* add with user token option to functions test command ([#9881](https://github.com/sanity-io/sanity/issues/9881)) ([fd2aa4c](https://github.com/sanity-io/sanity/commit/fd2aa4c9d25018ba66ada5b13d1e51b0d6f0a0dd)) by Simon MacDonald (simon.macdonald@gmail.com)
* **codegen:** fix tsTypeOperator declaration ([#9882](https://github.com/sanity-io/sanity/issues/9882)) ([37d298d](https://github.com/sanity-io/sanity/commit/37d298d90e7595649fb6deb544c7bb2d74473a02)) by Sindre Gulseth (sgulseth@gmail.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.34 ([#9874](https://github.com/sanity-io/sanity/issues/9874)) ([c7f16f0](https://github.com/sanity-io/sanity/commit/c7f16f0d645305e787561b589e11fa6156466f39)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.15 ([#9875](https://github.com/sanity-io/sanity/issues/9875)) ([41afd49](https://github.com/sanity-io/sanity/commit/41afd49906895a8b7cf4fc4468b13a6e2c5cf604)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.96.0](https://github.com/sanity-io/sanity/compare/v3.95.0...v3.96.0) (2025-07-02)

### Features

* **sanity:** account for draft model being switched off in `isPerspectiveWriteable` ([3d68545](https://github.com/sanity-io/sanity/commit/3d68545b2d818f136155958c5289b0eaf464332c)) by Ash (ash@sanity.io)
* **sanity:** add `document.drafts.enabled` configuration option ([a06c4a5](https://github.com/sanity-io/sanity/commit/a06c4a5d088d46ca7799d065ac1b115a7cb6ff8c)) by Ash (ash@sanity.io)
* **sanity:** add draft model switched off message to `ChooseNewDocumentDestinationBanner` ([1337002](https://github.com/sanity-io/sanity/commit/1337002f8bca8cf78b04dbbeb2bb7bd840c78430)) by Ash (ash@sanity.io)
* **sanity:** add option to compare draft to `ObsoleteDraftBanner` ([0f6c350](https://github.com/sanity-io/sanity/commit/0f6c350d69abecf5c7d6bcd10e41344b6cb51ae5)) by Ash (ash@sanity.io)
* **sanity:** do not render draft status indicators if draft model is not switched on ([453e102](https://github.com/sanity-io/sanity/commit/453e102efd597e5ff9a12f5c8044efd8f5b4ed6d)) by Ash (ash@sanity.io)
* **sanity:** enable dynamic default perspective ([508c736](https://github.com/sanity-io/sanity/commit/508c73673cd26f0a6f1b3da3fa34de821dc58f23)) by Ash (ash@sanity.io)
* **sanity:** exclude drafts from perspective stack when draft model is not switched on ([242c878](https://github.com/sanity-io/sanity/commit/242c878cee9be6fac74462c938e414aa5b0c8be6)) by Ash (ash@sanity.io)
* **sanity:** make global perspective picker compatible with any default perspective ([45a6712](https://github.com/sanity-io/sanity/commit/45a67126328166e05fd60d16986d01b07dce8ef3)) by Ash (ash@sanity.io)
* **sanity:** prevent non-live-edit-document creation when the draft model is not switched on ([20c6a6f](https://github.com/sanity-io/sanity/commit/20c6a6f49aba9a0dd54d51be2b1f968d20ce7662)) by Ash (ash@sanity.io)
* **sanity:** refine obsolete draft copy ([af4c563](https://github.com/sanity-io/sanity/commit/af4c563f36c6b899eac2885041ffbeaf3f6ff837)) by Ash (ash@sanity.io)
* **sanity:** warn of obsolete drafts when draft model is switched off ([1fd984a](https://github.com/sanity-io/sanity/commit/1fd984afdffe2ba05968120e763e97f909138ebb)) by Ash (ash@sanity.io)
* **vision:** adds datasets config option for vision ([#9837](https://github.com/sanity-io/sanity/issues/9837)) ([e3a105e](https://github.com/sanity-io/sanity/commit/e3a105ed1eb2e8ae2ae27b5725be7454302da754)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* add visual indicator when text is removed ([#9832](https://github.com/sanity-io/sanity/issues/9832)) ([ae8c0c1](https://github.com/sanity-io/sanity/commit/ae8c0c19bdb7953b6da1b8e39b7760db9784e181)) by RitaDias (rita@sanity.io)
* **cli:** fixes dev command message ([#9856](https://github.com/sanity-io/sanity/issues/9856)) ([27f0d0c](https://github.com/sanity-io/sanity/commit/27f0d0cc972c3cfe8ac0cbef6828e0cc4a11d373)) by Binoy Patel (me@binoy.io)
* **core:** add 10th text level in PTE ([#9783](https://github.com/sanity-io/sanity/issues/9783)) ([da4dc30](https://github.com/sanity-io/sanity/commit/da4dc305cc1397d3c0ebd046c41a0ae22d0872ee)) by Christian Grøngaard (christian.groengaard@sanity.io)
* **core:** PTE open referenced documents from annotation popup ([#9643](https://github.com/sanity-io/sanity/issues/9643)) ([d4af0c8](https://github.com/sanity-io/sanity/commit/d4af0c8c5a761661b789d34a71afc1b6ee6dc5fc)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** reverts dev engine requirement ([#9865](https://github.com/sanity-io/sanity/issues/9865)) ([f58ed8b](https://github.com/sanity-io/sanity/commit/f58ed8baae47e1a56b36569ee6e648de9b87337a)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** set `_updateAt` to the creation time in version documents ([#9861](https://github.com/sanity-io/sanity/issues/9861)) ([4d354aa](https://github.com/sanity-io/sanity/commit/4d354aaa63d1e2aaa1c1549593d317bfd00448a4)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** tasks active tool animation ([#9840](https://github.com/sanity-io/sanity/issues/9840)) ([27d3390](https://github.com/sanity-io/sanity/commit/27d33905a9da9b3131f57cb85dddcebf6c2201c8)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use `data-list-index` on PTE blocks to improve list counts ([#9784](https://github.com/sanity-io/sanity/issues/9784)) ([de51f45](https://github.com/sanity-io/sanity/commit/de51f4535d9b3d059a359c90f101ca6884ca2764)) by Christian Grøngaard (christian.groengaard@sanity.io)
* **core:** version chip disables context menu when releases are disabled ([#9815](https://github.com/sanity-io/sanity/issues/9815)) ([2b39112](https://github.com/sanity-io/sanity/commit/2b39112d0c6ec9a0aff88f9d114b518a6665ab95)) by Jordan Lawrence (jordanl17@me.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.33 ([#9835](https://github.com/sanity-io/sanity/issues/9835)) ([2349c0d](https://github.com/sanity-io/sanity/commit/2349c0dca29dd6fec0565307fb0beaff62fdbbe0)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.10 ([#9852](https://github.com/sanity-io/sanity/issues/9852)) ([0b5b051](https://github.com/sanity-io/sanity/commit/0b5b051a625ef2520d28db6ba04a91eb1e3590eb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.11 ([#9855](https://github.com/sanity-io/sanity/issues/9855)) ([f1056cb](https://github.com/sanity-io/sanity/commit/f1056cb6254266ca27b92d4cfbcd1a3c37884f71)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.6 ([#9823](https://github.com/sanity-io/sanity/issues/9823)) ([73df0cc](https://github.com/sanity-io/sanity/commit/73df0cce7ea850f93de43216571c104df6da3e4b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.7 ([#9836](https://github.com/sanity-io/sanity/issues/9836)) ([1f575ec](https://github.com/sanity-io/sanity/commit/1f575ec2ca39cda578c65bafabed2e11d878aa31)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.8 ([#9845](https://github.com/sanity-io/sanity/issues/9845)) ([979723c](https://github.com/sanity-io/sanity/commit/979723c453547381cb8651d8ca7631a1dec940a6)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.9 ([#9848](https://github.com/sanity-io/sanity/issues/9848)) ([e64a97a](https://github.com/sanity-io/sanity/commit/e64a97a66c30a8180b68fe65856aa215682a959b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/export to ^3.45.1 ([#9809](https://github.com/sanity-io/sanity/issues/9809)) ([c1d0a72](https://github.com/sanity-io/sanity/commit/c1d0a7253ca030e2dc6d6be2b61a59f38b34d2cd)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/export to ^3.45.2 ([#9831](https://github.com/sanity-io/sanity/issues/9831)) ([95e7cb5](https://github.com/sanity-io/sanity/commit/95e7cb561da08e144199d6e38ee2a8c861a29b95)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency framer-motion to ^12.19.2 ([#9844](https://github.com/sanity-io/sanity/issues/9844)) ([f7775ed](https://github.com/sanity-io/sanity/commit/f7775ed97082192b9f84e17605bd3b3e734b1c74)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency get-it to ^8.6.10 ([#9859](https://github.com/sanity-io/sanity/issues/9859)) ([3185e41](https://github.com/sanity-io/sanity/commit/3185e41f4a4044e3de78a6ffae81c20e008465a4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency scrollmirror to ^1.2.4 ([#9817](https://github.com/sanity-io/sanity/issues/9817)) ([d41f202](https://github.com/sanity-io/sanity/commit/d41f20209f2693eaacd999bc5966d998dedbcbc4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* Update runtime-cli dependency ([#9857](https://github.com/sanity-io/sanity/issues/9857)) ([45cf8f0](https://github.com/sanity-io/sanity/commit/45cf8f05a7cd81b5be7a3fce6a23b04e4928cb2d)) by Simon MacDonald (simon.macdonald@gmail.com)

## [3.95.0](https://github.com/sanity-io/sanity/compare/v3.94.2...v3.95.0) (2025-06-25)

### Features

* **sanity:** activate the create document buttons for all perspectives ([c0b5a0c](https://github.com/sanity-io/sanity/commit/c0b5a0c3a27e346e5bb1cb0bf6c9046956e0e832)) by Ash (ash@sanity.io)
* **sanity:** add document panel banner for choosing new document destination ([95e7ad7](https://github.com/sanity-io/sanity/commit/95e7ad7c45c9abdede380fec131c838c18967720)) by Ash (ash@sanity.io)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^1.1.32 ([#9805](https://github.com/sanity-io/sanity/issues/9805)) ([96c0193](https://github.com/sanity-io/sanity/commit/96c01937ad0c2abfa6c90128da03c8568aed7908)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.5 ([#9806](https://github.com/sanity-io/sanity/issues/9806)) ([275b7a1](https://github.com/sanity-io/sanity/commit/275b7a19e61287b6e28f7b88f7231e364348a6e4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **structure:** fix issue where the versions were being slowly loaded and so the last chip was the wrong one giving us the wrong element ([#9803](https://github.com/sanity-io/sanity/issues/9803)) ([5c48abb](https://github.com/sanity-io/sanity/commit/5c48abba7616ee205e6f60cce85f0081beca075a)) by RitaDias (rita@sanity.io)

## [3.94.2](https://github.com/sanity-io/sanity/compare/v3.94.1...v3.94.2) (2025-06-24)

**Note:** Version bump only for package sanity-root

## [3.94.1](https://github.com/sanity-io/sanity/compare/v3.94.0...v3.94.1) (2025-06-24)

### Bug Fixes

* **cli:** init unattended mode ([#9481](https://github.com/sanity-io/sanity/issues/9481)) ([feb8c15](https://github.com/sanity-io/sanity/commit/feb8c151ebdf4cae01e5f126936fe68238b02f41)) by Rune Botten (rbotten@gmail.com)

## [3.94.0](https://github.com/sanity-io/sanity/compare/v3.93.0...v3.94.0) (2025-06-24)

### Features

* add support for tagging auto update bundles ([#9654](https://github.com/sanity-io/sanity/issues/9654)) ([7cabaea](https://github.com/sanity-io/sanity/commit/7cabaeaf785d1d46d0a886d9c825137063616b87)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** media validator ([#9648](https://github.com/sanity-io/sanity/issues/9648)) ([2e3d18b](https://github.com/sanity-io/sanity/commit/2e3d18b278d9127ff40fed6ce6d12a0098f9f4f1)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **sanity:** add `isNewDocument` function ([1a05454](https://github.com/sanity-io/sanity/commit/1a054542db8a4a00b82b9a3ed773a43f74395e74)) by Ash (ash@sanity.io)
* **sanity:** add `isPerspectiveWriteable` function ([253c508](https://github.com/sanity-io/sanity/commit/253c5084e516c7118e200fe6e7bf91814753e666)) by Ash (ash@sanity.io)
* **sanity:** allow new, unpersisted, documents to move between perspectives seamlessly ([a71f330](https://github.com/sanity-io/sanity/commit/a71f3309f845329d88b6ceda79c841ed7657dc2b)) by Ash (ash@sanity.io)

### Bug Fixes

* **actions:** fix e2e UI test ([#9718](https://github.com/sanity-io/sanity/issues/9718)) ([3919f50](https://github.com/sanity-io/sanity/commit/3919f5097842e32fc60a66b15761e903a8f3eade)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **build:** fixes bundle build script failing ([#9719](https://github.com/sanity-io/sanity/issues/9719)) ([7508e51](https://github.com/sanity-io/sanity/commit/7508e513d21ac661fe95e69513076ee27215f645)) by Binoy Patel (me@binoy.io)
* **ci:** upload modules after releasing next ([#9751](https://github.com/sanity-io/sanity/issues/9751)) ([a49ed83](https://github.com/sanity-io/sanity/commit/a49ed83721a9b3b3e440696477bf93295a6fec8e)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** fix handle of change of dates ([#9732](https://github.com/sanity-io/sanity/issues/9732)) ([23b8016](https://github.com/sanity-io/sanity/commit/23b801691351642afd2e1649d6a6a7aff69b4b66)) by RitaDias (rita@sanity.io)
* **core:** fix issues with ML uploads ([#9745](https://github.com/sanity-io/sanity/issues/9745)) ([8bce663](https://github.com/sanity-io/sanity/commit/8bce663f64a848ebaa3363296e7638bf535060c5)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **core:** update error tooltip for copypaste ([#9696](https://github.com/sanity-io/sanity/issues/9696)) ([7b16d65](https://github.com/sanity-io/sanity/commit/7b16d653b711629302eec8a6991ceb5b9069e167)) by RitaDias (rita@sanity.io)
* **deps:** bump `vitejs/plugin-react` to v4.6 ([#9779](https://github.com/sanity-io/sanity/issues/9779)) ([346d9fc](https://github.com/sanity-io/sanity/commit/346d9fcfe6af28fd8032819aa8dcf3f6a6909c60)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** unpin `scrollmirror` now that it's MIT licensed ([#9786](https://github.com/sanity-io/sanity/issues/9786)) ([5dd3876](https://github.com/sanity-io/sanity/commit/5dd3876f4282574f7e71b0045a4dfad3353a3abc)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.31 ([#9728](https://github.com/sanity-io/sanity/issues/9728)) ([d37cf06](https://github.com/sanity-io/sanity/commit/d37cf06c179d7f0de70f90d420b30f33f29c4751)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.53.1 ([#9729](https://github.com/sanity-io/sanity/issues/9729)) ([cf0bf85](https://github.com/sanity-io/sanity/commit/cf0bf8550a1aab59257166dfb0a353ea9a7fab3f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.54.2 ([#9736](https://github.com/sanity-io/sanity/issues/9736)) ([dfff499](https://github.com/sanity-io/sanity/commit/dfff499c50896a323ffc7ae208cffbbd71875b69)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.54.3 ([#9746](https://github.com/sanity-io/sanity/issues/9746)) ([af9f8fa](https://github.com/sanity-io/sanity/commit/af9f8fa054c33a6b1d4e8058f046269c29c543bc)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.54.4 ([#9762](https://github.com/sanity-io/sanity/issues/9762)) ([3b22192](https://github.com/sanity-io/sanity/commit/3b2219203186a748a460a8b1b9fe0f45560d121e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.0 ([#9767](https://github.com/sanity-io/sanity/issues/9767)) ([87ebf9f](https://github.com/sanity-io/sanity/commit/87ebf9f00d144dd4e4cff7b4ce81a58f3f6e7440)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.2 ([#9781](https://github.com/sanity-io/sanity/issues/9781)) ([a8f4d4c](https://github.com/sanity-io/sanity/commit/a8f4d4c9feb10bda40dab9e55a22464933870157)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.3 ([#9790](https://github.com/sanity-io/sanity/issues/9790)) ([4776574](https://github.com/sanity-io/sanity/commit/4776574fb0510b91f175f0ba92b39a904b4e0618)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/export to ^3.45.0 ([#9717](https://github.com/sanity-io/sanity/issues/9717)) ([61f7421](https://github.com/sanity-io/sanity/commit/61f74216185cbe0673909c8506f47790dc569785)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/icons to ^3.7.3 ([#9737](https://github.com/sanity-io/sanity/issues/9737)) ([198ab74](https://github.com/sanity-io/sanity/commit/198ab74452aab8569bc1a1f7924471732347bd55)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/icons to ^3.7.4 ([#9756](https://github.com/sanity-io/sanity/issues/9756)) ([ac74b4d](https://github.com/sanity-io/sanity/commit/ac74b4dd0c776b84582f728126469dd4a679d3e5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/ui to ^2.16.0 ([#9716](https://github.com/sanity-io/sanity/issues/9716)) ([2586169](https://github.com/sanity-io/sanity/commit/258616905c0a522cbc7990877c7b37cbc9417f61)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/ui to ^2.16.2 ([#9726](https://github.com/sanity-io/sanity/issues/9726)) ([74d5316](https://github.com/sanity-io/sanity/commit/74d5316fb474a8c94a4ecac54d21bfc58c4a6370)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @xstate/react to v6 ([#9743](https://github.com/sanity-io/sanity/issues/9743)) ([2c77e7d](https://github.com/sanity-io/sanity/commit/2c77e7d358e8a3eeb64957637f89936d9c76fe5d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency framer-motion to ^12.19.1 ([#9778](https://github.com/sanity-io/sanity/issues/9778)) ([40af063](https://github.com/sanity-io/sanity/commit/40af063ccee1fead375734c3278bde42cc75dc3c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.17.1 ([#9766](https://github.com/sanity-io/sanity/issues/9766)) ([f915231](https://github.com/sanity-io/sanity/commit/f915231339443a233f4ff981dc7632dc8a0106aa)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency xstate to ^5.20.0 ([#9742](https://github.com/sanity-io/sanity/issues/9742)) ([586a638](https://github.com/sanity-io/sanity/commit/586a638358b5bc73e68cfc16c8d0abaa6a14b966)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#9741](https://github.com/sanity-io/sanity/issues/9741)) ([d233393](https://github.com/sanity-io/sanity/commit/d23339374641a9a6b7a2a95e0e47773f7c30461a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#9755](https://github.com/sanity-io/sanity/issues/9755)) ([17c8ae5](https://github.com/sanity-io/sanity/commit/17c8ae5b20173dad6e522832a55f1e8442456469)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **examples:** auto tag config ([#9722](https://github.com/sanity-io/sanity/issues/9722)) ([afab857](https://github.com/sanity-io/sanity/commit/afab857d2d6d7599b37ced9a0d866042a02cd4cd)) by Knut Melvær (knut@sanity.io)
* manifest extract now correctly handles inline array.of item types that has a name conflicting with a global type ([#9664](https://github.com/sanity-io/sanity/issues/9664)) ([6c1896c](https://github.com/sanity-io/sanity/commit/6c1896c6dfcc2379cd2a5bf9040c8707d10ffc07)) by Snorre Eskeland Brekke (snorre.e.brekke@gmail.com)
* pin `scrollmirror` to MIT licensed version ([#9777](https://github.com/sanity-io/sanity/issues/9777)) ([6da4675](https://github.com/sanity-io/sanity/commit/6da467518820d53761f71914ada4fb80fdba6f08)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* print available workspaces for easier debugging ([#9377](https://github.com/sanity-io/sanity/issues/9377)) ([6377c06](https://github.com/sanity-io/sanity/commit/6377c06e671004c3857f9232a332949bd5f78e2e)) by Simeon Griggs (simeon@hey.com)
* **sanity:** be more resilient to process.env not being processed ([#9769](https://github.com/sanity-io/sanity/issues/9769)) ([91c1afb](https://github.com/sanity-io/sanity/commit/91c1afb84b2dd045b7c58ecffd8e873954ee842e)) by Magnus Holm (judofyr@gmail.com)
* stop publishing src folders to npm ([#9744](https://github.com/sanity-io/sanity/issues/9744)) ([e9296c1](https://github.com/sanity-io/sanity/commit/e9296c12d1c68ea912a309a6bfe6cb752172ba07)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [3.93.0](https://github.com/sanity-io/sanity/compare/v3.92.0...v3.93.0) (2025-06-17)

### Features

* Add comprehensive examples directory structure ([#9651](https://github.com/sanity-io/sanity/issues/9651)) ([3548bd0](https://github.com/sanity-io/sanity/commit/3548bd0d6fd14e6d5c36ece8dcf880b1c5c0ae8d)) by Knut Melvær (knut@sanity.io)
* **ci:** optimize workflows to skip examples-only changes ([#9680](https://github.com/sanity-io/sanity/issues/9680)) ([92b1fa5](https://github.com/sanity-io/sanity/commit/92b1fa5c51d104c8075b04a7204118356903cb7d)) by Knut Melvær (knut@sanity.io)
* **cli:** Improve guidance after SDK app init ([#9640](https://github.com/sanity-io/sanity/issues/9640)) ([52ea1d6](https://github.com/sanity-io/sanity/commit/52ea1d6df9f4ada9eb472d1cea718ac5aedbc929)) by Cole Peters (cole@colepeters.com)
* **cli:** report error cause after catching CLI error ([b137973](https://github.com/sanity-io/sanity/commit/b1379735325373d96a7a11ad05ac2a91648b8979)) by Ash (ash@sanity.io)
* **cli:** update runtime-cli and enable example flag ([#9652](https://github.com/sanity-io/sanity/issues/9652)) ([2daf089](https://github.com/sanity-io/sanity/commit/2daf089745f2556d35f0380279d441ee6d10c92b)) by Taylor Beseda (tbeseda@gmail.com)
* **core:** add one line portable text editor option ([#9625](https://github.com/sanity-io/sanity/issues/9625)) ([f64bd68](https://github.com/sanity-io/sanity/commit/f64bd6823ef00b09bf9dd6ccaac702723918dd8b)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **schema:** serialize schema in debug mode ([#9503](https://github.com/sanity-io/sanity/issues/9503)) ([d9d9d67](https://github.com/sanity-io/sanity/commit/d9d9d673919dcdb95acc78fd117d36c4382d6b6f)) by Magnus Holm (judofyr@gmail.com)

### Bug Fixes

* **actions:** Vercel deployment failure when PR titles "contain" double quotes ([#9630](https://github.com/sanity-io/sanity/issues/9630)) ([a0c9889](https://github.com/sanity-io/sanity/commit/a0c9889063c806735225ce3076711e3c5ea0158e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **ci:** remove @conventional-changelog/git-client version override ([#9653](https://github.com/sanity-io/sanity/issues/9653)) ([093bcb6](https://github.com/sanity-io/sanity/commit/093bcb6a023c98e6f22fb74ab797b7bb8ff3b78f)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** ensure virtualized array items are rendered before scroll ([#9611](https://github.com/sanity-io/sanity/issues/9611)) ([8d8cfa2](https://github.com/sanity-io/sanity/commit/8d8cfa2aeecded328547a46a86c1d1ae8514378b)) by Rupert Dunk (rupert@rupertdunk.com)
* **deps:** bump react virtual to v3.13.6 ([#9705](https://github.com/sanity-io/sanity/issues/9705)) ([85eacd8](https://github.com/sanity-io/sanity/commit/85eacd8a4803572010e40b5799fc9166bf507740)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** bump react-virtual to v3.13.10 ([#9711](https://github.com/sanity-io/sanity/issues/9711)) ([6bbf3bd](https://github.com/sanity-io/sanity/commit/6bbf3bda4252399cf4cb48e1db1f8b87cea859b8)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** pin react-virtual to v3.13.2 ([#9700](https://github.com/sanity-io/sanity/issues/9700)) ([aa28847](https://github.com/sanity-io/sanity/commit/aa28847ed9833224b5e1d58c59cadf1682b99133)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** Update babel monorepo ([#9690](https://github.com/sanity-io/sanity/issues/9690)) ([6d52330](https://github.com/sanity-io/sanity/commit/6d523302ffa0232653baacde84bbf6244953f599)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update CodeMirror ([#9691](https://github.com/sanity-io/sanity/issues/9691)) ([6538309](https://github.com/sanity-io/sanity/commit/6538309add507cb38257b43be5d6fece2021a14f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.29 ([#9602](https://github.com/sanity-io/sanity/issues/9602)) ([8d6ac7c](https://github.com/sanity-io/sanity/commit/8d6ac7cf267195659721a7dee4a5167a296f7df9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.30 ([#9619](https://github.com/sanity-io/sanity/issues/9619)) ([408c5e3](https://github.com/sanity-io/sanity/commit/408c5e3892ffd1846ae3ab357f0c9e39da272fc4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.52.0 ([#9603](https://github.com/sanity-io/sanity/issues/9603)) ([7bdcbcb](https://github.com/sanity-io/sanity/commit/7bdcbcb39a178b74fce51905c7d5c47c93e4aec9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.52.7 ([#9620](https://github.com/sanity-io/sanity/issues/9620)) ([6673c7f](https://github.com/sanity-io/sanity/commit/6673c7fe309f057e744e3a2c19cdaa1fb87e9ead)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.53.0 ([#9642](https://github.com/sanity-io/sanity/issues/9642)) ([8b60220](https://github.com/sanity-io/sanity/commit/8b602207abead2eaa4d06edb437ac929ecaa71a1)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.6.0 ([#9649](https://github.com/sanity-io/sanity/issues/9649)) ([e41e814](https://github.com/sanity-io/sanity/commit/e41e8140d2de74151228f535181d368407aa9111)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency framer-motion to ^12.18.1 ([#9674](https://github.com/sanity-io/sanity/issues/9674)) ([3969445](https://github.com/sanity-io/sanity/commit/39694453147d50198d565d96b39fc512d58fe63f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency react-rx to ^4.1.30 ([#9693](https://github.com/sanity-io/sanity/issues/9693)) ([0f09c4c](https://github.com/sanity-io/sanity/commit/0f09c4c430f242c3f5f49a3f955a1935bdd4cc4c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dnd-kit monorepo ([#9692](https://github.com/sanity-io/sanity/issues/9692)) ([571808d](https://github.com/sanity-io/sanity/commit/571808d07b90034bfa99113ee79e275ded53782d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* manifest extract now correctly serializes global document references ([#9604](https://github.com/sanity-io/sanity/issues/9604)) ([5b15f40](https://github.com/sanity-io/sanity/commit/5b15f40a543d9285925ad5ca33c5922ebb060121)) by Snorre Eskeland Brekke (snorre.e.brekke@gmail.com)
* **presentation:** hide locations banner if location is empty ([#9655](https://github.com/sanity-io/sanity/issues/9655)) ([f636721](https://github.com/sanity-io/sanity/commit/f6367213fff469f5edf312d96a0ae6ca98ceffa2)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **sanity:** avoid writing to `message` property of unknown caught value ([cedda92](https://github.com/sanity-io/sanity/commit/cedda92b038b013d6c3380fcfc72c9f39b6e052d)) by Ash (ash@sanity.io)
* update link to join community ([#9646](https://github.com/sanity-io/sanity/issues/9646)) ([608e0a2](https://github.com/sanity-io/sanity/commit/608e0a2db57391a57fe16cd1b79818ff46ac5811)) by Bjørge Næss (bjoerge@gmail.com)
* update readme broken links ([#9618](https://github.com/sanity-io/sanity/issues/9618)) ([b1f95e8](https://github.com/sanity-io/sanity/commit/b1f95e883d04b179bfa08d79f012a82d9de44421)) by David T (73550581+JoanCTO@users.noreply.github.com)

## [3.92.0](https://github.com/sanity-io/sanity/compare/v3.91.0...v3.92.0) (2025-06-10)

### Features

* add timeZone settings to datetime input ([#8181](https://github.com/sanity-io/sanity/issues/8181)) ([1ca2568](https://github.com/sanity-io/sanity/commit/1ca25683166f1801846b29085b20169027850c33)) by Eoin Falconer (eoin.falc@gmail.com)
* **cli:** update React and friends for Studios created via init ([#9576](https://github.com/sanity-io/sanity/issues/9576)) ([0ebfbfe](https://github.com/sanity-io/sanity/commit/0ebfbfe4f5313141b38f7092ff198d564d1eb328)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** allow configuring PTE plugins ([#8785](https://github.com/sanity-io/sanity/issues/8785)) ([57b8dc5](https://github.com/sanity-io/sanity/commit/57b8dc5df8c5bb9142fd953ab93733325ae2e282)) by Christian Grøngaard (christian.groengaard@sanity.io)
* **core:** versions primary action ([#9596](https://github.com/sanity-io/sanity/issues/9596)) ([c0d9efa](https://github.com/sanity-io/sanity/commit/c0d9efa395f4e71f6830c8751f623e14860dcec1)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **sanity:** add display names to middleware components ([f7f756b](https://github.com/sanity-io/sanity/commit/f7f756b30c872022103e178278fc5af48b9e5846)) by Ash (ash@sanity.io)
* **sanity:** add suspense boundaries to middleware components ([3fbca9c](https://github.com/sanity-io/sanity/commit/3fbca9cc082b52b471a38e424338494f8cfc410c)) by Ash (ash@sanity.io)
* **sanity:** allow `ReleasesNav` inner `MenuItem` props to be customised ([7fd6773](https://github.com/sanity-io/sanity/commit/7fd6773015d6c296b2e031fad839d5d408a1c35a)) by Ash (ash@sanity.io)
* **sanity:** allow `ReleasesNav` to be rendered without releases tool button ([07359c8](https://github.com/sanity-io/sanity/commit/07359c84cb6b2b5e27c26996f59986a7917cd345)) by Ash (ash@sanity.io)
* **sanity:** allow workspace switching in Dashboard ([#9569](https://github.com/sanity-io/sanity/issues/9569)) ([6e43480](https://github.com/sanity-io/sanity/commit/6e43480f72b0f553e0288cc5d6737031b35f8e87)) by Ash (ash@sanity.io)
* **sanity:** export `ReleasesNav` ([7aeb253](https://github.com/sanity-io/sanity/commit/7aeb253af870d27510c55317f7d2a6c1d12649df)) by Ash (ash@sanity.io)
* Support Portable Text object deprecation  ([#9590](https://github.com/sanity-io/sanity/issues/9590))  ([08204e1](https://github.com/sanity-io/sanity/commit/08204e17ed43ff41a68bd13cfc7cd080218d2be0)) by Saskia (72471533+bobinska-dev@users.noreply.github.com)

### Bug Fixes

* `duplicate context` error for media library ([#9580](https://github.com/sanity-io/sanity/issues/9580)) ([8fcb587](https://github.com/sanity-io/sanity/commit/8fcb58713ed1e1d78ff199af3c277e20d75d6424)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **ci:** skip creating release pr for release commit ([#9555](https://github.com/sanity-io/sanity/issues/9555)) ([0c62475](https://github.com/sanity-io/sanity/commit/0c62475c85555df7d7bc5e44a6a95512161d5d1e)) by Bjørge Næss (bjoerge@gmail.com)
* **ci:** use pnpm for pkg.pr.new ([#9554](https://github.com/sanity-io/sanity/issues/9554)) ([8e8a224](https://github.com/sanity-io/sanity/commit/8e8a224f4df5053d7dcbb0b2315eb3dab8ae000c)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** bring back the continue option for auto-update prompts ([#9578](https://github.com/sanity-io/sanity/issues/9578)) ([762b668](https://github.com/sanity-io/sanity/commit/762b6683ee4127b8bac102e862fb351fb90849ab)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** do not create projects with undefined organizations ([#9548](https://github.com/sanity-io/sanity/issues/9548)) ([3717582](https://github.com/sanity-io/sanity/commit/37175828033f8c6a7e3302fa5e39d8a19b35c11a)) by Carolina Gonzalez (carolina@sanity.io)
* **cli:** skip auto update prompt for non-interactive sessions ([#9577](https://github.com/sanity-io/sanity/issues/9577)) ([19ebe8f](https://github.com/sanity-io/sanity/commit/19ebe8f22fecc7afc327d40c9579e1ad31191305)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** get correct document title when creating comments ([#9560](https://github.com/sanity-io/sanity/issues/9560)) ([e9b861a](https://github.com/sanity-io/sanity/commit/e9b861a7e34572c3b2326155fb2197bef831eea3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** history cleared event should be the last event in the even… ([#9559](https://github.com/sanity-io/sanity/issues/9559)) ([1dc766a](https://github.com/sanity-io/sanity/commit/1dc766a75023597272143a72392248bdcedca29d)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** restore delete document uses `lastRevision` ([#9552](https://github.com/sanity-io/sanity/issues/9552)) ([8832126](https://github.com/sanity-io/sanity/commit/88321264dd315df9ecb66d3103218dc773c98987)) by Jordan Lawrence (jordanl17@me.com)
* **core:** update buildCommentBreadCrumb recursivity ([#9525](https://github.com/sanity-io/sanity/issues/9525)) ([70815e6](https://github.com/sanity-io/sanity/commit/70815e623d4e58a56b5d091085e021b9445e5e56)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.28 ([#9424](https://github.com/sanity-io/sanity/issues/9424)) ([b366fcd](https://github.com/sanity-io/sanity/commit/b366fcdfbc28ec5f81feaf6cc3682da19426cdf5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.50.8 ([#9508](https://github.com/sanity-io/sanity/issues/9508)) ([f6357db](https://github.com/sanity-io/sanity/commit/f6357dbe1e19076286c06de8d2c272058c0dc01e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.4.1 ([#9563](https://github.com/sanity-io/sanity/issues/9563)) ([28995c1](https://github.com/sanity-io/sanity/commit/28995c11d7e920467e50116a5be97f215ab85fd2)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.5.0 ([#9591](https://github.com/sanity-io/sanity/issues/9591)) ([f33154b](https://github.com/sanity-io/sanity/commit/f33154ba7336299ee0969a0a8db5bf106c3a7825)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update xstate monorepo ([#9586](https://github.com/sanity-io/sanity/issues/9586)) ([cd358b0](https://github.com/sanity-io/sanity/commit/cd358b0b09910e2c0161e838041fb6d49bd51d2a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* DevEx improvements when using functions cli commands ([#9595](https://github.com/sanity-io/sanity/issues/9595)) ([844b3d4](https://github.com/sanity-io/sanity/commit/844b3d4b3a0cbfe1020b0815d67100a62f1841e1)) by Simon MacDonald (simon.macdonald@gmail.com)
* fixing search for timezones ([#9579](https://github.com/sanity-io/sanity/issues/9579)) ([8af6f8d](https://github.com/sanity-io/sanity/commit/8af6f8d288d3ddc1d9a60f4b1430a33e48b18fdb)) by Eoin Falconer (eoin.falc@gmail.com)
* handle imperative focus state in slug input correctly ([#9581](https://github.com/sanity-io/sanity/issues/9581)) ([672fba8](https://github.com/sanity-io/sanity/commit/672fba8b84083052e1f9553fe9ce311835bacc7b)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* resolve `getAttribute` is not a function errors in PTE on next.js ([#9571](https://github.com/sanity-io/sanity/issues/9571)) ([db63fa1](https://github.com/sanity-io/sanity/commit/db63fa15098794b54d8d24d8bbae66ea3334af97)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **sanity:** perspective menu vertical alignment ([aaa5db2](https://github.com/sanity-io/sanity/commit/aaa5db21cf0657650fe547cdc8b2b8a29f99f2ef)) by Ash (ash@sanity.io)
* speedup `sanity dev` by warming up the entry file ([#9567](https://github.com/sanity-io/sanity/issues/9567)) ([10dc15d](https://github.com/sanity-io/sanity/commit/10dc15df6a2d86515f53d3950dafb8462fac4073)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [3.91.0](https://github.com/sanity-io/sanity/compare/v3.90.0...v3.91.0) (2025-06-03)

### Features

* duplicate release ([#9445](https://github.com/sanity-io/sanity/issues/9445)) ([f9d03da](https://github.com/sanity-io/sanity/commit/f9d03da5fb9546a349408de2721249dc9e707bbc)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** add ability to map document upon duplication ([#9517](https://github.com/sanity-io/sanity/issues/9517)) ([25e5bfd](https://github.com/sanity-io/sanity/commit/25e5bfdb3308ae10a1d59628bcddbcbbfc7ac9ab)) by Ash (ash@sanity.io)
* **sanity:** add workspace release count limit ([3268a01](https://github.com/sanity-io/sanity/commit/3268a0197fba819bf738750f69ee109e61698f69)) by Ash (ash@sanity.io)
* **sanity:** make `releases.enabled` configuration optional ([505631c](https://github.com/sanity-io/sanity/commit/505631cf678ebf0a8d0141f07e78798cb859d1ae)) by Ash (ash@sanity.io)

### Bug Fixes

* **ci:** add token requirement for npm provenance ([#9549](https://github.com/sanity-io/sanity/issues/9549)) ([2ac64d1](https://github.com/sanity-io/sanity/commit/2ac64d1ff0408565196d5a0d9bed91a2a3185b4b)) by Bjørge Næss (bjoerge@gmail.com)
* **ci:** fix efps document references ([#9542](https://github.com/sanity-io/sanity/issues/9542)) ([d9ca72d](https://github.com/sanity-io/sanity/commit/d9ca72dfc752589f63482c04c6c3c64764f0d222)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** check if is interactive before prompting to upgrade ([#9530](https://github.com/sanity-io/sanity/issues/9530)) ([5aa3c1d](https://github.com/sanity-io/sanity/commit/5aa3c1de553c37d148481d02cf30bde285f4f58a)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** add condition in useDocumentTitle to allow for unpublished preview title ([#9489](https://github.com/sanity-io/sanity/issues/9489)) ([45fbd31](https://github.com/sanity-io/sanity/commit/45fbd310626fb1e84f0ebeb0bd6a60ce7cba7df3)) by RitaDias (rita@sanity.io)
* **core:** hide `getAddonDataset` error ([#9520](https://github.com/sanity-io/sanity/issues/9520)) ([ee3eda6](https://github.com/sanity-io/sanity/commit/ee3eda635275f44c7e487eb096951e12e60c6131)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** updates to change indicators in review changes ([#9516](https://github.com/sanity-io/sanity/issues/9516)) ([633b489](https://github.com/sanity-io/sanity/commit/633b48969721cf42f5c7f1587b1d16159169c404)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.4.0 ([#9527](https://github.com/sanity-io/sanity/issues/9527)) ([1184899](https://github.com/sanity-io/sanity/commit/1184899e50bf559e0f47db0e94df942a7fa7be3a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/comlink to ^3.0.5 ([#9522](https://github.com/sanity-io/sanity/issues/9522)) ([50ff007](https://github.com/sanity-io/sanity/commit/50ff0070d708f4617d05a578d4e4597c661e0202)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/insert-menu to v1.1.12 ([#9523](https://github.com/sanity-io/sanity/issues/9523)) ([897eaae](https://github.com/sanity-io/sanity/commit/897eaaefd621b77395123ed4e271b109075bbb2a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.20 ([#9468](https://github.com/sanity-io/sanity/issues/9468)) ([0814c03](https://github.com/sanity-io/sanity/commit/0814c03ca8def017f498b7d3154787a0b8d21ad9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.21 ([#9524](https://github.com/sanity-io/sanity/issues/9524)) ([70e5d40](https://github.com/sanity-io/sanity/commit/70e5d40fa41000103c95f71ec62989f13f612230)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.17.0 ([#9507](https://github.com/sanity-io/sanity/issues/9507)) ([ceb86ec](https://github.com/sanity-io/sanity/commit/ceb86ecd0d98f5028f81d2909a92c94ad15e89c5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency react-rx to ^4.1.29 ([#9513](https://github.com/sanity-io/sanity/issues/9513)) ([b77cc08](https://github.com/sanity-io/sanity/commit/b77cc08518c8187d1a7869e67b3f0e5ec205828c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **presentation:** fix multiple resolver document location state ([#9428](https://github.com/sanity-io/sanity/issues/9428)) ([fb3a956](https://github.com/sanity-io/sanity/commit/fb3a956f0194984833733cb740109de7d527b0d0)) by Rupert Dunk (rupert@rupertdunk.com)
* **releases:** optimize document availability subscription ([#9373](https://github.com/sanity-io/sanity/issues/9373)) ([6987830](https://github.com/sanity-io/sanity/commit/69878300ba363f505a8d47a4c8e4a8bf2f6a8c9a)) by Bjørge Næss (bjoerge@gmail.com)

### Reverts

* publish v3.91.0 ([#9546](https://github.com/sanity-io/sanity/issues/9546)) ([#9550](https://github.com/sanity-io/sanity/issues/9550)) ([d191e4c](https://github.com/sanity-io/sanity/commit/d191e4cdbccc68cda01f864c0290528df91d9571)) by Bjørge Næss (bjoerge@gmail.com)
