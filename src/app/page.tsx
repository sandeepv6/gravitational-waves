"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  const [orbitSpeedFactor, setOrbitSpeedFactor] = useState(0.8);
  const [waveSpeed, setWaveSpeed] = useState(5);
  const [emitRate, setEmitRate] = useState(0.25);
  const [waveAmplitude, setWaveAmplitude] = useState(0.3);

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

    // Add star spheres
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    for (let i = 0; i < 500; i++) {
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
      );
      scene.add(star);
    }

    const blackHoleGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const blackHoleCoreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole1 = new THREE.Mesh(blackHoleGeo, blackHoleCoreMat);
    const blackHole2 = new THREE.Mesh(blackHoleGeo, blackHoleCoreMat.clone());

    const glow1 = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.31, 64),
      new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow1.rotation.x = Math.PI / 2;
    const pulseSpeed1 = 2 + Math.random();
    blackHole1.add(glow1);

    const glow2 = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.31, 64),
      new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow2.rotation.x = Math.PI / 2;
    const pulseSpeed2 = 2 + Math.random();
    blackHole2.add(glow2);

    scene.add(blackHole1, blackHole2);

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
    let merging = false;
    let mergeStartTime = 0;
    const mergeDuration = 2;
    let waveEmitted = false;

    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      let orbitRadius = 2;
      let angle = t * orbitSpeedFactor;

      if (merging) {
        const progress = Math.min((t - mergeStartTime) / mergeDuration, 1);
        orbitRadius = 2 * (1 - progress);
        angle = t * orbitSpeedFactor * (1 + progress * 4);

        if (progress >= 1) {
          blackHole1.position.set(0, 0, 0);
          blackHole2.position.set(0, 0, 0);
          if (!waveEmitted) {
            spiralOrigins.length = 0;
            spiralOrigins.push({
              position: new THREE.Vector3(0, 0, 0),
              birth: t,
            });
            waveEmitted = true;
          }
        } else {
          blackHole1.position.set(
            Math.cos(angle) * orbitRadius,
            0,
            Math.sin(angle) * orbitRadius
          );
          blackHole2.position.set(
            -Math.cos(angle) * orbitRadius,
            0,
            -Math.sin(angle) * orbitRadius
          );
        }
      } else {
        blackHole1.position.set(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        );
        blackHole2.position.set(
          -Math.cos(angle) * orbitRadius,
          0,
          -Math.sin(angle) * orbitRadius
        );
      }

      const vel1 = new THREE.Vector3(
        -Math.sin(angle),
        0,
        Math.cos(angle)
      ).multiplyScalar(orbitRadius * orbitSpeedFactor);
      const vel2 = vel1.clone().multiplyScalar(-1);

      if (!merging && t - lastEmit > emitRate) {
        const offsetDistance = 0.5;
        const spiralOrigin1 = blackHole1.position
          .clone()
          .add(vel1.clone().normalize().multiplyScalar(-offsetDistance));
        const spiralOrigin2 = blackHole2.position
          .clone()
          .add(vel2.clone().normalize().multiplyScalar(-offsetDistance));
        spiralOrigins.push({ position: spiralOrigin1, birth: t });
        spiralOrigins.push({ position: spiralOrigin2, birth: t });
        lastEmit = t;
      }

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
          const waveFront = age * waveSpeed;
          const falloff = Math.exp(-Math.pow(dist - waveFront, 2) * 0.5);
          y += waveAmplitude * falloff * Math.sin(dist - waveFront);
        }
        array[i + 1] = y;
      }

      positions.needsUpdate = true;
      glow1.scale.setScalar(2 + Math.sin(t * pulseSpeed1) * 0.2);
      glow2.scale.setScalar(2 + Math.sin(t * pulseSpeed2) * 0.2);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const triggerMerger = () => {
      if (!merging) {
        merging = true;
        mergeStartTime = clock.getElapsedTime();
      }
    };

    window.addEventListener("click", triggerMerger);
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
  }, [orbitSpeedFactor, waveSpeed, emitRate, waveAmplitude]);

  return (
    <>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(0,0,0,0.5)",
          padding: 10,
          borderRadius: 8,
          color: "white",
        }}
      >
        <label>
          Orbit Speed: {orbitSpeedFactor.toFixed(2)}
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            value={orbitSpeedFactor}
            onChange={(e) => setOrbitSpeedFactor(parseFloat(e.target.value))}
          />
        </label>
        <br />
        <label>
          Wave Speed: {waveSpeed.toFixed(1)}
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={waveSpeed}
            onChange={(e) => setWaveSpeed(parseFloat(e.target.value))}
          />
        </label>
        <br />
        <label>
          Emit Interval: {emitRate.toFixed(2)}s
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            value={emitRate}
            onChange={(e) => setEmitRate(parseFloat(e.target.value))}
          />
        </label>
        <br />
        <label>
          Wave Amplitude: {waveAmplitude.toFixed(2)}
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={waveAmplitude}
            onChange={(e) => setWaveAmplitude(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </>
  );
}
