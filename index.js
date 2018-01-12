module.exports = function (N) {
  var sqN = Math.sqrt(N*4)
  var width = Math.ceil(sqN)
  width = width + (4-(width%4))%4
  var height = Math.ceil(N*4/width)
  return {
    width: width,
    height: height,
    length: width*height*4
  }
}
