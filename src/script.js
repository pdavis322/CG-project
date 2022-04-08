import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Load models
const loader = new GLTFLoader();
var ball;
loader.load( 'bowling_ball/scene.gltf', function ( gltf ) {
    ball = gltf.scene;
	scene.add(ball);
    console.log(ball);

}, undefined, function ( error ) {

	console.error( error );

} );

// Lights

const directionalLight = new THREE.DirectionalLight( 0xffffff, 100 );
scene.add(directionalLight);
// const ambientLight = new THREE.AmbientLight(0xfff, 1);
// scene.add(ambientLight);

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2;
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

/**
 * Animate
 */

const clock = new THREE.Clock();

const animate = () =>
{

    const elapsedTime = clock.getElapsedTime()

    if(ball) {
    ball.rotation.x += 0.1;
}
    // Update objects

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Callanimate again on the next frame
    window.requestAnimationFrame(animate);
};
animate();