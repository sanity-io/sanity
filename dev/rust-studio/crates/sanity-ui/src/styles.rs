//! CSS for the primitives, ported from the `@sanity/ui` style functions (`_cardColorStyle`,
//! `buttonColorStyles`, `responsiveFont`, `textInputRepresentationColorStyle`, …).

use std::fmt::Write;

use sanity_color::HUES;

use crate::css::{self, with_theme};
use crate::theme::{
    ButtonMode, CardColor, CardTone, FONT_CODE, FONT_HEADING, FONT_LABEL, FONT_TEXT, Font, FontWeight, InputMode,
    InputState, SHADOWS, STATE_TONES, Scheme, State, StateColor, StateTone, rem,
};

fn card_vars(base: &CardColor, color: &StateColor) -> String {
    let mut out = String::with_capacity(4096);
    let mut var = |name: &str, value: &str| {
        if !value.is_empty() {
            let _ = write!(out, "--card-{name}: {value};");
        }
    };
    var("backdrop-color", &base.backdrop);
    var("focus-ring-color", &base.focus_ring);
    var("shadow-outline-color", &base.shadow.outline);
    var("shadow-umbra-color", &base.shadow.umbra);
    var("shadow-penumbra-color", &base.shadow.penumbra);
    var("shadow-ambient-color", &base.shadow.ambient);
    var("accent-fg-color", &color.accent_fg);
    for (hue, avatar) in HUES.iter().zip(&color.avatar) {
        var(&format!("avatar-{}-bg-color", hue.name()), &avatar.bg);
        var(&format!("avatar-{}-fg-color", hue.name()), &avatar.fg);
    }
    var("bg-color", &color.bg);
    var("border-color", &color.border);
    for (tone, badge) in STATE_TONES.iter().zip(&color.badge) {
        var(&format!("badge-{}-bg-color", tone.name()), &badge.bg);
        var(&format!("badge-{}-dot-color", tone.name()), &badge.dot);
        var(&format!("badge-{}-fg-color", tone.name()), &badge.fg);
        var(&format!("badge-{}-icon-color", tone.name()), &badge.icon);
    }
    var("code-bg-color", &color.code_bg);
    var("code-fg-color", &color.code_fg);
    var("fg-color", &color.fg);
    var("icon-color", &color.icon);
    var("kbd-bg-color", &color.kbd_bg);
    var("kbd-border-color", &color.kbd_border);
    var("kbd-fg-color", &color.kbd_fg);
    var("link-fg-color", &color.link_fg);
    var("muted-bg-color", &color.muted_bg);
    var("muted-fg-color", &color.muted_fg);
    var("skeleton-color-from", &color.skeleton_from);
    var("skeleton-color-to", &color.skeleton_to);
    var("bg2-color", &color.muted_bg);
    var("link-color", &color.link_fg);
    var("hairline-soft-color", &color.border);
    var("hairline-hard-color", &color.border);
    out
}

fn border_shadow(width: u32, color: &str) -> String {
    format!("inset 0 0 0 {width}px {color}")
}

/// `focusRingStyle` for a ring with offset -1 and width 1, the value every primitive but the
/// switch and avatar uses.
fn inset_focus_ring(border: Option<(u32, &str)>) -> String {
    let mut parts = vec!["inset 0 0 0 1px var(--card-focus-ring-color)".to_owned()];
    if let Some((width, color)) = border {
        parts.push(border_shadow(width, color));
    }
    parts.join(",")
}

pub fn global_styles() {
    css::global("base", || {
        vec![
            "*, *::before, *::after { box-sizing: border-box; }".into(),
            "@keyframes sanity-ui-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }".into(),
            "@keyframes sanity-ui-skeleton { from { background-color: var(--card-skeleton-color-from); } to { background-color: var(--card-skeleton-color-to); } }".into(),
            "[data-ui='Box'], [data-ui='Flex'], [data-ui='Stack'], [data-ui='Card'] { box-sizing: border-box; }".into(),
            "[hidden] { display: none !important; }".into(),
        ]
    });
}

