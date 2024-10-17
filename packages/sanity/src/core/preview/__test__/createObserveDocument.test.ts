import {describe, expect, it, jest} from '@jest/globals'
import {createClient, type WelcomeEvent} from '@sanity/client'
import {firstValueFrom, of, skip, Subject} from 'rxjs'
import {take} from 'rxjs/operators'

import {createObserveDocument, type ListenerMutationEventLike} from '../createObserveDocument'

describe(createObserveDocument.name, () => {
  it('fetches the current version of the document when receiving welcome event', async () => {
    const mockedClient = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2024-08-27',
      useCdn: false,
    })

    jest
      .spyOn(mockedClient.observable, 'fetch')
      .mockImplementation(() => of([{_id: 'foo', fetched: true}]) as any)
    jest.spyOn(mockedClient, 'withConfig').mockImplementation(() => mockedClient)

    const mutationChannel = new Subject<WelcomeEvent | ListenerMutationEventLike>()

    const observeDocument = createObserveDocument({
      mutationChannel,
      client: mockedClient,
    })

    const initial = firstValueFrom(observeDocument('foo').pipe(take(1)))

    mutationChannel.next({type: 'welcome'})

    expect(await initial).toEqual({_id: 'foo', fetched: true})
  })

  it('emits undefined if the document does not exist', async () => {
    const mockedClient = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2024-08-27',
      useCdn: false,
    })

    jest.spyOn(mockedClient.observable, 'fetch').mockImplementation(() => of([]) as any)
    jest.spyOn(mockedClient, 'withConfig').mockImplementation(() => mockedClient)

    const mutationChannel = new Subject<WelcomeEvent | ListenerMutationEventLike>()

    const observeDocument = createObserveDocument({
      mutationChannel,
      client: mockedClient,
    })

    const initial = firstValueFrom(observeDocument('foo').pipe(take(1)))

    mutationChannel.next({type: 'welcome'})

    expect(await initial).toEqual(undefined)
  })

  it('applies a mendoza patch when received over the listener', async () => {
    const mockedClient = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: '2024-08-27',
      useCdn: false,
    })

    jest.spyOn(mockedClient.observable, 'fetch').mockImplementation(
      () =>
        of([
          {
            _createdAt: '2024-08-27T09:01:42Z',
            _id: '1c32390c',
            _rev: 'a8403810-81f7-49e6-8860-e52cb9111431',
            _type: 'foo',
            _updatedAt: '2024-08-27T09:03:38Z',
            name: 'foo',
          },
        ]) as any,
    )
    jest.spyOn(mockedClient, 'withConfig').mockImplementation(() => mockedClient)

    const mutationChannel = new Subject<WelcomeEvent | ListenerMutationEventLike>()

    const observeDocument = createObserveDocument({
      mutationChannel,
      client: mockedClient,
    })

    const final = firstValueFrom(observeDocument('1c32390c').pipe(skip(1), take(1)))

    mutationChannel.next({type: 'welcome'})
    mutationChannel.next({
      type: 'mutation',
      documentId: '1c32390c',
      previousRev: 'a8403810-81f7-49e6-8860-e52cb9111431',
      resultRev: 'b3e7ebce-2bdd-4ab7-9056-b525773bd17a',
      effects: {
        apply: [11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15, 17, 'foos', 'name'],
      },
    })

    expect(await final).toEqual({
      _createdAt: '2024-08-27T09:01:42Z',
      _id: '1c32390c',
      _rev: 'b3e7ebce-2bdd-4ab7-9056-b525773bd17a',
      _type: 'foo',
      _updatedAt: '2024-08-27T09:03:38Z',
      name: 'foos',
    })
  })
})
