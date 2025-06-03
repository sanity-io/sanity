# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
