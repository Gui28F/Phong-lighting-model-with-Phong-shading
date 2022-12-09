precision highp float;
precision highp int;
const int MAX_LIGHTS = 8;

uniform vec4 lightsPositions[MAX_LIGHTS];
attribute vec4 vPosition;
attribute vec4 vNormal;
uniform mat4 mModelView;
uniform mat4 mNormals;
uniform mat4 mProjection;
uniform int uNLights; 

varying vec3 fNormal;
varying vec3 fViewer;
varying vec3 fPosC;


void main() {
    gl_Position = mProjection * mModelView * vPosition;
    vec3 posC = (mModelView * vPosition).xyz;
    fNormal = (mNormals * vNormal).xyz;
    fPosC = posC;
    fViewer = -posC;
}