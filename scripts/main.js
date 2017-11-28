"use strict";

var gl;
var T,R;
var uMlocation;

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
    T = mat4.create();
    R = mat4.create();

    // przyporzadkowanie ubi do ubb
    let color_ubb = 0;
    gl.uniformBlockBinding(program, color_ubi, color_ubb);

    // dane o wierzcholkach
    var vertices = new Float32Array([-0.5, 0.0, 0.0,
                    0.5, 0.0, 0.0,
                    0.0, 0.5, 0.0]);
    var x = 0; //x coordinate for the center of the hexagon
    var y = 0; //y coordinate for the center of the hexagon
    var z = 0; //z coordinate for the center of the hexagon
    var r = .5; //radius of the circle upon which the vertices of the hexagon lie.
    var q = Math.sqrt(Math.pow(r,2) - Math.pow((r/2),2)); //y coordinate of the points that are above and below center point
    var xCoord = new Float32Array(8);
    var yCoord = new Float32Array(8);
    var zCoord = new Float32Array(8);
    xCoord[0] = x;
    yCoord[0] = y;
    zCoord[0] = z;
    xCoord[1] = x + r;
    yCoord[1] = y;
    zCoord[1] = z;
    xCoord[2] = x + (r/2);
    yCoord[2] = y+q;
    zCoord[2] = z;
    xCoord[3] = x-(r/2);
    yCoord[3] = y+q;
    zCoord[3] = z;
    xCoord[4] = x - r;
    yCoord[4] = y;
    zCoord[4] = z;
    xCoord[5] = x-(r/2);
    yCoord[5] = y-q;
    zCoord[5] = z;
    xCoord[6] = x + (r/2);
    yCoord[6] = y-q;
    zCoord[6] = z;

    var hex_vertices = [xCoord[0],yCoord[0],zCoord[0]];// Initialize Array

    for ( var i = 1; i < xCoord.length; ++i ) {
        hex_vertices.push(xCoord[i]);
        hex_vertices.push(yCoord[i]);
        hex_vertices.push(zCoord[i]);
        console.log("Coordinate " + i + ": " + xCoord[i] + "," + yCoord[i] + "," + zCoord[i]);
    }

    // tworzenie VBO
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(hex_vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // dane o indeksach
    var indices = new Uint16Array([0, 1, 2,
                        0, 2, 3,
                        0, 3, 4,
                        0, 4, 5,
                        0, 5, 6,
                        0, 6, 1]);

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
    var triangle_color = new Float32Array([1.0, 1.0, 0.0, 0.0]);

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

function draw()
{
    // wyczyszczenie ekranu
    gl.clear(gl.COLOR_BUFFER_BIT);

    // wyslanie polecania rysowania do GPU (odpalenie shader-ow)
    //gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(draw);
}
var transform_counter = 0;
var rotate_counter = 0;
var onerev = 10000; // ms
var exTime = Date.now();
function update()
{

}
function transform()
{
    if (transform_counter == 0) {
        mat4.translate(T,T,[0,0.5,0]);
        gl.uniformMatrix4fv(uMlocation,false , T );
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);

        window.requestAnimationFrame(transform);
    }
    transform_counter++;
}
function rotate()
{
    if (rotate_counter == 0) {
        mat4.rotate(R,R,Math.PI/2, [0,0,1]);
        gl.uniformMatrix4fv(uMlocation,false , R );
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);

        window.requestAnimationFrame(rotate);
    }
    rotate_counter++;
}

function main()
{
    init();
    draw();
    transform();
    rotate();
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
    // "location" musi byc takie same jak po stronie CPU!!!
    "layout(location = 0) in vec4 vertex_position;\n" +
    "void main()\n" +
    "{\n" +
        "gl_Position = uM*vertex_position;\n" +
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
