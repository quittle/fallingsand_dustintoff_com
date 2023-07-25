use crate::{texture::Texture, utils::u8_to_u32};

pub enum Color {
    Rgba(u8, u8, u8, u8),
    HexRgba(u32),
}

impl Color {
    pub const BLACK: Color = Self::Rgba(0, 0, 0, 255);
}

impl From<Texture> for Color {
    fn from(val: Texture) -> Self {
        match val {
            Texture::Color(color) => color,
        }
    }
}

impl From<Color> for u32 {
    fn from(val: Color) -> Self {
        match val {
            Color::Rgba(r, g, b, a) => u8_to_u32(r, g, b, a),
            Color::HexRgba(hex) => hex,
        }
    }
}
