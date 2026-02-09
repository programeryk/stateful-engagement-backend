// src/common/state-rules.ts
import { clamp } from './clamp';

type State = {
  level: number;
  energy: number;
  fatigue: number;
  loyalty: number;
  streak: number;
};

type Deltas = {
  energyDelta?: number;
  fatigueDelta?: number;
  loyaltyDelta?: number;
  streak?: number;
};

function loyaltyMultiplier(level: number) {
  const raw = 1 + 0.05 * (level - 1);
  return Math.min(raw, 1.5);
}

export function applyStateChanges(state: State, deltas: Deltas) {
  const energyDelta = deltas.energyDelta ?? 0;
  const fatigueDelta = deltas.fatigueDelta ?? 0;
  const loyaltyDelta = deltas.loyaltyDelta ?? 0;

  const mult = loyaltyDelta > 0 ? loyaltyMultiplier(state.level) : 1;
  const loyaltyApplied = Math.round(loyaltyDelta * mult);

  let nextLevel = state.level;
  let nextEnergy = clamp(state.energy + energyDelta, 0, 100);
  const nextFatigue = clamp(state.fatigue + fatigueDelta, 0, 100);
  const nextLoyalty = state.loyalty + loyaltyApplied;
  const nextStreak = deltas.streak ?? state.streak;

  let leveledUp = false;
  if (nextEnergy >= 100) {
    leveledUp = true;
    nextLevel += 1;
    nextEnergy = 0;
  }

  return {
    next: {
      level: nextLevel,
      energy: nextEnergy,
      fatigue: nextFatigue,
      loyalty: nextLoyalty,
      streak: nextStreak,
    },
    meta: {
      leveledUp,
      loyaltyMultiplier: mult,
      loyaltyApplied,
    },
  };
}
