import * as Three from "three";

const geometry = new Three.BoxGeometry();
const material = new Three.MeshStandardMaterial({ color: 0x00d000 });

export class World extends Three.Group {
	constructor(public size = 32) {
		super();
	}

	generate() {
		for (let x = 0; x < this.size; x++) {
			for (let z = 0; z < this.size; z++) {
				const block = new Three.Mesh(geometry, material);
				block.position.set(x, 0, z);
				this.add(block);
			}
		}
	}
}
