# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.12.0](https://github.com/sanity-io/sanity/compare/v5.11.0...v5.12.0) (2026-02-24)

**Note:** Version bump only for package @sanity/schema

## [5.11.0](https://github.com/sanity-io/sanity/compare/v5.10.0...v5.11.0) (2026-02-19)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.27.1 ([#12180](https://github.com/sanity-io/sanity/issues/12180)) ([c8c7dea](https://github.com/sanity-io/sanity/commit/c8c7dea5a94a691dabb2f1549a2d494432d494f0)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.10.0](https://github.com/sanity-io/sanity/compare/v5.9.0...v5.10.0) (2026-02-17)

### Features

* add warning when a document type is used for a field ([#12151](https://github.com/sanity-io/sanity/issues/12151)) ([8519d02](https://github.com/sanity-io/sanity/commit/8519d029c35a7419e944bfa61180de6a15e9a057)) by Kristoffer Brabrand (kristoffer@brabrand.no)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.27.0 ([#12160](https://github.com/sanity-io/sanity/issues/12160)) ([ff50a1c](https://github.com/sanity-io/sanity/commit/ff50a1c1378bef2b8f8b92bfaa15fcc7cd17787d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* don't make inline refs for references to top level doc types ([#12168](https://github.com/sanity-io/sanity/issues/12168)) ([7e490d9](https://github.com/sanity-io/sanity/commit/7e490d905a01beb5c65319edfdb3a0a4eaa86068)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* warn on doc type used as field type in array member too ([#12165](https://github.com/sanity-io/sanity/issues/12165)) ([94fa583](https://github.com/sanity-io/sanity/commit/94fa58373887b5ca49f376763b7432391579b641)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [5.9.0](https://github.com/sanity-io/sanity/compare/v5.8.1...v5.9.0) (2026-02-10)

### Features

* add hidden to validation context ([#12050](https://github.com/sanity-io/sanity/issues/12050)) ([26b665b](https://github.com/sanity-io/sanity/commit/26b665b540269d63a446bcfa361db5ddf0d561df)) by RitaDias (rita@sanity.io)

### Bug Fixes

* add warning for schema validation when an array contains multiple primitive types that resolve to same json type ([#12095](https://github.com/sanity-io/sanity/issues/12095)) ([31155be](https://github.com/sanity-io/sanity/commit/31155be6dbf86faeb41b77cea27cf9c765961234)) by RitaDias (rita@sanity.io)

### Reverts

* rollback v5.9.0 version bump ([#12139](https://github.com/sanity-io/sanity/issues/12139)) ([4195d26](https://github.com/sanity-io/sanity/commit/4195d269f400347fb16765400842f765eb1625ec)) by Bjørge Næss (bjoerge@gmail.com)

## [5.8.1](https://github.com/sanity-io/sanity/compare/v5.8.0...v5.8.1) (2026-02-05)

**Note:** Version bump only for package @sanity/schema

## [5.8.0](https://github.com/sanity-io/sanity/compare/v5.7.0...v5.8.0) (2026-02-03)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.26.0 ([#11983](https://github.com/sanity-io/sanity/issues/11983)) ([052b6a2](https://github.com/sanity-io/sanity/commit/052b6a23074c4b3541665dd21b0680ef29626a1e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.7.0](https://github.com/sanity-io/sanity/compare/v5.6.0...v5.7.0) (2026-01-27)

**Note:** Version bump only for package @sanity/schema

## [5.6.0](https://github.com/sanity-io/sanity/compare/v5.5.0...v5.6.0) (2026-01-22)

### Features

* **schema:** export DEFAULT_ANNOTATIONS and DEFAULT_DECORATORS ([#11916](https://github.com/sanity-io/sanity/issues/11916)) ([55cdb56](https://github.com/sanity-io/sanity/commit/55cdb56d5f55a6c21a38bd44ec45e69637bbffc6)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* allow custom object types as portable text annotations ([#11893](https://github.com/sanity-io/sanity/issues/11893)) ([968005f](https://github.com/sanity-io/sanity/commit/968005f6f1fad512269c3b18787a9e0f25d76ea7)) by RitaDias (rita@sanity.io)

## [5.5.0](https://github.com/sanity-io/sanity/compare/v5.4.0...v5.5.0) (2026-01-19)

**Note:** Version bump only for package @sanity/schema

## [5.4.0](https://github.com/sanity-io/sanity/compare/v5.3.1...v5.4.0) (2026-01-15)

**Note:** Version bump only for package @sanity/schema

## [5.3.1](https://github.com/sanity-io/sanity/compare/v5.3.0...v5.3.1) (2026-01-14)

**Note:** Version bump only for package @sanity/schema

## [5.3.0](https://github.com/sanity-io/sanity/compare/v5.2.0...v5.3.0) (2026-01-13)

### Features

* add thumbhash supoort for media-library ([76cda08](https://github.com/sanity-io/sanity/commit/76cda086e3138af4a28cda127260f0b530d9c3dc)) by Dan Groves (dan.groves@sanity.io)

### Bug Fixes

* **linter:** enforce no unnecessary boolean literal comparisons ([#11734](https://github.com/sanity-io/sanity/issues/11734)) ([94462ad](https://github.com/sanity-io/sanity/commit/94462ad1f55c5a809f030ab21db5148bf921726b)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [5.2.0](https://github.com/sanity-io/sanity/compare/v5.1.0...v5.2.0) (2026-01-07)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.24.1 ([#11679](https://github.com/sanity-io/sanity/issues/11679)) ([ce27be7](https://github.com/sanity-io/sanity/commit/ce27be7364e6d42bdff64d2477173f60d8274a62)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.25.0 ([#11697](https://github.com/sanity-io/sanity/issues/11697)) ([a58262b](https://github.com/sanity-io/sanity/commit/a58262bac5a0b7c97dad514910af6c9153a37426)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.1.0](https://github.com/sanity-io/sanity/compare/v5.0.1...v5.1.0) (2025-12-22)

**Note:** Version bump only for package @sanity/schema

## [5.0.1](https://github.com/sanity-io/sanity/compare/v5.0.0...v5.0.1) (2025-12-17)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.24.0 ([#11534](https://github.com/sanity-io/sanity/issues/11534)) ([e1c46d5](https://github.com/sanity-io/sanity/commit/e1c46d572cf703090eb4fd224486ebab1e6b9b4b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **schema:** sort out conflict between hoisted ref types and other types ([#11579](https://github.com/sanity-io/sanity/issues/11579)) ([85d65b1](https://github.com/sanity-io/sanity/commit/85d65b166b4597ce15a7b73b9e86821ab39563f4)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [5.0.0](https://github.com/sanity-io/sanity/compare/v4.22.0...v5.0.0) (2025-12-16)

### ⚠ BREAKING CHANGES

* **schema:** add schema inline hoisting (#11521)

### Features

* **schema:** add schema inline hoisting ([#11521](https://github.com/sanity-io/sanity/issues/11521)) ([f81e3cc](https://github.com/sanity-io/sanity/commit/f81e3cc03f9a8dfaeac7ffd2ac890346225be447)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **schema:** hoist reference types and use inline objects to reference them ([#11471](https://github.com/sanity-io/sanity/issues/11471)) ([16ce107](https://github.com/sanity-io/sanity/commit/16ce1075f8b3d3a6b0c0edec8fe1fa9500baef45)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [4.22.0](https://github.com/sanity-io/sanity/compare/v4.21.1...v4.22.0) (2025-12-16)

**Note:** Version bump only for package @sanity/schema

## [4.21.1](https://github.com/sanity-io/sanity/compare/v4.21.0...v4.21.1) (2025-12-11)

**Note:** Version bump only for package @sanity/schema

## [4.21.0](https://github.com/sanity-io/sanity/compare/v4.20.3...v4.21.0) (2025-12-09)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.23.0 ([#11429](https://github.com/sanity-io/sanity/issues/11429)) ([b100ba4](https://github.com/sanity-io/sanity/commit/b100ba48cf49f31c0230c92095450aa0690e7d4b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **schema:** regression when inline type reference another inline type ([#11411](https://github.com/sanity-io/sanity/issues/11411)) ([de7888a](https://github.com/sanity-io/sanity/commit/de7888a46275dae77a19eb1bd8e1f47f7986efcb)) by Sindre Gulseth (sgulseth@gmail.com)

## [4.20.3](https://github.com/sanity-io/sanity/compare/v4.20.2...v4.20.3) (2025-12-04)

**Note:** Version bump only for package @sanity/schema

## [4.20.2](https://github.com/sanity-io/sanity/compare/v4.20.1...v4.20.2) (2025-12-04)

**Note:** Version bump only for package @sanity/schema

## [4.20.1](https://github.com/sanity-io/sanity/compare/v4.20.0...v4.20.1) (2025-12-03)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.22.0 ([#11366](https://github.com/sanity-io/sanity/issues/11366)) ([6976b77](https://github.com/sanity-io/sanity/commit/6976b77295f0959abc588fe24dbd45e246d4b217)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* handle asset as array member with enforce required fields ([#11370](https://github.com/sanity-io/sanity/issues/11370)) ([6cb181b](https://github.com/sanity-io/sanity/commit/6cb181b4a9f0bc64ed0c4991a3b2eb9bc6c6054f)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [4.20.0](https://github.com/sanity-io/sanity/compare/v4.19.0...v4.20.0) (2025-12-02)

### Features

* **descriptors:** minimize blocking the UI ([2826615](https://github.com/sanity-io/sanity/commit/2826615efb55aee9a99077daf6cf831e5e051f9c)) by Magnus Holm (judofyr@gmail.com)
* **schema:** cache generated field objects ([8efdc2b](https://github.com/sanity-io/sanity/commit/8efdc2b31f4156a30710562852fb5bb41409ee7d)) by Magnus Holm (judofyr@gmail.com)
* **schema:** de-dupe re-used fields in the descriptor ([b287558](https://github.com/sanity-io/sanity/commit/b287558417c6f06eaaf7acf1a4f51dc6aab0c3f6)) by Magnus Holm (judofyr@gmail.com)
* support private assets ([#11316](https://github.com/sanity-io/sanity/issues/11316)) ([9a661ca](https://github.com/sanity-io/sanity/commit/9a661ca445b108db5a2dca1b471aab7a8ebe29bc)) by Rupert Dunk (rupert@rupertdunk.com)

## [4.19.0](https://github.com/sanity-io/sanity/compare/v4.18.0...v4.19.0) (2025-11-25)

**Note:** Version bump only for package @sanity/schema

## [4.18.0](https://github.com/sanity-io/sanity/compare/v4.17.0...v4.18.0) (2025-11-21)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.21.0 ([#11216](https://github.com/sanity-io/sanity/issues/11216)) ([fc8f483](https://github.com/sanity-io/sanity/commit/fc8f4832c1a80162bdc54a229f66c3af911a3d21)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.17.0](https://github.com/sanity-io/sanity/compare/v4.16.0...v4.17.0) (2025-11-20)

**Note:** Version bump only for package @sanity/schema

## [4.16.0](https://github.com/sanity-io/sanity/compare/v4.15.0...v4.16.0) (2025-11-18)

**Note:** Version bump only for package @sanity/schema

## [4.15.0](https://github.com/sanity-io/sanity/compare/v4.14.2...v4.15.0) (2025-11-11)

### Bug Fixes

* **schema:** extract inline non-objects ([#10990](https://github.com/sanity-io/sanity/issues/10990)) ([c151b89](https://github.com/sanity-io/sanity/commit/c151b89802f4450858d4856f2dc14f3761590d27)) by Sindre Gulseth (sgulseth@gmail.com)

## [4.14.2](https://github.com/sanity-io/sanity/compare/v4.14.1...v4.14.2) (2025-11-07)

**Note:** Version bump only for package @sanity/schema

## [4.14.1](https://github.com/sanity-io/sanity/compare/v4.14.0...v4.14.1) (2025-11-06)

**Note:** Version bump only for package @sanity/schema

## [4.14.0](https://github.com/sanity-io/sanity/compare/v4.13.0...v4.14.0) (2025-11-06)

**Note:** Version bump only for package @sanity/schema

## [4.13.0](https://github.com/sanity-io/sanity/compare/v4.12.0...v4.13.0) (2025-11-03)

### Bug Fixes

* **deps:** catalog vitest, jsdom add overrides ([a54467e](https://github.com/sanity-io/sanity/commit/a54467e2e5a2b6cd0fceb46b37f3143577cb45bc)) by Bjørge Næss (bjoerge@gmail.com)

## [4.12.0](https://github.com/sanity-io/sanity/compare/v4.11.0...v4.12.0) (2025-10-28)

**Note:** Version bump only for package @sanity/schema

## [4.11.0](https://github.com/sanity-io/sanity/compare/v4.10.3...v4.11.0) (2025-10-21)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.20.0 ([#10852](https://github.com/sanity-io/sanity/issues/10852)) ([ae0f0c7](https://github.com/sanity-io/sanity/commit/ae0f0c78f89281b48f0dec0340ae55acf51c768b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.10.3](https://github.com/sanity-io/sanity/compare/v4.10.2...v4.10.3) (2025-10-14)

**Note:** Version bump only for package @sanity/schema

## [4.10.2](https://github.com/sanity-io/sanity/compare/v4.10.1...v4.10.2) (2025-09-30)

**Note:** Version bump only for package @sanity/schema

## [4.10.1](https://github.com/sanity-io/sanity/compare/v4.10.0...v4.10.1) (2025-09-25)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.19.0 ([#10751](https://github.com/sanity-io/sanity/issues/10751)) ([0e61cf3](https://github.com/sanity-io/sanity/commit/0e61cf345b61c49a2408c40210e60aa165ea8a97))

## [4.10.0](https://github.com/sanity-io/sanity/compare/v4.9.0...v4.10.0) (2025-09-23)

**Note:** Version bump only for package @sanity/schema

## [4.9.0](https://github.com/sanity-io/sanity/compare/v4.8.1...v4.9.0) (2025-09-16)

**Note:** Version bump only for package @sanity/schema

## [4.8.1](https://github.com/sanity-io/sanity/compare/v4.8.0...v4.8.1) (2025-09-10)

**Note:** Version bump only for package @sanity/schema

## [4.8.0](https://github.com/sanity-io/sanity/compare/v4.7.0...v4.8.0) (2025-09-10)

**Note:** Version bump only for package @sanity/schema

## [4.7.0](https://github.com/sanity-io/sanity/compare/v4.6.1...v4.7.0) (2025-09-09)

### Features

* **descriptors:** handle validations ([#10457](https://github.com/sanity-io/sanity/issues/10457)) ([bb7e750](https://github.com/sanity-io/sanity/commit/bb7e750f3600592e8e8b7928a5b64efef0dd32d0))
* **descriptors:** serialize i18n properties ([#10540](https://github.com/sanity-io/sanity/issues/10540)) ([d71f9d3](https://github.com/sanity-io/sanity/commit/d71f9d349f0ab42d61aee1a2a82a99dfe75ed1fe))
* **descriptors:** serialize orderings properties ([#10550](https://github.com/sanity-io/sanity/issues/10550)) ([e6442a9](https://github.com/sanity-io/sanity/commit/e6442a96f06d3c156c314d81639d7192bc0c4c65))

### Bug Fixes

* **deps:** update dependency groq-js to ^1.18.0 ([#10576](https://github.com/sanity-io/sanity/issues/10576)) ([176527f](https://github.com/sanity-io/sanity/commit/176527ff1aa281cb7a890e9abe00185a60263f2a))

## [4.6.1](https://github.com/sanity-io/sanity/compare/v4.6.0...v4.6.1) (2025-09-02)

**Note:** Version bump only for package @sanity/schema

## [4.6.0](https://github.com/sanity-io/sanity/compare/v4.5.0...v4.6.0) (2025-08-26)

**Note:** Version bump only for package @sanity/schema

## [4.5.0](https://github.com/sanity-io/sanity/compare/v4.4.1...v4.5.0) (2025-08-19)

### Bug Fixes

* **schema:** mark image data as required, for typegen ([#10285](https://github.com/sanity-io/sanity/issues/10285)) ([af2ce7b](https://github.com/sanity-io/sanity/commit/af2ce7be07dd3d5795ca8a5c66422295b41c8712))

## [4.4.1](https://github.com/sanity-io/sanity/compare/v4.4.0...v4.4.1) (2025-08-14)

**Note:** Version bump only for package @sanity/schema

## [4.4.0](https://github.com/sanity-io/sanity/compare/v4.3.0...v4.4.0) (2025-08-13)

**Note:** Version bump only for package @sanity/schema

## [4.3.0](https://github.com/sanity-io/sanity/compare/v4.2.0...v4.3.0) (2025-08-05)

### Features

* **core:** allow all fields group customizations ([#10094](https://github.com/sanity-io/sanity/issues/10094)) ([f3237e1](https://github.com/sanity-io/sanity/commit/f3237e1203bdab30b3ee86c8ce2ea29f216100de))

### Bug Fixes

* upgrade react-is to 19 ([#10141](https://github.com/sanity-io/sanity/issues/10141)) ([d7acd6c](https://github.com/sanity-io/sanity/commit/d7acd6cf5476a08b32d0350acff6f832dabca7af))

## [4.2.0](https://github.com/sanity-io/sanity/compare/v4.1.1...v4.2.0) (2025-07-29)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.17.3 ([#10069](https://github.com/sanity-io/sanity/issues/10069)) ([d74c4fb](https://github.com/sanity-io/sanity/commit/d74c4fb87eeae2bd18cd99a5df725c8469b8f8e7))
* **schema:** preserve object for inline types ([#10030](https://github.com/sanity-io/sanity/issues/10030)) ([ba73ac0](https://github.com/sanity-io/sanity/commit/ba73ac09cbb203fd502e7ef779319978ac5a5af8))

## [4.1.1](https://github.com/sanity-io/sanity/compare/v4.1.0...v4.1.1) (2025-07-22)

**Note:** Version bump only for package @sanity/schema

## [4.1.0](https://github.com/sanity-io/sanity/compare/v4.0.1...v4.1.0) (2025-07-21)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.17.2 ([#10020](https://github.com/sanity-io/sanity/issues/10020)) ([1c2dcb0](https://github.com/sanity-io/sanity/commit/1c2dcb096a8874e72bbc35e4a9fb7e1de7526eb0))

## [4.0.1](https://github.com/sanity-io/sanity/compare/v4.0.0...v4.0.1) (2025-07-16)

**Note:** Version bump only for package @sanity/schema

## [4.0.0](https://github.com/sanity-io/sanity/compare/v3.99.0...v4.0.0) (2025-07-14)

**Note:** Version bump only for package @sanity/schema

## [3.99.0](https://github.com/sanity-io/sanity/compare/v3.98.1...v3.99.0) (2025-07-11)

### Features

* Media Library video integration ([#9909](https://github.com/sanity-io/sanity/issues/9909)) ([5342858](https://github.com/sanity-io/sanity/commit/534285836c3f1c7a5fe9772ed732731adc16992b))

## <small>3.98.1 (2025-07-09)</small>

**Note:** Version bump only for package @sanity/schema

## [3.98.0](https://github.com/sanity-io/sanity/compare/v3.97.1...v3.98.0) (2025-07-07)

### Features

* synchronize schema to the server ([#9622](https://github.com/sanity-io/sanity/issues/9622)) ([2d6d901](https://github.com/sanity-io/sanity/commit/2d6d9014029b30616fb82da9b992dbc6c7f87e65)) by Magnus Holm (judofyr@gmail.com)

## [3.97.1](https://github.com/sanity-io/sanity/compare/v3.97.0...v3.97.1) (2025-07-04)

**Note:** Version bump only for package @sanity/schema

## [3.97.0](https://github.com/sanity-io/sanity/compare/v3.96.0...v3.97.0) (2025-07-04)

**Note:** Version bump only for package @sanity/schema

## [3.96.0](https://github.com/sanity-io/sanity/compare/v3.95.0...v3.96.0) (2025-07-02)

**Note:** Version bump only for package @sanity/schema

## [3.95.0](https://github.com/sanity-io/sanity/compare/v3.94.2...v3.95.0) (2025-06-25)

**Note:** Version bump only for package @sanity/schema

## [3.94.2](https://github.com/sanity-io/sanity/compare/v3.94.1...v3.94.2) (2025-06-24)

**Note:** Version bump only for package @sanity/schema

## [3.94.1](https://github.com/sanity-io/sanity/compare/v3.94.0...v3.94.1) (2025-06-24)

**Note:** Version bump only for package @sanity/schema

## [3.94.0](https://github.com/sanity-io/sanity/compare/v3.93.0...v3.94.0) (2025-06-24)

### Bug Fixes

* **deps:** update dependency @sanity/icons to ^3.7.3 ([#9737](https://github.com/sanity-io/sanity/issues/9737)) ([198ab74](https://github.com/sanity-io/sanity/commit/198ab74452aab8569bc1a1f7924471732347bd55)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/icons to ^3.7.4 ([#9756](https://github.com/sanity-io/sanity/issues/9756)) ([ac74b4d](https://github.com/sanity-io/sanity/commit/ac74b4dd0c776b84582f728126469dd4a679d3e5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.17.1 ([#9766](https://github.com/sanity-io/sanity/issues/9766)) ([f915231](https://github.com/sanity-io/sanity/commit/f915231339443a233f4ff981dc7632dc8a0106aa)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* stop publishing src folders to npm ([#9744](https://github.com/sanity-io/sanity/issues/9744)) ([e9296c1](https://github.com/sanity-io/sanity/commit/e9296c12d1c68ea912a309a6bfe6cb752172ba07)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [3.93.0](https://github.com/sanity-io/sanity/compare/v3.92.0...v3.93.0) (2025-06-17)

### Features

* **schema:** serialize schema in debug mode ([#9503](https://github.com/sanity-io/sanity/issues/9503)) ([d9d9d67](https://github.com/sanity-io/sanity/commit/d9d9d673919dcdb95acc78fd117d36c4382d6b6f)) by Magnus Holm (judofyr@gmail.com)

### Bug Fixes

* manifest extract now correctly serializes global document references ([#9604](https://github.com/sanity-io/sanity/issues/9604)) ([5b15f40](https://github.com/sanity-io/sanity/commit/5b15f40a543d9285925ad5ca33c5922ebb060121)) by Snorre Eskeland Brekke (snorre.e.brekke@gmail.com)

## [3.92.0](https://github.com/sanity-io/sanity/compare/v3.91.0...v3.92.0) (2025-06-10)

**Note:** Version bump only for package @sanity/schema

## [3.91.0](https://github.com/sanity-io/sanity/compare/v3.90.0...v3.91.0) (2025-06-03)

### Bug Fixes

* **deps:** update dependency groq-js to ^1.17.0 ([#9507](https://github.com/sanity-io/sanity/issues/9507)) ([ceb86ec](https://github.com/sanity-io/sanity/commit/ceb86ecd0d98f5028f81d2909a92c94ad15e89c5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

### Reverts

* publish v3.91.0 ([#9546](https://github.com/sanity-io/sanity/issues/9546)) ([#9550](https://github.com/sanity-io/sanity/issues/9550)) ([d191e4c](https://github.com/sanity-io/sanity/commit/d191e4cdbccc68cda01f864c0290528df91d9571)) by Bjørge Næss (bjoerge@gmail.com)

# Changelog

## [3.86.1](https://github.com/sanity-io/sanity/compare/v3.86.0...v3.86.1) (2025-04-23)

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @sanity/types bumped to 3.86.1

## [3.86.0](https://github.com/sanity-io/sanity/compare/schema-v3.85.1...schema-v3.86.0) (2025-04-22)

### Miscellaneous Chores

* **schema:** Synchronize studio versions

### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @sanity/types bumped to 3.86.0
