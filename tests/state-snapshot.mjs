/**
 * gatherPersistedState 키 스냅샷 — js/app.js gatherPersistedState() 반환 객체와 동기화.
 * 실행: node tests/state-snapshot.mjs
 */

import assert from "node:assert/strict";

const EXPECTED_KEYS = [
  "userName",
  "goalHours",
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
sample.memoryMoments = [];

const keys = Object.keys(sample).sort();
const expected = [...EXPECTED_KEYS].sort();
assert.deepEqual(keys, expected, "gatherPersistedState 키 목록과 샘플 키가 일치해야 합니다");

console.log("state-snapshot.mjs OK");
