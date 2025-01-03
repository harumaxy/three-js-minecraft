import * as Three from "three";

const geometry = new Three.BoxGeometry();
const material = new Three.MeshStandardMaterial({ color: 0x00d000 });

export class World extends Three.Group {
	constructor(public size = { width: 64, height: 32 }) {
		super();
	}

	generate() {
		this.clear(); // UI から再生成するので、Three.Group.clear()。

		const maxCount = this.size.width ** 2 * this.size.height;
		// InstancedMesh = geometry, material が同じで Transform だけが違う複数のメッシュを効率的にレンダリングする。 draw call を大幅に抑える
		const mesh = new Three.InstancedMesh(geometry, material, maxCount);
		mesh.count = 0;

		const matrix = new Three.Matrix4();
		for (let x = 0; x < this.size.width; x++) {
			for (let y = 0; y < this.size.height; y++) {
				for (let z = 0; z < this.size.width; z++) {
					matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
					mesh.setMatrixAt(mesh.count++, matrix);
				}
			}
		}

		this.add(mesh);
	}
}