/// `Card`'s color for a scheme and tone, with the selectable states of `as="button"`/`as="a"`.
pub fn card_class(scheme: Scheme, tone: CardTone) -> String {
    css::class(format!("ui-c-{}-{}", scheme.name(), tone.name()), || {
        with_theme(|theme| {
            let color = theme.card(scheme, tone);
            let selectable = |state| card_vars(&color, color.selectable(StateTone::Default, state));
            vec![
                format!(
                    "& {{ color-scheme: {}; {} color: var(--card-fg-color); }}",
                    if color.dark { "dark" } else { "light" },
                    card_vars(&color, &color.base)
                ),
                "&[data-as='button'] { --card-focus-ring-box-shadow: none; cursor: default; box-shadow: var(--card-focus-ring-box-shadow); }".into(),
                "&[data-as='a'] { cursor: pointer; box-shadow: var(--card-focus-ring-box-shadow); }".into(),
                format!("&[data-as='button']:disabled, &[data-as='a'][data-disabled] {{ {} }}", selectable(State::Disabled)),
                format!(
                    "&[data-as='button']:not(:disabled)[data-pressed], &[data-as='a']:not([data-disabled])[data-pressed] {{ {} }}",
                    selectable(State::Pressed)
                ),
                format!(
                    "&[data-as='button']:not(:disabled)[data-selected], &[data-as='a']:not([data-disabled])[data-selected] {{ {} }}",
                    selectable(State::Selected)
                ),
                format!(
                    "@media (hover: hover) {{ &[data-as='button']:not(:disabled):not([data-pressed]):not([data-selected]):hover, &[data-as='button']:not(:disabled):not([data-pressed]):not([data-selected])[data-hovered], &[data-as='a']:not([data-disabled]):not([data-pressed]):not([data-selected]):hover, &[data-as='a']:not([data-disabled]):not([data-pressed]):not([data-selected])[data-hovered] {{ {} }} }}",
                    selectable(State::Hovered)
                ),
                format!(
                    "@media (hover: hover) {{ &[data-as='button']:not(:disabled):not([data-pressed]):not([data-selected]):active, &[data-as='a']:not([data-disabled]):not([data-pressed]):not([data-selected]):active {{ {} }} }}",
                    selectable(State::Pressed)
                ),
                format!(
                    "&[data-as='button']:not(:disabled):focus-visible, &[data-as='a']:not([data-disabled]):focus-visible {{ --card-focus-ring-box-shadow: {}; }}",
                    inset_focus_ring(Some((1, "var(--card-border-color)")))
                ),
            ]
        })
    })
}

/// Layout and static rules every `Card` shares.
pub fn card_base_class() -> String {
    css::class("ui-card".into(), || {
        vec![
            "& { display: block; background-color: var(--card-bg-color); }".into(),
            "&[data-muted] { background-color: var(--card-muted-bg-color); }".into(),
            "&[data-as='button'] { -webkit-font-smoothing: inherit; appearance: none; outline: none; font: inherit; text-align: inherit; border: 0; width: -moz-available; width: -webkit-fill-available; width: stretch; }".into(),
            "&[data-as='a'] { outline: none; text-decoration: none; }".into(),
        ]
    })
}

/// `selectableBaseStyle` + `selectableColorStyle`, which `MenuItem` uses: a button in the
/// parent card's color with a tone for its text and states.
pub fn selectable_class(scheme: Scheme, card_tone: CardTone, tone: StateTone) -> String {
    let key = format!("ui-s-{}-{}-{}", scheme.name(), card_tone.name(), tone.name());
    css::class(key, || {
        with_theme(|theme| {
            let color = theme.card(scheme, card_tone);
            let state = |state| card_vars(&color, color.selectable(tone, state));
            vec![
                format!(
                    "& {{ -webkit-font-smoothing: inherit; appearance: none; outline: none; font: inherit; text-align: inherit; border: 0; margin: 0; width: -moz-available; width: -webkit-fill-available; width: stretch; display: block; cursor: default; background-color: var(--card-bg-color); color: var(--card-fg-color); {} }}",
                    state(State::Enabled)
                ),
                format!("&:disabled, &[data-disabled] {{ {} }}", state(State::Disabled)),
                format!(
                    "@media (hover: hover) {{ &:not(:disabled):not([data-selected]):hover, &:not(:disabled):not([data-selected])[data-hovered] {{ {} }} &:not(:disabled):not([data-selected]):active {{ {} }} }}",
                    state(State::Hovered),
                    state(State::Pressed)
                ),
                format!("&:not(:disabled)[data-selected] {{ {} }}", state(State::Selected)),
                format!("&:not(:disabled):focus-visible {{ box-shadow: {}; }}", inset_focus_ring(None)),
            ]
        })
    })
}

