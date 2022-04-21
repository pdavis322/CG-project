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
var pins = [], pinBodies = [];
// Change this to affect spacing of pins / distance from ball
const dx = 0.1, dz = -0.1;

function setupBall(ballModel) {
    ball = ballModel;
    // Distance from pins to ball should be 60x horizontal distance between pins
    ball.position.z = dx * 60;
    // Size of model
    scene.add(ball);
    ball.scale.x = ball.scale.y = ball.scale.z = 0.5;
    // Physics
    // Parameter is size of model once it has been scaled down
    const sphereShape = new CANNON.Sphere(.068953018);
    ballBody = new CANNON.Body({mass: 6, shape: sphereShape});
    world.addBody(ballBody);
    ballBody.position.z = dx * 60;
    ballBody.position.y = 0.5;
    ballBody.velocity.set(0, 0, 0);
}

function setupFloor() {
    // Texture
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
        map.repeat.set( 10, 1);
        map.encoding = THREE.sRGBEncoding;
        floorMat.map = map;
        floorMat.needsUpdate = true;
    } );
    textureLoader.load( "hardwood/hardwood2_bump.jpg", function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 1);
        floorMat.bumpMap = map;
        floorMat.needsUpdate = true;
    } );
    textureLoader.load( "hardwood/hardwood2_roughness.jpg", function ( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 10, 1);
        floorMat.roughnessMap = map;
        floorMat.needsUpdate = true;
    } );
    const floorGeometry = new THREE.PlaneGeometry(7, 1);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.rotation.z = Math.PI / 2;
    floorMesh.position.z = 3;
    scene.add(floorMesh);
    // Physics
    const floorShape = new CANNON.Box(new CANNON.Vec3(7, 0.5, 1));
    const floorBody = new CANNON.Body({mass: 0, shape: floorShape});
    floorBody.position.z = 6.5;
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, Math.PI / 2);
    floorBody.position.y = -1;
    world.addBody(floorBody);
}

function setupPins(pinModel) {
    if (pinModel) {
        let pin = pinModel;
        pin.traverse(function(child) {
            if (child.geometry !== undefined) {
                child.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -.1666039322183284, 0));
            }
        });
        const cylinderShape = new CANNON.Cylinder(0.028, 0.05, 0.333296895);
        for (let i = 0; i < 10; i++) {
            pins.push(pin.clone());
            scene.add(pins[i]);
            let pinBody = new CANNON.Body({mass: 0.375, shape: cylinderShape});
            pinBodies.push(pinBody);
            world.addBody(pinBodies[i]);
        }
    }
    // TODO: rewrite this, support n rows of pins
    // Need to do this outside of if statement for resetting pins
    for (let i = 0; i < 10; i++) {
        pinBodies[i].position.y = 0;
        pinBodies[i].velocity.setZero();
        pinBodies[i].angularVelocity.setZero();
        pinBodies[i].quaternion.set(0, 0, 0, 1);
    }
    pinBodies[0].position.x = 0;
    pinBodies[0].position.z = 0;
    pinBodies[1].position.x = dx;
    pinBodies[1].position.z = dz;
    pinBodies[2].position.x = -dx;
    pinBodies[2].position.z = dz;
    for (let i = 3; i < 6; i++) {
        pinBodies[i].position.z = dz * 2;
    }
    pinBodies[3].position.x = 0;
    pinBodies[4].position.x = -dx * 2;
    pinBodies[5].position.x = dx * 2;
    for (let i = 6; i < 10; i++) {
        pinBodies[i].position.z = dz * 3;
    }
    pinBodies[6].position.x = dx;
    pinBodies[7].position.x = -dx;
    pinBodies[8].position.x = dx * 3;
    pinBodies[9].position.x = -dx * 3;
    window.setTimeout(() => {
        for (let i = 0; i < pins.length; i++) {
            console.log(pinBodies[i].position);
        }
    }, 2000);
}

function setupBackground(){
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('background/background1.jpg', function ( texture ) {
        scene.background = texture;  
    } );
}

