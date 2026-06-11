import Phaser from 'phaser';

const GRAIN_FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  // 胶片颗粒
  float n = rand(outTexCoord * fract(uTime) * 100.0 + outTexCoord) - 0.5;
  c.rgb += n * 0.05;
  // 暗角
  vec2 d = outTexCoord - 0.5;
  c.rgb *= 1.0 - dot(d, d) * 0.6;
  gl_FragColor = c;
}
`;

const VHS_FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = outTexCoord;
  // 行抖动
  uv.x += sin(uv.y * 3.0 + uTime * 2.0) * 0.0015;
  // 色度溢出
  vec4 c;
  c.r = texture2D(uMainSampler, uv + vec2(0.0018, 0.0)).r;
  c.g = texture2D(uMainSampler, uv).g;
  c.b = texture2D(uMainSampler, uv - vec2(0.0018, 0.0)).b;
  c.a = 1.0;
  // 扫描线
  c.rgb -= sin(uv.y * 900.0) * 0.05;
  // 降饱和偏褐（2001时间线主调）
  float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb = mix(c.rgb, vec3(g * 1.05, g * 0.93, g * 0.78), 0.5);
  // 噪声
  c.rgb += (rand(uv * fract(uTime) * 100.0 + uv) - 0.5) * 0.08;
  gl_FragColor = c;
}
`;

export class GrainPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, fragShader: GRAIN_FRAG });
  }
  override onPreRender(): void {
    this.set1f('uTime', this.game.loop.time / 1000);
  }
}

export class VhsPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, fragShader: VHS_FRAG });
  }
  override onPreRender(): void {
    this.set1f('uTime', this.game.loop.time / 1000);
  }
}
