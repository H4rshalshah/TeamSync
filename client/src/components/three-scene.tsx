import { useEffect, useRef } from "react";
import * as THREE from "three";

const Scene3D = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 3, 4);
    scene.add(ambient, key);

    // Central glowing ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.035, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      emissive: 0x93c5fd,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.8;
    group.add(ring);

    // Outer ring
    const ring2Geo = new THREE.TorusGeometry(2.3, 0.02, 12, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      emissive: 0x93c5fd,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.4;
    ring2.rotation.z = 0.3;
    group.add(ring2);

    // Floating cubes
    const cubes: THREE.Mesh[] = [];
    const cubeColors = [0x93c5fd, 0xbfdbfe, 0xdbeafe, 0x60a5fa, 0x7dd3fc];
    for (let i = 0; i < 12; i++) {
      const size = 0.08 + Math.random() * 0.12;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({
        color: cubeColors[i % cubeColors.length],
        emissive: cubeColors[i % cubeColors.length],
        emissiveIntensity: 0.08,
        transparent: true,
        opacity: 0.35 + Math.random() * 0.25,
        metalness: 0.2,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 2.6 + Math.random() * 0.6;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2.5,
        Math.sin(angle) * radius * 0.4
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      cubes.push(mesh);
      group.add(mesh);
    }

    // Particles
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.015,
      transparent: true,
      opacity: 0.25,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Connection lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.06,
    });
    const linePoints: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      linePoints.push(new THREE.Vector3(
        Math.cos(angle) * 2.4,
        Math.sin(angle) * 0.8,
        Math.sin(angle) * 0.7
      ));
    }
    linePoints.push(linePoints[0].clone());
    const lineGeo2 = new THREE.BufferGeometry().setFromPoints(linePoints);
    const line = new THREE.Line(lineGeo2, lineMat);
    group.add(line);

    let startTime = performance.now();
    let frameId = 0;

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const animate = () => {
      const t = (performance.now() - startTime) / 1000;
      group.rotation.y = t * 0.18;
      group.rotation.x = Math.sin(t * 0.2) * 0.05;
      ring.rotation.z = t * 0.1;
      ring2.rotation.z = -t * 0.08;
      cubes.forEach((cube, i) => {
        cube.rotation.x += 0.005 + i * 0.0005;
        cube.rotation.y += 0.008;
      });
      particles.rotation.y = t * -0.03;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="sqh-scene-3d"
      aria-hidden="true"
    />
  );
};

export default Scene3D;
