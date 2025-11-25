import * as THREE from "three";
// import GUI from 'lil-gui';

//  -- three.js scene settings -- 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 
    window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const color = 0xFFFFFF;
const intensity = 1;
const light = new THREE.AmbientLight(color, intensity);
scene.add(light);

const clock = new THREE.Clock();

const mouse = new THREE.Vector3(0, 0, 0);

// const gui = new GUI();
const boid_settings = {
    vis_range : 5,
    near_range : 2,
    grouping_strength : 0.95,
    separation_strength : 0.01,
    aligning_strength : 0.01,
    max_speed : 2.1
};
// gui.add(boid_settings, "vis_range", 3, 7);
// gui.add(boid_settings, "near_range", 1, boid_settings["vis_range"])
// gui.add(boid_settings, "grouping_strength", 0.9, 1);
// gui.add(boid_settings, "separation_strength", 0.005, 0.015);
// gui.add(boid_settings, "aligning_strength", 0.005, 0.015);
// gui.add(boid_settings, "max_speed", 1, 5);

function directionTo(to, from) {
    return to.clone().add(from.clone().negate()).normalize();
}

class Boid {
    constructor(pos) {
        this.pos = pos;
        this.vel = new THREE.Vector3(0, 0, 0);

        // Visible attributes
        this.size = 0.1;
        this.color = 0x0000FF;
        this.geometry = new THREE.Mesh(
            // new THREE.ConeGeometry(this.size, this.size * 2, 15), 
            new THREE.ConeGeometry(this.size, this.size),
            new THREE.MeshStandardMaterial({color:0x00FF00})
        );
        this.moveGeometry();
    }

    dist_r_boids(all_boids, r) {
        var close_boids = [];
        all_boids.forEach(boid => {
            if (this.pos.distanceTo(boid.pos) <= r && boid != this) {
                close_boids.push(boid);
            }
        });
        return close_boids;
    } 

    update(all_boids, dt) {
    
        // Get all boids in visible range from this
        var visible = this.dist_r_boids(all_boids, boid_settings['vis_range']);
        // If there are no boids visible, move and exit early
        if (visible.length < 1) {
            this.vel.clampLength(0, this.max_speed)
            this.pos.add(this.vel.clone().multiplyScalar(dt));
            this.moveGeometry();
            return;
        }

        this.visibleBoidActions(visible);
        
        // Get all boids in near range from this boid
        var near = this.dist_r_boids(all_boids, boid_settings['near_range']);
        // If there are no boids near, move and exit early
        if (visible.near < 1) {
            this.vel.clampLength(0, this.max_speed);
            this.pos.add(this.vel.clone().multiplyScalar(dt));
            this.moveGeometry();
            return;
        }

        this.nearBoidActions(near);

        // Move boid towards mouse position
        this.vel.add(directionTo(mouse.clone().multiplyScalar(8), this.pos).multiplyScalar(1));


        this.pos.add(this.vel.clone().multiplyScalar(dt));
        this.moveGeometry();
    }

    visibleBoidActions(visible_boids) {
        var visible_com = new THREE.Vector3();
        var visible_avg_vel = new THREE.Vector3();
        visible_boids.forEach(visible_boid => {
            visible_com.add(visible_boid.pos);
            visible_avg_vel.add(visible_boid.vel);
        });
        visible_com.divideScalar(visible_boids.length);
        visible_avg_vel.divideScalar(visible_boids.length);
     
        this.vel.add(directionTo(visible_com, this.pos)).multiplyScalar(boid_settings['grouping_strength']);
        this.vel.add(visible_avg_vel.add(this.vel.clone().negate()).multiplyScalar(boid_settings['aligning_strength']));
    }

    nearBoidActions(near_boids) {
        var separation_steering = new THREE.Vector3();;
        near_boids.forEach(near_boid => {
            separation_steering.add(directionTo(near_boid.pos, this.pos).negate().multiplyScalar(1 / this.pos.distanceTo(near_boid.pos)));
        });
        this.vel.add(separation_steering.multiplyScalar(boid_settings['separation_strength']));

    }

    moveGeometry() {
        this.geometry.translateX(-this.geometry.position.x + this.pos.x);
        this.geometry.translateY(-this.geometry.position.y + this.pos.y);
        this.geometry.translateZ(-this.geometry.position.z + this.pos.z);

        this.geometry.rotateX(0.01);
    }
}

var n = 400;
var boids = [];
for (let i=0; i < n; i++) {
    boids.push(new Boid(new THREE.Vector3().random().multiplyScalar(10).addScalar(-5)));
    scene.add(boids[i].geometry);
}

function animate() {
    var delta = clock.getDelta();
    renderer.render(scene, camera);
    boids.forEach(boid => boid.update(boids, delta));
    // console.log(delta);
    
    console.log(mouse);
}

renderer.setAnimationLoop(animate);

document.getElementById("main_body").addEventListener("mousemove", (event) => {
    mouse.x = (event.offsetX / window.innerWidth) * 2 - 1;
    mouse.y = (event.offsetY / window.innerHeight) * -2 + 1;
});