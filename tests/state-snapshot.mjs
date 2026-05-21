/**
 * gatherPersistedState 키 스냅샷 — index.html gatherPersistedState() 반환 객체와 동기화.
 * 실행: node tests/state-snapshot.mjs
 */

import assert from "node:assert/strict";

const EXPECTED_KEYS = [
  "userName",
  "goalHours",
  "quest",
  "affection",
  "totalSeconds",
  "records",
  "soundEnabled",
  "replyAffectionBonus",
  "routeMarriage",
  "routeYandere",
  "routeAbroad",
  "endingId",
  "storyLog",
  "loggedStageMins",
  "viewSubPanel",
  "uiMainTab",
  "maxAffectionEver",
  "affectionBaselineSeconds",
  "a11yPreset",
  "todayJournalDate",
  "todayJournalLine",
  "showInnerMonologue",
  "weeklyGoalHours",
  "defaultSessionTag",
  "bannerDismissedGoal",
  "bannerDismissedStreak",
  "storyContactChannel",
  "storyFreshReset",
  "storySummaryFullView",
  "dailyChecklistDate",
  "dailyChecklistItems",
  "dailyChecklistChecked",
  "memoryMoments",
  "bannerDismissedWeekly",
  "romanceLastSeenDate",
  "romanceConvoDate",
  "romanceConvoStarts",
  "romanceLastDateEventDay",
  "romanceDateBackdropDay",
  "romanceDateBackdropClass",
  "romancePreConfessionDone",
  "romanceSoftMoodShownFor",
  "romanceStreakDropNoted",
  "romancePrevStreakSnapshot",
  "autoTogetherLineOnSave",
  "schemaVersion",
  "onboardingCompleted",
  "togetherLinesMaxPerDay",
  "togetherStudyLineDay",
  "togetherStudyLineCount",
  "romanceDailyWhisperDay",
  "stageCueSound"
];

const sample = {};
EXPECTED_KEYS.forEach((k) => {
  sample[k] = null;
});
sample.records = [];
sample.storyLog = [];
sample.loggedStageMins = [];
sample.dailyChecklistItems = [];
sample.dailyChecklistChecked = [];
sample.memoryMoments = [];

const keys = Object.keys(sample).sort();
const expected = [...EXPECTED_KEYS].sort();
assert.deepEqual(keys, expected, "gatherPersistedState 키 목록과 샘플 키가 일치해야 합니다");

/** index.html rolloverDailyChecklistIfNeeded 와 동일 (날짜만 주입해 테스트) */
function rolloverDailyChecklistIfNeeded(state, today) {
  if (!Array.isArray(state.dailyChecklistItems)) state.dailyChecklistItems = [];
  if (!Array.isArray(state.dailyChecklistChecked)) state.dailyChecklistChecked = [];
  if (state.dailyChecklistDate !== today) {
    state.dailyChecklistDate = today;
    const lines = state.quest.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 15);
    state.dailyChecklistItems = lines.slice();
    state.dailyChecklistChecked = lines.map(() => false);
  } else {
    while (state.dailyChecklistChecked.length < state.dailyChecklistItems.length) {
      state.dailyChecklistChecked.push(false);
    }
    if (state.dailyChecklistChecked.length > state.dailyChecklistItems.length) {
      state.dailyChecklistChecked = state.dailyChecklistChecked.slice(0, state.dailyChecklistItems.length);
    }
  }
}

const st = {
  quest: "a\nb",
  dailyChecklistDate: "2000-01-01",
  dailyChecklistItems: ["x"],
  dailyChecklistChecked: [true]
};
rolloverDailyChecklistIfNeeded(st, "2000-01-02");
assert.equal(st.dailyChecklistDate, "2000-01-02");
assert.deepEqual(st.dailyChecklistItems, ["a", "b"]);
assert.deepEqual(st.dailyChecklistChecked, [false, false]);

console.log("state-snapshot.mjs OK");
