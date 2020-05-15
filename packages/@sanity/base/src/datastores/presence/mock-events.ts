import {defer, from} from 'rxjs'
import {StateEvent} from './message-transports/transport'
import {map, shareReplay} from 'rxjs/operators'
import {sample} from 'lodash'

const USERIDS = [
  'pqSMwf6hH',
  'pnLYqNfv5',
  'priDVVmy8',
  'p0NFOU0j8',
  'pTDl2jw8d',
  'pH1ZwC8i9',
  'pZSfuDqFB',
  'pHMeQnTse',
  'ppzqWGWNb',
  'pDQYzJbyS',
  'pZyoPHKUs',
  'pQzJQHSWI',
  'p4Tyi2Be5',
  'pb9vii060',
  'pE8yhOisw',
  'pgqD5dmam',
  'pNIRxUDCs',
  'p7Fd2C6Cj',
  'p3exSgYCx',
  'pbIQRYViC',
  'p8GJaTEhN',
  'p27ewL8aM',
  'p3udQwtNP',
  'pAxG0VlQB',
  'pYg97z75S',
  'pdLr4quHv',
  'pkJXiDgg6',
  'pkl4UAKcA'
]

const PATHS = [
  ['nested', 'first'],
  ['nested', 'second'],
  [
    'nestedArray',
    {_key: '565c867c8dac'},
    'arrayNo1',
    {_key: 'a645548a8f01'},
    'arrayNo1',
    {_key: '1685e372c40f'},
    'fieldNo0'
  ],
  ['nestedArray', {_key: '565c867c8dac'}, 'fieldNo0'],
  ['nestedArray', {_key: '565c867c8dac'}, 'arrayNo19', {_key: 'a02e7a93e2a2'}, 'fieldNo0'],
  ['nestedArray', {_key: '565c867c8dac'}, 'arrayNo19', {_key: 'a02e7a93e2a2'}, 'fieldNo19'],
  ['address', 'country'],
  ['address', 'street'],
  ['customInputWithDefaultPresence', 'row3', 'cell3']
]

export const mock$ = defer(() => from(USERIDS)).pipe(
  map(
    (id, n): StateEvent => ({
      type: 'state',
      userId: id,
      sessionId: id + n,
      timestamp: new Date().toISOString(),
      locations: [
        {
          type: 'document',
          documentId: 'presence-test',
          // documentId: 'foo-bar',
          // path: ['bestFriend']
          path: sample(PATHS)
        }
      ]
    })
  ),
  shareReplay()
)
