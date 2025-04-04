"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation parameters
  const [orbitSpeedFactor, setOrbitSpeedFactor] = useState(0.8);
  const [waveSpeed, setWaveSpeed] = useState(5);
  const [emitRate, setEmitRate] = useState(0.25);
  const [waveAmplitude, setWaveAmplitude] = useState(0.3);
  const [resetFlag, setResetFlag] = useState(false); // Triggers reset when toggled

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene and camera setup
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

    // User controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Starfield for space background
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

    // Black holes and glow effect
    const blackHoleGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const blackHoleCoreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole1 = new THREE.Mesh(blackHoleGeo, blackHoleCoreMat);
    const blackHole2 = new THREE.Mesh(blackHoleGeo, blackHoleCoreMat.clone());

    // Glowing ring around black holes (for visual effect)
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

    // Create a ground-like grid to visualize spacetime distortion
    const gridSize = 40;
    const segments = 100;
    const gridGeometry = new THREE.PlaneGeometry(
      gridSize,
      gridSize,
      segments,
      segments
    );
    gridGeometry.rotateX(-Math.PI / 2); // Flat on the XZ plane
    const basePositions = gridGeometry.attributes.position.array.slice(); // Save original positions

    // Create wireframe material with vertex color support
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    const grid = new THREE.Mesh(gridGeometry, wireframeMaterial);
    scene.add(grid);

    // Create color attribute for vertex coloring
    const colors = new Float32Array(
      grid.geometry.attributes.position.count * 3
    );
    grid.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Stores emitted wave origin points
    const spiralOrigins: { position: THREE.Vector3; birth: number }[] = [];

    // Clock for tracking simulation time
    const clock = new THREE.Clock();
    let lastEmit = 0;
    let merging = false;
    let mergeStartTime = 0;
    const mergeDuration = 2;
    let waveEmitted = false;

    // Main animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      let orbitRadius = 2;
      let angle = t * orbitSpeedFactor;

      // Handle merging logic
      if (merging) {
        const progress = Math.min((t - mergeStartTime) / mergeDuration, 1);
        orbitRadius = 2 * (1 - progress); // Reduce radius as they merge
        angle = t * orbitSpeedFactor * (1 + progress * 4); // Speed up as they merge

        // Final stage: black holes merge into one
        if (progress >= 1) {
          blackHole1.position.set(0, 0, 0);
          blackHole2.position.set(0, 0, 0);
          if (!waveEmitted) {
            spiralOrigins.length = 0; // Clear old waves
            spiralOrigins.push({
              position: new THREE.Vector3(0, 0, 0),
              birth: t,
            });
            waveEmitted = true;
          }
        } else {
          // Move black holes closer together
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
        // Normal orbiting motion
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

      // Calculate velocities for wave emission points
      const vel1 = new THREE.Vector3(
        -Math.sin(angle),
        0,
        Math.cos(angle)
      ).multiplyScalar(orbitRadius * orbitSpeedFactor);
      const vel2 = vel1.clone().multiplyScalar(-1);

      // Emit waves at intervals
      if (!merging && t - lastEmit > emitRate) {
        const offsetDistance = 0.5;
        spiralOrigins.push({
          position: blackHole1.position
            .clone()
            .add(vel1.clone().normalize().multiplyScalar(-offsetDistance)),
          birth: t,
        });
        spiralOrigins.push({
          position: blackHole2.position
            .clone()
            .add(vel2.clone().normalize().multiplyScalar(-offsetDistance)),
          birth: t,
        });
        lastEmit = t;

        // ✅ Limit total wave count for performance
        while (spiralOrigins.length > 100) {
          spiralOrigins.shift();
        }
      }

      // Update grid vertices and colors based on wave influence
      const positions = grid.geometry.attributes
        .position as THREE.BufferAttribute;
      const base = basePositions;
      const array = positions.array as Float32Array;

      for (let i = 0; i < array.length; i += 3) {
        const x = base[i];
        const z = base[i + 2];
        let y = 0;

        // Accumulate wave distortion from each origin
        for (const wave of spiralOrigins) {
          const dx = x - wave.position.x;
          const dz = z - wave.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const age = t - wave.birth;
          const waveFront = age * waveSpeed;
          const falloff = Math.exp(-Math.pow(dist - waveFront, 2) * 0.5);
          y += waveAmplitude * falloff * Math.sin(dist - waveFront);
        }

        array[i + 1] = y; // Update Y position of vertex

        // ✅ Set vertex color based on Y distortion (visual feedback)
        const colorIntensity = Math.min(Math.abs(y) * 2, 1.0);
        colors[i] = colorIntensity; // Red
        colors[i + 1] = 1 - colorIntensity; // Green
        colors[i + 2] = 1; // Blue
      }

      positions.needsUpdate = true;
      grid.geometry.attributes.color.needsUpdate = true;

      // Pulsing glow effect
      glow1.scale.setScalar(2 + Math.sin(t * pulseSpeed1) * 0.2);
      glow2.scale.setScalar(2 + Math.sin(t * pulseSpeed2) * 0.2);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle click to trigger merger
    const triggerMerger = () => {
      if (!merging) {
        merging = true;
        mergeStartTime = clock.getElapsedTime();
      }
    };

    // Handle browser resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Event listeners
    window.addEventListener("click", triggerMerger);
    window.addEventListener("resize", handleResize);

    // Cleanup on component unmount or reset
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", triggerMerger);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [orbitSpeedFactor, waveSpeed, emitRate, waveAmplitude, resetFlag]);

  return (
    <>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
      {/* Controls Panel */}
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
        {/* Orbit Speed Slider */}
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

        {/* Wave Speed Slider */}
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

        {/* Emit Interval Slider */}
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

        {/* Wave Amplitude Slider */}
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
        <br />

        {/* Reset Button */}
        <button
          onClick={() => setResetFlag((f) => !f)}
          style={{ marginTop: 10 }}
        >
          🔁 Reset Simulation
        </button>
      </div>
    </>
  );
}
