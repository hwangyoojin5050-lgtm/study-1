# 너의 옆자리

공부 기록·타이머·통계와 인안나 스토리를 브라우저에서 쓰는 정적 웹 앱입니다.

## GitHub Pages 자동 배포

`main`(또는 `master`) 브랜치에 **push**하면 [`.github/workflows/github-pages.yml`](.github/workflows/github-pages.yml)이 실행되어 GitHub Pages에 올라갑니다.

### 최초 1회 (저장소 설정)

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → **Source**: **GitHub Actions** 선택
3. 이후 `git push origin main` 할 때마다 자동 배포

### 배포 URL

프로젝트 저장소 이름이 `study-1`이면 보통 아래 주소입니다.

**https://hwangyoojin5050-lgtm.github.io/study-1/**

(Actions 탭에서 최신 **Deploy to GitHub Pages** 워크플로가 초록색이면 배포 완료)

### 로컬에서 미리보기

```bash
npx --yes serve .
```

브라우저에서 `http://localhost:3000` 으로 엽니다.

### 테스트

```bash
node tests/state-snapshot.mjs
node tests/regression.mjs
```
