(function initApp() {
  const data = typeof SITE_DATA !== "undefined" ? SITE_DATA : {};
  const hud = document.getElementById("hud");
  const coordDisplay = document.getElementById("coord");
  const phaseDisplay = document.getElementById("flight-phase");
  const navGrid = document.getElementById("nav-grid");
  const hubStrip = document.getElementById("hub-strip");
  const panelEl = document.getElementById("deck-panel");
  const ytFallback = document.getElementById("yt-fallback-link");

  if (ytFallback && data.youtubeWatchUrl) {
    ytFallback.href = data.youtubeWatchUrl;
  }

  const audioGate = new AudioGate({
    videoId: data.youtubeTrackId || ""
  });

  // Song-synced starfield engine: waves of many fast stars -> slow drift -> brief pause -> surge again
  const canvas = document.getElementById("starfield");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const numStars = 220;
  let stars = [];
  let hoverBoost = 1;
  let audioEnergy = 0;
  let simTime = 0;
  let lastFrame = performance.now();

  audioGate.onPulse = (level) => {
    audioEnergy = Math.max(audioEnergy, level);
  };

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    if (!canvas) return;
    stars = Array.from({ length: numStars }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 1.6,
      y: (Math.random() - 0.5) * canvas.height * 1.6,
      z: Math.random() * canvas.width + 40,
      size: Math.random() * 1.8 + 0.5,
      tint:
        Math.random() > 0.78
          ? "0, 240, 255"
          : Math.random() > 0.9
            ? "255, 102, 170"
            : "255, 255, 255"
    }));
  }

  function getSongFlowState(t) {
    const cycle = t % 16;

    if (cycle < 4.5) {
      return { speed: 4.8, activeCount: 220, label: "FLOW: SURGE // MANY STARS" };
    }
    if (cycle < 8.0) {
      return { speed: 1.6, activeCount: 145, label: "FLOW: CRUISE // STEADY" };
    }
    if (cycle < 10.5) {
      return { speed: 0.35, activeCount: 85, label: "FLOW: DRIFT // SLOW" };
    }
    if (cycle < 12.0) {
      return { speed: 0.0, activeCount: 70, label: "FLOW: STILL // PAUSE" };
    }
    return { speed: 5.5, activeCount: 220, label: "FLOW: RUSH // INBOUND" };
  }

  function drawStars(now) {
    if (!canvas || !ctx) return;

    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    if (audioGate.audioReady && !audioGate.muted) {
      simTime += dt;
    } else {
      simTime += dt * 0.45;
    }

    audioEnergy = Math.max(0, audioEnergy - dt * 2.2);

    if (panelEl) {
      if (audioEnergy > 0.25) {
        panelEl.classList.add("pulse");
      } else {
        panelEl.classList.remove("pulse");
      }
    }

    const flow = getSongFlowState(simTime);
    if (phaseDisplay) {
      phaseDisplay.textContent = flow.label;
    }

    const effectiveSpeed = (flow.speed + audioEnergy * 2.4) * hoverBoost;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      const visibleInWave = i < flow.activeCount;

      if (effectiveSpeed > 0.01) {
        star.z -= effectiveSpeed * 2.4;
      }

      if (star.z <= 2) {
        star.z = canvas.width * 0.95;
        star.x = (Math.random() - 0.5) * canvas.width * 1.6;
        star.y = (Math.random() - 0.5) * canvas.height * 1.6;
      }

      if (!visibleInWave && effectiveSpeed < 1.5) {
        continue;
      }

      const k = 150 / star.z;
      const px = star.x * k + cx;
      const py = star.y * k + cy;

      if (px >= -20 && px <= canvas.width + 20 && py >= -20 && py <= canvas.height + 20) {
        const radius = Math.min(star.size * k * (1 + audioEnergy * 0.25), 3.6);
        const alpha = visibleInWave ? Math.min(0.95, 0.35 + k * 0.35) : 0.22;

        if (effectiveSpeed > 2.8) {
          const prevK = 150 / Math.max(3, star.z + effectiveSpeed * 4.5);
          const prevX = star.x * prevK + cx;
          const prevY = star.y * prevK + cy;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${star.tint}, ${alpha * 0.65})`;
          ctx.lineWidth = Math.max(0.8, radius * 0.85);
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(px, py);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  createStars();
  requestAnimationFrame(drawStars);

  window.addEventListener("resize", () => {
    resizeCanvas();
    createStars();
  });

  // Grid tracking
  window.addEventListener("mousemove", (e) => {
    if (!coordDisplay) return;
    const x = Math.floor((e.clientX / window.innerWidth) * 99);
    const y = Math.floor((e.clientY / window.innerHeight) * 99);
    coordDisplay.textContent = `GRID: X-${String(x).padStart(2, "0")} // Y-${String(y).padStart(2, "0")}`;
  });

  // Boot sequence after clicking NEXT on welcome gate
  const bootLogs = Array.isArray(data.bootLogs) ? data.bootLogs : [];
  let bootStarted = false;

  function runBooter() {
    if (bootStarted || !hud) return;
    bootStarted = true;
    hud.innerHTML = "[SYS] Welcome sequence complete. Audio & deck active.";

    let idx = 0;
    function stepLog() {
      if (idx < bootLogs.length) {
        hud.innerHTML += `<br>${bootLogs[idx]}`;
        hud.scrollTop = hud.scrollHeight;
        audioGate.playBeep(620 + idx * 140, 0.06, "square");
        idx += 1;
        setTimeout(stepLog, 550);
      }
    }

    setTimeout(stepLog, 420);
  }

  audioGate.onUnlocked = () => {
    runBooter();
  };

  // Ecosystem hub selector
  const hubs = Array.isArray(data.hubs) ? data.hubs : [];
  if (hubStrip && hubs.length > 0) {
    hubStrip.innerHTML = "";
    hubs.forEach((hub, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hub-tab";
      btn.innerHTML = `<strong>${hub.name}</strong><span>${hub.role}</span>`;

      btn.addEventListener("click", () => {
        hubStrip.querySelectorAll(".hub-tab").forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        hoverBoost = 1.9;
        setTimeout(() => {
          hoverBoost = 1;
        }, 900);

        if (hud) {
          hud.innerHTML = `[HUB:${hub.name}] ${hub.summary} <a href="${hub.url}" target="_blank" rel="noopener noreferrer" style="color:#00f0ff;">Open ↗</a>`;
        }
        audioGate.playBeep(700 + index * 150, 0.09, "triangle");
      });

      hubStrip.appendChild(btn);
    });
  }

  // Render navigation buttons
  const links = Array.isArray(data.links) ? data.links : [];
  if (navGrid) {
    navGrid.innerHTML = "";
    links.forEach((item) => {
      const anchor = document.createElement("a");
      anchor.className = "gui-btn";
      anchor.href = item.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.dataset.desc = item.desc || item.label;
      anchor.textContent = item.label;

      anchor.addEventListener("mouseenter", () => {
        hoverBoost = 1.65;
        if (hud) {
          hud.innerHTML = `[NAV_COM] ${anchor.dataset.desc}`;
        }
        audioGate.playBeep(880, 0.08, "triangle");
      });

      anchor.addEventListener("mouseleave", () => {
        hoverBoost = 1;
        if (hud) {
          hud.innerHTML = "[SYS] Starfield synced with deck telemetry.";
        }
      });

      anchor.addEventListener("click", () => {
        audioGate.playBeep(1200, 0.15, "sawtooth");
      });

      navGrid.appendChild(anchor);
    });
  }
})();
