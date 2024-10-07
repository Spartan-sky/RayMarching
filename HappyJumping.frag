#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main(){
    // Normalize uv
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)
    /u_resolution.y;

    vec3 col = vec3(0.);

    gl_FragColor = vec4(col, 1.);
}