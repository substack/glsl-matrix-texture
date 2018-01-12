var glsl = require('glslify')
var mat4 = require('gl-mat4')
var regl = require('regl')({ extensions: [ 'oes_texture_float',
  'oes_standard_derivatives', 'oes_element_index_uint' ] })

var camera = require('regl-camera')(regl, { distance: 120, phi: 0.08 })

var N = 25000
var msize = require('../')(N)
var matrices = new Float32Array(msize.length)
var mtex = regl.texture({
  width: msize.width,
  height: msize.height,
  format: 'rgba',
  wrapS: 'clamp',
  wrapT: 'clamp',
  data: matrices
})

var tmpv = [0,0,0]
update()

function update (time) {
  for (var i = 0; i < N; i++) {
    var m = matrices.subarray(i*16,i*16+16)
    mat4.identity(m)
    var r = Math.sqrt(i/250)*40
    tmpv[0] = Math.cos(i/250*15)*r
    tmpv[1] = 0
    tmpv[2] = Math.sin(i/250*15)*r
    mat4.translate(m, m, tmpv)
    tmpv[0] = Math.sin(i/13*10+27)
    tmpv[1] = Math.sin(i/11*20+80)
    tmpv[2] = Math.sin(i/17*15-51)
    mat4.rotate(m, m, time*6.28+i/57, tmpv)
  }
}

var conwayHart = require('conway-hart')
var meshes = 'dO aO tC tO eO taO sO O jO kO dtO oO mO gO D'.split(' ')
  .map(function (formula) { return conwayHart(formula) })

var mesh = { positions: [], cells: [], ids: [] }
for (var i = 0; i < N; i++) {
  var z = mesh.positions.length
  var m = meshes[i%meshes.length]
  for (var j = 0; j < m.positions.length; j++) {
    mesh.positions.push(m.positions[j])
    mesh.ids.push(i)
  }
  for (var j = 0; j < m.cells.length; j++) {
    var n = m.cells[j].length
    for (var k = 2; k < n; k++) {
      mesh.cells.push([ m.cells[j][0]+z, m.cells[j][k-1]+z, m.cells[j][k-0]+z ])
    }
  }
}

var draw = regl({
  frag: glsl`
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    #pragma glslify: faceNormal = require('glsl-face-normal')
    varying vec3 vpos;
    void main () {
      vec3 fnorm = faceNormal(vpos);
      gl_FragColor = vec4(fnorm*0.4+0.6,1);
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
  regl.clear({ color: [0.95,0.93,0.98,1], depth: true })
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
