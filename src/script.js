import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

var ball, ballBody;
var pins, pinBodies;
pins = pinBodies = [];
// Change this to affect spacing of pins / distance from ball
const dx = 0.1, dz = -0.2;

function setupPins(pinModel) {
    let x = 0, z = 0;
    pins.push(pinModel);
    scene.add(pins[0]);
    pins[0].position.x = x;
    pins[0].position.z = z;
    for (let i = 0; i < 9; i++) {
        pins.push(pins[0].clone());
        scene.add(pins[i + 1]);
    }
    // TODO: rewrite this, support n rows of pins
    pins[1].position.x = dx;
    pins[1].position.z = dz;
    pins[2].position.x = -dx;
    pins[2].position.z = dz;
    for (let i = 3; i < 6; i++) {
        pins[i].position.z = dz * 2;
    }
    pins[4].position.x = -dx * 2;
    pins[5].position.x = dx * 2;
    for (let i = 6; i < 10; i++) {
        pins[i].position.z = dz * 3;
    }
    pins[6].position.x = dx;
    pins[7].position.x = -dx;
    pins[8].position.x = dx * 3;
    pins[9].position.x = -dx * 3;

}

// Set up cannon
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.defaultContactMaterial.contactEquationStiffness = 1e6;
world.defaultContactMaterial.contactEquationRelaxation = 10;
const cannonDebugger = new CannonDebugger(scene, world);
// Load models
const loader = new GLTFLoader();
Promise.all([loader.loadAsync('bowling_ball/scene.gltf'), loader.loadAsync('bowling_pin/scene.gltf')]).then(models => {

    // Bowling ball
    ball = models[0].scene;
    // Distance from pins to ball should be 60x horizontal distance between pins
    ball.position.z = dx * 60;
    // Size of model
    scene.add(ball);
    // Bowling pins
    let pinModel = models[1].scene;
    setupPins(pinModel);
    // pinModel.traverse(function(child) {
    //     console.log(child);
    // });
    // Floor texture
    let floorMat = new THREE.MeshStandardMaterial( {
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 0.0005
    } );
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load( "hardwood/hardwood2_diffuse.jpg", function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 24 );
        map.encoding = THREE.sRGBEncoding;
        floorMat.map = map;
        floorMat.needsUpdate = true;
    } );
    textureLoader.load( "hardwood/hardwood2_bump.jpg", function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 24 );
        floorMat.bumpMap = map;
        floorMat.needsUpdate = true;
    } );
    textureLoader.load( "hardwood/hardwood2_roughness.jpg", function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 24 );
        floorMat.roughnessMap = map;
        floorMat.needsUpdate = true;
    } );
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.rotation.z = Math.PI / 2;
    scene.add(floorMesh);

    // Physics
    // Floor body
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({mass: 0});
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floorBody);
    // Bowling ball body
    ball.scale.x = ball.scale.y = ball.scale.z = 0.5;
    // Parameter is size of model once it has been scaled down
    const sphereShape = new CANNON.Sphere(.068953018);
    ballBody = new CANNON.Body({mass: 2, shape: sphereShape});
    world.addBody(ballBody);
    ballBody.position.z = dx * 60;
    ballBody.position.y = 0.5;
    ballBody.linearDamping = 0;
    ballBody.velocity.set(0, 0, -12);
    // Bowling pins body
    // let box = new THREE.Box3().setFromObject(pins[0]);
    // console.log(box.max.y - box.min.y);
    const cylinderShape = new CANNON.Cylinder(0.028, 0.086, 0.333296895);
    pins.forEach((p, i) => {
        pinBodies[i] = new CANNON.Body({mass: 0.5, shape: cylinderShape});
        world.addBody(pinBodies[i]);
        pinBodies[i].position.set(
            p.position.x,
            p.position.y,
            p.position.z
        );
    });


    animate();
    
});


// Lights
const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
dirLight.color.setHSL( 0.1, 1, 0.95 );
dirLight.position.set( - 1, 1.75, 1 );
dirLight.position.multiplyScalar( 30 );
scene.add( dirLight );

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

const d = 50;

dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = - 0.0001;


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 0;
camera.position.y = 0.5;
camera.position.z = dx * 70;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
let text = document.getElementById("camera");
text.innerHTML = `x: ${camera.position.x}, y: ${camera.position.y}, z: ${camera.position.z}`;
controls.addEventListener("change", function(e) {
    text.innerHTML = `x: ${camera.position.x}, y: ${camera.position.y}, z: ${camera.position.z}`;
});



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ReinhardToneMapping;

/**
 * Animate
 */
const animate = () =>
{

    // Update Orbital Controls
    controls.update()


    // Update objects
    ball.position.set(
        ballBody.position.x,
        ballBody.position.y,
        ballBody.position.z
    );
    ball.quaternion.set(
        ballBody.quaternion.x,
        ballBody.quaternion.y,
        ballBody.quaternion.z,
        ballBody.quaternion.w,
    );
    for (let i = 0; i < pins.length; i++) {
        pins[i].position.set(
            pinBodies[i].position.x,
            pinBodies[i].position.y,
            pinBodies[i].position.z
        );
        pins[i].quaternion.set(
            pinBodies[i].quaternion.x,
            pinBodies[i].quaternion.y,
            pinBodies[i].quaternion.z,
            pinBodies[i].quaternion.w
        );
    }

    world.fixedStep();
    cannonDebugger.update();
    // Render
    renderer.render(scene, camera)

    // Callanimate again on the next frame
    window.requestAnimationFrame(animate);
};