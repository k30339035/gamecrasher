import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld.js';
import { Building } from './Building.js';
import { ParticleSystem } from './ParticleSystem.js';
import { GameManager } from './GameManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physicsWorld = null;
        this.building = null;
        this.particleSystem = null;
        this.gameManager = null;

        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        // Three.js 초기화
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupEnvironment();

        // 물리 엔진 초기화
        this.physicsWorld = new PhysicsWorld();

        // 파티클 시스템
        this.particleSystem = new ParticleSystem(this.scene);

        // 게임 매니저
        this.gameManager = new GameManager();
        this.setupGameEvents();

        // 이벤트 리스너
        this.setupEventListeners();

        // 애니메이션 시작
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();

        // 현실적인 하늘 그라데이션
        const skyColor = new THREE.Color(0xa0d8f1);
        const horizonColor = new THREE.Color(0xe6f2ff);
        this.scene.background = skyColor;
        this.scene.fog = new THREE.Fog(horizonColor, 80, 200);

        // 환경 큐브맵 (반사용)
        this.createEnvironmentMap();
    }

    createEnvironmentMap() {
        // 간단한 큐브맵 생성 (하늘 시뮬레이션)
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });

        const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
        this.scene.environment = cubeRenderTarget.texture;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(25, 20, 35);
        this.camera.lookAt(0, 10, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 고급 렌더링 설정
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
    }

    setupLights() {
        // 부드러운 주변광 (하늘 빛)
        const ambientLight = new THREE.AmbientLight(0xb3d9ff, 0.4);
        this.scene.add(ambientLight);

        // 태양광 (메인 조명)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(50, 60, 30);
        sunLight.castShadow = true;

        // 고품질 그림자 설정
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);

        // 반대편 채우기 조명 (부드러운 그림자)
        const fillLight = new THREE.DirectionalLight(0x9db4c8, 0.3);
        fillLight.position.set(-30, 20, -30);
        this.scene.add(fillLight);

        // 하늘 반사광 (위에서)
        const skyLight = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.5);
        this.scene.add(skyLight);
    }

    setupEnvironment() {
        // 도시 바닥 (콘크리트/아스팔트)
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.85,
            metalness: 0.15
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 도시 그리드 (도로 라인)
        const gridHelper = new THREE.GridHelper(200, 40, 0x555555, 0x444444);
        gridHelper.position.y = -4.95;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // 주변 건물 실루엣 (분위기용)
        this.createCityscape();
    }

    createCityscape() {
        const buildingColors = [0x4a4a4a, 0x5a5a5a, 0x3a3a3a];

        for (let i = 0; i < 15; i++) {
            const width = 5 + Math.random() * 10;
            const height = 20 + Math.random() * 40;
            const depth = 5 + Math.random() * 10;

            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                roughness: 0.8,
                metalness: 0.2
            });

            const building = new THREE.Mesh(geometry, material);

            // 원형으로 배치
            const angle = (i / 15) * Math.PI * 2;
            const radius = 80 + Math.random() * 30;
            building.position.x = Math.cos(angle) * radius;
            building.position.z = Math.sin(angle) * radius;
            building.position.y = height / 2 - 5;

            building.castShadow = true;
            building.receiveShadow = true;

            this.scene.add(building);
        }
    }

    setupGameEvents() {
        this.gameManager.on('onStart', () => {
            this.startLevel();
        });

        this.gameManager.on('onNextLevel', () => {
            this.startLevel();
        });

        this.gameManager.on('onRestart', () => {
            this.startLevel();
        });
    }

    startLevel() {
        // 기존 건물 제거
        if (this.building) {
            this.building.cleanup();
        }

        // 물리 세계 리셋
        this.physicsWorld.reset();

        // 새 건물 생성
        this.building = new Building(
            this.scene,
            this.physicsWorld,
            this.gameManager.currentLevel
        );

        // UI 업데이트
        this.gameManager.updateUI(
            this.building.getRemainingBlocks(),
            this.building.getTotalBlocks()
        );
    }

    setupEventListeners() {
        // 마우스 클릭
        window.addEventListener('click', (event) => this.onMouseClick(event));

        // 터치 이벤트
        window.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseClick(mouseEvent);
        }, { passive: false });

        // 윈도우 리사이즈
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onMouseClick(event) {
        if (!this.gameManager.isGameActive() || !this.building) return;

        // 마우스 좌표를 정규화된 디바이스 좌표로 변환
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 레이캐스팅
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;

            // 블록인지 확인
            if (clickedObject.userData && clickedObject.userData.block) {
                const block = clickedObject.userData.block;

                if (!block.isDestroyed) {
                    // 충격 적용
                    const impulsePower = 15;
                    const clickPoint = intersects[0].point;
                    const direction = new THREE.Vector3()
                        .subVectors(clickPoint, this.camera.position)
                        .normalize();

                    const impulse = {
                        x: direction.x * impulsePower,
                        y: direction.y * impulsePower,
                        z: direction.z * impulsePower
                    };

                    const localPoint = {
                        x: clickPoint.x - block.body.position.x,
                        y: clickPoint.y - block.body.position.y,
                        z: clickPoint.z - block.body.position.z
                    };

                    block.applyImpulse(impulse, localPoint);

                    // 파티클 효과 (재질별 효과)
                    this.particleSystem.createExplosion(
                        clickPoint,
                        block.mesh.material.color.getHex(),
                        block.blockType
                    );

                    // 블록 파괴
                    block.destroy();

                    // 점수 추가
                    const points = this.gameManager.currentLevel * 10;
                    this.gameManager.addScore(points);

                    // UI 업데이트
                    this.gameManager.updateUI(
                        this.building.getRemainingBlocks(),
                        this.building.getTotalBlocks()
                    );

                    // 모든 블록이 파괴되었는지 확인
                    if (this.building.getRemainingBlocks() === 0) {
                        setTimeout(() => {
                            this.gameManager.levelComplete();
                        }, 1000);
                    }
                }
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // 물리 업데이트
        if (this.physicsWorld) {
            this.physicsWorld.update(deltaTime);
        }

        // 건물 업데이트
        if (this.building) {
            this.building.update();
        }

        // 파티클 업데이트
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }

        // 부드러운 카메라 궤도 애니메이션
        const time = this.clock.getElapsedTime();
        const radius = 40;
        const height = 20;
        const speed = 0.08;

        this.camera.position.x = Math.sin(time * speed) * radius;
        this.camera.position.z = Math.cos(time * speed) * radius;
        this.camera.position.y = height + Math.sin(time * speed * 0.5) * 5;

        // 건물 중심을 바라보기
        if (this.building && this.building.blocks.length > 0) {
            const avgY = this.gameManager.currentLevel * 2 + 5;
            this.camera.lookAt(0, avgY, 0);
        } else {
            this.camera.lookAt(0, 10, 0);
        }

        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }
}

// 게임 시작
new Game();
