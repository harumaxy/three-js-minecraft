import type { Player } from "./player";
import type { World } from "./world";

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
	update(delta: number, player: Player, world: World) {}

	detectCollisions(player: Player, world: World) {
		// const candidates = this.broadPhase(player, world);
		// const collisions = this.narrowPhase(candidates, player);
		// if (collisions.length > 0) {
		// 	this.resolveCollisions(collisions);
		// }
	}
}
