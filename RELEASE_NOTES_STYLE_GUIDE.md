# Release Notes Style Guide

This document relates to our [pull-request template](https://github.com/sanity-io/sanity/blob/next/.github/PULL_REQUEST_TEMPLATE.md) and our [script to generate release notes](https://github.com/sanity-io/sanity/blob/next/scripts/printReleaseNotesTemplate.js).

## Structure

The structure of our release notes is as follows:

1. How to upgrade
2. ✨ Highlights (optional, heading 1)
   1. Highlighted feature x (optional, heading 2)
   1. Other notable features (omitted if no other multiline headers exist, heading 2)
      1. Bulleted list of notables features with PR number
3. 🐛 Notable bugfixes (optional, heading 1)
   1. Highlighted bugfix x (optional, heading 2)
   1. Other notable bugfixes (omitted if no other multiline headers exist, heading 2)
      1. Bulleted list of notables bugfixes with PR number
4. 📓 Full changelog

## ✨ Highlights

Use one or two paragraphs to explain the highlighted feature.

This kind of section is multiline and free-form. If applicable, add a screenshot or two.

<img width="974" alt="presence demo screenshot" src="https://user-images.githubusercontent.com/10551026/153032105-90441f65-4f66-483b-a860-09d4160217f5.png">

## Other notable features

- These features should be described in one or two short sentences. A PR number will be added here for you (don't add it yourself) (#XXXX)
- You can now \_\_\_\_ for \_\_\_\_ (#XXXX)
- Added \_\_\_\_ to the \_\_\_\_ (#XXXX)

## 🐛 Notable bugfixes

- Fixes (use present-tense) \_\_\_\_

## 📓 Full changelog

_This section is will be generated for you_

---

# Example release notes

---

Upgrade the Command Line Interface (CLI) with:

    npm install --global @sanity/cli

Upgrade Sanity Studio with:

    sanity upgrade

# ✨ Highlights

## More Presence

[Presence](https://www.sanity.io/blog/introducing-presence), the ability to see where your collaborators are, is now visible in document lists, search results, and reference previews.

<img width="974" alt="presence demo screenshot" src="https://user-images.githubusercontent.com/10551026/153032105-90441f65-4f66-483b-a860-09d4160217f5.png">

## Other features

- You can now configure the default API version for Vision (#3127)

# 🐛 Notable bugfixes

- Removes a false positive validation error with some nested image and file fields (#3119)
- Fixes a bug where adding marks to a Portable Text block would remove some existing marks (#3124)
- Fixes a bug where list items in Portable Text without a level would cause an error (#3129)
- Fixes a bug where read-only arrays showed an empty actions menu (#3130)
- Improves empty read-only state for arrays (#3131)
- Adds validation warnings on incorrectly implemented asset sources (#3135)

# 📓 Full changelog

| Author               | Message                                                                                                 | Commit     |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| Espen Hovlandsdal    | chore: externalize + upgrade generate-help-url                                                          | 4e6b57d9fa |
| Espen Hovlandsdal    | fix(cypress): use uuid instead of nanoid for document ids                                               | e8d0d6a5fb |
| Marius Lundgård      | chore: render path to `package.json` when running `npm run versions`                                    | e961b84e01 |
| Espen Hovlandsdal    | fix(form-builder): unset image/file field when last subfield is cleared                                 | 5cce39da0a |
| Simeon Griggs        | fix(cli): change upgrade text depending on number of modules                                            | ea454e4561 |
| Bjørge Næss          | fix(default-layout): fix bug that required two clicks to close studio hints sidecar                     | a528b837c4 |
| Per-Kristian Nordnes | fix(portable-text-editor): fix normalization bug in adding marks + test                                 | edef424405 |
| Herman Wikner        | feat(base): add `DocumentPreviewPresence` component                                                     | 27d15d6ac1 |
| Herman Wikner        | refactor(desk-tool): remove `getStatusIndicator` `PaneItem` helper (replaced)                           | f29dc3654d |
| Herman Wikner        | feat(desk-tool): add presence to `PaneItem`                                                             | b96d13f811 |
| Herman Wikner        | refactor(desk-tool): update `DocumentListPaneContent`                                                   | ebabebce58 |
| Herman Wikner        | feat(form-builder): add presence in `ReferencePreview`                                                  | 6c33f3ff3b |
| Herman Wikner        | feat(form-builder): pass document presence data to `ReferencePreview` from `PreviewReferenceValue`      | 455aa096c5 |
| Herman Wikner        | feat(form-builder): pass document presence data to `PreviewReferenceValue` in `ArrayItemReferenceInput` | d6e2313407 |
| Herman Wikner        | feat(form-builder): pass document presence data to `PreviewReferenceValue` in `ReferenceInput`          | 9c513c879f |
| Herman Wikner        | feat(default-layout): add presence in search                                                            | 110594371f |
| Herman Wikner        | refactor(form-builder): update presence in `OptionPreview`                                              | 507ee8022a |
| Herman Wikner        | feat(base): add `PreviewCard` component                                                                 | 4852bd8f78 |
| Herman Wikner        | refactor(form-builder): remove `PreviewCard` component, replaced by a new component located in base     | 9254717b1a |
| Herman Wikner        | test(base): add `PreviewCard` workshop story                                                            | 9318d82685 |
| Bjørge Næss          | refactor(form-builder): update document presence from sanity/studio input wrappers                      | 6eaf8fb458 |
| Herman Wikner        | refactor(form-builder): update presence in `PreviewReferenceValue`                                      | 2dacc3b6de |
| Herman Wikner        | chore: export `DocumentPresence` interface                                                              | 0e3522cece |
| Fred Carlsen         | fix(form-builder): improve empty read-only array state (#3131)                                          | d3900918c7 |
| Fred Carlsen         | fix(form-builder): hide array actions if read-only (#3130)                                              | 4d21c9f740 |
| Fred Carlsen         | feat(vision): make default api version configurable (#3127)                                             | 892e1d5cb0 |
| Simeon Griggs        | fix(default-layout): remove null/undefined tools                                                        | c5545f65b1 |
| Marius Lundgård      | fix(base): remove debug style                                                                           | c548fbe39a |
| Espen Hovlandsdal    | fix(form-builder): ensure asset sources is array before usage                                           | 7aefcd94dc |
| Espen Hovlandsdal    | fix(form-builder): forward ref in default asset source                                                  | cd1f7e84d1 |
| Espen Hovlandsdal    | refactor(test-studio): forward ref in noop asset source                                                 | bb558d1455 |
| Per-Kristian Nordnes | fix(portable-text-editor): add render defaults for list blocks levels when missing                      | bde7abda0c |
| Rico Kahler          | fix(form-builder): remove rogue text 😄                                                                 | 53e302ce2b |

---
