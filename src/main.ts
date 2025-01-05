import * as Three from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { createUI } from "./ui";
import { Player } from "./player";
import { Physics } from "./physics";
import { World } from "./world";

const stats = new Stats();
document.body.append(stats.dom);

const worldSize = 32;

const renderer = new Three.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = Three.PCFSoftShadowMap; // 影の見た目を決める。高品質なほど負荷が高い。一番軽いのは BasicShadowMap だが見た目がひどい。
document.body.appendChild(renderer.domElement);

function getAspect() {
	return window.innerWidth / window.innerHeight;
}

// Camera setup
const orbitCamera = new Three.PerspectiveCamera(75, getAspect());
orbitCamera.position.set(-worldSize, worldSize / 2, -worldSize);
orbitCamera.lookAt(0, 0, 0);
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(worldSize / 2, 0, worldSize / 2);

function setupLights() {
	const sun = new Three.DirectionalLight();
	sun.position.set(50, 50, 50);
	sun.castShadow = true;
	sun.shadow.camera.left = -50;
	sun.shadow.camera.right = 50;
	sun.shadow.camera.top = 50;
	sun.shadow.camera.bottom = -50;
	sun.shadow.camera.near = 0.1;
	sun.shadow.camera.far = 100;
	sun.shadow.bias = -0.0005; // ブロックの継ぎ目に影ができるのを防ぐ
	sun.shadow.mapSize = new Three.Vector2(512, 512); // 影のテクスチャサイズ。高いほどくっきり

	scene.add(sun);

	const shadowHelper = new Three.CameraHelper(sun.shadow.camera);
	scene.add(shadowHelper);

	const ambient = new Three.AmbientLight();
	ambient.intensity = 0.1;
	scene.add(ambient);
}

// Scene setup

const scene = new Three.Scene();
const world = new World();
world.generate();
scene.add(world);

// Player setup
const player = new Player(scene);
const physics = new Physics(scene);

// Render loop
let prevTime = performance.now();
function animate() {
	// requestAnimationFrame(callback) = ブラウザにアニメーションを行うことを知らせる。アニメーション更新関数を渡して、次フレームに実行する。OneShot なので、毎フレーム呼び出す必要がある。ある意味再帰関数。
	requestAnimationFrame(animate);
	const currentTime = performance.now();
	const delta = (performance.now() - prevTime) / 1000;

	physics.update(delta, player, world);
	renderer.render(
		scene,
		player.controls.isLocked ? player.camera : orbitCamera,
	);
	stats.update();

	prevTime = currentTime;
}

window.addEventListener("resize", () => {
	orbitCamera.aspect = getAspect();
	orbitCamera.updateProjectionMatrix();
	player.camera.aspect = getAspect();
	player.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

createUI(world, player);
setupLights();
animate();
