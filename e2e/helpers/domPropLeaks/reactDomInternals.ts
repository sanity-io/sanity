import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import vm from 'node:vm'

/**
 * The studio the suite runs against. Its `react-dom` is the copy the studio bundles, so that is
 * the React whose validation rules describe what the studio renders.
 */
export const STUDIO_PACKAGE_JSON = fileURLToPath(
  new URL('../../../dev/studio-e2e-testing/package.json', import.meta.url),
)

/**
 * Module-scope bindings of `react-dom`'s development client bundle that the DOM prop leak guard
 * reads. The bundle does not export them, so {@link loadReactDomInternals} appends an export to a
 * copy of the bundle before evaluating it.
 */
const INTERNAL_NAMES = [
  'possibleStandardNames',
  'ariaProperties',
  'registrationNameDependencies',
  'possibleRegistrationNames',
  'VALID_ATTRIBUTE_NAME_REGEX',
  'rARIA',
  'rARIACamel',
  'EVENT_NAME_REGEX',
  'INVALID_EVENT_NAME_REGEX',
  'isCustomElement',
  'getAttributeAlias',
  'isAttributeNameSafe',
  'validatePropertiesInDevelopment',
  'warnedProperties',
  'warnedProperties$1',
  'illegalAttributeNameCache',
  'validatedAttributeNameCache',
] as const

type ConsoleSink = (level: string, args: unknown[]) => void

/**
 * React's own DOM prop validation, as shipped in the installed `react-dom` development build: the
 * tables `ReactDOMUnknownPropertyHook` and `ReactDOMInvalidARIAHook` validate against, and the
 * functions react-dom calls when it creates or updates a host element. The production build the
 * e2e suite runs against strips all of it, which is why the DOM prop leak scanner carries a copy
 * of the tables and a port of the functions (`createDomPropClassifier`); the functions here are
 * the reference the port is tested against.
 */
export interface ReactDomInternals {
  version: string
  bundlePath: string
  /** Lowercased attribute or property name → the spelling React expects. */
  possibleStandardNames: Record<string, string>
  /** Valid `aria-*` attribute names. */
  ariaProperties: Record<string, unknown>
  /** Every React event prop, including the `…Capture` variants. */
  registrationNameDependencies: Record<string, string[]>
  /** Lowercased event prop → React event prop, plus the `ondblclick` alias. */
  possibleRegistrationNames: Record<string, string>
  VALID_ATTRIBUTE_NAME_REGEX: RegExp
  rARIA: RegExp
  rARIACamel: RegExp
  EVENT_NAME_REGEX: RegExp
  INVALID_EVENT_NAME_REGEX: RegExp
  isCustomElement: (tagName: string) => boolean
  getAttributeAlias: (name: string) => string
  isAttributeNameSafe: (name: string) => boolean
  /** What react-dom runs on the props of every host element it creates or updates. */
  validatePropertiesInDevelopment: (type: string, props: Record<string, unknown>) => void
  /** Forget which names react-dom has already warned about (it warns once per name). */
  resetWarnings: () => void
  /** Receives the bundle's `console` calls. Returns a function that restores the previous sink. */
  setConsoleSink: (sink: ConsoleSink) => () => void
}

let cached: ReactDomInternals | undefined

/**
 * Evaluate the studio's `react-dom` development client bundle with an export of its validation
 * internals appended, and return them. The result is cached per process.
 *
 * Throws with the list of missing bindings when a `react-dom` upgrade renames or removes one, so
 * the guard fails loudly instead of silently validating against stale rules.
 */
export function loadReactDomInternals(): ReactDomInternals {
  if (cached) return cached

  const studioRequire = createRequire(STUDIO_PACKAGE_JSON)
  const reactDomPackageJson = studioRequire.resolve('react-dom/package.json')
  const {version} = JSON.parse(readFileSync(reactDomPackageJson, 'utf8')) as {version: string}
  const bundlePath = path.join(
    path.dirname(reactDomPackageJson),
    'cjs',
    'react-dom-client.development.js',
  )
  const source = readFileSync(bundlePath, 'utf8')

  // The bundle is `"production" !== process.env.NODE_ENV && (function () { … })();`: every
  // binding above is a `var` or function declaration in that IIFE, visible at its end.
  const end = source.lastIndexOf('})();')
  if (end === -1 || source.slice(end + '})();'.length).trim() !== '') {
    throw new Error(
      `react-dom ${version}: ${bundlePath} is no longer a single IIFE ending in \`})();\`, update e2e/helpers/domPropLeaks/reactDomInternals.ts`,
    )
  }
  const exportKey = '__sanityDomPropLeakGuard'
  const exportCode = INTERNAL_NAMES.map(
    (name) =>
      `try { exports.${exportKey}[${JSON.stringify(name)}] = ${name} } catch (error) { exports.${exportKey}.missing.push(${JSON.stringify(name)}) }`,
  ).join('\n')
  const patched = `${source.slice(0, end)}\nexports.${exportKey} = {missing: []};\n${exportCode}\n${source.slice(end)}`

  let sink: ConsoleSink = () => {}
  const bundleConsole = new Proxy(console, {
    get(target, level) {
      if (typeof level !== 'string' || typeof Reflect.get(target, level) !== 'function') {
        return Reflect.get(target, level)
      }
      return (...args: unknown[]) => sink(level, args)
    },
  })
  const compiled = vm.runInThisContext(
    `(function (exports, require, module, __filename, __dirname, process, console) {\n${patched}\n})`,
    {filename: bundlePath},
  ) as (...args: unknown[]) => void
  const bundleModule: {exports: Record<string, unknown>} = {exports: {}}
  compiled.call(
    bundleModule.exports,
    bundleModule.exports,
    createRequire(bundlePath),
    bundleModule,
    bundlePath,
    path.dirname(bundlePath),
    // Only the bundle's own `NODE_ENV` gate reads this; the development build is the only one
    // that contains the validation code.
    {env: {NODE_ENV: 'development'}},
    bundleConsole,
  )

  const internals = bundleModule.exports[exportKey] as Record<string, unknown> & {
    missing: string[]
  }
  if (internals.missing.length > 0) {
    throw new Error(
      `react-dom ${version} no longer defines ${internals.missing.map((name) => `\`${name}\``).join(', ')} in ${bundlePath}. The DOM prop leak guard mirrors React's prop validation from these bindings; update e2e/helpers/domPropLeaks to the new react-dom source.`,
    )
  }

  const warnCaches = [
    internals.warnedProperties,
    internals['warnedProperties$1'],
    internals.illegalAttributeNameCache,
    internals.validatedAttributeNameCache,
  ] as Record<string, unknown>[]

  cached = {
    ...(internals as unknown as Omit<
      ReactDomInternals,
      'version' | 'bundlePath' | 'resetWarnings' | 'setConsoleSink'
    >),
    version,
    bundlePath,
    resetWarnings() {
      for (const cache of warnCaches) {
        for (const key of Object.keys(cache)) delete cache[key]
      }
    },
    setConsoleSink(nextSink) {
      const previous = sink
      sink = nextSink
      return () => {
        sink = previous
      }
    },
  }
  return cached
}
