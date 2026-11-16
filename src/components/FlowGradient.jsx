import { useEffect, useRef } from 'react'

// Animated WebGL gradient behind the front-page hero (Josh's FlowGradient, 16 Nov 2026,
// converted from TypeScript). Zero dependencies. Pauses when off screen or the tab is
// hidden; with reduced motion it draws one still frame. Without WebGL the canvas keeps
// its plain background colour.

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uC1, uC2, uC3;
uniform float uGrain, uScale, uBand, uAccent;

vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<3;i++){ v+=a*snoise(p); p*=1.9; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv; p.x *= uRes.x / uRes.y;

  float t = uTime * 0.05;
  vec2  m = (uMouse - 0.5) * 0.30;

  vec2 q = vec2(fbm(p*uScale + t + m), fbm(p*uScale + vec2(3.2,1.7) - t));
  float n = fbm(p*(uScale*1.22) + q*0.9) * 0.5 + 0.5;

  float band = 1.0 - smoothstep(0.0, uBand, abs(uv.y - 0.5));
  n = mix(0.5, n, band);

  vec3 col = mix(uC1, uC2, smoothstep(0.42, 0.72, n));
  col = mix(col, uC3, smoothstep(0.70, 0.95, n) * uAccent);

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
  col += (g - 0.5) * uGrain;

  gl_FragColor = vec4(col, 1.0);
}`

const hex = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
}

// Colours: blue and white (Josh, 16 Nov 2026). c1 = the near-white base, c2 = the light blue
// that does most of the visible flowing, c3 = strong blue, used sparingly at the peaks.
export function FlowGradient({
  c1 = '#F7F9FD',
  c2 = '#BFD3FF',
  c3 = '#1D4ED8',
  scale = 0.45,
  band = 0.62,
  accent = 0.22,
  grain = 0.035,
  maxDpr = 1.25,
  trackMouse = true,
  className = '',
}) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined

    const gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false })
    if (!gl) return undefined

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s)
        return null
      }
      return s
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return undefined

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined
    gl.useProgram(prog)

    // One oversized triangle covers the screen: cheaper than a quad.
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const U = (n) => gl.getUniformLocation(prog, n)
    const uRes = U('uRes')
    const uTime = U('uTime')
    const uMouse = U('uMouse')

    gl.uniform3fv(U('uC1'), hex(c1))
    gl.uniform3fv(U('uC2'), hex(c2))
    gl.uniform3fv(U('uC3'), hex(c3))
    gl.uniform1f(U('uGrain'), grain)
    gl.uniform1f(U('uScale'), scale)
    gl.uniform1f(U('uBand'), band)
    gl.uniform1f(U('uAccent'), accent)
    gl.uniform2f(uMouse, 0.5, 0.5)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    let raf = 0
    let visible = true
    let hidden = document.hidden
    const target = { x: 0.5, y: 0.5 }
    const cur = { x: 0.5, y: 0.5 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      const w = Math.max(1, Math.round(cv.clientWidth * dpr))
      const h = Math.max(1, Math.round(cv.clientHeight * dpr))
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
      }
      // Always pass the size: when this effect runs again on the same canvas (React does
      // that in development, and when a colour changes), the canvas already has its size,
      // and a shader that never gets uRes draws only the base colour.
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }

    const draw = (tSec) => {
      // Ease the pointer in; raw values make the gradient twitch.
      cur.x += (target.x - cur.x) * 0.06
      cur.y += (target.y - cur.y) * 0.06
      gl.uniform2f(uMouse, cur.x, cur.y)
      gl.uniform1f(uTime, tSec)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    resize()

    if (reduce) {
      draw(0)
    } else {
      const loop = (ms) => {
        raf = requestAnimationFrame(loop)
        if (!visible || hidden) return
        draw(ms / 1000)
      }
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      const r = cv.getBoundingClientRect()
      target.x = (e.clientX - r.left) / r.width
      target.y = 1 - (e.clientY - r.top) / r.height
    }
    const follow = trackMouse && fine && !reduce
    if (follow) window.addEventListener('pointermove', onMove, { passive: true })

    const onVis = () => {
      hidden = document.hidden
    }
    document.addEventListener('visibilitychange', onVis)

    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) draw(0)
    })
    ro.observe(cv)

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
      },
      { rootMargin: '100px' },
    )
    io.observe(cv)

    const onLost = (e) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
    }
    cv.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      if (follow) window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      cv.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
      io.disconnect()
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      // No loseContext() here: React can run this effect twice on the same canvas, and a
      // lost context never comes back. The browser frees it when the canvas goes away.
    }
  }, [c1, c2, c3, scale, band, accent, grain, maxDpr, trackMouse])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', background: c1 }}
    />
  )
}
