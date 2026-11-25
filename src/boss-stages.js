// 보스가 추가되어도 마지막 두 단계는 반드시 태티서 → L 순서입니다.
export const FINAL_BOSS_ID = 'l';
export const PENULTIMATE_BOSS_ID = 'taetiseo';

export function buildBossStages(entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('보스 목록이 없습니다.');
  const ids = new Set();
  for (const boss of entries) {
    if (!boss || typeof boss.id !== 'string' || !boss.id || ids.has(boss.id)) {
      throw new Error('보스 ID가 없거나 중복되었습니다.');
    }
    ids.add(boss.id);
  }
  const last = entries.find(boss => boss.id === FINAL_BOSS_ID);
  const beforeLast = entries.find(boss => boss.id === PENULTIMATE_BOSS_ID);
  if (!last || !beforeLast) throw new Error('마지막 두 보스 태티서 → L이 모두 필요합니다.');
  const rank = boss => Number.isSafeInteger(boss.level) && boss.level > 0 ? boss.level : Infinity;
  const stages = entries.filter(boss => ![FINAL_BOSS_ID,PENULTIMATE_BOSS_ID].includes(boss.id))
    .map((boss, index) => ({ boss, index }))
    .sort((a, b) => rank(a.boss) === rank(b.boss) ? a.index - b.index : rank(a.boss) - rank(b.boss))
    .map(entry => entry.boss);
  return [...stages, beforeLast, last].map((boss, index) => ({
    ...boss,
    level: index+1,
    hp: 50 + index*10,
  }));
}

// 숫자 대신 클리어한 보스 ID 순서로 해금 상태를 판단합니다.
// 신규 보스를 중간에 추가하면 뛰어넘을 수 없습니다.
export function normalizeClearedBossIds(stages, clearedIds) {
  const stored = clearedIds instanceof Set || Array.isArray(clearedIds) ? new Set(clearedIds) : new Set();
  const cleared = new Set();
  for (const boss of stages) {
    if (!stored.has(boss.id)) break;
    cleared.add(boss.id);
  }
  return cleared;
}
export function getUnlockedLevel(stages, clearedIds) {
  return Math.min(stages.length, normalizeClearedBossIds(stages, clearedIds).size+1);
}
export function canEnterStage(stages, clearedIds, level) {
  return Number.isSafeInteger(level) && level>=1
    && level<=getUnlockedLevel(stages,clearedIds)
    && stages.some(boss=>boss.level===level);
}
