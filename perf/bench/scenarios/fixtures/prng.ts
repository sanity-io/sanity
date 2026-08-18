import {mulberry32, type Rng} from '../../stats/rng'

/**
 * Deterministic fixture helpers. Every scenario fixture derives all "random"
 * content from a fixed seed, so each session seeds byte-identical documents
 * (README: flake resistance §3). The old dev/efps synthetic fixture used
 * Math.random and sorted a shared words array in place — both are the kind
 * of nondeterminism these helpers exist to prevent.
 */

export function createFixtureRng(seed: number): Rng {
  return mulberry32(seed)
}

/** Sequential deterministic `_key` generator (hex, 12 chars). */
export function keyGenerator(rng: Rng): () => string {
  return () =>
    Array.from({length: 12}, () =>
      Math.floor(rng() * 16)
        .toString(16)
        .charAt(0),
    ).join('')
}

const WORDS = [
  'whisper',
  'kaleidoscope',
  'tundra',
  'labyrinth',
  'quasar',
  'ember',
  'flux',
  'verdant',
  'obsidian',
  'ripple',
  'zephyr',
  'nebula',
  'lattice',
  'prism',
  'cascade',
  'fable',
  'twilight',
  'echo',
  'thistle',
]

/** 2-5 words drawn (without replacement) from a fixed list, seeded. */
export function wordPicker(rng: Rng): () => string {
  return () => {
    const count = Math.floor(rng() * 4) + 2
    const pool = [...WORDS]
    const picked: string[] = []
    for (let i = 0; i < count; i++) {
      picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
    }
    return picked.join(' ')
  }
}
