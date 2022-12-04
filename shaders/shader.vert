precision highp float;
precision highp int;
const int MAX_LIGHTS = 8; //TODO

uniform int prespective; //TODO

uniform vec4 lightsPositions[MAX_LIGHTS];
attribute vec4 vPosition;
attribute vec4 vNormal;
uniform mat4 mModelView;
uniform mat4 mNormals;
uniform mat4 mProjection;
uniform int uNLights; 
uniform mat4 mView;

varying vec3 fNormal;
varying vec3 fLight;
varying vec3 fViewer;
varying vec3 fPosC;
vec3 light(vec3 posC){
    vec3 light = vec3(0,0,0);
    for(int i = 0; i < MAX_LIGHTS; i++){
        if(i == uNLights) break;
        if(lightsPositions[i].w == 0.0)
                light += (lightsPositions[i]).xyz;
            else
                light += (lightsPositions[i]).xyz - posC;
    }
    return normalize(light);
}

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    vec3 posC = (mView * vPosition).xyz;
    fLight = light(posC);
    fNormal = (mNormals * vNormal).xyz;
    fPosC = posC;
    //if(prespective == 1)
        fViewer = -posC;
    //else fViewer = vec3(0,0,1);
}