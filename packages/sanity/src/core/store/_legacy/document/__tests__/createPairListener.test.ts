/* eslint-disable max-nested-callbacks */
import {describe, expect, it, jest} from '@jest/globals'
import {type SanityClient} from '@sanity/client'
import {EMPTY, finalize, from, lastValueFrom, NEVER, Observable, of, timer} from 'rxjs'
import {concatMap, delay, map, takeUntil, toArray} from 'rxjs/operators'

import {createPairListener} from '../createPairListener'

describe('createPairListener', () => {
  it('shares the listener connection between all subscribers, and disconnects once the last subscriber unsubscribes', async () => {
    const unsubscribe = jest.fn()
    const listen = jest.fn(() => {
      return new Observable((subscriber) => {
        subscriber.next({type: 'welcome'})
        return unsubscribe
      }).pipe(
        // todo: figure out why a delay is needed here
        delay(1),
      )
    })

    const getDocuments = jest.fn((ids: string[]) => of(ids.map((id) => ({_id: id}))))

    const mockedClient = {
      observable: {
        listen,
        getDocuments,
      },
    } as unknown as SanityClient

    const listener = createPairListener(
      mockedClient,
      {publishedId: 'foo', draftId: 'drafts.bar'},
      {
        relay: {
          exchangeWaitMin: 50,
          exchangeWaitMax: 50,
          exchangeOverLapTime: 10,
          exchangeTimeout: 10,
        },
      },
    )

    const sub1 = listener.subscribe()
    expect(listen).toHaveBeenCalledTimes(1)
    const sub2 = listener.subscribe()
    expect(listen).toHaveBeenCalledTimes(1)
    const sub3 = listener.subscribe()
    expect(listen).toHaveBeenCalledTimes(1)

    expect(unsubscribe).toHaveBeenCalledTimes(0)
    sub1.unsubscribe()
    expect(unsubscribe).toHaveBeenCalledTimes(0)
    sub2.unsubscribe()
    expect(unsubscribe).toHaveBeenCalledTimes(0)
    sub3.unsubscribe()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('properly sets up and discards overlapping listeners', async () => {
    const unsubscribe = jest.fn()
    const listen = jest.fn(() => {
      return new Observable((subscriber) => {
        subscriber.next({type: 'welcome'})
        return unsubscribe
      }).pipe(
        // todo: figure out why a delay is needed here
        delay(1),
      )
    })

    const getDocuments = jest.fn((ids: string[]) => of(ids.map((id) => ({_id: id}))))

    const mockedClient = {
      observable: {
        listen,
        getDocuments,
      },
    } as unknown as SanityClient

    const listener = createPairListener(
      mockedClient,
      {publishedId: 'foo', draftId: 'drafts.bar'},
      {
        relay: {
          exchangeWaitMin: 50,
          exchangeWaitMax: 50,
          exchangeOverLapTime: 10,
          exchangeTimeout: 20,
        },
      },
    )
    const events = await lastValueFrom(
      listener.pipe(
        takeUntil(
          // We'll subscribe for a little more than 20ms, which means the first leg should be done and the second leg should be started
          timer(80).pipe(
            finalize(() => {
              // at this moment unsubscribe should have been called on the first listener leg
              expect(unsubscribe).toHaveBeenCalledTimes(1)
            }),
          ),
        ),
        toArray(),
      ),
    )

    expect(listen).toHaveBeenCalledTimes(2)
    expect(unsubscribe).toHaveBeenCalledTimes(2)
    expect(getDocuments).toHaveBeenCalledTimes(1)

    expect(events).toEqual([
      {
        type: 'snapshot',
        document: {_id: 'drafts.bar'},
        documentId: 'drafts.bar',
      },
      {
        type: 'snapshot',
        document: {_id: 'foo'},
        documentId: 'foo',
      },
    ])
  })

  it('dedupes any listener events sent in the overlapping period', async () => {
    const unsubscribe = jest.fn()

    let listenerNo = 0
    const listen = jest.fn(() => {
      listenerNo++
      return from([
        {type: 'welcome'},
        {type: 'mutation', eventId: `event-${listenerNo}`, documentId: 'foo'},
        {type: 'mutation', eventId: 'dupe', documentId: 'foo'},
      ]).pipe(concatMap((ev) => timer(1).pipe(map(() => ev))))
    })

    const mockedClient = {
      observable: {
        listen,
        getDocuments: (ids: string[]) => of(ids.map((id) => ({_id: id}))),
      },
    } as unknown as SanityClient

    const listener = createPairListener(
      mockedClient,
      {publishedId: 'foo', draftId: 'drafts.foo'},
      {
        relay: {
          exchangeWaitMin: 30,
          exchangeWaitMax: 30,
          exchangeOverLapTime: 2,
          exchangeTimeout: 10,
        },
      },
    )
    const events = await lastValueFrom(listener.pipe(takeUntil(timer(55)), toArray()))

    expect(listen).toHaveBeenCalledTimes(2)
    expect(unsubscribe).toHaveBeenCalledTimes(0)

    expect(events).toEqual([
      {
        document: {_id: 'drafts.foo'},
        documentId: 'drafts.foo',
        type: 'snapshot',
      },
      {
        document: {_id: 'foo'},
        documentId: 'foo',
        type: 'snapshot',
      },
      {eventId: 'event-1', type: 'mutation', documentId: 'foo'},
      {eventId: 'dupe', type: 'mutation', documentId: 'foo'},
      {eventId: 'event-2', type: 'mutation', documentId: 'foo'},
    ])
  })

  it('avoids subscribing to the next listener before the first listener has received a welcome event, even if exchange interval has passed', async () => {
    const listen = jest.fn(() => NEVER)
    const getDocuments = jest.fn(() => EMPTY)

    const mockedClient = {
      observable: {
        listen,
        getDocuments,
      },
    } as unknown as SanityClient

    const listener = createPairListener(
      mockedClient,
      {publishedId: 'foo', draftId: 'drafts.bar'},
      {
        relay: {
          exchangeWaitMin: 10,
          exchangeWaitMax: 10,
          exchangeOverLapTime: 2,
          exchangeTimeout: 10,
        },
      },
    )

    const events = await lastValueFrom(listener.pipe(takeUntil(timer(30)), toArray()))
    expect(listen).toHaveBeenCalledTimes(1)
    expect(getDocuments).toHaveBeenCalledTimes(0)
    expect(events).toEqual([])
  })

  it('keeps the current listener if it takes too long to set up the next', async () => {
    const unsubscribeFirst = jest.fn()
    const unsubscribeSecond = jest.fn()
    let listenerNo = 0
    const listen = jest.fn(() => {
      return new Observable((subscriber) => {
        if (listenerNo === 0) {
          listenerNo++
          // simulates second one never receiving a welcome event
          subscriber.next({type: 'welcome'})
          return unsubscribeFirst
        }
        return unsubscribeSecond
      }).pipe(
        // todo: figure out why a delay is needed here
        delay(1),
      )
    })

    const getDocuments = jest.fn((ids: string[]) => of(ids.map((id) => ({_id: id}))))

    const mockedClient = {
      observable: {
        listen,
        getDocuments,
      },
    } as unknown as SanityClient

    const listener = createPairListener(
      mockedClient,
      {publishedId: 'foo', draftId: 'drafts.bar'},
      {
        relay: {
          exchangeWaitMin: 50,
          exchangeWaitMax: 50,
          exchangeOverLapTime: 10,
          exchangeTimeout: 10,
        },
      },
    )
    const sub = listener.subscribe()
    await lastValueFrom(timer(100))

    expect(listen).toHaveBeenCalledTimes(2)
    expect(unsubscribeFirst).toHaveBeenCalledTimes(0)
    expect(unsubscribeSecond).toHaveBeenCalledTimes(1)
    sub.unsubscribe()
  })
})
