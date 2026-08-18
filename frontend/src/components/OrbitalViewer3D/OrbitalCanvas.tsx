import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Atom, LoaderCircle, MousePointer2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OrbitalResponse } from '../../types/element';

interface OrbitalCanvasProps {
  data: OrbitalResponse | null;
  loading: boolean;
  error: string | null;
  label: string;
}

export function OrbitalCanvas({ data, loading, error, label }: OrbitalCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !data) return undefined;
    setRenderError(null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#08151a');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.4, 2.8, 4.7);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setRenderError('WebGL no está disponible en este navegador.');
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor('#08151a', 1);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight('#9ceef2', '#081014', 2.2);
    scene.add(ambient);
    const keyLight = new THREE.PointLight('#f3bb61', 12, 20);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight('#42d8df', 8, 15);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    const orbitalGroup = new THREE.Group();
    const sourceVertices = data.vertices.length > 0 ? data.vertices.slice(0, 12000) : [];
    const positions = new Float32Array(sourceVertices.flatMap((vertex) => vertex));
    const indices = data.faces.filter((face) => face.every((index) => index < sourceVertices.length)).flatMap((face) => face);
    const geometry = new THREE.BufferGeometry();
    if (positions.length > 0) geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (indices.length > 0) geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const orbitalMaterial = new THREE.MeshStandardMaterial({
      color: '#54e2e7',
      emissive: '#0c7178',
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });
    if (positions.length > 0) orbitalGroup.add(new THREE.Mesh(geometry, orbitalMaterial));
    if (positions.length > 0 && indices.length > 0) {
      const edges = new THREE.EdgesGeometry(geometry, 25);
      orbitalGroup.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#b3fbf1', transparent: true, opacity: 0.18 })));
    }
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), new THREE.MeshStandardMaterial({ color: '#f1b55b', emissive: '#925c18', emissiveIntensity: 0.8 }));
    orbitalGroup.add(nucleus);
    scene.add(orbitalGroup);

    const axes = new THREE.AxesHelper(1.8);
    (axes.material as THREE.Material).transparent = true;
    (axes.material as THREE.Material).opacity = 0.24;
    scene.add(axes);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.6;
    controls.maxDistance = 8;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      geometry.dispose();
      orbitalMaterial.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [data]);

  return (
    <div className="three-stage orbital-stage" ref={mountRef}>
      <div className="three-hud"><span><Atom size={14} /> {label}</span><span className="hud-chip">|ψ|² / 90%</span></div>
      <div className="three-help"><MousePointer2 size={13} /> Arrastra para orbitar · rueda para zoom</div>
      {renderError ? <div className="three-state error"><AlertTriangle size={22} /><span>{renderError}</span></div> : loading ? <div className="three-state"><LoaderCircle className="spin" size={23} /><span>Generando isosuperficie…</span></div> : error && !data ? <div className="three-state error"><AlertTriangle size={22} /><span>{error}</span></div> : null}
    </div>
  );
}
