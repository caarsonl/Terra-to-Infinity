(() => {
  "use strict";

  /* =========================================================================
     1. NUMBER FORMATTING & MATH UTILITIES
  ========================================================================= */
  const SUFFIXES = [
    "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
    "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
  ];

  function formatNum(n) {
    if (!Number.isFinite(n)) return "∞";
    if (n < 1000) return n % 1 === 0 ? n.toString() : n.toFixed(2);
    const tier = Math.floor(Math.log10(n) / 3);
    if (tier < SUFFIXES.length) {
      return (n / Math.pow(10, tier * 3)).toFixed(2) + SUFFIXES[tier];
    }
    return n.toExponential(2).replace("+", "");
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* =========================================================================
     2. PROCEDURAL WEB AUDIO ENGINE (SFX + AUTO AMBIENT COSMIC SOUNDTRACK)
  ========================================================================= */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.sfxMuted = false;
      this.musicEnabled = true;
      this.musicMaster = null;
      this.musicTimer = null;
      this.musicStarted = false;
      this.stepIndex = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.musicMaster = this.ctx.createGain();
          this.musicMaster.gain.value = this.musicEnabled ? 0.16 : 0;
          this.musicMaster.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      if (this.ctx && this.musicEnabled && !this.musicStarted) {
        this.startAmbientMusic();
      }
    }

    setMusicEnabled(enabled) {
      this.musicEnabled = enabled;
      if (this.ctx && this.musicMaster) {
        const now = this.ctx.currentTime;
        this.musicMaster.gain.cancelScheduledValues(now);
        this.musicMaster.gain.linearRampToValueAtTime(enabled ? 0.16 : 0.0001, now + 0.45);
      }
      if (enabled && !this.musicStarted && this.ctx) {
        this.startAmbientMusic();
      }
    }

    startAmbientMusic() {
      if (this.musicStarted || !this.ctx) return;
      this.musicStarted = true;

      const eraScales = [
        [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
        [293.66, 329.63, 369.99, 440.00, 493.88, 587.33],
        [220.00, 261.63, 329.63, 392.00, 440.00, 523.25],
        [196.00, 233.08, 293.66, 349.23, 392.00, 466.16],
        [174.61, 220.00, 261.63, 329.63, 349.23, 440.00],
        [164.81, 196.00, 246.94, 293.66, 329.63, 493.88],
        [261.63, 329.63, 392.00, 493.88, 587.33, 783.99]
      ];

      const scheduleStep = () => {
        if (!this.ctx || !this.musicEnabled || this.ctx.state !== "running") return;
        const now = this.ctx.currentTime;
        const scale = eraScales[state.era] || eraScales[0];

        if (this.stepIndex % 4 === 0) {
          const root = scale[0] * 0.5;
          const fifth = scale[3] * 0.5;
          [root, fifth].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? "sine" : "triangle";
            osc.frequency.setValueAtTime(freq, now);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(420, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.22, now + 1.4);
            gain.gain.linearRampToValueAtTime(0.001, now + 4.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicMaster);
            osc.start(now);
            osc.stop(now + 4.9);
          });
        }

        if (Math.random() < 0.78) {
          const note = scale[Math.floor(Math.random() * scale.length)] * (Math.random() > 0.7 ? 2 : 1);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(note, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

          osc.connect(gain);
          gain.connect(this.musicMaster);
          osc.start(now);
          osc.stop(now + 2.2);
        }

        this.stepIndex++;
      };

      scheduleStep();
      this.musicTimer = setInterval(scheduleStep, 1150);
    }

    playClick(eraIndex) {
      this.init();
      if (this.sfxMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreqs = [300, 360, 420, 480, 540, 600, 680];
      const freq = (baseFreqs[eraIndex] || 400) + (Math.random() * 40 - 20);

      osc.type = eraIndex >= 3 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.075);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    playUpgrade() {
      this.init();
      if (this.sfxMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.04 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.22);
      });
    }

    playTierUp() {
      this.init();
      if (this.sfxMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      [220, 277.18, 329.63, 440, 659.25].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(f * 0.72, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.8);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.075, now + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.96);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.0);
      });
    }

    playBigCrunch() {
      this.init();
      if (this.sfxMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 1.15);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    }
  }

  const audio = new SoundEngine();

  /* =========================================================================
     3. GAME DATA: 7 COSMIC ERAS, BALANCED CLICK UPGRADES & 21 GENERATORS
  ========================================================================= */
  const ERAS = [
    {
      id: 0, name: "Planet Earth", badge: "🌍 Era I: Planet Earth", cost: 0, mult: 1,
      desc: "An HD rotating ocean world with volumetric clouds, mountain relief, and orbital potential.",
      bonusText: "Starting Cosmic Scale (1x)"
    },
    {
      id: 1, name: "Solar System", badge: "☀️ Era II: Solar System", cost: 12000, mult: 2,
      desc: "Harness a turbulent 3D star and seven GPU-shaded worlds in Keplerian orbit.",
      bonusText: "Unlocks Solar tech & 2x global Matter output"
    },
    {
      id: 2, name: "Local Star Cluster", badge: "✨ Era III: Local Star Cluster", cost: 4000000, mult: 4,
      desc: "Link neighboring blue supergiants and red dwarfs across an interstellar nursery.",
      bonusText: "Unlocks Star Cluster tech & 4x global Matter output"
    },
    {
      id: 3, name: "Milky Way", badge: "🌀 Era IV: Milky Way", cost: 1500000000, mult: 8,
      desc: "Command a 3D spiral galaxy teeming with nebulae, pulsars, and Sagittarius A*.",
      bonusText: "Unlocks Galactic tech & 8x global Matter output"
    },
    {
      id: 4, name: "Laniakea Supercluster", badge: "🎇 Era V: Laniakea Supercluster", cost: 500000000000, mult: 16,
      desc: "Guide hundreds of spinning galaxies flowing toward the Great Attractor.",
      bonusText: "Unlocks Supercluster tech & 16x global Matter output"
    },
    {
      id: 5, name: "Observable Universe", badge: "🌌 Era VI: Observable Universe", cost: 180000000000000, mult: 32,
      desc: "Architect a 3D cosmic web of superclusters, blazing quasars, and vacuum engines.",
      bonusText: "Unlocks Universal tech, 32x output & Big Crunch"
    },
    {
      id: 6, name: "The Omniverse", badge: "💠 Era VII: The Omniverse", cost: 65000000000000000, mult: 64,
      desc: "Ascend beyond spacetime to weave 4D hypercubes and infinite Bubble Universes.",
      bonusText: "Unlocks Omniversal tech & 64x global Matter output"
    }
  ];

  const CLICK_UPGRADES = [
    {
      id: "clk_1", name: "Tectonic Drill", icon: "⛏️", era: 0,
      baseCost: 30, powerAdd: 1, addMult: 0.12, mpsPct: 0.002,
      desc: "+1 base click, +12% click bonus, +0.2% MPS per click.",
      visual: "3D Visual: Glowing magma fissures & mining laser"
    },
    {
      id: "clk_2", name: "Orbital Mass Driver", icon: "🛰️", era: 1,
      baseCost: 8000, powerAdd: 25, addMult: 0.15, mpsPct: 0.003,
      desc: "+25 base click, +15% click bonus, +0.3% MPS per click.",
      visual: "3D Visual: Golden railgun ring & solar bolts"
    },
    {
      id: "clk_3", name: "Stellar Flare Lance", icon: "⚡", era: 2,
      baseCost: 2500000, powerAdd: 600, addMult: 0.18, mpsPct: 0.004,
      desc: "+600 base click, +18% click bonus, +0.4% MPS per click.",
      visual: "3D Visual: Star-to-star plasma arc discharges"
    },
    {
      id: "clk_4", name: "Hypernova Pulse", icon: "💥", era: 3,
      baseCost: 900000000, powerAdd: 15000, addMult: 0.2, mpsPct: 0.005,
      desc: "+15K base click, +20% click bonus, +0.5% MPS per click.",
      visual: "3D Visual: Expanding 3D galactic shockwave rings"
    },
    {
      id: "clk_5", name: "Gravitational Wave Cannon", icon: "🌊", era: 4,
      baseCost: 300000000000, powerAdd: 400000, addMult: 0.22, mpsPct: 0.006,
      desc: "+400K base click, +22% click bonus, +0.6% MPS per click.",
      visual: "3D Visual: Spacetime ripples across the supercluster"
    },
    {
      id: "clk_6", name: "Vacuum Zero-Point Tap", icon: "✨", era: 5,
      baseCost: 110000000000000, powerAdd: 12000000, addMult: 0.25, mpsPct: 0.007,
      desc: "+12M base click, +25% click bonus, +0.7% MPS per click.",
      visual: "3D Visual: Quantum lightning cascading across the web"
    },
    {
      id: "clk_7", name: "Omniversal Singularity Spark", icon: "🔮", era: 6,
      baseCost: 40000000000000000, powerAdd: 400000000, addMult: 0.3, mpsPct: 0.008,
      desc: "+400M base click, +30% click bonus, +0.8% MPS per click.",
      visual: "3D Visual: 4D hyper-dimensional shock pulses"
    }
  ];

  const GENERATORS = [
    // Era 0: Planet Earth
    { id: "gen_1", name: "Core Extractor", icon: "🌋", era: 0, baseCost: 15, baseMps: 0.5, desc: "Siphons dense silicate and iron from Earth's mantle.", visual: "3D Visual: Night-side megacities & orbiting magma siphons" },
    { id: "gen_2", name: "Lunar Colony", icon: "🌑", era: 0, baseCost: 120, baseMps: 4, desc: "Automated regolith harvesters across Luna.", visual: "3D Visual: Lit lunar domes & Earth-Moon shuttle arcs" },
    { id: "gen_3", name: "Space Elevator", icon: "🗼", era: 0, baseCost: 1100, baseMps: 28, desc: "Geostationary orbital tether network.", visual: "3D Visual: 3D tether towers, climbers & orbital ring" },

    // Era 1: Solar System
    { id: "gen_4", name: "Asteroid Belt Miner", icon: "☄️", era: 1, baseCost: 10000, baseMps: 220, desc: "Autonomous drones dismantling metallic asteroids.", visual: "3D Visual: 3D faceted asteroid belt & mining lasers" },
    { id: "gen_5", name: "Gas Giant Harvester", icon: "🪐", era: 1, baseCost: 85000, baseMps: 1500, desc: "Atmospheric scoops skimming Jupiter and Saturn.", visual: "3D Visual: Orbiting collector halos & siphon beams" },
    { id: "gen_6", name: "Dyson Swarm", icon: "🔆", era: 1, baseCost: 680000, baseMps: 10500, desc: "Millions of solar mirrors capturing stellar output.", visual: "3D Visual: Nested golden hexagonal Dyson rings" },

    // Era 2: Local Star Cluster
    { id: "gen_7", name: "Stellar Nursery Scoop", icon: "☁️", era: 2, baseCost: 3500000, baseMps: 72000, desc: "Harvests ionized hydrogen clouds birthing new suns.", visual: "3D Visual: Glowing volumetric stellar gas clouds" },
    { id: "gen_8", name: "Star-Lifting Ring", icon: "💍", era: 2, baseCost: 30000000, baseMps: 520000, desc: "Magnetic accelerators stripping plasma from giant stars.", visual: "3D Visual: Rotating luminous rings around cluster stars" },
    { id: "gen_9", name: "Interstellar Warp Gate", icon: "🌀", era: 2, baseCost: 260000000, baseMps: 3800000, desc: "Links neighboring star systems via subspace conduits.", visual: "3D Visual: Cyan hyperspace trade lanes between stars" },

    // Era 3: Milky Way
    { id: "gen_10", name: "Nebula Condenser", icon: "🌫️", era: 3, baseCost: 1200000000, baseMps: 28000000, desc: "Compresses molecular clouds into pure baryonic matter.", visual: "3D Visual: Spiral 3D pink & cyan star-forming nebulae" },
    { id: "gen_11", name: "Pulsar Array", icon: "📡", era: 3, baseCost: 10000000000, baseMps: 210000000, desc: "Harvests relativistic beams from spinning neutron stars.", visual: "3D Visual: Spinning 3D pulsars with sweeping twin beams" },
    { id: "gen_12", name: "Sagittarius Penrose Engine", icon: "🕳️", era: 3, baseCost: 90000000000, baseMps: 1600000000, desc: "Extracts ergosphere energy from the galactic black hole.", visual: "3D Visual: 3D Black Hole accretion disk & polar jets" },

    // Era 4: Laniakea Supercluster
    { id: "gen_13", name: "Galactic Tidal Siphon", icon: "🌌", era: 4, baseCost: 420000000000, baseMps: 12000000000, desc: "Captures streams of stars torn between colliding galaxies.", visual: "3D Visual: Luminous stellar bridges linking galaxies" },
    { id: "gen_14", name: "Dark Matter Conduit", icon: "🧬", era: 4, baseCost: 3600000000000, baseMps: 95000000000, desc: "Channels invisible gravitational rivers across clusters.", visual: "3D Visual: Pulsing violet gravitational flow streams" },
    { id: "gen_15", name: "Great Attractor Tap", icon: "🔆", era: 4, baseCost: 32000000000000, baseMps: 740000000000, desc: "Harnesses the central gravity anomaly of Laniakea.", visual: "3D Visual: Radiant 3D vortex pulling galaxies inward" },

    // Era 5: Observable Universe
    { id: "gen_16", name: "Quasar Siphon", icon: "🌠", era: 5, baseCost: 150000000000000, baseMps: 5800000000000, desc: "Taps active galactic nuclei outshining entire galaxies.", visual: "3D Visual: Blazing twin-jet Quasars on web nodes" },
    { id: "gen_17", name: "Cosmic Filament Loom", icon: "🕸️", era: 5, baseCost: 1300000000000000, baseMps: 46000000000000, desc: "Supercharges dark matter highways across the cosmos.", visual: "3D Visual: Streaming energy pulses along cosmic web" },
    { id: "gen_18", name: "Vacuum Metastability Engine", icon: "⚛️", era: 5, baseCost: 12000000000000000, baseMps: 360000000000000, desc: "Extracts zero-point energy from false vacuum pockets.", visual: "3D Visual: Shimmering quantum energy shells in web" },

    // Era 6: The Omniverse
    { id: "gen_19", name: "Bubble Universe Harvester", icon: "🫧", era: 6, baseCost: 55000000000000000, baseMps: 2800000000000000, desc: "Siphons physical constants from neighboring universes.", visual: "3D Visual: Spawns iridescent orbiting Bubble Universes" },
    { id: "gen_20", name: "Wormhole Bridge Network", icon: "🌉", era: 6, baseCost: 480000000000000000, baseMps: 22000000000000000, desc: "Connects parallel universes with Einstein-Rosen bridges.", visual: "3D Visual: Glowing 3D wormhole arcs between bubbles" },
    { id: "gen_21", name: "4D Hypercube Reality Loom", icon: "💠", era: 6, baseCost: 4500000000000000000, baseMps: 180000000000000000, desc: "Weaves fresh space, time, and matter from higher dimensions.", visual: "3D Visual: Expands rotating 4D Tesseract & gyro rings" }
  ];

  /* =========================================================================
     4. GAME STATE, BALANCED MATH & AUTO-SAVE PERSISTENCE
  ========================================================================= */
  const SAVE_KEY = "terra_to_infinity_save_v3";

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

  function getGenCost(baseCost, owned) {
    return Math.floor(baseCost * Math.pow(1.15, owned));
  }

  function getClickCost(baseCost, owned) {
    return Math.floor(baseCost * Math.pow(1.35, owned));
  }

  function getEraMultiplier() {
    return (ERAS[state.era] && ERAS[state.era].mult) || 1;
  }

  function getDarkEnergyMultiplier() {
    return 1 + state.darkEnergy * 0.2;
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
    let baseFlat = 1;
    let addMult = 1;
    let totalMpsPct = 0;

    for (const c of CLICK_UPGRADES) {
      const owned = state.clickUpgrades[c.id] || 0;
      if (owned > 0) {
        baseFlat += owned * c.powerAdd;
        addMult += owned * c.addMult;
        totalMpsPct += owned * c.mpsPct;
      }
    }

    const cappedSynergy = Math.min(0.25, totalMpsPct);
    return (baseFlat * addMult * getGlobalMultiplier()) + (getMps() * cappedSynergy);
  }

  function calculatePendingDarkEnergy() {
    if (state.era < 5 || state.runMatterEarned < 1e14) return 0;
    return Math.floor(Math.pow(state.runMatterEarned / 1e14, 0.36));
  }

  function saveGame(showMsg = false, isAuto = false) {
    state.lastSave = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      const badge = document.getElementById("autoSaveStatus");
      if (badge) {
        const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        badge.textContent = isAuto ? `✓ Auto-Saved (${nowStr})` : `✓ Saved (${nowStr})`;
      }
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
      const safeNum = (v, fallback = 0) => (Number.isFinite(v) && v >= 0 ? v : fallback);

      state = {
        ...fresh,
        matter: safeNum(parsed.matter),
        runMatterEarned: safeNum(parsed.runMatterEarned),
        lifetimeMatterEarned: safeNum(parsed.lifetimeMatterEarned),
        era: clamp(Math.floor(safeNum(parsed.era)), 0, ERAS.length - 1),
        darkEnergy: Math.floor(safeNum(parsed.darkEnergy)),
        prestigeCount: Math.floor(safeNum(parsed.prestigeCount)),
        generators: { ...fresh.generators, ...(parsed.generators || {}) },
        clickUpgrades: { ...fresh.clickUpgrades, ...(parsed.clickUpgrades || {}) },
        lastSave: safeNum(parsed.lastSave, Date.now())
      };

      const elapsedSec = Math.min(14400, Math.max(0, (Date.now() - state.lastSave) / 1000));
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
    if (!confirm("Permanently wipe ALL progress, including Dark Energy?")) return;
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    cosmos3D.setEra(0, true);
    renderTab();
    updateHUD();
    updateStructuresBar();
    showToast("Universe Reset to Zero");
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }

  window.addEventListener("beforeunload", () => saveGame(false, true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveGame(false, true);
  });

  /* =========================================================================
     5. ULTRA-HD WEBGL GPU PLANET ENGINE
        - Pre-bakes 1024x512 seamless 3D Earth Terrain/City & Swirling Cloud
          maps directly on the GPU in ~15ms for locked 60-120 FPS performance.
        - Renders 768px supersampled spheres with 3D bump-mapped mountains,
          cloud shadows, Rayleigh scattering, aurora borealis & Earthshine.
  ========================================================================= */
  const PLANET_TYPE = {
    earth: 0, moon: 1, sun: 2, jupiter: 3,
    saturn: 4, mars: 5, venus: 6, mercury: 7, uranus: 8
  };

  class GPUPlanetRenderer {
    constructor(maxRes = 768) {
      this.maxRes = maxRes;
      this.canvas = document.createElement("canvas");
      this.canvas.width = maxRes;
      this.canvas.height = maxRes;

      const gl = this.canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
      this.gl = gl;
      this.ready = false;

      if (gl) {
        this.canvas.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          this.ready = false;
        });
        this.initGL(gl);
      }
    }

    compileProgram(gl, vsSrc, fsSrc) {
      const make = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("WebGL shader error:", gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const vs = make(gl.VERTEX_SHADER, vsSrc);
      const fs = make(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("WebGL link error:", gl.getProgramInfoLog(p));
        return null;
      }
      return p;
    }

    initGL(gl) {
      const commonNoise = `
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        float fbm6(vec3 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 6; i++) {
            v += a * (snoise(p) * 0.5 + 0.5);
            p = p * 2.06 + vec3(11.3, 7.1, 5.7);
            a *= 0.5;
          }
          return v;
        }

        float fbm4(vec3 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * (snoise(p) * 0.5 + 0.5);
            p = p * 2.08 + vec3(5.2, 9.4, 3.1);
            a *= 0.5;
          }
          return v;
        }

        float ridgedFbm(vec3 p) {
          float v = 0.0, a = 0.55;
          for (int i = 0; i < 5; i++) {
            float n = 1.0 - abs(snoise(p));
            v += a * n * n;
            p = p * 2.12 + vec3(4.1, 2.3, 6.7);
            a *= 0.48;
          }
          return v;
        }
      `;

      const vsSource = `
        attribute vec2 aPos;
        varying vec2 vUv;
        void main() {
          vUv = aPos * 0.5 + 0.5;
          gl_Position = vec4(aPos, 0.0, 1.0);
        }
      `;

      // Startup GPU Texture Baker (renders seamless 1024x512 HD maps in ~15ms)
      const bakeFsSource = `
        precision highp float;
        varying vec2 vUv;
        uniform float uMode;
        ${commonNoise}

        void main() {
          float lon = (vUv.x - 0.5) * 6.28318530718;
          float lat = (vUv.y - 0.5) * 3.14159265359;
          vec3 P = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));

          if (uMode < 0.5) {
            // Mode 0: Earth Surface (R=Elevation, G=Moisture, B=CityWeb, A=MagmaFissures)
            vec3 warp = vec3(
              snoise(P * 1.35 + vec3(2.1, 0.4, 3.3)),
              snoise(P * 1.35 + vec3(5.7, 2.9, 1.2)),
              snoise(P * 1.35 + vec3(8.3, 4.1, 6.4))
            ) * 0.34;
            float continents = fbm6((P + warp) * 1.58 + vec3(1.6, 0.8, 2.3));
            float mountains = ridgedFbm(P * 4.8 + vec3(3.1, 1.5, 4.9));
            float fineCoast = fbm4(P * 14.0) * 0.045;
            float elev = clamp(continents * 0.82 + mountains * 0.21 + fineCoast - 0.02, 0.0, 1.0);

            float moisture = clamp(fbm6(P * 2.6 + vec3(6.2, 1.4, 3.8)), 0.0, 1.0);

            // Metropolitan city hubs + spiderweb road networks along coastlines
            float metro = fbm4(P * 7.8 + vec3(3.3, 1.1, 7.2));
            float roads = pow(1.0 - abs(snoise(P * 24.0 + vec3(1.4, 5.2, 2.8))), 4.0);
            float lights = smoothstep(0.54, 0.78, metro) * (0.45 + 0.55 * roads);

            // Volcanic tectonic fault veins
            float fault = pow(smoothstep(0.84, 0.99, 1.0 - abs(snoise(P * 10.5 + vec3(2.4, 5.1, 1.7)))), 2.2);

            gl_FragColor = vec4(elev, moisture, clamp(lights, 0.0, 1.0), clamp(fault, 0.0, 1.0));
          } else {
            // Mode 1: Earth Swirling Cloud Deck with Cyclone/Hurricane Vortices
            vec3 q = P * 2.25;
            // Create swirling weather vortex domain warp
            vec3 swirl = vec3(
              fbm4(q + vec3(1.7, 9.2, 3.1)),
              fbm4(q + vec3(8.3, 2.8, 5.4)),
              fbm4(q + vec3(4.1, 6.5, 1.9))
            );
            float mainClouds = fbm6(q + (swirl - 0.5) * 1.45);
            float wisps = fbm4(P * 7.5 + swirl * 1.2);
            float density = smoothstep(0.47, 0.76, mainClouds * 0.78 + wisps * 0.28);
            float thick = smoothstep(0.58, 0.85, mainClouds);
            gl_FragColor = vec4(density, wisps, thick, 1.0);
          }
        }
      `;

      // Real-Time HD Display Shader
      const displayFsSource = `
        precision highp float;
        varying vec2 vUv;

        uniform float uType;
        uniform float uRotX;
        uniform float uRotY;
        uniform float uSpin;
        uniform float uTime;
        uniform vec3 uLightDir;
        uniform float uCityBoost;
        uniform float uMagmaBoost;
        uniform float uExtraBoost;
        uniform sampler2D uEarthTex;
        uniform sampler2D uCloudTex;

        ${commonNoise}

        vec3 rotYVec(vec3 v, float a) {
          float c = cos(a), s = sin(a);
          return vec3(v.x * c + v.z * s, v.y, v.z * c - v.x * s);
        }

        vec2 sphereUV(vec3 p) {
          return vec2(
            atan(p.z, p.x) * 0.159154943 + 0.5,
            asin(clamp(p.y, -1.0, 1.0)) * 0.318309886 + 0.5
          );
        }

        float craterHeight(vec3 p) {
          float h = fbm4(p * 3.4) * 0.48 + fbm4(p * 12.0) * 0.22;
          float c1 = abs(snoise(p * 4.6 + vec3(1.2, 3.4, 2.1)));
          float c2 = abs(snoise(p * 9.8 + vec3(7.1, 2.2, 5.8)));
          float bowl1 = smoothstep(0.0, 0.24, c1) - 0.38 * smoothstep(0.16, 0.26, c1) * (1.0 - smoothstep(0.26, 0.36, c1));
          float bowl2 = smoothstep(0.0, 0.22, c2) - 0.30 * smoothstep(0.14, 0.24, c2) * (1.0 - smoothstep(0.24, 0.32, c2));
          return h + bowl1 * 0.35 + bowl2 * 0.2;
        }

        void main() {
          vec2 uv = (vUv * 2.0 - 1.0) * 1.07;
          uv.y = -uv.y;
          float r2 = dot(uv, uv);

          // Crisp Outer Atmospheric Halo outside sphere limb
          if (r2 >= 1.0) {
            float dist = sqrt(r2);
            if (uType < 0.5) {
              float halo = exp(-(dist - 1.0) * 26.0) * 0.58;
              gl_FragColor = vec4(vec3(0.24, 0.68, 1.0) * halo, halo);
              return;
            } else if (uType > 1.5 && uType < 2.5) {
              float halo = exp(-(dist - 1.0) * 20.0) * 0.85;
              gl_FragColor = vec4(vec3(1.0, 0.65, 0.2) * halo, halo);
              return;
            }
            gl_FragColor = vec4(0.0);
            return;
          }

          float vz = -sqrt(1.0 - r2);
          float edgeAA = smoothstep(1.0, 0.986, r2);

          float cosX = cos(uRotX), sinX = sin(uRotX);
          float cosY = cos(uRotY), sinY = sin(uRotY);
          float y1 = uv.y * cosX + vz * sinX;
          float z1 = vz * cosX - uv.y * sinX;
          vec3 N = normalize(vec3(uv.x * cosY + z1 * sinY, y1, z1 * cosY - uv.x * sinY));

          vec3 V = normalize(vec3(-cosX * sinY, -sinX, -cosX * cosY));
          vec3 L = normalize(uLightDir);
          vec3 H = normalize(L + V);

          vec3 P = rotYVec(N, uSpin);
          float ndotl = dot(N, L);
          vec3 col = vec3(0.0);

          // ==================== 0: ULTRA-HD EARTH ====================
          if (uType < 0.5) {
            vec2 eUV = sphereUV(P);
            vec4 data = texture2D(uEarthTex, eUV);
            float elev = data.r;
            float moisture = data.g;
            float cityMap = data.b;
            float faultMap = data.a;

            float seaLevel = 0.555;
            float lat = abs(P.y);
            float polarIce = lat + (moisture - 0.5) * 0.16;

            // High-Resolution Tangent-Space Bump Mapping for Mountain Ranges
            vec3 bumpN = N;
            if (elev >= seaLevel && polarIce <= 0.85) {
              float du = 1.0 / 1024.0;
              float dv = 1.0 / 512.0;
              float hL = texture2D(uEarthTex, eUV - vec2(du, 0.0)).r;
              float hR = texture2D(uEarthTex, eUV + vec2(du, 0.0)).r;
              float hD = texture2D(uEarthTex, eUV - vec2(0.0, dv)).r;
              float hU = texture2D(uEarthTex, eUV + vec2(0.0, dv)).r;

              float horiz = length(vec2(-P.z, P.x));
              if (horiz > 0.02) {
                vec3 eastObj = vec3(-P.z / horiz, 0.0, P.x / horiz);
                vec3 northObj = normalize(cross(eastObj, P));
                vec3 T = rotYVec(eastObj, -uSpin);
                vec3 B = rotYVec(northObj, -uSpin);
                float relief = smoothstep(seaLevel, seaLevel + 0.18, elev) * 16.0;
                bumpN = normalize(N - T * (hR - hL) * relief - B * (hU - hD) * relief);
              }
            }

            float diff = max(0.0, dot(bumpN, L));
            float smoothDiff = smoothstep(-0.14, 0.25, ndotl);
            float specStrength = 0.0;
            vec3 surfCol;

            if (polarIce > 0.855) {
              surfCol = mix(vec3(0.84, 0.91, 0.98), vec3(0.97, 0.99, 1.0), moisture);
              specStrength = 0.26;
            } else if (elev < seaLevel) {
              float depth = clamp((seaLevel - elev) / 0.24, 0.0, 1.0);
              vec3 deepSea = vec3(0.012, 0.068, 0.22);
              vec3 midSea  = vec3(0.032, 0.23, 0.48);
              vec3 coast   = vec3(0.075, 0.56, 0.72);
              surfCol = mix(coast, midSea, smoothstep(0.0, 0.16, depth));
              surfCol = mix(surfCol, deepSea, smoothstep(0.15, 0.82, depth));
              specStrength = 1.0;
            } else {
              float h = clamp((elev - seaLevel) / 0.30, 0.0, 1.0);
              vec3 beach   = vec3(0.76, 0.70, 0.52);
              vec3 rainfor = vec3(0.06, 0.29, 0.13);
              vec3 forest  = vec3(0.16, 0.42, 0.18);
              vec3 desert  = vec3(0.76, 0.62, 0.38);
              vec3 rock    = vec3(0.41, 0.37, 0.34);
              vec3 snow    = vec3(0.95, 0.97, 1.0);

              float arid = smoothstep(0.40, 0.72, moisture) * smoothstep(0.56, 0.10, abs(lat - 0.31));
              vec3 lowland = mix(mix(rainfor, forest, moisture), desert, arid * 0.88);
              surfCol = mix(beach, lowland, smoothstep(0.0, 0.04, h));
              surfCol = mix(surfCol, rock, smoothstep(0.46, 0.76, h));
              surfCol = mix(surfCol, snow, smoothstep(0.74, 0.90, h));
            }

            // Independently Drifting Swirling Cloud Layer + Soft Projected Shadows
            vec3 Pcloud = rotYVec(N, uSpin * 1.22 + uTime * 0.022);
            vec4 cData = texture2D(uCloudTex, sphereUV(Pcloud));
            float cloudMask = cData.r;
            float cloudThick = cData.b;

            vec3 Pshadow = rotYVec(normalize(N + L * 0.022), uSpin * 1.22 + uTime * 0.022);
            float shadowVal = texture2D(uCloudTex, sphereUV(Pshadow)).r;
            float cloudShadow = 1.0 - shadowVal * 0.48 * max(0.0, ndotl);

            // Crisp Ocean Sun Glint
            float spec = pow(max(0.0, dot(N, H)), 44.0) * specStrength * (1.0 - cloudMask * 0.88) * smoothDiff;

            vec3 litSurface = surfCol * (0.045 + diff * 1.12 * cloudShadow) + vec3(0.88, 0.95, 1.0) * spec * 0.82;
            vec3 cloudCol = mix(vec3(0.94, 0.97, 1.0), vec3(0.82, 0.87, 0.94), cloudThick * 0.5) * (0.055 + max(0.0, ndotl) * 1.05);
            col = mix(litSurface, cloudCol, cloudMask * 0.9);

            // Golden-Crimson Sunset Terminator Scattering
            float sunset = exp(-pow((ndotl - 0.01) * 5.6, 2.0)) * (1.0 - cloudMask * 0.25);
            col += vec3(0.58, 0.20, 0.06) * sunset * 0.46;

            // Night-Side Aurora Borealis Ribbons near Magnetic Poles
            float nightMask = smoothstep(0.08, -0.22, ndotl);
            float auroraBand = exp(-pow((lat - 0.82) * 14.0, 2.0));
            float auroraWave = smoothstep(0.25, 0.85, snoise(vec3(P.x * 6.0 + uTime * 0.25, P.y * 4.0, P.z * 6.0 - uTime * 0.2)) * 0.5 + 0.5);
            col += mix(vec3(0.12, 0.95, 0.55), vec3(0.2, 0.65, 1.0), auroraWave) * auroraBand * auroraWave * nightMask * 0.32;

            // Ultra-Crisp Night-Side Megacity Grids (Core Extractors & Lunar Colonies)
            if (uCityBoost > 0.0 && elev >= seaLevel && elev < seaLevel + 0.17 && polarIce < 0.78 && nightMask > 0.0) {
              float microSpark = smoothstep(0.35, 0.82, snoise(P * 52.0) * 0.5 + 0.5);
              float twinkle = 0.88 + 0.12 * sin(uTime * 3.2 + P.x * 45.0);
              col += vec3(1.0, 0.78, 0.36) * cityMap * (0.45 + 0.75 * microSpark) * nightMask * (1.0 - cloudMask * 0.65) * uCityBoost * twinkle * 1.9;
            }

            // Glowing Crustal Magma Fissures (Tectonic Drills)
            if (uMagmaBoost > 0.0 && elev >= seaLevel + 0.04 && polarIce < 0.82) {
              float pulse = 0.84 + 0.16 * sin(uTime * 4.5 + P.y * 12.0);
              col += vec3(1.0, 0.34, 0.04) * faultMap * (1.0 - cloudMask * 0.5) * uMagmaBoost * pulse * 2.1;
            }

            // Atmospheric Rayleigh Blue Rim Scattering
            float fresnel = pow(max(0.0, 1.0 + vz), 3.0);
            col += vec3(0.22, 0.66, 1.0) * fresnel * (0.28 + max(0.0, ndotl + 0.22) * 0.98);
          }

          // ==================== 1: HD CRATERED MOON ====================
          else if (uType < 1.5) {
            float h = craterHeight(P);
            float eps = 0.014;
            vec3 tx = normalize(cross(abs(N.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0), N));
            vec3 ty = cross(N, tx);
            float hX = craterHeight(rotYVec(normalize(N + tx * eps), uSpin));
            float hY = craterHeight(rotYVec(normalize(N + ty * eps), uSpin));
            vec3 bumpN = normalize(N - tx * (hX - h) * 9.0 - ty * (hY - h) * 9.0);

            float maria = fbm4(P * 1.7 + vec3(4.2, 2.8, 1.1));
            vec3 regolith = mix(vec3(0.38, 0.40, 0.44), vec3(0.78, 0.79, 0.81), smoothstep(0.35, 0.72, maria));
            regolith *= 0.82 + h * 0.34;

            float diff = max(0.0, dot(bumpN, L));
            // Subtle blue Earthshine on unlit side so Moon is always clearly sculpted
            vec3 earthshine = vec3(0.14, 0.20, 0.30) * (0.55 + 0.45 * max(0.0, -vz));
            col = regolith * (earthshine + vec3(1.04, 1.02, 0.98) * diff);

            if (uExtraBoost > 0.0) {
              float domeCluster = fbm4(P * 9.0 + vec3(1.1, 6.2, 2.7));
              float domeDots = smoothstep(0.60, 0.80, domeCluster) * smoothstep(0.52, 0.85, snoise(P * 36.0) * 0.5 + 0.5);
              col += vec3(0.22, 0.88, 1.0) * domeDots * uExtraBoost * 2.4;
            }
          }

          // ==================== 2: BOILING 3D SUN ====================
          else if (uType < 2.5) {
            vec3 p1 = P * 4.2 + vec3(uTime * 0.12, -uTime * 0.09, uTime * 0.07);
            vec3 p2 = P * 8.5 - vec3(uTime * 0.18, uTime * 0.11, -uTime * 0.14);
            float gran = fbm4(p1) * 0.65 + fbm4(p2) * 0.35;
            float spots = smoothstep(0.24, 0.38, fbm4(P * 2.4 + vec3(3.1, 1.2, 4.4)));
            float limb = 0.52 + 0.48 * pow(max(0.0, -vz), 0.55);
            vec3 hot = mix(vec3(0.88, 0.24, 0.03), vec3(1.0, 0.78, 0.18), smoothstep(0.28, 0.72, gran));
            hot = mix(hot, vec3(1.0, 0.98, 0.85), smoothstep(0.66, 0.88, gran));
            col = hot * spots * limb + vec3(0.95, 0.42, 0.08) * pow(1.0 + vz, 2.5) * 0.8;
          }

          // ==================== 3: JUPITER ====================
          else if (uType < 3.5) {
            float swirl = fbm4(vec3(P.x * 3.5, P.y * 9.0, P.z * 3.5));
            float band = sin(P.y * 22.0 + (swirl - 0.5) * 3.2) * 0.5 + 0.5;
            vec3 surf = mix(mix(vec3(0.68, 0.42, 0.26), vec3(0.84, 0.62, 0.44), band), vec3(0.88, 0.79, 0.66), smoothstep(0.55, 0.9, band));
            float spot = length(vec3((P.x - 0.72) * 1.4, (P.y - 0.32) * 3.2, (P.z - 0.54) * 1.4));
            surf = mix(vec3(0.84, 0.32, 0.18), surf, smoothstep(0.18, 0.34, spot));
            col = surf * (0.14 + max(0.0, ndotl) * 0.94);
          }

          // ==================== 4: SATURN ====================
          else if (uType < 4.5) {
            float swirl = fbm4(vec3(P.x * 2.4, P.y * 7.5, P.z * 2.4));
            float band = sin(P.y * 18.0 + (swirl - 0.5) * 1.6) * 0.5 + 0.5;
            vec3 surf = mix(vec3(0.75, 0.65, 0.44), vec3(0.94, 0.86, 0.64), band);
            col = surf * (0.15 + max(0.0, ndotl) * 0.92);
          }

          // ==================== 5: MARS ====================
          else if (uType < 5.5) {
            float n = fbm4(P * 3.4 + vec3(2.1, 4.3, 1.5));
            vec3 surf = mix(vec3(0.45, 0.18, 0.10), vec3(0.84, 0.40, 0.22), n);
            if (abs(P.y) > 0.88) surf = vec3(0.94, 0.91, 0.89);
            float fresnel = pow(max(0.0, 1.0 + vz), 3.2);
            col = surf * (0.12 + max(0.0, ndotl) * 0.95) + vec3(0.85, 0.45, 0.25) * fresnel * 0.35;
          }

          // ==================== 6: VENUS ====================
          else if (uType < 6.5) {
            float swirl = fbm4(vec3(P.x * 2.6, P.y * 5.2, P.z * 2.6) + vec3(uTime * 0.05, 0.0, 0.0));
            vec3 surf = mix(vec3(0.80, 0.62, 0.34), vec3(0.97, 0.88, 0.66), swirl);
            float fresnel = pow(max(0.0, 1.0 + vz), 2.8);
            col = surf * (0.18 + max(0.0, ndotl) * 0.88) + vec3(1.0, 0.84, 0.52) * fresnel * 0.4;
          }

          // ==================== 7: MERCURY ====================
          else if (uType < 7.5) {
            float h = craterHeight(P);
            col = vec3(0.58, 0.56, 0.53) * (0.65 + h * 0.45) * (0.14 + max(0.0, ndotl) * 0.92);
          }

          // ==================== 8: URANUS ====================
          else {
            float band = fbm4(vec3(P.x * 2.0, P.y * 5.5, P.z * 2.0));
            vec3 surf = mix(vec3(0.38, 0.76, 0.86), vec3(0.64, 0.91, 0.96), band);
            float fresnel = pow(max(0.0, 1.0 + vz), 3.0);
            col = surf * (0.18 + max(0.0, ndotl) * 0.88) + vec3(0.55, 0.92, 1.0) * fresnel * 0.4;
          }

          gl_FragColor = vec4(col * edgeAA, edgeAA);
        }
      `;

      const bakeProg = this.compileProgram(gl, vsSource, bakeFsSource);
      const dispProg = this.compileProgram(gl, vsSource, displayFsSource);
      if (!bakeProg || !dispProg) return;

      const quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      // Bake 1024x512 HD Earth Surface & Swirling Cloud textures on GPU
      const bakeTexture = (w, h, mode) => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

        gl.useProgram(bakeProg);
        const pos = gl.getAttribLocation(bakeProg, "aPos");
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

        gl.viewport(0, 0, w, h);
        gl.disable(gl.SCISSOR_TEST);
        gl.uniform1f(gl.getUniformLocation(bakeProg, "uMode"), mode);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fb);
        return tex;
      };

      this.earthTex = bakeTexture(1024, 512, 0.0);
      this.cloudTex = bakeTexture(1024, 512, 1.0);
      gl.deleteProgram(bakeProg);

      // Configure main display program
      this.program = dispProg;
      gl.useProgram(dispProg);
      const posLoc = gl.getAttribLocation(dispProg, "aPos");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.earthTex);
      gl.uniform1i(gl.getUniformLocation(dispProg, "uEarthTex"), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.cloudTex);
      gl.uniform1i(gl.getUniformLocation(dispProg, "uCloudTex"), 1);

      this.u = {
        type: gl.getUniformLocation(dispProg, "uType"),
        rotX: gl.getUniformLocation(dispProg, "uRotX"),
        rotY: gl.getUniformLocation(dispProg, "uRotY"),
        spin: gl.getUniformLocation(dispProg, "uSpin"),
        time: gl.getUniformLocation(dispProg, "uTime"),
        lightDir: gl.getUniformLocation(dispProg, "uLightDir"),
        cityBoost: gl.getUniformLocation(dispProg, "uCityBoost"),
        magmaBoost: gl.getUniformLocation(dispProg, "uMagmaBoost"),
        extraBoost: gl.getUniformLocation(dispProg, "uExtraBoost")
      };

      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.SCISSOR_TEST);
      this.ready = true;
    }

    draw(ctx, typeKey, cx, cy, screenRadius, options) {
      if (screenRadius < 1.5) return;
      if (!this.ready) {
        ctx.fillStyle = typeKey === "sun" ? "#fbbf24" : (typeKey === "earth" ? "#0284c7" : "#94a3b8");
        ctx.beginPath();
        ctx.arc(cx, cy, screenRadius, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      const gl = this.gl;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const drawRadius = screenRadius * 1.07;
      const vp = clamp(Math.ceil(drawRadius * 2 * dpr), 48, this.maxRes);
      const vy = this.maxRes - vp;

      gl.viewport(0, vy, vp, vp);
      gl.scissor(0, vy, vp, vp);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const {
        rotX = 0, rotY = 0, spin = 0, time = 0,
        lightDir = { x: -0.68, y: -0.3, z: -0.67 },
        cityBoost = 0, magmaBoost = 0, extraBoost = 0
      } = options;

      gl.uniform1f(this.u.type, PLANET_TYPE[typeKey] ?? 0);
      gl.uniform1f(this.u.rotX, rotX);
      gl.uniform1f(this.u.rotY, rotY);
      gl.uniform1f(this.u.spin, spin);
      gl.uniform1f(this.u.time, time);
      gl.uniform3f(this.u.lightDir, lightDir.x, lightDir.y, lightDir.z);
      gl.uniform1f(this.u.cityBoost, cityBoost);
      gl.uniform1f(this.u.magmaBoost, magmaBoost);
      gl.uniform1f(this.u.extraBoost, extraBoost);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      ctx.drawImage(
        this.canvas,
        0, 0, vp, vp,
        cx - drawRadius, cy - drawRadius, drawRadius * 2, drawRadius * 2
      );
    }
  }

  // === END OF PART 1/2 — PASTE PART 2/2 DIRECTLY BELOW THIS LINE ===
  /* =========================================================================
     6. PRE-RENDERED GLOW SPRITE CACHE
  ========================================================================= */
  function createGlowSprite(innerColor, midColor, size = 128) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const gctx = c.getContext("2d");
    const h = size * 0.5;
    const grad = gctx.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.35, midColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, size, size);
    return c;
  }

  /* =========================================================================
     7. FULL 7-ERA 3D COSMOS ENGINE (CLIP-SAFE & UPGRADE-REACTIVE)
  ========================================================================= */
  class Cosmos3DEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.width = 0;
      this.height = 0;
      this.fov = 560;

      // Smooth camera with inertia & zoom
      this.rotX = 0.26;
      this.rotY = -0.35;
      this.velX = 0;
      this.velY = 0;
      this.zoom = 1.0;
      this.targetZoom = 1.0;

      // Visual animation states
      this.pulse = 0;
      this.eraTransition = 0;
      this.currentEra = 0;
      this.earthSpin = 0;
      this.clickBeams = [];
      this.burstParticles = [];
      this.shockwaves = [];

      // Ultra-HD GPU WebGL Planet Renderer (768px supersampled)
      this.gpuPlanets = new GPUPlanetRenderer(768);

      // Glow Sprite Cache
      this.glows = {
        blue: createGlowSprite("rgba(186, 230, 253, 0.95)", "rgba(56, 189, 248, 0.36)"),
        gold: createGlowSprite("rgba(254, 249, 195, 0.96)", "rgba(251, 146, 60, 0.42)"),
        purple: createGlowSprite("rgba(233, 213, 255, 0.92)", "rgba(168, 85, 247, 0.38)"),
        pink: createGlowSprite("rgba(251, 207, 232, 0.9)", "rgba(236, 72, 153, 0.35)"),
        red: createGlowSprite("rgba(254, 202, 202, 0.95)", "rgba(239, 68, 68, 0.38)"),
        cyan: createGlowSprite("rgba(207, 250, 254, 0.95)", "rgba(34, 211, 238, 0.38)")
      };

      this.initDatasets();
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }

    getCenterY() {
      return this.height * 0.56;
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = Math.max(1, Math.floor(this.width * dpr));
      this.canvas.height = Math.max(1, Math.floor(this.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }

    initDatasets() {
      // Deep 3D Background Starfield
      this.stars = [];
      for (let i = 0; i < 360; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 760 + Math.random() * 1050;
        this.stars.push({
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th),
          z: r * Math.cos(ph),
          size: 0.75 + Math.random() * 1.5,
          hue: [200, 220, 265, 42][Math.floor(Math.random() * 4)],
          twinkle: Math.random() * Math.PI * 2
        });
      }

      // Era 1: Solar System Planets & Asteroids
      this.solarPlanets = [
        { key: "mercury", dist: 78, radius: 5.5, speed: 0.55, angle: 0.4, tilt: 0.08 },
        { key: "venus", dist: 106, radius: 8.5, speed: 0.42, angle: 2.1, tilt: 0.05 },
        { key: "earth", dist: 140, radius: 10.2, speed: 0.32, angle: 3.7, tilt: 0.02 },
        { key: "mars", dist: 174, radius: 7.6, speed: 0.25, angle: 5.1, tilt: 0.06 },
        { key: "jupiter", dist: 232, radius: 19.5, speed: 0.15, angle: 1.2, tilt: 0.04, gasGiant: true },
        { key: "saturn", dist: 295, radius: 16.5, speed: 0.11, angle: 4.3, tilt: 0.09, gasGiant: true, ring: true },
        { key: "uranus", dist: 348, radius: 12.2, speed: 0.08, angle: 2.7, tilt: 0.07 }
      ];

      this.asteroids = [];
      for (let i = 0; i < 105; i++) {
        this.asteroids.push({
          dist: 194 + (Math.random() - 0.5) * 26,
          angle: Math.random() * Math.PI * 2,
          y: (Math.random() - 0.5) * 14,
          speed: 0.18 + Math.random() * 0.08,
          size: 2.2 + Math.random() * 3.2
        });
      }

      // Era 2: Local Star Cluster
      this.clusterStars = [];
      const starTypes = [
        { glow: "blue", core: "#e0f2fe", size: 15 },
        { glow: "gold", core: "#fef9c3", size: 12 },
        { glow: "red", core: "#fecaca", size: 14 },
        { glow: "cyan", core: "#cffafe", size: 10 },
        { glow: "pink", core: "#fbcfe8", size: 11 }
      ];
      for (let i = 0; i < 32; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = i === 0 ? 0 : 48 + Math.pow(Math.random(), 0.72) * 185;
        const st = starTypes[i % starTypes.length];
        this.clusterStars.push({
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th) * 0.72,
          z: r * Math.cos(ph),
          glow: st.glow,
          core: st.core,
          radius: i === 0 ? 22 : st.size * (0.75 + Math.random() * 0.5),
          phase: Math.random() * Math.PI * 2
        });
      }
      this.clusterLanes = [];
      for (let i = 0; i < this.clusterStars.length; i++) {
        for (let j = i + 1; j < this.clusterStars.length; j++) {
          const d = Math.hypot(
            this.clusterStars[i].x - this.clusterStars[j].x,
            this.clusterStars[i].y - this.clusterStars[j].y,
            this.clusterStars[i].z - this.clusterStars[j].z
          );
          if (d < 115) this.clusterLanes.push({ a: i, b: j, phase: Math.random() });
        }
      }

      // Era 3: Milky Way
      this.galaxyStars = [];
      for (let i = 0; i < 1250; i++) {
        const arm = i % 4;
        const t = Math.pow(Math.random(), 0.85);
        const dist = 20 + t * 255;
        const angle = (arm / 4) * Math.PI * 2 + dist * 0.022 + (1 - t * 0.45) * 0.46 * (Math.random() - 0.5);
        this.galaxyStars.push({
          x: Math.cos(angle) * dist,
          y: (1 - t * 0.78) * 24 * (Math.random() - 0.5),
          z: Math.sin(angle) * dist,
          size: t < 0.18 ? 2.2 : 1.0 + Math.random() * 1.4,
          color: t < 0.16 ? "#fef08a" : (Math.random() > 0.35 ? "#93c5fd" : "#e9d5ff")
        });
      }

      this.nebulae = [];
      for (let i = 0; i < 34; i++) {
        const arm = i % 4;
        const dist = 60 + (i / 34) * 175;
        const angle = (arm / 4) * Math.PI * 2 + dist * 0.022 + (Math.random() - 0.5) * 0.25;
        this.nebulae.push({
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 14,
          z: Math.sin(angle) * dist,
          radius: 38 + Math.random() * 28,
          glow: i % 3 === 0 ? "pink" : (i % 3 === 1 ? "blue" : "purple")
        });
      }

      this.pulsars = [];
      for (let i = 0; i < 16; i++) {
        const arm = i % 4;
        const dist = 75 + (i / 16) * 165;
        const angle = (arm / 4) * Math.PI * 2 + dist * 0.022;
        this.pulsars.push({
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 20,
          z: Math.sin(angle) * dist,
          spinSpeed: 2.6 + Math.random() * 3.2,
          tilt: 0.4 + Math.random() * 0.8
        });
      }

      // Era 4: Laniakea Supercluster
      this.superGalaxies = [];
      for (let i = 0; i < 46; i++) {
        const stream = i % 5;
        const sT = Math.pow(Math.random(), 0.78);
        const dist = 36 + sT * 215;
        const baseA = (stream / 5) * Math.PI * 2 + sT * 1.25 + (Math.random() - 0.5) * 0.45;
        this.superGalaxies.push({
          x: Math.cos(baseA) * dist,
          y: (Math.random() - 0.5) * 120 * sT,
          z: Math.sin(baseA) * dist,
          tilt: Math.random() * Math.PI,
          size: 10 + Math.random() * 14,
          glow: i % 3 === 0 ? "gold" : (i % 3 === 1 ? "blue" : "purple"),
          phase: Math.random() * Math.PI * 2
        });
      }

      // Era 5: Observable Universe
      this.webNodes = [];
      this.webEdges = [];
      for (let i = 0; i < 100; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 52 + Math.pow(Math.random(), 0.72) * 212;
        this.webNodes.push({
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th),
          z: r * Math.cos(ph),
          phase: Math.random() * Math.PI * 2,
          size: 2.6 + Math.random() * 3.1,
          color: i % 3 === 0 ? "#c084fc" : (i % 3 === 1 ? "#38bdf8" : "#f472b6")
        });
      }
      for (let i = 0; i < this.webNodes.length; i++) {
        for (let j = i + 1; j < this.webNodes.length; j++) {
          const d = Math.hypot(
            this.webNodes[i].x - this.webNodes[j].x,
            this.webNodes[i].y - this.webNodes[j].y,
            this.webNodes[i].z - this.webNodes[j].z
          );
          if (d < 95) this.webEdges.push({ a: i, b: j, phase: Math.random() });
        }
      }

      // Era 6: The Omniverse
      this.tesseractVerts = [];
      for (let i = 0; i < 16; i++) {
        this.tesseractVerts.push([
          (i & 1) ? 1 : -1,
          (i & 2) ? 1 : -1,
          (i & 4) ? 1 : -1,
          (i & 8) ? 1 : -1
        ]);
      }
      this.tesseractEdges = [];
      for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
          const diff = i ^ j;
          if (diff === 1 || diff === 2 || diff === 4 || diff === 8) {
            this.tesseractEdges.push([i, j]);
          }
        }
      }

      this.bubbleUniverses = [];
      const bColors = [
        ["rgba(56, 189, 248, 0.36)", "#7dd3fc"],
        ["rgba(192, 132, 252, 0.36)", "#e9d5ff"],
        ["rgba(244, 114, 182, 0.36)", "#fbcfe8"],
        ["rgba(52, 211, 153, 0.36)", "#a7f3d0"],
        ["rgba(251, 191, 36, 0.36)", "#fde68a"]
      ];
      for (let i = 0; i < 24; i++) {
        const th = (i / 24) * Math.PI * 2;
        const ph = Math.acos(2 * ((i * 0.6180339) % 1) - 1);
        const r = 135 + (i % 3) * 42;
        const col = bColors[i % bColors.length];
        this.bubbleUniverses.push({
          orbitR: r,
          theta: th,
          phi: ph,
          speed: 0.14 + (i % 4) * 0.05,
          radius: 16 + (i % 5) * 4.5,
          fill: col[0],
          stroke: col[1]
        });
      }
    }

    setEra(eraIndex, instant = false) {
      if (this.currentEra !== eraIndex) {
        this.currentEra = eraIndex;
        this.eraTransition = instant ? 0 : 1.0;
        this.targetZoom = 1.0;
      }
    }

    triggerUpgradePulse() {
      this.shockwaves.push({
        radius: 18,
        maxRadius: Math.min(this.width, this.height) * 0.42,
        life: 1.0,
        color: "#38bdf8"
      });
    }

    triggerClickEffect(screenX, screenY) {
      this.pulse = 1.0;
      const colors = ["#38bdf8", "#fbbf24", "#67e8f9", "#c084fc", "#f472b6", "#34d399", "#fde047"];
      const col = colors[this.currentEra] || "#38bdf8";

      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 2.0 + Math.random() * 4.2;
        this.burstParticles.push({
          x: screenX, y: screenY,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          life: 1.0, color: col
        });
      }

      const clkKeys = ["clk_1", "clk_2", "clk_3", "clk_4", "clk_5", "clk_6", "clk_7"];
      const owned = state.clickUpgrades[clkKeys[this.currentEra]] || 0;
      if (owned > 0) {
        if (this.currentEra <= 2) {
          this.clickBeams.push({
            x1: screenX, y1: screenY,
            x2: this.width * 0.5, y2: this.getCenterY(),
            life: 1.0, color: col
          });
        } else {
          this.shockwaves.push({
            radius: 14,
            maxRadius: Math.min(this.width, this.height) * 0.44,
            life: 1.0,
            color: col
          });
        }
      }
    }

    project(wx, wy, wz, rotX = this.rotX, rotY = this.rotY) {
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const x1 = wx * cosY - wz * sinY;
      const z1 = wz * cosY + wx * sinY;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const y2 = wy * cosX - z1 * sinX;
      const z2 = z1 * cosX + wy * sinX;

      const camDist = this.fov / this.zoom;
      const denom = camDist + z2;
      if (denom <= 30) return { x: 0, y: 0, z: z2, scale: -1 };

      const scale = this.fov / denom;
      return {
        x: this.width * 0.5 + x1 * scale,
        y: this.getCenterY() + y2 * scale,
        z: z2,
        scale
      };
    }

    drawGlow(ctx, key, x, y, radius) {
      const sprite = this.glows[key];
      if (!sprite || radius <= 0.5) return;
      ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    }

    render(time, dt) {
      const ctx = this.ctx;
      const t = time * 0.001;
      const cy = this.getCenterY();

      const damp = Math.exp(-6.5 * dt);
      const lerpZoom = 1 - Math.exp(-9 * dt);
      this.rotY += 0.14 * dt + this.velY;
      this.rotX = clamp(this.rotX + this.velX, -1.32, 1.32);
      this.velX *= damp;
      this.velY *= damp;
      this.zoom += (this.targetZoom - this.zoom) * lerpZoom;

      this.earthSpin += dt * 0.16;
      this.pulse *= Math.exp(-10 * dt);
      this.eraTransition *= Math.exp(-4.5 * dt);

      const bgPalettes = [
        ["#07142e", "#02050c"],
        ["#1a0f06", "#03040a"],
        ["#071a2b", "#02050b"],
        ["#130926", "#020309"],
        ["#1c0922", "#030208"],
        ["#160728", "#020207"],
        ["#0b1632", "#04010c"]
      ];
      const [c1, c2] = bgPalettes[this.currentEra] || bgPalettes[0];
      const bgGrad = ctx.createRadialGradient(
        this.width * 0.5, cy, 20,
        this.width * 0.5, cy, Math.max(this.width, this.height) * 0.72
      );
      bgGrad.addColorStop(0, c1);
      bgGrad.addColorStop(1, c2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Background 3D Starfield
      for (const s of this.stars) {
        const p = this.project(s.x, s.y, s.z, this.rotX * 0.3, this.rotY * 0.25);
        if (p.scale <= 0) continue;
        const alpha = 0.28 + 0.48 * Math.sin(t * 2 + s.twinkle);
        ctx.fillStyle = `hsla(${s.hue}, 85%, 86%, ${alpha})`;
        const sr = Math.max(0.7, s.size * p.scale);
        ctx.fillRect(p.x - sr * 0.5, p.y - sr * 0.5, sr, sr);
      }

      if (state.darkEnergy > 0) this.renderDarkEnergyAura(ctx, t);

      switch (this.currentEra) {
        case 0: this.renderEarthScene(ctx, t); break;
        case 1: this.renderSolarScene(ctx, t, dt); break;
        case 2: this.renderStarClusterScene(ctx, t); break;
        case 3: this.renderMilkyWayScene(ctx, t); break;
        case 4: this.renderSuperclusterScene(ctx, t); break;
        case 5: this.renderUniverseScene(ctx, t); break;
        default: this.renderOmniverseScene(ctx, t); break;
      }

      // Shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * (1 - Math.exp(-7 * dt));
        sw.life -= 1.8 * dt;
        if (sw.life <= 0) {
          this.shockwaves.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.life * 0.75;
        ctx.lineWidth = 3 * sw.life;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, cy, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Click Energy Beams
      for (let i = this.clickBeams.length - 1; i >= 0; i--) {
        const bm = this.clickBeams[i];
        bm.life -= 5.5 * dt;
        if (bm.life <= 0) {
          this.clickBeams.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = bm.color;
        ctx.globalAlpha = bm.life;
        ctx.lineWidth = 3.2 * bm.life;
        ctx.beginPath();
        ctx.moveTo(bm.x1, bm.y1);
        ctx.lineTo(bm.x2, bm.y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (this.eraTransition > 0.02) {
        const r = (1 - this.eraTransition) * Math.min(this.width, this.height) * 0.68;
        ctx.strokeStyle = `rgba(192, 132, 252, ${this.eraTransition * 0.85})`;
        ctx.lineWidth = 5 * this.eraTransition;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = this.burstParticles.length - 1; i >= 0; i--) {
        const bp = this.burstParticles[i];
        bp.x += bp.vx * dt * 60;
        bp.y += bp.vy * dt * 60;
        bp.life -= 2.0 * dt;
        if (bp.life <= 0) {
          this.burstParticles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = bp.life;
        ctx.fillStyle = bp.color;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 3.0 * bp.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    renderDarkEnergyAura(ctx, t) {
      const cx = this.width * 0.5;
      const cy = this.getCenterY();
      this.drawGlow(ctx, "purple", cx, cy, Math.min(this.width, this.height) * 0.34);

      const count = Math.min(12, Math.max(3, Math.floor(Math.log2(state.darkEnergy + 1) * 2)));
      for (let i = 0; i < count; i++) {
        const a = t * 0.6 + (i / count) * Math.PI * 2;
        const p = this.project(Math.cos(a) * 230, Math.sin(a * 2) * 52, Math.sin(a) * 230);
        if (p.scale <= 0) continue;
        ctx.fillStyle = "#d8b4fe";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* -----------------------------------------------------------------------
       ERA I: ULTRA-HD GPU EARTH + CLOSED 3D MOON ORBIT + MEGACITIES + ELEVATORS
    ----------------------------------------------------------------------- */
    renderEarthScene(ctx, t) {
      const worldR = Math.min(this.width, this.height) * 0.215 * (1 + this.pulse * 0.04);
      const center = this.project(0, 0, 0);
      if (center.scale <= 0) return;

      const drills = state.clickUpgrades.clk_1 || 0;
      const extractors = state.generators.gen_1 || 0;
      const lunarColonies = state.generators.gen_2 || 0;
      const elevators = state.generators.gen_3 || 0;
      const queue = [];

      // True Closed Inclined 3D Moon Orbit
      const moonOrbitR = worldR * 1.95;
      const orbitTilt = 0.22;
      const moonAngle = t * 0.48;
      const mx = Math.cos(moonAngle) * moonOrbitR;
      const my = Math.sin(moonAngle) * moonOrbitR * orbitTilt;
      const mz = Math.sin(moonAngle) * moonOrbitR;
      const moonProj = this.project(mx, my, mz);

      const orbitSegs = 64;
      for (let i = 0; i < orbitSegs; i++) {
        const a1 = (i / orbitSegs) * Math.PI * 2;
        const a2 = ((i + 1) / orbitSegs) * Math.PI * 2;
        const p1 = this.project(Math.cos(a1) * moonOrbitR, Math.sin(a1) * moonOrbitR * orbitTilt, Math.sin(a1) * moonOrbitR);
        const p2 = this.project(Math.cos(a2) * moonOrbitR, Math.sin(a2) * moonOrbitR * orbitTilt, Math.sin(a2) * moonOrbitR);
        if (p1.scale <= 0 || p2.scale <= 0) continue;
        queue.push({
          z: (p1.z + p2.z) * 0.5,
          draw: () => {
            ctx.strokeStyle = "rgba(148, 163, 184, 0.16)";
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      }

      // 1. Ultra-HD GPU Earth
      queue.push({
        z: center.z,
        draw: () => {
          const sr = worldR * center.scale;
          this.drawGlow(ctx, "blue", center.x, center.y, sr * 1.38);
          this.gpuPlanets.draw(ctx, "earth", center.x, center.y, sr, {
            rotX: this.rotX,
            rotY: this.rotY,
            spin: this.earthSpin,
            time: t,
            cityBoost: Math.min(1.8, extractors * 0.22 + lunarColonies * 0.1),
            magmaBoost: Math.min(1.6, drills * 0.22 + extractors * 0.08)
          });
        }
      });

      // 2. Ultra-HD Cratered Moon (with Earthshine + Lunar Bases)
      if (moonProj.scale > 0) {
        queue.push({
          z: moonProj.z,
          draw: () => {
            const mr = worldR * 0.25 * moonProj.scale;
            this.gpuPlanets.draw(ctx, "moon", moonProj.x, moonProj.y, mr, {
              rotX: this.rotX,
              rotY: this.rotY,
              spin: moonAngle * 0.25,
              time: t,
              extraBoost: Math.min(1.8, lunarColonies * 0.32)
            });
          }
        });
      }

      // 3. Lunar Colony Supply Shuttles
      if (lunarColonies > 0 && moonProj.scale > 0) {
        const shuttleCount = Math.min(8, 1 + Math.floor(lunarColonies / 2));
        for (let i = 0; i < shuttleCount; i++) {
          const prog = (t * 0.42 + i / shuttleCount) % 1;
          const arcLift = Math.sin(prog * Math.PI) * worldR * 0.35;
          const sp = this.project(mx * prog, my * prog - arcLift, mz * prog);
          if (sp.scale > 0) {
            queue.push({
              z: sp.z,
              draw: () => {
                this.drawGlow(ctx, "cyan", sp.x, sp.y, 7.5 * sp.scale);
                ctx.fillStyle = "#e0f2fe";
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 2.2 * sp.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
      }

      // 4. Core Extractor Orbiting Thermal Satellites
      if (extractors > 0) {
        const satCount = Math.min(12, Math.max(2, Math.floor(extractors * 0.75)));
        for (let i = 0; i < satCount; i++) {
          const a = t * 0.85 + (i / satCount) * Math.PI * 2;
          const inc = (i % 3 - 1) * 0.55;
          const r = worldR * 1.19;
          const p = this.project(Math.cos(a) * r, Math.sin(a) * r * Math.sin(inc), Math.sin(a) * r * Math.cos(inc));
          if (p.scale > 0) {
            queue.push({
              z: p.z,
              draw: () => {
                this.drawGlow(ctx, "gold", p.x, p.y, 6.5 * p.scale);
                ctx.fillStyle = "#fb923c";
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.4 * p.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
      }

      // 5. 3D Space Elevators & Geostationary Orbital Ring
      if (elevators > 0) {
        const towerCount = Math.min(8, elevators);
        const topR = worldR * 1.48;

        for (let i = 0; i < towerCount; i++) {
          const lon = this.earthSpin + (i / towerCount) * Math.PI * 2;
          const bx = Math.cos(lon) * worldR * 0.98, bz = Math.sin(lon) * worldR * 0.98;
          const tx = Math.cos(lon) * topR, tz = Math.sin(lon) * topR;
          const pBase = this.project(bx, 0, bz);
          const pTop = this.project(tx, 0, tz);
          if (pBase.scale <= 0 || pTop.scale <= 0) continue;

          const climbT = (t * 0.65 + i * 0.27) % 1;
          const pClimb = this.project(bx + (tx - bx) * climbT, 0, bz + (tz - bz) * climbT);

          queue.push({
            z: (pBase.z + pTop.z) * 0.5,
            draw: () => {
              ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
              ctx.lineWidth = Math.max(1.2, 2.2 * pTop.scale);
              ctx.beginPath();
              ctx.moveTo(pBase.x, pBase.y);
              ctx.lineTo(pTop.x, pTop.y);
              ctx.stroke();

              const stR = 4.0 * pTop.scale;
              ctx.fillStyle = "#e0f2fe";
              ctx.fillRect(pTop.x - stR, pTop.y - stR, stR * 2, stR * 2);

              if (pClimb.scale > 0) {
                ctx.fillStyle = "#fde047";
                ctx.beginPath();
                ctx.arc(pClimb.x, pClimb.y, 2.6 * pClimb.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });
        }

        if (elevators >= 3) {
          const segs = 40;
          const ringAlpha = Math.min(0.9, 0.35 + (elevators - 2) * 0.12);
          for (let i = 0; i < segs; i++) {
            const a1 = this.earthSpin + (i / segs) * Math.PI * 2;
            const a2 = this.earthSpin + ((i + 1) / segs) * Math.PI * 2;
            const p1 = this.project(Math.cos(a1) * topR, 0, Math.sin(a1) * topR);
            const p2 = this.project(Math.cos(a2) * topR, 0, Math.sin(a2) * topR);
            if (p1.scale <= 0 || p2.scale <= 0) continue;
            queue.push({
              z: (p1.z + p2.z) * 0.5,
              draw: () => {
                ctx.strokeStyle = `rgba(125, 211, 252, ${ringAlpha})`;
                ctx.lineWidth = Math.max(1.5, 3.0 * p1.scale);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            });
          }
        }
      }

      queue.sort((a, b) => b.z - a.z);
      for (const item of queue) item.draw();
    }

    /* -----------------------------------------------------------------------
       ERA II: HD GPU SOLAR SYSTEM + ASTEROID MINERS + DYSON SWARM
    ----------------------------------------------------------------------- */
    renderSolarScene(ctx, t, dt) {
      const scaleFactor = Math.min(this.width, this.height) / 700;
      const sunWorldR = 38 * scaleFactor * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);
      if (center.scale <= 0) return;

      const massDrivers = state.clickUpgrades.clk_2 || 0;
      const asteroidMiners = state.generators.gen_4 || 0;
      const gasHarvesters = state.generators.gen_5 || 0;
      const dysonSwarms = state.generators.gen_6 || 0;
      const queue = [];

      ctx.lineWidth = 1;
      for (const pl of this.solarPlanets) {
        const d = pl.dist * scaleFactor;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.13)";
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 56; i++) {
          const a = (i / 56) * Math.PI * 2;
          const op = this.project(Math.cos(a) * d, Math.sin(a) * d * pl.tilt, Math.sin(a) * d);
          if (op.scale <= 0) { started = false; continue; }
          if (!started) { ctx.moveTo(op.x, op.y); started = true; }
          else ctx.lineTo(op.x, op.y);
        }
        ctx.stroke();
      }

      // 1. Boiling GPU Sun
      queue.push({
        z: center.z,
        draw: () => {
          const sr = sunWorldR * center.scale;
          this.drawGlow(ctx, "gold", center.x, center.y, sr * 2.55);
          this.gpuPlanets.draw(ctx, "sun", center.x, center.y, sr, {
            rotX: this.rotX,
            rotY: this.rotY,
            spin: t * 0.18,
            time: t
          });
        }
      });

      // 2. Seven GPU-Shaded Planets (lit from the Sun)
      for (const pl of this.solarPlanets) {
        pl.angle += pl.speed * dt;
        const d = pl.dist * scaleFactor;
        const px = Math.cos(pl.angle) * d;
        const py = Math.sin(pl.angle) * d * pl.tilt;
        const pz = Math.sin(pl.angle) * d;
        const proj = this.project(px, py, pz);
        if (proj.scale <= 0) continue;

        const invD = 1 / (Math.hypot(px, py, pz) || 1);
        const sunLight = { x: -px * invD, y: -py * invD, z: -pz * invD };
        const pr = pl.radius * scaleFactor * proj.scale;

        queue.push({
          z: proj.z,
          draw: () => {
            this.gpuPlanets.draw(ctx, pl.key, proj.x, proj.y, pr, {
              rotX: this.rotX,
              rotY: this.rotY,
              spin: t * 0.8 + pl.angle,
              time: t,
              lightDir: sunLight
            });
          }
        });

        // Clip-safe Saturn 3D Rings
        if (pl.ring) {
          const rInner = pl.radius * 1.42 * scaleFactor;
          const rOuter = pl.radius * 2.35 * scaleFactor;
          const segs = 24;
          for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const p1i = this.project(px + Math.cos(a1) * rInner, py + Math.sin(a1) * rInner * 0.35, pz + Math.sin(a1) * rInner);
            const p1o = this.project(px + Math.cos(a1) * rOuter, py + Math.sin(a1) * rOuter * 0.35, pz + Math.sin(a1) * rOuter);
            const p2o = this.project(px + Math.cos(a2) * rOuter, py + Math.sin(a2) * rOuter * 0.35, pz + Math.sin(a2) * rOuter);
            const p2i = this.project(px + Math.cos(a2) * rInner, py + Math.sin(a2) * rInner * 0.35, pz + Math.sin(a2) * rInner);
            if (p1i.scale <= 0 || p1o.scale <= 0 || p2o.scale <= 0 || p2i.scale <= 0) continue;

            queue.push({
              z: (p1i.z + p2o.z) * 0.5,
              draw: () => {
                ctx.fillStyle = i % 2 === 0 ? "rgba(253, 230, 138, 0.58)" : "rgba(217, 179, 108, 0.48)";
                ctx.beginPath();
                ctx.moveTo(p1i.x, p1i.y); ctx.lineTo(p1o.x, p1o.y);
                ctx.lineTo(p2o.x, p2o.y); ctx.lineTo(p2i.x, p2i.y);
                ctx.closePath();
                ctx.fill();
              }
            });
          }
        }

        if (pl.gasGiant && gasHarvesters > 0) {
          const harvRingR = pl.radius * 1.55 * scaleFactor;
          const drones = Math.min(8, 2 + gasHarvesters);
          for (let i = 0; i < drones; i++) {
            const a = t * 1.8 + (i / drones) * Math.PI * 2;
            const hp = this.project(px + Math.cos(a) * harvRingR, py - pl.radius * 0.65 * scaleFactor, pz + Math.sin(a) * harvRingR);
            if (hp.scale <= 0) continue;
            queue.push({
              z: hp.z,
              draw: () => {
                ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
                ctx.lineWidth = 1.4 * hp.scale;
                ctx.beginPath();
                ctx.moveTo(hp.x, hp.y);
                ctx.lineTo(proj.x, proj.y);
                ctx.stroke();
                ctx.fillStyle = "#38bdf8";
                ctx.beginPath();
                ctx.arc(hp.x, hp.y, 2.5 * hp.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
      }

      if (massDrivers > 0) {
        const mdR = sunWorldR * 1.52;
        const segs = 24;
        for (let i = 0; i < segs; i++) {
          const a1 = -t * 0.7 + (i / segs) * Math.PI * 2;
          const a2 = -t * 0.7 + ((i + 1) / segs) * Math.PI * 2;
          const p1 = this.project(Math.cos(a1) * mdR, 0, Math.sin(a1) * mdR);
          const p2 = this.project(Math.cos(a2) * mdR, 0, Math.sin(a2) * mdR);
          if (p1.scale <= 0 || p2.scale <= 0) continue;
          queue.push({
            z: (p1.z + p2.z) * 0.5,
            draw: () => {
              ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
              ctx.lineWidth = 2 * p1.scale;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          });
        }
      }

      if (asteroidMiners > 0) {
        const visibleCount = Math.min(this.asteroids.length, 16 + asteroidMiners * 8);
        for (let i = 0; i < visibleCount; i++) {
          const ast = this.asteroids[i];
          ast.angle += ast.speed * dt;
          const d = ast.dist * scaleFactor;
          const ap = this.project(Math.cos(ast.angle) * d, ast.y * scaleFactor, Math.sin(ast.angle) * d);
          if (ap.scale <= 0) continue;
          const hasLaser = i % Math.max(2, 12 - Math.min(10, asteroidMiners)) === 0;
          queue.push({
            z: ap.z,
            draw: () => {
              const s = ast.size * scaleFactor * ap.scale;
              ctx.fillStyle = "#94a3b8";
              ctx.beginPath();
              ctx.moveTo(ap.x, ap.y - s);
              ctx.lineTo(ap.x + s * 0.85, ap.y - s * 0.2);
              ctx.lineTo(ap.x + s * 0.45, ap.y + s * 0.9);
              ctx.lineTo(ap.x - s * 0.75, ap.y + s * 0.5);
              ctx.closePath();
              ctx.fill();
              if (hasLaser) {
                ctx.strokeStyle = "rgba(52, 211, 153, 0.75)";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(ap.x + s * 2.2, ap.y - s * 2.5);
                ctx.lineTo(ap.x, ap.y);
                ctx.stroke();
              }
            }
          });
        }
      }

      if (dysonSwarms > 0) {
        const ringCount = Math.min(5, 1 + Math.floor(dysonSwarms / 2));
        const panelsPerRing = Math.min(24, 8 + dysonSwarms * 2);
        const dysonR = sunWorldR * 1.32;

        for (let rIdx = 0; rIdx < ringCount; rIdx++) {
          const tiltX = (rIdx / ringCount) * Math.PI * 0.85;
          const tiltZ = rIdx * 0.65;
          const ringSpin = t * (0.45 + rIdx * 0.12) * (rIdx % 2 === 0 ? 1 : -1);

          for (let pIdx = 0; pIdx < panelsPerRing; pIdx++) {
            const a = ringSpin + (pIdx / panelsPerRing) * Math.PI * 2;
            const x = Math.cos(a) * dysonR;
            const z = Math.sin(a) * dysonR;
            const y1 = -z * Math.sin(tiltX);
            const z1 = z * Math.cos(tiltX);
            const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
            const y2 = y1 * Math.cos(tiltZ) + x * Math.sin(tiltZ);
            const pp = this.project(x2, y2, z1);
            if (pp.scale <= 0) continue;

            queue.push({
              z: pp.z,
              draw: () => {
                const ps = Math.max(2.2, 4.5 * scaleFactor * pp.scale);
                ctx.fillStyle = pp.z < 0 ? "#fbbf24" : "#b45309";
                ctx.strokeStyle = "#fef08a";
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                  const ha = (k / 6) * Math.PI * 2;
                  const hx = pp.x + Math.cos(ha) * ps;
                  const hy = pp.y + Math.sin(ha) * ps;
                  if (k === 0) ctx.moveTo(hx, hy);
                  else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              }
            });
          }
        }
      }

      queue.sort((a, b) => b.z - a.z);
      for (const item of queue) item.draw();
    }

    /* -----------------------------------------------------------------------
       ERA III: LOCAL STAR CLUSTER
    ----------------------------------------------------------------------- */
    renderStarClusterScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 560) * (1 + this.pulse * 0.05);
      const nurseries = state.generators.gen_7 || 0;
      const starRings = state.generators.gen_8 || 0;
      const warpGates = state.generators.gen_9 || 0;

      const projected = this.clusterStars.map((st, idx) => {
        const drift = Math.sin(t * 0.8 + st.phase) * 3.5;
        const p = this.project((st.x + drift) * scaleFactor, (st.y - drift * 0.6) * scaleFactor, st.z * scaleFactor);
        return { ...p, st, idx };
      });

      if (nurseries > 0) {
        const cloudCount = Math.min(18, 3 + nurseries * 2);
        for (let i = 0; i < cloudCount; i++) {
          const p = projected[i % projected.length];
          if (p.scale <= 0) continue;
          this.drawGlow(ctx, i % 2 === 0 ? "pink" : "cyan", p.x, p.y, 70 * scaleFactor * p.scale);
        }
      }

      if (warpGates > 0) {
        const activeLanes = Math.min(this.clusterLanes.length, 4 + warpGates * 4);
        for (let i = 0; i < activeLanes; i++) {
          const lane = this.clusterLanes[i];
          const a = projected[lane.a];
          const b = projected[lane.b];
          if (a.scale <= 0 || b.scale <= 0) continue;

          ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
          ctx.lineWidth = 1.6 * ((a.scale + b.scale) * 0.5);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          const prog = (t * 0.75 + lane.phase) % 1;
          ctx.fillStyle = "#e0f2fe";
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * prog, a.y + (b.y - a.y) * prog, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const sorted = [...projected].sort((a, b) => b.z - a.z);
      const ringedStars = Math.min(14, starRings * 2);

      for (const p of sorted) {
        if (p.scale <= 0) continue;
        const r = p.st.radius * scaleFactor * p.scale * (1 + 0.08 * Math.sin(t * 2.5 + p.st.phase));

        this.drawGlow(ctx, p.st.glow, p.x, p.y, r * 2.6);
        ctx.fillStyle = p.st.core;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        if (p.idx < ringedStars) {
          ctx.strokeStyle = "rgba(253, 224, 71, 0.8)";
          ctx.lineWidth = 1.8 * p.scale;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r * 1.35, r * 0.45, t * 0.9 + p.st.phase, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    /* -----------------------------------------------------------------------
       ERA IV: MILKY WAY (CLIP-SAFE PULSARS & BLACK HOLE ACCRETION DISK)
    ----------------------------------------------------------------------- */
    renderMilkyWayScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 560) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);

      const nebulaCount = state.generators.gen_10 || 0;
      const pulsarCount = state.generators.gen_11 || 0;
      const penroseCount = state.generators.gen_12 || 0;

      if (penroseCount === 0 && center.scale > 0) {
        this.drawGlow(ctx, "gold", center.x, center.y, 92 * scaleFactor * center.scale);
      }

      if (nebulaCount > 0) {
        const activeNeb = Math.min(this.nebulae.length, 4 + nebulaCount * 3);
        for (let i = 0; i < activeNeb; i++) {
          const neb = this.nebulae[i];
          const p = this.project(neb.x * scaleFactor, neb.y * scaleFactor, neb.z * scaleFactor);
          if (p.scale <= 0) continue;
          this.drawGlow(ctx, neb.glow, p.x, p.y, neb.radius * scaleFactor * p.scale);
        }
      }

      for (const star of this.galaxyStars) {
        const p = this.project(star.x * scaleFactor, star.y * scaleFactor, star.z * scaleFactor);
        if (p.scale <= 0) continue;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.min(0.95, 0.48 * p.scale);
        const s = star.size * p.scale;
        ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, s, s);
      }
      ctx.globalAlpha = 1;

      if (pulsarCount > 0) {
        const activePulsars = Math.min(this.pulsars.length, 1 + pulsarCount);
        for (let i = 0; i < activePulsars; i++) {
          const pul = this.pulsars[i];
          const p = this.project(pul.x * scaleFactor, pul.y * scaleFactor, pul.z * scaleFactor);
          if (p.scale <= 0) continue;

          const beamAngle = t * pul.spinSpeed + i;
          const beamLen = 38 * scaleFactor;
          const bx = Math.cos(beamAngle) * beamLen;
          const by = Math.sin(pul.tilt) * beamLen * 0.85;
          const bz = Math.sin(beamAngle) * beamLen;

          const pTip1 = this.project((pul.x + bx) * scaleFactor, (pul.y + by) * scaleFactor, (pul.z + bz) * scaleFactor);
          const pTip2 = this.project((pul.x - bx) * scaleFactor, (pul.y - by) * scaleFactor, (pul.z - bz) * scaleFactor);

          if (pTip1.scale > 0 && pTip2.scale > 0) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.72)";
            ctx.lineWidth = 2.2 * p.scale;
            ctx.beginPath();
            ctx.moveTo(pTip1.x, pTip1.y);
            ctx.lineTo(pTip2.x, pTip2.y);
            ctx.stroke();
          }

          ctx.fillStyle = "#e0f2fe";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.4 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (penroseCount > 0 && center.scale > 0) {
        const bhR = (16 + Math.min(12, penroseCount * 1.4)) * scaleFactor;
        const jetH = (125 + Math.min(85, penroseCount * 11)) * scaleFactor;
        const queue = [];

        const pTop = this.project(0, -jetH, 0);
        const pBot = this.project(0, jetH, 0);
        if (pTop.scale > 0 && pBot.scale > 0) {
          queue.push({
            z: center.z + 5,
            draw: () => {
              const jGrad1 = ctx.createLinearGradient(center.x, center.y, pTop.x, pTop.y);
              jGrad1.addColorStop(0, "rgba(192, 132, 252, 0.92)");
              jGrad1.addColorStop(1, "rgba(56, 189, 248, 0)");
              ctx.strokeStyle = jGrad1;
              ctx.lineWidth = 7 * center.scale;
              ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(pTop.x, pTop.y); ctx.stroke();

              const jGrad2 = ctx.createLinearGradient(center.x, center.y, pBot.x, pBot.y);
              jGrad2.addColorStop(0, "rgba(192, 132, 252, 0.92)");
              jGrad2.addColorStop(1, "rgba(56, 189, 248, 0)");
              ctx.strokeStyle = jGrad2;
              ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(pBot.x, pBot.y); ctx.stroke();
            }
          });
        }

        const segs = 30;
        for (let i = 0; i < segs; i++) {
          const a1 = t * 2.2 + (i / segs) * Math.PI * 2;
          const a2 = t * 2.2 + ((i + 1) / segs) * Math.PI * 2;
          const rIn = bhR * 1.3, rOut = bhR * 2.8;
          const p1i = this.project(Math.cos(a1) * rIn, 0, Math.sin(a1) * rIn);
          const p1o = this.project(Math.cos(a1) * rOut, 0, Math.sin(a1) * rOut);
          const p2o = this.project(Math.cos(a2) * rOut, 0, Math.sin(a2) * rOut);
          const p2i = this.project(Math.cos(a2) * rIn, 0, Math.sin(a2) * rIn);
          if (p1i.scale <= 0 || p1o.scale <= 0 || p2o.scale <= 0 || p2i.scale <= 0) continue;

          queue.push({
            z: (p1i.z + p2o.z) * 0.5,
            draw: () => {
              ctx.fillStyle = i % 2 === 0 ? "rgba(251, 146, 60, 0.78)" : "rgba(254, 215, 170, 0.65)";
              ctx.beginPath();
              ctx.moveTo(p1i.x, p1i.y); ctx.lineTo(p1o.x, p1o.y);
              ctx.lineTo(p2o.x, p2o.y); ctx.lineTo(p2i.x, p2i.y);
              ctx.closePath();
              ctx.fill();
            }
          });
        }

        queue.push({
          z: center.z,
          draw: () => {
            const sr = bhR * center.scale;
            ctx.strokeStyle = "#fde047";
            ctx.lineWidth = 2.6;
            ctx.fillStyle = "#020205";
            ctx.beginPath();
            ctx.arc(center.x, center.y, sr, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        });

        queue.sort((a, b) => b.z - a.z);
        for (const item of queue) item.draw();
      }
    }

    /* -----------------------------------------------------------------------
       ERA V: LANIAKEA SUPERCLUSTER
    ----------------------------------------------------------------------- */
    renderSuperclusterScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 550) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);

      const tidalSiphons = state.generators.gen_13 || 0;
      const darkConduits = state.generators.gen_14 || 0;
      const greatAttractor = state.generators.gen_15 || 0;

      const projected = this.superGalaxies.map((g, idx) => {
        const flow = Math.sin(t * 0.6 + g.phase) * 5;
        const p = this.project((g.x + flow) * scaleFactor, g.y * scaleFactor, (g.z - flow) * scaleFactor);
        return { ...p, g, idx };
      });

      if (darkConduits > 0 && center.scale > 0) {
        const streamCount = Math.min(projected.length, 8 + darkConduits * 4);
        ctx.strokeStyle = "rgba(168, 85, 247, 0.34)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < streamCount; i++) {
          const p = projected[i];
          if (p.scale <= 0) continue;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo((p.x + center.x) * 0.5 + 18, (p.y + center.y) * 0.5 - 18, center.x, center.y);
          ctx.stroke();
        }
      }

      if (tidalSiphons > 0) {
        const bridges = Math.min(projected.length - 1, 5 + tidalSiphons * 4);
        ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < bridges; i++) {
          const a = projected[i];
          const b = projected[(i + 5) % projected.length];
          if (a.scale <= 0 || b.scale <= 0) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (center.scale > 0) {
        const attrSize = (greatAttractor > 0 ? 75 + Math.min(45, greatAttractor * 5) : 45) * scaleFactor * center.scale;
        this.drawGlow(ctx, greatAttractor > 0 ? "gold" : "purple", center.x, center.y, attrSize);
        if (greatAttractor > 0) {
          for (let r = 0; r < 3; r++) {
            ctx.strokeStyle = r % 2 === 0 ? "rgba(253, 224, 71, 0.65)" : "rgba(192, 132, 252, 0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, attrSize * (0.45 + r * 0.22), attrSize * (0.18 + r * 0.08), t * (0.8 + r * 0.3), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      const sorted = [...projected].sort((a, b) => b.z - a.z);
      for (const p of sorted) {
        if (p.scale <= 0) continue;
        const r = p.g.size * scaleFactor * p.scale;
        this.drawGlow(ctx, p.g.glow, p.x, p.y, r * 1.4);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.g.tilt + t * 0.25);
        ctx.strokeStyle = "rgba(224, 242, 254, 0.72)";
        ctx.lineWidth = Math.max(1, r * 0.14);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.95, r * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* -----------------------------------------------------------------------
       ERA VI: OBSERVABLE UNIVERSE
    ----------------------------------------------------------------------- */
    renderUniverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const quasars = state.generators.gen_16 || 0;
      const looms = state.generators.gen_17 || 0;
      const vacuumEngines = state.generators.gen_18 || 0;

      const projected = this.webNodes.map((n, idx) => {
        const wobble = Math.sin(t * 1.4 + n.phase) * 4;
        const p = this.project((n.x + wobble) * scaleFactor, (n.y - wobble) * scaleFactor, (n.z + wobble) * scaleFactor);
        return { ...p, node: n, idx };
      });

      const loomBoost = Math.min(1, looms * 0.16);
      for (let i = 0; i < this.webEdges.length; i++) {
        const edge = this.webEdges[i];
        const a = projected[edge.a];
        const b = projected[edge.b];
        if (a.scale <= 0 || b.scale <= 0) continue;

        const avgScale = (a.scale + b.scale) * 0.5;
        const depthAlpha = clamp(avgScale - 0.5, 0.08, 0.45) + loomBoost * 0.35;
        ctx.strokeStyle = looms > 0
          ? `rgba(129, 140, 248, ${Math.min(0.85, depthAlpha)})`
          : `rgba(168, 85, 247, ${depthAlpha})`;
        ctx.lineWidth = (1.0 + loomBoost * 1.2) * avgScale;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        if (looms > 0 && i % Math.max(1, 6 - Math.min(5, looms)) === 0) {
          const prog = (t * 0.7 + edge.phase) % 1;
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * prog, a.y + (b.y - a.y) * prog, 2.2 * avgScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const sorted = [...projected].sort((a, b) => b.z - a.z);
      const quasarCount = Math.min(20, quasars * 2);

      for (const p of sorted) {
        if (p.scale <= 0) continue;
        const isQuasar = p.idx < quasarCount;
        const pulseR = p.node.size * p.scale * (1 + 0.22 * Math.sin(t * 3 + p.node.phase));

        if (isQuasar) {
          const jLen = 28 * p.scale;
          ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
          ctx.lineWidth = 2.0 * p.scale;
          ctx.beginPath();
          ctx.moveTo(p.x - jLen * 0.4, p.y - jLen);
          ctx.lineTo(p.x + jLen * 0.4, p.y + jLen);
          ctx.stroke();
          this.drawGlow(ctx, "gold", p.x, p.y, pulseR * 3.8);
        } else {
          ctx.fillStyle = p.node.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (vacuumEngines > 0) {
        const center = this.project(0, 0, 0);
        if (center.scale > 0) {
          const shells = Math.min(4, 1 + Math.floor(vacuumEngines / 2));
          for (let s = 0; s < shells; s++) {
            const rad = (55 + s * 36) * scaleFactor * center.scale * (1 + 0.04 * Math.sin(t * 2 + s));
            ctx.strokeStyle = s % 2 === 0 ? "rgba(56, 189, 248, 0.55)" : "rgba(244, 114, 182, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, rad, rad * 0.62, t * (0.4 + s * 0.15) * (s % 2 ? -1 : 1), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    /* -----------------------------------------------------------------------
       ERA VII: THE OMNIVERSE (4D TESSERACT + 3D BUBBLE UNIVERSES)
    ----------------------------------------------------------------------- */
    renderOmniverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);
      if (center.scale <= 0) return;

      const bubblesOwned = state.generators.gen_19 || 0;
      const wormholesOwned = state.generators.gen_20 || 0;
      const loomOwned = state.generators.gen_21 || 0;

      this.drawGlow(ctx, "purple", center.x, center.y, 120 * scaleFactor * center.scale);

      const visibleBubbles = Math.min(this.bubbleUniverses.length, 6 + bubblesOwned * 2);
      const bubbleProjs = [];
      for (let i = 0; i < visibleBubbles; i++) {
        const b = this.bubbleUniverses[i];
        const a = b.theta + t * b.speed;
        const r = b.orbitR * scaleFactor;
        const p = this.project(r * Math.sin(b.phi) * Math.cos(a), r * Math.cos(b.phi) * 0.78, r * Math.sin(b.phi) * Math.sin(a));
        bubbleProjs.push({ ...p, b, idx: i });
      }

      if (wormholesOwned > 0 && bubbleProjs.length > 1) {
        const links = Math.min(bubbleProjs.length, 3 + wormholesOwned * 2);
        for (let i = 0; i < links; i++) {
          const p1 = bubbleProjs[i];
          const p2 = bubbleProjs[(i + 1) % bubbleProjs.length];
          if (p1.scale <= 0 || p2.scale <= 0) continue;

          ctx.strokeStyle = "rgba(56, 189, 248, 0.52)";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(center.x, center.y, p2.x, p2.y);
          ctx.stroke();

          const prog = (t * 0.8 + i * 0.17) % 1;
          const u = 1 - prog;
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(
            u * u * p1.x + 2 * u * prog * center.x + prog * prog * p2.x,
            u * u * p1.y + 2 * u * prog * center.y + prog * prog * p2.y,
            2.8, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }

      const tessSize = (78 + Math.min(34, loomOwned * 4)) * scaleFactor;
      const cosXW = Math.cos(t * 0.75), sinXW = Math.sin(t * 0.75);
      const cosZW = Math.cos(t * 0.52), sinZW = Math.sin(t * 0.52);

      const projTess = this.tesseractVerts.map(([x, y, z, w]) => {
        const x1 = x * cosXW - w * sinXW;
        const w1 = x * sinXW + w * cosXW;
        const z2 = z * cosZW - w1 * sinZW;
        const w2 = z * sinZW + w1 * cosZW;
        const d4 = 2.6 / (3.4 - w2);
        return this.project(x1 * d4 * tessSize, y * d4 * tessSize, z2 * d4 * tessSize);
      });

      const queue = [{
        z: center.z,
        draw: () => {
          ctx.lineWidth = loomOwned > 0 ? 2.4 : 1.7;
          for (const [i, j] of this.tesseractEdges) {
            const p1 = projTess[i];
            const p2 = projTess[j];
            if (p1.scale <= 0 || p2.scale <= 0) continue;
            ctx.strokeStyle = (i >= 8 && j >= 8) ? "rgba(56, 189, 248, 0.92)"
              : (i < 8 && j < 8) ? "rgba(232, 121, 249, 0.92)"
              : "rgba(253, 224, 71, 0.8)";
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }

          if (loomOwned > 0) {
            const rings = Math.min(4, 1 + Math.floor(loomOwned / 2));
            for (let r = 0; r < rings; r++) {
              const rad = (105 + r * 24) * scaleFactor * center.scale;
              ctx.strokeStyle = r % 2 === 0 ? "rgba(56, 189, 248, 0.65)" : "rgba(244, 114, 182, 0.65)";
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.ellipse(center.x, center.y, rad, rad * 0.42, t * (0.65 + r * 0.25) * (r % 2 ? -1 : 1), 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
      }];

      for (const bp of bubbleProjs) {
        if (bp.scale <= 0) continue;
        queue.push({
          z: bp.z,
          draw: () => {
            const r = bp.b.radius * scaleFactor * bp.scale;
            ctx.fillStyle = bp.b.fill;
            ctx.strokeStyle = bp.b.stroke;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
            ctx.beginPath();
            ctx.arc(bp.x - r * 0.32, bp.y - r * 0.32, r * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      queue.sort((a, b) => b.z - a.z);
      for (const item of queue) item.draw();
    }
  }

  const canvas = document.getElementById("cosmosCanvas");
  const cosmos3D = new Cosmos3DEngine(canvas);

  /* =========================================================================
     8. CANVAS INTERACTION (CLICK, SMOOTH ORBIT DRAG & SCROLL ZOOM)
  ========================================================================= */
  let isDragging = false;
  let dragMoved = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    audio.init();
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

    cosmos3D.velY = dx * 0.0055;
    cosmos3D.velX = dy * 0.0045;
    cosmos3D.rotY += cosmos3D.velY;
    cosmos3D.rotX = clamp(cosmos3D.rotX + cosmos3D.velX, -1.32, 1.32);

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  canvas.addEventListener("pointerup", (e) => {
    isDragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    if (!dragMoved) handleCosmosClick(e.clientX, e.clientY);
  });

  canvas.addEventListener("pointercancel", () => {
    isDragging = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    cosmos3D.targetZoom = clamp(cosmos3D.targetZoom + delta, 0.65, 1.9);
  }, { passive: false });

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
    setTimeout(() => el.remove(), 900);
  }

  /* =========================================================================
     9. UI RENDERING, ACTIVE 3D STRUCTURES & ACTIONS
  ========================================================================= */
  function updateStructuresBar() {
    const bar = document.getElementById("structuresBar");
    const active = [];

    const eraGens = GENERATORS.filter(g => g.era === state.era);
    const eraClk = CLICK_UPGRADES.find(c => c.era === state.era);

    if (eraClk && (state.clickUpgrades[eraClk.id] || 0) > 0) {
      active.push(`${eraClk.icon} ${eraClk.name} Lv.${state.clickUpgrades[eraClk.id]}`);
    }
    for (const g of eraGens) {
      const cnt = state.generators[g.id] || 0;
      if (cnt > 0) active.push(`${g.icon} ${g.name} x${cnt}`);
    }

    if (active.length === 0) {
      bar.innerHTML = `<span style="opacity:0.7">Purchase upgrades to construct 3D structures on this Era's model</span>`;
    } else {
      bar.innerHTML = active.map(s => `<span class="struct-pill">${s}</span>`).join("");
    }
  }

  function updateHUD() {
    document.getElementById("matterDisplay").textContent = formatNum(state.matter);
    document.getElementById("mpsDisplay").textContent = formatNum(getMps());
    document.getElementById("mpcDisplay").textContent = formatNum(getMpc());
    document.getElementById("totalEarnedDisplay").textContent = `Run Matter: ${formatNum(state.runMatterEarned)}`;
    document.getElementById("eraBadge").textContent = ERAS[state.era].badge;

    const dePill = document.getElementById("darkEnergyPill");
    if (state.darkEnergy > 0) {
      dePill.style.display = "inline-block";
      document.getElementById("deBonusDisplay").textContent = `+${formatNum(state.darkEnergy * 20)}%`;
    } else {
      dePill.style.display = "none";
    }
  }

  function buyGenerator(id) {
    const gen = GENERATORS.find(g => g.id === id);
    if (!gen || state.era < gen.era) return;
    const owned = state.generators[id] || 0;
    const cost = getGenCost(gen.baseCost, owned);
    if (state.matter < cost) return;

    state.matter -= cost;
    state.generators[id] = owned + 1;
    audio.playUpgrade();
    cosmos3D.triggerUpgradePulse();
    if (owned === 0) showToast(`3D Model Evolved: ${gen.name} constructed!`);
    renderTab();
    updateHUD();
    updateStructuresBar();
  }

  function buyClickUpgrade(id) {
    const upg = CLICK_UPGRADES.find(c => c.id === id);
    if (!upg || state.era < upg.era) return;
    const owned = state.clickUpgrades[id] || 0;
    const cost = getClickCost(upg.baseCost, owned);
    if (state.matter < cost) return;

    state.matter -= cost;
    state.clickUpgrades[id] = owned + 1;
    audio.playUpgrade();
    cosmos3D.triggerUpgradePulse();
    if (owned === 0) showToast(`3D Effect Active: ${upg.name}!`);
    renderTab();
    updateHUD();
    updateStructuresBar();
  }

  function unlockEra(eraId) {
    if (eraId !== state.era + 1) return;
    const era = ERAS[eraId];
    if (!era || state.matter < era.cost) return;

    state.matter -= era.cost;
    state.era = eraId;
    cosmos3D.setEra(eraId, false);
    audio.playTierUp();
    saveGame(false, true);
    renderTab();
    updateHUD();
    updateStructuresBar();
    showToast(`Cosmic Scale Expanded: ${era.name}!`);
  }

  function triggerBigCrunch() {
    const pendingDE = calculatePendingDarkEnergy();
    if (state.era < 5 || pendingDE < 1) return;

    if (!confirm(`Trigger the Big Crunch to reset progress and claim +${formatNum(pendingDE)} Dark Energy (+${formatNum(pendingDE * 20)}% permanent production)?`)) {
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
    saveGame(false, true);
    renderTab();
    updateHUD();
    updateStructuresBar();
    showToast(`Big Crunch Complete! +${formatNum(pendingDE)} Dark Energy`);
  }

  function renderTab() {
    const container = document.getElementById("tabContent");
    container.innerHTML = "";

    if (activeTab === "generators") {
      const clkHeader = document.createElement("div");
      clkHeader.className = "section-header";
      clkHeader.innerHTML = `<span>👆 Click Amplifiers</span><span>Balanced 1.35x Cost</span>`;
      container.appendChild(clkHeader);

      CLICK_UPGRADES.forEach(upg => {
        if (state.era < upg.era) return;
        const owned = state.clickUpgrades[upg.id] || 0;
        const cost = getClickCost(upg.baseCost, owned);
        const btn = document.createElement("button");
        btn.className = "upgrade-card";
        btn.dataset.cost = cost;
        btn.disabled = state.matter < cost;
        btn.innerHTML = `
          <div class="card-icon">${upg.icon}</div>
          <div class="card-body">
            <div class="card-title">${upg.name} <span class="era-tag">Era ${upg.era + 1}</span></div>
            <div class="card-desc">${upg.desc}</div>
            <div class="card-visual-tag">✨ ${upg.visual}</div>
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
        if (gen.era > state.era + 1) return;
        const lockedByEra = state.era < gen.era;
        const owned = state.generators[gen.id] || 0;
        const cost = getGenCost(gen.baseCost, owned);
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
              <div class="card-visual-tag">✨ ${gen.visual}</div>
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
      header.innerHTML = `<span>🌠 Cosmic Scale Progression</span><span>Current: Era ${state.era + 1} / ${ERAS.length}</span>`;
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
        if (isNext) card.addEventListener("click", () => unlockEra(era.id));
        container.appendChild(card);
      });

    } else if (activeTab === "prestige") {
      const pendingDE = calculatePendingDarkEnergy();
      const box = document.createElement("div");
      box.className = "prestige-box";
      box.innerHTML = `
        <h2>🕳️ The Big Crunch</h2>
        <p>
          Once you reach <strong>Era VI: Observable Universe</strong> (or ascend to <strong>Era VII: The Omniverse</strong> for massive payouts) and accumulate at least <strong>100.00T Run Matter</strong>, you can collapse spacetime into a singularity.
        </p>
        <p>
          This resets your Matter, Generators, Click Amplifiers, and Cosmic Era back to Planet Earth, crystallizing your cosmic mass into permanent <strong>Dark Energy</strong> (+20% multiplicative production per unit + orbiting Dark Energy aura).
        </p>
        <div class="prestige-metrics">
          <div class="metric-tile">
            <div class="lbl">Current Dark Energy</div>
            <div class="val" id="prestigeCurDE">${formatNum(state.darkEnergy)} (+${formatNum(state.darkEnergy * 20)}%)</div>
          </div>
          <div class="metric-tile">
            <div class="lbl">Claimable on Crunch</div>
            <div class="val" id="prestigePendingDE">+${formatNum(pendingDE)} DE</div>
          </div>
          <div class="metric-tile">
            <div class="lbl">Big Crunches</div>
            <div class="val" id="prestigeCountVal">${state.prestigeCount}</div>
          </div>
          <div class="metric-tile">
            <div class="lbl">Lifetime Matter</div>
            <div class="val" id="prestigeLifetimeVal">${formatNum(state.lifetimeMatterEarned)}</div>
          </div>
        </div>
        <button class="crunch-btn" id="crunchActionBtn" ${(state.era < 5 || pendingDE < 1) ? "disabled" : ""}>
          ${state.era < 5 ? "🔒 Reach Era VI: Observable Universe First" : (pendingDE < 1 ? "Need 100.00T Run Matter to Crunch" : `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`)}
        </button>
      `;
      container.appendChild(box);

      const crunchBtn = document.getElementById("crunchActionBtn");
      if (crunchBtn) {
        crunchBtn.addEventListener("click", triggerBigCrunch);
      }
    }
  }

  function refreshAffordability() {
    const cards = document.querySelectorAll("#tabContent .upgrade-card[data-cost]");
    cards.forEach(card => {
      if (card.classList.contains("unlocked-milestone")) return;
      const cost = Number(card.dataset.cost);
      card.disabled = !Number.isFinite(cost) || state.matter < cost;
    });

    if (activeTab === "prestige") {
      const pendingDE = calculatePendingDarkEnergy();
      const pendingEl = document.getElementById("prestigePendingDE");
      const lifeEl = document.getElementById("prestigeLifetimeVal");
      const btn = document.getElementById("crunchActionBtn");

      if (pendingEl) pendingEl.textContent = `+${formatNum(pendingDE)} DE`;
      if (lifeEl) lifeEl.textContent = formatNum(state.lifetimeMatterEarned);
      if (btn) {
        btn.disabled = state.era < 5 || pendingDE < 1;
        if (state.era < 5) {
          btn.textContent = "🔒 Reach Era VI: Observable Universe First";
        } else if (pendingDE < 1) {
          btn.textContent = "Need 100.00T Run Matter to Crunch";
        } else {
          btn.textContent = `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`;
        }
      }
    }
  }

  /* =========================================================================
     10. EVENT WIRING & MAIN LOOP
  ========================================================================= */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      audio.init();
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
      renderTab();
    });
  });

  document.getElementById("musicBtn").addEventListener("click", (e) => {
    audio.init();
    const next = !audio.musicEnabled;
    audio.setMusicEnabled(next);
    e.target.textContent = next ? "🎵 Music On" : "🎵 Music Off";
    e.target.classList.toggle("muted", !next);
  });

  document.getElementById("sfxBtn").addEventListener("click", (e) => {
    audio.init();
    audio.sfxMuted = !audio.sfxMuted;
    e.target.textContent = audio.sfxMuted ? "🔇 SFX Off" : "🔊 SFX On";
    e.target.classList.toggle("muted", audio.sfxMuted);
  });

  document.getElementById("saveBtn").addEventListener("click", () => saveGame(true, false));
  document.getElementById("resetBtn").addEventListener("click", hardReset);

  // Initialize Game
  loadGame();
  cosmos3D.setEra(state.era, true);
  renderTab();
  updateHUD();
  updateStructuresBar();

  let lastFrameTime = performance.now();
  let uiAccumulator = 0;
  let saveAccumulator = 0;

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    const mps = getMps();
    if (mps > 0) {
      const gained = mps * dt;
      state.matter += gained;
      state.runMatterEarned += gained;
      state.lifetimeMatterEarned += gained;
    }

    cosmos3D.render(now, dt);

    uiAccumulator += dt;
    if (uiAccumulator >= 0.08) {
      uiAccumulator = 0;
      updateHUD();
      refreshAffordability();
    }

    saveAccumulator += dt;
    if (saveAccumulator >= 10) {
      saveAccumulator = 0;
      saveGame(false, true);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();