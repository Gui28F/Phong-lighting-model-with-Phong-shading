import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "./libs/utils.js";
import { ortho, lookAt, flatten, vec3, vec4, mult, rotateY, rotateZ, perspective, inverse, rotateX, normalMatrix, transpose, subtract, length } from "./libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "./libs/stack.js";
import { GUI } from './libs/dat.gui.module.js';
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

let dx = 0;
let dy = 0;
let initialPos;
const PLATFORM_COLOR = [0.66, 0.46, 0.28];
const CYLINDER_COLOR = [0.18, 0.55, 0.34];
const CUBE_COLOR = [0.64, 0.19, 0.19];
const TORUS_COLOR = [0.13, 0.61, 0];
const BUNNY_COLOR = [1, 0.80, 0.86];

let lights = [
    {
        position: vec4(2.0, 0, 20, 1.0),
        lightAmb: vec3(40, 40, 40),
        lightDif: vec3(140, 140, 140),
        lightSpec: vec3(255, 255, 255),
        axis: vec4(0, -1, -10, 1),
        aperture: 5,
        cutoff: 10,
    },
    /*{
        position: vec4(0, 2, 0, 1.0),
        lightAmb: vec3(40, 40, 40),
        lightDif: vec3(140, 140, 140),
        lightSpec: vec3(200, 200, 200),
        axis: vec4(1,0,0,1),
        aperture: -1,
        cutoff: 1,
    },*/{
        position: vec4(0.0, 1, 0, .0),
        lightAmb: vec3(40, 40, 40),
        lightDif: vec3(70, 70, 70),
        lightSpec: vec3(100, 100, 100),
        axis: vec4(0, -1, -10, 1),
        aperture: -1,
        cutoff: 10,
    }
]


let platformMaterial = {
    materialAmb: vec3(0.66 * 255, 0.46 * 255, 0.28 * 255),
    materialDif: vec3(0.66 * 255, 0.46 * 255, 0.28 * 255),
    materialSpec: vec3(0.66 * 255, 0.46 * 255, 0.28 * 255),
    shininess: 1
}

let cubeMaterial = {
    materialAmb: vec3(0.64 * 255, 0.19 * 255, 0.19 * 255),
    materialDif: vec3(0.64 * 255, 0.19 * 255, 0.19 * 255),
    materialSpec: vec3(0.64 * 255, 0.19 * 255, 0.19 * 255),
    shininess: 1
}

let cylinderMaterial = {
    materialAmb: vec3(0.18 * 255, 0.55 * 255, 0.34 * 255),
    materialDif: vec3(0.18 * 255, 0.55 * 255, 0.34 * 255),
    materialSpec: vec3(0.18 * 255, 0.55 * 255, 0.34 * 255),
    shininess: 1
}

let torusMaterial = {
    materialAmb: vec3(0.0215 * 255, 0.8745 * 255, 0.0215 * 255),
    materialDif: vec3(0.07568 * 255, 0.51424 * 255, 0.07568 * 255),
    materialSpec: vec3(0.633 * 255, 0.727811 * 255, 0.633 * 255),
    shininess: 255
}

let bunnyMaterial = {
    materialAmb: vec3(230, 178, 178),
    materialDif: vec3(235, 149, 215),
    materialSpec: vec3(222, 154, 154),
    shininess: 255,
}

let ocultFace = {
    depthTest: true,
    cullFace: false
}

let visionVol = {
    fovy: 90,
    near: 1,
    far: 10
}

let cameraPos = {
    eyeX: 0, eyeY: VP_DISTANCE / 4, eyeZ: VP_DISTANCE,
    atX: 0, atY: 0, atZ: 0,
    upX: 0, upY: 1, upZ: 0,
}

let p1, mousedown, thetaI, phiI, dTheta, dPhi;
canvas.addEventListener("mousedown", function (event) {
    mousedown = true;
    p1 = [event.offsetX, event.offsetY];
    let v = subtract(vec3(cameraPos.eyeX, cameraPos.eyeY, cameraPos.eyeZ), vec3(cameraPos.atX, cameraPos.atY, cameraPos.atZ));
    let r = length(v);
    phiI = Math.asin(v[1] / r);
    thetaI = Math.asin(v[0] / (r * Math.cos(phiI)));
    if (v[2] < 0) thetaI = Math.PI - thetaI;
});

