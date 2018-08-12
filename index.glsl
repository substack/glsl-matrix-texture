mat4 read_matrix (sampler2D tex, float i, vec2 size) {
  // Apply an offset so that the coordinate targets the center of the texel, otherwise the wrong texel might be read causing incorrect matrices
  float offset = 0.5; 
  float tx = mod(i * 4.0, size.x) + offset;
  float ty = floor(i * 4.0 / size.x) + offset;
  
  return mat4(
    texture2D(tex, vec2((tx + 0.0) / size.x, ty / size.y)),
    texture2D(tex, vec2((tx + 1.0) / size.x, ty / size.y)),
    texture2D(tex, vec2((tx + 2.0) / size.x, ty / size.y)),
    texture2D(tex, vec2((tx + 3.0) / size.x, ty / size.y))
  );
}
#pragma glslify: export(read_matrix)
