import {cpSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {RuleTester} from 'oxlint/plugins-dev'
import {afterAll, describe, it} from 'vitest'

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
      function DocumentPreviewPresence({count, closeLabel, countOptions}) {
        const {t} = useTranslation()
        const {t: tCore} = useTranslation(studioLocaleNamespace)
        return [
          // plural and context variants
          t('documents.count', {count}),
          t('documents.count', countOptions),
          <Translate t={t} i18nKey="documents.count" values={{count}} />,
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
    // A key that only has plural variants renders raw when no \`count\` or \`context\` is passed
    {
      ...at(
        'core/form/Input.tsx',
        `function Input() {
          const {t} = useTranslation()
          return t('documents.count')
        }`,
      ),
      errors: [missing('documents.count')],
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

describe('no-missing-translation-key resource changes', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'i18n-plugin-'))
  const resourceFile = path.join(tempDir, 'core/i18n/studio.ts')
  cpSync(rootDir, tempDir, {recursive: true})

  afterAll(() => rmSync(tempDir, {recursive: true, force: true}))

  const tempCase = {
    code: `function Input() {
      const {t} = useTranslation()
      return t('added.later')
    }`,
    filename: path.join(tempDir, 'core/form/Input.tsx'),
    options: [{rootDir: tempDir, namespaces}],
  }

  tester.run('before the key is added', plugin.rules['no-missing-translation-key'], {
    valid: [],
    invalid: [{...tempCase, errors: [missing('added.later')]}],
  })

  it('picks up a key added to a resource file', () => {
    const source = readFileSync(resourceFile, 'utf8')
    writeFileSync(
      resourceFile,
      source.replace(
        "  'changes.close-label'",
        "  'added.later': 'Added',\n  'changes.close-label'",
      ),
    )
    const later = new Date(Date.now() + 60_000)
    utimesSync(resourceFile, later, later)
  })

  tester.run('after the key is added', plugin.rules['no-missing-translation-key'], {
    valid: [tempCase],
    invalid: [],
  })
})
