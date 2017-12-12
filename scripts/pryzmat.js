"use strict";


function Renderer(vertSrc, fragSrc)
{
	var gl, vertex_ubb, vertex_ubo, vertex_vm_ubo, vertex_uniform_id;
	var T,R,P,V,uM, transformation_matrix, VM_matrix;
	var uMlocation, Plocation, Vlocation;
	var vertex_shader_source = vertSrc;
	var fragment_shader_source = fragSrc;
	var normalMatrixLoc, lightPosLoc, attenuationLoc;
	var lightPos, attenuationVal;
	//const image = require('file-loader!./textura.png');
	const image = new Image();
	image.src = "board.jpg";

	function loadTexture(gl, url) {
	  const texture = gl.createTexture();
	  gl.bindTexture(gl.TEXTURE_2D, texture);

	  // Because images have to be download over the internet
	  // they might take a moment until they are ready.
	  // Until then put a single pixel in the texture so we can
	  // use it immediately. When the image has finished downloading
	  // we'll update the texture with the contents of the image.
	  const level = 0;
	  const internalFormat = gl.RGBA;
	  const width = 1;
	  const height = 1;
	  const border = 0;
	  const srcFormat = gl.RGBA;
	  const srcType = gl.UNSIGNED_BYTE;
	  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
	  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					width, height, border, srcFormat, srcType,
					pixel);

	  image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					  srcFormat, srcType, image);

		// WebGL1 has different requirements for power of 2 images
		// vs non power of 2 images so check if the image is a
		// power of 2 in both dimensions.
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
		   // Yes, it's a power of 2. Generate mips.
		   gl.generateMipmap(gl.TEXTURE_2D);
		} else {
		   // No, it's not a power of 2. Turn of mips and set
		   // wrapping to clamp to edge
		   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	  };
	  //image.src = url;

	  return texture;
	}

	function isPowerOf2(value) {
	  return (value & (value - 1)) == 0;
	}

	function init()
	{
		let canvas;
		// inicjalizacja webg2
		try {
			canvas = document.querySelector("#glcanvas");
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
		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW);
		gl.cullFace(gl.BACK);

		// kompilacja shader-ow
		var vertex_shader = createShader(gl, gl.VERTEX_SHADER, vertex_shader_source);
		var fragment_shader = createShader(gl, gl.FRAGMENT_SHADER, fragment_shader_source);
		var program = createProgram(gl, vertex_shader, fragment_shader);
		gl.useProgram(program);
			// Wczyywanie textury, zaraz po tym jak mam program
		const textLocation = gl.getUniformLocation(program, 'text');
		const text = loadTexture(gl, image);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, text);
		gl.uniform1i(textLocation, 0);
		// pobranie ubi
		//var color_ubi = gl.getUniformBlockIndex(program, "TriangleColor");
		var vertex_ubi = gl.getUniformBlockIndex(program, "Metrices");
		//var vertex_vm_ubi = gl.getUniformBlockIndex(program, "uVM");
		lightPosLoc = gl.getUniformLocation(program, 'lightPosition');
		normalMatrixLoc = gl.getUniformLocation(program, 'uNormal');
		attenuationLoc = gl.getUniformLocation(program, 'uAttenuationCoefficient');
		
		T = mat4.create();
		R = mat4.create();
		P = mat4.create();
		V = mat4.create();
		uM = mat4.create();
		var rad = Math.PI / 180.0 * 1;


    
		mat4.perspective(P, Math.PI/3, 1, 0.1, 100) // takie same jednostki jak w lookAT
		mat4.lookAt(V,[3, 10, 3],[0,0,0],[0, 0, 1])
		// mat4.lookAt(V,
               // 1.5*Math.cos(rad), 1.5*Math.sin(rad), 1.5, // eye
               // 0.0, 0.0, 0.0, // look at
               // 0.0, 0.0, 1.0); // up
		lightPos = vec3.fromValues(0, 10, 0);
		attenuationVal = vec3.fromValues(1,10,1);
		// przyporzadkowanie ubi do ubb
		// let color_ubb = 0;
		// gl.uniformBlockBinding(program, color_ubi, color_ubb);
		let vertex_ubb = 0;
		gl.uniformBlockBinding(program, vertex_ubi, vertex_ubb);
		// let vertex_vm_ubb = 0;
		// gl.uniformBlockBinding(program, vertex_vm_ubi, vertex_vm_ubb);

		var vertices = new Float32Array( [	
			0, 0, 1.5,     // 0
			-1.5, 0, 0,   // 1
			0, 0, -1.5,   // 2
			1.5, 0, 0,    // 3


		]);
		
		var normals = new Float32Array( [	
			0, 1, 0,     // 0
			0, 1, 0,   // 1
			0, 1, 0,   // 2
			0, 1, 0,    // 3
		]);
		
		var colors =  new Float32Array( [
			// Front face
			0, 0, 1, // 0
			1, 0, 1, // 1
			0, 0, 1, // 2
			// // Back face
			0, 0, 1, // 3
			0, 0, 1 // 4
		]);
		
		var texture_coordinates = [
		
			// 0,1,2
		// 0.0, 0.0,
		// 0.5,  0.5,
		// 1.0, 0.0,
		// 0.0,  1.0,
		// 1.0, 1.0,

		0.0, 0.0,
		1.0, 0.0,
		//0.5,  0.5,
		1.0,  1.0,
		0.0, 1.0
		// 2,3,0

		// 1.0,  1.0
		
		// // 0,2,1
		// 0.0,  0.0,
		// 1.0,  0.0,
		// 0.5,  1.0,

		// // 1,2,4
		// 0.0,  0.0,
		// 1.0,  0.0,
		// 0.5,  1.0,

		// // 2,3,4
		// 0.0,  0.0,
		// 1.0,  0.0,
		// 0.5,  1.0,

		// // 3, 0, 4
		// 0.0,  0.0,
		// 1.0,  0.0,
		// 0.5,  1.0,
	  ];

		// tworzenie VBO
		var vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		var color_vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
		gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		//texture VBO
		var texture_coord_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texture_coord_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_coordinates), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		//normals VBO
		var normal_coord_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normal_coord_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		// dane o indeksach
		var indices = new Uint16Array([
							2, 1, 0,
							0, 3, 2
							//0, 2, 1,
							//2, 4, 1,
							//4, 3, 1,
							//3, 0, 1,
							]);
		//var indices = new Uint16Array([0,2,1]); 

		// tworzenie bufora indeksow EBO
		var index_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		let gpu_positions_attrib_location = 0; // musi być taka sama jak po stronie GPU!!!

		// tworzenie VAO
		var vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.enableVertexAttribArray(gpu_positions_attrib_location);
		gl.vertexAttribPointer(gpu_positions_attrib_location, 3, gl.FLOAT, gl.FALSE, 3*4, 0);

		
		
		// var color_index = gl.getAttribLocation(program, "vertex_color");
		// gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
		// gl.enableVertexAttribArray(color_index);
		// gl.vertexAttribPointer(color_index, 3, gl.FLOAT, gl.FALSE, 3*4, 0);
		
		
		// gl.bindBuffer(gl.ARRAY_BUFFER, texture_coord_buffer);
		// gl.enableVertexAttribArray(textLocation);
		// gl.vertexAttribPointer(textLocation, 2, gl.FLOAT, gl.FALSE, 2*4, 0); // 1, 4, float, false, 4*4, 0
		
		gl.bindBuffer(gl.ARRAY_BUFFER, texture_coord_buffer);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 2*4, 0);
		
		// // takie same dla aVertexNormal
		gl.bindBuffer(gl.ARRAY_BUFFER, normal_coord_buffer);
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 3*4, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
		gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		
		transformation_matrix = new Float32Array(48);
		VM_matrix = new Float32Array(32);
		var i = 0;
		for (i=0;i<16;i++)
		{
		//	console.log("P number: " + i + "and value: " + P[i]);
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
		
		//console.log("Cheking transformation array");
		for (i=0;i<48;i++)
		{
			//console.log("Variable number: " + i + "and value: " + transformation_matrix[i]);
		}
		for (i=0; i<32; i++){
			VM_matrix[i] =  transformation_matrix[16 + i];
		}
			// tworzenie UBO
		vertex_ubo = gl.createBuffer();
		gl.bindBuffer(gl.UNIFORM_BUFFER, vertex_ubo);
		gl.bufferData(gl.UNIFORM_BUFFER, transformation_matrix, gl.DYNAMIC_DRAW);
		gl.bindBuffer(gl.UNIFORM_BUFFER, null);
		
		// tworzenie UBO dla VM
		// vertex_vm_ubo = gl.createBuffer();
		// gl.bindBuffer(gl.UNIFORM_BUFFER, vertex_vm_ubo);
		// gl.bufferData(gl.UNIFORM_BUFFER, VM_matrix, gl.DYNAMIC_DRAW);
		// gl.bindBuffer(gl.UNIFORM_BUFFER, null);
		

		
		gl.bindVertexArray(vao);
		gl.bindBufferBase(gl.UNIFORM_BUFFER, vertex_ubb, vertex_ubo);
	}

	var xAnimationCounter = 0;
	var onerev = 10000; // ms
	var exTime = Date.now();
	function draw()
	{
		// wyczyszczenie ekranu
		gl.clear(gl.COLOR_BUFFER_BIT);
		//gl.uniformMatrix4fv(uMlocation,false , T );
		//gl.uniformMatrix4fv(Plocation,false , P );
		if ( xAnimationCounter == 0) {
		   //mat4.rotate(uM,uM, -Math.PI/4, [1,0,0]);
		}
		var uVM = mat4.create();
		mat4.multiply(uVM,V,uM);
		var normalMatrix = new Float32Array(9);
		mat3.normalFromMat4(normalMatrix, uVM);
		//DEBUG
		var normal = vec3.create();
		vec3.transformMat3(normal,new Float32Array([1,0,0]),normalMatrix);
		// END DEBUG
		var i;
		if ( xAnimationCounter == 0) {
		for (i=0;i<9;i++)
		{
			//console.log("Normal number: " + i + "and value: " + normalMatrix[i]);
			//console.log("uVM number: " + i + "and value: " + uVM[i]);
			//console.log("Normal vector number: " + i + "and value: " + normal[i]);
		}
		}
		gl.uniformMatrix3fv(normalMatrixLoc, false, normalMatrix);
		
		var transformed = new Float32Array(3);
		vec3.transformMat4(transformed, lightPos, V);
		gl.uniform3fv(lightPosLoc, transformed);
		gl.uniform3fv(attenuationLoc, attenuationVal);
		
		//var now = Date.now();
		//var elapsed = now - exTime;
		//exTime = now;
		//var angle = Math.PI * 2 * elapsed/onerev;
		//mat4.rotate(uM,uM,angle, [0,1,0]);
		
		//transformation_matrix.set(uM,32);
		
		xAnimationCounter++;
		//gl.bufferSubData(gl.UNIFORM_BUFFER, 0, transformation_matrix, 0, 48);
		
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		window.requestAnimationFrame(draw);	

		
	}
	function update()
	{
		window.requestAnimationFrame(update);
		draw();
	}

	this.main = function main()
	{
		init();
		//update();
		draw();
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

		//console.log(gl.getShaderInfoLog(shader));
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

		//console.log(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
	}
}