canvas.addEventListener("mousemove", function (event) {
    if (mousedown) {
        const p2 = [event.offsetX, event.offsetY];
        dTheta = p2[0] - p1[0];
        dPhi = p2[1] - p1[1];
        let v = subtract(vec3(cameraPos.eyeX, cameraPos.eyeY, cameraPos.eyeZ), vec3(cameraPos.atX, cameraPos.atY, cameraPos.atZ));
        let r = length(v);
        let theta = thetaI - dTheta/canvas.width;
        let phi = phiI + dPhi / canvas.height;
        phi = Math.min(phi, Math.max(phi, -Math.PI / 2), Math.PI / 2);
        cameraPos.eyeX = cameraPos.atX + r * Math.sin(theta) * Math.cos(phi);
        cameraPos.eyeY = cameraPos.atY + r * Math.sin(phi);
        cameraPos.eyeZ = cameraPos.atZ + r * Math.cos(theta) * Math.cos(phi);
        loadView();
    }
});

canvas.addEventListener("mouseup", function (event) {
    mousedown = false;
 
    
})

function normalizeColorArray(a) {
    return vec3(a[0] / 255, a[1] / 255, a[2] / 255);
}

function normalizeLightArray(a) {
    return vec3(a[0] / 200, a[1] / 200, a[2] / 200);
}
function uploadObject(program, id, object) {
    gl.useProgram(program);
    const materialAmb = gl.getUniformLocation(program, id + ".Ka");
    const materialDif = gl.getUniformLocation(program, id + ".Kd");
    const materialSpe = gl.getUniformLocation(program, id + ".Ks");
    const shininess = gl.getUniformLocation(program, id + ".shininess");
    gl.uniform3fv(materialAmb, normalizeColorArray(object.materialAmb));
    gl.uniform3fv(materialDif, normalizeColorArray(object.materialDif));
    gl.uniform3fv(materialSpe, normalizeColorArray(object.materialSpec));
    gl.uniform1f(shininess, object.shininess);
}
function uploadMatrix(program, id, matrix) {
    gl.useProgram(program);
    const m = gl.getUniformLocation(program, id);
    gl.uniformMatrix4fv(m, false, flatten(matrix));
}
/*intensity: 1,
        axis: vec3(0, 0, -1),
        aperture: 10,
        cutoff: 10,
    }*/
