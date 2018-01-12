var glsl = require('glslify')
var regl = require('regl')({
  extensions: [
    'oes_standard_derivatives',
    'oes_texture_float',
    'oes_element_index_uint'
  ]
})
var camera = require('regl-camera')(regl,
  { distance: 120, phi: 0.8 })
var ch = require('conway-hart')
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')

var formulas = [
  'dO', 'aO', 'tC', 'tO', 'eO', 'taO', 'sO',
  'O', 'jO', 'kO', 'dtO', 'oO', 'mO', 'gO', 'D'
]
var N = 250
var msize = require('../')(N)
var mtex = regl.texture({
  width: msize.width,
  height: msize.height,
  format: 'rgba',
  wrapS: 'clamp',
  wrapT: 'clamp',
  data: matrices
})

var matrices = new Float32Array(msize.length)
var rotations = new Float32Array(4*N)
var tmpv = new Float32Array(3)

for (var i = 0; i < N; i++) {
  vec3.random(tmpv, 1.0)
  rotations[i*4+0] = tmpv[0]
  rotations[i*4+1] = tmpv[1]
  rotations[i*4+2] = tmpv[2]
  rotations[i*4+3] = 1
}

function update (time) {
  var tau = Math.PI*2
  var n = formulas.length
  for (var i = 0; i < N; i++) {
    var m = matrices.subarray(i*16,i*16+16)
    var theta = i/n*2*Math.PI/3 + i/N
    var r = Math.pow(i/n,0.5) * 10
    mat4.identity(m)
    tmpv[0] = Math.sin(theta)*r
    tmpv[1] = (1-Math.pow(i/n,0.4))*2
      + Math.sin(theta/2+time*tau*0.5)*0.5 + 10
    tmpv[2] = Math.cos(theta)*r
    mat4.translate(m, m, tmpv)
    tmpv[0] = rotations[i*4+0]
    tmpv[1] = rotations[i*4+1]
    tmpv[2] = rotations[i*4+2]
    var rspeed = rotations[i*4+3]
      + theta/tau*0.2
    mat4.rotate(m, m, time*rspeed+i, tmpv)
  }
}

var mesh = { positions: [], cells: [], ids: [] }
for (var i = 0; i < N; i++) {
  var offset = mesh.positions.length
  var m = ch(formulas[i%formulas.length])
  for (var j = 0; j < m.positions.length; j++) {
    mesh.positions.push(m.positions[j])
    mesh.ids.push(i)
  }
  for (var j = 0; j < m.cells.length; j++) {
    var n = m.cells[j].length
    for (var k = 2; k < n; k++) {
      mesh.cells.push([
        m.cells[j][0]+offset,
        m.cells[j][k-1]+offset,
        m.cells[j][k-0]+offset
      ])
    }
  }
}

var draw = regl({
  frag: glsl`
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    #pragma glslify: faceNormal = require('glsl-face-normal')
    #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
    varying vec3 vpos;
    void main () {
      vec3 fnorm = faceNormal(vpos);
      vec3 color = hsl2rgb((fnorm*0.5+0.5)*vec3(1,0.8,0.5)+vec3(0,0.2,0.4));
      gl_FragColor = vec4(color,1);
    }
  `,
  vert: glsl`
    precision highp float;
    #pragma glslify: read_mat4 = require('../')
    uniform mat4 projection, view;
    uniform sampler2D mtex;
    uniform vec2 msize;
    attribute vec3 position;
    attribute float id;
    varying vec3 vpos;
    void main () {
      vpos = position;
      mat4 model = read_mat4(mtex, id, msize);
      gl_Position = projection * view * model * vec4(position,1);
    }
  `,
  attributes: {
    position: mesh.positions,
    id: mesh.ids
  },
  uniforms: {
    mtex: mtex,
    msize: [msize.width,msize.height]
  },
  elements: mesh.cells
})

regl.frame(function (context) {
  update(context.time)
  mtex({
    width: msize.width,
    height: msize.height,
    format: 'rgba',
    wrapS: 'clamp',
    wrapT: 'clamp',
    data: matrices
  })
  camera(function () { draw() })
})
