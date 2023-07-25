pub fn u8_to_u32(a: u8, b: u8, c: u8, d: u8) -> u32 {
    ((a as u32) << 24) + ((b as u32) << 16) + ((c as u32) << 8) + d as u32
}
