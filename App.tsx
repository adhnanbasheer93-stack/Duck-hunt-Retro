import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameSettings, HighScore, DUCK_TYPES, DuckType, FloatingText } from './types';
import { sfx, setMuteState, initAudio } from './utils/audio';
import StartScreen from './components/StartScreen';
import GameHUD from './components/GameHUD';
import GameOverScreen from './components/GameOverScreen';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import { Sparkles, HelpCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOutAdmin, fetchHighScoresFromFirebase, saveHighScoreToFirebase } from './utils/firebase';

interface ShotRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

// Render simple 8-Bit Feather Particles
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0.0 to 1.0
  color: string;
  size: number;
  isStar: boolean;
  angle: number;
  swaySpeed: number;

  constructor(x: number, y: number, color: string, isStar: boolean = false) {
    this.x = x;
    this.y = y;
    // Feathers burst outward, then drift gently
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6 - 2;
    this.life = 1.0;
    this.color = color;
    this.size = isStar ? 3 + Math.random() * 3 : 4 + Math.random() * 4;
    this.isStar = isStar;
    this.angle = Math.random() * Math.PI * 2;
    this.swaySpeed = 0.05 + Math.random() * 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.isStar) {
      this.vy += 0.15; // Gravity for stars
    } else {
      // Gentle air resistance and flutter sway for feathers!
      this.vx *= 0.95;
      this.vy = this.vy * 0.95 + 0.18; // Terminal velocity gravity drift
      this.x += Math.sin(Date.now() * this.swaySpeed) * 0.8; // Feather flutter sway
    }
    
    this.life -= 0.015; // Elegant slow decay
    return this.life <= 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    if (this.isStar) {
      // Draw a micro pixel star diamond
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x + this.size, this.y);
      ctx.lineTo(this.x, this.y + this.size);
      ctx.lineTo(this.x - this.size, this.y);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw pixel square
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

// Render Duck Model inside Game Canvas
class CanvasDuck {
  x: number;
  y: number;
  type: DuckType;
  color: string;
  accentColor: string;
  beakColor: string;
  speed: number;
  points: number;
  size: number;
  pitch: number;
  direction: number; // 1 = right, -1 = left
  baseY: number;
  waveOffset: number;
   waveSpeed: number;
  waveAmplitude: number;
  flapFrame: number;
  isDead: boolean;
  deathState: 'ALIVE' | 'HIT_STUN' | 'FALLING';
  deathTimer: number;
  fallSpeed: number;
  spinAngle: number;
  hoverLockedTimer: number; // For HOVER shooting mode
  maxHits: number;
  hitsReceived: number;

  constructor(width: number, height: number, difficulty: 'EASY' | 'NORMAL' | 'HARD', forcedType?: DuckType) {
    let selectedType: DuckType = 'NORMAL';
    if (forcedType) {
      selectedType = forcedType;
    } else {
      const r = Math.random();
      if (r > 0.85) selectedType = 'GOLDEN';
      else if (r > 0.55) selectedType = 'FAST';
    }

    const cfg = DUCK_TYPES[selectedType];
    this.type = selectedType;
    this.color = cfg.color;
    this.accentColor = cfg.accentColor;
    this.beakColor = cfg.beakColor;
    this.pitch = cfg.pitch;
    this.points = cfg.points;
    this.size = cfg.size;

    this.maxHits = selectedType === 'BOSS' ? 5 : 1;
    this.hitsReceived = 0;

    let diffMult = 1.0;
    if (difficulty === 'EASY') diffMult = 0.7;
    if (difficulty === 'HARD') diffMult = 1.45;

    this.speed = cfg.speed * (0.85 + Math.random() * 0.3) * diffMult;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    
    // Spawn off-screen
    this.x = this.direction === 1 ? -this.size * 2 : width + this.size;
    this.y = Math.random() * (height * 0.4) + 100; // spawn in top 40% area
    this.baseY = this.y;
    
    this.waveOffset = Math.random() * Math.PI * 2;
    this.waveSpeed = selectedType === 'BOSS' ? 0.005 : 0.01 + Math.random() * 0.015;
    this.waveAmplitude = selectedType === 'BOSS' ? 15 + Math.random() * 15 : 25 + Math.random() * 25;
    this.flapFrame = 0;
    this.isDead = false;
    this.deathState = 'ALIVE';
    this.deathTimer = 0;
    this.fallSpeed = 0;
    this.spinAngle = 0;
    this.hoverLockedTimer = 0;
  }

  update(width: number, height: number) {
    if (this.isDead) {
      if (this.deathState === 'HIT_STUN') {
        this.deathTimer--;
        if (this.deathTimer <= 0) {
          this.deathState = 'FALLING';
          this.fallSpeed = 1.5; // initial head-down fall impulse
        }
        return false;
      }

      // FALLING realistic gravity physical slide down
      this.fallSpeed += 0.45; // Gravity
      this.y += this.fallSpeed;
      // Tilt downward as it drops, rolling slightly back and forth or spinning
      this.spinAngle += 0.12;

      // Returns true when it hits ground/grass level
      return this.y > height - 120;
    }

    // Horizontal flying + Wave patterns
    this.x += this.speed * this.direction;
    this.y = this.baseY + Math.sin(this.x * this.waveSpeed + this.waveOffset) * this.waveAmplitude;

    // Wing flap animations
    if (Math.floor(Date.now() / 120) % 2 === 0) {
      this.flapFrame = 0;
    } else {
      this.flapFrame = 1;
    }

    // boundary turn around
    if (this.direction === 1 && this.x > width + this.size * 2) {
      this.direction = -1;
      this.baseY = Math.random() * (height * 0.4) + 100;
    } else if (this.direction === -1 && this.x < -this.size * 2) {
      this.direction = 1;
      this.baseY = Math.random() * (height * 0.4) + 100;
    }

    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    
    if (this.isDead) {
      if (this.deathState === 'HIT_STUN') {
        // Freeze static tilt
        ctx.rotate(0.1); 
      } else {
        // Tumbles downwards
        ctx.rotate(this.spinAngle);
      }
    }
    
    // Flip duck outline horizontally if heading left (only if alive)
    if (this.direction === -1 && !this.isDead) {
      ctx.scale(-1, 1);
    }

    const s = this.size / 10; // Pixel multiplier size

    // Choose color: if in HIT_STUN state, flash spectacularly
    let bodyColor = this.color;
    let accent = this.accentColor;
    if (this.isDead && this.deathState === 'HIT_STUN') {
      const flashSelect = Math.floor(Date.now() / 45) % 3;
      if (flashSelect === 0) {
        bodyColor = '#FFFFFF';
        accent = '#FF3333';
      } else if (flashSelect === 1) {
        bodyColor = '#FFCC00';
        accent = '#FFFFFF';
      } else {
        bodyColor = '#FFA500';
        accent = '#10B981';
      }
    }

    // Draw retro rectangles for body blocks
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-s * 5, -s * 2, s * 10, s * 4.5); // Body base

