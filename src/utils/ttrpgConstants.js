// src/utils/ttrpgConstants.js
export const DND_ABILITIES = ['STR','DEX','CON','INT','WIS','CHA'];
export const COC_ABILITIES = ['STR','CON','POW','DEX','APP','SIZ','INT','EDU'];
export const CPR_ABILITIES = ['INT','REF','DEX','TECH','COOL','WILL','LUCK','MOVE','BODY','EMP'];

export const CLASS_SAVE_PROFS = {
  Barbarian: ['STR','CON'], Bard: ['DEX','CHA'], Cleric: ['WIS','CHA'], Druid: ['INT','WIS'],
  Fighter: ['STR','CON'], Monk: ['STR','DEX'], Paladin: ['WIS','CHA'], Ranger: ['STR','DEX'], Rogue: ['DEX','INT'],
  Sorcerer: ['CON','CHA'], Warlock: ['WIS','CHA'], Wizard: ['INT','WIS']
};

export const HIT_DIE_BY_CLASS_DND = {
  Barbarian: 12,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Fighter: 10,
  Monk: 8,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Sorcerer: 6,
  Warlock: 8,
  Wizard: 6
};
