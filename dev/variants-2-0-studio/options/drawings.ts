import {type DiagramShape, type DiagramSpec} from '../design-options/types'

// Card drawings for options that have no frame in options/diagrams.json and no entry in the registry's DIAGRAMS:
// keyed by component id, then option id. The same 200 x 100 grid and shape vocabulary as DIAGRAMS (see the wire
// frame in design-options/diagram.tsx: navbar to y 12, list column to x 52 with rows at y 20, 34, 48, 62, 76,
// document pane from x 52, fields at y 44, 58, 72). Options labelled "None" or "Not drawn" in the registry that
// have no part to show are drawn as a crossed-out square where the part would be.

const box = (x: number, y: number, w: number, h: number, solid?: boolean): DiagramShape => ({
  kind: 'box',
  x,
  y,
  w,
  h,
  solid,
})
const pill = (x: number, y: number, w: number, h = 6): DiagramShape => ({kind: 'pill', x, y, w, h})
const dot = (x: number, y: number, r = 2.5, solid?: boolean): DiagramShape => ({
  kind: 'dot',
  x,
  y,
  w: r,
  solid,
})
const diamond = (x: number, y: number, r = 3): DiagramShape => ({kind: 'diamond', x, y, w: r})
const line = (x: number, y: number, w: number, h: number): DiagramShape => ({
  kind: 'line',
  x,
  y,
  w,
  h,
})
/** A crossed-out square: nothing here. */
const none = (x: number, y: number, s = 10): DiagramShape[] => [
  line(x, y, s, s),
  line(x + s, y, -s, s),
]

const ROWS = [20, 34, 48, 62, 76]
// Three stacked fields of the document form, and the document header row (y 13 to 24).
const HEADER_Y = 14.5

