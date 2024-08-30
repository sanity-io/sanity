import {Button, Card, Flex, Text} from '@sanity/ui'
import {
  // useCallback,
  useEffect,
  // useRef,
  useState,
  // useSyncExternalStore,
} from 'react'
import {definePlugin, type LayoutProps} from 'sanity'
import {__PRIVATE__, StyleSheetManager} from 'styled-components'

const IS_BROWSER = typeof window !== 'undefined' && 'HTMLElement' in window

export const debugStyledComponents = definePlugin({
  name: 'debug-styled-components',
  studio: {
    components: {
      layout: DebugLayout,
    },
  },
})

const DEFAULT_OPTIONS = {
  // Reconstruct default options
  // https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/sheet/Sheet.ts#L23-L26
  isServer: !IS_BROWSER,
  useCSSOMInjection: true,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
function DebugLayout(props: LayoutProps) {
  const {renderDefault} = props
  const [showToolbar, setShowToolbar] = useState(true)
  const [[profiling, sheet], setState] = useState(() => [false, new StyleSheet(DEFAULT_OPTIONS)])
  const [paused, setPaused] = useState<false | InstanceType<typeof StyleSheet>>(false)
  // const [profiling, setProfiling] = useState(false)
  // const [, setTick] = useState(1)
  // const [onStoreChange, setOnStoreChange] = useState(() => () => {})
  // const onBufferRef = useRef(onStoreChange)
  // useEffect(() => {
  // onBufferRef.current = onStoreChange
  // }, [onStoreChange])
  // const [blazingSheet] = useState(
  //   () =>
  //     new BlazingStyleSheet({
  //       // Schedule state updates when the buffer is queued
  //       onBuffer: () => {
  //         // console.log('onBuffer')
  //         setTick((prev) => prev + 1)
  //       },
  //       // onBuffer: () => onBufferRef.current(),
  //       // Reconstruct default options
  //       // https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/sheet/Sheet.ts#L23-L26
  //       isServer: !IS_BROWSER,
  //       useCSSOMInjection: true,
  //     }),
  // )
  // const shouldFlush = useSyncExternalStore(
  //   useCallback((_onStoreChange) => {
  //     setOnStoreChange(() => _onStoreChange)
  //     return () => setOnStoreChange(() => () => {})
  //   }, []),
  //   () => blazingSheet.shouldFlush(),
  //   () => true,
  // )
  // const [enabled, setEnabled] = useState(true)
  // const [flush, setFlush] = useState(true)
  // const [namespace, setNamespace] = useState<string | undefined>()
  // const [disableCSSOMInjection, setDisableCSSOMInjection] = useState<boolean | undefined>()
  // const [enableVendorPrefixes, setEnableVendorPrefixes] = useState<boolean | undefined>()

  // useEffect(() => {
  //   // @ts-expect-error -- debug global
  //   window.cody = {
  //     setNamespace,
  //     setDisableCSSOMInjection,
  //     setEnableVendorPrefixes,
  //     setEnabled,
  //     toggle: () => setFlush((prev) => !prev),
  //   }
  //   return () => {
  //     // @ts-expect-error -- debug global
  //     delete window.cody
  //   }
  // }, [])

  // useEffect(() => {
  //   console.log({
  //     blazingSheet,
  //     namespace,
  //     disableCSSOMInjection,
  //     enableVendorPrefixes,
  //     enabled,
  //     // shouldFlush,
  //   })
  // }, [blazingSheet, disableCSSOMInjection, enableVendorPrefixes, enabled, namespace])

  // Pause event emitter during render:
  // https://github.com/final-form/react-final-form/issues/751#issuecomment-689431448
  // blazingSheet.pauseEvents()

  // Update CSSOM
  // useInsertionEffect(() => {
  //   if (flush) {
  //     blazingSheet.flush()
  //   }
  // })

  // Check if CSSOM should update
  // @TODO rewrite to use useState to buffer up changes that should flush
  // useEffect(() => {
  //   if (flush) {
  //     if (blazingSheet.shouldFlush()) {
  //       // console.log('Flush in side-effect!')
  //       setTick((prev) => prev + 1)
  //     }
  //     blazingSheet.resumeEvents()
  //   }
  // })

  useEffect(() => {
    if (!showToolbar) return undefined
    // @ts-expect-error -- this is just debug stuff
    delete window.__openDebugToolbar
    return () => {
      // @ts-expect-error -- this is just debug stuff
      window.__openDebugToolbar = () => {
        setShowToolbar(true)
      }
      // eslint-disable-next-line no-console
      console.log(
        'You can re-open the toolbar by calling `window.__openDebugToolbar()` in your console',
      )
    }
  }, [showToolbar])

  const children = renderDefault(props)

  return (
    <>
      {showToolbar && (
        <Card paddingX={4} paddingY={2} tone="caution">
          <Flex align="center" gap={4}>
            <Text weight="semibold" size={1}>
              Debug Styled Components CSS rendering
            </Text>
            <Button
              disabled={paused !== false}
              tone={profiling ? 'positive' : 'caution'}
              text={profiling ? 'Disable profiling' : 'Enable profiling'}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() =>
                setState(([prevProfiling, prevSheet]) => {
                  const nextProfiling = !prevProfiling
                  // Remove rules asded by the previous sheet
                  for (const id of prevSheet.names.keys()) {
                    prevSheet.clearRules(id)
                  }

                  return [
                    nextProfiling,
                    nextProfiling
                      ? new DebugStyleSheet(DEFAULT_OPTIONS)
                      : new StyleSheet(DEFAULT_OPTIONS),
                  ]
                })
              }
            />
            <Button
              tone={paused ? 'positive' : 'critical'}
              text={paused ? 'Resume CSSOM' : 'Pause CSSOM'}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() =>
                setPaused((prev) =>
                  prev === false ? new FrozenStyleSheet(DEFAULT_OPTIONS) : false,
                )
              }
            />
            <Button text="Close toolbar" onClick={() => setShowToolbar(false)} />
          </Flex>
        </Card>
      )}

      <StyleSheetManager sheet={paused || sheet}>{children}</StyleSheetManager>
    </>
  )

  // if (!enabled) {
  //   return renderDefault(props)
  // }

  // return (
  //   <StyleSheetManager sheet={blazingSheet}>
  //     <StyleSheetManager
  //       namespace={namespace}
  //       disableCSSOMInjection={disableCSSOMInjection}
  //       enableVendorPrefixes={enableVendorPrefixes}
  //     >
  //       {renderDefault(props)}
  //     </StyleSheetManager>
  //   </StyleSheetManager>
  // )
}

