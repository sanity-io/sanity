// The schema of a design-options registry. A project writes one registry (components with options, groups,
// scenario switches) and a presets list; the window, picker, store and diagram renderer are generic.

export type OptionStatus = 'candidate' | 'final' | 'exploration' | 'not-drawn' | 'archived'

/**
 * A shape on the 200 x 100 diagram grid. `box` is a rounded rectangle, `pill` a fully rounded one, `dot` a circle
 * (centre x, y; radius w). `diamond` is the variant mark (centre x, y; half-diagonal w). `line` runs from (x, y) to
 * (x + w, y + h).
 */
export interface DiagramShape {
  kind: 'box' | 'pill' | 'dot' | 'diamond' | 'line'
  x: number
  y: number
  w?: number
  h?: number
  /** A stronger fill, for a part that is solid rather than a tint. */
  solid?: boolean
}

export interface DiagramSpec {
  /** `inspector` narrows the document pane to make room for a right-hand panel. */
  frame?: 'default' | 'inspector'
  /** Draw a dashed outline instead of highlighted shapes: the option is not drawn yet. */
  dashed?: boolean
  /** The part that changes, highlighted on the wire frame. */
  shapes?: DiagramShape[]
}

/** One drawing primitive of a spec diagram (see options/diagrams.json for the vocabulary). */
export interface DiagramPrim {
  p: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/** An entry of the shared diagram spec: either a list of primitives or the generic 200 x 100 frame form. */
export interface DiagramEntry {
  name: string
  status: {text: string; class: 'win' | 'even' | 'open'}
  caption: string
  size: [number, number]
  prims?: DiagramPrim[]
  generic?: DiagramSpec
}

export interface DiagramFile {
  diagrams: Record<string, DiagramEntry>
}

export interface OptionDef {
  id: string
  label: string
  summary: string
  /** One short line for the card (no caveats). Falls back to the first sentence of `summary`. */
  oneLiner?: string
  status: OptionStatus
  /** Where the design lives: Figma node ids, spec docs. */
  refs?: string
  /** Storybook story id (opens at the Storybook base URL). */
  story?: string
  diagram?: DiagramSpec
  /** Key of the option's card diagram in the shared diagram spec. */
  diagramKey?: string
  /** More keys of the spec that belong to this option, shown as frames under the cards. */
  frames?: string[]
}

export interface ComponentDef {
  id: string
  title: string
  options: OptionDef[]
  /** Option shown when nothing is selected and the global choice has no match. */
  defaultOption: string
  /** The signed-off option, once there is one. */
  final?: string
  /**
   * True for a switch that "Show" does not move: it stays at its own option (the default, normally A) until it is set explicitly,
   * so a preset such as "All B" keeps today's look for it. Used by the E9 switches.
   */
  independent?: boolean
  /** A short label for the rail and the summary, when the id is not a `cN` code (default: the id). */
  tag?: string
  /** True once the studio renders real UI for this component (not only a slot). */
  built?: boolean
  cover?: string
  scope?: string
  pick?: string
  where?: string
  /** Spec keys that belong to the component as a whole (flows). */
  frames?: string[]
}

export interface ScenarioConfig {
  /** Switch one: e.g. open beta | GA. The first is the default. */
  stages: {id: string; label: string}[]
  /** Switch two, shown only while `dimensionsStage` is the stage. `value` null = no limit. */
  dimensions?: {value: number | null; label: string; title?: string}[]
  dimensionsStage?: string
}

/** A preset is a named combination of the whole config, in the same compact form as the `?design=` URL value. */
export interface PresetDef {
  id: string
  name: string
  /** e.g. `show.b,stage.ga,dim.2,c1.a` */
  design: string
}

export interface DesignOptionsConfig {
  title?: string
  /** localStorage prefix; keep it unique per project. */
  storageKey: string
  components: ComponentDef[]
  groups: {
    label: string
    ids: string[]
    /** Short names shown in the rail instead of the component's own tag (the open beta tickets are T1 to T6). */
    tags?: Record<string, string>
    /** Starts folded in the rail; it unfolds when it holds the selected component. */
    collapsed?: boolean
  }[]
  scenario: ScenarioConfig
  /** Shared presets (the ones that ship in the repo). Mine live in localStorage. */
  presets: PresetDef[]
  /** The id of the shared preset a visitor with no link and no saved choice starts from. */
  defaultPreset?: string
  /** A global shape switch (pill radius): the CSS variable every bound piece reads, and its value in each mode. */
  shape?: {variable: string; round: string; box: string}
  links?: {
    figmaFile?: string
    storybookBase?: string
    /** A page that drives this window from another window (a remote). */ remote?: string
    /** The remote for the journeys, next to the options remote. */ journeysRemote?: string
  }
  /** The shared diagram spec (options/diagrams.json). Options with a `diagramKey` draw from it. */
  diagrams?: DiagramFile
}
