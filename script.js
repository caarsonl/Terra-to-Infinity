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
     2. PROCEDURAL WEB AUDIO ENGINE (SFX + 10-ERA AUTO AMBIENT SOUNDTRACK)
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
          this.musicMaster.gain.value = this.musicEnabled ? 0.15 : 0;
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
        this.musicMaster.gain.linearRampToValueAtTime(enabled ? 0.15 : 0.0001, now + 0.45);
      }
      if (enabled && !this.musicStarted && this.ctx) {
        this.startAmbientMusic();
      }
    }

    startAmbientMusic() {
      if (this.musicStarted || !this.ctx) return;
      this.musicStarted = true;

      const eraScales = [
        [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // Era 0: Earth
        [293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // Era 1: Solar
        [220.00, 261.63, 329.63, 392.00, 440.00, 523.25], // Era 2: Cluster
        [196.00, 233.08, 293.66, 349.23, 392.00, 466.16], // Era 3: Milky Way
        [246.94, 293.66, 369.99, 440.00, 493.88, 587.33], // Era 4: Local Group
        [174.61, 220.00, 261.63, 329.63, 349.23, 440.00], // Era 5: Laniakea
        [164.81, 196.00, 246.94, 293.66, 329.63, 493.88], // Era 6: Universe
        [207.65, 246.94, 311.13, 369.99, 415.30, 554.37], // Era 7: Multiverse
        [261.63, 329.63, 392.00, 493.88, 587.33, 783.99], // Era 8: Omniverse
        [293.66, 369.99, 440.00, 554.37, 659.25, 880.00]  // Era 9: Architect's Void
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

        if (Math.random() < 0.76) {
          const note = scale[Math.floor(Math.random() * scale.length)] * (Math.random() > 0.72 ? 2 : 1);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(note, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.13, now + 0.08);
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
      const freq = 290 + eraIndex * 42 + (Math.random() * 36 - 18);

      osc.type = eraIndex >= 4 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.44, now + 0.075);

      gain.gain.setValueAtTime(0.085, now);
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
     3. GAME DATA: 10 ERAS, 4 CURRENCIES, 30 GENERATORS, 10 CLICKS,
        16 RESEARCH TECHS & 5 PERMANENT DARK ENERGY PERKS
  ========================================================================= */
  const ERAS = [
    {
      id: 0, name: "Planet Earth", badge: "🌍 Era I: Planet Earth",
      costM: 0, costE: 0, costA: 0, mult: 1,
      desc: "An ultra-HD rotating ocean world with volumetric clouds, mountain relief, and orbital potential.",
      bonusText: "Starting Scale (1x)"
    },
    {
      id: 1, name: "Solar System", badge: "☀️ Era II: Solar System",
      costM: 25000, costE: 1200, costA: 0, mult: 1.8,
      desc: "Harness a turbulent 3D Sun and all 8 planets from Mercury to Neptune.",
      bonusText: "1.8x Output • Unlocks Solar System tech"
    },
    {
      id: 2, name: "Local Star Cluster", badge: "✨ Era III: Local Star Cluster",
      costM: 18000000, costE: 650000, costA: 0, mult: 3.2,
      desc: "Link neighboring blue supergiants and red dwarfs across an interstellar nursery.",
      bonusText: "3.2x Output • Unlocks Star Cluster tech"
    },
    {
      id: 3, name: "Milky Way", badge: "🌀 Era IV: Milky Way",
      costM: 1.5e10, costE: 4.5e8, costA: 0, mult: 5.5,
      desc: "Command a 3D spiral galaxy teeming with nebulae, pulsars, and Sagittarius A*.",
      bonusText: "5.5x Output • Unlocks Antimatter (⚛️) synthesis"
    },
    {
      id: 4, name: "Local Group", badge: "💫 Era V: Local Group",
      costM: 1.4e13, costE: 3.5e11, costA: 2500, mult: 9.5,
      desc: "Witness the 3D merger of Andromeda and the Milky Way across intergalactic tides.",
      bonusText: "9.5x Output • Unlocks Intergalactic tech"
    },
    {
      id: 5, name: "Laniakea Supercluster", badge: "🎇 Era VI: Laniakea Supercluster",
      costM: 1.8e16, costE: 3.8e14, costA: 350000, mult: 16,
      desc: "Guide hundreds of spinning galaxies flowing toward the Great Attractor.",
      bonusText: "16x Output • Unlocks Supercluster tech"
    },
    {
      id: 6, name: "Observable Universe", badge: "🌌 Era VII: Observable Universe",
      costM: 2.5e19, costE: 4.5e17, costA: 6e7, mult: 28,
      desc: "Architect a 3D cosmic web of superclusters, blazing quasars, and vacuum engines.",
      bonusText: "28x Output • Unlocks Big Crunch Prestige (🌌)"
    },
    {
      id: 7, name: "The Multiverse", badge: "🫧 Era VIII: The Multiverse",
      costM: 4.5e23, costE: 6e21, costA: 1.2e10, mult: 52,
      desc: "Stack parallel 3D cosmic branes floating in shimmering quantum foam.",
      bonusText: "52x Output • Unlocks Multiverse tech"
    },
    {
      id: 8, name: "The Omniverse", badge: "💠 Era IX: The Omniverse",
      costM: 1.2e28, costE: 1.5e26, costA: 3e12, mult: 100,
      desc: "Weave 4D rotating hypercubes and infinite iridescent Bubble Universes.",
      bonusText: "100x Output • Unlocks 4D Omniversal tech"
    },
    {
      id: 9, name: "The Architect's Void", badge: "👑 Era X: The Architect's Void",
      costM: 5e33, costE: 4e31, costA: 1e15, mult: 220,
      desc: "Transcend all dimensions inside a golden 3D Sacred Geometry Merkaba core.",
      bonusText: "220x Output • Final Endgame Ascendancy"
    }
  ];

  // Rebalanced Click Amplifiers: steep 1.42x cost, modest additive bonus + capped 8% MPS synergy
  const CLICK_UPGRADES = [
    { id: "clk_1", name: "Tectonic Drill", icon: "⛏️", era: 0, baseCost: 35, powerAdd: 1, addMult: 0.08, mpsPct: 0.001, desc: "+1 base click, +8% click mult, +0.1% MPS/click.", visual: "3D: Magma fissures & orbital mining laser" },
    { id: "clk_2", name: "Orbital Mass Driver", icon: "🛰️", era: 1, baseCost: 14000, powerAdd: 18, addMult: 0.1, mpsPct: 0.0015, desc: "+18 base click, +10% click mult, +0.15% MPS/click.", visual: "3D: Golden railgun ring & solar bolts" },
    { id: "clk_3", name: "Stellar Flare Lance", icon: "⚡", era: 2, baseCost: 9000000, powerAdd: 450, addMult: 0.12, mpsPct: 0.002, desc: "+450 base click, +12% click mult, +0.2% MPS/click.", visual: "3D: Star-to-star plasma arcs" },
    { id: "clk_4", name: "Hypernova Pulse", icon: "💥", era: 3, baseCost: 8e9, powerAdd: 14000, addMult: 0.14, mpsPct: 0.0025, desc: "+14K base click, +14% click mult, +0.25% MPS/click.", visual: "3D: Expanding galactic shockwave rings" },
    { id: "clk_5", name: "Tidal Collision Lance", icon: "💫", era: 4, baseCost: 7e12, powerAdd: 420000, addMult: 0.15, mpsPct: 0.003, desc: "+420K base click, +15% click mult, +0.3% MPS/click.", visual: "3D: Dual-galaxy shock ripples" },
    { id: "clk_6", name: "Gravitational Wave Cannon", icon: "🌊", era: 5, baseCost: 9e15, powerAdd: 1.4e7, addMult: 0.16, mpsPct: 0.003, desc: "+14M base click, +16% click mult, +0.3% MPS/click.", visual: "3D: Spacetime waves across Laniakea" },
    { id: "clk_7", name: "Vacuum Zero-Point Tap", icon: "✨", era: 6, baseCost: 1.4e19, powerAdd: 5e8, addMult: 0.18, mpsPct: 0.0035, desc: "+500M base click, +18% click mult, +0.35% MPS/click.", visual: "3D: Quantum arcs across cosmic web" },
    { id: "clk_8", name: "Brane Resonance Hammer", icon: "🫧", era: 7, baseCost: 2.5e23, powerAdd: 2e10, addMult: 0.2, mpsPct: 0.004, desc: "+20B base click, +20% click mult, +0.4% MPS/click.", visual: "3D: Parallel brane harmonic pulses" },
    { id: "clk_9", name: "Omniversal Spark", icon: "🔮", era: 8, baseCost: 6e27, powerAdd: 8e11, addMult: 0.22, mpsPct: 0.004, desc: "+800B base click, +22% click mult, +0.4% MPS/click.", visual: "3D: 4D hyper-dimensional bursts" },
    { id: "clk_10", name: "Architect's Axiom", icon: "👑", era: 9, baseCost: 2e33, powerAdd: 4e13, addMult: 0.25, mpsPct: 0.005, desc: "+40T base click, +25% click mult, +0.5% MPS/click.", visual: "3D: Golden Merkaba reality flash" }
  ];

  // 30 Generators across 10 Eras (produce Matter/s, Energy/s, and Antimatter/s from Era IV+)
  const GENERATORS = [
    // Era 0: Planet Earth
    { id: "gen_1", name: "Core Extractor", icon: "🌋", era: 0, baseCost: 15, mps: 0.4, eps: 0.05, amps: 0, desc: "Siphons silicate & geothermal heat from Earth's mantle.", visual: "3D: Night-side megacities & thermal satellites" },
    { id: "gen_2", name: "Lunar Colony", icon: "🌑", era: 0, baseCost: 140, mps: 3.2, eps: 0.35, amps: 0, desc: "Helium-3 & regolith mines across Luna.", visual: "3D: Lit cyan lunar bases & shuttle arcs" },
    { id: "gen_3", name: "Space Elevator", icon: "🗼", era: 0, baseCost: 1350, mps: 24, eps: 2.8, amps: 0, desc: "Geostationary orbital tether network.", visual: "3D: Tether towers, climbers & orbital ring" },

    // Era 1: Solar System
    { id: "gen_4", name: "Asteroid Belt Miner", icon: "☄️", era: 1, baseCost: 18000, mps: 190, eps: 18, amps: 0, desc: "Swarms dismantling metallic main-belt asteroids.", visual: "3D: Faceted asteroid belt & mining lasers" },
    { id: "gen_5", name: "Gas Giant Harvester", icon: "🪐", era: 1, baseCost: 195000, mps: 1450, eps: 145, amps: 0, desc: "Scoops skimming Jupiter, Saturn, Uranus & Neptune.", visual: "3D: Collector halos & atmospheric siphons" },
    { id: "gen_6", name: "Dyson Swarm", icon: "🔆", era: 1, baseCost: 2100000, mps: 11500, eps: 1400, amps: 0, desc: "Nested golden mirrors harvesting total solar flux.", visual: "3D: Nested golden hexagonal Dyson rings" },

    // Era 2: Local Star Cluster
    { id: "gen_7", name: "Stellar Nursery Scoop", icon: "☁️", era: 2, baseCost: 2.2e7, mps: 95000, eps: 9500, amps: 0, desc: "Harvests ionized hydrogen clouds birthing new suns.", visual: "3D: Glowing volumetric stellar nurseries" },
    { id: "gen_8", name: "Star-Lifting Ring", icon: "💍", era: 2, baseCost: 2.6e8, mps: 780000, eps: 82000, amps: 0, desc: "Magnetic rings stripping plasma from blue supergiants.", visual: "3D: Rotating golden rings around stars" },
    { id: "gen_9", name: "Interstellar Warp Gate", icon: "🌀", era: 2, baseCost: 3.1e9, mps: 6.4e6, eps: 720000, amps: 0, desc: "Subspace trade conduits linking nearby stars.", visual: "3D: Cyan hyperspace lanes between stars" },

    // Era 3: Milky Way (Unlocks Antimatter!)
    { id: "gen_10", name: "Nebula Condenser", icon: "🌫️", era: 3, baseCost: 3.2e10, mps: 5.5e7, eps: 5.5e6, amps: 0.4, desc: "Compresses molecular clouds & traps stray positrons.", visual: "3D: Spiral pink & cyan nebulae" },
    { id: "gen_11", name: "Pulsar Array", icon: "📡", era: 3, baseCost: 4.0e11, mps: 4.8e8, eps: 4.8e7, amps: 3.2, desc: "Harvests relativistic beams & antimatter pairs.", visual: "3D: Spinning pulsars with twin beams" },
    { id: "gen_12", name: "Sagittarius Penrose Engine", icon: "🕳️", era: 3, baseCost: 5.0e12, mps: 4.2e9, eps: 4.5e8, amps: 26, desc: "Extracts ergosphere mass from the galactic core.", visual: "3D: Black Hole accretion disk & jets" },

    // Era 4: Local Group (Andromeda + Milky Way Merger)
    { id: "gen_13", name: "Andromeda Bridge Collector", icon: "🌉", era: 4, baseCost: 4.5e13, mps: 3.8e10, eps: 3.8e9, amps: 210, desc: "Harvests stars flung between Milky Way & Andromeda.", visual: "3D: Luminous tidal stream linking both galaxies" },
    { id: "gen_14", name: "Dwarf Galaxy Mill", icon: "🌀", era: 4, baseCost: 5.8e14, mps: 3.4e11, eps: 3.4e10, amps: 1750, desc: "Strips Triangulum & Magellanic satellite galaxies.", visual: "3D: Orbiting satellite dwarf galaxies" },
    { id: "gen_15", name: "Binary Core Collider", icon: "💥", era: 4, baseCost: 7.5e15, mps: 3.1e12, eps: 3.2e11, amps: 14500, desc: "Harnesses dual supermassive black hole inspirals.", visual: "3D: Gravitational energy vortex between cores" },

    // Era 5: Laniakea Supercluster
    { id: "gen_16", name: "Galactic Tidal Siphon", icon: "🌌", era: 5, baseCost: 6.5e16, mps: 2.9e13, eps: 2.8e12, amps: 120000, desc: "Links colliding galaxy clusters across Laniakea.", visual: "3D: Blue stellar bridges across clusters" },
    { id: "gen_17", name: "Dark Matter Conduit", icon: "🧬", era: 5, baseCost: 8.5e17, mps: 2.7e14, eps: 2.6e13, amps: 1.0e6, desc: "Channels invisible gravitational rivers.", visual: "3D: Violet dark matter flow streams" },
    { id: "gen_18", name: "Great Attractor Tap", icon: "🔆", era: 5, baseCost: 1.1e19, mps: 2.5e15, eps: 2.5e14, amps: 8.5e6, desc: "Taps the gravitational heart of Laniakea.", visual: "3D: Radiant Great Attractor vortex" },

    // Era 6: Observable Universe
    { id: "gen_19", name: "Quasar Siphon", icon: "🌠", era: 6, baseCost: 9.0e19, mps: 2.4e16, eps: 2.3e15, amps: 7.2e7, desc: "Taps active galactic nuclei outshining entire clusters.", visual: "3D: Twin-jet Quasars on web nodes" },
    { id: "gen_20", name: "Cosmic Filament Loom", icon: "🕸️", era: 6, baseCost: 1.4e21, mps: 2.4e17, eps: 2.2e16, amps: 6.2e8, desc: "Supercharges supercluster highways.", visual: "3D: Flowing energy pulses along web" },
    { id: "gen_21", name: "Vacuum Metastability Engine", icon: "⚛️", era: 6, baseCost: 2.2e22, mps: 2.5e18, eps: 2.4e17, amps: 5.5e9, desc: "Harvests zero-point potential from false vacuum.", visual: "3D: Shimmering quantum energy shells" },

    // Era 7: The Multiverse
    { id: "gen_22", name: "Quantum Foam Skimmer", icon: "🫧", era: 7, baseCost: 2.0e24, mps: 2.8e19, eps: 2.5e18, amps: 5.0e10, desc: "Extracts virtual particles from Planck-scale foam.", visual: "3D: Luminous quantum foam waves" },
    { id: "gen_23", name: "Parallel Brane Anchor", icon: "🧊", era: 7, baseCost: 3.5e25, mps: 3.2e20, eps: 2.9e19, amps: 4.5e11, desc: "Pins neighboring 3D universe membranes together.", visual: "3D: Stacked glowing cosmic brane planes" },
    { id: "gen_24", name: "Chronos Rift Conduit", icon: "⏳", era: 7, baseCost: 6.0e26, mps: 3.8e21, eps: 3.5e20, amps: 4.2e12, desc: "Siphons entropy gradients between parallel timelines.", visual: "3D: Vertical golden inter-brane conduits" },

    // Era 8: The Omniverse
    { id: "gen_25", name: "Bubble Universe Harvester", icon: "🫧", era: 8, baseCost: 5.0e28, mps: 4.8e22, eps: 4.2e21, amps: 4.0e13, desc: "Siphons physical constants from sibling universes.", visual: "3D: Iridescent orbiting Bubble Universes" },
    { id: "gen_26", name: "Wormhole Bridge Network", icon: "🌉", era: 8, baseCost: 9.0e29, mps: 6.0e23, eps: 5.4e22, amps: 3.8e14, desc: "Weaves Einstein-Rosen highways across bubbles.", visual: "3D: Glowing wormhole arcs between bubbles" },
    { id: "gen_27", name: "4D Hypercube Reality Loom", icon: "💠", era: 8, baseCost: 1.8e31, mps: 8.0e24, eps: 7.2e23, amps: 3.5e15, desc: "Extrudes space and mass from 4D projections.", visual: "3D: Expanding 4D Tesseract & gyro rings" },

    // Era 9: The Architect's Void
    { id: "gen_28", name: "Platonic Axiom Forge", icon: "🔷", era: 9, baseCost: 2.0e34, mps: 1.4e26, eps: 1.2e25, amps: 4.0e16, desc: "Crystallizes pure mathematics into infinite matter.", visual: "3D: Orbiting geometric polyhedron shards" },
    { id: "gen_29", name: "Golden Merkaba Resonator", icon: "✨", era: 9, baseCost: 4.5e35, mps: 2.4e27, eps: 2.0e26, amps: 5.0e17, desc: "Spins counter-rotating star tetrahedra of light.", visual: "3D: Counter-rotating golden star tetrahedra" },
    { id: "gen_30", name: "Infinity Singularity Loom", icon: "👑", era: 9, baseCost: 1.0e37, mps: 4.5e28, eps: 3.8e27, amps: 7.5e18, desc: "Writes new realities from absolute eternity.", visual: "3D: Radiant crown halo & hyper-beams" }
  ];

  // One-time Research Techs (purchased with Energy & Antimatter!)
  const RESEARCH = [
    { id: "res_1", name: "Geothermal Turbines", icon: "⚡", era: 0, costE: 40, costA: 0, desc: "Doubles Energy (⚡) production from all sources.", effect: { energyMult: 2 } },
    { id: "res_2", name: "Deep Mantle Metallurgy", icon: "🔩", era: 0, costE: 260, costA: 0, desc: "1.75x global Matter output.", effect: { matterMult: 1.75 } },
    { id: "res_3", name: "Solar Sail Logistics", icon: "⛵", era: 1, costE: 6500, costA: 0, desc: "2x global Matter & 1.5x Energy output.", effect: { matterMult: 2, energyMult: 1.5 } },
    { id: "res_4", name: "Heliospheric Grid", icon: "🔆", era: 1, costE: 85000, costA: 0, desc: "2.5x Energy output & +2% MPS click synergy.", effect: { energyMult: 2.5, extraSynergy: 0.02 } },
    { id: "res_5", name: "Alcubierre Routing", icon: "🚀", era: 2, costE: 3.2e6, costA: 0, desc: "2.2x global Matter & 2x Energy output.", effect: { matterMult: 2.2, energyMult: 2 } },
    { id: "res_6", name: "Supergiant Fusion Catalysts", icon: "🌟", era: 2, costE: 5.5e7, costA: 0, desc: "2.5x global Matter output.", effect: { matterMult: 2.5 } },
    { id: "res_7", name: "Magnetic Positron Traps", icon: "🧲", era: 3, costE: 1.8e9, costA: 120, desc: "2.5x Antimatter (⚛️) synthesis rate.", effect: { antiMult: 2.5 } },
    { id: "res_8", name: "Ergosphere Harmonics", icon: "🕳️", era: 3, costE: 2.8e10, costA: 1500, desc: "2.5x Matter & 2x Energy output.", effect: { matterMult: 2.5, energyMult: 2 } },
    { id: "res_9", name: "Intergalactic Relays", icon: "💫", era: 4, costE: 1.5e12, costA: 45000, desc: "3x Matter & 2.5x Antimatter output.", effect: { matterMult: 3, antiMult: 2.5 } },
    { id: "res_10", name: "Dark Flow Calibration", icon: "🧬", era: 5, costE: 1.8e15, costA: 6e6, desc: "3x Matter, 2.5x Energy & 2.5x Antimatter.", effect: { matterMult: 3, energyMult: 2.5, antiMult: 2.5 } },
    { id: "res_11", name: "Quasar Beam Focusing", icon: "🌠", era: 6, costE: 2.5e18, costA: 1.2e9, desc: "3.5x Matter & 3x Antimatter output.", effect: { matterMult: 3.5, antiMult: 3 } },
    { id: "res_12", name: "False Vacuum Tunneling", icon: "⚛️", era: 6, costE: 4.0e20, costA: 8e10, desc: "4x global Matter & +25% Big Crunch DE gain.", effect: { matterMult: 4, deGainMult: 1.25 } },
    { id: "res_13", name: "Brane Harmonics", icon: "🫧", era: 7, costE: 5.0e22, costA: 4e11, desc: "4x Matter, 3x Energy & 3x Antimatter.", effect: { matterMult: 4, energyMult: 3, antiMult: 3 } },
    { id: "res_14", name: "4D Metric Engineering", icon: "💠", era: 8, costE: 1.2e27, costA: 2e14, desc: "5x Matter & 4x Antimatter output.", effect: { matterMult: 5, antiMult: 4 } },
    { id: "res_15", name: "Transcendent Geometry", icon: "👑", era: 9, costE: 5.0e32, costA: 1e17, desc: "8x Matter, Energy & Antimatter output.", effect: { matterMult: 8, energyMult: 8, antiMult: 8 } }
  ];

  // Permanent Dark Energy Shop Upgrades (persist across Big Crunches!)
  const DE_SHOP = [
    { id: "de_drone", name: "Quantum Auto-Harvester", icon: "🤖", baseCost: 2, maxLv: 10, desc: "Automatically clicks the cosmic body (+2 auto-clicks/sec per level)." },
    { id: "de_energy", name: "Zero-Point Energy Core", icon: "⚡", baseCost: 3, maxLv: 15, desc: "+75% permanent Energy (⚡) & Antimatter (⚛️) rate per level." },
    { id: "de_discount", name: "Cosmic Mass Compression", icon: "📉", baseCost: 5, maxLv: 8, desc: "Reduces all Generator & Click costs by 6% per level." },
    { id: "de_starter", name: "Primordial Seed", icon: "🌱", baseCost: 4, maxLv: 10, desc: "Start every Big Crunch with bonus Matter & Energy." },
    { id: "de_yield", name: "Singularity Resonance", icon: "🌌", baseCost: 8, maxLv: 10, desc: "+35% more Dark Energy earned from every Big Crunch." }
  ];

  /* =========================================================================
     4. GAME STATE, 4-CURRENCY BALANCED MATH & AUTO-SAVE PERSISTENCE
  ========================================================================= */
  const SAVE_KEY = "terra_to_infinity_save_v4";

  function defaultState() {
    const gens = {};
    GENERATORS.forEach(g => gens[g.id] = 0);
    const clicks = {};
    CLICK_UPGRADES.forEach(c => clicks[c.id] = 0);
    const dePerks = {};
    DE_SHOP.forEach(d => dePerks[d.id] = 0);

    return {
      matter: 0,
      energy: 0,
      antimatter: 0,
      runMatterEarned: 0,
      lifetimeMatterEarned: 0,
      era: 0,
      darkEnergy: 0,
      totalDarkEnergyEarned: 0,
      prestigeCount: 0,
      generators: gens,
      clickUpgrades: clicks,
      research: {},
      deShop: dePerks,
      lastSave: Date.now()
    };
  }

  let state = defaultState();
  let activeTab = "generators";

  function getResearchMults() {
    let matterMult = 1, energyMult = 1, antiMult = 1, extraSynergy = 0, deGainMult = 1;
    for (const r of RESEARCH) {
      if (!state.research[r.id]) continue;
      if (r.effect.matterMult) matterMult *= r.effect.matterMult;
      if (r.effect.energyMult) energyMult *= r.effect.energyMult;
      if (r.effect.antiMult) antiMult *= r.effect.antiMult;
      if (r.effect.extraSynergy) extraSynergy += r.effect.extraSynergy;
      if (r.effect.deGainMult) deGainMult *= r.effect.deGainMult;
    }
    return { matterMult, energyMult, antiMult, extraSynergy, deGainMult };
  }

  function getCostDiscount() {
    const lv = state.deShop.de_discount || 0;
    return Math.pow(0.94, lv);
  }

  function getGenCost(baseCost, owned) {
    return Math.floor(baseCost * Math.pow(1.18, owned) * getCostDiscount());
  }

  function getClickCost(baseCost, owned) {
    return Math.floor(baseCost * Math.pow(1.42, owned) * getCostDiscount());
  }

  function getDeShopCost(item) {
    const lv = state.deShop[item.id] || 0;
    return Math.floor(item.baseCost * Math.pow(1.85, lv));
  }

  function getEraMultiplier() {
    return (ERAS[state.era] && ERAS[state.era].mult) || 1;
  }

  function getDarkEnergyMultiplier() {
    return 1 + state.darkEnergy * 0.25; // +25% per unspent Dark Energy
  }

  function getGlobalMatterMult() {
    return getEraMultiplier() * getDarkEnergyMultiplier() * getResearchMults().matterMult;
  }

  function getGlobalEnergyMult() {
    const deCore = 1 + (state.deShop.de_energy || 0) * 0.75;
    return getEraMultiplier() * getDarkEnergyMultiplier() * getResearchMults().energyMult * deCore;
  }

  function getGlobalAntiMult() {
    const deCore = 1 + (state.deShop.de_energy || 0) * 0.75;
    return Math.sqrt(getEraMultiplier()) * (1 + state.darkEnergy * 0.15) * getResearchMults().antiMult * deCore;
  }

  function getMps() {
    let base = 0;
    for (const g of GENERATORS) {
      base += (state.generators[g.id] || 0) * g.mps;
    }
    return base * getGlobalMatterMult();
  }

  function getEps() {
    let base = 0;
    for (const g of GENERATORS) {
      base += (state.generators[g.id] || 0) * g.eps;
    }
    return base * getGlobalEnergyMult();
  }

  function getAmps() {
    let base = 0;
    for (const g of GENERATORS) {
      if (g.amps > 0) base += (state.generators[g.id] || 0) * g.amps;
    }
    return base * getGlobalAntiMult();
  }

  function getMpc() {
    let baseFlat = 1;
    let addMult = 1;
    let totalMpsPct = getResearchMults().extraSynergy;

    for (const c of CLICK_UPGRADES) {
      const owned = state.clickUpgrades[c.id] || 0;
      if (owned > 0) {
        baseFlat += owned * c.powerAdd;
        addMult += owned * c.addMult;
        totalMpsPct += owned * c.mpsPct;
      }
    }

    const cappedSynergy = Math.min(0.08, totalMpsPct); // Hard-capped at 8% MPS per click
    return (baseFlat * addMult * getGlobalMatterMult()) + (getMps() * cappedSynergy);
  }

  function getEpc() {
    return (0.15 + getEps() * 0.025) * (1 + (state.deShop.de_energy || 0) * 0.25);
  }

  function calculatePendingDarkEnergy() {
    // Unlocks at Era VII: Observable Universe once Run Matter >= 1e19
    if (state.era < 6 || state.runMatterEarned < 1e19) return 0;
    const yieldBonus = (1 + (state.deShop.de_yield || 0) * 0.35) * getResearchMults().deGainMult;
    return Math.floor(Math.pow(state.runMatterEarned / 1e19, 0.30) * 3 * yieldBonus);
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
      const safeNum = (v, fb = 0) => (Number.isFinite(v) && v >= 0 ? v : fb);

      state = {
        ...fresh,
        matter: safeNum(parsed.matter),
        energy: safeNum(parsed.energy),
        antimatter: safeNum(parsed.antimatter),
        runMatterEarned: safeNum(parsed.runMatterEarned),
        lifetimeMatterEarned: safeNum(parsed.lifetimeMatterEarned),
        era: clamp(Math.floor(safeNum(parsed.era)), 0, ERAS.length - 1),
        darkEnergy: Math.floor(safeNum(parsed.darkEnergy)),
        totalDarkEnergyEarned: Math.floor(safeNum(parsed.totalDarkEnergyEarned)),
        prestigeCount: Math.floor(safeNum(parsed.prestigeCount)),
        generators: { ...fresh.generators, ...(parsed.generators || {}) },
        clickUpgrades: { ...fresh.clickUpgrades, ...(parsed.clickUpgrades || {}) },
        research: { ...(parsed.research || {}) },
        deShop: { ...fresh.deShop, ...(parsed.deShop || {}) },
        lastSave: safeNum(parsed.lastSave, Date.now())
      };

      const elapsedSec = Math.min(14400, Math.max(0, (Date.now() - state.lastSave) / 1000));
      const mps = getMps();
      if (elapsedSec > 5 && mps > 0) {
        const offlineM = mps * elapsedSec * 0.45;
        const offlineE = getEps() * elapsedSec * 0.45;
        const offlineA = getAmps() * elapsedSec * 0.45;
        state.matter += offlineM;
        state.energy += offlineE;
        state.antimatter += offlineA;
        state.runMatterEarned += offlineM;
        state.lifetimeMatterEarned += offlineM;
        setTimeout(() => showToast(`Welcome back! +${formatNum(offlineM)} Matter, +${formatNum(offlineE)} Energy`), 400);
      }
    } catch (e) {
      console.warn("Load failed:", e);
    }
  }

  function hardReset() {
    if (!confirm("Permanently wipe ALL progress, Research, Antimatter, and Dark Energy?")) return;
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
     5. ULTRA-HD WEBGL GPU PLANET ENGINE (ZERO-TERRACING 2K EARTH + ALL 8 PLANETS)
        - Bakes 2048x1024 Earth macro maps on GPU + layers live 3D Simplex
          micro-detail so mountains, coastlines, clouds & night cities have
          zero pixelation or 8-bit contour banding!
        - Includes Neptune (type 9) so all 8 planets of the Solar System render.
  ========================================================================= */
  const PLANET_TYPE = {
    earth: 0, moon: 1, sun: 2, jupiter: 3,
    saturn: 4, mars: 5, venus: 6, mercury: 7, uranus: 8, neptune: 9
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

      // GPU 2K Texture Baker (packs smooth elevation, moisture, city webs & fault veins)
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
            vec3 warp = vec3(
              snoise(P * 1.32 + vec3(2.1, 0.4, 3.3)),
              snoise(P * 1.32 + vec3(5.7, 2.9, 1.2)),
              snoise(P * 1.32 + vec3(8.3, 4.1, 6.4))
            ) * 0.35;
            float continents = fbm6((P + warp) * 1.55 + vec3(1.6, 0.8, 2.3));
            float mountains = ridgedFbm(P * 4.6 + vec3(3.1, 1.5, 4.9));
            float elev = clamp(continents * 0.82 + mountains * 0.21 - 0.02, 0.0, 1.0);

            float moisture = clamp(fbm6(P * 2.5 + vec3(6.2, 1.4, 3.8)), 0.0, 1.0);

            float metro = fbm4(P * 7.8 + vec3(3.3, 1.1, 7.2));
            float roads = pow(1.0 - abs(snoise(P * 24.0 + vec3(1.4, 5.2, 2.8))), 4.0);
            float lights = smoothstep(0.54, 0.78, metro) * (0.45 + 0.55 * roads);

            float fault = pow(smoothstep(0.84, 0.99, 1.0 - abs(snoise(P * 10.5 + vec3(2.4, 5.1, 1.7)))), 2.2);

            gl_FragColor = vec4(elev, moisture, clamp(lights, 0.0, 1.0), clamp(fault, 0.0, 1.0));
          } else {
            vec3 q = P * 2.2;
            vec3 swirl = vec3(
              fbm4(q + vec3(1.7, 9.2, 3.1)),
              fbm4(q + vec3(8.3, 2.8, 5.4)),
              fbm4(q + vec3(4.1, 6.5, 1.9))
            );
            float mainClouds = fbm6(q + (swirl - 0.5) * 1.48);
            float wisps = fbm4(P * 7.8 + swirl * 1.2);
            float density = smoothstep(0.47, 0.76, mainClouds * 0.78 + wisps * 0.28);
            float thick = smoothstep(0.58, 0.85, mainClouds);
            gl_FragColor = vec4(density, wisps, thick, 1.0);
          }
        }
      `;

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
          float h = fbm4(p * 2.6) * 0.55 + fbm4(p * 6.0) * 0.16;
          float n1 = snoise(p * 3.8 + vec3(1.2, 3.4, 2.1));
          float n2 = snoise(p * 7.5 + vec3(7.1, 2.2, 5.8));
          float pit1 = smoothstep(0.42, 0.72, n1);
          float rim1 = smoothstep(0.28, 0.44, n1) * (1.0 - smoothstep(0.44, 0.60, n1));
          float pit2 = smoothstep(0.48, 0.78, n2);
          float rim2 = smoothstep(0.34, 0.50, n2) * (1.0 - smoothstep(0.50, 0.64, n2));
          return h - pit1 * 0.26 + rim1 * 0.10 - pit2 * 0.14 + rim2 * 0.06;
        }

        void main() {
          vec2 uv = (vUv * 2.0 - 1.0) * 1.07;
          uv.y = -uv.y;
          float r2 = dot(uv, uv);

          if (r2 >= 1.0) {
            float dist = sqrt(r2);
            if (uType < 0.5) {
              float halo = exp(-(dist - 1.0) * 26.0) * 0.6;
              gl_FragColor = vec4(vec3(0.22, 0.68, 1.0) * halo, halo);
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

          // ==================== 0: ULTRA-HD ZERO-TERRACING EARTH ====================
          if (uType < 0.5) {
            vec2 eUV = sphereUV(P);
            vec4 data = texture2D(uEarthTex, eUV);
            // Layer crisp analytical 3D Simplex micro-detail over 2K baked continents (zero 8-bit banding!)
            float microDetail = snoise(P * 18.0) * 0.018 + snoise(P * 42.0) * 0.008;
            float elev = data.r + microDetail;
            float moisture = data.g;
            float cityMap = data.b;
            float faultMap = data.a;

            float seaLevel = 0.552;
            float lat = abs(P.y);
            float polarIce = lat + (moisture - 0.5) * 0.14 + microDetail * 1.4;
            float landMask = smoothstep(seaLevel - 0.006, seaLevel + 0.006, elev);
            float iceMask = smoothstep(0.842, 0.872, polarIce);

            // Smooth analytical mountain bump normal (zero contour terracing!)
            vec3 bumpN = N;
            float mountainFactor = smoothstep(seaLevel + 0.02, seaLevel + 0.24, elev) * (1.0 - iceMask);
            if (mountainFactor > 0.01) {
              float eps = 0.01;
              vec3 tx = normalize(cross(abs(N.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0), N));
              vec3 ty = cross(N, tx);
              vec3 Px = rotYVec(normalize(N + tx * eps), uSpin);
              vec3 Py = rotYVec(normalize(N + ty * eps), uSpin);
              float dX = (snoise(Px * 14.0) - snoise(P * 14.0)) * 0.55 + (snoise(Px * 32.0) - snoise(P * 32.0)) * 0.28;
              float dY = (snoise(Py * 14.0) - snoise(P * 14.0)) * 0.55 + (snoise(Py * 32.0) - snoise(P * 32.0)) * 0.28;
              bumpN = normalize(N - tx * dX * mountainFactor * 4.5 - ty * dY * mountainFactor * 4.5);
            }

            float diff = max(0.0, dot(bumpN, L));
            float smoothDiff = smoothstep(-0.14, 0.25, ndotl);

            // Ocean Bathymetry
            float depth = clamp((seaLevel - elev) / 0.24, 0.0, 1.0);
            vec3 oceanCol = mix(vec3(0.07, 0.58, 0.74), vec3(0.03, 0.24, 0.50), smoothstep(0.0, 0.15, depth));
            oceanCol = mix(oceanCol, vec3(0.012, 0.068, 0.22), smoothstep(0.14, 0.82, depth));

            // Multi-Biome Continents
            float h = clamp((elev - seaLevel) / 0.30, 0.0, 1.0);
            float arid = smoothstep(0.40, 0.72, moisture) * smoothstep(0.56, 0.10, abs(lat - 0.31));
            vec3 lowland = mix(mix(vec3(0.055, 0.28, 0.125), vec3(0.16, 0.43, 0.18), moisture), vec3(0.76, 0.62, 0.38), arid * 0.86);
            vec3 landCol = mix(vec3(0.76, 0.70, 0.52), lowland, smoothstep(0.0, 0.035, h));
            landCol = mix(landCol, vec3(0.42, 0.38, 0.35), smoothstep(0.44, 0.74, h));
            landCol = mix(landCol, vec3(0.95, 0.97, 1.0), smoothstep(0.72, 0.88, h));

            // Smooth Polar Ice Cap Blending
            vec3 iceCol = mix(vec3(0.84, 0.91, 0.98), vec3(0.97, 0.99, 1.0), moisture);
            vec3 surfCol = mix(mix(oceanCol, landCol, landMask), iceCol, iceMask);
            float specStrength = mix(1.0, 0.0, landMask) * (1.0 - iceMask) + iceMask * 0.25;

            // Drifting Swirling Cloud Layer + Soft Projected Shadows
            vec3 Pcloud = rotYVec(N, uSpin * 1.22 + uTime * 0.022);
            vec4 cData = texture2D(uCloudTex, sphereUV(Pcloud));
            float cloudMask = cData.r;
            float cloudThick = cData.b;

            vec3 Pshadow = rotYVec(normalize(N + L * 0.022), uSpin * 1.22 + uTime * 0.022);
            float shadowVal = texture2D(uCloudTex, sphereUV(Pshadow)).r;
            float cloudShadow = 1.0 - shadowVal * 0.48 * max(0.0, ndotl);

            float spec = pow(max(0.0, dot(N, H)), 46.0) * specStrength * (1.0 - cloudMask * 0.88) * smoothDiff;

            vec3 litSurface = surfCol * (0.045 + diff * 1.12 * cloudShadow) + vec3(0.88, 0.95, 1.0) * spec * 0.85;
            vec3 cloudCol = mix(vec3(0.95, 0.98, 1.0), vec3(0.82, 0.87, 0.94), cloudThick * 0.48) * (0.055 + max(0.0, ndotl) * 1.06);
            col = mix(litSurface, cloudCol, cloudMask * 0.9);

            // Delicate Sunset Terminator Twilight
            float twilight = exp(-pow((ndotl - 0.03) * 14.0, 2.0));
            float limbBoost = 0.22 + 0.78 * pow(max(0.0, 1.0 + vz), 1.6);
            col += vec3(0.45, 0.16, 0.05) * twilight * limbBoost * (0.12 + cloudMask * 0.12);

            // Night-Side Aurora Borealis
            float nightMask = smoothstep(0.08, -0.22, ndotl);
            float auroraBand = exp(-pow((lat - 0.82) * 14.0, 2.0));
            float auroraWave = smoothstep(0.25, 0.85, snoise(vec3(P.x * 6.0 + uTime * 0.25, P.y * 4.0, P.z * 6.0 - uTime * 0.2)) * 0.5 + 0.5);
            col += mix(vec3(0.12, 0.95, 0.55), vec3(0.2, 0.65, 1.0), auroraWave) * auroraBand * auroraWave * nightMask * 0.34;

            // Crisp Night-Side Megacities
            if (uCityBoost > 0.0 && landMask > 0.5 && h < 0.52 && iceMask < 0.2 && nightMask > 0.0) {
              float microSpark = smoothstep(0.35, 0.82, snoise(P * 54.0) * 0.5 + 0.5);
              float twinkle = 0.88 + 0.12 * sin(uTime * 3.2 + P.x * 45.0);
              col += vec3(1.0, 0.78, 0.36) * cityMap * (0.45 + 0.75 * microSpark) * nightMask * (1.0 - cloudMask * 0.65) * uCityBoost * twinkle * 1.9;
            }

            // Tectonic Magma Fissures
            if (uMagmaBoost > 0.0 && landMask > 0.6 && iceMask < 0.2) {
              float pulse = 0.84 + 0.16 * sin(uTime * 4.5 + P.y * 12.0);
              col += vec3(1.0, 0.34, 0.04) * faultMap * (1.0 - cloudMask * 0.5) * uMagmaBoost * pulse * 2.1;
            }

            // Rayleigh Blue Atmospheric Fresnel Rim
            float fresnel = pow(max(0.0, 1.0 + vz), 3.0);
            col += vec3(0.22, 0.66, 1.0) * fresnel * (0.28 + max(0.0, ndotl + 0.22) * 0.98);
          }

          // ==================== 1: HD CRATERED MOON ====================
          else if (uType < 1.5) {
            float h = craterHeight(P);
            float eps = 0.02;
            vec3 tx = normalize(cross(abs(N.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0), N));
            vec3 ty = cross(N, tx);
            float hX = craterHeight(rotYVec(normalize(N + tx * eps), uSpin));
            float hY = craterHeight(rotYVec(normalize(N + ty * eps), uSpin));
            vec3 bumpN = normalize(N - tx * (hX - h) * 3.2 - ty * (hY - h) * 3.2);

            float maria = fbm4(P * 1.7 + vec3(4.2, 2.8, 1.1));
            vec3 regolith = mix(vec3(0.36, 0.38, 0.42), vec3(0.76, 0.77, 0.79), smoothstep(0.34, 0.72, maria));
            regolith *= 0.84 + h * 0.28;

            float diff = max(0.0, dot(bumpN, L));
            vec3 earthshine = vec3(0.10, 0.14, 0.22) * (0.45 + 0.55 * max(0.0, -vz));
            col = regolith * (earthshine + vec3(1.02, 1.00, 0.96) * diff);

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
            float band = sin(P.y * 18.0 + (swirl - 0.5) * 1.4) * 0.5 + 0.5;
            vec3 surf = mix(vec3(0.76, 0.66, 0.46), vec3(0.95, 0.88, 0.68), band);
            col = surf * (0.16 + max(0.0, ndotl) * 0.92);
          }

          // ==================== 5: MARS ====================
          else if (uType < 5.5) {
            float n = fbm4(P * 3.4 + vec3(2.1, 4.3, 1.5));
            vec3 surf = mix(vec3(0.45, 0.18, 0.10), vec3(0.84, 0.40, 0.22), n);
            surf = mix(surf, vec3(0.94, 0.91, 0.89), smoothstep(0.86, 0.91, abs(P.y)));
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
          else if (uType < 8.5) {
            float band = fbm4(vec3(P.x * 2.0, P.y * 5.5, P.z * 2.0));
            vec3 surf = mix(vec3(0.44, 0.82, 0.88), vec3(0.70, 0.94, 0.98), band);
            float fresnel = pow(max(0.0, 1.0 + vz), 3.0);
            col = surf * (0.18 + max(0.0, ndotl) * 0.88) + vec3(0.58, 0.94, 1.0) * fresnel * 0.42;
          }

          // ==================== 9: NEPTUNE (DEEP AZURE ICE GIANT) ====================
          else {
            float swirl = fbm4(vec3(P.x * 3.0, P.y * 8.0, P.z * 3.0));
            float band = sin(P.y * 16.0 + (swirl - 0.5) * 2.2) * 0.5 + 0.5;
            vec3 surf = mix(vec3(0.08, 0.22, 0.68), vec3(0.18, 0.44, 0.92), band);
            // Great Dark Spot & high-altitude white methane streaks
            float darkSpot = length(vec3((P.x + 0.65) * 1.6, (P.y + 0.22) * 3.4, (P.z - 0.60) * 1.6));
            surf = mix(vec3(0.04, 0.11, 0.42), surf, smoothstep(0.14, 0.30, darkSpot));
            float streaks = smoothstep(0.74, 0.88, fbm4(vec3(P.x * 4.0, P.y * 16.0, P.z * 4.0)));
            surf = mix(surf, vec3(0.75, 0.90, 1.0), streaks * 0.55);
            float fresnel = pow(max(0.0, 1.0 + vz), 2.8);
            col = surf * (0.16 + max(0.0, ndotl) * 0.92) + vec3(0.24, 0.56, 1.0) * fresnel * 0.5;
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

      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 1024;
      const bakeW = maxTex >= 2048 ? 2048 : 1024;
      const bakeH = bakeW / 2;

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

      this.earthTex = bakeTexture(bakeW, bakeH, 0.0);
      this.cloudTex = bakeTexture(bakeW, bakeH, 1.0);
      gl.deleteProgram(bakeProg);

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

      const pad = 2;
      const scW = Math.min(this.maxRes, vp + pad);
      const scY = Math.max(0, vy - pad);
      const scH = Math.min(this.maxRes - scY, vp + pad);

      gl.scissor(0, scY, scW, scH);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, vy, vp, vp);
      gl.scissor(0, vy, vp, vp);

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
     7. FULL 10-ERA 3D COSMOS ENGINE
  ========================================================================= */
  class Cosmos3DEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.width = 0;
      this.height = 0;
      this.fov = 560;

      this.rotX = 0.28;
      this.rotY = -0.35;
      this.velX = 0;
      this.velY = 0;
      this.zoom = 1.0;
      this.targetZoom = 1.0;

      this.pulse = 0;
      this.eraTransition = 0;
      this.currentEra = 0;
      this.earthSpin = 0;
      this.clickBeams = [];
      this.burstParticles = [];
      this.shockwaves = [];

      this.gpuPlanets = new GPUPlanetRenderer(768);

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

      // Era 1: ALL 8 Solar System Planets (Mercury through Neptune)
      this.solarPlanets = [
        { key: "mercury", dist: 70, radius: 5.0, speed: 0.56, angle: 0.4, tilt: 0.12 },
        { key: "venus", dist: 94, radius: 8.2, speed: 0.42, angle: 2.0, tilt: 0.06 },
        { key: "earth", dist: 122, radius: 9.4, speed: 0.33, angle: 3.6, tilt: 0.02 },
        { key: "mars", dist: 150, radius: 7.0, speed: 0.26, angle: 5.1, tilt: 0.05 },
        { key: "jupiter", dist: 204, radius: 18.2, speed: 0.16, angle: 1.1, tilt: 0.04, gasGiant: true },
        { key: "saturn", dist: 268, radius: 15.6, speed: 0.115, angle: 4.15, tilt: 0.07, gasGiant: true, saturnRing: true },
        { key: "uranus", dist: 326, radius: 11.4, speed: 0.082, angle: 2.5, tilt: 0.05, gasGiant: true, uranusRing: true },
        { key: "neptune", dist: 376, radius: 11.2, speed: 0.062, angle: 5.65, tilt: 0.06, gasGiant: true }
      ];

      this.asteroids = [];
      for (let i = 0; i < 110; i++) {
        this.asteroids.push({
          dist: 174 + (Math.random() - 0.5) * 22,
          angle: Math.random() * Math.PI * 2,
          y: (Math.random() - 0.5) * 14,
          speed: 0.18 + Math.random() * 0.08,
          size: 2.0 + Math.random() * 3.0
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
          glow: st.glow, core: st.core,
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
      for (let i = 0; i < 1200; i++) {
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

      // Era 4: Local Group (Milky Way + Andromeda Merging Spirals + Dwarf Satellites)
      this.localGroupA = [];
      this.localGroupB = [];
      for (let i = 0; i < 460; i++) {
        const arm = i % 2;
        const t = Math.pow(Math.random(), 0.8);
        const dist = 10 + t * 125;
        const a = arm * Math.PI + dist * 0.038 + (Math.random() - 0.5) * 0.45;
        this.localGroupA.push({
          x: Math.cos(a) * dist,
          y: (Math.random() - 0.5) * 12 * (1 - t * 0.6),
          z: Math.sin(a) * dist,
          size: t < 0.2 ? 2.1 : 1.1 + Math.random(),
          color: t < 0.2 ? "#fef08a" : "#93c5fd"
        });
      }
      for (let i = 0; i < 540; i++) {
        const arm = i % 2;
        const t = Math.pow(Math.random(), 0.8);
        const dist = 12 + t * 145;
        const a = arm * Math.PI + dist * 0.034 + (Math.random() - 0.5) * 0.45;
        const lx = Math.cos(a) * dist;
        const ly = (Math.random() - 0.5) * 14 * (1 - t * 0.6);
        const lz = Math.sin(a) * dist;
        const tilt = 0.68;
        this.localGroupB.push({
          x: lx,
          y: ly * Math.cos(tilt) - lz * Math.sin(tilt),
          z: lz * Math.cos(tilt) + ly * Math.sin(tilt),
          size: t < 0.2 ? 2.2 : 1.1 + Math.random(),
          color: t < 0.2 ? "#fde68a" : "#e9d5ff"
        });
      }
      this.dwarfGalaxies = [];
      for (let i = 0; i < 14; i++) {
        this.dwarfGalaxies.push({
          r: 175 + (i % 3) * 32,
          angle: (i / 14) * Math.PI * 2,
          y: (Math.random() - 0.5) * 125,
          speed: 0.14 + (i % 4) * 0.04,
          size: 8 + (i % 3) * 4
        });
      }

      // Era 5: Laniakea Supercluster
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

      // Era 6: Observable Universe
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

      // Era 7: The Multiverse
      this.foamDots = [];
      for (let i = 0; i < 140; i++) {
        this.foamDots.push({
          x: (Math.random() - 0.5) * 340,
          y: (Math.random() - 0.5) * 220,
          z: (Math.random() - 0.5) * 340,
          phase: Math.random() * Math.PI * 2,
          color: i % 3 === 0 ? "#38bdf8" : (i % 3 === 1 ? "#c084fc" : "#f472b6")
        });
      }

      // Era 8: The Omniverse
      this.tesseractVerts = [];
      for (let i = 0; i < 16; i++) {
        this.tesseractVerts.push([
          (i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1
        ]);
      }
      this.tesseractEdges = [];
      for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
          const diff = i ^ j;
          if (diff === 1 || diff === 2 || diff === 4 || diff === 8) this.tesseractEdges.push([i, j]);
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
        const col = bColors[i % bColors.length];
        this.bubbleUniverses.push({
          orbitR: 135 + (i % 3) * 42, theta: th, phi: ph,
          speed: 0.14 + (i % 4) * 0.05,
          radius: 16 + (i % 5) * 4.5,
          fill: col[0], stroke: col[1]
        });
      }

      // Era 9: The Architect's Void (Sacred Merkaba Star Tetrahedron)
      this.tetraA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
      this.tetraB = [[-1, -1, -1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]];
      this.tetraEdges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
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
      const colors = [
        "#38bdf8", "#fbbf24", "#67e8f9", "#c084fc", "#f472b6",
        "#a78bfa", "#34d399", "#38bdf8", "#e879f9", "#fde047"
      ];
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

      const clkId = `clk_${this.currentEra + 1}`;
      if ((state.clickUpgrades[clkId] || 0) > 0) {
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
            life: 1.0, color: col
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
        ["#07142e", "#02050c"], ["#1a0f06", "#03040a"], ["#071a2b", "#02050b"],
        ["#130926", "#020309"], ["#110c2a", "#020309"], ["#1c0922", "#030208"],
        ["#160728", "#020207"], ["#07182a", "#020309"], ["#0b1632", "#04010c"],
        ["#1f1505", "#040206"]
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

      for (const s of this.stars) {
        const p = this.project(s.x, s.y, s.z, this.rotX * 0.3, this.rotY * 0.25);
        if (p.scale <= 0) continue;
        const alpha = 0.28 + 0.48 * Math.sin(t * 2 + s.twinkle);
        ctx.fillStyle = `hsla(${s.hue}, 85%, 86%, ${alpha})`;
        const sr = Math.max(0.7, s.size * p.scale);
        ctx.fillRect(p.x - sr * 0.5, p.y - sr * 0.5, sr, sr);
      }

      if (state.darkEnergy > 0 || state.totalDarkEnergyEarned > 0) {
        this.renderDarkEnergyAura(ctx, t);
      }

      switch (this.currentEra) {
        case 0: this.renderEarthScene(ctx, t); break;
        case 1: this.renderSolarScene(ctx, t, dt); break;
        case 2: this.renderStarClusterScene(ctx, t); break;
        case 3: this.renderMilkyWayScene(ctx, t); break;
        case 4: this.renderLocalGroupScene(ctx, t); break;
        case 5: this.renderSuperclusterScene(ctx, t); break;
        case 6: this.renderUniverseScene(ctx, t); break;
        case 7: this.renderMultiverseScene(ctx, t); break;
        case 8: this.renderOmniverseScene(ctx, t); break;
        default: this.renderArchitectVoidScene(ctx, t); break;
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * (1 - Math.exp(-7 * dt));
        sw.life -= 1.8 * dt;
        if (sw.life <= 0) { this.shockwaves.splice(i, 1); continue; }
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.life * 0.75;
        ctx.lineWidth = 3 * sw.life;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, cy, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (let i = this.clickBeams.length - 1; i >= 0; i--) {
        const bm = this.clickBeams[i];
        bm.life -= 5.5 * dt;
        if (bm.life <= 0) { this.clickBeams.splice(i, 1); continue; }
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
        if (bp.life <= 0) { this.burstParticles.splice(i, 1); continue; }
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

      const count = Math.min(12, Math.max(3, Math.floor(Math.log2(state.totalDarkEnergyEarned + 2) * 2)));
      for (let i = 0; i < count; i++) {
        const a = t * 0.6 + (i / count) * Math.PI * 2;
        const p = this.project(Math.cos(a) * 235, Math.sin(a * 2) * 52, Math.sin(a) * 235);
        if (p.scale <= 0) continue;
        ctx.fillStyle = "#d8b4fe";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* -----------------------------------------------------------------------
       ERA I: 2K ULTRA-HD EARTH + CLOSED 3D MOON ORBIT + SEGMENTED ELEVATORS
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

      // True circular 3D inclined Moon orbit (x^2 + y^2 + z^2 = R^2)
      const moonOrbitR = worldR * 1.95;
      const inc = 0.24;
      const sinInc = Math.sin(inc), cosInc = Math.cos(inc);
      const moonAngle = t * 0.48;
      const mx = Math.cos(moonAngle) * moonOrbitR;
      const my = Math.sin(moonAngle) * moonOrbitR * sinInc;
      const mz = Math.sin(moonAngle) * moonOrbitR * cosInc;
      const moonProj = this.project(mx, my, mz);

      const orbitSegs = 64;
      for (let i = 0; i < orbitSegs; i++) {
        const a1 = (i / orbitSegs) * Math.PI * 2;
        const a2 = ((i + 1) / orbitSegs) * Math.PI * 2;
        const p1 = this.project(Math.cos(a1) * moonOrbitR, Math.sin(a1) * moonOrbitR * sinInc, Math.sin(a1) * moonOrbitR * cosInc);
        const p2 = this.project(Math.cos(a2) * moonOrbitR, Math.sin(a2) * moonOrbitR * sinInc, Math.sin(a2) * moonOrbitR * cosInc);
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

      // 2. Cratered GPU Moon with Earthshine
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

      // 3. Lunar Colony Shuttles
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

      // 4. Core Extractor Thermal Satellites
      if (extractors > 0) {
        const satCount = Math.min(12, Math.max(2, Math.floor(extractors * 0.75)));
        for (let i = 0; i < satCount; i++) {
          const a = t * 0.85 + (i / satCount) * Math.PI * 2;
          const satInc = (i % 3 - 1) * 0.55;
          const r = worldR * 1.19;
          const p = this.project(Math.cos(a) * r, Math.sin(a) * r * Math.sin(satInc), Math.sin(a) * r * Math.cos(satInc));
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

      // 5. Segmented Space Elevators (prevents far-hemisphere poke-through!)
      if (elevators > 0) {
        const towerCount = Math.min(8, elevators);
        const topR = worldR * 1.48;
        const subSegs = 4;

        for (let i = 0; i < towerCount; i++) {
          const lon = this.earthSpin + (i / towerCount) * Math.PI * 2;
          const cL = Math.cos(lon), sL = Math.sin(lon);

          for (let s = 0; s < subSegs; s++) {
            const r0 = worldR * 0.99 + (topR - worldR * 0.99) * (s / subSegs);
            const r1 = worldR * 0.99 + (topR - worldR * 0.99) * ((s + 1) / subSegs);
            const p0 = this.project(cL * r0, 0, sL * r0);
            const p1 = this.project(cL * r1, 0, sL * r1);
            if (p0.scale <= 0 || p1.scale <= 0) continue;

            queue.push({
              z: (p0.z + p1.z) * 0.5,
              draw: () => {
                ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
                ctx.lineWidth = Math.max(1.2, 2.1 * p1.scale);
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
              }
            });
          }

          const pTop = this.project(cL * topR, 0, sL * topR);
          if (pTop.scale > 0) {
            queue.push({
              z: pTop.z,
              draw: () => {
                const stR = 3.8 * pTop.scale;
                ctx.fillStyle = "#e0f2fe";
                ctx.fillRect(pTop.x - stR, pTop.y - stR, stR * 2, stR * 2);
              }
            });
          }

          const climbT = (t * 0.65 + i * 0.27) % 1;
          const rc = worldR * 0.99 + (topR - worldR * 0.99) * climbT;
          const pClimb = this.project(cL * rc, 0, sL * rc);
          if (pClimb.scale > 0) {
            queue.push({
              z: pClimb.z,
              draw: () => {
                ctx.fillStyle = "#fde047";
                ctx.beginPath();
                ctx.arc(pClimb.x, pClimb.y, 2.6 * pClimb.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }

        if (elevators >= 3) {
          const segs = 44;
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
                ctx.lineWidth = Math.max(1.5, 2.8 * p1.scale);
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
       ERA II: ALL 8 SOLAR SYSTEM PLANETS + TRUE 3D SHADOWED SATURN RINGS
    ----------------------------------------------------------------------- */
    renderSolarScene(ctx, t, dt) {
      const scaleFactor = Math.min(this.width, this.height) / 760;
      const sunWorldR = 36 * scaleFactor * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);
      if (center.scale <= 0) return;

      const massDrivers = state.clickUpgrades.clk_2 || 0;
      const asteroidMiners = state.generators.gen_4 || 0;
      const gasHarvesters = state.generators.gen_5 || 0;
      const dysonSwarms = state.generators.gen_6 || 0;
      const queue = [];

      // True Circular Inclined Orbital Rings for all 8 Planets
      ctx.lineWidth = 1;
      for (const pl of this.solarPlanets) {
        const d = pl.dist * scaleFactor;
        const sT = Math.sin(pl.tilt), cT = Math.cos(pl.tilt);
        ctx.strokeStyle = pl.key === "neptune" ? "rgba(56, 189, 248, 0.16)" : "rgba(251, 191, 36, 0.13)";
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 60; i++) {
          const a = (i / 60) * Math.PI * 2;
          const op = this.project(Math.cos(a) * d, Math.sin(a) * d * sT, Math.sin(a) * d * cT);
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
            rotX: this.rotX, rotY: this.rotY, spin: t * 0.18, time: t
          });
        }
      });

      // 2. All 8 Planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)
      for (const pl of this.solarPlanets) {
        pl.angle += pl.speed * dt;
        const d = pl.dist * scaleFactor;
        const sT = Math.sin(pl.tilt), cT = Math.cos(pl.tilt);
        const px = Math.cos(pl.angle) * d;
        const py = Math.sin(pl.angle) * d * sT;
        const pz = Math.sin(pl.angle) * d * cT;
        const proj = this.project(px, py, pz);
        if (proj.scale <= 0) continue;

        const distLen = Math.hypot(px, py, pz) || 1;
        const dxS = px / distLen, dyS = py / distLen, dzS = pz / distLen;
        const sunLight = { x: -dxS, y: -dyS, z: -dzS };
        const pWorldR = pl.radius * scaleFactor;
        const pr = pWorldR * proj.scale;

        queue.push({
          z: proj.z,
          draw: () => {
            this.gpuPlanets.draw(ctx, pl.key, proj.x, proj.y, pr, {
              rotX: this.rotX, rotY: this.rotY, spin: t * 0.8 + pl.angle, time: t, lightDir: sunLight
            });
          }
        });

        // True 3D Axially-Tilted Saturn Rings (C/B/A bands, Cassini Division & Planet Shadow!)
        if (pl.saturnRing) {
          const tiltX = 0.466; // Real 26.7° axial obliquity
          const tiltZ = 0.22;
          const cX = Math.cos(tiltX), sX = Math.sin(tiltX);
          const cZ = Math.cos(tiltZ), sZ = Math.sin(tiltZ);

          const ringPoint = (rad, ang) => {
            const rx = Math.cos(ang) * rad;
            const rz = Math.sin(ang) * rad;
            const y1 = -rz * sX;
            const z1 = rz * cX;
            return {
              x: rx * cZ - y1 * sZ,
              y: y1 * cZ + rx * sZ,
              z: z1
            };
          };

          const bands = [
            { rIn: pWorldR * 1.24, rOut: pWorldR * 1.48, rgb: [188, 166, 130], a: 0.36 }, // C-Ring
            { rIn: pWorldR * 1.48, rOut: pWorldR * 1.94, rgb: [246, 224, 174], a: 0.88 }, // Bright B-Ring
            // Cassini Division Gap: 1.94R to 2.06R
            { rIn: pWorldR * 2.06, rOut: pWorldR * 2.38, rgb: [224, 198, 148], a: 0.68 }  // Outer A-Ring
          ];

          const segs = 52;
          const rSq = pWorldR * pWorldR;
          for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2 + 0.012; // tiny overlap avoids hairline cracks
            const aMid = (a1 + a2) * 0.5;

            for (const band of bands) {
              const midOff = ringPoint((band.rIn + band.rOut) * 0.5, aMid);
              // Check if ring segment falls inside Saturn's cylindrical shadow cast away from the Sun
              const along = midOff.x * dxS + midOff.y * dyS + midOff.z * dzS;
              let shade = 1.0;
              if (along > 0) {
                const perp2 = (midOff.x * midOff.x + midOff.y * midOff.y + midOff.z * midOff.z) - along * along;
                if (perp2 < rSq) shade = 0.22;
              }

              const o1i = ringPoint(band.rIn, a1);
              const o1o = ringPoint(band.rOut, a1);
              const o2o = ringPoint(band.rOut, a2);
              const o2i = ringPoint(band.rIn, a2);

              const p1i = this.project(px + o1i.x, py + o1i.y, pz + o1i.z);
              const p1o = this.project(px + o1o.x, py + o1o.y, pz + o1o.z);
              const p2o = this.project(px + o2o.x, py + o2o.y, pz + o2o.z);
              const p2i = this.project(px + o2i.x, py + o2i.y, pz + o2i.z);
              if (p1i.scale <= 0 || p1o.scale <= 0 || p2o.scale <= 0 || p2i.scale <= 0) continue;

              const midProj = this.project(px + midOff.x, py + midOff.y, pz + midOff.z);
              const cr = Math.round(band.rgb[0] * shade);
              const cg = Math.round(band.rgb[1] * shade);
              const cb = Math.round(band.rgb[2] * shade);

              queue.push({
                z: midProj.z,
                draw: () => {
                  ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${band.a})`;
                  ctx.beginPath();
                  ctx.moveTo(p1i.x, p1i.y);
                  ctx.lineTo(p1o.x, p1o.y);
                  ctx.lineTo(p2o.x, p2o.y);
                  ctx.lineTo(p2i.x, p2i.y);
                  ctx.closePath();
                  ctx.fill();
                }
              });
            }
          }
        }

        // Faint Vertically-Tilted Ring around Uranus (real ~98° obliquity)
        if (pl.uranusRing) {
          const rU = pWorldR * 1.65;
          const segs = 28;
          for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const p1 = this.project(px + Math.cos(a1) * rU * 0.18, py + Math.cos(a1) * rU, pz + Math.sin(a1) * rU);
            const p2 = this.project(px + Math.cos(a2) * rU * 0.18, py + Math.cos(a2) * rU, pz + Math.sin(a2) * rU);
            if (p1.scale <= 0 || p2.scale <= 0) continue;
            queue.push({
              z: (p1.z + p2.z) * 0.5,
              draw: () => {
                ctx.strokeStyle = "rgba(186, 230, 253, 0.34)";
                ctx.lineWidth = Math.max(1, 1.4 * p1.scale);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            });
          }
        }

        // Gas Giant Harvesters on Jupiter, Saturn, Uranus & Neptune
        if (pl.gasGiant && gasHarvesters > 0) {
          const harvRingR = pWorldR * 1.55;
          const drones = Math.min(6, 1 + Math.floor(gasHarvesters / 2));
          for (let i = 0; i < drones; i++) {
            const a = t * 1.8 + (i / drones) * Math.PI * 2;
            const hp = this.project(px + Math.cos(a) * harvRingR, py - pWorldR * 0.65, pz + Math.sin(a) * harvRingR);
            if (hp.scale <= 0) continue;
            queue.push({
              z: hp.z,
              draw: () => {
                ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
                ctx.lineWidth = 1.3 * hp.scale;
                ctx.beginPath();
                ctx.moveTo(hp.x, hp.y);
                ctx.lineTo(proj.x, proj.y);
                ctx.stroke();
                ctx.fillStyle = "#38bdf8";
                ctx.beginPath();
                ctx.arc(hp.x, hp.y, 2.3 * hp.scale, 0, Math.PI * 2);
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
              ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
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
            const x = Math.cos(a) * dysonR, z = Math.sin(a) * dysonR;
            const y1 = -z * Math.sin(tiltX), z1 = z * Math.cos(tiltX);
            const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
            const y2 = y1 * Math.cos(tiltZ) + x * Math.sin(tiltZ);
            const pp = this.project(x2, y2, z1);
            if (pp.scale <= 0) continue;

            queue.push({
              z: pp.z,
              draw: () => {
                const ps = Math.max(2.2, 4.4 * scaleFactor * pp.scale);
                ctx.fillStyle = pp.z < 0 ? "#fbbf24" : "#b45309";
                ctx.strokeStyle = "#fef08a";
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                  const ha = (k / 6) * Math.PI * 2;
                  const hx = pp.x + Math.cos(ha) * ps, hy = pp.y + Math.sin(ha) * ps;
                  if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
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
          const a = projected[lane.a], b = projected[lane.b];
          if (a.scale <= 0 || b.scale <= 0) continue;

          ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
          ctx.lineWidth = 1.6 * ((a.scale + b.scale) * 0.5);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

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
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.48, 0, Math.PI * 2); ctx.fill();

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
       ERA IV: MILKY WAY
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

          const p1 = this.project((pul.x + bx) * scaleFactor, (pul.y + by) * scaleFactor, (pul.z + bz) * scaleFactor);
          const p2 = this.project((pul.x - bx) * scaleFactor, (pul.y - by) * scaleFactor, (pul.z - bz) * scaleFactor);
          if (p1.scale > 0 && p2.scale > 0) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.72)";
            ctx.lineWidth = 2.2 * p.scale;
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
          ctx.fillStyle = "#e0f2fe";
          ctx.beginPath(); ctx.arc(p.x, p.y, 3.4 * p.scale, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (penroseCount > 0 && center.scale > 0) {
        const bhR = (16 + Math.min(12, penroseCount * 1.4)) * scaleFactor;
        const jetH = (125 + Math.min(85, penroseCount * 11)) * scaleFactor;
        const queue = [];

        const pTop = this.project(0, -jetH, 0), pBot = this.project(0, jetH, 0);
        if (pTop.scale > 0 && pBot.scale > 0) {
          queue.push({
            z: center.z + 5,
            draw: () => {
              const g1 = ctx.createLinearGradient(center.x, center.y, pTop.x, pTop.y);
              g1.addColorStop(0, "rgba(192, 132, 252, 0.92)"); g1.addColorStop(1, "rgba(56, 189, 248, 0)");
              ctx.strokeStyle = g1; ctx.lineWidth = 7 * center.scale;
              ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(pTop.x, pTop.y); ctx.stroke();

              const g2 = ctx.createLinearGradient(center.x, center.y, pBot.x, pBot.y);
              g2.addColorStop(0, "rgba(192, 132, 252, 0.92)"); g2.addColorStop(1, "rgba(56, 189, 248, 0)");
              ctx.strokeStyle = g2;
              ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(pBot.x, pBot.y); ctx.stroke();
            }
          });
        }

        const segs = 30;
        for (let i = 0; i < segs; i++) {
          const a1 = t * 2.2 + (i / segs) * Math.PI * 2;
          const a2 = t * 2.2 + ((i + 1) / segs) * Math.PI * 2 + 0.02;
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
              ctx.closePath(); ctx.fill();
            }
          });
        }

        queue.push({
          z: center.z,
          draw: () => {
            ctx.strokeStyle = "#fde047"; ctx.lineWidth = 2.6; ctx.fillStyle = "#020205";
            ctx.beginPath(); ctx.arc(center.x, center.y, bhR * center.scale, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
          }
        });

        queue.sort((a, b) => b.z - a.z);
        for (const item of queue) item.draw();
      }
    }

    /* -----------------------------------------------------------------------
       ERA V: LOCAL GROUP (ANDROMEDA + MILKY WAY 3D COLLISION!)
    ----------------------------------------------------------------------- */
    renderLocalGroupScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 560) * (1 + this.pulse * 0.05);
      const bridges = state.generators.gen_13 || 0;
      const dwarfs = state.generators.gen_14 || 0;
      const collider = state.generators.gen_15 || 0;

      const orbitA = t * 0.25;
      const sep = 105 * scaleFactor;
      const ax = Math.cos(orbitA) * sep, az = Math.sin(orbitA) * sep;
      const bx = -ax, bz = -az;

      const pA = this.project(ax, -18 * scaleFactor, az);
      const pB = this.project(bx, 18 * scaleFactor, bz);

      if (pA.scale > 0) this.drawGlow(ctx, "blue", pA.x, pA.y, 65 * scaleFactor * pA.scale);
      if (pB.scale > 0) this.drawGlow(ctx, "purple", pB.x, pB.y, 78 * scaleFactor * pB.scale);

      // Tidal Stellar Bridge between Milky Way & Andromeda
      if (bridges > 0 && pA.scale > 0 && pB.scale > 0) {
        const strands = Math.min(6, 1 + Math.floor(bridges / 2));
        for (let s = 0; s < strands; s++) {
          ctx.strokeStyle = s % 2 === 0 ? "rgba(125, 211, 252, 0.55)" : "rgba(232, 121, 249, 0.5)";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          const midX = (pA.x + pB.x) * 0.5 + Math.sin(t + s) * 28;
          const midY = (pA.y + pB.y) * 0.5 + Math.cos(t + s) * 24;
          ctx.moveTo(pA.x, pA.y);
          ctx.quadraticCurveTo(midX, midY, pB.x, pB.y);
          ctx.stroke();
        }
      }

      // Spin Milky Way (A) & Andromeda (B)
      const spinA = t * 0.35, spinB = -t * 0.28;
      const cA = Math.cos(spinA), sA = Math.sin(spinA);
      for (const st of this.localGroupA) {
        const rx = st.x * cA - st.z * sA, rz = st.z * cA + st.x * sA;
        const p = this.project(ax + rx * scaleFactor, (st.y - 18) * scaleFactor, az + rz * scaleFactor);
        if (p.scale <= 0) continue;
        ctx.fillStyle = st.color;
        ctx.globalAlpha = Math.min(0.95, 0.55 * p.scale);
        const sz = st.size * p.scale;
        ctx.fillRect(p.x - sz * 0.5, p.y - sz * 0.5, sz, sz);
      }

      const cB = Math.cos(spinB), sB = Math.sin(spinB);
      for (const st of this.localGroupB) {
        const rx = st.x * cB - st.z * sB, rz = st.z * cB + st.x * sB;
        const p = this.project(bx + rx * scaleFactor, (st.y + 18) * scaleFactor, bz + rz * scaleFactor);
        if (p.scale <= 0) continue;
        ctx.fillStyle = st.color;
        ctx.globalAlpha = Math.min(0.95, 0.55 * p.scale);
        const sz = st.size * p.scale;
        ctx.fillRect(p.x - sz * 0.5, p.y - sz * 0.5, sz, sz);
      }
      ctx.globalAlpha = 1;

      // Satellite Dwarf Galaxies (Triangulum & Magellanic Clouds)
      if (dwarfs > 0) {
        const count = Math.min(this.dwarfGalaxies.length, 3 + dwarfs * 2);
        for (let i = 0; i < count; i++) {
          const d = this.dwarfGalaxies[i];
          const a = d.angle + t * d.speed;
          const p = this.project(Math.cos(a) * d.r * scaleFactor, d.y * scaleFactor, Math.sin(a) * d.r * scaleFactor);
          if (p.scale <= 0) continue;
          this.drawGlow(ctx, i % 2 === 0 ? "cyan" : "gold", p.x, p.y, d.size * 2 * scaleFactor * p.scale);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Binary Core Collider Gravitational Vortex
      if (collider > 0) {
        const center = this.project(0, 0, 0);
        if (center.scale > 0) {
          this.drawGlow(ctx, "gold", center.x, center.y, 58 * scaleFactor * center.scale);
          for (let r = 0; r < 3; r++) {
            ctx.strokeStyle = "rgba(253, 224, 71, 0.65)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, (32 + r * 22) * scaleFactor * center.scale, (12 + r * 9) * scaleFactor * center.scale, t * (1 + r * 0.3), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    /* -----------------------------------------------------------------------
       ERA VI: LANIAKEA SUPERCLUSTER
    ----------------------------------------------------------------------- */
    renderSuperclusterScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 550) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);

      const tidalSiphons = state.generators.gen_16 || 0;
      const darkConduits = state.generators.gen_17 || 0;
      const greatAttractor = state.generators.gen_18 || 0;

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
          const a = projected[i], b = projected[(i + 5) % projected.length];
          if (a.scale <= 0 || b.scale <= 0) continue;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
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
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    /* -----------------------------------------------------------------------
       ERA VII: OBSERVABLE UNIVERSE
    ----------------------------------------------------------------------- */
    renderUniverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const quasars = state.generators.gen_19 || 0;
      const looms = state.generators.gen_20 || 0;
      const vacuumEngines = state.generators.gen_21 || 0;

      const projected = this.webNodes.map((n, idx) => {
        const wobble = Math.sin(t * 1.4 + n.phase) * 4;
        const p = this.project((n.x + wobble) * scaleFactor, (n.y - wobble) * scaleFactor, (n.z + wobble) * scaleFactor);
        return { ...p, node: n, idx };
      });

      const loomBoost = Math.min(1, looms * 0.16);
      for (let i = 0; i < this.webEdges.length; i++) {
        const edge = this.webEdges[i];
        const a = projected[edge.a], b = projected[edge.b];
        if (a.scale <= 0 || b.scale <= 0) continue;

        const avgScale = (a.scale + b.scale) * 0.5;
        const depthAlpha = clamp(avgScale - 0.5, 0.08, 0.45) + loomBoost * 0.35;
        ctx.strokeStyle = looms > 0 ? `rgba(129, 140, 248, ${Math.min(0.85, depthAlpha)})` : `rgba(168, 85, 247, ${depthAlpha})`;
        ctx.lineWidth = (1.0 + loomBoost * 1.2) * avgScale;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

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
          ctx.beginPath(); ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2); ctx.fill();
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
       ERA VIII: THE MULTIVERSE (STACKED 3D COSMIC BRANES & QUANTUM FOAM)
    ----------------------------------------------------------------------- */
    renderMultiverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const foam = state.generators.gen_22 || 0;
      const anchors = state.generators.gen_23 || 0;
      const rifts = state.generators.gen_24 || 0;

      // 1. Shimmering Quantum Foam Particles
      const foamVis = Math.min(this.foamDots.length, 45 + foam * 12);
      for (let i = 0; i < foamVis; i++) {
        const f = this.foamDots[i];
        const waveY = Math.sin(t * 1.8 + f.phase) * 10;
        const p = this.project(f.x * scaleFactor, (f.y + waveY) * scaleFactor, f.z * scaleFactor);
        if (p.scale <= 0) continue;
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * p.scale, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 2. Stacked 3D Parallel Cosmic Brane Planes
      const braneCount = Math.min(6, 3 + Math.floor(anchors / 2));
      const braneColors = ["#38bdf8", "#c084fc", "#f472b6", "#34d399", "#fbbf24", "#818cf8"];
      const half = 155 * scaleFactor;
      const grid = 6;

      for (let b = 0; b < braneCount; b++) {
        const yBase = ((b - (braneCount - 1) * 0.5) * 62) * scaleFactor;
        ctx.strokeStyle = braneColors[b % braneColors.length];
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 1.25;

        for (let g = 0; g <= grid; g++) {
          const u = -half + (g / grid) * half * 2;
          // Line along X
          ctx.beginPath();
          let started = false;
          for (let k = 0; k <= grid; k++) {
            const v = -half + (k / grid) * half * 2;
            const rip = Math.sin(t * 1.7 + (u + v) * 0.025 + b) * 8 * scaleFactor;
            const p = this.project(v, yBase + rip, u);
            if (p.scale <= 0) { started = false; continue; }
            if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          // Line along Z
          ctx.beginPath();
          started = false;
          for (let k = 0; k <= grid; k++) {
            const v = -half + (k / grid) * half * 2;
            const rip = Math.sin(t * 1.7 + (u + v) * 0.025 + b) * 8 * scaleFactor;
            const p = this.project(u, yBase + rip, v);
            if (p.scale <= 0) { started = false; continue; }
            if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // 3. Vertical Golden Chronos Rift Conduits piercing the Branes
      if (rifts > 0) {
        const riftCount = Math.min(10, 2 + rifts);
        const topY = -((braneCount - 1) * 36) * scaleFactor;
        const botY = -topY;
        for (let i = 0; i < riftCount; i++) {
          const a = t * 0.35 + (i / riftCount) * Math.PI * 2;
          const rx = Math.cos(a) * 95 * scaleFactor;
          const rz = Math.sin(a) * 95 * scaleFactor;
          const pTop = this.project(rx, topY, rz);
          const pBot = this.project(rx, botY, rz);
          if (pTop.scale <= 0 || pBot.scale <= 0) continue;

          ctx.strokeStyle = "rgba(253, 224, 71, 0.78)";
          ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(pTop.x, pTop.y); ctx.lineTo(pBot.x, pBot.y); ctx.stroke();

          const prog = (t * 0.9 + i * 0.21) % 1;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pTop.x + (pBot.x - pTop.x) * prog, pTop.y + (pBot.y - pTop.y) * prog, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* -----------------------------------------------------------------------
       ERA IX: THE OMNIVERSE (4D TESSERACT + 3D BUBBLE UNIVERSES)
    ----------------------------------------------------------------------- */
    renderOmniverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);
      if (center.scale <= 0) return;

      const bubblesOwned = state.generators.gen_25 || 0;
      const wormholesOwned = state.generators.gen_26 || 0;
      const loomOwned = state.generators.gen_27 || 0;

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
          const p1 = bubbleProjs[i], p2 = bubbleProjs[(i + 1) % bubbleProjs.length];
          if (p1.scale <= 0 || p2.scale <= 0) continue;

          ctx.strokeStyle = "rgba(56, 189, 248, 0.52)";
          ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(center.x, center.y, p2.x, p2.y); ctx.stroke();

          const prog = (t * 0.8 + i * 0.17) % 1;
          const u = 1 - prog;
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(u * u * p1.x + 2 * u * prog * center.x + prog * prog * p2.x, u * u * p1.y + 2 * u * prog * center.y + prog * prog * p2.y, 2.8, 0, Math.PI * 2);
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
            const p1 = projTess[i], p2 = projTess[j];
            if (p1.scale <= 0 || p2.scale <= 0) continue;
            ctx.strokeStyle = (i >= 8 && j >= 8) ? "rgba(56, 189, 248, 0.92)"
              : (i < 8 && j < 8) ? "rgba(232, 121, 249, 0.92)"
              : "rgba(253, 224, 71, 0.8)";
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
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
            ctx.fillStyle = bp.b.fill; ctx.strokeStyle = bp.b.stroke; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.arc(bp.x, bp.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
            ctx.beginPath(); ctx.arc(bp.x - r * 0.32, bp.y - r * 0.32, r * 0.2, 0, Math.PI * 2); ctx.fill();
          }
        });
      }

      queue.sort((a, b) => b.z - a.z);
      for (const item of queue) item.draw();
    }

    /* -----------------------------------------------------------------------
       ERA X: THE ARCHITECT'S VOID (SACRED GOLDEN 3D MERKABA CORE!)
    ----------------------------------------------------------------------- */
    renderArchitectVoidScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);
      if (center.scale <= 0) return;

      const axioms = state.generators.gen_28 || 0;
      const merkaba = state.generators.gen_29 || 0;
      const infinityLoom = state.generators.gen_30 || 0;

      this.drawGlow(ctx, "gold", center.x, center.y, 140 * scaleFactor * center.scale);

      const size = (88 + Math.min(30, merkaba * 3)) * scaleFactor;
      const drawTetra = (verts, spin, color, lw) => {
        const c = Math.cos(spin), s = Math.sin(spin);
        const pts = verts.map(([x, y, z]) => {
          const rx = x * c - z * s, rz = z * c + x * s;
          return this.project(rx * size, y * size, rz * size);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        for (const [a, b] of this.tetraEdges) {
          if (pts[a].scale > 0 && pts[b].scale > 0) {
            ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
          }
        }
      };

      // Counter-rotating Sacred Star Tetrahedron (Merkaba)
      drawTetra(this.tetraA, t * 0.65, "rgba(253, 224, 71, 0.94)", 2.6);
      drawTetra(this.tetraB, -t * 0.65, "rgba(56, 189, 248, 0.92)", 2.6);

      // Orbiting Platonic Axiom Shards
      if (axioms > 0) {
        const shards = Math.min(18, 4 + axioms * 2);
        for (let i = 0; i < shards; i++) {
          const a = t * 0.55 + (i / shards) * Math.PI * 2;
          const r = 165 * scaleFactor;
          const p = this.project(Math.cos(a) * r, Math.sin(a * 2) * 55 * scaleFactor, Math.sin(a) * r);
          if (p.scale <= 0) continue;
          const sz = 6.5 * p.scale;
          ctx.strokeStyle = "#fde047";
          ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - sz); ctx.lineTo(p.x + sz, p.y);
          ctx.lineTo(p.x, p.y + sz); ctx.lineTo(p.x - sz, p.y);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }

      // Infinity Singularity Crown Rings & Hyper-Beams
      if (infinityLoom > 0) {
        const rings = Math.min(5, 2 + Math.floor(infinityLoom / 2));
        for (let r = 0; r < rings; r++) {
          const rad = (118 + r * 26) * scaleFactor * center.scale;
          ctx.strokeStyle = r % 2 === 0 ? "rgba(253, 224, 71, 0.72)" : "rgba(232, 121, 249, 0.68)";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(center.x, center.y, rad, rad * 0.38, t * (0.5 + r * 0.2) * (r % 2 ? -1 : 1), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  const canvas = document.getElementById("cosmosCanvas");
  const cosmos3D = new Cosmos3DEngine(canvas);

  // === END OF PART 2/3 — PASTE PART 3/3 DIRECTLY BELOW THIS LINE ===
  /* =========================================================================
     8. CANVAS INTERACTION (CLICK, ORBIT DRAG, ZOOM & AUTO-HARVESTER)
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
    const gainM = getMpc();
    const gainE = getEpc();

    state.matter += gainM;
    state.energy += gainE;
    state.runMatterEarned += gainM;
    state.lifetimeMatterEarned += gainM;

    audio.playClick(state.era);

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    cosmos3D.triggerClickEffect(x, y);
    spawnFloatingText(x, y, `+${formatNum(gainM)}`);
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
     9. UI RENDERING, RESEARCH LAB, DARK ENERGY SHOP & ACTIONS
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

    const droneLv = state.deShop.de_drone || 0;
    if (droneLv > 0) {
      active.push(`🤖 Auto-Harvester (${droneLv * 2}/s)`);
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
    document.getElementById("energyDisplay").textContent = formatNum(state.energy);
    document.getElementById("epsDisplay").textContent = formatNum(getEps());
    document.getElementById("totalEarnedDisplay").textContent = `Run Matter: ${formatNum(state.runMatterEarned)}`;
    document.getElementById("eraBadge").textContent = ERAS[state.era].badge;

    const amPill = document.getElementById("antimatterPill");
    if (state.era >= 3 || state.antimatter > 0) {
      amPill.style.display = "inline-block";
      document.getElementById("antimatterDisplay").textContent = formatNum(state.antimatter);
      document.getElementById("ampsDisplay").textContent = formatNum(getAmps());
    } else {
      amPill.style.display = "none";
    }

    const dePill = document.getElementById("darkEnergyPill");
    if (state.darkEnergy > 0 || state.totalDarkEnergyEarned > 0) {
      dePill.style.display = "inline-block";
      document.getElementById("deBonusDisplay").textContent = `${formatNum(state.darkEnergy)} DE (+${formatNum(state.darkEnergy * 25)}%)`;
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

  function buyResearch(id) {
    const res = RESEARCH.find(r => r.id === id);
    if (!res || state.era < res.era || state.research[id]) return;
    if (state.energy < res.costE || state.antimatter < res.costA) return;

    state.energy -= res.costE;
    state.antimatter -= res.costA;
    state.research[id] = true;
    audio.playUpgrade();
    cosmos3D.triggerUpgradePulse();
    saveGame(false, true);
    renderTab();
    updateHUD();
    showToast(`Research Unlocked: ${res.name}!`);
  }

  function unlockEra(eraId) {
    if (eraId !== state.era + 1) return;
    const era = ERAS[eraId];
    if (!era) return;
    if (state.matter < era.costM || state.energy < era.costE || state.antimatter < era.costA) return;

    state.matter -= era.costM;
    state.energy -= era.costE;
    state.antimatter -= era.costA;
    state.era = eraId;
    cosmos3D.setEra(eraId, false);
    audio.playTierUp();
    saveGame(false, true);
    renderTab();
    updateHUD();
    updateStructuresBar();
    showToast(`Cosmic Scale Expanded: ${era.name}!`);
  }

  function buyDePerk(id) {
    const item = DE_SHOP.find(d => d.id === id);
    if (!item) return;
    const lv = state.deShop[id] || 0;
    if (lv >= item.maxLv) return;
    const cost = getDeShopCost(item);
    if (state.darkEnergy < cost) return;

    state.darkEnergy -= cost;
    state.deShop[id] = lv + 1;
    audio.playUpgrade();
    cosmos3D.triggerUpgradePulse();
    saveGame(false, true);
    renderTab();
    updateHUD();
    updateStructuresBar();
    showToast(`Singularity Perk Upgraded: ${item.name} Lv.${lv + 1}!`);
  }

  function triggerBigCrunch() {
    const pendingDE = calculatePendingDarkEnergy();
    if (state.era < 6 || pendingDE < 1) return;

    if (!confirm(`Trigger the Big Crunch to reset your run and claim +${formatNum(pendingDE)} Dark Energy (+25% permanent production per unspent DE, or spend in the Singularity Shop)?`)) {
      return;
    }

    const keptDE = state.darkEnergy + pendingDE;
    const keptTotalDE = state.totalDarkEnergyEarned + pendingDE;
    const keptLifetime = state.lifetimeMatterEarned;
    const keptPrestiges = state.prestigeCount + 1;
    const keptDeShop = { ...state.deShop };

    state = defaultState();
    state.darkEnergy = keptDE;
    state.totalDarkEnergyEarned = keptTotalDE;
    state.lifetimeMatterEarned = keptLifetime;
    state.prestigeCount = keptPrestiges;
    state.deShop = keptDeShop;

    // Apply Primordial Seed starter bonus
    const seedLv = state.deShop.de_starter || 0;
    if (seedLv > 0) {
      state.matter = Math.floor(600 * Math.pow(4.5, seedLv - 1));
      state.energy = Math.floor(60 * Math.pow(3.8, seedLv - 1));
    }

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

    /* --- TAB 1: GENERATORS & CLICK AMPLIFIERS --- */
    if (activeTab === "generators") {
      const clkHeader = document.createElement("div");
      clkHeader.className = "section-header";
      clkHeader.innerHTML = `<span>👆 Click Amplifiers</span><span>1.42x Cost • 8% MPS Cap</span>`;
      container.appendChild(clkHeader);

      CLICK_UPGRADES.forEach(upg => {
        if (state.era < upg.era) return;
        const owned = state.clickUpgrades[upg.id] || 0;
        const cost = getClickCost(upg.baseCost, owned);
        const btn = document.createElement("button");
        btn.className = "upgrade-card";
        btn.dataset.costM = cost;
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
      genHeader.innerHTML = `<span>⚙️ Cosmic Generators</span><span>Matter Mult: ${formatNum(getGlobalMatterMult())}x</span>`;
      container.appendChild(genHeader);

      GENERATORS.forEach(gen => {
        if (gen.era > state.era + 1) return;
        const lockedByEra = state.era < gen.era;
        const owned = state.generators[gen.id] || 0;
        const cost = getGenCost(gen.baseCost, owned);
        const eachM = gen.mps * getGlobalMatterMult();
        const eachE = gen.eps * getGlobalEnergyMult();
        const eachA = gen.amps * getGlobalAntiMult();

        const btn = document.createElement("button");
        btn.className = "upgrade-card";
        btn.dataset.costM = lockedByEra ? Infinity : cost;
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
          let prodLine = `+${formatNum(eachM)} 💠/s • +${formatNum(eachE)} ⚡/s`;
          if (gen.amps > 0) prodLine += ` • +${formatNum(eachA)} ⚛️/s`;
          btn.innerHTML = `
            <div class="card-icon">${gen.icon}</div>
            <div class="card-body">
              <div class="card-title">${gen.name} <span class="era-tag">${ERAS[gen.era].name}</span></div>
              <div class="card-desc">${gen.desc}</div>
              <div class="card-visual-tag">✨ ${gen.visual}</div>
              <div class="card-stats">${prodLine}</div>
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
    }

    /* --- TAB 2: RESEARCH LAB (ENERGY & ANTIMATTER TECHS) --- */
    else if (activeTab === "research") {
      const doneCount = Object.keys(state.research).filter(k => state.research[k]).length;
      const header = document.createElement("div");
      header.className = "section-header";
      header.innerHTML = `<span>🔬 Cosmic Research Lab</span><span>Completed: ${doneCount} / ${RESEARCH.length}</span>`;
      container.appendChild(header);

      const visible = RESEARCH.filter(r => r.era <= state.era + 1);
      visible.forEach(res => {
        const bought = !!state.research[res.id];
        const lockedByEra = state.era < res.era;
        const canAfford = !bought && !lockedByEra && state.energy >= res.costE && state.antimatter >= res.costA;

        const card = document.createElement("button");
        card.className = `upgrade-card ${bought ? "unlocked-milestone" : ""}`;
        card.dataset.costE = (bought || lockedByEra) ? Infinity : res.costE;
        card.dataset.costA = (bought || lockedByEra) ? Infinity : res.costA;
        card.disabled = bought || lockedByEra || !canAfford;

        if (lockedByEra) {
          card.innerHTML = `
            <div class="card-icon">🔒</div>
            <div class="card-body">
              <div class="card-title">Classified Research <span class="era-tag">Era ${res.era + 1}</span></div>
              <div class="card-desc">Reach ${ERAS[res.era].name} to unlock this breakthrough.</div>
            </div>
            <div class="card-right">
              <div class="card-cost">Era ${res.era + 1}</div>
            </div>
          `;
        } else {
          let costHtml = bought
            ? `<div class="card-cost" style="color:var(--accent-green)">✅ Active</div>`
            : `<div class="card-cost energy">⚡ ${formatNum(res.costE)}</div>` +
              (res.costA > 0 ? `<div class="card-cost antimatter">⚛️ ${formatNum(res.costA)}</div>` : "");

          card.innerHTML = `
            <div class="card-icon">${res.icon}</div>
            <div class="card-body">
              <div class="card-title">${res.name} <span class="era-tag">Era ${res.era + 1}</span></div>
              <div class="card-desc">${res.desc}</div>
            </div>
            <div class="card-right">${costHtml}</div>
          `;
          if (!bought) card.addEventListener("click", () => buyResearch(res.id));
        }
        container.appendChild(card);
      });
    }

    /* --- TAB 3: 10 COSMIC ERAS (MULTI-CURRENCY MILESTONES) --- */
    else if (activeTab === "eras") {
      const header = document.createElement("div");
      header.className = "section-header";
      header.innerHTML = `<span>🌠 Cosmic Scale Progression</span><span>Current: Era ${state.era + 1} / ${ERAS.length}</span>`;
      container.appendChild(header);

      ERAS.forEach(era => {
        const isUnlocked = state.era >= era.id;
        const isNext = state.era + 1 === era.id;
        const canAfford = isNext && state.matter >= era.costM && state.energy >= era.costE && state.antimatter >= era.costA;

        const card = document.createElement("button");
        card.className = `upgrade-card ${isUnlocked ? "unlocked-milestone" : ""}`;
        card.dataset.costM = isNext ? era.costM : Infinity;
        card.dataset.costE = isNext ? era.costE : Infinity;
        card.dataset.costA = isNext ? era.costA : Infinity;
        card.disabled = isUnlocked || !isNext || !canAfford;

        let rightHtml = "";
        if (isUnlocked) {
          rightHtml = `<div class="card-cost" style="color:var(--accent-green)">✅ Active</div>`;
        } else if (isNext) {
          rightHtml = `<div class="card-cost">💠 ${formatNum(era.costM)}</div>`;
          if (era.costE > 0) rightHtml += `<div class="card-cost energy">⚡ ${formatNum(era.costE)}</div>`;
          if (era.costA > 0) rightHtml += `<div class="card-cost antimatter">⚛️ ${formatNum(era.costA)}</div>`;
        } else {
          rightHtml = `<div class="card-cost">🔒 Locked</div>`;
        }

        card.innerHTML = `
          <div class="card-icon">${era.badge.split(" ")[0]}</div>
          <div class="card-body">
            <div class="card-title">${era.name} <span class="era-tag">Era ${era.id + 1}</span></div>
            <div class="card-desc">${era.desc}</div>
            <div class="card-stats">${era.bonusText}</div>
          </div>
          <div class="card-right">${rightHtml}</div>
        `;
        if (isNext) card.addEventListener("click", () => unlockEra(era.id));
        container.appendChild(card);
      });
    }

    /* --- TAB 4: BIG CRUNCH PRESTIGE & DARK ENERGY SINGULARITY SHOP --- */
    else if (activeTab === "prestige") {
      const pendingDE = calculatePendingDarkEnergy();
      const box = document.createElement("div");
      box.className = "prestige-box";
      box.innerHTML = `
        <h2>🕳️ The Big Crunch</h2>
        <p>
          Reach <strong>Era VII: Observable Universe</strong> and accumulate at least <strong>${formatNum(1e19)} Run Matter</strong> to collapse spacetime into a singularity.
        </p>
        <p>
          Resets Matter, Energy, Antimatter, Generators, Research, and Era back to Planet Earth in exchange for permanent <strong>Dark Energy (🌌)</strong>. Each unspent DE grants <strong>+25% production</strong>, or spend it below on permanent Singularity Perks.
        </p>
        <div class="prestige-metrics">
          <div class="metric-tile">
            <div class="lbl">Unspent Dark Energy</div>
            <div class="val" id="prestigeCurDE">${formatNum(state.darkEnergy)} (+${formatNum(state.darkEnergy * 25)}%)</div>
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
        <button class="crunch-btn" id="crunchActionBtn" ${(state.era < 6 || pendingDE < 1) ? "disabled" : ""}>
          ${state.era < 6 ? "🔒 Reach Era VII: Observable Universe First" : (pendingDE < 1 ? `Need ${formatNum(1e19)} Run Matter to Crunch` : `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`)}
        </button>
      `;
      container.appendChild(box);

      const crunchBtn = document.getElementById("crunchActionBtn");
      if (crunchBtn) crunchBtn.addEventListener("click", triggerBigCrunch);

      // Permanent Dark Energy Singularity Shop
      const shopHeader = document.createElement("div");
      shopHeader.className = "section-header";
      shopHeader.innerHTML = `<span>🌌 Singularity Shop (Permanent)</span><span>Available: ${formatNum(state.darkEnergy)} DE</span>`;
      container.appendChild(shopHeader);

      DE_SHOP.forEach(item => {
        const lv = state.deShop[item.id] || 0;
        const maxed = lv >= item.maxLv;
        const cost = getDeShopCost(item);

        const card = document.createElement("button");
        card.className = `upgrade-card ${maxed ? "unlocked-milestone" : ""}`;
        card.dataset.costDe = maxed ? Infinity : cost;
        card.disabled = maxed || state.darkEnergy < cost;
        card.innerHTML = `
          <div class="card-icon">${item.icon}</div>
          <div class="card-body">
            <div class="card-title">${item.name} <span class="era-tag">Lv.${lv}/${item.maxLv}</span></div>
            <div class="card-desc">${item.desc}</div>
          </div>
          <div class="card-right">
            <div class="card-cost dark">${maxed ? "✅ MAX" : `🌌 ${formatNum(cost)} DE`}</div>
          </div>
        `;
        if (!maxed) card.addEventListener("click", () => buyDePerk(item.id));
        container.appendChild(card);
      });
    }
  }

  function refreshAffordability() {
    const cards = document.querySelectorAll("#tabContent .upgrade-card");
    cards.forEach(card => {
      if (card.classList.contains("unlocked-milestone")) return;
      const cm = card.dataset.costM !== undefined ? Number(card.dataset.costM) : 0;
      const ce = card.dataset.costE !== undefined ? Number(card.dataset.costE) : 0;
      const ca = card.dataset.costA !== undefined ? Number(card.dataset.costA) : 0;
      const cde = card.dataset.costDe !== undefined ? Number(card.dataset.costDe) : 0;

      const impossible = !Number.isFinite(cm) || !Number.isFinite(ce) || !Number.isFinite(ca) || !Number.isFinite(cde);
      const affordable = !impossible &&
        state.matter >= cm &&
        state.energy >= ce &&
        state.antimatter >= ca &&
        state.darkEnergy >= cde;
      card.disabled = !affordable;
    });

    if (activeTab === "prestige") {
      const pendingDE = calculatePendingDarkEnergy();
      const pendingEl = document.getElementById("prestigePendingDE");
      const lifeEl = document.getElementById("prestigeLifetimeVal");
      const btn = document.getElementById("crunchActionBtn");

      if (pendingEl) pendingEl.textContent = `+${formatNum(pendingDE)} DE`;
      if (lifeEl) lifeEl.textContent = formatNum(state.lifetimeMatterEarned);
      if (btn) {
        btn.disabled = state.era < 6 || pendingDE < 1;
        if (state.era < 6) {
          btn.textContent = "🔒 Reach Era VII: Observable Universe First";
        } else if (pendingDE < 1) {
          btn.textContent = `Need ${formatNum(1e19)} Run Matter to Crunch`;
        } else {
          btn.textContent = `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`;
        }
      }
    }
  }

  /* =========================================================================
     10. EVENT WIRING & MAIN LOOP (AUTO-HARVESTER + 4 CURRENCIES + AUTO-SAVE)
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
  let autoClickAccumulator = 0;

  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // 1. Passive 3-Currency Generation (Matter, Energy, Antimatter)
    const mps = getMps();
    const eps = getEps();
    const amps = getAmps();

    if (mps > 0) {
      const gainedM = mps * dt;
      state.matter += gainedM;
      state.runMatterEarned += gainedM;
      state.lifetimeMatterEarned += gainedM;
    }
    if (eps > 0) state.energy += eps * dt;
    if (amps > 0) state.antimatter += amps * dt;

    // 2. Quantum Auto-Harvester Drone (from Singularity Shop)
    const droneLv = state.deShop.de_drone || 0;
    if (droneLv > 0) {
      autoClickAccumulator += dt * (droneLv * 2);
      if (autoClickAccumulator >= 1) {
        const clicks = Math.floor(autoClickAccumulator);
        autoClickAccumulator -= clicks;
        const autoM = getMpc() * clicks;
        const autoE = getEpc() * clicks;
        state.matter += autoM;
        state.energy += autoE;
        state.runMatterEarned += autoM;
        state.lifetimeMatterEarned += autoM;
        cosmos3D.pulse = Math.max(cosmos3D.pulse, 0.25);
      }
    }

    // 3. Dedicated Full-FPS 3D Render
    cosmos3D.render(now, dt);

    // 4. Throttled HUD & Affordability Updates (~12Hz)
    uiAccumulator += dt;
    if (uiAccumulator >= 0.08) {
      uiAccumulator = 0;
      updateHUD();
      refreshAffordability();
    }

    // 5. Reliable Auto-Save every 10 seconds
    saveAccumulator += dt;
    if (saveAccumulator >= 10) {
      saveAccumulator = 0;
      saveGame(false, true);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();