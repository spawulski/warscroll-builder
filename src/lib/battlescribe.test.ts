/**
 * Tests for BattleScribe catalogue parser.
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { parseCatXml } from "./battlescribe";

const FYRESLAYERS_CAT_PATH = path.resolve(process.cwd(), "bs-data-examples", "Fyreslayers - Library.cat");

const NS = "http://www.battlescribe.net/schema/catalogueSchema";

/** Minimal catalogue XML with default namespace: one unit with one passive ability (like Fyreslayers). */
const MINIMAL_PASSIVE_CATALOGUE = `<?xml version="1.0" encoding="UTF-8"?>
<catalogue xmlns="${NS}" name="Test - Library">
  <sharedSelectionEntries>
    <selectionEntry type="unit" name="Test Unit" id="test-1">
      <profiles>
        <profile name="Test Unit" typeId="u" typeName="Unit">
          <characteristics>
            <characteristic name="Move">6"</characteristic>
            <characteristic name="Health">5</characteristic>
            <characteristic name="Save">4+</characteristic>
            <characteristic name="Control">2</characteristic>
          </characteristics>
        </profile>
        <profile name="Volcanic Blood" typeId="907f-a48-6a04-f788" typeName="Ability (Passive)" id="p1">
          <characteristics>
            <characteristic name="Keywords"/>
            <characteristic name="Effect">If you make an unmodified save roll of 1, inflict 1 mortal damage.</characteristic>
          </characteristics>
          <attributes>
            <attribute name="Color">Red</attribute>
            <attribute name="Type">Offensive</attribute>
          </attributes>
        </profile>
      </profiles>
      <categoryLinks>
        <categoryLink name="ORDER"/>
      </categoryLinks>
      <selectionEntries>
        <selectionEntry type="model" name="Model">
          <selectionEntries>
            <selectionEntry type="upgrade" name="Weapon">
              <profiles>
                <profile name="Sword" typeId="w" typeName="Melee Weapon">
                  <characteristics>
                    <characteristic name="Atk">3</characteristic>
                    <characteristic name="Hit">3+</characteristic>
                    <characteristic name="Wnd">3+</characteristic>
                    <characteristic name="Rnd">1</characteristic>
                    <characteristic name="Dmg">1</characteristic>
                    <characteristic name="Ability">-</characteristic>
                  </characteristics>
                </profile>
              </profiles>
            </selectionEntry>
          </selectionEntries>
        </selectionEntry>
      </selectionEntries>
    </selectionEntry>
  </sharedSelectionEntries>
</catalogue>`;

/** Same structure but attribute order like Fyreslayers (name before typeId). */
const FYRESLAYERS_STYLE_PASSIVE = `<?xml version="1.0" encoding="UTF-8"?>
<catalogue xmlns="${NS}" name="Fyreslayers - Library">
  <sharedSelectionEntries>
    <selectionEntry type="unit" name="Auric Runeson" id="ar-1">
      <profiles>
        <profile name="Auric Runeson" typeId="ff03-376e-972f-8ab2" typeName="Unit">
          <characteristics>
            <characteristic name="Move">10"</characteristic>
            <characteristic name="Health">14</characteristic>
            <characteristic name="Save">4+</characteristic>
            <characteristic name="Control">5</characteristic>
          </characteristics>
        </profile>
        <profile name="Volcanic Blood" typeId="907f-a48-6a04-f788" typeName="Ability (Passive)" hidden="false" id="vb-1">
          <characteristics>
            <characteristic name="Keywords" typeId="b977-7c5e-33b2-428e"/>
            <characteristic name="Effect" typeId="fd7f-888d-3257-a12b">If you make an unmodified save roll of 1 for a combat attack that targets this unit, inflict 1 mortal damage.</characteristic>
          </characteristics>
          <attributes>
            <attribute name="Color" typeId="50fe-4f29-6bc3-dcc6">Red</attribute>
            <attribute name="Type" typeId="bf11-4e10-3ab1-06f4">Offensive</attribute>
          </attributes>
        </profile>
      </profiles>
      <categoryLinks>
        <categoryLink name="ORDER"/>
      </categoryLinks>
      <selectionEntries>
        <selectionEntry type="model" name="Model">
          <selectionEntries>
            <selectionEntry type="upgrade" name="Weapon">
              <profiles>
                <profile name="Sword" typeId="w" typeName="Melee Weapon">
                  <characteristics>
                    <characteristic name="Atk">3</characteristic>
                    <characteristic name="Hit">3+</characteristic>
                    <characteristic name="Wnd">3+</characteristic>
                    <characteristic name="Rnd">1</characteristic>
                    <characteristic name="Dmg">1</characteristic>
                    <characteristic name="Ability">-</characteristic>
                  </characteristics>
                </profile>
              </profiles>
            </selectionEntry>
          </selectionEntries>
        </selectionEntry>
      </selectionEntries>
    </selectionEntry>
  </sharedSelectionEntries>
</catalogue>`;

