import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// 블록 타입 열거
export const BlockType = {
    CONCRETE: 'concrete',
    GLASS: 'glass',
    STEEL: 'steel',
    WINDOW_FRAME: 'window_frame'
};

export class BuildingBlock {
    constructor(x, y, z, width, height, depth, blockType, physicsWorld) {
        this.physicsWorld = physicsWorld;
        this.isDestroyed = false;
        this.blockType = blockType;

        // Three.js 메시 생성
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = this.createMaterial(blockType);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.block = this; // 역참조를 위해

        // Cannon.js 물리 바디 생성
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const mass = this.getMass(blockType);

        this.body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: new CANNON.Material({
                friction: 0.4,
                restitution: 0.2
            })
        });
        this.body.position.set(x, y, z);
        this.body.userData = { block: this }; // 역참조

        physicsWorld.addBody(this.body);
    }

    createMaterial(blockType) {
        switch(blockType) {
            case BlockType.CONCRETE:
                // 콘크리트 - 회색 계열, 거친 표면
                return new THREE.MeshStandardMaterial({
                    color: new THREE.Color(0.5 + Math.random() * 0.1, 0.5 + Math.random() * 0.1, 0.52 + Math.random() * 0.08),
                    roughness: 0.9,
                    metalness: 0.1,
                    flatShading: false
                });

            case BlockType.GLASS:
                // 유리 - 투명하고 반사적
                return new THREE.MeshPhysicalMaterial({
                    color: 0x88ccff,
                    metalness: 0.1,
                    roughness: 0.05,
                    transmission: 0.9,
                    transparent: true,
                    opacity: 0.4,
                    reflectivity: 0.9,
                    ior: 1.5,
                    thickness: 0.5
                });

            case BlockType.STEEL:
                // 강철 프레임 - 어두운 금속
                return new THREE.MeshStandardMaterial({
                    color: 0x2a2a2a,
                    roughness: 0.3,
                    metalness: 0.9,
                    envMapIntensity: 1.0
                });

            case BlockType.WINDOW_FRAME:
                // 창틀 - 알루미늄
                return new THREE.MeshStandardMaterial({
                    color: 0x606060,
                    roughness: 0.4,
                    metalness: 0.8
                });

            default:
                return new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 0.7,
                    metalness: 0.3
                });
        }
    }

    getMass(blockType) {
        // 재질에 따른 질량
        switch(blockType) {
            case BlockType.CONCRETE: return 2.0;
            case BlockType.GLASS: return 0.5;
            case BlockType.STEEL: return 3.0;
            case BlockType.WINDOW_FRAME: return 1.5;
            default: return 1.0;
        }
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
        const floorHeight = 3;  // 층 높이
        const wallThickness = 0.3;
        const windowSize = 1.2;
        const windowSpacing = 0.2;

        // 레벨에 따라 건물 크기와 복잡도 증가
        const buildingWidth = Math.min(8 + this.level * 2, 20);
        const buildingDepth = Math.min(8 + this.level * 2, 20);
        const numFloors = Math.min(3 + this.level, 12);

        // 현대식 건물 생성
        for (let floor = 0; floor < numFloors; floor++) {
            const floorY = floor * floorHeight;

            // 층 바닥 생성 (콘크리트)
            this.createFloor(buildingWidth, buildingDepth, floorY, wallThickness);

            // 외벽과 창문 생성
            this.createWalls(buildingWidth, buildingDepth, floorY, floorHeight, wallThickness, windowSize, windowSpacing);

            // 구조 기둥 (강철)
            if (floor < numFloors - 1) {
                this.createColumns(buildingWidth, buildingDepth, floorY, floorHeight, wallThickness);
            }
        }

        // 옥상 생성
        const roofY = numFloors * floorHeight;
        this.createRoof(buildingWidth, buildingDepth, roofY, wallThickness);
    }

    createFloor(width, depth, y, thickness) {
        const segmentsX = Math.floor(width / 2);
        const segmentsZ = Math.floor(depth / 2);

        for (let x = 0; x < segmentsX; x++) {
            for (let z = 0; z < segmentsZ; z++) {
                const posX = (x - segmentsX / 2) * 2 + 1;
                const posZ = (z - segmentsZ / 2) * 2 + 1;

                const block = new BuildingBlock(
                    posX, y, posZ,
                    2, thickness, 2,
                    BlockType.CONCRETE,
                    this.physicsWorld
                );

                this.blocks.push(block);
                this.scene.add(block.mesh);
            }
        }
    }

    createWalls(width, depth, y, height, thickness, windowSize, windowSpacing) {
        const wallHeight = height - 0.5;
        const windowY = y + height / 2;

        // 앞벽과 뒷벽
        for (let side = 0; side < 2; side++) {
            const zPos = side === 0 ? depth / 2 : -depth / 2;
            const numWindows = Math.floor(width / (windowSize + windowSpacing));

            for (let i = 0; i < numWindows; i++) {
                const xPos = (i - numWindows / 2) * (windowSize + windowSpacing) + (windowSize + windowSpacing) / 2;

                // 창문 (유리)
                const glassBlock = new BuildingBlock(
                    xPos, windowY, zPos,
                    windowSize, wallHeight * 0.7, thickness,
                    BlockType.GLASS,
                    this.physicsWorld
                );
                this.blocks.push(glassBlock);
                this.scene.add(glassBlock.mesh);

                // 창틀 (좌)
                const frameLeft = new BuildingBlock(
                    xPos - (windowSize / 2 + windowSpacing / 4), windowY, zPos,
                    windowSpacing / 2, wallHeight, thickness,
                    BlockType.WINDOW_FRAME,
                    this.physicsWorld
                );
                this.blocks.push(frameLeft);
                this.scene.add(frameLeft.mesh);
            }
        }

        // 옆벽
        for (let side = 0; side < 2; side++) {
            const xPos = side === 0 ? width / 2 : -width / 2;
            const numWindows = Math.floor(depth / (windowSize + windowSpacing));

            for (let i = 0; i < numWindows; i++) {
                const zPos = (i - numWindows / 2) * (windowSize + windowSpacing) + (windowSize + windowSpacing) / 2;

                // 창문 (유리)
                const glassBlock = new BuildingBlock(
                    xPos, windowY, zPos,
                    thickness, wallHeight * 0.7, windowSize,
                    BlockType.GLASS,
                    this.physicsWorld
                );
                this.blocks.push(glassBlock);
                this.scene.add(glassBlock.mesh);

                // 창틀
                const frame = new BuildingBlock(
                    xPos, windowY, zPos - (windowSize / 2 + windowSpacing / 4),
                    thickness, wallHeight, windowSpacing / 2,
                    BlockType.WINDOW_FRAME,
                    this.physicsWorld
                );
                this.blocks.push(frame);
                this.scene.add(frame.mesh);
            }
        }
    }

    createColumns(width, depth, y, height, size) {
        const positions = [
            { x: width / 2 - size, z: depth / 2 - size },
            { x: -width / 2 + size, z: depth / 2 - size },
            { x: width / 2 - size, z: -depth / 2 + size },
            { x: -width / 2 + size, z: -depth / 2 + size }
        ];

        positions.forEach(pos => {
            const column = new BuildingBlock(
                pos.x, y + height / 2, pos.z,
                size * 2, height, size * 2,
                BlockType.STEEL,
                this.physicsWorld
            );
            this.blocks.push(column);
            this.scene.add(column.mesh);
        });
    }

    createRoof(width, depth, y, thickness) {
        const segmentsX = Math.floor(width / 2);
        const segmentsZ = Math.floor(depth / 2);

        for (let x = 0; x < segmentsX; x++) {
            for (let z = 0; z < segmentsZ; z++) {
                const posX = (x - segmentsX / 2) * 2 + 1;
                const posZ = (z - segmentsZ / 2) * 2 + 1;

                const block = new BuildingBlock(
                    posX, y, posZ,
                    2, thickness * 1.5, 2,
                    BlockType.CONCRETE,
                    this.physicsWorld
                );

                this.blocks.push(block);
                this.scene.add(block.mesh);
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
