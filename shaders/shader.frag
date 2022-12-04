precision highp float;
precision highp int;
const int MAX_LIGHTS = 8;
uniform vec3 uColor;

varying vec3 fPosition;
varying vec3 fNormal;

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

struct LightInfo {
    // Light colour intensities
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    // Light geometry
    vec4 position;  // Position/direction of light (in camera coordinates)
    vec3 axis;
    float aperture;
    float cutoff;
    //   additional fields
    // ...
};


uniform int uNLights; 
uniform MaterialInfo uMaterial;
uniform LightInfo uLights[MAX_LIGHTS];

varying vec3 fLight;
varying vec3 fViewer;
varying vec3 fPosC;


vec3 calculateDirLight(LightInfo light, vec3 N, vec3 V){
    vec3 l = vec3(0.,0.,0.);
     if(light.position.w == 0.0)
        l = light.position.xyz;
    else
        l = light.position.xyz + V;//TODO
    vec3 L = normalize(l);
    float diffuseFactor = max(dot(L, N), 0.0);
    vec3 H = normalize(L + V);
    float specularFactor = pow(max(dot(N, H), 0.0), uMaterial.shininess);
    vec3 ambient = light.ambient * uMaterial.Ka;
    vec3 diffuse = light.diffuse * diffuseFactor * uMaterial.Kd;
    vec3 specular = light.specular * specularFactor * uMaterial.Ks;
    if(dot(L, N) < 0.0)
        specular = vec3(0.0,0.0,0.0);
    return (ambient + diffuse + specular);
}

void main() {
    vec3 V = normalize(fViewer);
    vec3 N = normalize(fNormal);
    /*
    vec3 L = normalize(fLight);
    vec3 H = normalize(L + V);

    float diffuseFactor = max(dot(L, N), 0.0);
    vec3 diffuse = diffuseFactor * diffuseColor();
    float specularFactor = pow(max(dot(N, H), 0.0), uMaterial.shininess);
    vec3 specular = specularFactor * specularColor();

    if(dot(L, N) < 0.0)
        specular = vec3(0.0,0.0,0.0);
        */
    vec3 result = vec3(0.,0.,0.);
    for(int i = 0; i < MAX_LIGHTS; i++){
        if(i == uNLights) break; 
        result += calculateDirLight(uLights[i], N, V);
    }
    gl_FragColor = vec4(result, 1.0);
    //gl_FragColor = vec4( uMaterial.Kd, 1.0);
}