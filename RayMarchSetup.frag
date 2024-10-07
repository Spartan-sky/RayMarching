#ifdef GL_ES
precision mediump float;
#endif

#define SURF_DIST .01

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

mat2 Rot2d(float a){
    return mat2(cos(a), -sin(a),
                sin(a),  cos(a));
}

// Center: xyz, Radius: w
float sdf_sphere(vec4 p){
    return length(p.xyz) - p.w;
}

// Y-value:x, Translate: y
float sdf_floor(vec2 p){
    return p.x + p.y;
}

float map(vec3 p) {
    float d = 0.;

    float d1 = sdf_sphere(vec4(p, 1.));
    d = d1;

    float d2 = sdf_floor(vec2(p.y, 1.));
    d = min(d, d2);

    return d;
}

// RayOrigin:ro, RayDirection:rd
float calcSoftshadow(vec3 ro, vec3 rd){
    float res = 1.;
    float tmax = 12.;

    float t = .02;
    for(int i = 0; i < 50; i++){
        vec3 p  = ro + rd*t;
        float d = map(p);
        res = min(res, 16. * d / t);
        t += clamp(d, .05, .4);
        if(res < .005 || t > tmax) break;
    }

    return clamp(res, 0., 1.);
}

// RayOrigin:ro, RayDirection:rd
float RayMarch(vec3 ro, vec3 rd){
    float tmin = 0.5;
    float tmax = 20.;

    float t = tmin;

    for(int i=0; i < 100; i++){
        vec3 p = ro + rd*t;
        float d = map(p);
        t += d;
        if(t > tmax || d < SURF_DIST) break;
    }

    if( t>tmax ) t=-1.0;

    return t;
}

// Position:p
vec3 calcNormal(vec3 p)
{
    vec2 e = vec2(0.0005,0.0);
    float d = map(p);
    return normalize( d - 
        vec3(
            map(p - e.xyy),
            map(p - e.yxy),
            map(p - e.yyx)));
}

// LightPos:lp, Normal:n
float calcLight(vec3 lp, vec3 n){
    float dif = clamp(dot(n, lp), 0., 1.);

    return dif;
}

// RayOrigin:ro, RayDirection:rd
vec3 render(vec3 ro, vec3 rd){
    // sky dome
    vec3 col = vec3(0.5, 0.8, 0.9) - max(rd.y,0.0)*0.5;

    float t = RayMarch(ro, rd);
    if(t > -.5){
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);

        col = vec3(0.15);
        float ks = 1.;

        vec3 sun_lig = normalize(vec3(1., 1., .25));
        float sun_dif = calcLight(sun_lig, n);
        float sky_dif = sqrt(clamp(.5 + .5 * n.y, 0.,1.));
        float bou_dif = sqrt(clamp( 0.1-0.9*n.y, 0.0, 1.0 ))*clamp(1.0-0.1*p.y,0.0,1.0);
        float sun_sha = calcSoftshadow(p, sun_lig);
        vec3 sun_hal = normalize(sun_lig-rd);
        float sun_spe = ks*pow(clamp(dot(n,sun_hal),0.0,1.0),8.0)*sun_dif*(0.04+0.96*pow(clamp(1.0+dot(sun_hal,rd),0.0,1.0),5.0));

        vec3 lin = vec3(0.);
        lin += sun_dif * vec3(8.1, 6., 4.2) * sun_sha;
        lin += sky_dif * vec3(.5, .7, 1.);
        lin += bou_dif*vec3(0.60,0.40,0.30);
        col *= lin;
        col += sun_spe*vec3(8.1, 6.,4.2)*sun_sha;

        col = mix( col, vec3(0.5,0.7,0.9), 1.0-exp( -0.0001*t*t*t ) );
    }
    return col;
}

vec3 R(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = p+f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i-p);
    return d;
}

void main(){
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)
    /u_resolution.y;

    vec2 m = u_mouse.xy / u_resolution.xy;

    vec3 ro = vec3(0., 0., -2.5);
    ro.yz *= Rot2d(-m.y + .4);
    ro.xz *= Rot2d(u_time*.5 - m.x * 6.2831);

    vec3 rd = R(uv, ro, vec3(0.), .7);
    
    vec3 col = vec3(0.);

    col = render(ro, rd);

    gl_FragColor = vec4(col, 1.);
}