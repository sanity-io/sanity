import {type ActorRefFrom, assign, setup} from 'xstate'

interface Context {
  url: URL | null
  error: Error | null
  visualEditingOverlaysEnabled: boolean
}

type Event =
  | {type: 'toggle visual editing overlays'; enabled: boolean}
  | {type: 'iframe loaded'}
  | {type: 'iframe refresh'}
  | {type: 'iframe reload'}

export const presentationMachine = setup({
  types: {} as {
    context: Context
    events: Event
    tags: 'busy' | 'error'
  },
  actions: {
    //
  },
  actors: {
    //
  },
  guards: {
    //
  },
}).createMachine({
  // eslint-disable-next-line tsdoc/syntax
  /** @xstate-layout N4IgpgJg5mDOIC5QAUBOcwDsAuBDbAlgPaYAEAKkUQDYDEBAZqrgLZinrVG4QDaADAF1EoAA5FYBQiREgAHogAsAJgA0IAJ6IAHAEYAdIoCcJowFY9R-vzPLlAX3vq0GHPmJlKNfVx4FMUPRMrOy+EJACwkgg4pLSmLIKCLoAbIr6Zoop2tqKAMxpJnnF6loIZkbK+uZ5umapKXmK-Cm6js7osFh48RRU1D7c4RC02ERQUNTsAG4EsACuuNSkkFL+UKRE02Co1LgasJGysWsy0UnaZinVyrpGAOx1Rim2efeliPe3hma1Zvy6XT8W4OJwgFxdNy9LwDMKQILMNgcMBMOAACyO0RO8USiAK930LWU-3uiiB9yaKXemkQjW01V+txS-GKqUe7XBnW67hIfW8cJGjER7E4Q0xYgkpwS5zxVMJKWJ-FJ5Mp1LKFn4Pz+DSaLTaYIh3Oh-UGPEg+nQqNgaPWCJCpAF4pikpxMoQKWZ+gp+TSZLy1hSH3deXpNSZLNqVP1HVcPQ8fNhQ3Nor8ATtSMdQmOLo8uPdnu9BUUfoDQY1WrqOuarUcYMwRHC8Gihqh8Zh2biubdAFpAzSEL2OS247yYfodqgiKgO1K8yog7ptATFL9dFljMDrHkh1zW6OTWF1jPXaAkmY1YgKnktfxtC9dPd+Io9DvYzzPAekxBj13T3i7vKirKkqqpBsYVQ1HUFjFs0t6KK+kIjh+-JfvoBAQFMP5nH+CDaMo16KjYyjMvUNh5GWOT6MoLL8A8ygrk0dQIUabafmaEAWiinQ2gEWHSjhjJUYuj73Pcd63noQaNEYFb-Dk2S0cxe7IYm7GcYevFYjm2HyJeeQQb8tFkikVjGNoFGajUt73o+z61vYQA */
  id: 'Presentation Tool',
  context: {
    url: null,
    error: null,
    visualEditingOverlaysEnabled: false,
  },

  on: {
    'iframe reload': {
      actions: assign({url: null}),
      target: '.loading',
    },
  },

  states: {
    error: {
      description:
        'Failed to load, either because of a misconfiguration, a network error, or an unexpected error',
      tags: ['error'],
    },
    loading: {
      on: {
        'iframe loaded': {
          target: 'loaded',
        },
      },
      tags: ['busy'],
    },
    loaded: {
      on: {
        'toggle visual editing overlays': {
          actions: assign({
            visualEditingOverlaysEnabled: ({event}) => event.enabled,
          }),
        },
        'iframe refresh': {
          target: '.refreshing',
        },
        'iframe reload': {
          target: '.reloading',
        },
      },

      states: {
        idle: {},
        refreshing: {
          on: {
            'iframe loaded': {
              target: 'idle',
            },
          },
          tags: ['busy'],
        },
        reloading: {
          on: {
            'iframe loaded': {
              target: 'idle',
            },
          },
          tags: ['busy'],
        },
      },
      initial: 'idle',
    },
  },
  initial: 'loading',
})

export type PresentationMachineRef = ActorRefFrom<typeof presentationMachine>
