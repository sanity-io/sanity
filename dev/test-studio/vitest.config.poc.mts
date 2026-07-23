import path from "node:path"
import {fileURLToPath} from "node:url"
import {defineConfig} from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    conditions: ["monorepo", "source"],
    alias: {
      "@sanity/types": path.resolve(dirname, "../../packages/@sanity/types/src/index.ts"),
    },
  },
  ssr: {
    resolve: {
      conditions: ["monorepo", "source"],
    },
  },
  test: {
    include: ["schema/standard/standaloneTable/**/*.test.ts"],
    environment: "node",
  },
})
