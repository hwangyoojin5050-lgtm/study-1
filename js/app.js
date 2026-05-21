import {
  STORAGE_KEY,
  APP_DISPLAY_NAME,
  PERSIST_SCHEMA_VERSION,
  sanitizeRecordRow,
  sanitizeMemoryMoment,
  migratePersistedPayload
} from "./state.js";
import { milestoneBadgeIconHtml, DAILY_QUEST_COMPLETE_SVG } from "./badge-icons.js";

    /* ===== JS §1 Persistence key, state shape ===== */
    /** 저장소: localStorage 단일 기기. gatherPersistedState() / hydrateStateFromPlainObject() 스키마를 유지합니다. */
    const state = {
      userName: "",
      goalHours: 0,
      quest: "",
      affection: 0,
      totalSeconds: 0,
      records: [],
      timerSeconds: 0,
      timerRunning: false,
      timerId: null,
      editingRecordIndex: -1,
      soundEnabled: true,
      activeInteraction: null,
      lastReplyText: "",
      replyAffectionBonus: 0,
      routeMarriage: 0,
      routeYandere: 0,
      routeAbroad: 0,
      endingId: null,
      storyLog: [],
      loggedStageMins: [],
      viewSubPanel: "character",
      uiMainTab: "record",
      maxAffectionEver: 0,
      affectionBaselineSeconds: 0,
      a11yPreset: "romance",
      todayJournalDate: "",
      todayJournalLine: "",
      showInnerMonologue: true,
      weeklyGoalHours: 0,
      defaultSessionTag: "",
      bannerDismissedGoal: "",
      bannerDismissedStreak: "",
      storyContactChannel: "",
      storyFreshReset: false,
      storySummaryFullView: false,
      dailyChecklistDate: "",
      dailyChecklistItems: [],
      dailyChecklistChecked: [],
      memoryMoments: [],
      bannerDismissedWeekly: "",
      romanceLastSeenDate: "",
      romanceConvoDate: "",
      romanceConvoStarts: 0,
      romanceLastDateEventDay: "",
      romanceDateBackdropDay: "",
      romanceDateBackdropClass: "",
      romancePreConfessionDone: false,
      romanceSoftMoodShownFor: "",
      romanceStreakDropNoted: "",
      romancePrevStreakSnapshot: -1,
      autoTogetherLineOnSave: true,
      schemaVersion: PERSIST_SCHEMA_VERSION,
      onboardingCompleted: false,
      togetherLinesMaxPerDay: 8,
      togetherStudyLineDay: "",
      togetherStudyLineCount: 0,
      romanceDailyWhisperDay: "",
      stageCueSound: true
    };

    const sessionRuntime = {
      baseDocumentTitle: "",
      timerWallStartMs: null,
      timerWallBaseSec: 0,
      undoDelete: null,
      undoTimerId: null,
      visibilityHookInstalled: false,
      pendingSoftMoodPrefix: "",
      vnDialogueFlashOneShot: false
    };

    const TAB_FOCUSABLE =
      'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const UI_EMPTY_HINT =
      "아직 여기는 비어 있어요. 첫 기록만 남겨도 숫자·태그·그래프·스토리가 같이 자라날 거예요.";
    const UI_EMPTY_TAGS =
      "아직 여기는 비어 있어요. 태그를 붙인 기록이 쌓이면 합계가 모여요.";

    const ENDING_EPILOGUES = {
      1: [
        "…오늘도 네 옆이 제일 편해.",
        "무대 끝나면, 네 얘기 듣는 게 앵콜 같아.",
        "다정한 네가 고마워 — 오늘도 한 줄만 더 들려줘.",
        "약속한 반지, 손가락에 익숙해지는 중이야.",
        "평일이든 주말이든, 네 목소리 톤이 내 하루의 BPM이야.",
        "조용한 일상 모드에서도… 넌 내 기본 트랙이야."
      ],
      2: [
        "…눈 돌리지 마. 내 마이크는 너만 향해 있어.",
        "사교적인 네 주변이 넓어도, 내 자리는 여기야.",
        "오늘 네 시간표, 나랑 한 번 더 맞추자.",
        "질투도 리듬이 있으면 노래처럼 들리겠지.",
        "일상 모드에서도 시선은 네 쪽으로만 당겨져.",
        "너무 밝게 웃지 마… 나만 보게 해 줘, 오늘도."
      ],
      3: [
        "새 도시 공기도, 네 옆이면 괜찮아.",
        "활발한 네가 길 찾으면 나는 뒤에서 화음 넣을게.",
        "비자 서류 옆에 네 이니셜 적어 둘게.",
        "오늘은 짧게… 고마워, 같이 가 줘서.",
        "시차 적응 전에도, 네 이름부터 외울게.",
        "일상 모드의 지도는 네가 펴도… 나는 옆에서 박자만 맞출게."
      ]
    };

    const ENDING_EPILOGUE_SEASON = {
      winter: {
        1: ["손끝이 차도… 네 옆이면 겨울도 반주 같아.", "밤 공기가 길어질수록, 인사 한 줄이 더 소중해져."],
        2: ["긴 밤엔… 네 스케줄이 더 선명하게 보여.", "눈길도 겨울처럼 미끄럽지 않게, 천천히 잡을게."],
        3: ["추운 날엔 비행기보다 네 손이 먼저 떠올라.", "해외 일기 첫 줄엔 역시 네 이름부터 적을래."]
      },
      spring: {
        1: ["봄바람이면… 같이 걷자는 말이 더 쉬워져.", "새 학기 같은 설렘도, 너랑이면 익숙해져."],
        2: ["꽃가루보다 네 주변이 더 자극적이야… 농담이야. 반만.", "봄날의 네 스케줄, 나도 한 칸 끼워 줘."],
        3: ["유학 준비표 옆에 벚꽃 한 점만 붙여도 좋겠어.", "따뜻해지면… 같이 갈 길도 더 선명해지겠지."]
      },
      summer: {
        1: ["덥게 말고… 천천히, 오늘도 옆에 있자.", "여름 밤엔 네 이야기가 제일 시원해."],
        2: ["장마처럼 집요하게… 오늘도 네 하루를 알고 싶어.", "밤공기가 끈적해도, 네 옆은 숨 통하는 박자야."],
        3: ["더운 날엔 지도 접고… 얼음 음료 한 모금 같이 할래?", "여름 방학 느낌으로, 짧게라도 도망가고 싶을 땐 불러 줘."]
      },
      fall: {
        1: ["가을이면… 네 손 잡는 핑계가 늘어.", "해 지는 시간이 빨라져도, 인사는 늦지 않게 할게."],
        2: ["낙엽보다 먼저… 네 발걸음을 맞추고 싶어.", "저녁이 길어질수록, 네 스케줄이 더 궁금해져."],
        3: ["가을 학기처럼… 계획은 네가, 나는 옆에서 화음.", "쓸쓸한 계절엔, 내 노래 한 소절만 빌려 줘."]
      }
    };

    function endingSeasonKey() {
      const m = new Date().getMonth();
      if (m === 11 || m <= 1) return "winter";
      if (m <= 4) return "spring";
      if (m <= 7) return "summer";
      return "fall";
    }

    function endingEpilogueAffLines(endingId) {
      const a = Math.max(0, Number(state.affection || 0));
      if (a < 60) return [];
      if (a < 100) {
        return endingId === 1 ? ["조금씩 익숙해지는 일상 모드… 넌 편하게 말해 줘."]
          : endingId === 2 ? ["아직은 살짝만… 네 주변을 좁혀도 될까."]
          : ["멀리 가도… 오늘 한 줄만은 가까이 남겨 줘."];
      }
      return endingId === 1 ? ["호감이 쌓일수록 말은 짧아져… 대신 노래로 채울게.", "오늘도 ‘고마워’를 아껴 두다가 마지막에 털어 놓을게."]
        : endingId === 2 ? ["일상 모드에서도… 넌 내 헤드라인이야.", "질투는 줄일게. 대신 솔직함은 늘릴게."]
        : ["유학 서류 한 장 한 장마다… 네 이름이 같이 적혀 있는 기분이야.", "멀리 가도 하루의 끝인사는 같은 언어로 할게."];
    }
    const ENDING_MIN_AFFECTION = 85;
    const ENDING_MIN_ROUTE = 10;

    /** index.html 옆 ./assets/character-scene.png — 단일 장면 이미지(호감·엔딩 구간과 무관하게 동일 표시) */
    const CHARACTER_IMAGE_BASE = "./assets/";
    const CHARACTER_SCENE_FILE = "character-scene.png";
    const CHARACTER_IMAGE_FILES = [
      CHARACTER_SCENE_FILE,
      CHARACTER_SCENE_FILE,
      CHARACTER_SCENE_FILE,
      CHARACTER_SCENE_FILE,
      CHARACTER_SCENE_FILE,
      CHARACTER_SCENE_FILE
    ];
    const CHARACTER_IMAGE_PLACEHOLDER =
      "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560"><rect width="100%" height="100%" fill="#e8e4ec"/><text x="50%" y="46%" fill="#3d3048" font-size="14" font-family="sans-serif" text-anchor="middle">캐릭터 이미지 없음</text><text x="50%" y="54%" fill="#5a4f68" font-size="12" font-family="sans-serif" text-anchor="middle">./assets/character-scene.png</text></svg>'
      );

    function getCharacterImageSrc() {
      return CHARACTER_IMAGE_BASE + CHARACTER_SCENE_FILE;
    }

    function getCharacterImageAlt() {
      return "밤 풍경의 개와 사자가 나란히 앉아 있는 장면 이미지";
    }

    const PORTRAIT_STAGE_LABELS = [
      "호감도 0~30",
      "호감도 31~50",
      "호감도 51~엔딩 직전",
      "청혼 엔딩",
      "얀데레 엔딩",
      "유학 엔딩"
    ];

    function getCharacterImageSrcByIndex(fileIndex) {
      const name = CHARACTER_IMAGE_FILES[fileIndex];
      if (!name) return CHARACTER_IMAGE_PLACEHOLDER;
      return CHARACTER_IMAGE_BASE + name;
    }

    function bindPortraitImageFallback(img) {
      if (!img || img.dataset.portraitFallbackBound === "1") return;
      img.dataset.portraitFallbackBound = "1";
      img.addEventListener("error", () => {
        if (String(img.src || "").indexOf("data:image/svg+xml") === 0) return;
        img.src = CHARACTER_IMAGE_PLACEHOLDER;
      });
    }

    function getCharacterImageAltByIndex(fileIndex) {
      void fileIndex;
      return "밤 풍경의 개와 사자가 나란히 앉아 있는 장면 이미지";
    }

    function hasAnyRomanceProgressTouch() {
      return state.maxAffectionEver > 0
        || state.totalSeconds > 0
        || state.replyAffectionBonus !== 0
        || (Array.isArray(state.storyLog) && state.storyLog.length > 0)
        || state.endingId === 1 || state.endingId === 2 || state.endingId === 3;
    }

    function getSeenPortraitGalleryItems() {
      const max = Number(state.maxAffectionEver || 0);
      const items = [];
      if (hasAnyRomanceProgressTouch()) {
        items.push({ fileIndex: 0, caption: PORTRAIT_STAGE_LABELS[0] });
      }
      if (max >= 31) items.push({ fileIndex: 1, caption: PORTRAIT_STAGE_LABELS[1] });
      if (max >= 51) items.push({ fileIndex: 2, caption: PORTRAIT_STAGE_LABELS[2] });
      if (state.endingId === 1) items.push({ fileIndex: 3, caption: PORTRAIT_STAGE_LABELS[3] });
      if (state.endingId === 2) items.push({ fileIndex: 4, caption: PORTRAIT_STAGE_LABELS[4] });
      if (state.endingId === 3) items.push({ fileIndex: 5, caption: PORTRAIT_STAGE_LABELS[5] });
      return items;
    }

    function renderStoryPortraitGallery() {
      const wrap = $("storyPortraitGallery");
      if (!wrap) return;
      const items = getSeenPortraitGalleryItems();
      if (!items.length) {
        wrap.innerHTML = "";
        wrap.style.display = "none";
        return;
      }
      wrap.style.display = "block";
      const cards = items.map((it) => {
        const src = escapeHtml(getCharacterImageSrcByIndex(it.fileIndex));
        const alt = escapeHtml(getCharacterImageAltByIndex(it.fileIndex));
        const cap = escapeHtml(it.caption);
        return "<figure class='story-portrait-card'>" +
          "<img src='" + src + "' alt='" + alt + "' loading='lazy' />" +
          "<figcaption>" + cap + "</figcaption></figure>";
      }).join("");
      wrap.innerHTML = "<h4 class='story-portrait-heading'>지금까지 본 캐릭터 단계</h4>" +
        "<div class='story-portrait-row'>" + cards + "</div>";
    }

    function resetStoryAndAffection() {
      if (!window.confirm("스토리 로그·루트·엔딩·대화 보너스를 비우고 호감도를 0으로 맞춥니다. 공부 기록(시간)·목표·설정·일지는 유지되며, 지금까지의 공부는 호감도 기준선으로만 잡혀 이후 새 공부만 호감도에 더해집니다.\n\n호감도 곡선은 ‘기준선 이후 누적 공부’에 다시 적용되므로, 초기화 직후에는 예전 총공부 시간대의 증가율과 다르게(다시 앞 구간처럼) 오를 수 있습니다. 진행할까요?")) return;
      state.replyAffectionBonus = 0;
      state.routeMarriage = 0;
      state.routeYandere = 0;
      state.routeAbroad = 0;
      state.endingId = null;
      state.storyLog = [];
      state.loggedStageMins = [];
      state.activeInteraction = null;
      state.lastReplyText = "";
      state.maxAffectionEver = 0;
      state.editingRecordIndex = -1;
      state.affectionBaselineSeconds = Math.max(0, Number(state.totalSeconds || 0));
      state.storyContactChannel = "";
      state.storyFreshReset = true;
      state.romanceLastSeenDate = "";
      state.romanceConvoDate = "";
      state.romanceConvoStarts = 0;
      state.romanceLastDateEventDay = "";
      state.romanceDateBackdropDay = "";
      state.romanceDateBackdropClass = "";
      state.romancePreConfessionDone = false;
      state.romanceSoftMoodShownFor = "";
      state.romanceStreakDropNoted = "";
      state.romancePrevStreakSnapshot = -1;
      sessionRuntime.pendingSoftMoodPrefix = "";
      state.togetherStudyLineDay = "";
      state.togetherStudyLineCount = 0;
      state.romanceDailyWhisperDay = "";
      recalcAffectionTotal();
      migratePassedStagesSilent();
      saveState();
      render();
    }

    /* ===== JS §2 Story tables (dialogues, interactions) ===== */
    const NPC_PERSONALITY = "소심한 내향형 · 음악을 사랑함";
    const USER_PERSONALITY = "다정함 · 활발함 · 사교적임";

    const dialogues = [
      {
        minAffection: 0,
        stage: "동창, 다시 인사",
        text: "고등학교 때는… 옆 반에서만 봤던 너잖아. 이렇게 다시 마주하니까 얼얼하네. 나, 인안나야. 실용음악과에, 밤엔 밴드 보컬도 하고 있어.",
        eventStory: "캠퍼스 편의점 앞, 네가 들고 있던 필통이 고등학교 때랑 똑같아서 웃음이 났다. 인안나는 160짜리 숏컷 머리를 쓸어 넘기며, 과제와 밴드 연습 사이를 오가는 요즘을 짧게 털어놓았다. 사람 많은 곳에선 말수가 적은 편이지만, 음악 얘기만 나오면 눈이 반짝이는 아이였다. 다정하고 활발한 네가 다가오면, 동창이라는 말이 설레는 두 글자처럼 느껴진다.",
        innerVoice: "…말 너무 길었나. 넌 늘 사람들이랑 금방 친해지는 사교적인 타입이잖아. 나는 리허설 없이 웃음 짓는 법부터 연습해 왔어. 노래만큼은 자신 있는데, 말은… 한 박자 늦는 것 같아.",
        innerVoiceShort: "…첫 장 다시 넘기는 기분."
      },
      {
        minAffection: 10,
        stage: "연습실 복도",
        text: "숏컷이라 헷갈리면… 미안. 키 작은 편이라 무대 올라가면 신발 신경 쓰게 돼. 너 공부하는 거 보고 있으면, 나도 악보 펴보고 싶어지더라.",
        eventStory: "야간 연습실 복도 형광등 아래, 인안나가 메탈 플레이리스트를 잠깐 멈추고 네 옆에 섰다. 밴드 보컬로서 매일 목을 쓰는데도 네가 적어 둔 공부 계획표를 보며 ‘나도 저 박자에 맞춰 살아볼까’ 하고, 장난처럼 던졌다. 속으로는 네 다정한 웃음이 부러웠다.",
        innerVoice: "메탈이랑 클래식은 매일 듣는데, 네 앞이라면 발라드 한 곡도 틀어볼 수 있을 것 같아. 활발한 네 옆에 서려면… 내가 먼저 말을 꺼내야 한다는 걸 알아. 겁나지만.",
        innerVoiceShort: "…한 박자만 맞추면 돼."
      },
      {
        minAffection: 20,
        stage: "합주 끝 카톡",
        text: "오늘도 열심히 하더라. 예전에 메탈 좋아한다고 말했을 때 네 표정, 아직 기억나. 나중에… 같이 이어폰 나눠 들을래?",
        eventStory: "합주가 끝난 새벽, 케이스를 짊어진 채로 보낸 카톡 한 통. 인안나는 녹음 파일을 보내주며 ‘이 베이스 라인처럼 너도 오늘 한 줄이라도 더 나아갔지?’라고 묻는다. 고등학교 때 못 꺼냈던 말들이 조금씩, 밤공기처럼 스며든다.",
        innerVoice: "카톡 치는 손가락이 떨려. 넌 항상 답장도 밝고 빠르잖아. 나는 한 줄 적고 지우고를 반복해. 그래도 음악으로는 네 하루를 응원하고 싶어—그건 내가 제일 잘하는 방식이니까.",
        innerVoiceShort: "…답장 한 줄이면 충분해."
      },
      {
        minAffection: 35,
        stage: "실용음악과 복도",
        text: "과제 스택… 많지? 나도 녹음 데드라인 있어. 공부 끝나면, 작은 밴드 연습 보러 올래? 네 하루가… 궁금해.",
        eventStory: "실용음악과 복도 창가에서 인안나는 악보와 레퍼런스 CD를 번갈다 본다. 작은 밴드의 보컬로서 무대 밖에서는 말수가 적지만, 네가 남긴 하루의 흔적—도서관 자리, 남은 커피—를 떠올리며, 동창 이상으로 다가가고 싶다는 마음을 아직 말로 꺼내지 못한다.",
        innerVoice: "초대라니, 너무 직진이었나. 사교적인 너한텐 별일 아닐 수도 있는데… 나한텐 한 곡 분량의 용기야. 거절당하면 연습실에서만 노래할래.",
        innerVoiceShort: "…용기, 반박자만 쉬고."
      },
      {
        minAffection: 50,
        stage: "메탈 플레이리스트",
        text: "네가 집중하는 모습… 자꾸 눈이 가. 무대 위에서 노래할 때랑은 다른 매력이야. 옆에 있으면… 나도 조용해지는 기분이 들어.",
        eventStory: "주말 오후, 인안나가 추천한 메탈 곡이 스피커에서 울린다. 그 사이로 네가 문제집에 박히는 집중이 묘하게 겹쳐 보인다. 인안나는 마이크 대신 네 옆의 공기를 조금 더 가까이 당기고 싶다고, 스스로에게만 고백한다.",
        innerVoice: "무대 밖의 나는 소심한데, 넌 다정해서 주변을 다 살려. 그게 부럽기도 하고… 겁나기도 해. 그래도 음악 틀어 주면 대화가 조금 쉬워져—리듬이 우리 사이 통역이 되니까.",
        innerVoiceShort: "…리듬이 통역."
      },
      {
        minAffection: 70,
        stage: "밴드 룸 앞",
        text: "요즘은 네가 웃으면… 나도 모르게 따라 웃게 돼. 보컬 녹음 전에, 네 얼굴 한 번 보고 가는 날이 늘었어.",
        eventStory: "밴드 룸 문 앞에서 인안나는 리허설 타임 전에 너를 찾는 게 루틴이 됐다고, 겨우 인정한다. 160의 시선 높이에 딱 맞는 네 웃음이, 무대 조명보다 길게 남는다고, 메탈 가사 한 줄처럼 속삭인다.",
        innerVoice: "멤버들한텐 ‘그냥 동창’이라고 했어. 거짓말. 넌 내 하루의 메트로놈 같아—활발한 박자에 맞춰 나도 숨을 맞추고 싶어.",
        innerVoiceShort: "…거짓말이야, 동창만은 아니야."
      },
      {
        minAffection: 90,
        stage: "야간 스튜디오",
        text: "네 꿈 응원하는 게… 내 행복이야. 오늘 끝나면, 같이 산책할래? 메탈 말고 잔잔한 곡도 틀어 줄게.",
        eventStory: "야간 스튜디오 믹서 불빛 아래, 인안나는 네가 남긴 공부 기록을 사진으로 찍어 둔다. 실용음악과생이자 보컬로서의 야망과, 동창으로서 너를 붙잡고 싶은 마음이 같은 볼륨 노브 위에 올라간다.",
        innerVoice: "산책이라니, 로맨틱 영화 같아. 말 꺼내기 전에 열 번은 시뮬레이션했어. 넌 사람들이랑 금방 친해지니까… 나만 뒤처질까 봐 무서워. 그래도 음악은 진심이니까, 그걸로 진심을 덮어 볼게.",
        innerVoiceShort: "…열 번 연습, 한 번 걷기."
      },
      {
        minAffection: 115,
        stage: "셋리스트 한 칸",
        text: "너랑 있는 시간이… 내 하루에서 제일 밝은 순간이야. 다음 공연 셋리스트에, 네 이름 적어두고 싶을 정도로.",
        eventStory: "셋리스트 메모지 한 칸에 연필로 동그라미를 친다. 인안나는 그 안에 네 이니셜을 적었다 지우고, 다시 웃는다. 밴드 멤버들에게는 비밀인, 연애처럼 짜릿한 한 마디를 삼킨다.",
        innerVoice: "이니셜을 적었다 지우는 것도 연습이야. 넌 다정해서 실수해도 웃어 줄 텐데… 나는 그 웃음이 무서울 만큼 좋거든.",
        innerVoiceShort: "…연필 끝이 떨려."
      },
      {
        minAffection: 140,
        stage: "무대 뒤 고백 직전",
        text: "사실… 너를 많이 좋아해. 네가 노력하는 매 순간이 빛나 보여—내 노래보다 더 듣고 싶은 소리야.",
        eventStory: "공연 직후 무대 뒤, 땀과 메이크업이 섞인 복도. 인안나는 아직 벗지 못한 인이어 줄을 손가락으로 감으며, 네 이름을 부르는 연습을 마친다. 고등학교 때의 인사가, 이제는 고백의 프롤로그처럼 느껴진다.",
        innerVoice: "방금 무대에서 소리쳤는데, 지금은 목소리가 안 나와. 내향인 내가 고백까지 왔다는 게 믿기지 않아. 네가 늘 먼저 다정하게 말 걸어 준 덕분이야—고마워, 그리고… 무서워.",
        innerVoiceShort: "…고마워. 무서워."
      },
      {
        minAffection: 170,
        stage: "두 번째 인생의 듀엣",
        text: "우리 이제… 서로의 목표랑 마음도 같이 지켜가자. 학교도 밴드도, 너랑 나랑 같은 박자로 가고 싶어.",
        eventStory: "새벽 버스 창밖으로 캠퍼스가 흐른다. 인안나는 실용음악과 졸업 전시와 밴드의 다음 싱글, 그리고 너와의 미래를 한 박자로 맞추고 싶다고 말한다. 메탈이든 발라드든, 네가 있으면 어떤 장르도 괜찮다고, 조용히 덧붙인다.",
        innerVoice: "듀엣이라는 말, 평생 간직할 거야. 넌 사교적이라 세상이 넓고, 나는 음악 안에서 세상이 넓어. 둘이 겹치는 지점이 여기라서… 정말 다행이야.",
        innerVoiceShort: "…겹치는 지점, 여기."
      }
    ];
    const interactionTemplates = [
      {
        npc: "넌 늘 먼저 말 걸어 주잖아, 다정하게. 사교적인 네 옆에 서려면… 나도 연락 방식부터 맞추고 싶은데. 얼굴 보고 말하는 게 편해, 글로 짧게 보내는 게 편해, 아니면 걸으면서?",
        inner: "활발한 너한테 맞추는 게 제일 편해. 그래도 오늘은 내가 먼저 골라도 될까—하고 묻는 것도 연습이라고 믿을래.",
        choices: [
          { text: "만나서 얼굴 보며 얘기하자.", delta: 2, route: "marriage", routePts: 3, reaction: "좋아. 네 웃음 보면 내 박자도 안정돼." },
          { text: "메시지로 짧게 주고받자.", delta: 1, route: "yandere", routePts: 3, reaction: "알았어. 내 답장은 너한테만 빠르게 갈게." },
          { text: "걸으면서 천천히 말하자.", delta: 2, route: "abroad", routePts: 3, reaction: "산책 코스는 네가 정해 줘. 나는 옆에서 화음 넣을게." }
        ]
      },
      {
        npc: "밴드 연습 끝나고… 네 옆에 앉는 시간이 제일 편해. 나, 말로는 잘 못 하는데. 앞으로는… 어떻게 지내고 싶어?",
        inner: "사교적인 너한테 이런 질문, 너무 무겁나? 그래도 음악 끝난 직후엔 용기가 생겨. 다정하게 대답해 주면… 그 한마디만으로도 충분해.",
        choices: [
          { text: "평생 네 옆에 있고 싶어.", delta: 2, route: "marriage", routePts: 4, reaction: "나도… 같은 마음이야. 무대 밖에서도 너랑 같은 박자로 살고 싶어." },
          { text: "너만 나한테만 집중해 줘. 다른 사람 시선은 싫어.", delta: 1, route: "yandere", routePts: 4, reaction: "알겠어. 내 마이크 너한테만 향할게. 다른 건 다 끊어도 돼." },
          { text: "언젠가 같이 해외에서 공부하고 싶어.", delta: 2, route: "abroad", routePts: 4, reaction: "실용음악도 거기서 더 크게 배울 수 있겠지? 같이 그려볼게, 설레." }
        ]
      },
      {
        npc: "내일 과제 데드라인이야… 너는? 같이 도서관 갈래, 아니면 연습실? 네가 활발하게 움직이는 쪽에 맞출게.",
        inner: "약속 잡는 것도 연습이야. 넌 사람들이랑 쉽게 스케줄 맞추잖아. 나는 캘린더에 ‘연필로만 적는 날’이 많아서… 네가 고르면 따라가도 될까?",
        choices: [
          { text: "약속 잡자. 너랑 미래 얘기 하고 싶어.", delta: 2, route: "marriage", routePts: 3, reaction: "좋아. 셋리스트 다음 페이지에 네 이야기부터 적을게." },
          { text: "내 스케줄은 네가 정해 줘.", delta: 1, route: "yandere", routePts: 3, reaction: "그럼 리허설표랑 네 시간표, 내가 한 장으로 붙일게." },
          { text: "외국어 공부 도와줄래? 같이 유학 준비하고 싶어.", delta: 2, route: "abroad", routePts: 3, reaction: "메탈 가사 영문판이랑 같이 외워 보자. 나도 도와줄게." }
        ]
      },
      {
        npc: "오늘 유독 보고 싶었어… 솔직히, 고등학교 때부터 지금까지—나한테 어떤 마음이야? 활발하게 말해 줘도 돼.",
        inner: "이건… 인터뷰 질문 같아. 내향인이 던지기엔 너무 직설적이라 끝까지 망설였어. 그래도 넌 다정하니까, 농담으로 넘기지는 않겠지.",
        choices: [
          { text: "너만 생각하면 마음이 따뜻해져.", delta: 3, route: "marriage", routePts: 4, reaction: "그 한 마디면 충분해. 무대 조명보다 밝게 웃었어." },
          { text: "나한테서 한 발짝도 멀어지지 마.", delta: 1, route: "yandere", routePts: 4, reaction: "그래. 160이라 네 옆에 딱 붙어 있을게. 어디도 안 갈 거야." },
          { text: "너랑 같은 캠퍼스에서 공부하고 싶어.", delta: 2, route: "abroad", routePts: 4, reaction: "멋진 목표야. 실용음악과 복도에서 너 기다리는 것도 이제 익숙해졌어." }
        ]
      },
      {
        npc: "스트레스 받을 때… 메탈 크게 틀고 소리 지르잖아, 나. 그때는… 나한테 기대도 돼? 넌 잘 웃어 주니까.",
        inner: "말 놓는 것도 무서운데, 음악 얘기는 조금 나아. 네가 사교적으로 사람을 품는 것처럼… 나도 네 옆에서 한 박자만 맡고 싶어.",
        choices: [
          { text: "당연하지. 넌 내 가장 큰 위로야.", delta: 2, route: "marriage", routePts: 3, reaction: "나도 네게 기대고 싶어. 서로에게 그런 사람이 되자." },
          { text: "다른 사람한테 말하면 안 돼. 나만 알아야 해.", delta: 1, route: "yandere", routePts: 4, reaction: "알았어. 네 비밀은 내 가사 노트 맨 뒤에만 적어둘게." },
          { text: "어학연수 가면 고립될까 봐 걱정돼.", delta: 2, route: "abroad", routePts: 3, reaction: "걱정 마. 내가 옆에서 같이 준비하고, 현지 밴드 구경도 같이 가자." }
        ]
      },
      {
        npc: "너의 꿈을 위해… 내가 해 줄 수 있는 게 뭐야? 보컬 말고도 말해도 돼. 나, 들을 준비는… 오래전부터 해 왔어.",
        inner: "활발한 너의 꿈은 항상 크게 들려. 나는 음악으로 답하고, 말로는 늦게 따라가도… 진심만큼은 지지 않게 할게.",
        choices: [
          { text: "옆에서 평생 응원해 줘.", delta: 2, route: "marriage", routePts: 4, reaction: "약속할게. 네 커튼콜까지 함께 서 있을게—앵콜도 내가 외칠게." },
          { text: "내 하루를 전부 알려 줘. 빈틈 없이.", delta: 0, route: "yandere", routePts: 4, reaction: "좋아. 네 수업 시간표랑 밴드 스케줄, 내가 전부 외울게." },
          { text: "입시랑 비자 준비 같이 해줘.", delta: 2, route: "abroad", routePts: 4, reaction: "포트폴리오랑 영어 면접, 같이 청사진 그려보자. 나도 배울 거 많아." }
        ]
      }
    ];

    let romanceNarrative = null;

    function defaultRomanceNarrative() {
      return {
        version: 1,
        _meta: {},
        dailyWhispers: {},
        relationshipLabels: [{ minAffection: 0, line: "오늘은 조용히 박자 맞추는 날이야." }],
        postEndingRelationshipLines: { "1": [], "2": [], "3": [] },
        choiceRouteHints: { even: [], marriage: [], yandere: [], abroad: [] },
        dateCutscenes: [],
        softMood: {
          absence: ["…오랜만이야. 천천히 얘기해 줘, 듣는 건 내가 제일 잘하니까."],
          streakPause: ["오늘은 쉼표 밑에서 숨 쉬자. 다음 장은 천천히."]
        },
        choiceEchoes: { marriage: [], yandere: [], abroad: [] },
        preConfessionScene: null,
        postEndingDaily: { "1": [], "2": [], "3": [] },
        weeklyStoryWovenLines: [],
        togetherLineTemplates: ["오늘 {min}분은 네 옆이었어. 고마워."],
        weeklyInannaLines: ["인안나 한 줄: 이번 주도 수고했어."]
      };
    }

    function mergeRomanceNarrativePatch(raw) {
      const d = defaultRomanceNarrative();
      if (!raw || typeof raw !== "object") return d;
      const out = Object.assign({}, d, raw);
      if (!out._meta || typeof out._meta !== "object") out._meta = d._meta;
      if (!out.dailyWhispers || typeof out.dailyWhispers !== "object") out.dailyWhispers = d.dailyWhispers;
      if (!out.postEndingRelationshipLines || typeof out.postEndingRelationshipLines !== "object") {
        out.postEndingRelationshipLines = d.postEndingRelationshipLines;
      }
      if (!out.choiceRouteHints || typeof out.choiceRouteHints !== "object") out.choiceRouteHints = d.choiceRouteHints;
      if (!Array.isArray(out.weeklyStoryWovenLines)) out.weeklyStoryWovenLines = d.weeklyStoryWovenLines;
      const dateScenes = Array.isArray(out.dateScenes) ? out.dateScenes : null;
      if (dateScenes && dateScenes.length) out.dateCutscenes = dateScenes;
      else if (!Array.isArray(out.dateCutscenes)) out.dateCutscenes = d.dateCutscenes;
      if (!Array.isArray(out.relationshipLabels) || !out.relationshipLabels.length) out.relationshipLabels = d.relationshipLabels;
      if (!Array.isArray(out.dateCutscenes)) out.dateCutscenes = d.dateCutscenes;
      if (!out.softMood || typeof out.softMood !== "object") out.softMood = d.softMood;
      if (!Array.isArray(out.softMood.absence)) out.softMood.absence = d.softMood.absence;
      if (!Array.isArray(out.softMood.streakPause)) out.softMood.streakPause = d.softMood.streakPause;
      if (!out.choiceEchoes || typeof out.choiceEchoes !== "object") out.choiceEchoes = d.choiceEchoes;
      const ped = out.postEnding && typeof out.postEnding === "object" ? out.postEnding : null;
      const baseDaily = d.postEndingDaily && typeof d.postEndingDaily === "object" ? Object.assign({}, d.postEndingDaily) : {};
      const mergedDaily = Object.assign({}, baseDaily, out.postEndingDaily || {});
      if (ped) {
        ["1", "2", "3"].forEach((k) => {
          if (Array.isArray(ped[k]) && ped[k].length) mergedDaily[k] = ped[k];
        });
      }
      out.postEndingDaily = mergedDaily;
      if (!Array.isArray(out.togetherLineTemplates) || !out.togetherLineTemplates.length) out.togetherLineTemplates = d.togetherLineTemplates;
      if (!Array.isArray(out.weeklyInannaLines) || !out.weeklyInannaLines.length) out.weeklyInannaLines = d.weeklyInannaLines;
      if (!out.preConfessionScene || typeof out.preConfessionScene !== "object") out.preConfessionScene = d.preConfessionScene;
      return out;
    }

    romanceNarrative = mergeRomanceNarrativePatch(null);

    function loadRomanceNarrativeRemote() {
      return fetch("./assets/romance-narrative.json", { cache: "no-cache" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j) romanceNarrative = mergeRomanceNarrativePatch(j);
        })
        .catch(() => {});
    }

    function daysBetweenDateKeys(a, b) {
      if (!a || !b) return 0;
      const da = new Date(a + "T12:00:00").getTime();
      const db = new Date(b + "T12:00:00").getTime();
      if (Number.isNaN(da) || Number.isNaN(db)) return 0;
      return Math.round((db - da) / 86400000);
    }

    function pickFromArr(arr, seedStr) {
      const a = Array.isArray(arr) ? arr.filter((x) => x && String(x).trim()) : [];
      if (!a.length) return "";
      let h = 0;
      const s = seedStr || "0";
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return String(a[h % a.length]);
    }

    function getRelationshipMetaLine() {
      if (state.endingId) {
        const pool = (romanceNarrative.postEndingRelationshipLines &&
          romanceNarrative.postEndingRelationshipLines[String(state.endingId)]) || [];
        const line = pickFromArr(pool, dateKey(new Date()) + "_relend_" + String(state.endingId));
        if (line) return String(line);
        return state.endingId === 1 ? "오늘은 약속 모드 같은 날." : state.endingId === 2 ? "오늘은 시선 한 박자 더 붙은 날." : "오늘은 지도에 연필로 선을 긋는 날.";
      }
      const arr = romanceNarrative.relationshipLabels || [];
      let line = "오늘은 네 옆 박자에 맞추는 날이야.";
      const a = state.affection;
      for (let i = 0; i < arr.length; i++) {
        const row = arr[i];
        if (row && typeof row.minAffection === "number" && a >= row.minAffection && row.line) line = String(row.line);
      }
      return line;
    }

    function getDailyWhisperLineForToday() {
      const todayKey = dateKey(new Date());
      const dw = romanceNarrative.dailyWhispers || {};
      const dow = String(new Date().getDay());
      const pool = dw[dow] || [];
      return pickFromArr(pool, todayKey + "_whisperui") || "오늘도 옆에 있어 줄래? 한 박자만 맞추자.";
    }

    function tryDailyWhisperLog(todayKey) {
      if (state.endingId) return;
      if (state.romanceDailyWhisperDay === todayKey) return;
      const dw = romanceNarrative.dailyWhispers || {};
      const dow = String(new Date().getDay());
      const pool = dw[dow] || [];
      const line = pickFromArr(pool, todayKey + "_whisperlog");
      if (!line) return;
      appendStoryLog({
        type: "dailyWhisper",
        title: "오늘의 한 컷",
        body: String(line)
      });
      state.romanceDailyWhisperDay = todayKey;
      saveState();
    }

    function dampConversationBonusNearEnd(delta, routePts) {
      let d = Math.round(Number(delta || 0));
      let r = Math.round(Number(routePts || 0));
      if (!Number.isFinite(d)) d = 0;
      if (!Number.isFinite(r) || r < 0) r = 0;
      if (state.endingId) return { delta: d, routePts: Math.max(1, r || 1) };
      const aff = state.affection;
      const mr = Math.max(state.routeMarriage || 0, state.routeYandere || 0, state.routeAbroad || 0);
      let factor = 1;
      if (aff >= 70 && aff < ENDING_MIN_AFFECTION) factor *= 0.88;
      if (aff >= 78 && aff < ENDING_MIN_AFFECTION) factor *= 0.9;
      if (mr >= 7 && mr < ENDING_MIN_ROUTE) factor *= 0.9;
      if (mr >= 9 && mr < ENDING_MIN_ROUTE) factor *= 0.92;
      d = Math.round(d * factor);
      r = Math.max(1, Math.round(r * factor));
      return { delta: d, routePts: r };
    }

    function playStageCueSound() {
      if (state.stageCueSound === false) return;
      if (!state.soundEnabled) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 660;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 90);
      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 200);
    }

    function maybeAppendRouteHintLog() {
      if (state.endingId) return;
      if (Math.random() > 0.36) return;
      const m = Number(state.routeMarriage || 0);
      const y = Number(state.routeYandere || 0);
      const ab = Number(state.routeAbroad || 0);
      const hints = romanceNarrative.choiceRouteHints || {};
      let pool = hints.even || hints.neutral || [];
      if (m > y + 1 && m > ab + 1) pool = hints.marriage || pool;
      else if (y > m + 1 && y > ab + 1) pool = hints.yandere || pool;
      else if (ab > m + 1 && ab > y + 1) pool = hints.abroad || pool;
      const line = pickFromArr(pool, dateKey(new Date()) + "_rh_" + m + "_" + y + "_" + ab);
      if (!String(line || "").trim()) return;
      appendStoryLog({
        type: "routeHint",
        title: "작은 메모 · 다음 색",
        body: String(line).trim()
      });
    }

    function evalDateSceneWhen(sc, todayKey) {
      if (!sc || typeof sc !== "object") return false;
      const v = Number(sc.value);
      const op = sc.op || ">=";
      let cur = 0;
      if (sc.when === "todayMin") cur = Math.round(sumSecondsByDate(todayKey) / 60);
      else return false;
      if (op === ">=") return cur >= v;
      if (op === ">") return cur > v;
      if (op === "<=") return cur <= v;
      if (op === "<") return cur < v;
      return false;
    }

    function tryRomanceDateCutscene(todayKey) {
      if (state.endingId) return;
      if (state.romanceLastDateEventDay === todayKey) return;
      const scenes = romanceNarrative.dateCutscenes || [];
      for (let i = 0; i < scenes.length; i++) {
        const sc = scenes[i];
        if (evalDateSceneWhen(sc, todayKey)) {
          appendStoryLog({
            type: "dateScene",
            title: sc.title || "짧은 데이트",
            body: String(sc.body || "").trim()
          });
          state.romanceLastDateEventDay = todayKey;
          const cls = sc.backdrop ? String(sc.backdrop).replace(/[^a-z-]/gi, "") : "date";
          state.romanceDateBackdropDay = todayKey;
          state.romanceDateBackdropClass = "vn-backdrop--" + (cls || "date");
          saveState();
          return;
        }
      }
    }

    function updateRomanceVisitSoftMood(todayKey) {
      const last = state.romanceLastSeenDate || "";
      if (!last) {
        state.romanceLastSeenDate = todayKey;
        return;
      }
      if (last === todayKey) return;
      const gap = daysBetweenDateKeys(last, todayKey);
      if (gap >= 4 && state.romanceSoftMoodShownFor !== todayKey) {
        const pool = (romanceNarrative.softMood && romanceNarrative.softMood.absence) || [];
        sessionRuntime.pendingSoftMoodPrefix = pickFromArr(pool, todayKey + "_" + last);
        state.romanceSoftMoodShownFor = todayKey;
      }
      state.romanceLastSeenDate = todayKey;
    }

    function maybeNoteStreakSoftMood(todayKey) {
      const cur = computeStudyStreakDays();
      const prev = Number(state.romancePrevStreakSnapshot);
      if (prev >= 2 && cur === 0 && state.romanceStreakDropNoted !== todayKey && Number(state.totalSeconds || 0) >= 120) {
        if (!sessionRuntime.pendingSoftMoodPrefix) {
          const pool = (romanceNarrative.softMood && romanceNarrative.softMood.streakPause) || [];
          sessionRuntime.pendingSoftMoodPrefix = pickFromArr(pool, todayKey + "_streak");
        }
        state.romanceStreakDropNoted = todayKey;
        saveState();
      }
      state.romancePrevStreakSnapshot = cur;
    }

    function maybeChoiceEchoSuffix() {
      const echoes = romanceNarrative.choiceEchoes || {};
      if (Math.random() > 0.34) return "";
      const m = Number(state.routeMarriage || 0);
      const y = Number(state.routeYandere || 0);
      const ab = Number(state.routeAbroad || 0);
      const lead = Math.max(m, y, ab);
      if (lead < 5) return "";
      let pool = [];
      if (m >= y && m >= ab && m >= 5) pool = echoes.marriage || [];
      else if (y >= m && y >= ab && y >= 5) pool = echoes.yandere || [];
      else if (ab >= 5) pool = echoes.abroad || [];
      if (!pool.length) return "";
      return pickFromArr(pool, dateKey(new Date()) + "_" + lead);
    }

    function buildMainDialogueLine(displayName, voc, baseText) {
      let t = "인안나: " + displayName + voc + ", " + baseText;
      const echo = maybeChoiceEchoSuffix();
      if (echo) t += echo;
      return t;
    }

    function getEndingMainDialogue(displayName, voc) {
      const pool = (romanceNarrative.postEndingDaily && romanceNarrative.postEndingDaily[String(state.endingId)]) || [];
      const raw = pickFromArr(pool, dateKey(new Date()) + "_main_" + String(state.endingId) + "_" + String(state.totalSeconds || 0));
      if (raw && String(raw).trim()) {
        const t = String(raw).trim();
        if (/^인안나:/.test(t)) return t;
        return "인안나: " + t;
      }
      return "인안나: " + displayName + voc + ", 우리 이야기가 한 장 끝까지 닿았어. 아래 엔딩을 읽어 줘.";
    }

    function buildTogetherStudyLineForRecord(rec) {
      const all = romanceNarrative.togetherLineTemplates || [];
      const tag = (rec.tag && String(rec.tag).trim()) ? String(rec.tag).trim() : "";
      const withTag = all.filter((tpl) => tpl && String(tpl).indexOf("{tag}") >= 0);
      const tpls = tag && withTag.length ? withTag : all;
      const t = pickFromArr(tpls, (rec.date || "") + "_" + rec.seconds + "_" + (rec.tag || ""));
      const min = Math.max(1, Math.round(Number(rec.seconds || 0) / 60));
      const tagOut = tag || "공부";
      return String(t || "").replace(/\{min\}/g, String(min)).replace(/\{tag\}/g, tagOut);
    }

    function appendWeeklyInannaLineToReport(baseText, now) {
      const pool = romanceNarrative.weeklyInannaLines || [];
      const line = pickFromArr(pool, weekDateRangeKeys(now).mondayKey + "_" + fmtHourMin(sumSecondsWeekMonSun(now)));
      let out = baseText;
      if (line) out += "\n\n" + line;
      const tagMap = aggregateTagMinutesWeekMonSun(now);
      const topTags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]);
      const top = topTags[0] || "(태그 없음)";
      const streak = computeStudyStreakDays();
      const wovenPool = romanceNarrative.weeklyStoryWovenLines || [];
      const wline = pickFromArr(wovenPool, weekDateRangeKeys(now).mondayKey + "_w_" + top + "_" + streak);
      if (wline) {
        out += "\n" + String(wline).replace(/\{tag\}/g, top).replace(/\{streak\}/g, String(streak));
      }
      return out;
    }

    function ensureRomanceDailyRollover() {
      const today = dateKey(new Date());
      if (state.romanceConvoDate !== today) {
        state.romanceConvoDate = today;
        state.romanceConvoStarts = 0;
      }
    }

    function applyVnBackdropClassForToday(todayKey) {
      const bd = document.querySelector(".vn-backdrop");
      if (!bd) return;
      [...bd.classList].forEach((c) => {
        if (c.indexOf("vn-backdrop--") === 0) bd.classList.remove(c);
      });
      if (state.romanceDateBackdropDay === todayKey && state.romanceDateBackdropClass) {
        bd.classList.add(state.romanceDateBackdropClass);
      }
    }

    function clearRomanceBackdropIfStale(todayKey) {
      if (state.romanceDateBackdropDay && state.romanceDateBackdropDay !== todayKey) {
        state.romanceDateBackdropDay = "";
        state.romanceDateBackdropClass = "";
      }
    }

    /* ===== JS §3 DOM utils, dates, story log & affection rules ===== */
    const $ = (id) => document.getElementById(id);
    function safeSetText(id, value) {
      const el = $(id);
      if (el) el.textContent = value;
    }
    function safeStyle(id, prop, value) {
      const el = $(id);
      if (el) el.style[prop] = value;
    }
    const fmtTime = (sec) => {
      const h = String(Math.floor(sec / 3600)).padStart(2, "0");
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      return h + ":" + m + ":" + s;
    };
    const fmtHourMin = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return h + "시간 " + m + "분";
    };
    const dateKey = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    };
    const dateLabel = (key) => key.slice(5).replace("-", "/");

    function mondayKeyOfWeekContaining(d) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dow = x.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      x.setDate(x.getDate() + diff);
      return dateKey(x);
    }

    function sumSecondsWeekMonSun(now) {
      const mk = mondayKeyOfWeekContaining(now);
      const sd = new Date(mk + "T12:00:00");
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        const dd = new Date(sd);
        dd.setDate(sd.getDate() + i);
        sum += sumSecondsByDate(dateKey(dd));
      }
      return sum;
    }

    function sumSecondsWeekStartingOn(mondayKey) {
      const sd = new Date(mondayKey + "T12:00:00");
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        const dd = new Date(sd);
        dd.setDate(sd.getDate() + i);
        sum += sumSecondsByDate(dateKey(dd));
      }
      return sum;
    }

    function previousWeekMondayKey(now) {
      const mk = mondayKeyOfWeekContaining(now);
      const anchor = new Date(mk + "T12:00:00");
      anchor.setDate(anchor.getDate() - 7);
      return dateKey(anchor);
    }

    function buildLastWeekOneLineSummary() {
      const pmk = previousWeekMondayKey(new Date());
      const sec = sumSecondsWeekStartingOn(pmk);
      const min = Math.round(sec / 60);
      const sd0 = new Date(pmk + "T12:00:00");
      const sd6 = new Date(sd0);
      sd6.setDate(sd0.getDate() + 6);
      const endKey = dateKey(sd6);
      return "지난주(" + pmk + " ~ " + endKey + ") 총 " + min + "분.";
    }

    function aggregateSecondsByTag() {
      const map = {};
      state.records.forEach((r) => {
        const t = (r.tag && String(r.tag).trim()) ? String(r.tag).trim() : "(태그 없음)";
        map[t] = (map[t] || 0) + Number(r.seconds || 0);
      });
      return map;
    }

    function weekDateRangeKeys(now) {
      const mk = mondayKeyOfWeekContaining(now);
      const sd = new Date(mk + "T12:00:00");
      const keys = [];
      for (let i = 0; i < 7; i++) {
        const dd = new Date(sd);
        dd.setDate(sd.getDate() + i);
        keys.push(dateKey(dd));
      }
      return { mondayKey: mk, keys: keys };
    }

    function aggregateTagMinutesWeekMonSun(now) {
      const wr = weekDateRangeKeys(now);
      const set = new Set(wr.keys);
      const map = {};
      state.records.forEach((r) => {
        if (!set.has(r.date)) return;
        const t = (r.tag && String(r.tag).trim()) ? String(r.tag).trim() : "(태그 없음)";
        map[t] = (map[t] || 0) + Number(r.seconds || 0);
      });
      return map;
    }

    function buildWeekReportPlainText(now) {
      const wr = weekDateRangeKeys(now);
      const weekSec = sumSecondsWeekMonSun(now);
      const tagMap = aggregateTagMinutesWeekMonSun(now);
      const topTags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]).slice(0, 3);
      const streak = computeStudyStreakDays();
      const tagLine = topTags.length
        ? topTags.map((k) => k + " " + fmtHourMin(tagMap[k])).join(" · ")
        : "(이번 주 태그 없음)";
      const lines = [
        "━━ 주간 리포트 (" + wr.mondayKey + " ~ 7일) ━━",
        "· 총 집중: " + fmtHourMin(weekSec),
        "· 태그 상위: " + tagLine,
        "· 연속 출석: " + streak + "일",
        "· 한 줄 메모: 이번 주 리듬은 아래 히트맵과 함께 보면 좋아요."
      ];
      return appendWeeklyInannaLineToReport(lines.join("\n"), now);
    }

    function drawRhythmHeatmap(now) {
      const canvas = $("rhythmHeatmap");
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cellFill = "rgba(91, 74, 108, 0.12)";
      const cellHi = "rgba(201, 86, 120, 0.45)";
      const grid = "rgba(45, 38, 58, 0.12)";
      const label = "#2d2640";
      const pad = { l: 34, t: 10, r: 8, b: 22 };
      const gridW = w - pad.l - pad.r;
      const gridH = h - pad.t - pad.b;
      const cols = 24;
      const rows = 7;
      const cw = gridW / cols;
      const ch = gridH / rows;
      const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cutoff.setDate(cutoff.getDate() - 27);
      const cutKey = dateKey(cutoff);
      const bins = [];
      for (let i = 0; i < rows * cols; i++) bins.push(0);
      let withHour = 0;
      state.records.forEach((r) => {
        if (!r.date || r.date < cutKey) return;
        if (typeof r.startHour !== "number" || r.startHour < 0 || r.startHour > 23) return;
        withHour += 1;
        const d = new Date(r.date + "T12:00:00");
        const jsDow = d.getDay();
        const row = jsDow === 0 ? 6 : jsDow - 1;
        const col = r.startHour;
        bins[row * cols + col] += Number(r.seconds || 0) / 60;
      });
      let vmax = 0;
      bins.forEach((v) => {
        if (v > vmax) vmax = v;
      });
      if (vmax < 1) vmax = 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const v = bins[row * cols + col];
          const t = vmax ? Math.min(1, v / vmax) : 0;
          ctx.fillStyle = t > 0.08 ? cellHi : cellFill;
          ctx.globalAlpha = 0.15 + t * 0.85;
          ctx.fillRect(pad.l + col * cw + 0.5, pad.t + row * ch + 0.5, cw - 1, ch - 1);
          ctx.globalAlpha = 1;
        }
      }
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        const x = pad.l + c * cw;
        ctx.beginPath();
        ctx.moveTo(x, pad.t);
        ctx.lineTo(x, pad.t + gridH);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const y = pad.t + r * ch;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(pad.l + gridW, y);
        ctx.stroke();
      }
      ctx.fillStyle = label;
      ctx.font = "10px Noto Sans KR, Segoe UI, sans-serif";
      ctx.textAlign = "right";
      const rowLabels = ["월", "화", "수", "목", "금", "토", "일"];
      for (let row = 0; row < rows; row++) {
        ctx.fillText(rowLabels[row], pad.l - 4, pad.t + row * ch + ch * 0.72);
      }
      ctx.textAlign = "center";
      for (let col = 0; col < cols; col += 3) {
        ctx.fillText(String(col), pad.l + col * cw + cw / 2, h - 6);
      }
      const hintEl = $("rhythmHeatmapHint");
      if (hintEl) {
        if (!withHour) {
          hintEl.textContent = "시간대가 붙은 기록이 없어요. 새로 쌓이는 기록에는 저장 시각(시)이 붙어 히트맵이 채워져요.";
        } else {
          let bestI = 0;
          let bestV = -1;
          for (let i = 0; i < bins.length; i++) {
            if (bins[i] > bestV) {
              bestV = bins[i];
              bestI = i;
            }
          }
          const br = Math.floor(bestI / cols);
          const bc = bestI % cols;
          hintEl.textContent = "내 리듬: 최근 28일 중 " + rowLabels[br] + "요일 " + bc + "시대에 분 단위 합이 가장 모여 있어요. (시간대가 있는 행 " + withHour + "건)";
        }
      }
    }

    function getTodayInannaPushLine() {
      const today = dateKey(new Date());
      const todayMin = Math.round(sumSecondsByDate(today) / 60);
      const a = Math.max(0, Number(state.affection || 0));
      const d = getDialogueByAffection();
      const stage = d && d.stage ? d.stage : "";
      const pools = [];
      if (a < 25) {
        pools.push("오늘 " + todayMin + "분 — " + stage + " 구간이야. 천천히만 가도 돼.");
        pools.push("짧게라도 앉은 자리가 쌓이면, 나중에 큰 후렴이 돼.");
      } else if (a < 70) {
        pools.push("오늘 " + todayMin + "분. " + stage + " 박자, 나쁘지 않아.");
        pools.push("너무 무리하지 말고… 한 곡 듣고 다시 악보 펴도 돼.");
      } else {
        pools.push("오늘 " + todayMin + "분 — " + stage + " 끝까지 와 있네. 멋져.");
        pools.push("일상 모드에서도… 네 집중은 내가 가장 듣고 싶은 라이브야.");
      }
      const seed = today + "_" + String(todayMin) + "_" + String(a) + "_" + stage;
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return pools[h % pools.length];
    }

    function updateTodayInannaStrip() {
      const wrap = $("todayInannaStrip");
      const line = $("todayInannaLine");
      if (!wrap || !line) return;
      const t = getTodayInannaPushLine();
      line.textContent = t;
      wrap.hidden = false;
    }

    function renderWeeklyInsightsCard(now) {
      const block = $("weeklyReportBlock");
      if (block) {
        const txt = buildWeekReportPlainText(now);
        block.innerHTML = "<pre class='weekly-report-pre'>" + escapeHtml(txt) + "</pre>";
      }
      const lw = $("lastWeekSummaryLine");
      if (lw) lw.textContent = buildLastWeekOneLineSummary();
      drawRhythmHeatmap(now);
    }

    const MILESTONE_BADGE_DEFS = [
      { id: "m1", title: "첫 스텝", desc: "기록 1건", ok: () => state.records.length >= 1 },
      { id: "m2", title: "기록 10", desc: "공부 기록 10건", ok: () => state.records.length >= 10 },
      { id: "m3", title: "기록 50", desc: "공부 기록 50건", ok: () => state.records.length >= 50 },
      { id: "m4", title: "7일 연속", desc: "연속 7일+", ok: () => computeStudyStreakDays() >= 7 },
      { id: "m5", title: "30일 연속", desc: "연속 30일+", ok: () => computeStudyStreakDays() >= 30 },
      { id: "m6", title: "태그 탐험", desc: "태그 5종+", ok: () => {
        const s = new Set();
        state.records.forEach((r) => {
          if (r.tag && String(r.tag).trim()) s.add(String(r.tag).trim());
        });
        return s.size >= 5;
      } },
      { id: "m7", title: "주간 15h", desc: "한 주 15시간+", ok: () => sumSecondsWeekMonSun(new Date()) >= 15 * 3600 },
      { id: "m8", title: "누적 42h", desc: "총 42시간+", ok: () => Number(state.totalSeconds || 0) >= 42 * 3600 },
      { id: "m9", title: "누적 100h", desc: "총 100시간+", ok: () => Number(state.totalSeconds || 0) >= 100 * 3600 }
    ];

    function renderMilestoneBadgesStory() {
      const grid = $("milestoneBadgeGrid");
      if (!grid) return;
      grid.innerHTML = MILESTONE_BADGE_DEFS.map((def) => {
        const on = def.ok();
        const ic = milestoneBadgeIconHtml(def.id);
        return "<div class='milestone-badge " + (on ? "milestone-badge--unlocked" : "milestone-badge--locked") + "'>" +
          "<div class='milestone-badge-circle' aria-hidden='true'><span class='milestone-badge-icon'>" + ic + "</span></div>" +
          "<div class='milestone-badge-title'>" + escapeHtml(def.title) + "</div>" +
          "<div class='milestone-badge-desc'>" + escapeHtml(def.desc) + "</div></div>";
      }).join("");
    }

    function renderMemoryDiaryList() {
      const list = $("memoryDiaryList");
      if (!list) return;
      const arr = Array.isArray(state.memoryMoments) ? state.memoryMoments.map(sanitizeMemoryMoment).filter(Boolean) : [];
      if (!arr.length) {
        list.innerHTML = "<p class='muted' style='font-size:12px;'>아직 없어요. 위에 한 줄만 남겨도 나중에 여기서 고스란히 볼 수 있어요.</p>";
        return;
      }
      list.innerHTML = arr.slice().reverse().map((m) =>
        "<div class='memory-diary-row'><div class='memory-diary-meta'>" + escapeHtml(m.date) + "</div>" +
        "<div>" + escapeHtml(m.line) + "</div></div>"
      ).join("");
    }

    function formatVnHudDate() {
      const d = new Date();
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return "오늘 · " + d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일 (" + days[d.getDay()] + ")";
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function appendStoryLog(entry) {
      const ts = new Date().toISOString();
      state.storyLog.push({
        ts,
        type: entry.type || "note",
        title: entry.title || "",
        body: entry.body || ""
      });
      while (state.storyLog.length > 200) state.storyLog.shift();
    }

    function storyLogLocalDayFromTs(ts) {
      if (!ts) return "";
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return "";
      return dateKey(d);
    }

    /** 같은 현지일의 관계 진전 로그는 한 카드에 이어 붙여 길이 폭주를 줄입니다. */
    function mergeOrPushMilestoneLog(title, body) {
      const todayKey = dateKey(new Date());
      const last = state.storyLog.length ? state.storyLog[state.storyLog.length - 1] : null;
      if (
        last
        && last.type === "milestone"
        && storyLogLocalDayFromTs(last.ts) === todayKey
      ) {
        last.body = (last.body || "") + "\n\n════════\n\n" + body;
        last.title = "연애 이벤트 · 진전 요약 (같은 날 묶음)";
        return;
      }
      appendStoryLog({ type: "milestone", title: title, body: body });
    }

    function migratePassedStagesSilent() {
      if (!Array.isArray(state.loggedStageMins)) state.loggedStageMins = [];
      dialogues.forEach((d) => {
        if (d.minAffection === 0) return;
        if (state.affection >= d.minAffection && !state.loggedStageMins.includes(d.minAffection)) {
          state.loggedStageMins.push(d.minAffection);
        }
      });
    }

    function shouldUnlockMilestoneStory(d, prevAff, newAff) {
      if (newAff < d.minAffection) return false;
      if (state.loggedStageMins.includes(d.minAffection)) return false;
      if (d.minAffection === 0) return newAff > 0 && prevAff === 0;
      return prevAff < d.minAffection;
    }

    function logRelationshipMilestones(prevAff, newAff) {
      if (newAff <= prevAff || state.endingId) return;
      const name = getDisplayName();
      const voc = getVocative(name);
      const sorted = [...dialogues].sort((a, b) => a.minAffection - b.minAffection);
      const unlocked = [];
      sorted.forEach((d) => {
        if (!shouldUnlockMilestoneStory(d, prevAff, newAff)) return;
        const story = d.eventStory || "";
        const line = "인안나: " + name + voc + ", " + d.text;
        const body = story ? story + "\n\n「대사」\n" + line : line;
        unlocked.push({ stage: d.stage, body: body });
        state.loggedStageMins.push(d.minAffection);
      });
      if (!unlocked.length) return;
      const bundleBody = unlocked.map((u) => u.body).join("\n\n────────\n\n");
      const bundleTitle = unlocked.length === 1
        ? "연애 이벤트 · " + unlocked[0].stage
        : "연애 이벤트 · 진전 요약 (" + unlocked.length + "단계)";
      mergeOrPushMilestoneLog(bundleTitle, bundleBody);
      if (unlocked.length) {
        sessionRuntime.vnDialogueFlashOneShot = true;
        playStageCueSound();
      }
    }

    function renderStorySummary() {
      const el = $("storySummaryPanel");
      if (!el) return;
      el.innerHTML = buildStorySummaryHtml();
    }

    function buildStorySummaryHtml() {
      const d = getDialogueByAffection();
      const log = Array.isArray(state.storyLog) ? state.storyLog : [];
      const today = dateKey(new Date());
      let top = "";
      if (state.todayJournalLine && state.todayJournalDate === today && state.todayJournalLine.trim()) {
        top += "<div class='story-today-journal'><strong>오늘 한 줄</strong><p>" + escapeHtml(state.todayJournalLine.trim()) + "</p>"
          + "<p class='muted' style='font-size:12px;margin:6px 0 0;'>" + escapeHtml(today) + "에 저장됨 · 스토리 로그와 함께 남깁니다.</p></div>";
      }
      top += buildStoryChaptersHtml();
      const cnt = { milestone: 0, interaction: 0, choice: 0, ending: 0, userReaction: 0, branch: 0, dateScene: 0, studyTogether: 0, dailyWhisper: 0, routeHint: 0, other: 0 };
      log.forEach((e) => {
        const t = e.type;
        if (t === "milestone") cnt.milestone += 1;
        else if (t === "interaction") cnt.interaction += 1;
        else if (t === "choice") cnt.choice += 1;
        else if (t === "ending") cnt.ending += 1;
        else if (t === "userReaction") cnt.userReaction += 1;
        else if (t === "branch") cnt.branch += 1;
        else if (t === "dateScene") cnt.dateScene += 1;
        else if (t === "studyTogether") cnt.studyTogether += 1;
        else if (t === "dailyWhisper") cnt.dailyWhisper += 1;
        else if (t === "routeHint") cnt.routeHint += 1;
        else cnt.other += 1;
      });
      const bullets = [];
      bullets.push("호감도 <strong>" + escapeHtml(String(state.affection)) + "</strong> · 지금 단계: " + escapeHtml(d.stage));
      if (state.endingId) {
        bullets.push("엔딩: " + escapeHtml(getEndingTitle(state.endingId)));
      } else {
        bullets.push("엔딩: 아직 도달 전 (호감도 " + ENDING_MIN_AFFECTION + "+ 및 주력 루트 " + ENDING_MIN_ROUTE + "+ 필요)");
      }
      bullets.push("루트 누적 — 청혼 " + state.routeMarriage + " · 얀데레 " + state.routeYandere + " · 유학 " + state.routeAbroad + " (보기 탭에서 주력 루트가 강조됩니다)");
      bullets.push("기록된 이벤트 — 관계 진전 " + cnt.milestone + " · 말 걸기 " + cnt.interaction + " · 대화 " + cnt.choice + " · 엔딩 로그 " + cnt.ending
        + (cnt.userReaction ? " · 나의 한 줄 " + cnt.userReaction : "")
        + (cnt.branch ? " · 짧은 분기 " + cnt.branch : "")
        + (cnt.dateScene ? " · 짧은 데이트 " + cnt.dateScene : "")
        + (cnt.studyTogether ? " · 함께한 시간 " + cnt.studyTogether : "")
        + (cnt.dailyWhisper ? " · 오늘의 한 컷 " + cnt.dailyWhisper : "")
        + (cnt.routeHint ? " · 작은 메모 " + cnt.routeHint : "")
        + (cnt.other ? " · 기타 " + cnt.other : ""));
      const mls = log.filter((e) => e.type === "milestone");
      if (mls.length) {
        const titles = mls.slice(-4).map((e) => escapeHtml((e.title || "").replace(/^연애 이벤트 · /, "")));
        bullets.push("최근 관계 진전 흐름: " + titles.join(" → "));
      } else if (log.length === 0) {
        bullets.push(UI_EMPTY_HINT);
      }
      const items = bullets.map((b) => "<li>" + b + "</li>").join("");
      return top + "<h4 class='story-subheading'>지금까지의 스토리 요약</h4><ul class='story-summary-list'>" + items + "</ul>";
    }

    function renderStoryLogList() {
      const list = $("storyLogList");
      if (!list) return;
      renderStoryPortraitGallery();
      renderStorySummary();
      renderMilestoneBadgesStory();
      renderMemoryDiaryList();
      if (!state.storyLog.length) {
        list.innerHTML = "<p class='muted'>" + escapeHtml(UI_EMPTY_HINT) + "</p>";
        return;
      }
      const typeLabel = (t) => {
        if (t === "milestone") return "관계 진전";
        if (t === "interaction") return "말 걸기";
        if (t === "choice") return "대화";
        if (t === "ending") return "엔딩";
        if (t === "userReaction") return "나의 한 줄";
        if (t === "branch") return "짧은 분기";
        if (t === "dateScene") return "짧은 데이트";
        if (t === "studyTogether") return "함께한 시간";
        if (t === "dailyWhisper") return "오늘의 한 컷";
        if (t === "routeHint") return "작은 메모";
        return t || "";
      };
      const rows = [...state.storyLog].reverse().map((e) => {
        const when = e.ts ? e.ts.slice(0, 19).replace("T", " ") : "";
        return "<div class='story-entry'>" +
          "<div class='story-meta'>" + escapeHtml(when) + " · " + escapeHtml(typeLabel(e.type)) + "</div>" +
          "<h4>" + escapeHtml(e.title || "") + "</h4>" +
          "<div class='story-body'>" + escapeHtml(e.body || "").replace(/\n/g, "<br>") + "</div>" +
          "</div>";
      });
      list.innerHTML = rows.join("");
    }

    function syncViewSubPanels() {
      const sub = state.viewSubPanel === "story" ? "story" : "character";
      state.viewSubPanel = sub;
      document.querySelectorAll(".view-sub-tabs [data-view-sub]").forEach((b) => {
        const active = b.getAttribute("data-view-sub") === sub;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.setAttribute("aria-selected", active ? "true" : "false");
        b.setAttribute("tabindex", active ? "0" : "-1");
      });
      const ch = $("viewPanelCharacter");
      const st = $("viewPanelStory");
      if (ch) {
        ch.style.display = sub === "character" ? "block" : "none";
        ch.setAttribute("aria-hidden", sub === "character" ? "false" : "true");
      }
      if (st) {
        st.style.display = sub === "story" ? "block" : "none";
        st.setAttribute("aria-hidden", sub === "story" ? "false" : "true");
      }
    }

    function gatherPersistedState() {
      return {
        schemaVersion: PERSIST_SCHEMA_VERSION,
        userName: state.userName,
        goalHours: state.goalHours,
        quest: state.quest,
        affection: state.affection,
        totalSeconds: state.totalSeconds,
        records: state.records,
        soundEnabled: state.soundEnabled,
        replyAffectionBonus: state.replyAffectionBonus,
        routeMarriage: state.routeMarriage,
        routeYandere: state.routeYandere,
        routeAbroad: state.routeAbroad,
        endingId: state.endingId,
        storyLog: state.storyLog,
        loggedStageMins: state.loggedStageMins,
        viewSubPanel: state.viewSubPanel,
        uiMainTab:
          state.uiMainTab === "view" ? "view" : state.uiMainTab === "stats" ? "stats" : "record",
        maxAffectionEver: state.maxAffectionEver,
        affectionBaselineSeconds: state.affectionBaselineSeconds,
        a11yPreset: state.a11yPreset,
        todayJournalDate: state.todayJournalDate || "",
        todayJournalLine: state.todayJournalLine || "",
        showInnerMonologue: state.showInnerMonologue !== false,
        weeklyGoalHours: Number(state.weeklyGoalHours || 0),
        defaultSessionTag: state.defaultSessionTag || "",
        bannerDismissedGoal: state.bannerDismissedGoal || "",
        bannerDismissedStreak: state.bannerDismissedStreak || "",
        storyContactChannel: state.storyContactChannel || "",
        storyFreshReset: state.storyFreshReset === true,
        storySummaryFullView: state.storySummaryFullView === true,
        dailyChecklistDate: state.dailyChecklistDate || "",
        dailyChecklistItems: Array.isArray(state.dailyChecklistItems) ? state.dailyChecklistItems : [],
        dailyChecklistChecked: Array.isArray(state.dailyChecklistChecked) ? state.dailyChecklistChecked : [],
        memoryMoments: Array.isArray(state.memoryMoments) ? state.memoryMoments : [],
        bannerDismissedWeekly: state.bannerDismissedWeekly || "",
        romanceLastSeenDate: state.romanceLastSeenDate || "",
        romanceConvoDate: state.romanceConvoDate || "",
        romanceConvoStarts: Number(state.romanceConvoStarts || 0),
        romanceLastDateEventDay: state.romanceLastDateEventDay || "",
        romanceDateBackdropDay: state.romanceDateBackdropDay || "",
        romanceDateBackdropClass: state.romanceDateBackdropClass || "",
        romancePreConfessionDone: state.romancePreConfessionDone === true,
        romanceSoftMoodShownFor: state.romanceSoftMoodShownFor || "",
        romanceStreakDropNoted: state.romanceStreakDropNoted || "",
        romancePrevStreakSnapshot: Number(state.romancePrevStreakSnapshot),
        autoTogetherLineOnSave: state.autoTogetherLineOnSave !== false,
        onboardingCompleted: state.onboardingCompleted === true,
        togetherLinesMaxPerDay: Math.max(0, Math.min(24, Math.round(Number(state.togetherLinesMaxPerDay || 8)))),
        togetherStudyLineDay: state.togetherStudyLineDay || "",
        togetherStudyLineCount: Math.max(0, Math.round(Number(state.togetherStudyLineCount || 0))),
        romanceDailyWhisperDay: state.romanceDailyWhisperDay || "",
        stageCueSound: state.stageCueSound !== false
      };
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gatherPersistedState()));
    }

    function hydrateStateFromPlainObject(src) {
      if (!src || typeof src !== "object") return;
      const data = migratePersistedPayload({ ...src });
      state.userName = data.userName || "";
      state.goalHours = Number(data.goalHours || 0);
      state.quest = data.quest || "";
      state.affection = Number(data.affection || 0);
      state.totalSeconds = Number(data.totalSeconds || 0);
      state.records = Array.isArray(data.records) ? data.records : [];
      state.records = state.records.map(sanitizeRecordRow).filter(Boolean);
      state.soundEnabled = data.soundEnabled !== false;
      state.replyAffectionBonus = Number(data.replyAffectionBonus || 0);
      state.routeMarriage = Number(data.routeMarriage || 0);
      state.routeYandere = Number(data.routeYandere || 0);
      state.routeAbroad = Number(data.routeAbroad || 0);
      state.endingId = data.endingId === 1 || data.endingId === 2 || data.endingId === 3 ? data.endingId : null;
      state.storyLog = Array.isArray(data.storyLog) ? data.storyLog : [];
      state.loggedStageMins = Array.isArray(data.loggedStageMins)
        ? data.loggedStageMins.filter((n) => typeof n === "number" && n >= 0 && n <= 999)
        : [];
      state.viewSubPanel = data.viewSubPanel === "story" ? "story" : "character";
      const tabRaw = String(data.uiMainTab || "").toLowerCase();
      state.uiMainTab = tabRaw === "view" ? "view" : tabRaw === "stats" ? "stats" : "record";
      state.maxAffectionEver = Math.max(
        Number(data.maxAffectionEver || 0),
        Number(data.affection || 0)
      );
      state.affectionBaselineSeconds = Math.max(0, Number(data.affectionBaselineSeconds || 0));
      state.a11yPreset = "romance";
      state.todayJournalDate = typeof data.todayJournalDate === "string" ? data.todayJournalDate : "";
      state.todayJournalLine = typeof data.todayJournalLine === "string" ? data.todayJournalLine : "";
      state.showInnerMonologue = data.showInnerMonologue !== false;
      state.weeklyGoalHours = Math.max(0, Number(data.weeklyGoalHours || 0));
      state.defaultSessionTag = typeof data.defaultSessionTag === "string" ? data.defaultSessionTag.slice(0, 24) : "";
      state.bannerDismissedGoal = typeof data.bannerDismissedGoal === "string" ? data.bannerDismissedGoal : "";
      state.bannerDismissedStreak = typeof data.bannerDismissedStreak === "string" ? data.bannerDismissedStreak : "";
      state.storyContactChannel = data.storyContactChannel === "face" || data.storyContactChannel === "text" || data.storyContactChannel === "walk"
        ? data.storyContactChannel
        : "";
      state.storyFreshReset = data.storyFreshReset === true;
      state.storySummaryFullView = data.storySummaryFullView === true;
      state.dailyChecklistDate = typeof data.dailyChecklistDate === "string" ? data.dailyChecklistDate : "";
      state.dailyChecklistItems = Array.isArray(data.dailyChecklistItems)
        ? data.dailyChecklistItems.map((s) => String(s || "").trim()).filter(Boolean).slice(0, 15)
        : [];
      state.dailyChecklistChecked = Array.isArray(data.dailyChecklistChecked)
        ? data.dailyChecklistChecked.map((x) => x === true)
        : [];
      while (state.dailyChecklistChecked.length < state.dailyChecklistItems.length) {
        state.dailyChecklistChecked.push(false);
      }
      state.dailyChecklistChecked = state.dailyChecklistChecked.slice(0, state.dailyChecklistItems.length);
      if (!Array.isArray(state.memoryMoments)) state.memoryMoments = [];
      state.memoryMoments = state.memoryMoments.map(sanitizeMemoryMoment).filter(Boolean).slice(-50);
      state.bannerDismissedWeekly = typeof data.bannerDismissedWeekly === "string" ? data.bannerDismissedWeekly : "";
      state.romanceLastSeenDate = typeof data.romanceLastSeenDate === "string" ? data.romanceLastSeenDate : "";
      state.romanceConvoDate = typeof data.romanceConvoDate === "string" ? data.romanceConvoDate : "";
      state.romanceConvoStarts = Math.max(0, Math.round(Number(data.romanceConvoStarts || 0)));
      state.romanceLastDateEventDay = typeof data.romanceLastDateEventDay === "string" ? data.romanceLastDateEventDay : "";
      state.romanceDateBackdropDay = typeof data.romanceDateBackdropDay === "string" ? data.romanceDateBackdropDay : "";
      state.romanceDateBackdropClass = typeof data.romanceDateBackdropClass === "string" ? data.romanceDateBackdropClass : "";
      state.romancePreConfessionDone = data.romancePreConfessionDone === true;
      state.romanceSoftMoodShownFor = typeof data.romanceSoftMoodShownFor === "string" ? data.romanceSoftMoodShownFor : "";
      state.romanceStreakDropNoted = typeof data.romanceStreakDropNoted === "string" ? data.romanceStreakDropNoted : "";
      const rps = data.romancePrevStreakSnapshot;
      state.romancePrevStreakSnapshot = rps === undefined || rps === null || rps === "" ? -1 : Math.round(Number(rps));
      if (!Number.isFinite(state.romancePrevStreakSnapshot)) state.romancePrevStreakSnapshot = -1;
      state.autoTogetherLineOnSave = data.autoTogetherLineOnSave !== false;
      state.onboardingCompleted = data.onboardingCompleted === true;
      state.togetherLinesMaxPerDay = Math.max(0, Math.min(24, Math.round(Number(data.togetherLinesMaxPerDay != null ? data.togetherLinesMaxPerDay : 8))));
      state.togetherStudyLineDay = typeof data.togetherStudyLineDay === "string" ? data.togetherStudyLineDay : "";
      const tsc = Number(data.togetherStudyLineCount);
      state.togetherStudyLineCount = Number.isFinite(tsc) && tsc >= 0 ? Math.round(tsc) : 0;
      state.romanceDailyWhisperDay = typeof data.romanceDailyWhisperDay === "string" ? data.romanceDailyWhisperDay : "";
      state.stageCueSound = data.stageCueSound !== false;
      state.schemaVersion = PERSIST_SCHEMA_VERSION;
      migratePassedStagesSilent();
    }

    function loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        hydrateStateFromPlainObject(JSON.parse(raw));
      } catch (_) {}
    }

    function resetRuntimeTimersAfterHydrate() {
      if (state.timerId) clearInterval(state.timerId);
      state.timerId = null;
      state.timerRunning = false;
      state.timerSeconds = 0;
      state.editingRecordIndex = -1;
      sessionRuntime.timerWallStartMs = null;
      clearUndoDelete();
    }

    function getDisplayName() {
      return (state.userName || "").trim() || "메이트";
    }

    function getVocative(name) {
      if (!name) return "야";
      const lastChar = name[name.length - 1];
      const code = lastChar.charCodeAt(0);
      const HANGUL_START = 0xac00;
      const HANGUL_END = 0xd7a3;
      if (code >= HANGUL_START && code <= HANGUL_END) {
        const hasBatchim = ((code - HANGUL_START) % 28) !== 0;
        return hasBatchim ? "아" : "야";
      }
      return "야";
    }

    function getDialogueByAffection() {
      let current = dialogues[0];
      for (const d of dialogues) {
        if (state.affection >= d.minAffection) current = d;
      }
      return current;
    }

    function pickRhythmInnerVoice(d) {
      if (!d || !d.innerVoice) return "";
      const shortv = d.innerVoiceShort;
      if (!shortv) return d.innerVoice;
      const study = Math.max(0, Number(state.totalSeconds || 0) - Number(state.affectionBaselineSeconds || 0));
      const seed = dateKey(new Date()) + "_" + study + "_" + state.affection + "_" + (d.minAffection || 0);
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return (h % 5 === 0) ? shortv : d.innerVoice;
    }

    function endingEpilogueLine(endingId) {
      const base = ENDING_EPILOGUES[endingId] || [];
      const sk = endingSeasonKey();
      const sea = (ENDING_EPILOGUE_SEASON[sk] && ENDING_EPILOGUE_SEASON[sk][endingId]) || [];
      const aff = endingEpilogueAffLines(endingId);
      const arr = base.concat(sea).concat(aff);
      if (!arr.length) return "";
      const seed = dateKey(new Date()) + "_" + String(state.totalSeconds || 0) + "_" + sk + "_" + String(state.affection || 0);
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return arr[h % arr.length];
    }

    function getInnerMonologueText() {
      let prefix = "";
      if (sessionRuntime.pendingSoftMoodPrefix) {
        prefix = String(sessionRuntime.pendingSoftMoodPrefix).trim();
        sessionRuntime.pendingSoftMoodPrefix = "";
      }
      function wrap(s) {
        const t = String(s || "").trim();
        if (!t) return t;
        return prefix ? (prefix + "\n\n" + t) : t;
      }
      if (state.storyFreshReset && !state.endingId && !state.activeInteraction) {
        return wrap("스토리를 초기화했어.…다시 첫 페이지를 넘기는 기분이야. 이번엔 네 다정한 호흡에 맞춰 천천히 걸어갈게.");
      }
      if (state.endingId && !state.activeInteraction) {
        const pool = (romanceNarrative.postEndingDaily && romanceNarrative.postEndingDaily[String(state.endingId)]) || [];
        let line = "";
        if (pool.length) {
          const raw = pickFromArr(pool, dateKey(new Date()) + "_inner_" + String(state.endingId) + "_" + String(state.totalSeconds || 0));
          line = String(raw || "").replace(/^인안나:\s*/, "").trim();
        }
        if (!line) line = endingEpilogueLine(state.endingId);
        return wrap(line);
      }
      if (state.activeInteraction) {
        if (state.activeInteraction.innerVoice) {
          return wrap(state.activeInteraction.innerVoice);
        }
        if (state.activeInteraction.choices && state.activeInteraction.choices.length) {
          return wrap("…말 걸었다. 넌 늘 먼저 다정하게 웃어 주잖아. 사교적인 너 옆에 서려면, 나도 한 마디씩 연습해야 해.");
        }
        return wrap("…대답이 좋았어. 넌 활발해서 다음 한 마디도 금방 떠오를 텐데, 나는 한 박자 쉬고 싶은 기분이야.");
      }
      const d = getDialogueByAffection();
      return wrap(pickRhythmInnerVoice(d));
    }

    function getNextDialogueInfo() {
      for (const d of dialogues) {
        if (state.affection < d.minAffection) {
          return {
            targetStage: d.stage,
            need: d.minAffection - state.affection
          };
        }
      }
      return null;
    }

    function getPanelViewSection() {
      return document.getElementById("panelView") || document.getElementById("view");
    }

    function applyA11yPresetToDocument() {
      state.a11yPreset = "romance";
      const root = document.documentElement;
      root.setAttribute("data-theme", "romance");
      root.removeAttribute("data-a11y");
      if (document.body) {
        document.body.setAttribute("data-theme", "romance");
        document.body.removeAttribute("data-a11y");
      }
      root.style.colorScheme = "light";
    }

    function ensureTodayJournalRollover() {
      const today = dateKey(new Date());
      if (!state.todayJournalDate) {
        state.todayJournalDate = today;
        return;
      }
      if (state.todayJournalDate !== today) {
        state.todayJournalDate = today;
        state.todayJournalLine = "";
      }
    }

    function questLinesToChecklist() {
      return state.quest.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 15);
    }

    function rolloverDailyChecklistIfNeeded() {
      if (!Array.isArray(state.dailyChecklistItems)) state.dailyChecklistItems = [];
      if (!Array.isArray(state.dailyChecklistChecked)) state.dailyChecklistChecked = [];
      const today = dateKey(new Date());
      if (state.dailyChecklistDate !== today) {
        state.dailyChecklistDate = today;
        const lines = questLinesToChecklist();
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

    function rebuildDailyChecklistFromSavedQuest() {
      const today = dateKey(new Date());
      state.dailyChecklistDate = today;
      const lines = questLinesToChecklist();
      state.dailyChecklistItems = lines.slice();
      state.dailyChecklistChecked = lines.map(() => false);
    }

    function allDailyGoalsMet(todayKey) {
      const todayMin = Math.round(sumSecondsByDate(todayKey) / 60);
      const goalMin = Math.max(0, Number(state.goalHours || 0)) * 60;
      const timeOk = goalMin <= 0 ? true : todayMin >= goalMin;
      const items = Array.isArray(state.dailyChecklistItems) ? state.dailyChecklistItems : [];
      const ch = Array.isArray(state.dailyChecklistChecked) ? state.dailyChecklistChecked : [];
      const listOk = items.length === 0 ? true : items.every((_, i) => ch[i] === true);
      if (goalMin <= 0 && items.length === 0) return false;
      return timeOk && listOk;
    }

    function pickDailyCompleteCheerLine() {
      const name = getDisplayName();
      const voc = getVocative(name);
      const lines = [
        name + voc + ", 오늘 적어 둔 목표 전부 끝냈네… 박자 완벽해. 나도 한 곡 더 연습할게.",
        "이렇게까지 해 내다니, " + name + voc + ". 나도 셋리스트에 ‘오늘’이라는 곡 제목 하나 적어둘게.",
        "다정한 " + name + voc + " 덕분에 오늘 내 가사에 ‘뿌듯’이라는 단어가 생겼어.",
        name + voc + ", 활발하게 쏟아낸 하루… 자랑해도 돼. 나는 옆에서 박수 칠게.",
        name + voc + ", 공부랑 퀘스트 둘 다 잡았네. 사교적인 네가 사람들한테도 자랑할 만한 하루야."
      ];
      const seed = dateKey(new Date()) + "_" + String(state.affection);
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return lines[h % lines.length];
    }

    function renderDailyGoalChecklist() {
      const wrap = $("dailyGoalChecklistWrap");
      const cheer = $("dailyGoalCompleteCheer");
      if (!wrap) return;
      const items = Array.isArray(state.dailyChecklistItems) ? state.dailyChecklistItems : [];
      if (!items.length) {
        wrap.innerHTML = "<p class='muted' style='margin:0;font-size:12px;line-height:1.45;'>퀘스트를 여러 줄로 저장하면 여기에 체크리스트가 나타납니다.</p>";
      } else {
        const rows = items.map((text, i) => {
          const checked = state.dailyChecklistChecked[i] === true;
          return "<div class='daily-goal-row'>" +
            "<input type='checkbox' id='dailyGoalCk" + i + "' data-checklist-idx='" + i + "' " + (checked ? "checked " : "") + "/>" +
            "<label for='dailyGoalCk" + i + "'>" + escapeHtml(text) + "</label></div>";
        });
        wrap.innerHTML = "<h4>오늘 체크리스트</h4>" + rows.join("");
      }
      if (cheer) {
        const today = dateKey(new Date());
        if (allDailyGoalsMet(today)) {
          cheer.hidden = false;
          cheer.innerHTML =
            "<div class='daily-goal-cheer-inner'>" +
            "<span class='daily-goal-cheer-badge' aria-label='도전 과제 달성'>" + DAILY_QUEST_COMPLETE_SVG + "</span>" +
            "<div class='daily-goal-cheer-copy'>" +
            "<span class='daily-goal-cheer-who'>도전 과제 달성</span>" +
            "<span class='daily-goal-cheer-from'>인안나</span>" +
            "<p class='daily-goal-cheer-line'>" + escapeHtml(pickDailyCompleteCheerLine()) + "</p>" +
            "</div></div>";
        } else {
          cheer.hidden = true;
          cheer.innerHTML = "";
        }
      }
    }

    function buildRouteMeterHtml() {
      const m = state.routeMarriage;
      const y = state.routeYandere;
      const a = state.routeAbroad;
      const foot = "(엔딩: 호감도 " + ENDING_MIN_AFFECTION + "+ &amp; 최고 루트 " + ENDING_MIN_ROUTE + "+)";
      if (state.endingId) {
        return "<div class='route-meter-line'><span class='route-chip'>청혼 " + m + "</span> · "
          + "<span class='route-chip'>얀데레 " + y + "</span> · "
          + "<span class='route-chip'>유학 " + a + "</span></div>"
          + "<div class='route-meter-foot muted'>" + foot + "</div>";
      }
      const max = Math.max(m, y, a);
      const chip = (label, v) => {
        const lead = max > 0 && v === max ? " route-chip--lead" : "";
        return "<span class='route-chip" + lead + "'>" + label + " " + v + "</span>";
      };
      return "<div class='route-meter-line'>" + chip("청혼", m) + " · " + chip("얀데레", y) + " · " + chip("유학", a) + "</div>"
        + "<div class='route-meter-foot muted'>숫자가 가장 큰 루트가 살짝 강조됩니다. " + foot + "</div>";
    }

    function chapterSnippetLine(d, reached) {
      if (!reached) {
        return "이 호감 구간에 도달하면 짧은 에피소드가 스토리 로그에 남습니다.";
      }
      const raw = (d.eventStory || d.text || "").replace(/\s+/g, " ").trim();
      if (!raw) return escapeHtml(d.stage) + " 구간을 지나는 중입니다.";
      if (raw.length <= 72) return escapeHtml(raw);
      return escapeHtml(raw.slice(0, 72)) + "…";
    }

    function chapterFullBodyHtml(d) {
      const es = (d.eventStory || "").trim();
      const tx = (d.text || "").trim();
      let html = "";
      if (es) {
        html += "<div class='story-chapter-block'><strong class='muted'>에피소드</strong>"
          + "<div class='story-chapter-fulltext'>" + escapeHtml(es).replace(/\n/g, "<br>") + "</div></div>";
      }
      if (tx) {
        html += "<div class='story-chapter-block'><strong class='muted'>대사 (게임 속)</strong>"
          + "<div class='story-chapter-fulltext'>" + escapeHtml(tx).replace(/\n/g, "<br>") + "</div></div>";
      }
      if (!html) {
        html = "<p class='muted story-chapter-line'>이 장에 등록된 본문이 없습니다.</p>";
      }
      return html;
    }

    function buildStoryChaptersHtml() {
      const sorted = [...dialogues].sort((a, b) => a.minAffection - b.minAffection);
      const full = state.storySummaryFullView === true;
      let html = "<h4 class='story-subheading'>스토리 장 요약</h4><div class='story-chapters'>";
      sorted.forEach((d, idx) => {
        const reached = state.affection >= d.minAffection;
        const cls = reached ? "story-chapter story-chapter--done" : "story-chapter story-chapter--pending";
        html += "<div class='" + cls + "'>";
        html += "<div class='story-chapter-kicker'>제 " + (idx + 1) + "장 · 호감 " + d.minAffection + "+</div>";
        html += "<div class='story-chapter-title'>" + escapeHtml(d.stage) + "</div>";
        if (full) {
          html += chapterFullBodyHtml(d);
        } else {
          html += "<p class='story-chapter-line muted'>" + chapterSnippetLine(d, reached) + "</p>";
        }
        html += "</div>";
      });
      html += "</div>";
      html += "<div class='story-chapter-actions'><button type='button' class='btn secondary' data-story-full-toggle>"
        + (full ? "요약으로 보기" : "스토리 더 보기")
        + "</button></div>";
      return html;
    }

    function buildHeartText() {
      const maxHearts = 10;
      const filled = Math.max(0, Math.min(maxHearts, Math.floor(state.affection / 10)));
      return "♥".repeat(filled) + "♡".repeat(maxHearts - filled);
    }

    function applyRoutePoints(choice) {
      const pts = Number(choice.routePts || 3);
      if (choice.route === "marriage") state.routeMarriage += pts;
      else if (choice.route === "yandere") state.routeYandere += pts;
      else if (choice.route === "abroad") state.routeAbroad += pts;
    }

    function resolveEndingId() {
      const entries = [
        { id: 1, score: state.routeMarriage },
        { id: 2, score: state.routeYandere },
        { id: 3, score: state.routeAbroad }
      ];
      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const priority = [1, 3, 2];
        return priority.indexOf(a.id) - priority.indexOf(b.id);
      });
      return entries[0].id;
    }

    function tryUnlockEnding() {
      if (state.endingId) return false;
      const maxRoute = Math.max(state.routeMarriage, state.routeYandere, state.routeAbroad);
      if (state.affection < ENDING_MIN_AFFECTION || maxRoute < ENDING_MIN_ROUTE) return false;
      state.endingId = resolveEndingId();
      state.activeInteraction = null;
      state.lastReplyText = "";
      const name = getDisplayName();
      const voc = getVocative(name);
      appendStoryLog({
        type: "ending",
        title: getEndingTitle(state.endingId),
        body: getEndingBody(state.endingId, name, voc)
      });
      return true;
    }

    function getEndingTitle(id) {
      if (id === 1) return "엔딩 1 · 인안나의 청혼";
      if (id === 2) return "엔딩 2 · 마이크 뒤의 집착";
      if (id === 3) return "엔딩 3 · 해외 스테이지로";
      return "";
    }

    function getEndingBody(id, name, voc) {
      if (id === 1) {
        return "인안나: " + name + voc + ", 나와 결혼해 줄래?\n\n"
          + "고등학교 때는 말 못 했던 말이야. 지금은 실용음악과도 밴드도 있지만, 평생 네 옆에서 네 꿈 응원하고 싶어.\n"
          + "반지는 내가 준비했어… 무대 위에서 노래하듯 진심이야. 잊지 말아 줘.";
      }
      if (id === 2) {
        return "인안나: " + name + voc + ", 도망치면 안 돼.\n\n"
          + "너는 내가 제일 먼저 찾은 동창이야. 연습실에서도 캠퍼스에서도—네 시선, 시간, 플레이리스트 전부 내 쪽으로만 와.\n"
          + "다른 사람에게 넘길 생각은 없어. 내 곁에만 있어. 메탈보다 더 크게 너만 부를게.";
      }
      if (id === 3) {
        return "인안나: " + name + voc + ", 같이 해외로 유학 가자.\n\n"
          + "실용음악을 더 깊이 배우고, 거기서 밴드도 이어가고 싶어. 어학·비자·오디션 준비, 전부 같이 하자.\n"
          + "낯선 도시 캠퍼스도, 현지 클럽 무대도—네 이름을 내 셋리스트 옆에 계속 적고 싶어.";
      }
      return "";
    }

    /**
     * 공부로 오르는 호감도는 기준선 이후 누적 초(studyOnly)만 비선형 곡선에 넣습니다.
     * (예전: calc(total)-calc(baseline) → 한 순간의 증가율이 누적 총공부 구간에 묶임)
     * 초기화 후에는 다시 “곡선의 앞부분” 증가율을 따릅니다. 대화 보너스는 replyAffectionBonus로 합산.
     */
    function recalcAffectionTotal() {
      const total = Math.max(0, Number(state.totalSeconds || 0));
      let baseline = Math.max(0, Number(state.affectionBaselineSeconds || 0));
      if (baseline > total) {
        baseline = total;
        state.affectionBaselineSeconds = total;
      }
      const studyOnly = Math.max(0, total - baseline);
      const baseFromStudy = calcAffectionBySeconds(studyOnly);
      state.affection = Math.max(0, baseFromStudy + Number(state.replyAffectionBonus || 0));
      state.maxAffectionEver = Math.max(Number(state.maxAffectionEver || 0), state.affection);
    }

    function createAffectionInteraction() {
      if (state.endingId) return;
      ensureRomanceDailyRollover();
      state.romanceConvoStarts += 1;
      const displayName = getDisplayName();
      const voc = getVocative(displayName);
      const scene = romanceNarrative.preConfessionScene;
      let npcFragment = "";
      let choices = [];
      let innerVoice = "";
      let logTitle = "연애 이벤트 · 인안나가 말을 걸어 왔다";
      let logType = "interaction";
      let usePre = false;
      if (scene && typeof scene === "object" && !state.romancePreConfessionDone) {
        const minAff = Number(scene.minAffection != null ? scene.minAffection : 72);
        const minConv = Number(scene.minTotalConversations != null ? scene.minTotalConversations : 5);
        const minSame = Number(scene.sameDayStarts != null ? scene.sameDayStarts : 2);
        const convs = state.storyLog.filter((e) => e.type === "interaction" || e.type === "choice").length;
        if (state.affection >= minAff && state.affection < ENDING_MIN_AFFECTION
            && convs >= minConv && state.romanceConvoStarts >= minSame) {
          state.romancePreConfessionDone = true;
          usePre = true;
          npcFragment = String(scene.npc || "").trim();
          choices = Array.isArray(scene.choices) ? scene.choices.slice(0, 3) : [];
          innerVoice = String(scene.inner || scene.innerVoice || "").trim();
          logTitle = String(scene.title || "짧은 분기").trim() || "짧은 분기";
          logType = "branch";
          if (!choices.length) {
            state.romancePreConfessionDone = false;
            usePre = false;
          }
        }
      }
      if (!usePre) {
        const pick = interactionTemplates[Math.floor(Math.random() * interactionTemplates.length)];
        npcFragment = pick.npc;
        choices = pick.choices.slice(0, 3);
        innerVoice = pick.inner || "";
      }
      state.activeInteraction = {
        npc: displayName + voc + ", " + npcFragment,
        choices: choices,
        innerVoice: innerVoice
      };
      state.lastReplyText = "";
      appendStoryLog({
        type: logType,
        title: logType === "branch" ? logTitle : "연애 이벤트 · 인안나가 말을 걸어 왔다",
        body: "인안나: " + state.activeInteraction.npc
      });
    }

    function sumSecondsByDate(targetKey) {
      return state.records
        .filter((r) => r.date === targetKey)
        .reduce((sum, r) => sum + Number(r.seconds || 0), 0);
    }

    function getCurrentMonthTotalSeconds() {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const prefix = y + "-" + String(m + 1).padStart(2, "0") + "-";
      let sec = 0;
      state.records.forEach((r) => {
        if (r.date && r.date.startsWith(prefix)) sec += Number(r.seconds || 0);
      });
      return sec;
    }

    function computeStudyStreakDays() {
      const now = new Date();
      const todayKey = dateKey(now);
      const todaySec = sumSecondsByDate(todayKey);
      const cursor = new Date(now);
      if (todaySec < 60) {
        cursor.setDate(cursor.getDate() - 1);
      }
      let streak = 0;
      while (true) {
        const key = dateKey(cursor);
        if (sumSecondsByDate(key) >= 60) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    }

    function getSeries(days) {
      const arr = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = dateKey(d);
        arr.push({ label: dateLabel(key), minutes: Math.round(sumSecondsByDate(key) / 60) });
      }
      return arr;
    }

    function getSeriesLastMonths(monthCount) {
      const arr = [];
      const now = new Date();
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const prefix = y + "-" + String(m + 1).padStart(2, "0") + "-";
        let sec = 0;
        state.records.forEach((r) => {
          if (r.date && r.date.startsWith(prefix)) sec += Number(r.seconds || 0);
        });
        const label = String(y).slice(-2) + "." + String(m + 1).padStart(2, "0");
        arr.push({ label: label, minutes: Math.round(sec / 60) });
      }
      return arr;
    }

    function drawBarChart(canvasId, series, colorA, colorB) {
      void colorA;
      void colorB;
      const canvas = $(canvasId);
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barA = "#c95678";
      const barB = "#8b7aa8";
      const gridStroke = "rgba(45, 38, 58, 0.12)";
      const labelFill = "#2d2640";

      const pad = { l: 32, r: 12, t: 16, b: 30 };
      const graphW = w - pad.l - pad.r;
      const graphH = h - pad.t - pad.b;
      const totalMin = series.reduce((sum, s) => sum + Number(s.minutes || 0), 0);
      if (totalMin <= 0) {
        ctx.strokeStyle = gridStroke;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = pad.t + (graphH / 4) * i;
          ctx.beginPath();
          ctx.moveTo(pad.l, y);
          ctx.lineTo(w - pad.r, y);
          ctx.stroke();
        }
        ctx.fillStyle = labelFill;
        ctx.font = "11px Noto Sans KR, Segoe UI, sans-serif";
        ctx.textAlign = "center";
        const dot = UI_EMPTY_HINT.indexOf(".");
        const line1 = dot > 0 ? UI_EMPTY_HINT.slice(0, dot + 1) : UI_EMPTY_HINT;
        const line2 = dot > 0 ? UI_EMPTY_HINT.slice(dot + 1).trim() : "";
        const midY = pad.t + graphH / 2;
        ctx.fillText(line1, w / 2, midY - 4);
        if (line2) ctx.fillText(line2, w / 2, midY + 12);
        return;
      }

      const maxVal = Math.max(10, ...series.map((s) => s.minutes));
      const barW = graphW / series.length * 0.7;
      const gap = graphW / series.length * 0.3;

      ctx.strokeStyle = gridStroke;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (graphH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();
      }

      series.forEach((item, i) => {
        const x = pad.l + i * (barW + gap) + gap / 2;
        const bh = (item.minutes / maxVal) * graphH;
        const y = pad.t + graphH - bh;

        const grad = ctx.createLinearGradient(0, y, 0, pad.t + graphH);
        grad.addColorStop(0, barA);
        grad.addColorStop(1, barB);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, bh);

        ctx.fillStyle = labelFill;
        ctx.font = "11px Noto Sans KR, Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(item.label, x + barW / 2, h - 10);
      });
    }

    function readHistoryFiltersFromDom() {
      const out = { from: "", to: "", tag: "", weekOnly: false, sort: "date-desc" };
      const f = $("historyFilterDateFrom");
      const t = $("historyFilterDateTo");
      const tg = $("historyFilterTagContains");
      const wk = $("historyFilterWeekOnly");
      const s = $("historyFilterSort");
      if (f instanceof HTMLInputElement) out.from = f.value.trim();
      if (t instanceof HTMLInputElement) out.to = t.value.trim();
      if (tg instanceof HTMLInputElement) out.tag = tg.value.trim().toLowerCase();
      if (wk instanceof HTMLInputElement) out.weekOnly = wk.checked === true;
      if (s instanceof HTMLSelectElement && (s.value === "date-desc" || s.value === "date-asc")) out.sort = s.value;
      return out;
    }

    function getFilteredHistoryRows() {
      const f = readHistoryFiltersFromDom();
      const wr = weekDateRangeKeys(new Date());
      const weekSet = new Set(wr.keys);
      let arr = state.records.map((r, idx) => ({ r: r, idx: idx }));
      arr = arr.filter(({ r }) => {
        if (!r || !r.date) return false;
        if (f.from && r.date < f.from) return false;
        if (f.to && r.date > f.to) return false;
        if (f.weekOnly && !weekSet.has(r.date)) return false;
        if (f.tag) {
          const tt = (r.tag && String(r.tag).trim()) ? String(r.tag).trim().toLowerCase() : "";
          if (!tt.includes(f.tag)) return false;
        }
        return true;
      });
      arr.sort((a, b) => {
        if (a.r.date !== b.r.date) {
          if (f.sort === "date-desc") {
            return a.r.date < b.r.date ? -1 : a.r.date > b.r.date ? 1 : 0;
          }
          return a.r.date > b.r.date ? -1 : a.r.date < b.r.date ? 1 : 0;
        }
        return a.idx - b.idx;
      });
      const slice = f.sort === "date-desc" ? arr.slice(-50).reverse() : arr.slice(0, 50);
      return slice;
    }

    function clearUndoDelete() {
      if (sessionRuntime.undoTimerId != null) {
        clearTimeout(sessionRuntime.undoTimerId);
        sessionRuntime.undoTimerId = null;
      }
      sessionRuntime.undoDelete = null;
      const sb = $("recordUndoSnackbar");
      if (sb) sb.hidden = true;
    }

    function scheduleUndoDelete(removedRecord, insertIndex) {
      clearUndoDelete();
      try {
        sessionRuntime.undoDelete = { record: JSON.parse(JSON.stringify(removedRecord)), index: insertIndex };
      } catch (_) {
        sessionRuntime.undoDelete = { record: Object.assign({}, removedRecord), index: insertIndex };
      }
      const sb = $("recordUndoSnackbar");
      const msg = $("recordUndoSnackbarMsg");
      if (msg) msg.textContent = "기록 1건을 삭제했습니다. 되돌리기는 약 8초 동안만 보입니다.";
      if (sb) sb.hidden = false;
      sessionRuntime.undoTimerId = setTimeout(() => {
        sessionRuntime.undoTimerId = null;
        sessionRuntime.undoDelete = null;
        if (sb) sb.hidden = true;
      }, 8000);
    }

    function updateSessionDocumentTitle() {
      const base = sessionRuntime.baseDocumentTitle || APP_DISPLAY_NAME;
      if (!document.hidden) {
        if (document.title !== base) document.title = base;
        return;
      }
      if (state.timerRunning) {
        document.title = "[" + fmtTime(state.timerSeconds) + "] 타이머 · " + base;
        return;
      }
      document.title = base;
    }

    function normalizeMainTabId(tabId) {
      if (tabId === "view") return "view";
      if (tabId === "stats") return "stats";
      return "record";
    }

    function focusFirstInMainPanel(tabId) {
      const tab = normalizeMainTabId(tabId);
      const root =
        tab === "record" ? $("record") : tab === "stats" ? $("panelStats") : getPanelViewSection();
      if (!root) return;
      const el = root.querySelector(TAB_FOCUSABLE);
      if (el instanceof HTMLElement) {
        requestAnimationFrame(() => {
          try {
            el.focus({ preventScroll: false });
          } catch (_) {
            el.focus();
          }
        });
      }
    }

    function removeRecordAtIndex(recordIndex) {
      const record = state.records[recordIndex];
      if (!record) return false;
      state.records.splice(recordIndex, 1);
      state.editingRecordIndex = -1;
      recalcFromRecords();
      saveState();
      scheduleUndoDelete(record, recordIndex);
      render();
      return true;
    }

    function renderHistory() {
      const list = $("historyList");
      if (!list) return;
      if (!state.records.length) {
        list.innerHTML = "<p class='muted'>" + escapeHtml(UI_EMPTY_HINT) + "</p>";
        return;
      }
      const latest = getFilteredHistoryRows();
      if (!latest.length) {
        list.innerHTML = "<p class='muted'>조건에 맞는 기록이 없어요. 필터를 바꿔 보세요.</p>";
        return;
      }
      list.innerHTML = latest.map((o) => {
        const r = o.r;
        const idx = o.idx;
        const min = Math.round(r.seconds / 60);
        const isEditing = state.editingRecordIndex === idx;
        const tagLine = r.tag ? "<div class='muted'>태그: " + escapeHtml(r.tag) + "</div>" : "";
        const noteLine = r.note ? "<div class='muted'>메모: " + escapeHtml(r.note) + "</div>" : "";
        const intentLine = r.intent ? "<div class='muted'>집중 목표: " + escapeHtml(r.intent) + "</div>" : "";
        const hourLine = typeof r.startHour === "number" && r.startHour >= 0 && r.startHour <= 23
          ? "<div class='muted'>시작 시각대: " + r.startHour + "시</div>"
          : "";
        return "<div class='history-item'>" +
          "<div class='history-row'>" +
          "<div><strong>" + r.date + "</strong> · " + min + "분</div>" +
          "<div style='display:flex;gap:6px;flex-shrink:0;'>" +
          "<button type='button' class='mini-btn' data-action='edit' data-edit-index='" + idx + "'>수정</button>" +
          "<button type='button' class='mini-btn delete' data-action='quick-delete' data-edit-index='" + idx + "'>삭제</button>" +
          "</div></div>" +
          "<div class='muted'>퀘스트: " + escapeHtml(r.quest || "미입력") + "</div>" +
          tagLine +
          noteLine +
          intentLine +
          hourLine +
          (isEditing
            ? "<div class='inline-edit'>" +
              "<input type='date' data-field='date' data-edit-index='" + idx + "' value='" + r.date + "' />" +
              "<div class='minutes-input-wrap'>" +
              "<input type='number' min='1' step='1' data-field='minutes' data-edit-index='" + idx + "' value='" + min + "' />분" +
              "</div>" +
              "<input type='text' data-field='tag' data-edit-index='" + idx + "' value='" + escapeHtml(r.tag || "") + "' maxlength='24' placeholder='태그' style='max-width:140px;' />" +
              "<button type='button' class='mini-btn save' data-action='save' data-edit-index='" + idx + "'>저장</button>" +
              "<button type='button' class='mini-btn cancel' data-action='cancel' data-edit-index='" + idx + "'>취소</button>" +
              "<button type='button' class='mini-btn delete' data-action='delete' data-edit-index='" + idx + "'>삭제</button>" +
              "</div>"
            : "") +
          "</div>";
      }).join("");
    }

    /* ===== JS §4 Main render — charts, VN ===== */
    /** 타이머 실행 중 1초마다 — 전체 render() 대신 시계·독만 갱신 */
    function renderTimerTickHud() {
      const tEl = $("timerDisplay");
      if (tEl) tEl.textContent = fmtTime(state.timerSeconds);
      const dT = $("dockTimerShort");
      if (dT) dT.textContent = fmtTime(state.timerSeconds);
      updateSessionDocumentTitle();
    }

    function updateInsightBanners(today) {
      const wrap = $("insightBannerWrap");
      const inner = $("insightBanner");
      if (!wrap || !inner) return;
      const parts = [];
      const todayMin = Math.round(sumSecondsByDate(today) / 60);
      const goalDayMin = Math.max(0, Number(state.goalHours || 0)) * 60;
      if (goalDayMin && todayMin >= goalDayMin && state.bannerDismissedGoal !== today) {
        parts.push("<div class='insight-banner insight-banner--ok' role='status'>"
          + "<div class='insight-banner-main'>"
          + "<span class='insight-banner-icon' aria-hidden='true'>◎</span>"
          + "<div class='insight-banner-copy'>"
          + "<strong class='insight-banner-title'>오늘 목표 달성</strong>"
          + "<span class='insight-banner-desc'>목표 시간을 모두 채웠어요. 오늘도 한 박자 잘 맞췄어요.</span>"
          + "</div></div>"
          + "<button type='button' class='mini-btn' data-banner-dismiss='goal'>닫기</button></div>");
      }
      const streak = computeStudyStreakDays();
      const h = new Date().getHours();
      if (streak >= 1 && todayMin < 1 && h >= 17 && state.bannerDismissedStreak !== today) {
        parts.push("<div class='insight-banner insight-banner--warn' role='status'>"
          + "<div class='insight-banner-main'>"
          + "<span class='insight-banner-icon' aria-hidden='true'>!</span>"
          + "<div class='insight-banner-copy'>"
          + "<strong class='insight-banner-title'>연속 출석 지키기</strong>"
          + "<span class='insight-banner-desc'>오늘 1분만 기록해도 연속일이 이어져요.</span>"
          + "</div></div>"
          + "<button type='button' class='mini-btn' data-banner-dismiss='streak'>닫기</button></div>");
      }
      const wmk = mondayKeyOfWeekContaining(new Date());
      const wh = Number(state.weeklyGoalHours || 0);
      if (wh > 0 && state.bannerDismissedWeekly !== wmk) {
        const weekSec = sumSecondsWeekMonSun(new Date());
        const needMin = wh * 60;
        const doneMin = Math.round(weekSec / 60);
        const pct = needMin ? Math.min(100, Math.round((doneMin / needMin) * 100)) : 0;
        if (pct < 100) {
          parts.push("<div class='insight-banner insight-banner--info' role='status'>"
            + "<div class='insight-banner-main'>"
            + "<span class='insight-banner-icon' aria-hidden='true'>%</span>"
            + "<div class='insight-banner-copy'>"
            + "<strong class='insight-banner-title'>이번 주 목표까지 " + pct + "%</strong>"
            + "<span class='insight-banner-desc'>누적 " + doneMin + "분 / 목표 " + needMin + "분 · 색 말고 숫자로만 살짝 알려 줘요.</span>"
            + "</div></div>"
            + "<button type='button' class='mini-btn' data-banner-dismiss='weekly'>닫기</button></div>");
        }
      }
      if (!parts.length) {
        wrap.hidden = true;
        inner.innerHTML = "";
        return;
      }
      wrap.hidden = false;
      inner.innerHTML = parts.join("");
    }

    function render() {
      try {
      ensureTodayJournalRollover();
      rolloverDailyChecklistIfNeeded();
      applyA11yPresetToDocument();
      const today = dateKey(new Date());
      clearRomanceBackdropIfStale(today);
      updateRomanceVisitSoftMood(today);
      maybeNoteStreakSoftMood(today);
      ensureRomanceDailyRollover();
      tryRomanceDateCutscene(today);
      tryDailyWhisperLog(today);
      const userNameViewEdit = $("userNameViewEdit");
      if (userNameViewEdit) userNameViewEdit.value = state.userName || "";
      const goalHoursEl = $("goalHours");
      if (goalHoursEl) goalHoursEl.value = state.goalHours || "";
      const questTextEl = $("questText");
      if (questTextEl) questTextEl.value = state.quest || "";
      const goalQuestStatusEl = $("goalQuestStatus");
      if (goalQuestStatusEl) {
        goalQuestStatusEl.textContent = state.goalHours
          ? "하루 목표 " + state.goalHours + "시간 / 퀘스트 저장됨"
          : "저장된 목표 없음";
      }
      renderDailyGoalChecklist();
      const wgh = $("weeklyGoalHours");
      if (wgh) wgh.value = state.weeklyGoalHours || "";
      const dft = $("defaultSessionTagInput");
      if (dft && document.activeElement !== dft) dft.value = state.defaultSessionTag || "";

      const jIn = $("todayJournalInput");
      const jHint = $("todayJournalHint");
      if (jIn && document.activeElement !== jIn) {
        jIn.value = state.todayJournalLine || "";
      }
      if (jHint) {
        jHint.textContent = (state.todayJournalLine || "").trim()
          ? "스토리 탭 요약 상단에 함께 표시됩니다."
          : "저장하면 오늘 날짜에 묶여 스토리 요약과 로그 위에 보입니다. 다정·활발·사교적이라는 설정도 한 줄에 살짝 녹여도 좋아요.";
      }

      safeSetText("todayTotal", Math.round(sumSecondsByDate(today) / 60) + "분");
      safeSetText("allTotal", fmtHourMin(state.totalSeconds));
      safeSetText("affectionDisplay", String(state.affection));

      const goalRing = $("todayGoalRing");
      const goalPctEl = $("todayGoalRingPct");
      const goalRingText = $("todayGoalRingText");
      if (goalRing && goalPctEl && goalRingText) {
        const todaySecGoal = sumSecondsByDate(today);
        const goalMinTotal = Math.max(0, Number(state.goalHours || 0)) * 60;
        const doneMinRounded = Math.round(todaySecGoal / 60);
        if (!goalMinTotal) {
          goalRing.style.setProperty("--goal-p", "0");
          goalPctEl.textContent = doneMinRounded + "분";
          goalRingText.textContent = "하루 목표를 저장하면 달성률 링이 표시됩니다. 오늘 누적 " + doneMinRounded + "분.";
        } else {
          const pctRaw = (doneMinRounded / goalMinTotal) * 100;
          const pct = Math.min(100, Math.max(0, Math.round(pctRaw)));
          goalRing.style.setProperty("--goal-p", String(pct));
          goalPctEl.textContent = pct + "%";
          goalRingText.textContent = "오늘 " + doneMinRounded + "분 · 목표 " + goalMinTotal + "분 (" + state.goalHours + "시간 기준)";
        }
      }
      const streakVal = $("studyStreakValue");
      const streakHint = $("studyStreakHint");
      if (streakVal) streakVal.textContent = String(computeStudyStreakDays());
      if (streakHint) {
        const todayOk = sumSecondsByDate(today) >= 60;
        streakHint.textContent = todayOk
          ? "오늘 1분 이상 기록으로 연속일에 오늘이 포함됐어요."
          : "오늘은 아직 미반영이면 어제까지의 연속일을 보여 줘요. 1분만 적어도 이어져요.";
      }
      const monthTotalEl = $("monthTotalTime");
      if (monthTotalEl) monthTotalEl.textContent = fmtHourMin(getCurrentMonthTotalSeconds());

      const nowDate = new Date();
      const weekSec = sumSecondsWeekMonSun(nowDate);
      const wtot = $("weeklyTotalShort");
      if (wtot) wtot.textContent = fmtHourMin(weekSec);
      const wgLine = $("weeklyGoalLine");
      if (wgLine) {
        const wh = Number(state.weeklyGoalHours || 0);
        if (!wh) wgLine.textContent = "주간 목표(시간)을 목표 카드에서 저장하면 진행률이 표시됩니다.";
        else {
          const needMin = wh * 60;
          const doneMin = Math.round(weekSec / 60);
          const pct = needMin ? Math.min(100, Math.round((doneMin / needMin) * 100)) : 0;
          wgLine.textContent = "이번 주 " + doneMin + "분 / 목표 " + needMin + "분 (" + pct + "%)";
        }
      }
      const tagLineEl = $("tagStatsLine");
      if (tagLineEl) {
        const m = aggregateSecondsByTag();
        const rows = Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, 5);
        tagLineEl.textContent = rows.length
          ? "태그별 누적: " + rows.map((k) => k + " " + fmtHourMin(m[k])).join(" · ")
          : UI_EMPTY_TAGS;
      }
      const autoTog = $("autoTogetherLineChk");
      if (autoTog && document.activeElement !== autoTog) autoTog.checked = state.autoTogetherLineOnSave !== false;
      const stageCueChk = $("stageCueSoundChk");
      if (stageCueChk && document.activeElement !== stageCueChk) stageCueChk.checked = state.stageCueSound !== false;
      updateInsightBanners(today);
      updateTodayInannaStrip();
      renderWeeklyInsightsCard(nowDate);

      const charImg = $("characterImage");
      const thumb = $("characterImageThumb");
      if (charImg) {
        const src = getCharacterImageSrc();
        const alt = getCharacterImageAlt();
        charImg.src = src;
        charImg.alt = alt;
        if (thumb) {
          thumb.src = src;
          thumb.alt = alt;
        }
      }

      const vnDateEl = $("vnDateLine");
      if (vnDateEl) vnDateEl.textContent = formatVnHudDate();
      const vnAff = $("vnHudAffection");
      if (vnAff) vnAff.textContent = String(state.affection);

      const nowDialogue = getDialogueByAffection();
      const nextDialogue = getNextDialogueInfo();
      const displayName = getDisplayName();
      const voc = getVocative(displayName);
      const recordGreeting = $("recordGreeting");
      if (recordGreeting) recordGreeting.textContent = "안녕하세요, " + displayName + "님";
      const recordHeroDate = $("recordHeroDate");
      if (recordHeroDate) recordHeroDate.textContent = formatVnHudDate();
      const statsHeroDate = $("statsHeroDate");
      if (statsHeroDate) statsHeroDate.textContent = formatVnHudDate();
      const recordRailName = $("recordRailName");
      if (recordRailName) recordRailName.textContent = displayName;
      const recordRailAvatar = $("recordRailAvatar");
      if (recordRailAvatar) {
        const ch = (displayName.trim().charAt(0) || "메");
        recordRailAvatar.textContent = ch;
      }
      const vnStageEl = $("vnRomanceStage");
      const dlg = $("dialogueBox");
      if (state.endingId) {
        const st = state.endingId === 1 ? "엔딩 · 청혼" : state.endingId === 2 ? "엔딩 · 얀데레" : "엔딩 · 유학 제안";
        safeSetText("romanceStage", st);
        if (vnStageEl) vnStageEl.textContent = st;
        if (dlg) dlg.textContent = getEndingMainDialogue(displayName, voc);
        safeSetText("nextStageInfo", "-");
      } else {
        safeSetText("romanceStage", nowDialogue.stage);
        if (vnStageEl) vnStageEl.textContent = nowDialogue.stage;
        if (dlg) dlg.textContent = buildMainDialogueLine(displayName, voc, nowDialogue.text);
        safeSetText("nextStageInfo", nextDialogue
          ? nextDialogue.targetStage + "까지 " + nextDialogue.need + " 필요"
          : "최고 단계 달성");
      }
      if (dlg && sessionRuntime.vnDialogueFlashOneShot) {
        sessionRuntime.vnDialogueFlashOneShot = false;
        dlg.classList.remove("vn-dialogue--flash");
        void dlg.offsetWidth;
        dlg.classList.add("vn-dialogue--flash");
        setTimeout(() => dlg.classList.remove("vn-dialogue--flash"), 1200);
      }
      const relMeta = $("relationshipMetaLine");
      if (relMeta) relMeta.textContent = getRelationshipMetaLine();
      const dwLine = $("dailyWhisperLine");
      if (dwLine) dwLine.textContent = state.endingId ? "" : getDailyWhisperLineForToday();
      applyVnBackdropClassForToday(today);
      const innerToggle = $("innerMonologueToggle");
      const innerBox = $("innerMonologueBox");
      const innerHint = $("innerMonologueHint");
      if (innerToggle && innerBox) {
        const show = state.showInnerMonologue !== false;
        innerToggle.checked = show;
        innerBox.hidden = !show;
        innerBox.textContent = getInnerMonologueText();
        innerBox.setAttribute("aria-hidden", show ? "false" : "true");
      }
      if (innerHint) {
        innerHint.textContent = "인안나 「" + NPC_PERSONALITY + "」의 속마음 · 당신은 「" + USER_PERSONALITY + "」으로 그려져요.";
      }
      safeSetText("heartMeter", buildHeartText());
      const routeEl = $("routeMeter");
      if (routeEl) routeEl.innerHTML = buildRouteMeterHtml();
      safeSetText("affectionSummary", displayName + " · 인안나와의 호감도 " + state.affection + " · "
        + (state.endingId
          ? (state.endingId === 1 ? "엔딩 · 청혼" : state.endingId === 2 ? "엔딩 · 얀데레" : "엔딩 · 유학 제안")
          : nowDialogue.stage));
      if (state.endingId) {
        safeStyle("endingPanel", "display", "block");
        safeSetText("endingTitle", getEndingTitle(state.endingId));
        safeSetText("endingBody", getEndingBody(state.endingId, displayName, voc));
      } else {
        safeStyle("endingPanel", "display", "none");
      }
      const cpw = $("storyContactPickWrap");
      if (cpw) {
        const eligible = !state.storyContactChannel && !state.endingId && state.affection >= 12 && state.affection < 72;
        cpw.hidden = !eligible;
      }
      const dToday = $("dockTodayShort");
      if (dToday) dToday.textContent = Math.round(sumSecondsByDate(today) / 60) + "분";
      safeSetText("soundToggleBtn", "알림음: " + (state.soundEnabled ? "켜짐" : "꺼짐"));
      if (state.activeInteraction && !state.endingId) {
        safeStyle("talkBox", "display", "block");
        safeSetText("npcTalkLine", "인안나: " + state.activeInteraction.npc);
        const rc = $("replyChoices");
        if (rc) {
          rc.setAttribute("role", "radiogroup");
          rc.setAttribute("aria-label", "인안나에게 답하는 선택지");
          rc.innerHTML = state.activeInteraction.choices
            .map((choice, idx) => "<button type='button' class='vn-choice-item' data-reply-index='" + idx + "'>" +
              "<span class='vn-choice-check' aria-hidden='true'></span>" +
              "<span class='vn-choice-label'>" + escapeHtml(choice.text) + "</span></button>")
            .join("");
        }
        safeSetText("replyResult", state.lastReplyText);
      } else {
        safeStyle("talkBox", "display", "none");
        const rc = $("replyChoices");
        if (rc) {
          rc.removeAttribute("role");
          rc.removeAttribute("aria-label");
          rc.innerHTML = "";
        }
        safeSetText("replyResult", "");
      }

      renderHistory();
      drawBarChart("weeklyChart", getSeries(7), "#720f32", "#114665");
      drawBarChart("monthlyChart", getSeriesLastMonths(6), "#7b445a", "#16202b");
      updateDateCutsceneHintEl();
      syncOnboardingOverlay();
      const tgt = $("togetherLinesMaxDayInput");
      if (tgt && document.activeElement !== tgt) {
        tgt.value = String(Math.max(0, Math.min(24, Math.round(Number(state.togetherLinesMaxPerDay || 8)))));
      }
      renderStoryLogList();
      } catch (err) {
        console.error("[render]", err);
      } finally {
        try {
          applyMainTabToDom();
        } catch (e3) {
          console.error("[render] applyMainTabToDom", e3);
        }
        try {
          syncViewSubPanels();
        } catch (e2) {
          console.error("[render] syncViewSubPanels", e2);
        }
        try {
          renderTimerTickHud();
        } catch (_) {}
        try {
          updateSessionDocumentTitle();
        } catch (_) {}
      }
    }

    function addSessionRecord(seconds, source, opts) {
      opts = opts || {};
      if (seconds <= 0) return;
      const prevAffection = state.affection;
      const today = dateKey(new Date());
      const rec = {
        date: today,
        seconds,
        quest: state.quest,
        source: source || "manual"
      };
      const tag = (opts.tag != null ? String(opts.tag) : (state.defaultSessionTag || "")).trim().slice(0, 24);
      if (tag) rec.tag = tag;
      const note = opts.note != null ? String(opts.note).trim().slice(0, 200) : "";
      if (note) rec.note = note;
      const intentOpt = opts.intent != null ? String(opts.intent).trim().slice(0, 120) : "";
      if (intentOpt) rec.intent = intentOpt;
      const shOpt = opts.startHour;
      let sh = shOpt !== undefined && shOpt !== null ? Math.round(Number(shOpt)) : NaN;
      if (!Number.isFinite(sh) || sh < 0 || sh > 23) {
        sh = new Date().getHours();
      }
      if (Number.isFinite(sh) && sh >= 0 && sh <= 23) rec.startHour = sh;
      state.records.push(rec);
      state.totalSeconds += seconds;
      if (seconds > 0 && state.storyFreshReset) {
        state.storyFreshReset = false;
      }
      recalcAffectionTotal();
      logRelationshipMilestones(prevAffection, state.affection);
      if (state.autoTogetherLineOnSave !== false) {
        const maxN = Math.max(0, Math.min(24, Math.round(Number(state.togetherLinesMaxPerDay || 8))));
        if (maxN > 0) {
          if (state.togetherStudyLineDay !== today) {
            state.togetherStudyLineDay = today;
            state.togetherStudyLineCount = 0;
          }
          if (state.togetherStudyLineCount < maxN) {
            const line = buildTogetherStudyLineForRecord(rec);
            if (line && line.trim()) {
              appendStoryLog({
                type: "studyTogether",
                title: "함께한 시간",
                body: "인안나: " + line.trim()
              });
              state.togetherStudyLineCount += 1;
            }
          }
        }
      }
      if (tryUnlockEnding()) {
        saveState();
        return;
      }
      if (state.affection > prevAffection && !state.endingId) {
        createAffectionInteraction();
      }
    }

    function calcAffectionBySeconds(seconds) {
      const hours = Math.max(0, seconds) / 3600;
      return Math.floor((hours * 3) + (Math.sqrt(hours) * 2));
    }

    function recalcFromRecords() {
      const prevAffection = state.affection;
      state.totalSeconds = state.records.reduce((sum, r) => sum + Number(r.seconds || 0), 0);
      recalcAffectionTotal();
      logRelationshipMilestones(prevAffection, state.affection);
      if (tryUnlockEnding()) {
        saveState();
        return;
      }
      if (state.affection > prevAffection && !state.endingId) {
        createAffectionInteraction();
      }
    }

    function applyMainTabToDom() {
      const tabId = normalizeMainTabId(state.uiMainTab);
      state.uiMainTab = tabId;
      const recR = document.getElementById("studyMainTabRecord");
      const stR = document.getElementById("studyMainTabStats");
      const viR = document.getElementById("studyMainTabView");
      if (recR && stR && viR) {
        recR.checked = tabId === "record";
        stR.checked = tabId === "stats";
        viR.checked = tabId === "view";
      }
      document.querySelectorAll(".tabs > .tab-btn").forEach((b) => {
        const active = b.dataset.tab === tabId;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
        b.setAttribute("tabindex", active ? "0" : "-1");
      });
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      const rec = document.getElementById("record");
      const st = document.getElementById("panelStats");
      const vi = getPanelViewSection();
      const panel = tabId === "record" ? rec : tabId === "stats" ? st : vi;
      if (panel) panel.classList.add("active");
      if (rec) rec.setAttribute("aria-hidden", tabId === "record" ? "false" : "true");
      if (st) st.setAttribute("aria-hidden", tabId === "stats" ? "false" : "true");
      if (vi) vi.setAttribute("aria-hidden", tabId === "view" ? "false" : "true");
      syncRecordRailActiveTab(tabId);
    }

    function syncRecordRailActiveTab(tabId) {
      document.querySelectorAll(".record-rail-tab").forEach((b) => {
        const rail = b.getAttribute("data-record-rail");
        const go = b.getAttribute("data-go-tab");
        let active = false;
        if (tabId === "record") active = rail === "dashboard";
        else if (tabId === "stats") active = go === "stats";
        else if (tabId === "view") active = go === "view";
        b.classList.toggle("active", active);
      });
    }

    function activateTab(tabId) {
      state.uiMainTab = normalizeMainTabId(tabId);
      applyMainTabToDom();
    }

    function isFormFieldTarget(el) {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function updateDateCutsceneHintEl() {
      const el = $("dateCutsceneHint");
      if (!el) return;
      const scenes = (romanceNarrative && romanceNarrative.dateCutscenes) || [];
      if (!scenes.length) {
        el.textContent = "오늘 일정 분 이상 공부를 기록하면, 그날 한 번 스토리 로그에 짧은 데이트 장면이 남을 수 있어요.";
        return;
      }
      const bits = scenes.map((sc) => {
        const op = sc.op || ">=";
        const v = sc.value;
        if (sc.when === "todayMin") return "오늘 누적 기록 " + op + " 약 " + v + "분";
        return "";
      }).filter(Boolean);
      el.textContent = "짧은 데이트(배경·로그): " + (bits.join(" · ") || "assets/romance-narrative.json 에서 조건을 바꿀 수 있어요.") + " · 같은 날 한 번만.";
    }

    function dismissOnboarding() {
      state.onboardingCompleted = true;
      const el = $("onboardingOverlay");
      if (el) {
        el.hidden = true;
        el.setAttribute("aria-hidden", "true");
      }
      document.body.classList.remove("onboarding-open");
      saveState();
      render();
    }

    function syncOnboardingOverlay() {
      const el = $("onboardingOverlay");
      if (!el) return;
      const show = !state.onboardingCompleted;
      el.hidden = !show;
      el.setAttribute("aria-hidden", show ? "false" : "true");
      document.body.classList.toggle("onboarding-open", show);
      if (show) {
        const t = $("onboardingTitle");
        if (t instanceof HTMLElement) {
          requestAnimationFrame(() => {
            try {
              t.focus({ preventScroll: true });
            } catch (_) {
              t.focus();
            }
          });
        }
      }
    }

    let onboardingStepIndex = 0;

    function paintOnboardingStep() {
      const bodies = [
        "「너의 옆자리」는 기록 탭에서 타이머로 집중 시간을 쌓고, 통계 탭에서 기록·그래프를 보고, 보기 탭에서 인안나와의 대사·스토리를 이어 가요.",
        "집중은 기록 탭의 목표·타이머에서 바로 시작할 수 있어요. Alt+1 기록 · Alt+2 통계 · Alt+3 보기, Home / End로도 탭을 옮길 수 있어요.",
        "공부 시간이 쌓이면 호감도가 오르고, 가끔 짧은 대화 이벤트가 열려요. 스토리 탭에서 지금까지의 흐름을 다시 볼 수 있어요.",
        "데이터는 이 브라우저 안(localStorage)에만 저장돼요. 브라우저 데이터를 지우면 기록이 사라질 수 있어요."
      ];
      const b = $("onboardingBody");
      const ind = $("onboardingStepInd");
      const next = $("onboardingNextBtn");
      if (b) b.textContent = bodies[onboardingStepIndex] || "";
      if (ind) ind.textContent = (onboardingStepIndex + 1) + " / " + bodies.length;
      if (next) next.textContent = onboardingStepIndex >= bodies.length - 1 ? "시작하기" : "다음";
    }

    function bindOnboarding() {
      const root = $("onboardingOverlay");
      if (!root || root.dataset.bound === "1") return;
      root.dataset.bound = "1";
      onboardingStepIndex = 0;
      paintOnboardingStep();
      $("onboardingSkipBtn")?.addEventListener("click", () => dismissOnboarding());
      $("onboardingNextBtn")?.addEventListener("click", () => {
        if (onboardingStepIndex >= 3) {
          dismissOnboarding();
          return;
        }
        onboardingStepIndex += 1;
        paintOnboardingStep();
      });
    }

    function setupKeyboardShortcuts() {
      document.addEventListener("keydown", (e) => {
        const ob = $("onboardingOverlay");
        if (ob && !ob.hidden && e.key === "Escape") {
          e.preventDefault();
          dismissOnboarding();
          return;
        }
        if (!isFormFieldTarget(e.target) && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          if (e.key === "Home") {
            e.preventDefault();
            $("tabBtnRecord")?.click();
            return;
          }
          if (e.key === "End") {
            e.preventDefault();
            $("tabBtnView")?.click();
            return;
          }
        }
        if (isFormFieldTarget(e.target)) return;
        const t = e.target;
        const mainTabs = Array.from(document.querySelectorAll(".tabs > .tab-btn"));
        if (t instanceof HTMLElement && mainTabs.includes(t) && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
          e.preventDefault();
          const idx = mainTabs.indexOf(t);
          const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + mainTabs.length) % mainTabs.length;
          mainTabs[next].focus();
          mainTabs[next].click();
          return;
        }
        const subTabs = Array.from(document.querySelectorAll(".view-sub-tabs [data-view-sub]"));
        if (t instanceof HTMLElement && subTabs.includes(t) && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
          e.preventDefault();
          const idx = subTabs.indexOf(t);
          const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + subTabs.length) % subTabs.length;
          subTabs[next].focus();
          subTabs[next].click();
          return;
        }
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          if (e.code === "Digit1" || e.code === "Numpad1") {
            e.preventDefault();
            const btn = $("tabBtnRecord");
            if (btn) btn.click();
            return;
          }
          if (e.code === "Digit2" || e.code === "Numpad2") {
            e.preventDefault();
            $("tabBtnStats")?.click();
            return;
          }
          if (e.code === "Digit3" || e.code === "Numpad3") {
            e.preventDefault();
            $("tabBtnView")?.click();
            return;
          }
          if (e.code === "KeyT") {
            e.preventDefault();
            if (state.timerRunning) $("pauseBtn")?.click();
            else $("startBtn")?.click();
            return;
          }
        }
        if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyS") {
          e.preventDefault();
          $("saveSessionBtn")?.click();
        }
      });
    }

    /* ===== JS §5 Tabs, actions, keyboard ===== */
    function setupViewSubTabsDelegation() {
      if (document.documentElement.dataset.studyViewSubBound === "1") return;
      document.documentElement.dataset.studyViewSubBound = "1";
      const focusActiveSubTab = () => {
        const activeSub = document.querySelector(".view-sub-tabs .tab-btn.active");
        if (activeSub instanceof HTMLElement) {
          requestAnimationFrame(() => {
            try {
              activeSub.focus({ preventScroll: false });
            } catch (_) {
              activeSub.focus();
            }
          });
        }
      };
      document.addEventListener(
        "click",
        (event) => {
          try {
            let t = event.target;
            if (t instanceof Node && t.nodeType === Node.TEXT_NODE) t = t.parentElement;
            if (!(t instanceof Element)) return;
            const btn = t.closest("button[data-view-sub]");
            if (!(btn instanceof HTMLElement)) return;
            if (!btn.matches(".view-sub-tabs button[data-view-sub]")) return;
            const panel = document.getElementById("panelView");
            if (!panel || !panel.contains(btn)) return;
            const sub = btn.getAttribute("data-view-sub");
            if (sub !== "character" && sub !== "story") return;
            state.viewSubPanel = sub;
            syncViewSubPanels();
            saveState();
            render();
            focusActiveSubTab();
          } catch (err) {
            console.error("[viewSubTab]", err);
          }
        },
        true
      );
    }

    function setupTabs() {
      if (document.documentElement.dataset.studyMainTabSync === "1") return;
      document.documentElement.dataset.studyMainTabSync = "1";
      const recR = document.getElementById("studyMainTabRecord");
      const stR = document.getElementById("studyMainTabStats");
      const viR = document.getElementById("studyMainTabView");
      if (!recR || !stR || !viR) return;
      const onRadioChange = () => {
        state.uiMainTab = viR.checked ? "view" : stR.checked ? "stats" : "record";
        applyMainTabToDom();
        saveState();
        render();
        focusFirstInMainPanel(state.uiMainTab);
      };
      recR.addEventListener("change", onRadioChange);
      stR.addEventListener("change", onRadioChange);
      viR.addEventListener("change", onRadioChange);
    }

    function setupActions() {
      sessionRuntime.baseDocumentTitle = document.title || APP_DISPLAY_NAME;
      bindOnboarding();

      $("saveGoalQuestBtn")?.addEventListener("click", () => {
        const ghEl = $("goalHours");
        const wghEl = $("weeklyGoalHours");
        const qtEl = $("questText");
        state.goalHours = Number((ghEl && ghEl.value) || 0);
        state.weeklyGoalHours = Math.max(0, Number((wghEl && wghEl.value) || 0));
        state.quest = qtEl && qtEl.value ? qtEl.value.trim() : "";
        const tg = $("defaultSessionTagInput");
        if (tg) state.defaultSessionTag = tg.value.trim().slice(0, 24);
        rebuildDailyChecklistFromSavedQuest();
        saveState();
        render();
      });

      const storySummaryPanel = $("storySummaryPanel");
      if (storySummaryPanel && storySummaryPanel.dataset.storyToggleBound !== "1") {
        storySummaryPanel.dataset.storyToggleBound = "1";
        storySummaryPanel.addEventListener("click", (e) => {
          const btn = e.target instanceof HTMLElement ? e.target.closest("[data-story-full-toggle]") : null;
          if (!btn) return;
          state.storySummaryFullView = !state.storySummaryFullView;
          saveState();
          render();
        });
      }

      const dailyGoalChecklistWrap = $("dailyGoalChecklistWrap");
      if (dailyGoalChecklistWrap && dailyGoalChecklistWrap.dataset.checklistBound !== "1") {
        dailyGoalChecklistWrap.dataset.checklistBound = "1";
        dailyGoalChecklistWrap.addEventListener("change", (e) => {
          const t = e.target;
          if (!(t instanceof HTMLInputElement) || !t.hasAttribute("data-checklist-idx")) return;
          const idx = Number(t.getAttribute("data-checklist-idx"));
          if (!Number.isFinite(idx) || idx < 0) return;
          rolloverDailyChecklistIfNeeded();
          if (!Array.isArray(state.dailyChecklistChecked)) state.dailyChecklistChecked = [];
          while (state.dailyChecklistChecked.length <= idx) state.dailyChecklistChecked.push(false);
          state.dailyChecklistChecked[idx] = t.checked;
          saveState();
          render();
        });
      }

      const saveJournalBtn = $("saveTodayJournalBtn");
      if (saveJournalBtn) {
        saveJournalBtn.addEventListener("click", () => {
          ensureTodayJournalRollover();
          const jEl = $("todayJournalInput");
          const line = jEl && jEl.value ? jEl.value.trim() : "";
          state.todayJournalLine = line.slice(0, 140);
          state.todayJournalDate = dateKey(new Date());
          saveState();
          render();
        });
      }

      const innerMonologueToggle = $("innerMonologueToggle");
      if (innerMonologueToggle) {
        innerMonologueToggle.addEventListener("change", () => {
          state.showInnerMonologue = innerMonologueToggle.checked;
          const innerBox = $("innerMonologueBox");
          if (innerBox) {
            innerBox.hidden = !innerMonologueToggle.checked;
            innerBox.textContent = getInnerMonologueText();
            innerBox.setAttribute("aria-hidden", innerMonologueToggle.checked ? "false" : "true");
          }
          saveState();
        });
      }

      $("userNameViewEdit")?.addEventListener("input", () => {
        const el = $("userNameViewEdit");
        state.userName = el && el.value ? el.value.trim() : "";
        saveState();
        render();
      });

      const autoTogetherLineChk = $("autoTogetherLineChk");
      if (autoTogetherLineChk) {
        autoTogetherLineChk.addEventListener("change", () => {
          state.autoTogetherLineOnSave = autoTogetherLineChk.checked;
          saveState();
        });
      }

      const stageCueSoundChk = $("stageCueSoundChk");
      if (stageCueSoundChk) {
        stageCueSoundChk.addEventListener("change", () => {
          state.stageCueSound = stageCueSoundChk.checked;
          saveState();
        });
      }

      const togetherMaxIn = $("togetherLinesMaxDayInput");
      if (togetherMaxIn) {
        togetherMaxIn.addEventListener("change", () => {
          let n = Math.round(Number(togetherMaxIn.value));
          if (!Number.isFinite(n)) n = 8;
          state.togetherLinesMaxPerDay = Math.max(0, Math.min(24, n));
          togetherMaxIn.value = String(state.togetherLinesMaxPerDay);
          saveState();
        });
      }

      document.querySelectorAll(".record-rail-tab[data-go-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const tab = btn.getAttribute("data-go-tab");
          if (!tab) return;
          activateTab(tab);
          const statsHero = $("panelStats")?.querySelector(".stats-hero");
          if (tab === "stats" && statsHero) {
            statsHero.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          render();
          focusFirstInMainPanel(tab);
        });
      });
      document.querySelectorAll(".record-rail-tab[data-record-rail='dashboard']").forEach((btn) => {
        btn.addEventListener("click", () => {
          activateTab("record");
          const hero = document.querySelector(".record-hero");
          if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
          render();
        });
      });

      $("startBtn")?.addEventListener("click", () => {
        if (state.timerRunning) return;
        state.timerRunning = true;
        sessionRuntime.timerWallStartMs = Date.now();
        sessionRuntime.timerWallBaseSec = state.timerSeconds;
        state.timerId = setInterval(() => {
          if (!state.timerRunning) return;
          if (sessionRuntime.timerWallStartMs != null) {
            state.timerSeconds = sessionRuntime.timerWallBaseSec + Math.floor((Date.now() - sessionRuntime.timerWallStartMs) / 1000);
          } else {
            state.timerSeconds += 1;
          }
          renderTimerTickHud();
        }, 1000);
        render();
      });

      $("pauseBtn")?.addEventListener("click", () => {
        if (!state.timerRunning) return;
        clearInterval(state.timerId);
        state.timerRunning = false;
        sessionRuntime.timerWallStartMs = null;
        updateSessionDocumentTitle();
      });

      $("resetBtn")?.addEventListener("click", () => {
        clearInterval(state.timerId);
        state.timerRunning = false;
        state.timerSeconds = 0;
        sessionRuntime.timerWallStartMs = null;
        saveState();
        render();
      });

      $("saveSessionBtn")?.addEventListener("click", () => {
        if (state.timerRunning) {
          clearInterval(state.timerId);
          state.timerRunning = false;
          sessionRuntime.timerWallStartMs = null;
        }
        addSessionRecord(state.timerSeconds, "manual", { tag: state.defaultSessionTag || undefined });
        state.timerSeconds = 0;
        saveState();
        render();
      });

      if (!sessionRuntime.visibilityHookInstalled) {
        sessionRuntime.visibilityHookInstalled = true;
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            if (state.timerRunning && sessionRuntime.timerWallStartMs != null) {
              state.timerSeconds = sessionRuntime.timerWallBaseSec + Math.floor((Date.now() - sessionRuntime.timerWallStartMs) / 1000);
            }
            renderTimerTickHud();
          }
          updateSessionDocumentTitle();
        });
      }

      $("soundToggleBtn")?.addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        saveState();
        render();
      });

      const copyWeeklyReportBtn = $("copyWeeklyReportBtn");
      if (copyWeeklyReportBtn) {
        copyWeeklyReportBtn.addEventListener("click", async () => {
          const t = buildWeekReportPlainText(new Date());
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(t);
            } else {
              throw new Error("clipboard unavailable");
            }
          } catch (_) {
            window.prompt("아래 텍스트를 복사해 주세요:", t);
            return;
          }
          const prev = copyWeeklyReportBtn.textContent;
          copyWeeklyReportBtn.textContent = "복사됨";
          setTimeout(() => {
            copyWeeklyReportBtn.textContent = prev || "주간 리포트 복사";
          }, 1400);
        });
      }

      const memorySaveBtn = $("memorySaveBtn");
      if (memorySaveBtn) {
        memorySaveBtn.addEventListener("click", () => {
          const inp = $("memoryDiaryInput");
          const line = inp && inp.value ? inp.value.trim().slice(0, 200) : "";
          if (!line) {
            window.alert("한 줄을 입력해 주세요.");
            return;
          }
          if (!Array.isArray(state.memoryMoments)) state.memoryMoments = [];
          state.memoryMoments.push({ date: dateKey(new Date()), line: line });
          state.memoryMoments = state.memoryMoments.map(sanitizeMemoryMoment).filter(Boolean).slice(-50);
          if (inp) inp.value = "";
          saveState();
          render();
        });
      }

      const insightWrap = $("insightBannerWrap");
      if (insightWrap) {
        insightWrap.addEventListener("click", (e) => {
          const b = e.target instanceof HTMLElement ? e.target.closest("[data-banner-dismiss]") : null;
          if (!b) return;
          const k = b.getAttribute("data-banner-dismiss");
          const day = dateKey(new Date());
          if (k === "goal") state.bannerDismissedGoal = day;
          if (k === "streak") state.bannerDismissedStreak = day;
          if (k === "weekly") state.bannerDismissedWeekly = mondayKeyOfWeekContaining(new Date());
          saveState();
          updateInsightBanners(day);
        });
      }

      const saveUserReactBtn = $("saveUserStoryReactionBtn");
      if (saveUserReactBtn) {
        saveUserReactBtn.addEventListener("click", () => {
          const inp = $("userStoryReactionInput");
          const line = inp && inp.value ? inp.value.trim().slice(0, 120) : "";
          if (!line) {
            window.alert("한 줄을 입력해 주세요.");
            return;
          }
          const d = getDialogueByAffection();
          appendStoryLog({
            type: "userReaction",
            title: "나의 한 줄 · " + d.stage,
            body: line
          });
          if (inp) inp.value = "";
          saveState();
          render();
        });
      }

      const resetStoryAffBtn = $("resetStoryAffectionBtn");
      if (resetStoryAffBtn) {
        resetStoryAffBtn.addEventListener("click", () => resetStoryAndAffection());
      }

      const storyContactPickWrap = $("storyContactPickWrap");
      if (storyContactPickWrap) {
        storyContactPickWrap.addEventListener("click", (e) => {
          const btn = e.target instanceof HTMLElement ? e.target.closest("[data-contact-pick]") : null;
          if (!btn) return;
          const v = btn.getAttribute("data-contact-pick");
          if (v !== "face" && v !== "text" && v !== "walk") return;
          if (state.storyContactChannel) return;
          state.storyContactChannel = v;
          const labels = { face: "학교에서 얼굴 보며", text: "메시지로", walk: "함께 걸으며" };
          const dn = getDisplayName();
          const vo = getVocative(dn);
          appendStoryLog({
            type: "branch",
            title: "짧은 분기 · 연락 방식",
            body: "「" + (labels[v] || v) + "」쪽이 편하다고 골랐네. 인안나는 속으로 " + dn + vo + " 다정한 톤 그대로 연락 오겠지 하고 메모만 남겨 둘게—부담 없는 분기지만, 이후 장면을 그릴 때 색이 조금 달라져."
          });
          saveState();
          render();
        });
      }

      $("replyChoices")?.addEventListener("click", (event) => {
        const t = event.target;
        const btn = t instanceof HTMLElement ? t.closest("[data-reply-index]") : null;
        if (!btn || !state.activeInteraction) return;
        const replyIndexText = btn.getAttribute("data-reply-index");
        if (replyIndexText === null) return;
        const idx = Number(replyIndexText);
        const selected = state.activeInteraction.choices[idx];
        if (!selected) return;
        const displayName = getDisplayName();
        const voc = getVocative(displayName);
        const npcQuestion = state.activeInteraction.npc;
        const prevAff = state.affection;
        const damp = dampConversationBonusNearEnd(selected.delta, selected.routePts || 3);
        state.replyAffectionBonus += damp.delta;
        const selectedForRoute = Object.assign({}, selected, { routePts: damp.routePts });
        applyRoutePoints(selectedForRoute);
        recalcAffectionTotal();
        logRelationshipMilestones(prevAff, state.affection);
        const sign = damp.delta > 0 ? "+" : "";
        const routeLabel = selected.route === "marriage" ? "청혼" : selected.route === "yandere" ? "얀데레" : "유학";
        const rp = damp.routePts;
        state.lastReplyText = displayName + voc + ": " + selected.text
          + "  |  호감도 " + sign + damp.delta + " · " + routeLabel + " 루트 +" + rp;
        appendStoryLog({
          type: "choice",
          title: "대화 기록 · 선택지",
          body: "인안나: " + npcQuestion + "\n\n" + displayName + voc + ": " + selected.text
            + "\n\n인안나: " + selected.reaction
            + "\n\n（호감도 " + sign + damp.delta + " · " + routeLabel + " 루트 +" + rp + "）"
        });
        maybeAppendRouteHintLog();
        if (tryUnlockEnding()) {
          saveState();
          render();
          return;
        }
        state.activeInteraction = {
          npc: selected.reaction,
          choices: []
        };
        saveState();
        render();
      });

      const historyFilterBar = $("historyFilterBar");
      if (historyFilterBar && historyFilterBar.dataset.filterBound !== "1") {
        historyFilterBar.dataset.filterBound = "1";
        historyFilterBar.addEventListener("input", () => {
          render();
        });
        historyFilterBar.addEventListener("change", () => {
          render();
        });
      }

      const recordUndoSnackbarBtn = $("recordUndoSnackbarBtn");
      if (recordUndoSnackbarBtn && recordUndoSnackbarBtn.dataset.bound !== "1") {
        recordUndoSnackbarBtn.dataset.bound = "1";
        recordUndoSnackbarBtn.addEventListener("click", () => {
          const u = sessionRuntime.undoDelete;
          if (!u || !u.record) return;
          const idx = Math.min(Math.max(0, u.index), state.records.length);
          state.records.splice(idx, 0, u.record);
          clearUndoDelete();
          recalcFromRecords();
          saveState();
          render();
        });
      }

      $("historyList")?.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.getAttribute("data-action");
        const indexText = target.getAttribute("data-edit-index");
        if (indexText === null) return;

        const recordIndex = Number(indexText);
        const record = state.records[recordIndex];
        if (!record) return;

        if (action === "edit") {
          state.editingRecordIndex = recordIndex;
          render();
          return;
        }

        if (action === "cancel") {
          state.editingRecordIndex = -1;
          render();
          return;
        }

        if (action === "delete" || action === "quick-delete") {
          removeRecordAtIndex(recordIndex);
          return;
        }

        if (action !== "save") return;

        const histRoot = $("historyList");
        if (!histRoot) return;
        const dateInputEl = histRoot.querySelector("input[data-field='date'][data-edit-index='" + recordIndex + "']");
        const minutesInputEl = histRoot.querySelector("input[data-field='minutes'][data-edit-index='" + recordIndex + "']");
        const tagInputEl = histRoot.querySelector("input[data-field='tag'][data-edit-index='" + recordIndex + "']");
        if (!(dateInputEl instanceof HTMLInputElement) || !(minutesInputEl instanceof HTMLInputElement)) return;

        const trimmedDate = dateInputEl.value.trim();
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(trimmedDate)) {
          window.alert("날짜 형식은 YYYY-MM-DD로 입력해 주세요.");
          return;
        }
        const parsed = new Date(trimmedDate + "T00:00:00");
        if (Number.isNaN(parsed.getTime()) || dateKey(parsed) !== trimmedDate) {
          window.alert("유효한 날짜를 입력해 주세요.");
          return;
        }

        const newMinutes = Number(minutesInputEl.value);
        if (!Number.isFinite(newMinutes) || newMinutes <= 0) {
          window.alert("1분 이상 숫자로 입력해 주세요.");
          return;
        }

        record.date = trimmedDate;
        record.seconds = Math.round(newMinutes * 60);
        if (tagInputEl instanceof HTMLInputElement) {
          const tg = tagInputEl.value.trim().slice(0, 24);
          if (tg) record.tag = tg;
          else delete record.tag;
        }
        state.editingRecordIndex = -1;
        recalcFromRecords();
        saveState();
        render();
      });
    }

    function showFatalBootError(err) {
      console.error("[boot]", err);
      const msg = err && err.message ? String(err.message) : String(err);
      try {
        const div = document.createElement("div");
        div.setAttribute("role", "alert");
        div.style.cssText =
          "position:fixed;inset:8px;z-index:99999;background:#2d1f28;color:#f5eef2;padding:16px 18px;border-radius:12px;font:14px/1.5 system-ui,Segoe UI,sans-serif;overflow:auto;box-shadow:0 12px 48px rgba(0,0,0,.5);max-height:calc(100vh - 16px);";
        div.innerHTML =
          "<strong>앱 시작 중 오류</strong>" +
          "<p style='margin:10px 0 0;white-space:pre-wrap;'>" + escapeHtml(msg) + "</p>" +
          "<p style='margin:12px 0 0;font-size:12px;opacity:.88;'>개발자 도구(F12) → Console에서 스택을 확인해 주세요. 서비스 워커·캐시 때문에 예전 스크립트가 남았을 수 있으면 Ctrl+Shift+R(강력 새로고침) 또는 이 사이트의 저장된 데이터 삭제 후 다시 열어 보세요.</p>";
        (document.body || document.documentElement).appendChild(div);
      } catch (_) {}
    }

    try {
    loadState();
    clearUndoDelete();
    recalcAffectionTotal();
    if (tryUnlockEnding()) saveState();
    applyA11yPresetToDocument();
    setupTabs();
    setupViewSubTabsDelegation();
    setupActions();
    setupKeyboardShortcuts();
    bindPortraitImageFallback($("characterImage"));
    bindPortraitImageFallback($("characterImageThumb"));
    if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
    }
    render();
    loadRomanceNarrativeRemote().then(() => render()).catch(() => {});
    } catch (err) {
      showFatalBootError(err);
    }