export const DRAWINGS: Record<string, Record<string, DiagramSpec>> = {
  // C1 Perspective bar: the navbar's top right.
  c1: {
    d: {
      shapes: [box(124, 2, 70, 8), diamond(130, 6), pill(137, 3.5, 24, 5), pill(165, 3.5, 24, 5)],
    },
    e: {
      shapes: [
        box(124, 2, 70, 8),
        diamond(130, 6),
        pill(137, 3.5, 11, 5),
        pill(150, 3.5, 6, 5),
        pill(165, 3.5, 24, 5),
      ],
    },
  },
  // C2 Document pills, option C: a collapsed state pill and a Versions pill; the inventory opens at the right.
  c2: {
    c: {
      frame: 'inspector',
      shapes: [pill(60, HEADER_Y, 22, 7), pill(86, HEADER_Y, 34, 7), box(145, 13, 54, 86)],
    },
  },
  c3: {
    // Two sections ("Has variant", "No variant") with no mark on the rows.
    e: {
      shapes: [
        box(3, 14, 47, 4),
        box(3, 54, 47, 4),
        box(54, 28, 46, 28),
        pill(58, 32, 38, 5),
        pill(58, 40, 38, 5),
        pill(58, 48, 26, 5),
      ],
    },
    // A contained tile at the right end of a row, only where the document has more than a base version.
    f: {
      shapes: [
        box(37, 20, 14, 8),
        dot(41, 24, 1.8),
        diamond(45, 24, 2),
        box(48, 22, 2.5, 4),
        box(37, 48, 14, 8),
        dot(41, 52, 1.8),
        diamond(45, 52, 2),
        box(48, 50, 2.5, 4),
        dot(44, 38, 2),
        dot(44, 66, 2),
        dot(44, 80, 2),
      ],
    },
  },
  // C4 Inventory pane, in the inspector.
  c4: {
    d: {
      frame: 'inspector',
      shapes: [
        box(147, 16, 30, 3),
        box(149, 21, 46, 6),
        box(149, 29, 46, 6),
        box(147, 41, 30, 3),
        box(149, 46, 46, 6),
        box(147, 59, 30, 3),
        box(149, 64, 46, 6),
        box(149, 72, 46, 6),
      ],
    },
    e: {
      frame: 'inspector',
      shapes: [
        pill(147, 15, 22, 7),
        pill(172, 15, 24, 7),
        box(146, 26, 52, 32),
        box(149, 29, 46, 7),
        box(149, 38, 46, 7),
        box(149, 47, 46, 7),
        box(149, 62, 46, 6),
        box(149, 70, 46, 6),
      ],
    },
  },
  // C7 Banners: a full-width banner at the top of the document form, with a button where it can act.
  c7: {
    d: {
      shapes: [box(53, 25, 143, 10), dot(59, 30, 2), pill(160, 27, 31, 6)],
    },
  },

  // ---- E9: the address in the pane header.
  paneAddress: {
    a: {shapes: [pill(58, HEADER_Y, 14, 6), pill(75, HEADER_Y, 14, 6), pill(92, HEADER_Y, 24, 6)]},
    b: {shapes: [pill(58, HEADER_Y - 0.5, 40, 7)]},
    c: {
      shapes: [
        pill(58, HEADER_Y - 0.5, 40, 7),
        box(53, 25, 143, 8),
        pill(57, 27, 14, 4),
        pill(158, 27, 34, 4),
      ],
    },
  },

  compare: {
    a: {shapes: none(115, 46, 18)},
    b: {shapes: [box(56, 28, 66, 62), box(126, 28, 66, 62)]},
    c: {
      shapes: [
        box(56, 26, 136, 9),
        box(56, 38, 66, 52),
        box(126, 38, 66, 52),
        box(60, 42, 58, 5),
        box(130, 42, 58, 5),
      ],
    },
    d: {
      shapes: [
        box(54, 13.5, 142, 4.5),
        box(54, 19, 142, 4.5),
        box(56, 28, 66, 62),
        box(126, 28, 66, 62),
      ],
    },
    e: {
      shapes: [
        box(54, 13.5, 142, 8),
        box(56, 26, 66, 6),
        box(126, 26, 66, 6),
        box(56, 34, 66, 56),
        box(126, 34, 66, 56),
      ],
    },
    f: {
      shapes: [
        box(54, 13.5, 142, 8),
        pill(150, 15, 40, 5),
        box(56, 28, 66, 62),
        box(126, 28, 66, 62),
      ],
    },
  },

  // The Review changes panel in the inspector.
  reviewPanel: {
    a: {
      frame: 'inspector',
      shapes: [box(148, 18, 48, 10), box(148, 31, 48, 10), box(148, 44, 48, 10)],
    },
    b: {
      frame: 'inspector',
      shapes: [
        pill(148, 15, 48, 6),
        pill(148, 23, 48, 6),
        box(148, 34, 48, 7),
        box(148, 43, 48, 7),
        box(148, 52, 48, 7),
        pill(172, 63, 24, 7),
      ],
    },
    c: {
      frame: 'inspector',
      shapes: [
        pill(148, 15, 48, 6),
        pill(148, 23, 48, 6),
        box(148, 34, 48, 7),
        box(148, 43, 48, 7),
        box(60, 58, 80, 9),
        line(148, 46, -8, 16),
      ],
    },
  },

  // The mark on a list row.
  listMark: {
    a: {shapes: ROWS.map((y) => box(40, y + 1, 7, 6))},
    b: {shapes: [diamond(44, 24), diamond(44, 38), diamond(44, 66)]},
    c: {
      shapes: [
        box(3, 20, 47, 8),
        box(3, 48, 47, 8),
        box(3.5, 20, 1.5, 8, true),
        box(3.5, 48, 1.5, 8, true),
      ],
    },
  },

  listFlyout: {
    a: {shapes: none(54, 36, 12)},
    b: {
      shapes: [
        box(44, 35, 5, 6),
        box(54, 30, 46, 32),
        pill(58, 34, 38, 5),
        pill(58, 42, 38, 5),
        pill(58, 50, 38, 5),
      ],
    },
    c: {
      shapes: [
        box(44, 35, 5, 6),
        box(54, 30, 36, 32),
        pill(58, 34, 28, 5),
        pill(58, 42, 28, 5),
        pill(58, 50, 28, 5),
        line(90, 46, 36, 0),
        box(128, 28, 66, 62),
      ],
    },
  },

  reviewPass: {
    a: {shapes: none(15, 85, 11)},
    b: {
      shapes: [pill(158, HEADER_Y, 30, 6), ...[22, 36, 50, 64].map((y) => pill(36, y + 2, 14, 4))],
    },
    c: {
      shapes: [
        pill(158, HEADER_Y, 30, 6),
        ...[22, 36, 50, 64].map((y) => pill(36, y + 2, 14, 4)),
        box(2, 84, 48, 13),
        pill(6, 88, 24, 5),
      ],
    },
  },

  fieldMarks: {
    a: {shapes: [dot(57, 48.5), dot(57, 76.5)]},
    b: {
      shapes: [
        box(56, 44, 2.5, 9),
        box(56, 58, 2.5, 9),
        dot(57, 76.5),
        pill(158, 31.5, 32, 6),
        line(62, 76.5, 70, 0),
      ],
    },
    c: {
      shapes: [
        box(56, 44, 2.5, 9),
        box(56, 58, 2.5, 9),
        dot(57, 76.5),
        pill(158, 31.5, 32, 6),
        line(62, 76.5, 70, 0),
        box(104, 49, 56, 20),
        pill(108, 53, 22, 4),
        pill(108, 60, 40, 4),
      ],
    },
  },

  reviewSet: {
    a: {shapes: none(20, 85, 11)},
    b: {shapes: [box(3, 88, 46, 7)]},
    c: {shapes: [box(3, 84, 46, 5), box(3, 91, 46, 5)]},
  },

  paneControl: {
    a: {shapes: none(160, 14, 10)},
    b: {
      shapes: [
        pill(150, HEADER_Y - 0.5, 40, 7),
        box(138, 25, 56, 36),
        pill(142, 29, 48, 5),
        pill(142, 37, 48, 5),
        pill(142, 45, 48, 5),
      ],
    },
  },

  rowWidth: {
    a: {shapes: [box(1, 13.5, 198, 8)]},
    b: {shapes: [box(20, 13.5, 160, 8)]},
    c: {shapes: [box(50, 13.5, 100, 8)]},
  },

  localMatch: {
    // L5b: the row goes; the header pill is all that is left.
    a: {shapes: [pill(58, HEADER_Y - 0.5, 40, 7), ...none(170, 26, 8)]},
    // L5a: the row stays, saying the pane matches.
    b: {
      shapes: [
        pill(58, HEADER_Y - 0.5, 40, 7),
        box(53, 25, 143, 8),
        pill(57, 27, 14, 4),
        pill(150, 27, 42, 4),
      ],
    },
  },

  navLayout: {
    a: {shapes: [...[76, 92, 108, 124].map((x) => pill(x, 3, 12)), box(1, 13.5, 198, 8)]},
    b: {
      shapes: [
        ...[32, 48, 64, 80].map((x) => pill(x, 3, 12)),
        box(130, 3, 34, 6),
        pill(170, 3, 24, 6),
        box(1, 13.5, 198, 8),
      ],
    },
    c: {
      shapes: [
        ...[32, 48, 64, 80].map((x) => pill(x, 3, 12)),
        box(104, 2, 46, 8),
        pill(170, 3, 24, 6),
      ],
    },
  },

  // The localization plugin scenario.
  localization: {
    a: {shapes: none(165, 14, 8)},
    b: {
      shapes: [
        pill(60, 14, 16, 6),
        pill(150, HEADER_Y - 0.5, 36, 7),
        box(146, 25, 46, 28),
        pill(150, 29, 38, 5),
        pill(150, 37, 38, 5),
        pill(150, 45, 38, 5),
      ],
    },
    c: {
      shapes: [
        pill(150, 3, 16, 6),
        pill(160, HEADER_Y, 28, 6),
        box(130, 44, 8, 5),
        box(130, 58, 8, 5),
        box(130, 72, 8, 5),
      ],
    },
    d: {
      shapes: [
        pill(150, 3, 16, 6),
        pill(60, 14, 16, 6),
        pill(108, HEADER_Y - 0.5, 30, 7),
        pill(150, HEADER_Y, 38, 6),
        box(160, 26, 32, 14),
        box(130, 44, 8, 5),
        box(130, 58, 8, 5),
        box(130, 72, 8, 5),
      ],
    },
  },

  // The version mark on a selected (solid blue) row.
  markSelected: {
    a: {shapes: [box(3, 33, 47, 10), box(36, 34, 12, 8), dot(46, 35, 1.6)]},
    b: {shapes: [box(3, 33, 47, 10), box(36, 34, 12, 8), dot(46, 35, 3.6), dot(46, 35, 1.4, true)]},
    c: {shapes: [box(3, 33, 47, 10), box(38, 35, 7, 6), dot(45, 35, 3), dot(45, 35, 1.4, true)]},
    d: {
      shapes: [
        box(3, 33, 47, 10),
        box(36, 34, 12, 8, true),
        dot(46, 35, 3.2),
        dot(46, 35, 1.4, true),
      ],
    },
  },

  inspectorSwitcher: {
    a: {
      frame: 'inspector',
      shapes: [...[146, 156, 166, 176, 186].map((x) => pill(x, 15, 8, 5)), box(146, 24, 50, 3)],
    },
    b: {
      frame: 'inspector',
      shapes: [
        pill(60, HEADER_Y - 0.5, 34, 7),
        ...[104, 113, 122, 131].map((x) => box(x, 15, 6, 6)),
        box(147, 15, 48, 6),
      ],
    },
  },

  // C10 Create pattern: the "+" type list under the navbar. A: picking a type opens a blank document. B: a small address form opens
  // beside the list (Type, Variant, Add to, Start from) with Create document at its foot.
  c10: {
    a: {
      shapes: [
        box(4, 13, 40, 26),
        ...[18, 25, 32].map((y) => box(8, y, 30, 4)),
        box(56, 16, 138, 80),
      ],
    },
    b: {
      shapes: [
        box(4, 13, 40, 26),
        ...[18, 25, 32].map((y) => box(8, y, 30, 4)),
        box(47, 13, 76, 50),
        ...[19, 27, 35, 43].map((y) => pill(78, y, 32, 5)),
        diamond(53, 29.5, 2.5),
        dot(53, 37.5, 2),
        box(98, 53, 20, 5, true),
      ],
    },
  },
}
