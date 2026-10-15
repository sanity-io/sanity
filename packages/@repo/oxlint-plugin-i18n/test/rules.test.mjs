import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {RuleTester} from 'oxlint/plugins-dev'
import {describe, it} from 'vitest'

import plugin from '../src/index.mjs'

RuleTester.describe = describe
RuleTester.it = it

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

const namespaces = {
  studio: {
    constants: ['studioLocaleNamespace'],
    resources: ['core/i18n/studio.ts'],
    registeredBy: 'the default locale',
  },
  comments: {
    constants: ['commentsLocaleNamespace'],
    resources: ['core/comments/i18n/resources.ts', 'core/comments-v2/i18n/resources.ts'],
    registeredBy: 'the comments plugin',
  },
  releases: {
    constants: ['releasesLocaleNamespace'],
    resources: ['core/releases/i18n/resources.ts'],
    registeredBy: 'the releases plugin',
    allowedIn: ['core/releases/'],
  },
}

const options = [{rootDir, namespaces}]

/** A test case for a file at `file` (relative to the fixtures) */
const at = (file, code) => ({
  code,
  filename: path.join(rootDir, file),
  options,
})

const outsideReleases = {
  messageId: 'outsidePlugin',
  data: {namespace: 'releases', registeredBy: 'the releases plugin', allowedIn: 'core/releases/'},
}

const missing = (key, namespace = 'studio', resources = 'core/i18n/studio.ts') => ({
  messageId: 'missingKey',
  data: {key, namespace, resources},
})

const tester = new RuleTester()

tester.run(
  'no-plugin-namespace-outside-plugin',
  plugin.rules['no-plugin-namespace-outside-plugin'],
  {
    valid: [
      at(
        'core/releases/tool/ReleaseDetail.tsx',
        `import {releasesLocaleNamespace} from '../i18n'
        function ReleaseDetail() {
          const {t} = useTranslation(releasesLocaleNamespace)
          return t('action.publish')
        }`,
      ),
      at(
        'core/presence/DocumentPreviewPresence.tsx',
        `function DocumentPreviewPresence() {
          const {t} = useTranslation()
          const {t: tStudio} = useTranslation('studio')
          return t('presence.tooltip.one') + tStudio('presence.tooltip.one')
        }`,
      ),
      // Namespaces that are always registered can be read from anywhere
      at(
        'structure/CommentsButton.tsx',
        `import {commentsLocaleNamespace} from 'sanity'
        function CommentsButton() {
          const {t} = useTranslation(commentsLocaleNamespace)
          return t('compose.placeholder')
        }`,
      ),
    ],
    invalid: [
      // The original bug (SAPP-4649): a core component reading the releases namespace
      {
        ...at(
          'core/presence/DocumentPreviewPresence.tsx',
          `import {releasesLocaleNamespace} from '../releases/i18n'
          function DocumentPreviewPresence() {
            const {t} = useTranslation(releasesLocaleNamespace)
            return t('presence.tooltip.one')
          }`,
        ),
        errors: [outsideReleases],
      },
      {
        ...at(
          'core/form/Input.tsx',
          `function Input() {
            const {t} = useTranslation('releases')
            return t('action.publish')
          }`,
        ),
        errors: [outsideReleases],
      },
      {
        ...at(
          'core/form/Input.tsx',
          `import {releasesLocaleNamespace as ns} from '../releases/i18n'
          const item = {title: 'Publish', i18n: {title: {key: 'action.publish', ns}}}`,
        ),
        errors: [outsideReleases],
      },
      {
        ...at(
          'core/form/Input.tsx',
          `function Input() {
            const {t} = useTranslation()
            return t('action.publish', {ns: 'releases'})
          }`,
        ),
        errors: [outsideReleases],
      },
    ],
  },
)

tester.run('no-missing-translation-key', plugin.rules['no-missing-translation-key'], {
  valid: [
    at(
      'core/presence/DocumentPreviewPresence.tsx',
      `import {studioLocaleNamespace} from '../i18n'
      function DocumentPreviewPresence({count, closeLabel}) {
        const {t} = useTranslation()
        const {t: tCore} = useTranslation(studioLocaleNamespace)
        return [
          // plural and context variants
          t('documents.count', {count}),
          tCore('changes.close-label'),
          <Translate t={t} i18nKey="presence.tooltip.one" />,
          // computed keys are not checked
          t(\`documents.\${closeLabel}\`),
          t(closeLabel),
        ]
      }`,
    ),
    // A \`t\` that is not from \`useTranslation()\` in scope is not checked
    at(
      'core/form/Input.tsx',
      `function Input({t}) {
        return t('not.a.key')
      }
      function Outer() {
        const {t} = useTranslation()
        return items.map((t) => t('not.a.key'))
      }`,
    ),
    // Code in a namespace's own directory is checked against its own resources only
    at(
      'core/comments-v2/CommentInput.tsx',
      `function CommentInput() {
        const {t} = useTranslation(commentsLocaleNamespace)
        return t('v2.only')
      }
      import {commentsLocaleNamespace} from './i18n'`,
    ),
    at(
      'structure/CommentsButton.tsx',
      `import {commentsLocaleNamespace} from 'sanity'
      function CommentsButton() {
        const {t} = useTranslation(commentsLocaleNamespace)
        return t('compose.placeholder')
      }`,
    ),
  ],
  invalid: [
    {
      ...at(
        'core/form/Input.tsx',
        `function Input() {
          const {t} = useTranslation()
          return t('presence.tooltip.missing')
        }`,
      ),
      errors: [missing('presence.tooltip.missing')],
    },
    // A key read with the \`t\` of another namespace
    {
      ...at(
        'core/releases/tool/ReleaseDetail.tsx',
        `import {releasesLocaleNamespace} from '../i18n'
        function ReleaseDetail() {
          const {t} = useTranslation(releasesLocaleNamespace)
          const {t: tCore} = useTranslation()
          return [t('changes.close-label'), tCore('action.publish')]
        }`,
      ),
      errors: [
        missing('changes.close-label', 'releases', 'core/releases/i18n/resources.ts'),
        missing('action.publish'),
      ],
    },
    {
      ...at(
        'core/form/Input.tsx',
        `function Input({ok}) {
          const {t} = useTranslation()
          return <Translate t={t} i18nKey={ok ? 'changes.close-label' : 'changes.open-label'} />
        }`,
      ),
      errors: [missing('changes.open-label')],
    },
    {
      ...at(
        'core/form/Input.tsx',
        `const item = {title: 'Missing', i18n: {title: {key: 'missing', ns: 'studio'}}}`,
      ),
      errors: [missing('missing')],
    },
    // Outside the comments directories, a key must exist in both comments versions
    {
      ...at(
        'structure/CommentsButton.tsx',
        `import {commentsLocaleNamespace} from 'sanity'
        function CommentsButton() {
          const {t} = useTranslation(commentsLocaleNamespace)
          return t('v2.only')
        }`,
      ),
      errors: [missing('v2.only', 'comments', 'core/comments/i18n/resources.ts')],
    },
    {
      ...at(
        'core/form/Input.tsx',
        `function Input() {
          const {t} = useTranslation('nope')
          return t('anything')
        }`,
      ),
      errors: [{messageId: 'unknownNamespace', data: {namespace: 'nope'}}],
    },
  ],
})
