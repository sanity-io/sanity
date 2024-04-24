import {useToast} from '@sanity/ui'

import ToastDescription from '../components/toastDescription/ToastDescription'
import {type Schedule} from '../types'
import getErrorMessage from '../utils/getErrorMessage'
import {useScheduleApi} from './useScheduleApi'
import useTimeZone from './useTimeZone'

// Custom events
export enum ScheduleEvents {
  create = 'scheduleCreate',
  delete = 'scheduleDelete',
  deleteMultiple = 'scheduleDeleteMultiple',
  publish = 'schedulePublish',
  update = 'scheduleUpdate',
}

export type ScheduleCreateEvent = {
  date: string
  documentId: string
}

export type ScheduleDeleteEvent = {
  scheduleId: string
}

export type ScheduleDeleteMultipleEvent = {
  scheduleIds: string[]
}

export type SchedulePublishEvent = {
  scheduleId: string
}

export type ScheduleUpdateEvent = {
  date: string
  scheduleId: string
}

// Add our custom events to `WindowEventMap`, providing typing when using `addEventListener`
declare global {
  interface WindowEventMap {
    [ScheduleEvents.create]: CustomEvent<ScheduleCreateEvent>
    [ScheduleEvents.delete]: CustomEvent<ScheduleDeleteEvent>
    [ScheduleEvents.deleteMultiple]: CustomEvent<ScheduleDeleteMultipleEvent>
    [ScheduleEvents.publish]: CustomEvent<SchedulePublishEvent>
    [ScheduleEvents.update]: CustomEvent<ScheduleUpdateEvent>
  }
}

type UnpackCustomEventPayload<T> = T extends CustomEvent<infer U> ? U : never

function pluralize(word: string, count: number) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
// Proxy that generates type safe CustomEvents.
// We infer our CustomEvent's `detail` using `UnpackCustomEventPayload`
export const scheduleCustomEvent = <
  T extends ScheduleEvents,
  D extends UnpackCustomEventPayload<WindowEventMap[T]>,
>(
  name: T,
  // override `detail` in `CustomEventInit` with our own custom payload
  payload: Omit<CustomEventInit<D>, 'detail'> & {
    detail: D
  },
): CustomEvent<D> => new CustomEvent(name, payload)

export default function useScheduleOperation() {
  const toast = useToast()
  const {formatDateTz} = useTimeZone()
  const api = useScheduleApi()

  async function createSchedule({
    date,
    displayToast = true,
    documentId,
  }: {
    date: string
    displayToast?: boolean
    documentId: string
  }) {
    try {
      const data = await api.create({date, documentId})

      window.dispatchEvent(
        scheduleCustomEvent(ScheduleEvents.create, {
          detail: {
            date,
            documentId,
          },
        }),
      )

      if (displayToast && data?.executeAt) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription
              body={formatDateTz({
                date: new Date(data.executeAt),
                includeTimeZone: true,
                prefix: 'Publishing on ',
              })}
              title="Schedule created"
            />
          ),
          duration: 15000, // 15s
          status: 'success',
        })
      }
    } catch (err) {
      if (displayToast) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription body={getErrorMessage(err)} title="Unable to create schedule" />
          ),
          duration: 15000, // 15s
          status: 'error',
        })
      }
    }
  }

  async function deleteSchedule({
    displayToast = true,
    schedule,
  }: {
    displayToast?: boolean
    schedule: Schedule
  }) {
    try {
      await api.delete({scheduleId: schedule?.id})

      window.dispatchEvent(
        scheduleCustomEvent(ScheduleEvents.delete, {
          detail: {
            scheduleId: schedule?.id,
          },
        }),
      )

      if (displayToast) {
        toast.push({
          closable: true,
          description: <ToastDescription title="Schedule deleted" />,
          status: 'success',
        })
      }
    } catch (err) {
      if (displayToast) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription body={getErrorMessage(err)} title="Unable to delete schedule" />
          ),
          duration: 15000, // 15s
          status: 'error',
        })
      }
    }
  }

  async function deleteSchedules({
    displayToast = true,
    schedules,
  }: {
    displayToast?: boolean
    schedules: Schedule[]
  }) {
    try {
      const scheduleIds = schedules.map((schedule) => schedule.id)
      const response = await api.deleteMultiple({scheduleIds})

      const {fulfilledIds, rejectedReasons} = response.reduce<{
        fulfilledIds: string[]
        rejectedReasons: string[]
      }>(
        (acc, v, index) => {
          if (v.status === 'fulfilled') {
            acc.fulfilledIds.push(schedules[index].id)
          }

          if (v.status === 'rejected') {
            acc.rejectedReasons.push(`[${schedules[index].id}]: ${v.reason}`)
          }

          return acc
        },
        {fulfilledIds: [], rejectedReasons: []},
      )
      const numFulfilledIds = fulfilledIds.length
      const numRejectedReasons = rejectedReasons.length

      if (fulfilledIds?.length > 0) {
        window.dispatchEvent(
          scheduleCustomEvent(ScheduleEvents.deleteMultiple, {
            detail: {scheduleIds: fulfilledIds},
          }),
        )
      }

      if (displayToast) {
        if (fulfilledIds?.length > 0) {
          toast.push({
            closable: true,
            description: (
              <ToastDescription title={`${pluralize('schedule', numFulfilledIds)} deleted`} />
            ),
            status: 'success',
          })
        }
        if (rejectedReasons?.length > 0) {
          toast.push({
            closable: true,
            description: (
              <ToastDescription
                body={rejectedReasons?.toString()}
                title={`Unable to delete ${pluralize('schedule', numRejectedReasons)}`}
              />
            ),
            duration: 15000, // 15s
            status: 'error',
          })
        }
      }
    } catch (err) {
      if (displayToast) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription body={getErrorMessage(err)} title="Unable to delete schedules" />
          ),
          duration: 15000, // 15s
          status: 'error',
        })
      }
    }
  }

  async function publishSchedule({
    displayToast = true,
    schedule,
  }: {
    displayToast?: boolean
    schedule: Schedule
  }) {
    try {
      const scheduleId = schedule.id
      await api.publish({scheduleId})

      window.dispatchEvent(scheduleCustomEvent(ScheduleEvents.publish, {detail: {scheduleId}}))

      if (displayToast) {
        toast.push({
          closable: true,
          description: <ToastDescription title="Document published" />,
          status: 'success',
        })
      }
    } catch (err) {
      if (displayToast) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription body={getErrorMessage(err)} title="Unable to publish schedule" />
          ),
          duration: 15000, // 15s
          status: 'error',
        })
      }
    }
  }

  async function updateSchedule({
    date,
    displayToast = true,
    scheduleId,
  }: {
    date: string
    displayToast?: boolean
    scheduleId: string
  }) {
    try {
      await api.update({documentSchedule: {executeAt: date}, scheduleId})

      window.dispatchEvent(scheduleCustomEvent(ScheduleEvents.update, {detail: {date, scheduleId}}))

      if (displayToast) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription
              body={formatDateTz({
                date: new Date(date),
                includeTimeZone: true,
                prefix: 'Publishing on ',
              })}
              title="Schedule updated"
            />
          ),
          duration: 15000, // 15s
          status: 'success',
        })
      }
    } catch (err) {
      if (displayToast) {
        toast.push({
          closable: true,
          description: (
            <ToastDescription body={getErrorMessage(err)} title="Unable to update schedule" />
          ),
          duration: 15000, // 15s
          status: 'error',
        })
      }
    }
  }

  return {
    createSchedule,
    deleteSchedule,
    deleteSchedules,
    publishSchedule,
    updateSchedule,
  }
}