pub fn shadow(elevation: usize) -> String {
    let Some(Some([umbra, penumbra, ambient])) = SHADOWS.get(elevation) else { return String::new() };
    let to = |offsets: &[i32; 4], color: &str| {
        format!("{} {color}", offsets.iter().map(|px| rem(*px as f64)).collect::<Vec<_>>().join(" "))
    };
    format!(
        "0 0 0 {} var(--card-shadow-outline-color), {}, {}, {}",
        rem(0.5),
        to(umbra, "var(--card-shadow-umbra-color)"),
        to(penumbra, "var(--card-shadow-penumbra-color)"),
        to(ambient, "var(--card-shadow-ambient-color)")
    )
}

pub fn button_base_class() -> String {
    css::class("ui-button".into(), || {
        vec![
            "& { -webkit-font-smoothing: inherit; appearance: none; display: inline-flex; align-items: center; font: inherit; border: 0; outline: none; user-select: none; text-decoration: none; box-sizing: border-box; padding: 0; white-space: nowrap; text-align: left; position: relative; vertical-align: top; margin: 0; background-color: var(--card-bg-color); color: var(--card-fg-color); box-shadow: inset 0 0 0 1px var(--card-border-color); transition: background-color 100ms,border-color 100ms,color 100ms; cursor: default; }".into(),
            "&::-moz-focus-inner { border: 0; padding: 0; }".into(),
            "& > span { display: block; flex: 1; min-width: 0; border-radius: inherit; }".into(),
            "&[data-width='fill'] { width: -moz-available; width: -webkit-fill-available; width: stretch; }".into(),
            "&:not([data-disabled='true']):focus:not(:focus-visible) { box-shadow: inset 0 0 0 1px var(--card-border-color); }".into(),
        ]
    })
}

pub fn button_class(scheme: Scheme, card_tone: CardTone, mode: ButtonMode, tone: StateTone) -> String {
    let key = format!("ui-b-{}-{}-{}-{}", scheme.name(), card_tone.name(), mode.name(), tone.name());
    css::class(key, || {
        with_theme(|theme| {
            let base = theme.card(scheme, card_tone);
            let state = |state| card_vars(&base, base.button(mode, tone, state));
            vec![
                format!("& {{ {} }}", state(State::Enabled)),
                format!(
                    "@media (hover: hover) {{ &:not([data-disabled='true']):hover, &:not([data-disabled='true'])[data-hovered] {{ {} }} &:not([data-disabled='true']):active {{ {} }} }}",
                    state(State::Hovered),
                    state(State::Pressed)
                ),
                format!("&:not([data-disabled='true'])[data-selected] {{ {} }}", state(State::Pressed)),
                format!("&:disabled, &[data-disabled='true'] {{ {} }}", state(State::Disabled)),
                format!(
                    "&:not([data-disabled='true']):focus {{ box-shadow: {}; }}",
                    inset_focus_ring(Some((2, &base.base.bg)))
                ),
                "&:not([data-disabled='true']):focus:not(:focus-visible) { box-shadow: inset 0 0 0 1px var(--card-border-color); }".into(),
            ]
        })
    })
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum FontKind {
    Text,
    Label,
    Heading,
    Code,
}

impl FontKind {
    fn font(self) -> &'static Font {
        match self {
            FontKind::Text => &FONT_TEXT,
            FontKind::Label => &FONT_LABEL,
            FontKind::Heading => &FONT_HEADING,
            FontKind::Code => &FONT_CODE,
        }
    }

    fn name(self) -> &'static str {
        match self {
            FontKind::Text => "t",
            FontKind::Label => "l",
            FontKind::Heading => "h",
            FontKind::Code => "c",
        }
    }
}

fn weight_name(weight: FontWeight) -> &'static str {
    match weight {
        FontWeight::Regular => "r",
        FontWeight::Medium => "m",
        FontWeight::Semibold => "s",
        FontWeight::Bold => "b",
    }
}

