/**
 * Real Studio i18n harness for Storybook.
 *
 * Studio's ui-components (Dialog, ConfirmPopover, ...) call react-i18next's
 * `useTranslation()` directly, so stories need an initialized i18next instance
 * carrying the real `studio` namespace bundle — not hand-typed fixture strings.
 *
 * `prepareI18n` builds the same instance the Studio runtime uses (including the
 * Sanity i18n backend that serves the bundles) and registers it as the
 * react-i18next default via `initReactI18next`, then kicks off `init()` itself.
 *
 * Both imports are deep source paths: neither `prepareI18n` nor
 * `studioDefaultLocaleResources` is reachable through the `sanity` exports map
 * (this mirrors how packages/sanity/test/testUtils/TestProvider.tsx gets them).
 *
 * NOTE: the i18next/react-i18next versions in this package's package.json MUST
 * match packages/sanity's own pins. A mismatch yields a second, uninitialized
 * i18next module instance and translations silently render as raw keys.
 */
import {canvasUsEnglishLocaleBundle} from '../../../packages/sanity/src/core/canvas/i18n'
import {commentsUsEnglishLocaleBundle} from '../../../packages/sanity/src/core/comments/i18n'
import {studioDefaultLocaleResources} from '../../../packages/sanity/src/core/i18n/bundles/studio'
import {prepareI18n} from '../../../packages/sanity/src/core/i18n/i18nConfig'
import {releasesUsEnglishLocaleBundle} from '../../../packages/sanity/src/core/releases/i18n'
import {singleDocReleaseUsEnglishLocaleBundle} from '../../../packages/sanity/src/core/singleDocRelease/i18n'
import {tasksUsEnglishLocaleBundle} from '../../../packages/sanity/src/core/tasks/i18n'
import {variantsUsEnglishLocaleBundle} from '../../../packages/sanity/src/core/variants/i18n'
import {mediaLibraryUsEnglishLocaleBundle} from '../../../packages/sanity/src/media-library/plugin/i18n'
import {structureUsEnglishLocaleBundle} from '../../../packages/sanity/src/structure/i18n'

// The structure bundle rides along because several core components reach into the
// `structure` namespace (e.g. "Looking for referring documents…" in the delete/unpublish
// confirm dialogs) — with only the `studio` namespace those strings render as raw keys
// or literals (found during the Phase B build).
//
// The releases/comments/tasks/variants/singleDocRelease bundles mirror what the real
// runtime registers through its built-in plugins. They are LOAD-BEARING for any story
// mounting a real `DocumentPane`: the pane's `DocumentLayout` subtree is wrapped in a
// `Suspense` (`useMiddlewareComponents`) and its children call `useTranslation` on
// those namespaces — the Sanity i18n backend FAILS reads for unregistered namespaces,
// react-i18next never unsuspends, and the pane renders as a permanently-animated
// skeleton strip (wave-4a QA's "DocumentPane shows nothing" finding).
const {i18next} = prepareI18n({
  projectId: 'storybook',
  dataset: 'storybook',
  name: 'storybook',
  i18n: {
    bundles: [
      studioDefaultLocaleResources,
      structureUsEnglishLocaleBundle,
      releasesUsEnglishLocaleBundle,
      commentsUsEnglishLocaleBundle,
      tasksUsEnglishLocaleBundle,
      variantsUsEnglishLocaleBundle,
      singleDocReleaseUsEnglishLocaleBundle,
      canvasUsEnglishLocaleBundle,
      mediaLibraryUsEnglishLocaleBundle,
    ],
  },
})

export {i18next}
