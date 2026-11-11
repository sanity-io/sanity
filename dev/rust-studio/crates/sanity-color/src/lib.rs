//! Port of `@sanity/color` 3.0.9: the hue and tint palette the `@sanity/ui` theme is built from.

pub const BLACK: &str = "#0d0e12";
pub const WHITE: &str = "#ffffff";

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Hue {
    Gray,
    Blue,
    Purple,
    Magenta,
    Red,
    Orange,
    Yellow,
    Green,
    Cyan,
}

pub const HUES: [Hue; 9] =
    [Hue::Gray, Hue::Blue, Hue::Purple, Hue::Magenta, Hue::Red, Hue::Orange, Hue::Yellow, Hue::Green, Hue::Cyan];

pub const TINTS: [&str; 11] = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

impl Hue {
    pub fn name(self) -> &'static str {
        match self {
            Hue::Gray => "gray",
            Hue::Blue => "blue",
            Hue::Purple => "purple",
            Hue::Magenta => "magenta",
            Hue::Red => "red",
            Hue::Orange => "orange",
            Hue::Yellow => "yellow",
            Hue::Green => "green",
            Hue::Cyan => "cyan",
        }
    }

    pub fn parse(name: &str) -> Option<Hue> {
        HUES.into_iter().find(|hue| hue.name() == name)
    }

    /// The hex value of a tint (`"50"` … `"950"`) of this hue.
    pub fn tint(self, tint: &str) -> Option<&'static str> {
        let index = TINTS.iter().position(|t| *t == tint)?;
        Some(PALETTE[self as usize][index])
    }
}

pub fn is_tint(value: &str) -> bool {
    TINTS.contains(&value)
}

const PALETTE: [[&str; 11]; 9] = [
    [
        "#f6f6f8", "#eeeef1", "#e3e4e8", "#bbbdc9", "#9499ad", "#727892", "#515870", "#383d51", "#252837", "#1b1d27",
        "#13141b",
    ],
    [
        "#f5f8ff", "#e5edff", "#dbe5ff", "#a8bfff", "#7595ff", "#556bfc", "#4043e7", "#2927aa", "#192457", "#161a41",
        "#101228",
    ],
    [
        "#f8f5ff", "#f1ebff", "#ece1fe", "#ccb1fc", "#b087f7", "#8f57ef", "#721fe5", "#4c1a9e", "#2f1862", "#23173f",
        "#181128",
    ],
    [
        "#fef6f9", "#fde8ef", "#fcdee9", "#f7abc5", "#f0709b", "#e72767", "#b11651", "#7c1342", "#4b1130", "#341325",
        "#1f0f14",
    ],
    [
        "#fff6f5", "#ffe7e5", "#ffdedc", "#fdada5", "#f77769", "#ef4434", "#cc2819", "#8b2018", "#4d1714", "#321615",
        "#1e1011",
    ],
    [
        "#fff7f0", "#ffeadb", "#ffddc7", "#ffb685", "#ff8e42", "#fa6400", "#b14802", "#7c3404", "#461e07", "#32160b",
        "#21120d",
    ],
    [
        "#fefae1", "#fcf3bb", "#f9e994", "#f7d455", "#f9bc15", "#d28a04", "#965908", "#653a0b", "#3b220c", "#271a11",
        "#181410",
    ],
    [
        "#e7fef5", "#c5fce8", "#a9f9dc", "#59f3ba", "#0ff0a1", "#04b97a", "#01794f", "#015133", "#023120", "#06231a",
        "#071715",
    ],
    [
        "#e7fefe", "#c5fcfc", "#96f8f8", "#62efef", "#18e2e2", "#04b8be", "#037782", "#024950", "#042f34", "#072227",
        "#0d181c",
    ],
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn looks_up_tints() {
        assert_eq!(Hue::Blue.tint("500"), Some("#556bfc"));
        assert_eq!(Hue::Gray.tint("950"), Some("#13141b"));
        assert_eq!(Hue::Cyan.tint("50"), Some("#e7fefe"));
        assert_eq!(Hue::Red.tint("525"), None);
        assert_eq!(Hue::parse("magenta"), Some(Hue::Magenta));
    }
}
