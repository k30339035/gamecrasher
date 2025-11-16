import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class BuildingBlock {
    constructor(x, y, z, width, height, depth, color, physicsWorld) {
        this.physicsWorld = physicsWorld;
        this.isDestroyed = false;

        // Three.js 메시 생성
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.block = this; // 역참조를 위해

        // Cannon.js 물리 바디 생성
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        this.body = new CANNON.Body({
            mass: 1,
            shape: shape,
            material: new CANNON.Material({
                friction: 0.3,
                restitution: 0.3
            })
        });
        this.body.position.set(x, y, z);
        this.body.userData = { block: this }; // 역참조

        physicsWorld.addBody(this.body);
    }

    update() {
        if (!this.isDestroyed) {
            // 물리 바디의 위치를 메시에 동기화
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);

            // 너무 아래로 떨어진 블록은 제거
            if (this.body.position.y < -20) {
                this.destroy();
            }
        }
    }

    applyImpulse(impulse, point) {
        this.body.applyImpulse(
            new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
            new CANNON.Vec3(point.x, point.y, point.z)
        );
        this.body.wakeUp();
    }

    destroy() {
        this.isDestroyed = true;
    }

    cleanup() {
        this.physicsWorld.removeBody(this.body);
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
    }
}

export class Building {
    constructor(scene, physicsWorld, level) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.level = level;
        this.blocks = [];

        this.createBuilding();
    }

    createBuilding() {
        const blockSize = 2;
        const spacing = 0.1;

        // 레벨에 따라 건물 크기와 복잡도 증가
        const baseWidth = Math.min(3 + Math.floor(level / 2), 7);
        const baseDepth = Math.min(3 + Math.floor(level / 2), 7);
        const height = Math.min(5 + level, 15);

        // 다양한 색상 팔레트
        const colorPalettes = [
            [0xff6b6b, 0xee5a6f, 0xc44569], // 빨강
            [0x4ecdc4, 0x44a08d, 0x5f9ea0], // 청록
            [0xf7b731, 0xf39c12, 0xe67e22], // 주황
            [0x5f27cd, 0x6c5ce7, 0x786fa6], // 보라
            [0x26de81, 0x20bf6b, 0x2ecc71], // 녹색
            [0xff6348, 0xff4757, 0xfc5c65], // 산호
            [0x778beb, 0x546de5, 0x3867d6], // 파랑
            [0xf8a5c2, 0xf78fb3, 0xe74c3c], // 분홍
            [0xfed330, 0xf9ca24, 0xf0932b], // 노랑
            [0x6a89cc, 0x4a69bd, 0x303952]  // 남색
        ];

        const palette = colorPalettes[level % colorPalettes.length];

        // 건물 생성 - 복잡한 구조
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < baseWidth; x++) {
                for (let z = 0; z < baseDepth; z++) {
                    // 레벨이 높아질수록 구멍이 있는 복잡한 구조
                    const shouldSkip = level > 3 && Math.random() < 0.1;
                    if (shouldSkip) continue;

                    const posX = (x - baseWidth / 2) * (blockSize + spacing);
                    const posY = y * (blockSize + spacing);
                    const posZ = (z - baseDepth / 2) * (blockSize + spacing);

                    // 높이에 따라 색상 변화
                    const colorIndex = Math.floor((y / height) * palette.length);
                    const color = palette[Math.min(colorIndex, palette.length - 1)];

                    const block = new BuildingBlock(
                        posX,
                        posY,
                        posZ,
                        blockSize * 0.95,
                        blockSize * 0.95,
                        blockSize * 0.95,
                        color,
                        this.physicsWorld
                    );

                    this.blocks.push(block);
                    this.scene.add(block.mesh);
                }
            }
        }
    }

    update() {
        this.blocks.forEach(block => {
            block.update();
        });

        // 파괴된 블록 정리
        this.blocks = this.blocks.filter(block => {
            if (block.isDestroyed) {
                this.scene.remove(block.mesh);
                block.cleanup();
                return false;
            }
            return true;
        });
    }

    getRemainingBlocks() {
        return this.blocks.filter(block => !block.isDestroyed).length;
    }

    getTotalBlocks() {
        return this.blocks.length;
    }

    cleanup() {
        this.blocks.forEach(block => {
            this.scene.remove(block.mesh);
            block.cleanup();
        });
        this.blocks = [];
    }
}
