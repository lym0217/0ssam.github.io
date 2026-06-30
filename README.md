# 0ssam.log

임베디드 개발자를 준비하는 학습 기록 및 포트폴리오 블로그입니다. React 기반 정적 사이트로 구성되어 GitHub Pages에 배포할 수 있습니다.

## 실행

```bash
npm start
```

## 빌드

```bash
npm run build
```

## 배포

```bash
npm run deploy
```

## 마크다운 게시글 추가

1. `public/posts` 폴더에 `my-post.md` 같은 마크다운 파일을 추가합니다.
2. 파일 상단에 아래 형식의 front matter를 작성합니다.
3. `public/posts/index.json`에 `slug`와 `file`을 등록합니다.

```md
---
title: 글 제목
date: 2026-06-30
category: Firmware
tags: [STM32, UART, Debugging]
summary: 글 목록과 본문 상단에 표시될 요약입니다.
---

## 본문 제목

마크다운으로 내용을 작성합니다.
```

```json
{
  "slug": "my-post",
  "file": "my-post.md"
}
```

현재 지원하는 기본 문법은 제목, 문단, 목록, 링크, 인라인 코드, 코드 블록입니다.

## Notion 글을 게시글로 옮기는 방법

### 가장 간단한 방법

1. Notion에서 옮기고 싶은 페이지를 엽니다.
2. 오른쪽 위 `...` 메뉴에서 `Export`를 선택합니다.
3. 포맷을 `Markdown & CSV`로 선택하고 내보냅니다.
4. 압축 파일 안의 `.md` 파일을 `public/posts` 폴더로 옮깁니다.
5. 파일 맨 위에 front matter를 추가합니다.
6. `public/posts/index.json`에 파일을 등록합니다.

Notion에서 이미지가 포함된 글을 내보내면 이미지 폴더가 함께 생길 수 있습니다. 이 경우 이미지는 `public/posts/assets` 같은 폴더로 옮기고, 마크다운의 이미지 경로를 그 위치에 맞게 수정하는 방식이 좋습니다.

### 추천 정리 방식

Notion 원문을 그대로 쓰기보다 블로그용으로 아래 항목만 한 번 정리하면 글 목록에서 훨씬 보기 좋습니다.

```md
---
title: Notion 페이지 제목
date: 2026-06-30
category: Firmware
tags: [STM32, Debugging]
summary: 글 목록에 표시할 한 줄 요약입니다.
---
```

### 자동 변환을 만들고 싶다면

나중에 글이 많아지면 `notion-export` 폴더에 Notion에서 내보낸 파일을 넣고, 스크립트가 front matter와 `index.json`을 자동 생성하도록 만들 수 있습니다. 이 방식은 파일명이 많아졌을 때 실수를 줄이는 데 좋습니다.
