//! Port of the `@sanity/ui` 4.4 theme (`buildTheme()`): the color system plus the scales
//! (space, radius, fonts, shadows) that components are styled from.
//!
//! Color schemes are rendered lazily per scheme and card tone, like the JS theme's lazy
//! properties, and cached for the lifetime of the theme.

mod build;
pub mod color;
pub mod tokens;

use std::cell::OnceCell;
use std::rc::Rc;

pub use build::{AvatarColor, BadgeColor, CardColor, InputStateColor, ShadowColor, StateColor};

macro_rules! keyed_enum {
    ($(#[$meta:meta])* $name:ident { $($variant:ident => $key:literal),+ $(,)? } $all:ident) => {
        $(#[$meta])*
        #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
        pub enum $name { $($variant),+ }

        pub const $all: &[$name] = &[$($name::$variant),+];

        impl $name {
            pub fn name(self) -> &'static str {
                match self { $($name::$variant => $key),+ }
            }

            pub fn parse(value: &str) -> Option<Self> {
                match value { $($key => Some($name::$variant),)+ _ => None }
            }

            pub fn index(self) -> usize {
                self as usize
            }
        }
    };
}

keyed_enum!(Scheme { Light => "light", Dark => "dark" } SCHEMES);
keyed_enum!(Blend { Multiply => "multiply", Screen => "screen" } BLENDS);
keyed_enum!(
    CardTone {
        Transparent => "transparent",
        Default => "default",
        Neutral => "neutral",
        Primary => "primary",
        Suggest => "suggest",
        Positive => "positive",
        Caution => "caution",
        Critical => "critical",
    } CARD_TONES
);
keyed_enum!(
    StateTone {
        Default => "default",
        Neutral => "neutral",
        Primary => "primary",
        Suggest => "suggest",
        Positive => "positive",
        Caution => "caution",
        Critical => "critical",
    } STATE_TONES
);
keyed_enum!(
    State {
        Enabled => "enabled",
        Hovered => "hovered",
        Pressed => "pressed",
        Selected => "selected",
        Disabled => "disabled",
    } STATES
);
keyed_enum!(ButtonMode { Default => "default", Ghost => "ghost", Bleed => "bleed" } BUTTON_MODES);
keyed_enum!(InputMode { Default => "default", Invalid => "invalid" } INPUT_MODES);
keyed_enum!(
    InputState {
        Enabled => "enabled",
        Hovered => "hovered",
        ReadOnly => "readOnly",
        Disabled => "disabled",
    } INPUT_STATES
);

impl StateTone {
    /// The card tone with the same name, which badges and buttons take their hue from.
    pub fn card_tone(self) -> CardTone {
        CardTone::parse(self.name()).unwrap_or(CardTone::Default)
    }
}

impl CardTone {
    /// The state tone a card tone maps to for buttons and badges (`transparent` → `default`).
    pub fn state_tone(self) -> StateTone {
        StateTone::parse(self.name()).unwrap_or(StateTone::Default)
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct FontSize {
    pub ascender_height: f64,
    pub descender_height: f64,
    pub font_size: f64,
    pub icon_size: f64,
    pub line_height: f64,
    pub letter_spacing: f64,
}

const fn size(
    ascender_height: f64,
    descender_height: f64,
    font_size: f64,
    icon_size: f64,
    line_height: f64,
    letter_spacing: f64,
) -> FontSize {
    FontSize { ascender_height, descender_height, font_size, icon_size, line_height, letter_spacing }
}

#[derive(Clone, Copy, Debug)]
pub struct FontWeights {
    pub regular: u16,
    pub medium: u16,
    pub semibold: u16,
    pub bold: u16,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum FontWeight {
    Regular,
    Medium,
    Semibold,
    Bold,
}

impl FontWeights {
    pub fn get(&self, weight: FontWeight) -> u16 {
        match weight {
            FontWeight::Regular => self.regular,
            FontWeight::Medium => self.medium,
            FontWeight::Semibold => self.semibold,
            FontWeight::Bold => self.bold,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct Font {
    pub family: &'static str,
    pub weights: FontWeights,
    pub sizes: &'static [FontSize],
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum FontKey {
    Code,
    Heading,
    Label,
    Text,
}

const INTER: &str = "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", \"Liberation Sans\", Helvetica, Arial, system-ui, sans-serif";

pub const FONT_CODE: Font = Font {
    family: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
    weights: FontWeights { regular: 400, medium: 500, semibold: 600, bold: 700 },
    sizes: &[
        size(4.0, 4.0, 10.0, 17.0, 15.0, 0.0),
        size(5.0, 5.0, 13.0, 21.0, 19.0, 0.0),
        size(6.0, 6.0, 16.0, 25.0, 23.0, 0.0),
        size(7.0, 7.0, 19.0, 29.0, 27.0, 0.0),
        size(8.0, 8.0, 22.0, 33.0, 31.0, 0.0),
    ],
};

pub const FONT_HEADING: Font = Font {
    family: INTER,
    weights: FontWeights { regular: 700, medium: 800, semibold: 900, bold: 900 },
    sizes: &[
        size(5.0, 5.0, 13.0, 17.0, 19.0, 0.0),
        size(6.0, 6.0, 16.0, 25.0, 23.0, 0.0),
        size(7.0, 7.0, 21.0, 33.0, 29.0, 0.0),
        size(8.0, 8.0, 27.0, 41.0, 35.0, 0.0),
        size(9.5, 8.5, 33.0, 49.0, 41.0, 0.0),
        size(10.5, 9.5, 38.0, 53.0, 47.0, 0.0),
    ],
};

pub const FONT_LABEL: Font = Font {
    family: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", \"Liberation Sans\", system-ui, sans-serif",
    weights: FontWeights { regular: 600, medium: 700, semibold: 800, bold: 900 },
    sizes: &[
        size(2.0, 2.0, 8.1, 13.0, 10.0, 0.5),
        size(2.0, 2.0, 9.5, 15.0, 11.0, 0.5),
        size(2.0, 2.0, 10.8, 17.0, 12.0, 0.5),
        size(2.0, 2.0, 12.25, 19.0, 13.0, 0.5),
        size(2.0, 2.0, 13.6, 21.0, 14.0, 0.5),
        size(2.0, 2.0, 15.0, 23.0, 15.0, 0.5),
    ],
};

pub const FONT_TEXT: Font = Font {
    family: INTER,
    weights: FontWeights { regular: 400, medium: 500, semibold: 600, bold: 700 },
    sizes: &[
        size(4.0, 4.0, 10.0, 17.0, 15.0, 0.0),
        size(5.0, 5.0, 13.0, 21.0, 19.0, 0.0),
        size(6.0, 6.0, 15.0, 25.0, 23.0, 0.0),
        size(7.0, 7.0, 18.0, 29.0, 27.0, 0.0),
        size(8.0, 8.0, 21.0, 33.0, 31.0, 0.0),
    ],
};

pub fn font(key: FontKey) -> &'static Font {
    match key {
        FontKey::Code => &FONT_CODE,
        FontKey::Heading => &FONT_HEADING,
        FontKey::Label => &FONT_LABEL,
        FontKey::Text => &FONT_TEXT,
    }
}

pub const SPACE: [u32; 10] = [0, 4, 8, 12, 20, 32, 52, 84, 136, 220];
pub const RADIUS: [u32; 7] = [0, 1, 3, 6, 9, 12, 21];
pub const CONTAINER: [u32; 6] = [320, 640, 960, 1280, 1600, 1920];
pub const MEDIA: [u32; 6] = [360, 600, 900, 1200, 1800, 2400];
pub const AVATAR_SIZES: [u32; 4] = [19, 25, 33, 49];
pub const LAYER_DIALOG: i32 = 600;
pub const LAYER_POPOVER: i32 = 400;
pub const LAYER_TOOLTIP: i32 = 200;

/// `[umbra, penumbra, ambient]` offsets per elevation (`x y blur spread`).
pub const SHADOWS: [Option<[[i32; 4]; 3]>; 6] = [
    None,
    Some([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
    Some([[0, 3, 5, -2], [0, 6, 10, 0], [0, 1, 18, 1]]),
    Some([[0, 7, 8, -4], [0, 12, 17, 2], [0, 5, 22, 4]]),
    Some([[0, 9, 11, -5], [0, 18, 28, 2], [0, 7, 34, 6]]),
    Some([[0, 11, 15, -7], [0, 24, 38, 3], [0, 9, 46, 8]]),
];

/// `rem()` from `@sanity/ui`'s style helpers.
pub fn rem(px: f64) -> String {
    if px == 0.0 { "0".into() } else { format!("{}rem", color::js_number(px / 16.0)) }
}

/// A built theme: resolved tokens plus lazily rendered card colors per scheme and tone.
pub struct Theme {
    tokens: serde_json::Value,
    cards: [[OnceCell<Rc<CardColor>>; 8]; 2],
}

impl Default for Theme {
    fn default() -> Self {
        Self::new(None)
    }
}

impl Theme {
    /// `buildTheme({color})`, with optional sparse color token overrides.
    pub fn new(color_tokens: Option<&serde_json::Value>) -> Self {
        Self { tokens: tokens::resolve_color_tokens(color_tokens), cards: Default::default() }
    }

    pub fn card(&self, scheme: Scheme, tone: CardTone) -> Rc<CardColor> {
        self.cards[scheme.index()][tone.index()]
            .get_or_init(|| {
                let parent_bg = match tone {
                    CardTone::Default | CardTone::Transparent => None,
                    _ => Some(self.card(scheme, CardTone::Default).base.bg.clone()),
                };
                Rc::new(build::card_color(&self.tokens, scheme, tone, parent_bg.as_deref()))
            })
            .clone()
    }
}
