import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const canvasContainer = document.getElementById('canvas-container');
const loadingDiv = document.getElementById('loading');
const loadingBar = document.getElementById('loading-bar');
const loadingPercent = document.getElementById('loading-percent');
const mapButtons = document.querySelectorAll('.map-btn');
const speedValue = document.getElementById('speed-value');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a3e);
scene.fog = null;

const starGeometry = new THREE.BufferGeometry();
const starCount = 600;
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 3000;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 3000;
    starSizes[i] = Math.random() * 3 + 0.5;
    const hue = 0.7 + Math.random() * 0.15;
    const color = new THREE.Color().setHSL(hue, 0.6, 0.6 + Math.random() * 0.4);
    starColors[i * 3] = color.r;
    starColors[i * 3 + 1] = color.g;
    starColors[i * 3 + 2] = color.b;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starTexture = createStarTexture();
const starMaterial = new THREE.PointsMaterial({
    map: starTexture,
    size: 4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8,
    vertexColors: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const sparkles = [];
for (let i = 0; i < 8; i++) {
    const sGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const sMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.7 + Math.random() * 0.2, 0.8, 0.8), transparent: true, opacity: 0 });
    const sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30);
    scene.add(sMesh);
    sparkles.push({
        mesh: sMesh,
        target: new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30),
        life: Math.random() * 5,
        maxLife: 2 + Math.random() * 4
    });
}

function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.1, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(200,180,255,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
canvasContainer.appendChild(renderer.domElement);

const trailCanvas = document.getElementById('mouse-trail');
const trailCtx = trailCanvas.getContext('2d');
trailCanvas.width = window.innerWidth;
trailCanvas.height = window.innerHeight;
const trailDots = [];
let mouseX = -100, mouseY = -100;
let mouseOnScreen = false;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseOnScreen = true;
});
document.addEventListener('mouseleave', () => { mouseOnScreen = false; });

function drawTrail() {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    if (mouseOnScreen && !isMouseLocked) {
        trailDots.push({ x: mouseX, y: mouseY, life: 1, size: 4 + Math.random() * 3 });
    }
    if (trailDots.length > 100) trailDots.splice(0, trailDots.length - 100);
    for (let i = trailDots.length - 1; i >= 0; i--) {
        const d = trailDots[i];
        d.life -= 0.03;
        if (d.life <= 0) { trailDots.splice(i, 1); continue; }
        trailCtx.beginPath();
        trailCtx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2);
        trailCtx.fillStyle = `rgba(180, 160, 255, ${d.life * 0.6})`;
        trailCtx.fill();
    }
}

window.addEventListener('resize', () => {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
});

const snowCanvas = document.getElementById('snow-canvas');
const snowCtx = snowCanvas.getContext('2d');
snowCanvas.width = window.innerWidth;
snowCanvas.height = window.innerHeight;
const snowflakes = [];
for (let i = 0; i < 60; i++) {
    snowflakes.push({
        x: Math.random() * snowCanvas.width,
        y: Math.random() * snowCanvas.height,
        r: 0.5 + Math.random() * 2.5,
        speed: 0.3 + Math.random() * 1.2,
        wind: (Math.random() - 0.5) * 0.5,
        opacity: 0.3 + Math.random() * 0.7
    });
}

