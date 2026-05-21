/**
 * 마일스톤·도전 과제 달성 배지용 플랫 아이콘 (단색 실루엣, currentColor).
 * viewBox 0 0 24 24 — Flaticon식 미니멀 도구 아이콘 톤
 */
export const MILESTONE_BADGE_SVGS = {
  m1:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M6 2h3v20H6V2zm3 4 11 6-11 6V6z"/></svg>',
  m2:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M12 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3v5.5l4.5 2.6-.9 1.5L10 12.2V7h2z"/></svg>',
  m3:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M9 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm6 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM9 9v4.5l3.2 1.8-.6 1.1L7 14.1V9h2zm6 1v3l2.4 1.4-.5.9L13 14.2V10h2z"/></svg>',
  m4:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M12 2c1.6 3.4 4.2 5.4 4.2 9.2A4.2 4.2 0 1 1 7.8 11.2C7.8 7.4 10.4 5.4 12 2zm0 6.4c-.9 1.5-2.1 2.6-2.1 4 1.2 2 3 2 3 0 0-1.4-1.2-2.5-2.1-4z"/></svg>',
  m5:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v2h14V6H5zm0 4v8h14v-8H5zm2 2h3v2H7v-2zm5 0h3v2h-3v-2z"/></svg>',
  m6:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M4 5h9l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0h6v2h-4l-2-2zm-1 4H7v2h6V9zm0 4H7v2h6v-2z"/></svg>',
  m7:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-.8 3v6.8l5.2 3-.9 1.5-6.1-3.5V7h1.8z"/></svg>',
  m8:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M6 3h12v2H6V3zm0 4h12v14H6V7zm2 2v10h8V9H8zm1 1h2v2H9v-2zm3 0h2v2h-2v-2zm-3 3h2v2H9v-2zm3 0h2v2h-2v-2z"/></svg>',
  m9:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M12 2l2.6 5.3 5.8.8-4.2 4.1 1 5.7L12 15l-5.2 2.9 1-5.7-4.2-4.1 5.8-.8L12 2z"/></svg>'
};

/** 오늘 퀘스트(도전 과제) 전부 달성 — 클립보드 + 체크 실루엣 */
export const DAILY_QUEST_COMPLETE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M8 2h8l1 2h5v2H2V4h5l1-2zm-1 6h12l-1.1 10.2a2 2 0 0 1-2 1.8h-5.8a2 2 0 0 1-2-1.8L7 8zm2.2 2.4 1.5 1.5 3.8-3.8 1.5 1.5-5.3 5.3-3-3 1.5-1.5z"/></svg>';

export function milestoneBadgeIconHtml(id) {
  return MILESTONE_BADGE_SVGS[id] || MILESTONE_BADGE_SVGS.m1;
}
