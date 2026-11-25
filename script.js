(() => {
  "use strict";

  /* =========================================================================
     1. NUMBER FORMATTING & FAST MATH UTILITIES
  ========================================================================= */
  const SUFFIXES = [
    "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
    "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"
  ];

  function formatNum(n) {
    if (!isFinite(n)) return "∞";
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

  // Fast atan2 & asin approximations for ultra-smooth 3D sphere texturing
  function fastAtan2(y, x) {
    const absY = Math.abs(y) + 1e-10;
    let r, angle;
    if (x >= 0) {
      r = (x - absY) / (x + absY);
      angle = 0.78539816 - 0.78539816 * r;
    } else {
      r = (x + absY) / (absY - x);
      angle = 2.35619449 - 0.78539816 * r;
    }
    return y < 0 ? -angle : angle;
  }

  function fastAsin(x) {
    const neg = x < 0 ? 1 : 0;
    const ax = Math.abs(x);
    let ret = -0.0187293;
    ret = ret * ax + 0.0742610;
    ret = ret * ax - 0.2121144;
    ret = ret * ax + 1.5707288;
    ret = 1.5707963 - Math.sqrt(1 - ax) * ret;
    return neg ? -ret : ret;
  }

  function hash3(x, y, z) {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function noise3D(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const uz = fz * fz * (3 - 2 * fz);

    const c000 = hash3(ix, iy, iz), c100 = hash3(ix + 1, iy, iz);
    const c010 = hash3(ix, iy + 1, iz), c110 = hash3(ix + 1, iy + 1, iz);
    const c001 = hash3(ix, iy, iz + 1), c101 = hash3(ix + 1, iy, iz + 1);
    const c011 = hash3(ix, iy + 1, iz + 1), c111 = hash3(ix + 1, iy + 1, iz + 1);

    const x00 = c000 + (c100 - c000) * ux;
    const x10 = c010 + (c110 - c010) * ux;
    const x01 = c001 + (c101 - c001) * ux;
    const x11 = c011 + (c111 - c011) * ux;

    const y0 = x00 + (x10 - x00) * uy;
    const y1 = x01 + (x11 - x01) * uy;
    return y0 + (y1 - y0) * uz;
  }

  function fbm3D(x, y, z, octaves = 4) {
    let val = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
      val += amp * noise3D(x * freq, y * freq, z * freq);
      freq *= 2.04;
      amp *= 0.5;
    }
    return val;
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

      // Era-specific musical scales (Hz) for generative cosmic melodies
      const eraScales = [
        [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // Era 0: Earth (C Major Pentatonic)
        [293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // Era 1: Solar (D Lydian Warm)
        [220.00, 261.63, 329.63, 392.00, 440.00, 523.25], // Era 2: Cluster (A Minor 9)
        [196.00, 233.08, 293.66, 349.23, 392.00, 466.16], // Era 3: Milky Way (G Minor Space)
        [174.61, 220.00, 261.63, 329.63, 349.23, 440.00], // Era 4: Laniakea (F Maj7 Vast)
        [164.81, 196.00, 246.94, 293.66, 329.63, 493.88], // Era 5: Universe (E Ethereal)
        [261.63, 329.63, 392.00, 493.88, 587.33, 783.99]  // Era 6: Omniverse (C Maj9 Shimmer)
      ];

      const scheduleStep = () => {
        if (!this.ctx || !this.musicEnabled || this.ctx.state !== "running") return;
        const now = this.ctx.currentTime;
        const scale = eraScales[state.era] || eraScales[0];

        // 1. Deep Warm Cosmic Pad Drone every 4 steps
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

        // 2. Soft Shimmering Star Chime
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
      desc: "A rotating ocean world with drifting clouds, continents, and orbital potential.",
      bonusText: "Starting Cosmic Scale (1x)"
    },
    {
      id: 1, name: "Solar System", badge: "☀️ Era II: Solar System", cost: 12000, mult: 2,
      desc: "Harness a turbulent 3D star and seven shaded worlds in Keplerian orbit.",
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

  // Rebalanced Click Upgrades: steep cost (1.35^n), flat add + additive mult + capped MPS synergy
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
    return 1 + state.darkEnergy * 0.2; // +20% per Dark Energy
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

  // Balanced Click Power: additive bonuses + capped MPS synergy (max 25% of MPS per click)
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
    // Unlocks at Era VI (Observable Universe) once Run Matter >= 100T
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
      state = {
        ...fresh,
        ...parsed,
        era: clamp(parsed.era || 0, 0, ERAS.length - 1),
        generators: { ...fresh.generators, ...(parsed.generators || {}) },
        clickUpgrades: { ...fresh.clickUpgrades, ...(parsed.clickUpgrades || {}) }
      };

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

  // Save reliably when user closes/switches tabs
  window.addEventListener("beforeunload", () => saveGame(false, true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveGame(false, true);
  });

  /* =========================================================================
     5. HIGH-FPS OPTIMIZED 3D TEXTURED SPHERE RENDERER (ACTIVE-PIXEL LUT)
  ========================================================================= */
  class ProceduralSphere {
    constructor(type, texW = 192, texH = 96, renderRes = 116) {
      this.type = type;
      this.texW = texW;
      this.texH = texH;
      this.renderRes = renderRes;
      this.frameCounter = 0;

      const total = texW * texH;
      this.r = new Uint8Array(total);
      this.g = new Uint8Array(total);
      this.b = new Uint8Array(total);
      this.spec = new Uint8Array(total);
      this.emit = new Uint8Array(total);
      this.cloud = new Uint8Array(total);

      this.off = document.createElement("canvas");
      this.off.width = renderRes;
      this.off.height = renderRes;
      this.octx = this.off.getContext("2d");
      this.imgData = this.octx.createImageData(renderRes, renderRes);

      this.buildSphereLUT();
      this.bakeTexture();
    }

    // Precompute only pixels inside the circle (skips corners + removes Math.sqrt from render loop)
    buildSphereLUT() {
      const S = this.renderRes;
      const invHalf = 2 / S;
      const ptrs = [];
      const vxs = [], vys = [], vzs = [], alphas = [];

      for (let py = 0; py < S; py++) {
        const vy = (py + 0.5) * invHalf - 1;
        const vy2 = vy * vy;
        for (let px = 0; px < S; px++) {
          const vx = (px + 0.5) * invHalf - 1;
          const r2 = vx * vx + vy2;
          if (r2 < 1) {
            ptrs.push((py * S + px) * 4);
            vxs.push(vx);
            vys.push(vy);
            vzs.push(-Math.sqrt(1 - r2));
            alphas.push(r2 > 0.93 ? Math.floor(clamp((1 - r2) / 0.07, 0, 1) * 255) : 255);
          }
        }
      }

      this.activeCount = ptrs.length;
      this.lutPtr = new Uint32Array(ptrs);
      this.lutVx = new Float32Array(vxs);
      this.lutVy = new Float32Array(vys);
      this.lutVz = new Float32Array(vzs);
      this.lutAlpha = new Uint8Array(alphas);

      // Initialize alpha channel once
      const data = this.imgData.data;
      for (let i = 0; i < this.activeCount; i++) {
        data[this.lutPtr[i] + 3] = this.lutAlpha[i];
      }
    }

    bakeTexture() {
      const { texW, texH, type } = this;
      const craters = [];
      if (type === "moon" || type === "mercury") {
        for (let i = 0; i < 24; i++) {
          const th = hash3(i, 1, 2) * Math.PI * 2;
          const ph = Math.acos(2 * hash3(i, 3, 4) - 1);
          craters.push({
            x: Math.sin(ph) * Math.cos(th),
            y: Math.cos(ph),
            z: Math.sin(ph) * Math.sin(th),
            rad: 0.09 + hash3(i, 5, 6) * 0.21
          });
        }
      }

      for (let py = 0; py < texH; py++) {
        const lat = ((py + 0.5) / texH - 0.5) * Math.PI;
        const cosLat = Math.cos(lat);
        const sinLat = Math.sin(lat);

        for (let px = 0; px < texW; px++) {
          const lon = (px / texW) * Math.PI * 2;
          const nx = cosLat * Math.cos(lon);
          const ny = sinLat;
          const nz = cosLat * Math.sin(lon);
          const idx = py * texW + px;

          if (type === "earth") {
            const elev = fbm3D(nx * 2.1 + 3.2, ny * 2.1 + 1.4, nz * 2.1 + 2.7, 5);
            const detail = fbm3D(nx * 6.2, ny * 6.2, nz * 6.2, 3);
            const iceCap = Math.abs(ny) + (detail - 0.5) * 0.14;
            const clouds = fbm3D(nx * 3.3 - 4.1, ny * 3.3 + 2.2, nz * 3.3 + 1.1, 4);

            this.cloud[idx] = clouds > 0.53 ? clamp(((clouds - 0.53) / 0.26) * 255, 0, 255) : 0;

            if (iceCap > 0.84) {
              this.r[idx] = 236; this.g[idx] = 245; this.b[idx] = 252;
              this.spec[idx] = 70;
            } else if (elev < 0.495) {
              const depth = clamp((0.495 - elev) / 0.28, 0, 1);
              this.r[idx] = 10 + (1 - depth) * 28;
              this.g[idx] = 48 + (1 - depth) * 88;
              this.b[idx] = 118 + (1 - depth) * 95;
              this.spec[idx] = 225;
            } else {
              const h = (elev - 0.495) / 0.32;
              if (h < 0.35) {
                this.r[idx] = 36 + detail * 42;
                this.g[idx] = 130 + detail * 48;
                this.b[idx] = 68 + detail * 20;
              } else if (h < 0.68) {
                this.r[idx] = 115 + detail * 65;
                this.g[idx] = 126 + detail * 40;
                this.b[idx] = 68 + detail * 24;
              } else {
                this.r[idx] = 160 + h * 50;
                this.g[idx] = 154 + h * 48;
                this.b[idx] = 150 + h * 48;
              }
              this.spec[idx] = 12;
              const city = fbm3D(nx * 11, ny * 11, nz * 11, 2);
              if (h < 0.42 && city > 0.56) {
                this.emit[idx] = clamp(((city - 0.56) / 0.28) * 255, 0, 255);
              }
            }
          } else if (type === "moon" || type === "mercury") {
            const n = fbm3D(nx * 3.2, ny * 3.2, nz * 3.2, 4);
            let craterMod = 0;
            for (const c of craters) {
              const d = Math.hypot(nx - c.x, ny - c.y, nz - c.z);
              if (d < c.rad) {
                const t = d / c.rad;
                craterMod += t < 0.78 ? -0.18 * (1 - t) : 0.14 * (1 - Math.abs(t - 0.88) / 0.12);
              }
            }
            const shade = clamp((type === "moon" ? 132 : 122) + (n - 0.5) * 95 + craterMod * 115, 42, 225);
            this.r[idx] = shade;
            this.g[idx] = shade * (type === "moon" ? 0.99 : 0.94);
            this.b[idx] = shade * (type === "moon" ? 1.02 : 0.88);
            const baseCluster = fbm3D(nx * 10, ny * 10, nz * 10, 2);
            if (type === "moon" && baseCluster > 0.65) {
              this.emit[idx] = clamp(((baseCluster - 0.65) / 0.25) * 255, 0, 255);
            }
          } else if (type === "sun") {
            const gran = fbm3D(nx * 5.0, ny * 5.0, nz * 5.0, 4);
            const flare = fbm3D(nx * 2.4 + 7, ny * 2.4 - 3, nz * 2.4 + 2, 3);
            const heat = clamp(gran * 0.65 + flare * 0.55, 0, 1);
            this.r[idx] = clamp(210 + heat * 45, 0, 255);
            this.g[idx] = clamp(75 + heat * 175, 0, 255);
            this.b[idx] = clamp(heat > 0.68 ? (heat - 0.68) * 650 : 12, 0, 255);
          } else if (type === "jupiter") {
            const swirl = fbm3D(nx * 4.5, ny * 9.5, nz * 4.5, 4);
            const band = Math.sin(ny * 18 + (swirl - 0.5) * 2.4) * 0.5 + 0.5;
            const spotDist = Math.hypot((nx - 0.72) * 1.4, (ny - 0.32) * 3.1, (nz - 0.52) * 1.4);
            if (spotDist < 0.34) {
              this.r[idx] = 214; this.g[idx] = 92; this.b[idx] = 64;
            } else {
              this.r[idx] = 175 + band * 68;
              this.g[idx] = 122 + band * 76;
              this.b[idx] = 84 + band * 62;
            }
          } else if (type === "saturn") {
            const swirl = fbm3D(nx * 3.0, ny * 7.5, nz * 3.0, 3);
            const band = Math.sin(ny * 15 + (swirl - 0.5) * 1.4) * 0.5 + 0.5;
            this.r[idx] = 200 + band * 45;
            this.g[idx] = 175 + band * 42;
            this.b[idx] = 115 + band * 35;
          } else if (type === "mars") {
            const n = fbm3D(nx * 3.6, ny * 3.6, nz * 3.6, 4);
            if (Math.abs(ny) > 0.89) {
              this.r[idx] = 235; this.g[idx] = 228; this.b[idx] = 224;
            } else {
              this.r[idx] = clamp(150 + n * 85, 80, 235);
              this.g[idx] = clamp(62 + n * 58, 30, 145);
              this.b[idx] = clamp(42 + n * 34, 20, 95);
            }
          } else if (type === "venus") {
            const n = fbm3D(nx * 3.0, ny * 5.0, nz * 3.0, 4);
            this.r[idx] = 215 + n * 35;
            this.g[idx] = 175 + n * 45;
            this.b[idx] = 95 + n * 40;
          } else {
            const n = fbm3D(nx * 2.5, ny * 6.0, nz * 2.5, 3);
            this.r[idx] = 95 + n * 48;
            this.g[idx] = 205 + n * 36;
            this.b[idx] = 225 + n * 28;
          }
        }
      }
    }

    draw(ctx, cx, cy, screenRadius, options) {
      if (screenRadius < 1.5) return;
      const {
        spin = 0, cloudSpin = 0, rotX = 0, rotY = 0,
        lightDir = { x: -0.64, y: -0.36, z: -0.68 },
        cityBoost = 0, magmaBoost = 0, lunarBaseBoost = 0,
        atmoColor = null, isEmissive = false, skipFrames = 0
      } = options;

      // Optional frame skipping for small orbiting bodies keeps 3D buttery smooth
      this.frameCounter++;
      if (skipFrames === 0 || this.frameCounter % (skipFrames + 1) === 1) {
        const data = this.imgData.data;
        const { texW, texH, r, g, b, spec, emit, cloud, activeCount, lutPtr, lutVx, lutVy, lutVz } = this;

        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

        const vy1 = -sinX;
        const vz1 = -cosX;
        const vwx = vz1 * sinY;
        const vwy = vy1;
        const vwz = vz1 * cosY;

        let hx = lightDir.x + vwx;
        let hy = lightDir.y + vwy;
        let hz = lightDir.z + vwz;
        const hLen = Math.hypot(hx, hy, hz) || 1;
        hx /= hLen; hy /= hLen; hz /= hLen;

        const twoPiInv = 0.159154943;
        const piInv = 0.318309886;
        const spinOffset = (spin * twoPiInv) % 1;
        const cloudOffset = (cloudSpin * twoPiInv) % 1;
        const isEarth = this.type === "earth";
        const isMoon = this.type === "moon";
        const ldx = lightDir.x, ldy = lightDir.y, ldz = lightDir.z;

        for (let i = 0; i < activeCount; i++) {
          const vx = lutVx[i];
          const vy = lutVy[i];
          const vz = lutVz[i];

          const y1 = vy * cosX + vz * sinX;
          const z1 = vz * cosX - vy * sinX;
          const wx = vx * cosY + z1 * sinY;
          const wz = z1 * cosY - vx * sinY;
          const wy = y1;

          let u = fastAtan2(wz, wx) * twoPiInv + 0.5 - spinOffset;
          u -= Math.floor(u);
          const v = fastAsin(wy < -1 ? -1 : wy > 1 ? 1 : wy) * piInv + 0.5;

          const tx = (u * texW) | 0;
          const ty = (v * texH) | 0;
          const idx = (ty >= texH ? texH - 1 : ty < 0 ? 0 : ty) * texW + (tx >= texW ? texW - 1 : tx < 0 ? 0 : tx);

          let cr = r[idx];
          let cg = g[idx];
          let cb = b[idx];

          if (isEmissive) {
            let u2 = u + cloudOffset;
            u2 -= Math.floor(u2);
            const tx2 = (u2 * texW) | 0;
            const idx2 = (ty >= texH ? texH - 1 : ty < 0 ? 0 : ty) * texW + (tx2 >= texW ? texW - 1 : tx2 < 0 ? 0 : tx2);
            const limb = 0.55 + 0.45 * (-vz);
            cr = (cr * 0.65 + r[idx2] * 0.45) * limb + 26;
            cg = (cg * 0.65 + g[idx2] * 0.45) * limb;
            cb = (cb * 0.65 + b[idx2] * 0.45) * limb;
          } else {
            const ndotl = wx * ldx + wy * ldy + wz * ldz;
            const diffuse = ndotl > 0 ? ndotl : 0;
            const light = 0.08 + diffuse * 0.96;

            let cloudAmt = 0;
            if (isEarth) {
              let uc = u - cloudOffset;
              uc -= Math.floor(uc);
              const txc = (uc * texW) | 0;
              const cIdx = (ty >= texH ? texH - 1 : ty < 0 ? 0 : ty) * texW + (txc >= texW ? texW - 1 : txc < 0 ? 0 : txc);
              cloudAmt = cloud[cIdx] * 0.0039215;
            }

            let specAdd = 0;
            if (spec[idx] > 40 && diffuse > 0 && cloudAmt < 0.5) {
              const ndoth = wx * hx + wy * hy + wz * hz;
              if (ndoth > 0) {
                const p2 = ndoth * ndoth;
                const p4 = p2 * p2;
                const p8 = p4 * p4;
                specAdd = p8 * p8 * (spec[idx] * 0.0039215) * 145 * (1 - cloudAmt);
              }
            }

            const cMix = cloudAmt * 0.82;
            const invMix = 1 - cMix;
            cr = (cr * invMix + 245 * cMix) * light + specAdd;
            cg = (cg * invMix + 250 * cMix) * light + specAdd;
            cb = (cb * invMix + 255 * cMix) * light + specAdd;

            if (isEarth && emit[idx] > 0) {
              const nightMask = clamp((-ndotl + 0.15) * 2.2, 0, 1);
              if (cityBoost > 0 && nightMask > 0) {
                const glow = (emit[idx] * 0.0039215) * nightMask * cityBoost;
                cr += glow * 255;
                cg += glow * 195;
                cb += glow * 85;
              }
              if (magmaBoost > 0 && emit[idx] > 140) {
                const lava = ((emit[idx] - 140) * 0.00869) * magmaBoost;
                cr += lava * 255;
                cg += lava * 90;
                cb += lava * 15;
              }
            } else if (isMoon && lunarBaseBoost > 0 && emit[idx] > 0) {
              const baseGlow = (emit[idx] * 0.0039215) * lunarBaseBoost;
              cr += baseGlow * 55;
              cg += baseGlow * 210;
              cb += baseGlow * 255;
            }

            if (atmoColor) {
              const f = 1 + vz;
              const fresnel = f * f * f * (0.36 + diffuse * 0.85);
              cr += atmoColor[0] * fresnel;
              cg += atmoColor[1] * fresnel;
              cb += atmoColor[2] * fresnel;
            }
          }

          const ptr = lutPtr[i];
          data[ptr] = cr > 255 ? 255 : cr;
          data[ptr + 1] = cg > 255 ? 255 : cg;
          data[ptr + 2] = cb > 255 ? 255 : cb;
        }

        this.octx.putImageData(this.imgData, 0, 0);
      }

      ctx.drawImage(this.off, cx - screenRadius, cy - screenRadius, screenRadius * 2, screenRadius * 2);
    }
  }

  /* =========================================================================
     6. PRE-RENDERED GLOW SPRITE CACHE (ELIMINATES GRADIENT ALLOCATION LAG)
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
     7. FULL 7-ERA 3D COSMOS ENGINE WITH UPGRADE EVOLUTION
  ========================================================================= */
  class Cosmos3DEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.width = 0;
      this.height = 0;
      this.fov = 560;

      // Smooth frame-rate-independent camera
      this.rotX = 0.34;
      this.rotY = -0.3;
      this.velX = 0;
      this.velY = 0;
      this.zoom = 1.0;
      this.targetZoom = 1.0;

      // Visual state
      this.pulse = 0;
      this.eraTransition = 0;
      this.currentEra = 0;
      this.earthSpin = 0;
      this.clickBeams = [];
      this.burstParticles = [];
      this.shockwaves = [];

      // Glow Sprite Cache
      this.glows = {
        blue: createGlowSprite("rgba(186, 230, 253, 0.95)", "rgba(56, 189, 248, 0.42)"),
        gold: createGlowSprite("rgba(254, 249, 195, 0.96)", "rgba(251, 146, 60, 0.45)"),
        purple: createGlowSprite("rgba(233, 213, 255, 0.92)", "rgba(168, 85, 247, 0.4)"),
        pink: createGlowSprite("rgba(251, 207, 232, 0.9)", "rgba(236, 72, 153, 0.36)"),
        red: createGlowSprite("rgba(254, 202, 202, 0.95)", "rgba(239, 68, 68, 0.4)"),
        cyan: createGlowSprite("rgba(207, 250, 254, 0.95)", "rgba(34, 211, 238, 0.4)")
      };

      // Optimized 3D Spheres
      this.spheres = {
        earth: new ProceduralSphere("earth", 192, 96, 124),
        moon: new ProceduralSphere("moon", 96, 48, 44),
        sun: new ProceduralSphere("sun", 128, 64, 84),
        mercury: new ProceduralSphere("mercury", 64, 32, 24),
        venus: new ProceduralSphere("venus", 72, 36, 30),
        mars: new ProceduralSphere("mars", 72, 36, 28),
        jupiter: new ProceduralSphere("jupiter", 112, 56, 46),
        saturn: new ProceduralSphere("saturn", 112, 56, 44),
        uranus: new ProceduralSphere("uranus", 80, 40, 34)
      };

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
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }

    initDatasets() {
      // Deep 3D Background Starfield
      this.stars = [];
      for (let i = 0; i < 340; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 760 + Math.random() * 1050;
        this.stars.push({
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th),
          z: r * Math.cos(ph),
          size: 0.7 + Math.random() * 1.5,
          hue: [200, 220, 265, 42][Math.floor(Math.random() * 4)],
          twinkle: Math.random() * Math.PI * 2
        });
      }

      // Era 1: Solar System Planets & Asteroids
      this.solarPlanets = [
        { key: "mercury", dist: 78, radius: 5.5, speed: 0.55, angle: 0.4, tilt: 0.08 },
        { key: "venus", dist: 106, radius: 8.5, speed: 0.42, angle: 2.1, tilt: 0.05 },
        { key: "earth", dist: 140, radius: 9.8, speed: 0.32, angle: 3.7, tilt: 0.02 },
        { key: "mars", dist: 174, radius: 7.4, speed: 0.25, angle: 5.1, tilt: 0.06 },
        { key: "jupiter", dist: 232, radius: 19, speed: 0.15, angle: 1.2, tilt: 0.04, gasGiant: true },
        { key: "saturn", dist: 295, radius: 16.5, speed: 0.11, angle: 4.3, tilt: 0.09, gasGiant: true, ring: true },
        { key: "uranus", dist: 348, radius: 12, speed: 0.08, angle: 2.7, tilt: 0.07 }
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

      // Era 2: Local Star Cluster (32 colorful 3D stars + warp connections + nursery clouds)
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

      // Era 3: Milky Way Spiral Galaxy
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

      // Era 4: Laniakea Supercluster (46 tilted 3D mini-galaxies flowing into Great Attractor)
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

      // Era 5: Observable Universe Cosmic Web
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

      // Era 6: The Omniverse (4D Tesseract vertices/edges + Bubble Universes)
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
        maxRadius: Math.min(this.width, this.height) * 0.45,
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
            x2: this.width * 0.5, y2: this.height * 0.52,
            life: 1.0, color: col
          });
        } else {
          this.shockwaves.push({
            radius: 14,
            maxRadius: Math.min(this.width, this.height) * 0.46,
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
      if (denom <= 25) return { x: 0, y: 0, z: z2, scale: -1 };

      const scale = this.fov / denom;
      return {
        x: this.width * 0.5 + x1 * scale,
        y: this.height * 0.52 + y2 * scale,
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

      // Frame-rate-independent ultra-smooth camera inertia & damping
      const damp = Math.exp(-6.5 * dt);
      const lerpZoom = 1 - Math.exp(-9 * dt);
      this.rotY += 0.16 * dt + this.velY;
      this.rotX = clamp(this.rotX + this.velX, -1.32, 1.32);
      this.velX *= damp;
      this.velY *= damp;
      this.zoom += (this.targetZoom - this.zoom) * lerpZoom;

      this.earthSpin += dt * 0.15;
      this.pulse *= Math.exp(-10 * dt);
      this.eraTransition *= Math.exp(-4.5 * dt);

      // Era-adaptive deep cosmic background
      const bgPalettes = [
        ["#07142e", "#02050c"], // Earth
        ["#1a0f06", "#03040a"], // Solar
        ["#071a2b", "#02050b"], // Star Cluster
        ["#130926", "#020309"], // Milky Way
        ["#1c0922", "#030208"], // Laniakea
        ["#160728", "#020207"], // Universe
        ["#0b1632", "#04010c"]  // Omniverse
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

      // Background 3D Starfield
      for (const s of this.stars) {
        const p = this.project(s.x, s.y, s.z, this.rotX * 0.3, this.rotY * 0.25);
        if (p.scale <= 0) continue;
        const alpha = 0.28 + 0.48 * Math.sin(t * 2 + s.twinkle);
        ctx.fillStyle = `hsla(${s.hue}, 85%, 86%, ${alpha})`;
        const sr = Math.max(0.6, s.size * p.scale);
        ctx.fillRect(p.x - sr * 0.5, p.y - sr * 0.5, sr, sr);
      }

      if (state.darkEnergy > 0) this.renderDarkEnergyAura(ctx, t);

      // Render Active 3D Cosmic Era
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
        ctx.arc(this.width * 0.5, this.height * 0.52, sw.radius, 0, Math.PI * 2);
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

      // Era Transition Shockwave
      if (this.eraTransition > 0.02) {
        const r = (1 - this.eraTransition) * Math.min(this.width, this.height) * 0.68;
        ctx.strokeStyle = `rgba(192, 132, 252, ${this.eraTransition * 0.85})`;
        ctx.lineWidth = 5 * this.eraTransition;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, this.height * 0.52, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Click Particle Bursts
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
      const cy = this.height * 0.52;
      this.drawGlow(ctx, "purple", cx, cy, Math.min(this.width, this.height) * 0.36);

      const count = Math.min(12, Math.max(3, Math.floor(Math.log2(state.darkEnergy + 1) * 2)));
      for (let i = 0; i < count; i++) {
        const a = t * 0.6 + (i / count) * Math.PI * 2;
        const p = this.project(Math.cos(a) * 240, Math.sin(a * 2) * 55, Math.sin(a) * 240);
        if (p.scale <= 0) continue;
        ctx.fillStyle = "#d8b4fe";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* -----------------------------------------------------------------------
       ERA I: PLANET EARTH
    ----------------------------------------------------------------------- */
    renderEarthScene(ctx, t) {
      const worldR = Math.min(this.width, this.height) * 0.22 * (1 + this.pulse * 0.045);
      const center = this.project(0, 0, 0);

      const drills = state.clickUpgrades.clk_1 || 0;
      const extractors = state.generators.gen_1 || 0;
      const lunarColonies = state.generators.gen_2 || 0;
      const elevators = state.generators.gen_3 || 0;
      const queue = [];

      const moonOrbitR = worldR * 1.92;
      const moonAngle = t * 0.55;
      const mx = Math.cos(moonAngle) * moonOrbitR;
      const my = Math.sin(moonAngle * 0.7) * worldR * 0.25;
      const mz = Math.sin(moonAngle) * moonOrbitR;
      const moonProj = this.project(mx, my, mz);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 54; i++) {
        const a = (i / 54) * Math.PI * 2;
        const op = this.project(Math.cos(a) * moonOrbitR, Math.sin(a * 0.7) * worldR * 0.25, Math.sin(a) * moonOrbitR);
        if (op.scale <= 0) continue;
        if (i === 0) ctx.moveTo(op.x, op.y);
        else ctx.lineTo(op.x, op.y);
      }
      ctx.stroke();

      queue.push({
        z: center.z,
        draw: () => {
          const sr = worldR * center.scale;
          this.drawGlow(ctx, "blue", center.x, center.y, sr * 1.38);
          this.spheres.earth.draw(ctx, center.x, center.y, sr, {
            spin: this.earthSpin,
            cloudSpin: this.earthSpin * 0.28,
            rotX: this.rotX,
            rotY: this.rotY,
            cityBoost: Math.min(1.6, extractors * 0.22 + lunarColonies * 0.08),
            magmaBoost: Math.min(1.35, drills * 0.2 + extractors * 0.12),
            atmoColor: [65, 185, 255]
          });
        }
      });

      if (moonProj.scale > 0) {
        queue.push({
          z: moonProj.z,
          draw: () => {
            const mr = worldR * 0.25 * moonProj.scale;
            this.spheres.moon.draw(ctx, moonProj.x, moonProj.y, mr, {
              spin: moonAngle * 0.3,
              rotX: this.rotX,
              rotY: this.rotY,
              lunarBaseBoost: Math.min(1.6, lunarColonies * 0.32),
              skipFrames: 1
            });
          }
        });
      }

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
                this.drawGlow(ctx, "cyan", sp.x, sp.y, 7 * sp.scale);
                ctx.fillStyle = "#e0f2fe";
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 2.2 * sp.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
      }

      if (extractors > 0) {
        const satCount = Math.min(12, Math.max(2, Math.floor(extractors * 0.75)));
        for (let i = 0; i < satCount; i++) {
          const a = t * 0.9 + (i / satCount) * Math.PI * 2;
          const inc = (i % 3 - 1) * 0.55;
          const r = worldR * 1.18;
          const p = this.project(Math.cos(a) * r, Math.sin(a) * r * Math.sin(inc), Math.sin(a) * r * Math.cos(inc));
          if (p.scale > 0) {
            queue.push({
              z: p.z,
              draw: () => {
                ctx.fillStyle = "#fb923c";
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.6 * p.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
      }

      if (elevators > 0) {
        const towerCount = Math.min(8, elevators);
        const topR = worldR * 1.5;

        for (let i = 0; i < towerCount; i++) {
          const lon = this.earthSpin + (i / towerCount) * Math.PI * 2;
          const bx = Math.cos(lon) * worldR * 0.98, bz = Math.sin(lon) * worldR * 0.98;
          const tx = Math.cos(lon) * topR, tz = Math.sin(lon) * topR;
          const pBase = this.project(bx, 0, bz);
          const pTop = this.project(tx, 0, tz);
          const climbT = (t * 0.65 + i * 0.27) % 1;
          const pClimb = this.project(bx + (tx - bx) * climbT, 0, bz + (tz - bz) * climbT);

          queue.push({
            z: (pBase.z + pTop.z) * 0.5,
            draw: () => {
              if (pBase.scale <= 0 || pTop.scale <= 0) return;
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
          const segs = 36;
          const ringAlpha = Math.min(0.9, 0.35 + (elevators - 2) * 0.12);
          for (let i = 0; i < segs; i++) {
            const a1 = this.earthSpin + (i / segs) * Math.PI * 2;
            const a2 = this.earthSpin + ((i + 1) / segs) * Math.PI * 2;
            const p1 = this.project(Math.cos(a1) * topR, 0, Math.sin(a1) * topR);
            const p2 = this.project(Math.cos(a2) * topR, 0, Math.sin(a2) * topR);
            queue.push({
              z: (p1.z + p2.z) * 0.5,
              draw: () => {
                if (p1.scale <= 0 || p2.scale <= 0) return;
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
       ERA II: SOLAR SYSTEM
    ----------------------------------------------------------------------- */
    renderSolarScene(ctx, t, dt) {
      const scaleFactor = Math.min(this.width, this.height) / 690;
      const sunWorldR = 38 * scaleFactor * (1 + this.pulse * 0.06);
      const center = this.project(0, 0, 0);

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
        for (let i = 0; i <= 52; i++) {
          const a = (i / 52) * Math.PI * 2;
          const op = this.project(Math.cos(a) * d, Math.sin(a) * d * pl.tilt, Math.sin(a) * d);
          if (op.scale <= 0) continue;
          if (i === 0) ctx.moveTo(op.x, op.y);
          else ctx.lineTo(op.x, op.y);
        }
        ctx.stroke();
      }

      queue.push({
        z: center.z,
        draw: () => {
          const sr = sunWorldR * center.scale;
          this.drawGlow(ctx, "gold", center.x, center.y, sr * 2.55);
          this.spheres.sun.draw(ctx, center.x, center.y, sr, {
            spin: t * 0.18,
            cloudSpin: -t * 0.12,
            rotX: this.rotX,
            rotY: this.rotY,
            isEmissive: true
          });
        }
      });

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
            this.spheres[pl.key].draw(ctx, proj.x, proj.y, pr, {
              spin: t * 0.8 + pl.angle,
              cloudSpin: t * 0.3,
              rotX: this.rotX,
              rotY: this.rotY,
              lightDir: sunLight,
              atmoColor: pl.key === "earth" ? [56, 189, 248] : null,
              skipFrames: 1
            });
          }
        });

        if (pl.ring) {
          const rInner = pl.radius * 1.42 * scaleFactor;
          const rOuter = pl.radius * 2.35 * scaleFactor;
          const segs = 22;
          for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const p1i = this.project(px + Math.cos(a1) * rInner, py + Math.sin(a1) * rInner * 0.35, pz + Math.sin(a1) * rInner);
            const p1o = this.project(px + Math.cos(a1) * rOuter, py + Math.sin(a1) * rOuter * 0.35, pz + Math.sin(a1) * rOuter);
            const p2o = this.project(px + Math.cos(a2) * rOuter, py + Math.sin(a2) * rOuter * 0.35, pz + Math.sin(a2) * rOuter);
            const p2i = this.project(px + Math.cos(a2) * rInner, py + Math.sin(a2) * rInner * 0.35, pz + Math.sin(a2) * rInner);
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
       ERA III: LOCAL STAR CLUSTER (NEW 3D SCENE!)
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

      // 1. Stellar Nursery Volumetric Gas Clouds (from Stellar Nursery Scoop)
      if (nurseries > 0) {
        const cloudCount = Math.min(18, 3 + nurseries * 2);
        for (let i = 0; i < cloudCount; i++) {
          const p = projected[i % projected.length];
          if (p.scale <= 0) continue;
          this.drawGlow(ctx, i % 2 === 0 ? "pink" : "cyan", p.x, p.y, 70 * scaleFactor * p.scale);
        }
      }

      // 2. Interstellar Warp Gate Lanes (from Interstellar Warp Gate)
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

          // Traveling Warp Ship Pulse
          const prog = (t * 0.75 + lane.phase) % 1;
          const px = a.x + (b.x - a.x) * prog;
          const py = a.y + (b.y - a.y) * prog;
          ctx.fillStyle = "#e0f2fe";
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Depth-Sorted 3D Cluster Stars + Star-Lifting Rings
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

        // Star-Lifting Magnetic Rings around Giant Stars
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

      if (penroseCount === 0) {
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

          ctx.strokeStyle = "rgba(56, 189, 248, 0.72)";
          ctx.lineWidth = 2.2 * p.scale;
          ctx.beginPath();
          ctx.moveTo(pTip1.x, pTip1.y);
          ctx.lineTo(pTip2.x, pTip2.y);
          ctx.stroke();

          ctx.fillStyle = "#e0f2fe";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.4 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (penroseCount > 0) {
        const bhR = (16 + Math.min(12, penroseCount * 1.4)) * scaleFactor;
        const jetH = (125 + Math.min(85, penroseCount * 11)) * scaleFactor;
        const queue = [];

        const pTop = this.project(0, -jetH, 0);
        const pBot = this.project(0, jetH, 0);
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

        const segs = 30;
        for (let i = 0; i < segs; i++) {
          const a1 = t * 2.2 + (i / segs) * Math.PI * 2;
          const a2 = t * 2.2 + ((i + 1) / segs) * Math.PI * 2;
          const rIn = bhR * 1.3, rOut = bhR * 2.8;
          const p1i = this.project(Math.cos(a1) * rIn, 0, Math.sin(a1) * rIn);
          const p1o = this.project(Math.cos(a1) * rOut, 0, Math.sin(a1) * rOut);
          const p2o = this.project(Math.cos(a2) * rOut, 0, Math.sin(a2) * rOut);
          const p2i = this.project(Math.cos(a2) * rIn, 0, Math.sin(a2) * rIn);
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
       ERA V: LANIAKEA SUPERCLUSTER (NEW 3D SCENE!)
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

      // 1. Dark Matter Conduits flowing toward Great Attractor
      if (darkConduits > 0) {
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

      // 2. Galactic Tidal Siphon Bridges between neighbor galaxies
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

      // 3. Great Attractor Central Vortex
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

      // 4. Depth-Sorted Miniature 3D Tilted Spiral Galaxies
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

      // Vacuum Metastability Energy Shells
      if (vacuumEngines > 0) {
        const center = this.project(0, 0, 0);
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

    /* -----------------------------------------------------------------------
       ERA VII: THE OMNIVERSE (4D ROTATING TESSERACT + 3D BUBBLE UNIVERSES!)
    ----------------------------------------------------------------------- */
    renderOmniverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);

      const bubblesOwned = state.generators.gen_19 || 0;
      const wormholesOwned = state.generators.gen_20 || 0;
      const loomOwned = state.generators.gen_21 || 0;

      // Central dimensional aura
      this.drawGlow(ctx, "purple", center.x, center.y, 120 * scaleFactor * center.scale);

      // 1. Project 3D Orbiting Bubble Universes
      const visibleBubbles = Math.min(this.bubbleUniverses.length, 6 + bubblesOwned * 2);
      const bubbleProjs = [];
      for (let i = 0; i < visibleBubbles; i++) {
        const b = this.bubbleUniverses[i];
        const a = b.theta + t * b.speed;
        const r = b.orbitR * scaleFactor;
        const bx = r * Math.sin(b.phi) * Math.cos(a);
        const by = r * Math.cos(b.phi) * 0.78;
        const bz = r * Math.sin(b.phi) * Math.sin(a);
        const p = this.project(bx, by, bz);
        bubbleProjs.push({ ...p, b, idx: i });
      }

      // 2. Wormhole Bridges connecting Bubble Universes to Core & Each Other
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
          const px = u * u * p1.x + 2 * u * prog * center.x + prog * prog * p2.x;
          const py = u * u * p1.y + 2 * u * prog * center.y + prog * prog * p2.y;
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(px, py, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. True 4D -> 3D -> 2D Rotating Tesseract (Hypercube) Core!
      const tessSize = (78 + Math.min(34, loomOwned * 4)) * scaleFactor;
      const aXW = t * 0.75;
      const aZW = t * 0.52;
      const cosXW = Math.cos(aXW), sinXW = Math.sin(aXW);
      const cosZW = Math.cos(aZW), sinZW = Math.sin(aZW);

      const projTess = this.tesseractVerts.map(([x, y, z, w]) => {
        // 4D Rotation in XW plane
        const x1 = x * cosXW - w * sinXW;
        const w1 = x * sinXW + w * cosXW;
        // 4D Rotation in ZW plane
        const z2 = z * cosZW - w1 * sinZW;
        const w2 = z * sinZW + w1 * cosZW;

        // 4D Perspective projection to 3D
        const d4 = 2.6 / (3.4 - w2);
        return this.project(x1 * d4 * tessSize, y * d4 * tessSize, z2 * d4 * tessSize);
      });

      const queue = [];

      // Queue Tesseract edges
      queue.push({
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

          // Extra 4D Gyroscopic Reality Loom Rings when gen_21 > 0
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
      });

      // Queue Iridescent 3D Bubble Universes
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

            // Specular bubble highlight + tiny internal universe core
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
    canvas.releasePointerCapture(e.pointerId);
    if (!dragMoved) handleCosmosClick(e.clientX, e.clientY);
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
        // Show current/past era generators + next era's locked preview
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
            <div class="val">${formatNum(state.darkEnergy)} (+${formatNum(state.darkEnergy * 20)}%)</div>
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
        <button class="crunch-btn" id="crunchActionBtn" ${(state.era < 5 || pendingDE < 1) ? "disabled" : ""}>
          ${state.era < 5 ? "🔒 Reach Era VI: Observable Universe First" : (pendingDE < 1 ? "Need 100.00T Run Matter to Crunch" : `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`)}
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
        btn.disabled = state.era < 5 || pendingDE < 1;
        if (state.era >= 5 && pendingDE >= 1) {
          btn.textContent = `💥 Collapse Universe (+${formatNum(pendingDE)} Dark Energy)`;
        }
      }
    }
  }

  /* =========================================================================
     10. EVENT WIRING & SMOOTH MAIN LOOP (THROTTLED DOM + FULL-FPS 3D)
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

    // Dedicated full-FPS 3D render
    cosmos3D.render(now, dt);

    // Throttled HUD & button state updates (~12Hz) to prevent DOM layout stutter
    uiAccumulator += dt;
    if (uiAccumulator >= 0.08) {
      uiAccumulator = 0;
      updateHUD();
      refreshAffordability();
    }

    // Reliable Auto-Save every 10 seconds
    saveAccumulator += dt;
    if (saveAccumulator >= 10) {
      saveAccumulator = 0;
      saveGame(false, true);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();