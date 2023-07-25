use wasm_bindgen::prelude::wasm_bindgen;

use crate::grid::CanvasSize;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => ($crate::js::log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen(js_namespace = rustLib)]
extern "C" {
    #[wasm_bindgen(js_name = "fillRect")]
    pub fn fill_rect(
        x: CanvasSize,
        y: CanvasSize,
        width: CanvasSize,
        height: CanvasSize,
        color: u32,
    );

    #[wasm_bindgen(js_name = "strokeRect")]
    pub fn stroke_rect(
        x: CanvasSize,
        y: CanvasSize,
        width: CanvasSize,
        height: CanvasSize,
        color: u32,
    );
}
