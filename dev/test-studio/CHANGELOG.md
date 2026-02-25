# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.12.0](https://github.com/sanity-io/sanity/compare/v5.11.0...v5.12.0) (2026-02-24)

### Bug Fixes

* **deps:** Update portabletext ([#12210](https://github.com/sanity-io/sanity/issues/12210)) ([d7294b9](https://github.com/sanity-io/sanity/commit/d7294b9a1e3d51f37a4e7bd8a1121863ae81a13a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.11.0](https://github.com/sanity-io/sanity/compare/v5.10.0...v5.11.0) (2026-02-19)

### Features

* conditional multi schema references ([#12066](https://github.com/sanity-io/sanity/issues/12066)) ([7e7ea6d](https://github.com/sanity-io/sanity/commit/7e7ea6d9520e9841ab2dd96e7d2cfe433b71ae5e)) by Jordan Lawrence (jordanl17@me.com)
* **test-studio:** add demonstration of stega overlays failing to expand group inside object array member ([f2bbdf0](https://github.com/sanity-io/sanity/commit/f2bbdf038074d5ee5d612f616f43a8d39a7a9e6e)) by Ash (ash@sanity.io)

### Bug Fixes

* add content to the breadcrumb instead of 'mark definitions' ([#12175](https://github.com/sanity-io/sanity/issues/12175)) ([85ccfb4](https://github.com/sanity-io/sanity/commit/85ccfb4108c6251e698aad644c4560bc62d76e57)) by RitaDias (rita@sanity.io)
* **deps:** Update portabletext ([#12199](https://github.com/sanity-io/sanity/issues/12199)) ([d504974](https://github.com/sanity-io/sanity/commit/d5049742aea7ea4c313dbf1e28e9fe4a63a2b911)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.10.0](https://github.com/sanity-io/sanity/compare/v5.9.0...v5.10.0) (2026-02-17)

### Bug Fixes

* **deps:** Update portabletext to v5 (major) ([#12162](https://github.com/sanity-io/sanity/issues/12162)) ([5b9ba17](https://github.com/sanity-io/sanity/commit/5b9ba176818c4ec42ac21de306b2e4e0f011d22a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v6 (major) ([#12164](https://github.com/sanity-io/sanity/issues/12164)) ([225b965](https://github.com/sanity-io/sanity/commit/225b965bfd2535a5d7cedc73269cb3beca3fc6b4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.9.0](https://github.com/sanity-io/sanity/compare/v5.8.1...v5.9.0) (2026-02-10)

### Features

* add hidden to validation context ([#12050](https://github.com/sanity-io/sanity/issues/12050)) ([26b665b](https://github.com/sanity-io/sanity/commit/26b665b540269d63a446bcfa361db5ddf0d561df)) by RitaDias (rita@sanity.io)
* **structure:** add `defaultPanes` option to documents ([#12039](https://github.com/sanity-io/sanity/issues/12039)) ([c670cbb](https://github.com/sanity-io/sanity/commit/c670cbb372650768da6bc7324464f3af01e08e15)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* add warning for schema validation when an array contains multiple primitive types that resolve to same json type ([#12095](https://github.com/sanity-io/sanity/issues/12095)) ([31155be](https://github.com/sanity-io/sanity/commit/31155be6dbf86faeb41b77cea27cf9c765961234)) by RitaDias (rita@sanity.io)
* **deps:** Update portabletext ([#12115](https://github.com/sanity-io/sanity/issues/12115)) ([757aa34](https://github.com/sanity-io/sanity/commit/757aa3418d9c10b187d969b55308a44f1d17a454)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12122](https://github.com/sanity-io/sanity/issues/12122)) ([4a36591](https://github.com/sanity-io/sanity/commit/4a36591b187d554148ea811abcd141f150640808)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **structure:** stale publish actions ([#12132](https://github.com/sanity-io/sanity/issues/12132)) ([b3b2818](https://github.com/sanity-io/sanity/commit/b3b28182100f0cd32787425fc07618460fbb5bfb)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Reverts

* rollback v5.9.0 version bump ([#12139](https://github.com/sanity-io/sanity/issues/12139)) ([4195d26](https://github.com/sanity-io/sanity/commit/4195d269f400347fb16765400842f765eb1625ec)) by Bjørge Næss (bjoerge@gmail.com)

## [5.8.1](https://github.com/sanity-io/sanity/compare/v5.8.0...v5.8.1) (2026-02-05)

### Bug Fixes

* **sanity:** prevent input element ids from adding unsafe global variables ([#12085](https://github.com/sanity-io/sanity/issues/12085)) ([7a4041c](https://github.com/sanity-io/sanity/commit/7a4041cd60808623ce13111699997ec9c0351e58)) by Bjørge Næss (bjoerge@gmail.com)

## [5.8.0](https://github.com/sanity-io/sanity/compare/v5.7.0...v5.8.0) (2026-02-03)

### Features

* add selection state (indicators) to all menu items (actions etc.) ([#12003](https://github.com/sanity-io/sanity/issues/12003)) ([81ede79](https://github.com/sanity-io/sanity/commit/81ede798df314f160156da46e514f2e4e60e8c32)) by RitaDias (rita@sanity.io)
* built-in PTE `pasteLink` plugin enabled by default ([72a53b7](https://github.com/sanity-io/sanity/commit/72a53b72be1b92feeb733adbe366d7c6d9285334)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **core:** add media library internal config ([#12009](https://github.com/sanity-io/sanity/issues/12009)) ([394e246](https://github.com/sanity-io/sanity/commit/394e2468154625a84914e66bf453a209f607fcd4)) by James Warner (jmswrnr@users.noreply.github.com)
* **core:** adds `path` to `ConditionalPropertyCallbackContext` ([#11947](https://github.com/sanity-io/sanity/issues/11947)) ([f16a4aa](https://github.com/sanity-io/sanity/commit/f16a4aa9b83365119fc881a4e00eb16e5b2c9f66)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** display validation icon for groups ([#11995](https://github.com/sanity-io/sanity/issues/11995)) ([7916f6e](https://github.com/sanity-io/sanity/commit/7916f6efbee5c4107b1c0d02a9281037108779e3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* display incoming references  ([#10761](https://github.com/sanity-io/sanity/issues/10761)) ([e5a945b](https://github.com/sanity-io/sanity/commit/e5a945bab4444077ef6e71a4b98b59f7250e6a02)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **form:** add disableNew option for image fields ([#12004](https://github.com/sanity-io/sanity/issues/12004)) ([0e650d3](https://github.com/sanity-io/sanity/commit/0e650d31b55d4a61bb02511626667b28f7497e47)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* **deps:** Update portabletext ([#11994](https://github.com/sanity-io/sanity/issues/11994)) ([6aaca20](https://github.com/sanity-io/sanity/commit/6aaca20134277be6d497ce99d41b428c23a655bf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12032](https://github.com/sanity-io/sanity/issues/12032)) ([0a871ec](https://github.com/sanity-io/sanity/commit/0a871eccac41eecbd4e09a6e099e89622f052cab)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.7.0](https://github.com/sanity-io/sanity/compare/v5.6.0...v5.7.0) (2026-01-27)

### Bug Fixes

* **core:** support copy pasting anonymous objects ([#11961](https://github.com/sanity-io/sanity/issues/11961)) ([9d76742](https://github.com/sanity-io/sanity/commit/9d76742237e55595e6f40b00f160d79589ab07ae)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** Update portabletext ([#11955](https://github.com/sanity-io/sanity/issues/11955)) ([70d4df1](https://github.com/sanity-io/sanity/commit/70d4df195e7f2e719e99147c6f9fef9697465881)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11960](https://github.com/sanity-io/sanity/issues/11960)) ([a85174d](https://github.com/sanity-io/sanity/commit/a85174dcdcd3c275fd15e956ad1ebe9f0c236675)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11973](https://github.com/sanity-io/sanity/issues/11973)) ([96a4200](https://github.com/sanity-io/sanity/commit/96a420065fc18d70e4b17a5b0eb150007554cbce)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **structure:** validation inspector displays path titles for anonymous objects ([#11968](https://github.com/sanity-io/sanity/issues/11968)) ([1af0e35](https://github.com/sanity-io/sanity/commit/1af0e35075376ec57432ce470a10e3a22b6622aa)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

## [5.6.0](https://github.com/sanity-io/sanity/compare/v5.5.0...v5.6.0) (2026-01-22)

### Features

* **core:** add `renderMembers` function to objects and fieldsets ([#11205](https://github.com/sanity-io/sanity/issues/11205)) ([452d356](https://github.com/sanity-io/sanity/commit/452d3560c978ac8566848bbc2ce09a5c2cb0e383)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **schema:** export DEFAULT_ANNOTATIONS and DEFAULT_DECORATORS ([#11916](https://github.com/sanity-io/sanity/issues/11916)) ([55cdb56](https://github.com/sanity-io/sanity/commit/55cdb56d5f55a6c21a38bd44ec45e69637bbffc6)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* allow custom object types as portable text annotations ([#11893](https://github.com/sanity-io/sanity/issues/11893)) ([968005f](https://github.com/sanity-io/sanity/commit/968005f6f1fad512269c3b18787a9e0f25d76ea7)) by RitaDias (rita@sanity.io)
* **core:** allows setting timezone to dates arrays ([#11866](https://github.com/sanity-io/sanity/issues/11866)) ([85bd87b](https://github.com/sanity-io/sanity/commit/85bd87b36f68b125a5fd6cbe1181f257318a4af8)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** deprecated label and validation icons overlap ([#11887](https://github.com/sanity-io/sanity/issues/11887)) ([b172d83](https://github.com/sanity-io/sanity/commit/b172d832c7dc01f2fa94a2dd60696ff0b98a9abb)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** show timezone button when `allowTimeZoneSwitch` is true ([#11861](https://github.com/sanity-io/sanity/issues/11861)) ([25ee194](https://github.com/sanity-io/sanity/commit/25ee19461bb5c43ce9970ac5d34cd197ceb7e259)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** Update portabletext ([#11868](https://github.com/sanity-io/sanity/issues/11868)) ([c95b22a](https://github.com/sanity-io/sanity/commit/c95b22a25b97b8e28af8caa378113873dae92042)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11912](https://github.com/sanity-io/sanity/issues/11912)) ([9c14402](https://github.com/sanity-io/sanity/commit/9c14402a54b45d51cfe016654a3f67d2adb9440a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.5.0](https://github.com/sanity-io/sanity/compare/v5.4.0...v5.5.0) (2026-01-19)

**Note:** Version bump only for package sanity-test-studio

## [5.4.0](https://github.com/sanity-io/sanity/compare/v5.3.1...v5.4.0) (2026-01-15)

### Bug Fixes

* **core:** dont crash when image url string is passed to preview ([#6727](https://github.com/sanity-io/sanity/issues/6727)) ([98f37b8](https://github.com/sanity-io/sanity/commit/98f37b8b6656757d8babdb6fe0368c477cd33ba5)) by Fred Carlsen (fred@sjelfull.no)
* **deps:** Update dev-non-major ([#11837](https://github.com/sanity-io/sanity/issues/11837)) ([6444584](https://github.com/sanity-io/sanity/commit/64445845eb189a8989e77b9110bbde3817e635db)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.3.1](https://github.com/sanity-io/sanity/compare/v5.3.0...v5.3.1) (2026-01-14)

**Note:** Version bump only for package sanity-test-studio

## [5.3.0](https://github.com/sanity-io/sanity/compare/v5.2.0...v5.3.0) (2026-01-13)

### Features

* make enhancedObjectDialog opt out ([#11802](https://github.com/sanity-io/sanity/issues/11802)) ([66ca5b8](https://github.com/sanity-io/sanity/commit/66ca5b8ef6ba0959a605665e553e28b6db0dafa8)) by RitaDias (rita@sanity.io)

### Bug Fixes

* **deps:** Update portabletext ([#11740](https://github.com/sanity-io/sanity/issues/11740)) ([62a63ce](https://github.com/sanity-io/sanity/commit/62a63ce9a2dcfcc88d899506bb4532b92e7d3c42)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11797](https://github.com/sanity-io/sanity/issues/11797)) ([7b25305](https://github.com/sanity-io/sanity/commit/7b25305a78cd93a4bbe1c2cecbcfad5161492349)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.2.0](https://github.com/sanity-io/sanity/compare/v5.1.0...v5.2.0) (2026-01-07)

### Bug Fixes

* **codegen,cli:** handle CSS imports when require(esm) happens ([#11701](https://github.com/sanity-io/sanity/issues/11701)) ([8be4aa6](https://github.com/sanity-io/sanity/commit/8be4aa6b54f91e8c012782cf969fdb55c9a0c473)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11641](https://github.com/sanity-io/sanity/issues/11641)) ([6f25f33](https://github.com/sanity-io/sanity/commit/6f25f33cfe282c00d5212435da58ebb78722fe27)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11673](https://github.com/sanity-io/sanity/issues/11673)) ([54c30a6](https://github.com/sanity-io/sanity/commit/54c30a65e5c9867753dc236e6f95bb7fd46c249c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11646](https://github.com/sanity-io/sanity/issues/11646)) ([795e94b](https://github.com/sanity-io/sanity/commit/795e94bb6f0e3dd13d6da4c6c71a214aa6b4f441)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11681](https://github.com/sanity-io/sanity/issues/11681)) ([72daebe](https://github.com/sanity-io/sanity/commit/72daebe63517d22764f68504d4cc2ec3830bafbf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* temporary pin `@sanity/migrate` to `5.1.0` ([#11656](https://github.com/sanity-io/sanity/issues/11656)) ([296c398](https://github.com/sanity-io/sanity/commit/296c398a3e135feeab60a4d764674ca95f3e6f52)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [5.1.0](https://github.com/sanity-io/sanity/compare/v5.0.1...v5.1.0) (2025-12-22)

**Note:** Version bump only for package sanity-test-studio

## [5.0.1](https://github.com/sanity-io/sanity/compare/v5.0.0...v5.0.1) (2025-12-17)

### Bug Fixes

* **deps:** update dependency @portabletext/editor to v4 ([#11532](https://github.com/sanity-io/sanity/issues/11532)) ([36ff000](https://github.com/sanity-io/sanity/commit/36ff000eb5532b8b33421328c64fb68748d23c83)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to v4 ([#11560](https://github.com/sanity-io/sanity/issues/11560)) ([f86089d](https://github.com/sanity-io/sanity/commit/f86089d40e6761ce3eb7a2e3c72ad537b9e50f8d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11574](https://github.com/sanity-io/sanity/issues/11574)) ([1d0f1cb](https://github.com/sanity-io/sanity/commit/1d0f1cb5e23f5ea7749a2b7ffdb050b636847554)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11531](https://github.com/sanity-io/sanity/issues/11531)) ([9acea25](https://github.com/sanity-io/sanity/commit/9acea25826b80a3886b7ee6abc7541bde7d4cea3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11570](https://github.com/sanity-io/sanity/issues/11570)) ([c798574](https://github.com/sanity-io/sanity/commit/c798574f2bea921f5c562c2c981e99cc4e542a7f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v5 (major) ([#11537](https://github.com/sanity-io/sanity/issues/11537)) ([33f7115](https://github.com/sanity-io/sanity/commit/33f71158a67aa4b42f3163cf4615b379c3206130)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [5.0.0](https://github.com/sanity-io/sanity/compare/v4.22.0...v5.0.0) (2025-12-16)

### Features

* **core:** enable typographic behaviors in Portable Text Inputs by default ([eaffcde](https://github.com/sanity-io/sanity/commit/eaffcdec863fa70f1006bef62c2c3cbb86517171)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)

## [4.22.0](https://github.com/sanity-io/sanity/compare/v4.21.1...v4.22.0) (2025-12-16)

### Features

* **structure:** support linking to documents in focus mode ([#11489](https://github.com/sanity-io/sanity/issues/11489)) ([cb74919](https://github.com/sanity-io/sanity/commit/cb74919e6dc18d828ffd3715791c71f9d08619b7)) by Bjørge Næss (bjoerge@gmail.com)

### Bug Fixes

* **deps:** Update dev-non-major ([#11494](https://github.com/sanity-io/sanity/issues/11494)) ([2973d7d](https://github.com/sanity-io/sanity/commit/2973d7dc4fbab38dba7512e020a6d1d96f3f671a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11450](https://github.com/sanity-io/sanity/issues/11450)) ([735f7b4](https://github.com/sanity-io/sanity/commit/735f7b4d1c92d243abce393464197f058278b25d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11518](https://github.com/sanity-io/sanity/issues/11518)) ([f2adcc3](https://github.com/sanity-io/sanity/commit/f2adcc39c4c0c003ae823e7b6da24cee45d35d48)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* fix when deleting and reverting objects of arrays in the middle of an array ([#11455](https://github.com/sanity-io/sanity/issues/11455)) ([684cc41](https://github.com/sanity-io/sanity/commit/684cc4121507e30bdd2f8b520d1b1905aeaba139)) by RitaDias (rita@sanity.io)

## [4.21.1](https://github.com/sanity-io/sanity/compare/v4.21.0...v4.21.1) (2025-12-11)

### Bug Fixes

* **deps:** update dependency @portabletext/react to v6 ([#11440](https://github.com/sanity-io/sanity/issues/11440)) ([953b513](https://github.com/sanity-io/sanity/commit/953b513b798b1e68d9d3813839a0dbc68ea299e1)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11431](https://github.com/sanity-io/sanity/issues/11431)) ([ebfdc6e](https://github.com/sanity-io/sanity/commit/ebfdc6e1f5eb8e9bca1caa082bab32fb7745b301)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v5 (major) ([#11438](https://github.com/sanity-io/sanity/issues/11438)) ([dbc98f7](https://github.com/sanity-io/sanity/commit/dbc98f75a617381779975be26e14f07ad02d16cd)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.21.0](https://github.com/sanity-io/sanity/compare/v4.20.3...v4.21.0) (2025-12-09)

### Bug Fixes

* allow for more flexibility for custom components? and using the enhanced object dialog ([#11358](https://github.com/sanity-io/sanity/issues/11358)) ([9ea5074](https://github.com/sanity-io/sanity/commit/9ea507489ffcd925ec5a8d1802629b6f9ad1f4aa)) by RitaDias (rita@sanity.io)
* **deps:** Update portabletext ([#11388](https://github.com/sanity-io/sanity/issues/11388)) ([5f63f2f](https://github.com/sanity-io/sanity/commit/5f63f2f0964cb1f6d8c2708e12ba6d8106682743)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11407](https://github.com/sanity-io/sanity/issues/11407)) ([a9b92c9](https://github.com/sanity-io/sanity/commit/a9b92c93b0f663040f317bcda78b0c21e5d3fc25)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.20.3](https://github.com/sanity-io/sanity/compare/v4.20.2...v4.20.3) (2025-12-04)

**Note:** Version bump only for package sanity-test-studio

## [4.20.2](https://github.com/sanity-io/sanity/compare/v4.20.1...v4.20.2) (2025-12-04)

**Note:** Version bump only for package sanity-test-studio

## [4.20.1](https://github.com/sanity-io/sanity/compare/v4.20.0...v4.20.1) (2025-12-03)

**Note:** Version bump only for package sanity-test-studio

## [4.20.0](https://github.com/sanity-io/sanity/compare/v4.19.0...v4.20.0) (2025-12-02)

### Features

* **schema:** de-dupe re-used fields in the descriptor ([b287558](https://github.com/sanity-io/sanity/commit/b287558417c6f06eaaf7acf1a4f51dc6aab0c3f6)) by Magnus Holm (judofyr@gmail.com)

### Bug Fixes

* **core:** pte inline comments respect __internal_comments disabled ([#11341](https://github.com/sanity-io/sanity/issues/11341)) ([0f566b5](https://github.com/sanity-io/sanity/commit/0f566b5c99891052b661791d0d48f8e4c7118b98)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** Update portabletext ([#11270](https://github.com/sanity-io/sanity/issues/11270)) ([bf4bf3b](https://github.com/sanity-io/sanity/commit/bf4bf3b130a3a2922a23708b7684e94c4b5bd110)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11329](https://github.com/sanity-io/sanity/issues/11329)) ([ab15495](https://github.com/sanity-io/sanity/commit/ab154959c7b632f7fab54b8dfcaa9a08100ec411)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11338](https://github.com/sanity-io/sanity/issues/11338)) ([7ee38ba](https://github.com/sanity-io/sanity/commit/7ee38ba2b5a6c1b1028eb7cd9f80a6821cb95c4a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **media-library:** support groups and fieldset in `defineVideoField` ([#11361](https://github.com/sanity-io/sanity/issues/11361)) ([3c840ce](https://github.com/sanity-io/sanity/commit/3c840ce0c20b83f5b7115b76382083286b570a9e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **sanity:** allow editing documents in non-release bundles ([#11312](https://github.com/sanity-io/sanity/issues/11312)) ([dfa9dc1](https://github.com/sanity-io/sanity/commit/dfa9dc1f70fbe01699f3186eb93e4671d228b329)) by Bjørge Næss (bjoerge@gmail.com)

## [4.19.0](https://github.com/sanity-io/sanity/compare/v4.18.0...v4.19.0) (2025-11-25)

### Bug Fixes

* **deps:** update dependency @sanity/preview-url-secret to ^2.1.16 ([#11211](https://github.com/sanity-io/sanity/issues/11211)) ([2cab14a](https://github.com/sanity-io/sanity/commit/2cab14a7ededaee445b470b1ee155f29e95a9c4e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to v3 ([#11234](https://github.com/sanity-io/sanity/issues/11234)) ([67f4ffb](https://github.com/sanity-io/sanity/commit/67f4ffb31f8f54318cde955b7d5520a6d056a233)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** Update portabletext ([#11217](https://github.com/sanity-io/sanity/issues/11217)) ([86feb1f](https://github.com/sanity-io/sanity/commit/86feb1f6db5cea4f6d52b5aee85b931ca11e1191)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.18.0](https://github.com/sanity-io/sanity/compare/v4.17.0...v4.18.0) (2025-11-21)

### Bug Fixes

* **core:** flush pending Portable Text Input changes on unmount ([7de417d](https://github.com/sanity-io/sanity/commit/7de417db8a87ce16d62741b3ab6d1e200a3475fb)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **sanity:** switch enhanced object dialog off by default ([#11201](https://github.com/sanity-io/sanity/issues/11201)) ([#11227](https://github.com/sanity-io/sanity/issues/11227)) ([4e8100e](https://github.com/sanity-io/sanity/commit/4e8100e46e200846957ae5d91005d59ddd7a5581)) by Ash (ash@sanity.io)

## [4.17.0](https://github.com/sanity-io/sanity/compare/v4.16.0...v4.17.0) (2025-11-20)

### Features

* **sanity:** make enhanced object dialog opt out ([#11201](https://github.com/sanity-io/sanity/issues/11201)) ([966f4b4](https://github.com/sanity-io/sanity/commit/966f4b4f062b24e1705ebdc076843b12fbda50d7)) by RitaDias (rita@sanity.io)
* **structure:** add ability to maximise a document  ([#11200](https://github.com/sanity-io/sanity/issues/11200)) ([0d39bed](https://github.com/sanity-io/sanity/commit/0d39bedbcdab1d880eab6c6f881273c56a178b24)) by RitaDias (rita@sanity.io)

### Bug Fixes

* **actions:** `onComplete` considered harmful, use local state instead ([#11199](https://github.com/sanity-io/sanity/issues/11199)) ([461f54d](https://github.com/sanity-io/sanity/commit/461f54d62f50ee96cc959ea97c023dbbda9d048e)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **perf:** render document actions once instead of 3x ([#11167](https://github.com/sanity-io/sanity/issues/11167)) ([41c28d2](https://github.com/sanity-io/sanity/commit/41c28d278f0c69d0616472e73923b90f8f1ede35)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* removing unnecessary release and scheduled publishing banner ([#11195](https://github.com/sanity-io/sanity/issues/11195)) ([fda448a](https://github.com/sanity-io/sanity/commit/fda448a6e8c214add1d5e0309e76bb4e8d75fcb7)) by Jordan Lawrence (jordanl17@me.com)

## [4.16.0](https://github.com/sanity-io/sanity/compare/v4.15.0...v4.16.0) (2025-11-18)

### Features

* **core:** add configurable `typography` plugin to PTE inputs ([f6e394d](https://github.com/sanity-io/sanity/commit/f6e394d21f790e135af309dd9cb5cb8ce9954a71)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **form:** pass perspective stack to custom reference filters, apply returned perspective ([#11127](https://github.com/sanity-io/sanity/issues/11127)) ([22123ed](https://github.com/sanity-io/sanity/commit/22123ed113c484d9449b7b05d20c9a4f1abbe8ae)) by Bjørge Næss (bjoerge@gmail.com)
* make enhancedObjectDialog opt out ([#11094](https://github.com/sanity-io/sanity/issues/11094)) ([f58536e](https://github.com/sanity-io/sanity/commit/f58536e844516005c4a63fdea7edc49558f955eb)) by RitaDias (rita@sanity.io)
* **structure:** add ability to maximise a document ([#10997](https://github.com/sanity-io/sanity/issues/10997)) ([3720d9b](https://github.com/sanity-io/sanity/commit/3720d9b1be0c4a297c8e14de5d6588136d405adb)) by RitaDias (rita@sanity.io)

### Bug Fixes

* bug where changing the time manually in an input when the timezone was selected would change the time based on the computer timezone ([#11161](https://github.com/sanity-io/sanity/issues/11161)) ([28ba0ae](https://github.com/sanity-io/sanity/commit/28ba0ae8d9f178f91fa5f5a44df808e8ab5ded0c)) by RitaDias (rita@sanity.io)
* **core:** disable `typography` PTE plugin by default ([f7660dd](https://github.com/sanity-io/sanity/commit/f7660dd7b11bb5142173aff297b26a01462507ef)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **deps:** update dependency @portabletext/block-tools to ^4.0.2 ([#11055](https://github.com/sanity-io/sanity/issues/11055)) ([0cb63b4](https://github.com/sanity-io/sanity/commit/0cb63b46442457cc6ab7b73f90f9bc12b8318499)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v3 (major) ([#11156](https://github.com/sanity-io/sanity/issues/11156)) ([3448d67](https://github.com/sanity-io/sanity/commit/3448d6747dcd769c7213b24e2d92f2d48436155b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v4 (major) ([#11157](https://github.com/sanity-io/sanity/issues/11157)) ([697beee](https://github.com/sanity-io/sanity/commit/697beeea25123b33efdefba7767a008650a532cb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** upgrade react compiler to v1 ([#10834](https://github.com/sanity-io/sanity/issues/10834)) ([2573cb1](https://github.com/sanity-io/sanity/commit/2573cb15c224c762636500b339d0c2701aad1e68)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* issues where component.items weren't opening the enhanced object dialog ([#11152](https://github.com/sanity-io/sanity/issues/11152)) ([7627bfa](https://github.com/sanity-io/sanity/commit/7627bfa20f67efcf2abe81c4b51220d56acf442f)) by RitaDias (rita@sanity.io)
* **sanity:** revert switch on enhanced object dialog by default ([#11094](https://github.com/sanity-io/sanity/issues/11094)) ([#11191](https://github.com/sanity-io/sanity/issues/11191)) ([dbb28d7](https://github.com/sanity-io/sanity/commit/dbb28d7ca421b63e18b1a4b61c96b2ec7f2d9596)) by Ash (ash@sanity.io)
* **structure:** revert add ability to maximise a document ([#10997](https://github.com/sanity-io/sanity/issues/10997)) ([#11190](https://github.com/sanity-io/sanity/issues/11190)) ([abb4d4d](https://github.com/sanity-io/sanity/commit/abb4d4d05674a382b234c5e86750523edbe6d83c)) by Ash (ash@sanity.io)

## [4.15.0](https://github.com/sanity-io/sanity/compare/v4.14.2...v4.15.0) (2025-11-11)

### Bug Fixes

* enhancedObjectDialog where custom items are being used ([#11090](https://github.com/sanity-io/sanity/issues/11090)) ([f45045b](https://github.com/sanity-io/sanity/commit/f45045b68e0973043d70d46e4c0abe9d4b79126d)) by RitaDias (rita@sanity.io)
* issue where initialFullscreen ptes weren't being able to close ([#11106](https://github.com/sanity-io/sanity/issues/11106)) ([8207267](https://github.com/sanity-io/sanity/commit/8207267806715b9327c095f7134fa276ffa71404)) by RitaDias (rita@sanity.io)
* issue where reference inputs were behaving oddly with the dialog ([#11047](https://github.com/sanity-io/sanity/issues/11047)) ([c5db32e](https://github.com/sanity-io/sanity/commit/c5db32e982fd89716cd5aa14ef6c8750e28838c6)) by RitaDias (rita@sanity.io)

## [4.14.2](https://github.com/sanity-io/sanity/compare/v4.14.1...v4.14.2) (2025-11-07)

**Note:** Version bump only for package sanity-test-studio

## [4.14.1](https://github.com/sanity-io/sanity/compare/v4.14.0...v4.14.1) (2025-11-06)

### Bug Fixes

* **deps:** upgrade `@portabletext/*` deps ([#11068](https://github.com/sanity-io/sanity/issues/11068)) ([87b84eb](https://github.com/sanity-io/sanity/commit/87b84ebed96a4e01562fdc3c6c71982714d7f1cd)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [4.14.0](https://github.com/sanity-io/sanity/compare/v4.13.0...v4.14.0) (2025-11-06)

### Features

* **core:** adds `scheduledDrafts` config option (on by default) ([#11026](https://github.com/sanity-io/sanity/issues/11026)) ([bb05c55](https://github.com/sanity-io/sanity/commit/bb05c557c1f0861d9e29ab1c1516afbcdb4194f1)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** allow disabling the built-in PTE Markdown shortcuts plugin ([1b9a227](https://github.com/sanity-io/sanity/commit/1b9a227971a5a69a60f8171e0d22f783bc3c2e26)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)

### Bug Fixes

* **deps:** update dependency @portabletext/plugin-character-pair-decorator to ^2.0.1 ([#11039](https://github.com/sanity-io/sanity/issues/11039)) ([22ac6c9](https://github.com/sanity-io/sanity/commit/22ac6c93947a42fb085792333b205c9b76aaebcf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/react to v5 ([#11034](https://github.com/sanity-io/sanity/issues/11034)) ([486476a](https://github.com/sanity-io/sanity/commit/486476a321c18f3c83eb5cc6d7eeecfc94668a97)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.12.1 ([#11029](https://github.com/sanity-io/sanity/issues/11029)) ([df2aa67](https://github.com/sanity-io/sanity/commit/df2aa672f39c9a847e4102f1f0e18d240e1aa808)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#10981](https://github.com/sanity-io/sanity/issues/10981)) ([a27f27b](https://github.com/sanity-io/sanity/commit/a27f27b87c91fd860d13bc4f6246557e59f7724c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11031](https://github.com/sanity-io/sanity/issues/11031)) ([870a2f5](https://github.com/sanity-io/sanity/commit/870a2f5371f6c133dc64cda963e67259b8303de3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11045](https://github.com/sanity-io/sanity/issues/11045)) ([184152b](https://github.com/sanity-io/sanity/commit/184152bdcbaba5e0e81a6b5ec4eb2ec0b02c1bad)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v4 (major) ([#11027](https://github.com/sanity-io/sanity/issues/11027)) ([73dcb1d](https://github.com/sanity-io/sanity/commit/73dcb1d157492e9f7e9c9c8db0df3be10eb07997)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* replace deprecated `MarkdownPlugin` ([684c799](https://github.com/sanity-io/sanity/commit/684c799caa0f3f463ff14c72694a814108d682ab)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)

## [4.13.0](https://github.com/sanity-io/sanity/compare/v4.12.0...v4.13.0) (2025-11-03)

### Bug Fixes

* **deps:** Update portabletext ([#10977](https://github.com/sanity-io/sanity/issues/10977)) ([3fe929d](https://github.com/sanity-io/sanity/commit/3fe929d56356f3d58c2b0d1ad87f520e7bbcb7ea)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.12.0](https://github.com/sanity-io/sanity/compare/v4.11.0...v4.12.0) (2025-10-28)

### Features

* add config flag for nested object dialog (beta) ([#10912](https://github.com/sanity-io/sanity/issues/10912)) ([07a25d3](https://github.com/sanity-io/sanity/commit/07a25d3d1b79b926b2df2e5818f7878c6a36ade9)) by RitaDias (rita@sanity.io)
* add initial  approach to a nested objects navigation dialog ([#10759](https://github.com/sanity-io/sanity/issues/10759)) ([c1be253](https://github.com/sanity-io/sanity/commit/c1be2530095d24a0190903c39f3a407ba1e83111)) by RitaDias (rita@sanity.io)

### Bug Fixes

* **core:** use release limit instead of count for upsell dialog ([#10929](https://github.com/sanity-io/sanity/issues/10929)) ([14a614c](https://github.com/sanity-io/sanity/commit/14a614c49583d175c98dd74bd3d10b5b4714a1e3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^2.15.5 ([#10927](https://github.com/sanity-io/sanity/issues/10927)) ([d62524f](https://github.com/sanity-io/sanity/commit/d62524f3a3c2ed9c48d9103d37b43afd57cf36f4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#10902](https://github.com/sanity-io/sanity/issues/10902)) ([f829425](https://github.com/sanity-io/sanity/commit/f829425f5fa0ff5ec0e0b7b8e103322ab5f49bb9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **sanity:** add more detailed version info for deployed test-studios ([#10908](https://github.com/sanity-io/sanity/issues/10908)) ([b2c8975](https://github.com/sanity-io/sanity/commit/b2c8975b64ee9cda5927e6dfd1824df50aa946f2)) by Bjørge Næss (bjoerge@gmail.com)

## [4.11.0](https://github.com/sanity-io/sanity/compare/v4.10.3...v4.11.0) (2025-10-21)

### Features

* scheduled drafts uses `sanity.config` property proper to disable ([#10635](https://github.com/sanity-io/sanity/issues/10635)) ([50a2e6e](https://github.com/sanity-io/sanity/commit/50a2e6e695e352f6878782686049995a58bc40f3)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **deps:** Update portabletext ([#10851](https://github.com/sanity-io/sanity/issues/10851)) ([0562b47](https://github.com/sanity-io/sanity/commit/0562b472be4698fbf56be908c9218a03e59dfd8a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.10.3](https://github.com/sanity-io/sanity/compare/v4.10.2...v4.10.3) (2025-10-14)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.5.10 ([#10807](https://github.com/sanity-io/sanity/issues/10807)) ([3f5441b](https://github.com/sanity-io/sanity/commit/3f5441bc1d21f0c8b9b2d08877a193b2225d2cb0))
* **deps:** update dependency @portabletext/block-tools to ^3.5.9 ([#10794](https://github.com/sanity-io/sanity/issues/10794)) ([a16f5b9](https://github.com/sanity-io/sanity/commit/a16f5b98dc9ab1c193dc77ed3d0cb8dc8f9aaa84))
* **deps:** update dependency @portabletext/editor to ^2.13.4 ([#10795](https://github.com/sanity-io/sanity/issues/10795)) ([b89f08a](https://github.com/sanity-io/sanity/commit/b89f08a367e51ac020f7a2f3fb854cd1ced99fd3))
* **deps:** update dependency @portabletext/editor to ^2.13.7 ([#10801](https://github.com/sanity-io/sanity/issues/10801)) ([f976597](https://github.com/sanity-io/sanity/commit/f97659787dc5bfb0e0d8464768200805e3fbd00a))
* **deps:** update dependency @sanity/client to ^7.12.0 ([#10802](https://github.com/sanity-io/sanity/issues/10802)) ([391127a](https://github.com/sanity-io/sanity/commit/391127adf802b946deba689f64099cb4ee306e61))

## [4.10.2](https://github.com/sanity-io/sanity/compare/v4.10.1...v4.10.2) (2025-09-30)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.5.8 ([#10783](https://github.com/sanity-io/sanity/issues/10783)) ([13ef5e3](https://github.com/sanity-io/sanity/commit/13ef5e3771b87497d3e678f829cf572dd5dfb1ca))
* **deps:** update dependency @portabletext/editor to ^2.13.3 ([#10784](https://github.com/sanity-io/sanity/issues/10784)) ([b6c49ab](https://github.com/sanity-io/sanity/commit/b6c49ab7bc71b7631a9e2ce0dea2261a61adb691))

## [4.10.1](https://github.com/sanity-io/sanity/compare/v4.10.0...v4.10.1) (2025-09-25)

### Bug Fixes

* **deps:** update dependency @portabletext/editor to ^2.13.1 ([#10747](https://github.com/sanity-io/sanity/issues/10747)) ([5edcd32](https://github.com/sanity-io/sanity/commit/5edcd328ad3e8cfff1c2677b44c8ad2bfa298316))
* **deps:** update dependency @portabletext/editor to ^2.13.2 ([#10752](https://github.com/sanity-io/sanity/issues/10752)) ([962c5b0](https://github.com/sanity-io/sanity/commit/962c5b01037e488a4ef0e3c1620828b4fc406a98))

## [4.10.0](https://github.com/sanity-io/sanity/compare/v4.9.0...v4.10.0) (2025-09-23)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.5.6 ([#10662](https://github.com/sanity-io/sanity/issues/10662)) ([8168375](https://github.com/sanity-io/sanity/commit/816837593ede0ba4ef4bcd421de82e507c6806e8))
* **deps:** update dependency @portabletext/block-tools to ^3.5.7 ([#10722](https://github.com/sanity-io/sanity/issues/10722)) ([7eda14c](https://github.com/sanity-io/sanity/commit/7eda14cbce435ad5a9983fec566e4956502d732d))
* **deps:** update dependency @portabletext/editor to ^2.12.1 ([#10663](https://github.com/sanity-io/sanity/issues/10663)) ([6387c2a](https://github.com/sanity-io/sanity/commit/6387c2a9840b47f2652f9c229c8f9511453d9770))
* **deps:** update dependency @portabletext/editor to ^2.12.3 ([#10716](https://github.com/sanity-io/sanity/issues/10716)) ([97f5149](https://github.com/sanity-io/sanity/commit/97f5149309d0e78f2d972a84036cc3a739d7862c))
* **deps:** update dependency @portabletext/editor to ^2.13.0 ([#10736](https://github.com/sanity-io/sanity/issues/10736)) ([a964a24](https://github.com/sanity-io/sanity/commit/a964a2419f1fac50fdbfbde18440bc8c214612c8))
* **deps:** update dependency @sanity/client to ^7.11.2 ([#10667](https://github.com/sanity-io/sanity/issues/10667)) ([3d3ea0d](https://github.com/sanity-io/sanity/commit/3d3ea0df4bad43af82ae6b10f0c2ca6c7270bfeb))
* **deps:** update dependency @sanity/ui to ^3.1.3 ([#10673](https://github.com/sanity-io/sanity/issues/10673)) ([43d4d8e](https://github.com/sanity-io/sanity/commit/43d4d8e69cb78eaffca0e0c7bede1a84aab93b55))
* **deps:** update dependency @sanity/ui to ^3.1.4 ([#10691](https://github.com/sanity-io/sanity/issues/10691)) ([cbab31b](https://github.com/sanity-io/sanity/commit/cbab31b5d6c7ac8c36c8d2f044a0b336c1df7e61))
* **deps:** update dependency @sanity/ui to ^3.1.5 ([#10706](https://github.com/sanity-io/sanity/issues/10706)) ([1387e57](https://github.com/sanity-io/sanity/commit/1387e57333104649f3e9929864f34f7bf38c07b8))

## [4.9.0](https://github.com/sanity-io/sanity/compare/v4.8.1...v4.9.0) (2025-09-16)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.5.5 ([#10614](https://github.com/sanity-io/sanity/issues/10614)) ([7a64fdf](https://github.com/sanity-io/sanity/commit/7a64fdf0a1b61fbdba0ab2642278d2fdceb06b35))
* **deps:** update dependency @portabletext/editor to ^2.8.4 ([#10615](https://github.com/sanity-io/sanity/issues/10615)) ([9c51cc5](https://github.com/sanity-io/sanity/commit/9c51cc588261b5c89f8f1575cab59e4c287de6be))
* **deps:** update dependency @portabletext/editor to ^2.9.0 ([#10621](https://github.com/sanity-io/sanity/issues/10621)) ([63d13b8](https://github.com/sanity-io/sanity/commit/63d13b8187027de1dbfc26a31228f65d5874d49c))
* **deps:** update dependency @portabletext/editor to ^2.9.1 ([#10626](https://github.com/sanity-io/sanity/issues/10626)) ([c62a30a](https://github.com/sanity-io/sanity/commit/c62a30a6aa95227f4ca1906541d230cd87299bf5))
* **deps:** update dependency @portabletext/editor to ^2.9.2 ([#10641](https://github.com/sanity-io/sanity/issues/10641)) ([38d7116](https://github.com/sanity-io/sanity/commit/38d7116afb1e9d34160007427cb4ea6f203aaa73))
* **deps:** update dependency @sanity/ui to ^3.1.0 ([#10627](https://github.com/sanity-io/sanity/issues/10627)) ([1a708b5](https://github.com/sanity-io/sanity/commit/1a708b5f58107ab9dc4dbcda67755e90e3b16596))

## [4.8.1](https://github.com/sanity-io/sanity/compare/v4.8.0...v4.8.1) (2025-09-10)

**Note:** Version bump only for package sanity-test-studio

## [4.8.0](https://github.com/sanity-io/sanity/compare/v4.7.0...v4.8.0) (2025-09-10)

### Bug Fixes

* **deps:** update dependency @portabletext/editor to ^2.8.3 ([#10570](https://github.com/sanity-io/sanity/issues/10570)) ([63acb06](https://github.com/sanity-io/sanity/commit/63acb0664682d92432a5b4a4336a82a290f064a0))
* **deps:** update dependency @sanity/client to ^7.11.1 ([#10593](https://github.com/sanity-io/sanity/issues/10593)) ([96d3546](https://github.com/sanity-io/sanity/commit/96d35461db9de547e7ddd3d8987501ae41f9423d))

## [4.7.0](https://github.com/sanity-io/sanity/compare/v4.6.1...v4.7.0) (2025-09-09)

### Features

* **core:** custom release actions ([#10286](https://github.com/sanity-io/sanity/issues/10286)) ([28a774b](https://github.com/sanity-io/sanity/commit/28a774b271558ae288b7d7d3a00c9ec8659bd68a))
* **test-studio:** switch on advanced version control ([80cddca](https://github.com/sanity-io/sanity/commit/80cddca36b46700c2f836483d89e3a78a5c54cf3))

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.5.2 ([#10505](https://github.com/sanity-io/sanity/issues/10505)) ([b20a49e](https://github.com/sanity-io/sanity/commit/b20a49ef0614b566d3e2f6166c0805823e0bcfe5))
* **deps:** update dependency @portabletext/block-tools to ^3.5.3 ([#10535](https://github.com/sanity-io/sanity/issues/10535)) ([a52feb1](https://github.com/sanity-io/sanity/commit/a52feb11d59e082615dd6d2e3c3b3eba12dda89c))
* **deps:** update dependency @portabletext/block-tools to ^3.5.4 ([#10569](https://github.com/sanity-io/sanity/issues/10569)) ([f80859b](https://github.com/sanity-io/sanity/commit/f80859bc1760c67774e130dce58e0e90f70693a2))
* **deps:** update dependency @portabletext/editor to ^2.7.2 ([#10506](https://github.com/sanity-io/sanity/issues/10506)) ([7c4a145](https://github.com/sanity-io/sanity/commit/7c4a1451cdc943853c4015ffad3fbd2922a1cfb4))
* **deps:** update dependency @portabletext/editor to ^2.8.0 ([#10536](https://github.com/sanity-io/sanity/issues/10536)) ([e08eee0](https://github.com/sanity-io/sanity/commit/e08eee00e2de0e5c742d7689c0f9735829ff4b1a))
* **deps:** update dependency @portabletext/editor to ^2.8.1 ([#10555](https://github.com/sanity-io/sanity/issues/10555)) ([3c9eb4a](https://github.com/sanity-io/sanity/commit/3c9eb4aa4b59304fd88bd92e8298197131c63849))
* **deps:** update dependency @portabletext/editor to ^2.8.2 ([#10563](https://github.com/sanity-io/sanity/issues/10563)) ([d7be4ac](https://github.com/sanity-io/sanity/commit/d7be4ac250e7f8cb939e8d702db4b509c12d99c1))
* **deps:** update dependency @sanity/client to ^7.11.0 ([#10518](https://github.com/sanity-io/sanity/issues/10518)) ([5cfeba6](https://github.com/sanity-io/sanity/commit/5cfeba6b5d7f03c566740298ca4661c1066cc6aa))
* **deps:** update dependency @sanity/ui to ^3.0.11 ([#10538](https://github.com/sanity-io/sanity/issues/10538)) ([aa025d4](https://github.com/sanity-io/sanity/commit/aa025d4d98aa4c5c732196fdb36fa99e0c0e4694))
* **deps:** update dependency @sanity/ui to ^3.0.14 ([#10557](https://github.com/sanity-io/sanity/issues/10557)) ([8a1f41f](https://github.com/sanity-io/sanity/commit/8a1f41fad56b6c655d34701c955eda04567a4763))
* **deps:** Update dev-non-major ([#10544](https://github.com/sanity-io/sanity/issues/10544)) ([1855306](https://github.com/sanity-io/sanity/commit/185530655c2948d2b5223939608413e89eec7dc0))

## [4.6.1](https://github.com/sanity-io/sanity/compare/v4.6.0...v4.6.1) (2025-09-02)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.5.1 ([#10460](https://github.com/sanity-io/sanity/issues/10460)) ([af3737d](https://github.com/sanity-io/sanity/commit/af3737dc503d3fc84c04cdf73735ab2358fc5062))
* **deps:** update dependency @portabletext/editor to ^2.6.4 ([#10459](https://github.com/sanity-io/sanity/issues/10459)) ([706124e](https://github.com/sanity-io/sanity/commit/706124e85210e62784341171d07b3f007276a70b))
* **deps:** update dependency @portabletext/editor to ^2.6.5 ([#10474](https://github.com/sanity-io/sanity/issues/10474)) ([39a9b88](https://github.com/sanity-io/sanity/commit/39a9b8832158d2540efd2a4f987126fabbcc0110))
* **deps:** update dependency @portabletext/editor to ^2.6.7 ([#10479](https://github.com/sanity-io/sanity/issues/10479)) ([7ee3be7](https://github.com/sanity-io/sanity/commit/7ee3be77757c0c56c15f9652d51018b513ed5912))
* **deps:** update dependency @portabletext/editor to ^2.6.9 ([#10490](https://github.com/sanity-io/sanity/issues/10490)) ([f7ac7e5](https://github.com/sanity-io/sanity/commit/f7ac7e591b0f1f1ad0d1198a67c6221e11ceaf05))
* **deps:** update dependency @portabletext/editor to ^2.7.0 ([#10503](https://github.com/sanity-io/sanity/issues/10503)) ([cc00d31](https://github.com/sanity-io/sanity/commit/cc00d316fd5a5549ef8a9ac5dc6e9b6884c0093f))
* **deps:** update dependency @portabletext/editor to ^2.7.1 ([#10504](https://github.com/sanity-io/sanity/issues/10504)) ([5a35aaf](https://github.com/sanity-io/sanity/commit/5a35aafc841deb3f5e235b2d59b36230963fe9e8))
* **deps:** update dependency @sanity/client to ^7.10.0 ([#10465](https://github.com/sanity-io/sanity/issues/10465)) ([62103ca](https://github.com/sanity-io/sanity/commit/62103ca0e384f49317a8c25cdb578ca5895fbb1a))
* **deps:** update dependency @sanity/ui to ^3.0.8 ([#10472](https://github.com/sanity-io/sanity/issues/10472)) ([62e01d1](https://github.com/sanity-io/sanity/commit/62e01d10e2cb496ce93e0d0a374ca1352c1f168c))

## [4.6.0](https://github.com/sanity-io/sanity/compare/v4.5.0...v4.6.0) (2025-08-26)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.3.0 ([#10405](https://github.com/sanity-io/sanity/issues/10405)) ([0b9a8ce](https://github.com/sanity-io/sanity/commit/0b9a8cedf450d1fc6373ba8575ee5e02c898549a))
* **deps:** update dependency @portabletext/block-tools to ^3.3.1 ([#10410](https://github.com/sanity-io/sanity/issues/10410)) ([f7affe2](https://github.com/sanity-io/sanity/commit/f7affe2a11d01febc48304b865adf5690b1760e6))
* **deps:** update dependency @portabletext/block-tools to ^3.3.2 ([#10419](https://github.com/sanity-io/sanity/issues/10419)) ([0df3a57](https://github.com/sanity-io/sanity/commit/0df3a575b47824c354dd34d736361f24e12c963a))
* **deps:** update dependency @portabletext/block-tools to ^3.3.3 ([#10421](https://github.com/sanity-io/sanity/issues/10421)) ([f49cf61](https://github.com/sanity-io/sanity/commit/f49cf61e71b732596960ea1f36db0b681947f69c))
* **deps:** update dependency @portabletext/editor to ^2.4.0 ([#10406](https://github.com/sanity-io/sanity/issues/10406)) ([294a907](https://github.com/sanity-io/sanity/commit/294a907efc2ceccf95534542f905c10da132b0c4))
* **deps:** update dependency @portabletext/editor to ^2.4.3 ([#10411](https://github.com/sanity-io/sanity/issues/10411)) ([a739244](https://github.com/sanity-io/sanity/commit/a739244e2b7d31f187ec8f8e98299ac052c93954))
* **deps:** update dependency @portabletext/editor to ^2.6.3 ([#10418](https://github.com/sanity-io/sanity/issues/10418)) ([2f2f2ee](https://github.com/sanity-io/sanity/commit/2f2f2eed8ea4fc493b8c88268d6e2e5c60cc60cd))
* **deps:** update dependency @sanity/client to ^7.9.0 ([#10412](https://github.com/sanity-io/sanity/issues/10412)) ([392f5dc](https://github.com/sanity-io/sanity/commit/392f5dc710fd1184709b268a4cc40b6af2e37162))
* fix scrolling issue inside of popover modals in PTE ([#10401](https://github.com/sanity-io/sanity/issues/10401)) ([c5a7d02](https://github.com/sanity-io/sanity/commit/c5a7d02ffc525417b049e12b78ea591d133b0974))
* stop throwing error when removing array item when validation pane is open ([#10420](https://github.com/sanity-io/sanity/issues/10420)) ([9cc4337](https://github.com/sanity-io/sanity/commit/9cc433791506602c82e8a8beebad47ff94c7be89))

## [4.5.0](https://github.com/sanity-io/sanity/compare/v4.4.1...v4.5.0) (2025-08-19)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^3.2.0 ([#10297](https://github.com/sanity-io/sanity/issues/10297)) ([b50678b](https://github.com/sanity-io/sanity/commit/b50678bd519d80a083b9f01efd8ac846a5502b4a))
* **deps:** update dependency @portabletext/block-tools to ^3.2.1 ([#10384](https://github.com/sanity-io/sanity/issues/10384)) ([6a1f726](https://github.com/sanity-io/sanity/commit/6a1f72614fb2cbb6851fd5951a7ea57c0177a32f))
* **deps:** update dependency @portabletext/editor to ^2.3.7 ([#10284](https://github.com/sanity-io/sanity/issues/10284)) ([213dc36](https://github.com/sanity-io/sanity/commit/213dc369b728db58327fa3c1f9c5792e5dcbe1d3))
* **deps:** update dependency @portabletext/editor to ^2.3.8 ([#10389](https://github.com/sanity-io/sanity/issues/10389)) ([60e179c](https://github.com/sanity-io/sanity/commit/60e179c22b152059bab11bd006d58af1b2e6ef1f))
* **deps:** Update dev-non-major ([#10302](https://github.com/sanity-io/sanity/issues/10302)) ([3f1c7d1](https://github.com/sanity-io/sanity/commit/3f1c7d147e691083eec47e108591b93619ac19c6))

## [4.4.1](https://github.com/sanity-io/sanity/compare/v4.4.0...v4.4.1) (2025-08-14)

### Bug Fixes

* **deps:** update dependency @sanity/ui to ^3.0.7 ([#10293](https://github.com/sanity-io/sanity/issues/10293)) ([e671ffc](https://github.com/sanity-io/sanity/commit/e671ffc1bef570811838235630d2717590f65d15))

## [4.4.0](https://github.com/sanity-io/sanity/compare/v4.3.0...v4.4.0) (2025-08-13)

### Features

* **util:** add support for localized moment tokens ([#10240](https://github.com/sanity-io/sanity/issues/10240)) ([caf47b6](https://github.com/sanity-io/sanity/commit/caf47b656f7ea94c0c871dcac62f3aae1d6ef6f6))

### Bug Fixes

* **core:** allow losing focus inside popover modals, fix scroll in popover issue ([#10213](https://github.com/sanity-io/sanity/issues/10213)) ([d49b527](https://github.com/sanity-io/sanity/commit/d49b5274d5bcc378233837eab79152e2651e6c6c))
* **deps:** update dependency @portabletext/block-tools to ^2.0.8 ([#10200](https://github.com/sanity-io/sanity/issues/10200)) ([498a56d](https://github.com/sanity-io/sanity/commit/498a56ddda6297fa00a1b3faa0571cea353bab63))
* **deps:** update dependency @portabletext/block-tools to v3 ([#10256](https://github.com/sanity-io/sanity/issues/10256)) ([4672c48](https://github.com/sanity-io/sanity/commit/4672c48f1360b590844c659e29aba53abd025d15))
* **deps:** update dependency @portabletext/editor to ^2.1.11 ([#10204](https://github.com/sanity-io/sanity/issues/10204)) ([30a9a70](https://github.com/sanity-io/sanity/commit/30a9a705bdffe9c3152588f98e597f04f9d1f4c5))
* **deps:** update dependency @portabletext/editor to ^2.1.9 ([#10202](https://github.com/sanity-io/sanity/issues/10202)) ([4aabd89](https://github.com/sanity-io/sanity/commit/4aabd89a0f4df5f95829e9e955a1ce6bd68107f4))
* **deps:** update dependency @portabletext/editor to ^2.3.0 ([#10226](https://github.com/sanity-io/sanity/issues/10226)) ([4681b77](https://github.com/sanity-io/sanity/commit/4681b77dd05d9bd60ac2890824953c0f1259f049))
* **deps:** update dependency @portabletext/editor to ^2.3.3 ([#10242](https://github.com/sanity-io/sanity/issues/10242)) ([322ab52](https://github.com/sanity-io/sanity/commit/322ab524baf85e1a73a6827444ba01c58c6ae479))
* **deps:** update dependency @sanity/ui to ^3.0.6 ([#10245](https://github.com/sanity-io/sanity/issues/10245)) ([5a9f4cf](https://github.com/sanity-io/sanity/commit/5a9f4cf59ad64ab5e5afb2659e2b7b7e84e5fa8f))
* **deps:** Update dev-non-major ([#10192](https://github.com/sanity-io/sanity/issues/10192)) ([6ba5be6](https://github.com/sanity-io/sanity/commit/6ba5be68a262fba63410658b59c7725b86c494fa))
* **sanity:** presentation navigation issues and initial value handling ([#10207](https://github.com/sanity-io/sanity/issues/10207)) ([34fba7d](https://github.com/sanity-io/sanity/commit/34fba7d6c4d821e31acc4f898c0b6b282311783c))
* **structure:** render actions menu if sideMenuItems has actions ([#10196](https://github.com/sanity-io/sanity/issues/10196)) ([62272a8](https://github.com/sanity-io/sanity/commit/62272a81a6d06d3e960699719621a15b6078292f))

## [4.3.0](https://github.com/sanity-io/sanity/compare/v4.2.0...v4.3.0) (2025-08-05)

### Features

* **core:** allow all fields group customizations ([#10094](https://github.com/sanity-io/sanity/issues/10094)) ([f3237e1](https://github.com/sanity-io/sanity/commit/f3237e1203bdab30b3ee86c8ce2ea29f216100de))

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^2.0.2 ([#10167](https://github.com/sanity-io/sanity/issues/10167)) ([c75c002](https://github.com/sanity-io/sanity/commit/c75c002b594276c4e8fff070a2e7274f2dc0a576))
* **deps:** update dependency @portabletext/block-tools to ^2.0.5 ([#10172](https://github.com/sanity-io/sanity/issues/10172)) ([7ca6103](https://github.com/sanity-io/sanity/commit/7ca610389464bf1d94e0285c92d3b27c7090e7f3))
* **deps:** update dependency @portabletext/editor to ^2.1.2 ([#10168](https://github.com/sanity-io/sanity/issues/10168)) ([ced80f4](https://github.com/sanity-io/sanity/commit/ced80f4177b10b0c0a45885e7ddcda79d69612d7))
* **deps:** update dependency @portabletext/editor to ^2.1.4 ([#10173](https://github.com/sanity-io/sanity/issues/10173)) ([bdff34c](https://github.com/sanity-io/sanity/commit/bdff34c72de8cd60e7dc946cfd606bd37fce8eed))
* **deps:** update dependency @portabletext/editor to ^2.1.7 ([#10177](https://github.com/sanity-io/sanity/issues/10177)) ([d30c781](https://github.com/sanity-io/sanity/commit/d30c78120e10957fb5c8224c0e86f409b761af41))
* **deps:** update dependency @sanity/client to ^7.8.2 ([#10181](https://github.com/sanity-io/sanity/issues/10181)) ([f63be89](https://github.com/sanity-io/sanity/commit/f63be89404282e45a64b18acc2dee7585bd3dcf1))
* **deps:** update dependency @sanity/ui to ^3.0.3 ([#10098](https://github.com/sanity-io/sanity/issues/10098)) ([05cd42c](https://github.com/sanity-io/sanity/commit/05cd42ccc965d41bd67c188860802f118e23f349))
* **deps:** update dependency @sanity/ui to ^3.0.5 ([#10115](https://github.com/sanity-io/sanity/issues/10115)) ([82703e1](https://github.com/sanity-io/sanity/commit/82703e1f60df532cf8c8af37eb70ddabd303dd82))
* **deps:** Update dev-non-major ([#10185](https://github.com/sanity-io/sanity/issues/10185)) ([7a5255e](https://github.com/sanity-io/sanity/commit/7a5255e203c7c58329e0ced7e1d6724a300f3427))
* issue where a slimple slug in an array was auto closing when focusing on it ([#10175](https://github.com/sanity-io/sanity/issues/10175)) ([dfb704d](https://github.com/sanity-io/sanity/commit/dfb704dd17e233a7155e5d9d464b0d0c8d384524))

## [4.2.0](https://github.com/sanity-io/sanity/compare/v4.1.1...v4.2.0) (2025-07-29)

### Features

* **core:** add media library field groq filters ([#9900](https://github.com/sanity-io/sanity/issues/9900)) ([fd837ab](https://github.com/sanity-io/sanity/commit/fd837aba647ccd7757a159c000833c90001f350c))

### Bug Fixes

* **core:** upgrade refractor to 5.0.0 and react-refractor to 4.0.0 and @sanity/ui to 3.0.0 ([#10068](https://github.com/sanity-io/sanity/issues/10068)) ([cf42627](https://github.com/sanity-io/sanity/commit/cf42627649b0ebc968eb22c588ec3abe967cc388))
* **deps:** update dependency @sanity/client to ^7.8.1 ([#10066](https://github.com/sanity-io/sanity/issues/10066)) ([4e0d1c5](https://github.com/sanity-io/sanity/commit/4e0d1c53856b2e6bf6c61b3609fa8ba6fcd011dc))
* **deps:** update dependency @sanity/ui to ^3.0.1 ([#10079](https://github.com/sanity-io/sanity/issues/10079)) ([63e81eb](https://github.com/sanity-io/sanity/commit/63e81eba52b9014c58745776ddecc973ae5530b2))
* **deps:** Update dev-non-major ([#10046](https://github.com/sanity-io/sanity/issues/10046)) ([cd7dc5c](https://github.com/sanity-io/sanity/commit/cd7dc5c04b2cf9f9dab1ebfb5e0066ca3c512fba))

## [4.1.1](https://github.com/sanity-io/sanity/compare/v4.1.0...v4.1.1) (2025-07-22)

**Note:** Version bump only for package sanity-test-studio

## [4.1.0](https://github.com/sanity-io/sanity/compare/v4.0.1...v4.1.0) (2025-07-21)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to v2 ([#10002](https://github.com/sanity-io/sanity/issues/10002)) ([eb050e7](https://github.com/sanity-io/sanity/commit/eb050e7ed7cf3273c0431039fd386142f4066d25))
* **deps:** update dependency @portabletext/editor to v2 ([#10003](https://github.com/sanity-io/sanity/issues/10003)) ([5dda18f](https://github.com/sanity-io/sanity/commit/5dda18f1a082122b585eae95ac5ccd5a5e67025b))
* **deps:** update dependency @sanity/client to ^7.8.0 ([#9974](https://github.com/sanity-io/sanity/issues/9974)) ([abca37f](https://github.com/sanity-io/sanity/commit/abca37f07db11a1b97c53e6718f293542237a1ca))
* **deps:** Update dev-non-major ([#9995](https://github.com/sanity-io/sanity/issues/9995)) ([4050e54](https://github.com/sanity-io/sanity/commit/4050e5476520085bd79318054933c01d714ee820))

## [4.0.1](https://github.com/sanity-io/sanity/compare/v4.0.0...v4.0.1) (2025-07-16)

**Note:** Version bump only for package sanity-test-studio

## [4.0.0](https://github.com/sanity-io/sanity/compare/v3.99.0...v4.0.0) (2025-07-14)

### Bug Fixes

* **deps:** update dependency @portabletext/editor to ^1.58.0 ([#9954](https://github.com/sanity-io/sanity/issues/9954)) ([662eadf](https://github.com/sanity-io/sanity/commit/662eadf9f097f83ab7ef94b8b74dfed030a540ca))
* **deps:** update dependency @sanity/ui to ^2.16.7 ([#9953](https://github.com/sanity-io/sanity/issues/9953)) ([57f922a](https://github.com/sanity-io/sanity/commit/57f922a1535ed2f9629486a9d985e79ea658a311))

## [3.99.0](https://github.com/sanity-io/sanity/compare/v3.98.1...v3.99.0) (2025-07-11)

### Features

* Media Library video integration ([#9909](https://github.com/sanity-io/sanity/issues/9909)) ([5342858](https://github.com/sanity-io/sanity/commit/534285836c3f1c7a5fe9772ed732731adc16992b))

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^1.1.38 ([#9940](https://github.com/sanity-io/sanity/issues/9940)) ([3dd90d5](https://github.com/sanity-io/sanity/commit/3dd90d539e2287162f7d5cf98fde53b868f17285))
* **deps:** update dependency @portabletext/editor to ^1.57.5 ([#9941](https://github.com/sanity-io/sanity/issues/9941)) ([892da2b](https://github.com/sanity-io/sanity/commit/892da2b9304ac9bbfd3842fa199bccd5f6e78f35))
* **deps:** update dependency @sanity/ui to ^2.16.4 ([#9934](https://github.com/sanity-io/sanity/issues/9934)) ([3967361](https://github.com/sanity-io/sanity/commit/39673611a02253d2ea4c2a6cdc018431b9353130))

## <small>3.98.1 (2025-07-09)</small>

* fix(deps): update dependency @portabletext/block-tools to ^1.1.36 (#9918) ([46a7d9d](https://github.com/sanity-io/sanity/commit/46a7d9d)), closes [#9918](https://github.com/sanity-io/sanity/issues/9918)
* fix(deps): update dependency @portabletext/block-tools to ^1.1.37 (#9927) ([c545a1b](https://github.com/sanity-io/sanity/commit/c545a1b)), closes [#9927](https://github.com/sanity-io/sanity/issues/9927)
* fix(deps): update dependency @portabletext/editor to ^1.57.0 (#9913) ([e124c21](https://github.com/sanity-io/sanity/commit/e124c21)), closes [#9913](https://github.com/sanity-io/sanity/issues/9913)
* fix(deps): update dependency @portabletext/editor to ^1.57.1 (#9919) ([32ebd0c](https://github.com/sanity-io/sanity/commit/32ebd0c)), closes [#9919](https://github.com/sanity-io/sanity/issues/9919)
* fix(deps): update dependency @portabletext/editor to ^1.57.3 (#9928) ([ea2b66d](https://github.com/sanity-io/sanity/commit/ea2b66d)), closes [#9928](https://github.com/sanity-io/sanity/issues/9928)
* fix(deps): update dependency @sanity/ui to ^2.16.3 (#9931) ([d2b3cf5](https://github.com/sanity-io/sanity/commit/d2b3cf5)), closes [#9931](https://github.com/sanity-io/sanity/issues/9931)

## [3.98.0](https://github.com/sanity-io/sanity/compare/v3.97.1...v3.98.0) (2025-07-07)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^1.1.35 ([#9897](https://github.com/sanity-io/sanity/issues/9897)) ([d21610b](https://github.com/sanity-io/sanity/commit/d21610bb51e925632ab3141811db0fd0bb7b3b39)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.56.0 ([#9889](https://github.com/sanity-io/sanity/issues/9889)) ([9cfd35d](https://github.com/sanity-io/sanity/commit/9cfd35dd5965c476ea6d91818cd3835444265e97)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.97.1](https://github.com/sanity-io/sanity/compare/v3.97.0...v3.97.1) (2025-07-04)

**Note:** Version bump only for package sanity-test-studio

## [3.97.0](https://github.com/sanity-io/sanity/compare/v3.96.0...v3.97.0) (2025-07-04)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^1.1.34 ([#9874](https://github.com/sanity-io/sanity/issues/9874)) ([c7f16f0](https://github.com/sanity-io/sanity/commit/c7f16f0d645305e787561b589e11fa6156466f39)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.15 ([#9875](https://github.com/sanity-io/sanity/issues/9875)) ([41afd49](https://github.com/sanity-io/sanity/commit/41afd49906895a8b7cf4fc4468b13a6e2c5cf604)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.96.0](https://github.com/sanity-io/sanity/compare/v3.95.0...v3.96.0) (2025-07-02)

### Bug Fixes

* **core:** PTE open referenced documents from annotation popup ([#9643](https://github.com/sanity-io/sanity/issues/9643)) ([d4af0c8](https://github.com/sanity-io/sanity/commit/d4af0c8c5a761661b789d34a71afc1b6ee6dc5fc)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.33 ([#9835](https://github.com/sanity-io/sanity/issues/9835)) ([2349c0d](https://github.com/sanity-io/sanity/commit/2349c0dca29dd6fec0565307fb0beaff62fdbbe0)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.10 ([#9852](https://github.com/sanity-io/sanity/issues/9852)) ([0b5b051](https://github.com/sanity-io/sanity/commit/0b5b051a625ef2520d28db6ba04a91eb1e3590eb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.11 ([#9855](https://github.com/sanity-io/sanity/issues/9855)) ([f1056cb](https://github.com/sanity-io/sanity/commit/f1056cb6254266ca27b92d4cfbcd1a3c37884f71)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.6 ([#9823](https://github.com/sanity-io/sanity/issues/9823)) ([73df0cc](https://github.com/sanity-io/sanity/commit/73df0cce7ea850f93de43216571c104df6da3e4b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.7 ([#9836](https://github.com/sanity-io/sanity/issues/9836)) ([1f575ec](https://github.com/sanity-io/sanity/commit/1f575ec2ca39cda578c65bafabed2e11d878aa31)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.8 ([#9845](https://github.com/sanity-io/sanity/issues/9845)) ([979723c](https://github.com/sanity-io/sanity/commit/979723c453547381cb8651d8ca7631a1dec940a6)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.9 ([#9848](https://github.com/sanity-io/sanity/issues/9848)) ([e64a97a](https://github.com/sanity-io/sanity/commit/e64a97a66c30a8180b68fe65856aa215682a959b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.95.0](https://github.com/sanity-io/sanity/compare/v3.94.2...v3.95.0) (2025-06-25)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^1.1.32 ([#9805](https://github.com/sanity-io/sanity/issues/9805)) ([96c0193](https://github.com/sanity-io/sanity/commit/96c01937ad0c2abfa6c90128da03c8568aed7908)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.5 ([#9806](https://github.com/sanity-io/sanity/issues/9806)) ([275b7a1](https://github.com/sanity-io/sanity/commit/275b7a19e61287b6e28f7b88f7231e364348a6e4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.94.2](https://github.com/sanity-io/sanity/compare/v3.94.1...v3.94.2) (2025-06-24)

**Note:** Version bump only for package sanity-test-studio

## [3.94.1](https://github.com/sanity-io/sanity/compare/v3.94.0...v3.94.1) (2025-06-24)

**Note:** Version bump only for package sanity-test-studio

## [3.94.0](https://github.com/sanity-io/sanity/compare/v3.93.0...v3.94.0) (2025-06-24)

### Bug Fixes

* **core:** fix issues with ML uploads ([#9745](https://github.com/sanity-io/sanity/issues/9745)) ([8bce663](https://github.com/sanity-io/sanity/commit/8bce663f64a848ebaa3363296e7638bf535060c5)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.31 ([#9728](https://github.com/sanity-io/sanity/issues/9728)) ([d37cf06](https://github.com/sanity-io/sanity/commit/d37cf06c179d7f0de70f90d420b30f33f29c4751)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.53.1 ([#9729](https://github.com/sanity-io/sanity/issues/9729)) ([cf0bf85](https://github.com/sanity-io/sanity/commit/cf0bf8550a1aab59257166dfb0a353ea9a7fab3f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.54.2 ([#9736](https://github.com/sanity-io/sanity/issues/9736)) ([dfff499](https://github.com/sanity-io/sanity/commit/dfff499c50896a323ffc7ae208cffbbd71875b69)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.54.3 ([#9746](https://github.com/sanity-io/sanity/issues/9746)) ([af9f8fa](https://github.com/sanity-io/sanity/commit/af9f8fa054c33a6b1d4e8058f046269c29c543bc)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.54.4 ([#9762](https://github.com/sanity-io/sanity/issues/9762)) ([3b22192](https://github.com/sanity-io/sanity/commit/3b2219203186a748a460a8b1b9fe0f45560d121e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.0 ([#9767](https://github.com/sanity-io/sanity/issues/9767)) ([87ebf9f](https://github.com/sanity-io/sanity/commit/87ebf9f00d144dd4e4cff7b4ce81a58f3f6e7440)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.2 ([#9781](https://github.com/sanity-io/sanity/issues/9781)) ([a8f4d4c](https://github.com/sanity-io/sanity/commit/a8f4d4c9feb10bda40dab9e55a22464933870157)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.55.3 ([#9790](https://github.com/sanity-io/sanity/issues/9790)) ([4776574](https://github.com/sanity-io/sanity/commit/4776574fb0510b91f175f0ba92b39a904b4e0618)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/ui to ^2.16.0 ([#9716](https://github.com/sanity-io/sanity/issues/9716)) ([2586169](https://github.com/sanity-io/sanity/commit/258616905c0a522cbc7990877c7b37cbc9417f61)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/ui to ^2.16.2 ([#9726](https://github.com/sanity-io/sanity/issues/9726)) ([74d5316](https://github.com/sanity-io/sanity/commit/74d5316fb474a8c94a4ecac54d21bfc58c4a6370)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#9741](https://github.com/sanity-io/sanity/issues/9741)) ([d233393](https://github.com/sanity-io/sanity/commit/d23339374641a9a6b7a2a95e0e47773f7c30461a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#9755](https://github.com/sanity-io/sanity/issues/9755)) ([17c8ae5](https://github.com/sanity-io/sanity/commit/17c8ae5b20173dad6e522832a55f1e8442456469)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.93.0](https://github.com/sanity-io/sanity/compare/v3.92.0...v3.93.0) (2025-06-17)

### Features

* **core:** add one line portable text editor option ([#9625](https://github.com/sanity-io/sanity/issues/9625)) ([f64bd68](https://github.com/sanity-io/sanity/commit/f64bd6823ef00b09bf9dd6ccaac702723918dd8b)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* **core:** ensure virtualized array items are rendered before scroll ([#9611](https://github.com/sanity-io/sanity/issues/9611)) ([8d8cfa2](https://github.com/sanity-io/sanity/commit/8d8cfa2aeecded328547a46a86c1d1ae8514378b)) by Rupert Dunk (rupert@rupertdunk.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.29 ([#9602](https://github.com/sanity-io/sanity/issues/9602)) ([8d6ac7c](https://github.com/sanity-io/sanity/commit/8d6ac7cf267195659721a7dee4a5167a296f7df9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^1.1.30 ([#9619](https://github.com/sanity-io/sanity/issues/9619)) ([408c5e3](https://github.com/sanity-io/sanity/commit/408c5e3892ffd1846ae3ab357f0c9e39da272fc4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.52.0 ([#9603](https://github.com/sanity-io/sanity/issues/9603)) ([7bdcbcb](https://github.com/sanity-io/sanity/commit/7bdcbcb39a178b74fce51905c7d5c47c93e4aec9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.52.7 ([#9620](https://github.com/sanity-io/sanity/issues/9620)) ([6673c7f](https://github.com/sanity-io/sanity/commit/6673c7fe309f057e744e3a2c19cdaa1fb87e9ead)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.53.0 ([#9642](https://github.com/sanity-io/sanity/issues/9642)) ([8b60220](https://github.com/sanity-io/sanity/commit/8b602207abead2eaa4d06edb437ac929ecaa71a1)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.6.0 ([#9649](https://github.com/sanity-io/sanity/issues/9649)) ([e41e814](https://github.com/sanity-io/sanity/commit/e41e8140d2de74151228f535181d368407aa9111)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [3.92.0](https://github.com/sanity-io/sanity/compare/v3.91.0...v3.92.0) (2025-06-10)

### Features

* add timeZone settings to datetime input ([#8181](https://github.com/sanity-io/sanity/issues/8181)) ([1ca2568](https://github.com/sanity-io/sanity/commit/1ca25683166f1801846b29085b20169027850c33)) by Eoin Falconer (eoin.falc@gmail.com)
* **core:** allow configuring PTE plugins ([#8785](https://github.com/sanity-io/sanity/issues/8785)) ([57b8dc5](https://github.com/sanity-io/sanity/commit/57b8dc5df8c5bb9142fd953ab93733325ae2e282)) by Christian Grøngaard (christian.groengaard@sanity.io)
* **core:** versions primary action ([#9596](https://github.com/sanity-io/sanity/issues/9596)) ([c0d9efa](https://github.com/sanity-io/sanity/commit/c0d9efa395f4e71f6830c8751f623e14860dcec1)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* Support Portable Text object deprecation  ([#9590](https://github.com/sanity-io/sanity/issues/9590))  ([08204e1](https://github.com/sanity-io/sanity/commit/08204e17ed43ff41a68bd13cfc7cd080218d2be0)) by Saskia (72471533+bobinska-dev@users.noreply.github.com)

### Bug Fixes

* **deps:** update dependency @portabletext/block-tools to ^1.1.28 ([#9424](https://github.com/sanity-io/sanity/issues/9424)) ([b366fcd](https://github.com/sanity-io/sanity/commit/b366fcdfbc28ec5f81feaf6cc3682da19426cdf5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^1.50.8 ([#9508](https://github.com/sanity-io/sanity/issues/9508)) ([f6357db](https://github.com/sanity-io/sanity/commit/f6357dbe1e19076286c06de8d2c272058c0dc01e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.4.1 ([#9563](https://github.com/sanity-io/sanity/issues/9563)) ([28995c1](https://github.com/sanity-io/sanity/commit/28995c11d7e920467e50116a5be97f215ab85fd2)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.5.0 ([#9591](https://github.com/sanity-io/sanity/issues/9591)) ([f33154b](https://github.com/sanity-io/sanity/commit/f33154ba7336299ee0969a0a8db5bf106c3a7825)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* handle imperative focus state in slug input correctly ([#9581](https://github.com/sanity-io/sanity/issues/9581)) ([672fba8](https://github.com/sanity-io/sanity/commit/672fba8b84083052e1f9553fe9ce311835bacc7b)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* speedup `sanity dev` by warming up the entry file ([#9567](https://github.com/sanity-io/sanity/issues/9567)) ([10dc15d](https://github.com/sanity-io/sanity/commit/10dc15df6a2d86515f53d3950dafb8462fac4073)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [3.91.0](https://github.com/sanity-io/sanity/compare/v3.90.0...v3.91.0) (2025-06-03)

### Features

* **sanity:** add ability to map document upon duplication ([#9517](https://github.com/sanity-io/sanity/issues/9517)) ([25e5bfd](https://github.com/sanity-io/sanity/commit/25e5bfdb3308ae10a1d59628bcddbcbbfc7ac9ab)) by Ash (ash@sanity.io)

### Bug Fixes

* **deps:** update dependency @sanity/client to ^7.4.0 ([#9527](https://github.com/sanity-io/sanity/issues/9527)) ([1184899](https://github.com/sanity-io/sanity/commit/1184899e50bf559e0f47db0e94df942a7fa7be3a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

### Reverts

* publish v3.91.0 ([#9546](https://github.com/sanity-io/sanity/issues/9546)) ([#9550](https://github.com/sanity-io/sanity/issues/9550)) ([d191e4c](https://github.com/sanity-io/sanity/commit/d191e4cdbccc68cda01f864c0290528df91d9571)) by Bjørge Næss (bjoerge@gmail.com)
