import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adventDoors, budapestDate } from "./calendar.ts";
import { CHRISTMAS_IDS, playerHref, publicPaths, sitemapXml, songBySlug, songMeta } from "./christmas.ts";
import { partnerTag } from "./partner.ts";
import { REPERTOIRE } from "./repertoire.ts";
import { notePlayed, RECORDER_AFTER } from "./storage.ts";

describe("budapest date", () => {
  it("uses Europe/Budapest, including the evening before 1 December", () => {
    assert.deepEqual(budapestDate(new Date("2026-11-09T12:00:00Z")), { year: 2026, month: 11, day: 9 });
    assert.deepEqual(budapestDate(new Date("2026-11-30T22:30:00Z")), { year: 2026, month: 11, day: 30 });
    assert.deepEqual(budapestDate(new Date("2026-11-30T23:30:00Z")), { year: 2026, month: 12, day: 1 });
  });
});

describe("advent doors", () => {
  it("stays closed before December and does not name a song", () => {
    const doors = adventDoors({ year: 2026, month: 11, day: 9 }, CHRISTMAS_IDS);
    assert.equal(doors.length, 24);
    assert.ok(doors.every((door) => door.state === "waiting" && door.songId === null));
  });

  it("opens one existing song per day from 1 December and leaves the rest empty", () => {
    const first = adventDoors({ year: 2026, month: 12, day: 1 }, CHRISTMAS_IDS);
    assert.equal(first[0]?.state, "open");
    assert.equal(first[0]?.songId, "pelyhes");
    assert.ok(first.slice(1).every((door) => door.state === "locked" && door.songId === null));

    const mid = adventDoors({ year: 2026, month: 12, day: 10 }, CHRISTMAS_IDS);
    assert.deepEqual(
      mid.filter((door) => door.state === "open").map((door) => door.songId),
      [...CHRISTMAS_IDS],
    );
    assert.ok(
      mid
        .filter((door) => door.day > CHRISTMAS_IDS.length && door.day <= 10)
        .every((door) => door.state === "empty" && door.songId === null),
    );
    assert.ok(mid.filter((door) => door.day > 10).every((door) => door.state === "locked" && door.songId === null));

    const late = adventDoors({ year: 2026, month: 12, day: 31 }, CHRISTMAS_IDS);
    assert.equal(late[5]?.state, "open");
    assert.equal(late[6]?.state, "empty");

    const next = adventDoors({ year: 2027, month: 1, day: 2 }, CHRISTMAS_IDS);
    assert.ok(next.every((door) => door.state === "waiting" && door.songId === null));
  });
});

describe("christmas pages", () => {
  it("lists every song page in the sitemap, with the slug equal to the song id", () => {
    for (const id of CHRISTMAS_IDS) {
      assert.ok(REPERTOIRE.some((song) => song.id === id), id);
      assert.equal(songBySlug(id)?.id, id);
    }
    assert.equal(songBySlug("no-such-song"), undefined);
    const paths = publicPaths();
    assert.ok(paths.includes("/"));
    assert.ok(paths.includes("/advent"));
    assert.ok(paths.includes("/tanar"));
    for (const id of CHRISTMAS_IDS) assert.ok(paths.includes(`/dal/${id}`));
    const xml = sitemapXml("https://foxy.example");
    for (const path of paths) assert.ok(xml.includes(`<loc>https://foxy.example${path}</loc>`));
    assert.ok(sitemapXml("https://ex.test?a=1&b=2").includes("&amp;"));
  });

  it("uses the Hungarian search phrases with the song's own diacritics", () => {
    const song = songBySlug("mennybol-az-angyal");
    assert.ok(song);
    const meta = songMeta(song!);
    assert.equal(meta.title, "Mennyből az angyal szöveg");
    assert.equal(meta.description, "Mennyből az angyal xilofon kotta. Mennyből az angyal szöveg.");
  });

  it("keeps a safe from tag and lets the page language win", () => {
    const href = playerHref("pelyhes", "de", "?from=Paper_1&ref=OK&lang=hu&x=1");
    const query = new URLSearchParams(href.slice(2));
    assert.equal(query.get("song"), "pelyhes");
    assert.equal(query.get("lang"), "de");
    assert.equal(query.get("from"), "paper_1");
    assert.equal(query.get("ref"), "ok");
    assert.equal(query.get("x"), null);
    const plain = new URLSearchParams(playerHref("kirje", "hu", "").slice(2));
    assert.equal(plain.get("from"), null);
    assert.equal(plain.get("lang"), "hu");
  });
});

describe("partner tag", () => {
  it("accepts the poster charset and rejects the rest", () => {
    assert.equal(partnerTag("Paper"), "paper");
    assert.equal(partnerTag(" a_b-1 "), "a_b-1");
    assert.equal(partnerTag("a".repeat(32)), "a".repeat(32));
    assert.equal(partnerTag("a".repeat(33)), null);
    assert.equal(partnerTag("bad tag"), null);
    assert.equal(partnerTag(""), null);
  });
});

describe("finished songs", () => {
  it("counts a song once, and the recorder card waits for five different ids", () => {
    assert.equal(RECORDER_AFTER, 5);
    assert.deepEqual(notePlayed(undefined, "pelyhes"), ["pelyhes"]);
    assert.deepEqual(notePlayed(["pelyhes"], "pelyhes"), ["pelyhes"]);
    const five = ["pelyhes", "kirje", "pasztorok", "kiskaracsony", "jingle-bells"].reduce<string[]>(
      (list, id) => notePlayed(list, id),
      [],
    );
    assert.equal(five.length, RECORDER_AFTER);
    assert.equal(notePlayed(five, "pelyhes").length, RECORDER_AFTER);
    assert.deepEqual(notePlayed([], "Not A Song"), []);
    assert.equal(notePlayed(five, "mennybol-az-angyal").length, 6);
  });
});
