import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "./libs/utils.js";
import { ortho, lookAt, flatten, vec3, vec4, mult, rotateY, perspective, inverse, rotateX, normalMatrix } from "./libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "./libs/stack.js";
import * as CYLINDER from './libs/objects/cylinder.js';
import * as SPHERE from './libs/objects/sphere.js';
import * as CUBE from './libs/objects/cube.js';

const GROUND_COLOR = vec3(1, 0.8, 0.7);

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

let lights = [
    {
        position: vec4(10, 10, 0, 1),
        lightAmb: vec3(0.2, 0.2, 0.2),
        lightDif: vec3(0.7, 0.7, 0.7),
        lightSpec: vec3(1.0, 1.0, 1.0),
    }
]
let redMaterial = {
    materialAmb: vec3(0.2, 0.2, 0.2),
    materialDif: vec3(0.2, 0.2, 0.2),
    materialSpec: vec3(0.2, 0.2, 0.2),
    shininess: 2
}

let blackMaterial = {
    materialAmb: vec3(0.2, 0.2, 0.2),
    materialDif: vec3(0.2, 0.2, 0.2),
    materialSpec: vec3(0.1, 0.1, 0.11),
    shininess: 1
}

let blueMaterial = {
    materialAmb: vec3(0.2, 0.2, 0.2),
    materialDif: vec3(0.1, 0, 0),
    materialSpec: vec3(0.1, 0.1, 0.11),
    shininess: 1
}

function uploadObject(program, id, object) {
    gl.useProgram(program);
    const materialAmb = gl.getUniformLocation(program, id + ".materialAmb");
    const materialDif = gl.getUniformLocation(program, id + ".materialDif");
    const materialSpe = gl.getUniformLocation(program, id + ".materialSpec");
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
    for (let i = 0; i < lights.length; i++) {
        const lightAmb = gl.getUniformLocation(program, id + "[" + i + "].lightAmb");
        const lightDif = gl.getUniformLocation(program, id + "[" + i + "].lightDif");
        const lightSpec = gl.getUniformLocation(program, id + "[" + i + "].lightSpec");
        const lightPosition = gl.getUniformLocation(program, "lightsPositions[" + i + "]");
        gl.uniform3fv(lightAmb, lights[i].lightAmb);
        gl.uniform3fv(lightDif, lights[i].lightDif);
        gl.uniform3fv(lightSpec, lights[i].lightSpec);
        gl.uniform4fv(lightPosition, lights[i].position);
    }
}

function setup(shaders) {
    gl = setupWebGL(canvas);
    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    uColor = gl.getUniformLocation(program, "uColor")
    mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
    mView = lookAt([0, VP_DISTANCE /4, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
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
    SPHERE.init(gl);
    CUBE.init(gl);
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
