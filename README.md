# 🌌 Gravitational Wave Simulation

This project is an interactive simulation of two black holes orbiting each other and merging, generating visualized gravitational waves. It is designed to illustrate the concept of spacetime distortions caused by massive accelerating bodies, as predicted by Einstein's General Theory of Relativity.

Built using **React** and **Three.js**, this simulation is rendered directly in the browser and includes user controls to manipulate simulation parameters in real-time.

---

## 🚀 Features

- 🌀 Black holes orbiting in real time
- 🌊 Gravitational waves emitted as ripples on a 3D grid
- 💥 Merger triggered by a button, generating a final mega wave
- ✨ Background starfield with glowing sphere stars
- 🎛️ Adjustable sliders for orbit speed, wave amplitude, emission rate, and more
- 📱 Responsive, GPU-accelerated rendering via WebGL

---

## 🧰 Technologies Used

- [React](https://reactjs.org/) — UI framework
- [Three.js](https://threejs.org/) — 3D rendering
- [TypeScript](https://www.typescriptlang.org/) — static typing
- [Next.js](https://nextjs.org/) — project scaffolding

---

## 🧠 How It Works

- Two spheres represent black holes, orbiting each other with increasing speed.
- Gravitational waves are visualized as vertical displacement on a grid plane.
- Wave data is stored in an array and updated over time to simulate propagation.
- When the user presses the **“Initiate Merger”** button, the black holes spiral inward and merge at the center.
- A final burst of ripples is emitted to mimic the intense gravitational wave event.

---

## 🖱️ Controls

You can adjust these parameters live from the on-screen control panel:

- **Orbit Speed** — Controls how fast the black holes orbit
- **Wave Speed** — Speed at which ripples move outward
- **Wave Amplitude** — How tall the ripples are
- **Emit Interval** — How often new waves are emitted
- **Initiate Merger** — Button to trigger the final black hole collision

---

## 📸 Demo

![Demo Screenshot](demo.png)  
*COMING SOON*

---

## 🧪 Getting Started

1. Clone the repo:

```bash
git clone https://github.com/yourusername/gravitational-wave-simulation.git
cd gravitational-wave-simulation
```
2.Install dependencies:
```
npm install
```
3.Start the development server:
```
npm run dev
```
## 📚 Educational Value
This simulation is useful for:

- Teaching the concept of gravitational waves
- Demonstrating binary black hole mergers
- Visualizing spacetime curvature in a classroom or presentation setting

## 📄 License
MIT License. Feel free to use, remix, and share.
