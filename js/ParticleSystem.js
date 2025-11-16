import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position, color) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const colors = [];

        // 파티클 생성
        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            // 랜덤 방향으로 속도 설정
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 5 + Math.random() * 10;

            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );

            // 색상 설정
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

        // 파티클 데이터 저장
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
