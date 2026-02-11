import { describe, it, expect } from "vitest";
import { parseArmyListText, matchWarscroll, matchBattleTrait } from "./parse-army-list";

describe("parseArmyListText", () => {
  it("parses Idoneth example", () => {
    const input = `2025 league 2000/2000 pts

Idoneth Deepkin
Akhelian Beastmasters (20 Points)
General's Handbook 2025-26
Drops: 2
Spell Lore - Lore of the Deeps
Manifestation Lore - Lore of the Abyss

General's Regiment
Eidolon of Mathlann, Aspect of the Sea (340)
 • General
 • Endless Sea-storm
 • Armour of the Cythai
Akhelian Leviadon (470)
Akhelian Morrsarr Guard (340)
 • Reinforced
Akhelian Morrsarr Guard (340)
 • Reinforced
Namarti Thralls (200)
 • Reinforced

Regiments of Renown
Saviours of Cinderfall (290)
Callis and Toll
Toll's Companions

Faction Terrain
Gloomtide Shipwreck

Created with Warhammer Age of Sigmar: The App
App: 1.25.0 | Data: 380`;

    const result = parseArmyListText(input);
    expect(result.name).toBe("2025 league");
    expect(result.faction).toBe("Idoneth Deepkin");
    expect(result.battleFormation).toBe("Akhelian Beastmasters");
    expect(result.spellLores).toContain("Lore of the Deeps");
    expect(result.manifestationLores).toContain("Lore of the Abyss");
    expect(result.unitNames).toContain("Eidolon of Mathlann, Aspect of the Sea");
    expect(result.unitNames).toContain("Akhelian Leviadon");
    expect(result.unitNames).toContain("Namarti Thralls");
    expect(result.unitNames).toContain("Callis and Toll");
    expect(result.unitNames).toContain("Toll's Companions");
    expect(result.unitNames).not.toContain("Gloomtide Shipwreck");
    expect(result.unitNames.filter((n) => n.includes("Morrsarr")).length).toBe(1);
    expect(result.enhancementNames).toContain("Endless Sea-storm");
    expect(result.enhancementNames).toContain("Armour of the Cythai");
    expect(result.enhancementNames).not.toContain("General");
    expect(result.enhancementNames).not.toContain("Reinforced");
    const callis = result.unitRegiments.find((u) => u.unitName === "Callis and Toll");
    expect(callis?.regimentOfRenown).toBe("Saviours of Cinderfall");
  });

  it("parses Lumineth example", () => {
    const input = `Shadow Aelves 1990/2000 pts

Lumineth Realm-lords
Vanari Battlehost (10 Points)
General's Handbook 2025-26
Drops: 2
Spell Lore - Lore of Prismatic Resonance (10 Points)
Manifestation Lore - Manifestations of Hysh

General's Regiment
Sevireth, Lord of the Seventh Wind (340)
 • General
Scourge of Ghyran The Light of Eltharion (280)
Vanari Auralan Sentinels (320)
 • Reinforced
Vanari Dawnriders (440)
 • Reinforced
Vanari Dawnriders (440)
 • Reinforced

Regiment 1
Scinari Cathallar (130)
 • Paragon of Hysh
 • Silver Wand - (20) Points 

Faction Terrain
Shrine Luminor (20 Points)

Created with Warhammer Age of Sigmar: The App
App: 1.25.0 | Data: 380`;

    const result = parseArmyListText(input);
    expect(result.name).toBe("Shadow Aelves");
    expect(result.faction).toBe("Lumineth Realm-lords");
    expect(result.battleFormation).toBe("Vanari Battlehost");
    expect(result.spellLores).toContain("Lore of Prismatic Resonance");
    expect(result.unitNames).toContain("Scourge of Ghyran The Light of Eltharion");
    expect(result.unitNames).toContain("Scinari Cathallar");
    expect(result.unitNames.filter((n) => n.includes("Dawnriders")).length).toBe(1);
    expect(result.enhancementNames).toContain("Paragon of Hysh");
    expect(result.enhancementNames).toContain("Silver Wand");
  });
});
