(() => {
  "use strict";

  /* =========================================================================
     1. NUMBER FORMATTING & CONSTANTS
  ========================================================================= */
  const SUFFIXES = [
    "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
    "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
  ];

  function formatNum(n) {
    if (!isFinite(n)) return "∞";
    if (n < 1000) {
      return n % 1 === 0 ? n.toString() : n.toFixed(2);
    }
    const tier = Math.floor(Math.log10(n) / 3);
    if (tier < SUFFIXES.length) {
      const scale = Math.pow(10, tier * 3);
      return (n / scale).toFixed(2) + SUFFIXES[tier];
    }
    return n.toExponential(2).replace("+", "");
  }

  /* =========================================================================
     2. PROCEDURAL WEB AUDIO ENGINE
  ========================================================================= */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    playClick(eraIndex) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreqs = [320, 420, 540, 680];
      const freq = baseFreqs[eraIndex] + (Math.random() * 50 - 25);

      osc.type = eraIndex >= 2 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.075);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    playUpgrade() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        gain.gain.setValueAtTime(0.001, now + idx * 0.045);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.045 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.24);
      });
    }

    playTierUp() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [220, 277.18, 329.63, 440, 659.25];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(f * 0.75, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.75);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.0);
      });
    }

    playBigCrunch() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 1.1);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    }
  }

  const audio = new SoundEngine();

  /* =========================================================================
     3. GAME DATA: ERAS, CLICK UPGRADES & GENERATORS
  ========================================================================= */
  const ERAS = [
    {
      id: 0,
      name: "Planet Earth",
      badge: "🌍 Era I: Planet Earth",
      cost: 0,
      desc: "A cradle of water, stone, and orbital potential. Harvest terrestrial mass to escape gravity.",
      bonusText: "Starting Cosmic Scale"
    },
    {
      id: 1,
      name: "Solar System",
      badge: "☀️ Era II: Solar System",
      cost: 15000,
      desc: "Ignite fusion mastery and harness the gravitational well of an entire planetary system.",
      bonusText: "Unlocks Solar generators & 2x global Matter output"
    },
    {
      id: 2,
      name: "Milky Way",
      badge: "🌀 Era III: Milky Way",
      cost: 5000000,
      desc: "Expand across 200 billion stars spiraling around Sagittarius A*.",
      bonusText: "Unlocks Galactic generators & 3x global Matter output"
    },
    {
      id: 3,
      name: "Observable Universe",
      badge: "🌌 Era IV: Observable Universe",
      cost: 2500000000,
      desc: "Weave superclusters into a luminous cosmic web spanning 93 billion light-years.",
      bonusText: "Unlocks Universal generators, 5x global output & Big Crunch"
    }
  ];

  const CLICK_UPGRADES = [
    {
      id: "clk_1",
      name: "Tectonic Drill",
      icon: "⛏️",
      era: 0,
      baseCost: 25,
      powerAdd: 1,
      mult: 1,
      desc: "Adds +1 base Matter per click."
    },
    {
      id: "clk_2",
      name: "Orbital Mass Driver",
      icon: "🛰️",
      era: 1,
      baseCost: 5000,
      powerAdd: 25,
      mult: 1.15,
      desc: "Adds +25 base click & boosts click power by 1.15x."
    },
    {
      id: "clk_3",
      name: "Hypernova Pulse",
      icon: "💥",
      era: 2,
      baseCost: 2500000,
      powerAdd: 1500,
      mult: 1.25,
      desc: "Adds +1.5K base click & boosts click power by 1.25x."
    },
    {
      id: "clk_4",
      name: "Vacuum Zero-Point Tap",
      icon: "✨",
      era: 3,
      baseCost: 1000000000,
      powerAdd: 250000,
      mult: 1.4,
      desc: "Adds +250K base click & boosts click power by 1.40x."
    }
  ];

  const GENERATORS = [
    // Era 0: Planet Earth
    { id: "gen_1", name: "Core Extractor", icon: "🌋", era: 0, baseCost: 15, baseMps: 0.5, desc: "Siphons dense silicate and iron from Earth's mantle." },
    { id: "gen_2", name: "Lunar Colony", icon: "🌑", era: 0, baseCost: 120, baseMps: 4, desc: "Automated regolith harvesters on Luna." },
    { id: "gen_3", name: "Space Elevator", icon: "🗼", era: 0, baseCost: 1100, baseMps: 32, desc: "Continuous geostationary orbital tether transport." },

    // Era 1: Solar System
    { id: "gen_4", name: "Asteroid Belt Miner", icon: "☄️", era: 1, baseCost: 12000, baseMps: 260, desc: "Swarms of autonomous drones dismantling metallic asteroids." },
    { id: "gen_5", name: "Gas Giant Harvester", icon: "🪐", era: 1, baseCost: 95000, baseMps: 1850, desc: "Atmospheric scoops skimming Jupiter and Saturn for helium-3." },
    { id: "gen_6", name: "Dyson Swarm", icon: "🔆", era: 1, baseCost: 750000, baseMps: 12500, desc: "Millions of solar collectors capturing total stellar luminosity." },

    // Era 2: Milky Way
    { id: "gen_7", name: "Nebula Condenser", icon: "🌫️", era: 2, baseCost: 6500000, baseMps: 92000, desc: "Compresses interstellar molecular clouds into pure baryonic matter." },
    { id: "gen_8", name: "Pulsar Array", icon: "📡", era: 2, baseCost: 52000000, baseMps: 680000, desc: "Harvests relativistic beams from rapidly spinning neutron stars." },
    { id: "gen_9", name: "Sagittarius Penrose Engine", icon: "🕳️", era: 2, baseCost: 420000000, baseMps: 4900000, desc: "Extracts rotational ergosphere energy from the galactic core." },

    // Era 3: Observable Universe
    { id: "gen_10", name: "Quasar Siphon", icon: "🌠", era: 3, baseCost: 3500000000, baseMps: 38000000, desc: "Taps active galactic nuclei outshining entire galaxies." },
    { id: "gen_11", name: "Cosmic Filament Loom", icon: "🕸️", era: 3, baseCost: 30000000000, baseMps: 290000000, desc: "Channels dark matter highways connecting superclusters." },
    { id: "gen_12", name: "Multiverse Brane Collider", icon: "⚛️", era: 3, baseCost: 260000000000, baseMps: 2400000000, desc: "Precipitates fresh matter directly from bulk dimensional ripples." }
  ];

  /* =========================================================================
     4. GAME STATE & PERSISTENCE
  ========================================================================= */
  const SAVE_KEY = "terra_to_infinity_save_v1";

  function defaultState() {
    const gens = {};
    GENERATORS.forEach(g => gens[g.id] = 0);
    const clicks = {};
    CLICK_UPGRADES.forEach(c => clicks[c.id] = 0);

    return {
      matter: 0,
      runMatterEarned: 0,
      lifetimeMatterEarned: 0,
      era: 0,
      darkEnergy: 0,
      prestigeCount: 0,
      generators: gens,
      clickUpgrades: clicks,
      lastSave: Date.now()
    };
  }

  let state = defaultState();
  let activeTab = "generators";

  function getCost(baseCost, owned) {
    return Math.floor(baseCost * Math.pow(1.15, owned));
  }

  function getEraMultiplier() {
    const eraMults = [1, 2, 6, 30];
    return eraMults[state.era] || 1;
  }

  function getDarkEnergyMultiplier() {
    return 1 + state.darkEnergy * 0.15;
  }

  function getGlobalMultiplier() {
    return getEraMultiplier() * getDarkEnergyMultiplier();
  }

  function getMps() {
    let base = 0;
    for (const g of GENERATORS) {
      base += (state.generators[g.id] || 0) * g.baseMps;
    }
    return base * getGlobalMultiplier();
  }

  function getMpc() {
    let base = 1;
    let mult = 1;
    for (const c of CLICK_UPGRADES) {
      const owned = state.clickUpgrades[c.id] || 0;
      if (owned > 0) {
        base += owned * c.powerAdd;
        mult *= Math.pow(c.mult, owned);
      }
    }
    return base * mult * getGlobalMultiplier();
  }

  function calculatePendingDarkEnergy() {
    if (state.era < 3) return 0;
    if (state.runMatterEarned < 1e9) return 0;
    return Math.floor(Math.pow(state.runMatterEarned / 1e9, 0.45));
  }

  function saveGame(showMsg = false) {
    state.lastSave = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (showMsg) showToast("Progress Saved to Local Storage");
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const fresh = defaultState();
      state = {
        ...fresh,
        ...parsed,
        generators: { ...fresh.generators, ...(parsed.generators || {}) },
        clickUpgrades: { ...fresh.clickUpgrades, ...(parsed.clickUpgrades || {}) }
      };

      // Offline earnings calculation (up to 4 hours)
      const elapsedSec = Math.min(14400, Math.max(0, (Date.now() - (state.lastSave || Date.now())) / 1000));
      const mps = getMps();
      if (elapsedSec > 5 && mps > 0) {
        const offlineGain = mps * elapsedSec * 0.5;
        state.matter += offlineGain;
        state.runMatterEarned += offlineGain;
        state.lifetimeMatterEarned += offlineGain;
        setTimeout(() => showToast(`Welcome back! +${formatNum(offlineGain)} offline Matter`), 400);
      }
    } catch (e) {
      console.warn("Load failed:", e);
    }
  }

  function hardReset() {
    if (!confirm("Are you sure you want to permanently wipe ALL progress, including Dark Energy?")) return;
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    cosmos3D.setEra(0, true);
    renderTab();
    updateHUD();
    showToast("Universe Reset to Zero");
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* =========================================================================
     5. PURE VANILLA 3D PERSPECTIVE ENGINE ON HTML5 <CANVAS>
  ========================================================================= */
  class Cosmos3DEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = 0;
      this.height = 0;
      this.fov = 520;

      // Camera spherical/Euler angles
      this.rotX = 0.32;
      this.rotY = 0;
      this.targetRotX = 0.32;
      this.autoSpin = 0.0035;

      // Visual feedback states
      this.pulse = 0;
      this.eraTransition = 0;
      this.currentEra = 0;

      // Procedural 3D datasets
      this.stars = [];
      this.earthContinents = [];
      this.solarPlanets = [];
      this.galaxyParticles = [];
      this.webNodes = [];
      this.webEdges = [];
      this.burstParticles = [];

      this.initDatasets();
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    initDatasets() {
      // 1. Deep 3D Background Starfield
      this.stars = [];
      for (let i = 0; i < 320; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 650 + Math.random() * 950;
        this.stars.push({
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
          size: 0.7 + Math.random() * 1.7,
          hue: [200, 220, 260, 45][Math.floor(Math.random() * 4)],
          twinkle: Math.random() * Math.PI * 2
        });
      }

      // 2. Era 0: Earth 3D Surface Patches (Continents & Clouds)
      this.earthContinents = [];
      const continentSeeds = [
        { lat: 0.3, lon: 0.4, r: 0.48 },
        { lat: -0.2, lon: 0.8, r: 0.42 },
        { lat: 0.5, lon: 2.1, r: 0.52 },
        { lat: 0.1, lon: 2.6, r: 0.44 },
        { lat: -0.45, lon: 4.2, r: 0.38 },
        { lat: 0.35, lon: 5.1, r: 0.46 },
        { lat: -0.82, lon: 0.0, r: 0.36, ice: true },
        { lat: 0.85, lon: 1.5, r: 0.32, ice: true }
      ];
      for (const seed of continentSeeds) {
        for (let j = 0; j < 26; j++) {
          const lat = seed.lat + (Math.random() - 0.5) * seed.r;
          const lon = seed.lon + (Math.random() - 0.5) * seed.r * 1.4;
          this.earthContinents.push({
            lat,
            lon,
            size: 10 + Math.random() * 14,
            ice: !!seed.ice
          });
        }
      }

      // 3. Era 1: Solar System Planets
      this.solarPlanets = [
        { name: "Mercury", dist: 68, radius: 4, speed: 0.028, angle: 0.4, tilt: 0.08, color: "#a8a29e" },
        { name: "Venus", dist: 92, radius: 6, speed: 0.021, angle: 2.1, tilt: 0.05, color: "#fde047" },
        { name: "Earth", dist: 122, radius: 6.8, speed: 0.016, angle: 3.7, tilt: 0.02, color: "#38bdf8" },
        { name: "Mars", dist: 150, radius: 5.2, speed: 0.013, angle: 5.2, tilt: 0.06, color: "#f87171" },
        { name: "Jupiter", dist: 196, radius: 13, speed: 0.008, angle: 1.1, tilt: 0.04, color: "#fb923c" },
        { name: "Saturn", dist: 248, radius: 11, speed: 0.006, angle: 4.4, tilt: 0.09, color: "#fcd34d", ring: true },
        { name: "Uranus", dist: 292, radius: 8.5, speed: 0.004, angle: 2.8, tilt: 0.07, color: "#67e8f9" }
      ];

      // 4. Era 2: Milky Way 3D Spiral Galaxy
      this.galaxyParticles = [];
      const arms = 4;
      const totalStars = 1100;
      for (let i = 0; i < totalStars; i++) {
        const arm = i % arms;
        const t = Math.pow(Math.random(), 0.85);
        const dist = 16 + t * 245;
        const armAngle = (arm / arms) * Math.PI * 2;
        const spinAngle = dist * 0.022;
        const spread = (1 - t * 0.5) * 0.45 * (Math.random() - 0.5);
        const angle = armAngle + spinAngle + spread;
        const thickness = (1 - t * 0.75) * 22 * (Math.random() - 0.5);

        this.galaxyParticles.push({
          x: Math.cos(angle) * dist,
          y: thickness,
          z: Math.sin(angle) * dist,
          size: t < 0.2 ? 2.2 : 1.1 + Math.random() * 1.4,
          color: t < 0.18
            ? "#fef08a"
            : (Math.random() > 0.35 ? "#93c5fd" : "#d8b4fe")
        });
      }

      // 5. Era 3: Observable Universe 3D Cosmic Web
      this.webNodes = [];
      this.webEdges = [];
      const nodeCount = 95;
      for (let i = 0; i < nodeCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 45 + Math.pow(Math.random(), 0.7) * 210;
        this.webNodes.push({
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
          phase: Math.random() * Math.PI * 2,
          size: 2.4 + Math.random() * 3.2,
          color: i % 3 === 0 ? "#c084fc" : (i % 3 === 1 ? "#38bdf8" : "#f472b6")
        });
      }
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = this.webNodes[i].x - this.webNodes[j].x;
          const dy = this.webNodes[i].y - this.webNodes[j].y;
          const dz = this.webNodes[i].z - this.webNodes[j].z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist < 92) {
            this.webEdges.push({ a: i, b: j, dist });
          }
        }
      }
    }

    setEra(eraIndex, instant = false) {
      if (this.currentEra !== eraIndex) {
        this.currentEra = eraIndex;
        this.eraTransition = instant ? 0 : 1.0;
      }
    }

    triggerClickEffect(screenX, screenY) {
      this.pulse = 1.0;
      const colors = ["#38bdf8", "#fbbf24", "#c084fc", "#34d399"];
      const col = colors[this.currentEra] || "#38bdf8";
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1.8 + Math.random() * 4.5;
        this.burstParticles.push({
          x: screenX,
          y: screenY,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 1.0,
          color: col
        });
      }
    }

    project(x, y, z, rotX = this.rotX, rotY = this.rotY) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      const scale = this.fov / (this.fov + z2);
      return {
        x: this.width * 0.5 + x1 * scale,
        y: this.height * 0.52 + y2 * scale,
        z: z2,
        scale
      };
    }

    render(time) {
      const ctx = this.ctx;
      const t = time * 0.001;

      this.rotY += this.autoSpin;
      this.rotX += (this.targetRotX - this.rotX) * 0.08;
      this.pulse *= 0.88;
      this.eraTransition *= 0.94;

      const bgPalettes = [
        ["#08142c", "#03060f"], // Earth
        ["#1a1008", "#04050c"], // Solar
        ["#120a24", "#03040a"], // Milky Way
        ["#1a0826", "#020308"]  // Universe
      ];
      const [c1, c2] = bgPalettes[this.currentEra] || bgPalettes[0];
      const bgGrad = ctx.createRadialGradient(
        this.width * 0.5, this.height * 0.52, 20,
        this.width * 0.5, this.height * 0.52, Math.max(this.width, this.height) * 0.72
      );
      bgGrad.addColorStop(0, c1);
      bgGrad.addColorStop(1, c2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Render 3D Starfield
      for (const s of this.stars) {
        const p = this.project(s.x, s.y, s.z, this.rotX * 0.35, this.rotY * 0.25);
        if (p.scale <= 0) continue;
        const alpha = 0.35 + 0.45 * Math.sin(t * 2 + s.twinkle);
        ctx.fillStyle = `hsla(${s.hue}, 85%, 85%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Active Cosmic Era in 3D
      if (this.currentEra === 0) this.renderEarth(ctx, t);
      else if (this.currentEra === 1) this.renderSolarSystem(ctx, t);
      else if (this.currentEra === 2) this.renderMilkyWay(ctx, t);
      else this.renderObservableUniverse(ctx, t);

      // Era Transition Shockwave Ring
      if (this.eraTransition > 0.02) {
        const r = (1 - this.eraTransition) * Math.min(this.width, this.height) * 0.65;
        ctx.strokeStyle = `rgba(192, 132, 252, ${this.eraTransition * 0.8})`;
        ctx.lineWidth = 4 * this.eraTransition;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, this.height * 0.52, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Click Particle Bursts
      for (let i = this.burstParticles.length - 1; i >= 0; i--) {
        const bp = this.burstParticles[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.life -= 0.032;
        if (bp.life <= 0) {
          this.burstParticles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = bp.life;
        ctx.fillStyle = bp.color;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 3.2 * bp.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    renderEarth(ctx, t) {
      const baseRadius = Math.min(this.width, this.height) * 0.21 * (1 + this.pulse * 0.06);
      const center = this.project(0, 0, 0);

      const moonAngle = t * 0.85;
      const moonOrbitR = baseRadius * 1.85;
      const mx = Math.cos(moonAngle) * moonOrbitR;
      const my = Math.sin(moonAngle * 0.5) * (baseRadius * 0.28);
      const mz = Math.sin(moonAngle) * moonOrbitR;
      const moonProj = this.project(mx, my, mz);

      const drawMoon = () => {
        const mr = baseRadius * 0.24 * moonProj.scale;
        const mGrad = ctx.createRadialGradient(
          moonProj.x - mr * 0.3, moonProj.y - mr * 0.3, mr * 0.1,
          moonProj.x, moonProj.y, mr
        );
        mGrad.addColorStop(0, "#f8fafc");
        mGrad.addColorStop(0.7, "#94a3b8");
        mGrad.addColorStop(1, "#334155");
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(moonProj.x, moonProj.y, mr, 0, Math.PI * 2);
        ctx.fill();
      };

      // Orbit ring hint
      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const op = this.project(
          Math.cos(a) * moonOrbitR,
          Math.sin(a * 0.5) * (baseRadius * 0.28),
          Math.sin(a) * moonOrbitR
        );
        if (i === 0) ctx.moveTo(op.x, op.y);
        else ctx.lineTo(op.x, op.y);
      }
      ctx.stroke();

      if (moonProj.z > 0) drawMoon();

      // Atmospheric outer glow
      const atmo = ctx.createRadialGradient(
        center.x, center.y, baseRadius * 0.88,
        center.x, center.y, baseRadius * 1.32
      );
      atmo.addColorStop(0, "rgba(56, 189, 248, 0.42)");
      atmo.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = atmo;
      ctx.beginPath();
      ctx.arc(center.x, center.y, baseRadius * 1.32, 0, Math.PI * 2);
      ctx.fill();

      // Ocean Sphere
      const oceanGrad = ctx.createRadialGradient(
        center.x - baseRadius * 0.32, center.y - baseRadius * 0.32, baseRadius * 0.12,
        center.x, center.y, baseRadius
      );
      oceanGrad.addColorStop(0, "#38bdf8");
      oceanGrad.addColorStop(0.55, "#0284c7");
      oceanGrad.addColorStop(1, "#082f49");

      ctx.save();
      ctx.beginPath();
      ctx.arc(center.x, center.y, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();
      ctx.clip();

      // 3D Projected Continents on Sphere Surface
      for (const patch of this.earthContinents) {
        const x = baseRadius * Math.cos(patch.lat) * Math.cos(patch.lon);
        const y = baseRadius * Math.sin(patch.lat);
        const z = baseRadius * Math.cos(patch.lat) * Math.sin(patch.lon);
        const p = this.project(x, y, z);

        if (p.z < 12) {
          const shade = Math.max(0.25, 1 - (p.z + baseRadius) / (baseRadius * 2.2));
          ctx.fillStyle = patch.ice
            ? `rgba(241, 245, 249, ${0.85 * shade})`
            : `rgba(52, 211, 153, ${0.78 * shade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, patch.size * (baseRadius / 130) * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Terminator Shadow
      const shadowGrad = ctx.createRadialGradient(
        center.x - baseRadius * 0.4, center.y - baseRadius * 0.3, baseRadius * 0.45,
        center.x + baseRadius * 0.2, center.y + baseRadius * 0.2, baseRadius * 1.15
      );
      shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
      shadowGrad.addColorStop(1, "rgba(2, 6, 23, 0.72)");
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(center.x - baseRadius, center.y - baseRadius, baseRadius * 2, baseRadius * 2);
      ctx.restore();

      if (moonProj.z <= 0) drawMoon();
    }

    renderSolarSystem(ctx, t) {
      const scaleFactor = Math.min(this.width, this.height) / 620;
      const sunR = 34 * scaleFactor * (1 + this.pulse * 0.08);
      const center = this.project(0, 0, 0);

      // Draw 3D orbital ellipses
      ctx.lineWidth = 1;
      for (const pl of this.solarPlanets) {
        const d = pl.dist * scaleFactor;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.14)";
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const px = Math.cos(a) * d;
          const py = Math.sin(a) * d * pl.tilt;
          const pz = Math.sin(a) * d;
          const p = this.project(px, py, pz);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Depth sort Sun + Planets
      const bodies = [{ isSun: true, z: center.z, proj: center, radius: sunR }];
      for (const pl of this.solarPlanets) {
        pl.angle += pl.speed * 0.35;
        const d = pl.dist * scaleFactor;
        const px = Math.cos(pl.angle) * d;
        const py = Math.sin(pl.angle) * d * pl.tilt;
        const pz = Math.sin(pl.angle) * d;
        const proj = this.project(px, py, pz);
        bodies.push({
          isSun: false,
          planet: pl,
          z: proj.z,
          proj,
          radius: pl.radius * scaleFactor * proj.scale
        });
      }

      bodies.sort((a, b) => b.z - a.z);

      for (const b of bodies) {
        if (b.isSun) {
          const corona = ctx.createRadialGradient(
            b.proj.x, b.proj.y, b.radius * 0.5,
            b.proj.x, b.proj.y, b.radius * 2.6
          );
          corona.addColorStop(0, "rgba(254, 240, 138, 0.95)");
          corona.addColorStop(0.35, "rgba(251, 146, 60, 0.45)");
          corona.addColorStop(1, "rgba(234, 88, 12, 0)");
          ctx.fillStyle = corona;
          ctx.beginPath();
          ctx.arc(b.proj.x, b.proj.y, b.radius * 2.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#fef9c3";
          ctx.beginPath();
          ctx.arc(b.proj.x, b.proj.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = b.planet.color;
          ctx.beginPath();
          ctx.arc(b.proj.x, b.proj.y, Math.max(2, b.radius), 0, Math.PI * 2);
          ctx.fill();

          if (b.planet.ring) {
            ctx.strokeStyle = "rgba(253, 230, 138, 0.7)";
            ctx.lineWidth = 2 * b.proj.scale;
            ctx.beginPath();
            ctx.ellipse(b.proj.x, b.proj.y, b.radius * 2.1, b.radius * 0.65, -0.25, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    renderMilkyWay(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 560) * (1 + this.pulse * 0.06);
      const center = this.project(0, 0, 0);

      // Galactic Core Glow
      const core = ctx.createRadialGradient(
        center.x, center.y, 4,
        center.x, center.y, 95 * scaleFactor
      );
      core.addColorStop(0, "rgba(254, 249, 195, 0.95)");
      core.addColorStop(0.3, "rgba(192, 132, 252, 0.35)");
      core.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 95 * scaleFactor, 0, Math.PI * 2);
      ctx.fill();

      // Project spiral stars
      for (const star of this.galaxyParticles) {
        const p = this.project(
          star.x * scaleFactor,
          star.y * scaleFactor,
          star.z * scaleFactor
        );
        if (p.scale <= 0) continue;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.min(0.95, 0.45 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, star.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    renderObservableUniverse(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.06);
      const projected = this.webNodes.map((n, idx) => {
        const wobble = Math.sin(t * 1.6 + n.phase) * 4;
        const p = this.project(
          (n.x + wobble) * scaleFactor,
          (n.y - wobble) * scaleFactor,
          (n.z + wobble) * scaleFactor
        );
        return { ...p, node: n, idx };
      });

      // Draw Cosmic Web Filaments
      for (const edge of this.webEdges) {
        const a = projected[edge.a];
        const b = projected[edge.b];
        if (a.scale <= 0 || b.scale <= 0) continue;
        const depthAlpha = Math.max(0.06, Math.min(0.45, ((a.scale + b.scale) * 0.5 - 0.55)));
        ctx.strokeStyle = `rgba(168, 85, 247, ${depthAlpha})`;
        ctx.lineWidth = 1.1 * ((a.scale + b.scale) * 0.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Depth sort and draw Supercluster Nodes
      projected.sort((a, b) => b.z - a.z);
      for (const p of projected) {
        if (p.scale <= 0) continue;
        const pulseR = p.node.size * p.scale * (1 + 0.25 * Math.sin(t * 3 + p.node.phase));
        ctx.fillStyle = p.node.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const canvas = document.getElementById("cosmosCanvas");
  const cosmos3D = new Cosmos3DEngine(canvas);

  /* =========================================================================
     6. CANVAS INTERACTION (CLICK TO HARVEST + DRAG TO ROTATE 3D CAMERA)
  ========================================================================= */
  let isDragging = false;
  let dragMoved = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    dragMoved = false;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;

    cosmos3D.rotY += dx * 0.0075;
    cosmos3D.targetRotX = Math.max(-1.2, Math.min(1.2, cosmos3D.targetRotX + dy * 0.0065));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  canvas.addEventListener("pointerup", (e) => {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
    if (!dragMoved) {
      handleCosmosClick(e.clientX, e.clientY);
    }
  });

  function handleCosmosClick(clientX, clientY) {
    const gain = getMpc();
    state.matter += gain;
    state.runMatterEarned += gain;
    state.lifetimeMatterEarned += gain;

    audio.playClick(state.era);

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    cosmos3D.triggerClickEffect(x, y);
    spawnFloatingText(x, y, `+${formatNum(gain)}`);
    updateHUD();
    refreshAffordability();
  }

  function spawnFloatingText(x, y, text) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = text;
    document.getElementById("leftPanel").appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  /* =========================================================================
     7. UI RENDERING & ACTIONS
  ========================================================================= */
  function updateHUD() {
    document.getElementById("matterDisplay").textContent = formatNum(state.matter);
    document.getElementById("mpsDisplay").textContent = formatNum(getMps());
    document.getElementById("mpcDisplay").textContent = formatNum(getMpc());
    document.getElementById("totalEarnedDisplay").textContent = `Run Matter: ${formatNum(state.runMatterEarned)}`;
    document.getElementById("eraBadge").textContent = ERAS[state.era].badge;

    const dePill = document.getElementById("darkEnergyPill");
    if (state.darkEnergy > 0) {
      dePill.style.display = "inline-block";
      document.getElementById("deBonusDisplay").textContent = `+${formatNum(state.darkEnergy * 15)}%`;
    } else {
      dePill.style.display = "none";
    }
  }

  function buyGenerator(id) {
    const gen = GENERATORS.find(g => g.id === id);
    if (!gen || state.era < gen.era) return;
    const owned = state.generators[id] || 0;
    const cost = getCost(gen.baseCost, owned);
    if (state.matter < cost) return;

    state.matter -= cost;
    state.generators[id] = owned + 1;
    audio.playUpgrade();
    renderTab();
    updateHUD();
  }

  function buyClickUpgrade(id) {
    const upg = CLICK_UPGRADES.find(c => c.id === id);
    if (!upg || state.era < upg.era) return;
    const owned = state.clickUpgrades[id] || 0;
    const cost = getCost(upg.baseCost, owned);
    if (state.matter < cost) return;

    state.matter -= cost;
    state.clickUpgrades[id] = owned + 1;
    audio.playUpgrade();
    renderTab();
    updateHUD();
  }

  function unlockEra(eraId) {
    if (eraId !== state.era + 1) return;
    const era = ERAS[eraId];
    if (!era || state.matter < era.cost) return;

    state.matter -= era.cost;
    state.era = eraId;
    cosmos3D.setEra(eraId, false);
    audio.playTierUp();
    saveGame();
    renderTab();
    updateHUD();
    showToast(`Cosmic Scale Expanded: ${era.name}!`);
  }

  function triggerBigCrunch() {
    const pendingDE = calculatePendingDarkEnergy();
    if (state.era < 3 || pendingDE < 1) return;

    if (!confirm(`Trigger the Big Crunch to collapse the Universe and gain +${formatNum(pendingDE)} Dark Energy (+${formatNum(pendingDE * 15)}% permanent production)?`)) {
      return;
    }

    const keptDE = state.darkEnergy + pendingDE;
    const keptLifetime = state.lifetimeMatterEarned;
    const keptPrestiges = state.prestigeCount + 1;

    state = defaultState();
    state.darkEnergy = keptDE;
    state.lifetimeMatterEarned = keptLifetime;
    state.prestigeCount = keptPrestiges;

    cosmos3D.setEra(0, false);
    audio.playBigCrunch();
    saveGame();
    renderTab();
    updateHUD();
    showToast(`Big Crunch Complete! +${formatNum(pendingDE)} Dark Energy`);
  }

  function renderTab() {
    const container = document.getElementById("tabContent");
    container.innerHTML = "";

    if (activeTab === "generators") {
      const clkHeader = document.createElement("div");
      clkHeader.className = "section-header";
      clkHeader.innerHTML = `<span>👆 Click Amplifiers</span><span>Scale: 1.15x</span>`;
      container.appendChild(clkHeader);

      CLICK_UPGRADES.forEach(upg => {
        if (state.era < upg.era) return;
        const owned = state.clickUpgrades[upg.id] || 0;
        const cost = getCost(upg.baseCost, owned);
        const btn = document.createElement("button");
        btn.className = "upgrade-card";
        btn.dataset.cost = cost;
        btn.disabled = state.matter < cost;
        btn.innerHTML = `
          <div class="card-icon">${upg.icon}</div>
          <div class="card-body">
            <div class="card-title">${upg.name} <span class="era-tag">Era ${upg.era + 1}</span></div>
            <div class="card-desc">${upg.desc}</div>
          </div>
          <div class="card-right">
            <div class="card-cost">💠 ${formatNum(cost)}</div>
            <div class="card-owned">${owned}</div>
          </div>
        `;
        btn.addEventListener("click", () => buyClickUpgrade(upg.id));
        container.appendChild(btn);
      });

      const genHeader = document.createElement("div");
      genHeader.className = "section-header";
      genHeader.innerHTML = `<span>⚙️ Cosmic Generators</span><span>Global Mult: ${formatNum(getGlobalMultiplier())}x</span>`;
      container.appendChild(genHeader);

      GENERATORS.forEach(gen => {
        const lockedByEra = state.era < gen.era;
        const owned = state.generators[gen.id] || 0;
        const cost = getCost(gen.baseCost, owned);
        const eachMps = gen.baseMps * getGlobalMultiplier();

        const btn = document.createElement("button");
        btn.className = "upgrade-card";
        btn.dataset.cost = lockedByEra ? Infinity : cost;
        btn.disabled = lockedByEra || state.matter < cost;

        if (lockedByEra) {
          btn.innerHTML = `
            <div class="card-icon">🔒</div>
            <div class="card-body">
              <div class="card-title">Locked Generator <span class="era-tag">${ERAS[gen.era].name}</span></div>
              <div class="card-desc">Unlock Era ${gen.era + 1} (${ERAS[gen.era].name}) to reveal this technology.</div>
            </div>
            <div class="card-right">
              <div class="card-cost">Era ${gen.era + 1}</div>
            </div>
          `;
        } else {
          btn.innerHTML = `
            <div class="card-icon">${gen.icon}</div>
            <div class="card-body">
              <div class="card-title">${gen.name} <span class="era-tag">${ERAS[gen.era].name}</span></div>
              <div class="card-desc">${gen.desc}</div>
              <div class="card-stats">+${formatNum(eachMps)} / sec each</div>
            </div>
            <div class="card-right">
              <div class="card-cost">💠 ${formatNum(cost)}</div>
              <div class="card-owned">${owned}</div>
            </div>
          `;
          btn.addEventListener("click", () => buyGenerator(gen.id));
        }
        container.appendChild(btn);
      });

    } else if (activeTab === "eras") {
      const header = document.createElement("div");
      header.className = "section-header";
      header.innerHTML = `<span>🌠 Cosmic Scale Progression</span><span>Current: Era ${state.era + 1} / 4</span>`;
      container.appendChild(header);

      ERAS.forEach(era => {
        const isUnlocked = state.era >= era.id;
        const isNext = state.era + 1 === era.id;
        const card = document.createElement("button");
        card.className = `upgrade-card ${isUnlocked ? "unlocked-milestone" : ""}`;
        card.dataset.cost = isNext ? era.cost : Infinity;
        card.disabled = isUnlocked || !isNext || state.matter < era.cost;

        card.innerHTML = `
          <div class="card-icon">${era.badge.split(" ")[0]}</div>
          <div class="card-body">
            <div class="card-title">${era.name}</div>
            <div class="card-desc">${era.desc}</div>
            <div class="card-stats">${era.bonusText}</div>
          </div>
          <div class="card-right">
            <div class="card-cost">${isUnlocked ? "✅ Active" : (isNext ? `💠 ${formatNum(era.cost)}` : "🔒 Locked")}</div>
          </div>
        `;

        if (isNext) {
          card.addEventListener("click", () => unlockEra(era.id));
        }
        container.appendChild(card);
      });

    } else if (activeTab === "prestige") {
      const pendingDE = calculatePendingDarkEnergy();
      const box = document.createElement("div");
      box.className = "prestige-box";
      box.innerHTML = `
        <h2>🕳️ The Big Crunch</h2>
        <p>
          Once your civilization spans the <strong>Observable Universe (Era IV)</strong> and accumulates at least <strong>1.00B Run Matter</strong>, you can collapse spacetime into a singularity.
        </p>
        <p>
          This resets your Matter, Generators, Click Amplifiers, and Cosmic Era back to Planet Earth, crystallizing your cosmic mass into permanent <strong>Dark Energy</strong> (+15% multiplicative production per unit).
        </p>
        <div class="prestige-metrics">
          <div class="metric-tile">
            <div class="lbl">Current Dark Energy</div>
            <div class="val">${formatNum(state.darkEnergy)} (+${formatNum(state.darkEnergy * 15)}%)</div>
          </div>
          <div class="metric-tile">
            <div class="lbl">Claimable on Crunch</div>
            <div class="val">+${formatNum(pendingDE)} DE</div>
          </div>
          <div class="metric-tile">
            <div class="lbl">Big Crunches</div>
            <div class="val">${state.prestigeCount}</div>
          </div>
          <div class="metric-tile">
            <div class="lbl">Lifetime Matter</div>
            <div class="val">${formatNum(state.lifetimeMatterEarned)}</div>
          </div>
        </div>
        <button class="crunch-btn" id="crunchActionBtn" ${(state.era < 3 || pendingDE < 1) ? "disabled" : ""}>
          ${state.era < 3 ? "🔒 Reach Era IV: Observable Universe First" : (pendingDE < 1 ? "Need 1.00B Run Matter to Crunch" : `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`)}
        </button>
      `;
      container.appendChild(box);

      const crunchBtn = document.getElementById("crunchActionBtn");
      if (crunchBtn && !crunchBtn.disabled) {
        crunchBtn.addEventListener("click", triggerBigCrunch);
      }
    }
  }

  function refreshAffordability() {
    const cards = document.querySelectorAll("#tabContent .upgrade-card[data-cost]");
    cards.forEach(card => {
      if (card.classList.contains("unlocked-milestone")) return;
      const cost = Number(card.dataset.cost);
      card.disabled = !isFinite(cost) || state.matter < cost;
    });

    if (activeTab === "prestige") {
      const pendingDE = calculatePendingDarkEnergy();
      const btn = document.getElementById("crunchActionBtn");
      if (btn) {
        btn.disabled = state.era < 3 || pendingDE < 1;
        if (state.era >= 3 && pendingDE >= 1) {
          btn.textContent = `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`;
        }
      }
    }
  }

  /* =========================================================================
     8. EVENT WIRING & MAIN LOOP
  ========================================================================= */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
      renderTab();
    });
  });

  document.getElementById("muteBtn").addEventListener("click", (e) => {
    audio.muted = !audio.muted;
    e.target.textContent = audio.muted ? "🔇 Muted" : "🔊 Sound On";
  });

  document.getElementById("saveBtn").addEventListener("click", () => saveGame(true));
  document.getElementById("resetBtn").addEventListener("click", hardReset);

  // Initialize Game
  loadGame();
  cosmos3D.setEra(state.era, true);
  renderTab();
  updateHUD();

  let lastFrameTime = performance.now();
  let saveAccumulator = 0;

  function gameLoop(now) {
    const dt = Math.min(0.25, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    const mps = getMps();
    if (mps > 0) {
      const gained = mps * dt;
      state.matter += gained;
      state.runMatterEarned += gained;
      state.lifetimeMatterEarned += gained;
    }

    updateHUD();
    refreshAffordability();
    cosmos3D.render(now);

    saveAccumulator += dt;
    if (saveAccumulator >= 10) {
      saveAccumulator = 0;
      saveGame(false);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();