// Set up cannon
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.defaultContactMaterial.contactEquationStiffness = 1e10;
world.defaultContactMaterial.contactEquationRelaxation = 10;
const cannonDebugger = new CannonDebugger(scene, world);
// Load models
const loader = new GLTFLoader();
Promise.all([loader.loadAsync('bowling_ball/scene.gltf'), loader.loadAsync('bowling_pin/scene.gltf')]).then(models => {
    setupBall(models[0].scene);
    setupFloor();
    setupPins(models[1].scene);
    setupBackground();
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

dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

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

// Update threejs object from cannon body
function updateObj(obj, body) {
    obj.position.set(
        body.position.x,
        body.position.y,
        body.position.z
    );
    obj.quaternion.set(
        body.quaternion.x,
        body.quaternion.y,
        body.quaternion.z,
        body.quaternion.w
    );
}

var ballSpeed = false;
var ballRotate = 0;
var ballPosition = 0;


var sourcePos = new THREE.Vector3(0, 0, 5.8);
var targetPos = new THREE.Vector3(0, 0, 0);
var direction = new THREE.Vector3().subVectors(targetPos, sourcePos);
var arrow = new THREE.ArrowHelper(direction.clone().normalize(), sourcePos, direction.length(), 0x00ff00);
arrow.setDirection(direction.normalize());
scene.add(arrow);
arrowUpdate();

var speed = -10;
var newSourcePos; 
var newTargetPos; 

function arrowUpdate(){
    newSourcePos = new THREE.Vector3(ballPosition, 0.068953018, 5.8); /// Position of the arrow
    newTargetPos = new THREE.Vector3(ballPosition + (58*ballRotate), 0, 0); // Where it points to
    arrow.position.copy(newSourcePos);
    direction = new THREE.Vector3().subVectors(newTargetPos, newSourcePos);
    arrow.setDirection(direction.normalize());
    arrow.setLength(direction.length());
}


// User interaction
const restartButton = document.getElementById("restartButton");
function restart(){
    ballBody.velocity.setZero();
    ballBody.angularVelocity.setZero();
    ballBody.position.y = 0.07;
    ballBody.position.x = 0.0;
    ballBody.position.z = dx * 60;
    arrowUpdate();
    setupPins();
}
restartButton.onclick = restart;
const shootButton = document.getElementById("shoot");
let moving = false;
function shoot(){
    if (!moving) {
        moving = true;
        ballBody.position.y = 0.5;
        speed = -10;
        ballBody.velocity.set(0, 0, speed);
        ballSpeed = true;
        window.setTimeout(function() {
            moving = false;
            checkScore();
        }, 1000);
    }
}
shootButton.onclick = shoot;

document.onkeydown = function(move){
    if(move.keyCode === 39){
        // move ball position right
        ballPosition += 0.03;
        ballBody.position.x += 0.03;
        arrowUpdate()
    }
    else if(move.keyCode === 37){
        //move ball position left
        ballPosition -= 0.03;
        ballBody.position.x -= 0.03;
        arrowUpdate()
    }
    else if(move.keyCode === 38){
        ballRotate += 0.001;
        ball.rotation.y -= 0.01;
        arrowUpdate()
    }
    else if(move.keyCode === 40){
        ballRotate -= 0.001;
        ball.rotation.y += 0.01;
        arrowUpdate()
    }
    // Space Bar
    else if(move.keyCode === 32){
    }
}

const score = document.getElementById("score");
// Check number of pins down
function checkScore() {
    score.innerHTML = "Waiting...";
    let ready = false;
    let interval = window.setInterval(function() {
        if (ready) {
            moving = false;
            clearInterval(interval);
            let total = 0;
            for (let i = 0; i < pins.length; i++) {
                if (pinBodies[i].position.y < -0.5 || Math.abs(pins[i].rotation.x) >= Math.PI / 3 || Math.abs(pins[i].rotation.z) >= Math.PI / 3) {
                    total++;
                }
            }
            score.innerHTML = total;
        }
        else {
            ready = true;
            for (let i = 0; i < pins.length; i++) {
                if (pinBodies[i].position.y > -0.5 && (pinBodies[i].velocity.x > 0.05 || pinBodies[i].velocity.y > 0.05 || pinBodies[i].velocity.z > 0.05)) {
                    ready = false;
                }
            }
        }
    }, 500);
}

/**
 * Animate
 */
const animate = () =>
{
    // Update Orbital Controls
    controls.update()
    // Update objects
    updateObj(ball, ballBody);
    for (let i = 0; i < pins.length; i++) {
        updateObj(pins[i], pinBodies[i]);
    }

    world.fixedStep();
    // Show cannon bodies
    // cannonDebugger.update();
    // Render
    renderer.render(scene, camera);

    // Call animate again on the next frame
    window.requestAnimationFrame(animate);
};