    // Head base (mallard green / duck coloring)
    ctx.fillStyle = accent;
    ctx.fillRect(s * 2, -s * 4.5, s * 4, s * 3); // Head cube

    // Eye
    if (this.isDead) {
      // Classic shocked dead eyes as X
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(s * 3.3, -s * 3.7);
      ctx.lineTo(s * 4.7, -s * 2.3);
      ctx.moveTo(s * 4.7, -s * 3.7);
      ctx.lineTo(s * 3.3, -s * 2.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(s * 3.5, -s * 3.8, s * 1.5, s * 1.5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(s * 4.2, -s * 3.5, s * 0.8, s * 0.8);
    }

    // Beak
    ctx.fillStyle = this.beakColor;
    ctx.fillRect(s * 4.8, -s * 3.2, s * 3.2, s * 1.6); // outer duck lip

    // Wing flap rendering
    ctx.fillStyle = bodyColor;
    if (this.isDead) {
      // Slumped wing down (dead style)
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(-s * 3, s * 2.5, s * 3.5, s * 1.5);
    } else if (this.flapFrame === 0) {
      // Wings high up
      ctx.fillRect(-s * 2, -s * 6.5, s * 3.5, s * 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-s * 1, -s * 5.5, s * 1.5, s * 3);
    } else {
      // Wings swept low
      ctx.fillRect(-s * 2, s * 2.5, s * 3.5, s * 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-s * 1, s * 3.5, s * 1.5, s * 3);
    }

    // Cute duck feet at the back
    if (!this.isDead) {
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(-s * 4.5, s * 2.5, s * 1.5, s * 1);
      ctx.fillRect(-s * 3.5, s * 2.5, s * 1.5, s * 1);
    }

    ctx.restore();

    // Draw Health HUD strictly above the duck for BOSS type
    if (this.type === 'BOSS' && !this.isDead) {
      const barWidth = this.size;
      const barHeight = 8;
      const startX = this.x;
      const startY = this.y - 18;

      // Outer border
      ctx.fillStyle = '#000000';
      ctx.fillRect(startX - 2, startY - 2, barWidth + 4, barHeight + 4);

      // Remaining HP Bar
      const hpPercent = (this.maxHits - this.hitsReceived) / this.maxHits;
      ctx.fillStyle = '#EF4444'; // Red background
      ctx.fillRect(startX, startY, barWidth, barHeight);
      ctx.fillStyle = '#10B981'; // Green health
      ctx.fillRect(startX, startY, barWidth * hpPercent, barHeight);

      // Text HP tracker
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`BOSS: ${this.maxHits - this.hitsReceived} HP`, startX, startY - 6);
    }
  }
}

// Animate the legendary retro snicker Dog holding ducks or laughing!
interface RetroDog {
  state: 'HIDDEN' | 'INTRO_WALKING' | 'INTRO_JUMPING' | 'RETRIEVING' | 'LAUGHING' | 'DONE';
  x: number;
  y: number;
  timer: number; // frames count
  frame: number;
  direction: number;
  animStep: number;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [settings, setSettings] = useState<GameSettings>({
    shootingMode: 'PINCH',
    difficulty: 'NORMAL',
    soundEnabled: true,
    cameraEnabled: true,
  });

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(5);
  const [streak, setStreak] = useState(0);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [totalShots, setTotalShots] = useState(0);
  const [totalHits, setTotalHits] = useState(0);

  // Admin authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isBypassAdmin, setIsBypassAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isAdmin = (currentUser?.email === 'adhnanbasheer93@gmail.com') || isBypassAdmin;

