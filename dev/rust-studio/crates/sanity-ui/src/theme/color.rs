//! Port of `@sanity/ui`'s color token grammar (`parseTokenValue`, `compileColorTokenValue`) and
//! the color math in `build/lib/color-fns` and `build/mixThemeColor.ts`.
//!
//! The JS implementation renders every token by compiling it to a string and parsing it again,
//! and it formats numbers with `Number#toString`. Both are reproduced here on purpose, so the
//! output matches `buildTheme()` byte for byte (see `tests/theme_matches_js.rs`).

use sanity_color::{Hue, is_tint};

use super::Blend;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum BlackOrWhite {
    Black,
    White,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ColorNode {
    pub key: Option<BlackOrWhite>,
    pub hue: Option<Hue>,
    pub tint: Option<&'static str>,
    pub mix: Option<f64>,
    pub opacity: Option<f64>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum TokenNode {
    Color(ColorNode),
    Hue(Hue),
    BlendMode(Blend),
}

fn static_tint(value: &str) -> Option<&'static str> {
    sanity_color::TINTS.iter().copied().find(|t| *t == value)
}

fn is_mix_percent(value: Option<&str>) -> Option<f64> {
    let value = value?;
    let digits = value.strip_suffix('%')?;
    if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    Some(digits.parse::<f64>().ok()? / 100.0)
}

fn is_opacity(value: &str) -> Option<f64> {
    let valid = value == "0"
        || value == "1"
        || value.strip_prefix("0.").is_some_and(|rest| !rest.is_empty() && rest.bytes().all(|b| b.is_ascii_digit()));
    if valid { value.parse().ok() } else { None }
}

pub fn parse_token_value(value: &str) -> Option<TokenNode> {
    let mut segments = value.split('/');
    let first = segments.next().unwrap_or("");
    let mut first_parts = first.split(' ');
    let segment0 = first_parts.next().unwrap_or("");
    let segment0_mix = first_parts.next();

    if is_tint(segment0) {
        let tint = static_tint(segment0);
        let segment1 = segments.next().unwrap_or("");
        let mut node = ColorNode { key: None, hue: None, tint, mix: None, opacity: None };
        if let Some(mix) = is_mix_percent(segment0_mix) {
            node.mix = Some(mix);
        } else if let Some(opacity) = is_opacity(segment1) {
            node.opacity = Some(opacity);
        }
        return Some(TokenNode::Color(node));
    }

    if segment0 == "black" || segment0 == "white" {
        let key = if segment0 == "black" { BlackOrWhite::Black } else { BlackOrWhite::White };
        let segment1 = segments.next().unwrap_or("");
        let mut node = ColorNode { key: Some(key), hue: None, tint: None, mix: None, opacity: None };
        if let Some(mix) = is_mix_percent(segment0_mix) {
            node.mix = Some(mix);
        } else if let Some(opacity) = is_opacity(segment1) {
            node.opacity = Some(opacity);
        }
        return Some(TokenNode::Color(node));
    }

    if let Some(hue) = Hue::parse(segment0) {
        let next = segments.next().unwrap_or("");
        let mut next_parts = next.split(' ');
        let segment1 = next_parts.next().unwrap_or("");
        let segment1_mix = next_parts.next();
        if is_tint(segment1) {
            let segment2 = segments.next().unwrap_or("");
            let mut node =
                ColorNode { key: None, hue: Some(hue), tint: static_tint(segment1), mix: None, opacity: None };
            if let Some(mix) = is_mix_percent(segment1_mix) {
                node.mix = Some(mix);
            } else if let Some(opacity) = is_opacity(segment2) {
                node.opacity = Some(opacity);
            }
            return Some(TokenNode::Color(node));
        }
        return Some(TokenNode::Hue(hue));
    }

    match segment0 {
        "multiply" => Some(TokenNode::BlendMode(Blend::Multiply)),
        "screen" => Some(TokenNode::BlendMode(Blend::Screen)),
        _ => None,
    }
}

/// `Number#toString` for the finite values the theme produces.
pub fn js_number(value: f64) -> String {
    if value == 0.0 {
        return "0".into();
    }
    format!("{value}")
}

pub fn compile_token_value(node: &ColorNode) -> String {
    let mut key = match node.key {
        Some(BlackOrWhite::Black) => "black".to_string(),
        Some(BlackOrWhite::White) => "white".to_string(),
        None => format!("{}/{}", node.hue.map(Hue::name).unwrap_or("undefined"), node.tint.unwrap_or("undefined")),
    };
    if let Some(mix) = node.mix {
        return format!("{key} {}%", js_number(mix * 100.0));
    }
    if let Some(opacity) = node.opacity {
        key.push('/');
        key.push_str(&js_number(opacity));
    }
    key
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Rgb {
    pub r: f64,
    pub g: f64,
    pub b: f64,
}

/// `parseInt(str, 16)`: leading hex digits, `NaN` when there are none.
fn js_parse_hex(value: &str) -> f64 {
    let digits: String = value.chars().take_while(|c| c.is_ascii_hexdigit()).collect();
    if digits.is_empty() {
        return f64::NAN;
    }
    u32::from_str_radix(&digits, 16).map(f64::from).unwrap_or(f64::NAN)
}

pub fn hex_to_rgb(hex: &str) -> Rgb {
    let at = |from: usize, to: usize| hex.get(from..to).unwrap_or("");
    if hex.len() == 4 {
        let r = at(1, 2);
        let g = at(2, 3);
        let b = at(3, 4);
        return Rgb {
            r: js_parse_hex(&format!("{r}{r}")),
            g: js_parse_hex(&format!("{g}{g}")),
            b: js_parse_hex(&format!("{b}{b}")),
        };
    }
    Rgb { r: js_parse_hex(at(1, 3)), g: js_parse_hex(at(3, 5)), b: js_parse_hex(at(5, 7)) }
}

fn channel(value: f64) -> u32 {
    // JS: `round(clamp(Math.round(x), 0, 255))`, and `NaN << n` is 0.
    if value.is_nan() { 0 } else { value.round().clamp(0.0, 255.0) as u32 }
}

pub fn rgb_to_hex(color: Rgb) -> String {
    let value = (1u32 << 24) + (channel(color.r) << 16) + (channel(color.g) << 8) + channel(color.b);
    format!("#{}", &format!("{value:x}")[1..])
}

fn is_hex(value: &str) -> bool {
    value.starts_with('#')
        && (value.len() == 4 || value.len() == 7)
        && value[1..].chars().all(|c| c.is_ascii_hexdigit())
}

pub fn parse_color(value: &str) -> Rgb {
    if value.is_empty() {
        return Rgb { r: 0.0, g: 0.0, b: 0.0 };
    }
    if is_hex(value) {
        return hex_to_rgb(value);
    }
    if let Some(inner) = value.strip_prefix("rgba(") {
        let mut parts = inner.trim_end_matches(')').split(',');
        let mut next =
            || parts.next().and_then(|part| part.trim().parse::<f64>().ok()).map(f64::trunc).unwrap_or(f64::NAN);
        return Rgb { r: next(), g: next(), b: next() };
    }
    panic!("parseColor: unexpected color format: \"{value}\"")
}

pub fn rgba(color: &str, alpha: f64) -> String {
    let rgb = parse_color(color);
    format!("rgba({},{},{},{})", js_number(rgb.r), js_number(rgb.g), js_number(rgb.b), js_number(alpha))
}

fn clamp(value: f64, min: f64, max: f64) -> f64 {
    max.min(min.max(value))
}

fn lerp(x: f64, y: f64, a: f64) -> f64 {
    x * (1.0 - a) + y * a
}

fn invlerp(x: f64, y: f64, a: f64) -> f64 {
    clamp((a - x) / (y - x), 0.0, 1.0)
}

fn range(x1: f64, y1: f64, x2: f64, y2: f64, a: f64) -> f64 {
    lerp(x2, y2, invlerp(x1, y1, a))
}

fn multiply(b: Rgb, s: Rgb) -> Rgb {
    Rgb {
        r: (b.r / 255.0) * (s.r / 255.0) * 255.0,
        g: (b.g / 255.0) * (s.g / 255.0) * 255.0,
        b: (b.b / 255.0) * (s.b / 255.0) * 255.0,
    }
}

fn screen(b: Rgb, s: Rgb) -> Rgb {
    let channel = |b: f64, s: f64| b + s - b * s;
    Rgb {
        r: channel(b.r / 255.0, s.r / 255.0) * 255.0,
        g: channel(b.g / 255.0, s.g / 255.0) * 255.0,
        b: channel(b.b / 255.0, s.b / 255.0) * 255.0,
    }
}

fn mix(b: Rgb, s: Rgb, weight: f64) -> Rgb {
    Rgb { r: b.r + (s.r - b.r) * weight, g: b.g + (s.g - b.g) * weight, b: b.b + (s.b - b.b) * weight }
}

#[derive(Clone, Copy, Debug)]
pub struct Palette {
    pub black: &'static str,
    pub white: &'static str,
}

pub const DEFAULT_PALETTE: Palette = Palette { black: sanity_color::BLACK, white: sanity_color::WHITE };

/// The palette `renderThemeColor` uses for the umbra, penumbra and ambient shadow colors.
pub const SHADOW_PALETTE: Palette = Palette { black: "#000000", white: sanity_color::WHITE };

fn mix_theme_color(value: &str, bg: Option<&str>, blend: Blend, palette: Palette) -> String {
    let color = parse_color(value);
    let black = parse_color(palette.black);
    let white = parse_color(palette.white);
    let bg = match bg {
        Some(bg) => parse_color(bg),
        None if blend == Blend::Multiply => white,
        None => black,
    };
    let convert = |c: Rgb| Rgb {
        r: clamp(range(black.r, white.r, 0.0, 255.0, c.r), 0.0, 255.0),
        g: clamp(range(black.g, white.g, 0.0, 255.0, c.g), 0.0, 255.0),
        b: clamp(range(black.b, white.b, 0.0, 255.0, c.b), 0.0, 255.0),
    };
    let (bg, color) = (convert(bg), convert(color));
    let result = match blend {
        Blend::Multiply => multiply(bg, color),
        Blend::Screen => screen(bg, color),
    };
    rgb_to_hex(Rgb {
        r: clamp(range(0.0, 255.0, black.r, white.r, result.r), black.r, white.r),
        g: clamp(range(0.0, 255.0, black.g, white.g, result.g), black.g, white.g),
        b: clamp(range(0.0, 255.0, black.b, white.b, result.b), black.b, white.b),
    })
}

/// Port of `renderColorValue`: a compiled token (`"blue/500"`, `"gray/700 75%"`,
/// `"black/0.2"`) rendered on top of `bg` with `blend`.
pub fn render_color_value(value: &str, bg: Option<&str>, blend: Blend, palette: Palette) -> String {
    let Some(TokenNode::Color(node)) = parse_token_value(value) else {
        panic!("Invalid color token value: {value}");
    };
    let mut hex = match (node.key, node.hue, node.tint) {
        (Some(BlackOrWhite::Black), _, _) => palette.black.to_string(),
        (Some(BlackOrWhite::White), _, _) => palette.white.to_string(),
        (None, Some(hue), Some(tint)) => hue.tint(tint).unwrap_or_default().to_string(),
        _ => panic!("Invalid color token value: {value}"),
    };
    hex = mix_theme_color(&hex, bg, blend, palette);
    if let (Some(bg), Some(weight)) = (bg, node.mix) {
        hex = rgb_to_hex(mix(hex_to_rgb(bg), hex_to_rgb(&hex), weight));
    }
    if let Some(opacity) = node.opacity {
        hex = rgba(&hex, opacity);
    }
    hex
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_and_compiles_tokens() {
        for (input, compiled) in [
            ("purple/600", "purple/600"),
            ("gray/500/0.1", "gray/500/0.1"),
            ("black/0.2", "black/0.2"),
            ("white", "white"),
            ("blue/700 75%", "blue/700 75%"),
        ] {
            let Some(TokenNode::Color(node)) = parse_token_value(input) else {
                panic!("{input} did not parse as a color")
            };
            assert_eq!(compile_token_value(&node), compiled);
        }
        assert_eq!(parse_token_value("gray"), Some(TokenNode::Hue(Hue::Gray)));
        assert_eq!(parse_token_value("screen"), Some(TokenNode::BlendMode(Blend::Screen)));
        assert_eq!(parse_token_value("nope"), None);
    }

    #[test]
    fn renders_like_js() {
        assert_eq!(rgb_to_hex(Rgb { r: 13.0, g: 14.0, b: 18.0 }), "#0d0e12");
        assert_eq!(render_color_value("gray/50", None, Blend::Multiply, DEFAULT_PALETTE), "#f6f6f8");
        assert_eq!(rgba("#000000", 0.2), "rgba(0,0,0,0.2)");
    }
}
