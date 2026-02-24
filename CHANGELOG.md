# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.12.0](https://github.com/sanity-io/sanity/compare/v5.11.0...v5.12.0) (2026-02-24)

### Features

* add telemetry around the publish button state and time ([#12189](https://github.com/sanity-io/sanity/issues/12189)) ([50a46ed](https://github.com/sanity-io/sanity/commit/50a46ed8c71950310a3c7afcad4e7f7e49268eda)) by RitaDias (rita@sanity.io)
* **cli:** add Gemini, Codex and Copilot CLIs to MCP configure ([#12194](https://github.com/sanity-io/sanity/issues/12194)) ([093e716](https://github.com/sanity-io/sanity/commit/093e7165e77bce80e11e59e7a98f58524d363e43)) by James Woods (jwwoods01@gmail.com)
* **cli:** upgrade blueprints commands ([#12226](https://github.com/sanity-io/sanity/issues/12226)) ([245a07f](https://github.com/sanity-io/sanity/commit/245a07ff585caf4c63536c47f7dd468c5c01205a)) by Taylor Beseda (tbeseda@gmail.com)
* **dataset:** add commands for managing embeddings ([759d47e](https://github.com/sanity-io/sanity/commit/759d47e7bf219eca7e0fb09b824ad1aadbc9a3bc)) by Alex Doroshenko (adoprog@users.noreply.github.com)
* remove enhancedObjectDialog from config ([#12231](https://github.com/sanity-io/sanity/issues/12231)) ([5444de8](https://github.com/sanity-io/sanity/commit/5444de827663e1b00a3ccc7a93abe05c99fe0c0c)) by RitaDias (rita@sanity.io)

### Bug Fixes

* **cli:** restore missing version mismatch warning ([#12223](https://github.com/sanity-io/sanity/issues/12223)) ([320b4ee](https://github.com/sanity-io/sanity/commit/320b4ee691caf6c859e0056c40665d7b79b37441)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** move EditorChange type ownership from PTE to Studio ([1990fdf](https://github.com/sanity-io/sanity/commit/1990fdfa5015e0d0bf230fa66c6ab6728704a5f5)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **core:** prepare for PTE v6 EditorConfig and paste type changes ([e131d6a](https://github.com/sanity-io/sanity/commit/e131d6a52b26a0a6cc4566803bbdd959aabc5999)), closes [#2136](https://github.com/sanity-io/sanity/issues/2136) by Christian Grøngaard (christian.groengaard@sanity.io)
* **core:** prepare for PTE v6 render component types ([8b22885](https://github.com/sanity-io/sanity/commit/8b228852b74a31fdf27e5ea0ad68fc90310ca9d0)), closes [#11920](https://github.com/sanity-io/sanity/issues/11920) [#11920](https://github.com/sanity-io/sanity/issues/11920) by plinth (plinth@noreply.miriad.ai)
* **deps:** update dependency @sanity/import to ^4.1.2 ([#12208](https://github.com/sanity-io/sanity/issues/12208)) ([2c7841d](https://github.com/sanity-io/sanity/commit/2c7841db8e3a583832dcf49b0af9087a71eb236c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12210](https://github.com/sanity-io/sanity/issues/12210)) ([d7294b9](https://github.com/sanity-io/sanity/commit/d7294b9a1e3d51f37a4e7bd8a1121863ae81a13a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* navigation to root element having issues navigating completely out ([#12204](https://github.com/sanity-io/sanity/issues/12204)) ([15fb1a4](https://github.com/sanity-io/sanity/commit/15fb1a4b70fa6126979f36aab869601716244cf7)) by RitaDias (rita@sanity.io)

## [5.11.0](https://github.com/sanity-io/sanity/compare/v5.10.0...v5.11.0) (2026-02-19)

### Features

* **ci:** mark linear issues as done on release ([#12060](https://github.com/sanity-io/sanity/issues/12060)) ([127726f](https://github.com/sanity-io/sanity/commit/127726fd984dfb2c4b6ed59ab566b0e7856807f5)) by Drew Lyton (31733517+drewlyton@users.noreply.github.com)
* conditional multi schema references ([#12066](https://github.com/sanity-io/sanity/issues/12066)) ([7e7ea6d](https://github.com/sanity-io/sanity/commit/7e7ea6d9520e9841ab2dd96e7d2cfe433b71ae5e)) by Jordan Lawrence (jordanl17@me.com)
* **test-studio:** add demonstration of stega overlays failing to expand group inside object array member ([f2bbdf0](https://github.com/sanity-io/sanity/commit/f2bbdf038074d5ee5d612f616f43a8d39a7a9e6e)) by Ash (ash@sanity.io)

### Bug Fixes

* add content to the breadcrumb instead of 'mark definitions' ([#12175](https://github.com/sanity-io/sanity/issues/12175)) ([85ccfb4](https://github.com/sanity-io/sanity/commit/85ccfb4108c6251e698aad644c4560bc62d76e57)) by RitaDias (rita@sanity.io)
* **deps:** update dependency groq-js to ^1.27.1 ([#12180](https://github.com/sanity-io/sanity/issues/12180)) ([c8c7dea](https://github.com/sanity-io/sanity/commit/c8c7dea5a94a691dabb2f1549a2d494432d494f0)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12199](https://github.com/sanity-io/sanity/issues/12199)) ([d504974](https://github.com/sanity-io/sanity/commit/d5049742aea7ea4c313dbf1e28e9fe4a63a2b911)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **docs:** export IncomingReferenceOptions ([#12177](https://github.com/sanity-io/sanity/issues/12177)) ([d75c1f6](https://github.com/sanity-io/sanity/commit/d75c1f6ba53452401812165e7bced74ce687cc71)) by Mark Michon (mark.michon@sanity.io)
* hiding publish action always on the published document ([#12176](https://github.com/sanity-io/sanity/issues/12176)) ([68d74df](https://github.com/sanity-io/sanity/commit/68d74dfbfcb85e6f82f070071b8d375d9c7fb74f)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** publishing versions using `PublishAction` ([3a06898](https://github.com/sanity-io/sanity/commit/3a068987ff5794d5f9a0bd402c927d38b56775fe)) by Ash (ash@sanity.io)
* **sanity:** set nested group correctly when expanding paths touching object array members ([63233a2](https://github.com/sanity-io/sanity/commit/63233a268f044ea2220486fdf50ba4a1dcc3ab0e)) by Ash (ash@sanity.io)
* truncating long release titles ([#12148](https://github.com/sanity-io/sanity/issues/12148)) ([b2f4127](https://github.com/sanity-io/sanity/commit/b2f4127dd6085843f260d04565f2a51cf494aec6)) by Jordan Lawrence (jordanl17@me.com)

## [5.10.0](https://github.com/sanity-io/sanity/compare/v5.9.0...v5.10.0) (2026-02-17)

### Features

* add warning when a document type is used for a field ([#12151](https://github.com/sanity-io/sanity/issues/12151)) ([8519d02](https://github.com/sanity-io/sanity/commit/8519d029c35a7419e944bfa61180de6a15e9a057)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* change on pte block ([#12149](https://github.com/sanity-io/sanity/issues/12149)) ([bdad5d3](https://github.com/sanity-io/sanity/commit/bdad5d31df70332f39d15c45ea43c4b746f265bd)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** add `isArrayOfPrimitivesFormNode` ([3ce4c46](https://github.com/sanity-io/sanity/commit/3ce4c46a5dd10067b2a8b65b5bc527c46bc16c2d)) by Ash (ash@sanity.io)
* **sanity:** add `readOrderedFormMembers` ([a3969fc](https://github.com/sanity-io/sanity/commit/a3969fc355fca6171618cc6440eded0ea9165161)) by Ash (ash@sanity.io)
* **sanity:** add missing `_allMembers` type ([fd4df92](https://github.com/sanity-io/sanity/commit/fd4df92f55bca0b6ca9a0a4d04de36cbaa2bc289)) by Ash (ash@sanity.io)

### Bug Fixes

* **comments:** route scheduledDraft as pane param in comment links ([#12156](https://github.com/sanity-io/sanity/issues/12156)) ([4712d1e](https://github.com/sanity-io/sanity/commit/4712d1eb69761ca4d9905eb00c443ce0d739ab22)) by Jordan Lawrence (jordanl17@me.com)
* **comments:** scroll to field when navigating to a comment deeplink ([#12144](https://github.com/sanity-io/sanity/issues/12144)) ([a3c282a](https://github.com/sanity-io/sanity/commit/a3c282a4c92212ebbedd3111444bdccdda34a2c5)) by Jordan Lawrence (jordanl17@me.com)
* **deps:** update dependency @portabletext/plugin-paste-link to v2 ([#12161](https://github.com/sanity-io/sanity/issues/12161)) ([f396bac](https://github.com/sanity-io/sanity/commit/f396bacfedfcd714e49adee30545173708401176)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.15.0 ([#12167](https://github.com/sanity-io/sanity/issues/12167)) ([fe75d84](https://github.com/sanity-io/sanity/commit/fe75d8437e83169e347551dcc30853698d44841e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.27.0 ([#12160](https://github.com/sanity-io/sanity/issues/12160)) ([ff50a1c](https://github.com/sanity-io/sanity/commit/ff50a1c1378bef2b8f8b92bfaa15fcc7cd17787d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v5 (major) ([#12162](https://github.com/sanity-io/sanity/issues/12162)) ([5b9ba17](https://github.com/sanity-io/sanity/commit/5b9ba176818c4ec42ac21de306b2e4e0f011d22a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v6 (major) ([#12164](https://github.com/sanity-io/sanity/issues/12164)) ([225b965](https://github.com/sanity-io/sanity/commit/225b965bfd2535a5d7cedc73269cb3beca3fc6b4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* don't make inline refs for references to top level doc types ([#12168](https://github.com/sanity-io/sanity/issues/12168)) ([7e490d9](https://github.com/sanity-io/sanity/commit/7e490d905a01beb5c65319edfdb3a0a4eaa86068)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **form:** prevent erroneous upload warning when pasting plain text into PTE ([#12109](https://github.com/sanity-io/sanity/issues/12109)) ([c76fcf1](https://github.com/sanity-io/sanity/commit/c76fcf10f3d345f69725b92288fbbde43063cb44)) by Eoin Falconer (eoin.falc@gmail.com)
* **form:** reset asset source state after upload completes ([#12111](https://github.com/sanity-io/sanity/issues/12111)) ([db94da8](https://github.com/sanity-io/sanity/commit/db94da8974a49ae5bb5937c1fe4991ffa23ee187)) by Eoin Falconer (eoin.falc@gmail.com)
* implement fallback for asset sources without uploaders ([#11907](https://github.com/sanity-io/sanity/issues/11907)) ([ec5de61](https://github.com/sanity-io/sanity/commit/ec5de61c20a2332ec71399b797f3734770cda17b)) by Jordan Lawrence (jordanl17@me.com)
* issue where clicking the "x" to close dialog or the breadcrumb to navigate would have issues when reopening Item ([#12147](https://github.com/sanity-io/sanity/issues/12147)) ([d078259](https://github.com/sanity-io/sanity/commit/d078259cc07c55754704b2418fe2f76546cf8045)) by RitaDias (rita@sanity.io)
* media library plugin upload existing asset issue ([#12173](https://github.com/sanity-io/sanity/issues/12173)) ([970f5c8](https://github.com/sanity-io/sanity/commit/970f5c89a6fa6372f6395d3e426977e68e100999)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **mutator:** include more details with error message ([#12150](https://github.com/sanity-io/sanity/issues/12150)) ([b132a1e](https://github.com/sanity-io/sanity/commit/b132a1e47016d2876dd0d87509b0353f8fb19ea2)) by Bjørge Næss (bjoerge@gmail.com)
* **presentation:** fix root cause of undefined in perspective array ([#12142](https://github.com/sanity-io/sanity/issues/12142)) ([ff4bcea](https://github.com/sanity-io/sanity/commit/ff4bcea247e2d92abc355982127e71cc48867fe6)) by Noah Gentile (nkgentile@users.noreply.github.com)
* reduce LISTENER_RESET_DELAY from 10s to 5s ([#12118](https://github.com/sanity-io/sanity/issues/12118)) ([715d036](https://github.com/sanity-io/sanity/commit/715d03649c4eff62af735f48d9eec3f4533b97d2)) by RitaDias (rita@sanity.io)
* **sanity:** migrate deprecated `motion` call to `motion.create` ([abbdf73](https://github.com/sanity-io/sanity/commit/abbdf73a9b9d48ad1aa899cbf63581dd65bf6ea7)) by Ash (ash@sanity.io)
* tz dropdown opens as expected even if an existing selection is made ([#12152](https://github.com/sanity-io/sanity/issues/12152)) ([46dcb62](https://github.com/sanity-io/sanity/commit/46dcb6232351f2fef3120f18e45464ae67d49af3)) by Jordan Lawrence (jordanl17@me.com)
* warn on doc type used as field type in array member too ([#12165](https://github.com/sanity-io/sanity/issues/12165)) ([94fa583](https://github.com/sanity-io/sanity/commit/94fa58373887b5ca49f376763b7432391579b641)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [5.9.0](https://github.com/sanity-io/sanity/compare/v5.8.1...v5.9.0) (2026-02-10)

### Features

* add hidden to validation context ([#12050](https://github.com/sanity-io/sanity/issues/12050)) ([26b665b](https://github.com/sanity-io/sanity/commit/26b665b540269d63a446bcfa361db5ddf0d561df)) by RitaDias (rita@sanity.io)
* **cli:** add schema extraction to dev and build commands ([#11761](https://github.com/sanity-io/sanity/issues/11761)) ([c3a4cb1](https://github.com/sanity-io/sanity/commit/c3a4cb19e11147ba91a832420fed13504e8b58a4)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **structure:** add `defaultPanes` option to documents ([#12039](https://github.com/sanity-io/sanity/issues/12039)) ([c670cbb](https://github.com/sanity-io/sanity/commit/c670cbb372650768da6bc7324464f3af01e08e15)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* add warning for schema validation when an array contains multiple primitive types that resolve to same json type ([#12095](https://github.com/sanity-io/sanity/issues/12095)) ([31155be](https://github.com/sanity-io/sanity/commit/31155be6dbf86faeb41b77cea27cf9c765961234)) by RitaDias (rita@sanity.io)
* **deps:** update dependency @sanity/import to ^4.1.1 ([#12130](https://github.com/sanity-io/sanity/issues/12130)) ([6843d2b](https://github.com/sanity-io/sanity/commit/6843d2b2d04b09ae27604912692ef3f96f15b5f4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12115](https://github.com/sanity-io/sanity/issues/12115)) ([757aa34](https://github.com/sanity-io/sanity/commit/757aa3418d9c10b187d969b55308a44f1d17a454)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12122](https://github.com/sanity-io/sanity/issues/12122)) ([4a36591](https://github.com/sanity-io/sanity/commit/4a36591b187d554148ea811abcd141f150640808)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **presentation:** crash when switching to a perspective stack ([#12102](https://github.com/sanity-io/sanity/issues/12102)) ([77f86f0](https://github.com/sanity-io/sanity/commit/77f86f0dc5eb8588482efea5466574128576afa7)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **releases:** hide publish option for already-published scheduled drafts ([#12113](https://github.com/sanity-io/sanity/issues/12113)) ([d3374ad](https://github.com/sanity-io/sanity/commit/d3374ad116fa176c51addf91183f291226e9ad8e)) by Eoin Falconer (eoin.falc@gmail.com)
* resolving re-render loop when collapsing comments ([#12135](https://github.com/sanity-io/sanity/issues/12135)) ([81a5cf8](https://github.com/sanity-io/sanity/commit/81a5cf87fbf55ef26ae12bc6d8f46b66fac43816)) by Jordan Lawrence (jordanl17@me.com)
* **structure:** stale publish actions ([#12132](https://github.com/sanity-io/sanity/issues/12132)) ([b3b2818](https://github.com/sanity-io/sanity/commit/b3b28182100f0cd32787425fc07618460fbb5bfb)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **studio:** show toast when clipboard access is denied on copy ([#12107](https://github.com/sanity-io/sanity/issues/12107)) ([3aff990](https://github.com/sanity-io/sanity/commit/3aff99079fb57fdb9f8f7aed77a3f185106fe5d0)) by Eoin Falconer (eoin.falc@gmail.com)
* timezone cannot be changed when scheduling release of draft ([#12124](https://github.com/sanity-io/sanity/issues/12124)) ([e0033fe](https://github.com/sanity-io/sanity/commit/e0033fe32bc6d41566f179916d0e89a2d9076f54)) by Jordan Lawrence (jordanl17@me.com)
* update permissions for pull requests in release-latest.yml ([#12137](https://github.com/sanity-io/sanity/issues/12137)) ([bbadd3b](https://github.com/sanity-io/sanity/commit/bbadd3b5346890a43aa88ac6fe32735c9afaa9d3)) by Jordan Lawrence (jordanl17@me.com)
* update readLocalBlueprint signature ([#12097](https://github.com/sanity-io/sanity/issues/12097)) ([7a16694](https://github.com/sanity-io/sanity/commit/7a166946ce61e278eff9e83328a98aaf74b249b9)) by Simon MacDonald (simon.macdonald@gmail.com)

### Reverts

* rollback v5.9.0 version bump ([#12139](https://github.com/sanity-io/sanity/issues/12139)) ([4195d26](https://github.com/sanity-io/sanity/commit/4195d269f400347fb16765400842f765eb1625ec)) by Bjørge Næss (bjoerge@gmail.com)

## [5.8.1](https://github.com/sanity-io/sanity/compare/v5.8.0...v5.8.1) (2026-02-05)

### Bug Fixes

* **deps:** update dependency @sanity/template-validator to ^2.4.5 ([#12076](https://github.com/sanity-io/sanity/issues/12076)) ([6da793e](https://github.com/sanity-io/sanity/commit/6da793e90e421abeea39533dde344295c8b52ebf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/template-validator to v3 ([#12092](https://github.com/sanity-io/sanity/issues/12092)) ([d889072](https://github.com/sanity-io/sanity/commit/d88907264bf0ac667a89097299c41c83a257b12e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* enforce explicit loginMethod configuration ([#12077](https://github.com/sanity-io/sanity/issues/12077)) ([8c4206d](https://github.com/sanity-io/sanity/commit/8c4206d920df8ef785fcfff07621399936251864)) by Rupert Dunk (rupert@rupertdunk.com)
* missing types in `sanity/structure` and `sanity/presentation` ([#12083](https://github.com/sanity-io/sanity/issues/12083)) ([cef5812](https://github.com/sanity-io/sanity/commit/cef58129bb58119a3a6cde38f8da1d6e03ecdf76)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **sanity:** prevent input element ids from adding unsafe global variables ([#12085](https://github.com/sanity-io/sanity/issues/12085)) ([7a4041c](https://github.com/sanity-io/sanity/commit/7a4041cd60808623ce13111699997ec9c0351e58)) by Bjørge Næss (bjoerge@gmail.com)

## [5.8.0](https://github.com/sanity-io/sanity/compare/v5.7.0...v5.8.0) (2026-02-03)

### Features

* add close outside of dialog to close all dialogs ([#12044](https://github.com/sanity-io/sanity/issues/12044)) ([75a7b00](https://github.com/sanity-io/sanity/commit/75a7b005c5875135ce2273e160b29c4c8b1aebef)) by RitaDias (rita@sanity.io)
* add selection state (indicators) to all menu items (actions etc.) ([#12003](https://github.com/sanity-io/sanity/issues/12003)) ([81ede79](https://github.com/sanity-io/sanity/commit/81ede798df314f160156da46e514f2e4e60e8c32)) by RitaDias (rita@sanity.io)
* built-in PTE `pasteLink` plugin enabled by default ([72a53b7](https://github.com/sanity-io/sanity/commit/72a53b72be1b92feeb733adbe366d7c6d9285334)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **cli:** add typegen to dev and build commands ([#11957](https://github.com/sanity-io/sanity/issues/11957)) ([dc6baae](https://github.com/sanity-io/sanity/commit/dc6baaed2d132e3d1fd020f0871d929fb9a34a5c)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **cli:** add watch mode for typegen generate command ([#11867](https://github.com/sanity-io/sanity/issues/11867)) ([c22e65e](https://github.com/sanity-io/sanity/commit/c22e65eb958f98c47e2cdfc028618aa2fe512760)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **cli:** allow external studio deployments ([ce738b8](https://github.com/sanity-io/sanity/commit/ce738b8ce60949b82aa02144293c7ea46bd1db78)) by Dain Cilke (dain.cilke@gmail.com)
* **cli:** integrate manifest generation into deploy action ([8081071](https://github.com/sanity-io/sanity/commit/8081071e54f9dac24d7d827f89148d9bf6c69f8c)) by Dain Cilke (dain.cilke@gmail.com)
* **cli:** support external studio undeploy ([079e502](https://github.com/sanity-io/sanity/commit/079e50238fe891cc7a09f283d35d9c4160587c1d)) by Dain Cilke (dain.cilke@gmail.com)
* **core:** add media library internal config ([#12009](https://github.com/sanity-io/sanity/issues/12009)) ([394e246](https://github.com/sanity-io/sanity/commit/394e2468154625a84914e66bf453a209f607fcd4)) by James Warner (jmswrnr@users.noreply.github.com)
* **core:** adds `path` to `ConditionalPropertyCallbackContext` ([#11947](https://github.com/sanity-io/sanity/issues/11947)) ([f16a4aa](https://github.com/sanity-io/sanity/commit/f16a4aa9b83365119fc881a4e00eb16e5b2c9f66)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** display validation icon for groups ([#11995](https://github.com/sanity-io/sanity/issues/11995)) ([7916f6e](https://github.com/sanity-io/sanity/commit/7916f6efbee5c4107b1c0d02a9281037108779e3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* display incoming references  ([#10761](https://github.com/sanity-io/sanity/issues/10761)) ([e5a945b](https://github.com/sanity-io/sanity/commit/e5a945bab4444077ef6e71a4b98b59f7250e6a02)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* Filter release documents by action and validity ([#11980](https://github.com/sanity-io/sanity/issues/11980)) ([0863e2f](https://github.com/sanity-io/sanity/commit/0863e2fe2afd65b7599bcf4f10bd9a07547590be)) by Jordan Lawrence (jordanl17@me.com)
* **form:** add disableNew option for image fields ([#12004](https://github.com/sanity-io/sanity/issues/12004)) ([0e650d3](https://github.com/sanity-io/sanity/commit/0e650d31b55d4a61bb02511626667b28f7497e47)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **release-notes:** import images from release notes section ([#12001](https://github.com/sanity-io/sanity/issues/12001)) ([4684114](https://github.com/sanity-io/sanity/commit/46841149812fec7aede45873d696d37ef9d53e25)) by Bjørge Næss (bjoerge@gmail.com)

### Bug Fixes

* add chunking for observeFields (previews) as to avoid very large requests that hang requests ([#11974](https://github.com/sanity-io/sanity/issues/11974)) ([e887b6b](https://github.com/sanity-io/sanity/commit/e887b6b30428ba361f64f46fd5989bfd0634ec26)) by RitaDias (rita@sanity.io)
* **ci:** automate release notes publishing ([#11998](https://github.com/sanity-io/sanity/issues/11998)) ([7bb598c](https://github.com/sanity-io/sanity/commit/7bb598cbe68e1ac0166c6cfa5a4d694e955452c8)) by Bjørge Næss (bjoerge@gmail.com)
* **ci:** report inflight-release-check as passed on release PR ([#12073](https://github.com/sanity-io/sanity/issues/12073)) ([5185f79](https://github.com/sanity-io/sanity/commit/5185f79feca00ded47f60182d4f876836981df89)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** live editable document creation issue ([#12034](https://github.com/sanity-io/sanity/issues/12034)) ([7527a59](https://github.com/sanity-io/sanity/commit/7527a59050d877a040905127183026b2e8b76f36)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @sanity/insert-menu to v3.0.4 ([#12068](https://github.com/sanity-io/sanity/issues/12068)) ([7cee117](https://github.com/sanity-io/sanity/commit/7cee117d789b301c30d5659707079fd5ffca6f23)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to ^4.0.3 ([#12069](https://github.com/sanity-io/sanity/issues/12069)) ([2f0fef8](https://github.com/sanity-io/sanity/commit/2f0fef894499a80b8317b372ac333cddc329016f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/ui to ^3.1.11 ([#12023](https://github.com/sanity-io/sanity/issues/12023)) ([d8dfb8a](https://github.com/sanity-io/sanity/commit/d8dfb8ac7ea3561cbd46698e97ab100aa8b31e50)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.26.0 ([#11983](https://github.com/sanity-io/sanity/issues/11983)) ([052b6a2](https://github.com/sanity-io/sanity/commit/052b6a23074c4b3541665dd21b0680ef29626a1e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11994](https://github.com/sanity-io/sanity/issues/11994)) ([6aaca20](https://github.com/sanity-io/sanity/commit/6aaca20134277be6d497ce99d41b428c23a655bf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#12032](https://github.com/sanity-io/sanity/issues/12032)) ([0a871ec](https://github.com/sanity-io/sanity/commit/0a871eccac41eecbd4e09a6e099e89622f052cab)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* discard dialog show the correct document preview ([#11992](https://github.com/sanity-io/sanity/issues/11992)) ([76d2f0f](https://github.com/sanity-io/sanity/commit/76d2f0ffd6d7b08dab9db050612f64b8aa9b3df7)) by RitaDias (rita@sanity.io)
* **gdr:** use resource-config param to resolve GDRs+ML ([#12075](https://github.com/sanity-io/sanity/issues/12075)) ([9f35ba7](https://github.com/sanity-io/sanity/commit/9f35ba7c192f3e64a7d1b750f8d4ee5b17ec84b8)) by Sindre Gulseth (sgulseth@gmail.com)
* optimize styled components when publishing to npm ([#12047](https://github.com/sanity-io/sanity/issues/12047)) ([550d11e](https://github.com/sanity-io/sanity/commit/550d11e8fec21a0fb950e0830ea95678dec38c20)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* resolve lint errors and update exports snapshot ([9326b6a](https://github.com/sanity-io/sanity/commit/9326b6adb5327e0292b7d36651877df7587bac76)) by Dain Cilke (dain.cilke@gmail.com)
* safari was requiring two clicks to be done on an array item before dialog would open ([#11981](https://github.com/sanity-io/sanity/issues/11981)) ([2060158](https://github.com/sanity-io/sanity/commit/2060158cdd9985025aca17faf1ded551e34ef4e5)) by RitaDias (rita@sanity.io)
* **sanity:** `getDocumentAtRevision` error when no document found ([#12042](https://github.com/sanity-io/sanity/issues/12042)) ([4b8ca5d](https://github.com/sanity-io/sanity/commit/4b8ca5d5d0c353d95785818eea3ec9a49283c2cf)) by Ash (ash@sanity.io)
* **structure:** hide documents to be unpublished from link document list ([#12055](https://github.com/sanity-io/sanity/issues/12055)) ([c0a5f50](https://github.com/sanity-io/sanity/commit/c0a5f506d58862417e8439405b321ce43508504f)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **studio:** cache KeyValueStore by client instead of workspace ([#11801](https://github.com/sanity-io/sanity/issues/11801)) ([ec70fa6](https://github.com/sanity-io/sanity/commit/ec70fa614451e2f11931ea43a40f8aff7be96215)) by David Annez (david.annez@gmail.com)

## [5.7.0](https://github.com/sanity-io/sanity/compare/v5.6.0...v5.7.0) (2026-01-27)

### Features

* **form:** add clear button to radio select inputs ([#11936](https://github.com/sanity-io/sanity/issues/11936)) ([c596726](https://github.com/sanity-io/sanity/commit/c59672612e25b557677dbc62989bc9874e0c928e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **sanity:** add `time` param support to `getDocumentAtRevision` ([#11969](https://github.com/sanity-io/sanity/issues/11969)) ([d517d2a](https://github.com/sanity-io/sanity/commit/d517d2afdc8bedc76dc84f3ffe048923bf87ee14)) by Ash (ash@sanity.io)
* **sanity:** add utilities for flattening Sanity data ([e3a39ba](https://github.com/sanity-io/sanity/commit/e3a39ba9f065cb013bac2f9613488be27204c7c1)) by Ash (ash@sanity.io)
* **sanity:** collator for all divergences in a subject-upstream pair ([#11953](https://github.com/sanity-io/sanity/issues/11953)) ([dc2bd87](https://github.com/sanity-io/sanity/commit/dc2bd872b2ab8c9cf74e3d6c487dae5d28f935ab)) by Ash (ash@sanity.io)
* **sanity:** tooling to find divergences between versions of a document ([4f55661](https://github.com/sanity-io/sanity/commit/4f5566181ee1248614b3d64b2b7e08f1bc7d5abe)) by Ash (ash@sanity.io)

### Bug Fixes

* build range decorations when comments changes ([bd54cbc](https://github.com/sanity-io/sanity/commit/bd54cbcfa6b1b5c6f1102eaa6498f3713d57e753)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **cli:** add early validation for missing dataset in migration command ([#11914](https://github.com/sanity-io/sanity/issues/11914)) ([34215df](https://github.com/sanity-io/sanity/commit/34215dfc3a4cb2100276aa03e526292ea73302ec)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **cli:** pass CLI project ID to runtime-cli if set, upgrade runtime-cli ([#11971](https://github.com/sanity-io/sanity/issues/11971)) ([539bf4a](https://github.com/sanity-io/sanity/commit/539bf4aca764cab92e0a0241a78eb599844f7d26)) by Espen Hovlandsdal (espen@hovlandsdal.com)
* **core:** preserve marks and markdefs when pasting pte fields ([#11967](https://github.com/sanity-io/sanity/issues/11967)) ([4f6b9ad](https://github.com/sanity-io/sanity/commit/4f6b9ad18d0f6fd3bd98ab61282315f74fdbf626)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** support copy pasting anonymous objects ([#11961](https://github.com/sanity-io/sanity/issues/11961)) ([9d76742](https://github.com/sanity-io/sanity/commit/9d76742237e55595e6f40b00f160d79589ab07ae)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use `EditorProvider` in comment input ([4a95498](https://github.com/sanity-io/sanity/commit/4a9549804b95acc3f9303adf55fe9a4c3528fee5)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **deps:** update dependency @sanity/client to ^7.14.1 ([#11954](https://github.com/sanity-io/sanity/issues/11954)) ([41911d5](https://github.com/sanity-io/sanity/commit/41911d590008a008244586372465ea2cf903045c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency motion to ^12.27.1 ([#11932](https://github.com/sanity-io/sanity/issues/11932)) ([eb8b2a9](https://github.com/sanity-io/sanity/commit/eb8b2a98877069fca7b0a52fc7da613c290cc2e6)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11955](https://github.com/sanity-io/sanity/issues/11955)) ([70d4df1](https://github.com/sanity-io/sanity/commit/70d4df195e7f2e719e99147c6f9fef9697465881)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11960](https://github.com/sanity-io/sanity/issues/11960)) ([a85174d](https://github.com/sanity-io/sanity/commit/a85174dcdcd3c275fd15e956ad1ebe9f0c236675)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11973](https://github.com/sanity-io/sanity/issues/11973)) ([96a4200](https://github.com/sanity-io/sanity/commit/96a420065fc18d70e4b17a5b0eb150007554cbce)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **portable-text:** combine multiple annotation popovers into single popover ([#11923](https://github.com/sanity-io/sanity/issues/11923)) ([b470e3b](https://github.com/sanity-io/sanity/commit/b470e3b5a96cd8d0eab8c3311fed09816fad30ef)) by RitaDias (rita@sanity.io)
* **sanity:** ensure dedicated `SlugFieldDiff` is used when diffing slugs ([4cbc5e6](https://github.com/sanity-io/sanity/commit/4cbc5e677e6fa0b1f08104861bbf31967a615b4f)) by Ash (ash@sanity.io)
* **structure:** validation inspector displays path titles for anonymous objects ([#11968](https://github.com/sanity-io/sanity/issues/11968)) ([1af0e35](https://github.com/sanity-io/sanity/commit/1af0e35075376ec57432ce470a10e3a22b6622aa)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **studio:** improve PTE copy/paste clipboard formats ([#11762](https://github.com/sanity-io/sanity/issues/11762)) ([a37c717](https://github.com/sanity-io/sanity/commit/a37c71727dedc0ca29acce33b0d4ae663719a8c2)) by David Annez (david.annez@gmail.com)
* update response handling to return latest package version ([#11910](https://github.com/sanity-io/sanity/issues/11910)) ([a4d65c4](https://github.com/sanity-io/sanity/commit/a4d65c46946fb1d77fa1c99d82c2037e69ae2540)) by Jordan Lawrence (jordanl17@me.com)

## [5.6.0](https://github.com/sanity-io/sanity/compare/v5.5.0...v5.6.0) (2026-01-22)

### Features

* add "Open in Source" functionality for assets ([#11826](https://github.com/sanity-io/sanity/issues/11826)) ([eaa8f24](https://github.com/sanity-io/sanity/commit/eaa8f24571dfb2ed9b5f8a402e019c3225df1510)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* add private asset indicator and improve access policy error handling ([#11898](https://github.com/sanity-io/sanity/issues/11898)) ([e07b43c](https://github.com/sanity-io/sanity/commit/e07b43c679695438dd814fda64e286bde9dabbb8)) by Rupert Dunk (rupert@rupertdunk.com)
* **codegen:** type utilities for generated types ([#11733](https://github.com/sanity-io/sanity/issues/11733)) ([682b253](https://github.com/sanity-io/sanity/commit/682b253b5bdb4656ae72ade9e97e3be0d7b2bd15)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **core:** add `renderMembers` function to objects and fieldsets ([#11205](https://github.com/sanity-io/sanity/issues/11205)) ([452d356](https://github.com/sanity-io/sanity/commit/452d3560c978ac8566848bbc2ce09a5c2cb0e383)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **schema:** export DEFAULT_ANNOTATIONS and DEFAULT_DECORATORS ([#11916](https://github.com/sanity-io/sanity/issues/11916)) ([55cdb56](https://github.com/sanity-io/sanity/commit/55cdb56d5f55a6c21a38bd44ec45e69637bbffc6)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

### Bug Fixes

* allow custom object types as portable text annotations ([#11893](https://github.com/sanity-io/sanity/issues/11893)) ([968005f](https://github.com/sanity-io/sanity/commit/968005f6f1fad512269c3b18787a9e0f25d76ea7)) by RitaDias (rita@sanity.io)
* **cli:** normalize path separators for cross-platform compatibility ([#11874](https://github.com/sanity-io/sanity/issues/11874)) ([4af3ead](https://github.com/sanity-io/sanity/commit/4af3ead9281096ec32a6f9b03f88769eb58e9fcf)) by Jordan Lawrence (jordanl17@me.com)
* **comments:** store fragment selection when user opens comment input popover ([#11873](https://github.com/sanity-io/sanity/issues/11873)) ([bee339e](https://github.com/sanity-io/sanity/commit/bee339e296824539eabd018ee25511fcfc0ad313)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** allows setting timezone to dates arrays ([#11866](https://github.com/sanity-io/sanity/issues/11866)) ([85bd87b](https://github.com/sanity-io/sanity/commit/85bd87b36f68b125a5fd6cbe1181f257318a4af8)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** deprecated label and validation icons overlap ([#11887](https://github.com/sanity-io/sanity/issues/11887)) ([b172d83](https://github.com/sanity-io/sanity/commit/b172d832c7dc01f2fa94a2dd60696ff0b98a9abb)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** ensure PTE custom toolbar icons use correct color token ([#11899](https://github.com/sanity-io/sanity/issues/11899)) ([c46592c](https://github.com/sanity-io/sanity/commit/c46592cbd4db3ab1a9e3b8d1e8964ed76ce9744e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** handle null token in auth store ([#11888](https://github.com/sanity-io/sanity/issues/11888)) ([4a1b7fb](https://github.com/sanity-io/sanity/commit/4a1b7fbf278b6ac4762be989066b9295d434d252)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** infinite redirects when trying to log in via SSO ([#11825](https://github.com/sanity-io/sanity/issues/11825)) ([ccbf72c](https://github.com/sanity-io/sanity/commit/ccbf72c79bc6cf13b708c3b3965a95540b5473c7)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** remove dependency on PTE-exported Sanity types ([#11920](https://github.com/sanity-io/sanity/issues/11920)) ([7a74337](https://github.com/sanity-io/sanity/commit/7a74337c9dcefa57023777cff13570c81330c991)) by Christian Grøngaard (christian.groengaard@sanity.io)
* **core:** show timezone button when `allowTimeZoneSwitch` is true ([#11861](https://github.com/sanity-io/sanity/issues/11861)) ([25ee194](https://github.com/sanity-io/sanity/commit/25ee19461bb5c43ce9970ac5d34cd197ceb7e259)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** split creation event from mutation when editing drafts ([#11379](https://github.com/sanity-io/sanity/issues/11379)) ([bd3ebc3](https://github.com/sanity-io/sanity/commit/bd3ebc3bb27a59062576a8350b88d968f8bab177)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** Update babel monorepo to ^7.28.6 ([#11876](https://github.com/sanity-io/sanity/issues/11876)) ([c86d4fb](https://github.com/sanity-io/sanity/commit/c86d4fb25421e864811dd09eae520d7d7d54a50f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update CodeMirror ([#11881](https://github.com/sanity-io/sanity/issues/11881)) ([ac97e5c](https://github.com/sanity-io/sanity/commit/ac97e5c98d45111af3d61155cf185e003c7a179a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.14.0 ([#11908](https://github.com/sanity-io/sanity/issues/11908)) ([d4f6c5b](https://github.com/sanity-io/sanity/commit/d4f6c5be18e2f59130591156adea0e5ef0e28d43)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency motion to ^12.26.2 ([#11882](https://github.com/sanity-io/sanity/issues/11882)) ([8ee723c](https://github.com/sanity-io/sanity/commit/8ee723cc1f3c470cad143f441342c01a4c49ddbd)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency xstate to ^5.25.1 ([#11877](https://github.com/sanity-io/sanity/issues/11877)) ([977742e](https://github.com/sanity-io/sanity/commit/977742eba84c7beeecfa2c89fcf0c06c3d59aa08)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11868](https://github.com/sanity-io/sanity/issues/11868)) ([c95b22a](https://github.com/sanity-io/sanity/commit/c95b22a25b97b8e28af8caa378113873dae92042)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11912](https://github.com/sanity-io/sanity/issues/11912)) ([9c14402](https://github.com/sanity-io/sanity/commit/9c14402a54b45d51cfe016654a3f67d2adb9440a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* fixes issue with loading esm cli bin ([#11919](https://github.com/sanity-io/sanity/issues/11919)) ([ed4bb07](https://github.com/sanity-io/sanity/commit/ed4bb078514ff915ff23724e90d47d9a3e9efe65)) by Binoy Patel (me@binoy.io)
* prevent published from being treated as a release ([#11871](https://github.com/sanity-io/sanity/issues/11871)) ([536f75b](https://github.com/sanity-io/sanity/commit/536f75bcc128b1f950c97e96408e0bfdb52d30af)) by Jordan Lawrence (jordanl17@me.com)
* **pte:** widen annotation popover default width ([#11807](https://github.com/sanity-io/sanity/issues/11807)) ([e8c84fa](https://github.com/sanity-io/sanity/commit/e8c84faad9bed0fc0afdc8627807be393db10970)) by Eoin Falconer (eoin.falc@gmail.com)
* resolve private asset cors issues, skip access policy checks for unsupported auth modes ([#11901](https://github.com/sanity-io/sanity/issues/11901)) ([e60346d](https://github.com/sanity-io/sanity/commit/e60346d9681840081b68a03fe18ce34d8e3a737a)) by Rupert Dunk (rupert@rupertdunk.com)
* **structure:** omit system bundles from versions in reference banner ([#11911](https://github.com/sanity-io/sanity/issues/11911)) ([a71e88e](https://github.com/sanity-io/sanity/commit/a71e88e4cad2ff43eb5acb40ab5bf68972b193ba)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **studio:** handle emoji characters in workspace icon generation ([a6077fa](https://github.com/sanity-io/sanity/commit/a6077fab4288181d84cecbe6a83e996cc34c7ed4)) by Dain Cilke (dain.cilke@gmail.com)
* **test:** symlink in monorepo deps after installing ([#11905](https://github.com/sanity-io/sanity/issues/11905)) ([2b9d06b](https://github.com/sanity-io/sanity/commit/2b9d06bb967b1250a7ed6dab6a81a02c1f713c84)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [5.5.0](https://github.com/sanity-io/sanity/compare/v5.4.0...v5.5.0) (2026-01-19)

### Features

* **cli:** allow configuring schemaExtraction in sanity.cli.ts ([#11824](https://github.com/sanity-io/sanity/issues/11824)) ([6fd624b](https://github.com/sanity-io/sanity/commit/6fd624bc580db4886fa23a087774034fc8f49bd5)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **cli:** watch mode for schema extraction ([#11748](https://github.com/sanity-io/sanity/issues/11748)) ([459e8ca](https://github.com/sanity-io/sanity/commit/459e8ca4ec3b1814a897bd2092273d9f3ef0db6a)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **sanity:** add Vite plugin for automatic schema extraction ([#11760](https://github.com/sanity-io/sanity/issues/11760)) ([e0f78da](https://github.com/sanity-io/sanity/commit/e0f78dacbbaf9a6df10941ae821ef1ebe84e56f4)) by Kristoffer Brabrand (kristoffer@brabrand.no)

### Bug Fixes

* **cli:** upgrade `@sanity/export` to v6.0.3 ([#11862](https://github.com/sanity-io/sanity/issues/11862)) ([85b2f91](https://github.com/sanity-io/sanity/commit/85b2f91b6a39fe621ded3ec1b17a1fa41a7e40a0)) by Espen Hovlandsdal (espen@hovlandsdal.com)
* **core:** enable autofocus on reference input ([#11853](https://github.com/sanity-io/sanity/issues/11853)) ([753fce6](https://github.com/sanity-io/sanity/commit/753fce6e04796b80adc85fdeb7ca4ddc50ab51a6)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** reverts use `<Link>` for workspace switching ([#11844](https://github.com/sanity-io/sanity/issues/11844)) ([#11859](https://github.com/sanity-io/sanity/issues/11859)) ([f87a5eb](https://github.com/sanity-io/sanity/commit/f87a5ebc4d01f6e934dbbee8895079768359e74f)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use `<Link>` for workspace switching ([#11844](https://github.com/sanity-io/sanity/issues/11844)) ([c89364c](https://github.com/sanity-io/sanity/commit/c89364ca06fe84eba1134043cf27bbcfc410ec16)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @sanity/export to ^6.0.5 ([#11863](https://github.com/sanity-io/sanity/issues/11863)) ([489ff2b](https://github.com/sanity-io/sanity/commit/489ff2b21b6031b0daa71aad94989beb4ed1f2bb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/import to ^4.1.0 ([#11865](https://github.com/sanity-io/sanity/issues/11865)) ([c59cb53](https://github.com/sanity-io/sanity/commit/c59cb53a9a65878b4f2d22671086e4037296b6d3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update linters ([#11836](https://github.com/sanity-io/sanity/issues/11836)) ([1291698](https://github.com/sanity-io/sanity/commit/129169868d55217252c047fbe6b09dfda9d116ff)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **docs:** Fix add function --example handling for media library function ([#11847](https://github.com/sanity-io/sanity/issues/11847)) ([14a2811](https://github.com/sanity-io/sanity/commit/14a281125411aa977224e62ee0543ad302a33112)) by Bram Doppen (bramdoppen@gmail.com)
* issue where padding bottom was too close to dialog, fixes [#11849](https://github.com/sanity-io/sanity/issues/11849) ([#11852](https://github.com/sanity-io/sanity/issues/11852)) ([e4e9c54](https://github.com/sanity-io/sanity/commit/e4e9c54721dcfcd1768ab3f3a55b9d8cf6a4402e)) by RitaDias (rita@sanity.io)
* missed scheduled draft ([#11860](https://github.com/sanity-io/sanity/issues/11860)) ([56c9ab0](https://github.com/sanity-io/sanity/commit/56c9ab039db83a55a177877f13b531e8c1314dd3)) by Jordan Lawrence (jordanl17@me.com)
* prevent disableTransition prop from leaking to DOM ([#11775](https://github.com/sanity-io/sanity/issues/11775)) ([bd6774b](https://github.com/sanity-io/sanity/commit/bd6774b4198f3450c2fb54ee4355619ee8dd43b1)) by Eoin Falconer (eoin.falc@gmail.com)

## [5.4.0](https://github.com/sanity-io/sanity/compare/v5.3.1...v5.4.0) (2026-01-15)

### Features

* add media-library-auto-alt-text function example ([#11337](https://github.com/sanity-io/sanity/issues/11337)) ([85d983d](https://github.com/sanity-io/sanity/commit/85d983d3e8752502dfda6253df5b2e176d92392a)) by Bram Doppen (bramdoppen@gmail.com)
* edit content of scheduled drafts ([#11692](https://github.com/sanity-io/sanity/issues/11692)) ([8862905](https://github.com/sanity-io/sanity/commit/8862905e93f3af7779f792b9c3d455573c5a88d7)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **core:** dont crash when image url string is passed to preview ([#6727](https://github.com/sanity-io/sanity/issues/6727)) ([98f37b8](https://github.com/sanity-io/sanity/commit/98f37b8b6656757d8babdb6fe0368c477cd33ba5)) by Fred Carlsen (fred@sjelfull.no)
* correct navigation function call for confirming drafts ([#11842](https://github.com/sanity-io/sanity/issues/11842)) ([d0c01bd](https://github.com/sanity-io/sanity/commit/d0c01bd2382cee42af4033ed2660639b4b9d37b0)) by Jordan Lawrence (jordanl17@me.com)
* correcting mismatch with filtering of CI for examples only changes ([#11831](https://github.com/sanity-io/sanity/issues/11831)) ([5cdb49d](https://github.com/sanity-io/sanity/commit/5cdb49da73f4ff1dd1155f276de3ee884875df77)) by Jordan Lawrence (jordanl17@me.com)
* **deps:** update dependency @sanity/import to ^4.0.4 ([#11832](https://github.com/sanity-io/sanity/issues/11832)) ([8bea477](https://github.com/sanity-io/sanity/commit/8bea477b3787d29c03fcd79dc9b7d1c22de6bdaa)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11837](https://github.com/sanity-io/sanity/issues/11837)) ([6444584](https://github.com/sanity-io/sanity/commit/64445845eb189a8989e77b9110bbde3817e635db)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **structure:** ensure close button is rightmost in split pane toolbar ([#11817](https://github.com/sanity-io/sanity/issues/11817)) ([2e8e974](https://github.com/sanity-io/sanity/commit/2e8e9740a0cf1b06faf96090c4fb46711fb530bc)) by Eoin Falconer (eoin.falc@gmail.com)
* **vision:** allow custom domains for saved query recall ([#11821](https://github.com/sanity-io/sanity/issues/11821)) ([dbf74ce](https://github.com/sanity-io/sanity/commit/dbf74ce69a60343f1cbae8217dbde75be21bd5f3)) by Eoin Falconer (eoin.falc@gmail.com)

## [5.3.1](https://github.com/sanity-io/sanity/compare/v5.3.0...v5.3.1) (2026-01-14)

### Bug Fixes

* **core:** use intent links for content releases navigation ([#11828](https://github.com/sanity-io/sanity/issues/11828)) ([79afdaa](https://github.com/sanity-io/sanity/commit/79afdaa626b6461db733ad5c1878ee91eba5f883)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)

## [5.3.0](https://github.com/sanity-io/sanity/compare/v5.2.0...v5.3.0) (2026-01-13)

### Features

* add thumbhash supoort for media-library ([76cda08](https://github.com/sanity-io/sanity/commit/76cda086e3138af4a28cda127260f0b530d9c3dc)) by Dan Groves (dan.groves@sanity.io)
* **cli:** add mcp configuration support for zed and opencode ([#11747](https://github.com/sanity-io/sanity/issues/11747)) ([30121a5](https://github.com/sanity-io/sanity/commit/30121a5fe05f02f7588932a0327dfc848d7c0c1e)) by James Woods (jwwoods01@gmail.com)
* enable private asset selection from media library ([#11756](https://github.com/sanity-io/sanity/issues/11756)) ([38a9241](https://github.com/sanity-io/sanity/commit/38a92411651da35566021383b48345479fc62051)) by Rupert Dunk (rupert@rupertdunk.com)
* GRO-4157 dynamic mcp init prompt ([#11555](https://github.com/sanity-io/sanity/issues/11555)) ([e6f4485](https://github.com/sanity-io/sanity/commit/e6f4485432679942aa53155363c97b73d77aceda)) by Matthew Ritter (matthew.ritter@sanity.io)
* log schema errors on extraction failure ([#10573](https://github.com/sanity-io/sanity/issues/10573)) ([321e16b](https://github.com/sanity-io/sanity/commit/321e16bb627ec55d82880a0bcb39ce686cac4309)) by Simeon Griggs (simeon@hey.com)
* make enhancedObjectDialog opt out ([#11802](https://github.com/sanity-io/sanity/issues/11802)) ([66ca5b8](https://github.com/sanity-io/sanity/commit/66ca5b8ef6ba0959a605665e553e28b6db0dafa8)) by RitaDias (rita@sanity.io)
* **sanity:** omit search weights when possible ([#7751](https://github.com/sanity-io/sanity/issues/7751)) ([921efbb](https://github.com/sanity-io/sanity/commit/921efbbd4d90fdbdae94cc2a3e31771134f94e11)) by Ash (ash@sanity.io)
* **telemetry:** add Core Web Vitals tracking via web-vitals library ([#11765](https://github.com/sanity-io/sanity/issues/11765)) ([39d0134](https://github.com/sanity-io/sanity/commit/39d01342e22e750ed78b8593a48379478fa5ef21)) by David Annez (david.annez@gmail.com)
* **telemetry:** enrich events with Studio context ([#11764](https://github.com/sanity-io/sanity/issues/11764)) ([e6011be](https://github.com/sanity-io/sanity/commit/e6011be4ca845fa247364d4be338f5bad0f3c957)) by David Annez (david.annez@gmail.com)
* **typegen:** add ArrayOf utility type for inline object array members ([#11698](https://github.com/sanity-io/sanity/issues/11698)) ([895b404](https://github.com/sanity-io/sanity/commit/895b404899446c0dec5c5e130cefaa645fccde3e)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* warning on releases overview when release has missed intended publish date ([#11631](https://github.com/sanity-io/sanity/issues/11631)) ([128296c](https://github.com/sanity-io/sanity/commit/128296cc04fff5fccc83ccc94fc18e54b4cd21f7)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **cli:** improve autoUpdates config upgrade message ([#10778](https://github.com/sanity-io/sanity/issues/10778)) ([5e9770d](https://github.com/sanity-io/sanity/commit/5e9770d0324b351fdefe5a3100c3042dce144abe)) by Filips Alpe (filips.alpe@gmail.com)
* **cli:** prevent file descriptor leak in dataset import ([#11687](https://github.com/sanity-io/sanity/issues/11687)) ([fd350a7](https://github.com/sanity-io/sanity/commit/fd350a7a7120066ba5f1f28b55ba2e7e7d50c6c1)) by Ryan Bonial (4294665+ryanbonial@users.noreply.github.com)
* **deps:** update dependency @sanity/import to ^4.0.3 ([#11735](https://github.com/sanity-io/sanity/issues/11735)) ([679e81d](https://github.com/sanity-io/sanity/commit/679e81db41de790edfe0f23ab2a4d0a00898b838)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency motion to ^12.25.0 ([#11791](https://github.com/sanity-io/sanity/issues/11791)) ([daa18a1](https://github.com/sanity-io/sanity/commit/daa18a10b4f7553067848818bb8f6ea489a9385b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update linters ([#11769](https://github.com/sanity-io/sanity/issues/11769)) ([c9adfbc](https://github.com/sanity-io/sanity/commit/c9adfbc259d22a42743638dcfa2dec0be8fa8a49)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11740](https://github.com/sanity-io/sanity/issues/11740)) ([62a63ce](https://github.com/sanity-io/sanity/commit/62a63ce9a2dcfcc88d899506bb4532b92e7d3c42)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11797](https://github.com/sanity-io/sanity/issues/11797)) ([7b25305](https://github.com/sanity-io/sanity/commit/7b25305a78cd93a4bbe1c2cecbcfad5161492349)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **form:** sanitize timezone storage keys for datetime fields in arrays ([#11683](https://github.com/sanity-io/sanity/issues/11683)) ([0e6cb20](https://github.com/sanity-io/sanity/commit/0e6cb2006df29cf52a855417b8b3bbc408b28cdb)) by David Annez (david.annez@gmail.com)
* **linter:** enforce no unnecessary boolean literal comparisons ([#11734](https://github.com/sanity-io/sanity/issues/11734)) ([94462ad](https://github.com/sanity-io/sanity/commit/94462ad1f55c5a809f030ab21db5148bf921726b)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **presentation:** render "Presentation" in page title when `options.title` is not passed ([#11784](https://github.com/sanity-io/sanity/issues/11784)) ([d3adc83](https://github.com/sanity-io/sanity/commit/d3adc837a12cf95166b4a24702e013492c482dc5)) by Adam Söderström (adam.soderstrom@noaignite.com)
* removing the deletion of drafts when creating scheduled drafts ([#11744](https://github.com/sanity-io/sanity/issues/11744)) ([c54a29e](https://github.com/sanity-io/sanity/commit/c54a29e8a10dd4f3f063b5a58cca00d9057c5000)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** add support for anonymous versions in `useDocumentIdStack` ([a56390d](https://github.com/sanity-io/sanity/commit/a56390dcaa0a7a9540fe2fa8ec47cfefc4c7ec5e)) by Ash (ash@sanity.io)
* **sanity:** allow display of anonymous versions in document comparison tool ([3bd4bf3](https://github.com/sanity-io/sanity/commit/3bd4bf3b14f7460778936cb22a7eb21173049ed8)) by Ash (ash@sanity.io)
* **sanity:** read-only state of documents outside of globally selected anonymous bundle ([0b83c89](https://github.com/sanity-io/sanity/commit/0b83c899a022f1ba801eff37b58fbedf646bd0ce)) by Ash (ash@sanity.io)
* **sanity:** render `DocumentNotInReleaseBanner` when document has no version in globally selected anonymous bundle ([0a14cf5](https://github.com/sanity-io/sanity/commit/0a14cf5d42b62c0edcfefeb7d01910aef31235a7)) by Ash (ash@sanity.io)
* **sanity:** support anonymous bundles in `DocumentNotInReleaseBanner` ([1beb5f0](https://github.com/sanity-io/sanity/commit/1beb5f080699c064b7f85645af200b1842a68c51)) by Ash (ash@sanity.io)
* scheduled versions disable delete action ([#11798](https://github.com/sanity-io/sanity/issues/11798)) ([43fa9d9](https://github.com/sanity-io/sanity/commit/43fa9d948aaac2a0b5b53ceb3e395bb52141b47e)) by Jordan Lawrence (jordanl17@me.com)
* **structure:** thread sortOrder through preview system for viewOptions ([#11625](https://github.com/sanity-io/sanity/issues/11625)) ([a87917c](https://github.com/sanity-io/sanity/commit/a87917c6e47fc51a003348dbab1abf304005c9ce)) by David Annez (david.annez@gmail.com)
* **typegen:** preserve non-identifier keys in generated types ([#11736](https://github.com/sanity-io/sanity/issues/11736)) ([eaccb7a](https://github.com/sanity-io/sanity/commit/eaccb7a9502e9d50b60dc77f08ecac99c4688270)) by Noah Gentile (nkgentile@users.noreply.github.com)
* **vitest:** migrate Date, Worker, and Observer mocking to v4 API ([#11754](https://github.com/sanity-io/sanity/issues/11754)) ([20caed1](https://github.com/sanity-io/sanity/commit/20caed10d7531f82167354623799371e580449be)) by Copilot (198982749+Copilot@users.noreply.github.com)

## [5.2.0](https://github.com/sanity-io/sanity/compare/v5.1.0...v5.2.0) (2026-01-07)

### Features

* add @sanity/sveltekit support to typegen query detection ([#11659](https://github.com/sanity-io/sanity/issues/11659)) ([7926a94](https://github.com/sanity-io/sanity/commit/7926a94242ae4d99cf51f0b6fbacb941aab34717)) by Copilot (198982749+Copilot@users.noreply.github.com)
* add Scheduled Drafts menu item to the releases navbar ([#11202](https://github.com/sanity-io/sanity/issues/11202)) ([2b27e00](https://github.com/sanity-io/sanity/commit/2b27e008d30c5eb684137ce8b370bad67996bb2a)) by Jordan Lawrence (jordanl17@me.com)
* **codegen:** support `.svelte` files ([#11677](https://github.com/sanity-io/sanity/issues/11677)) ([268ce47](https://github.com/sanity-io/sanity/commit/268ce47759038e1fdbbc8ba6773932999fafb75f)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **core:** weight `mode` param on create intents ([#5762](https://github.com/sanity-io/sanity/issues/5762)) ([8dae9a7](https://github.com/sanity-io/sanity/commit/8dae9a7bb632ce67a2d777b40a0f051c041dd5d4)) by Rupert Dunk (rupert@rupertdunk.com)
* update ResourceMenu studio version and registration ([#11520](https://github.com/sanity-io/sanity/issues/11520)) ([6b48277](https://github.com/sanity-io/sanity/commit/6b482776044f7be5b057578e6c95b5fe63703c89)) by Dain Cilke (dain.cilke@gmail.com)

### Bug Fixes

* **cli:** update init output docs command text ([#10074](https://github.com/sanity-io/sanity/issues/10074)) ([ad1c6bd](https://github.com/sanity-io/sanity/commit/ad1c6bd7065820824e333395194c7a486a9a06a3)) by Mark Michon (mark.michon@sanity.io)
* **codegen,cli:** handle CSS imports when require(esm) happens ([#11701](https://github.com/sanity-io/sanity/issues/11701)) ([8be4aa6](https://github.com/sanity-io/sanity/commit/8be4aa6b54f91e8c012782cf969fdb55c9a0c473)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **codegen:** don't warn on `import.meta.hot` ([#11726](https://github.com/sanity-io/sanity/issues/11726)) ([7f5bae1](https://github.com/sanity-io/sanity/commit/7f5bae1a9bbfd109b1cb1950c2b70fde6e3bdce2)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **core:** ensure `_type` is set on initial value templates ([#11621](https://github.com/sanity-io/sanity/issues/11621)) ([0378dce](https://github.com/sanity-io/sanity/commit/0378dce55746936e8becf71e83d15bda97efaa2f)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** remove redundant tooltips from workspace menu buttons ([#11448](https://github.com/sanity-io/sanity/issues/11448)) ([a8977ac](https://github.com/sanity-io/sanity/commit/a8977ac71b23f7e77c9d8dac2e8681514753d66a)) by David Annez (david.annez@gmail.com)
* **deps:** Update CodeMirror ([#11640](https://github.com/sanity-io/sanity/issues/11640)) ([33ffc37](https://github.com/sanity-io/sanity/commit/33ffc37db7ba079320e1f55d25765bb78932701e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.14.0 ([#11691](https://github.com/sanity-io/sanity/issues/11691)) ([17d8aac](https://github.com/sanity-io/sanity/commit/17d8aac058bb96b2e3cd4083e5e4fdb21a7754c0)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/insert-menu to v3.0.3 ([#11643](https://github.com/sanity-io/sanity/issues/11643)) ([9360af4](https://github.com/sanity-io/sanity/commit/9360af46dbe0c944e4a7ddd916335be99e1f094c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to ^4.0.2 ([#11644](https://github.com/sanity-io/sanity/issues/11644)) ([1d62afb](https://github.com/sanity-io/sanity/commit/1d62afb00b8b64a70528a943cb67786011cc39f9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.24.1 ([#11679](https://github.com/sanity-io/sanity/issues/11679)) ([ce27be7](https://github.com/sanity-io/sanity/commit/ce27be7364e6d42bdff64d2477173f60d8274a62)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.25.0 ([#11697](https://github.com/sanity-io/sanity/issues/11697)) ([a58262b](https://github.com/sanity-io/sanity/commit/a58262bac5a0b7c97dad514910af6c9153a37426)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11641](https://github.com/sanity-io/sanity/issues/11641)) ([6f25f33](https://github.com/sanity-io/sanity/commit/6f25f33cfe282c00d5212435da58ebb78722fe27)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11673](https://github.com/sanity-io/sanity/issues/11673)) ([54c30a6](https://github.com/sanity-io/sanity/commit/54c30a65e5c9867753dc236e6f95bb7fd46c249c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11646](https://github.com/sanity-io/sanity/issues/11646)) ([795e94b](https://github.com/sanity-io/sanity/commit/795e94bb6f0e3dd13d6da4c6c71a214aa6b4f441)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11681](https://github.com/sanity-io/sanity/issues/11681)) ([72daebe](https://github.com/sanity-io/sanity/commit/72daebe63517d22764f68504d4cc2ec3830bafbf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **form:** pass current document to reference filter function ([#11619](https://github.com/sanity-io/sanity/issues/11619)) ([226d150](https://github.com/sanity-io/sanity/commit/226d15052b059378961d3823805854f7ff8421c8)) by Bjørge Næss (bjoerge@gmail.com)
* **preview:** don't show schema icon when prepare() omits media ([#11623](https://github.com/sanity-io/sanity/issues/11623)) ([2878756](https://github.com/sanity-io/sanity/commit/28787561e762cdf24d49428a07b523657da8e77d)) by David Annez (david.annez@gmail.com)
* **releases:** don't validate references in releases ([#11622](https://github.com/sanity-io/sanity/issues/11622)) ([dd33f5b](https://github.com/sanity-io/sanity/commit/dd33f5b97528b9db17acc23fec82d4cfc410cf27)) by Bjørge Næss (bjoerge@gmail.com)
* **releases:** hide 'Copy to' context menu if no drafts or releases ([#11616](https://github.com/sanity-io/sanity/issues/11616)) ([946d211](https://github.com/sanity-io/sanity/commit/946d211bd95b01d76677f7ca9841099c6321f6db)) by Bjørge Næss (bjoerge@gmail.com)
* remove `ServerStyleSheet` that snuck back in ([#11664](https://github.com/sanity-io/sanity/issues/11664)) ([029f8fe](https://github.com/sanity-io/sanity/commit/029f8fe061e8a2fbb0fedde3172e406a14003217)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **sanity:** allow display of anonymous versions in history inspector ([#11702](https://github.com/sanity-io/sanity/issues/11702)) ([26e2519](https://github.com/sanity-io/sanity/commit/26e2519a62f22ae9faf8264490f707e0d43e1e50)) by Ash (ash@sanity.io)
* **structure:** add clickOutside workaround for nested modals ([#11617](https://github.com/sanity-io/sanity/issues/11617)) ([49d252d](https://github.com/sanity-io/sanity/commit/49d252dcab140699590df3536efe9b6d08f0073f)) by Bjørge Næss (bjoerge@gmail.com)
* temporary pin `@sanity/migrate` to `5.1.0` ([#11656](https://github.com/sanity-io/sanity/issues/11656)) ([296c398](https://github.com/sanity-io/sanity/commit/296c398a3e135feeab60a4d764674ca95f3e6f52)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* timing issues causing test flake ([#11627](https://github.com/sanity-io/sanity/issues/11627)) ([3b99e38](https://github.com/sanity-io/sanity/commit/3b99e38be84bc3bbc4d8c9805e29b1bdb5855084)) by Jordan Lawrence (jordanl17@me.com)
* update recent search version to 3 and improve search sanitization logic ([#11620](https://github.com/sanity-io/sanity/issues/11620)) ([ee5da89](https://github.com/sanity-io/sanity/commit/ee5da89184902032f2f6ccbd937aa8c541344394)) by Jordan Lawrence (jordanl17@me.com)
* **validation:** extract Rule.fields() from nested Rule.all() and Rule.either() ([#11685](https://github.com/sanity-io/sanity/issues/11685)) ([ef88ca9](https://github.com/sanity-io/sanity/commit/ef88ca91c175356ce7ccb3edf9d0f5ed4a76f9b1)) by David Annez (david.annez@gmail.com)

## [5.1.0](https://github.com/sanity-io/sanity/compare/v5.0.1...v5.1.0) (2025-12-22)

### Features

* **liveManifest:** include bundleVersion in manifest ([9ceb4a9](https://github.com/sanity-io/sanity/commit/9ceb4a9033a4e4b00e6a416c8ef0a405ab3142da)) by Dain Cilke (dain.cilke@gmail.com)
* show selected non-release bundle name in global perspective menu ([#11600](https://github.com/sanity-io/sanity/issues/11600)) ([80653f7](https://github.com/sanity-io/sanity/commit/80653f7667cdbc59adacf021b02378aa23d4e439)) by Bjørge Næss (bjoerge@gmail.com)
* **structure:** display version chips for non-release-bundles ([#11601](https://github.com/sanity-io/sanity/issues/11601)) ([f441eea](https://github.com/sanity-io/sanity/commit/f441eea71bfa91b2249c6033d2912ec694fc522e)) by Bjørge Næss (bjoerge@gmail.com)
* support discard, delete, and duplicate for non-release versions ([#11603](https://github.com/sanity-io/sanity/issues/11603)) ([3b26890](https://github.com/sanity-io/sanity/commit/3b26890238ca1d98aa56134ab7665f87a2dfb676)) by Bjørge Næss (bjoerge@gmail.com)
* **toggles:** fail open schema and manifest toggles ([d496806](https://github.com/sanity-io/sanity/commit/d496806f046a27aa3223f4a4c73c14af5eae6b8d)) by Dain Cilke (dain.cilke@gmail.com)

### Bug Fixes

* **core:** test schema type for ancestor file and image type ([#11592](https://github.com/sanity-io/sanity/issues/11592)) ([d0a0119](https://github.com/sanity-io/sanity/commit/d0a0119c0c1e2e0b30401aa035b9399f4ee9fb42)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **core:** void selectedReleaseId if bundle is outside a release ([#11595](https://github.com/sanity-io/sanity/issues/11595)) ([e256c05](https://github.com/sanity-io/sanity/commit/e256c0554f42d014a932d4e997cc72c31d70989a)) by Bjørge Næss (bjoerge@gmail.com)
* **form:** re-enable editing liveEdit documents in published perspective ([#11608](https://github.com/sanity-io/sanity/issues/11608)) ([df4d72c](https://github.com/sanity-io/sanity/commit/df4d72cb4578254fab4d8c4810cf4d9282d15838)) by Bjørge Næss (bjoerge@gmail.com)
* **releases:** pass through publish action in version context ([#11598](https://github.com/sanity-io/sanity/issues/11598)) ([a0b47a9](https://github.com/sanity-io/sanity/commit/a0b47a9932b69daab414092d76a302d765996fab)) by Bjørge Næss (bjoerge@gmail.com)
* **sanity:** fix false positive reference validation for release docs ([#11610](https://github.com/sanity-io/sanity/issues/11610)) ([588a76d](https://github.com/sanity-io/sanity/commit/588a76d788347f805d7d8abe101fa70cdc863a7f)) by Bjørge Næss (bjoerge@gmail.com)
* show publish as primary action for non-release versions ([#11602](https://github.com/sanity-io/sanity/issues/11602)) ([a8190f8](https://github.com/sanity-io/sanity/commit/a8190f8806578b0bc2c0a8ef6ab7249465ffe832)) by Bjørge Næss (bjoerge@gmail.com)
* **structure:** consider selected bundle in "reference changed" check ([#11611](https://github.com/sanity-io/sanity/issues/11611)) ([44a8f20](https://github.com/sanity-io/sanity/commit/44a8f20193ac791b983bdb5763135f4bad55f1bd)) by Bjørge Næss (bjoerge@gmail.com)
* **structure:** fix unstyled text on publish action tooltip ([#11593](https://github.com/sanity-io/sanity/issues/11593)) ([e4b29c6](https://github.com/sanity-io/sanity/commit/e4b29c6836f5b56aced985c3b452d3becc1929cb)) by Bjørge Næss (bjoerge@gmail.com)
* **structure:** hide add to release banner for non-release versions ([#11596](https://github.com/sanity-io/sanity/issues/11596)) ([c2c10c1](https://github.com/sanity-io/sanity/commit/c2c10c15432161577da9e0717c00a01faad1f1f0)) by Bjørge Næss (bjoerge@gmail.com)
* **structure:** void documentActionProps.release for non-release versions ([#11597](https://github.com/sanity-io/sanity/issues/11597)) ([dfae558](https://github.com/sanity-io/sanity/commit/dfae558a35a0c92b518f474f6b485b11bcc642cc)) by Bjørge Næss (bjoerge@gmail.com)

## [5.0.1](https://github.com/sanity-io/sanity/compare/v5.0.0...v5.0.1) (2025-12-17)

### Bug Fixes

* **deps:** update dependency @portabletext/editor to v4 ([#11532](https://github.com/sanity-io/sanity/issues/11532)) ([36ff000](https://github.com/sanity-io/sanity/commit/36ff000eb5532b8b33421328c64fb68748d23c83)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/plugin-one-line to v4 ([#11536](https://github.com/sanity-io/sanity/issues/11536)) ([0cb97d9](https://github.com/sanity-io/sanity/commit/0cb97d93b812622ac6b6a5853c13de3fa6981c7e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/import to v4 ([#11553](https://github.com/sanity-io/sanity/issues/11553)) ([a4b0a3f](https://github.com/sanity-io/sanity/commit/a4b0a3fc3c99776703033078014779be0799bc89)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** update dependency @sanity/insert-menu to v3 ([#11559](https://github.com/sanity-io/sanity/issues/11559)) ([90dfc47](https://github.com/sanity-io/sanity/commit/90dfc4736f9392df473e6c0a3167f97fe619509f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/insert-menu to v3.0.2 ([#11572](https://github.com/sanity-io/sanity/issues/11572)) ([a6264ef](https://github.com/sanity-io/sanity/commit/a6264ef21b72407a9c60e106cc19e9578071fccb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to ^4.0.1 ([#11573](https://github.com/sanity-io/sanity/issues/11573)) ([e05918f](https://github.com/sanity-io/sanity/commit/e05918f39ac19e0fc59fb29d0c684bf527f195b1)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to v4 ([#11560](https://github.com/sanity-io/sanity/issues/11560)) ([f86089d](https://github.com/sanity-io/sanity/commit/f86089d40e6761ce3eb7a2e3c72ad537b9e50f8d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.24.0 ([#11534](https://github.com/sanity-io/sanity/issues/11534)) ([e1c46d5](https://github.com/sanity-io/sanity/commit/e1c46d572cf703090eb4fd224486ebab1e6b9b4b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency motion to ^12.23.26 ([#11552](https://github.com/sanity-io/sanity/issues/11552)) ([57c9f1c](https://github.com/sanity-io/sanity/commit/57c9f1cdee254606165cb12ba343087adbe5c8d3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency xstate to ^5.25.0 ([#11542](https://github.com/sanity-io/sanity/issues/11542)) ([ec49ea1](https://github.com/sanity-io/sanity/commit/ec49ea1f7eca94e06eec858913fec6829c2899b5)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11574](https://github.com/sanity-io/sanity/issues/11574)) ([1d0f1cb](https://github.com/sanity-io/sanity/commit/1d0f1cb5e23f5ea7749a2b7ffdb050b636847554)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major to ^2.4.0 ([#11544](https://github.com/sanity-io/sanity/issues/11544)) ([19b1b9e](https://github.com/sanity-io/sanity/commit/19b1b9ec8d3b000172423a75bd964beaeab2f148)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11531](https://github.com/sanity-io/sanity/issues/11531)) ([9acea25](https://github.com/sanity-io/sanity/commit/9acea25826b80a3886b7ee6abc7541bde7d4cea3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11570](https://github.com/sanity-io/sanity/issues/11570)) ([c798574](https://github.com/sanity-io/sanity/commit/c798574f2bea921f5c562c2c981e99cc4e542a7f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v5 (major) ([#11537](https://github.com/sanity-io/sanity/issues/11537)) ([33f7115](https://github.com/sanity-io/sanity/commit/33f71158a67aa4b42f3163cf4615b379c3206130)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* put back missing support for file extension type file accept ([#11582](https://github.com/sanity-io/sanity/issues/11582)) ([b3a4fe2](https://github.com/sanity-io/sanity/commit/b3a4fe2b2feeca7e477a34994b21b9bd1af3038f)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **schema:** sort out conflict between hoisted ref types and other types ([#11579](https://github.com/sanity-io/sanity/issues/11579)) ([85d65b1](https://github.com/sanity-io/sanity/commit/85d65b166b4597ce15a7b73b9e86821ab39563f4)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [5.0.0](https://github.com/sanity-io/sanity/compare/v4.22.0...v5.0.0) (2025-12-16)

### ⚠ BREAKING CHANGES

* **schema:** add schema inline hoisting (#11521)
* **typegen:** return same case when generating types (#11330)
* drop support for react < 19.2 (#11383)

### Features

* **core:** enable typographic behaviors in Portable Text Inputs by default ([eaffcde](https://github.com/sanity-io/sanity/commit/eaffcdec863fa70f1006bef62c2c3cbb86517171)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **schema:** add schema inline hoisting ([#11521](https://github.com/sanity-io/sanity/issues/11521)) ([f81e3cc](https://github.com/sanity-io/sanity/commit/f81e3cc03f9a8dfaeac7ffd2ac890346225be447)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **schema:** hoist reference types and use inline objects to reference them ([#11471](https://github.com/sanity-io/sanity/issues/11471)) ([16ce107](https://github.com/sanity-io/sanity/commit/16ce1075f8b3d3a6b0c0edec8fe1fa9500baef45)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **typegen:** memoizations, refactoring add improved progress reporting ([#10294](https://github.com/sanity-io/sanity/issues/10294)) ([5d6ac17](https://github.com/sanity-io/sanity/commit/5d6ac171739442c4db418eed8176d1845cb8181a)), closes [#8950](https://github.com/sanity-io/sanity/issues/8950) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **typegen:** return same case when generating types ([#11330](https://github.com/sanity-io/sanity/issues/11330)) ([0402647](https://github.com/sanity-io/sanity/commit/0402647eb06a4dde3d1c93ebf70192c47ee52e36)) by Sindre Gulseth (sgulseth@gmail.com)

### Bug Fixes

* drop support for react < 19.2 ([#11383](https://github.com/sanity-io/sanity/issues/11383)) ([169be63](https://github.com/sanity-io/sanity/commit/169be63ead210763b7cef232e263b93ffd3b80dd)) by Bjørge Næss (bjoerge@gmail.com)

## [4.22.0](https://github.com/sanity-io/sanity/compare/v4.21.1...v4.22.0) (2025-12-16)

### Features

* **cors:** add registration to cors error screen ([#11484](https://github.com/sanity-io/sanity/issues/11484)) ([7b8e9be](https://github.com/sanity-io/sanity/commit/7b8e9bee8dab6d538ca99c9aa83af7397f7f74f9)) by Dain Cilke (dain.cilke@gmail.com)
* **sanity:** enable editing canvas documents ([#11421](https://github.com/sanity-io/sanity/issues/11421)) ([cb8ed7d](https://github.com/sanity-io/sanity/commit/cb8ed7d8979d96bd4ffe3ed474fd69462654bc48)) by Josef Hlavacek (josef.hlavacek@sanity.io)
* **structure:** support linking to documents in focus mode ([#11489](https://github.com/sanity-io/sanity/issues/11489)) ([cb74919](https://github.com/sanity-io/sanity/commit/cb74919e6dc18d828ffd3715791c71f9d08619b7)) by Bjørge Næss (bjoerge@gmail.com)
* update mcp configured prompt text ([#11514](https://github.com/sanity-io/sanity/issues/11514)) ([b595fee](https://github.com/sanity-io/sanity/commit/b595fee91a0f780b99ab0adaa593839df30f6cf7)) by Matthew Ritter (matthew.ritter@sanity.io)

### Bug Fixes

* **cli:** handle sanity binary as esm/cjs/executable ([#11460](https://github.com/sanity-io/sanity/issues/11460)) ([e88b4b7](https://github.com/sanity-io/sanity/commit/e88b4b7d96e1a8e446270d8fe46f56bab2d59606)) by Espen Hovlandsdal (espen@hovlandsdal.com)
* **cli:** mark react < 19.2.2 as deprecated ([#11482](https://github.com/sanity-io/sanity/issues/11482)) ([217ee0a](https://github.com/sanity-io/sanity/commit/217ee0a416e4d59cd9e929608136723a3f5ecaaa)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** pass releasesOperation to @sanity/import when using --replace or --missing ([#11515](https://github.com/sanity-io/sanity/issues/11515)) ([f4d980e](https://github.com/sanity-io/sanity/commit/f4d980e78b45751acc3dd5183000278bbf854407)) by Tonina Zhelyazkova (zhelyazkova.tonina@gmail.com)
* **cli:** remove missing appId warning from sanity dev ([#11476](https://github.com/sanity-io/sanity/issues/11476)) ([1a087f8](https://github.com/sanity-io/sanity/commit/1a087f836e104bbccafc4e50edf2300b24d5d7df)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** telemetry in MCP commands ([#11487](https://github.com/sanity-io/sanity/issues/11487)) ([9e805d6](https://github.com/sanity-io/sanity/commit/9e805d64ae4e7f36c4bdc6632789cfd7aedab6a8)) by James Woods (jwwoods01@gmail.com)
* **cli:** update runtime commands ([#11513](https://github.com/sanity-io/sanity/issues/11513)) ([6f9ae4f](https://github.com/sanity-io/sanity/commit/6f9ae4f90456f5b592363aba4c188b24f3d38d4c)) by Taylor Beseda (tbeseda@gmail.com)
* delete all versions ([#11474](https://github.com/sanity-io/sanity/issues/11474)) ([78c96f1](https://github.com/sanity-io/sanity/commit/78c96f14d888e4fe253b061f31e320435b6d6b11)) by Jordan Lawrence (jordanl17@me.com)
* **deps:** add `sanity` to peerDependencies in @sanity/vision ([#11480](https://github.com/sanity-io/sanity/issues/11480)) ([69cd79b](https://github.com/sanity-io/sanity/commit/69cd79b38fe15f0cbb3c099b3ea64de55f5cf1f2)) by Robbie Wadley (robbiethewadley@gmail.com)
* **deps:** pin `isomorphic-dompurify` to solve `jsdom` errors on next.js ([#11497](https://github.com/sanity-io/sanity/issues/11497)) ([d63ef28](https://github.com/sanity-io/sanity/commit/d63ef282808147ca675864b1c977c8fe4783ee5f)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** update dependency @sanity/export to ^6.0.2 ([#11491](https://github.com/sanity-io/sanity/issues/11491)) ([3aa21a9](https://github.com/sanity-io/sanity/commit/3aa21a9ffce330b81024893dba78c820cba96735)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update dev-non-major ([#11494](https://github.com/sanity-io/sanity/issues/11494)) ([2973d7d](https://github.com/sanity-io/sanity/commit/2973d7dc4fbab38dba7512e020a6d1d96f3f671a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11450](https://github.com/sanity-io/sanity/issues/11450)) ([735f7b4](https://github.com/sanity-io/sanity/commit/735f7b4d1c92d243abce393464197f058278b25d)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11518](https://github.com/sanity-io/sanity/issues/11518)) ([f2adcc3](https://github.com/sanity-io/sanity/commit/f2adcc39c4c0c003ae823e7b6da24cee45d35d48)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* excluding releases and scheduled plugins from list of plugins to reroute ([#11505](https://github.com/sanity-io/sanity/issues/11505)) ([6f19a3c](https://github.com/sanity-io/sanity/commit/6f19a3c31a8c687f44a17f2acf5a29480112aa23)) by Jordan Lawrence (jordanl17@me.com)
* fix issue where backward drag and selecting text in fullscreen pte would skip the focus ([#11492](https://github.com/sanity-io/sanity/issues/11492)) ([b47f9f6](https://github.com/sanity-io/sanity/commit/b47f9f65e1d7cfe30792d25211ece6cc6a552fe8)) by RitaDias (rita@sanity.io)
* fix when deleting and reverting objects of arrays in the middle of an array ([#11455](https://github.com/sanity-io/sanity/issues/11455)) ([684cc41](https://github.com/sanity-io/sanity/commit/684cc4121507e30bdd2f8b520d1b1905aeaba139)) by RitaDias (rita@sanity.io)
* **manifest:** better handling of user application clients ([48bf231](https://github.com/sanity-io/sanity/commit/48bf231d57b3170f6e3ca4a3031264c667976866)) by Dain Cilke (dain.cilke@gmail.com)
* release-next with `--fix-lockfile` ([#11501](https://github.com/sanity-io/sanity/issues/11501)) ([7d2aa14](https://github.com/sanity-io/sanity/commit/7d2aa1497f8934fd3504b441898478b51ab8a267)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* selected items in the collapseoverflow menu ([#11452](https://github.com/sanity-io/sanity/issues/11452)) ([8b2ccb3](https://github.com/sanity-io/sanity/commit/8b2ccb3b06ae827494a98db2932262d571ab616e)) by RitaDias (rita@sanity.io)
* use the same peer dependency range for vision as regular plugins ([#11499](https://github.com/sanity-io/sanity/issues/11499)) ([e4e65b4](https://github.com/sanity-io/sanity/commit/e4e65b4817684d0b86e99c08278e7a7d5e3d5920)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [4.21.1](https://github.com/sanity-io/sanity/compare/v4.21.0...v4.21.1) (2025-12-11)

### Bug Fixes

* **ci:** stop deleting pnpm-lock.yaml in efps merge-reports job ([#11458](https://github.com/sanity-io/sanity/issues/11458)) ([67add10](https://github.com/sanity-io/sanity/commit/67add103c8649c00ac85aa5fb506f94a9e141c40)) by David Annez (david.annez@gmail.com)
* **cli:** blueprints doctor does not require existing blueprint config ([#11444](https://github.com/sanity-io/sanity/issues/11444)) ([b8d9a94](https://github.com/sanity-io/sanity/commit/b8d9a94e4b142aa2860b7ce0e928f3c7c72a257e)) by Taylor Beseda (tbeseda@gmail.com)
* **cli:** use caret for upgrade command, mark react < 19.2.1 as deprecated ([#11470](https://github.com/sanity-io/sanity/issues/11470)) ([91b861a](https://github.com/sanity-io/sanity/commit/91b861a5d1390113ccacb06cd94b964e557f8ff2)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** diffs author and timestamp missing when removing data ([#11404](https://github.com/sanity-io/sanity/issues/11404)) ([bdb099f](https://github.com/sanity-io/sanity/commit/bdb099f6d017302c1f0541af6efc19f59052e65b)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @portabletext/react to v6 ([#11440](https://github.com/sanity-io/sanity/issues/11440)) ([953b513](https://github.com/sanity-io/sanity/commit/953b513b798b1e68d9d3813839a0dbc68ea299e1)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.13.2 ([#11461](https://github.com/sanity-io/sanity/issues/11461)) ([aaebb76](https://github.com/sanity-io/sanity/commit/aaebb7631409dcef3af92c835ccf36ac5d9bf002)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11431](https://github.com/sanity-io/sanity/issues/11431)) ([ebfdc6e](https://github.com/sanity-io/sanity/commit/ebfdc6e1f5eb8e9bca1caa082bab32fb7745b301)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v5 (major) ([#11438](https://github.com/sanity-io/sanity/issues/11438)) ([dbc98f7](https://github.com/sanity-io/sanity/commit/dbc98f75a617381779975be26e14f07ad02d16cd)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* mcp cli wording ([#11457](https://github.com/sanity-io/sanity/issues/11457)) ([2aa0766](https://github.com/sanity-io/sanity/commit/2aa0766f7c5ad5f57c39a10525584489283a3a1f)) by James Woods (jwwoods01@gmail.com)
* restore fonts for schema icon extract ([#11442](https://github.com/sanity-io/sanity/issues/11442)) ([671ebc3](https://github.com/sanity-io/sanity/commit/671ebc33af4a7887c8b144b3fb73a4d75b16f570)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [4.21.0](https://github.com/sanity-io/sanity/compare/v4.20.3...v4.21.0) (2025-12-09)

### Features

* **build:** expose build id ([18221e9](https://github.com/sanity-io/sanity/commit/18221e9840e9f686c853648c53ee0fdc86607535)) by Dain Cilke (dain.cilke@gmail.com)
* setup mcp on sanity init and add mcp add command to cli ([#11409](https://github.com/sanity-io/sanity/issues/11409)) ([4752fb1](https://github.com/sanity-io/sanity/commit/4752fb174ad862817d40e0eeba07074fa62d3801)) by James Woods (jwwoods01@gmail.com)
* setup mcp on sanity init and add mcp add command to cli ([#11434](https://github.com/sanity-io/sanity/issues/11434)) ([e27bea7](https://github.com/sanity-io/sanity/commit/e27bea79c96cd743931f1d52cf9ceed52dd88f88)) by James Woods (jwwoods01@gmail.com)
* **studioManifest:** register live manifest with content operating system ([2271b97](https://github.com/sanity-io/sanity/commit/2271b97a8f1c98781b24837fd770af97e8d8c6bb)) by Dain Cilke (dain.cilke@gmail.com)
* Update runtime-cli to v12 ([#11410](https://github.com/sanity-io/sanity/issues/11410)) ([3fea96a](https://github.com/sanity-io/sanity/commit/3fea96acee0a8e5ccdd2c63a78eaa7fb273e39e0)) by Dave Sewell (snocorp@gmail.com)
* **userApplications:** add live user application provider ([801d868](https://github.com/sanity-io/sanity/commit/801d868a17e4aad3a592e5cc03331f89936ec492)) by Dain Cilke (dain.cilke@gmail.com)

### Bug Fixes

* allow for more flexibility for custom components? and using the enhanced object dialog ([#11358](https://github.com/sanity-io/sanity/issues/11358)) ([9ea5074](https://github.com/sanity-io/sanity/commit/9ea507489ffcd925ec5a8d1802629b6f9ad1f4aa)) by RitaDias (rita@sanity.io)
* **core:** `revisionNotFound` wait until document is ready ([#11279](https://github.com/sanity-io/sanity/issues/11279)) ([727b190](https://github.com/sanity-io/sanity/commit/727b1909b79fb8f07b84a577c3cf5fc685ef462e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** always save UTC timezone in date input ([#11435](https://github.com/sanity-io/sanity/issues/11435)) ([5126428](https://github.com/sanity-io/sanity/commit/5126428ef78fe9ee7aef8cab975ce1d870d10b17)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @sanity/mutate to ^0.15.0 ([#11412](https://github.com/sanity-io/sanity/issues/11412)) ([1e8b786](https://github.com/sanity-io/sanity/commit/1e8b7865862c2bddbad3bda3fc4d54d40bde613c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency get-it to ^8.7.0 ([#11395](https://github.com/sanity-io/sanity/issues/11395)) ([5f4487a](https://github.com/sanity-io/sanity/commit/5f4487aff99167094b2d1ea91058a45771198833)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.23.0 ([#11429](https://github.com/sanity-io/sanity/issues/11429)) ([b100ba4](https://github.com/sanity-io/sanity/commit/b100ba48cf49f31c0230c92095450aa0690e7d4b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency motion to ^12.23.25 ([#11401](https://github.com/sanity-io/sanity/issues/11401)) ([9509da7](https://github.com/sanity-io/sanity/commit/9509da7f6a8686d79cdffae3b21b60ae86939655)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11388](https://github.com/sanity-io/sanity/issues/11388)) ([5f63f2f](https://github.com/sanity-io/sanity/commit/5f63f2f0964cb1f6d8c2708e12ba6d8106682743)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11407](https://github.com/sanity-io/sanity/issues/11407)) ([a9b92c9](https://github.com/sanity-io/sanity/commit/a9b92c93b0f663040f317bcda78b0c21e5d3fc25)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* fix position for telemetry requests which were wrong + make sure that the requests don't have miltiple calls accidentally ([#11408](https://github.com/sanity-io/sanity/issues/11408)) ([bb9cff4](https://github.com/sanity-io/sanity/commit/bb9cff4aca35266921540bf97d6f0049adc33faf)) by RitaDias (rita@sanity.io)
* **schema:** regression when inline type reference another inline type ([#11411](https://github.com/sanity-io/sanity/issues/11411)) ([de7888a](https://github.com/sanity-io/sanity/commit/de7888a46275dae77a19eb1bd8e1f47f7986efcb)) by Sindre Gulseth (sgulseth@gmail.com)

## [4.20.3](https://github.com/sanity-io/sanity/compare/v4.20.2...v4.20.3) (2025-12-04)

### Bug Fixes

* **deps:** Update react monorepo to ^19.2.1 ([#11389](https://github.com/sanity-io/sanity/issues/11389)) ([ad157b1](https://github.com/sanity-io/sanity/commit/ad157b1e393f997d9c0dacdd964781169a95d2de)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)

## [4.20.2](https://github.com/sanity-io/sanity/compare/v4.20.1...v4.20.2) (2025-12-04)

### Bug Fixes

* `traverse is not a function` error ([#11391](https://github.com/sanity-io/sanity/issues/11391)) ([e4ea395](https://github.com/sanity-io/sanity/commit/e4ea395c228e4bebcdfe55eb7209c908951ae235)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [4.20.1](https://github.com/sanity-io/sanity/compare/v4.20.0...v4.20.1) (2025-12-03)

### Bug Fixes

* **cli:** handle url imports for themer.sanity.build ([#11346](https://github.com/sanity-io/sanity/issues/11346)) ([eedec5b](https://github.com/sanity-io/sanity/commit/eedec5b4bf533672d6e5e53189d003df252182a1)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **core:** remove key prop from BaseItemProps ([#11375](https://github.com/sanity-io/sanity/issues/11375)) ([8908e08](https://github.com/sanity-io/sanity/commit/8908e087f591b51457d56df745a68ff92fe79dbe)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.22.0 ([#11366](https://github.com/sanity-io/sanity/issues/11366)) ([6976b77](https://github.com/sanity-io/sanity/commit/6976b77295f0959abc588fe24dbd45e246d4b217)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* ERR_REQUIRE_CYCLE_MODULE on older node, and windows resolve regression ([#11385](https://github.com/sanity-io/sanity/issues/11385)) ([bfaa1c7](https://github.com/sanity-io/sanity/commit/bfaa1c7710e4d0c2f422689ca107a7f84c37c763)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* handle asset as array member with enforce required fields ([#11370](https://github.com/sanity-io/sanity/issues/11370)) ([6cb181b](https://github.com/sanity-io/sanity/commit/6cb181b4a9f0bc64ed0c4991a3b2eb9bc6c6054f)) by Kristoffer Brabrand (kristoffer@brabrand.no)

## [4.20.0](https://github.com/sanity-io/sanity/compare/v4.19.0...v4.20.0) (2025-12-02)

### Features

* **cli:** add command for visualizing schema bloat ([721e6d2](https://github.com/sanity-io/sanity/commit/721e6d2b96838160fb48129f0e50415233e69f5a)) by Magnus Holm (judofyr@gmail.com)
* delete scheduled drafts allows for copy back to draft when appropriate ([#11143](https://github.com/sanity-io/sanity/issues/11143)) ([3210749](https://github.com/sanity-io/sanity/commit/321074904b9da8f750cc7af137f59fb7e8877e18)) by Jordan Lawrence (jordanl17@me.com)
* **descriptors:** minimize blocking the UI ([2826615](https://github.com/sanity-io/sanity/commit/2826615efb55aee9a99077daf6cf831e5e051f9c)) by Magnus Holm (judofyr@gmail.com)
* **schema:** cache generated field objects ([8efdc2b](https://github.com/sanity-io/sanity/commit/8efdc2b31f4156a30710562852fb5bb41409ee7d)) by Magnus Holm (judofyr@gmail.com)
* **schema:** de-dupe re-used fields in the descriptor ([b287558](https://github.com/sanity-io/sanity/commit/b287558417c6f06eaaf7acf1a4f51dc6aab0c3f6)) by Magnus Holm (judofyr@gmail.com)
* support private assets ([#11316](https://github.com/sanity-io/sanity/issues/11316)) ([9a661ca](https://github.com/sanity-io/sanity/commit/9a661ca445b108db5a2dca1b471aab7a8ebe29bc)) by Rupert Dunk (rupert@rupertdunk.com)

### Bug Fixes

* add dialog for content releases misconfiguration with support contact option ([#11276](https://github.com/sanity-io/sanity/issues/11276)) ([a43f8e0](https://github.com/sanity-io/sanity/commit/a43f8e085eeaf02f5582fd9e5f02957990e79cdd)) by Jordan Lawrence (jordanl17@me.com)
* allow `createGlobalStyle` to work with auto updating studios ([#11313](https://github.com/sanity-io/sanity/issues/11313)) ([c964ffe](https://github.com/sanity-io/sanity/commit/c964ffecf1f3374ecef82b5962ef77e146dd12f8)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* concat `previewUrl` and `targetOrigin` correctly ([#11322](https://github.com/sanity-io/sanity/issues/11322)) ([a18d3ed](https://github.com/sanity-io/sanity/commit/a18d3edabf1048282c36ca4ede7fc3a8d95b197c)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **core:** date time input fixes ([#11233](https://github.com/sanity-io/sanity/issues/11233)) ([84418b4](https://github.com/sanity-io/sanity/commit/84418b410a7d3b5f0f19d8e63eea03011a74c218)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** fix props function delcaration ([#11362](https://github.com/sanity-io/sanity/issues/11362)) ([6b54783](https://github.com/sanity-io/sanity/commit/6b547838391477d45cb249202959553abb7b7e44)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **core:** only validate .media validation markers ([#11311](https://github.com/sanity-io/sanity/issues/11311)) ([f8643c1](https://github.com/sanity-io/sanity/commit/f8643c14897f703709700b4e4cbeca42fa4529d2)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **core:** pte inline comments respect __internal_comments disabled ([#11341](https://github.com/sanity-io/sanity/issues/11341)) ([0f566b5](https://github.com/sanity-io/sanity/commit/0f566b5c99891052b661791d0d48f8e4c7118b98)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** set correct focus path for assets inputs in images ([#11317](https://github.com/sanity-io/sanity/issues/11317)) ([f1182f5](https://github.com/sanity-io/sanity/commit/f1182f50e73297c6043ea9ce4bac10e877aed044)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** update server delete operation to include versions list ([#11364](https://github.com/sanity-io/sanity/issues/11364)) ([482f1d1](https://github.com/sanity-io/sanity/commit/482f1d19cc49ed4ebac1f5b0f06dd685219c085b)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use `toolTitle` for `document.title` if present ([#11285](https://github.com/sanity-io/sanity/issues/11285)) ([c7967d8](https://github.com/sanity-io/sanity/commit/c7967d8ed56baa49de5b201246135ba6946c911e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** mark support for `react < 19.2` and `@sanity/ui < 3` as deprecated ([#11238](https://github.com/sanity-io/sanity/issues/11238)) ([8cd0a7c](https://github.com/sanity-io/sanity/commit/8cd0a7c7a018f274eabde068127eeb767e72d0f7)) by Bjørge Næss (bjoerge@gmail.com)
* **deps:** Update CodeMirror ([#11256](https://github.com/sanity-io/sanity/issues/11256)) ([6d0897f](https://github.com/sanity-io/sanity/commit/6d0897f2bde0bbde04c46133f50835d8336108f9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.13.1 ([#11283](https://github.com/sanity-io/sanity/issues/11283)) ([b217ecb](https://github.com/sanity-io/sanity/commit/b217ecb6363d23663293f313e75c9c32e9895555)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11270](https://github.com/sanity-io/sanity/issues/11270)) ([bf4bf3b](https://github.com/sanity-io/sanity/commit/bf4bf3b130a3a2922a23708b7684e94c4b5bd110)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11329](https://github.com/sanity-io/sanity/issues/11329)) ([ab15495](https://github.com/sanity-io/sanity/commit/ab154959c7b632f7fab54b8dfcaa9a08100ec411)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11338](https://github.com/sanity-io/sanity/issues/11338)) ([7ee38ba](https://github.com/sanity-io/sanity/commit/7ee38ba2b5a6c1b1028eb7cd9f80a6821cb95c4a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* ensure module server uploads `.mjs` files ([#11281](https://github.com/sanity-io/sanity/issues/11281)) ([2be3548](https://github.com/sanity-io/sanity/commit/2be3548d46a4fe7570f12305a2e739bb3cd4bafd)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* ensure schema errors are caught ([#11349](https://github.com/sanity-io/sanity/issues/11349)) ([30b67b5](https://github.com/sanity-io/sanity/commit/30b67b5fa20aadffb91b0b91990bc4ff4cd9460e)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* make sure `require` calls comes from `createRequire` ([#11306](https://github.com/sanity-io/sanity/issues/11306)) ([0ae1f8b](https://github.com/sanity-io/sanity/commit/0ae1f8b2d2b3a5960768cd992a2eb94313944e65)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **media-library:** support groups and fieldset in `defineVideoField` ([#11361](https://github.com/sanity-io/sanity/issues/11361)) ([3c840ce](https://github.com/sanity-io/sanity/commit/3c840ce0c20b83f5b7115b76382083286b570a9e)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* remove `ServerStyleSheet` usage ([#10757](https://github.com/sanity-io/sanity/issues/10757)) ([76028e1](https://github.com/sanity-io/sanity/commit/76028e1d19cdf32c6c1dd9888acbdb33b36ed99e)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **sanity:** allow editing documents in non-release bundles ([#11312](https://github.com/sanity-io/sanity/issues/11312)) ([dfa9dc1](https://github.com/sanity-io/sanity/commit/dfa9dc1f70fbe01699f3186eb93e4671d228b329)) by Bjørge Næss (bjoerge@gmail.com)
* **structure:** replace delete action for discard in non published docs ([#11363](https://github.com/sanity-io/sanity/issues/11363)) ([ef60727](https://github.com/sanity-io/sanity/commit/ef607275cd08b3b3be2413d208af75b905723291)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* validate published document when it is displayed ([#11130](https://github.com/sanity-io/sanity/issues/11130)) ([adf299b](https://github.com/sanity-io/sanity/commit/adf299b1d002d540c8e67aa2b2f601725a3e32ec)) by Jordan Lawrence (jordanl17@me.com)

## [4.19.0](https://github.com/sanity-io/sanity/compare/v4.18.0...v4.19.0) (2025-11-25)

### Features

* clarifying published doc has been edited and last published ([#11186](https://github.com/sanity-io/sanity/issues/11186)) ([5681cc5](https://github.com/sanity-io/sanity/commit/5681cc58e4f7f95b5557943cc91c66488c08d4db)) by Jordan Lawrence (jordanl17@me.com)
* **cli:** add typegen configuration through cli config ([#11135](https://github.com/sanity-io/sanity/issues/11135)) ([cfd2d9c](https://github.com/sanity-io/sanity/commit/cfd2d9c26870a7dbfebfef97ac575507f7a0edbe)) by Kristoffer Brabrand (kristoffer@brabrand.no)

### Bug Fixes

* **cli:** load config properly in `sanity schema validate` ([#11223](https://github.com/sanity-io/sanity/issues/11223)) ([e3f4e7d](https://github.com/sanity-io/sanity/commit/e3f4e7df0327fb96f506a8a4fdcb7d31ade55933)) by Magnus Holm (judofyr@gmail.com)
* **core:** releases time input behaves incorrectly with timezones offset ([#11242](https://github.com/sanity-io/sanity/issues/11242)) ([8a358fa](https://github.com/sanity-io/sanity/commit/8a358fa40e19ebb507379f28271ade275942c668)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @sanity/comlink to ^4.0.1 ([#11248](https://github.com/sanity-io/sanity/issues/11248)) ([2493536](https://github.com/sanity-io/sanity/commit/2493536ce99bd33db3e6f6667967207ca6462e50)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/presentation-comlink to ^2.0.1 ([#11249](https://github.com/sanity-io/sanity/issues/11249)) ([2035ff2](https://github.com/sanity-io/sanity/commit/2035ff263d3ec4acdceb8c5f65878f52de1a27b1)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.16 ([#11211](https://github.com/sanity-io/sanity/issues/11211)) ([2cab14a](https://github.com/sanity-io/sanity/commit/2cab14a7ededaee445b470b1ee155f29e95a9c4e)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to v3 ([#11234](https://github.com/sanity-io/sanity/issues/11234)) ([67f4ffb](https://github.com/sanity-io/sanity/commit/67f4ffb31f8f54318cde955b7d5520a6d056a233)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** Update portabletext ([#11217](https://github.com/sanity-io/sanity/issues/11217)) ([86feb1f](https://github.com/sanity-io/sanity/commit/86feb1f6db5cea4f6d52b5aee85b931ca11e1191)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **sanity:** excessive comment mutations when editing in PTE ([#11230](https://github.com/sanity-io/sanity/issues/11230)) ([c64b279](https://github.com/sanity-io/sanity/commit/c64b279625461a3e9f8b4c7836c07d56e855799a)) by Ash (ash@sanity.io)
* **sanity:** skip assetRequired rule to allow selection in media library ([#11197](https://github.com/sanity-io/sanity/issues/11197)) ([dbeeea0](https://github.com/sanity-io/sanity/commit/dbeeea0a99fc84a7aa62eaf0b11380be9c604369)) by Fred Carlsen (fred@sjelfull.no)

## [4.18.0](https://github.com/sanity-io/sanity/compare/v4.17.0...v4.18.0) (2025-11-21)

### Features

* **sanity:** Add Canvas document actions to version documents ([#11141](https://github.com/sanity-io/sanity/issues/11141)) ([078a0ac](https://github.com/sanity-io/sanity/commit/078a0ac9a9fa8f1058b282343b7195b2f191af42)) by Josef Hlavacek (josef.hlavacek@sanity.io)

### Bug Fixes

* **core:** flush pending Portable Text Input changes on unmount ([7de417d](https://github.com/sanity-io/sanity/commit/7de417db8a87ce16d62741b3ab6d1e200a3475fb)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **deps:** update dependency @sanity/client to ^7.13.0 ([#11215](https://github.com/sanity-io/sanity/issues/11215)) ([dbb4b01](https://github.com/sanity-io/sanity/commit/dbb4b018d9c5f604c6569fe7ea51d2f7ccd274f3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.16 ([#11212](https://github.com/sanity-io/sanity/issues/11212)) ([917e212](https://github.com/sanity-io/sanity/commit/917e2123c612a0b13b9efe5000acf18fd055b8fb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.21.0 ([#11216](https://github.com/sanity-io/sanity/issues/11216)) ([fc8f483](https://github.com/sanity-io/sanity/commit/fc8f4832c1a80162bdc54a229f66c3af911a3d21)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* release limits use only metered org count to exclude scheduled drafts ([#11208](https://github.com/sanity-io/sanity/issues/11208)) ([cc41a87](https://github.com/sanity-io/sanity/commit/cc41a87608786657864aa046258feb0c1dc7d17d)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** switch enhanced object dialog off by default ([#11201](https://github.com/sanity-io/sanity/issues/11201)) ([#11227](https://github.com/sanity-io/sanity/issues/11227)) ([4e8100e](https://github.com/sanity-io/sanity/commit/4e8100e46e200846957ae5d91005d59ddd7a5581)) by Ash (ash@sanity.io)

### Performance Improvements

* Improve createFieldDefinitions and related ([#11209](https://github.com/sanity-io/sanity/issues/11209)) ([484e953](https://github.com/sanity-io/sanity/commit/484e953ed01bfc4547e4582055f09ef1f37a674f)) by Tegan Churchill (99214770+tegan-rbi@users.noreply.github.com)

## [4.17.0](https://github.com/sanity-io/sanity/compare/v4.16.0...v4.17.0) (2025-11-20)

### Features

* **sanity:** make enhanced object dialog opt out ([#11201](https://github.com/sanity-io/sanity/issues/11201)) ([966f4b4](https://github.com/sanity-io/sanity/commit/966f4b4f062b24e1705ebdc076843b12fbda50d7)) by RitaDias (rita@sanity.io)
* **structure:** add ability to maximise a document  ([#11200](https://github.com/sanity-io/sanity/issues/11200)) ([0d39bed](https://github.com/sanity-io/sanity/commit/0d39bedbcdab1d880eab6c6f881273c56a178b24)) by RitaDias (rita@sanity.io)
* when creating scheduled draft, discard the existing draft transactionally ([#11196](https://github.com/sanity-io/sanity/issues/11196)) ([9051822](https://github.com/sanity-io/sanity/commit/9051822474fa88112ec24d6513d6202a70d5d128)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **actions:** `onComplete` considered harmful, use local state instead ([#11199](https://github.com/sanity-io/sanity/issues/11199)) ([461f54d](https://github.com/sanity-io/sanity/commit/461f54d62f50ee96cc959ea97c023dbbda9d048e)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* implement virtualized array list with visibility detection when ancestors change hidden state ([#11166](https://github.com/sanity-io/sanity/issues/11166)) ([fe0e624](https://github.com/sanity-io/sanity/commit/fe0e624fdbb40b9338c299c9c06d828cf67872c8)) by Jordan Lawrence (jordanl17@me.com)
* **perf:** render document actions once instead of 3x ([#11167](https://github.com/sanity-io/sanity/issues/11167)) ([41c28d2](https://github.com/sanity-io/sanity/commit/41c28d278f0c69d0616472e73923b90f8f1ede35)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* removing unnecessary release and scheduled publishing banner ([#11195](https://github.com/sanity-io/sanity/issues/11195)) ([fda448a](https://github.com/sanity-io/sanity/commit/fda448a6e8c214add1d5e0309e76bb4e8d75fcb7)) by Jordan Lawrence (jordanl17@me.com)

## [4.16.0](https://github.com/sanity-io/sanity/compare/v4.15.0...v4.16.0) (2025-11-18)

### Features

* add sentiment-analysis function example ([#10106](https://github.com/sanity-io/sanity/issues/10106)) ([860d5cc](https://github.com/sanity-io/sanity/commit/860d5cc3fb5b112e10589a0b80c413d37d8ff145)) by Ken Jones (ken@sanity.io)
* allow configuring sanity CLI config in testing ([#11133](https://github.com/sanity-io/sanity/issues/11133)) ([dd909ce](https://github.com/sanity-io/sanity/commit/dd909ce127696298e35a4810ed2c6cad9e4ffe40)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **core:** add configurable `typography` plugin to PTE inputs ([f6e394d](https://github.com/sanity-io/sanity/commit/f6e394d21f790e135af309dd9cb5cb8ce9954a71)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **form:** pass perspective stack to custom reference filters, apply returned perspective ([#11127](https://github.com/sanity-io/sanity/issues/11127)) ([22123ed](https://github.com/sanity-io/sanity/commit/22123ed113c484d9449b7b05d20c9a4f1abbe8ae)) by Bjørge Næss (bjoerge@gmail.com)
* **limits:** add asset limit upsell dialog ([#11066](https://github.com/sanity-io/sanity/issues/11066)) ([0b5b953](https://github.com/sanity-io/sanity/commit/0b5b9531e3921eec64e078d9181fcf50c9c87e70)) by Matthew Ritter (matthew.ritter@sanity.io)
* make enhancedObjectDialog opt out ([#11094](https://github.com/sanity-io/sanity/issues/11094)) ([f58536e](https://github.com/sanity-io/sanity/commit/f58536e844516005c4a63fdea7edc49558f955eb)) by RitaDias (rita@sanity.io)
* **sanity:** check permissions for invite members button ([#11138](https://github.com/sanity-io/sanity/issues/11138)) ([50990e7](https://github.com/sanity-io/sanity/commit/50990e7c72d0e61d4163417b58a4fb5588df91a4)) by Herman Wikner (wiknerherman@gmail.com)
* **structure:** add ability to maximise a document ([#10997](https://github.com/sanity-io/sanity/issues/10997)) ([3720d9b](https://github.com/sanity-io/sanity/commit/3720d9b1be0c4a297c8e14de5d6588136d405adb)) by RitaDias (rita@sanity.io)

### Bug Fixes

* add FullscreenPTEContext and SchedulesContext to singletons exports ([#11134](https://github.com/sanity-io/sanity/issues/11134)) ([c987fe4](https://github.com/sanity-io/sanity/commit/c987fe42db0bd4ab7129f0444bfc3d7caf37295b)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* bug where changing the time manually in an input when the timezone was selected would change the time based on the computer timezone ([#11161](https://github.com/sanity-io/sanity/issues/11161)) ([28ba0ae](https://github.com/sanity-io/sanity/commit/28ba0ae8d9f178f91fa5f5a44df808e8ab5ded0c)) by RitaDias (rita@sanity.io)
* **cli:** undeploy based on `appId`/`studioHost` ([#11131](https://github.com/sanity-io/sanity/issues/11131)) ([0e05188](https://github.com/sanity-io/sanity/commit/0e0518887ecf2528ca77bcce70fbc23dff160978)) by Espen Hovlandsdal (espen@hovlandsdal.com)
* **core:** disable `typography` PTE plugin by default ([f7660dd](https://github.com/sanity-io/sanity/commit/f7660dd7b11bb5142173aff297b26a01462507ef)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **core:** fix crossDatasetReference input previews ([#11154](https://github.com/sanity-io/sanity/issues/11154)) ([3fc1c5f](https://github.com/sanity-io/sanity/commit/3fc1c5f5ca248bf723c698204bbfcdf3d32501c4)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** improve error state for invalid reference filter ([#11124](https://github.com/sanity-io/sanity/issues/11124)) ([a463854](https://github.com/sanity-io/sanity/commit/a4638547841afe3ec047c35d1d591dbb36b9cbcc)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** replace deprecated `OneLinePlugin` ([31dcd7c](https://github.com/sanity-io/sanity/commit/31dcd7cbdf1a3a238610584bf423c42d46e6a9f7)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **core:** use `drafts` perspective for cross dataset refs previews ([#11158](https://github.com/sanity-io/sanity/issues/11158)) ([b7b4e5e](https://github.com/sanity-io/sanity/commit/b7b4e5edc804fbb8c51748f78403cabf5e85d0a3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use publishedId when creating a child link ([#11163](https://github.com/sanity-io/sanity/issues/11163)) ([f0b2bf9](https://github.com/sanity-io/sanity/commit/f0b2bf94e29a0dce41f760c2e257a2f6478f957c)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** Update babel monorepo to ^7.28.5 ([#11181](https://github.com/sanity-io/sanity/issues/11181)) ([08d6e66](https://github.com/sanity-io/sanity/commit/08d6e66c0aa5cc7103da8e734c4bb151d9b0a179)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update CodeMirror ([#11182](https://github.com/sanity-io/sanity/issues/11182)) ([d90e127](https://github.com/sanity-io/sanity/commit/d90e127a8b952538ffaadf06b0323875ccc16c95)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/block-tools to ^4.0.2 ([#11055](https://github.com/sanity-io/sanity/issues/11055)) ([0cb63b4](https://github.com/sanity-io/sanity/commit/0cb63b46442457cc6ab7b73f90f9bc12b8318499)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.12.1 ([#11129](https://github.com/sanity-io/sanity/issues/11129)) ([db726ea](https://github.com/sanity-io/sanity/commit/db726eaea3cdf89d5d0823cb7dea764f4c3d48b3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v3 (major) ([#11156](https://github.com/sanity-io/sanity/issues/11156)) ([3448d67](https://github.com/sanity-io/sanity/commit/3448d6747dcd769c7213b24e2d92f2d48436155b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v4 (major) ([#11157](https://github.com/sanity-io/sanity/issues/11157)) ([697beee](https://github.com/sanity-io/sanity/commit/697beeea25123b33efdefba7767a008650a532cb)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** upgrade react compiler to v1 ([#10834](https://github.com/sanity-io/sanity/issues/10834)) ([2573cb1](https://github.com/sanity-io/sanity/commit/2573cb15c224c762636500b339d0c2701aad1e68)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **functions:** support host flag in functions dev ([#11118](https://github.com/sanity-io/sanity/issues/11118)) ([9588b8b](https://github.com/sanity-io/sanity/commit/9588b8b805bdf4c1d911e7700be2f476a88a2f12)) by Simon MacDonald (simon.macdonald@gmail.com)
* **i18n:** deprecate `minimalDays` property on week info ([#11005](https://github.com/sanity-io/sanity/issues/11005)) ([26496b6](https://github.com/sanity-io/sanity/commit/26496b663bee9f2740f4d3511946636bda56acab)) by Espen Hovlandsdal (espen@hovlandsdal.com)
* issues where component.items weren't opening the enhanced object dialog ([#11152](https://github.com/sanity-io/sanity/issues/11152)) ([7627bfa](https://github.com/sanity-io/sanity/commit/7627bfa20f67efcf2abe81c4b51220d56acf442f)) by RitaDias (rita@sanity.io)
* make it possible to double click specific items in the inspect ([#11120](https://github.com/sanity-io/sanity/issues/11120)) ([b8b13bb](https://github.com/sanity-io/sanity/commit/b8b13bb15f6c6b45178267832da60cdd4c31ad5b)) by RitaDias (rita@sanity.io)
* **perf:** avoid 1s render root loop ([#11149](https://github.com/sanity-io/sanity/issues/11149)) ([7270dfe](https://github.com/sanity-io/sanity/commit/7270dfebad28a209a15276755b7bddb5011b6c97)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **perf:** remove unsafe ref reads during render ([#11148](https://github.com/sanity-io/sanity/issues/11148)) ([93eaf26](https://github.com/sanity-io/sanity/commit/93eaf26f0c84cc572fc27af8c30e117582033ee4)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **sanity:** allow importing assets without a data.ndjson file ([#11159](https://github.com/sanity-io/sanity/issues/11159)) ([393b11b](https://github.com/sanity-io/sanity/commit/393b11bd8ea2ece03b53114cf2dead87798bcfad)) by Fred Carlsen (fred@sjelfull.no)
* **sanity:** revert switch on enhanced object dialog by default ([#11094](https://github.com/sanity-io/sanity/issues/11094)) ([#11191](https://github.com/sanity-io/sanity/issues/11191)) ([dbb28d7](https://github.com/sanity-io/sanity/commit/dbb28d7ca421b63e18b1a4b61c96b2ec7f2d9596)) by Ash (ash@sanity.io)
* **structure:** revert add ability to maximise a document ([#10997](https://github.com/sanity-io/sanity/issues/10997)) ([#11190](https://github.com/sanity-io/sanity/issues/11190)) ([abb4d4d](https://github.com/sanity-io/sanity/commit/abb4d4d05674a382b234c5e86750523edbe6d83c)) by Ash (ash@sanity.io)

## [4.15.0](https://github.com/sanity-io/sanity/compare/v4.14.2...v4.15.0) (2025-11-11)

### Features

* Copy version to draft ([#11030](https://github.com/sanity-io/sanity/issues/11030)) ([2b75633](https://github.com/sanity-io/sanity/commit/2b75633a55dcc936577fbbc956aee2f8ae899485)) by Jordan Lawrence (jordanl17@me.com)
* **manifest:** add studioVersion to improve UX of external studios in dashboard dev-setup ([#11012](https://github.com/sanity-io/sanity/issues/11012)) ([2358e1f](https://github.com/sanity-io/sanity/commit/2358e1f208f2b593246ce2492ba1f5f4f28a5166)) by Josh (37798644+joshuaellis@users.noreply.github.com)

### Bug Fixes

* **actions:** update e2e cleanup pr script ([#11109](https://github.com/sanity-io/sanity/issues/11109)) ([ce47ad3](https://github.com/sanity-io/sanity/commit/ce47ad339b97b062216fed3a21d533c0fea3165a)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* cardinality one releases use the original perspective stack logic ([#11080](https://github.com/sanity-io/sanity/issues/11080)) ([c5dd642](https://github.com/sanity-io/sanity/commit/c5dd6420f7f60ef52de2bb5489a6220657fd3473)) by Jordan Lawrence (jordanl17@me.com)
* compare versions now works with the new enhanced object ([#11040](https://github.com/sanity-io/sanity/issues/11040)) ([028a52e](https://github.com/sanity-io/sanity/commit/028a52e37e93adb79063f086cf86ddfd71bf2a7c)) by RitaDias (rita@sanity.io)
* Correctly fetch canvas documents linked to releases ([#11067](https://github.com/sanity-io/sanity/issues/11067)) ([e874690](https://github.com/sanity-io/sanity/commit/e87469057d303600ee1b8bf215c01822d523dd9a)) by Josef Hlavacek (josef.hlavacek@sanity.io)
* **deps:** update dependency @sanity/client to v7 ([#11074](https://github.com/sanity-io/sanity/issues/11074)) ([0035802](https://github.com/sanity-io/sanity/commit/0035802d9493860d2645443bd1fb2d51802a5320)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency xstate to ^5.24.0 ([#11101](https://github.com/sanity-io/sanity/issues/11101)) ([6b3f691](https://github.com/sanity-io/sanity/commit/6b3f691b836c5fde508189ff9788de0bf6caae1c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* do not block on upsell data failures; use custom interpolator rather that lodash templator ([#11115](https://github.com/sanity-io/sanity/issues/11115)) ([131f31b](https://github.com/sanity-io/sanity/commit/131f31bf0fab58ddac8df428e256f6159e6b69c6)) by Jordan Lawrence (jordanl17@me.com)
* enhancedObjectDialog where custom items are being used ([#11090](https://github.com/sanity-io/sanity/issues/11090)) ([f45045b](https://github.com/sanity-io/sanity/commit/f45045b68e0973043d70d46e4c0abe9d4b79126d)) by RitaDias (rita@sanity.io)
* Fix assist ai when using enhanced object dialog  ([#11097](https://github.com/sanity-io/sanity/issues/11097)) ([fc24066](https://github.com/sanity-io/sanity/commit/fc24066e687bf356972e988bbf4a5c2a6b031c70)) by RitaDias (rita@sanity.io)
* issue where initialFullscreen ptes weren't being able to close ([#11106](https://github.com/sanity-io/sanity/issues/11106)) ([8207267](https://github.com/sanity-io/sanity/commit/8207267806715b9327c095f7134fa276ffa71404)) by RitaDias (rita@sanity.io)
* issue where reference inputs were behaving oddly with the dialog ([#11047](https://github.com/sanity-io/sanity/issues/11047)) ([c5db32e](https://github.com/sanity-io/sanity/commit/c5db32e982fd89716cd5aa14ef6c8750e28838c6)) by RitaDias (rita@sanity.io)
* issue where when enhancedObjectDialog was turned off, the old dialog wasn't opening ([#11108](https://github.com/sanity-io/sanity/issues/11108)) ([be015c5](https://github.com/sanity-io/sanity/commit/be015c582b5651fb23d20c97170380b3e08b01c6)) by RitaDias (rita@sanity.io)
* **migrate:** exports esm bundle for migrate package ([#11082](https://github.com/sanity-io/sanity/issues/11082)) ([2922a73](https://github.com/sanity-io/sanity/commit/2922a73d3596a432baa905db58c5b3203e86913c)) by Binoy Patel (me@binoy.io)
* **presentation:** persist scheduled draft perspective in location item ([#11089](https://github.com/sanity-io/sanity/issues/11089)) ([8514f39](https://github.com/sanity-io/sanity/commit/8514f39b784f03dd99f79bd3633553a0dd35b9c1)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **schema:** extract inline non-objects ([#10990](https://github.com/sanity-io/sanity/issues/10990)) ([c151b89](https://github.com/sanity-io/sanity/commit/c151b89802f4450858d4856f2dc14f3761590d27)) by Sindre Gulseth (sgulseth@gmail.com)
* **structure:** pass edit intent params for pane to handle ([#11077](https://github.com/sanity-io/sanity/issues/11077)) ([0249ef6](https://github.com/sanity-io/sanity/commit/0249ef6663261f9f16e9a4bd2e19f3e1d809d9b8)) by Josh (37798644+joshuaellis@users.noreply.github.com)
* **typegen:** allow generating types to absolute path ([#7620](https://github.com/sanity-io/sanity/issues/7620)) ([#11081](https://github.com/sanity-io/sanity/issues/11081)) ([f8b4e87](https://github.com/sanity-io/sanity/commit/f8b4e87fdb54a8d294a7ffc754cf5f662adfdaab)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* void unawaited promise in CopyToDrafts ([#11117](https://github.com/sanity-io/sanity/issues/11117)) ([3bea1a5](https://github.com/sanity-io/sanity/commit/3bea1a54d359daa23435ffec251973292a6fcf37)) by Jordan Lawrence (jordanl17@me.com)

### Reverts

* **deps:** add patch-package as direct dependency ([#11085](https://github.com/sanity-io/sanity/issues/11085)) ([#11086](https://github.com/sanity-io/sanity/issues/11086)) ([45a5dbf](https://github.com/sanity-io/sanity/commit/45a5dbf56a174884032b212e4dc5b61cba1acb31)) by Bjørge Næss (bjoerge@gmail.com)

## [4.14.2](https://github.com/sanity-io/sanity/compare/v4.14.1...v4.14.2) (2025-11-07)

### Bug Fixes

* **cli:** disable dynamic-import when running cli from local source ([#11078](https://github.com/sanity-io/sanity/issues/11078)) ([a30a092](https://github.com/sanity-io/sanity/commit/a30a0923467591cf1c57638d0e370bbbd0856d06)) by Kristoffer Brabrand (kristoffer@brabrand.no)
* **deps:** add patch-package as direct dependency ([#11085](https://github.com/sanity-io/sanity/issues/11085)) ([3a6536c](https://github.com/sanity-io/sanity/commit/3a6536ca7c5fc64daec42057dc56a06c14cd74e2)) by Bjørge Næss (bjoerge@gmail.com)

## [4.14.1](https://github.com/sanity-io/sanity/compare/v4.14.0...v4.14.1) (2025-11-06)

### Bug Fixes

* **deps:** upgrade `@portabletext/*` deps ([#11068](https://github.com/sanity-io/sanity/issues/11068)) ([87b84eb](https://github.com/sanity-io/sanity/commit/87b84ebed96a4e01562fdc3c6c71982714d7f1cd)) by Cody Olsen (81981+stipsan@users.noreply.github.com)

## [4.14.0](https://github.com/sanity-io/sanity/compare/v4.13.0...v4.14.0) (2025-11-06)

### Features

* **core:** adds `scheduledDrafts` config option (on by default) ([#11026](https://github.com/sanity-io/sanity/issues/11026)) ([bb05c55](https://github.com/sanity-io/sanity/commit/bb05c557c1f0861d9e29ab1c1516afbcdb4194f1)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** allow disabling the built-in PTE Markdown shortcuts plugin ([1b9a227](https://github.com/sanity-io/sanity/commit/1b9a227971a5a69a60f8171e0d22f783bc3c2e26)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **core:** sticky drop message ([#11010](https://github.com/sanity-io/sanity/issues/11010)) ([d3be836](https://github.com/sanity-io/sanity/commit/d3be83617623e207c0aba9f628a2d804820e4d17)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* vision perspective scheduled drafts ([#10999](https://github.com/sanity-io/sanity/issues/10999)) ([4876ac2](https://github.com/sanity-io/sanity/commit/4876ac28986babe7374fe7b11f42f28054b32f7d)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **ci:** change expected npm user ([#11057](https://github.com/sanity-io/sanity/issues/11057)) ([72cb37e](https://github.com/sanity-io/sanity/commit/72cb37e136977d2add74eadcbad9e8e3d792c4ff)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** add new function test flag ([#11007](https://github.com/sanity-io/sanity/issues/11007)) ([22bd071](https://github.com/sanity-io/sanity/commit/22bd07126984e872f3fd3817f54c52a0da1114e9)) by Simon MacDonald (simon.macdonald@gmail.com)
* **core:** close release dialog immediately after release creation ([#11011](https://github.com/sanity-io/sanity/issues/11011)) ([13a9958](https://github.com/sanity-io/sanity/commit/13a99580e8398017f0183923a06ac5db96aae5f7)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** scheduled publish action should set pane perspective, not global ([#11058](https://github.com/sanity-io/sanity/issues/11058)) ([29faf6e](https://github.com/sanity-io/sanity/commit/29faf6e8857764eff49d1701276791b04c6be6b3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use state over ref in ImageInput ([#11048](https://github.com/sanity-io/sanity/issues/11048)) ([7fad934](https://github.com/sanity-io/sanity/commit/7fad9348ea10ce195807a4333306d6aa883e0a80)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)
* **deps:** add `@babel/parser`, an implicit dep of `recast` ([#11042](https://github.com/sanity-io/sanity/issues/11042)) ([bc08d28](https://github.com/sanity-io/sanity/commit/bc08d286f2cf618152dd483765df70304a120155)) by Cody Olsen (81981+stipsan@users.noreply.github.com)
* **deps:** update dependency @portabletext/plugin-character-pair-decorator to ^2.0.1 ([#11039](https://github.com/sanity-io/sanity/issues/11039)) ([22ac6c9](https://github.com/sanity-io/sanity/commit/22ac6c93947a42fb085792333b205c9b76aaebcf)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/react to v5 ([#11034](https://github.com/sanity-io/sanity/issues/11034)) ([486476a](https://github.com/sanity-io/sanity/commit/486476a321c18f3c83eb5cc6d7eeecfc94668a97)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.12.1 ([#11029](https://github.com/sanity-io/sanity/issues/11029)) ([df2aa67](https://github.com/sanity-io/sanity/commit/df2aa672f39c9a847e4102f1f0e18d240e1aa808)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#10981](https://github.com/sanity-io/sanity/issues/10981)) ([a27f27b](https://github.com/sanity-io/sanity/commit/a27f27b87c91fd860d13bc4f6246557e59f7724c)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11031](https://github.com/sanity-io/sanity/issues/11031)) ([870a2f5](https://github.com/sanity-io/sanity/commit/870a2f5371f6c133dc64cda963e67259b8303de3)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#11045](https://github.com/sanity-io/sanity/issues/11045)) ([184152b](https://github.com/sanity-io/sanity/commit/184152bdcbaba5e0e81a6b5ec4eb2ec0b02c1bad)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v2 (major) ([#11028](https://github.com/sanity-io/sanity/issues/11028)) ([786e057](https://github.com/sanity-io/sanity/commit/786e057aea2047362184c0e408254d29f7ab8f47)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext to v4 (major) ([#11027](https://github.com/sanity-io/sanity/issues/11027)) ([73dcb1d](https://github.com/sanity-io/sanity/commit/73dcb1d157492e9f7e9c9c8db0df3be10eb07997)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **e2e-test:** deleting the document crashes the test ([#11002](https://github.com/sanity-io/sanity/issues/11002)) ([33588e7](https://github.com/sanity-io/sanity/commit/33588e7d5a0cd1303138eefcd2579c9c816226bb)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **e2e:** increase timeout for beforeEach in references popover test ([#11054](https://github.com/sanity-io/sanity/issues/11054)) ([8190fa4](https://github.com/sanity-io/sanity/commit/8190fa4e1ad1ed392a70fe3ecb7cbfc8edf8ac7d)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* replace deprecated `MarkdownPlugin` ([684c799](https://github.com/sanity-io/sanity/commit/684c799caa0f3f463ff14c72694a814108d682ab)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* replace deprecated `OneLinePlugin` ([78dcb72](https://github.com/sanity-io/sanity/commit/78dcb7266bf73b57160253dcb1f190748a512e9a)) by Christian Hamburger Grøngaard (christian.groengaard@sanity.io)
* **sanity:** add missing translation string ([#11001](https://github.com/sanity-io/sanity/issues/11001)) ([46263b9](https://github.com/sanity-io/sanity/commit/46263b9b186b7beab5a4d91e192099738d0cfaa2)) by Bjørge Næss (bjoerge@gmail.com)
* **studio:** pass asset type as context instead of argument ([#11038](https://github.com/sanity-io/sanity/issues/11038)) ([a105a57](https://github.com/sanity-io/sanity/commit/a105a5717792f0203413fdeacf55e8b4ba74cf69)) by Bjørge Næss (bjoerge@gmail.com)
* when releases disabled don't show create release options ([#11064](https://github.com/sanity-io/sanity/issues/11064)) ([7956975](https://github.com/sanity-io/sanity/commit/7956975faa05fff9bd34c571f655d9769d0142c2)) by Jordan Lawrence (jordanl17@me.com)

## [4.13.0](https://github.com/sanity-io/sanity/compare/v4.12.0...v4.13.0) (2025-11-03)

### Features

* Add shopify domain to shopify template ([#10983](https://github.com/sanity-io/sanity/issues/10983)) ([6138bda](https://github.com/sanity-io/sanity/commit/6138bda22905993b66b678d23d2ced43db23e060)) by Indrek Kärner (152283155+indrekkarner@users.noreply.github.com)
* **cli/blueprints:** doctor command ([#10987](https://github.com/sanity-io/sanity/issues/10987)) ([7485f28](https://github.com/sanity-io/sanity/commit/7485f28d37a3b8dddd8b8f07b404fcbf3cbf0f33)) by Taylor Beseda (tbeseda@gmail.com)
* **core:** array item upload progress tracking ([#10911](https://github.com/sanity-io/sanity/issues/10911)) ([4ed970b](https://github.com/sanity-io/sanity/commit/4ed970bfb1e63a7d8ae7ea4a05a06068d7dc856a)) by Per-Kristian Nordnes (per.kristian.nordnes@gmail.com)

### Bug Fixes

* add showTimeZone prop to DateTimeInput and ScheduleDraftDialog ([#10950](https://github.com/sanity-io/sanity/issues/10950)) ([343ab1a](https://github.com/sanity-io/sanity/commit/343ab1a46950fc969a78ba42132afdf711649c76)) by Jordan Lawrence (jordanl17@me.com)
* add translation for scheduled draft release title ([#10970](https://github.com/sanity-io/sanity/issues/10970)) ([0a5a713](https://github.com/sanity-io/sanity/commit/0a5a713f2d47298a27b6b70498b72a51be33ba48)) by Jordan Lawrence (jordanl17@me.com)
* **ci:** update slack GH action usage after major version bump ([#10986](https://github.com/sanity-io/sanity/issues/10986)) ([e404554](https://github.com/sanity-io/sanity/commit/e40455427ce66449fdae89292e22c78ce5fe193b)) by Bjørge Næss (bjoerge@gmail.com)
* **cli:** fix error when running sanity undeploy for app ([#10993](https://github.com/sanity-io/sanity/issues/10993)) ([25874c0](https://github.com/sanity-io/sanity/commit/25874c04aa96bc6afe16cbc88d3467da63a46d1a)) by Bjørge Næss (bjoerge@gmail.com)
* **codegen:** handle resolution of deeply nested imports using re-exports ([#10982](https://github.com/sanity-io/sanity/issues/10982)) ([16c45f5](https://github.com/sanity-io/sanity/commit/16c45f56c1a14ae2f90ab351e6d609094daa24e2)) by Ragnar Rognstad (rognstad.ragnar@gmail.com)
* **core:** fixes issue where Sanity crashes when process is not defined ([#10978](https://github.com/sanity-io/sanity/issues/10978)) ([1f5b1aa](https://github.com/sanity-io/sanity/commit/1f5b1aae2723b6979c279a2a3a2be6286b6cde24)) by Davey Kropf (dkropf@kaliber.net)
* **core:** use event timestamp in revision status line ([#10961](https://github.com/sanity-io/sanity/issues/10961)) ([b402b93](https://github.com/sanity-io/sanity/commit/b402b93a012be8c6c20e9f15523bd2a6e732d162)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** catalog vitest, jsdom add overrides ([a54467e](https://github.com/sanity-io/sanity/commit/a54467e2e5a2b6cd0fceb46b37f3143577cb45bc)) by Bjørge Næss (bjoerge@gmail.com)
* **deps:** update dependency @sanity/client to ^7.12.0 ([#10896](https://github.com/sanity-io/sanity/issues/10896)) ([9f72cc6](https://github.com/sanity-io/sanity/commit/9f72cc6608d81e14692ea0e0538169c23b5b9253)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/comlink to v4 ([#10897](https://github.com/sanity-io/sanity/issues/10897)) ([e539491](https://github.com/sanity-io/sanity/commit/e53949130fdd2f10926febc52537a5d6387cdd42)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/presentation-comlink to v2 ([#10898](https://github.com/sanity-io/sanity/issues/10898)) ([53640e2](https://github.com/sanity-io/sanity/commit/53640e2e8fd06bd1eb7c379b5674eac00c262e01)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#10977](https://github.com/sanity-io/sanity/issues/10977)) ([3fe929d](https://github.com/sanity-io/sanity/commit/3fe929d56356f3d58c2b0d1ad87f520e7bbcb7ea)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **efps:** allow setting apihost via env ([#10953](https://github.com/sanity-io/sanity/issues/10953)) ([999c5ca](https://github.com/sanity-io/sanity/commit/999c5ca9ac1f83023036b43c4b63cf5518d1b580)) by Bjørge Næss (bjoerge@gmail.com)
* **efps:** fix bad quote ([#10967](https://github.com/sanity-io/sanity/issues/10967)) ([1e0a7fd](https://github.com/sanity-io/sanity/commit/1e0a7fd2357e1b22d2037bde4fbf7a8dbd597433)) by Bjørge Næss (bjoerge@gmail.com)
* hide upsell when schedules exist ([#10988](https://github.com/sanity-io/sanity/issues/10988)) ([a97d446](https://github.com/sanity-io/sanity/commit/a97d44694d55d44d8937b01d9dc239dfd66095db)) by Jordan Lawrence (jordanl17@me.com)
* resolving issues with nesting inside parent popover for delete and pub now actions ([#10973](https://github.com/sanity-io/sanity/issues/10973)) ([208da88](https://github.com/sanity-io/sanity/commit/208da8889d0dea3f78d7a6961e72d8f62012fcb3)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** apply proper fix for missing `process` global ([#10996](https://github.com/sanity-io/sanity/issues/10996)) ([5fec59e](https://github.com/sanity-io/sanity/commit/5fec59ea8f173d02166fde96026fbea9a36d0f81)) by Bjørge Næss (bjoerge@gmail.com)
* **structure,presentation:** no extraneous deps eslint warning ([0fd0268](https://github.com/sanity-io/sanity/commit/0fd026892e688b4c630dae661a011a741531e165)) by pedrobonamin (pedrobonamin@gmail.com)
* **structure,presentation:** no extraneous deps eslint warning ([#10976](https://github.com/sanity-io/sanity/issues/10976)) ([97da840](https://github.com/sanity-io/sanity/commit/97da840f27d57bed804dc31a91f81ee37f0b00cb)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **structure:** add document perspective provider for scheduled drafts ([#10991](https://github.com/sanity-io/sanity/issues/10991)) ([cf45a72](https://github.com/sanity-io/sanity/commit/cf45a72102e1764cbb89d02e2a6b077a556e5761)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* update Popover component to allow overriding animation behavior ([#10966](https://github.com/sanity-io/sanity/issues/10966)) ([1c21bf8](https://github.com/sanity-io/sanity/commit/1c21bf84084666f946801fc58b18f67b6a8c5935)) by Jordan Lawrence (jordanl17@me.com)
* use www for sanity website urls ([#10994](https://github.com/sanity-io/sanity/issues/10994)) ([de66f58](https://github.com/sanity-io/sanity/commit/de66f58229ed3999cd2c193cac6df48aa3046e58)) by Bjørge Næss (bjoerge@gmail.com)

## [4.12.0](https://github.com/sanity-io/sanity/compare/v4.11.0...v4.12.0) (2025-10-28)

### Features

* add config flag for nested object dialog (beta) ([#10912](https://github.com/sanity-io/sanity/issues/10912)) ([07a25d3](https://github.com/sanity-io/sanity/commit/07a25d3d1b79b926b2df2e5818f7878c6a36ade9)) by RitaDias (rita@sanity.io)
* add initial  approach to a nested objects navigation dialog ([#10759](https://github.com/sanity-io/sanity/issues/10759)) ([c1be253](https://github.com/sanity-io/sanity/commit/c1be2530095d24a0190903c39f3a407ba1e83111)) by RitaDias (rita@sanity.io)
* **core:** adds single doc releases plugin. ([#10890](https://github.com/sanity-io/sanity/issues/10890)) ([2607d79](https://github.com/sanity-io/sanity/commit/2607d796a43b0bfbb5b75c0034c1d5902a2df74b)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** adds View scheduled drafts menu action for scheduled drafts ([#10923](https://github.com/sanity-io/sanity/issues/10923)) ([2747339](https://github.com/sanity-io/sanity/commit/2747339182620a61e56281e807fa9067810fb9a0)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** Scheduled drafts upsell ([#10933](https://github.com/sanity-io/sanity/issues/10933)) ([d0a8a7e](https://github.com/sanity-io/sanity/commit/d0a8a7e6d26d0a357370b7adf03a168991b2e6a0)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **media:** allow setting aspect definition to public ([#10900](https://github.com/sanity-io/sanity/issues/10900)) ([810bf28](https://github.com/sanity-io/sanity/commit/810bf28acd1ca80696297dbb16192ae771ceb6f8)) by Sindre Gulseth (sgulseth@gmail.com)
* **sanity:** add `compareValue` to input component props ([9f6ee90](https://github.com/sanity-io/sanity/commit/9f6ee9072e285779a30bf9e92c24c65d85d5024e)) by Ash (ash@sanity.io)
* **sanity:** add inline diff support to Portable Text Editor ([75e44c2](https://github.com/sanity-io/sanity/commit/75e44c2bde768052892bf69b6fc441edd9b1d918)) by Ash (ash@sanity.io)
* **sanity:** increase specificity of string diff segment styles ([53d7c15](https://github.com/sanity-io/sanity/commit/53d7c15e91081bcca08869edcb9858fc9819c8c2)) by Ash (ash@sanity.io)
* **sanity:** skip unnecessary work when inline changes not switched on ([847673d](https://github.com/sanity-io/sanity/commit/847673d8f0710ce76f3011d0a80d16890d32a60a)) by Ash (ash@sanity.io)
* **sanity:** support custom `anchorPath` and `focusPath` in `computeRangeDecorations` ([5f45705](https://github.com/sanity-io/sanity/commit/5f4570577369559667d2180f5f096b88704795dc)) by Ash (ash@sanity.io)
* schedule dangling active cardinality one releases ([#10941](https://github.com/sanity-io/sanity/issues/10941)) ([c8e7f48](https://github.com/sanity-io/sanity/commit/c8e7f48b6a563c65bfebd6076a9a518e0a725f7a)) by Jordan Lawrence (jordanl17@me.com)
* showing document validation errors inside scheduled drafts list ([#10948](https://github.com/sanity-io/sanity/issues/10948)) ([3d9ff3b](https://github.com/sanity-io/sanity/commit/3d9ff3bfe28a75fb05c3ca3359d2fc6afc415271)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **auth:** having no roles array on your user marks you as unauthorized ([#10932](https://github.com/sanity-io/sanity/issues/10932)) ([266eca8](https://github.com/sanity-io/sanity/commit/266eca8cbcaaebb3559401f6ce1588a1ddd9f419)) by Josh (37798644+joshuaellis@users.noreply.github.com)
* **auth:** include authenticated in roles check ([7fe20a1](https://github.com/sanity-io/sanity/commit/7fe20a1bd5bd14d8dbbf56350b6e696a02829f22)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** avoid workspace dependent hook CorsOriginError view ([#10935](https://github.com/sanity-io/sanity/issues/10935)) ([73e6173](https://github.com/sanity-io/sanity/commit/73e6173220309fac9553525af6af1b5413ee388c)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** close icon alignment in studio announcements card ([#10909](https://github.com/sanity-io/sanity/issues/10909)) ([e641a1c](https://github.com/sanity-io/sanity/commit/e641a1ce3304e3d9493fabadf70c9680332d8350)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** don't open release create dialog after clicking documentation link ([#10944](https://github.com/sanity-io/sanity/issues/10944)) ([92739bb](https://github.com/sanity-io/sanity/commit/92739bba60d9e86e13126aec29c3231e82f28d36)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** remove useRawPerspective in favor of perspective ([#10947](https://github.com/sanity-io/sanity/issues/10947)) ([1e9d639](https://github.com/sanity-io/sanity/commit/1e9d6399848ee187eb7bf46c0779cc232fd35d30)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** single doc scheduled publishing updates ([#10884](https://github.com/sanity-io/sanity/issues/10884)) ([a68bab9](https://github.com/sanity-io/sanity/commit/a68bab971d16ecf575fdd8c137335bd8feda986d)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **core:** use release limit instead of count for upsell dialog ([#10929](https://github.com/sanity-io/sanity/issues/10929)) ([14a614c](https://github.com/sanity-io/sanity/commit/14a614c49583d175c98dd74bd3d10b5b4714a1e3)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** update dependency @portabletext/editor to ^2.15.5 ([#10927](https://github.com/sanity-io/sanity/issues/10927)) ([d62524f](https://github.com/sanity-io/sanity/commit/d62524f3a3c2ed9c48d9103d37b43afd57cf36f4)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#10902](https://github.com/sanity-io/sanity/issues/10902)) ([f829425](https://github.com/sanity-io/sanity/commit/f829425f5fa0ff5ec0e0b7b8e103322ab5f49bb9)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* overflow for titles ([#10943](https://github.com/sanity-io/sanity/issues/10943)) ([2a7757c](https://github.com/sanity-io/sanity/commit/2a7757c3f134165456f0f28a4046d429b372dc36)) by RitaDias (rita@sanity.io)
* rescheduling scheduled draft updates metadata.intendedPublishAt too ([#10919](https://github.com/sanity-io/sanity/issues/10919)) ([66b1858](https://github.com/sanity-io/sanity/commit/66b18583c288785b382b3090e1666a630e4269bd)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** add more detailed version info for deployed test-studios ([#10908](https://github.com/sanity-io/sanity/issues/10908)) ([b2c8975](https://github.com/sanity-io/sanity/commit/b2c8975b64ee9cda5927e6dfd1824df50aa946f2)) by Bjørge Næss (bjoerge@gmail.com)
* **sanity:** handle processing video assets ([#10949](https://github.com/sanity-io/sanity/issues/10949)) ([abf39f7](https://github.com/sanity-io/sanity/commit/abf39f760a3c522cff819172c53484f8ad162865)) by Fred Carlsen (fred@sjelfull.no)
* **sanity:** PTE error upon patch type unexpected by optimistic change handler ([e453150](https://github.com/sanity-io/sanity/commit/e4531502cdbdeb31cbb2d413fff5107d4e292c98)) by Ash (ash@sanity.io)
* **sanity:** scrolling in expanded Portable Text Editor ([7519fdb](https://github.com/sanity-io/sanity/commit/7519fdbfb6aa68a80c8f04cdc3c3a3ce57d599e4)) by Ash (ash@sanity.io)

## [4.11.0](https://github.com/sanity-io/sanity/compare/v4.10.3...v4.11.0) (2025-10-21)

### Features

* **sanity:** add UI control for toggling visibility of inline changes ([2f71623](https://github.com/sanity-io/sanity/commit/2f716237597c3887c2a2f18c98ce6d9e8ec8d279)) by Ash (ash@sanity.io)
* scheduled drafts uses `sanity.config` property proper to disable ([#10635](https://github.com/sanity-io/sanity/issues/10635)) ([50a2e6e](https://github.com/sanity-io/sanity/commit/50a2e6e695e352f6878782686049995a58bc40f3)) by Jordan Lawrence (jordanl17@me.com)

### Bug Fixes

* **cli:** pipe stderr when installing dependencies ([#10839](https://github.com/sanity-io/sanity/issues/10839)) ([704a357](https://github.com/sanity-io/sanity/commit/704a357fc0c0e172fc9f4c5c44e5ed275e4895fe)) by Bjørge Næss (bjoerge@gmail.com)
* **core:** mention options in tasks comments showing as unauthorized ([#10832](https://github.com/sanity-io/sanity/issues/10832)) ([6c34de9](https://github.com/sanity-io/sanity/commit/6c34de9c4362734aabfd2af22e1de982a9529903)) by Pedro Bonamin (46196328+pedrobonamin@users.noreply.github.com)
* **deps:** Update CodeMirror ([#10876](https://github.com/sanity-io/sanity/issues/10876)) ([2a973f2](https://github.com/sanity-io/sanity/commit/2a973f24996571d9c1c3910eddf02c233b0984ab)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @portabletext/to-html to v3 ([#10882](https://github.com/sanity-io/sanity/issues/10882)) ([bbadd73](https://github.com/sanity-io/sanity/commit/bbadd73136420ec2115787e30b09c438b8e7c84b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/client to ^7.12.0 ([#10838](https://github.com/sanity-io/sanity/issues/10838)) ([3250d26](https://github.com/sanity-io/sanity/commit/3250d26aa4818df2c086db75d677b32ab9f71628)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/comlink to ^3.1.1 ([#10880](https://github.com/sanity-io/sanity/issues/10880)) ([3ab3368](https://github.com/sanity-io/sanity/commit/3ab336840780b69c74e1038b025c0e745934dc28)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/insert-menu to v2.1.0 ([#10881](https://github.com/sanity-io/sanity/issues/10881)) ([43d06fe](https://github.com/sanity-io/sanity/commit/43d06fe154096def1f015124df581ef9894612af)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/mutate to ^0.14.0 ([#10837](https://github.com/sanity-io/sanity/issues/10837)) ([0d5e3cb](https://github.com/sanity-io/sanity/commit/0d5e3cb544e84f22430f6e5f8730d561f98d43ad)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.33 ([#10870](https://github.com/sanity-io/sanity/issues/10870)) ([6e450a6](https://github.com/sanity-io/sanity/commit/6e450a653a7e2fc618b55dabe5f4f406ecb0b53f)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency framer-motion to ^12.23.24 ([#10877](https://github.com/sanity-io/sanity/issues/10877)) ([fd13c36](https://github.com/sanity-io/sanity/commit/fd13c3611197df326bfb42674b024f94f28d9735)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency groq-js to ^1.20.0 ([#10852](https://github.com/sanity-io/sanity/issues/10852)) ([ae0f0c7](https://github.com/sanity-io/sanity/commit/ae0f0c78f89281b48f0dec0340ae55acf51c768b)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency react-rx to ^4.2.2 ([#10879](https://github.com/sanity-io/sanity/issues/10879)) ([eae61c8](https://github.com/sanity-io/sanity/commit/eae61c89753246e6e773968fea8248855c46ae72)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** update dependency xstate to ^5.23.0 ([#10872](https://github.com/sanity-io/sanity/issues/10872)) ([41d75ca](https://github.com/sanity-io/sanity/commit/41d75cacfbb222deaab3a741277a4ad21cd77cf2)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* **deps:** Update portabletext ([#10851](https://github.com/sanity-io/sanity/issues/10851)) ([0562b47](https://github.com/sanity-io/sanity/commit/0562b472be4698fbf56be908c9218a03e59dfd8a)) by renovate[bot] (29139614+renovate[bot]@users.noreply.github.com)
* fix issue where publishing a release with drafts disabled would lead to the draft perspective ([#10833](https://github.com/sanity-io/sanity/issues/10833)) ([ad2adb7](https://github.com/sanity-io/sanity/commit/ad2adb7123831b189fa79bae5cf80dbe26c05c59)) by RitaDias (rita@sanity.io)
* issues where switching date that didn't mirror the local timezone would have issues with the hours / picked dates ([#10830](https://github.com/sanity-io/sanity/issues/10830)) ([e7289bd](https://github.com/sanity-io/sanity/commit/e7289bdb832c05c6a852cca6e7dc1c541600b370)) by RitaDias (rita@sanity.io)
* published document uses the draft document's title ([#10827](https://github.com/sanity-io/sanity/issues/10827)) ([6c81fa3](https://github.com/sanity-io/sanity/commit/6c81fa3986351fca4688bc88fec877ba94247ce6)) by Jordan Lawrence (jordanl17@me.com)
* **sanity:** do not compute inline diff using comparison value if there is no upstream version ([7a76727](https://github.com/sanity-io/sanity/commit/7a767271febd5227312d98b444cf98440d713c0c)) by Ash (ash@sanity.io)
* **sanity:** stale read-only styles rendered for `StringInputPortableText` ([be29073](https://github.com/sanity-io/sanity/commit/be290730035bc97b00ea6def53d0b7e576fb957b)) by Ash (ash@sanity.io)

## [4.10.3](https://github.com/sanity-io/sanity/compare/v4.10.2...v4.10.3) (2025-10-14)

### Bug Fixes

* add --prod when in main ([#10787](https://github.com/sanity-io/sanity/issues/10787)) ([39ad712](https://github.com/sanity-io/sanity/commit/39ad712d47bcf824bd50cb64cfcc1dd134e7cbfb))
* **cli:** default dashboard url should use dev as the search param not url ([#10813](https://github.com/sanity-io/sanity/issues/10813)) ([9c34aff](https://github.com/sanity-io/sanity/commit/9c34affda6738231d52a7e3e3d2ff2d1b5f08aca))
* datetime custom types resolves field wrapper ([#10809](https://github.com/sanity-io/sanity/issues/10809)) ([f3ab8cd](https://github.com/sanity-io/sanity/commit/f3ab8cd00632c33020febf7187ff4073ac65f54a))
* **deps:** update dependency @portabletext/block-tools to ^3.5.10 ([#10807](https://github.com/sanity-io/sanity/issues/10807)) ([3f5441b](https://github.com/sanity-io/sanity/commit/3f5441bc1d21f0c8b9b2d08877a193b2225d2cb0))
* **deps:** update dependency @portabletext/block-tools to ^3.5.9 ([#10794](https://github.com/sanity-io/sanity/issues/10794)) ([a16f5b9](https://github.com/sanity-io/sanity/commit/a16f5b98dc9ab1c193dc77ed3d0cb8dc8f9aaa84))
* **deps:** update dependency @portabletext/editor to ^2.13.4 ([#10795](https://github.com/sanity-io/sanity/issues/10795)) ([b89f08a](https://github.com/sanity-io/sanity/commit/b89f08a367e51ac020f7a2f3fb854cd1ced99fd3))
* **deps:** update dependency @portabletext/editor to ^2.13.7 ([#10801](https://github.com/sanity-io/sanity/issues/10801)) ([f976597](https://github.com/sanity-io/sanity/commit/f97659787dc5bfb0e0d8464768200805e3fbd00a))
* **deps:** update dependency @sanity/client to ^7.11.2 ([#10796](https://github.com/sanity-io/sanity/issues/10796)) ([a06dd5b](https://github.com/sanity-io/sanity/commit/a06dd5bbeac4a9e4a106cd6839358a7059052989))
* **deps:** update dependency @sanity/client to ^7.12.0 ([#10802](https://github.com/sanity-io/sanity/issues/10802)) ([391127a](https://github.com/sanity-io/sanity/commit/391127adf802b946deba689f64099cb4ee306e61))
* **deps:** update React Compiler dependencies 🤖 ✨ ([#10808](https://github.com/sanity-io/sanity/issues/10808)) ([74e5445](https://github.com/sanity-io/sanity/commit/74e54453b1eb032179c11cc1def82fc71d8eb08d))
* fix issue related to the efps stuff ([#10793](https://github.com/sanity-io/sanity/issues/10793)) ([4231352](https://github.com/sanity-io/sanity/commit/4231352b0fe9e65a3f6c6d679cddb7a5d184d087))

## [4.10.2](https://github.com/sanity-io/sanity/compare/v4.10.1...v4.10.2) (2025-09-30)

### Bug Fixes

* **cli:** pass appType param when fetching existing SDK apps ([#10775](https://github.com/sanity-io/sanity/issues/10775)) ([b870af5](https://github.com/sanity-io/sanity/commit/b870af5f1ca1fb9011d25b559cb0dbccfe40179d))
* **cli:** remove redundant curly brace in code example ([#10781](https://github.com/sanity-io/sanity/issues/10781)) ([792c250](https://github.com/sanity-io/sanity/commit/792c250c149ee9a782e48f38fdfca0badfb1f0e2))
* **core:** avoid repeated requests in case of failing project requests ([#10770](https://github.com/sanity-io/sanity/issues/10770)) ([c03497f](https://github.com/sanity-io/sanity/commit/c03497f939b5cd0107bb333c9a2f41eae03c49ad))
* delay teardown of get-org-id request ([#10771](https://github.com/sanity-io/sanity/issues/10771)) ([de40474](https://github.com/sanity-io/sanity/commit/de40474d2e8b945634194ee77882945bdbd463f2))
* **deps:** update dependency @portabletext/block-tools to ^3.5.8 ([#10783](https://github.com/sanity-io/sanity/issues/10783)) ([13ef5e3](https://github.com/sanity-io/sanity/commit/13ef5e3771b87497d3e678f829cf572dd5dfb1ca))
* **deps:** update dependency @portabletext/editor to ^2.13.3 ([#10784](https://github.com/sanity-io/sanity/issues/10784)) ([b6c49ab](https://github.com/sanity-io/sanity/commit/b6c49ab7bc71b7631a9e2ce0dea2261a61adb691))
* **deps:** update dependency framer-motion to ^12.23.22 ([#10768](https://github.com/sanity-io/sanity/issues/10768)) ([268d44a](https://github.com/sanity-io/sanity/commit/268d44a75080da1ced68ae7efbe088c9ab233ac0))
* **deps:** update React Compiler dependencies 🤖 ✨ ([#10777](https://github.com/sanity-io/sanity/issues/10777)) ([128ea47](https://github.com/sanity-io/sanity/commit/128ea47658c270baaa5f09a66739acae86abf66d))
* only reading server metadata when unfocused from input ([#10749](https://github.com/sanity-io/sanity/issues/10749)) ([a255a6d](https://github.com/sanity-io/sanity/commit/a255a6d894d0be3f5d82a716909ddcda0e7ad257))
* **structure:** pass the same documentId to the favorite toggle as to history ([#10779](https://github.com/sanity-io/sanity/issues/10779)) ([fb9257f](https://github.com/sanity-io/sanity/commit/fb9257f8066abbe4d1c17658d1a6a632fc92fa79))
* the main efps also needs to be deployed ([#10786](https://github.com/sanity-io/sanity/issues/10786)) ([8430ecf](https://github.com/sanity-io/sanity/commit/8430ecf63ddb1bc30f45ff93e00330ab505f1761))
* use www for website urls ([#10788](https://github.com/sanity-io/sanity/issues/10788)) ([071e54e](https://github.com/sanity-io/sanity/commit/071e54ef0af37cc5c5b213bf1d12a63583b1d4e6))

## [4.10.1](https://github.com/sanity-io/sanity/compare/v4.10.0...v4.10.1) (2025-09-25)

### Bug Fixes

* **core:** wrap useReferringDocuments projection in curly braces ([#10750](https://github.com/sanity-io/sanity/issues/10750)) ([8e15373](https://github.com/sanity-io/sanity/commit/8e1537391d8ee80873213e7916b796895c0512dd))
* **deps:** update dependency @portabletext/editor to ^2.13.1 ([#10747](https://github.com/sanity-io/sanity/issues/10747)) ([5edcd32](https://github.com/sanity-io/sanity/commit/5edcd328ad3e8cfff1c2677b44c8ad2bfa298316))
* **deps:** update dependency @portabletext/editor to ^2.13.2 ([#10752](https://github.com/sanity-io/sanity/issues/10752)) ([962c5b0](https://github.com/sanity-io/sanity/commit/962c5b01037e488a4ef0e3c1620828b4fc406a98))
* **deps:** update dependency groq-js to ^1.19.0 ([#10751](https://github.com/sanity-io/sanity/issues/10751)) ([0e61cf3](https://github.com/sanity-io/sanity/commit/0e61cf345b61c49a2408c40210e60aa165ea8a97))
* fix issue where single workspaces weren't opening the dropdown to show the new manage actions ([#10746](https://github.com/sanity-io/sanity/issues/10746)) ([29fdbfe](https://github.com/sanity-io/sanity/commit/29fdbfec1387979b984fdaf446d31977f7690e70))
* **sanity:** make new manage links staging aware ([#10753](https://github.com/sanity-io/sanity/issues/10753)) ([db183ef](https://github.com/sanity-io/sanity/commit/db183ef64afb49cbf38a6959f2fd51bfbb4042fb))
* **sanity:** pasting Portable Text data into `StringInputPortableText` ([#10748](https://github.com/sanity-io/sanity/issues/10748)) ([0f14b5c](https://github.com/sanity-io/sanity/commit/0f14b5c4ef8843c4163b3cebd9d20ac54677b0d2))
* **sanity:** use the correct colour for diffs in draft versions ([#10738](https://github.com/sanity-io/sanity/issues/10738)) ([1b86d66](https://github.com/sanity-io/sanity/commit/1b86d66400b5765c08985dbc1e72b7d09a955a41))

## [4.10.0](https://github.com/sanity-io/sanity/compare/v4.9.0...v4.10.0) (2025-09-23)

### Features

* add the dev/efps for vercel deployment project ([#10661](https://github.com/sanity-io/sanity/issues/10661)) ([22d5689](https://github.com/sanity-io/sanity/commit/22d5689b741bda0682abedae85ee00492615d886))
* **sanity:** add strict version layering ([cdb7d83](https://github.com/sanity-io/sanity/commit/cdb7d83d5e0b5443627730d19765d0853d42c280))
* **sanity:** export `getDocumentIsInPerspective` ([066182d](https://github.com/sanity-io/sanity/commit/066182d252f6b1843ea3ec594407721279c3e00d))
* **sanity:** use strict version layering when opening document comparison view ([c11fbe5](https://github.com/sanity-io/sanity/commit/c11fbe5e581753269ecc4ce4bf0e7886bc1fb82e))
* **sanity:** use upstream version as comparison value in document editor ([#10655](https://github.com/sanity-io/sanity/issues/10655)) ([1b4ee38](https://github.com/sanity-io/sanity/commit/1b4ee386822f114f9aac638dc0561aa03eed078c))
* update recipes from deprecations and add qroq functions ([#10613](https://github.com/sanity-io/sanity/issues/10613)) ([bd456d6](https://github.com/sanity-io/sanity/commit/bd456d681441ac31b6b8a210f2276e1d31c5a574))

### Bug Fixes

* **core:** sanitize authorization header from copy error details ([#10582](https://github.com/sanity-io/sanity/issues/10582)) ([8feeace](https://github.com/sanity-io/sanity/commit/8feeacea5b35845f8a3e88230d5d38cda90cd117))
* **core:** tasks due dates showing incorrect value on timezones behind UTC ([#10680](https://github.com/sanity-io/sanity/issues/10680)) ([a033aad](https://github.com/sanity-io/sanity/commit/a033aad7d2d741a1841e0019a014626b204b5ae4))
* **deps:** update dependency @portabletext/block-tools to ^3.5.6 ([#10662](https://github.com/sanity-io/sanity/issues/10662)) ([8168375](https://github.com/sanity-io/sanity/commit/816837593ede0ba4ef4bcd421de82e507c6806e8))
* **deps:** update dependency @portabletext/block-tools to ^3.5.7 ([#10722](https://github.com/sanity-io/sanity/issues/10722)) ([7eda14c](https://github.com/sanity-io/sanity/commit/7eda14cbce435ad5a9983fec566e4956502d732d))
* **deps:** update dependency @portabletext/editor to ^2.12.1 ([#10663](https://github.com/sanity-io/sanity/issues/10663)) ([6387c2a](https://github.com/sanity-io/sanity/commit/6387c2a9840b47f2652f9c229c8f9511453d9770))
* **deps:** update dependency @portabletext/editor to ^2.12.3 ([#10716](https://github.com/sanity-io/sanity/issues/10716)) ([97f5149](https://github.com/sanity-io/sanity/commit/97f5149309d0e78f2d972a84036cc3a739d7862c))
* **deps:** update dependency @portabletext/editor to ^2.13.0 ([#10736](https://github.com/sanity-io/sanity/issues/10736)) ([a964a24](https://github.com/sanity-io/sanity/commit/a964a2419f1fac50fdbfbde18440bc8c214612c8))
* **deps:** update dependency @sanity/client to ^7.11.2 ([#10667](https://github.com/sanity-io/sanity/issues/10667)) ([3d3ea0d](https://github.com/sanity-io/sanity/commit/3d3ea0df4bad43af82ae6b10f0c2ca6c7270bfeb))
* **deps:** update dependency @sanity/ui to ^3.1.3 ([#10673](https://github.com/sanity-io/sanity/issues/10673)) ([43d4d8e](https://github.com/sanity-io/sanity/commit/43d4d8e69cb78eaffca0e0c7bede1a84aab93b55))
* **deps:** update dependency @sanity/ui to ^3.1.4 ([#10691](https://github.com/sanity-io/sanity/issues/10691)) ([cbab31b](https://github.com/sanity-io/sanity/commit/cbab31b5d6c7ac8c36c8d2f044a0b336c1df7e61))
* **deps:** update dependency @sanity/ui to ^3.1.5 ([#10706](https://github.com/sanity-io/sanity/issues/10706)) ([1387e57](https://github.com/sanity-io/sanity/commit/1387e57333104649f3e9929864f34f7bf38c07b8))
* **deps:** update dependency framer-motion to ^12.23.13 ([#10651](https://github.com/sanity-io/sanity/issues/10651)) ([f0c5ca1](https://github.com/sanity-io/sanity/commit/f0c5ca1f09f72957d452fa068c7cb26ebad0aa08))
* **deps:** update dependency framer-motion to ^12.23.16 ([#10688](https://github.com/sanity-io/sanity/issues/10688)) ([299c200](https://github.com/sanity-io/sanity/commit/299c20072043b6aa2b2e4db9d298d4fdc7cfeb11))
* **deps:** update dependency framer-motion to ^12.23.18 ([#10701](https://github.com/sanity-io/sanity/issues/10701)) ([73f0dd6](https://github.com/sanity-io/sanity/commit/73f0dd6a1fc58cf35c9b41217f6880345d24d907))
* **deps:** update dependency framer-motion to ^12.23.19 ([#10728](https://github.com/sanity-io/sanity/issues/10728)) ([8e320db](https://github.com/sanity-io/sanity/commit/8e320db00c2562f165ae57436f0b987de192f644))
* **deps:** update dependency react-rx to ^4.2.1 ([#10717](https://github.com/sanity-io/sanity/issues/10717)) ([4d26a51](https://github.com/sanity-io/sanity/commit/4d26a51ac383d40436ccf26cbaac091717bba473))
* **deps:** update dependency xstate to ^5.22.0 ([#10690](https://github.com/sanity-io/sanity/issues/10690)) ([1893e40](https://github.com/sanity-io/sanity/commit/1893e40a7c16f4d6950a3a3b2637e416c76ba0bf))
* ignore env files ([#10684](https://github.com/sanity-io/sanity/issues/10684)) ([6e091b1](https://github.com/sanity-io/sanity/commit/6e091b18d1953bea1c566903432aa86228c9bb40))
* **sanity:** add a warning for version info dialog if appId is missing ([#10659](https://github.com/sanity-io/sanity/issues/10659)) ([dadb15c](https://github.com/sanity-io/sanity/commit/dadb15c6bf912ff3903d647f5eaa0f01545cc835))
* scheduled pub action only shows when releases enabled ([#10649](https://github.com/sanity-io/sanity/issues/10649)) ([15416c3](https://github.com/sanity-io/sanity/commit/15416c35ce6a9c60526d070322199b475e6b352e))
* **structure:** use origin for comments studio url ([#10677](https://github.com/sanity-io/sanity/issues/10677)) ([d1ebf15](https://github.com/sanity-io/sanity/commit/d1ebf15a1bb02b7b3da041ae5e7f1f1a74871d15))
* use generated react compiler typings ([#10672](https://github.com/sanity-io/sanity/issues/10672)) ([ac6c9a0](https://github.com/sanity-io/sanity/commit/ac6c9a09559c4ae33929f63f4379c73efec0f3f8))

## [4.9.0](https://github.com/sanity-io/sanity/compare/v4.8.1...v4.9.0) (2025-09-16)

### Features

* add "copy to clipboard" button to schema errors ([#10575](https://github.com/sanity-io/sanity/issues/10575)) ([635547b](https://github.com/sanity-io/sanity/commit/635547bad3252978f4a391a4902ec6ee8dd76ab6))
* adding in support for empty state releases when there are scheduled drafts ([#10625](https://github.com/sanity-io/sanity/issues/10625)) ([3d1c2dd](https://github.com/sanity-io/sanity/commit/3d1c2dd76464757019e0bdb8ed60fd683d0a4285))
* can only create a single concurrent scheduled draft per document ([#10624](https://github.com/sanity-io/sanity/issues/10624)) ([7ca2749](https://github.com/sanity-io/sanity/commit/7ca2749b7ceadb92da865f290fd5cfd668c61d9e))
* **cli:** Add delta flags to functions test command ([#10607](https://github.com/sanity-io/sanity/issues/10607)) ([166f7af](https://github.com/sanity-io/sanity/commit/166f7afc022c20a0e773256f238ab26d9e85d050))
* **core:** sapp 3054 scheduled draft doc actions ([#10622](https://github.com/sanity-io/sanity/issues/10622)) ([879a92e](https://github.com/sanity-io/sanity/commit/879a92eca99a0b71aa97383fe63f3a26b4fa871c))
* document perspective context ([#10578](https://github.com/sanity-io/sanity/issues/10578)) ([dce13e3](https://github.com/sanity-io/sanity/commit/dce13e3b58fc6c83c921869708349099601bc0c3))
* **init:** update next.js init template to next-sanity v11 ([#10610](https://github.com/sanity-io/sanity/issues/10610)) ([bd3d363](https://github.com/sanity-io/sanity/commit/bd3d3638612c4c605173390df495036a2a01fab6))
* schedule draft actions and releases tool ([#10534](https://github.com/sanity-io/sanity/issues/10534)) ([f8ec27a](https://github.com/sanity-io/sanity/commit/f8ec27adcd2f758ff55fac2c7b99855b69d671c7))
* specific banner for archived (or published) scheduled drafts ([#10630](https://github.com/sanity-io/sanity/issues/10630)) ([f581e9b](https://github.com/sanity-io/sanity/commit/f581e9b5c8537b031a94e413e66fe3835031d598))
* when scheduled drafts is enabled, showing banner in scheduled pub plugin ([#10642](https://github.com/sanity-io/sanity/issues/10642)) ([0014883](https://github.com/sanity-io/sanity/commit/0014883238de3d427e4691ae4a3c72c9c4aca57d))

### Bug Fixes

* **core:** make auto updating version check use appId ([#10637](https://github.com/sanity-io/sanity/issues/10637)) ([aab3811](https://github.com/sanity-io/sanity/commit/aab38114f34d6676df97f058a6e30b89f0959b76))
* **deps:** update dependency @portabletext/block-tools to ^3.5.5 ([#10614](https://github.com/sanity-io/sanity/issues/10614)) ([7a64fdf](https://github.com/sanity-io/sanity/commit/7a64fdf0a1b61fbdba0ab2642278d2fdceb06b35))
* **deps:** update dependency @portabletext/editor to ^2.8.4 ([#10615](https://github.com/sanity-io/sanity/issues/10615)) ([9c51cc5](https://github.com/sanity-io/sanity/commit/9c51cc588261b5c89f8f1575cab59e4c287de6be))
* **deps:** update dependency @portabletext/editor to ^2.9.0 ([#10621](https://github.com/sanity-io/sanity/issues/10621)) ([63d13b8](https://github.com/sanity-io/sanity/commit/63d13b8187027de1dbfc26a31228f65d5874d49c))
* **deps:** update dependency @portabletext/editor to ^2.9.1 ([#10626](https://github.com/sanity-io/sanity/issues/10626)) ([c62a30a](https://github.com/sanity-io/sanity/commit/c62a30a6aa95227f4ca1906541d230cd87299bf5))
* **deps:** update dependency @portabletext/editor to ^2.9.2 ([#10641](https://github.com/sanity-io/sanity/issues/10641)) ([38d7116](https://github.com/sanity-io/sanity/commit/38d7116afb1e9d34160007427cb4ea6f203aaa73))
* **deps:** update dependency @sanity/ui to ^3.1.0 ([#10627](https://github.com/sanity-io/sanity/issues/10627)) ([1a708b5](https://github.com/sanity-io/sanity/commit/1a708b5f58107ab9dc4dbcda67755e90e3b16596))
* **deps:** update React Compiler dependencies 🤖 ✨ ([#10639](https://github.com/sanity-io/sanity/issues/10639)) ([7ef8e25](https://github.com/sanity-io/sanity/commit/7ef8e2545d4093890a953dba74635f2c431cf1d3))
* **deps:** upgrade "@sanity/ui" to "^3.1.0" ([#10628](https://github.com/sanity-io/sanity/issues/10628)) ([acd73f4](https://github.com/sanity-io/sanity/commit/acd73f447ba8188f09d0106d5f726aa863852c97))
* issue where escaping form link popover over in fullscreen would escape the fullscreen first ([#10606](https://github.com/sanity-io/sanity/issues/10606)) ([ff66b1e](https://github.com/sanity-io/sanity/commit/ff66b1e8f04bb09b72e63cacbcf9743eadfbe20f))
* make links to manage staging aware ([#10638](https://github.com/sanity-io/sanity/issues/10638)) ([74a4895](https://github.com/sanity-io/sanity/commit/74a48956eac5c0b0b7738e042707a421d1bd8df1))
* popover issue when clicking different panes / references  ([#10618](https://github.com/sanity-io/sanity/issues/10618)) ([c41a2b1](https://github.com/sanity-io/sanity/commit/c41a2b172ca2f275985f8f6b2cfd4648f13b0ebc))

## [4.8.1](https://github.com/sanity-io/sanity/compare/v4.8.0...v4.8.1) (2025-09-10)

### Bug Fixes

* revert fix: popover issue when closing and clicking different panes ([#10608](https://github.com/sanity-io/sanity/issues/10608)) ([d0dba63](https://github.com/sanity-io/sanity/commit/d0dba63e7b254457ea8ff6992acff66f571603ab))

## [4.8.0](https://github.com/sanity-io/sanity/compare/v4.7.0...v4.8.0) (2025-09-10)

### Features

* **sanity:** compute node diffs lazily ([#10600](https://github.com/sanity-io/sanity/issues/10600)) ([6e048f2](https://github.com/sanity-io/sanity/commit/6e048f2ac007090dc2be688f7d84c09b3a5833a6))

### Bug Fixes

* **cli:** fix build error when using auto-updates with sdk apps ([#10581](https://github.com/sanity-io/sanity/issues/10581)) ([49bff69](https://github.com/sanity-io/sanity/commit/49bff6900df55b3e5925b741e94f303828769f0b))
* **deps:** Update babel monorepo to ^7.28.4 ([#10601](https://github.com/sanity-io/sanity/issues/10601)) ([cd6611a](https://github.com/sanity-io/sanity/commit/cd6611a87fc6f003434bb72629effd31f21a0ab2))
* **deps:** update dependency @portabletext/editor to ^2.8.3 ([#10570](https://github.com/sanity-io/sanity/issues/10570)) ([63acb06](https://github.com/sanity-io/sanity/commit/63acb0664682d92432a5b4a4336a82a290f064a0))
* **deps:** update dependency @sanity/client to ^7.11.1 ([#10593](https://github.com/sanity-io/sanity/issues/10593)) ([96d3546](https://github.com/sanity-io/sanity/commit/96d35461db9de547e7ddd3d8987501ae41f9423d))
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.15 ([#10588](https://github.com/sanity-io/sanity/issues/10588)) ([8269e81](https://github.com/sanity-io/sanity/commit/8269e81683afcf18eb68fc0446417288387a2276))
* handle uploading assets already existing in the ML ([#10495](https://github.com/sanity-io/sanity/issues/10495)) ([e4d8e43](https://github.com/sanity-io/sanity/commit/e4d8e4342510882c401682387148365c4be6e6f1))

## [4.7.0](https://github.com/sanity-io/sanity/compare/v4.6.1...v4.7.0) (2025-09-09)

### Features

* add validation per release on the release overview + add caching ([#10496](https://github.com/sanity-io/sanity/issues/10496)) ([7e8da03](https://github.com/sanity-io/sanity/commit/7e8da0308a067d0b5dfa12a68342903845da4903))
* **cli:** Add & update docstrings to AppConfig type ([#10514](https://github.com/sanity-io/sanity/issues/10514)) ([5be6ca4](https://github.com/sanity-io/sanity/commit/5be6ca438fccdd1ac2a57444bcde7b3ff937afb8))
* **cli:** Improve undeploy output for apps ([#10516](https://github.com/sanity-io/sanity/issues/10516)) ([f6809b4](https://github.com/sanity-io/sanity/commit/f6809b4b33566656972ac998d2fad5142921fd03))
* **cli:** Prevent GlobalErrorHandler from growing beyond viewport height ([#10510](https://github.com/sanity-io/sanity/issues/10510)) ([172d9a9](https://github.com/sanity-io/sanity/commit/172d9a9501d3df936d2ffeab290076cf98a8c4fb))
* **core:** custom release actions ([#10286](https://github.com/sanity-io/sanity/issues/10286)) ([28a774b](https://github.com/sanity-io/sanity/commit/28a774b271558ae288b7d7d3a00c9ec8659bd68a))
* **core:** sapp 2967 schedule publish drafts ([#10392](https://github.com/sanity-io/sanity/issues/10392)) ([e438808](https://github.com/sanity-io/sanity/commit/e438808cb0812c85ec06d284c40a222327d686a6))
* **descriptors:** handle validations ([#10457](https://github.com/sanity-io/sanity/issues/10457)) ([bb7e750](https://github.com/sanity-io/sanity/commit/bb7e750f3600592e8e8b7928a5b64efef0dd32d0))
* **descriptors:** serialize i18n properties ([#10540](https://github.com/sanity-io/sanity/issues/10540)) ([d71f9d3](https://github.com/sanity-io/sanity/commit/d71f9d349f0ab42d61aee1a2a82a99dfe75ed1fe))
* **descriptors:** serialize orderings properties ([#10550](https://github.com/sanity-io/sanity/issues/10550)) ([e6442a9](https://github.com/sanity-io/sanity/commit/e6442a96f06d3c156c314d81639d7192bc0c4c65))
* **limits:** Document Limits Upsell ([#10428](https://github.com/sanity-io/sanity/issues/10428)) ([4ff929d](https://github.com/sanity-io/sanity/commit/4ff929d9aa8b1d1ffee40f82f5465a2e053a86a1))
* **sanity:** add `StringInputPortableText` with inline diff support ([c8b4569](https://github.com/sanity-io/sanity/commit/c8b4569ed8c6d555340a1e75785e638d42f65f46))
* **sanity:** add diff props to input props ([e8733fb](https://github.com/sanity-io/sanity/commit/e8733fb7cbe6faf94566804de2a8f112d1102f6b))
* **sanity:** export `focusRingBorderStyle` ([f499eee](https://github.com/sanity-io/sanity/commit/f499eee7f89cf86fce3d7ec52381779a61d1e236))
* **sanity:** export `UpdateReadOnlyPlugin` ([fb5d670](https://github.com/sanity-io/sanity/commit/fb5d670ed43eecf228ac20ffa3fdc07e7ba9d872))
* **sanity:** graduate `SelectedPerspective` to public type `TargetPerspective` ([#10300](https://github.com/sanity-io/sanity/issues/10300)) ([d13666c](https://github.com/sanity-io/sanity/commit/d13666ce9e997f31e19edfceb9244729850ca026))
* **test-studio:** switch on advanced version control ([80cddca](https://github.com/sanity-io/sanity/commit/80cddca36b46700c2f836483d89e3a78a5c54cf3))

### Bug Fixes

* add caching to the useHistory in the releases + fix lastEditedByIssue ([#10564](https://github.com/sanity-io/sanity/issues/10564)) ([0e49e4c](https://github.com/sanity-io/sanity/commit/0e49e4c834a99ab3bee64ac6b4ed5ad7aaaef36f))
* **cli:** warn if engine requirements not met ([#10461](https://github.com/sanity-io/sanity/issues/10461)) ([739e913](https://github.com/sanity-io/sanity/commit/739e9135ded8b6f9b0be4e5d1bf36a531944a249))
* **core:** make sure empty strings aren't passed to the upload API ([#10558](https://github.com/sanity-io/sanity/issues/10558)) ([31fc081](https://github.com/sanity-io/sanity/commit/31fc081c5fe08eba2ca1719286c870bb499c9981))
* **core:** preserve local document state during intermittent disconnects ([#10528](https://github.com/sanity-io/sanity/issues/10528)) ([89954ae](https://github.com/sanity-io/sanity/commit/89954ae04d42236ef8855c43fc35d0cc2d1f4521))
* dedupe listener events ([#10529](https://github.com/sanity-io/sanity/issues/10529)) ([b552234](https://github.com/sanity-io/sanity/commit/b55223456cef737358d278cadff357982dd9ac53))
* **deps:** Update CodeMirror ([#10543](https://github.com/sanity-io/sanity/issues/10543)) ([47a88bc](https://github.com/sanity-io/sanity/commit/47a88bcca4a12aadfe370562dd832cd27fbd96f6))
* **deps:** update dependency @portabletext/block-tools to ^3.5.2 ([#10505](https://github.com/sanity-io/sanity/issues/10505)) ([b20a49e](https://github.com/sanity-io/sanity/commit/b20a49ef0614b566d3e2f6166c0805823e0bcfe5))
* **deps:** update dependency @portabletext/block-tools to ^3.5.3 ([#10535](https://github.com/sanity-io/sanity/issues/10535)) ([a52feb1](https://github.com/sanity-io/sanity/commit/a52feb11d59e082615dd6d2e3c3b3eba12dda89c))
* **deps:** update dependency @portabletext/block-tools to ^3.5.4 ([#10569](https://github.com/sanity-io/sanity/issues/10569)) ([f80859b](https://github.com/sanity-io/sanity/commit/f80859bc1760c67774e130dce58e0e90f70693a2))
* **deps:** update dependency @portabletext/editor to ^2.7.2 ([#10506](https://github.com/sanity-io/sanity/issues/10506)) ([7c4a145](https://github.com/sanity-io/sanity/commit/7c4a1451cdc943853c4015ffad3fbd2922a1cfb4))
* **deps:** update dependency @portabletext/editor to ^2.8.0 ([#10536](https://github.com/sanity-io/sanity/issues/10536)) ([e08eee0](https://github.com/sanity-io/sanity/commit/e08eee00e2de0e5c742d7689c0f9735829ff4b1a))
* **deps:** update dependency @portabletext/editor to ^2.8.1 ([#10555](https://github.com/sanity-io/sanity/issues/10555)) ([3c9eb4a](https://github.com/sanity-io/sanity/commit/3c9eb4aa4b59304fd88bd92e8298197131c63849))
* **deps:** update dependency @portabletext/editor to ^2.8.2 ([#10563](https://github.com/sanity-io/sanity/issues/10563)) ([d7be4ac](https://github.com/sanity-io/sanity/commit/d7be4ac250e7f8cb939e8d702db4b509c12d99c1))
* **deps:** update dependency @sanity/client to ^7.11.0 ([#10518](https://github.com/sanity-io/sanity/issues/10518)) ([5cfeba6](https://github.com/sanity-io/sanity/commit/5cfeba6b5d7f03c566740298ca4661c1066cc6aa))
* **deps:** update dependency @sanity/insert-menu to v2.0.2 ([#10554](https://github.com/sanity-io/sanity/issues/10554)) ([3fd0a59](https://github.com/sanity-io/sanity/commit/3fd0a59fb25fc9b6453b00bb9386446701fc49db))
* **deps:** update dependency @sanity/mutate to ^0.13.0 ([#10468](https://github.com/sanity-io/sanity/issues/10468)) ([0efa5b4](https://github.com/sanity-io/sanity/commit/0efa5b4a41fbbe56a4fac5b5596d80debfb4e0be))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.29 ([#10556](https://github.com/sanity-io/sanity/issues/10556)) ([fd5105c](https://github.com/sanity-io/sanity/commit/fd5105c448bf2ae96fa750ba7da855ca04942fc4))
* **deps:** update dependency @sanity/ui to ^3.0.11 ([#10538](https://github.com/sanity-io/sanity/issues/10538)) ([aa025d4](https://github.com/sanity-io/sanity/commit/aa025d4d98aa4c5c732196fdb36fa99e0c0e4694))
* **deps:** update dependency @sanity/ui to ^3.0.14 ([#10557](https://github.com/sanity-io/sanity/issues/10557)) ([8a1f41f](https://github.com/sanity-io/sanity/commit/8a1f41fad56b6c655d34701c955eda04567a4763))
* **deps:** update dependency groq-js to ^1.18.0 ([#10576](https://github.com/sanity-io/sanity/issues/10576)) ([176527f](https://github.com/sanity-io/sanity/commit/176527ff1aa281cb7a890e9abe00185a60263f2a))
* **deps:** Update dev-non-major ([#10544](https://github.com/sanity-io/sanity/issues/10544)) ([1855306](https://github.com/sanity-io/sanity/commit/185530655c2948d2b5223939608413e89eec7dc0))
* **deps:** update React Compiler dependencies 🤖 ✨ ([#10574](https://github.com/sanity-io/sanity/issues/10574)) ([edac169](https://github.com/sanity-io/sanity/commit/edac169f532be521759035b803ec12842fabeb4b))
* **diff:** exclude undefined entries when wrapping object for diff ([36fb066](https://github.com/sanity-io/sanity/commit/36fb0661a4507e362f666bfc39f2b4343ed2e7c5))
* improve PortalProvider and PopoverContainer perf ([#10549](https://github.com/sanity-io/sanity/issues/10549)) ([04b209b](https://github.com/sanity-io/sanity/commit/04b209bbbf123d117e2035909b84774ff97b1e35))
* issue where an unpublished documentwas howing up as undefined in the document list in a release detail ([#10568](https://github.com/sanity-io/sanity/issues/10568)) ([f58b8bb](https://github.com/sanity-io/sanity/commit/f58b8bbe4a16c581aa6f1f51650af32e6110cc09))
* issue where trying to revert revision would open two dialogs  ([#10559](https://github.com/sanity-io/sanity/issues/10559)) ([efc6b14](https://github.com/sanity-io/sanity/commit/efc6b14692f204c5945be02a9f356966879d66cd))
* log the correct error name ([#10532](https://github.com/sanity-io/sanity/issues/10532)) ([d22f8b3](https://github.com/sanity-io/sanity/commit/d22f8b30169e584deb92daf9d6f4636d56fc8d03))
* pass `react-hooks/purity` checks ([#10517](https://github.com/sanity-io/sanity/issues/10517)) ([9a53dd0](https://github.com/sanity-io/sanity/commit/9a53dd0677f7a910551b5371464578ac5cc2d3a6))
* popover issue when closing and clicking different panes ([#10577](https://github.com/sanity-io/sanity/issues/10577)) ([b30dbb1](https://github.com/sanity-io/sanity/commit/b30dbb17c0b2e41afb868759a62301eebad14a90))
* resolves revert change popover sometimes closing without bubbling click events ([#10486](https://github.com/sanity-io/sanity/issues/10486)) ([d3c3a94](https://github.com/sanity-io/sanity/commit/d3c3a941ab411b1faa4b03a7d7984f65a2708946))
* **sanity:** ETL errors caused by inferring union types from constant arrays ([#10509](https://github.com/sanity-io/sanity/issues/10509)) ([2d499ca](https://github.com/sanity-io/sanity/commit/2d499ca86688b9a0eee01ec6c458ff481a1ce186))
* **sanity:** use custom domain for video player ([#10541](https://github.com/sanity-io/sanity/issues/10541)) ([f404e21](https://github.com/sanity-io/sanity/commit/f404e2192bd98c3e9a01545ab70a1d0df594f692))
* **sanity:** use project host when fetching video playback info ([#10560](https://github.com/sanity-io/sanity/issues/10560)) ([9c12c97](https://github.com/sanity-io/sanity/commit/9c12c971328935eecdb442ca5ae6d77d6ed36a12))
* **structure:** always render history restore action if seeing revision ([#10562](https://github.com/sanity-io/sanity/issues/10562)) ([525e198](https://github.com/sanity-io/sanity/commit/525e198b39b47a07fd85c4d2d8cb3fdf53e3f44b))
* version document restore revision and revert changes actions ([#10537](https://github.com/sanity-io/sanity/issues/10537)) ([80a14f6](https://github.com/sanity-io/sanity/commit/80a14f60e463b304f019b550bb56d27959ef2aae))

## [4.6.1](https://github.com/sanity-io/sanity/compare/v4.6.0...v4.6.1) (2025-09-02)

### Features

* add auto-retry workflow for failed jobs ([#10466](https://github.com/sanity-io/sanity/issues/10466)) ([498d403](https://github.com/sanity-io/sanity/commit/498d40376f4e53f274849b989c07bf2fd39cb241))

### Bug Fixes

* **core:** preserve desync deadline when new mutation events arrive ([#10491](https://github.com/sanity-io/sanity/issues/10491)) ([41c9bac](https://github.com/sanity-io/sanity/commit/41c9baca3dfd5f3460dac24868466a17a1b4dd01))
* **core:** resolve uploader should work even if direct uploads is not allowed ([#10407](https://github.com/sanity-io/sanity/issues/10407)) ([1f5791f](https://github.com/sanity-io/sanity/commit/1f5791f4bb50fb940efb5dc98108a291007745c0))
* corrects tense in auto-generated comment ([#10409](https://github.com/sanity-io/sanity/issues/10409)) ([2ec1d82](https://github.com/sanity-io/sanity/commit/2ec1d8212a4a24f6e6da74313e186fdac1eaf9ae))
* **deps:** update dependency @portabletext/block-tools to ^3.5.1 ([#10460](https://github.com/sanity-io/sanity/issues/10460)) ([af3737d](https://github.com/sanity-io/sanity/commit/af3737dc503d3fc84c04cdf73735ab2358fc5062))
* **deps:** update dependency @portabletext/editor to ^2.6.4 ([#10459](https://github.com/sanity-io/sanity/issues/10459)) ([706124e](https://github.com/sanity-io/sanity/commit/706124e85210e62784341171d07b3f007276a70b))
* **deps:** update dependency @portabletext/editor to ^2.6.5 ([#10474](https://github.com/sanity-io/sanity/issues/10474)) ([39a9b88](https://github.com/sanity-io/sanity/commit/39a9b8832158d2540efd2a4f987126fabbcc0110))
* **deps:** update dependency @portabletext/editor to ^2.6.7 ([#10479](https://github.com/sanity-io/sanity/issues/10479)) ([7ee3be7](https://github.com/sanity-io/sanity/commit/7ee3be77757c0c56c15f9652d51018b513ed5912))
* **deps:** update dependency @portabletext/editor to ^2.6.9 ([#10490](https://github.com/sanity-io/sanity/issues/10490)) ([f7ac7e5](https://github.com/sanity-io/sanity/commit/f7ac7e591b0f1f1ad0d1198a67c6221e11ceaf05))
* **deps:** update dependency @portabletext/editor to ^2.7.0 ([#10503](https://github.com/sanity-io/sanity/issues/10503)) ([cc00d31](https://github.com/sanity-io/sanity/commit/cc00d316fd5a5549ef8a9ac5dc6e9b6884c0093f))
* **deps:** update dependency @portabletext/editor to ^2.7.1 ([#10504](https://github.com/sanity-io/sanity/issues/10504)) ([5a35aaf](https://github.com/sanity-io/sanity/commit/5a35aafc841deb3f5e235b2d59b36230963fe9e8))
* **deps:** update dependency @sanity/client to ^7.10.0 ([#10465](https://github.com/sanity-io/sanity/issues/10465)) ([62103ca](https://github.com/sanity-io/sanity/commit/62103ca0e384f49317a8c25cdb578ca5895fbb1a))
* **deps:** update dependency @sanity/mutate to ^0.12.5 ([#10433](https://github.com/sanity-io/sanity/issues/10433)) ([d916a84](https://github.com/sanity-io/sanity/commit/d916a843c9e75fe5819f77a87a8c936dbc531223))
* **deps:** update dependency @sanity/ui to ^3.0.8 ([#10472](https://github.com/sanity-io/sanity/issues/10472)) ([62e01d1](https://github.com/sanity-io/sanity/commit/62e01d10e2cb496ce93e0d0a374ca1352c1f168c))
* **deps:** update dependency react-rx to ^4.1.32 ([#10493](https://github.com/sanity-io/sanity/issues/10493)) ([af9eadd](https://github.com/sanity-io/sanity/commit/af9eadd87341df6338ce05059aa0aa11a45b76a1))
* **deps:** update dependency xstate to ^5.21.0 ([#10502](https://github.com/sanity-io/sanity/issues/10502)) ([da87107](https://github.com/sanity-io/sanity/commit/da87107b8ebc449365029644c37ee11157c841fb))
* **deps:** update React Compiler dependencies 🤖 ✨ ([#10492](https://github.com/sanity-io/sanity/issues/10492)) ([dd22e7d](https://github.com/sanity-io/sanity/commit/dd22e7dbc96dda4c6a954910730f6043bb29c4a4))
* issue where the discard dialog preview was chosing a broken preview ([#10475](https://github.com/sanity-io/sanity/issues/10475)) ([26db2f5](https://github.com/sanity-io/sanity/commit/26db2f506ef2516002f781f5860616d063fb2cb0))
* **presentation:** always include origin in document resolver context ([#10477](https://github.com/sanity-io/sanity/issues/10477)) ([0b0710d](https://github.com/sanity-io/sanity/commit/0b0710d370c3066a83caafd35d9518326fac3f24))
* removing the document unpublish action from pseudo drafts ([#10427](https://github.com/sanity-io/sanity/issues/10427)) ([c1811ad](https://github.com/sanity-io/sanity/commit/c1811adb9fde690e2e15d5daf93a7ea8ce7af85a))
* revert "fix(deps): update dependency @sanity/mutate to ^0.12.5" ([#10467](https://github.com/sanity-io/sanity/issues/10467)) ([3f67302](https://github.com/sanity-io/sanity/commit/3f67302dfe3a807c3b907722cf94cc8861d8d74c))
* **sanity:** clear 'publishing' state when published revision change ([#10484](https://github.com/sanity-io/sanity/issues/10484)) ([3721812](https://github.com/sanity-io/sanity/commit/3721812de69030d9eed755207b83f7582a28c7ab))
* **sanity:** mark document as consistent when refetching from server ([#10485](https://github.com/sanity-io/sanity/issues/10485)) ([6a79916](https://github.com/sanity-io/sanity/commit/6a799165c8b4fcc6f21e70df0a259fa6bcd74e52))
* **telemetry:** include react version ([#10480](https://github.com/sanity-io/sanity/issues/10480)) ([a80689b](https://github.com/sanity-io/sanity/commit/a80689b2dd096c4be27ae72fe85f9f1e26f50fa4))

## [4.6.0](https://github.com/sanity-io/sanity/compare/v4.5.0...v4.6.0) (2025-08-26)

### Features

* add 'format code' function recipe ([#10417](https://github.com/sanity-io/sanity/issues/10417)) ([bc95db9](https://github.com/sanity-io/sanity/commit/bc95db955cecd06290efa6876eb0c395369bdb6f))
* Add Last Used Provider Badge ([#10238](https://github.com/sanity-io/sanity/issues/10238)) ([f2db433](https://github.com/sanity-io/sanity/commit/f2db433617fd2ba82f38ef9a421d2efa1ca73c6e))
* support new Function document change events (`create`, `delete`, `update`) and filters (`includeDrafts` and `includeAllVersions`) ([#10413](https://github.com/sanity-io/sanity/issues/10413)) ([1835683](https://github.com/sanity-io/sanity/commit/1835683189abcfa49ffb06a4144ee59cf3ea16a1))

### Bug Fixes

* add env var for setting modules host ([#10423](https://github.com/sanity-io/sanity/issues/10423)) ([14eeabb](https://github.com/sanity-io/sanity/commit/14eeabb9da07bb5d5c6e5c14d13a1199f6e6b55a))
* **deps:** update dependency @portabletext/block-tools to ^3.3.0 ([#10405](https://github.com/sanity-io/sanity/issues/10405)) ([0b9a8ce](https://github.com/sanity-io/sanity/commit/0b9a8cedf450d1fc6373ba8575ee5e02c898549a))
* **deps:** update dependency @portabletext/block-tools to ^3.3.1 ([#10410](https://github.com/sanity-io/sanity/issues/10410)) ([f7affe2](https://github.com/sanity-io/sanity/commit/f7affe2a11d01febc48304b865adf5690b1760e6))
* **deps:** update dependency @portabletext/block-tools to ^3.3.2 ([#10419](https://github.com/sanity-io/sanity/issues/10419)) ([0df3a57](https://github.com/sanity-io/sanity/commit/0df3a575b47824c354dd34d736361f24e12c963a))
* **deps:** update dependency @portabletext/block-tools to ^3.3.3 ([#10421](https://github.com/sanity-io/sanity/issues/10421)) ([f49cf61](https://github.com/sanity-io/sanity/commit/f49cf61e71b732596960ea1f36db0b681947f69c))
* **deps:** update dependency @portabletext/editor to ^2.4.0 ([#10406](https://github.com/sanity-io/sanity/issues/10406)) ([294a907](https://github.com/sanity-io/sanity/commit/294a907efc2ceccf95534542f905c10da132b0c4))
* **deps:** update dependency @portabletext/editor to ^2.4.3 ([#10411](https://github.com/sanity-io/sanity/issues/10411)) ([a739244](https://github.com/sanity-io/sanity/commit/a739244e2b7d31f187ec8f8e98299ac052c93954))
* **deps:** update dependency @portabletext/editor to ^2.6.3 ([#10418](https://github.com/sanity-io/sanity/issues/10418)) ([2f2f2ee](https://github.com/sanity-io/sanity/commit/2f2f2eed8ea4fc493b8c88268d6e2e5c60cc60cd))
* **deps:** update dependency @sanity/client to ^7.9.0 ([#10412](https://github.com/sanity-io/sanity/issues/10412)) ([392f5dc](https://github.com/sanity-io/sanity/commit/392f5dc710fd1184709b268a4cc40b6af2e37162))
* fix scrolling issue inside of popover modals in PTE ([#10401](https://github.com/sanity-io/sanity/issues/10401)) ([c5a7d02](https://github.com/sanity-io/sanity/commit/c5a7d02ffc525417b049e12b78ea591d133b0974))
* move 'create new' studio host option to the end ([#10403](https://github.com/sanity-io/sanity/issues/10403)) ([851e7db](https://github.com/sanity-io/sanity/commit/851e7db866c04279fbc8fbf22f24e0c831eda29b))
* **sanity:** support new appid module url in version check ([#10432](https://github.com/sanity-io/sanity/issues/10432)) ([8e83fa1](https://github.com/sanity-io/sanity/commit/8e83fa18981df91fb59495552696d290e8672411))
* stop throwing error when removing array item when validation pane is open ([#10420](https://github.com/sanity-io/sanity/issues/10420)) ([9cc4337](https://github.com/sanity-io/sanity/commit/9cc433791506602c82e8a8beebad47ff94c7be89))
* **types:** remove `'strike'`/`'strike-through'` decorator confusion ([#10416](https://github.com/sanity-io/sanity/issues/10416)) ([f5340c8](https://github.com/sanity-io/sanity/commit/f5340c84db2d557ad54bcfdda74e00df12d7b1bb))

## [4.5.0](https://github.com/sanity-io/sanity/compare/v4.4.1...v4.5.0) (2025-08-19)

### Features

* add schedule publish and unpublish noop actions for draft documents ([#10287](https://github.com/sanity-io/sanity/issues/10287)) ([c1220b3](https://github.com/sanity-io/sanity/commit/c1220b3f2ff5cf3a3f1741943c8ca322395081b0))
* draft perspective chip copies from published when  no draft exists ([#10305](https://github.com/sanity-io/sanity/issues/10305)) ([2d9c836](https://github.com/sanity-io/sanity/commit/2d9c8365cae543492ffbe93167fdcafc2e552e2d))
* **sanity:** add `advancedVersionControl.enabled` configuration option ([#10277](https://github.com/sanity-io/sanity/issues/10277)) ([81bc5b1](https://github.com/sanity-io/sanity/commit/81bc5b1e735571647dd2a553b256a8b32783e79e))

### Bug Fixes

* **ci:** add concurrency for release-next job ([#10373](https://github.com/sanity-io/sanity/issues/10373)) ([87ef760](https://github.com/sanity-io/sanity/commit/87ef7603dbb4563efa779631393d918e995544b8))
* **codegen:** import json5 via default to match ESM entry ([#10388](https://github.com/sanity-io/sanity/issues/10388)) ([35861c6](https://github.com/sanity-io/sanity/commit/35861c68d7eeb7bbb2719cda6828576423796255))
* **core:** use intent link for comments notification url ([#10299](https://github.com/sanity-io/sanity/issues/10299)) ([4866d59](https://github.com/sanity-io/sanity/commit/4866d59fd537c5d1edfc7a9186340da9a6d005fd))
* **deps:** Update babel monorepo to ^7.28.3 ([#10301](https://github.com/sanity-io/sanity/issues/10301)) ([cb6718b](https://github.com/sanity-io/sanity/commit/cb6718b8ef05a003336aa0ac7bf42d092d8205ae))
* **deps:** update dependency @portabletext/block-tools to ^3.2.0 ([#10297](https://github.com/sanity-io/sanity/issues/10297)) ([b50678b](https://github.com/sanity-io/sanity/commit/b50678bd519d80a083b9f01efd8ac846a5502b4a))
* **deps:** update dependency @portabletext/block-tools to ^3.2.1 ([#10384](https://github.com/sanity-io/sanity/issues/10384)) ([6a1f726](https://github.com/sanity-io/sanity/commit/6a1f72614fb2cbb6851fd5951a7ea57c0177a32f))
* **deps:** update dependency @portabletext/editor to ^2.3.7 ([#10284](https://github.com/sanity-io/sanity/issues/10284)) ([213dc36](https://github.com/sanity-io/sanity/commit/213dc369b728db58327fa3c1f9c5792e5dcbe1d3))
* **deps:** update dependency @portabletext/editor to ^2.3.8 ([#10389](https://github.com/sanity-io/sanity/issues/10389)) ([60e179c](https://github.com/sanity-io/sanity/commit/60e179c22b152059bab11bd006d58af1b2e6ef1f))
* **deps:** Update dev-non-major ([#10302](https://github.com/sanity-io/sanity/issues/10302)) ([3f1c7d1](https://github.com/sanity-io/sanity/commit/3f1c7d147e691083eec47e108591b93619ac19c6))
* **deps:** Update linters ([#10395](https://github.com/sanity-io/sanity/issues/10395)) ([763a98d](https://github.com/sanity-io/sanity/commit/763a98d8e703436760f166566b9e5f8510b1ded4))
* release chips don't need to handle scheduled case ([#10374](https://github.com/sanity-io/sanity/issues/10374)) ([eaf6359](https://github.com/sanity-io/sanity/commit/eaf6359e708d1f936a22fc26a9531bf999a6dce5))
* remove unused initialValue parameter from createVersion method ([#10391](https://github.com/sanity-io/sanity/issues/10391)) ([4278419](https://github.com/sanity-io/sanity/commit/427841940267b4450f3064b4c77c2c2bbd6114e8))
* **schema:** mark image data as required, for typegen ([#10285](https://github.com/sanity-io/sanity/issues/10285)) ([af2ce7b](https://github.com/sanity-io/sanity/commit/af2ce7be07dd3d5795ca8a5c66422295b41c8712))

## [4.4.1](https://github.com/sanity-io/sanity/compare/v4.4.0...v4.4.1) (2025-08-14)

### Bug Fixes

* allow v20 in node engines ([#10290](https://github.com/sanity-io/sanity/issues/10290)) ([73150e9](https://github.com/sanity-io/sanity/commit/73150e9befde5cb531279c9b206a08682df3ff38))
* **deps:** update dependency @sanity/export to ^4.0.1 ([#10291](https://github.com/sanity-io/sanity/issues/10291)) ([6827c96](https://github.com/sanity-io/sanity/commit/6827c96dab297cf35ca0130427be226906e64519))
* **deps:** update dependency @sanity/export to v4 ([#10264](https://github.com/sanity-io/sanity/issues/10264)) ([335b8e5](https://github.com/sanity-io/sanity/commit/335b8e54283221dfe21400f7639ab7ca6a5d209b))
* **deps:** update dependency @sanity/ui to ^3.0.7 ([#10293](https://github.com/sanity-io/sanity/issues/10293)) ([e671ffc](https://github.com/sanity-io/sanity/commit/e671ffc1bef570811838235630d2717590f65d15))
* long release titles in open release to edit banner correctly flexed ([#10283](https://github.com/sanity-io/sanity/issues/10283)) ([3ba5079](https://github.com/sanity-io/sanity/commit/3ba50796a92a853c945e88106107199a7185e908))

## [4.4.0](https://github.com/sanity-io/sanity/compare/v4.3.0...v4.4.0) (2025-08-13)

### Features

* adding chips to release summary to show count of release actions ([#10237](https://github.com/sanity-io/sanity/issues/10237)) ([62af6fc](https://github.com/sanity-io/sanity/commit/62af6fc731b5a1b0c59466b104c5a110f2379826))
* **cli:** choses a new port if dev server is conflicted for apps ([#10212](https://github.com/sanity-io/sanity/issues/10212)) ([00369ec](https://github.com/sanity-io/sanity/commit/00369ec4dbd9662eae6e719821e310273c06c8eb))
* **util:** add support for localized moment tokens ([#10240](https://github.com/sanity-io/sanity/issues/10240)) ([caf47b6](https://github.com/sanity-io/sanity/commit/caf47b656f7ea94c0c871dcac62f3aae1d6ef6f6))
* virtualising release documents table ([#10203](https://github.com/sanity-io/sanity/issues/10203)) ([1ff9a38](https://github.com/sanity-io/sanity/commit/1ff9a386962035f7b2fef8f4a7567352339f0e4c))

### Bug Fixes

* **bundle-manager:** always keep highest version outside ttl ([#10197](https://github.com/sanity-io/sanity/issues/10197)) ([160a3ee](https://github.com/sanity-io/sanity/commit/160a3ee2725f276cf56b4b0482c1dd92fdce6346))
* **cli:** don't coerce sanity version during build/dev ([#10190](https://github.com/sanity-io/sanity/issues/10190)) ([7330842](https://github.com/sanity-io/sanity/commit/7330842c38ca99af9129f4bf80d0d830c77fd22c))
* **cli:** env vars not loading in sanity.cli when using vite callback ([#10186](https://github.com/sanity-io/sanity/issues/10186)) ([42122dc](https://github.com/sanity-io/sanity/commit/42122dc31534e8057a42cfc3c16cea46752346ac))
* **cli:** gracefully handle version check errors in sanity dev ([#10279](https://github.com/sanity-io/sanity/issues/10279)) ([d223320](https://github.com/sanity-io/sanity/commit/d2233208e3c32d18e58e1053ea1caa4ea24376ed))
* **cli:** updates dev action to trigger async work while showing spinner ([#10268](https://github.com/sanity-io/sanity/issues/10268)) ([3b29438](https://github.com/sanity-io/sanity/commit/3b2943838ac473a0832b62cd79b777c52e1cc268))
* **core:** allow losing focus inside popover modals, fix scroll in popover issue ([#10213](https://github.com/sanity-io/sanity/issues/10213)) ([d49b527](https://github.com/sanity-io/sanity/commit/d49b5274d5bcc378233837eab79152e2651e6c6c))
* **core:** issue with releases default values ([#10251](https://github.com/sanity-io/sanity/issues/10251)) ([7b8fa2f](https://github.com/sanity-io/sanity/commit/7b8fa2fed0d8219ff79507e022088caeec3d8b63))
* **deps:** update dependency @date-fns/tz to ^1.4.1 ([#10253](https://github.com/sanity-io/sanity/issues/10253)) ([dcacb4b](https://github.com/sanity-io/sanity/commit/dcacb4b3a3667b1dd86071a4f89fbf60c0b3d362))
* **deps:** update dependency @portabletext/block-tools to ^2.0.8 ([#10200](https://github.com/sanity-io/sanity/issues/10200)) ([498a56d](https://github.com/sanity-io/sanity/commit/498a56ddda6297fa00a1b3faa0571cea353bab63))
* **deps:** update dependency @portabletext/block-tools to v3 ([#10256](https://github.com/sanity-io/sanity/issues/10256)) ([4672c48](https://github.com/sanity-io/sanity/commit/4672c48f1360b590844c659e29aba53abd025d15))
* **deps:** update dependency @portabletext/editor to ^2.1.11 ([#10204](https://github.com/sanity-io/sanity/issues/10204)) ([30a9a70](https://github.com/sanity-io/sanity/commit/30a9a705bdffe9c3152588f98e597f04f9d1f4c5))
* **deps:** update dependency @portabletext/editor to ^2.1.9 ([#10202](https://github.com/sanity-io/sanity/issues/10202)) ([4aabd89](https://github.com/sanity-io/sanity/commit/4aabd89a0f4df5f95829e9e955a1ce6bd68107f4))
* **deps:** update dependency @portabletext/editor to ^2.3.0 ([#10226](https://github.com/sanity-io/sanity/issues/10226)) ([4681b77](https://github.com/sanity-io/sanity/commit/4681b77dd05d9bd60ac2890824953c0f1259f049))
* **deps:** update dependency @portabletext/editor to ^2.3.3 ([#10242](https://github.com/sanity-io/sanity/issues/10242)) ([322ab52](https://github.com/sanity-io/sanity/commit/322ab524baf85e1a73a6827444ba01c58c6ae479))
* **deps:** update dependency @sanity/export to ^3.45.3 ([#10244](https://github.com/sanity-io/sanity/issues/10244)) ([084a599](https://github.com/sanity-io/sanity/commit/084a599763fd240ee601a6d02cb668fbbfdc1b5d))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.28 ([#10188](https://github.com/sanity-io/sanity/issues/10188)) ([ec0c5bf](https://github.com/sanity-io/sanity/commit/ec0c5bff5bc4c5bf4571e0918c472df1e550b837))
* **deps:** update dependency @sanity/ui to ^3.0.6 ([#10245](https://github.com/sanity-io/sanity/issues/10245)) ([5a9f4cf](https://github.com/sanity-io/sanity/commit/5a9f4cf59ad64ab5e5afb2659e2b7b7e84e5fa8f))
* **deps:** update dependency xstate to ^5.20.2 ([#10222](https://github.com/sanity-io/sanity/issues/10222)) ([b82b0a6](https://github.com/sanity-io/sanity/commit/b82b0a6ad1df77e64d7062524c2ae038cf863123))
* **deps:** Update dev-non-major ([#10192](https://github.com/sanity-io/sanity/issues/10192)) ([6ba5be6](https://github.com/sanity-io/sanity/commit/6ba5be68a262fba63410658b59c7725b86c494fa))
* **presentation:** send presentation/refresh events for version documents changes ([#10255](https://github.com/sanity-io/sanity/issues/10255)) ([0e0b8de](https://github.com/sanity-io/sanity/commit/0e0b8deda3b6907d6a70b8ebcb2ecce0ec453b10))
* **sanity:** add missing v-prefix in link to release tag ([#10241](https://github.com/sanity-io/sanity/issues/10241)) ([f5e4de7](https://github.com/sanity-io/sanity/commit/f5e4de78e4b6e34a0ad840b40f2f33663eb2512a))
* **sanity:** explicitly unset legacy inspect parameter ([#10208](https://github.com/sanity-io/sanity/issues/10208)) ([6f636d0](https://github.com/sanity-io/sanity/commit/6f636d0bce0b8c0340cbb9e4d3cb80eb21fcd3ed))
* **sanity:** presentation navigation issues and initial value handling ([#10207](https://github.com/sanity-io/sanity/issues/10207)) ([34fba7d](https://github.com/sanity-io/sanity/commit/34fba7d6c4d821e31acc4f898c0b6b282311783c))
* **sanity:** unexpected type narrowing when array passed to `defineConfig` ([#10275](https://github.com/sanity-io/sanity/issues/10275)) ([93fed00](https://github.com/sanity-io/sanity/commit/93fed00da027cf73412eacfc9e09fc7633a999d0))
* **structure:** render actions menu if sideMenuItems has actions ([#10196](https://github.com/sanity-io/sanity/issues/10196)) ([62272a8](https://github.com/sanity-io/sanity/commit/62272a81a6d06d3e960699719621a15b6078292f))
* update engines to require node >=22.12.0 ([#10227](https://github.com/sanity-io/sanity/issues/10227)) ([c1b9fe2](https://github.com/sanity-io/sanity/commit/c1b9fe2b70ccbb9ff4bce0845dfaad25cafcd35a))

## [4.3.0](https://github.com/sanity-io/sanity/compare/v4.2.0...v4.3.0) (2025-08-05)

### Features

* **core:** allow all fields group customizations ([#10094](https://github.com/sanity-io/sanity/issues/10094)) ([f3237e1](https://github.com/sanity-io/sanity/commit/f3237e1203bdab30b3ee86c8ce2ea29f216100de))
* **core:** media library full app dialog and selection validation ([#10153](https://github.com/sanity-io/sanity/issues/10153)) ([57b7db1](https://github.com/sanity-io/sanity/commit/57b7db14bfab0813089f5415fb82e2b3b26f4876))

### Bug Fixes

* **app server:** stop spinner before printing url ([#10114](https://github.com/sanity-io/sanity/issues/10114)) ([84e7eb6](https://github.com/sanity-io/sanity/commit/84e7eb6ad07868cbbd20089add8c1e51fe3b7404))
* **ci:** add workflow to tag as latest ([#10110](https://github.com/sanity-io/sanity/issues/10110)) ([10db838](https://github.com/sanity-io/sanity/commit/10db838c7cb64284c501cf1d3a47121a4b91a018))
* **ci:** enable tag latest workflow for production ([#10112](https://github.com/sanity-io/sanity/issues/10112)) ([8268d23](https://github.com/sanity-io/sanity/commit/8268d23a11c4717287f60d3c6376399191dd24c0))
* **ci:** rewrite tagged version for all packages ([#10120](https://github.com/sanity-io/sanity/issues/10120)) ([31cddbb](https://github.com/sanity-io/sanity/commit/31cddbb0646be027d21b15cb8ebc55b8f331f749))
* **ci:** set correct version for next packages and publish all packages in concert ([#10108](https://github.com/sanity-io/sanity/issues/10108)) ([92b13c9](https://github.com/sanity-io/sanity/commit/92b13c9683ea553bb24f6aa9ed8abf6ef3c20529))
* **ci:** set SANITY_INTERNAL_ENV=staging when building esm bundles for staging ([#10118](https://github.com/sanity-io/sanity/issues/10118)) ([b757108](https://github.com/sanity-io/sanity/commit/b75710805b8e9bc7b377ae4e181fd33a92e4e7c5))
* **ci:** tag latest in production manifest ([#10122](https://github.com/sanity-io/sanity/issues/10122)) ([9e7d17c](https://github.com/sanity-io/sanity/commit/9e7d17ca6aa17f3dc7feb680b841efb2268e5696))
* **cli:** Add missing flag to blueprints add example ([#10089](https://github.com/sanity-io/sanity/issues/10089)) ([10c001a](https://github.com/sanity-io/sanity/commit/10c001aa5e394ddd17d7e7914760978594058e66))
* **cli:** mark @sanity/ui@3 as supported ([#10154](https://github.com/sanity-io/sanity/issues/10154)) ([6030a93](https://github.com/sanity-io/sanity/commit/6030a93928bdf625746c8670fae25778bbb62f82))
* **cli:** remove workspace version specifier ([#10109](https://github.com/sanity-io/sanity/issues/10109)) ([6a84ff7](https://github.com/sanity-io/sanity/commit/6a84ff7593f5b03b466770efb8fa1869adb112e5))
* **deps:** Update CodeMirror ([#10130](https://github.com/sanity-io/sanity/issues/10130)) ([97da856](https://github.com/sanity-io/sanity/commit/97da8568dfa14bca492098a1294eadb66e6ca6f9))
* **deps:** update dependency @portabletext/block-tools to ^2.0.2 ([#10167](https://github.com/sanity-io/sanity/issues/10167)) ([c75c002](https://github.com/sanity-io/sanity/commit/c75c002b594276c4e8fff070a2e7274f2dc0a576))
* **deps:** update dependency @portabletext/block-tools to ^2.0.5 ([#10172](https://github.com/sanity-io/sanity/issues/10172)) ([7ca6103](https://github.com/sanity-io/sanity/commit/7ca610389464bf1d94e0285c92d3b27c7090e7f3))
* **deps:** update dependency @portabletext/editor to ^2.1.2 ([#10168](https://github.com/sanity-io/sanity/issues/10168)) ([ced80f4](https://github.com/sanity-io/sanity/commit/ced80f4177b10b0c0a45885e7ddcda79d69612d7))
* **deps:** update dependency @portabletext/editor to ^2.1.4 ([#10173](https://github.com/sanity-io/sanity/issues/10173)) ([bdff34c](https://github.com/sanity-io/sanity/commit/bdff34c72de8cd60e7dc946cfd606bd37fce8eed))
* **deps:** update dependency @portabletext/editor to ^2.1.7 ([#10177](https://github.com/sanity-io/sanity/issues/10177)) ([d30c781](https://github.com/sanity-io/sanity/commit/d30c78120e10957fb5c8224c0e86f409b761af41))
* **deps:** update dependency @sanity/client to ^7.8.1 ([#10102](https://github.com/sanity-io/sanity/issues/10102)) ([8951cd2](https://github.com/sanity-io/sanity/commit/8951cd285914c1c073ba7de5a848933b81ace964))
* **deps:** update dependency @sanity/client to ^7.8.2 ([#10181](https://github.com/sanity-io/sanity/issues/10181)) ([f63be89](https://github.com/sanity-io/sanity/commit/f63be89404282e45a64b18acc2dee7585bd3dcf1))
* **deps:** update dependency @sanity/comlink to ^3.0.9 ([#10187](https://github.com/sanity-io/sanity/issues/10187)) ([3ab6222](https://github.com/sanity-io/sanity/commit/3ab62221fe8c65ba7c53b1e46b8463851c00559c))
* **deps:** update dependency @sanity/insert-menu to v2.0.1 ([#10160](https://github.com/sanity-io/sanity/issues/10160)) ([42c43e3](https://github.com/sanity-io/sanity/commit/42c43e31c75ec91e13892111c822e2547c087503))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.27 ([#10162](https://github.com/sanity-io/sanity/issues/10162)) ([842bd90](https://github.com/sanity-io/sanity/commit/842bd9066eece2696cbc1c2371da62962a0e2bcb))
* **deps:** update dependency @sanity/ui to ^3.0.3 ([#10098](https://github.com/sanity-io/sanity/issues/10098)) ([05cd42c](https://github.com/sanity-io/sanity/commit/05cd42ccc965d41bd67c188860802f118e23f349))
* **deps:** update dependency @sanity/ui to ^3.0.5 ([#10115](https://github.com/sanity-io/sanity/issues/10115)) ([82703e1](https://github.com/sanity-io/sanity/commit/82703e1f60df532cf8c8af37eb70ddabd303dd82))
* **deps:** update dependency framer-motion to ^12.23.12 ([#10131](https://github.com/sanity-io/sanity/issues/10131)) ([256e334](https://github.com/sanity-io/sanity/commit/256e33493ce3f4518b7a55a65d9af56423d74309))
* **deps:** Update dev-non-major ([#10185](https://github.com/sanity-io/sanity/issues/10185)) ([7a5255e](https://github.com/sanity-io/sanity/commit/7a5255e203c7c58329e0ced7e1d6724a300f3427))
* issue where a slimple slug in an array was auto closing when focusing on it ([#10175](https://github.com/sanity-io/sanity/issues/10175)) ([dfb704d](https://github.com/sanity-io/sanity/commit/dfb704dd17e233a7155e5d9d464b0d0c8d384524))
* **sanity:** ensure `useDocumentForm` uses provided release id ([1abac9f](https://github.com/sanity-io/sanity/commit/1abac9f684a7158e1e3aa3c815d9772b8bb97653))
* **sanity:** hide new version if up to date ([#10165](https://github.com/sanity-io/sanity/issues/10165)) ([acc988f](https://github.com/sanity-io/sanity/commit/acc988f7e3a7fe64ed56a8399932f874c2380a11))
* **sanity:** remove own presence avatar from list of users ([#10179](https://github.com/sanity-io/sanity/issues/10179)) ([0657751](https://github.com/sanity-io/sanity/commit/06577511228e5d1d1dabf4ee4707bfd2e2f379f5))
* unpin rollup ([#10113](https://github.com/sanity-io/sanity/issues/10113)) ([48400c4](https://github.com/sanity-io/sanity/commit/48400c4433b6efbe468baa0b9ee3e2f8623a9847))
* upgrade react-is to 19 ([#10141](https://github.com/sanity-io/sanity/issues/10141)) ([d7acd6c](https://github.com/sanity-io/sanity/commit/d7acd6cf5476a08b32d0350acff6f832dabca7af))
* workaround rollup@4.46.0 regression ([#10103](https://github.com/sanity-io/sanity/issues/10103)) ([a3c44ce](https://github.com/sanity-io/sanity/commit/a3c44cea205d28ba431c7e58628cb208e414e693))

## [4.2.0](https://github.com/sanity-io/sanity/compare/v4.1.1...v4.2.0) (2025-07-29)

### Features

* add default headers for studio client requests ([#9473](https://github.com/sanity-io/sanity/issues/9473)) ([ee1e2f4](https://github.com/sanity-io/sanity/commit/ee1e2f41981f94d2af73256267d18ddced400ca9))
* **cli:** add openapi command group with list and get subcommands ([#9924](https://github.com/sanity-io/sanity/issues/9924)) ([9fa20e9](https://github.com/sanity-io/sanity/commit/9fa20e91afb911b5d913af08677fa87f86e6b143))
* **core:** add media library field groq filters ([#9900](https://github.com/sanity-io/sanity/issues/9900)) ([fd837ab](https://github.com/sanity-io/sanity/commit/fd837aba647ccd7757a159c000833c90001f350c))

### Bug Fixes

* **ci:** build with a valid semver for pkg.pr.new releases ([#10083](https://github.com/sanity-io/sanity/issues/10083)) ([b8dcc3d](https://github.com/sanity-io/sanity/commit/b8dcc3df31b776f585035fea1ff0d8dd8269ffbe))
* **core:** add perspectiveStack to tasks for preview title ([#10067](https://github.com/sanity-io/sanity/issues/10067)) ([d6892a7](https://github.com/sanity-io/sanity/commit/d6892a7bdfbb894cb5d8aaa9af5f7a9600da2ffe))
* **core:** upgrade refractor to 5.0.0 and react-refractor to 4.0.0 and @sanity/ui to 3.0.0 ([#10068](https://github.com/sanity-io/sanity/issues/10068)) ([cf42627](https://github.com/sanity-io/sanity/commit/cf42627649b0ebc968eb22c588ec3abe967cc388))
* **deps:** pin rollup to 4.45.3 ([#10099](https://github.com/sanity-io/sanity/issues/10099)) ([45dc487](https://github.com/sanity-io/sanity/commit/45dc487399534f3c575d65ae108d368330e2676c))
* **deps:** Update babel monorepo ([#10045](https://github.com/sanity-io/sanity/issues/10045)) ([a47ceea](https://github.com/sanity-io/sanity/commit/a47ceea64da2afd82133a16008cdfdb7890af782))
* **deps:** update dependency @sanity/client to ^7.8.1 ([#10066](https://github.com/sanity-io/sanity/issues/10066)) ([4e0d1c5](https://github.com/sanity-io/sanity/commit/4e0d1c53856b2e6bf6c61b3609fa8ba6fcd011dc))
* **deps:** update dependency @sanity/insert-menu to v2 ([#10087](https://github.com/sanity-io/sanity/issues/10087)) ([7f7b821](https://github.com/sanity-io/sanity/commit/7f7b82198257202362aab024652cd0594ccab35b))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.26 ([#10086](https://github.com/sanity-io/sanity/issues/10086)) ([ce1c301](https://github.com/sanity-io/sanity/commit/ce1c3016a12f8937c17f14e5b2870ac67e9eeb81))
* **deps:** update dependency @sanity/ui to ^3.0.1 ([#10079](https://github.com/sanity-io/sanity/issues/10079)) ([63e81eb](https://github.com/sanity-io/sanity/commit/63e81eba52b9014c58745776ddecc973ae5530b2))
* **deps:** update dependency groq-js to ^1.17.3 ([#10069](https://github.com/sanity-io/sanity/issues/10069)) ([d74c4fb](https://github.com/sanity-io/sanity/commit/d74c4fb87eeae2bd18cd99a5df725c8469b8f8e7))
* **deps:** update dependency next-sanity to v10 ([#9998](https://github.com/sanity-io/sanity/issues/9998)) ([226ab14](https://github.com/sanity-io/sanity/commit/226ab1460f763c89507401a38f59f005d7fbcfde))
* **deps:** Update dev-non-major ([#10046](https://github.com/sanity-io/sanity/issues/10046)) ([cd7dc5c](https://github.com/sanity-io/sanity/commit/cd7dc5c04b2cf9f9dab1ebfb5e0066ca3c512fba))
* **functions:** update help docs ([#10070](https://github.com/sanity-io/sanity/issues/10070)) ([02e95dd](https://github.com/sanity-io/sanity/commit/02e95dd0061fadfa312ee840e1cc715dcdd49397))
* **schema:** preserve object for inline types ([#10030](https://github.com/sanity-io/sanity/issues/10030)) ([ba73ac0](https://github.com/sanity-io/sanity/commit/ba73ac09cbb203fd502e7ef779319978ac5a5af8))

## [4.1.1](https://github.com/sanity-io/sanity/compare/v4.1.0...v4.1.1) (2025-07-22)

### Bug Fixes

* **core:** typo in "asset not found" message ([#10039](https://github.com/sanity-io/sanity/issues/10039)) ([cc05b44](https://github.com/sanity-io/sanity/commit/cc05b4447bce08e702d6052848ff25613a62f23d))
* **deps:** update dependency @sanity/comlink to ^3.0.8 ([#10034](https://github.com/sanity-io/sanity/issues/10034)) ([f007778](https://github.com/sanity-io/sanity/commit/f0077783463ea71738c34444e843242d88acb8d0))
* **deps:** update dependency @sanity/insert-menu to v1.1.13 ([#10035](https://github.com/sanity-io/sanity/issues/10035)) ([320b6b0](https://github.com/sanity-io/sanity/commit/320b6b03b4b842511d8fa0acef3d25dda1326652))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.25 ([#10036](https://github.com/sanity-io/sanity/issues/10036)) ([7b1dd78](https://github.com/sanity-io/sanity/commit/7b1dd7831a61bae36270e2af011eefa730cb9b39))
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.14 ([#10037](https://github.com/sanity-io/sanity/issues/10037)) ([6fdb75f](https://github.com/sanity-io/sanity/commit/6fdb75f447016f9bd2b021fb85bf4e73e1bfc11d))
* **sanity:** do not attempt to provision media library ([524a107](https://github.com/sanity-io/sanity/commit/524a10728aca0e3062b565fa19b6dd12b690a12a))

## [4.1.0](https://github.com/sanity-io/sanity/compare/v4.0.1...v4.1.0) (2025-07-21)

### Features

* **sanity:** adopt stable GROQ API for `groq2024` search strategy ([#9980](https://github.com/sanity-io/sanity/issues/9980)) ([d37e051](https://github.com/sanity-io/sanity/commit/d37e0519829113dde81040b4f8b5b022ab053522))
* **sanity:** allow `groq2024` search strategy to match on referenced `_id` ([#10001](https://github.com/sanity-io/sanity/issues/10001)) ([416d34a](https://github.com/sanity-io/sanity/commit/416d34a906b1fbdeb24b9913492678a11437db7b))
* swapping to use baseId for createVersion server actions ([#9977](https://github.com/sanity-io/sanity/issues/9977)) ([5dfee31](https://github.com/sanity-io/sanity/commit/5dfee317f1166dd9342dcf319f67ccc4fddede42))
* **typegen:** add support for vue ([#9979](https://github.com/sanity-io/sanity/issues/9979)) ([76a0022](https://github.com/sanity-io/sanity/commit/76a0022ff8447f8c254275a677880e9333a370ce))

### Bug Fixes

* **core:** handle tasks with undefined dates ([#10029](https://github.com/sanity-io/sanity/issues/10029)) ([7c39903](https://github.com/sanity-io/sanity/commit/7c399031b7e46711ebce7cf0e462bf507e4610e3))
* **deps:** update dependency @portabletext/block-tools to v2 ([#10002](https://github.com/sanity-io/sanity/issues/10002)) ([eb050e7](https://github.com/sanity-io/sanity/commit/eb050e7ed7cf3273c0431039fd386142f4066d25))
* **deps:** update dependency @portabletext/editor to v2 ([#10003](https://github.com/sanity-io/sanity/issues/10003)) ([5dda18f](https://github.com/sanity-io/sanity/commit/5dda18f1a082122b585eae95ac5ccd5a5e67025b))
* **deps:** update dependency @sanity/client to ^7.8.0 ([#9974](https://github.com/sanity-io/sanity/issues/9974)) ([abca37f](https://github.com/sanity-io/sanity/commit/abca37f07db11a1b97c53e6718f293542237a1ca))
* **deps:** update dependency @sanity/presentation-comlink to ^1.0.24 ([#10018](https://github.com/sanity-io/sanity/issues/10018)) ([7c6d157](https://github.com/sanity-io/sanity/commit/7c6d157b5aa04562de36c964d25ec31046b16f47))
* **deps:** update dependency @sanity/preview-url-secret to ^2.1.13 ([#10019](https://github.com/sanity-io/sanity/issues/10019)) ([eb04dcf](https://github.com/sanity-io/sanity/commit/eb04dcf7c771db99b0dac2eb440f947805e0995b))
* **deps:** update dependency framer-motion to ^12.23.6 ([#10004](https://github.com/sanity-io/sanity/issues/10004)) ([06868f2](https://github.com/sanity-io/sanity/commit/06868f218d6ba58ab73225621f02db667108942d))
* **deps:** update dependency groq-js to ^1.17.2 ([#10020](https://github.com/sanity-io/sanity/issues/10020)) ([1c2dcb0](https://github.com/sanity-io/sanity/commit/1c2dcb096a8874e72bbc35e4a9fb7e1de7526eb0))
* **deps:** update dependency react-rx to ^4.1.31 ([#10013](https://github.com/sanity-io/sanity/issues/10013)) ([c2754de](https://github.com/sanity-io/sanity/commit/c2754de648fedb9992898495764342c24bb5196c))
* **deps:** update dependency xstate to ^5.20.1 ([#10005](https://github.com/sanity-io/sanity/issues/10005)) ([509b554](https://github.com/sanity-io/sanity/commit/509b5543e88ee90ada059ca8086f3767e5883f11))
* **deps:** Update dev-non-major ([#9995](https://github.com/sanity-io/sanity/issues/9995)) ([4050e54](https://github.com/sanity-io/sanity/commit/4050e5476520085bd79318054933c01d714ee820))
* **sanity:** deduplicate global search results ([#10015](https://github.com/sanity-io/sanity/issues/10015)) ([2cb8671](https://github.com/sanity-io/sanity/commit/2cb86715bcfacc6778b4f77ec346e8737c13625e))
* **sanity:** prevent undefined weights occurring in groq2024 search query ([416e53d](https://github.com/sanity-io/sanity/commit/416e53d44515dba7feffec12b1e272135947f2b7))
* **structure:** show the values of the deleted documents in the document pane ([#9975](https://github.com/sanity-io/sanity/issues/9975)) ([ebde28e](https://github.com/sanity-io/sanity/commit/ebde28ec212c228377ac228c8f7065e3041a4c5f))

## [4.0.1](https://github.com/sanity-io/sanity/compare/v4.0.0...v4.0.1) (2025-07-16)

### Bug Fixes

* do not release next when releasing latest ([#9970](https://github.com/sanity-io/sanity/issues/9970)) ([ba5d287](https://github.com/sanity-io/sanity/commit/ba5d28736bb0789bd19f47c2953fb54d14b18f55))
* **sanity:** poll asset state after linking without failing cors ([#9965](https://github.com/sanity-io/sanity/issues/9965)) ([5bafb44](https://github.com/sanity-io/sanity/commit/5bafb44cf1702080ed5406ea1294142429f019c0))

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