/// `responsiveFont` for one size: the capsize trim that makes a text box exactly its cap height.
pub fn font_class(kind: FontKind, size: usize, weight: FontWeight) -> String {
    let key = format!("ui-f{}-{size}-{}", kind.name(), weight_name(weight));
    css::class(key, || {
        let font = kind.font();
        let s = font.sizes.get(size).copied().unwrap_or(font.sizes[2]);
        let neg_height = s.ascender_height + s.descender_height;
        let cap_height = s.line_height - neg_height;
        let icon_offset = (cap_height - s.icon_size) / 2.0;
        let custom_icon_size = ((s.font_size * 1.125) / 2.0).floor() * 2.0 + 1.0;
        let custom_icon_offset = (cap_height - custom_icon_size) / 2.0;
        let mut rules = vec![
            format!(
                "& {{ position: relative; font-family: {}; font-weight: {}; padding: 1px 0; margin: 0; font-size: {}; line-height: calc({} / {}); letter-spacing: {}; transform: translateY({}); }}",
                font.family,
                font.weights.get(weight),
                rem(s.font_size),
                s.line_height,
                s.font_size,
                rem(s.letter_spacing),
                rem(s.descender_height)
            ),
            format!(
                "&::before {{ content: ''; display: block; height: 0; margin-top: calc({} - 1px); }}",
                rem(-neg_height)
            ),
            "&::after { content: ''; display: block; height: 0; margin-bottom: -1px; }".into(),
            "& > code, & > span { display: block; }".into(),
            "&:not([hidden]) { display: block; }".into(),
            format!(
                "& svg:not([data-sanity-icon]) {{ font-size: calc({custom_icon_size} / 16 * 1rem); margin: {}; }}",
                rem(custom_icon_offset)
            ),
            format!(
                "& [data-sanity-icon] {{ font-size: calc({} / 16 * 1rem); margin: {}; }}",
                s.icon_size,
                rem(icon_offset)
            ),
        ];
        match kind {
            FontKind::Text => rules.extend([
                "& { color: var(--card-fg-color); }".to_owned(),
                format!("& code {{ font-family: {}; border-radius: 1px; background-color: var(--card-code-bg-color); color: var(--card-code-fg-color); }}", FONT_CODE.family),
                "& a { text-decoration: none; border-radius: 1px; color: var(--card-link-color); outline: none; }".into(),
                "@media (hover: hover) { & a:hover { text-decoration: underline; } }".into(),
                format!("& strong {{ font-weight: {}; }}", font.weights.bold),
                "& svg { display: inline; max-width: unset; }".into(),
                "& [data-sanity-icon] { vertical-align: baseline; color: var(--card-icon-color); }".into(),
                "& [data-sanity-icon] path { vector-effect: non-scaling-stroke !important; }".into(),
            ]),
            FontKind::Label => rules.extend([
                "& { text-transform: uppercase; color: var(--card-fg-color); }".to_owned(),
                "& [data-sanity-icon] { color: var(--card-icon-color); }".into(),
            ]),
            FontKind::Heading => rules.extend([
                "& { color: var(--card-fg-color); }".to_owned(),
                "& [data-sanity-icon] { vertical-align: baseline; color: var(--card-icon-color); }".into(),
            ]),
            FontKind::Code => rules.extend([
                "& { color: var(--card-code-fg-color); }".to_owned(),
                "& code { font-family: inherit; }".into(),
            ]),
        }
        rules.extend([
            "&[data-muted] { color: var(--card-muted-fg-color); }".to_owned(),
            "&[data-accent] { color: var(--card-accent-fg-color); }".into(),
            "&[data-ellipsis] > span { overflow: hidden; overflow: clip; text-overflow: ellipsis; white-space: nowrap; }".into(),
            "&[data-align='center'] { text-align: center; }".into(),
            "&[data-align='right'] { text-align: right; }".into(),
        ]);
        rules
    })
}

