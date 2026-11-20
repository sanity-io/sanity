//! Port of `build/buildColorTheme.ts` and `build/renderColorTheme.ts`. The JS theme first
//! builds a tree of compiled token strings per scheme and then renders it; here both passes run
//! per card in one traversal, in the same order, with the same backgrounds and blend modes.

use sanity_color::{HUES, Hue};
use serde_json::Value;

use super::color::{DEFAULT_PALETTE, Palette, SHADOW_PALETTE, TokenNode, compile_token_value};
use super::color::{parse_token_value, render_color_value};
use super::tokens::get;
use super::{
    BUTTON_MODES, Blend, ButtonMode, CardTone, INPUT_MODES, INPUT_STATES, InputMode, InputState, STATE_TONES, STATES,
    Scheme, State, StateTone,
};

#[derive(Clone, Debug, PartialEq)]
pub struct AvatarColor {
    pub blend: Blend,
    pub bg: String,
    pub fg: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct BadgeColor {
    pub bg: String,
    pub dot: String,
    pub fg: String,
    pub icon: String,
}

/// The colors a card or an interactive state (button, selectable) exposes as `--card-*`
/// custom properties.
#[derive(Clone, Debug, PartialEq)]
pub struct StateColor {
    pub blend: Blend,
    pub accent_fg: String,
    /// Indexed like [`sanity_color::HUES`].
    pub avatar: Vec<AvatarColor>,
    /// Indexed like [`super::STATE_TONES`].
    pub badge: Vec<BadgeColor>,
    pub bg: String,
    pub border: String,
    pub code_bg: String,
    pub code_fg: String,
    pub fg: String,
    pub icon: String,
    pub kbd_bg: String,
    pub kbd_border: String,
    pub kbd_fg: String,
    pub link_fg: String,
    pub muted_bg: String,
    pub muted_fg: String,
    pub skeleton_from: String,
    pub skeleton_to: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct InputStateColor {
    pub blend: Blend,
    pub bg: String,
    pub border: String,
    pub fg: String,
    pub muted_bg: String,
    pub placeholder: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ShadowColor {
    pub outline: String,
    pub umbra: String,
    pub penumbra: String,
    pub ambient: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct CardColor {
    pub dark: bool,
    pub base: StateColor,
    pub backdrop: String,
    pub focus_ring: String,
    pub shadow: ShadowColor,
    /// `[mode][tone][state]`
    pub button: Vec<Vec<Vec<StateColor>>>,
    /// `[mode][state]`
    pub input: Vec<Vec<InputStateColor>>,
    /// `[tone][state]`
    pub selectable: Vec<Vec<StateColor>>,
    pub syntax: Vec<(&'static str, String)>,
}

impl CardColor {
    pub fn button(&self, mode: ButtonMode, tone: StateTone, state: State) -> &StateColor {
        &self.button[mode.index()][tone.index()][state.index()]
    }

    pub fn selectable(&self, tone: StateTone, state: State) -> &StateColor {
        &self.selectable[tone.index()][state.index()]
    }

    pub fn input(&self, mode: InputMode, state: InputState) -> &InputStateColor {
        &self.input[mode.index()][state.index()]
    }
}

pub const SYNTAX_KEYS: [&str; 36] = [
    "atrule",
    "attrName",
    "attrValue",
    "attribute",
    "boolean",
    "builtin",
    "cdata",
    "char",
    "class",
    "className",
    "comment",
    "constant",
    "deleted",
    "doctype",
    "entity",
    "function",
    "hexcode",
    "id",
    "important",
    "inserted",
    "keyword",
    "number",
    "operator",
    "prolog",
    "property",
    "pseudoClass",
    "pseudoElement",
    "punctuation",
    "regex",
    "selector",
    "string",
    "symbol",
    "tag",
    "unit",
    "url",
    "variable",
];

fn hue_of(tokens: Option<&Value>) -> Option<Hue> {
    tokens.and_then(|t| t.get("_hue")).and_then(Value::as_str).and_then(Hue::parse)
}

fn blend_of(tokens: Option<&Value>, fallback: [Blend; 2], scheme: Scheme) -> Blend {
    tokens
        .and_then(|t| t.get("_blend"))
        .and_then(Value::as_array)
        .and_then(|pair| pair.get(scheme.index()))
        .and_then(Value::as_str)
        .and_then(Blend::parse)
        .unwrap_or(fallback[scheme.index()])
}

/// `resolveColorTokenValue(context, value)`: pick the scheme's half of a `[light, dark]` token
/// and fill in the context hue.
fn token(hue: Hue, scheme: Scheme, value: Option<&Value>) -> String {
    let raw = value
        .and_then(Value::as_array)
        .and_then(|pair| pair.get(scheme.index()))
        .and_then(Value::as_str)
        .unwrap_or("500");
    match parse_token_value(raw) {
        Some(TokenNode::Color(mut node)) => {
            if node.hue.is_none() {
                node.hue = Some(hue);
            }
            compile_token_value(&node)
        }
        _ => panic!("Invalid color token: {raw}"),
    }
}

struct Ctx<'a> {
    resolved: &'a Value,
    scheme: Scheme,
}

impl Ctx<'_> {
    fn render(&self, token: &str, bg: Option<&str>, blend: Blend) -> String {
        render_color_value(token, bg, blend, DEFAULT_PALETTE)
    }

    fn render_with(&self, token: &str, bg: Option<&str>, blend: Blend, palette: Palette) -> String {
        render_color_value(token, bg, blend, palette)
    }

    fn avatars(&self, state_tokens: Option<&Value>, base_bg: &str, root_blend: Blend) -> Vec<AvatarColor> {
        HUES.iter()
            .map(|hue| {
                let tokens = state_tokens.and_then(|t| get(t, &["avatar", hue.name()]));
                let context_hue = hue_of(tokens).unwrap_or(Hue::Gray);
                let blend = blend_of(tokens, [Blend::Screen, Blend::Multiply], self.scheme);
                let tok = |key: &str| token(context_hue, self.scheme, tokens.and_then(|t| t.get(key)));
                let bg = self.render(&tok("bg"), Some(base_bg), root_blend);
                let fg = self.render(&tok("fg"), Some(&bg), blend);
                AvatarColor { blend, bg, fg }
            })
            .collect()
    }

    fn badges(&self, badge_tokens: Option<&Value>, base_bg: &str, blend: Blend) -> Vec<BadgeColor> {
        STATE_TONES
            .iter()
            .map(|tone| {
                let tokens = badge_tokens.and_then(|t| t.get(tone.name()));
                let hue =
                    hue_of(tokens).or_else(|| hue_of(get(self.resolved, &["base", tone.name()]))).unwrap_or(Hue::Gray);
                let tok = |key: &str| token(hue, self.scheme, tokens.and_then(|t| t.get(key)));
                let bg = self.render(&tok("bg"), Some(base_bg), blend);
                BadgeColor {
                    dot: self.render(&tok("dot"), Some(&bg), blend),
                    fg: self.render(&tok("fg"), Some(&bg), blend),
                    icon: self.render(&tok("icon"), Some(&bg), blend),
                    bg,
                }
            })
            .collect()
    }

    fn state(
        &self,
        card_tokens: Option<&Value>,
        tokens: Option<&Value>,
        base_bg: &str,
        root_blend: Blend,
    ) -> StateColor {
        let hue = hue_of(tokens).or_else(|| hue_of(card_tokens)).unwrap_or(Hue::Gray);
        let blend = blend_of(tokens, [Blend::Screen, Blend::Multiply], self.scheme);
        let tok = |path: &[&str]| token(hue, self.scheme, tokens.and_then(|t| get(t, path)));
        let bg = self.render(&tok(&["bg"]), Some(base_bg), root_blend);
        let o = |path: &[&str]| self.render(&tok(path), Some(&bg), blend);
        StateColor {
            blend,
            accent_fg: o(&["accent", "fg"]),
            avatar: self.avatars(tokens, &bg, blend),
            badge: self.badges(tokens.and_then(|t| t.get("badge")), &bg, blend),
            border: o(&["border"]),
            code_bg: o(&["code", "bg"]),
            code_fg: o(&["code", "fg"]),
            fg: o(&["fg"]),
            icon: o(&["icon"]),
            link_fg: o(&["link", "fg"]),
            muted_bg: o(&["muted", "bg"]),
            muted_fg: o(&["muted", "fg"]),
            kbd_bg: o(&["kbd", "bg"]),
            kbd_fg: o(&["kbd", "fg"]),
            kbd_border: o(&["kbd", "border"]),
            skeleton_from: o(&["skeleton", "from"]),
            skeleton_to: o(&["skeleton", "to"]),
            bg,
        }
    }

    fn input_state(
        &self,
        card_tokens: Option<&Value>,
        tokens: Option<&Value>,
        base_bg: &str,
        root_blend: Blend,
    ) -> InputStateColor {
        let hue = hue_of(tokens).or_else(|| hue_of(card_tokens)).unwrap_or(Hue::Gray);
        let blend = blend_of(tokens, [Blend::Screen, Blend::Multiply], self.scheme);
        let tok = |path: &[&str]| token(hue, self.scheme, tokens.and_then(|t| get(t, path)));
        let bg = self.render(&tok(&["bg"]), Some(base_bg), root_blend);
        let o = |path: &[&str]| self.render(&tok(path), Some(&bg), blend);
        InputStateColor {
            blend,
            border: o(&["border"]),
            fg: o(&["fg"]),
            muted_bg: o(&["muted", "bg"]),
            placeholder: o(&["placeholder"]),
            bg,
        }
    }
}

pub fn card_color(resolved: &Value, scheme: Scheme, tone: CardTone, parent_bg: Option<&str>) -> CardColor {
    let ctx = Ctx { resolved, scheme };
    let tokens = get(resolved, &["base", tone.name()]);
    let hue = hue_of(tokens).unwrap_or(Hue::Gray);
    let blend = blend_of(tokens, [Blend::Multiply, Blend::Screen], scheme);
    let tok = |path: &[&str]| token(hue, scheme, tokens.and_then(|t| get(t, path)));

    let base_bg = ctx.render(&tok(&["bg"]), parent_bg, blend);
    let o = |path: &[&str]| ctx.render(&tok(path), Some(&base_bg), blend);
    let kbd_bg = o(&["kbd", "bg"]);

    let base = StateColor {
        blend,
        accent_fg: o(&["accent", "fg"]),
        avatar: ctx.avatars(tokens, &base_bg, blend),
        badge: ctx.badges(tokens.and_then(|t| t.get("badge")), &base_bg, blend),
        border: o(&["border"]),
        code_bg: o(&["code", "bg"]),
        code_fg: o(&["code", "fg"]),
        fg: o(&["fg"]),
        icon: o(&["icon"]),
        link_fg: o(&["link", "fg"]),
        muted_bg: o(&["muted", "bg"]),
        muted_fg: o(&["muted", "fg"]),
        kbd_fg: ctx.render(&tok(&["kbd", "fg"]), Some(&kbd_bg), blend),
        kbd_border: ctx.render(&tok(&["kbd", "border"]), Some(&kbd_bg), blend),
        kbd_bg,
        skeleton_from: o(&["skeleton", "from"]),
        skeleton_to: o(&["skeleton", "to"]),
        bg: base_bg.clone(),
    };

    let shadow_umbra = |key: &str| ctx.render_with(&tok(&["shadow", key]), None, blend, SHADOW_PALETTE);

    let button = BUTTON_MODES
        .iter()
        .map(|mode| {
            STATE_TONES
                .iter()
                .map(|state_tone| {
                    STATES
                        .iter()
                        .map(|state| {
                            let state_tokens = get(resolved, &["button", mode.name(), state_tone.name(), state.name()]);
                            ctx.state(tokens, state_tokens, &base_bg, blend)
                        })
                        .collect()
                })
                .collect()
        })
        .collect();

    let selectable = STATE_TONES
        .iter()
        .map(|state_tone| {
            STATES
                .iter()
                .map(|state| {
                    let state_tokens = get(resolved, &["selectable", state_tone.name(), state.name()]);
                    ctx.state(tokens, state_tokens, &base_bg, blend)
                })
                .collect()
        })
        .collect();

    let input = INPUT_MODES
        .iter()
        .map(|mode| {
            INPUT_STATES
                .iter()
                .map(|state| {
                    let state_tokens = get(resolved, &["input", mode.name(), state.name()]);
                    ctx.input_state(tokens, state_tokens, &base_bg, blend)
                })
                .collect()
        })
        .collect();

    let syntax_tokens = resolved.get("syntax");
    let syntax = SYNTAX_KEYS
        .iter()
        .map(|key| {
            let value = token(Hue::Gray, scheme, syntax_tokens.and_then(|t| t.get(*key)));
            (*key, ctx.render(&value, Some(&base_bg), blend))
        })
        .collect();

    CardColor {
        dark: scheme == Scheme::Dark,
        backdrop: o(&["backdrop"]),
        focus_ring: o(&["focusRing"]),
        shadow: ShadowColor {
            outline: o(&["shadow", "outline"]),
            umbra: shadow_umbra("umbra"),
            penumbra: shadow_umbra("penumbra"),
            ambient: shadow_umbra("ambient"),
        },
        base,
        button,
        input,
        selectable,
        syntax,
    }
}
