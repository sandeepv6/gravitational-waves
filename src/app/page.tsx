"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Starry background using simple points
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starVertices = [];
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starVertices.push(x, y, z);
    }
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blackHoleGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const blackHole1 = new THREE.Mesh(blackHoleGeo, blackHoleMat);
    const blackHole2 = blackHole1.clone();
    scene.add(blackHole1, blackHole2);

    // Spacetime distortion grid
    const gridSize = 40;
    const segments = 100;
    const gridGeometry = new THREE.PlaneGeometry(
      gridSize,
      gridSize,
      segments,
      segments
    );
    gridGeometry.rotateX(-Math.PI / 2);
    const basePositions = gridGeometry.attributes.position.array.slice();

    const solidMaterial = new THREE.MeshBasicMaterial({
      color: 0x111144,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });

    const gridSolid = new THREE.Mesh(gridGeometry.clone(), solidMaterial);
    const gridWire = new THREE.Mesh(gridGeometry, wireframeMaterial);
    scene.add(gridSolid, gridWire);

    const spiralOrigins: { position: THREE.Vector3; birth: number }[] = [];

    const clock = new THREE.Clock();
    let lastEmit = 0;
    const emitInterval = 0.25;
    const maxWaves = 100;

    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const orbitRadius = 2;
      const orbitSpeed = 0.8;
      const angle = t * orbitSpeed;

      const pos1 = new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      );
      const pos2 = new THREE.Vector3(
        -Math.cos(angle) * orbitRadius,
        0,
        -Math.sin(angle) * orbitRadius
      );

      const vel1 = new THREE.Vector3(
        -Math.sin(angle),
        0,
        Math.cos(angle)
      ).multiplyScalar(orbitRadius * orbitSpeed);
      const vel2 = vel1.clone().multiplyScalar(-1);

      blackHole1.position.copy(pos1);
      blackHole2.position.copy(pos2);

      if (t - lastEmit > emitInterval) {
        const offsetDistance = 0.5;
        const spiralOrigin1 = pos1
          .clone()
          .add(vel1.clone().normalize().multiplyScalar(-offsetDistance));
        const spiralOrigin2 = pos2
          .clone()
          .add(vel2.clone().normalize().multiplyScalar(-offsetDistance));
        spiralOrigins.push({ position: spiralOrigin1, birth: t });
        spiralOrigins.push({ position: spiralOrigin2, birth: t });
        lastEmit = t;
      }

      // Limit the number of active spiral waves
      if (spiralOrigins.length > maxWaves)
        spiralOrigins.splice(0, spiralOrigins.length - maxWaves);

      // Grid distortion caused by spirals
      const positions = gridWire.geometry.attributes
        .position as THREE.BufferAttribute;
      const base = basePositions;
      const array = positions.array as Float32Array;

      for (let i = 0; i < array.length; i += 3) {
        const x = base[i];
        const z = base[i + 2];
        let y = 0;

        for (const wave of spiralOrigins) {
          const dx = x - wave.position.x;
          const dz = z - wave.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const age = t - wave.birth;
          const waveFront = age * 5;
          const falloff = Math.exp(-Math.pow(dist - waveFront, 2) * 0.5);
          y += 0.3 * falloff * Math.sin(dist - waveFront);
        }

        array[i + 1] = y;
      }

      positions.needsUpdate = true;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}
