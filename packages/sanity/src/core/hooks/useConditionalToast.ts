import {type ToastParams, useToast} from '@sanity/ui'
import {useEffect, useState} from 'react'
/**
 * Workaround to support conditional toast (e.g. a toast that is visible as long as a condition holds true)
 * @hidden
 * @internal
 */
export function useConditionalToast(
  params: ToastParams & {id: string; enabled?: boolean; delay?: number},
) {
  const toast = useToast()

  const [enabledAt, setEnabledAt] = useState<Date | undefined>()
  useEffect(() => {
    setEnabledAt((current) => (params.enabled ? current || new Date() : undefined))
  }, [params.enabled])

  const now = useCurrentTime(1000)
  const enabled =
    enabledAt && params.enabled && now.getTime() - enabledAt.getTime() > (params?.delay ?? 0)

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (enabled) {
      toast.push({...params, duration: Infinity})
      return () => {
        toast.push({
          ...params,
          // Note: @sanity/ui fallbacks to the default duration of 4s in case of falsey values
          duration: 0.01,
        })
      }
    }
  }, [params, toast, enabled])
}

function useCurrentTime(updateIntervalMs: number): Date {
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, updateIntervalMs)
    return () => clearInterval(intervalId)
  }, [updateIntervalMs])
  return currentTime
}
