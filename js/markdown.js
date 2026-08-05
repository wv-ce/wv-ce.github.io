(function () {
  "use strict";

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(s) {
    return s
      .replace(
        /!\[([^\]]*)\]\(([^)\s]+)\)/g,
        '<img src="$2" alt="$1" loading="lazy" />'
      )
      .replace(
        /\[([^\]]+)\]\(([^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      )
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  }

  function tableToHtml(rows) {
    var cells = function (row) {
      return row
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map(function (s) {
          return s.trim();
        });
    };
    var header = cells(rows[0]);
    var html = "<table><thead><tr>";
    header.forEach(function (h) {
      html += "<th>" + inline(h) + "</th>";
    });
    html += "</tr></thead><tbody>";
    for (var r = 1; r < rows.length; r++) {
      var row = cells(rows[r]);
      if (row.every(function (c) { return /^:?-{2,}:?$/.test(c); })) continue;
      html += "<tr>";
      row.forEach(function (c) {
        html += "<td>" + inline(c) + "</td>";
      });
      html += "</tr>";
    }
    html += "</tbody></table>";
    return html;
  }

  function mdToHtml(src) {
    src = escapeHtml((src || "").replace(/\r\n/g, "\n"));

    var fences = [];
    src = src.replace(
      /```([^\n]*)\n([\s\S]*?)(?:```|$)/g,
      function (m, lang, code) {
        fences.push(code.replace(/\n$/, ""));
        return "\u0000FENCE\u0000" + (fences.length - 1) + "\u0000";
      }
    );

    var lines = src.split("\n");
    var out = [];
    var list = null;

    function closeList() {
      if (list) {
        out.push("</" + list + ">");
        list = null;
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      var fenceMatch = line.match(/^\u0000FENCE\u0000(\d+)\u0000$/);
      if (fenceMatch) {
        closeList();
        out.push("<pre><code>" + fences[+fenceMatch[1]] + "</code></pre>");
        continue;
      }

      if (/^\s*$/.test(line)) {
        closeList();
        continue;
      }

      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        closeList();
        var level = h[1].length;
        out.push("<h" + level + ">" + inline(h[2]) + "</h" + level + ">");
        continue;
      }

      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
        closeList();
        out.push("<hr />");
        continue;
      }

      if (line.indexOf("|") !== -1 && line.split("|").length > 2) {
        closeList();
        var rows = [line];
        while (
          i + 1 < lines.length &&
          lines[i + 1].indexOf("|") !== -1 &&
          lines[i + 1].trim() !== ""
        ) {
          i++;
          rows.push(lines[i]);
        }
        out.push(tableToHtml(rows));
        continue;
      }

      var ul = line.match(/^\s*[-*+]\s+(.*)$/);
      if (ul) {
        if (list !== "ul") {
          closeList();
          out.push("<ul>");
          list = "ul";
        }
        out.push("<li>" + inline(ul[1]) + "</li>");
        continue;
      }

      var ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ol) {
        if (list !== "ol") {
          closeList();
          out.push("<ol>");
          list = "ol";
        }
        out.push("<li>" + inline(ol[1]) + "</li>");
        continue;
      }

      if (/^\s*>/.test(line)) {
        closeList();
        var quoteLines = [line.replace(/^\s*>\s?/, "")];
        while (i + 1 < lines.length && /^\s*>/.test(lines[i + 1])) {
          i++;
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        }
        out.push("<blockquote>" + inline(quoteLines.join("\n")) + "</blockquote>");
        continue;
      }

      closeList();
      var paraLines = [line];
      while (i + 1 < lines.length) {
        var n = lines[i + 1];
        if (n.trim() === "") break;
        if (/^(#{1,6}\s)/.test(n)) break;
        if (/^\s*[-*+]\s/.test(n)) break;
        if (/^\s*\d+\.\s/.test(n)) break;
        if (/^\s*>/.test(n)) break;
        if (n.indexOf("\u0000FENCE") !== -1) break;
        if (n.indexOf("|") !== -1 && n.split("|").length > 2) break;
        i++;
        paraLines.push(n);
      }
      out.push("<p>" + inline(paraLines.join("\n")) + "</p>");
    }
    closeList();
    return out.join("\n");
  }

  window.mdToHtml = mdToHtml;
})();
