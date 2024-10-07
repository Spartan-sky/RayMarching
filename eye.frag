#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

mat2 m = mat2(0.8, 0.6, -0.6, 0.8);

float hash( float n )
{
    return fract(sin(n)*43758.5453);
}

float noise( in vec2 x )
{
    vec2 i = floor(x);
    vec2 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = i.x + i.y*57.0;

    return mix(mix( hash(n+ 0.0), hash(n+ 1.0),f.x),
               mix( hash(n+57.0), hash(n+58.0),f.x),f.y);
}

float fbm(vec2 p){
    float f = 0.0;
    f += 0.5000 * noise(p); p *= m * 2.02;
    f += 0.2500 * noise(p); p *= m * 2.03;
    f += 0.1250 * noise(p); p *= m * 2.01;
    f += 0.0625 * noise(p); p *= m * 2.04;
    f /= 0.9375;
    return f;
}

void main(){
    vec2 q = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0*q;
    p.x *= u_resolution.x/u_resolution.y;
    float r = sqrt(dot(p,p));
    float a = atan(p.y, p.x);
    
    vec3 col = vec3(1.0);

    float ss = .5 + 2.5*sin(3.0*u_time);
    float anim = 1. + .1 * ss * clamp(1.0 - r, 0.0, .8);
    r *= anim;

    col = vec3(0.5647, 0.0196, 0.2471);

    float f = fbm(52.*p);
    // col = mix(col, vec3(0.6353, 0.3569, 0.1255), f);

    f = smoothstep(0.1, 1.3, r);
    col = mix(col, vec3(0.3882, 0.2, 0.902), f);

    a += 0.5*fbm(20.0 * p);

    f = smoothstep(0.3, 1.0, fbm(vec2(6.0 * r, 20.0 * a)));
    col = mix(col, vec3(1.0), f);

    f = smoothstep(0.3, 1.0, fbm(vec2(8.0*r, 10.0 * a)));
    col *= 1.0 - f;

    f = smoothstep(0.5, 0.8, r);
    col *= 1.0 - 0.5 * f;

    col *= 0.5 + 0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.1);

    gl_FragColor = vec4(col, 1.);
}