// vertex shader (GLSL)
var vs_source = "#version 300 es\n" +
    // "location" musi byc takie same jak po stronie CPU!!!
    "layout(location = 0) in vec4 vertex_position;\n" +
	"layout(location = 1) in vec2 textureCoord; // !!!\n" +
	"out vec2 vert_frag_text_coord; // !!!\n" +
	"layout(std140) uniform Metrices\n" +
	"{\n" +
		"mat4 P;\n" +
		"mat4 V;\n" +
		"mat4 uM;\n" +
    "};\n" +
    "void main()\n" +
    "{\n" +
        "gl_Position = P*V*uM*vertex_position;\n" +
		"vert_frag_text_coord = textureCoord;\n" +
    "}\n";

// fragment shader (GLSL)
var fs_source = "#version 300 es\n" +
    // fs nie ma domyślnej precyzji dla liczb zmiennoprzecinkowych więc musimy wybrać ją sami
    "precision mediump float;\n" +
    "out vec4 frag_color;\n" +
	"in vec3 vert_frag_color;\n" +
	"in vec2 vert_frag_text_coord;\n" +
	"uniform sampler2D text;\n" +
    "void main()\n" +
    "{\n" +
        "frag_color = texture(text,vert_frag_text_coord);\n" +
    "}\n";

//main();
