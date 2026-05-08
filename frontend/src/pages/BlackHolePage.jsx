import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import {
    ArrowLeft,
    Info,
    Loader2,
    Maximize2,
    Minimize2,
    Pause,
    Play,
    RotateCcw,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import FloatingNavbar from '../components/FloatingNavbar';
import './BlackHolePage.css';

/* ═══════════════════════════════════════════════════════
   GLSL SHADERS  (extracted & refined from reference code)
   ═══════════════════════════════════════════════════════ */

const DiskVert = `
  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vRadius = length(position.xy);
    vAngle  = atan(position.y, position.x);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DiskFrag = `
  uniform float uTime;
  uniform vec3  uColorHot;
  uniform vec3  uColorMid1;
  uniform vec3  uColorMid2;
  uniform vec3  uColorMid3;
  uniform vec3  uColorOuter;
  uniform float uNoiseScale;
  uniform float uFlowSpeed;
  uniform float uDensity;
  uniform vec3  uCameraPosition;
  varying vec2  vUv;
  varying float vRadius;
  varying float vAngle;
  varying vec3  vWorldPosition;

  // 3D Simplex noise (GLSL port)
  vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289v3(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    float nr=smoothstep(1.5,8.,vRadius);
    float spiral=vAngle*3.5-(1./(nr+0.05))*3.;
    vec2 nuv=vec2(vUv.x+uTime*uFlowSpeed*(2./(vRadius*.4+.5))+sin(spiral)*.15,
                  vUv.y*.7+cos(spiral)*.15);
    float nv=snoise(vec3(nuv*uNoiseScale,uTime*.2));
    nv=(nv+1.)*.5;

    vec3 color=uColorOuter;
    color=mix(color,uColorMid3,smoothstep(0.,.3,nr));
    color=mix(color,uColorMid2,smoothstep(.25,.6,nr));
    color=mix(color,uColorMid1,smoothstep(.55,.85,nr));
    color=mix(color,uColorHot, smoothstep(.8,.98,nr));
    color*=(.4+nv*1.3);

    float brightness=pow(1.-nr,1.2)*4.+.3;
    brightness*=(.4+nv*2.5);

    vec3 viewDir=normalize(uCameraPosition-vWorldPosition);
    vec3 diskTangent=normalize(cross(vec3(0.,1.,0.),vWorldPosition));
    float doppler=dot(viewDir,diskTangent);
    brightness*=(1.+doppler*.6);
    color=mix(color,color*vec3(1.1,1.05,1.),smoothstep(0.,.5,doppler));
    color=mix(color,color*vec3(1.,.9,.8),smoothstep(0.,-.5,doppler));

    float pulse=sin(uTime*2.+nr*15.+vAngle*3.)*.1+.9;
    brightness*=pulse;

    float alpha=uDensity*(.1+nv*.9);
    alpha*=smoothstep(0.,.08,nr);
    alpha*=(1.-smoothstep(.9,1.,nr));
    alpha=clamp(alpha,0.,1.);

    gl_FragColor=vec4(color*brightness,alpha);
  }
`;

const HorizonVert = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main(){
    vNormal=normalize(normalMatrix*normal);
    vPosition=position;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  }
`;

const HorizonFrag = `
  uniform float uTime;
  uniform vec3  uCameraPosition;
  varying vec3  vNormal;
  varying vec3  vPosition;
  void main(){
    vec3 viewDirection=normalize(uCameraPosition-vPosition);
    float fresnel=1.-abs(dot(vNormal,viewDirection));
    fresnel=pow(fresnel,4.);
    vec3 glowColor=vec3(1.,.7,.4);
    float pulse=sin(uTime*2.)*.1+.9;
    float noise=sin(vPosition.x*10.+uTime)*sin(vPosition.y*10.-uTime)*.1;
    gl_FragColor=vec4(glowColor*(fresnel+noise)*pulse*1.5,fresnel*.8);
  }
`;

const LensingShader = {
    uniforms: {
        tDiffuse: { value: null },
        blackHoleScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
        lensingStrength: { value: 0.18 },
        lensingRadius: { value: 0.38 },
        aspectRatio: { value: 1.0 },
        chromaticAberration: { value: 0.008 },
    },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2  blackHoleScreenPos;
      uniform float lensingStrength;
      uniform float lensingRadius;
      uniform float aspectRatio;
      uniform float chromaticAberration;
      varying vec2 vUv;
      void main(){
        vec2 toCenter=vUv-blackHoleScreenPos;
        toCenter.x*=aspectRatio;
        float dist=length(toCenter);
        float da=lensingStrength/(dist*dist+0.01);
        da=clamp(da,0.,0.5);
        float falloff=smoothstep(lensingRadius,0.,dist);
        da*=falloff;
        vec2 offset=normalize(toCenter)*da;
        offset.x/=aspectRatio;
        float r=texture2D(tDiffuse,vUv-offset*(1.+chromaticAberration)).r;
        float g=texture2D(tDiffuse,vUv-offset).g;
        float b=texture2D(tDiffuse,vUv-offset*(1.-chromaticAberration)).b;
        gl_FragColor=vec4(r,g,b,1.);
      }`,
};

/* ═══════════════════════════════════════
   STAR FIELD  (background particle cloud)
   ═══════════════════════════════════════ */
function buildStarField(scene) {
    const N = 8000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const STAR_COLORS = [
        new THREE.Color(0xffeedd),
        new THREE.Color(0xaaccff),
        new THREE.Color(0xffffff),
        new THREE.Color(0xffddaa),
        new THREE.Color(0xddaaff),
    ];
    for (let i = 0; i < N; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 400 + Math.random() * 1200;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
        const c = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)].clone();
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.3);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
        size: 1.2,
        sizeAttenuation: true,
        vertexColors: true,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
    });
    scene.add(new THREE.Points(geo, mat));
}

/* ═════════════════════
   BUILD BLACK HOLE
   ═════════════════════ */
function buildBlackHole(scene) {
    const BH_R = 1.3;
    const DISK_IN = BH_R + 0.1;
    const DISK_OUT = 7.0;

    // ── Core (pure black sphere) ──
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(BH_R, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(core);

    // ── Event Horizon Glow (fresnel) ──
    const ehMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uCameraPosition: { value: new THREE.Vector3() },
        },
        vertexShader: HorizonVert,
        fragmentShader: HorizonFrag,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(BH_R * 1.02, 64, 64), ehMat));

    // ── Outer glow halo ──
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(BH_R * 3.5, 32, 32), haloMat));

    // ── Photon Ring (thin bright ring) ──
    const photonRingMat = new THREE.MeshBasicMaterial({
        color: 0xffa040,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const photonRing = new THREE.Mesh(
        new THREE.RingGeometry(BH_R * 1.45, BH_R * 1.52, 128),
        photonRingMat
    );
    photonRing.rotation.x = Math.PI / 3.5;
    scene.add(photonRing);

    // ── Accretion Disk ──
    const diskMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColorHot: { value: new THREE.Color(0xffffff) },
            uColorMid1: { value: new THREE.Color(0xffd700) },
            uColorMid2: { value: new THREE.Color(0xff8c00) },
            uColorMid3: { value: new THREE.Color(0x8b0000) },
            uColorOuter: { value: new THREE.Color(0x483d8b) },
            uNoiseScale: { value: 4.0 },
            uFlowSpeed: { value: 0.3 },
            uDensity: { value: 1.5 },
            uCameraPosition: { value: new THREE.Vector3() },
        },
        vertexShader: DiskVert,
        fragmentShader: DiskFrag,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
    });

    const disk = new THREE.Mesh(
        new THREE.RingGeometry(DISK_IN, DISK_OUT, 128, 64),
        diskMat
    );
    disk.rotation.x = Math.PI / 3.5;
    scene.add(disk);

    // ── Relativistic jet (top & bottom) ──
    const jetMat = new THREE.MeshBasicMaterial({
        color: 0x66aaff,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    [-1, 1].forEach(dir => {
        const jet = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 18, 32, 1, true),
            jetMat.clone()
        );
        jet.position.y = dir * 9;
        jet.rotation.z = dir === -1 ? Math.PI : 0;
        scene.add(jet);
    });

    return { ehMat, diskMat, disk };
}

/* ═══════════════════
   MAIN COMPONENT
   ═══════════════════ */
const BH_INFO = [
    { label: 'Mass', value: '4 Million M☉' },
    { label: 'Schwarzschild radius', value: '∼12 million km' },
    { label: 'Distance from Earth', value: '26,000 light-years' },
    { label: 'Disk temperature', value: '∼10⁷ K (inner edge)' },
    { label: 'Disk rotation', value: 'Near speed of light' },
    { label: 'Gravitational lensing', value: 'Bends light 360°+' },
];

export default function BlackHolePage() {
    const navigate = useNavigate();
    const mountRef = useRef(null);
    const frameRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    const pausedRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    /* ── Sync paused state to ref ── */
    useEffect(() => { pausedRef.current = paused; }, [paused]);

    /* ── Toggle browser fullscreen ── */
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            mountRef.current?.parentElement?.requestFullscreen?.();
            setFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setFullscreen(false);
        }
    };

    /* ═══════════════════════════════
       THREE.JS SCENE SETUP
       ═══════════════════════════════ */
    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        const W = el.clientWidth;
        const H = el.clientHeight;

        /* Scene */
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        /* Camera */
        const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 10000);
        camera.position.set(0, 8, 22);

        /* Renderer */
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        el.appendChild(renderer.domElement);

        /* Controls */
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.04;
        controls.minDistance = 4;
        controls.maxDistance = 120;
        controls.autoRotate = false;

        /* Lighting */
        scene.add(new THREE.AmbientLight(0xffffff, 0.15));
        const ptLight = new THREE.PointLight(0xff8800, 4, 60);
        scene.add(ptLight);

        /* Star field */
        buildStarField(scene);

        /* Black Hole */
        const { ehMat, diskMat, disk } = buildBlackHole(scene);

        /* Post-processing */
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.8, 0.5, 0.1);
        bloom.threshold = 0.1;
        bloom.strength = 1.6;
        bloom.radius = 0.6;
        composer.addPass(bloom);

        const lensingPass = new ShaderPass(LensingShader);
        lensingPass.uniforms.aspectRatio.value = W / H;
        composer.addPass(lensingPass);

        /* ── Animation Loop ── */
        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            const t = clockRef.current.getElapsedTime();

            if (!pausedRef.current) {
                const localCam = camera.position.clone();

                diskMat.uniforms.uTime.value = t;
                diskMat.uniforms.uCameraPosition.value.copy(localCam);
                ehMat.uniforms.uTime.value = t;
                ehMat.uniforms.uCameraPosition.value.copy(localCam);

                disk.rotation.z -= 0.004;

                /* Lensing update */
                const bhPos = new THREE.Vector3(0, 0, 0).project(camera);
                lensingPass.uniforms.blackHoleScreenPos.value.set(
                    (bhPos.x + 1) / 2,
                    (bhPos.y + 1) / 2
                );
                const dist = camera.position.length();
                const str = THREE.MathUtils.lerp(0.22, 0.04, Math.min(dist / 80, 1));
                lensingPass.uniforms.lensingStrength.value = str;
            }

            controls.update();
            composer.render();
        };
        animate();
        setLoading(false);

        /* Resize */
        const onResize = () => {
            const nW = el.clientWidth;
            const nH = el.clientHeight;
            camera.aspect = nW / nH;
            camera.updateProjectionMatrix();
            renderer.setSize(nW, nH);
            composer.setSize(nW, nH);
            lensingPass.uniforms.aspectRatio.value = nW / nH;
        };
        window.addEventListener('resize', onResize);

        /* Cleanup */
        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
    }, []);

    /* Reset camera */
    const handleReset = () => {
        clockRef.current = new THREE.Clock();
    };

    return (
        <div className="bh-page">
            <FloatingNavbar />

            {/* ── Canvas ── */}
            <div ref={mountRef} className="bh-canvas" />

            {/* ── Loading ── */}
            {loading && (
                <div className="bh-loading">
                    <Loader2 size={28} className="bh-spin" />
                    <span>Initialising Singularity...</span>
                </div>
            )}

            {/* ── Back button (top-left, below navbar) ── */}
            <button className="bh-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                <span>Back</span>
            </button>

            {/* ── Title strip ── */}
            <div className="bh-title">
                <h1>Black-Hole</h1>
                <span className="bh-subtitle">Supermassive Black Hole Simulation</span>
                <div className="bh-badge">LIVE RENDER</div>
            </div>

            {/* ── Controls bar ── */}
            <div className="bh-controls">
                <button
                    className={`bh-ctrl-btn ${paused ? 'active' : ''}`}
                    onClick={() => setPaused(p => !p)}
                    title={paused ? 'Resume' : 'Pause'}
                >
                    {paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                    <span>{paused ? 'Resume' : 'Pause'}</span>
                </button>

                <button className="bh-ctrl-btn" onClick={handleReset} title="Reset time">
                    <RotateCcw size={14} />
                    <span>Reset</span>
                </button>

                <button
                    className={`bh-ctrl-btn ${showInfo ? 'active' : ''}`}
                    onClick={() => setShowInfo(s => !s)}
                    title="Physics info"
                >
                    <Info size={14} />
                    <span>Info</span>
                </button>

                <button className="bh-ctrl-btn" onClick={toggleFullscreen} title="Fullscreen">
                    {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    <span>{fullscreen ? 'Exit' : 'Fullscreen'}</span>
                </button>
            </div>

            {/* ── Info Panel ── */}
            {showInfo && (
                <div className="bh-info-panel">
                    <div className="bh-info-header">
                        <span>Sagittarius A* — Properties</span>
                        <button onClick={() => setShowInfo(false)}><X size={14} /></button>
                    </div>
                    <ul className="bh-info-list">
                        {BH_INFO.map(({ label, value }) => (
                            <li key={label}>
                                <span className="bh-info-label">{label}</span>
                                <span className="bh-info-value">{value}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="bh-info-note">
                        Sizes scaled for visual clarity. Accretion disk dynamics, Doppler beaming,
                        gravitational lensing, and chromatic aberration are physically simulated.
                    </p>
                </div>
            )}

            {/* ── Orbit hint ── */}
            <div className="bh-hint">
                Drag to orbit &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Right-drag to pan
            </div>
        </div>
    );
}
