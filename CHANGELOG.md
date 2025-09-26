# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.10.2](https://github.com/sanity-io/sanity/compare/v4.10.1...v4.10.2) (2025-09-26)


### Bug Fixes

* **core:** avoid repeated requests in case of failing project requests ([#10770](https://github.com/sanity-io/sanity/issues/10770)) ([c03497f](https://github.com/sanity-io/sanity/commit/c03497f939b5cd0107bb333c9a2f41eae03c49ad))
* delay teardown of get-org-id request ([#10771](https://github.com/sanity-io/sanity/issues/10771)) ([de40474](https://github.com/sanity-io/sanity/commit/de40474d2e8b945634194ee77882945bdbd463f2))
* only reading server metadata when unfocused from input ([#10749](https://github.com/sanity-io/sanity/issues/10749)) ([a255a6d](https://github.com/sanity-io/sanity/commit/a255a6d894d0be3f5d82a716909ddcda0e7ad257))



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
