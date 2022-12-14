precision highp float;
precision highp int;
const float PI = 3.141516;
const int MAX_LIGHTS = 8;

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

struct LightInfo {
    float on;
    // Light colour intensities
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    // Light geometry
    vec4 position;  // Position/direction of light (in camera coordinates)
    vec4 axis;
    float aperture;
    float cutoff;
    //   additional fields
    // ...
};


uniform int uNLights; 
uniform MaterialInfo uMaterial;
uniform LightInfo uLights[MAX_LIGHTS];

varying vec3 fViewer;
varying vec3 fPosC;
varying vec3 fNormal;

vec3 calculateDirLight(LightInfo light, vec3 N, vec3 V){
    vec3 l = vec3(0.,0.,0.);
    if(light.position.w == 0.0)
        l = light.position.xyz;
    else
        l = light.position.xyz - fPosC;
    vec3 L = normalize(l);
    float d = length(light.position.xyz - fPosC);
    float diffuseFactor = max(dot(L, N), 0.0);
    vec3 R = normalize(reflect(-L, N));
    float specularFactor = pow(max(dot(R, V), 0.0), uMaterial.shininess);
    vec3 ambient = light.ambient * uMaterial.Ka;
    vec3 diffuse = light.diffuse * diffuseFactor * uMaterial.Kd;
    vec3 specular = light.specular * specularFactor * uMaterial.Ks;
    if(dot(L, N) < 0.0)
        specular = vec3(0.0,0.0,0.0);
    return ambient + diffuse + specular;
}

vec3 calculateSpotLight(LightInfo light, vec3 N, vec3 V){
    vec3 ambient = light.ambient * uMaterial.Ka;
    vec3 spotLightDir = light.axis.xyz;
    vec3 fragmentDirToLight = light.position.xyz - fPosC;
    float angle =  acos(dot(normalize(spotLightDir),normalize(-fragmentDirToLight)));
    if( angle*180./PI <=light.aperture)
        return max(ambient, pow(cos(angle), light.cutoff) * calculateDirLight(light, N, V));
    return ambient;
}

void main() {
    vec3 V = normalize(fViewer);
    vec3 N = normalize(fNormal);
    vec3 result = vec3(0.,0.,0.);
    for(int i = 0; i < MAX_LIGHTS; i++){
        if(i == uNLights) break; 
        if(uLights[i].on >= 1.){
            if(uLights[i].aperture > -1.)
                result += calculateSpotLight(uLights[i], N, V);
            else
                result += calculateDirLight(uLights[i], N, V);
        }
    }
    gl_FragColor = vec4(result, 1.0);
}
