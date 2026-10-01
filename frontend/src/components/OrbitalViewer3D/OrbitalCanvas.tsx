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

  const isPointCloud = Boolean(data && data.vertices.length > 0 && data.faces.length === 0);

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

    let orbitalMaterial: THREE.Material | null = null;
    let edgeGeometry: THREE.BufferGeometry | null = null;
    let edgeMaterial: THREE.Material | null = null;

    if (positions.length > 0) {
      if (indices.length > 0) {
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        const meshMaterial = new THREE.MeshStandardMaterial({
          color: '#38bdf8',
          emissive: '#0284c7',
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.72,
          roughness: 0.25,
          metalness: 0.15,
          side: THREE.DoubleSide,
        });
        orbitalMaterial = meshMaterial;
        orbitalGroup.add(new THREE.Mesh(geometry, meshMaterial));

        edgeGeometry = new THREE.EdgesGeometry(geometry, 25);
        edgeMaterial = new THREE.LineBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.25 });
        orbitalGroup.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
      } else {
        // Defensive handling: when faces are 0 but vertices exist, render a glowing point cloud
        const pointsMaterial = new THREE.PointsMaterial({
          color: '#38bdf8',
          size: 0.06,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        orbitalMaterial = pointsMaterial;
        orbitalGroup.add(new THREE.Points(geometry, pointsMaterial));
      }
    }

    const nucleusGeometry = new THREE.SphereGeometry(0.12, 20, 14);
    const nucleusMaterial = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#b45309',
      emissiveIntensity: 0.85,
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    orbitalGroup.add(nucleus);
    scene.add(orbitalGroup);

    const axes = new THREE.AxesHelper(1.8);
    const axesMaterial = axes.material as THREE.Material;
    axesMaterial.transparent = true;
    axesMaterial.opacity = 0.24;
    scene.add(axes);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
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
      orbitalMaterial?.dispose();
      edgeGeometry?.dispose();
      edgeMaterial?.dispose();
      nucleusGeometry.dispose();
      nucleusMaterial.dispose();
      axes.geometry.dispose();
      axesMaterial.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [data]);

  const handleOpenMolBuilder = () => {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
    window.open(`http://${host}:5174`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="three-stage orbital-stage" ref={mountRef}>
      <div className="three-hud">
        <span><Atom size={14} /> {label}</span>
        <span className="hud-chip">{isPointCloud ? 'Nube de puntos |ψ|²' : '|ψ|² / 90%'}</span>
      </div>
      <div className="three-help"><MousePointer2 size={13} /> Arrastra para orbitar · rueda para zoom</div>
      {isPointCloud && (
        <div
          style={{
            position: 'absolute',
            left: '14px',
            bottom: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#38bdf8',
            fontSize: '9.5px',
            background: 'rgba(8, 21, 26, 0.85)',
            padding: '3px 8px',
            borderRadius: '3px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            pointerEvents: 'none',
          }}
        >
          <Atom size={12} />
          <span>Modo probabilístico: renderizando nube de puntos</span>
        </div>
      )}
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
      {renderError ? (
        <div className="three-state error"><AlertTriangle size={22} /><span>{renderError}</span></div>
      ) : loading ? (
        <div className="three-state"><LoaderCircle className="spin" size={23} /><span>Generando isosuperficie…</span></div>
      ) : error ? (
        <div className="three-state error"><AlertTriangle size={22} /><span>{error}</span></div>
      ) : null}
    </div>
  );
}
