import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -30, 0)
        });

        // 물리 성능 최적화
        this.world.solver.iterations = 10;
        this.world.allowSleep = true;

        // 충돌 감지 최적화
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);

        // 바닥 생성
        this.createGround();

        // 물리 바디와 메시 매핑
        this.bodies = [];
    }

    createGround() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // 정적 바디
            shape: groundShape,
            material: new CANNON.Material()
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        groundBody.position.y = -5;
        this.world.addBody(groundBody);
    }

    addBody(body) {
        this.world.addBody(body);
        this.bodies.push(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    applyImpulse(body, impulse, worldPoint) {
        body.applyImpulse(impulse, worldPoint);
    }

    update(deltaTime) {
        // 고정된 타임스텝으로 물리 업데이트
        this.world.step(1 / 60, deltaTime, 3);
    }

    reset() {
        // 모든 바디 제거 (바닥 제외)
        while (this.bodies.length > 0) {
            this.removeBody(this.bodies[0]);
        }
    }
}
