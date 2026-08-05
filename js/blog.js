(function () {
  "use strict";

  var BASE = window.SITE_BASE || "";
  var INDEX_URL = BASE + "blog/posts.json";

  function el(id) {
    return document.getElementById(id);
  }

  function loadPosts() {
    return fetch(INDEX_URL).then(function (r) {
      if (!r.ok) throw new Error("无法加载 " + INDEX_URL);
      return r.json();
    });
  }

  function postLink(file) {
    return BASE + "blog/post.html?file=" + encodeURIComponent(file);
  }

  function renderTags(tags) {
    return (tags || [])
      .map(function (t) {
        return '<span class="tag">' + t + "</span>";
      })
      .join("");
  }

  function metaText(p) {
    var s = p.date;
    if (p.readingTime) s += " · " + p.readingTime + " 分钟阅读";
    return s;
  }

  function renderPostList(containerId, limit) {
    var c = el(containerId);
    if (!c) return;
    loadPosts()
      .then(function (data) {
        var posts = (data.posts || []).slice().sort(function (a, b) {
          return a.date < b.date ? 1 : -1;
        });
        if (limit) posts = posts.slice(0, limit);
        var html = "";
        posts.forEach(function (p) {
          html +=
            "<li>" +
            '<a href="' + postLink(p.file) + '">' + p.title + "</a>" +
            '<div class="tags">' + renderTags(p.tags) + "</div>" +
            '<p class="post-meta">' + metaText(p) + "</p>" +
            "</li>";
        });
        c.innerHTML = html || '<li class="post-meta">还没有文章，敬请期待。</li>';
      })
      .catch(function () {
        c.innerHTML = '<li class="post-meta">文章列表加载失败。</li>';
      });
  }

  function renderPost() {
    var params = new URLSearchParams(window.location.search);
    var file = params.get("file");
    if (!file) {
      window.location.href = BASE + "blog/index.html";
      return;
    }
    loadPosts()
      .then(function (data) {
        var post = (data.posts || []).filter(function (p) {
          return p.file === file;
        })[0];
        if (!post) {
          el("post-title").textContent = "文章不存在";
          el("post-meta").textContent = "你访问的文章可能已被移除。";
          return;
        }
        document.title = post.title + " · wv-ce";
        el("post-title").textContent = post.title;
        el("post-meta").textContent = metaText(post);
        el("post-tags").innerHTML = renderTags(post.tags);
        var desc = document.querySelector('meta[name="description"]');
        if (desc && post.description) desc.setAttribute("content", post.description);

        fetch(BASE + "blog/posts/" + post.file)
          .then(function (r) {
            if (!r.ok) throw new Error();
            return r.text();
          })
          .then(function (md) {
            el("post-body").innerHTML = window.mdToHtml(md);
          })
          .catch(function () {
            el("post-body").innerHTML = "<p>加载文章失败，请稍后再试。</p>";
          });
      })
      .catch(function () {
        el("post-title").textContent = "加载失败";
        el("post-meta").textContent = "无法读取文章列表。";
      });
  }

  if (el("post-list")) renderPostList("post-list");
  if (el("recent-posts")) renderPostList("recent-posts", 5);
  if (el("post-body")) renderPost();
})();