function drawSnow() {
    snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    if (isMouseLocked) return;
    const windBase = Math.sin(Date.now() * 0.001) * 0.3;
    for (const s of snowflakes) {
        s.y += s.speed;
        s.x += s.wind + windBase;
        if (s.y > snowCanvas.height + 10) { s.y = -10; s.x = Math.random() * snowCanvas.width; }
        if (s.x > snowCanvas.width + 10) s.x = -10;
        if (s.x < -10) s.x = snowCanvas.width + 10;
        snowCtx.beginPath();
        snowCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        snowCtx.fillStyle = `rgba(220, 220, 255, ${s.opacity})`;
        snowCtx.fill();
    }
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

const townLight = new THREE.DirectionalLight(0xffffff, 1.2);
townLight.position.set(0, 5, -15);
scene.add(townLight);

const clock = new THREE.Clock();

let moveSpeed = 100;
const speedMin = 10;
const speedMax = 300;

let yaw = 0;
let pitch = 0;
const mouseSensitivity = 0.002;
const pitchMin = -Math.PI / 2.1;
const pitchMax = Math.PI / 2.1;

const keyStates = {};
let isMouseLocked = false;

let bookTownModel = null;
let skyShipModel = null;
let winterSceneModel = null;
let mountainRiverModel = null;
let currentMap = null;

let savedPosition = null;
let savedYaw = 0;
let savedPitch = 0;

let camTarget = null;
let yawTarget = 0;
let pitchTarget = 0;
let isTransitioning = false;
let transitionDuration = 1.2;
let transitionElapsed = 0;
let camStart = new THREE.Vector3();
let yawStart = 0;
let pitchStart = 0;

// movement smoothing state
let velocity = new THREE.Vector3();
let currentSpeed = 0;
const acceleration = 25;
const deceleration = 18;
const movementLerp = 10;
const _forward = new THREE.Vector3(0, 0, -1);
const _right = new THREE.Vector3(1, 0, 0);
const _direction = new THREE.Vector3();
const _targetVelocity = new THREE.Vector3();

document.addEventListener('keydown', (event) => {
    keyStates[event.code] = true;
    if (event.code === 'F11') {
        event.preventDefault();
        toggleFullscreen();
        return;
    }
    if (event.code === 'Escape' && isMouseLocked) {
        document.exitPointerLock();
    }
    if (event.code === 'KeyF' && isMouseLocked && !event.repeat) {
        savedPosition = camera.position.clone();
        savedYaw = yaw;
        savedPitch = pitch;
        const markerEl = document.getElementById('marker-info');
        if (markerEl) {
            markerEl.style.display = 'block';
            markerEl.innerHTML = '✦ 已标记梦境坐标 | 按 G 回溯 ✦';
        }
    }
    if (event.code === 'KeyG' && isMouseLocked && !event.repeat && savedPosition) {
        camera.position.copy(savedPosition);
        yaw = savedYaw;
        pitch = savedPitch;
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('keyup', (event) => {
    keyStates[event.code] = false;
});

renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        isMouseLocked = true;
        document.getElementById('ui').style.display = 'none';
        document.getElementById('map-switch').style.display = 'none';
        dreamTitle.style.opacity = '0';
        document.body.style.cursor = 'none';
        trailCanvas.style.display = 'none';
        snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    } else {
        isMouseLocked = false;
        document.getElementById('ui').style.display = 'block';
        document.getElementById('map-switch').style.display = 'block';
        dreamTitle.style.opacity = '1';
        document.body.style.cursor = '';
        trailCanvas.style.display = 'block';
    }
});

let mouseDeltaX = 0;
let mouseDeltaY = 0;

document.addEventListener('mousemove', (event) => {
    if (!isMouseLocked) return;
    mouseDeltaX += event.movementX;
    mouseDeltaY += event.movementY;
});

document.addEventListener('wheel', (event) => {
    event.preventDefault();
    moveSpeed -= event.deltaY * 0.05;
    moveSpeed = Math.max(speedMin, Math.min(speedMax, moveSpeed));
    speedValue.textContent = Math.round(moveSpeed);
}, { passive: false });

function loadGLTFModel(url, onLoad, onProgress) {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(url, (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });
        onLoad(model);
    }, (progress) => {
        if (onProgress && progress.total > 0) {
            onProgress(progress.loaded, progress.total);
        }
    }, (error) => {
        console.error('Error loading model:', error);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = '模型加载失败';
            loadingText.style.color = 'rgba(255, 120, 120, 0.9)';
        }
    });
}

function updateCamera(deltaTime) {
    deltaTime = Math.min(deltaTime, 0.1);

    if (!isMouseLocked) return;

    yaw -= mouseDeltaX * mouseSensitivity;
    pitch -= mouseDeltaY * mouseSensitivity;
    pitch = Math.max(pitchMin, Math.min(pitchMax, pitch));
    mouseDeltaX = 0;
    mouseDeltaY = 0;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    _forward.set(0, 0, -1);
    _forward.applyQuaternion(camera.quaternion);
    _forward.y = 0;
    _forward.normalize();

    _right.set(1, 0, 0);
    _right.applyQuaternion(camera.quaternion);
    _right.y = 0;
    _right.normalize();

    _direction.set(0, 0, 0);

    if (keyStates['KeyW']) _direction.add(_forward);
    if (keyStates['KeyS']) _direction.sub(_forward);
    if (keyStates['KeyA']) _direction.sub(_right);
    if (keyStates['KeyD']) _direction.add(_right);
    if (keyStates['KeyQ']) _direction.y += 1;
    if (keyStates['KeyE']) _direction.y -= 1;

    const isMoving = _direction.length() > 0;
    if (isMoving) {
        _direction.normalize();
        currentSpeed = Math.min(currentSpeed + acceleration * deltaTime, moveSpeed);
    } else {
        currentSpeed = Math.max(currentSpeed - deceleration * deltaTime, 0);
    }

    _targetVelocity.set(0, 0, 0);
    if (isMoving) {
        _targetVelocity.copy(_direction).multiplyScalar(currentSpeed);
    }

    velocity.lerp(_targetVelocity, Math.min(1, deltaTime * movementLerp));

    camera.position.addScaledVector(velocity, deltaTime);
}

