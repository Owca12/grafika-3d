"use strict";

var gl;
var T,R,P,V;
var uMlocation, Plocation, Vlocation;

function init()
{
    // inicjalizacja webg2
    try {
        let canvas = document.querySelector("#glcanvas");
        gl = canvas.getContext("webgl2");
    }
    catch(e) {
    }

    if (!gl)
    {
        alert("Unable to initialize WebGL.");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // kompilacja shader-ow
    var vertex_shader = createShader(gl, gl.VERTEX_SHADER, vs_source);
    var fragment_shader = createShader(gl, gl.FRAGMENT_SHADER, fs_source);
    var program = createProgram(gl, vertex_shader, fragment_shader);

    // pobranie ubi
    var color_ubi = gl.getUniformBlockIndex(program, "TriangleColor");
    uMlocation = gl.getUniformLocation(program,'uM');
    Plocation = gl.getUniformLocation(program,'P');
    Vlocation = gl.getUniformLocation(program,'V');
    T = mat4.create();
    R = mat4.create();
    P = mat4.create();
    V = mat4.create();
    mat4.perspective(P, Math.PI/4, 1, 2, 6) // takie same jednostki jak w lookAT
    mat4.lookAt(V,[2, 2, 3],[0.0, 0.0, 0.0],[0, 1, 0])

    // przyporzadkowanie ubi do ubb
    let color_ubb = 0;
    gl.uniformBlockBinding(program, color_ubi, color_ubb);

var vertices = new Float32Array( [
        // Front face
        0, 0, 1, // 0
        0, 1, 0, // 1
        1, 0, 0, // 2
        // Back face
        -1, 0, 0, // 3
        0, 0, -1, // 4
        0, 1, 0, // 1
        // Left face
        0, 0, 1, // 0
        0, 1, 0, // 1
        -1, 0, 0, //3
        // Right face
        0, 0, -1, //4
        0, 1, 0, //1
        1, 0, 0, // 2
        // Base
        0, 0, -1, // 4
        0, 0, 1,  // 0
        1, 0, 0, // 2
        0, 0, -1, // 4
        0, 0, 1, // 0
        -1, 0, 0 // 3
]);

    // tworzenie VBO
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // dane o indeksach
    var indices = new Uint16Array([0, 2, 1,
                        4, 3, 1,
                        0, 3, 1,
                        4, 2, 1,
                        4, 0, 2,
                        4, 0, 3]);

    // tworzenie bufora indeksow
    var index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    let gpu_positions_attrib_location = 0; // musi być taka sama jak po stronie GPU!!!

    // tworzenie VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.enableVertexAttribArray(gpu_positions_attrib_location);
    gl.vertexAttribPointer(gpu_positions_attrib_location, 3, gl.FLOAT, gl.FALSE, 3*4, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // dane o kolorze
    var triangle_color = new Float32Array([0.0, 0.5, 0.5, 0.0]);

    // tworzenie UBO
    var color_ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, color_ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, triangle_color, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    // ustawienia danych dla funkcji draw*
    gl.useProgram(program);
    gl.uniformMatrix4fv(uMlocation,false , T );
    gl.bindVertexArray(vao);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, color_ubb, color_ubo);
}

var xAnimationCounter = 0;
var onerev = 10000; // ms
var exTime = Date.now();
function draw()
{
    // wyczyszczenie ekranu
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(uMlocation,false , T );
    gl.uniformMatrix4fv(Plocation,false , P );
    if ( xAnimationCounter == 0) {
        mat4.rotate(V,V,-Math.PI/4, [1,0,0]);
    }
    var now = Date.now();
    var elapsed = now - exTime;
    exTime = now;
    var angle = Math.PI * 2 * elapsed/onerev;
    mat4.rotate(V,V,angle, [0,1,0]);
    gl.uniformMatrix4fv(Vlocation,false , V );
    xAnimationCounter++;

    // wyslanie polecania rysowania do GPU (odpalenie shader-ow)
    //gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);

    
}
function update()
{
    window.requestAnimationFrame(update);
    draw();
}

function main()
{
    init();
    update();
    //transform();
    //rotate();
};

function createShader(gl, type, source)
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success)
    {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertex_shader, fragment_shader)
{
    var program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(success)
    {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// vertex shader (GLSL)
var vs_source = "#version 300 es\n" +
    "uniform mat4 uM;\n" +
    "uniform mat4 P;\n" +
    "uniform mat4 V;\n" +
    // "location" musi byc takie same jak po stronie CPU!!!
    "layout(location = 0) in vec4 vertex_position;\n" +
    "void main()\n" +
    "{\n" +
        "gl_Position = P*V*uM*vertex_position;\n" +
    "}\n";

// fragment shader (GLSL)
var fs_source = "#version 300 es\n" +
    // fs nie ma domyślnej precyzji dla liczb zmiennoprzecinkowych więc musimy wybrać ją sami
    "precision mediump float;\n" +
    "out vec4 frag_color;\n" +
    "layout(std140) uniform TriangleColor\n" +
    "{\n" +
        "vec3 triangle_color;\n" +
    "};\n" +
    "void main()\n" +
    "{\n" +
        //"frag_color = vec4(1, 0, 0, 1);\n" +
        "frag_color = vec4(triangle_color, 1);\n" +
    "}\n";

main();
