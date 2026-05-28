# 너의 옆자리

공부 기록·타이머·통계와 인안나 스토리를 브라우저에서 쓰는 정적 웹 앱입니다.

## GitHub Pages 배포 (필수 설정)

`main`에 push하면 배포 워크플로가 돌아갑니다. **코드만 올려서는 사이트가 안 뜨고, 저장소에서 Pages를 한 번 켜야 합니다.**

### 방법 A — GitHub Actions (권장)

1. GitHub 저장소 **study-1** → **Settings** → **Pages**
2. **Build and deployment** → **Source**: **GitHub Actions** 선택 후 저장
3. **Actions** 탭 → **Deploy to GitHub Pages** 워크플로가 **초록색(성공)** 인지 확인  
   - 처음이면 `github-pages` 환경 승인(Approve) 요청이 뜰 수 있음
4. **Settings → Pages**에 표시된 URL로 접속 (보통 아래 주소)

**https://hwangyoojin5050-lgtm.github.io/study-1/**

끝에 **`/`** 가 있는 주소로 여세요.

### 방법 B — gh-pages 브랜치 (A가 안 될 때)

1. push 후 **Actions** → **Deploy to gh-pages branch** 성공 확인
2. **Settings** → **Pages** → **Source**: **Deploy from a branch**
3. Branch: **gh-pages**, Folder: **/ (root)** → 저장
4. 1~2분 후 같은 URL로 접속

### 404가 뜰 때

| 증상 | 원인 | 해결 |
|------|------|------|
| GitHub 기본 404 페이지 | Pages 미설정 (`has_pages: false`) | 위 **방법 A 또는 B** 로 Pages 켜기 |
| 「앱을 시작하지 못했어요」 박스 | JS 경로·캐시 문제 | URL 끝에 `/` 확인 → **캐시 지우고 다시** |
| 일부만 404 | 예전 캐시 | Ctrl+Shift+R 강력 새로고침 |

배포 여부 확인: 브라우저에서  
`https://hwangyoojin5050-lgtm.github.io/study-1/index.html`  
이 **200** 이어야 합니다. **404** 이면 아직 Pages가 안 켜진 상태입니다.

### 로컬에서 미리보기

```bash
npx --yes serve .
```

`http://localhost:3000/` (끝에 `/` 포함)

### 테스트

```bash
node tests/state-snapshot.mjs
node tests/regression.mjs
```
