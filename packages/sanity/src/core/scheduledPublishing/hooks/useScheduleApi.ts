import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {type Schedule} from '../types'
import {debugWithName} from '../utils/debug'

const debug = debugWithName('useScheduleOperation')

export function useScheduleApi(): ReturnType<typeof createScheduleApi> {
  const client = useClient({apiVersion: '2022-09-01'})
  return useMemo(() => createScheduleApi(client), [client])
}

function createScheduleApi(client: SanityClient) {
  const {dataset, projectId} = client.config()
  function _create({date, documentId}: {date: string; documentId: string}) {
    debug('_create:', documentId)

    // Round date to nearest second (mutate)
    const roundedDate = new Date(date)
    roundedDate.setSeconds(0)
    roundedDate.setMilliseconds(0)

    return client.request<Schedule>({
      body: {
        documents: [{documentId}],
        executeAt: roundedDate,
        name: roundedDate,
      },
      method: 'POST',
      uri: `/schedules/${projectId}/${dataset}`,
    })
  }

  function _delete({scheduleId}: {scheduleId: string}) {
    debug('_delete:', scheduleId)
    return client.request<void>({
      method: 'DELETE',
      uri: `/schedules/${projectId}/${dataset}/${scheduleId}`,
    })
  }

  function _deleteMultiple({scheduleIds}: {scheduleIds: string[]}) {
    debug('_deleteMultiple:', scheduleIds)
    const requests = scheduleIds.map((scheduleId) => _delete({scheduleId}))
    return Promise.allSettled(requests)
  }

  function _publish({scheduleId}: {scheduleId: string}) {
    debug('_publish:', scheduleId)

    return client.request<{transactionId: string}>({
      method: 'POST',
      uri: `/schedules/${projectId}/${dataset}/${scheduleId}/publish`,
    })
  }

  function _update({
    documentSchedule,
    scheduleId,
  }: {
    documentSchedule: Partial<Schedule>
    scheduleId: string
  }) {
    debug('_update:', scheduleId, documentSchedule)
    return client.request<{transactionId: string}>({
      body: documentSchedule,
      method: 'PATCH',
      uri: `/schedules/${projectId}/${dataset}/${scheduleId}`,
    })
  }

  return {
    create: _create,
    delete: _delete,
    deleteMultiple: _deleteMultiple,
    publish: _publish,
    update: _update,
  }
}
