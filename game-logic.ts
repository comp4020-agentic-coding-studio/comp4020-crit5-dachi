// Pure game rules --- no DOM, no canvas, no timers. Kept separate from
// main.ts so the rule that ends a round can be unit-tested in isolation.

export const LANE_COUNT = 3;
export type Lane = 0 | 1 | 2;

export interface Row {
  /** Lanes this row blocks. Never all of them --- see generateRow. */
  blocked: Lane[];
}

/** A row that blocks every lane would make the game unwinnable no matter
 * what the player does, so generation always leaves at least one lane open. */
export function generateRow(random: () => number, difficulty: number): Row {
  // difficulty 0 → always exactly one blocked lane; difficulty 1 → up to
  // LANE_COUNT - 1 blocked, still always leaving a safe lane.
  const maxBlocked = Math.max(1, Math.min(LANE_COUNT - 1, 1 + Math.floor(difficulty * (LANE_COUNT - 1))));
  const blockedCount = 1 + Math.floor(random() * maxBlocked);
  const lanes: Lane[] = [0, 1, 2];
  const blocked: Lane[] = [];
  for (let i = 0; i < blockedCount; i++) {
    const pick = Math.floor(random() * lanes.length);
    blocked.push(lanes.splice(pick, 1)[0]);
  }
  return { blocked };
}

/** The one rule a round ends on: the player's lane is blocked when a row
 * reaches them. */
export function isCollision(playerLane: Lane, row: Row): boolean {
  return row.blocked.includes(playerLane);
}

export function clampLane(lane: number): Lane {
  return Math.max(0, Math.min(LANE_COUNT - 1, lane)) as Lane;
}

/** Speed (world units/sec) climbs with score, capped so it stays playable. */
export function speedForScore(score: number): number {
  return Math.min(9, 3 + score * 0.08);
}

/** Difficulty (0..1) feeds generateRow's blocked-lane count. */
export function difficultyForScore(score: number): number {
  return Math.min(1, score / 40);
}
