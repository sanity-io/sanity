import {usePresentationTool} from '../usePresentationTool'

export function useCurrentPresentationToolName(): string | undefined {
  return usePresentationTool(false)?.name ?? undefined
}
