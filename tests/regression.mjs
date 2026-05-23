/**
 * index.html 로직과 맞출 것: 호감도 곡선, 레코드 정규화, 초기화 시나리오 스모크.
 * 실행: node tests/regression.mjs
 */

import { migratePersistedPayload, PERSIST_SCHEMA_VERSION, sanitizeRecordRow as sanitizeRecordRowFromState } from "../js/state.js";

function calcAffectionBySeconds(seconds) {
  const hours = Math.max(0, seconds) / 3600;
  return Math.floor(hours * 3 + Math.sqrt(hours) * 2);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assert failed");
}

// --- 호감도: 기준선 이후 studyOnly에만 곡선 (index.html recalcAffectionTotal) ---
function affectionFromStudyOnly(total, baseline, bonus) {
  const t = Math.max(0, total);
  let b = Math.max(0, baseline);
  if (b > t) b = t;
  const studyOnly = Math.max(0, t - b);
  return Math.max(0, calcAffectionBySeconds(studyOnly) + Number(bonus || 0));
}

assert(calcAffectionBySeconds(0) === 0, "0초");
const oneHour = 3600;
const aff1h = calcAffectionBySeconds(oneHour);
assert(aff1h > 0, "1시간 양수");

const totalBig = 200 * 3600;
const baseline = totalBig - oneHour;
const newStyle = affectionFromStudyOnly(totalBig, baseline, 0);
assert(newStyle === aff1h, "기준선 직후 1시간은 calc(1시간)과 같아야 함 (곡선 앞구간 재적용)");

function sanitizeRecordRow(r) {
  if (!r || typeof r !== "object") return null;
  const date = String(r.date || "").trim();
  const seconds = Math.max(0, Math.round(Number(r.seconds || 0)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || seconds <= 0) return null;
  const out = {
    date: date,
    seconds: seconds,
    quest: String(r.quest != null ? r.quest : "").trim(),
    source: String(r.source != null ? r.source : "manual").trim() || "manual"
  };
  const tag = String(r.tag != null ? r.tag : "").trim().slice(0, 24);
  if (tag) out.tag = tag;
  const note = String(r.note != null ? r.note : "").trim().slice(0, 200);
  if (note) out.note = note;
  const intent = String(r.intent != null ? r.intent : "").trim().slice(0, 120);
  if (intent) out.intent = intent;
  const shRaw = r.startHour;
  if (shRaw !== undefined && shRaw !== null && shRaw !== "") {
    const sh = Math.round(Number(shRaw));
    if (Number.isFinite(sh) && sh >= 0 && sh <= 23) out.startHour = sh;
  }
  return out;
}

const longIntent = "가".repeat(200);
const sr = sanitizeRecordRow({ date: "2026-05-12", seconds: 60, intent: longIntent, startHour: "14", tag: "t".repeat(40) });
assert(sr && sr.intent.length === 120 && sr.startHour === 14 && sr.tag.length === 24, "sanitize intent·startHour·tag");

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function mondayKeyOfWeekContaining(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return dateKey(x);
}

function previousWeekMondayKey(now) {
  const mk = mondayKeyOfWeekContaining(now);
  const anchor = new Date(mk + "T12:00:00");
  anchor.setDate(anchor.getDate() - 7);
  return dateKey(anchor);
}

const sampleThu = new Date(2026, 4, 14);
assert(mondayKeyOfWeekContaining(sampleThu) === "2026-05-11", "주간 월요일 키");
assert(previousWeekMondayKey(sampleThu) === "2026-05-04", "지난주 월요일 키");

const migrated = migratePersistedPayload({ records: [], storyLog: [] });
assert(migrated.schemaVersion === PERSIST_SCHEMA_VERSION, "옛 저장본 마이그레이션 후 스키마 버전");
assert(migrated.onboardingCompleted === false, "온보딩 기본값");

const migratedOld = migratePersistedPayload({ records: [{ date: "2026-01-01", seconds: 60, quest: "", source: "manual" }], storyLog: [] });
assert(migratedOld.onboardingCompleted === true, "기존 사용자는 온보딩 스킵");

const migratedJournal = migratePersistedPayload({
  schemaVersion: 2,
  todayJournalDate: "2026-01-01",
  todayJournalLine: "옛 일기",
  affection: 5,
  maxAffectionEver: 40
});
assert(migratedJournal.schemaVersion === PERSIST_SCHEMA_VERSION, "v3 마이그레이션");
assert(migratedJournal.todayJournalLine === "", "은퇴한 오늘 한 줄 필드 제거");
assert(migratedJournal.maxAffectionEver === 5, "최고 호감도는 현재 호감도 이하로 정리");

const srState = sanitizeRecordRowFromState({ date: "2026-05-12", seconds: 60 });
assert(srState && srState.seconds === 60, "state.js sanitizeRecordRow");

console.log("tests/regression.mjs — OK");
