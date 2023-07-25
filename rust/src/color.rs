use crate::utils::u8_to_u32;

pub enum Color {
    RGBA(u8, u8, u8, u8),
    HexRGBA(u32),
}

impl Color {
    pub const BLACK: Color = Self::RGBA(0, 0, 0, 255);
    pub const WHITE: Color = Self::RGBA(255, 255, 255, 255);
}

impl Into<u32> for Color {
    fn into(self) -> u32 {
        match self {
            Self::RGBA(r, g, b, a) => u8_to_u32(r, g, b, a),
            Self::HexRGBA(hex) => hex,
        }
    }
}
