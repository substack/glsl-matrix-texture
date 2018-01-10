var regl = require('regl')({
  extensions: [ 'oes_standard_derivatives', 'oes_texture_float' ]
})
var camera = require('regl-camera')(regl,
  { distance: 5 })
var ch = require('conway-hart')
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var glsl = require('glslify')

var formulas = [
  'dO', 'aO', 'tC', 'tO', 'eO', 'taO', 'sO',
  'O', 'jO', 'kO', 'dtO', 'oO', 'mO', 'gO'
]
var N = formulas.length
var matrices = new Float32Array(16*N)
var offsets = new Float32Array(3*N)
var rotations = new Float32Array(4*N)

var tmpv = new Float32Array(3)
var tmpm = new Float32Array(16)

for (var i = 0; i < N; i++) {
  var r = i/N * 20
  var theta = i/N*2*Math.PI
  offsets[i*3+0] = Math.cos(theta)*r
  offsets[i*3+1] = Math.sin(theta)*r
  offsets[i*3+2] = 0
  vec3.random(tmpv, 1.0)
  rotations[i*4+0] = tmpv[0]
  rotations[i*4+1] = tmpv[1]
  rotations[i*4+2] = tmpv[2]
  rotations[i*4+3] = 1
}

function update (time) {
  for (var i = 0; i < N; i++) {
    //var m = matrices.subarray(i*16,i*16+16)
    tmpv[0] = rotations[i*4+0]
    tmpv[1] = rotations[i*4+1]
    tmpv[2] = rotations[i*4+2]
    var rspeed = rotations[i*4+3]
    mat4.identity(tmpm)
    mat4.rotate(tmpm, tmpm, time*rspeed, tmpv)
    copy(matrices, i, tmpm)
  }
}

function copy (dst, i, src) {
  dst[i*16+0] = src[0]
  dst[i*16+1] = src[1]
  dst[i*16+2] = src[2]
  dst[i*16+3] = src[3]
  dst[i*16+4] = src[4]
  dst[i*16+5] = src[5]
  dst[i*16+6] = src[6]
  dst[i*16+7] = src[7]
  dst[i*16+8] = src[8]
  dst[i*16+9] = src[9]
  dst[i*16+10] = src[10]
  dst[i*16+11] = src[11]
  dst[i*16+12] = src[12]
  dst[i*16+13] = src[13]
  dst[i*16+14] = src[14]
  dst[i*16+15] = src[15]
}

var mesh = { positions: [], cells: [], ids: [] }
for (var i = 0; i < formulas.length; i++) {
  var offset = mesh.positions.length
  var m = ch(formulas[i])
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

var mtex = regl.texture({
  width: matrices.length/4,
  height: 1,
  format: 'rgba',
  wrapS: 'clamp',
  wrapT: 'clamp',
  data: matrices
})

var draw = regl({
  frag: glsl`
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    #pragma glslify: faceNormal = require('glsl-face-normal')
    varying vec3 vpos;
    void main () {
      vec3 fnorm = faceNormal(vpos);
      gl_FragColor = vec4(fnorm*0.5+0.5,1);
    }
  `,
  vert: glsl`
    precision highp float;
    uniform mat4 projection, view;
    uniform sampler2D mtex;
    attribute vec3 position;
    attribute float id;
    varying vec3 vpos;
    void main () {
      float w = ${(N*4-1).toFixed(1)};
      float ix = id*4.0;
      mat4 model = mat4(
        texture2D(mtex,vec2((ix+0.0)/w,0.0)),
        texture2D(mtex,vec2((ix+1.0)/w,0.0)),
        texture2D(mtex,vec2((ix+2.0)/w,0.0)),
        texture2D(mtex,vec2((ix+3.0)/w,0.0))
      );
      vpos = position;
      gl_Position = projection * view * model * vec4(position,1);
    }
  `,
  attributes: {
    position: mesh.positions,
    id: mesh.ids
  },
  uniforms: {
    mtex: mtex
  },
  elements: mesh.cells
})

regl.frame(function (context) {
  update(context.time)
  mtex.subimage(matrices)
  camera(function () {
    draw()
  })
})