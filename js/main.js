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
        this.scene.background = new THREE.Color(0x87ceeb); // 하늘색
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 100);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 5, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupLights() {
        // 주변광
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 태양광
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(20, 30, 20);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        this.scene.add(sunLight);

        // 포인트 라이트 (다이나믹한 효과)
        const pointLight = new THREE.PointLight(0xffa500, 0.5, 50);
        pointLight.position.set(0, 20, 0);
        this.scene.add(pointLight);
    }

    setupEnvironment() {
        // 바닥
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c59,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 그리드 헬퍼 (선택사항)
        const gridHelper = new THREE.GridHelper(100, 50, 0x000000, 0x000000);
        gridHelper.position.y = -4.9;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
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

                    // 파티클 효과
                    this.particleSystem.createExplosion(
                        clickPoint,
                        block.mesh.material.color.getHex()
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

        // 카메라 애니메이션 (살짝 회전)
        const time = this.clock.getElapsedTime();
        this.camera.position.x = Math.sin(time * 0.1) * 5;

        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }
}

// 게임 시작
new Game();