/// The input and its representation sibling for `TextInput`, `TextArea` and `Select`.
pub fn input_classes(scheme: Scheme, tone: CardTone) -> (String, String) {
    let suffix = format!("{}-{}", scheme.name(), tone.name());
    let input = css::class(format!("ui-in-{suffix}"), || {
        with_theme(|theme| {
            let color = theme.card(scheme, tone);
            let i = |mode, state| color.input(mode, state);
            let vars = |c: &crate::theme::InputStateColor| {
                format!("--input-fg-color: {}; --input-placeholder-color: {};", c.fg, c.placeholder)
            };
            vec![
                format!(
                    "& {{ appearance: none; background: none; border: 0; border-radius: 0; outline: none; width: 100%; box-sizing: border-box; margin: 0; position: relative; z-index: 1; display: block; color: var(--input-fg-color); font-family: {}; {} }}",
                    FONT_TEXT.family,
                    vars(i(InputMode::Default, InputState::Enabled))
                ),
                "&::placeholder { color: var(--input-placeholder-color); }".into(),
                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active { -webkit-text-fill-color: var(--input-fg-color) !important; transition: background-color 5000s; transition-delay: 86400s; }".into(),
                "&[data-as='textarea'] { resize: none; }".into(),
                format!("&:not(:invalid):disabled {{ {} }}", vars(i(InputMode::Default, InputState::Disabled))),
                format!("&:invalid {{ {} }}", vars(i(InputMode::Invalid, InputState::Enabled))),
                format!("&:read-only {{ {} }}", vars(i(InputMode::Default, InputState::ReadOnly))),
            ]
        })
    });
    let representation = css::class(format!("ui-rp-{suffix}"), || {
        with_theme(|theme| {
            let color = theme.card(scheme, tone);
            let i = |mode, state| color.input(mode, state);
            let enabled = i(InputMode::Default, InputState::Enabled);
            let invalid = i(InputMode::Invalid, InputState::Enabled);
            let disabled = i(InputMode::Default, InputState::Disabled);
            let invalid_disabled = i(InputMode::Invalid, InputState::Disabled);
            let read_only = i(InputMode::Default, InputState::ReadOnly);
            let invalid_read_only = i(InputMode::Invalid, InputState::ReadOnly);
            let hovered = i(InputMode::Default, InputState::Hovered);
            let invalid_hovered = i(InputMode::Invalid, InputState::Hovered);
            vec![
                format!(
                    "& {{ --input-box-shadow: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: block; pointer-events: none; z-index: 0; background-color: var(--card-bg-color); box-shadow: var(--input-box-shadow); border-radius: inherit; --card-bg-color: {}; --card-fg-color: {}; }}",
                    enabled.bg, enabled.fg
                ),
                format!(
                    "*:not(:disabled) + &[data-border] {{ --input-box-shadow: {}; }}",
                    border_shadow(1, &enabled.border)
                ),
                format!(
                    "*:not(:disabled):invalid + & {{ --card-bg-color: {}; --card-fg-color: {}; }}",
                    invalid.bg, invalid.fg
                ),
                format!(
                    "*:not(:disabled):invalid + &[data-border] {{ --input-box-shadow: {}; }}",
                    border_shadow(1, &invalid.border)
                ),
                format!(
                    "*:not(:disabled):focus + &[data-border] {{ --input-box-shadow: {}; }}",
                    inset_focus_ring(Some((1, &enabled.border)))
                ),
                format!(
                    "*:not(:disabled):focus + &:not([data-border]) {{ --input-box-shadow: {}; }}",
                    inset_focus_ring(None)
                ),
                format!(
                    "*:not(:invalid):disabled + & {{ --card-bg-color: {} !important; --card-fg-color: {} !important; --card-icon-color: {} !important; }}",
                    disabled.bg, disabled.fg, disabled.fg
                ),
                format!(
                    "*:not(:invalid):disabled + &[data-border] {{ --input-box-shadow: {}; }}",
                    border_shadow(1, &disabled.border)
                ),
                format!(
                    "*:invalid:disabled + & {{ --card-bg-color: {} !important; --card-fg-color: {} !important; --card-icon-color: {} !important; }}",
                    invalid_disabled.bg, invalid_disabled.fg, invalid_disabled.fg
                ),
                format!(
                    "*:invalid:disabled + &[data-border] {{ --input-box-shadow: {}; }}",
                    border_shadow(1, &invalid_disabled.border)
                ),
                format!(
                    "*:not(:invalid):read-only + & {{ --card-bg-color: {} !important; --card-fg-color: {} !important; }}",
                    read_only.bg, read_only.fg
                ),
                format!(
                    "*:invalid:read-only + & {{ --card-bg-color: {} !important; --card-fg-color: {} !important; }}",
                    invalid_read_only.bg, invalid_read_only.fg
                ),
                format!(
                    "@media (hover: hover) {{ *:not(:disabled):not(:read-only):not(:invalid):hover + & {{ --card-bg-color: {}; --card-fg-color: {}; }} *:invalid:not(:disabled):not(:read-only):hover + & {{ --card-bg-color: {}; --card-fg-color: {}; }} *:not(:disabled):not(:read-only):not(:invalid):not(:focus):hover + &[data-border] {{ --input-box-shadow: {}; }} *:invalid:not(:disabled):not(:read-only):not(:focus):hover + &[data-border] {{ --input-box-shadow: {}; }} }}",
                    hovered.bg,
                    hovered.fg,
                    invalid_hovered.bg,
                    invalid_hovered.fg,
                    border_shadow(1, &hovered.border),
                    border_shadow(1, &invalid_hovered.border)
                ),
            ]
        })
    });
    (input, representation)
}

