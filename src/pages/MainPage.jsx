import { useEffect, useMemo, useState } from "react";

const portfolioItems = [];

const defaultPost = {
  title: "아직 작성된 게시글이 없습니다",
  date: "",
  category: "",
  tags: [],
  summary: "마크다운 파일을 추가하면 이 영역에 글 본문이 표시됩니다.",
  content: "",
};

function parseFrontMatter(markdown) {
  if (!markdown.startsWith("---")) {
    return { meta: {}, body: markdown };
  }

  const end = markdown.indexOf("\n---", 3);
  if (end === -1) {
    return { meta: {}, body: markdown };
  }

  const rawMeta = markdown.slice(3, end).trim();
  const body = markdown.slice(end + 4).trim();
  const meta = rawMeta.split("\n").reduce((acc, line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return acc;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      acc[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      acc[key] = value.replace(/^["']|["']$/g, "");
    }
    return acc;
  }, {});

  return { meta, body };
}

function inlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let listItems = [];
  let codeBlock = [];
  let isCode = false;

  const flushList = () => {
    if (listItems.length) {
      html.push(`<ul>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      listItems = [];
    }
  };

  const flushCode = () => {
    if (codeBlock.length) {
      const escaped = codeBlock
        .join("\n")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html.push(`<pre><code>${escaped}</code></pre>`);
      codeBlock = [];
    }
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (isCode) {
        flushCode();
        isCode = false;
      } else {
        flushList();
        isCode = true;
      }
      return;
    }

    if (isCode) {
      codeBlock.push(line);
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }

    flushList();

    if (line.startsWith("### ")) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.trim() === "") {
      html.push("");
    } else {
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  });

  flushList();
  flushCode();

  return html.join("");
}

function MainPage() {
  const [posts, setPosts] = useState([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [activeView, setActiveView] = useState("blog");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const baseUrl = process.env.PUBLIC_URL || "";
        const indexResponse = await fetch(`${baseUrl}/posts/index.json`);
        const postFiles = await indexResponse.json();
        const loadedPosts = await Promise.all(
          postFiles.map(async (post) => {
            const response = await fetch(`${baseUrl}/posts/${post.file}`);
            const markdown = await response.text();
            const { meta, body } = parseFrontMatter(markdown);
            return {
              ...defaultPost,
              ...meta,
              slug: post.slug,
              file: post.file,
              content: body,
            };
          })
        );

        setPosts(loadedPosts);
        setActiveSlug(loadedPosts[0]?.slug || "");
      } catch (error) {
        console.error("게시글을 불러오지 못했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = posts.map((post) => post.category).filter(Boolean);
    return ["전체", ...new Set(uniqueCategories)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === "전체" || post.category === selectedCategory;
      const searchableText = `${post.title} ${post.summary} ${post.tags.join(" ")}`.toLowerCase();
      return matchesCategory && searchableText.includes(normalizedQuery);
    });
  }, [posts, query, selectedCategory]);

  const activePost = posts.find((post) => post.slug === activeSlug) || filteredPosts[0] || defaultPost;
  const activeHtml = useMemo(() => markdownToHtml(activePost.content || ""), [activePost.content]);

  useEffect(() => {
    if (!filteredPosts.some((post) => post.slug === activeSlug)) {
      setActiveSlug(filteredPosts[0]?.slug || "");
    }
  }, [activeSlug, filteredPosts]);

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="홈으로 이동">
          <span className="brand-mark">0S</span>
          <span>
            <strong>0ssam.log</strong>
            <small>Embedded Developer Portfolio</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="주요 메뉴">
          <button className={activeView === "blog" ? "is-active" : ""} onClick={() => setActiveView("blog")}>
            Study Log
          </button>
          <button
            className={activeView === "portfolio" ? "is-active" : ""}
            onClick={() => setActiveView("portfolio")}
          >
            Portfolio
          </button>
          <button className={activeView === "about" ? "is-active" : ""} onClick={() => setActiveView("about")}>
            About
          </button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Firmware, MCU, Linux, Debugging</p>
          <h1>임베디드 개발자로 성장하는 과정을 기록합니다.</h1>
          <p>
            공부한 개념, 실습 기록, 프로젝트 회고를 마크다운 글로 정리하고 포트폴리오로 연결하는 개인 기술
            블로그입니다.
          </p>
          <div className="hero-actions">
            <button onClick={() => setActiveView("blog")}>글 읽기</button>
            <button className="secondary" onClick={() => setActiveView("portfolio")}>
              포트폴리오 보기
            </button>
          </div>
        </div>
        <div className="signal-panel" aria-label="임베디드 학습 요약">
          <div className="signal-header">
            <span>board-status</span>
            <strong>READY</strong>
          </div>
          <div className="signal-grid">
            <span>MCU</span>
            <strong>STM32</strong>
            <span>RTOS</span>
            <strong>FreeRTOS</strong>
            <span>Debug</span>
            <strong>UART/JTAG</strong>
            <span>Linux</span>
            <strong>Driver</strong>
          </div>
        </div>
      </section>

      {activeView === "blog" && (
        <section className="content-layout" aria-label="블로그 글 목록과 본문">
          <aside className="post-sidebar">
            <div className="section-heading">
              <p>Posts</p>
              <h2>학습 노트</h2>
            </div>
            <label className="search-box">
              <span>검색</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="RTOS, UART, C..." />
            </label>
            <div className="category-tabs" aria-label="카테고리 필터">
              {categories.map((category) => (
                <button
                  key={category}
                  className={selectedCategory === category ? "is-active" : ""}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="post-list">
              {isLoading && <p className="empty-message">게시글을 불러오는 중입니다.</p>}
              {!isLoading && posts.length === 0 && <p className="empty-message">아직 등록된 글이 없습니다.</p>}
              {!isLoading && posts.length > 0 && filteredPosts.length === 0 && (
                <p className="empty-message">조건에 맞는 글이 없습니다.</p>
              )}
              {filteredPosts.map((post) => (
                <button
                  key={post.slug}
                  className={`post-card ${activePost.slug === post.slug ? "is-active" : ""}`}
                  onClick={() => setActiveSlug(post.slug)}
                >
                  <span>{post.category}</span>
                  <strong>{post.title}</strong>
                  <small>{post.date}</small>
                  <p>{post.summary}</p>
                </button>
              ))}
            </div>
          </aside>

          <article className="post-viewer">
            <div className="post-meta">
              <span>{activePost.category}</span>
              <span>{activePost.date}</span>
            </div>
            <h2>{activePost.title}</h2>
            <p className="post-summary">{activePost.summary}</p>
            <div className="tag-row">
              {activePost.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: activeHtml }} />
          </article>
        </section>
      )}

      {activeView === "portfolio" && (
        <section className="portfolio-section" aria-label="포트폴리오">
          <div className="section-heading">
            <p>Portfolio</p>
            <h2>프로젝트와 실습 기록</h2>
          </div>
          {portfolioItems.length === 0 ? (
            <div className="empty-panel">
              <h3>아직 등록된 포트폴리오가 없습니다</h3>
              <p>프로젝트를 정리한 뒤 `portfolioItems` 배열에 직접 추가하면 카드 형태로 표시됩니다.</p>
            </div>
          ) : (
            <div className="portfolio-grid">
              {portfolioItems.map((item) => (
                <article className="portfolio-card" key={item.title}>
                  <div className="portfolio-card-header">
                    <span>{item.period}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <p>{item.summary}</p>
                  <div className="tag-row">
                    {item.stack.map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeView === "about" && (
        <section className="about-section" aria-label="소개">
          <div className="section-heading">
            <p>About</p>
            <h2>임베디드 개발자를 준비하는 기록</h2>
          </div>
          <div className="about-grid">
            <div>
              <h3>관심 분야</h3>
              <p>
                MCU 펌웨어, RTOS, Linux Device Driver, 통신 프로토콜, 디버깅 도구를 중심으로 기본기를 쌓고
                있습니다.
              </p>
            </div>
            <div>
              <h3>블로그 운영 방식</h3>
              <p>
                새 글은 `public/posts` 폴더에 마크다운 파일로 추가하고 `index.json`에 파일명과 slug를 등록하면
                목록에 표시됩니다.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default MainPage;