  // Tracking setup parameters
  const [mediaPipeStatus, setMediaPipeStatus] = useState<'UNINITIALIZED' | 'LOADING' | 'READY' | 'ERROR'>('UNINITIALIZED');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);

  // HTML Element references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Game coordinates and game elements
  const currentReticlePos = useRef({ x: -100, y: -100 });
  const targetReticlePos = useRef({ x: -100, y: -100 }); // Smoothed interpolation target
  const activeDucks = useRef<CanvasDuck[]>([]);
  const activeParticles = useRef<Particle[]>([]);
  const activeFloatingTexts = useRef<FloatingText[]>([]);
  const activeShotRipples = useRef<ShotRipple[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const lastBossSpawnRef = useRef<number>(0);
  const lastPinchRef = useRef<boolean>(false);
  const triggerShotRef = useRef<boolean>(false); // 1-frame light flag
  const screenShakeRef = useRef<number>(0);

  // MediaPipe gesture state refs instead of React states to gain infinite smoothness (no re-renders)
  const isPinchingRef = useRef(false);
  const isGunGestureDetectedRef = useRef(false);

  // Synchronized refs to protect from stale closures in the MediaPipe event listener
  const gameStateRef = useRef<GameState>(GameState.START);
  const streakRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const settingsRef = useRef<GameSettings>({
    shootingMode: 'PINCH',
    difficulty: 'NORMAL',
    soundEnabled: true,
    cameraEnabled: true,
  });

  // Simple synchronization effects
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Flash controls for gunshot light
  const flashFrameCount = useRef<number>(0);

  // Dog control state
  const doggy = useRef<RetroDog>({
    state: 'INTRO_WALKING',
    x: 100,
    y: 0, // calculated later
    timer: 0,
    frame: 0,
    direction: 1,
    animStep: 0,
  });

  // MediaPipe control references
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // 1. Load high scores from database first, then fallback to local
  useEffect(() => {
    // Load local storage first for instant feedback
    try {
      const stored = localStorage.getItem('duckhunt_highscores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed loading scores", e);
    }

    // Then asynchronously fetch fresh entries from Firebase & sync
    fetchHighScoresFromFirebase().then((firebaseScores) => {
      if (firebaseScores && firebaseScores.length > 0) {
        setHighScores(firebaseScores);
        try {
          localStorage.setItem('duckhunt_highscores', JSON.stringify(firebaseScores));
        } catch (err) {
          console.error("Local storage sync error", err);
        }
      }
    });
  }, []);

  // 1b. Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Admin authentication handlers
  const handleAdminLogin = () => {
    if (isAdmin) {
      setShowAdminDashboard(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleAdminGoogleSignIn = async () => {
    const user = await signInWithGoogle();
    if (user) {
      if (user.email === 'adhnanbasheer93@gmail.com') {
        sfx.playGoldenCatch(); // play iconic 8-bit sound
        alert(`Authorized personnel verified: Welcome back, ${user.displayName || 'Admin'}!`);
        setShowLoginModal(false);
        setShowAdminDashboard(true);
      } else {
        alert(`Access Denied: Current authenticated email (${user.email}) does not possess executive admin clearance.`);
        await logOutAdmin();
      }
    }
  };

  const handleAdminPasscodeSignIn = (passcode: string): boolean => {
    if (passcode === 'duckhuntadmin') {
      setIsBypassAdmin(true);
      sfx.playGoldenCatch();
      alert("SIMULATOR MODE ENABLED: local-terminal access has been granted.");
      setShowLoginModal(false);
      setShowAdminDashboard(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = async () => {
    if (isBypassAdmin) {
      setIsBypassAdmin(false);
    } else {
      await logOutAdmin();
    }
    setShowAdminDashboard(false);
    alert("SECURE CONSOLE SESSION TERMINATED successfully.");
  };

  // Update mute state in sfx engine
  useEffect(() => {
    setMuteState(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Handle high score saves
  const handleSaveHighScore = (name: string, savedScore: number, accuracy: number) => {
    const newEntry: HighScore = {
      score: savedScore,
      accuracy,
      name,
      date: new Date().toLocaleDateString(),
    };

    const updated = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10 hunters

    setHighScores(updated);
    try {
      localStorage.setItem('duckhunt_highscores', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    // Save to Firebase as well
    saveHighScoreToFirebase(newEntry).then((success) => {
      if (success) {
        // Fetch refreshed scores from firebase to ensure absolute sync
        fetchHighScoresFromFirebase().then((refreshed) => {
          if (refreshed && refreshed.length > 0) {
            setHighScores(refreshed);
            localStorage.setItem('duckhunt_highscores', JSON.stringify(refreshed));
          }
        });
      }
    });
  };

  // Toggle webcam tracking
  const handleToggleWebcam = () => {
    const updatedVal = !settings.cameraEnabled;
    setSettings(prev => ({ ...prev, cameraEnabled: updatedVal }));
    if (!updatedVal) {
      stopCameraAndTracking();
    } else {
      setMediaPipeStatus('LOADING');
    }
  };

  const stopCameraAndTracking = () => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {}
      cameraRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setMediaPipeStatus('UNINITIALIZED');
  };

  // MediaPipe hands loader and tracker initializer
  useEffect(() => {
    if (!settings.cameraEnabled) {
      setMediaPipeStatus('UNINITIALIZED');
      return;
    }

    setMediaPipeStatus('LOADING');
    setCameraError(null);

    let checkAttempts = 0;
    const pollInterval = setInterval(() => {
      checkAttempts++;
      const HandsClass = (window as any).Hands;
      const CameraClass = (window as any).Camera;

      if (HandsClass && CameraClass) {
        clearInterval(pollInterval);
        startMediaPipeTracking(HandsClass, CameraClass);
      } else if (checkAttempts >= 20) {
        // 5 seconds timeout
        clearInterval(pollInterval);
        setMediaPipeStatus('ERROR');
        setCameraError("MediaPipe failed to load from CDN. Playing in mouse mode.");
      }
    }, 250);

    return () => {
      clearInterval(pollInterval);
    };
  }, [settings.cameraEnabled]);

  const startMediaPipeTracking = (HandsClass: any, CameraClass: any) => {
    if (!videoRef.current) return;

    try {
      const handsSolver = new HandsClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsSolver.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });

      handsSolver.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const indexFingerTip = landmarks[8]; // Landmark 8 (tip of index)
          const thumbTip = landmarks[4]; // Landmark 4 (tip of thumb)

          if (canvasRef.current) {
            // Helper for 3D distance
            const dist = (p1: any, p2: any) => Math.sqrt(
              Math.pow(p1.x - p2.x, 2) +
              Math.pow(p1.y - p2.y, 2) +
              Math.pow(p1.z - p2.z, 2)
            );

            const palmSize = dist(landmarks[0], landmarks[9]);
            const indexLength = dist(landmarks[8], landmarks[5]);

            // Gun Gesture Detection:
            // 1. Index finger extended forward (for aiming)
            const isIndexExtended = indexLength > palmSize * 0.75;
            // 2. Index finger is tapped / bent down
            const isIndexTapped = indexLength < palmSize * 0.55;

            // 3. Middle, ring, and pinky fingers folded (close to wrist landmark 0)
            const isMiddleFolded = dist(landmarks[12], landmarks[0]) < palmSize * 1.25;
            const isRingFolded = dist(landmarks[16], landmarks[0]) < palmSize * 1.25;
            const isPinkyFolded = dist(landmarks[20], landmarks[0]) < palmSize * 1.25;

            // Gun gesture is active if we see the hand landmarks
            isGunGestureDetectedRef.current = true;
            isPinchingRef.current = false;

            // Map index tip coordinates safely with offset sensitivity scaling.
            // This filters hand sweeps and allows comfortable full-canvas coverage using slight wrist control!
            const rawX = 1 - indexFingerTip.x;
            const rawY = indexFingerTip.y;
            const sensitivity = 1.35;
            const scaledX = 0.5 + (rawX - 0.5) * sensitivity;
            const scaledY = 0.5 + (rawY - 0.5) * sensitivity;
            
            // Constrain coordinate boundary ranges comfortably
            const clampedX = Math.max(0.01, Math.min(0.99, scaledX));
            const clampedY = Math.max(0.01, Math.min(0.99, scaledY));

            const indexX = clampedX * canvasRef.current.width;
            const indexY = clampedY * canvasRef.current.height;

            // Directly project the target reticle smoothly to the index fingertip position without freeze locks!
            targetReticlePos.current = { x: indexX, y: indexY };
          }
        } else {
          isGunGestureDetectedRef.current = false;
          isPinchingRef.current = false;
        }
      });

      handsRef.current = handsSolver;

      // Ask for permission and stream
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            const cameraInstance = new CameraClass(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current && handsRef.current) {
                  try {
                    await handsRef.current.send({ image: videoRef.current });
                  } catch (err) {}
                }
              },
              width: 1280,
              height: 720,
            });

            cameraInstance.start();
            cameraRef.current = cameraInstance;
            setMediaPipeStatus('READY');
          }
        })
        .catch((err) => {
          console.warn("Camera grant denied", err);
          setCameraError("Camera access rejected or blocked. Mouse controls loaded instead.");
          setMediaPipeStatus('ERROR');
        });
    } catch (e: any) {
      console.warn("Exception in hand tracking boot", e);
      setCameraError(e?.message || "Critical failure initializing tracking matrix.");
      setMediaPipeStatus('ERROR');
    }
  };

  // Main canvas loop using requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const tick = () => {
      renderGameCanvas();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, settings.shootingMode, settings.difficulty]);

  // Shoot interaction checker
  const handleCoreShoot = (x: number, y: number, alternativeX?: number, alternativeY?: number) => {
    const currentGameState = gameStateRef.current;
    if (currentGameState !== GameState.PLAYING && currentGameState !== GameState.START) return;

    initAudio();
    sfx.playGunshot();
    screenShakeRef.current = 12; // Retro visual rumble shake
    if (currentGameState === GameState.PLAYING) {
      setTotalShots((prev) => prev + 1);
    }

    // Add colorful concentric ripple animations at collision coordinate
    activeShotRipples.current.push({
      x: x,
      y: y,
      radius: 4,
      maxRadius: 40,
      alpha: 1.0,
      color: '#ffdd00' // Golden blast halo
    });

    // Retro light flash trigger (disabled for eye comfort)
    flashFrameCount.current = 0;

    let duckHitHappened = false;

    // Check hitboxes - ducks
    const remainingDucks = activeDucks.current;
    for (let i = 0; i < remainingDucks.length; i++) {
      const duck = remainingDucks[i];
      if (duck.isDead) continue;

      // Satisfying distance overlap check: triggers when reticle touches / overlays the duck body
      const centerX = duck.x + duck.size / 2;
      const centerY = duck.y + duck.size / 2;
      const distance = Math.hypot(x - centerX, y - centerY);
      const hitRadius = (duck.size / 2) + 22 + 14; // duck radius + reticle radius + responsive buffer

      let isHit = distance <= hitRadius;

      // Direct index finger tip touch detection:
      if (!isHit && alternativeX !== undefined && alternativeY !== undefined) {
        const altDistance = Math.hypot(alternativeX - centerX, alternativeY - centerY);
        const altHitRadius = (duck.size / 2) + 20; // precise physical bounds of the duck on screen
        if (altDistance <= altHitRadius) {
          isHit = true;
        }
      }

      if (isHit) {
        duckHitHappened = true;
        duck.hitsReceived++;

        if (duck.hitsReceived < duck.maxHits) {
          // Play a slight hit feedback sound
          sfx.playSquawk(duck.pitch * 1.4);
          // Spawn satisfying physical hit spark & damage particles
          for (let p = 0; p < 8; p++) {
            activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, '#EF4444')); // damage spark
            activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, duck.color));
          }
        } else {
          // Final strike! Kill duck!
          duck.isDead = true;
          duck.deathState = 'HIT_STUN';
          duck.deathTimer = 22; // Freeze 22 frames in the air
          duck.fallSpeed = 0; // Freeze initially
          
          if (currentGameState === GameState.PLAYING) {
            setTotalHits((prev) => prev + 1);
          }

          // Sound pitches depending on golden, boss, or regular ducks
          if (duck.type === 'GOLDEN') {
            sfx.playGoldenCatch();
            if (currentGameState === GameState.PLAYING) {
              const currentStreak = streakRef.current;
              const nextMult = currentStreak + 1;
              const pts = duck.points * nextMult;

              setStreak((s) => {
                const nextS = s + 1;
                streakRef.current = nextS;
                return nextS;
              });
              setScore((prev) => {
                const nextScore = prev + pts;
                scoreRef.current = nextScore;
                return nextScore;
              });

              activeFloatingTexts.current.push({
                x: duck.x + duck.size / 2 - 30,
                y: duck.y,
                text: `+${pts} GOLD!`,
                color: '#FFD700',
                life: 1.0,
                size: 20,
              });

              if (currentStreak > 0) {
                activeFloatingTexts.current.push({
                  x: duck.x + duck.size / 2 - 40,
                  y: duck.y - 25,
                  text: `${nextMult}X COMBO!`,
                  color: '#42b6f5',
                  life: 1.0,
                  size: 14,
                });
              }
            }
            // Sparkle trails
            for (let p = 0; p < 18; p++) {
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, '#FFD700', true));
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, '#FFF3A8', true));
            }
          } else if (duck.type === 'BOSS') {
            // Spectacular bonus sounds!
            sfx.playGoldenCatch();
            sfx.playSquawk(duck.pitch);
            if (currentGameState === GameState.PLAYING) {
              const currentStreak = streakRef.current;
              const nextMult = currentStreak + 1;
              const pts = duck.points * nextMult;

              setStreak((s) => {
                const nextS = s + 1;
                streakRef.current = nextS;
                return nextS;
              });
              setScore((prev) => {
                const nextScore = prev + pts;
                scoreRef.current = nextScore;
                return nextScore;
              });

              activeFloatingTexts.current.push({
                x: duck.x + duck.size / 2 - 50,
                y: duck.y,
                text: `+${pts} BOSS DOWN!`,
                color: '#FF3333',
                life: 1.0,
                size: 24,
              });
            }
            // Mega burst particles
            for (let p = 0; p < 26; p++) {
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, '#F59E0B', true));
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, duck.color));
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, '#FFFFFF'));
            }
          } else {
            sfx.playSquawk(duck.pitch);
            if (currentGameState === GameState.PLAYING) {
              const currentStreak = streakRef.current;
              const nextMult = currentStreak + 1;
              const pts = duck.points * nextMult;

              setStreak((s) => {
                const nextS = s + 1;
                streakRef.current = nextS;
                return nextS;
              });
              setScore((prev) => {
                const nextScore = prev + pts;
                scoreRef.current = nextScore;
                return nextScore;
              });

              activeFloatingTexts.current.push({
                x: duck.x + duck.size / 2 - 20,
                y: duck.y,
                text: `+${pts}`,
                color: duck.type === 'FAST' ? '#63adff' : '#10B981',
                life: 1.0,
                size: 18,
              });

              if (currentStreak > 0) {
                activeFloatingTexts.current.push({
                  x: duck.x + duck.size / 2 - 30,
                  y: duck.y - 25,
                  text: `${nextMult}X COMBO!`,
                  color: '#FFA500',
                  life: 1.0,
                  size: 14,
                });
              }
            }
            // Feather bursts of corresponding color
            for (let p = 0; p < 14; p++) {
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, duck.color));
              activeParticles.current.push(new Particle(duck.x + duck.size / 2, duck.y + duck.size / 2, '#FFFFFF'));
            }
          }

          // Trigger retrieved state for doggy!
          if (currentGameState === GameState.PLAYING) {
            triggerDogPopup('RETRIEVING', duck.x);
          }
        }
        break; // Max 1 duck hit per gunshot hit
      }
    }

    if (!duckHitHappened && currentGameState === GameState.PLAYING) {
      // Missed shot resets multi-streak multiplier
      setStreak(0);
      streakRef.current = 0;
    }
  };

  const triggerDogPopup = (type: 'RETRIEVING' | 'LAUGHING', targetX: number) => {
    if (doggy.current.state === 'INTRO_WALKING' || doggy.current.state === 'INTRO_JUMPING') return;

    doggy.current.state = type;
    doggy.current.x = targetX;
    doggy.current.timer = 120; // Popup lasts 2 seconds
    doggy.current.animStep = 0;

    if (type === 'LAUGHING') {
      sfx.playDogLaugh();
    }
  };

  // Canvas Drawing Routine
  const renderGameCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fluid resize
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Clear Canvas - keep background transparent to prioritize mirrored webcam stream!
    ctx.clearRect(0, 0, w, h);

    // Apply satisfying screenshake displacement
    if (screenShakeRef.current > 0) {
      ctx.save();
      const dx = (Math.random() - 0.5) * screenShakeRef.current;
      const dy = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(dx, dy);
    }

    // 1. GUNSHOT WHITE FLASH EFFECT (Disabled for eye comfort and satisfying gameplay)
    flashFrameCount.current = 0;

    // 2. SMOOTH RETICLE TRANSLATION (webcam mode has snappy smoothing, mouse mode is instantaneous!)
    const lerp = (settings.cameraEnabled && mediaPipeStatus === 'READY') ? 0.32 : 1.0;
    currentReticlePos.current.x = currentReticlePos.current.x * (1 - lerp) + targetReticlePos.current.x * lerp;
    currentReticlePos.current.y = currentReticlePos.current.y * (1 - lerp) + targetReticlePos.current.y * lerp;

    const isShowingBackdrop = (gameState === GameState.PLAYING || gameState === GameState.START || gameState === GameState.COUNTDOWN);
    if (isShowingBackdrop) {
      // A. DRAW BACKGROUND DETAILS
      // Drifting geometric 8-bit clouds
      const cloudSpeed = 0.35;
      const driftOffset = (Date.now() * cloudSpeed) % (w + 400);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      // Cloud 1
      const c1X = driftOffset - 200;
      ctx.fillRect(c1X, 100, 140, 30);
      ctx.fillRect(c1X + 25, 80, 90, 20);
      ctx.fillRect(c1X + 45, 68, 50, 12);

      // Cloud 2
      const c2X = ((driftOffset + w / 2) % (w + 400)) - 200;
      ctx.fillRect(c2X, 180, 180, 35);
      ctx.fillRect(c2X + 35, 155, 110, 25);

      // Gentle sky/wind micro particles drifting horizontally
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 6; i++) {
        const speed = 0.12 + i * 0.04;
        const drift = ((Date.now() * speed + i * 420) % (w + 100)) - 50;
        const yCoord = 60 + i * 75;
        // pixel sky sparkles/streaks
        ctx.fillRect(drift, yCoord, 8, 3);
        ctx.fillRect(drift + 2, yCoord - 1, 4, 1);
        ctx.fillRect(drift + 2, yCoord + 3, 4, 1);
      }

      // B. UPDATE AND DRAW FEATHER PARTICLES
      const parts = activeParticles.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const isDead = parts[i].update();
        if (isDead) {
          parts.splice(i, 1);
        } else {
          parts[i].draw(ctx);
        }
      }

      // B.2 UPDATE AND DRAW SHOT RIPPLES (Concentric blast wave ring animation)
      const ripples = activeShotRipples.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.18 + 1.5;
        r.alpha -= 0.05;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
        } else {
          ctx.save();
          // Primary outer retro ring
          ctx.strokeStyle = r.color;
          ctx.globalAlpha = r.alpha;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Secondary inner retro ring
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(1, r.radius - 8), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // C. SPAWN DUCKS (on start screen, let's spawn 2 practice ducks; during gameplay handle standard rules)
      const now = Date.now();
      if (gameState === GameState.PLAYING) {
        const spawnDelay = settings.difficulty === 'HARD' ? 1000 : settings.difficulty === 'EASY' ? 1700 : 1300;
        
        // Spawn Boss Duck every 10 seconds during active play
        if (now - lastBossSpawnRef.current > 10000) {
          activeDucks.current.push(new CanvasDuck(w, h, settings.difficulty, 'BOSS'));
          lastBossSpawnRef.current = now;
        } else if (now - lastSpawnRef.current > spawnDelay && activeDucks.current.length < 4) {
          activeDucks.current.push(new CanvasDuck(w, h, settings.difficulty));
          lastSpawnRef.current = now;
        }
      } else if (gameState === GameState.START) {
        if (activeDucks.current.length < 2) {
          const forceType = Math.random() > 0.75 ? 'GOLDEN' : 'NORMAL';
          activeDucks.current.push(new CanvasDuck(w, h, settings.difficulty, forceType));
        }
      }

      // D. UPDATE AND DRAW ACTIVE DUCKS
      const ducks = activeDucks.current;
      for (let i = ducks.length - 1; i >= 0; i--) {
        const hasFallen = ducks[i].update(w, h);
        ducks[i].draw(ctx);

        if (hasFallen) {
          // Fallen dead duck lands
          ducks.splice(i, 1);
          if (gameState === GameState.START) {
            // Respawn instantly on title screen so the sky is never empty!
            const forceType = Math.random() > 0.75 ? 'GOLDEN' : 'NORMAL';
            ducks.push(new CanvasDuck(w, h, settings.difficulty, forceType));
          }
        } else if (!ducks[i].isDead) {
          // If a duck is live, check for index finger direct-touch or lockon hover interactions
          const rx = currentReticlePos.current.x;
          const ry = currentReticlePos.current.y;
          const rawX = targetReticlePos.current.x;
          const rawY = targetReticlePos.current.y;
          const d = ducks[i];

          const centerX = d.x + d.size / 2;
          const centerY = d.y + d.size / 2;
          
          const distSmooth = Math.hypot(rx - centerX, ry - centerY);
          const distRaw = Math.hypot(rawX - centerX, rawY - centerY);
          const touchHitRadius = (d.size / 2) + 24; // responsive overlap touch bounds

          const isWebCamActive = settings.cameraEnabled && mediaPipeStatus === 'READY';

          if (isWebCamActive && (distSmooth <= touchHitRadius || distRaw <= touchHitRadius)) {
            // INDEX FINGER TOUCH HIT EVENT DETECTED!
            // Trigger instant gunshot, scoring, audio feedback, feather bursts, and realistic gravity fall
            handleCoreShoot(centerX, centerY, rx, ry);
          } else if (!isWebCamActive && settings.shootingMode === 'HOVER') {
            // Fallback lock-on hover shooting mode (automatic charge fire for standard mouse fallback)
            const distance = distSmooth;
            const hitRadius = (d.size / 2) + 22 + 14; // duck radius + reticle radius + buffer

            if (distance <= hitRadius) {
              d.hoverLockedTimer++;
              // Draw a loading target sector ring around the reticle
              ctx.strokeStyle = '#FFFF00';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(rx, ry, 30, 0, (Math.min(18, d.hoverLockedTimer) / 18) * Math.PI * 2);
              ctx.stroke();

              if (d.hoverLockedTimer >= 18) {
                // Shoot trigger!
                d.hoverLockedTimer = 0;
                handleCoreShoot(rx, ry);
              }
            } else {
              d.hoverLockedTimer = 0;
            }
          }
        }
      }

      // E. NES STICKER - GREEN GRASS & pixel tree & shrub at the bottom
      const grassHeight = 90;
      // Draw dirt baseline
      ctx.fillStyle = '#855E42'; // brown soil
      ctx.fillRect(0, h - grassHeight, w, grassHeight);
      
      // Grass strip
      ctx.fillStyle = '#44891a'; // emerald green
      ctx.fillRect(0, h - grassHeight - 6, w, 12);
      ctx.fillStyle = '#4cb01e'; // bright retro highlights top
      ctx.fillRect(0, h - grassHeight - 12, w, 6);

      // Draw pixel blades of grass across bottom line
      ctx.fillStyle = '#4cb01e';
      for (let x = 0; x < w; x += 32) {
        ctx.fillRect(x + 4, h - grassHeight - 20, 4, 8);
        ctx.fillRect(x + 16, h - grassHeight - 24, 6, 12);
        ctx.fillRect(x + 24, h - grassHeight - 18, 5, 6);
      }

      // Draw a blocky 8-bit brown oak tree next to the left border of the landscape
      const treeX = Math.round(w * 0.15);
      ctx.fillStyle = '#5c3922'; // deep bark
      ctx.fillRect(treeX, h - grassHeight - 110, 24, 110); // trunk
      ctx.fillRect(treeX - 16, h - grassHeight - 90, 16, 12); // left branch

      // Green pixel foliage
      ctx.fillStyle = '#16571b';
      ctx.fillRect(treeX - 40, h - grassHeight - 160, 100, 60); // foliage layer 1
      ctx.fillStyle = '#207827';
      ctx.fillRect(treeX - 30, h - grassHeight - 190, 80, 50); // layer 2
      ctx.fillStyle = '#2fb039';
      ctx.fillRect(treeX - 15, h - grassHeight - 210, 50, 40); // bright top cover

      // Draw a blocky 8-bit green bush next to the right border of the landscape
      const bushX = Math.round(w * 0.75);
      ctx.fillStyle = '#0f4812'; // dark bush shadow
      ctx.fillRect(bushX, h - grassHeight - 45, 75, 45);
      ctx.fillStyle = '#1b7420'; // main bush green
      ctx.fillRect(bushX + 8, h - grassHeight - 55, 60, 50);
      ctx.fillStyle = '#2db033'; // bright bush highlights
      ctx.fillRect(bushX + 16, h - grassHeight - 62, 45, 45);

      // F. RETRO ANIMATED DOGGY ACTIONS
      // Doggy State management inside frame timer updates
      const dog = doggy.current;
      if (gameState === GameState.PLAYING) {
        if (dog.state === 'INTRO_WALKING') {
          dog.y = h - grassHeight - 50;
          dog.timer++;
          
          // Walk side to side, then jump!
          dog.x += dog.direction * 1.5;
          if (dog.x > w * 0.45) {
            dog.state = 'INTRO_JUMPING';
            dog.timer = 0;
            dog.direction = 1;
          }

          // Walker motion flap
          dog.frame = Math.floor(dog.timer / 12) % 4;
          drawRetroDogModel(ctx, dog.x, dog.y, 'WALKING', dog.frame);
        } else if (dog.state === 'INTRO_JUMPING') {
          dog.timer++;
          // Parabolic jump path
          const jt = dog.timer;
          dog.x += 1.2;
          // Peak offset
          dog.y = h - grassHeight - 50 - Math.sin((jt / 70) * Math.PI) * 75;

          if (jt >= 70) {
            dog.state = 'DONE';
          }
          drawRetroDogModel(ctx, dog.x, dog.y, 'JUMPING', 0);
        } else if (dog.state === 'RETRIEVING') {
          dog.timer--;
          dog.y = h - grassHeight - 40;
          
          // Slide up and back down
          const slideY = Math.sin((dog.timer / 120) * Math.PI) * 60;
          drawRetroDogModel(ctx, dog.x, dog.y - slideY, 'HOLDING', 0);

          if (dog.timer <= 0) {
            dog.state = 'DONE';
          }
        } else if (dog.state === 'LAUGHING') {
          dog.timer--;
          dog.y = h - grassHeight - 40;

          // Shoulder vibration
          const vibrationOffsetY = (Math.floor(dog.timer / 4) % 2) * 5;
          const slideY = Math.sin((dog.timer / 120) * Math.PI) * 50;
          drawRetroDogModel(ctx, dog.x, dog.y - slideY - vibrationOffsetY, 'LAUGHING', dog.frame);

          if (dog.timer <= 0) {
            dog.state = 'DONE';
          }
        }
      }
    }

    // F2. DRAW FLOATING POPUP TEXTS (Juicy feedback scores overlaying landscape)
    const texts = activeFloatingTexts.current;
    for (let idx = texts.length - 1; idx >= 0; idx--) {
      const t = texts[idx];
      t.y -= 1.1; // slow float upwards
      t.life -= 0.016; // gradual fadeout

      if (t.life <= 0) {
        texts.splice(idx, 1);
      } else {
        ctx.save();
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life;
        ctx.font = `900 ${t.size}px "Space Grotesk", sans-serif`;
        ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
        ctx.restore();
      }
    }

    // 3. TARGETING CROSSHAIR RETICLE (renders always over canvas in play & start states)
    if (gameState === GameState.PLAYING || gameState === GameState.START) {
      const rx = currentReticlePos.current.x;
      const ry = currentReticlePos.current.y;

      const activePinch = isPinchingRef.current;
      const activeGun = isGunGestureDetectedRef.current;

      // Outer block ring
      if (settings.cameraEnabled && mediaPipeStatus === 'READY') {
        ctx.strokeStyle = activePinch ? '#FFFF00' : activeGun ? '#10B981' : '#FF3333';
      } else {
        ctx.strokeStyle = '#FF3333';
      }
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Core red sight point
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(rx - 3, ry - 3, 6, 6);

      // Radial cross hairs
      ctx.strokeStyle = '#FF3333';
      ctx.lineWidth = 2.5;
      
      ctx.beginPath();
      // Left sight lane
      ctx.moveTo(rx - 32, ry); ctx.lineTo(rx - 10, ry);
      // Right sight lane
      ctx.moveTo(rx + 10, ry); ctx.lineTo(rx + 32, ry);
      // Top lane
      ctx.moveTo(rx, ry - 32); ctx.lineTo(rx, ry - 10);
      // Bottom lane
      ctx.moveTo(rx, ry + 10); ctx.lineTo(rx, ry + 32);
      ctx.stroke();

      // Draw subtle hand/pointer sight badge below reticle when camera is enabled
      if (settings.cameraEnabled && mediaPipeStatus === 'READY') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        if (activePinch) {
          ctx.fillText("💥 BANG!", rx - 18, ry + 42);
        } else if (activeGun) {
          ctx.fillStyle = '#10B981'; // pretty active green
          ctx.fillText("READY • GUN", rx - 35, ry + 42);
        } else {
          ctx.fillStyle = '#F59E0B'; // attention orange
          ctx.fillText("MAKE GUN GESTURE", rx - 55, ry + 42);
        }
      }
    }

    if (screenShakeRef.current > 0) {
      ctx.restore();
      screenShakeRef.current *= 0.80; // decay shake
      if (screenShakeRef.current < 0.4) {
        screenShakeRef.current = 0;
      }
    }
  };

  // Build the 8-bit retro dog silhouette using modular canvas shapes
  const drawRetroDogModel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pose: 'WALKING' | 'JUMPING' | 'HOLDING' | 'LAUGHING',
    frame: number
  ) => {
    ctx.save();
    ctx.translate(x, y);

    const ds = 4; // micro-pixel layout block

    // Body base color: Brown
    ctx.fillStyle = '#855E42';

    if (pose === 'WALKING') {
      // Main body trunk
      ctx.fillRect(-ds * 5, -ds * 8, ds * 10, ds * 8);
      // Brown head
      ctx.fillRect(-ds * 3, -ds * 14, ds * 7, ds * 6);
      // White collar face
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-ds * 2, -ds * 11, ds * 5, ds * 3);
      // Nose
      ctx.fillStyle = '#000000';
      ctx.fillRect(ds * 3, -ds * 12, ds * 2, ds * 2);
      // floppy ears
      ctx.fillStyle = '#4E3629';
      ctx.fillRect(-ds * 5, -ds * 14, ds * 3, ds * 6);

      // Walk cycle feet alternation
      ctx.fillStyle = '#855E42';
      if (frame === 0 || frame === 2) {
        ctx.fillRect(-ds * 4, 0, ds * 2, ds * 3); // front foot flat
        ctx.fillRect(ds * 2, 0, ds * 2, ds * 3);
      } else {
        ctx.fillRect(-ds * 3, 0, ds * 2, ds * 2); // raised
        ctx.fillRect(ds * 1, 0, ds * 2, ds * 2);
      }
    } else if (pose === 'JUMPING') {
      // Shanted leaping body
      ctx.rotate(-0.25);
      ctx.fillRect(-ds * 6, -ds * 8, ds * 12, ds * 7);
      // Head looking up
      ctx.fillRect(ds * 2, -ds * 15, ds * 6, ds * 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ds * 3, -ds * 12, ds * 4, ds * 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(ds * 7, -ds * 13, ds * 2, ds * 2); // nose snout
      // long back ears
      ctx.fillStyle = '#4E3629';
      ctx.fillRect(-ds * 1, -ds * 15, ds * 4, ds * 5);
      // outstretched paws
      ctx.fillStyle = '#855E42';
      ctx.fillRect(ds * 6, -ds * 5, ds * 5, ds * 2); // legs front
      ctx.fillRect(-ds * 10, -ds * 3, ds * 5, ds * 2); // legs back
    } else if (pose === 'HOLDING') {
      // Pride retrieval smile pose!
      // Dog facing front
      ctx.fillRect(-ds * 8, -ds * 7, ds * 16, ds * 7); // broad shoulders
      ctx.fillRect(-ds * 6, -ds * 15, ds * 12, ds * 8); // head
      
      // Face snout white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-ds * 4, -ds * 11, ds * 8, ds * 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-ds * 1.5, -ds * 11, ds * 3, ds * 2); // center black snout
      ctx.fillRect(-ds * 3, -ds * 14, ds * 2, ds * 2); // eye left
      ctx.fillRect(ds * 1, -ds * 14, ds * 2, ds * 2); // eye right

      // Huge Floppy ears side-by-side
      ctx.fillStyle = '#4E3629';
      ctx.fillRect(-ds * 9, -ds * 15, ds * 3, ds * 8); // left ear
      ctx.fillRect(ds * 6, -ds * 15, ds * 3, ds * 8); // right ear

      // DRAW THE COMPLETED HELD DUCK IN THE DOG'S SNOUT! (peak retro design)
      ctx.fillStyle = '#FFD700'; // duck body
      ctx.fillRect(-ds * 3, -ds * 8, ds * 6, ds * 3);
      ctx.fillStyle = '#FFA500'; // beak hanging down
      ctx.fillRect(-ds * 4, -ds * 7, ds * 1.5, ds * 1.5);
      ctx.fillStyle = '#16571b'; // green mallard head
      ctx.fillRect(ds * 2.5, -ds * 8, ds * 2.5, ds * 2.5);

    } else if (pose === 'LAUGHING') {
      // Giggling shoulder rub doggy
      ctx.fillRect(-ds * 8, -ds * 7, ds * 16, ds * 7); // shoulders
      ctx.fillRect(-ds * 5.5, -ds * 14, ds * 11, ds * 8); // head
      
      // Face details laughing squint-eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-ds * 3.5, -ds * 11, ds * 7, ds * 5);
      ctx.fillStyle = '#e81d1d'; // pink mischievous tongue!
      ctx.fillRect(-ds * 1.5, -ds * 8, ds * 3, ds * 3.5);

      ctx.fillStyle = '#000000';
      ctx.fillRect(-ds * 1.5, -ds * 11, ds * 3, ds * 1.5); // nose
      // Crossed squinting black lines for laughter eye squints
      ctx.fillRect(-ds * 3, -ds * 13, ds * 2.5, ds * 1);
      ctx.fillRect(ds * 0.5, -ds * 13, ds * 2.5, ds * 1);

      // Floppy ears pointing upwards slightly in joy!
      ctx.fillStyle = '#4E3629';
      ctx.fillRect(-ds * 8.5, -ds * 15, ds * 3, ds * 7); // left ear
      ctx.fillRect(ds * 5.5, -ds * 15, ds * 3, ds * 7); // right ear
    }

    ctx.restore();
  };

  // Handles starting the physical session countdowns
  const handleStartGame = () => {
    initAudio();
    sfx.playStartJingle();
    
    // Set parameters
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(60);
    setLives(5);
    setStreak(0);
    streakRef.current = 0;
    setTotalShots(0);
    setTotalHits(0);
    
    activeDucks.current = [];
    activeParticles.current = [];

    // Trigger walk doggy introduction
    doggy.current = {
      state: 'INTRO_WALKING',
      x: -50,
      y: 0,
      timer: 0,
      frame: 0,
      direction: 1.15,
      animStep: 0,
    };

    setGameState(GameState.COUNTDOWN);
    setCountdownNum(3);
    sfx.playBlip();

    let count = 3;
    const ticker = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNum(count);
        sfx.playBlip();
      } else {
        clearInterval(ticker);
        sfx.playFinalBlip();
        setGameState(GameState.PLAYING);
        lastSpawnRef.current = Date.now();
        lastBossSpawnRef.current = Date.now();
      }
    }, 1000);
  };

  // Timer interval updates
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const gameTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          triggerGameOver();
          return 0;
        }

        // Randomly check if any ducks escaped because player run out of lives
        // No strict lives system in other request, but let's implement the core rules:
        // When a duck goes off-screen without being hit, the player loses a life!
        // Wait, did we track missed ducks? Let's verify and dock lives!
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(gameTimer);
    };
  }, [gameState]);

  // Handle duck escapes to dock lives!
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    // We can monitor active ducks. If they fly off-screen horizontally, trigger loss of life!
    const checkEscapedDucks = setInterval(() => {
      const ducks = activeDucks.current;
      const w = window.innerWidth;
      
      for (let i = ducks.length - 1; i >= 0; i--) {
        const duck = ducks[i];
        if (!duck.isDead) {
          // Check if boundary crossed
          if (
            (duck.direction === 1 && duck.x > w + duck.size) ||
            (duck.direction === -1 && duck.x < -duck.size * 1.5)
          ) {
            // Duck Escaped! Duck hunt dog is disappointed!
            setLives((l) => {
              const nextL = l - 1;
              if (nextL <= 0) {
                triggerGameOver();
              }
              return Math.max(0, nextL);
            });
            // Escape laugh
            triggerDogPopup('LAUGHING', duck.x);
            ducks.splice(i, 1);
            setStreak(0); // break chain multiplier
          }
        }
      }
    }, 150);

    return () => {
      clearInterval(checkEscapedDucks);
    };
  }, [gameState]);

  const triggerGameOver = () => {
    setGameState(GameState.GAMEOVER);
    sfx.playGameOverSound();
    // Retrieve ducks cleared
    activeDucks.current = [];
  };

  // Handle fallback click to shoot on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (settings.cameraEnabled && mediaPipeStatus === 'READY') return; // Deactivated for active tracking
    if (gameState !== GameState.PLAYING && gameState !== GameState.START) return;

    // Map mouse click coordinates
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Update target and fire immediately
      targetReticlePos.current = { x: clickX, y: clickY };
      currentReticlePos.current = { x: clickX, y: clickY };
      handleCoreShoot(clickX, clickY);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.START) return;

    // Smooth movement mapping fallback
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const moveX = e.clientX - rect.left;
      const moveY = e.clientY - rect.top;

      // Only lock mouse aiming directly if webcam hand landmarks are not updating
      if (mediaPipeStatus !== 'READY') {
        targetReticlePos.current = { x: moveX, y: moveY };
      }
    }
  };

  const handleQuitGame = () => {
    initAudio();
    setGameState(GameState.START);
    activeDucks.current = [];
    activeParticles.current = [];
  };

  return (
    <main id="game-container" className="relative w-screen h-screen overflow-hidden bg-black flex flex-col justify-center items-center">
      
      {/* 1. Invisible Video Feed for hand gesture calculation (never shown on screen to protect user privacy) */}
      {settings.cameraEnabled && (
        <video
          ref={videoRef}
          id="webcam"
          autoPlay
          playsInline
          muted
          className="absolute opacity-0 pointer-events-none w-[1px] h-[1px] top-0 left-0 overflow-hidden"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* Decorative Brutalist Sky Backdrop (always visible, replacing camera feed for beautiful retro styling!) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#63adff] to-[#a0cfff] z-1 transition-opacity duration-300">
        {/* Retro scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:100%_16px] pointer-events-none"></div>
        {/* Retro dots grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
      </div>

      {/* 2. Interactive canvas rendering layer */}
      <canvas
        ref={canvasRef}
        id="game-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        className="absolute inset-0 w-full h-full z-10 block select-none pointer-events-auto"
        style={{ cursor: mediaPipeStatus === 'READY' ? 'none' : 'crosshair' }}
      />

      {/* 3. Global HUD block in play State */}
      {gameState === GameState.PLAYING && (
        <GameHUD
          score={score}
          timeLeft={timeLeft}
          lives={lives}
          maxLives={5}
          streak={streak}
          totalShots={totalShots}
          shootingMode={settings.shootingMode}
          onQuit={handleQuitGame}
          webcamActive={settings.cameraEnabled && mediaPipeStatus === 'READY'}
        />
      )}

      {/* 4. OVERLAYS SCREEN CONTROLLERS */}
      
      {/* Starting Control Panel Dashboard */}
      {gameState === GameState.START && (
        <StartScreen
          settings={settings}
          onChangeSettings={setSettings}
          onStartGame={handleStartGame}
          highScores={highScores}
          webcamActive={settings.cameraEnabled}
          onToggleWebcam={handleToggleWebcam}
          hasTriedCamera={mediaPipeStatus !== 'UNINITIALIZED'}
          cameraError={cameraError}
          isAdmin={isAdmin}
          onOpenDashboard={() => {
            setShowAdminDashboard(true);
            sfx.playPinchTick(); // play soft click
          }}
          onLogin={handleAdminLogin}
        />
      )}

      {/* Admin Control Dashboard overlay modal */}
      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => {
            setShowAdminDashboard(false);
            sfx.playPinchTick();
          }}
          onLogout={handleAdminLogout}
        />
      )}

      {/* Admin Authorization Login Overlay Checkpoint */}
      {showLoginModal && (
        <AdminLoginModal
          onClose={() => {
            setShowLoginModal(false);
            sfx.playPinchTick();
          }}
          onGoogleSignIn={handleAdminGoogleSignIn}
          onPasscodeSignIn={handleAdminPasscodeSignIn}
        />
      )}

      {/* High-Contrast Action Countdown Screen */}
      {gameState === GameState.COUNTDOWN && (
        <div id="countdown-screen" className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center font-mono uppercase text-white select-none">
          <div className="bg-black border-8 border-white p-8 md:p-12 max-w-md w-full text-center shadow-[16px_16px_0px_#ff0000]">
            <div className="text-[10px] text-zinc-400 mb-6 font-bold tracking-widest animate-pulse">
              [SIGHT CALIBRATION ENGAGED]
            </div>
            <div id="countdown-number" className="text-8xl md:text-9xl font-black text-white drop-shadow-[8px_8px_0px_#ff0000] [text-shadow:6px_6px_0px_#ff0000] animate-bounce">
              {countdownNum}
            </div>
            <div className="mt-8 text-nes-sky text-xs font-extrabold tracking-widest animate-pulse">
              {countdownNum === 1 ? 'ENGAGE SIGHTS!' : 'CALIBRATING INDEX SIGHTS...'}
            </div>
          </div>
        </div>
      )}

      {/* Nostalgic GameOver Breakdown screen */}
      {gameState === GameState.GAMEOVER && (
        <GameOverScreen
          score={score}
          totalShots={totalShots}
          totalHits={totalHits}
          onRestart={handleStartGame}
          onSaveScore={handleSaveHighScore}
          highScores={highScores}
        />
      )}

      {/* MediaPipe Camera Loading Matrix (Brief loader) */}
      {settings.cameraEnabled && mediaPipeStatus === 'LOADING' && gameState !== GameState.PLAYING && (
        <div className="absolute bottom-6 right-6 z-40 bg-black/90 p-4 border border-nes-sky rounded-sm font-press text-[8px] leading-relaxed max-w-sm flex items-center gap-3 animate-fadeIn shadow-lg">
          <RefreshCw className="w-4 h-4 text-nes-sky animate-spin flex-shrink-0" />
          <div>
            <div className="text-white uppercase font-bold text-[9px]">SIGHT HARNESS ENABLING...</div>
            <div className="text-zinc-500 mt-0.5">Please allow camera permissions and stay centered in bright illumination!</div>
          </div>
        </div>
      )}

      {/* Helpful Hover lock indicator floating warning */}
      {gameState === GameState.PLAYING && settings.shootingMode === 'HOVER' && (
        <div className="absolute bottom-4 left-4 z-20 bg-black/80 px-3 py-1.5 border border-yellow-500 rounded-sm font-press text-[6px] text-yellow-300 pointer-events-none animate-pulse">
          🎯 HOVER LOCK AUTOMATIC: Hold sight over duck to charge target fire!
        </div>
      )}

    </main>
  );
}
