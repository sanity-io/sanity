# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.
## [6.21.0](https://github.com/sanity-io/sanity/compare/v6.20.0...v6.21.0) (2026-10-24)

### Features

* **validation:** add validateDocuments for batch validation ([#15144](https://github.com/sanity-io/sanity/issues/15144)) ([b54a6d8](https://github.com/sanity-io/sanity/commit/b54a6d87e1fb32df00636c58c8c0cfc88cc01ad2))
* **validation:** expose document validation completeness ([#15495](https://github.com/sanity-io/sanity/issues/15495)) ([1fc5a24](https://github.com/sanity-io/sanity/commit/1fc5a2471e823291dfbb3c56b035ab06654e8f6a))

### Bug Fixes

* **schema:** preserve built-in validators in serialized schemas ([#15492](https://github.com/sanity-io/sanity/issues/15492)) ([7015662](https://github.com/sanity-io/sanity/commit/7015662dfc9b63e64ebd5a60d49311c655b23677))

### Performance Improvements

* **validation:** improve performance of document validation ([#15158](https://github.com/sanity-io/sanity/issues/15158)) ([8f95050](https://github.com/sanity-io/sanity/commit/8f950501ab94c100b34adb2bc3074a7fbeb9f117))
## [6.20.0](https://github.com/sanity-io/sanity/compare/v6.19.0...v6.20.0) (2026-10-19)

### Features

* **core:** let a validation subscriber switch a document's shared validation to immediate ([#15369](https://github.com/sanity-io/sanity/issues/15369)) ([1af75fd](https://github.com/sanity-io/sanity/commit/1af75fdecfd6c9780992afd9aee941a4457a38c6))
* **validation:** add immediate validation option ([#15317](https://github.com/sanity-io/sanity/issues/15317)) ([36610af](https://github.com/sanity-io/sanity/commit/36610aff267ec65d575ef329eb29771c9d72aef1))
* **validation:** yield to the browser during an immediate validation run ([#15352](https://github.com/sanity-io/sanity/issues/15352)) ([dfb6f4c](https://github.com/sanity-io/sanity/commit/dfb6f4c7247c84fb147b0adc77e295e07626c1ea))

### Bug Fixes

* **types:** add currentUser to ValidationContext ([#14360](https://github.com/sanity-io/sanity/issues/14360)) ([ded58c4](https://github.com/sanity-io/sanity/commit/ded58c4d5e6e0c4e4dbb6b9087127e4d073b4f50))
## [6.15.0](https://github.com/sanity-io/sanity/compare/v6.14.1...v6.15.0) (2026-09-17)

### Bug Fixes

* **validation:** accept allowed object array selections ([#14765](https://github.com/sanity-io/sanity/issues/14765)) ([e570612](https://github.com/sanity-io/sanity/commit/e57061275a63d223fb0c687f08a253afb5b3d276))
## [6.13.2](https://github.com/sanity-io/sanity/compare/v6.13.1...v6.13.2) (2026-09-11)

### Bug Fixes

* **validation:** honor custom slug uniqueness on type aliases ([#14701](https://github.com/sanity-io/sanity/issues/14701)) ([97bae2a](https://github.com/sanity-io/sanity/commit/97bae2ac9754abd8c0a2aa7f1dc93630635949cd))
* **validation:** keep inherited rules and runtime context consistent ([#14703](https://github.com/sanity-io/sanity/issues/14703)) ([2cf1d4e](https://github.com/sanity-io/sanity/commit/2cf1d4ee2167b54095d9e25b690282af81e90cb3))
## [6.13.0](https://github.com/sanity-io/sanity/compare/v6.12.0...v6.13.0) (2026-09-08)

### Features

* **validation:** add cancellation support ([#14307](https://github.com/sanity-io/sanity/issues/14307)) ([b528986](https://github.com/sanity-io/sanity/commit/b528986e6dbf91f8d3edb505428fc284ca3131eb))
* **validation:** add capability-aware results ([#14306](https://github.com/sanity-io/sanity/issues/14306)) ([7de17c2](https://github.com/sanity-io/sanity/commit/7de17c29494b392553cae32fbf3e9fc010883695))

### Performance Improvements

* **core:** consolidate equality checks on dequal/lite and domain comparators ([#14501](https://github.com/sanity-io/sanity/issues/14501)) ([fccc674](https://github.com/sanity-io/sanity/commit/fccc67448c5f5777ecdeb2e7690ca4a8f85ca229))
## [6.12.0](https://github.com/sanity-io/sanity/compare/v6.11.0...v6.12.0) (2026-09-01)

### Features

* **validation:** add headless document validation package ([#14093](https://github.com/sanity-io/sanity/issues/14093)) ([51f4486](https://github.com/sanity-io/sanity/commit/51f448658213df354afb61746b459dc94f7c10b8))
* **validation:** add stable codes to validation markers ([#14137](https://github.com/sanity-io/sanity/issues/14137)) ([e92ea70](https://github.com/sanity-io/sanity/commit/e92ea704d74e5013bfbe091edb85e3298b5330f6))
* **validation:** add workspace compatibility overload ([#14224](https://github.com/sanity-io/sanity/issues/14224)) ([a9a24b9](https://github.com/sanity-io/sanity/commit/a9a24b9e100a21f5e9d73f374bb644f7097f6fe4))
