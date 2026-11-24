# Pokédex workspace

The `pokemon` workspace (`/pokemon` in the test studio) holds every Pokémon up to the newest
generation, along with the 18 elemental types, their abilities and the generations they were
introduced in. The data comes from [PokéAPI](https://pokeapi.co).

The workspace uses the `pokedex` dataset of the test studio project (`ppsg7ml5`), instead of the
`test` dataset the other workspaces share. Its only tools are Structure, Vision and Themer.

## Schema

| Type                | What it holds                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pokemon`           | One document per species: dex number, genus, types, generation, abilities, base stats, evolutions, Pokédex entry, breeding data, official artwork and icon |
| `pokemonType`       | The 18 elemental types, with their color, icon and damage relations to the other types                                                                     |
| `pokemonAbility`    | Every ability a Pokémon in the dataset can have, including hidden abilities                                                                                |
| `pokemonGeneration` | Generations I to IX, with their region and games                                                                                                           |

Every document ID starts with `pokemon_` (`pokemon_species_pikachu`, `pokemon_type_electric`,
`pokemon_ability_static`, `pokemon_generation_1`), so the seed never touches other documents in
the dataset. IDs use underscores because a dot in a document ID makes it path-scoped (private),
and the seed fails if any `_id` or `_ref` it generates contains one.

Each Pokémon's `icon` is its 96×96 game sprite, cropped to the sprite's visible pixels so that it
fills list previews. The original image is uploaded unchanged; the crop and hotspot live on the
image field.

## Seeding

The seed needs a token with write access to the dataset:

```sh
SANITY_AUTH_TOKEN=<token> pnpm --filter sanity-test-studio seed:pokemon
```

The seed is idempotent. Documents are written with `createOrReplace`, and images already in the
dataset are not uploaded again. It also deletes `pokemon`, `pokemonType`, `pokemonAbility` and
`pokemonGeneration` documents whose IDs do not start with `pokemon_` (including the
`pokemon.`-prefixed ones earlier versions wrote), since those were not written by it and do not
match the schema. References between the stale documents are strong, so it unsets the evolution and
damage-relation references first and deletes the documents in batches, species before the abilities,
types and generations they reference.

PokéAPI responses and images are cached in `pokemon/.cache` (gitignored), so a second run makes no
requests to PokéAPI.

| Option              | Default    | Description                                                                                                        |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `--project-id`      | `ppsg7ml5` | Project to seed                                                                                                    |
| `--dataset`         | `pokedex`  | Dataset to seed                                                                                                    |
| `--limit <n>`       |            | Only seed the first `n` Pokémon (all types and generations are still seeded)                                       |
| `--concurrency <n>` | `8`        | Parallel requests to PokéAPI and the Sanity API                                                                    |
| `--dry-run`         |            | Write the documents to `pokemon/.cache/pokedex.ndjson` instead, ready for `sanity dataset import`; no token needed |
| `--no-prune`        |            | Keep documents of the Pokédex types whose IDs do not start with `pokemon_`                                         |
