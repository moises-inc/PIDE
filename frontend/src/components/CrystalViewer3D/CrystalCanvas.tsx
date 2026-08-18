import { useEffect, useRef, useState } from 'react';
import { Box, LoaderCircle, MousePointer2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CrystalResponse } from '../../types/element';

interface CrystalCanvasProps {
  data: CrystalResponse | null;
  loading: boolean;
  error: string | null;
}

export function CrystalCanvas({ data, loading, error }: CrystalCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !data || data.atoms.length === 0) return undefined;
    setRenderError(null);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#08151a');
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(5, 4, 5.5);
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

    scene.add(new THREE.HemisphereLight('#b4eef1', '#081014', 2));
    const light = new THREE.PointLight('#eeb45c', 14, 24);
    light.position.set(4, 5, 5);
    scene.add(light);

    const cell = data.cell;
    const group = new THREE.Group();
    const scale = 2.45 / Math.max(cell.aAngstrom, cell.bAngstrom, cell.cAngstrom, 1);
    const center = new THREE.Vector3(cell.aAngstrom / 2, cell.bAngstrom / 2, cell.cAngstrom / 2);
    const pointFor = (position: [number, number, number]) => new THREE.Vector3(position[0], position[1], position[2]).sub(center).multiplyScalar(scale);

    const atomGeometry = new THREE.SphereGeometry(0.22, 20, 14);
    data.atoms.forEach((atom, index) => {
      const material = new THREE.MeshStandardMaterial({ color: index === 0 ? '#f0b65e' : '#42d5dd', emissive: index === 0 ? '#8e5316' : '#0b6b75', emissiveIntensity: 0.55, roughness: 0.32 });
      const sphere = new THREE.Mesh(atomGeometry, material);
      sphere.position.copy(pointFor(atom.position));
      sphere.scale.setScalar(index === 0 ? 1.08 : 0.82);
      group.add(sphere);
    });

    const bondPositions: number[] = [];
    data.bonds.forEach(([from, to]) => {
      const first = data.atoms[from];
      const second = data.atoms[to];
      if (!first || !second) return;
      bondPositions.push(...pointFor(first.position).toArray(), ...pointFor(second.position).toArray());
    });
    if (bondPositions.length > 0) {
      const bondGeometry = new THREE.BufferGeometry();
      bondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bondPositions, 3));
      group.add(new THREE.LineSegments(bondGeometry, new THREE.LineBasicMaterial({ color: '#8aaeb1', transparent: true, opacity: 0.65 })));
    }

    const corners = [
      [0, 0, 0], [cell.aAngstrom, 0, 0], [cell.aAngstrom, cell.bAngstrom, 0], [0, cell.bAngstrom, 0],
      [0, 0, cell.cAngstrom], [cell.aAngstrom, 0, cell.cAngstrom], [cell.aAngstrom, cell.bAngstrom, cell.cAngstrom], [0, cell.bAngstrom, cell.cAngstrom],
    ].map((corner) => pointFor(corner as [number, number, number]));
    const edgePairs = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const cellPositions: number[] = [];
    edgePairs.forEach(([from, to]) => cellPositions.push(...corners[from].toArray(), ...corners[to].toArray()));
    const cellGeometry = new THREE.BufferGeometry();
    cellGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cellPositions, 3));
    group.add(new THREE.LineSegments(cellGeometry, new THREE.LineBasicMaterial({ color: '#42d5dd', transparent: true, opacity: 0.38 })));
    scene.add(group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
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
      atomGeometry.dispose();
      cellGeometry.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [data]);

  return (
    <div className="three-stage crystal-stage" ref={mountRef}>
      <div className="three-hud"><span><Box size={14} /> {data?.lattice ?? 'Celda unitaria'}</span><span className="hud-chip">{data?.atoms.length ?? 0} átomos</span></div>
      <div className="three-help"><MousePointer2 size={13} /> Arrastra para orbitar · rueda para zoom</div>
      {renderError ? <div className="three-state error"><Box size={22} /><span>{renderError}</span></div> : loading ? <div className="three-state"><LoaderCircle className="spin" size={23} /><span>Construyendo celda…</span></div> : error && !data ? <div className="three-state error"><Box size={22} /><span>{error}</span></div> : data && data.atoms.length === 0 ? <div className="three-state"><Box size={22} /><span>La estructura cristalina no está disponible para este elemento.</span></div> : null}
    </div>
  );
}
