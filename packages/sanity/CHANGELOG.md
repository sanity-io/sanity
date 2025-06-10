# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.92.0](https://github.com/sanity-io/sanity/compare/v3.91.0...v3.92.0) (2025-06-10)

### Features

* add timeZone settings to datetime input ([#8181](https://github.com/sanity-io/sanity/issues/8181)) ([1ca2568](https://github.com/sanity-io/sanity/commit/1ca25683166f1801846b29085b20169027850c33)) by Eoin Falconer (eoin.falc@gmail.com)
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
* **ci:** use pnpm for pkg.pr.new ([#9554](https://github.com/sanity-io/sanity/issues/9554)) ([8e8a224](https://github.com/sanity-io/sanity/commit/8e8a224f4df5053d7dcbb0b2315eb3dab8ae000c)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** bring back the continue option for auto-update prompts ([#9578](https://github.com/sanity-io/sanity/issues/9578)) ([762b668](https://github.com/sanity-io/sanity/commit/762b6683ee4127b8bac102e862fb351fb90849ab)) by Bjørge Næss (bjoerge@gmail.com)
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

# Changelog

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