// @TODO refactor to wrap around mainSheet with a proxy that queues up insertRule and deleteRule calls
const {StyleSheet} = __PRIVATE__

/* eslint-disable no-console */
/**
 * This is a custom StyleSheet that gives us performance metrics and shows when the CSSOM is written to
 */
class DebugStyleSheet extends StyleSheet {
  /**
   * Overriding this method is necessary, as it has a hardcoded call with the `StyleSheet` constructor
   */
  override reconstructWithOptions(
    options: Parameters<InstanceType<typeof StyleSheet>['reconstructWithOptions']>[0],
    withNames = true,
  ) {
    return new DebugStyleSheet(
      {...this.options, ...options},
      this.gs,
      (withNames && this.names) || undefined,
    )
  }
  override insertRules(id: string, name: string, rules: string | string[]): void {
    const label = `insertRules(${id}, ${name})`
    console.group(label)
    console.count('insertRules call count')
    console.time(label)
    super.insertRules(id, name, rules)
    console.timeEnd(label)
    console.groupEnd()
  }
  override clearRules(id: string): void {
    const label = `clearRules(${id})`
    console.group(label)
    console.count('clearRules call count')
    console.time(label)
    super.clearRules(id)
    console.timeEnd(label)
    console.groupEnd()
  }
}
/* eslint-enable no-console */

/**
 * This is a custom StyleSheet that never writes to the CSSOM, allowing perf testing of what happens when styled-components never write to the CSSOM
 */
class FrozenStyleSheet extends StyleSheet {
  /**
   * Overriding this method is necessary, as it has a hardcoded call with the `StyleSheet` constructor
   */
  override reconstructWithOptions(
    options: Parameters<InstanceType<typeof StyleSheet>['reconstructWithOptions']>[0],
    withNames = true,
  ) {
    return new FrozenStyleSheet(
      {...this.options, ...options},
      this.gs,
      (withNames && this.names) || undefined,
    )
  }
  override insertRules(id: string, name: string, rules: string | string[]): void {
    // no op
  }
  override clearRules(id: string): void {
    // no op
  }
}

/**
 * This is a highly experimental custom StyleSheet that buffers up `insertRules` and `clearRules` calls and flushes them in a `useInsertionEffect`.
 * There's also an experimental build of `styled-components` that implements it at the component level, add this to pnpm to test it:
 * ```json
 *  "overrides": {
 *      "styled-components": "npm:speedy-styled-components@6.1.12-canary.0"
 *    }
 * ```
 */
// const EMPTY_OBJECT = Object.freeze({}) as Readonly<{[key: string]: any}>
// class BlazingStyleSheet extends StyleSheet {
//   #buffer: (
//     | {type: 'insertRules'; payload: [id: string, name: string, rules: string | string[]]}
//     | {type: 'clearRules'; payload: [id: string]}
//   )[] = []
//   #flushing = false
//   #onBuffer: any
//   #paused = true

//   constructor(
//     options: ConstructorParameters<typeof StyleSheet>[0] & {onBuffer?: any} = EMPTY_OBJECT,
//     globalStyles: ConstructorParameters<typeof StyleSheet>[1] = {},
//     names?: ConstructorParameters<typeof StyleSheet>[2],
//   ) {
//     super(options, globalStyles, names)