/// `responsiveInputPaddingStyle` and `textInputFontSizeStyle` for one padding and font size.
pub fn input_size_style(padding: usize, font_size: usize, icon_left: bool, icon_right: bool) -> String {
    let size = FONT_TEXT.sizes.get(font_size).copied().unwrap_or(FONT_TEXT.sizes[2]);
    let p = crate::theme::SPACE[padding] as f64;
    let em = size.line_height - size.ascender_height - size.descender_height;
    let s = crate::theme::SPACE[2] as f64;
    format!(
        "font-size: {}; line-height: {}; padding: {} {} {} {};",
        rem(size.font_size),
        crate::theme::color::js_number(size.line_height / size.font_size),
        rem(p - size.ascender_height),
        rem(if icon_right { p + em + s } else { p }),
        rem(p - size.descender_height),
        rem(if icon_left { p + em + s } else { p })
    )
}

pub fn switch_class(scheme: Scheme, tone: CardTone) -> String {
    css::class(format!("ui-sw-{}-{}", scheme.name(), tone.name()), || {
        with_theme(|theme| {
            let color = theme.card(scheme, tone);
            let i = |state| color.input(InputMode::Default, state);
            let (enabled, hovered, disabled, read_only) =
                (i(InputState::Enabled), i(InputState::Hovered), i(InputState::Disabled), i(InputState::ReadOnly));
            vec![
                "& { position: relative; display: inline-block; vertical-align: top; width: 1.5625rem; height: 1.0625rem; }".into(),
                "& > input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 1; padding: 0; margin: 0; }".into(),
                format!(
                    "& > span {{ --switch-bg-color: {}; --switch-fg-color: {}; display: block; position: relative; width: 1.5625rem; height: 1.0625rem; border-radius: 0.53125rem; }}",
                    enabled.border, enabled.bg
                ),
                "& > span > span:first-child { position: absolute; top: 0; left: 0; width: 1.5625rem; height: 1.0625rem; border-radius: 0.53125rem; background-color: var(--switch-bg-color); box-shadow: var(--switch-box-shadow); }".into(),
                "& > span > span:last-child { position: absolute; display: block; left: 0.3125rem; top: 0.3125rem; height: 0.4375rem; width: 0.4375rem; border-radius: 0.21875rem; transition-property: transform; transition-duration: 150ms; transition-timing-function: ease-out; background: var(--switch-fg-color); transform: translate3d(0, 0, 0); }".into(),
                "& > input:checked + span > span:last-child { transform: translate3d(8px, 0, 0); }".into(),
                "& > input:indeterminate + span > span:last-child { transform: translate3d(4px, 0, 0); }".into(),
                "& > input:focus + span { --switch-box-shadow: 0 0 0 1px var(--card-bg-color), 0 0 0 2px var(--card-focus-ring-color); }".into(),
                "& > input:focus:not(:focus-visible) + span { --switch-box-shadow: none; }".into(),
                format!("& > input:checked + span {{ --switch-bg-color: {}; --switch-fg-color: {}; }}", enabled.fg, enabled.bg),
                format!(
                    "@media (hover: hover) {{ & > input:not(:disabled):hover + span {{ --switch-bg-color: {}; --switch-fg-color: {}; }} & > input:not(:disabled):checked:hover + span {{ --switch-bg-color: {}; --switch-fg-color: {}; }} }}",
                    hovered.border, hovered.bg, enabled.fg, enabled.bg
                ),
                format!("& > input:not([data-read-only]):disabled + span {{ --switch-bg-color: {}; --switch-fg-color: {}; }}", disabled.border, disabled.bg),
                format!("& > input[data-read-only]:disabled + span {{ --switch-bg-color: {}; --switch-fg-color: {}; }}", read_only.border, read_only.bg),
                format!("& > input:checked[data-read-only]:disabled + span {{ --switch-bg-color: {}; --switch-fg-color: {}; }}", read_only.fg, read_only.bg),
            ]
        })
    })
}

