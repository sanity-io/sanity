import {createClient} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {
  AiFeaturesContext,
  ALL_AI_FEATURES,
  resolveAiFeatures,
  resolveEffectiveAiFeatures,
} from './aiFeatures'
import {useQueryExplain} from './hooks/useQueryExplain'
import {type QueryRequest} from './store/types'

vi.mock('@sanity/telemetry/react', () => ({useTelemetry: () => ({log: vi.fn()})}))

describe('resolveAiFeatures', () => {
  it('turns every feature on when the option is omitted or true', () => {
    expect(resolveAiFeatures(undefined)).toEqual(ALL_AI_FEATURES)
    expect(resolveAiFeatures(true)).toEqual(ALL_AI_FEATURES)
    expect(Object.values(ALL_AI_FEATURES).every(Boolean)).toBe(true)
  })

  it('turns every feature off with false', () => {
    expect(resolveAiFeatures(false)).toEqual({
      generateQuery: false,
      generateMutations: false,
      explainQuery: false,
    })
  })

  it('turns off only the features an object sets to false', () => {
    expect(resolveAiFeatures({})).toEqual(ALL_AI_FEATURES)
    expect(resolveAiFeatures({generateQuery: false})).toEqual({
      ...ALL_AI_FEATURES,
      generateQuery: false,
    })
    expect(resolveAiFeatures({generateQuery: true, explainQuery: false})).toEqual({
      ...ALL_AI_FEATURES,
      explainQuery: false,
    })
  })
})

describe('resolveEffectiveAiFeatures', () => {
  const allOn = {enabled: true, generateQuery: true, generateMutations: true, explainQuery: true}

  it('leaves on what the config leaves on while the user keeps everything on', () => {
    expect(resolveEffectiveAiFeatures(resolveAiFeatures(undefined), allOn)).toEqual(ALL_AI_FEATURES)
    expect(
      resolveEffectiveAiFeatures(resolveAiFeatures({generateMutations: false}), allOn),
    ).toEqual({...ALL_AI_FEATURES, generateMutations: false})
    expect(resolveEffectiveAiFeatures(resolveAiFeatures(false), allOn)).toEqual(
      resolveAiFeatures(false),
    )
  })

  it('turns everything off when the user switches AI features off', () => {
    expect(resolveEffectiveAiFeatures(resolveAiFeatures(true), {...allOn, enabled: false})).toEqual(
      resolveAiFeatures(false),
    )
  })

  it('turns off the features the user switches off', () => {
    expect(
      resolveEffectiveAiFeatures(resolveAiFeatures(true), {...allOn, explainQuery: false}),
    ).toEqual({...ALL_AI_FEATURES, explainQuery: false})
  })

  it('never turns on a feature the config turns off', () => {
    const configured = resolveAiFeatures({generateQuery: false})
    expect(resolveEffectiveAiFeatures(configured, allOn).generateQuery).toBe(false)
    expect(resolveEffectiveAiFeatures(configured, {...allOn, generateMutations: false})).toEqual({
      generateQuery: false,
      generateMutations: false,
      explainQuery: true,
    })
  })
})

describe('useQueryExplain', () => {
  it('asks Agent Actions for nothing while explainQuery is off, even when explain is called', async () => {
    const client = createClient({
      projectId: 'p',
      dataset: 'test',
      apiVersion: '2025-02-19',
      useCdn: false,
    })
    const request = vi.spyOn(client, 'request')
    const withConfig = vi.spyOn(client, 'withConfig')
    const query: QueryRequest = {
      client,
      query: '*',
      params: {},
      includeSourceMap: false,
      useCdn: false,
      url: 'https://p.api.sanity.io/v2025-02-19/data/query/test?query=*',
    }
    const wrapper = ({children}: {children: ReactNode}) => (
      <AiFeaturesContext value={resolveAiFeatures({explainQuery: false})}>
        {children}
      </AiFeaturesContext>
    )
    const {result} = renderHook(() => useQueryExplain(query), {wrapper})

    await result.current.explain()

    expect(withConfig).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
    expect(result.current.explanation).toEqual({status: 'idle'})
  })
})
