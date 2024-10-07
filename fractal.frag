#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main(){
    float angle = u_time * .1;

    // Normalize uv
    vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2. - 1.;
    for(float i = 0.; i < 32.; i += 1.){
        uv = abs(uv);
        uv -= 0.5;
        uv *= 1.1;
        uv *= mat2(
            cos(angle), -sin(angle),
            sin(angle), cos(angle)
        );
    }
    vec3 col = vec3(
        length(uv - vec2(.2, .1)),
     length(uv - vec2(.1, .1)),
     length(uv - vec2(.1, .2)));

    gl_FragColor = vec4(col, 1.);
}