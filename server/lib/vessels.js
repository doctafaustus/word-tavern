'use strict';

// Every Bluesky handle gets one unique vessel, generated from a hash of the
// handle. Same handle always produces the same vessel; rarity rolls from the
// same hash with the published odds.

const TYPES = ['stein', 'mug', 'pint', 'wine', 'goblet', 'teacup', 'enamel', 'bottle'];
const BODIES = ['#E2DCCB', '#B8324A', '#F4F1E8', '#F4D3C4', '#E2B54A', '#9FC7A8', '#F0A93A', '#BCD3EE', '#E9D9F8'];
const BANDS = ['#2F6FE0', '#7A3B1E', '#1E9450', '#E0690F', '#8B3FD9', '#B8324A', '#1E1A16'];
const ADJECTIVES = ['Cobalt', 'Rust', 'Sage', 'Verdigris', 'Honeyed', 'Storm', 'Ember', 'Frosty', 'Plum', 'Briar', 'Gilt', 'Sable', 'Mossy', 'Brined', 'Copper', 'Waxy', 'Smoked', 'Candied', 'Amber', 'Dusky'];

const TYPE_NAMES = {
  stein: 'Stein',
  mug: 'Mug',
  pint: 'Pint Glass',
  wine: 'Wine Glass',
  goblet: 'Goblet',
  teacup: 'Teacup',
  enamel: 'Enamel Mug',
  bottle: 'Canteen',
};

const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

function hashHandle(name) {
  let x = 2166136261;
  for (let i = 0; i < name.length; i++) {
    x ^= name.charCodeAt(i);
    x = Math.imul(x, 16777619) >>> 0;
  }
  return x >>> 0;
}

function specFor(handle) {
  const x = hashHandle(handle.toLowerCase());
  const pick = (arr, shift) => arr[(x >>> shift) % arr.length];
  const roll = x % 100;
  const rarity = roll < 52 ? 'Common' : roll < 79 ? 'Uncommon' : roll < 93 ? 'Rare' : roll < 98 ? 'Epic' : 'Legendary';
  const type = pick(TYPES, 3);
  return {
    type,
    typeName: TYPE_NAMES[type],
    body: pick(BODIES, 7),
    band: pick(BANDS, 11),
    lid: '#A9A79F',
    trim: '#E2B54A',
    emblem: '#1E9450',
    rarity,
    name: `The ${pick(ADJECTIVES, 17)} ${TYPE_NAMES[type]}`,
  };
}

// Flavor attributes shown on the vessel showcase card.
function attrsFor(spec) {
  const wear = ['Lightly crazed', 'Chipped rim', 'Scuffed base', 'Dented once', 'Patina', 'Good as new', 'Ring stains', 'Hairline crack'];
  const x = hashHandle(spec.name + spec.body);
  const pick = (arr, shift) => arr[(x >>> shift) % arr.length];
  const attrs = [['Wear', pick(wear, 3)]];
  switch (spec.type) {
    case 'stein':
      attrs.unshift(['Glaze', 'Salt-glazed stoneware'], ['Band', 'Pewter ring'], ['Lid', 'Pewter thumb-lift']);
      break;
    case 'mug':
      attrs.unshift(['Glaze', 'Heavy stoneware'], ['Body', 'Pulled handle'], ['Band', 'Drip glaze']);
      break;
    case 'pint':
      attrs.unshift(['Glass', 'Pressed, straight'], ['Decal', 'House roundel'], ['Fill', 'Amber']);
      break;
    case 'wine':
      attrs.unshift(['Glass', 'Stemmed crystal'], ['Bowl', 'Wide'], ['Trim', 'Gilt rim']);
      break;
    case 'goblet':
      attrs.unshift(['Metal', 'Hammered brass'], ['Collar', 'Walnut'], ['Stones', 'Three set']);
      break;
    case 'teacup':
      attrs.unshift(['Body', 'Bone china'], ['Trim', 'Gilt edge'], ['Saucer', 'Matched']);
      break;
    case 'enamel':
      attrs.unshift(['Body', 'Enamelled steel'], ['Rim', 'Stainless'], ['Band', 'Painted stripe']);
      break;
    case 'bottle':
      attrs.unshift(['Body', 'Powder-coated steel'], ['Cap', 'Black screw'], ['Label', 'Paper, faded']);
      break;
  }
  return attrs.map(([k, v]) => ({ k, v }));
}

module.exports = { specFor, attrsFor, hashHandle, TYPE_NAMES, RARITY_ORDER };