function uploadLights(program, id, lights) {
    gl.useProgram(program);
    const uNLights = gl.getUniformLocation(program, "uNLights");
    gl.uniform1i(uNLights, lights.length);
    for (let i = 0; i < lights.length; i++) {
        const lightAmb = gl.getUniformLocation(program, id + "[" + i + "].ambient");
        const lightDif = gl.getUniformLocation(program, id + "[" + i + "].diffuse");
        const lightSpec = gl.getUniformLocation(program, id + "[" + i + "].specular");
        const pos = gl.getUniformLocation(program, id + "[" + i + "].position");
        const axis = gl.getUniformLocation(program, id + "[" + i + "].axis");
        const aperture = gl.getUniformLocation(program, id + "[" + i + "].aperture");
        const cutoff = gl.getUniformLocation(program, id + "[" + i + "].cutoff");
        const lightPosition = gl.getUniformLocation(program, "lightsPositions[" + i + "]");

        gl.uniform3fv(lightAmb, normalizeColorArray(lights[i].lightAmb));
        gl.uniform3fv(lightDif, normalizeColorArray(lights[i].lightDif));
        gl.uniform3fv(lightSpec, normalizeColorArray(lights[i].lightSpec));
        //gl.uniform4fv(pos, mult(mView, lights[i].position));
        //gl.uniform4fv(axis, mult(inverse(transpose(mView)), lights[i].axis));
        gl.uniform4fv(pos, lights[i].position);
        gl.uniform4fv(axis, lights[i].axis);
        gl.uniform1f(aperture, lights[i].aperture);
        gl.uniform1f(cutoff, lights[i].cutoff);
        //gl.uniform4fv(lightPosition, mult(mView, lights[i].position));
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

    //gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    //gl.enable(gl.CULL_FACE);

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

function turnCullFace() {
    if (ocultFace.cullFace) gl.enable(gl.CULL_FACE);
    else gl.disable(gl.CULL_FACE);
}

function turnDepthBuffer() {
    if (ocultFace.depthTest) gl.enable(gl.DEPTH_TEST);
    else gl.disable(gl.DEPTH_TEST);
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    loadMatrix(mView);
    uploadLights(program, "uLights", lights)
    drawScene();
    gl.useProgram(program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    turnCullFace();
    turnDepthBuffer();

    //mProjection = perspective(visionVol.fovy, aspect, visionVol.near, visionVol.far);
}

/*x.addEventListener('input', function () {
    mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    mView = mult(mult(mView, rotateX(x.value)), rotateY(y.value));
})
y.addEventListener('input', function () {
    mView = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    mView = mult(mult(mView, rotateX(x.value)), rotateY(y.value));
})*/

function loadView() {
    mView = lookAt([cameraPos.eyeX, cameraPos.eyeY, cameraPos.eyeZ],
        [cameraPos.atX, cameraPos.atY, cameraPos.atZ], [cameraPos.upX, cameraPos.upY, cameraPos.upZ]);
    loadMatrix(mView);
}

function loadProjection() {
    mProjection = perspective(visionVol.fovy, aspect, visionVol.near, visionVol.far);
}

//Turn on/turn off ocult faces
const gui = new GUI();
const optionFolder = gui.addFolder('option');
optionFolder.add(ocultFace, 'cullFace').name('backface culling').onChange(function (value) {
    ocultFace.cullFace = value;
    console.log(value);
});
optionFolder.add(ocultFace, 'depthTest').name('depth test').onChange(function (value) {
    ocultFace.depthTest = value;
});

//Manipulate camera position and orientation
const cameraFolder = gui.addFolder('camera');
cameraFolder.add(visionVol, 'fovy', 0, 100).onChange(loadProjection);
cameraFolder.add(visionVol, 'near', 0, 20).onChange(loadProjection);
cameraFolder.add(visionVol, 'far', 0, 40).onChange(loadProjection);
//camera eye position
const eyeFolder = cameraFolder.addFolder('eye');
eyeFolder.add(cameraPos, 'eyeX', -10, 10).name('x').onChange(loadView);
eyeFolder.add(cameraPos, 'eyeY', -10, 10).name('y').onChange(loadView);
eyeFolder.add(cameraPos, 'eyeZ', -10, 10).name('z').onChange(loadView);
//camera at position
const atFolder = cameraFolder.addFolder('at');
atFolder.add(cameraPos, 'atX', -10, 10).name('x').onChange(loadView);
atFolder.add(cameraPos, 'atY', -10, 10).name('y').onChange(loadView);
atFolder.add(cameraPos, 'atZ', -10, 10).name('z').onChange(loadView);
//camera up position
const upFolder = cameraFolder.addFolder('up');

upFolder.add(cameraPos, 'upX', -1, 1).name('x').onChange(loadView);
upFolder.add(cameraPos, 'upY', -1, 1).name('y').onChange(loadView);
upFolder.add(cameraPos, 'upZ', -1, 1).name('z').onChange(loadView);




//Lights 
const lightsFolder = gui.addFolder('lights');
//Spotlight type
const light1Folder = lightsFolder.addFolder('light1');

const position1Folder = light1Folder.addFolder('position');
position1Folder.add(lights[0].position, '0', -10, 10).name('x').onChange(loadView);
position1Folder.add(lights[0].position, '1', -10, 10).name('y').onChange(loadView);
position1Folder.add(lights[0].position, '2', -10, 10).name('z').onChange(loadView);
position1Folder.add(lights[0].position, '3', 0, 1).name('w').onChange(loadView);
const intensities1Folter = light1Folder.addFolder('intensities');
intensities1Folter.addColor(lights[0], 'lightAmb').name('ambient');// da um warning
intensities1Folter.addColor(lights[0], 'lightDif').name('diffuse');// da um warning
intensities1Folter.addColor(lights[0], 'lightSpec').name('specular');// da um warning
const axis1Folder = light1Folder.addFolder('axis');
axis1Folder.add(lights[0].axis, '0', -10, 10).name('x').onChange(loadView);
axis1Folder.add(lights[0].axis, '1', -10, 10).name('y').onChange(loadView);
axis1Folder.add(lights[0].axis, '2', -10, 10).name('z').onChange(loadView);
light1Folder.add(lights[0], 'aperture', 0, 360).name('aperture').onChange(loadView);
light1Folder.add(lights[0], 'cutoff', 0, 100).name('cutoff').onChange(loadView);
//Change material characteristics
const materialFolder = gui.addFolder('material');
materialFolder.addColor(bunnyMaterial, 'materialAmb').name('Ka');// da um warning
materialFolder.addColor(bunnyMaterial, 'materialDif').name('Kd');// da um warning
materialFolder.addColor(bunnyMaterial, 'materialSpec').name('Ks');// da um warning
materialFolder.add(bunnyMaterial, 'shininess', 0, 100);

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
