import * as Three from "three";
import { PointerLockControls } from "three/examples/jsm/Addons.js";

const startPosition = new Three.Vector3(32, 16, 32);

export class Player {
	// state
	maxSpeed = 10;
	input = new Three.Vector3();
	velocity = new Three.Vector3();

	// components
	camera = new Three.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.1,
		200,
	);
	controls = new PointerLockControls(this.camera, document.body);
	cameraHelper = new Three.CameraHelper(this.camera);

	constructor(scene: Three.Scene) {
		this.camera.position.copy(startPosition);
		scene.add(this.camera);
		scene.add(this.cameraHelper);

		document.addEventListener("keydown", this.onKeyDown.bind(this));
		document.addEventListener("keyup", this.onKeyUp.bind(this));
	}

	applyInput(delta: number) {
		if (this.controls.isLocked) {
			this.velocity.x = this.input.x;
			this.velocity.z = this.input.z;
			this.controls.moveRight(this.velocity.x * delta);
			this.controls.moveForward(this.velocity.z * delta);

			const posText = document.getElementById("player-position");
			if (posText) posText.innerText = this.toString();
		}
	}

	get position() {
		return this.camera.position;
	}

	onKeyDown(event: KeyboardEvent) {
		if (!this.controls.isLocked) {
			if (event.code === "ShiftLeft" || event.code === "ShiftRight") return;

			this.controls.lock();
			console.log("control locked");
		}

		switch (event.code) {
			case "KeyW":
				this.input.z = this.maxSpeed;
				break;
			case "KeyA":
				this.input.x = -this.maxSpeed;
				break;
			case "KeyS":
				this.input.z = -this.maxSpeed;
				break;
			case "KeyD":
				this.input.x = this.maxSpeed;
				break;
			case "KeyR":
				this.camera.position.copy(startPosition);
				this.camera.rotation.set(0, 0, 0);
				this.velocity.set(0, 0, 0);

				break;
		}
	}
	onKeyUp(event: KeyboardEvent) {
		switch (event.code) {
			case "KeyW":
				this.input.z = 0;
				break;
			case "KeyA":
				this.input.x = 0;
				break;
			case "KeyS":
				this.input.z = 0;
				break;
			case "KeyD":
				this.input.x = 0;
				break;
		}
	}

	toString() {
		return [
			`X: ${this.position.x.toFixed(3)}`,
			`Y: ${this.position.y.toFixed(3)}`,
			`Z: ${this.position.z.toFixed(3)}`,
		].join(" ");
	}
}