describe("parseCatXml", () => {
  it("DOM parsing finds selectionEntry and type/name attributes in namespaced XML", () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(MINIMAL_PASSIVE_CATALOGUE, "text/xml");
    const catalogue = doc.documentElement;
    const ns = catalogue.namespaceURI || "";
    const shared = Array.from(doc.getElementsByTagNameNS(ns, "sharedSelectionEntries"))[0];
    expect(shared).toBeDefined();
    const entries = Array.from(shared!.children).filter((c) => c.namespaceURI === ns && c.localName === "selectionEntry");
    expect(entries.length).toBe(1);
    const entry = entries[0] as Element;
    const typeAttr = entry.getAttribute("type") ?? entry.getAttributeNS(null, "type");
    expect(typeAttr).toBe("unit");
    const nameAttr = entry.getAttribute("name") ?? entry.getAttributeNS(null, "name");
    expect(nameAttr).toBe("Test Unit");
  });

  it("parses a unit with Ability (Passive) so that the ability has timing Passive and no phase", () => {
    const { warscrolls } = parseCatXml(MINIMAL_PASSIVE_CATALOGUE);
    expect(warscrolls.length).toBeGreaterThanOrEqual(1, `Expected ≥1 warscroll, got ${warscrolls.length}. Names: [${warscrolls.map((w) => w.name).join(", ")}]`);
    const unit = warscrolls.find((w) => w.name === "Test Unit") ?? warscrolls.find((w) => w.abilities.some((a) => a.name === "Volcanic Blood"));
    expect(unit).toBeDefined(`No warscroll with "Test Unit" or ability "Volcanic Blood". Got names: [${warscrolls.map((w) => w.name).join(", ")}]`);
    const volcanicBlood = unit!.abilities.find((a) => a.name === "Volcanic Blood");
    expect(volcanicBlood).toBeDefined();
    expect(volcanicBlood!.timing).toBe("Passive");
    expect(volcanicBlood!.phase).toBeUndefined();
    expect(volcanicBlood!.abilityType).toBeUndefined();
  });

  it("parses Fyreslayers-style XML so passive ability has timing Passive", () => {
    const { warscrolls } = parseCatXml(FYRESLAYERS_STYLE_PASSIVE);
    expect(warscrolls.length).toBeGreaterThanOrEqual(1);
    const unit = warscrolls.find((w) => w.name === "Auric Runeson") ?? warscrolls.find((w) => w.abilities.some((a) => a.name === "Volcanic Blood"));
    expect(unit).toBeDefined();
    const volcanicBlood = unit!.abilities.find((a) => a.name === "Volcanic Blood");
    expect(volcanicBlood).toBeDefined();
    expect(volcanicBlood!.timing).toBe("Passive");
    expect(volcanicBlood!.phase).toBeUndefined();
    expect(volcanicBlood!.abilityType).toBeUndefined();
  });

  it("parses real Fyreslayers catalogue: passive abilities have timing Passive", () => {
    if (!fs.existsSync(FYRESLAYERS_CAT_PATH)) {
      console.warn("Skipping real file test: bs-data-examples/Fyreslayers - Library.cat not found");
      return;
    }
    const xml = fs.readFileSync(FYRESLAYERS_CAT_PATH, "utf-8");
    const { warscrolls } = parseCatXml(xml);
    const unit = warscrolls.find(
      (w) =>
        w.name === "Auric Runeson on Magmadroth" ||
        w.abilities.some((a) => a.name === "Volcanic Blood" && w.abilities.some((b) => b.name === "Vying for Glory"))
    );
    expect(unit).toBeDefined();
    const passiveNames = ["Volcanic Blood", "Battle Damaged", "Vying for Glory"];
    for (const name of passiveNames) {
      const ability = unit!.abilities.find((a) => a.name === name);
      expect(ability).toBeDefined();
      expect(ability!.timing).toBe("Passive");
      expect(ability!.phase).toBeUndefined();
      expect(ability!.abilityType).toBeUndefined();
    }
  });

  it("passive ability produces display label 'Passive' (contract with AbilityBlock)", () => {
    const { warscrolls } = parseCatXml(MINIMAL_PASSIVE_CATALOGUE);
    const unit = warscrolls.find((w) => w.abilities.some((a) => a.name === "Volcanic Blood"));
    const ability = unit!.abilities.find((a) => a.name === "Volcanic Blood")!;
    const label =
      ability.timing === "Passive"
        ? "Passive"
        : [ability.abilityType, [ability.timing, ability.phase].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    expect(label).toBe("Passive");
  });
});
