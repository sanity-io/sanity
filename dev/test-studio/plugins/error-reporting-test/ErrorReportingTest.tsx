import {Button, Card, Flex, Stack} from '@sanity/ui'
import {lazy, useCallback, useEffect, useRef, useState} from 'react'

function triggerCustomErrorOnEvent() {
  throw new Error('Custom error triggered')
}

function triggerImportError() {
  const filename = '/does-not-exist.js'
  import(filename)
}

function triggerTypeErrorOnEvent(evt: any) {
  evt.someFunctionThatDoesntExist()
}

function triggerTimeoutError() {
  setTimeout(() => {
    throw new Error('Custom error in setTimeout')
  }, 1000)
}

function triggerPromiseError() {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      reject(new Error('Custom error in promise'))
    })
  })
}

export function ErrorReportingTest() {
  const [doRenderError, setRenderError] = useState(false)
  const handleShouldRenderWithError = useCallback(() => setRenderError(true), [])
  const [triggerReactLazyImportError, setTriggerReactLazyImportError] = useState(false)
  const [triggerEffectError, setTriggerEffectError] = useState(false)
  const handleTriggerReactLazyImportError = useCallback(
    () => setTriggerReactLazyImportError(true),
    [],
  )
  const handleTriggerEffectError = useCallback(() => setTriggerEffectError(true), [])
  const [triggerResizeObserverLoop, setTriggerResizeObserverLoop] = useState(false)
  const handleTriggerResizeObserveLoop = useCallback(() => setTriggerResizeObserverLoop(true), [])

  useEffect(() => {
    if (triggerEffectError) {
      throw new Error('Error triggered in effect')
    }
  }, [triggerEffectError])

  return (
    <Card padding={5}>
      <Flex>
        <Stack space={4}>
          <Button
            text="Trigger import error from react callback"
            onClick={triggerImportError}
            tone="primary"
          />

          <Button
            text="Trigger import error from React.lazy"
            onClick={handleTriggerReactLazyImportError}
            tone="primary"
          />

          <Button
            text="Trigger custom error on event handler"
            onClick={triggerCustomErrorOnEvent}
            tone="primary"
          />

          <Button
            text="Trigger error in useEffect"
            onClick={handleTriggerEffectError}
            tone="primary"
          />

          <Button
            text="Trigger type error on event handler"
            onClick={triggerTypeErrorOnEvent}
            tone="primary"
          />

          <Button
            text="Trigger async background error (timeout)"
            onClick={triggerTimeoutError}
            tone="primary"
          />

          <Button
            text="Trigger unhandled rejection error"
            onClick={triggerPromiseError}
            tone="primary"
          />

          <Button
            text="Trigger React render error"
            onClick={handleShouldRenderWithError}
            tone="primary"
          />

          <Button
            text="Trigger Resize observer loop"
            onClick={handleTriggerResizeObserveLoop}
            tone="primary"
          />
        </Stack>
      </Flex>

      {triggerReactLazyImportError && <ReactLazyError />}
      {doRenderError && <WithRenderError />}
      {triggerResizeObserverLoop && <ResizeObserverLoop />}
    </Card>
  )
}

const ReactLazyError = lazy(() => {
  const name = '/does-not-exist.js'
  return import(name)
})

function WithRenderError({text}: any) {
  return <div>{text.toUpperCase()}</div>
}

function ResizeObserverLoop() {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          elementRef.current!.style.width = `${entry.contentRect.width + 1}px`
        }
      }
    })

    if (elementRef.current) {
      resizeObserver.observe(elementRef.current)
    }
  }, [])

  return (
    <div ref={elementRef} style={{backgroundColor: 'red'}}>
      err err
    </div>
  )
}
