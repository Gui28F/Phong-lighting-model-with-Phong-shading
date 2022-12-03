precision highp float;
precision highp int;
const int MAX_LIGHTS = 8;
uniform vec3 uColor;

varying vec3 fPosition;
varying vec3 fNormal;

//uniform int MAX_LIGHTS;

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
    // ...
    //   additional fields
    // ...
};


uniform int uNLights; 
uniform MaterialInfo uMaterial;
uniform LightInfo uLights[MAX_LIGHTS];

varying vec3 fLight;
varying vec3 fViewer;

vec3 ambientColor(){
    vec3 ambientColor = vec3(0,0,0);
    for(int i = 0; i < MAX_LIGHTS; i++){
        if(i == uNLights) break; 
        ambientColor+=uLights[i].ambient * uMaterial.Ka;
    }
    return ambientColor;
}

vec3 diffuseColor(){
    vec3 diffuseColor = vec3(0,0,0);
    for(int i = 0; i < MAX_LIGHTS; i++){
         if(i == uNLights) break; 
        diffuseColor+=uLights[i].diffuse * uMaterial.Kd;
    }
    return diffuseColor;
}

vec3 specularColor(){
    vec3 specularColor = vec3(0,0,0);
    for(int i = 0; i < MAX_LIGHTS; i++){
         if(i == uNLights) break; 
        specularColor+=uLights[i].specular * uMaterial.Ks;
    }
    return specularColor;
}


void main() {
  //  vec3 color = ambientColor + diffuseColor + specularColor;
    vec3 L = normalize(fLight);
    vec3 V = normalize(fViewer);
    vec3 N = normalize(fNormal);
    vec3 H = normalize(L + V);
    float diffuseFactor = max(dot(L, N), 0.0);
    vec3 diffuse = diffuseFactor * diffuseColor();
    float specularFactor = pow(max(dot(N, H), 0.0), uMaterial.shininess);
    vec3 specular = specularFactor * specularColor();

    if(dot(L, N) < 0.0)
        specular = vec3(0.0,0.0,0.0);
    gl_FragColor = vec4(ambientColor() + diffuse + specular, 1.0);
    //gl_FragColor = vec4( uMaterial.Kd, 1.0);
}