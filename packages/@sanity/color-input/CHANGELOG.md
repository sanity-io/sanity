<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.3](https://github.com/sanity-io/color-input/compare/v4.0.2...v4.0.3) (2024-12-19)

### Bug Fixes

- explicitly provide default props to Checkboard component ([#78](https://github.com/sanity-io/color-input/issues/78)) ([0baa486](https://github.com/sanity-io/color-input/commit/0baa486d33234c473f81cf8da6b6547d4924a164))

## [4.0.2](https://github.com/sanity-io/color-input/compare/v4.0.1...v4.0.2) (2024-12-17)

### Bug Fixes

- support react 19 ([#81](https://github.com/sanity-io/color-input/issues/81)) ([507b550](https://github.com/sanity-io/color-input/commit/507b55086bc68115de775201c070a14b92a061ee))

## [4.0.1](https://github.com/sanity-io/color-input/compare/v4.0.0...v4.0.1) (2024-09-13)

### Bug Fixes

- **ColorInput:** add lazy loading ([#74](https://github.com/sanity-io/color-input/issues/74)) ([8a8a5cc](https://github.com/sanity-io/color-input/commit/8a8a5cc50ee92cc793d669f7dd2553d05dffb686))

## [4.0.0](https://github.com/sanity-io/color-input/compare/v3.1.2...v4.0.0) (2024-09-13)

### ⚠ BREAKING CHANGES

- **deps:** `styled-components` v6.1 or later is now required

Co-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>

- migrate to v6 pkg-utils best practice (#73)

### Features

- migrate to v6 pkg-utils best practice ([#73](https://github.com/sanity-io/color-input/issues/73)) ([b6e6637](https://github.com/sanity-io/color-input/commit/b6e66372313a4980ded900d59b2d3e9683747d9a))

### Miscellaneous Chores

- **deps:** update commitlint monorepo to v19 (major) ([303d36f](https://github.com/sanity-io/color-input/commit/303d36f15791194f194379b4d6f5876e13fdaa79))

## [3.1.2](https://github.com/sanity-io/color-input/compare/v3.1.1...v3.1.2) (2024-09-13)

### Bug Fixes

- add border to color swatches ([#38](https://github.com/sanity-io/color-input/issues/38)) ([4063d7b](https://github.com/sanity-io/color-input/commit/4063d7bf24c3f6aa51743fbf08088628948c1849))
- **deps:** Update non-major ([#60](https://github.com/sanity-io/color-input/issues/60)) ([35723d3](https://github.com/sanity-io/color-input/commit/35723d31eb15bf7d5acc277035267ac22aa1119d))
- display HSL correctly ([#72](https://github.com/sanity-io/color-input/issues/72)) ([6a7123d](https://github.com/sanity-io/color-input/commit/6a7123db28c08b45f81ed7152f1f4fdc74f034e1))

## [3.1.1](https://github.com/sanity-io/color-input/compare/v3.1.0...v3.1.1) (2024-02-20)

### Bug Fixes

- **deps:** update dependencies (non-major) ([#18](https://github.com/sanity-io/color-input/issues/18)) ([2b6537c](https://github.com/sanity-io/color-input/commit/2b6537cd6f4d0abfea1f10367823452a78c57fb8))
- facelift dependencies ([#66](https://github.com/sanity-io/color-input/issues/66)) ([81a20ee](https://github.com/sanity-io/color-input/commit/81a20ee48fdc3578e78ae1a12faa12cd06c8eef5))

## [3.1.0](https://github.com/sanity-io/color-input/compare/v3.0.2...v3.1.0) (2023-05-11)

### Features

- added color list to options ([#36](https://github.com/sanity-io/color-input/issues/36)) ([e3b9281](https://github.com/sanity-io/color-input/commit/e3b928197cc2ee1ac2ca54aabcc1335b14b050ce))

## [3.0.2](https://github.com/sanity-io/color-input/compare/v3.0.1...v3.0.2) (2023-01-04)

### Bug Fixes

- **deps:** applied npx @sanity/plugin-kit inject ([f2635f4](https://github.com/sanity-io/color-input/commit/f2635f48853129fd0e6057a93a927753354a91c0))

## [3.0.1](https://github.com/sanity-io/color-input/compare/v3.0.0...v3.0.1) (2022-11-28)

### Bug Fixes

- creating color in portable text editor works again ([0ab5e86](https://github.com/sanity-io/color-input/commit/0ab5e863e1c747434c39e97f7c049138abad235f))

## [3.0.0](https://github.com/sanity-io/color-input/compare/v2.35.2...v3.0.0) (2022-11-25)

### ⚠ BREAKING CHANGES

- this version does not work in Sanity Studio v2

### Features

- initial Sanity Studio v3 release ([7f3fc34](https://github.com/sanity-io/color-input/commit/7f3fc34f6056fe60252cf7ef535949da18437578))

### Bug Fixes

- @sanity/ui 1.0.0-beta.31 ([e43966a](https://github.com/sanity-io/color-input/commit/e43966acb4b050268cca6261abfb91a4e19cd791))
- compiled for dev-preview.22 ([7f52515](https://github.com/sanity-io/color-input/commit/7f52515144fcf7699854b1f0a16b4b55f615afe7))
- compiled for sanity 3.0.0-rc.0 ([506ffcc](https://github.com/sanity-io/color-input/commit/506ffcc668a3d3c2b9c95c2c8821839081fe992f))
- crash when creating new color ([379e793](https://github.com/sanity-io/color-input/commit/379e793417a4d3ceca5f099c282dcef8abddd096))
- **deps:** bumped some deps and added semver workflow ([3bc3153](https://github.com/sanity-io/color-input/commit/3bc315323794555961cf8506ac7dd3ce25eaa773))
- **deps:** compile with sanity dev-preview.17 ([c3bfba6](https://github.com/sanity-io/color-input/commit/c3bfba6bfb27c43bdb31fe1f299ee749f8375cc9))
- **deps:** dev-preview.21 ([3ade93b](https://github.com/sanity-io/color-input/commit/3ade93bf6b14934a762c79819ac34bcbdae8919e))
- **deps:** legacy-peer-deps ([057c101](https://github.com/sanity-io/color-input/commit/057c10153ecbd8567c443c5ea12be3dadfadc1b2))
- **deps:** pin dependencies ([#11](https://github.com/sanity-io/color-input/issues/11)) ([71ba471](https://github.com/sanity-io/color-input/commit/71ba471f23c91afa87eb7d76f54cb1022157c4e5))
- **deps:** pin ts version ([6ce3d57](https://github.com/sanity-io/color-input/commit/6ce3d57e8ca415b06b0cc766826ec09fb7c6b40c))
- **deps:** pkg-utils & @sanity/plugin-kit ([c84aefa](https://github.com/sanity-io/color-input/commit/c84aefae2ffc3c7e02ad33411cf243cd8a0669f9))
- **deps:** regenerated package-lock.json ([76a24b1](https://github.com/sanity-io/color-input/commit/76a24b10189dd18885b59c30df7dca780a1e0a55))
- **deps:** sanity ^3.0.0 (works with rc.3) ([0656c0c](https://github.com/sanity-io/color-input/commit/0656c0cf1eef4f2bab4a4353b482a3f4a7ca8ef1))
- **docs:** example usage use defineConfig ([ca7245e](https://github.com/sanity-io/color-input/commit/ca7245e7d75573bb9fcc3445097e3e78be79e903))

## [3.0.0-v3-studio.12](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.11...v3.0.0-v3-studio.12) (2022-11-12)

### Bug Fixes

- crash when creating new color ([379e793](https://github.com/sanity-io/color-input/commit/379e793417a4d3ceca5f099c282dcef8abddd096))
- **deps:** pkg-utils & @sanity/plugin-kit ([c84aefa](https://github.com/sanity-io/color-input/commit/c84aefae2ffc3c7e02ad33411cf243cd8a0669f9))

## [3.0.0-v3-studio.11](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.10...v3.0.0-v3-studio.11) (2022-11-04)

### Bug Fixes

- **deps:** pin dependencies ([#11](https://github.com/sanity-io/color-input/issues/11)) ([71ba471](https://github.com/sanity-io/color-input/commit/71ba471f23c91afa87eb7d76f54cb1022157c4e5))

## [3.0.0-v3-studio.10](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.9...v3.0.0-v3-studio.10) (2022-11-02)

### Bug Fixes

- **docs:** example usage use defineConfig ([ca7245e](https://github.com/sanity-io/color-input/commit/ca7245e7d75573bb9fcc3445097e3e78be79e903))

## [3.0.0-v3-studio.9](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.8...v3.0.0-v3-studio.9) (2022-11-02)

### Bug Fixes

- compiled for sanity 3.0.0-rc.0 ([506ffcc](https://github.com/sanity-io/color-input/commit/506ffcc668a3d3c2b9c95c2c8821839081fe992f))

## [3.0.0-v3-studio.8](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.7...v3.0.0-v3-studio.8) (2022-10-27)

### Bug Fixes

- @sanity/ui 1.0.0-beta.31 ([e43966a](https://github.com/sanity-io/color-input/commit/e43966acb4b050268cca6261abfb91a4e19cd791))

## [3.0.0-v3-studio.7](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.6...v3.0.0-v3-studio.7) (2022-10-27)

### Bug Fixes

- compiled for dev-preview.22 ([7f52515](https://github.com/sanity-io/color-input/commit/7f52515144fcf7699854b1f0a16b4b55f615afe7))

## [3.0.0-v3-studio.6](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.5...v3.0.0-v3-studio.6) (2022-10-07)

### Bug Fixes

- **deps:** dev-preview.21 ([3ade93b](https://github.com/sanity-io/color-input/commit/3ade93bf6b14934a762c79819ac34bcbdae8919e))

## [3.0.0-v3-studio.5](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.4...v3.0.0-v3-studio.5) (2022-09-15)

### Bug Fixes

- **deps:** compile with sanity dev-preview.17 ([c3bfba6](https://github.com/sanity-io/color-input/commit/c3bfba6bfb27c43bdb31fe1f299ee749f8375cc9))

## [3.0.0-v3-studio.4](https://github.com/sanity-io/color-input/compare/v3.0.0-v3-studio.3...v3.0.0-v3-studio.4) (2022-09-14)

### Bug Fixes

- **deps:** bumped some deps and added semver workflow ([3bc3153](https://github.com/sanity-io/color-input/commit/3bc315323794555961cf8506ac7dd3ce25eaa773))
- **deps:** legacy-peer-deps ([057c101](https://github.com/sanity-io/color-input/commit/057c10153ecbd8567c443c5ea12be3dadfadc1b2))
- **deps:** pin ts version ([6ce3d57](https://github.com/sanity-io/color-input/commit/6ce3d57e8ca415b06b0cc766826ec09fb7c6b40c))
- **deps:** regenerated package-lock.json ([76a24b1](https://github.com/sanity-io/color-input/commit/76a24b10189dd18885b59c30df7dca780a1e0a55))
