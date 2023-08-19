export type WebGLShaderType = GLenum &
    (
        | WebGLRenderingContext["VERTEX_SHADER"]
        | WebGLRenderingContext["FRAGMENT_SHADER"]
    );

export interface ShaderInfo {
    source: string;
    attributeNames: string[];
    attributeLocations: Record<string, number>;
    uniformNames: string[];
    uniformLocations: Record<string, WebGLUniformLocation>;
}

export interface ShaderInfos {
    vertex: ShaderInfo;
    fragment: ShaderInfo;
}

export interface ProgramSetup {
    displayShaders: ShaderInfos;
    displayProgram: WebGLProgram;
    updateShaders: ShaderInfos;
    updateProgram: WebGLProgram;
    vertexBuffer: WebGLBuffer;
    sandBuffer: WebGLTexture;
    bindVertexBuffer: () => void;
}
