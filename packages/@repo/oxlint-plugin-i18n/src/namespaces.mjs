/**
 * The locale namespaces the studio defines, where their US English strings live and when they
 * are registered. Used by the `no-plugin-namespace-outside-plugin` and
 * `no-missing-translation-key` rules.
 *
 * Paths are relative to the repository root.
 *
 * - `constants`: names of the exported constants that hold the namespace string, so
 *   `useTranslation(releasesLocaleNamespace)` resolves to `releases`.
 * - `resources`: the en-US resource files for the namespace. When there is more than one (eg
 *   comments v1 and v2), code inside the directory that owns one of them (the parent of its
 *   `i18n` directory) is checked against that file only, and code elsewhere against all of them.
 * - `registeredBy`: how the namespace gets registered. Namespaces without `allowedIn` are always
 *   registered (`core/i18n/locales.ts`).
 * - `allowedIn`: directories whose code only renders when the registering plugin is loaded.
 *   Reading the namespace from anywhere else shows raw keys in studios without that plugin.
 *
 * Keep this in sync when adding a namespace or changing which plugin registers one.
 *
 * @type {Record<string, {
 *   constants: string[],
 *   resources: string[],
 *   registeredBy: string,
 *   allowedIn?: string[],
 * }>}
 */
export const namespaces = {
  'studio': {
    constants: ['studioLocaleNamespace'],
    resources: ['packages/sanity/src/core/i18n/bundles/studio.ts'],
    registeredBy: 'the default locale (`core/i18n/locales.ts`)',
  },
  'validation': {
    constants: ['validationLocaleNamespace'],
    resources: ['packages/sanity/src/core/i18n/bundles/validation.ts'],
    registeredBy: 'the default locale (`core/i18n/locales.ts`)',
  },
  'copy-paste': {
    constants: ['copyPasteLocalNamespace'],
    resources: ['packages/sanity/src/core/i18n/bundles/copy-paste.ts'],
    registeredBy: 'the default locale (`core/i18n/locales.ts`)',
  },
  'feedback': {
    constants: ['feedbackLocaleNamespace'],
    resources: ['packages/sanity/src/core/i18n/bundles/feedback.ts'],
    registeredBy: 'the default locale (`core/i18n/locales.ts`)',
  },
  'comments': {
    constants: ['commentsLocaleNamespace'],
    resources: [
      'packages/sanity/src/core/comments/i18n/resources.ts',
      'packages/sanity/src/core/comments-v2/i18n/resources.ts',
    ],
    // One of the two comments plugins is always included (`core/config/resolveDefaultPlugins.ts`),
    // so the namespace is always registered, but with either v1's or v2's strings
    registeredBy: 'the comments default plugin (v1, or v2 with `beta.comments.v2`)',
  },
  'releases': {
    constants: ['releasesLocaleNamespace'],
    resources: ['packages/sanity/src/core/releases/i18n/resources.ts'],
    registeredBy:
      'the `sanity/schedules` default plugin (only when `releases.enabled` or `scheduledDrafts.enabled`)',
    allowedIn: ['packages/sanity/src/core/releases/', 'packages/sanity/src/core/schedules/'],
  },
  'singleDocRelease': {
    constants: ['singleDocReleaseNamespace'],
    resources: ['packages/sanity/src/core/singleDocRelease/i18n/resources.ts'],
    registeredBy:
      'the single document release default plugin (only when `scheduledDrafts.enabled`)',
    allowedIn: ['packages/sanity/src/core/singleDocRelease/'],
  },
  'tasks': {
    constants: ['tasksLocaleNamespace'],
    resources: ['packages/sanity/src/core/tasks/i18n/resources.ts'],
    registeredBy: 'the tasks default plugin (only when `tasks.enabled`)',
    allowedIn: ['packages/sanity/src/core/tasks/'],
  },
  'canvas': {
    constants: ['canvasLocaleNamespace'],
    resources: ['packages/sanity/src/core/canvas/i18n/resources.ts'],
    registeredBy: 'the canvas integration default plugin (only when `apps.canvas.enabled`)',
    allowedIn: ['packages/sanity/src/core/canvas/'],
  },
  'variants': {
    constants: ['variantsLocaleNamespace'],
    resources: ['packages/sanity/src/core/variants/i18n/resources.ts'],
    registeredBy: 'the variants default plugin (only when `beta.variants.enabled`)',
    allowedIn: ['packages/sanity/src/core/variants/'],
  },
  'media-library': {
    constants: ['mediaLibraryLocaleNamespace'],
    resources: ['packages/sanity/src/media-library/plugin/i18n/resources.ts'],
    registeredBy: 'the media library default plugin (only when `mediaLibrary.enabled`)',
    allowedIn: ['packages/sanity/src/media-library/'],
  },
  'structure': {
    constants: ['structureLocaleNamespace'],
    resources: ['packages/sanity/src/structure/i18n/resources.ts'],
    registeredBy: '`structureTool()`',
    allowedIn: ['packages/sanity/src/structure/', 'packages/sanity/src/desk/'],
  },
  'presentation': {
    constants: ['presentationLocaleNamespace'],
    resources: ['packages/sanity/src/presentation/i18n/resources.ts'],
    registeredBy: '`presentationTool()`',
    allowedIn: ['packages/sanity/src/presentation/'],
  },
  'vision': {
    constants: ['visionLocaleNamespace'],
    resources: ['packages/@sanity/vision/src/i18n/resources.ts'],
    registeredBy: '`visionTool()`',
    allowedIn: ['packages/@sanity/vision/'],
  },
}
