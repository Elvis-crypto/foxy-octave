import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCompletion,
  cleanPath,
  cleanTrack,
  fillPageHits,
  formatCompletionRate,
  normalizePagePath,
  topSongRow,
} from "./stats-clean.ts";

describe("cleanTrack kinds", () => {
  it("accepts play and finish when a valid song id is present", () => {
    const play = cleanTrack({ kind: "play", song: "boci", ref: "paper", path: "/advent" });
    assert.equal(play?.kind, "play");
    assert.equal(play?.song, "boci");
    assert.equal(play?.src, "paper");
    assert.equal(play?.channel, null);
    assert.equal(play?.sessionStart, false);
    assert.equal(play?.path, null);

    const finish = cleanTrack({ kind: "finish", song: "pelyhes", from: "fb", sessionStart: true });
    assert.equal(finish?.kind, "finish");
    assert.equal(finish?.song, "pelyhes");
    assert.equal(finish?.src, "fb");
    assert.equal(finish?.sessionStart, false);
    assert.equal(finish?.path, null);
  });

  it("rejects play and finish without a valid song id", () => {
    assert.equal(cleanTrack({ kind: "play" }), null);
    assert.equal(cleanTrack({ kind: "finish", song: "" }), null);
    assert.equal(cleanTrack({ kind: "play", song: "Not A Song" }), null);
    assert.equal(cleanTrack({ kind: "finish", song: "x".repeat(81) }), null);
  });

  it("keeps share and falls unknown kinds back to view", () => {
    const share = cleanTrack({ kind: "share", channel: "copy", song: "boci" });
    assert.equal(share?.kind, "share");
    assert.equal(share?.channel, "copy");
    assert.equal(share?.song, "boci");

    const view = cleanTrack({ kind: "click", path: "/", sessionStart: true });
    assert.equal(view?.kind, "view");
    assert.equal(view?.path, "/");
    assert.equal(view?.sessionStart, true);
    assert.equal(view?.src, "direct");
  });
});

describe("path whitelist", () => {
  it("accepts the five stored shapes", () => {
    assert.equal(cleanPath("/"), "/");
    assert.equal(cleanPath("/advent"), "/advent");
    assert.equal(cleanPath("/plakat"), "/plakat");
    assert.equal(cleanPath("/tanar"), "/tanar");
    assert.equal(cleanPath("/dal/pelyhes"), "/dal/pelyhes");
    assert.equal(cleanPath("/dal/mennybol-az-angyal"), "/dal/mennybol-az-angyal");
    assert.equal(cleanPath(`/dal/${"a".repeat(80)}`), `/dal/${"a".repeat(80)}`);
  });

  it("rejects query strings, fragments, and anything off the whitelist", () => {
    assert.equal(cleanPath("/advent?from=paper"), null);
    assert.equal(cleanPath("/?song=boci"), null);
    assert.equal(cleanPath("/dal/pelyhes#verse"), null);
    assert.equal(cleanPath("/dal/pelyhes?lang=hu"), null);
    assert.equal(cleanPath("/home"), null);
    assert.equal(cleanPath("/advent/"), null);
    assert.equal(cleanPath("/dal/"), null);
    assert.equal(cleanPath("/dal/Foo"), null);
    assert.equal(cleanPath("/dal/foo_bar"), null);
    assert.equal(cleanPath("/dal/foo/bar"), null);
    assert.equal(cleanPath(`/dal/${"a".repeat(81)}`), null);
    assert.equal(cleanPath("advent"), null);
    assert.equal(cleanPath(""), null);
    assert.equal(cleanPath(undefined), null);
    assert.equal(normalizePagePath("/dal/pelyhes"), "/dal/*");
    assert.equal(normalizePagePath("/advent"), "/advent");
    assert.equal(normalizePagePath("/nope"), null);
  });
});

describe("completion rate", () => {
  it("formats finished/started and uses an en-dash when nothing was started", () => {
    assert.equal(formatCompletionRate(0, 0), "–");
    assert.equal(formatCompletionRate(0, 5), "–");
    assert.equal(formatCompletionRate(10, 0), "0%");
    assert.equal(formatCompletionRate(4, 2), "50%");
    assert.equal(formatCompletionRate(3, 1), "33%");
    assert.equal(formatCompletionRate(1, 1), "100%");
    assert.equal(addCompletion({ started: 0, finished: 0 }).completion, "–");
    assert.equal(topSongRow({ song: "boci", started: 8, finished: 2 }).starts, 8);
    assert.equal(topSongRow({ song: "boci", started: 8, finished: 2 }).finishes, 2);
    assert.equal(topSongRow({ song: "boci", started: 8, finished: 2 }).completion, "25%");
  });

  it("fills the five page-hit rows and rolls missing pages to zero", () => {
    const rows = fillPageHits([
      { page: "/", views: 10, visitors: 4 },
      { page: "/dal/*", views: 3, visitors: 2 },
      { page: "/secret", views: 9, visitors: 9 },
    ]);
    assert.deepEqual(
      rows.map((r) => r.page),
      ["/", "/advent", "/plakat", "/tanar", "/dal/*"],
    );
    assert.equal(rows[0]?.views, 10);
    assert.equal(rows[1]?.views, 0);
    assert.equal(rows[4]?.visitors, 2);
  });
});