function switchMap(mapName) {
    if (currentMap === mapName) return;

    if (isMouseLocked) {
        document.exitPointerLock();
    }

    const sceneNameEl = document.getElementById('scene-name');
    const names = { book_town: '书本小镇', sky_ship: '天空小船', winter: '冬天', start: '梦境·起始', mountain_river: '山河图' };
    if (sceneNameEl) {
        sceneNameEl.textContent = names[mapName] || mapName;
        sceneNameEl.style.opacity = '1';
        setTimeout(() => { sceneNameEl.style.opacity = '0'; }, 1500);
    }

    camStart.copy(camera.position);
    yawStart = yaw;
    pitchStart = pitch;

    if (mapName === 'book_town') {
        camTarget = new THREE.Vector3(181, -192, -1446);
        yawTarget = 29.3 * Math.PI / 180;
        pitchTarget = 8.4 * Math.PI / 180;
    } else if (mapName === 'sky_ship') {
        camTarget = new THREE.Vector3(-498, -40, -775);
        yawTarget = -33.9 * Math.PI / 180;
        pitchTarget = -14.6 * Math.PI / 180;
    } else if (mapName === 'winter') {
        camTarget = new THREE.Vector3(551, 160, -1218);
        yawTarget = 8 * Math.PI / 180;
        pitchTarget = -10.8 * Math.PI / 180;
    } else if (mapName === 'start') {
        camTarget = new THREE.Vector3(-818, 160, 30.5);
        yawTarget = -30.6 * Math.PI / 180;
        pitchTarget = -9.4 * Math.PI / 180;
    } else if (mapName === 'mountain_river') {
        camTarget = new THREE.Vector3(449, 72.2, -2538);
        yawTarget = 378 * Math.PI / 180;
        pitchTarget = -7.8 * Math.PI / 180;
    }

    transitionElapsed = 0;
    isTransitioning = true;

    currentMap = mapName;

    mapButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.map === mapName);
    });
}

mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchMap(btn.dataset.map);
    });
});

