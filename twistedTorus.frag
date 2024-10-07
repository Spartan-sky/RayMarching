#ifdef GL_ES
precision mediump float;
#endif

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .0001

uniform vec2 u_resolution;
uniform float u_time;

mat2 Rot2d(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s,
                s,  c);
}

float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float sdSphere(vec3 p, float r){
    return length(p) - r;
}

float sdTorus(vec3 p, vec2 t){
    vec2 q = vec2(length(p.xz) - t.x, p.y);

    float a = atan(p.x, p.z);

    q *= Rot2d(-45.);
    q *= Rot2d(a*sin(u_time/5.)*4.5);
    q.y = abs(q.y)-.3;

    return length(q)-t.y;
}

float GetDist(vec3 p){
    vec3 tP = p;
    vec3 sP = p;

    float torusDist = sdTorus(tP, vec2(1.5,.25));
    float sphereDist = sdSphere(sP, 1.);

    float displacement = sin(cos(u_time+2.)*p.x)*sin(cos(u_time)*p.y)*sin(cos(u_time+3.)*p.z);

    torusDist += displacement;
    sphereDist += displacement*2.;

    return opSmoothUnion(torusDist, sphereDist, .25);
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

vec3 GetNormal(vec3 p) {
    vec2 e = vec2(.001, 0);
    vec3 n = GetDist(p) - 
        vec3(GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 
        f = normalize(l-p),
        r = normalize(
            cross(
                vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u;
    return normalize(i);
}

vec3 Bg(vec3 rd){
    float k = rd.y*.5+.5;

    vec3 col = mix(vec3(0.7373, 0.1686, 0.1686), vec3(0.0, 0.149, 1.0), k);
    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy*2. - u_resolution.xy)
    /u_resolution.y;

    vec3 col = vec3(0);

    vec3 ro = vec3(0, 2, 4);
    vec3 rd = GetRayDir(vec2(uv.x, uv.y), vec3(ro.x, ro.y, ro.z), vec3(0,0,0), .5);
   
    col += Bg(rd);

    float d = RayMarch(ro, rd);

    if(d<MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);

        float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;
        col = mix(Bg(r), vec3(dif), .5);
        col *= vec3(0.2, 0.8078, 0.902)*1.5;
        }
    
    col = pow(col, vec3(.4545));	// gamma correction

    gl_FragColor = vec4(col, 1.);
}