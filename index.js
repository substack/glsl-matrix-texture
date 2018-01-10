module.exports = function (opts) {
  if (typeof opts === 'number') opts = { count: opts }
  var N = opts.count
  var width = opts.width
  var height = opts.height
  if (width === undefined && height === undefined) {
    var sqN = Math.sqrt(N)
    var fN = Math.floor(sqN)
    for (var w = fN-fN%8; w<=N; w+=8) {
      var h = N/w
      if (Math.floor(h) === h) {
        width = w
        height = h
        break
      }
    }
  } else if (width === undefined) {
    width = N / height
    if (width !== Math.floor(width)) {
      throw new Error('inferred width is not an integer')
    }
  } else if (height === undefined) {
    height = N / width
    if (height !== Math.floor(height)) {
      throw new Error('inferred height is not an integer')
    }
  }
  if (width % 8 !== 0) {
    throw new Error('width must be a multiple of 8')
  }
  if (width*height !== N) {
    throw new Error('width * height must equal count')
  }
  return {
    width: width*2,
    height: height*2
  }
}
