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
    camera.position.set(2.8, 2.2, 3.8);
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

    const ambient = new THREE.HemisphereLight('#9ceef2', '#081014', 2.5);
    scene.add(ambient);
    const keyLight = new THREE.PointLight('#f3bb61', 14, 22);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight('#42d8df', 10, 18);
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
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.72,
      roughness: 0.25,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    if (positions.length > 0) orbitalGroup.add(new THREE.Mesh(geometry, orbitalMaterial));
    if (positions.length > 0 && indices.length > 0) {
      const edges = new THREE.EdgesGeometry(geometry, 25);
      orbitalGroup.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.25 })));
    }
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#b45309', emissiveIntensity: 0.85 }));
    orbitalGroup.add(nucleus);
    scene.add(orbitalGroup);

    const axes = new THREE.AxesHelper(1.8);
    (axes.material as THREE.Material).transparent = true;
    (axes.material as THREE.Material).opacity = 0.24;
    scene.add(axes);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 10;
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

  const handleOpenMolBuilder = () => {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
    window.open(`http://${host}:5174`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="three-stage orbital-stage" ref={mountRef}>
      <div className="three-hud"><span><Atom size={14} /> {label}</span><span className="hud-chip">|ψ|² / 90%</span></div>
      <div className="three-help"><MousePointer2 size={13} /> Arrastra para orbitar · rueda para zoom</div>
      <button 
        type="button" 
        className="vcm-orbital-invite-banner" 
        onClick={handleOpenMolBuilder} 
        title="Abrir Taller Práctico VcM 3D MolBuilder en nueva pestaña"
      >
        <span className="vcm-invite-content">
          <span className="vcm-invite-icon">🧪</span>
          <span className="vcm-invite-text">
            <strong>Taller Práctico VcM 3D MolBuilder</strong>
            <small>¡Arma moléculas con kits físicos en el laboratorio escolar!</small>
          </span>
        </span>
        <span className="vcm-invite-cta">Entrar ↗</span>
      </button>
      {renderError ? <div className="three-state error"><AlertTriangle size={22} /><span>{renderError}</span></div> : loading ? <div className="three-state"><LoaderCircle className="spin" size={23} /><span>Generando isosuperficie…</span></div> : error && !data ? <div className="three-state error"><AlertTriangle size={22} /><span>{error}</span></div> : null}
    </div>
  );
}