pub fn checkbox_class(scheme: Scheme, tone: CardTone) -> String {
    css::class(format!("ui-cb-{}-{}", scheme.name(), tone.name()), || {
        with_theme(|theme| {
            let color = theme.card(scheme, tone);
            let i = |state| color.input(InputMode::Default, state);
            let (enabled, hovered, disabled, read_only) =
                (i(InputState::Enabled), i(InputState::Hovered), i(InputState::Disabled), i(InputState::ReadOnly));
            vec![
                "& { position: relative; display: inline-block; width: 1.0625rem; height: 1.0625rem; }".into(),
                "& > input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 1; padding: 0; margin: 0; }".into(),
                format!(
                    "& > span {{ position: relative; display: block; height: 1.0625rem; width: 1.0625rem; box-sizing: border-box; box-shadow: {}; border-radius: 0.1875rem; line-height: 1; background-color: {}; color: {}; }}",
                    border_shadow(1, &enabled.border),
                    enabled.bg,
                    enabled.fg
                ),
                "& > span > svg { display: block; position: absolute; opacity: 0; height: 100%; width: 100%; }".into(),
                "& > span > svg path { vector-effect: non-scaling-stroke; stroke-width: 1.5px !important; }".into(),
                format!("& > input:checked + span {{ background: {}; box-shadow: {}; color: {}; }}", enabled.fg, border_shadow(1, &enabled.fg), enabled.bg),
                "& > input:checked + span > svg:first-child { opacity: 1; }".into(),
                format!("@media (hover: hover) {{ & > input:not(:disabled):not(:checked):hover + span {{ box-shadow: {}; background-color: {}; }} }}", border_shadow(1, &hovered.border), hovered.bg),
                format!("& > input:focus + span {{ box-shadow: {}; }}", inset_focus_ring(Some((1, &enabled.border)))),
                "& > input:focus:not(:focus-visible) + span { box-shadow: inset 0 0 0 1px var(--card-border-color); }".into(),
                format!("& > input:disabled + span {{ background-color: {}; box-shadow: {}; color: {}; }}", disabled.bg, border_shadow(1, &disabled.border), disabled.fg),
                format!("& > input[data-read-only] + span {{ background-color: {}; box-shadow: {}; color: {}; }}", read_only.bg, border_shadow(1, &read_only.border), read_only.fg),
            ]
        })
    })
}

pub fn badge_class(tone: StateTone) -> String {
    css::class(format!("ui-badge-{}", tone.name()), || {
        vec![
            format!(
                "& {{ --card-bg-color: var(--card-badge-{t}-bg-color); --card-fg-color: var(--card-badge-{t}-fg-color); background-color: var(--card-bg-color); cursor: default; border-radius: 9999px; }}",
                t = tone.name()
            ),
            "&:not([hidden]) { display: inline-block; vertical-align: top; }".into(),
        ]
    })
}

pub fn kbd_class() -> String {
    css::class("ui-kbd".into(), || {
        vec![
            "& { --card-bg-color: var(--card-kbd-bg-color); --card-border-color: var(--card-kbd-border-color); --card-fg-color: var(--card-kbd-fg-color); box-shadow: inset 0 0 0 1px var(--card-border-color); background-color: var(--card-bg-color); font: inherit; border-radius: 0.1875rem; }".into(),
            "&:not([hidden]) { display: inline-block; vertical-align: top; }".into(),
        ]
    })
}

pub fn skeleton_class() -> String {
    css::class("ui-skeleton".into(), || {
        vec!["& { border-radius: 0.1875rem; animation: sanity-ui-skeleton 1500ms ease-in-out infinite alternate; background-color: var(--card-skeleton-color-from); }".into()]
    })
}
