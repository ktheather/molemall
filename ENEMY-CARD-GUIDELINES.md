# Molemall - Enemy and Predator Card Design Guidelines

Status: Design reference / draft. This document does not change the deployed game.

## 1. Predator reference pool
These are the predator candidates supplied by the user for possible future boss or enemy-card creation, not a verified biological list.

- Birds: owl, eagle owl, hawk/falcon, heron.
- Carnivorous mammals: weasel, marten, badger, fox, cat.
- Reptiles: snakes.
- Special added character: honey badger, code name **Z**.

## 2. Roles in the game
- **Enemy card**: a selectable adversarial card with a recognizable species identity, personality, and distinctive trigger and visual effects.
- **Boss**: an arena-scale adversary with an environment, hit reaction, attack phase, and any approved special mechanics.
- A creature can be designed for either category, but keep these implementations distinct until approved.
- Respect the existing staged game and its current final-boss rule: Tatieseo remains the final boss when new intermediary bosses are added. Stage HP and unlock behavior should follow the currently approved game design, not be overwritten by this reference.

## 3. Mandatory art direction
- Match existing Molemall plush/felt 3D character quality, cinematic lighting, and premium burgundy/gold card finish.
- Keep each enemy's real species silhouette recognizable. Do not draw every enemy as a white mole.
- Use an upper-body portrait without visible feet in the card; a separate full-body battle sprite may be prepared when needed.
- For detail views, put the portrait/identity on the left and readable idle, attack, special-effect scenes on the right; avoid cropping.
- The game battle sprite should have a transparent background so it does not appear as a rectangular photograph in the arena.
- Avoid committing unapproved gameplay statistics or special damage values in card art.

## 4. Z - honey badger concept
- **Name:** Z
- **Species:** Honey badger
- **Status:** Predator-themed enemy-card / boss candidate. Not yet registered in gameplay.
- **Core character traits (user-supplied):** fearless even before much larger predators; immediately confrontational and combative; unusually resistant to snake venom, able to hunt venomous snakes.
- **Visual identity:** stocky, muscular-looking but plush rather than realistic; black/charcoal underside, pale gray-white mantle across head/back, short ears, powerful paws and claws, confident hostile expression.
- **Suggested artwork motif (not gameplay rule):** fierce direct gaze, red slash energy, honeycomb accent, cobra imagery and battle-worn visual treatment. Quills in the reference photo are acquired from an encounter, not the animal's normal anatomy.
- **Idle direction:** stares directly at the opponent and refuses to retreat.
- **Attack direction:** low, aggressive dash and claw strike.
- **Possible special direction:** venom resistance visual and fearless counter-challenge. Exact mechanics are pending approval.
- **Stats:** Attack = TBD; Defense = TBD; Dominance = TBD; Empathy = TBD.
- **Damage, probabilities, cooldowns, attack triggers:** TBD.

## 5. Important status note
The early visual concept of Z may contain illustrative attack/defense/dominance/empathy numbers and special move text. Those figures and mechanics were generated as part of an image mockup and were **not supplied or approved by the user**. They are not canonical and must NOT be imported into data/cards.json or combat logic without confirmation.

## 6. Integration checklist for a future task
1. Confirm whether Z is an enemy card, a boss, or both.
2. Confirm exact stats and combat abilities without inferring values from image art.
3. Preserve existing character cards, bosses, HP progression, and final-boss rule.
4. Prepare a clean battle sprite with transparent background and a separate card-detail layout.
5. Validate attack/damage calculations and visual effects separately.
6. Only claim deployment after a real, verifiable deployment confirmation.
