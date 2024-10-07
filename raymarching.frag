#ifdef GL_ES
precision mediump float;
#endif

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01

uniform vec2 u_resolution;
uniform float u_time;

mat3 Rot(float a){
    float s = sin(a), c = cos(a);
    return mat3(c, -s, 0.,
        s, c, 0.,
        0., 0., 1.);
}

float sdSphere(vec3 p, vec4 s){
    return length(p-s.xyz)-s.w;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r){
    vec3 ab = b-a;
    vec3 ap = p-a;

    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.,1.);

    vec3 c = a + t*ab;

    return length(p-c)-r;
}

float sdBox(vec3 p, vec3 b){
    return length(max(abs(p)-b, 0.));
}

float sdTorus( vec3 p, vec2 t ){
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float round(float p){
    return floor(p + .5);
}

vec3 repeatedY(vec3 p, float s, float l)
{
    p.y = p.y - s*clamp(
        round(p.y/s), -l, l);
    return p;
}

float GetDist(vec3 p){
    vec4 s = vec4(0,1,6,1.);

    float sphereDist = sdSphere(p,s);
    float planeDist = p.y;
    float capsuleDist = sdCapsule(
        p, vec3(0,1,4),
        vec3(1,0.5,2), .2);
    float boxDist = sdBox(
        p-vec3(-2,.5,4),vec3(.5));
    float torusDist = sdTorus(
        repeatedY(
            Rot(u_time)*(p - vec3(0, 2., 3)),
             .5, 1.), vec2(.5,.1));

    float d = min(sphereDist, planeDist);
    d = min(d, capsuleDist);
    d = min(d, boxDist);
    d = min(d, torusDist);
    return torusDist;
}

float RayMarch(vec3 ro, vec3 rd){
    float d0 = 0.;

    for(int i=0; i < MAX_STEPS; i++){
        vec3 p = ro + rd*d0;
        float dS = GetDist(p);
        d0 += dS;
        if(d0 > MAX_DIST || dS < SURF_DIST) break;
    }

    return d0;
}

vec3 GetNormal(vec3 p){
    float d = GetDist(p);
    vec2 e = vec2(.01,0);

    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx)
    );

    return normalize(n);
}

float GetLight(vec3 p){
    vec3 lightPos = vec3(0,2,6);
    lightPos.xz += 2.*vec2(sin(u_time), cos(u_time)) * 2.;

    vec3 l = normalize(lightPos - p);
    vec3 n = GetNormal(p);

    float dif = clamp(dot(n, l), 0., 1.);
    float d = RayMarch(p+n*SURF_DIST*2., l);
    if(d < length(lightPos-p)) dif *= .1;

    return dif;
}

void main(){
    // Normalize uv
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)
    /u_resolution.y;

    vec3 col = vec3(0.1294, 0.1333, 0.0588);

    // Camera Pos and Dir
    vec3 ro = vec3(0.,2.,1.);
    vec3 rd = normalize(vec3(uv, 1));

    float d = RayMarch(ro, rd);

    vec3 p = ro + rd*d;
    float dif = GetLight(p);

    col += vec3(dif);

    gl_FragColor = vec4(col, 1.);
}