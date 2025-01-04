import * as Three from "three";
import { blocks } from "./blocks";
import type { Player } from "./player";
import type { World } from "./world";

const collisionMaterial = new Three.MeshBasicMaterial({
	color: 0xff0000,
	transparent: true,
	opacity: 0.2,
});
const collisionGeometry = new Three.BoxGeometry(1.001, 1.001, 1.001);

const contactMaterial = new Three.MeshBasicMaterial({
	wireframe: true,
	color: 0x00ff00,
});
const contactGeometry = new Three.SphereGeometry(0.05, 6, 6);

/**
 * 衝突検出のロジック 3 Phases
 * - Broad Phase : 衝突をチェックするブロックのリストを絞り込む
 * - Narrow Phase : Broad Phase で絞り込んだリストから、 collision を検出する
 *   - collisionPoint
 *   - overlap
 *   - normal
 * - Resolve Collisions : 見つかった collision を一つずつ解決する
 *  - adjustPosition
 *  - zeroVelocity
 *
 */

export class Physics {
	helpers = new Three.Group();
	gravity = 32;

	constructor(scene: Three.Scene) {
		scene.add(this.helpers);
	}

	update(delta: number, player: Player, world: World) {
		this.helpers.clear();
		player.velocity.y -= this.gravity * delta;
		player.applyInput(delta);
		player.updateBoundsHelper();
		this.detectCollisions(player, world);
	}

	detectCollisions(player: Player, world: World) {
		const candidates = this.broadPhase(player, world);
		const collisions = this.narrowPhase(candidates, player);
		if (collisions.length > 0) {
			this.resolveCollisions(collisions, player);
		}
	}

	broadPhase(player: Player, world: World) {
		const extents = {
			x: {
				min: Math.floor(player.position.x),
				max: Math.ceil(player.position.x + 2 * player.radius),
			},
			y: {
				min: Math.floor(player.position.y - player.height),
				max: Math.ceil(player.position.y),
			},
			z: {
				min: Math.floor(player.position.z),
				max: Math.ceil(player.position.z + 2 * player.radius),
			},
		};
		console.log({ extents });

		const candidates = [];
		for (let x = extents.x.min; x <= extents.x.max; x++) {
			for (let y = extents.y.min; y <= extents.y.max; y++) {
				for (let z = extents.z.min; z <= extents.z.max; z++) {
					const block = world.getBlock(x, y, z);
					if (block) {
						if (block && block.id !== blocks.empty.id) {
							const blockPos = { x, y, z };
							candidates.push(blockPos);
							this.addCollisionHelper(blockPos);
						}
					}
				}
			}
		}
		console.log(`Broadphase Candidates: ${candidates.length}`);

		return candidates;
	}

	/** 候補に対して、重なっているかどうか、衝突方向が水平か垂直かを検証 */
	narrowPhase(candidates: Three.Vector3Like[], player: Player) {
		const collisions: Collision[] = [];

		for (const block of candidates) {
			const p = player.position.clone();
			// 1. Get the closest point on the block to the player
			const closestPoint = {
				x: clamp(p.x, block.x - 0.5, block.x + 0.5),
				y: clamp(p.y - player.height, block.y - 0.5, block.y + 0.5),
				z: clamp(p.z, block.z - 0.5, block.z + 0.5),
			};
			// 2. Determine if point is inside player's bounding cylinder
			const dx = closestPoint.x - player.position.x;
			const dy = closestPoint.y - (player.position.y - player.height / 2);
			const dz = closestPoint.z - player.position.z;

			// もし、ブロック上のとの距離が最も近い点がプレイヤー円柱の中に入っていたら、衝突を検出する
			// - Contact Point
			// - Overlap
			// - Collision Normal
			if (this.isPointInPlayerBoundingCylinder(closestPoint, player)) {
				// 重なってる距離を計算
				const overlapY = player.height / 2 - Math.abs(dy);
				const overlapXZ = player.radius - Math.sqrt(dx ** 2 + dz ** 2);
				// 衝突の法線と、XZ or Y のどちらの重なりを解決するかを求める
				let normal: Three.Vector3;
				let overlap: number;
				if (overlapY < overlapXZ) {
					normal = new Three.Vector3(0, -Math.sign(dy), 0);
					overlap = overlapY;
				} else {
					normal = new Three.Vector3(-dx, 0, -dz).normalize();
					overlap = overlapXZ;
				}
				collisions.push({ block, overlap, normal, contactPoint: closestPoint });
				this.addContactPointHelper(closestPoint);
			}
		}
		console.log(`Narrowphase Collisions: ${collisions.length}`);

		return collisions;
	}

	resolveCollisions(collisions: Collision[], player: Player) {
		// 重なりが大きい順に並べる
		collisions.sort((a, b) => {
			return a.overlap - b.overlap;
		});

		for (const collision of collisions) {
			// 1. 重なった分だけ位置を戻す
			const deltaPosition = collision.normal.clone();
			deltaPosition.multiplyScalar(collision.overlap);
			player.position.add(deltaPosition);

			// 2. 速度をゼロにする
			const magnitude = player.worldVelocity.dot(collision.normal); // 法線方向のプレイヤーの速度の大きさを取得
			const velocityAdjustment = collision.normal
				.clone()
				.multiplyScalar(magnitude); // その部分成分の速度を相殺する

			player.applyWorldDeltaVelocity(velocityAdjustment.negate()); // player.velocity は Local 速度。 world 座標の相殺ベクトルをローカル系に変換して加算
		}
	}

	/** ある点が Player の BoundingCylinder に入っているか */
	isPointInPlayerBoundingCylinder(p: Three.Vector3Like, player: Player) {
		// d* = 2点の距離
		const dx = p.x - player.position.x;
		const dy = p.y - (player.position.y - player.height / 2);
		const dz = p.z - player.position.z;
		const r_sq = dx * 2 + dz * 2;
		return Math.abs(dy) < player.height / 2 && r_sq < player.radius ** 2;
	}

	addCollisionHelper(block: Three.Vector3Like) {
		const blockMesh = new Three.Mesh(collisionGeometry, collisionMaterial);
		blockMesh.position.copy(block);
		this.helpers.add(blockMesh);
	}

	addContactPointHelper(p: Three.Vector3Like) {
		const contactMesh = new Three.Mesh(contactGeometry, contactMaterial);
		contactMesh.position.copy(p);
		this.helpers.add(contactMesh);
	}
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(value, max));
}

interface Collision {
	block: Three.Vector3Like;
	overlap: number;
	normal: Three.Vector3;
	contactPoint: Three.Vector3Like;
}
