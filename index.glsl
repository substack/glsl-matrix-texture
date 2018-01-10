mat4 read_matrix (sampler2D tex, float i, vec2 size) {
  float w = size.x-1.0;
  float h = size.y-1.0;
  float tx = mod(i*4.0,size.x);
  float ty = floor(i*4.0/w);
  return mat4(
    texture2D(tex,vec2((tx+0.0)/w,ty/h)),
    texture2D(tex,vec2((tx+1.0)/w,ty/h)),
    texture2D(tex,vec2((tx+2.0)/w,ty/h)),
    texture2D(tex,vec2((tx+3.0)/w,ty/h))
  );
}
#pragma glslify: export(read_matrix)
