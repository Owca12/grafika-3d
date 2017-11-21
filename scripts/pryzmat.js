"use strict";

var gl, vertex_ubb, vertex_ubo, vertex_uniform_id;
var T,R,P,V,uM, transformation_matrix, lz_camera = 0.0;
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
	var vertex_ubi = gl.getUniformBlockIndex(program, "Metrices");
    T = mat4.create();
    R = mat4.create();
    P = mat4.create();
    V = mat4.create();
	uM = mat4.create();
    mat4.perspective(P, Math.PI/2, 1, 1, 20) // takie same jednostki jak w lookAT
    mat4.lookAt(V,[3, 2, 3 - lz_camera ],[3, 0.0, 0 - lz_camera],[0, 1, 0])

    // przyporzadkowanie ubi do ubb
    let color_ubb = 0;
    gl.uniformBlockBinding(program, color_ubi, color_ubb);
	//let vertex_ubb = 0;
    //gl.uniformBlockBinding(program, vertex_ubi, vertex_ubb);
	

	var vertices = new Float32Array( [
        // Front face
        0, 0, 0.3, // 0
        0, 0.3, 0, // 1
        0.3, 0, 0, // 2
        // Back face
        -0.3, 0, 0, // 3
        0, 0, -0.3, // 4

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
	transformation_matrix = new Float32Array(48);
	
	var i = 0;
	for (i=0;i<16;i++)
	{
		console.log("P number: " + i + "and value: " + P[i]);
	}
	for (i = 0; i < 16; i++) 
	{
		transformation_matrix[i] = P[i];
	}
	
	for (i = 0; i < 16; i++)
	{
		transformation_matrix[16+i] = V[i];
	}
	
	for (i = 0; i < 16; i++)
	{
		transformation_matrix[32+i] = uM[i];
	}
	
	console.log("Cheking transformation array");
	for (i=0;i<48;i++)
	{
		console.log("Variable number: " + i + "and value: " + transformation_matrix[i]);
	}

    // tworzenie UBO
    var color_ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, color_ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, triangle_color, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
	
	// tworzenie UBO
    vertex_ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, vertex_ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, transformation_matrix, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    // ustawienia danych dla funkcji draw*
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, color_ubb, color_ubo);
	gl.bindBufferBase(gl.UNIFORM_BUFFER, vertex_ubb, vertex_ubo);
}

var xAnimationCounter = 0;
var onerev = 1000; // ms
var exTime = Date.now();
function draw()
{
    // wyczyszczenie ekranu
    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.uniformMatrix4fv(uMlocation,false , T );
    //gl.uniformMatrix4fv(Plocation,false , P );
    if ( xAnimationCounter == 0) {
       mat4.rotate(V,V,-Math.PI/4, [1,0,0]);
    }
    var now = Date.now();
    var elapsed = now - exTime;
    exTime = now;
    var angle = Math.PI * 2 * elapsed/onerev;
    mat4.rotate(V,V,angle, [0,1,0]);
	
	transformation_matrix.set(V,16);
	
    xAnimationCounter++;
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, transformation_matrix, 0, 48);
	
    gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);  
}
function update()
{
    window.requestAnimationFrame(update);
    draw();
}
var counter = 0;
function draw_grid()
{
	if (counter == 0)
	{
		mat4.rotate(V,V,Math.PI/2, [0,1,0]);
		transformation_matrix.set(V,16);
		gl.bufferSubData(gl.UNIFORM_BUFFER, 0, transformation_matrix, 0, 48);
	}
	var i,j;
	for (i=0;i<10;i++) {
		for (j=0;j<10;j++) {
			var inner_T = mat4.create();
			mat4.translate(inner_T,inner_T,[1*j+i*1,0,1*i]);
			transformation_matrix.set(inner_T,32);
			gl.bufferSubData(gl.UNIFORM_BUFFER, 0, transformation_matrix, 0, 48);
			gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0); 
		}
	}
	var R = 2/3 * 0.3 * Math.sqrt(3) / 2;
	for (i=0;i<10;i++) {
		for (j=0;j<10;j++) {
			var inner_T = mat4.create();
			mat4.translate(inner_T,inner_T,[1*j+i*1,0.6,1*i]);
			mat4.rotate(inner_T,inner_T,Math.PI, [0,0,1]);
			transformation_matrix.set(inner_T,32);
			gl.bufferSubData(gl.UNIFORM_BUFFER, 0, transformation_matrix, 0, 48);
			gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0); 
		}
	}
}

function animate_grid()
{
	var now = Date.now();
    var elapsed = now - exTime;
    exTime = now;
	//lz_camera += 0.1 * elapsed/onerev;
    counter++;
	draw_grid()
}
function update_grid()
{
	var now = Date.now();
    var elapsed = now - exTime;
    exTime = now;
	lz_camera += 0.1 * elapsed/onerev;
	mat4.lookAt(V,[3, 2, 3 - lz_camera ],[3, 0.0, 0 - lz_camera],[0, 1, 0])
	window.requestAnimationFrame(update_grid);
	counter++;
	draw_grid();
}

function main()
{
    init();
	//draw_grid();
	update_grid();
	//draw();
    //update();
	
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
    // "location" musi byc takie same jak po stronie CPU!!!
    "layout(location = 0) in vec4 vertex_position;\n" +
	"layout(std140) uniform Metrices\n" +
	"{\n" +
		"mat4 P;\n" +
		"mat4 V;\n" +
		"mat4 uM;\n" +
    "};\n" +
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

// load images:
// function loadImage(file) {
	// "use strict";
	// return new Promise(function (fulfill, reject))
// }	
	
main();