//     if (options.onBuffer) {
//       this.#onBuffer = options.onBuffer
//     }
//   }

//   /**
//    * Overriding this method is necessary, as it has a hardcoded call with the `StyleSheet` constructor
//    */
//   override reconstructWithOptions(
//     options: Parameters<InstanceType<typeof StyleSheet>['reconstructWithOptions']>[0],
//     withNames = true,
//   ) {
//     return new BlazingStyleSheet(
//       {onBuffer: this.#onBuffer, ...this.options, ...options},
//       this.gs,
//       (withNames && this.names) || undefined,
//     )
//   }
//   /**
//    * Overriding `getTag`, original implementation: https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/sheet/Sheet.ts#L76-L79
//    *
//    * There are two main performance bottlenecks in styled-components:
//    * 1. Regular styled components (the result of \`const StyledComponent = styled.div\`\`\`) updates CSS during render:
//    *    https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/models/StyledComponent.ts#L64-L68
//    * 2. Global styled components (the result of `const GlobalStyle = createGlobalStyle``) updates CSS using \`useLayoutEffect\`:
//    *    https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/constructors/createGlobalStyle.ts#L52-L57
//    *
//    * An attempt to moving to `useInsertionEffect` were made in 2022, but little activity since then:
//    * https://github.com/styled-components/styled-components/pull/3821
//    *
//    * This custom version of `StyleSheet` allows us to intercept either:
//    * a) writes to CSSOM: https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/sheet/Tag.ts#L34
//    * b) writes to the DOM that triggers CSSOM updates: https://github.com/styled-components/styled-components/blob/770d1fa2bc1a4bfe3eea1b14a0357671ba9407a4/packages/styled-components/src/sheet/Tag.ts#L73-L75
//    * Option b) is only used if disableCSSOMInjection is set to true on a parent StyleSheetManager component.
//    *
//    * By wrapping the group tag, and its internal tag models, we can intercept and buffer writes to the CSSOM,
//    * and flush them in a `useInsertionEffect`, allowing React to optimize them and orchestrate better.
//    */
//   override getTag() {
//     if (this.tag) {
//       return this.tag
//     }
//     const groupedTag = super.getTag()
//     const {tag} = groupedTag
//     const proxyTag = new Proxy(tag, {
//       get: (target, prop, receiver) => {
//         if (prop === 'insertRule' || prop === 'deleteRule' || prop === 'getRule') {
//           // console.log('Tag.get()', prop, {target, receiver}, this.#buffer)
//         }
//         return Reflect.get(target, prop, receiver)
//       },
//     })
//     groupedTag.tag = proxyTag
//     // console.log('getTag() is called', {tag, groupedTag}, this, document?.querySelector('style'))
//     return groupedTag
//   }
//   /**
//    * Flush all `insertRules` and `clearRules` from the buffer,
//    * this should happen during a `useInsertionEffect` or similar as updating CSSOM is intensive.
//    */
//   flush() {
//     try {
//       this.#flushing = true
//       while (this.#buffer.length > 0) {
//         const {type, payload} = this.#buffer.shift()!
//         switch (type) {
//           case 'insertRules':
//             this.insertRules(...payload)
//             break
//           case 'clearRules':
//             this.clearRules(...payload)
//             break
//           default:
//             throw new TypeError(`Unknown buffer type: ${type}`, {cause: {type, payload}})
//         }
//       }
//     } catch (err) {
//       console.error('Something crashed during flushing', err)
//     } finally {
//       this.#flushing = false
//     }
//   }
//   shouldFlush() {
//     if (this.#flushing) {
//       throw new TypeError('Cannot flush while flushing')
//     }
//     return this.#buffer.length > 0
//   }
//   /**
//    * Handle React constraint of not being allowed to call setState during render of another component (`styled` components call `insertStyles` during render, so it cannot trigger a state setter)
//    */
//   pauseEvents() {
//     // console.count('pauseEvents')
//     this.#paused = true
//   }
//   resumeEvents() {
//     // console.count('resumeEvents')
//     this.#paused = false
//   }
//   override insertRules(id: string, name: string, rules: string | string[]): void {
//     if (this.#flushing) {
//       // console.count(`Flushing insertRules(${id}, ${name})`)
//       super.insertRules(id, name, rules)
//     } else {
//       // console.count(`Queueing insertRules(${id}, ${name})`)
//       this.#buffer.push({type: 'insertRules', payload: [id, name, rules]})
//       if (!this.#paused) {
//         this.#onBuffer?.()
//       }
//     }
//   }
//   override clearRules(id: string): void {
//     if (this.#flushing) {
//       // console.count(`Flushing clearRules(${id})`)
//       super.clearRules(id)
//     } else {
//       // console.count(`Queueing clearRules(${id})`)
//       this.#buffer.push({type: 'clearRules', payload: [id]})
//       if (!this.#paused) {
//         this.#onBuffer?.()
//       }
//     }
//   }
// }
