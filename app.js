import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "./libs/utils.js";
import { ortho, lookAt, flatten, vec3, vec4, mult, rotateY, perspective, inverse, rotateX, normalMatrix } from "./libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "./libs/stack.js";
import * as CYLINDER from './libs/objects/cylinder.js';
import * as CUBE from './libs/objects/cube.js';
import * as TORUS from './libs/objects/torus.js';
import * as BUNNY from './libs/objects/bunny.js';


/** @type WebGLRenderingContext */
let gl;
let time = 0;
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
const VP_DISTANCE = 4;
let uColor;

let mView;
let mProjection;
const canvas = document.getElementById("gl-canvas");
let aspect = canvas.width / canvas.height;
let program;

const PLATFORM_COLOR = [0.66, 0.46, 0.28];
const CYLINDER_COLOR = [0.18, 0.55, 0.34];
const CUBE_COLOR = [0.64, 0.19, 0.19];
const TORUS_COLOR = [0.13, 0.61, 0];
const BUNNY_COLOR = [1, 0.80, 0.86];

let lights = [
    {
        position: vec4(0, 0, 10, 1),
        lightAmb: vec3(0.2, 0.2, 0.2),
        lightDif: vec3(0.7, 0.7, 0.7),
        lightSpec: vec3(1.0, 1.0, 1.0),
    }
]

let platformMaterial = {
    materialAmb: vec3(1, 0, 0),
    materialDif: vec3(1, 0, 0),
    materialSpec: PLATFORM_COLOR,
    shininess: 1
}

let cubeMaterial = {
    materialAmb: vec3(1, 0, 0),
    materialDif: vec3(1, 0, 0),
    materialSpec: CUBE_COLOR,
    shininess: 1
}

let cylinderMaterial = {
    materialAmb: vec3(1, 0, 0),
    materialDif: vec3(1, 0, 0),
    materialSpec: CYLINDER_COLOR,
    shininess: 1
}

let torusMaterial = {
    materialAmb: vec3(0, 1, 0),
    materialDif: vec3(0, 1, 0),
    materialSpec: TORUS_COLOR,
    shininess: 3
}

let bunnyMaterial = {
    materialAmb: vec3(0, 0, 0),
    materialDif: vec3(0, 0, 0),
    materialSpec: BUNNY_COLOR,
    shininess: 0
}

function uploadObject(program, id, object) {
    gl.useProgram(program);
    const materialAmb = gl.getUniformLocation(program, id + ".Ka");
    const materialDif = gl.getUniformLocation(program, id + ".Ks");
    const materialSpe = gl.getUniformLocation(program, id + ".Kd");
    const shininess = gl.getUniformLocation(program, id + ".shininess");
    gl.uniform3fv(materialAmb, object.materialAmb);
    gl.uniform3fv(materialDif, object.materialDif);
    gl.uniform3fv(materialSpe, object.materialSpec);
    gl.uniform1f(shininess, object.shininess);
}
function uploadMatrix(program, id, matrix) {
    gl.useProgram(program);
    const m = gl.getUniformLocation(program, id);
    gl.uniformMatrix4fv(m, false, flatten(matrix));
}

function uploadLights(program, id, lights) {
    gl.useProgram(program);
    const uNLights = gl.getUniformLocation(program, "uNLights");
    gl.uniform1i(uNLights, lights.length);
    for (let i = 0; i < lights.length; i++) {
        const lightAmb = gl.getUniformLocation(program, id + "[" + i + "].ambient");
        const lightDif = gl.getUniformLocation(program, id + "[" + i + "].diffuse");
        const lightSpec = gl.getUniformLocation(program, id + "[" + i + "].specular");
        const pos = gl.getUniformLocation(program, id + "[" + i + "].position");
        const lightPosition = gl.getUniformLocation(program, "lightsPositions[" + i + "]");
        gl.uniform3fv(lightAmb, lights[i].lightAmb);
        gl.uniform3fv(lightDif, lights[i].lightDif);
        gl.uniform3fv(lightSpec, lights[i].lightSpec);
        gl.uniform4fv(pos, lights[i].position);
        gl.uniform4fv(lightPosition, lights[i].position);
    }
}

function setup(shaders) {
    gl = setupWebGL(canvas);
    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    uColor = gl.getUniformLocation(program, "uColor")
    mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
    mView = lookAt([0, VP_DISTANCE / 4, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    loadMatrix(mView);
    mode = gl.TRIANGLES;
    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function (event) {
        switch (event.key) {
            case 'w':
                mode = gl.LINES;
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;

        }
    }
    gl.clearColor(0, 0, 0, 1.0);
    CYLINDER.init(gl);
    CUBE.init(gl);
    TORUS.init(gl);
    BUNNY.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    window.requestAnimationFrame(render);
}


function resize_canvas(event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
}

function uploadModelView() {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
}

function changeColor(color) {
    gl.uniform3fv(uColor, color);
}

function drawScene() {
    pushMatrix();
    multTranslation([0, -1, 0]);
    multScale([10, 0.5, 10])
    pushMatrix();
    changeColor(PLATFORM_COLOR);
    uploadObject(program, "uMaterial", platformMaterial);
    uploadMatrix(program, "mModelView", modelView());
    uploadMatrix(program, "mNormals", normalMatrix(modelView()));
    uploadModelView();
    CUBE.draw(gl, program, mode);
    popMatrix();
    pushMatrix();
    multTranslation([0.2, 2.5, -0.2]);
    multScale([0.2, 4, 0.2]);
    changeColor(CYLINDER_COLOR);
    uploadModelView();
    uploadObject(program, "uMaterial", cylinderMaterial);
    uploadMatrix(program, "mModelView", modelView());
    uploadMatrix(program, "mNormals", normalMatrix(modelView()));
    CYLINDER.draw(gl, program, mode);
    popMatrix();
    pushMatrix();
    multTranslation([-0.2, 2.5, -0.2]);
    multScale([0.2, 4, 0.2]);
    changeColor(CUBE_COLOR);
    uploadModelView();
    uploadObject(program, "uMaterial", cubeMaterial);
    uploadMatrix(program, "mModelView", modelView());
    uploadMatrix(program, "mNormals", normalMatrix(modelView()));
    CUBE.draw(gl, program, mode);
    popMatrix();
    pushMatrix();
    multTranslation([-0.2, 1.3, 0.2]);
    multScale([0.2, 4, 0.2]);
    changeColor(TORUS_COLOR);
    uploadModelView();
    uploadObject(program, "uMaterial", torusMaterial);
    uploadMatrix(program, "mModelView", modelView());
    uploadMatrix(program, "mNormals", normalMatrix(modelView()));
    TORUS.draw(gl, program, mode);
    popMatrix();
    pushMatrix();
    multTranslation([0.2, 0.5, 0.2]);
    multScale([2, 25, 2]);
    changeColor(BUNNY_COLOR);
    uploadObject(program, "uMaterial", bunnyMaterial);
    uploadMatrix(program, "mModelView", modelView());
    uploadMatrix(program, "mNormals", normalMatrix(modelView()));
    uploadModelView();
    BUNNY.draw(gl, program, mode);
    popMatrix();
    popMatrix();
}

function render() {
    time++;
    window.requestAnimationFrame(render);
    uploadLights(program, "uLights", lights)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawScene();
    gl.useProgram(program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    loadMatrix(mView);
}

/*x.addEventListener('input', function () {
    mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    mView = mult(mult(mView, rotateX(x.value)), rotateY(y.value));
})
y.addEventListener('input', function () {
    mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    mView = mult(mult(mView, rotateX(x.value)), rotateY(y.value));
})
*/


const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
