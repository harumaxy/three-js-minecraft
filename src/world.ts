import * as Three from "three";
import { WorldChunk } from "./worldChunk";
export class World extends Three.Group {
	seed;
	chunk?: WorldChunk;
	chunkSize = { width: 64, height: 32 };

	params = {
		seed: 0,
		terrain: {
			scale: 30,
			magnitude: 0.5,
			offset: 0.2,
		},
	};

	constructor(seed = 0) {
		super();
		this.seed = seed;
	}

	generate() {
		this.disposeChunks();
		for (const x of [-1, 0, 1]) {
			for (const z of [-1, 0, 1]) {
				const chunk = new WorldChunk(this.chunkSize, this.params);
				chunk.position.set(
					x * this.chunkSize.width,
					0,
					z * this.chunkSize.width,
				);
				chunk.generate();
				chunk.userData = { x, z };
				this.add(chunk);
			}
		}

		this.chunk = new WorldChunk(this.chunkSize, this.params);
		this.chunk.generate();
		this.add(this.chunk);
	}

	getBlock(x: number, y: number, z: number) {
		return this.chunk?.getBlock(x, y, z);
	}

	disposeChunks() {
		this.traverse((chunk) => {
			if (chunk.disposeInstances) {
				chunk.disposeInstances();
			}
		});
	}
}
