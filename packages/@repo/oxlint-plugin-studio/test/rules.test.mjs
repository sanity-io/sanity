import {RuleTester} from 'oxlint/plugins-dev'
import {describe, it} from 'vitest'

import plugin from '../src/index.mjs'

RuleTester.describe = describe
RuleTester.it = it

const INTERNALS = 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

/** A case in a TypeScript studio config */
const ts = (code) => ({code, filename: 'sanity.config.ts'})

const beforeSignIn = (source) => ({messageId: 'beforeSignIn', data: {source}})
const lazyOnly = (source) => ({messageId: 'lazyOnly', data: {source}})

const tester = new RuleTester()

tester.run('no-internals-before-sign-in', plugin.rules['no-internals-before-sign-in'], {
  valid: [
    `import {defineConfig} from 'sanity'`,
    `import {renderStudio, useSchema} from '${INTERNALS}-1'`,
    `export {TextWithTone} from '${INTERNALS}-1'`,
    ts(`import type {ArrayOfObjectsInputProps} from '${INTERNALS}'`),
    ts(`import {type ArrayOfObjectsInputProps} from '${INTERNALS}-form'`),
    ts(`export type {PaneRouterContextValue} from '${INTERNALS}-structure'`),
    `const Tool = lazy(() => import('${INTERNALS}-structure'))`,
    `const Input = lazy(() => import('${INTERNALS}-2').then(({FormInput}) => ({default: FormInput})))`,
  ],
  invalid: [
    {
      code: `import {ChangeIndicator} from '${INTERNALS}'`,
      errors: [beforeSignIn(INTERNALS)],
    },
    {
      code: `import {usePaneRouter} from '${INTERNALS}-structure'`,
      errors: [beforeSignIn(`${INTERNALS}-structure`)],
    },
    {
      code: `import '${INTERNALS}-2'`,
      errors: [lazyOnly(`${INTERNALS}-2`)],
    },
    {
      ...ts(`import {type Foo, useBar} from '${INTERNALS}'`),
      errors: [beforeSignIn(INTERNALS)],
    },
    {
      code: `export * from '${INTERNALS}-form'`,
      errors: [beforeSignIn(`${INTERNALS}-form`)],
    },
    {
      code: `export {useClient} from '${INTERNALS}'`,
      errors: [beforeSignIn(INTERNALS)],
    },
  ],
})
