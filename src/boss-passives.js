// Boss state and on-hit passives: pure calculations shared by the UI and tests.
export function createBossState(base, attackDie, dominanceDie) {
  const spawnAttack = base.stats.attack * (attackDie / 2);
  return {
    ...base,
    attackDie,
    dominanceDie,
    spawnAttack,
    oilStacks: 0,
    stats: {
      ...base.stats,
      attack: spawnAttack,
      dominance: base.stats.dominance * (dominanceDie / 2),
    },
  };
}

// A blocked attack is not a hit. A defeated boss cannot receive further hits.
// Each landed hit (including individual combo hits) adds one 20% oil stack.
export function takeBossHit(boss, currentHp, incomingDamage) {
  const hp = Math.max(0, Math.min(boss.hp, currentHp));
  const damage = Math.min(hp, Number.isFinite(incomingDamage) ? Math.max(0, incomingDamage) : 0);
  const oilTriggered = boss.id === 'taetiseo' && damage > 0;
  const stacks = (boss.oilStacks || 0) + (oilTriggered ? 1 : 0);
  const nextBoss = oilTriggered ? {
    ...boss,
    oilStacks: stacks,
    stats: { ...boss.stats, attack: boss.spawnAttack * (1.2 ** stacks) },
  } : boss;
  return { boss: nextBoss, hp: Math.max(0, hp - damage), damage, oilTriggered };
}
