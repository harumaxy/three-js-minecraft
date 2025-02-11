import * as Three from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { RNG } from "./rng";
import { blockIdMap, blocks, resources, type BlockType } from "./blocks";

const geometry = new Three.BoxGeometry();

interface TerrainData {
	id: BlockType["id"]; // Block type = 0: empty, 1: glass, 2: dirt ...
	instanceId: number | null;
}

export class WorldChunk extends Three.Group {
	// 後からブロックを掘る(削除する)ために、インスタンスid を保持する
	public data: TerrainData[][][] = [];

	constructor(
		public size = { width: 64, height: 32 },
		public params = {
			seed: 0,
			terrain: {
				scale: 30,
				magnitude: 0.5,
				offset: 0.2,
			},
		},
	) {
		super();
	}

	generate() {
		const rng = new RNG(this.params.seed);
		this.initializeTerrain();
		this.generateResources(rng);
		this.generateTerrain(rng);
		this.generateMeshes();
	}

	initializeTerrain() {
		this.data = Array.from({ length: this.size.width }, () =>
			Array.from({ length: this.size.height }, () =>
				Array.from({ length: this.size.width }, () => ({
					id: blocks.empty.id,
					instanceId: null,
				})),
			),
		);
	}

	/** coal, stone など、リソースを world に生成・配置する */
	generateResources(rng: RNG) {
		// 2d ノイズではなく 3d ノイズを使う
		// noise2d(x, z) = y_height vs noise3d(x, y, z) = resource_exists

		const simplex = new SimplexNoise(rng); // Simplex = Perlin noise(=勾配ノイズ)だが、高次元で計算オーバーヘッドが低い。任意のn次元で計算可能。
		for (const r of resources) {
			for (let x = 0; x < this.size.width; x++) {
				for (let y = 0; y < this.size.height; y++) {
					for (let z = 0; z < this.size.width; z++) {
						const value = simplex.noise3d(
							(this.position.x + x) / r.scale.x,
							(this.position.y + y) / r.scale.y,
							(this.position.z + z) / r.scale.z,
						);
						if (value > r.scarcity) {
							this.setBlockId(x, y, z, r.id);
						}
					}
				}
			}
		}
	}

	generateTerrain(rng: RNG) {
		const simplex = new SimplexNoise(rng);
		const { magnitude, offset, scale } = this.params.terrain;
		for (let x = 0; x < this.size.width; x++) {
			for (let z = 0; z < this.size.width; z++) {
				const value = simplex.noise(
					(this.position.x + x) / scale,
					(this.position.z + z) / scale,
				); // xz 座標でノイズ値を取得
				const scaledNoise = offset + magnitude * value; // magnitude/offset でノイズ値の振幅を調整
				let height = Math.floor(this.size.height * scaledNoise); // ノイズ値を高さとする
				height = Math.max(0, Math.min(height, this.size.height - 1));

				for (let y = 0; y <= this.size.height; y++) {
					const isEmpty = this.getBlock(x, y, z)?.id === blocks.empty.id;
					if (y < height && isEmpty) {
						this.setBlockId(x, y, z, blocks.dirt.id);
					} else if (y === height) {
						this.setBlockId(x, y, z, blocks.grass.id);
					} else if (y > height) {
						this.setBlockId(x, y, z, blocks.empty.id);
					}
				}
			}
		}
	}

	getBlock(x: number, y: number, z: number): TerrainData | null {
		if (this.isBounds(x, y, z)) {
			return this.data[x][y][z];
		}
		return null;
	}
	isBounds(x: number, y: number, z: number): boolean {
		return (
			x >= 0 &&
			x < this.size.width &&
			y >= 0 &&
			y < this.size.height &&
			z >= 0 &&
			z < this.size.width
		);
	}

	setBlockId(x: number, y: number, z: number, id: number) {
		if (this.isBounds(x, y, z)) {
			this.data[x][y][z].id = id;
		}
	}

	setBlockInstanceId(x: number, y: number, z: number, instanceId: number) {
		if (this.isBounds(x, y, z)) {
			this.data[x][y][z].instanceId = instanceId;
		}
	}

	generateMeshes() {
		this.clear(); // UI から再生成するので、Three.Group.clear()。
		const maxCount = this.size.width ** 2 * this.size.height;

		const meshes = Object.fromEntries(
			Object.values(blocks)
				.filter((b) => b.id !== blocks.empty.id)
				.map((b: BlockType) => {
					// InstancedMesh = geometry, material が同じで Transform だけが違う複数のメッシュを効率的にレンダリングする。 draw call を大幅に抑える
					const mesh = new Three.InstancedMesh(geometry, b.material, maxCount);
					mesh.name = b.name;
					mesh.count = 0;
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					return [b.id, mesh];
				}),
		) as Record<number, Three.InstancedMesh>;

		const matrix = new Three.Matrix4();
		for (let x = 0; x < this.size.width; x++) {
			for (let y = 0; y < this.size.height; y++) {
				for (let z = 0; z < this.size.width; z++) {
					const blockId = this.getBlock(x, y, z)?.id;
					const blockType = blockIdMap.get(blockId ?? -1);
					if (blockId === blocks.empty.id || !blockType) continue;

					const mesh = meshes[blockType.id ?? -1];

					const instanceId = mesh.count;

					if (!this.isBlockObscured(x, y, z)) {
						matrix.setPosition(x, y, z);
						mesh.setMatrixAt(mesh.count++, matrix);
						this.setBlockInstanceId(x, y, z, instanceId);
					}
				}
			}
		}

		this.add(...Object.values(meshes));
	}

	isBlockObscured(x: number, y: number, z: number): boolean {
		const updDownLeftRightForwardBack = [
			[x, y + 1, z],
			[x, y - 1, z],
			[x + 1, y, z],
			[x - 1, y, z],
			[x, y, z + 1],
			[x, y, z - 1],
		];
		const hasEmptyNeighbor = updDownLeftRightForwardBack
			.map(([x, y, z]) => {
				return this.getBlock(x, y, z)?.id ?? blocks.empty.id;
			})
			.some((id) => id === blocks.empty.id);

		return !hasEmptyNeighbor;
	}

	disposeInstances() {
		this.traverse((obj) => {
			//@ts-ignore
			if (obj.dispose) obj.dispose();
		});
		this.clear();
	}
}
