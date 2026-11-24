class AudioGate {
  constructor(options = {}) {
    this.videoId = options.videoId || "";
    this.audioCtx = null;
    this.audioReady = false;
    this.muted = false;
    this.ytPlayer = null;
    this.ytReady = false;
    this.pendingPlay = false;
    this.pulseLevel = 0;

    this.modalEl = document.getElementById("welcome-gate");
    this.nextBtn = document.getElementById("welcome-next-btn");
    this.toggleBtn = document.getElementById("audio-toggle-btn");
    this.statusEl = document.getElementById("sys-status");

    this._bindEvents();
    this._loadYouTubeAPI();
  }

  _bindEvents() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.enter());
    }
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => this.toggleAudio());
    }
  }

  _loadYouTubeAPI() {
    if (!this.videoId || window.YT) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      this.ytPlayer = new window.YT.Player("yt-audio-player", {
        height: "1",
        width: "1",
        videoId: this.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: this.videoId,
          rel: 0
        },
        events: {
          onReady: () => {
            this.ytReady = true;
            if (this.pendingPlay && !this.muted) {
              this.ytPlayer.unMute();
              this.ytPlayer.setVolume(50);
              this.ytPlayer.playVideo();
              this.pendingPlay = false;
            }
          }
        }
      });
    };
  }

  enter() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    this.audioReady = true;
    this.muted = false;

    if (this.modalEl) {
      this.modalEl.classList.add("hidden");
    }

    if (this.statusEl) {
      this.statusEl.textContent = "SYS_STATUS: ONLINE";
      this.statusEl.classList.add("online");
    }

    this._updateToggleLabel();
    this._playIntroChime();
    this._startYouTubeAudio();

    if (typeof this.onUnlocked === "function") {
      this.onUnlocked();
    }
  }

  _playIntroChime() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.createBeep(freq, 0.12, "triangle");
      }, i * 115);
    });
  }

  _startYouTubeAudio() {
    if (!this.videoId) return;
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.playVideo === "function") {
      this.ytPlayer.unMute();
      this.ytPlayer.setVolume(50);
      this.ytPlayer.playVideo();
    } else {
      this.pendingPlay = true;
    }
  }

  toggleAudio() {
    if (!this.audioReady) {
      this.enter();
      return;
    }

    this.muted = !this.muted;
    this._updateToggleLabel();

    if (this.ytReady && this.ytPlayer) {
      if (this.muted) {
        this.ytPlayer.mute();
      } else {
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(50);
        this.ytPlayer.playVideo();
      }
    }

    if (!this.muted) {
      this.playBeep(660, 0.08, "sine");
    }
  }

  _updateToggleLabel() {
    if (!this.toggleBtn) return;
    this.toggleBtn.textContent = this.muted ? "🔇 SOUND: MUTED" : "🔊 SOUND: ACTIVE";
  }

  triggerPulse(strength = 1) {
    this.pulseLevel = Math.min(1, Math.max(this.pulseLevel, strength));
    if (typeof this.onPulse === "function") {
      this.onPulse(this.pulseLevel);
    }
  }

  createBeep(freq, duration, type = "sine") {
    if (!this.audioCtx || this.muted) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
      this.triggerPulse(0.85);
    } catch (_) {
      // Ignore audio scheduling errors
    }
  }

  playBeep(freq, duration, type = "sine") {
    if (this.muted || !this.audioReady) return;
    this.createBeep(freq, duration, type);
  }
}
