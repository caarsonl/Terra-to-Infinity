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

  // Deterministic 3D Value Noise for seamless spherical textures (zero seams/pinching)
  function hash3(x, y, z) {
    let n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function noise3D(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const uz = fz * fz * (3 - 2 * fz);

    const c000 = hash3(ix, iy, iz);
    const c100 = hash3(ix + 1, iy, iz);
    const c010 = hash3(ix, iy + 1, iz);
    const c110 = hash3(ix + 1, iy + 1, iz);
    const c001 = hash3(ix, iy, iz + 1);
    const c101 = hash3(ix + 1, iy, iz + 1);
    const c011 = hash3(ix, iy + 1, iz + 1);
    const c111 = hash3(ix + 1, iy + 1, iz + 1);

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
      freq *= 2.05;
      amp *= 0.5;
    }
    return val;
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
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }

    playClick(eraIndex) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreqs = [310, 415, 530, 670];
      const freq = baseFreqs[eraIndex] + (Math.random() * 44 - 22);

      osc.type = eraIndex >= 2 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.48, now + 0.075);

      gain.gain.setValueAtTime(0.1, now);
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
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.075, now + idx * 0.04 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.25);
      });
    }

    playTierUp() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [220, 277.18, 329.63, 440, 659.25].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(f * 0.72, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.55, now + 0.8);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.98);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.02);
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
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 1.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    }
  }

  const audio = new SoundEngine();

  /* =========================================================================
     3. GAME DATA: ERAS, CLICK UPGRADES & GENERATORS (WITH 3D VISUAL EFFECTS)
  ========================================================================= */
  const ERAS = [
    {
      id: 0,
      name: "Planet Earth",
      badge: "🌍 Era I: Planet Earth",
      cost: 0,
      desc: "A rotating ocean world with drifting clouds and orbital potential.",
      bonusText: "Starting Cosmic Scale"
    },
    {
      id: 1,
      name: "Solar System",
      badge: "☀️ Era II: Solar System",
      cost: 15000,
      desc: "Harness a turbulent 3D star and seven shaded worlds in Keplerian orbit.",
      bonusText: "Unlocks Solar generators & 2x global Matter output"
    },
    {
      id: 2,
      name: "Milky Way",
      badge: "🌀 Era III: Milky Way",
      cost: 5000000,
      desc: "Command a 3D spiral galaxy teeming with nebulae, pulsars, and a supermassive core.",
      bonusText: "Unlocks Galactic generators & 3x global Matter output"
    },
    {
      id: 3,
      name: "Observable Universe",
      badge: "🌌 Era IV: Observable Universe",
      cost: 2500000000,
      desc: "Architect a 3D cosmic web of superclusters, quasars, and dimensional colliders.",
      bonusText: "Unlocks Universal generators, 5x global output & Big Crunch"
    }
  ];

  const CLICK_UPGRADES = [
    {
      id: "clk_1", name: "Tectonic Drill", icon: "⛏️", era: 0,
      baseCost: 25, powerAdd: 1, mult: 1,
      desc: "Adds +1 base Matter per click.",
      visual: "3D Visual: Glowing crustal fissures & orbital mining laser"
    },
    {
      id: "clk_2", name: "Orbital Mass Driver", icon: "🛰️", era: 1,
      baseCost: 5000, powerAdd: 25, mult: 1.15,
      desc: "Adds +25 base click & boosts click power by 1.15x.",
      visual: "3D Visual: Golden railgun accelerator ring & solar bolts"
    },
    {
      id: "clk_3", name: "Hypernova Pulse", icon: "💥", era: 2,
      baseCost: 2500000, powerAdd: 1500, mult: 1.25,
      desc: "Adds +1.5K base click & boosts click power by 1.25x.",
      visual: "3D Visual: Expanding 3D galactic shockwave rings"
    },
    {
      id: "clk_4", name: "Vacuum Zero-Point Tap", icon: "✨", era: 3,
      baseCost: 1000000000, powerAdd: 250000, mult: 1.4,
      desc: "Adds +250K base click & boosts click power by 1.40x.",
      visual: "3D Visual: Cascading quantum lightning along web filaments"
    }
  ];

  const GENERATORS = [
    // Era 0: Planet Earth
    {
      id: "gen_1", name: "Core Extractor", icon: "🌋", era: 0, baseCost: 15, baseMps: 0.5,
      desc: "Siphons dense silicate and iron from Earth's mantle.",
      visual: "3D Visual: Illuminates night-side cities & glowing magma veins"
    },
    {
      id: "gen_2", name: "Lunar Colony", icon: "🌑", era: 0, baseCost: 120, baseMps: 4,
      desc: "Automated regolith harvesters on Luna.",
      visual: "3D Visual: Builds glowing lunar bases & Earth-Moon shuttle beams"
    },
    {
      id: "gen_3", name: "Space Elevator", icon: "🗼", era: 0, baseCost: 1100, baseMps: 32,
      desc: "Continuous geostationary orbital tether transport.",
      visual: "3D Visual: Constructs 3D tether towers, climbers & orbital ring"
    },

    // Era 1: Solar System
    {
      id: "gen_4", name: "Asteroid Belt Miner", icon: "☄️", era: 1, baseCost: 12000, baseMps: 260,
      desc: "Swarms of autonomous drones dismantling metallic asteroids.",
      visual: "3D Visual: Spawns 3D faceted asteroid belt & cyan mining lasers"
    },
    {
      id: "gen_5", name: "Gas Giant Harvester", icon: "🪐", era: 1, baseCost: 95000, baseMps: 1850,
      desc: "Atmospheric scoops skimming Jupiter and Saturn.",
      visual: "3D Visual: Adds 3D collector halos & gas siphon beams"
    },
    {
      id: "gen_6", name: "Dyson Swarm", icon: "🔆", era: 1, baseCost: 750000, baseMps: 12500,
      desc: "Millions of solar collectors capturing total stellar luminosity.",
      visual: "3D Visual: Encases the Sun in nested 3D golden Dyson mirror rings"
    },

    // Era 2: Milky Way
    {
      id: "gen_7", name: "Nebula Condenser", icon: "🌫️", era: 2, baseCost: 6500000, baseMps: 92000,
      desc: "Compresses interstellar molecular clouds into pure baryonic matter.",
      visual: "3D Visual: Generates glowing 3D volumetric spiral nebulae"
    },
    {
      id: "gen_8", name: "Pulsar Array", icon: "📡", era: 2, baseCost: 52000000, baseMps: 680000,
      desc: "Harvests relativistic beams from rapidly spinning neutron stars.",
      visual: "3D Visual: Places spinning 3D pulsars with sweeping twin beams"
    },
    {
      id: "gen_9", name: "Sagittarius Penrose Engine", icon: "🕳️", era: 2, baseCost: 420000000, baseMps: 4900000,
      desc: "Extracts rotational ergosphere energy from the galactic core.",
      visual: "3D Visual: Ignites 3D Black Hole accretion disk, polar jets & cage"
    },

    // Era 3: Observable Universe
    {
      id: "gen_10", name: "Quasar Siphon", icon: "🌠", era: 3, baseCost: 3500000000, baseMps: 38000000,
      desc: "Taps active galactic nuclei outshining entire galaxies.",
      visual: "3D Visual: Ignites blazing twin-jet Quasars at supercluster nodes"
    },
    {
      id: "gen_11", name: "Cosmic Filament Loom", icon: "🕸️", era: 3, baseCost: 30000000000, baseMps: 290000000,
      desc: "Channels dark matter highways connecting superclusters.",
      visual: "3D Visual: Supercharges web filaments with flowing energy pulses"
    },
    {
      id: "gen_12", name: "Multiverse Brane Collider", icon: "⚛️", era: 3, baseCost: 260000000000, baseMps: 2400000000,
      desc: "Precipitates fresh matter directly from bulk dimensional ripples.",
      visual: "3D Visual: Builds rotating 3D hyper-dimensional gyroscopic portal"
    }
  ];

  /* =========================================================================
     4. GAME STATE & PERSISTENCE
  ========================================================================= */
  const SAVE_KEY = "terra_to_infinity_save_v2";

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
    return [1, 2, 6, 30][state.era] || 1;
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
    if (state.era < 3 || state.runMatterEarned < 1e9) return 0;
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
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem("terra_to_infinity_save_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const fresh = defaultState();
      state = {
        ...fresh,
        ...parsed,
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
    localStorage.removeItem("terra_to_infinity_save_v1");
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
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }

  /* =========================================================================
     5. PROCEDURAL 3D TEXTURED & PHONG-SHADED SPHERE RENDERER
  ========================================================================= */
  class ProceduralSphere {
    constructor(type, texW = 192, texH = 96, renderRes = 128) {
      this.type = type;
      this.texW = texW;
      this.texH = texH;
      this.renderRes = renderRes;

      // Texture channels
      const total = texW * texH;
      this.r = new Uint8Array(total);
      this.g = new Uint8Array(total);
      this.b = new Uint8Array(total);
      this.spec = new Uint8Array(total);   // Specular reflectivity
      this.emit = new Uint8Array(total);   // Night city lights / lava veins / lunar domes
      this.cloud = new Uint8Array(total);  // Cloud layer density

      // Offscreen rendering surface
      this.off = document.createElement("canvas");
      this.off.width = renderRes;
      this.off.height = renderRes;
      this.octx = this.off.getContext("2d");
      this.imgData = this.octx.createImageData(renderRes, renderRes);

      this.bakeTexture();
    }

    bakeTexture() {
      const { texW, texH, type } = this;
      const craters = [];
      if (type === "moon" || type === "mercury") {
        for (let i = 0; i < 28; i++) {
          const th = hash3(i, 1, 2) * Math.PI * 2;
          const ph = Math.acos(2 * hash3(i, 3, 4) - 1);
          craters.push({
            x: Math.sin(ph) * Math.cos(th),
            y: Math.cos(ph),
            z: Math.sin(ph) * Math.sin(th),
            rad: 0.08 + hash3(i, 5, 6) * 0.22
          });
        }
      }

      for (let py = 0; py < texH; py++) {
        const v = (py + 0.5) / texH;
        const lat = (v - 0.5) * Math.PI; // -pi/2 (north) to +pi/2 (south)
        const cosLat = Math.cos(lat);
        const sinLat = Math.sin(lat);

        for (let px = 0; px < texW; px++) {
          const u = px / texW;
          const lon = u * Math.PI * 2;
          const nx = cosLat * Math.cos(lon);
          const ny = sinLat;
          const nz = cosLat * Math.sin(lon);
          const idx = py * texW + px;

          if (type === "earth") {
            const elev = fbm3D(nx * 2.1 + 3.2, ny * 2.1 + 1.4, nz * 2.1 + 2.7, 5);
            const detail = fbm3D(nx * 6.5, ny * 6.5, nz * 6.5, 3);
            const iceCap = Math.abs(ny) + (detail - 0.5) * 0.14;
            const clouds = fbm3D(nx * 3.4 - 4.1, ny * 3.4 + 2.2, nz * 3.4 + 1.1, 4);

            this.cloud[idx] = clouds > 0.53 ? clamp(((clouds - 0.53) / 0.26) * 255, 0, 255) : 0;

            if (iceCap > 0.84) {
              this.r[idx] = 235; this.g[idx] = 244; this.b[idx] = 252;
              this.spec[idx] = 70;
            } else if (elev < 0.495) {
              // Deep to coastal ocean
              const depth = clamp((0.495 - elev) / 0.28, 0, 1);
              this.r[idx] = 10 + (1 - depth) * 26;
              this.g[idx] = 48 + (1 - depth) * 86;
              this.b[idx] = 115 + (1 - depth) * 95;
              this.spec[idx] = 225;
            } else {
              // Continents: coastal green -> forest -> desert/mountain
              const h = (elev - 0.495) / 0.32;
              if (h < 0.35) {
                this.r[idx] = 36 + detail * 42;
                this.g[idx] = 128 + detail * 48;
                this.b[idx] = 68 + detail * 20;
              } else if (h < 0.68) {
                this.r[idx] = 115 + detail * 65;
                this.g[idx] = 126 + detail * 40;
                this.b[idx] = 68 + detail * 24;
              } else {
                this.r[idx] = 158 + h * 50;
                this.g[idx] = 152 + h * 48;
                this.b[idx] = 148 + h * 48;
              }
              this.spec[idx] = 15;
              // Coastal & continental city clusters + tectonic veins
              const city = fbm3D(nx * 11, ny * 11, nz * 11, 2);
              if (h < 0.42 && city > 0.56) {
                this.emit[idx] = clamp(((city - 0.56) / 0.28) * 255, 0, 255);
              }
            }
          } else if (type === "moon" || type === "mercury") {
            let n = fbm3D(nx * 3.2, ny * 3.2, nz * 3.2, 4);
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
            const gran = fbm3D(nx * 5.2, ny * 5.2, nz * 5.2, 4);
            const flare = fbm3D(nx * 2.4 + 7, ny * 2.4 - 3, nz * 2.4 + 2, 3);
            const heat = clamp(gran * 0.65 + flare * 0.55, 0, 1);
            this.r[idx] = clamp(210 + heat * 45, 0, 255);
            this.g[idx] = clamp(75 + heat * 175, 0, 255);
            this.b[idx] = clamp(heat > 0.68 ? (heat - 0.68) * 650 : 12, 0, 255);
          } else if (type === "jupiter") {
            const swirl = fbm3D(nx * 4.5, ny * 9.5, nz * 4.5, 4);
            const band = Math.sin(ny * 18 + (swirl - 0.5) * 2.4) * 0.5 + 0.5;
            // Great Red Spot
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
            // Uranus / Ice Giant
            const n = fbm3D(nx * 2.5, ny * 6.0, nz * 2.5, 3);
            this.r[idx] = 95 + n * 48;
            this.g[idx] = 205 + n * 36;
            this.b[idx] = 225 + n * 28;
          }
        }
      }
    }

    /**
     * Renders the 3D shaded sphere to its offscreen buffer and draws onto ctx.
     * options: { spin, cloudSpin, rotX, rotY, lightDir, cityBoost, magmaBoost, atmoColor, isEmissive, pulse }
     */
    draw(ctx, cx, cy, screenRadius, options) {
      if (screenRadius < 1.5) return;
      const {
        spin = 0, cloudSpin = 0, rotX = 0, rotY = 0,
        lightDir = { x: -0.64, y: -0.36, z: -0.68 },
        cityBoost = 0, magmaBoost = 0, lunarBaseBoost = 0,
        atmoColor = null, isEmissive = false
      } = options;

      const S = this.renderRes;
      const half = S * 0.5;
      const invHalf = 1 / half;
      const data = this.imgData.data;
      const { texW, texH, r, g, b, spec, emit, cloud } = this;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      // View vector in world space = inverseRotate(0, 0, -1)
      const vy1 = -sinX;
      const vz1 = -cosX;
      const vwx = vz1 * sinY;
      const vwy = vy1;
      const vwz = vz1 * cosY;

      // Blinn-Phong Half vector in world space
      let hx = lightDir.x + vwx;
      let hy = lightDir.y + vwy;
      let hz = lightDir.z + vwz;
      const hLen = Math.hypot(hx, hy, hz) || 1;
      hx /= hLen; hy /= hLen; hz /= hLen;

      const twoPiInv = 1 / (Math.PI * 2);
      const piInv = 1 / Math.PI;
      const spinOffset = (spin * twoPiInv) % 1;
      const cloudOffset = (cloudSpin * twoPiInv) % 1;

      let ptr = 0;
      for (let py = 0; py < S; py++) {
        const vy = (py + 0.5) * invHalf - 1;
        const vy2 = vy * vy;

        for (let px = 0; px < S; px++) {
          const vx = (px + 0.5) * invHalf - 1;
          const r2 = vx * vx + vy2;

          if (r2 >= 1) {
            data[ptr + 3] = 0;
            ptr += 4;
            continue;
          }

          const vz = -Math.sqrt(1 - r2); // Front hemisphere points toward camera (-z)

          // Anti-aliased edge alpha
          const edgeAlpha = r2 > 0.94 ? clamp((1 - r2) / 0.06, 0, 1) : 1;

          // Inverse camera rotation -> World Normal (wx, wy, wz)
          const y1 = vy * cosX + vz * sinX;
          const z1 = vz * cosX - vy * sinX;
          const wx = vx * cosY + z1 * sinY;
          const wz = z1 * cosY - vx * sinY;
          const wy = y1;

          // Equirectangular UV lookup
          let u = Math.atan2(wz, wx) * twoPiInv + 0.5 - spinOffset;
          u = u - Math.floor(u);
          const v = Math.asin(clamp(wy, -1, 1)) * piInv + 0.5;

          const tx = Math.min(texW - 1, (u * texW) | 0);
          const ty = Math.min(texH - 1, (v * texH) | 0);
          const idx = ty * texW + tx;

          let cr = r[idx];
          let cg = g[idx];
          let cb = b[idx];

          if (isEmissive) {
            // Boiling Sun: limb darkening + hot core + shifting second plasma layer
            let u2 = u + cloudOffset;
            u2 = u2 - Math.floor(u2);
            const tx2 = Math.min(texW - 1, (u2 * texW) | 0);
            const idx2 = ty * texW + tx2;
            const limb = 0.55 + 0.45 * (-vz);
            cr = clamp(((cr * 0.65 + r[idx2] * 0.45) * limb) + 28, 0, 255);
            cg = clamp(((cg * 0.65 + g[idx2] * 0.45) * limb), 0, 255);
            cb = clamp(((cb * 0.65 + b[idx2] * 0.45) * limb), 0, 255);
          } else {
            // Diffuse Lambertian lighting
            const ndotl = wx * lightDir.x + wy * lightDir.y + wz * lightDir.z;
            const diffuse = ndotl > 0 ? ndotl : 0;
            const ambient = 0.08;
            const light = ambient + diffuse * 0.96;

            // Cloud layer blending (Earth)
            let cloudAmt = 0;
            if (this.type === "earth") {
              let uc = u - cloudOffset;
              uc = uc - Math.floor(uc);
              const txc = Math.min(texW - 1, (uc * texW) | 0);
              cloudAmt = cloud[ty * texW + txc] / 255;
            }

            // Ocean specular highlight
            let specAdd = 0;
            if (spec[idx] > 40 && diffuse > 0 && cloudAmt < 0.5) {
              const ndoth = wx * hx + wy * hy + wz * hz;
              if (ndoth > 0) {
                specAdd = Math.pow(ndoth, 24) * (spec[idx] / 255) * 145 * (1 - cloudAmt);
              }
            }

            // Combine surface & clouds under lighting
            const surfR = cr * (1 - cloudAmt * 0.82) + 245 * (cloudAmt * 0.82);
            const surfG = cg * (1 - cloudAmt * 0.82) + 250 * (cloudAmt * 0.82);
            const surfB = cb * (1 - cloudAmt * 0.82) + 255 * (cloudAmt * 0.82);

            cr = surfR * light + specAdd;
            cg = surfG * light + specAdd;
            cb = surfB * light + specAdd;

            // Night-side lights / Core Extractor magma glow / Tectonic fissures
            const nightMask = clamp((-ndotl + 0.15) * 2.2, 0, 1);
            if (this.type === "earth") {
              if (cityBoost > 0 && emit[idx] > 0 && nightMask > 0) {
                const glow = (emit[idx] / 255) * nightMask * cityBoost;
                cr += glow * 255;
                cg += glow * 195;
                cb += glow * 85;
              }
              if (magmaBoost > 0 && emit[idx] > 140) {
                const lava = ((emit[idx] - 140) / 115) * magmaBoost;
                cr += lava * 255;
                cg += lava * 90;
                cb += lava * 15;
              }
            } else if (this.type === "moon" && lunarBaseBoost > 0 && emit[idx] > 0) {
              const baseGlow = (emit[idx] / 255) * lunarBaseBoost;
              cr += baseGlow * 55;
              cg += baseGlow * 210;
              cb += baseGlow * 255;
            }

            // Atmospheric Fresnel Rim Glow
            if (atmoColor) {
              const fresnel = Math.pow(1 + vz, 2.8) * (0.35 + diffuse * 0.85);
              cr += atmoColor[0] * fresnel;
              cg += atmoColor[1] * fresnel;
              cb += atmoColor[2] * fresnel;
            }
          }

          data[ptr] = cr > 255 ? 255 : cr;
          data[ptr + 1] = cg > 255 ? 255 : cg;
          data[ptr + 2] = cb > 255 ? 255 : cb;
          data[ptr + 3] = (edgeAlpha * 255) | 0;
          ptr += 4;
        }
      }

      this.octx.putImageData(this.imgData, 0, 0);
      ctx.drawImage(this.off, cx - screenRadius, cy - screenRadius, screenRadius * 2, screenRadius * 2);
    }
  }

  /* =========================================================================
     6. FULL 3D COSMOS ENGINE WITH VISIBLE UPGRADE EVOLUTION
  ========================================================================= */
  class Cosmos3DEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = 0;
      this.height = 0;
      this.fov = 560;

      // Interactive 3D Camera with inertia & zoom
      this.rotX = 0.34;
      this.rotY = -0.3;
      this.velX = 0;
      this.velY = 0;
      this.zoom = 1.0;
      this.targetZoom = 1.0;

      // Visual animation states
      this.pulse = 0;
      this.upgradeFlash = 0;
      this.eraTransition = 0;
      this.currentEra = 0;
      this.earthSpin = 0;
      this.clickBeams = [];
      this.burstParticles = [];
      this.shockwaves = [];

      // 3D Textured Spheres
      this.spheres = {
        earth: new ProceduralSphere("earth", 220, 110, 148),
        moon: new ProceduralSphere("moon", 110, 55, 52),
        sun: new ProceduralSphere("sun", 140, 70, 96),
        mercury: new ProceduralSphere("mercury", 80, 40, 28),
        venus: new ProceduralSphere("venus", 96, 48, 36),
        mars: new ProceduralSphere("mars", 96, 48, 34),
        jupiter: new ProceduralSphere("jupiter", 128, 64, 56),
        saturn: new ProceduralSphere("saturn", 128, 64, 52),
        uranus: new ProceduralSphere("uranus", 96, 48, 42)
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
    }

    initDatasets() {
      // Background 3D Starfield
      this.stars = [];
      for (let i = 0; i < 360; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 750 + Math.random() * 1100;
        this.stars.push({
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th),
          z: r * Math.cos(ph),
          size: 0.7 + Math.random() * 1.6,
          hue: [200, 220, 265, 42][Math.floor(Math.random() * 4)],
          twinkle: Math.random() * Math.PI * 2
        });
      }

      // Era 1: Solar System Planets
      this.solarPlanets = [
        { key: "mercury", dist: 78, radius: 5.5, speed: 0.55, angle: 0.4, tilt: 0.08 },
        { key: "venus", dist: 106, radius: 8.5, speed: 0.42, angle: 2.1, tilt: 0.05 },
        { key: "earth", dist: 140, radius: 9.8, speed: 0.32, angle: 3.7, tilt: 0.02 },
        { key: "mars", dist: 174, radius: 7.4, speed: 0.25, angle: 5.1, tilt: 0.06 },
        { key: "jupiter", dist: 232, radius: 19, speed: 0.15, angle: 1.2, tilt: 0.04, gasGiant: true },
        { key: "saturn", dist: 295, radius: 16.5, speed: 0.11, angle: 4.3, tilt: 0.09, gasGiant: true, ring: true },
        { key: "uranus", dist: 348, radius: 12, speed: 0.08, angle: 2.7, tilt: 0.07 }
      ];

      // Era 1: 3D Asteroid Belt Pool (revealed by Asteroid Belt Miner)
      this.asteroids = [];
      for (let i = 0; i < 110; i++) {
        this.asteroids.push({
          dist: 194 + (Math.random() - 0.5) * 26,
          angle: Math.random() * Math.PI * 2,
          y: (Math.random() - 0.5) * 14,
          speed: 0.18 + Math.random() * 0.08,
          size: 2.2 + Math.random() * 3.4,
          rot: Math.random() * Math.PI * 2
        });
      }

      // Era 2: Milky Way Spiral Galaxy
      this.galaxyStars = [];
      const arms = 4;
      for (let i = 0; i < 1350; i++) {
        const arm = i % arms;
        const t = Math.pow(Math.random(), 0.85);
        const dist = 20 + t * 255;
        const armAngle = (arm / arms) * Math.PI * 2;
        const spinAngle = dist * 0.022;
        const spread = (1 - t * 0.45) * 0.46 * (Math.random() - 0.5);
        const angle = armAngle + spinAngle + spread;
        const thickness = (1 - t * 0.78) * 24 * (Math.random() - 0.5);

        this.galaxyStars.push({
          x: Math.cos(angle) * dist,
          y: thickness,
          z: Math.sin(angle) * dist,
          size: t < 0.18 ? 2.3 : 1.0 + Math.random() * 1.5,
          color: t < 0.16 ? "#fef08a" : (Math.random() > 0.35 ? "#93c5fd" : "#e9d5ff")
        });
      }

      // Era 2: Volumetric 3D Nebulae (revealed by Nebula Condenser)
      this.nebulae = [];
      for (let i = 0; i < 36; i++) {
        const arm = i % 4;
        const dist = 62 + (i / 36) * 175;
        const angle = (arm / 4) * Math.PI * 2 + dist * 0.022 + (Math.random() - 0.5) * 0.25;
        this.nebulae.push({
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 14,
          z: Math.sin(angle) * dist,
          radius: 26 + Math.random() * 26,
          color: i % 3 === 0 ? "rgba(236, 72, 153, 0.26)" : (i % 3 === 1 ? "rgba(56, 189, 248, 0.24)" : "rgba(168, 85, 247, 0.28)")
        });
      }

      // Era 2: Spinning 3D Pulsars (revealed by Pulsar Array)
      this.pulsars = [];
      for (let i = 0; i < 16; i++) {
        const arm = i % 4;
        const dist = 75 + (i / 16) * 165;
        const angle = (arm / 4) * Math.PI * 2 + dist * 0.022;
        this.pulsars.push({
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 20,
          z: Math.sin(angle) * dist,
          spinSpeed: 2.5 + Math.random() * 3.5,
          tilt: 0.4 + Math.random() * 0.8
        });
      }

      // Era 3: Observable Universe Cosmic Web
      this.webNodes = [];
      this.webEdges = [];
      const nodeCount = 105;
      for (let i = 0; i < nodeCount; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 52 + Math.pow(Math.random(), 0.72) * 215;
        this.webNodes.push({
          x: r * Math.sin(ph) * Math.cos(th),
          y: r * Math.sin(ph) * Math.sin(th),
          z: r * Math.cos(ph),
          phase: Math.random() * Math.PI * 2,
          size: 2.6 + Math.random() * 3.2,
          color: i % 3 === 0 ? "#c084fc" : (i % 3 === 1 ? "#38bdf8" : "#f472b6")
        });
      }
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const d = Math.hypot(
            this.webNodes[i].x - this.webNodes[j].x,
            this.webNodes[i].y - this.webNodes[j].y,
            this.webNodes[i].z - this.webNodes[j].z
          );
          if (d < 96) {
            this.webEdges.push({ a: i, b: j, dist: d, phase: Math.random() });
          }
        }
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
      this.upgradeFlash = 1.0;
      this.shockwaves.push({
        radius: 20,
        maxRadius: Math.min(this.width, this.height) * 0.45,
        life: 1.0,
        color: "#38bdf8"
      });
    }

    triggerClickEffect(screenX, screenY) {
      this.pulse = 1.0;
      const colors = ["#38bdf8", "#fbbf24", "#c084fc", "#34d399"];
      const col = colors[this.currentEra] || "#38bdf8";

      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 2.0 + Math.random() * 4.5;
        this.burstParticles.push({
          x: screenX, y: screenY,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          life: 1.0, color: col
        });
      }

      // Era-specific Click Amplifier Visuals
      if (this.currentEra === 0 && (state.clickUpgrades.clk_1 || 0) > 0) {
        this.clickBeams.push({
          x1: screenX, y1: screenY,
          x2: this.width * 0.5, y2: this.height * 0.52,
          life: 1.0, color: "#fb923c"
        });
      } else if (this.currentEra === 1 && (state.clickUpgrades.clk_2 || 0) > 0) {
        this.clickBeams.push({
          x1: screenX, y1: screenY,
          x2: this.width * 0.5, y2: this.height * 0.52,
          life: 1.0, color: "#fde047"
        });
      } else if (this.currentEra === 2 && (state.clickUpgrades.clk_3 || 0) > 0) {
        this.shockwaves.push({
          radius: 15,
          maxRadius: Math.min(this.width, this.height) * 0.42,
          life: 1.0,
          color: "#f472b6"
        });
      } else if (this.currentEra === 3 && (state.clickUpgrades.clk_4 || 0) > 0) {
        this.shockwaves.push({
          radius: 10,
          maxRadius: Math.min(this.width, this.height) * 0.48,
          life: 1.0,
          color: "#38bdf8"
        });
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

    render(time, dt) {
      const ctx = this.ctx;
      const t = time * 0.001;

      // Smooth camera inertia & zoom
      this.rotY += 0.0028 + this.velY;
      this.rotX = clamp(this.rotX + this.velX, -1.32, 1.32);
      this.velX *= 0.9;
      this.velY *= 0.9;
      this.zoom += (this.targetZoom - this.zoom) * 0.1;

      this.earthSpin += dt * 0.14;
      this.pulse *= 0.87;
      this.upgradeFlash *= 0.92;
      this.eraTransition *= 0.94;

      // Deep Cosmic Gradient Background
      const bgPalettes = [
        ["#07142e", "#02050c"], // Earth
        ["#1a0f06", "#03040a"], // Solar
        ["#130926", "#020309"], // Milky Way
        ["#190728", "#020207"]  // Universe
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
        const alpha = 0.3 + 0.5 * Math.sin(t * 2 + s.twinkle);
        ctx.fillStyle = `hsla(${s.hue}, 85%, 86%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, s.size * p.scale), 0, Math.PI * 2);
        ctx.fill();
      }

      // Prestige Dark Energy Halo (visible across all eras once unlocked)
      if (state.darkEnergy > 0) {
        this.renderDarkEnergyAura(ctx, t);
      }

      // Render Era 3D Scene
      if (this.currentEra === 0) this.renderEarthScene(ctx, t);
      else if (this.currentEra === 1) this.renderSolarScene(ctx, t, dt);
      else if (this.currentEra === 2) this.renderMilkyWayScene(ctx, t);
      else this.renderUniverseScene(ctx, t);

      // Shockwaves (Upgrades / Hypernova / Zero-Point)
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.1;
        sw.life -= 0.03;
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
        bm.life -= 0.09;
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

      // Era Transition Wave
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

    renderDarkEnergyAura(ctx, t) {
      const cx = this.width * 0.5;
      const cy = this.height * 0.52;
      const r = Math.min(this.width, this.height) * 0.42;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
      grad.addColorStop(0, "rgba(147, 51, 234, 0)");
      grad.addColorStop(0.65, "rgba(168, 85, 247, 0.09)");
      grad.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting Dark Energy Crystals
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
       ERA I: 3D TEXTURED EARTH + TECTONIC DRILLS + CORE EXTRACTORS +
              LUNAR COLONIES + 3D SPACE ELEVATORS & ORBITAL RING
    ----------------------------------------------------------------------- */
    renderEarthScene(ctx, t) {
      const scaleBase = Math.min(this.width, this.height) * 0.22;
      const worldR = scaleBase * (1 + this.pulse * 0.045);
      const center = this.project(0, 0, 0);

      const drills = state.clickUpgrades.clk_1 || 0;
      const extractors = state.generators.gen_1 || 0;
      const lunarColonies = state.generators.gen_2 || 0;
      const elevators = state.generators.gen_3 || 0;

      const queue = [];

      // Moon Orbit Path
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

      // 1. Earth 3D Shaded Sphere
      queue.push({
        z: center.z,
        draw: () => {
          const sr = worldR * center.scale;
          // Atmospheric halo
          const atmo = ctx.createRadialGradient(center.x, center.y, sr * 0.9, center.x, center.y, sr * 1.3);
          atmo.addColorStop(0, "rgba(56, 189, 248, 0.42)");
          atmo.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.fillStyle = atmo;
          ctx.beginPath();
          ctx.arc(center.x, center.y, sr * 1.3, 0, Math.PI * 2);
          ctx.fill();

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

      // 2. Moon 3D Shaded Sphere (lights up with blue colony grids when Lunar Colony > 0)
      if (moonProj.scale > 0) {
        queue.push({
          z: moonProj.z,
          draw: () => {
            const mr = worldR * 0.25 * moonProj.scale;
            this.spheres.moon.draw(ctx, moonProj.x, moonProj.y, mr, {
              spin: moonAngle * 0.3,
              rotX: this.rotX,
              rotY: this.rotY,
              lunarBaseBoost: Math.min(1.6, lunarColonies * 0.32)
            });
          }
        });
      }

      // 3. Lunar Colony Supply Shuttles & Energy Transfer Arcs
      if (lunarColonies > 0 && moonProj.scale > 0) {
        const shuttleCount = Math.min(8, 1 + Math.floor(lunarColonies / 2));
        for (let i = 0; i < shuttleCount; i++) {
          const prog = (t * 0.42 + i / shuttleCount) % 1;
          const arcLift = Math.sin(prog * Math.PI) * worldR * 0.35;
          const sx = mx * prog;
          const sy = my * prog - arcLift;
          const sz = mz * prog;
          const sp = this.project(sx, sy, sz);
          if (sp.scale > 0) {
            queue.push({
              z: sp.z,
              draw: () => {
                ctx.fillStyle = "#38bdf8";
                ctx.shadowColor = "#38bdf8";
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, 2.8 * sp.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            });
          }
        }
      }

      // 4. Core Extractor Orbital Geothermal Satellites (floating plasma siphons)
      if (extractors > 0) {
        const satCount = Math.min(12, Math.max(2, Math.floor(extractors * 0.75)));
        for (let i = 0; i < satCount; i++) {
          const a = t * 0.9 + (i / satCount) * Math.PI * 2;
          const inc = (i % 3 - 1) * 0.55;
          const r = worldR * 1.18;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r * Math.sin(inc);
          const z = Math.sin(a) * r * Math.cos(inc);
          const p = this.project(x, y, z);
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

      // 5. 3D Space Elevators (Equatorial Tether Towers + Climbers + Geostationary Orbital Ring!)
      if (elevators > 0) {
        const towerCount = Math.min(8, elevators);
        const topR = worldR * 1.5;

        for (let i = 0; i < towerCount; i++) {
          const lon = this.earthSpin + (i / towerCount) * Math.PI * 2;
          const bx = Math.cos(lon) * worldR * 0.98;
          const bz = Math.sin(lon) * worldR * 0.98;
          const tx = Math.cos(lon) * topR;
          const tz = Math.sin(lon) * topR;

          const pBase = this.project(bx, 0, bz);
          const pTop = this.project(tx, 0, tz);
          const midZ = (pBase.z + pTop.z) * 0.5;

          // Climber pod moving up cable
          const climbT = (t * 0.65 + i * 0.27) % 1;
          const cx = bx + (tx - bx) * climbT;
          const cz = bz + (tz - bz) * climbT;
          const pClimb = this.project(cx, 0, cz);

          queue.push({
            z: midZ,
            draw: () => {
              if (pBase.scale <= 0 || pTop.scale <= 0) return;
              ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
              ctx.lineWidth = Math.max(1.2, 2.2 * pTop.scale);
              ctx.beginPath();
              ctx.moveTo(pBase.x, pBase.y);
              ctx.lineTo(pTop.x, pTop.y);
              ctx.stroke();

              // Counterweight Station Cube
              const stR = 4.2 * pTop.scale;
              ctx.fillStyle = "#e0f2fe";
              ctx.fillRect(pTop.x - stR, pTop.y - stR, stR * 2, stR * 2);

              // Glowing Climber Pod
              if (pClimb.scale > 0) {
                ctx.fillStyle = "#fde047";
                ctx.beginPath();
                ctx.arc(pClimb.x, pClimb.y, 2.6 * pClimb.scale, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });
        }

        // Geostationary Orbital Ring once 3+ Space Elevators are built
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
                ctx.lineWidth = Math.max(1.5, 3.2 * p1.scale);
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
       ERA II: 3D BOILING SUN + 7 SHADED PLANETS + ASTEROID BELT MINERS +
               GAS GIANT HARVESTERS + NESTED 3D DYSON SWARM RINGS
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

      // Orbital Paths
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

      // 1. 3D Boiling Sun
      queue.push({
        z: center.z,
        draw: () => {
          const sr = sunWorldR * center.scale;
          const corona = ctx.createRadialGradient(center.x, center.y, sr * 0.6, center.x, center.y, sr * 2.5);
          corona.addColorStop(0, "rgba(254, 240, 138, 0.9)");
          corona.addColorStop(0.35, "rgba(251, 146, 60, 0.42)");
          corona.addColorStop(1, "rgba(234, 88, 12, 0)");
          ctx.fillStyle = corona;
          ctx.beginPath();
          ctx.arc(center.x, center.y, sr * 2.5, 0, Math.PI * 2);
          ctx.fill();

          this.spheres.sun.draw(ctx, center.x, center.y, sr, {
            spin: t * 0.18,
            cloudSpin: -t * 0.12,
            rotX: this.rotX,
            rotY: this.rotY,
            isEmissive: true
          });
        }
      });

      // 2. 3D Shaded Planets (dynamically lit FROM the Sun!)
      for (const pl of this.solarPlanets) {
        pl.angle += pl.speed * dt;
        const d = pl.dist * scaleFactor;
        const px = Math.cos(pl.angle) * d;
        const py = Math.sin(pl.angle) * d * pl.tilt;
        const pz = Math.sin(pl.angle) * d;
        const proj = this.project(px, py, pz);
        if (proj.scale <= 0) continue;

        // Light vector pointing from planet back to Sun at (0,0,0)
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
              atmoColor: pl.key === "earth" ? [56, 189, 248] : null
            });
          }
        });

        // Saturn's True 3D Depth-Sorted Rings
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

        // Gas Giant Harvesters: Glowing Collector Rings & Atmospheric Siphon Beams on Jupiter & Saturn
        if (pl.gasGiant && gasHarvesters > 0) {
          const harvRingR = pl.radius * 1.55 * scaleFactor;
          const drones = Math.min(8, 2 + gasHarvesters);
          for (let i = 0; i < drones; i++) {
            const a = t * 1.8 + (i / drones) * Math.PI * 2;
            const hx = px + Math.cos(a) * harvRingR;
            const hy = py - pl.radius * 0.65 * scaleFactor;
            const hz = pz + Math.sin(a) * harvRingR;
            const hp = this.project(hx, hy, hz);
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

      // 3. Orbital Mass Driver Inner Railgun Ring
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

      // 4. Asteroid Belt Miners: 3D Faceted Asteroids + Cyan Mining Lasers
      if (asteroidMiners > 0) {
        const visibleCount = Math.min(this.asteroids.length, 16 + asteroidMiners * 8);
        for (let i = 0; i < visibleCount; i++) {
          const ast = this.asteroids[i];
          ast.angle += ast.speed * dt;
          const d = ast.dist * scaleFactor;
          const ax = Math.cos(ast.angle) * d;
          const ay = ast.y * scaleFactor;
          const az = Math.sin(ast.angle) * d;
          const ap = this.project(ax, ay, az);
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
                ctx.fillStyle = "#34d399";
                ctx.beginPath();
                ctx.arc(ap.x + s * 2.2, ap.y - s * 2.5, 2.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });
        }
      }

      // 5. 3D Dyson Swarm: Nested Tilted Geodesic Rings of Golden Hexagonal Mirror Panels!
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
            let x = Math.cos(a) * dysonR;
            let y = 0;
            let z = Math.sin(a) * dysonR;

            // Tilt ring in 3D
            const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
            const z1 = z * Math.cos(tiltX) + y * Math.sin(tiltX);
            const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
            const y2 = y1 * Math.cos(tiltZ) + x * Math.sin(tiltZ);

            const pp = this.project(x2, y2, z1);
            if (pp.scale <= 0) continue;

            queue.push({
              z: pp.z,
              draw: () => {
                const ps = Math.max(2.2, 4.6 * scaleFactor * pp.scale);
                // Hexagonal Golden Dyson Collector Panel
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
       ERA III: 3D MILKY WAY + VOLUMETRIC NEBULAE + SPINNING 3D PULSARS +
                SAGITTARIUS A* BLACK HOLE ACCRETION DISK & POLAR JETS
    ----------------------------------------------------------------------- */
    renderMilkyWayScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 560) * (1 + this.pulse * 0.05);
      const center = this.project(0, 0, 0);

      const nebulaCount = state.generators.gen_7 || 0;
      const pulsarCount = state.generators.gen_8 || 0;
      const penroseCount = state.generators.gen_9 || 0;

      // 1. Galactic Core Glow (or Supermassive Black Hole Penrose Engine!)
      if (penroseCount === 0) {
        const core = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, 96 * scaleFactor * center.scale);
        core.addColorStop(0, "rgba(254, 249, 195, 0.96)");
        core.addColorStop(0.32, "rgba(192, 132, 252, 0.36)");
        core.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(center.x, center.y, 96 * scaleFactor * center.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Volumetric 3D Nebulae (from Nebula Condenser)
      if (nebulaCount > 0) {
        const activeNeb = Math.min(this.nebulae.length, 4 + nebulaCount * 3);
        for (let i = 0; i < activeNeb; i++) {
          const neb = this.nebulae[i];
          const p = this.project(neb.x * scaleFactor, neb.y * scaleFactor, neb.z * scaleFactor);
          if (p.scale <= 0) continue;
          const r = neb.radius * scaleFactor * p.scale;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          grad.addColorStop(0, neb.color);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Spiral Galaxy 3D Starfield
      for (const star of this.galaxyStars) {
        const p = this.project(star.x * scaleFactor, star.y * scaleFactor, star.z * scaleFactor);
        if (p.scale <= 0) continue;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.min(0.95, 0.48 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, star.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 4. Spinning 3D Pulsars with Twin Relativistic Lighthouse Beams
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
          ctx.arc(p.x, p.y, 3.6 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Sagittarius A* Penrose Engine (3D Black Hole + Accretion Disk + Polar Relativistic Jets + Mirror Cage)
      if (penroseCount > 0) {
        const bhR = (16 + Math.min(12, penroseCount * 1.4)) * scaleFactor;
        const jetH = (120 + Math.min(90, penroseCount * 12)) * scaleFactor;
        const queue = [];

        // Twin Polar Relativistic Jets
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
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(pTop.x, pTop.y);
            ctx.stroke();

            const jGrad2 = ctx.createLinearGradient(center.x, center.y, pBot.x, pBot.y);
            jGrad2.addColorStop(0, "rgba(192, 132, 252, 0.92)");
            jGrad2.addColorStop(1, "rgba(56, 189, 248, 0)");
            ctx.strokeStyle = jGrad2;
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(pBot.x, pBot.y);
            ctx.stroke();
          }
        });

        // Swirling 3D Accretion Disk & Penrose Mirror Rings
        const segs = 32;
        for (let i = 0; i < segs; i++) {
          const a1 = t * 2.2 + (i / segs) * Math.PI * 2;
          const a2 = t * 2.2 + ((i + 1) / segs) * Math.PI * 2;
          const rIn = bhR * 1.3;
          const rOut = bhR * 2.8;
          const p1i = this.project(Math.cos(a1) * rIn, 0, Math.sin(a1) * rIn);
          const p1o = this.project(Math.cos(a1) * rOut, 0, Math.sin(a1) * rOut);
          const p2o = this.project(Math.cos(a2) * rOut, 0, Math.sin(a2) * rOut);
          const p2i = this.project(Math.cos(a2) * rIn, 0, Math.sin(a2) * rIn);
          queue.push({
            z: (p1i.z + p2o.z) * 0.5,
            draw: () => {
              ctx.fillStyle = i % 2 === 0 ? "rgba(251, 146, 60, 0.78)" : "rgba(254, 215, 170, 0.65)";
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

        // Event Horizon Sphere + Photon Ring
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
       ERA IV: 3D OBSERVABLE UNIVERSE + QUASAR SIPHONS +
               COSMIC FILAMENT LOOMS + 3D MULTIVERSE BRANE COLLIDER
    ----------------------------------------------------------------------- */
    renderUniverseScene(ctx, t) {
      const scaleFactor = (Math.min(this.width, this.height) / 540) * (1 + this.pulse * 0.05);

      const quasars = state.generators.gen_10 || 0;
      const looms = state.generators.gen_11 || 0;
      const colliders = state.generators.gen_12 || 0;

      const projected = this.webNodes.map((n, idx) => {
        const wobble = Math.sin(t * 1.5 + n.phase) * 4;
        const p = this.project(
          (n.x + wobble) * scaleFactor,
          (n.y - wobble) * scaleFactor,
          (n.z + wobble) * scaleFactor
        );
        return { ...p, node: n, idx };
      });

      // 1. Cosmic Web Filaments + Cosmic Filament Loom Energy Pulses
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

        // Flowing Energy Pulses along Filaments when Filament Loom > 0
        if (looms > 0 && i % Math.max(1, 6 - Math.min(5, looms)) === 0) {
          const prog = (t * 0.7 + edge.phase) % 1;
          const px = a.x + (b.x - a.x) * prog;
          const py = a.y + (b.y - a.y) * prog;
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(px, py, 2.2 * avgScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Supercluster Nodes & Blazing 3D Quasars (from Quasar Siphon)
      const sorted = [...projected].sort((a, b) => b.z - a.z);
      const quasarCount = Math.min(20, quasars * 2);

      for (const p of sorted) {
        if (p.scale <= 0) continue;
        const isQuasar = p.idx < quasarCount;
        const pulseR = p.node.size * p.scale * (1 + 0.22 * Math.sin(t * 3 + p.node.phase));

        if (isQuasar) {
          // Twin Quasar Plasma Jets
          const jLen = 28 * p.scale;
          ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
          ctx.lineWidth = 2.0 * p.scale;
          ctx.beginPath();
          ctx.moveTo(p.x - jLen * 0.4, p.y - jLen);
          ctx.lineTo(p.x + jLen * 0.4, p.y + jLen);
          ctx.stroke();

          // Quasar Core Flare
          const qGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseR * 3.8);
          qGrad.addColorStop(0, "#ffffff");
          qGrad.addColorStop(0.35, "rgba(250, 204, 21, 0.8)");
          qGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
          ctx.fillStyle = qGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR * 3.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.node.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. 3D Multiverse Brane Collider (Nested Rotating Hyper-Dimensional Rings + Tesseract Core)
      if (colliders > 0) {
        const ringNum = Math.min(4, 1 + Math.floor(colliders / 2));
        const baseR = 62 * scaleFactor;
        const colors = ["#38bdf8", "#c084fc", "#f472b6", "#fde047"];

        for (let r = 0; r < ringNum; r++) {
          const rad = baseR * (1 + r * 0.34);
          const rx = t * (0.9 + r * 0.35);
          const ry = t * (0.7 - r * 0.25);
          const segs = 40;

          ctx.strokeStyle = colors[r % colors.length];
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let i = 0; i <= segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            let x = Math.cos(a) * rad;
            let y = Math.sin(a) * rad;
            let z = 0;

            // 3D Gyroscopic rotation
            const y1 = y * Math.cos(rx) - z * Math.sin(rx);
            const z1 = z * Math.cos(rx) + y * Math.sin(rx);
            const x2 = x * Math.cos(ry) - z1 * Math.sin(ry);
            const z2 = z1 * Math.cos(ry) + x * Math.sin(ry);

            const p = this.project(x2, y1, z2);
            if (p.scale <= 0) continue;
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        // Rotating 3D Inner Cube (Brane Singularity)
        const cSize = 24 * scaleFactor;
        const verts = [
          [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
          [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]
        ].map(([vx, vy, vz]) => {
          const a = t * 1.3;
          const x1 = vx * Math.cos(a) - vz * Math.sin(a);
          const z1 = vz * Math.cos(a) + vx * Math.sin(a);
          const y2 = vy * Math.cos(a * 0.7) - z1 * Math.sin(a * 0.7);
          const z2 = z1 * Math.cos(a * 0.7) + vy * Math.sin(a * 0.7);
          return this.project(x1 * cSize, y2 * cSize, z2 * cSize);
        });

        const cubeEdges = [
          [0,1],[1,2],[2,3],[3,0],
          [4,5],[5,6],[6,7],[7,4],
          [0,4],[1,5],[2,6],[3,7]
        ];
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (const [a, b] of cubeEdges) {
          if (verts[a].scale > 0 && verts[b].scale > 0) {
            ctx.moveTo(verts[a].x, verts[a].y);
            ctx.lineTo(verts[b].x, verts[b].y);
          }
        }
        ctx.stroke();
      }
    }
  }

  const canvas = document.getElementById("cosmosCanvas");
  const cosmos3D = new Cosmos3DEngine(canvas);

  /* =========================================================================
     7. CANVAS INTERACTION (CLICK, ORBIT DRAG WITH INERTIA & SCROLL ZOOM)
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

    cosmos3D.velY = dx * 0.0065;
    cosmos3D.velX = dy * 0.0055;
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
    cosmos3D.targetZoom = clamp(cosmos3D.targetZoom + delta, 0.65, 1.85);
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
    setTimeout(() => el.remove(), 950);
  }

  /* =========================================================================
     8. UI RENDERING, ACTIVE 3D STRUCTURES BAR & ACTIONS
  ========================================================================= */
  function updateStructuresBar() {
    const bar = document.getElementById("structuresBar");
    const active = [];

    if (state.era === 0) {
      if (state.clickUpgrades.clk_1 > 0) active.push(`⛏️ Magma Fissures Lv.${state.clickUpgrades.clk_1}`);
      if (state.generators.gen_1 > 0) active.push(`🌋 Megacities & Siphons x${state.generators.gen_1}`);
      if (state.generators.gen_2 > 0) active.push(`🌑 Lunar Bases x${state.generators.gen_2}`);
      if (state.generators.gen_3 > 0) active.push(state.generators.gen_3 >= 3 ? `🗼 Orbital Ring (${state.generators.gen_3} Towers)` : `🗼 Space Elevators x${state.generators.gen_3}`);
    } else if (state.era === 1) {
      if (state.clickUpgrades.clk_2 > 0) active.push(`🛰️ Railgun Ring Lv.${state.clickUpgrades.clk_2}`);
      if (state.generators.gen_4 > 0) active.push(`☄️ Asteroid Miners x${state.generators.gen_4}`);
      if (state.generators.gen_5 > 0) active.push(`🪐 Gas Siphons x${state.generators.gen_5}`);
      if (state.generators.gen_6 > 0) active.push(`🔆 Dyson Swarm Rings x${state.generators.gen_6}`);
    } else if (state.era === 2) {
      if (state.generators.gen_7 > 0) active.push(`🌫️ 3D Nebulae x${state.generators.gen_7}`);
      if (state.generators.gen_8 > 0) active.push(`📡 Pulsars x${state.generators.gen_8}`);
      if (state.generators.gen_9 > 0) active.push(`🕳️ Penrose Black Hole Lv.${state.generators.gen_9}`);
    } else {
      if (state.generators.gen_10 > 0) active.push(`🌠 Active Quasars x${state.generators.gen_10}`);
      if (state.generators.gen_11 > 0) active.push(`🕸️ Charged Filaments Lv.${state.generators.gen_11}`);
      if (state.generators.gen_12 > 0) active.push(`⚛️ Brane Collider Lv.${state.generators.gen_12}`);
    }

    if (active.length === 0) {
      bar.innerHTML = `<span style="opacity:0.7">Purchase upgrades to construct 3D structures on the model</span>`;
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
    cosmos3D.triggerUpgradePulse();
    if (owned === 0) showToast(`3D Model Updated: ${gen.name} constructed!`);
    renderTab();
    updateHUD();
    updateStructuresBar();
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
    cosmos3D.triggerUpgradePulse();
    if (owned === 0) showToast(`3D Model Updated: ${upg.name} active!`);
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
    saveGame();
    renderTab();
    updateHUD();
    updateStructuresBar();
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
    updateStructuresBar();
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
          Once your civilization spans the <strong>Observable Universe (Era IV)</strong> and accumulates at least <strong>1.00B Run Matter</strong>, you can collapse spacetime into a singularity.
        </p>
        <p>
          This resets your Matter, Generators, Click Amplifiers, and Cosmic Era back to Planet Earth while crystallizing your mass into permanent <strong>Dark Energy</strong> (+15% multiplicative production per unit + orbiting Dark Energy aura in all eras).
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
     9. EVENT WIRING & MAIN LOOP
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
  updateStructuresBar();

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
    cosmos3D.render(now, dt);

    saveAccumulator += dt;
    if (saveAccumulator >= 10) {
      saveAccumulator = 0;
      saveGame(false);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();