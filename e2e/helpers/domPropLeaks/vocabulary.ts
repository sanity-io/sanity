import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'

import {loadReactDomInternals, STUDIO_PACKAGE_JSON} from './reactDomInternals'

export interface RegExpSource {
  source: string
  flags: string
}

/**
 * Everything the in-page classifier needs to know about valid DOM props, as plain JSON so it
 * can be embedded in the init script. Built from the studio's own `react-dom` and
 * `@emotion/is-prop-valid` (the check styled-components warns with), so a dependency upgrade
 * updates the rules without anyone touching a list.
 */
export interface DomPropVocabulary {
  reactVersion: string
  isPropValidVersion: string
  /** Lowercased attribute or property name → the spelling React expects. */
  standardNames: Record<string, string>
  /** Valid `aria-*` attribute names. */
  ariaAttributes: string[]
  /** Every React event prop, including the `…Capture` variants. */
  eventProps: string[]
  /** Lowercased event prop → React event prop. */
  possibleEventProps: Record<string, string>
  patterns: {
    validAttributeName: RegExpSource
    aria: RegExpSource
    ariaCamel: RegExpSource
    eventName: RegExpSource
    /** `reactPropsRegex` of `@emotion/is-prop-valid`. */
    isPropValid: RegExpSource
  }
  /** See {@link EXTRA_ATTRIBUTES}. */
  extraAttributes: string[]
}

/**
 * Lowercase HTML attributes that are valid but missing from React's `possibleStandardNames`,
 * and that not every engine the suite runs reflects as an element property, which is what the
 * `unknown-attribute` rule otherwise accepts them by. `ui5` renders `closedby` and
 * `interestfor`; the others belong to the same new HTML features, and `precedence` is React's
 * own prop for hoisted stylesheets. Add a name here when it is a real attribute the guard
 * reports by mistake.
 */
export const EXTRA_ATTRIBUTES = [
  'blocking',
  'closedby',
  'command',
  'commandfor',
  'exportparts',
  'interestfor',
  'precedence',
  'writingsuggestions',
] as const

export interface IsPropValid {
  version: string
  pattern: RegExpSource
  /** The package's own implementation, for checking the pattern against. */
  isPropValid: (prop: string) => boolean
}

let cachedIsPropValid: IsPropValid | undefined

/**
 * The `@emotion/is-prop-valid` that the studio's styled-components warns with. Its check is a
 * single regular expression plus an `on` + non-lowercase prefix test; the expression is read from
 * the package's ESM build so the browser can run the same check.
 */
export function loadIsPropValid(): IsPropValid {
  if (cachedIsPropValid) return cachedIsPropValid

  const styledComponentsPackageJson = createRequire(STUDIO_PACKAGE_JSON).resolve(
    'styled-components/package.json',
  )
  const packageJsonPath = createRequire(styledComponentsPackageJson).resolve(
    '@emotion/is-prop-valid/package.json',
  )
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    version: string
    main: string
    module: string
  }
  const packageDir = path.dirname(packageJsonPath)
  const moduleSource = readFileSync(path.join(packageDir, packageJson.module), 'utf8')
  const literal = moduleSource.match(
    /\breactPropsRegex\s*=\s*\/((?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\n[])+)\/([dgimsuvy]*)/,
  )
  if (!literal) {
    throw new Error(
      `@emotion/is-prop-valid ${packageJson.version} no longer defines \`reactPropsRegex\` as a regular expression literal in ${packageJson.module}; update e2e/helpers/domPropLeaks/vocabulary.ts`,
    )
  }
  const required = createRequire(packageJsonPath)(path.join(packageDir, packageJson.main)) as
    | ((prop: string) => boolean)
    | {default: (prop: string) => boolean}

  cachedIsPropValid = {
    version: packageJson.version,
    pattern: {source: literal[1], flags: literal[2]},
    isPropValid: typeof required === 'function' ? required : required.default,
  }
  return cachedIsPropValid
}

function toSource(regExp: RegExp): RegExpSource {
  return {source: regExp.source, flags: regExp.flags}
}

let cachedVocabulary: DomPropVocabulary | undefined

export function loadDomPropVocabulary(): DomPropVocabulary {
  if (cachedVocabulary) return cachedVocabulary

  const react = loadReactDomInternals()
  const isPropValid = loadIsPropValid()
  cachedVocabulary = {
    reactVersion: react.version,
    isPropValidVersion: isPropValid.version,
    standardNames: {...react.possibleStandardNames},
    ariaAttributes: Object.keys(react.ariaProperties),
    eventProps: Object.keys(react.registrationNameDependencies),
    possibleEventProps: {...react.possibleRegistrationNames},
    patterns: {
      validAttributeName: toSource(react.VALID_ATTRIBUTE_NAME_REGEX),
      aria: toSource(react.rARIA),
      ariaCamel: toSource(react.rARIACamel),
      eventName: toSource(react.EVENT_NAME_REGEX),
      isPropValid: isPropValid.pattern,
    },
    extraAttributes: [...EXTRA_ATTRIBUTES],
  }
  return cachedVocabulary
}
