import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position, color, blockType = 'default') {
        // 재질에 따른 파티클 효과
        switch(blockType) {
            case 'glass':
                this.createGlassShatter(position);
                break;
            case 'concrete':
                this.createConcreteDebris(position);
                break;
            case 'steel':
            case 'window_frame':
                this.createMetalSparks(position);
                break;
            default:
                this.createDefaultExplosion(position, color);
        }
    }

    createGlassShatter(position) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];
        const sizes = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 8 + Math.random() * 15;

            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 5,
                Math.cos(phi) * speed
            );

            // 유리 파편 색상 (반짝이는 청록색)
            const brightness = 0.7 + Math.random() * 0.3;
            colors.push(brightness, brightness, 1.0);
            sizes.push(0.2 + Math.random() * 0.3);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        this.particles.push({
            system: particleSystem,
            velocities: velocities,
            life: 1.5,
            decay: 0.015
        });
    }

    createConcreteDebris(position) {
        const particleCount = 40;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.7;
            const speed = 3 + Math.random() * 8;

            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 3,
                Math.cos(phi) * speed
            );

            // 콘크리트 먼지와 파편 (회색)
            const gray = 0.4 + Math.random() * 0.3;
            colors.push(gray, gray, gray + 0.05);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        this.particles.push({
            system: particleSystem,
            velocities: velocities,
            life: 1.2,
            decay: 0.018
        });
    }

    createMetalSparks(position) {
        const particleCount = 35;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const speed = 6 + Math.random() * 12;

            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 4,
                Math.cos(phi) * speed
            );

            // 스파크 (주황/노랑)
            const r = 1.0;
            const g = 0.6 + Math.random() * 0.4;
            const b = Math.random() * 0.3;
            colors.push(r, g, b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        this.particles.push({
            system: particleSystem,
            velocities: velocities,
            life: 0.8,
            decay: 0.03
        });
    }

    createDefaultExplosion(position, color) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 5 + Math.random() * 10;

            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );

            const c = new THREE.Color(color);
            colors.push(c.r, c.g, c.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        this.particles.push({
            system: particleSystem,
            velocities: velocities,
            life: 1.0,
            decay: 0.02
        });
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            const positions = particle.system.geometry.attributes.position.array;

            // 각 파티클 업데이트
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += particle.velocities[i] * deltaTime;
                positions[i + 1] += particle.velocities[i + 1] * deltaTime;
                positions[i + 2] += particle.velocities[i + 2] * deltaTime;

                // 중력 적용
                particle.velocities[i + 1] -= 20 * deltaTime;
            }

            particle.system.geometry.attributes.position.needsUpdate = true;

            // 수명 감소
            particle.life -= particle.decay;
            particle.system.material.opacity = particle.life;

            // 수명이 다한 파티클 제거
            if (particle.life <= 0) {
                this.scene.remove(particle.system);
                particle.system.geometry.dispose();
                particle.system.material.dispose();
                return false;
            }

            return true;
        });
    }

    cleanup() {
        this.particles.forEach(particle => {
            this.scene.remove(particle.system);
            particle.system.geometry.dispose();
            particle.system.material.dispose();
        });
        this.particles = [];
    }
}
