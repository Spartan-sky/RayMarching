#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

const float MAX_ITERATIONS = 100.0;

vec2 rotate2d(in vec2 p, in float a){
    float c = cos(a), s = sin(a);
    mat2 m = mat2(c, -s, s, c);
    
    return p * m;
}

// https://iquilezles.org/articles/distfunctions2d
float udSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 ba = b-a;
    vec2 pa = p-a;
    float h =clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length(pa-h*ba);
}

float generatePoly(in vec2 p, in vec2 a, in vec2 b, in float numSides){
    float d = udSegment(p, a, b);
    
    for(float i = 0.; i < MAX_ITERATIONS; i++){
        if(i >= (abs(numSides) - 1.)){break;}
        p -= b;
        b = rotate2d(b, 3.14 / ((numSides) / 2.));
        d = min(d, udSegment(p, a, b));
    }

    return d;
}

void main()
{
    vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2. - 1.;
    
    uv.x += .25;
    uv.y += .2;

    vec3 col = vec3(0);

    float numSides = u_time;
    
    float stepSize = tan(3.14 / numSides) * .4;
    float radius = .005;
    float thickness = .002;
    
    vec2 v1 = vec2(0.);
    vec2 v2 = vec2(stepSize, 0.);
    
    float d = generatePoly(uv, v1, v2, numSides);
    
    // from https://www.shadertoy.com/view/3tdSDj
    col = vec3(.01, .635, .91) * mix(col, vec3(1.), 1.0-smoothstep(0.0,0.015,d));
    
    gl_FragColor = vec4(col,1.0);
}