let frameCount = 0;
function animate(timestamp) {
    requestAnimationFrame(animate);
    frameCount++;
    if (!isMouseLocked) {
        drawTrail();
        drawSnow();
    }

    const deltaTime = clock.getDelta();

    if (isTransitioning) {
        transitionElapsed += deltaTime;
        const t = Math.min(transitionElapsed / transitionDuration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(camStart, camTarget, ease);
        yaw = yawStart + (yawTarget - yawStart) * ease;
        pitch = pitchStart + (pitchTarget - pitchStart) * ease;
        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;

        if (t >= 1) {
            isTransitioning = false;
        }
    } else {
        updateCamera(deltaTime);
    }

    stars.rotation.y += deltaTime * 0.02;
    stars.rotation.x += deltaTime * 0.01;
    starMaterial.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.2;

    sparkles.forEach(s => {
        s.life += deltaTime;
        const progress = s.life / s.maxLife;
        s.mesh.position.lerp(s.target, deltaTime * 0.5);
        s.mesh.material.opacity = progress < 0.3 ? progress / 0.3 : 0.8 * (1 - progress);
        if (progress >= 1) {
            const r = 15 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            s.mesh.position.set(
                camera.position.x + r * Math.sin(phi) * Math.cos(theta),
                camera.position.y + r * Math.sin(phi) * Math.sin(theta),
                camera.position.z + r * Math.cos(phi)
            );
            s.target.set(
                camera.position.x + (Math.random() - 0.5) * 30,
                camera.position.y + (Math.random() - 0.5) * 20,
                camera.position.z + (Math.random() - 0.5) * 30
            );
            s.life = 0;
            s.maxLife = 2 + Math.random() * 4;
            s.mesh.material.opacity = 0;
        }
    });

    frameCount++;
    if (frameCount % 10 === 0) {
        const posEl = document.getElementById('pos-display');
        if (posEl) {
            posEl.textContent = `x: ${camera.position.x.toFixed(1)} | y: ${camera.position.y.toFixed(1)} | z: ${camera.position.z.toFixed(1)} | yaw: ${(yaw * 180 / Math.PI).toFixed(1)}° | pitch: ${(pitch * 180 / Math.PI).toFixed(1)}°`;
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

const dreamTitle = document.getElementById('dream-title');
let titleOpacity = 1;

function init() {
    let loadedCount = 0;
    const totalModels = 4;
    const modelNames = ['天空小船', '书本小镇', '冬天', '山河图'];

    const modelProgress = [0, 0, 0, 0];
    const modelTotals = [0, 0, 0, 0];

    let currentPercent = 0;
    let targetPercent = 0;
    let animFrame = null;

    function animateProgressBar() {
        const diff = targetPercent - currentPercent;
        if (Math.abs(diff) < 0.5) {
            currentPercent = targetPercent;
        } else {
            currentPercent += diff * 0.08;
        }
        if (loadingBar) {
            loadingBar.style.width = Math.round(currentPercent) + '%';
        }
        if (loadingPercent) {
            loadingPercent.textContent = Math.round(currentPercent) + '%';
        }
        if (currentPercent < targetPercent) {
            animFrame = requestAnimationFrame(animateProgressBar);
        }
    }

    function updateProgress() {
        const totalLoaded = modelProgress.reduce((a, b) => a + b, 0);
        const totalSize = modelTotals.reduce((a, b) => a + b, 0);
        if (totalSize > 0) {
            targetPercent = Math.min((totalLoaded / totalSize) * 100, 100);
        } else {
            targetPercent = (loadedCount / totalModels) * 100;
        }
        const loadingText = document.getElementById('loading-text');
        if (loadingText && loadedCount < totalModels) {
            loadingText.textContent = '✦ 正在加载 ' + modelNames[Math.min(loadedCount, totalModels - 1)] + ' (' + (loadedCount + 1) + '/' + totalModels + ') ✦';
        }
        if (!animFrame) {
            animFrame = requestAnimationFrame(animateProgressBar);
        }
    }

    function onModelLoaded(modelIndex) {
        modelProgress[modelIndex] = modelTotals[modelIndex] || 1;
        loadedCount++;
        updateProgress();
        if (loadedCount >= totalModels) {
            targetPercent = 100;
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.textContent = '✦ 梦 境 加 载 完 成 ✦';
            const checkDone = setInterval(() => {
                if (currentPercent >= 99) {
                    clearInterval(checkDone);
                    loadingDiv.style.opacity = '0';
                    setTimeout(() => {
                        loadingDiv.style.display = 'none';
                    }, 800);
                    dreamTitle.style.transition = 'opacity 1.5s';
                    dreamTitle.style.opacity = '1';
                    document.getElementById('ui').style.display = 'block';
                    document.getElementById('map-switch').style.display = 'block';
                }
            }, 50);
        }
    }

    loadGLTFModel('sky_ship.glb', (model) => {
        skyShipModel = model;
        skyShipModel.scale.set(500, 500, 500);
        skyShipModel.position.set(0, 5, 0);
        skyShipModel.visible = true;
        scene.add(skyShipModel);
        onModelLoaded(0);
    }, (loaded, total) => {
        modelProgress[0] = loaded;
        modelTotals[0] = total;
        updateProgress();
    });

    loadGLTFModel('book_town.glb', (townModel) => {
        bookTownModel = townModel;
        bookTownModel.scale.set(0.01 * 500, 0.01 * 500, 0.01 * 500);
        bookTownModel.position.set(0 * 500, -0.4 * 500, -3.3 * 500);
        bookTownModel.visible = true;
        scene.add(bookTownModel);
        onModelLoaded(1);
    }, (loaded, total) => {
        modelProgress[1] = loaded;
        modelTotals[1] = total;
        updateProgress();
    });

    loadGLTFModel('winter_scene.glb', (winterModel) => {
        winterSceneModel = winterModel;
        winterSceneModel.scale.set(0.01 * 800, 0.01 * 800, 0.01 * 800);
        winterSceneModel.position.set(576, 95, -1293);
        winterSceneModel.rotation.y = Math.PI;
        winterSceneModel.visible = true;
        scene.add(winterSceneModel);
        onModelLoaded(2);
    }, (loaded, total) => {
        modelProgress[2] = loaded;
        modelTotals[2] = total;
        updateProgress();
    });

    loadGLTFModel('mountain_and_river_scroll.glb', (mountainModel) => {
        mountainRiverModel = mountainModel;
        mountainRiverModel.scale.set(0.01 * 800, 0.01 * 800, 0.01 * 800);
        mountainRiverModel.position.set(78.3, -234, -2723);
        mountainRiverModel.rotation.y = -Math.PI / 2;
        mountainRiverModel.visible = true;
        scene.add(mountainRiverModel);
        onModelLoaded(3);
    }, (loaded, total) => {
        modelProgress[3] = loaded;
        modelTotals[3] = total;
        updateProgress();
    });

    camera.position.set(-818, 160, 30.5);
    yaw = -30.6 * Math.PI / 180;
    pitch = -9.4 * Math.PI / 180;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

init();
animate();