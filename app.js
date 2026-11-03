const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const starterFiles = {
  "index.html": {
    language: "html",
    code: [
      "<!doctype html>",
      "<html lang=\"en\">",
      "<head>",
      "  <meta charset=\"UTF-8\">",
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
      "  <title>Little Things Studio</title>",
      "  <link rel=\"stylesheet\" href=\"style.css\">",
      "</head>",
      "<body>",
      "  <main class=\"card\">",
      "    <span class=\"spark\">✦ A SMALL IDEA, MADE REAL</span>",
      "    <h1>Stay curious.<br><em>Make something.</em></h1>",
      "    <p>Good things start with one little experiment. What will you try today?</p>",
      "    <button id=\"helloButton\">Start creating <span>↗</span></button>",
      "    <div class=\"status\" id=\"status\">A fresh canvas is waiting.</div>",
      "  </main>",
      "  <script src=\"script.js\"></script>",
      "</body>",
      "</html>"
    ].join("\n")
  },
  "style.css": {
    language: "css",
    code: [
      ":root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; }",
      "* { box-sizing: border-box; }",
      "body { min-height: 100vh; display: grid; place-items: center; margin: 0; padding: 28px; color: #f6f3ff; background: radial-gradient(ellipse at 16% 15%, #8e76e85c, transparent 38%), radial-gradient(ellipse at 90% 88%, #45d2bc39, transparent 34%), #13131e; }",
      ".card { width: min(100%, 490px); position: relative; overflow: hidden; padding: 48px; border: 1px solid #ffffff26; border-radius: 22px; background: linear-gradient(145deg, #ffffff15, #ffffff06); box-shadow: 0 28px 90px #08071288; backdrop-filter: blur(18px); }",
      ".card::after { content: \"✳\"; position: absolute; top: 16px; right: 23px; color: #e6d785; font-size: 34px; opacity: .8; }",
      ".spark { color: #9cf2d8; font: 10px ui-monospace, monospace; letter-spacing: .12em; }",
      "h1 { margin: 20px 0 12px; font-size: clamp(38px, 8vw, 58px); line-height: .98; letter-spacing: -.07em; }",
      "h1 em { color: #ae9aff; font-style: normal; }",
      "p { max-width: 330px; color: #b6b3c9; font-size: 14px; line-height: 1.8; }",
      "button { margin-top: 12px; padding: 13px 16px; border: 0; border-radius: 9px; background: #9af7df; color: #15201e; font-weight: 700; cursor: pointer; }",
      "button span { padding-left: 15px; }",
      ".status { margin-top: 24px; color: #89879d; font-size: 11px; }",
      "@media (max-width: 480px) { .card { padding: 32px 25px; } }"
    ].join("\n")
  },
  "script.js": {
    language: "javascript",
    code: [
      "const button = document.querySelector('#helloButton');",
      "const status = document.querySelector('#status');",
      "",
      "button.addEventListener('click', () => {",
      "  status.textContent = 'Nice. Your next idea is already taking shape ✨';",
      "  console.log('A new idea is in motion.');",
      "});"
    ].join("\n")
  }
};

const extensions = {
  html: "html", htm: "html", css: "css", js: "javascript", mjs: "javascript", cjs: "javascript",
  jsx: "javascript", py: "python", java: "java", php: "php", c: "c", h: "c", cpp: "cpp", cc: "cpp", hpp: "cpp", sql: "sql", json: "json", md: "markdown"
};
const languageNames = { html: "HTML", css: "CSS", javascript: "JavaScript", python: "Python", java: "Java", php: "PHP", c: "C", cpp: "C++", sql: "SQL", json: "JSON", markdown: "Markdown", plaintext: "Plain text" };
const icons = { html: "fa-brands fa-html5", css: "fa-brands fa-css3-alt", javascript: "fa-brands fa-square-js", python: "fa-brands fa-python", java: "fa-brands fa-java", php: "fa-brands fa-php", c: "fa-solid fa-c", cpp: "fa-solid fa-code", sql: "fa-solid fa-database", json: "fa-solid fa-brackets-curly", markdown: "fa-brands fa-markdown" };

const state = {
  files: JSON.parse(JSON.stringify(starterFiles)),
  current: "index.html",
  editor: null,
  fallback: null,
  projectName: "little-things-studio",
  saveTimer: null,
  previewTimer: null,
  toastTimer: null,
  history: [],
  github: { repos: [], files: [] },
  commandIndex: 0,
  libraryMode: "examples",
  palette: [],
  aiConfigured: null
};

function activeFile() { return state.files[state.current]; }
function languageFor(filename) { return extensions[(filename.split(".").pop() || "").toLowerCase()] || "plaintext"; }
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function activateView(id) {
  if (!$("#" + id)) return;
  $$(".view").forEach(view => view.classList.toggle("active", view.id === id));
  $$(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === id));
  $("#primaryNav")?.classList.remove("open");
  if (id === "workspace") setTimeout(() => state.editor?.layout(), 80);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function switchInspector(id) {
  $$(".inspector-panel").forEach(panel => panel.classList.toggle("active", panel.id === id));
  $$(".inspector-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.panel === id));
}
function setSaveStatus(label, icon) {
  const el = $("#saveIndicator");
  el.innerHTML = '<i class="' + (icon || "fa-solid fa-cloud-arrow-up") + '"></i><span>' + label + "</span>";
}
function saveCurrent() {
  if (!state.files[state.current]) return;
  state.files[state.current].code = state.editor ? state.editor.getValue() : (state.fallback?.value || state.files[state.current].code);
}
function saveProject(showToast = false) {
  saveCurrent();
  try {
    localStorage.setItem("codeforge_next_project", JSON.stringify({ files: state.files, current: state.current, projectName: state.projectName }));
    setSaveStatus("Saved locally", "fa-solid fa-cloud-arrow-up");
    if (showToast) toast("Project saved in this browser");
  } catch (error) {
    setSaveStatus("Could not save", "fa-solid fa-triangle-exclamation");
    if (showToast) toast("Browser storage is full. Export your project to keep a copy.");
  }
}
function queueAutosave() {
  setSaveStatus("Saving…", "fa-solid fa-rotate fa-spin");
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => saveProject(false), 450);
}
function updateStats() {
  const code = state.editor ? state.editor.getValue() : (state.fallback?.value || "");
  const lines = Math.max(1, code.split("\n").length);
  $("#lineStatus").textContent = lines + (lines === 1 ? " line" : " lines");
}
function renderProjectName() {
  $("#projectName").textContent = state.projectName;
  $("#projectCrumb").textContent = state.projectName;
  document.title = state.current + " — CodeForge";
}
function fileIcon(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return icons[extensions[ext] || ext] || "fa-regular fa-file-code";
}
function renderFileTree() {
  const host = $("#fileTree");
  const names = Object.keys(state.files).sort((a, b) => {
    const order = { "index.html": 0, "style.css": 1, "script.js": 2 };
    return (order[a] ?? 10) - (order[b] ?? 10) || a.localeCompare(b);
  });
  host.innerHTML = names.map(name => {
    const ext = (name.split(".").pop() || "").toLowerCase();
    return '<button class="file-row ' + (name === state.current ? "active" : "") + '" data-file="' + escapeHtml(name) + '" data-ext="' + escapeHtml(ext) + '"><i class="' + fileIcon(name) + '"></i><span>' + escapeHtml(name) + '</span>' + (name === state.current ? '<span class="dirty-dot" hidden></span>' : "") + "</button>";
  }).join("");
  $$(".file-row", host).forEach(button => button.addEventListener("click", () => switchFile(button.dataset.file)));
}
function renderTabs() {
  const host = $("#fileTabs");
  host.innerHTML = Object.keys(state.files).sort((a, b) => {
    const order = { "index.html": 0, "style.css": 1, "script.js": 2 };
    return (order[a] ?? 10) - (order[b] ?? 10) || a.localeCompare(b);
  }).map(name => {
    const ext = (name.split(".").pop() || "").toLowerCase();
    return '<button class="file-tab ' + (name === state.current ? "active" : "") + '" data-file="' + escapeHtml(name) + '" data-ext="' + escapeHtml(ext) + '"><i class="' + fileIcon(name) + '"></i><span>' + escapeHtml(name.split("/").pop()) + '</span>' + (name === state.current ? '<span class="tab-dirty" hidden>●</span>' : "") + "</button>";
  }).join("");
  $$(".file-tab", host).forEach(button => button.addEventListener("click", () => switchFile(button.dataset.file)));
}
function renderEditorMetadata() {
  const language = activeFile()?.language || "plaintext";
  $("#languageStatus").textContent = (languageNames[language] || language).toUpperCase();
  $("#languageSelect").value = language;
  renderProjectName();
  updateStats();
}
function switchFile(name) {
  if (!state.files[name]) return;
  if (name !== state.current) saveCurrent();
  state.current = name;
  const file = activeFile();
  if (state.editor) {
    const model = state.editor.getModel();
    if (model) monaco.editor.setModelLanguage(model, file.language === "plaintext" ? "plaintext" : file.language);
    state.editor.setValue(file.code);
  }
  if (state.fallback) state.fallback.value = file.code;
  renderEditorMetadata();
  renderFileTree();
  renderTabs();
  updatePreview();
  queueAutosave();
}

function setupEditor() {
  state.fallback = $("#editorFallback");
  state.fallback.value = activeFile().code;
  state.fallback.style.display = "block";
  state.fallback.addEventListener("input", () => {
    activeFile().code = state.fallback.value;
    updateStats();
    updatePreviewDebounced();
    queueAutosave();
  });
  state.fallback.addEventListener("keyup", updateCursorFromFallback);
  state.fallback.addEventListener("click", updateCursorFromFallback);
  state.fallback.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      event.preventDefault();
      const input = state.fallback;
      const start = input.selectionStart;
      input.setRangeText("  ", start, input.selectionEnd, "end");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  if (typeof require !== "function") {
    renderFileTree(); renderTabs(); renderEditorMetadata(); updatePreview();
    $("#editorEmpty").hidden = true;
    return;
  }
  try {
    require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });
    require(["vs/editor/editor.main"], () => {
      if (typeof monaco === "undefined") return;
      monaco.editor.defineTheme("codeforge-midnight", {
        base: "vs-dark", inherit: true, rules: [], colors: {
          "editor.background": "#0e0f17", "editorLineNumber.foreground": "#565767", "editorLineNumber.activeForeground": "#c1b2ff",
          "editorCursor.foreground": "#9af7df", "editor.selectionBackground": "#8370ce55", "editor.inactiveSelectionBackground": "#6e5cb333",
          "editorGutter.background": "#0e0f17", "editorIndentGuide.background1": "#ffffff0a"
        }
      });
      state.editor = monaco.editor.create($("#editor"), {
        value: activeFile().code,
        language: activeFile().language,
        theme: "codeforge-midnight",
        fontFamily: "DM Mono, Consolas, monospace",
        fontSize: 12,
        lineHeight: 21,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        padding: { top: 13, bottom: 13 },
        renderLineHighlight: "gutter",
        smoothScrolling: true
      });
      state.fallback.style.display = "none";
      state.editor.onDidChangeModelContent(() => {
        activeFile().code = state.editor.getValue();
        updateStats();
        updatePreviewDebounced();
        queueAutosave();
      });
      state.editor.onDidChangeCursorPosition(event => {
        $("#cursorStatus").textContent = "Ln " + event.position.lineNumber + ", Col " + event.position.column;
      });
      state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);
      state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveProject(true));
      renderFileTree(); renderTabs(); renderEditorMetadata(); updatePreview();
      $("#editorEmpty").hidden = true;
    }, error => {
      console.warn("Monaco could not be loaded; using the built-in editor.", error);
      renderFileTree(); renderTabs(); renderEditorMetadata(); updatePreview();
      $("#editorEmpty").hidden = true;
    });
  } catch (error) {
    renderFileTree(); renderTabs(); renderEditorMetadata(); updatePreview();
    $("#editorEmpty").hidden = true;
  }
}
function updateCursorFromFallback() {
  const input = state.fallback;
  const before = input.value.slice(0, input.selectionStart);
  const lines = before.split("\n");
  $("#cursorStatus").textContent = "Ln " + lines.length + ", Col " + (lines[lines.length - 1].length + 1);
}

function buildPreviewDocument() {
  const current = activeFile();
  const html = (current?.language === "html" ? current.code : state.files["index.html"]?.code) || "<!doctype html><html><head></head><body></body></html>";
  const css = (state.files["style.css"]?.code || "").replace(/<\/style/gi, "<\\/style");
  const js = (state.files["script.js"]?.code || "").replace(/<\/script/gi, "<\\/script");
  const bridge = "<script>(function(){['log','info','warn','error'].forEach(function(kind){var original=console[kind];console[kind]=function(){var values=Array.prototype.slice.call(arguments).map(function(value){try{return typeof value==='string'?value:JSON.stringify(value)}catch(error){return String(value)}});parent.postMessage({__codeforge:true,kind:kind,values:values},'*');if(original)original.apply(console,arguments)}});window.addEventListener('error',function(event){parent.postMessage({__codeforge:true,kind:'error',values:[event.message+' (line '+event.lineno+')']},'*')})})();</script>";
  let documentHtml = html
    .replace(/<link\b[^>]*href=(['"])style\.css\1[^>]*>/gi, "")
    .replace(/<script\b[^>]*src=(['"])script\.js\1[^>]*>\s*<\/script>/gi, "");
  if (!/<head\b/i.test(documentHtml)) documentHtml = "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + documentHtml + "</body></html>";
  const inlineStyle = "<style>" + css + "</style>";
  if (/<\/head>/i.test(documentHtml)) documentHtml = documentHtml.replace(/<\/head>/i, inlineStyle + bridge + "</head>");
  else documentHtml = inlineStyle + bridge + documentHtml;
  const scriptTag = "<script>" + js + "</script>";
  if (/<\/body>/i.test(documentHtml)) documentHtml = documentHtml.replace(/<\/body>/i, scriptTag + "</body>");
  else documentHtml += scriptTag;
  return documentHtml;
}
function updatePreview() {
  const frame = $("#preview");
  if (frame) frame.srcdoc = buildPreviewDocument();
}
function updatePreviewDebounced() {
  clearTimeout(state.previewTimer);
  state.previewTimer = setTimeout(updatePreview, 420);
}
window.addEventListener("message", event => {
  if (event.source !== $("#preview")?.contentWindow || !event.data?.__codeforge) return;
  const message = event.data;
  writeConsole((message.values || []).join(" "), message.kind === "error" || message.kind === "warn" ? "error" : "log");
});
function writeConsole(message, kind = "log") {
  const host = $("#consoleOutput");
  if (host.querySelector(".console-welcome")) host.innerHTML = "";
  const line = document.createElement("div");
  line.className = "console-line" + (kind === "error" ? " error" : "");
  line.textContent = message;
  host.append(line);
  host.scrollTop = host.scrollHeight;
}
function clearConsole() {
  $("#consoleOutput").innerHTML = '<div class="console-welcome"><i class="fa-solid fa-terminal"></i><span>Console cleared. Run your code to see messages here.</span></div>';
}
function runCode() {
  saveCurrent();
  const file = activeFile();
  if (!file) return;
  const language = file.language;
  if (["html", "css", "javascript"].includes(language)) {
    clearConsole();
    updatePreview();
    if (language === "javascript") {
      switchInspector("consolePanel");
      writeConsole("Running browser preview…", "log");
      setTimeout(() => {
        if ($( "#consoleOutput").textContent.includes("Running browser preview")) writeConsole("Preview ready. Interact with the page to trigger its JavaScript.", "log");
      }, 450);
    } else {
      switchInspector("previewPanel");
      toast("Preview refreshed");
    }
    return;
  }
  switchInspector("consolePanel");
  clearConsole();
  writeConsole("Running " + (languageNames[language] || language) + "…", "log");
  fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code: file.code, input: $("#stdin").value })
  }).then(async response => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const body = (await response.text()).trim();
      const detail = body ? `: ${body}` : "";
      throw new Error(`The local runner returned a non-JSON response (HTTP ${response.status})${detail}. Start CodeForge with "npm start" and open http://localhost:5000.`);
    }
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || "Runner returned " + response.status);
    clearConsole();
    if (result.stdout) writeConsole(result.stdout);
    if (result.stderr) writeConsole(result.stderr, "error");
    if (!result.stdout && !result.stderr) writeConsole("Program finished successfully.");
  }).catch(error => {
    clearConsole();
    writeConsole(error.message, "error");
    toast("Could not run this file");
  });
}

function addFile() {
  const name = prompt("Name your file", "components/card.html");
  if (!name) return;
  const cleaned = name.trim().replace(/\\/g, "/");
  if (!cleaned || cleaned.includes("..") || cleaned.startsWith("/") || cleaned === "__proto__") return toast("Choose a valid project file name");
  if (state.files[cleaned]) return toast("That file already exists");
  state.files[cleaned] = { language: languageFor(cleaned), code: "" };
  switchFile(cleaned);
  activateView("workspace");
  toast("New file created");
}
function renameProject() {
  const next = prompt("Project name", state.projectName);
  if (next === null) return;
  const cleaned = next.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 38);
  if (!cleaned) return toast("Project name needs at least one letter or number");
  state.projectName = cleaned;
  renderProjectName();
  saveProject(true);
}
function downloadProject() {
  saveCurrent();
  const payload = { name: state.projectName, exportedAt: new Date().toISOString(), files: Object.fromEntries(Object.entries(state.files).map(([name, file]) => [name, file.code])) };
  downloadBlob(JSON.stringify(payload, null, 2), state.projectName + ".codeforge.json", "application/json");
  toast("Project exported as a CodeForge JSON file");
}
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function copyText(text, label) {
  navigator.clipboard?.writeText(text).then(() => toast(label + " copied")).catch(() => toast("Clipboard access was unavailable"));
}
function formatCode() {
  if (state.editor) {
    const action = state.editor.getAction("editor.action.formatDocument");
    if (action) action.run();
    else toast("Formatting is not available for this language");
  } else {
    const before = state.fallback.value;
    state.fallback.value = before.split("\n").map(line => line.trimEnd()).join("\n");
    state.fallback.dispatchEvent(new Event("input", { bubbles: true }));
    toast("Trailing whitespace removed");
  }
}
function insertAtCursor(text) {
  activateView("workspace");
  if (state.editor) {
    const position = state.editor.getPosition();
    state.editor.executeEdits("codeforge-insert", [{ range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column), text, forceMoveMarkers: true }]);
    state.editor.focus();
  } else {
    const input = state.fallback;
    const start = input.selectionStart;
    input.setRangeText(text, start, input.selectionEnd, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }
}
function appendCss(css, message) {
  const current = state.files["style.css"]?.code || "";
  if (!state.files["style.css"]) state.files["style.css"] = { language: "css", code: "" };
  state.files["style.css"].code = current.trimEnd() + "\n\n" + css.trim() + "\n";
  switchFile("style.css");
  activateView("workspace");
  toast(message);
}

const paletteSets = [
  ["#7864C8", "#C37B9D", "#F4B875", "#73BCA5", "#254F5B"],
  ["#382E5E", "#7065A8", "#A9B8C8", "#DCE2C8", "#EFAE83"],
  ["#152238", "#315273", "#5D8792", "#A3C6B8", "#E8D6A2"],
  ["#572B52", "#9B4771", "#D07872", "#F2B671", "#F0E4BC"],
  ["#26354A", "#526A83", "#8EADB0", "#D7CBA4", "#DA9E78"],
  ["#113B39", "#22746C", "#66A78D", "#B5C999", "#F1D68A"]
];
function renderPalette(colors) {
  state.palette = colors.slice();
  $("#paletteStrip").innerHTML = colors.map((color, index) => '<button class="palette-swatch" style="background:' + color + '" data-color="' + color + '" title="Copy ' + color + '"><span>' + color + (index === 0 ? " · BASE" : "") + "</span></button>").join("");
  $("#paletteCodes").innerHTML = colors.map(color => '<button data-color="' + color + '" title="Copy hex">' + color + "</button>").join("");
  $$("[data-color]", $("#paletteStrip")).forEach(button => button.addEventListener("click", () => copyText(button.dataset.color, button.dataset.color)));
  $$("#paletteCodes [data-color]").forEach(button => button.addEventListener("click", () => copyText(button.dataset.color, button.dataset.color)));
}
function remixPalette() {
  let index = Math.floor(Math.random() * paletteSets.length);
  if (state.palette.join() === paletteSets[index].join()) index = (index + 1) % paletteSets.length;
  renderPalette(paletteSets[index]);
}
function updateGradient() {
  const a = $("#gradientColorA").value;
  const b = $("#gradientColorB").value;
  const angle = $("#gradientAngle").value;
  const value = "linear-gradient(" + angle + "deg, " + a + ", " + b + ")";
  $("#gradientPreview").style.background = value;
  $("#gradientCode").textContent = "background: " + value + ";";
  $("#gradientAngleValue").textContent = angle + "°";
  return value;
}
function updateShadow() {
  const blur = Number($("#shadowBlur").value);
  const spread = Number($("#shadowSpread").value);
  const opacity = Number($("#shadowOpacity").value);
  $("#shadowBlurValue").textContent = blur + "px";
  $("#shadowSpreadValue").textContent = spread + "px";
  $("#shadowOpacityValue").textContent = opacity + "%";
  const value = "0 12px " + blur + "px " + spread + "px rgba(135, 101, 255, " + (opacity / 100).toFixed(2) + ")";
  $("#shadowSample").style.boxShadow = value;
  $("#shadowCode").textContent = "box-shadow: " + value + ";";
  return value;
}
const motionPresets = {
  float: { timing: "ease-in-out", frames: "0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); }" },
  pulse: { timing: "ease-in-out", frames: "0%, 100% { transform: scale(1); } 50% { transform: scale(1.14); }" },
  spin: { timing: "linear", frames: "from { transform: rotate(0deg); } to { transform: rotate(360deg); }" },
  bounce: { timing: "cubic-bezier(.28,.84,.42,1)", frames: "0%, 100% { transform: translateY(0); } 45% { transform: translateY(-18px); } 65% { transform: translateY(-5px); }" },
  slide: { timing: "ease-in-out", frames: "0%, 100% { transform: translateX(-22px); } 50% { transform: translateX(22px); }" },
  tilt3d: { timing: "ease-in-out", is3d: true, frames: "0%, 100% { transform: rotateX(0deg) rotateY(0deg) translateZ(0); } 50% { transform: rotateX(16deg) rotateY(-22deg) translateZ(12px); }" }
};
function motionCss() {
  const presetName = $("#motionPreset").value;
  const preset = motionPresets[presetName];
  const duration = Number($("#motionDuration").value);
  const animation = "forge-" + presetName + " " + (duration / 1000).toFixed(1) + "s " + preset.timing + " infinite";
  $("#motionDurationValue").textContent = (duration / 1000).toFixed(1) + "s";
  $("#motionCode").textContent = "animation: " + animation + ";";
  const stage = preset.is3d ? ".motion-stage {\n  perspective: 700px;\n}\n\n" : "";
  const depth = preset.is3d ? "  transform-style: preserve-3d;\n  backface-visibility: hidden;\n" : "";
  return stage + "@keyframes forge-" + presetName + " {\n  " + preset.frames.replace(/ (?=\d|from|to)/g, "\n  ") + "\n}\n\n.motion-demo {\n" + depth + "  " + $("#motionCode").textContent + "\n}";
}
function replayMotion() {
  const orb = $("#motionOrb");
  const animation = $("#motionCode").textContent.replace(/^animation:\s*/, "").replace(/;$/, "");
  orb.style.animation = "none";
  void orb.offsetWidth;
  orb.style.animation = animation;
}
function updateMotion() {
  motionCss();
  replayMotion();
}
function updateMark() {
  const shape = $("#markShape").value;
  const color = $("#markColor").value;
  const accent = $("#markAccent").value;
  let markup;
  if (shape === "spark") markup = '<path d="M64 10 76 49l39 15-39 15-12 39-13-39-38-15 38-15z" fill="' + color + '"/><circle cx="64" cy="64" r="11" fill="' + accent + '"/>';
  else if (shape === "tile") markup = '<rect x="20" y="20" width="88" height="88" rx="25" fill="' + color + '"/><path d="M42 78 64 39l22 39H42Z" fill="' + accent + '"/><circle cx="64" cy="77" r="8" fill="#10111a"/>';
  else markup = '<circle cx="64" cy="64" r="46" fill="' + color + '"/><path d="M43 77 64 36l21 41H43Z" fill="' + accent + '"/><circle cx="64" cy="74" r="9" fill="#10111a"/>';
  $("#markSvg").innerHTML = markup;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' + markup + "</svg>";
}

const snippets = [
  { title: "Glass card", hint: "Soft borders + frosted feel", icon: "fa-regular fa-clone", code: ".glass-card {\n  padding: 24px;\n  border: 1px solid rgba(255,255,255,.18);\n  border-radius: 18px;\n  background: rgba(255,255,255,.08);\n  backdrop-filter: blur(16px);\n}" },
  { title: "Gradient text", hint: "A little color in the headline", icon: "fa-solid fa-highlighter", code: ".gradient-text {\n  color: transparent;\n  background: linear-gradient(100deg, #a58cff, #9af7df);\n  background-clip: text;\n}" },
  { title: "Responsive grid", hint: "Cards that find their own space", icon: "fa-solid fa-table-cells-large", code: ".responsive-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 16px;\n}" }
];
function renderSnippets() {
  $("#snippetList").innerHTML = snippets.map((snippet, index) => '<button class="snippet-choice" data-snippet="' + index + '"><span class="snippet-swatch"><i class="' + snippet.icon + '"></i></span><span><b>' + snippet.title + '</b><small>' + snippet.hint + '</small></span><i class="fa-solid fa-arrow-right"></i></button>').join("");
  $$("[data-snippet]").forEach(button => button.addEventListener("click", () => {
    const snippet = snippets[Number(button.dataset.snippet)];
    const file = activeFile();
    if (file.language === "css") insertAtCursor("\n" + snippet.code + "\n");
    else {
      const htmlSnippet = '<article class="glass-card">\n  <h2 class="gradient-text">Your idea, here.</h2>\n  <p>A little style goes a long way.</p>\n</article>\n';
      insertAtCursor(htmlSnippet);
    }
    toast(snippet.title + " inserted into " + state.current);
  }));
}

const starters = [
  { title: "Aurora landing page", tag: "HTML + CSS + JS", level: "A fresh start", description: "A luminous hero with a working button and responsive layout.", icon: "fa-solid fa-sun", files: starterFiles },
  { title: "Pocket habit tracker", tag: "HTML + CSS + JS", level: "Make it yours", description: "A tiny daily check-in with a local progress counter.", icon: "fa-regular fa-circle-check", files: {
    "index.html": { language: "html", code: "<!doctype html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Little Wins</title></head><body><main class=\"tracker\"><span>YOUR DAILY PAUSE</span><h1>Little wins<br>add up.</h1><p id=\"count\">0 moments captured</p><button id=\"add\">+ Count a win</button><div class=\"dots\" id=\"dots\"></div></main><script src=\"script.js\"></script></body></html>" },
    "style.css": { language: "css", code: "*{box-sizing:border-box}body{min-height:100vh;display:grid;place-items:center;margin:0;padding:24px;background:#f2eee7;color:#25352d;font:16px system-ui}.tracker{width:min(100%,420px);padding:38px;border-radius:22px;background:#fffdf8;box-shadow:0 22px 70px #423a241f}.tracker>span{font:10px monospace;letter-spacing:.14em;color:#65947b}h1{font-size:53px;line-height:.95;letter-spacing:-.07em;margin:22px 0}p{color:#6f7c72}button{padding:13px 16px;border:0;border-radius:9px;background:#89bd9c;color:#102419;font-weight:700;cursor:pointer}.dots{display:flex;gap:7px;margin-top:24px}.dots i{width:10px;height:10px;border-radius:50%;background:#d3dfd1}.dots i.on{background:#83ba96}" },
    "script.js": { language: "javascript", code: "let wins = 0;\nconst count = document.querySelector('#count');\nconst dots = document.querySelector('#dots');\nfunction render() { count.textContent = wins + (wins === 1 ? ' moment' : ' moments') + ' captured'; dots.innerHTML = Array.from({length: Math.min(wins, 14)}, () => '<i class=\"on\"></i>').join('') + '<i></i>'.repeat(Math.max(0, 7 - wins)); }\ndocument.querySelector('#add').addEventListener('click', () => { wins++; render(); });\nrender();" }
  } },
  { title: "Gradient playground", tag: "CSS experiment", level: "Play with color", description: "An expressive gradient board with a responsive card grid.", icon: "fa-solid fa-circle-half-stroke", files: {
    "index.html": { language: "html", code: "<!doctype html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Color in Motion</title></head><body><main><span class=\"label\">COLOR STUDY Nº 04</span><h1>Color in<br><em>motion.</em></h1><p>Three little gradients, each with a different mood.</p><section class=\"swatches\"><article><span>01 / DUSK</span></article><article><span>02 / TIDE</span></article><article><span>03 / BLOOM</span></article></section></main></body></html>" },
    "style.css": { language: "css", code: "*{box-sizing:border-box}body{min-height:100vh;margin:0;padding:10vh 8vw;background:#14141b;color:#f5f3fc;font:15px system-ui}main{max-width:980px;margin:auto}.label{color:#aaf1dd;font:10px monospace;letter-spacing:.14em}h1{margin:22px 0 9px;font-size:clamp(54px,9vw,95px);line-height:.91;letter-spacing:-.08em}h1 em{color:#b29dff;font-style:normal}p{color:#a1a0b1}.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:40px}.swatches article{height:190px;display:flex;align-items:end;padding:18px;border:1px solid #ffffff2c;border-radius:15px;box-shadow:0 18px 50px #0004}.swatches article:nth-child(1){background:linear-gradient(145deg,#f1b581,#9c78bf 52%,#272e55)}.swatches article:nth-child(2){background:linear-gradient(145deg,#8ce2c0,#448b9a 48%,#24365a)}.swatches article:nth-child(3){background:linear-gradient(145deg,#f88ca8,#bd80bc 50%,#625bc5)}.swatches span{font:10px monospace;letter-spacing:.08em}" }
  } },
  { title: "Tiny weather card", tag: "HTML + CSS", level: "A small component", description: "A playful weather card with a hand-drawn sun and cloud.", icon: "fa-solid fa-cloud-sun", files: {
    "index.html": { language: "html", code: "<!doctype html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Weather, softly</title></head><body><main class=\"weather\"><div><span class=\"place\">SUNDAY, SOMEWHERE</span><h1>Good morning.</h1><p>Take the long way home.</p><strong>24° <small>and bright</small></strong></div><div class=\"sun\"><i></i></div></main></body></html>" },
    "style.css": { language: "css", code: "*{box-sizing:border-box}body{min-height:100vh;display:grid;place-items:center;margin:0;padding:25px;background:#f3efe6;color:#293344;font:16px system-ui}.weather{width:min(100%,590px);min-height:300px;display:flex;justify-content:space-between;align-items:center;overflow:hidden;padding:38px;border-radius:24px;background:linear-gradient(135deg,#e7f3ed,#d4e7eb);box-shadow:0 30px 70px #48565b26}.place{color:#66847f;font:10px monospace;letter-spacing:.13em}h1{margin:17px 0 6px;font-size:33px;letter-spacing:-.05em}p{color:#718289}strong{display:block;margin-top:26px;font-size:34px}strong small{font-size:12px;font-weight:500;color:#718289}.sun{width:142px;height:142px;position:relative;display:grid;place-items:center;border-radius:50%;background:#f1cb79;box-shadow:0 0 0 18px #f1cb7924,0 0 0 37px #f1cb7912}.sun i{width:130px;height:70px;position:absolute;right:-44px;bottom:-18px;border-radius:50px;background:#eff5eb;box-shadow:-31px 13px 0 -6px #eff5eb}@media(max-width:500px){.weather{padding:25px}.sun{width:80px;height:80px;flex:none}.sun i{transform:scale(.6);transform-origin:bottom right}}" }
  } },
  { title: "Focus timer", tag: "HTML + CSS + JS", level: "A useful utility", description: "A calm pomodoro timer with start, pause, and reset controls.", icon: "fa-regular fa-clock", files: {
    "index.html": { language: "html", code: "<!doctype html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Soft Focus</title></head><body><main class=\"timer\"><span class=\"eyebrow\">A MOMENT FOR YOU</span><div class=\"clock\" id=\"clock\">25:00</div><p id=\"label\">Ready when you are.</p><div class=\"actions\"><button id=\"toggle\">Start focus</button><button id=\"reset\">Reset</button></div></main><script src=\"script.js\"></script></body></html>" },
    "style.css": { language: "css", code: "*{box-sizing:border-box}body{min-height:100vh;display:grid;place-items:center;margin:0;background:radial-gradient(circle at 50% 28%,#3d355c,#191824 60%,#11121a);color:#f5f3fb;font:15px system-ui}.timer{width:min(90vw,420px);padding:42px;text-align:center;border:1px solid #ffffff26;border-radius:24px;background:#ffffff0c;box-shadow:0 25px 80px #0005;backdrop-filter:blur(15px)}.eyebrow{color:#9af7df;font:10px monospace;letter-spacing:.14em}.clock{margin:24px 0 0;font:600 77px/1 ui-monospace,monospace;letter-spacing:-.09em}.timer p{min-height:23px;color:#b0aec0;font-size:12px}.actions{display:flex;justify-content:center;gap:8px;margin-top:26px}button{padding:11px 15px;border:1px solid #ffffff20;border-radius:8px;background:#9af7df;color:#141b1a;font-weight:700;cursor:pointer}button+button{background:#ffffff0b;color:#e7e4f0}" },
    "script.js": { language: "javascript", code: "let seconds = 25 * 60;\nlet interval;\nlet running = false;\nconst clock = document.querySelector('#clock');\nconst toggle = document.querySelector('#toggle');\nfunction render() { clock.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }\ntoggle.addEventListener('click', () => { running = !running; toggle.textContent = running ? 'Pause focus' : 'Resume focus'; document.querySelector('#label').textContent = running ? 'One thing at a time.' : 'Take a breath.'; clearInterval(interval); if (running) interval = setInterval(() => { seconds = Math.max(0, seconds - 1); render(); if (!seconds) { running = false; toggle.textContent = 'Start again'; document.querySelector('#label').textContent = 'Lovely work. Take a little break.'; clearInterval(interval); } }, 1000); });\ndocument.querySelector('#reset').addEventListener('click', () => { clearInterval(interval); running = false; seconds = 25 * 60; toggle.textContent = 'Start focus'; document.querySelector('#label').textContent = 'Ready when you are.'; render(); });\nrender();" }
  } },
  { title: "Accessible button set", tag: "HTML + CSS", level: "A handy pattern", description: "Three small button treatments with thoughtful focus states.", icon: "fa-solid fa-arrow-pointer", files: {
    "index.html": { language: "html", code: "<!doctype html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Button study</title></head><body><main><span class=\"label\">INTERACTION STUDY / 01</span><h1>Small, useful<br>buttons.</h1><p>Pick a feeling. Focus each one with your keyboard.</p><div class=\"button-row\"><button class=\"primary\">Make it happen <b>↗</b></button><button class=\"soft\">Maybe later</button><button class=\"round\" aria-label=\"Add to favorites\">♡</button></div></main></body></html>" },
    "style.css": { language: "css", code: "*{box-sizing:border-box}body{min-height:100vh;display:grid;place-items:center;margin:0;padding:24px;background:#14141c;color:#f5f3fa;font:15px system-ui}main{width:min(100%,600px)}.label{color:#9af7df;font:10px monospace;letter-spacing:.14em}h1{margin:21px 0 10px;font-size:54px;line-height:.98;letter-spacing:-.07em}p{margin:0;color:#a6a5b3}.button-row{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-top:30px}button{min-height:43px;padding:0 16px;border:1px solid #ffffff2b;border-radius:9px;background:transparent;color:#dedde8;font:600 12px system-ui;cursor:pointer;transition:transform .15s,background .15s}button:hover{transform:translateY(-2px)}button:focus-visible{outline:3px solid #9af7df;outline-offset:3px}.primary{border-color:transparent;background:#9af7df;color:#11201c}.primary b{padding-left:12px}.soft{background:#ffffff0a}.round{width:43px;padding:0;border-radius:50%;font-size:18px}" }
  } },
  { title: "Python number garden", tag: "Python", level: "Run it locally", description: "Collect a few favorite numbers and see their total and average.", icon: "fa-brands fa-python", files: {
    "main.py": { language: "python", code: "numbers = [3, 8, 13, 21]\ntotal = sum(numbers)\naverage = total / len(numbers)\n\nprint(f\"Numbers: {numbers}\")\nprint(f\"Total: {total}\")\nprint(f\"Average: {average:.1f}\")" }
  } },
  { title: "Java greeting machine", tag: "Java", level: "Run it locally", description: "Practice methods and string formatting with a friendly console greeting.", icon: "fa-brands fa-java", files: {
    "Main.java": { language: "java", code: "public class Main {\n    public static void main(String[] args) {\n        String name = \"CodeForge\";\n        System.out.println(\"Hello, \" + name + \"!\");\n        System.out.println(\"Today is a good day to build.\");\n    }\n}" }
  } },
  { title: "C++ vector explorer", tag: "C++", level: "Run it locally", description: "Loop through a vector, then calculate its largest value.", icon: "fa-solid fa-code", files: {
    "main.cpp": { language: "cpp", code: "#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> scores{7, 12, 4, 19, 9};\n    for (int score : scores) {\n        std::cout << score << (score == scores.back() ? '\\n' : ' ');\n    }\n    std::cout << \"Highest score: \" << *std::max_element(scores.begin(), scores.end()) << '\\n';\n    return 0;\n}" }
  } }
];

const challenges = [
  { title: "A card with character", category: "HTML + CSS", level: "Easy", description: "Build a tidy profile card with an avatar, a short bio, and one clear action.", icon: "fa-regular fa-id-card", code: "<article class=\"profile-card\">\n  <div class=\"avatar\">✦</div>\n  <h2>Your name here</h2>\n  <p>A sentence about something you love making.</p>\n  <button>Say hello</button>\n</article>", markup: "<main class=\"profile-card\"><div class=\"avatar\">✦</div><h2>Your name here</h2><p>A sentence about something you love making.</p><button>Say hello</button></main>", css: ".profile-card{max-width:350px;margin:12vh auto;padding:32px;border:1px solid #ffffff26;border-radius:20px;background:#ffffff0c;color:#f5f3fc;text-align:center;box-shadow:0 22px 65px #0005;font:15px system-ui}.avatar{width:56px;height:56px;display:grid;place-items:center;margin:auto;border-radius:18px;background:#9b7cff;color:#fff;font-size:25px}.profile-card h2{margin-bottom:5px}.profile-card p{color:#aaa8ba;line-height:1.6}.profile-card button{padding:11px 15px;border:0;border-radius:8px;background:#9af7df;color:#17211e;font-weight:700}" },
  { title: "Responsive by nature", category: "CSS", level: "Easy", description: "Arrange three cards so they find their space on every screen.", icon: "fa-solid fa-table-cells-large", code: "body { min-height: 100vh; display: grid; place-items: center; margin: 0; padding: 24px; background: #13131d; color: #f5f3fc; font: 14px system-ui; }\n.card-grid {\n  width: min(100%, 850px);\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 16px;\n}\n.card-grid article { min-height: 155px; padding: 22px; border: 1px solid #ffffff1f; border-radius: 15px; background: linear-gradient(140deg, #9b7cff20, #ffffff08); color: #aaa8b8; line-height: 2; }\n.card-grid b { color: #f2eefb; font-size: 19px; }", markup: "<main class=\"card-grid\"><article>01 / Collect<br><b>Little details</b></article><article>02 / Compose<br><b>A point of view</b></article><article>03 / Create<br><b>Your next thing</b></article></main>" },
  { title: "A tiny interaction", category: "JavaScript", level: "Easy", description: "Make a button update a message and celebrate with a console log.", icon: "fa-solid fa-hand-pointer", code: "const button = document.querySelector('#action');\nconst message = document.querySelector('#message');\nbutton.addEventListener('click', () => {\n  message.textContent = 'You made it happen!';\n  console.log('Button clicked');\n});", markup: "<main><h1>A tiny interaction</h1><p id=\"message\">Something good is about to happen.</p><button id=\"action\">Make it happen</button></main>", css: "body{min-height:100vh;display:grid;place-items:center;margin:0;background:#181622;color:#f5f2fd;font:15px system-ui}main{width:min(90%,440px);padding:36px;border:1px solid #ffffff20;border-radius:17px;background:#ffffff09}h1{font-size:32px;letter-spacing:-.05em}p{color:#aaa7b9;line-height:1.7}button{padding:12px 15px;border:0;border-radius:8px;background:#9af7df;color:#17211e;font-weight:700;cursor:pointer}" },
  { title: "A kind little form", category: "HTML", level: "Easy", description: "Use labels, helpful input types, and clear feedback for a sign-up form.", icon: "fa-regular fa-envelope", code: "<form>\n  <label for=\"email\">Your email</label>\n  <input id=\"email\" type=\"email\" required>\n  <button type=\"submit\">Keep me posted</button>\n</form>", markup: "<main><form><span>ONE GOOD EMAIL, NOW AND THEN</span><h1>Keep in touch.</h1><label for=\"email\">Your email</label><input id=\"email\" type=\"email\" placeholder=\"you@example.com\" required><button type=\"submit\">Keep me posted</button></form></main>", css: "body{min-height:100vh;display:grid;place-items:center;margin:0;padding:25px;background:#15151e;color:#f4f2fa;font:14px system-ui}form{width:min(90vw,440px);padding:34px;border:1px solid #ffffff20;border-radius:16px;background:#ffffff08}form span{color:#9af7df;font:9px monospace;letter-spacing:.12em}h1{margin:16px 0 24px;font-size:37px;letter-spacing:-.06em}label{display:block;margin-bottom:7px;color:#aaa8b8;font-size:11px}input{width:100%;height:42px;padding:0 11px;border:1px solid #ffffff29;border-radius:7px;background:#101019;color:white}button{height:40px;margin-top:12px;padding:0 13px;border:0;border-radius:7px;background:#a58cff;color:#191427;font-weight:700}" },
  { title: "Make the colors talk", category: "CSS", level: "Medium", description: "Build a palette that moves from a calm base to one vivid accent.", icon: "fa-solid fa-palette", code: ":root {\n  --ink: #18222e;\n  --paper: #f4f0e8;\n  --accent: #9474ea;\n}\nbody { color: var(--ink); background: var(--paper); }\n.palette-card { color: var(--ink); background: #fffdf8; }\n.palette-card h1 em { color: var(--accent); }", markup: "<main class=\"palette-card\"><span>COLOR STUDY Nº 04</span><h1>Find your<br><em>point of view.</em></h1><p>Three colors, one little world.</p><div><i></i><i></i><i></i></div></main>", css: ":root{--ink:#18222e;--paper:#f4f0e8;--accent:#9474ea}body{min-height:100vh;display:grid;place-items:center;margin:0;padding:24px;background:var(--paper);color:var(--ink);font:14px system-ui}.palette-card{width:min(90vw,450px);padding:35px;border-radius:17px;background:#fffdf8;box-shadow:0 22px 65px #27324620}.palette-card>span{color:#6e7d90;font:9px monospace;letter-spacing:.12em}h1{font-size:39px;line-height:1.02;letter-spacing:-.06em}h1 em{color:var(--accent);font-style:normal}.palette-card p{color:#647283}.palette-card div{display:flex;gap:8px;margin-top:24px}.palette-card i{width:38px;height:38px;border-radius:50%;background:var(--ink)}.palette-card i:nth-child(2){background:#bdc9c5}.palette-card i:nth-child(3){background:var(--accent)}" },
  { title: "Count what matters", category: "JavaScript", level: "Medium", description: "Create a counter with a reset action and readable output.", icon: "fa-solid fa-arrow-up-1-9", code: "let count = 0;\nconst output = document.querySelector('#count');\ndocument.querySelector('#add').addEventListener('click', () => {\n  count += 1;\n  output.textContent = count + (count === 1 ? ' good thing' : ' good things');\n});", markup: "<main><span class=\"eyebrow\">NOTICE THE GOOD STUFF</span><h1 id=\"count\">0 good things</h1><button id=\"add\">+ Add a little win</button></main>", css: "body{min-height:100vh;display:grid;place-items:center;margin:0;background:radial-gradient(ellipse at 50% 0,#51437b,#191822 70%);color:#f4f3fb;font:15px system-ui}main{width:min(90vw,510px);padding:42px;text-align:center;border:1px solid #ffffff25;border-radius:20px;background:#ffffff09}.eyebrow{color:#9af7df;font:9px monospace;letter-spacing:.1em}h1{margin:25px 0;font-size:43px;letter-spacing:-.06em}button{padding:12px 15px;border:0;border-radius:8px;background:#9af7df;color:#14201c;font-weight:700;cursor:pointer}" },
  { title: "Style the challenge dashboard", category: "CSS", level: "Medium", description: "Turn a bare challenge list into a responsive dashboard with clear progress and filter controls.", icon: "fa-brands fa-css3-alt", fileName: "style.css", code: "* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; background: #0b1020; color: #eef2ff; font: 16px system-ui; }\n.challenge-page { width: min(100% - 48px, 1120px); margin: 48px auto; }\n/* Add a flexible header, pill filters, and responsive challenge cards. */\n.challenge-grid {\n  /* Try CSS Grid with columns that adapt to the available space. */\n}\n.challenge-card {\n  /* Add a panel background, border, spacing, and a cyan top edge. */\n}", markup: "<main class=\"challenge-page\"><header><p>LEVEL UP</p><h1>Coding challenges</h1><p>Choose a language, pick a challenge, and keep building.</p><section class=\"progress\"><span>Your progress</span><strong>2 of 8 solved</strong><div class=\"progress-bar\"></div></section></header><nav class=\"filters\"><button>All languages</button><button>HTML</button><button>CSS</button><button>JavaScript</button><button>Python</button></nav><section class=\"challenge-grid\"><article class=\"challenge-card\"><span>CSS · EASY</span><h2>Center anything</h2><p>Use grid or flexbox to center a box on both axes.</p><footer>Not started <button>Start in editor</button></footer></article><article class=\"challenge-card\"><span>CSS · MEDIUM</span><h2>Responsive by nature</h2><p>Arrange three cards so they find their space on every screen.</p><footer>In progress <button>Continue</button></footer></article></section></main>" },
  { title: "Palindrome check", category: "Python", level: "Easy", description: "Complete a function that checks whether text reads the same backwards.", icon: "fa-brands fa-python", fileName: "main.py", code: "def is_palindrome(text):\n    cleaned = \"\".join(character.lower() for character in text if character.isalnum())\n    # Compare the cleaned text with its reverse.\n    return False\n\nprint(is_palindrome(\"Level\"))\nprint(is_palindrome(\"CodeForge\"))" },
  { title: "Build an LRU cache", category: "Python", level: "Hard", description: "Use an ordered mapping to evict the least recently used value when the cache is full.", icon: "fa-brands fa-python", fileName: "main.py", code: "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.items = OrderedDict()\n\n    def get(self, key):\n        # Move a found key to the most recently used position.\n        return -1\n\n    def put(self, key, value):\n        # Store the value and evict the least recently used key if needed.\n        pass\n\ncache = LRUCache(2)\ncache.put(\"a\", 1)\ncache.put(\"b\", 2)\nprint(cache.get(\"a\"))\ncache.put(\"c\", 3)\nprint(cache.get(\"b\"))" },
  { title: "Sum an array", category: "C", level: "Medium", description: "Finish a function that returns the total of every value in an integer array.", icon: "fa-solid fa-c", fileName: "main.c", code: "#include <stdio.h>\n\nint sum_values(const int values[], int length) {\n    int total = 0;\n    /* Add each value to total. */\n    return total;\n}\n\nint main(void) {\n    int values[] = {4, 7, 2, 9};\n    printf(\"Total: %d\\n\", sum_values(values, 4));\n    return 0;\n}" },
  { title: "Two-sum with a vector", category: "C++", level: "Medium", description: "Search a vector for two values that add up to the target.", icon: "fa-solid fa-code", fileName: "main.cpp", code: "#include <iostream>\n#include <vector>\n\nbool has_pair(const std::vector<int>& values, int target) {\n    for (std::size_t first = 0; first < values.size(); ++first) {\n        for (std::size_t second = first + 1; second < values.size(); ++second) {\n            // Return true when this pair matches the target.\n        }\n    }\n    return false;\n}\n\nint main() {\n    std::cout << std::boolalpha << has_pair({2, 7, 11, 15}, 9) << '\\n';\n}" },
  { title: "Format a greeting", category: "Java", level: "Easy", description: "Use a method and a parameter to return a personalized greeting.", icon: "fa-brands fa-java", fileName: "Main.java", code: "public class Main {\n    static String greeting(String name) {\n        // Return a friendly greeting that includes name.\n        return \"Hello!\";\n    }\n\n    public static void main(String[] args) {\n        System.out.println(greeting(\"Ada\"));\n    }\n}" },
  { title: "Build a PHP profile", category: "PHP", level: "Easy", description: "Complete a small server-rendered profile using escaped output for user-provided text.", icon: "fa-brands fa-php", fileName: "index.php", code: "<?php\n$name = \"Ada\";\n$role = \"Curious builder\";\n?>\n<main class=\"profile\">\n  <h1><?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?></h1>\n  <p><?= htmlspecialchars($role, ENT_QUOTES, 'UTF-8') ?></p>\n</main>" },
  { title: "Solve a DSA two-sum", category: "DSA", language: "DSA", level: "Medium", description: "Return the indices of two values that add up to a target, using a hash map for an efficient lookup.", icon: "fa-solid fa-diagram-project", fileName: "main.py", code: "def two_sum(values, target):\n    seen = {}\n    for index, value in enumerate(values):\n        complement = target - value\n        # Return the matching pair of indices when found.\n        seen[value] = index\n    return None\n\nprint(two_sum([2, 7, 11, 15], 9))" },
  { title: "Build a React profile card", category: "React.js", level: "Easy", description: "Turn a profile into a reusable component and pass its details in as props.", icon: "fa-brands fa-react", fileName: "ProfileCard.jsx", code: "function ProfileCard({ name, role }) {\n  return (\n    <article className=\"profile-card\">\n      <h2>{name}</h2>\n      <p>{role}</p>\n    </article>\n  );\n}\n\n// Render ProfileCard with a name and a role." },
  { title: "Design a clear settings panel", category: "UI/UX", level: "Easy", description: "Improve a settings screen with readable hierarchy, accessible labels, and a visible save action.", icon: "fa-solid fa-pen-ruler", fileName: "index.html", code: "<main class=\"settings\">\n  <p class=\"eyebrow\">YOUR WORKSPACE</p>\n  <h1>Preferences</h1>\n  <label for=\"display-name\">Display name</label>\n  <input id=\"display-name\" name=\"display-name\" value=\"Alex Morgan\">\n  <p class=\"hint\">This name appears on your profile.</p>\n  <button type=\"button\">Save changes</button>\n</main>", markup: "<main class=\"settings\">\n  <p class=\"eyebrow\">YOUR WORKSPACE</p>\n  <h1>Preferences</h1>\n  <label for=\"display-name\">Display name</label>\n  <input id=\"display-name\" name=\"display-name\" value=\"Alex Morgan\">\n  <p class=\"hint\">This name appears on your profile.</p>\n  <button type=\"button\">Save changes</button>\n</main>", css: "body{min-height:100vh;display:grid;place-items:center;margin:0;padding:24px;background:#101522;color:#f0f3fb;font:15px system-ui}.settings{width:min(100%,520px);padding:32px;border:1px solid #29334b;border-radius:16px;background:#171e2e}.eyebrow{color:#74d9cb;font-size:11px;letter-spacing:.12em}h1{margin:10px 0 25px}label{display:block;margin-bottom:8px;font-weight:600}input{width:100%;padding:12px;border:1px solid #3b4660;border-radius:8px;background:#101522;color:inherit}.hint{color:#a7b0c5;font-size:13px}button{margin-top:12px;padding:12px 16px;border:0;border-radius:8px;background:#49d4d0;color:#102024;font-weight:700}" },
  { title: "Harden a sign-in form", category: "Cyber Security", level: "Medium", description: "Render untrusted form input safely and identify the browser-side protections a real sign-in flow needs.", icon: "fa-solid fa-shield-halved", fileName: "script.js", code: "const form = document.querySelector('#message-form');\nconst input = document.querySelector('#message-input');\nconst output = document.querySelector('#message-output');\n\nform.addEventListener('submit', event => {\n  event.preventDefault();\n  // Render user text safely; do not interpret it as HTML.\n  output.textContent = input.value.trim();\n});", markup: "<main><h1>Leave a note</h1><form id=\"message-form\"><label for=\"message-input\">Your message</label><input id=\"message-input\" required maxlength=\"160\"><button>Post note</button></form><p id=\"message-output\" aria-live=\"polite\"></p></main>", css: "body{min-height:100vh;display:grid;place-items:center;margin:0;padding:24px;background:#111827;color:#eef2ff;font:15px system-ui}main{width:min(100%,460px);padding:30px;border:1px solid #344155;border-radius:16px;background:#1a2435}label{display:block;margin:16px 0 7px}input{width:100%;padding:11px;border:1px solid #46536a;border-radius:7px;background:#101827;color:inherit}button{margin-top:12px;padding:11px 15px;border:0;border-radius:7px;background:#56d4c8;color:#102323;font-weight:700}#message-output{overflow-wrap:anywhere}" },
  { title: "Explore a tiny dataset", category: "AI/ML", level: "Medium", description: "Normalize a small set of values and calculate its mean before feeding it into a model.", icon: "fa-solid fa-brain", language: "AI/ML", fileName: "main.py", code: "values = [12, 18, 24, 30]\nminimum = min(values)\nmaximum = max(values)\n\n# Scale each value to the range 0..1.\nnormalized = [\n    (value - minimum) / (maximum - minimum)\n    for value in values\n]\n\nprint(\"Normalized:\", normalized)\nprint(\"Mean:\", sum(normalized) / len(normalized))" },
  { title: "Build a pricing card", category: "HTML", level: "Easy", description: "Structure a card with a heading, price, feature list and call-to-action button.", icon: "fa-brands fa-html5", code: "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Pricing plan</title>\n  <style>\n    body{min-height:100vh;display:grid;place-items:center;margin:0;background:#101522;color:#f0f3fb;font:15px system-ui}\n    .plan{width:min(90vw,360px);padding:30px;border:1px solid #344155;border-radius:18px;background:#1a2435}\n    .price{font-size:42px;font-weight:800}.price span{font-size:14px;color:#a7b0c5}\n    li{margin:12px 0;color:#c5ccdb}button{width:100%;padding:12px;border:0;border-radius:8px;background:#20c6df;color:#09202b;font-weight:700}\n  </style>\n</head>\n<body>\n  <main class=\"plan\">\n    <p>STARTER</p>\n    <h1>Build at your pace</h1>\n    <p class=\"price\">$12 <span>/ month</span></p>\n    <ul><li>Unlimited projects</li><li>Live previews</li><li>Community support</li></ul>\n    <button type=\"button\">Choose plan</button>\n  </main>\n</body>\n</html>" },
  { title: "Center anything", category: "CSS", level: "Easy", description: "Use flexbox and grid to center a box on both axes.", icon: "fa-brands fa-css3-alt", fileName: "style.css", markup: "<!doctype html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><link rel=\"stylesheet\" href=\"style.css\"><title>Center anything</title></head><body><main class=\"stage\"><div class=\"target\">Centered<br>on both axes</div></main></body></html>", code: "body {\n  min-height: 100vh;\n  margin: 0;\n  background: #101522;\n  color: #f0f3fb;\n  font: 16px system-ui;\n}\n\n.stage {\n  /* Center the target horizontally and vertically. */\n}\n\n.target {\n  padding: 28px;\n  border: 1px solid #344155;\n  border-radius: 14px;\n  background: #1a2435;\n  text-align: center;\n}" },
  { title: "FizzBuzz", category: "JavaScript", level: "Easy", description: "Print numbers 1 to 100, swapping multiples of 3 and 5 for words.", icon: "fa-brands fa-square-js", fileName: "script.js", markup: "<!doctype html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>FizzBuzz</title></head><body><main><h1>FizzBuzz</h1><p>Open the console to inspect the sequence.</p></main></body></html>", code: "function fizzBuzz(limit) {\n  const result = [];\n  for (let number = 1; number <= limit; number++) {\n    // Replace multiples of 3, 5, and both with the matching output.\n    result.push(number);\n  }\n  return result;\n}\n\nconsole.log(fizzBuzz(100).join(', '));" },
  { title: "Debounce a function", category: "JavaScript", level: "Medium", description: "Delay a call until the user stops triggering it for a set time.", icon: "fa-brands fa-square-js", fileName: "script.js", markup: "<!doctype html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Debounce</title></head><body><main><h1>Debounce a function</h1><p>Implement the helper, then test it with rapid calls in the console.</p></main></body></html>", code: "function debounce(callback, delay) {\n  let timeoutId;\n  return function (...args) {\n    // Cancel the previous timer and schedule the latest call.\n  };\n}\n\nconst logSearch = debounce(value => console.log('Search:', value), 300);\nlogSearch('c');\nlogSearch('co');\nlogSearch('code');" },
  { title: "Reverse a string", category: "C", level: "Medium", description: "Reverse a character array in place using pointers.", icon: "fa-solid fa-c", fileName: "main.c", code: "#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char text[]) {\n    size_t left = 0;\n    size_t right = strlen(text) - 1;\n    while (left < right) {\n        /* Swap the characters at left and right, then move inward. */\n        left++;\n        right--;\n    }\n}\n\nint main(void) {\n    char text[] = \"codeforge\";\n    reverse(text);\n    printf(\"%s\\n\", text);\n    return 0;\n}" },
  { title: "Two-sum with a hash map", category: "C++", level: "Medium", description: "Find two numbers in a vector that add up to a target.", icon: "fa-solid fa-code", fileName: "main.cpp", code: "#include <iostream>\n#include <unordered_map>\n#include <utility>\n#include <vector>\n\nstd::pair<int, int> two_sum(const std::vector<int>& values, int target) {\n    std::unordered_map<int, int> seen;\n    for (int index = 0; index < static_cast<int>(values.size()); ++index) {\n        const int complement = target - values[index];\n        // If complement is in seen, return both indices.\n        seen[values[index]] = index;\n    }\n    return {-1, -1};\n}\n\nint main() {\n    const auto result = two_sum({2, 7, 11, 15}, 9);\n    std::cout << result.first << \", \" << result.second << '\\n';\n}" },
  { title: "Top 3 customers", category: "SQL", level: "Easy", description: "Write a query that returns the three highest-spending customers.", icon: "fa-solid fa-database", fileName: "query.sql", code: "SELECT\n    customer_id,\n    SUM(amount) AS total_spent\nFROM orders\nGROUP BY customer_id\nORDER BY total_spent DESC\nLIMIT 3;" }
];
const challengeProgress = (() => {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem("codeforge_next_completed") || "[]");
  } catch (error) {
    console.warn("Saved challenge progress could not be read.", error);
    return {};
  }
  const progress = {};
  if (Array.isArray(saved)) {
    saved.forEach(value => {
      const challenge = typeof value === "number" ? challenges[value] : challenges.find(item => challengeId(item) === value);
      if (challenge) progress[challengeId(challenge)] = "solved";
    });
  } else if (saved && typeof saved === "object") {
    Object.entries(saved).forEach(([id, status]) => {
      if (challenges.some(challenge => challengeId(challenge) === id) && ["in-progress", "solved"].includes(status)) progress[id] = status;
    });
  }
  return progress;
})();
const challengeFilters = { language: "All languages", level: "All levels", hideSolved: false };
function challengeId(challenge) { return challenge.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function saveChallengeProgress() {
  try {
    localStorage.setItem("codeforge_next_completed", JSON.stringify(challengeProgress));
  } catch (error) {
    console.warn("Challenge progress could not be saved.", error);
    toast("Challenge progress could not be saved in this browser");
  }
}
function loadFiles(files, name, projectTitle = name.replace(/\.[^.]+$/, "")) {
  state.files = Object.fromEntries(Object.entries(files).map(([path, file]) => [path, { language: file.language || languageFor(path), code: file.code || "" }]));
  state.current = state.files[name] ? name : "index.html";
  if (!state.files[state.current]) state.current = Object.keys(state.files)[0];
  state.projectName = projectTitle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "codeforge-project";
  renderProjectName();
  if (state.editor) {
    const file = activeFile();
    monaco.editor.setModelLanguage(state.editor.getModel(), file.language);
    state.editor.setValue(file.code);
  }
  if (state.fallback) state.fallback.value = activeFile().code;
  renderFileTree(); renderTabs(); renderEditorMetadata(); updatePreview(); queueAutosave();
  activateView("workspace");
}
function renderLibrary() {
  const host = $("#libraryGrid");
  $("#starterCount").textContent = String(starters.length);
  host.innerHTML = starters.map((starter, index) => '<article class="library-card"><div class="library-card-art"><span>' + String(index + 1).padStart(2, "0") + " / STARTER" + '</span><div class="art-ring"></div><i class="' + starter.icon + '"></i></div><div class="library-meta"><span>' + starter.tag + '</span><span class="level">' + starter.level + '</span></div><h2>' + starter.title + '</h2><p>' + starter.description + '</p><button class="button button-quiet" data-starter="' + index + '">Open this project <i class="fa-solid fa-arrow-right"></i></button></article>').join("");
  $$('[data-starter]', host).forEach(button => button.addEventListener("click", () => {
    const starter = starters[Number(button.dataset.starter)];
    const entryFile = Object.keys(starter.files).find(name => name === "index.html") || Object.keys(starter.files)[0];
    loadFiles(starter.files, entryFile, starter.title);
  }));
}
function challengeLanguage(challenge) {
  return challenge.language || (challenge.category === "HTML + CSS" ? "HTML" : challenge.category);
}
function challengeLanguages() {
  return ["All languages", ...new Set(challenges.map(challengeLanguage))];
}
function renderChallenges() {
  const languageHost = $("#challengeLanguageFilters");
  const languages = challengeLanguages();
  languageHost.innerHTML = languages.map(language => '<button type="button" role="tab" aria-selected="' + (challengeFilters.language === language) + '" class="' + (challengeFilters.language === language ? "active" : "") + '" data-challenge-language="' + escapeHtml(language) + '">' + escapeHtml(language) + "</button>").join("");
  $$("[data-challenge-language]", languageHost).forEach(button => button.addEventListener("click", () => {
    challengeFilters.language = button.dataset.challengeLanguage;
    renderChallenges();
  }));
  $$("[data-challenge-level]").forEach(button => {
    button.classList.toggle("active", button.dataset.challengeLevel === challengeFilters.level);
    button.onclick = () => {
      challengeFilters.level = button.dataset.challengeLevel;
      renderChallenges();
    };
  });
  $("#hideSolvedChallenges").checked = challengeFilters.hideSolved;
  const solvedCount = Object.values(challengeProgress).filter(status => status === "solved").length;
  $("#challengeSolved").textContent = String(solvedCount);
  $("#challengeTotal").textContent = String(challenges.length);
  $("#challengeProgressBar").style.width = challenges.length ? (solvedCount / challenges.length * 100) + "%" : "0%";
  const visible = challenges.filter(challenge => {
    const status = challengeProgress[challengeId(challenge)] || "not-started";
    return (challengeFilters.language === "All languages" || challengeLanguage(challenge) === challengeFilters.language)
      && (challengeFilters.level === "All levels" || challenge.level === challengeFilters.level)
      && (!challengeFilters.hideSolved || status !== "solved");
  });
  const host = $("#challengeGrid");
  host.innerHTML = visible.length ? visible.map(challenge => {
    const id = challengeId(challenge);
    const status = challengeProgress[id] || "not-started";
    const statusText = status === "solved" ? "Solved" : status === "in-progress" ? "In progress" : "Not started";
    const actionText = status === "solved" ? "Review" : status === "in-progress" ? "Continue" : "Start in editor";
    return '<article class="challenge-card challenge-' + escapeHtml(challengeLanguage(challenge).toLowerCase().replace(/[^a-z0-9]+/g, "-")) + '"><div class="challenge-card-top"><span class="challenge-language">' + escapeHtml(challengeLanguage(challenge)) + '</span><span class="challenge-difficulty difficulty-' + escapeHtml(challenge.level.toLowerCase()) + '">' + escapeHtml(challenge.level) + '</span></div><h2>' + escapeHtml(challenge.title) + '</h2><p>' + escapeHtml(challenge.description) + '</p><div class="challenge-card-bottom"><span class="challenge-status ' + status + '">' + statusText + '</span><div class="challenge-card-actions"><button type="button" class="challenge-solve-toggle" data-solve-challenge="' + id + '" aria-label="' + (status === "solved" ? "Mark " + escapeHtml(challenge.title) + " not solved" : "Mark " + escapeHtml(challenge.title) + " solved") + '" title="' + (status === "solved" ? "Mark not solved" : "Mark solved") + '"><i class="fa-solid ' + (status === "solved" ? "fa-circle-check" : "fa-regular fa-circle-check") + '"></i></button><button type="button" class="challenge-open" data-open-challenge="' + id + '">' + actionText + '</button></div></div></article>';
  }).join("") : '<p class="challenge-empty">No challenges match these filters. Try another language or difficulty.</p>';
  $$("[data-open-challenge]", host).forEach(button => button.addEventListener("click", () => {
    const challenge = challenges.find(item => challengeId(item) === button.dataset.openChallenge);
    if (!challenge) return;
    if (challengeProgress[challengeId(challenge)] !== "solved") {
      challengeProgress[challengeId(challenge)] = "in-progress";
      saveChallengeProgress();
    }
    const fileName = challenge.fileName || (challenge.category === "CSS" ? "style.css" : challenge.category === "JavaScript" ? "script.js" : "index.html");
    const files = {};
    if (challenge.markup) files["index.html"] = { language: "html", code: challenge.markup };
    if (challenge.css) files["style.css"] = { language: "css", code: challenge.css };
    files[fileName] = { language: languageFor(fileName), code: challenge.code };
    loadFiles(files, fileName, challenge.title);
    renderChallenges();
    toast("Challenge loaded — make it your own");
  }));
  $$("[data-solve-challenge]", host).forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.solveChallenge;
    if (challengeProgress[id] === "solved") challengeProgress[id] = "in-progress";
    else challengeProgress[id] = "solved";
    saveChallengeProgress();
    renderChallenges();
  }));
}
function renderLearnChallenges() {
  const featuredTitles = [
    "Build a PHP profile",
    "Solve a DSA two-sum",
    "Build a React profile card",
    "Design a clear settings panel",
    "Harden a sign-in form",
    "Explore a tiny dataset"
  ];
  const featured = featuredTitles.map(title => challenges.find(challenge => challenge.title === title)).filter(Boolean);
  const host = $("#learnChallengeGrid");
  host.innerHTML = featured.map(challenge => {
    const language = challengeLanguage(challenge);
    return '<article class="learn-challenge-card"><div><span class="learn-challenge-topic">' + escapeHtml(language) + '</span><span class="learn-challenge-level">' + escapeHtml(challenge.level) + '</span></div><h3>' + escapeHtml(challenge.title) + '</h3><p>' + escapeHtml(challenge.description) + '</p><button type="button" data-learn-challenge="' + challengeId(challenge) + '">Try this challenge <i class="fa-solid fa-arrow-right"></i></button></article>';
  }).join("");
  $$("[data-learn-challenge]", host).forEach(button => button.addEventListener("click", () => {
    const challenge = challenges.find(item => challengeId(item) === button.dataset.learnChallenge);
    if (!challenge) return;
    challengeFilters.language = challengeLanguage(challenge);
    challengeFilters.level = "All levels";
    challengeFilters.hideSolved = false;
    renderChallenges();
    activateView("challenges");
  }));
}

const aiActionDetails = {
  Explain: "Explain this code in plain language. Point out the important parts and how the pieces work together.",
  Debug: "Look for bugs or edge cases. Explain the likely cause and show a minimal fix.",
  Optimize: "Suggest practical improvements for readability, speed, and maintainability. Preserve behavior.",
  Review: "Review this code for correctness, accessibility, security, and maintainability. List the most useful findings first.",
  "Write tests": "Write focused tests for the important behavior in this code. Include useful edge cases and explain how to run them.",
  Refactor: "Refactor this code for clarity and maintainability while preserving its behavior. Return the revised code and summarize the changes.",
  "Generate code": "Help me extend or generate code. Ask one concise clarification only if the request is too vague to implement safely.",
  "Think through this idea": "Help me think through this product or coding idea. Suggest a small, concrete next step and a practical implementation outline."
};
function appendAiMessage(type, text) {
  const host = $("#aiMessages");
  const row = document.createElement("div");
  if (type === "user") {
    row.className = "user-message";
    const bubble = document.createElement("p"); bubble.textContent = text; row.append(bubble);
  } else {
    row.className = "assistant-message";
    const avatar = document.createElement("span"); avatar.className = "assistant-avatar"; avatar.textContent = "✦";
    const bubble = document.createElement("p"); bubble.textContent = text; row.append(avatar, bubble);
  }
  host.append(row); host.scrollTop = host.scrollHeight;
}
async function askAI(action, prompt = "") {
  saveCurrent();
  const context = prompt || aiActionDetails[action] || action;
  appendAiMessage("user", action + (prompt ? ": " + prompt : ""));
  switchInspector("aiPanel");
  const placeholder = "Thinking…";
  appendAiMessage("assistant", placeholder);
  const reply = $("#aiMessages").lastElementChild.querySelector("p");
  const file = activeFile();
  try {
    const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, code: file.code, language: file.language, context }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The AI request did not work.");
    reply.textContent = result.answer || "No answer came back. Try asking in another way.";
  } catch (error) {
    reply.textContent = error.message;
    if (error.message.includes("GEMINI_API_KEY") || error.message.includes("not configured")) $("#aiStatus").textContent = "Add a Gemini API key in the server .env";
  }
  $("#aiMessages").scrollTop = $("#aiMessages").scrollHeight;
}

async function checkAccount() {
  try {
    const [accountResponse, configResponse] = await Promise.all([fetch("/api/me"), fetch("/api/config")]);
    const account = await accountResponse.json();
    const config = await configResponse.json();
    state.aiConfigured = !!config.aiConfigured;
    $("#aiStatus").textContent = state.aiConfigured ? "Your creative co-pilot" : "Add GEMINI_API_KEY to enable AI";
    updateAccountButton(account.user);
    $("#ghAccount").textContent = account.github ? "Connected as " + account.github.login + ". Your repositories are ready to load." : (config.githubConfigured ? "Connect your GitHub account to load your repositories." : "Add GitHub OAuth credentials to the server to connect an account.");
    $("#ghState").classList.toggle("connected", !!account.github);
    $("#ghState").innerHTML = account.github ? "<i></i> Connected" : "<i></i> Not connected";
  } catch {
    $("#aiStatus").textContent = "Local AI service is offline";
    $("#ghAccount").textContent = "CodeForge server is offline. Start the local server to connect services.";
    $("#ghState").innerHTML = "<i></i> Offline";
  }
}
async function apiJson(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || "Request failed: " + response.status);
  return result;
}
async function loadRepos() {
  $("#ghAccount").textContent = "Loading repositories…";
  try {
    const repos = await apiJson("/api/github/repos");
    state.github.repos = repos;
    $("#repoSelect").innerHTML = '<option value="">Choose a repository</option>' + repos.map(repo => '<option value="' + escapeHtml(repo.full_name) + '">' + escapeHtml(repo.full_name) + "</option>").join("");
    $("#ghAccount").textContent = repos.length + " repositories available. Choose one to see its branches.";
    if (repos.length) { $("#repoSelect").value = repos[0].full_name; await loadBranches(); }
  } catch (error) { $("#ghAccount").textContent = error.message; toast(error.message); }
}
async function loadBranches() {
  const full = $("#repoSelect").value;
  if (!full) return;
  const [owner, repo] = full.split("/");
  try {
    const branches = await apiJson("/api/github/branches/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo));
    $("#branchSelect").innerHTML = branches.map(branch => '<option value="' + escapeHtml(branch.name) + '">' + escapeHtml(branch.name) + "</option>").join("");
    await loadGitHubTree();
  } catch (error) { toast(error.message); }
}
async function loadGitHubTree() {
  const full = $("#repoSelect").value;
  const branch = $("#branchSelect").value;
  if (!full || !branch) return;
  const [owner, repo] = full.split("/");
  try {
    state.github.files = await apiJson("/api/github/tree/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "?branch=" + encodeURIComponent(branch));
    const host = $("#ghFiles");
    host.innerHTML = state.github.files.map(file => '<button class="github-file" data-path="' + escapeHtml(file.path) + '"><i class="' + fileIcon(file.path) + '"></i>' + escapeHtml(file.path) + "</button>").join("");
    $$(".github-file", host).forEach(button => button.addEventListener("click", () => { $("#ghPath").value = button.dataset.path; $$(".github-file", host).forEach(x => x.classList.toggle("selected", x === button)); }));
  } catch (error) { toast(error.message); }
}
async function loadGitHubFile() {
  const full = $("#repoSelect").value;
  const path = $("#ghPath").value.trim();
  const branch = $("#branchSelect").value;
  if (!full || !path) return toast("Choose a repository and file first");
  const [owner, repo] = full.split("/");
  try {
    const result = await apiJson("/api/github/file/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "?path=" + encodeURIComponent(path) + "&branch=" + encodeURIComponent(branch));
    state.files[path] = { language: languageFor(path), code: result.content, sha: result.sha };
    switchFile(path); activateView("workspace");
    $("#ghLog").textContent = "Opened " + path + " from " + full + " (" + branch + ").";
  } catch (error) { $("#ghLog").textContent = error.message; toast(error.message); }
}
async function pushGitHubFile() {
  saveCurrent();
  const full = $("#repoSelect").value;
  const path = $("#ghPath").value.trim() || state.current;
  const branch = $("#branchSelect").value;
  const message = $("#ghMessage").value.trim() || "Update from CodeForge";
  if (!full) return toast("Choose a GitHub repository first");
  const [owner, repo] = full.split("/");
  const file = state.files[state.current];
  try {
    const result = await apiJson("/api/github/file", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner, repo, path, branch, message, content: file.code, sha: file.sha }) });
    if (result.content?.sha) file.sha = result.content.sha;
    $("#ghLog").textContent = "Committed " + path + " to " + full + " on " + branch + ".";
    toast("Changes pushed to GitHub");
  } catch (error) { $("#ghLog").textContent = error.message; toast(error.message); }
}

function showAuth(mode = "login") {
  $("#authMsg").textContent = "";
  $("#authNameWrap").hidden = mode !== "register";
  $("#authModal").classList.add("show");
  $("#authModal").setAttribute("aria-hidden", "false");
  $("#authEmail").focus();
}
function updateAccountButton(user) {
  const label = user ? "Signed in as " + user.name : "Sign in";
  $("#avatarButton").title = label;
  $("#avatarButton").setAttribute("aria-label", label);
}
function closeAuth() {
  $("#authModal").classList.remove("show");
  $("#authModal").setAttribute("aria-hidden", "true");
}
async function authenticate(endpoint, body) {
  try {
    const result = await apiJson(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    $("#authMsg").textContent = "You’re signed in. Welcome to CodeForge.";
    $("#authMsg").className = "ok";
    updateAccountButton(result.user);
    setTimeout(closeAuth, 700);
  } catch (error) { $("#authMsg").textContent = error.message; $("#authMsg").className = ""; }
}

const commands = [
  { label: "Open workspace", icon: "fa-solid fa-code", shortcut: "G W", run: () => activateView("workspace") },
  { label: "Open creative tools", icon: "fa-solid fa-wand-magic-sparkles", shortcut: "G T", run: () => activateView("studio") },
  { label: "Open learning library", icon: "fa-solid fa-compass", shortcut: "G L", run: () => activateView("library") },
  { label: "Ship to GitHub", icon: "fa-brands fa-github", shortcut: "G S", run: () => activateView("github") },
  { label: "Run current file", icon: "fa-solid fa-play", shortcut: "Ctrl ↵", run: () => { activateView("workspace"); runCode(); } },
  { label: "Create a new file", icon: "fa-regular fa-file", shortcut: "", run: addFile },
  { label: "Save project", icon: "fa-solid fa-cloud-arrow-up", shortcut: "Ctrl S", run: () => saveProject(true) },
  { label: "Explain this code with AI", icon: "fa-regular fa-lightbulb", shortcut: "", run: () => { activateView("workspace"); askAI("Explain"); } },
  { label: "Remix the color palette", icon: "fa-solid fa-palette", shortcut: "", run: () => { activateView("studio"); remixPalette(); } },
  { label: "Open motion lab", icon: "fa-solid fa-wand-magic-sparkles", shortcut: "", run: () => { activateView("studio"); $("#motionCanvas").scrollIntoView({ behavior: "smooth", block: "center" }); } },
  { label: "Rename project", icon: "fa-regular fa-pen-to-square", shortcut: "", run: renameProject }
];
function openCommandPalette() {
  $("#commandOverlay").classList.add("show");
  $("#commandOverlay").setAttribute("aria-hidden", "false");
  $("#commandSearch").value = "";
  renderCommands("");
  $("#commandSearch").focus();
}
function closeCommandPalette() {
  $("#commandOverlay").classList.remove("show");
  $("#commandOverlay").setAttribute("aria-hidden", "true");
  $("#commandTrigger").focus();
}
function renderCommands(query) {
  const filtered = commands.filter(command => command.label.toLowerCase().includes(query.toLowerCase()));
  $("#commandList").innerHTML = filtered.length ? '<div class="command-section-label">SUGGESTED ACTIONS</div>' + filtered.map((command, index) => '<button class="command-item ' + (index === state.commandIndex ? "selected" : "") + '" data-command-index="' + commands.indexOf(command) + '"><i class="' + command.icon + '"></i>' + command.label + (command.shortcut ? '<kbd>' + command.shortcut + "</kbd>" : "") + "</button>").join("") : '<div class="command-section-label">No matching commands</div>';
  $$("[data-command-index]").forEach(button => button.addEventListener("click", () => runCommand(Number(button.dataset.commandIndex))));
}
function runCommand(index) {
  const command = commands[index];
  if (!command) return;
  closeCommandPalette();
  command.run();
}

function wireEvents() {
  $$("[data-view]").forEach(button => button.addEventListener("click", () => activateView(button.dataset.view)));
  $("#brandHome").addEventListener("click", () => activateView("home"));
  $("#mobileMenu").addEventListener("click", () => $("#primaryNav").classList.toggle("open"));
  $("#commandTrigger").addEventListener("click", openCommandPalette);
  $("#commandSearch").addEventListener("input", event => { state.commandIndex = 0; renderCommands(event.target.value); });
  $("#commandOverlay").addEventListener("click", event => { if (event.target === $("#commandOverlay")) closeCommandPalette(); });
  $("#commandSearch").addEventListener("keydown", event => {
    const items = $$(".command-item");
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!items.length) return;
      const change = event.key === "ArrowDown" ? 1 : -1;
      state.commandIndex = (state.commandIndex + change + items.length) % items.length;
      renderCommands(event.currentTarget.value);
    }
    if (event.key === "Enter") { event.preventDefault(); runCommand(Number($(".command-item.selected")?.dataset.commandIndex)); }
  });
  $("#runBtn").addEventListener("click", runCode);
  $("#downloadBtn").addEventListener("click", downloadProject);
  $("#newFileBtn").addEventListener("click", addFile);
  $("#projectMenuBtn").addEventListener("click", renameProject);
  $("#projectNameButton").addEventListener("click", renameProject);
  $("#projectInfoBtn").addEventListener("click", () => toast("Your files autosave to this browser. Use Export to download a backup."));
  $("#formatBtn").addEventListener("click", formatCode);
  $("#copyFileBtn").addEventListener("click", () => { saveCurrent(); copyText(activeFile().code, state.current); });
  $("#languageSelect").addEventListener("change", event => {
    activeFile().language = event.target.value;
    if (state.editor) monaco.editor.setModelLanguage(state.editor.getModel(), activeFile().language);
    renderEditorMetadata(); queueAutosave(); updatePreview();
  });
  $$(".inspector-tab").forEach(button => button.addEventListener("click", () => switchInspector(button.dataset.panel)));
  $("#refreshPreview").addEventListener("click", updatePreview);
  $$(".viewport-button").forEach(button => button.addEventListener("click", () => {
    $$(".viewport-button").forEach(item => item.classList.toggle("active", item === button));
    $("#preview").style.width = button.dataset.viewport;
  }));
  $("#clearConsole").addEventListener("click", clearConsole);
  $$("[data-ai]").forEach(button => button.addEventListener("click", () => askAI(button.dataset.ai)));
  $("#aiSend").addEventListener("click", () => {
    const prompt = $("#aiPrompt").value.trim();
    if (!prompt) return;
    $("#aiPrompt").value = "";
    askAI("Pair with me", prompt);
  });
  $("#aiPrompt").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); $("#aiSend").click(); }
  });
  $$(".sidebar-tool").forEach(button => button.addEventListener("click", () => {
    activateView("studio");
    const target = button.dataset.tool === "palette" ? "#shufflePalette" : button.dataset.tool === "gradient" ? "#gradientPreview" : button.dataset.tool === "motion" ? "#motionCanvas" : "#snippetList";
    $(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  $("#shufflePalette").addEventListener("click", remixPalette);
  $("#copyPalette").addEventListener("click", () => copyText(state.palette.join(", "), "Palette"));
  ["#gradientColorA", "#gradientColorB", "#gradientAngle"].forEach(selector => $(selector).addEventListener("input", updateGradient));
  $("#copyGradient").addEventListener("click", () => copyText($("#gradientCode").textContent, "Gradient CSS"));
  $("#applyGradient").addEventListener("click", () => appendCss(":root {\n  --forge-gradient: " + updateGradient() + ";\n}\n.gradient-background {\n  background: var(--forge-gradient);\n}", "Gradient added to style.css"));
  ["#shadowBlur", "#shadowSpread", "#shadowOpacity"].forEach(selector => $(selector).addEventListener("input", updateShadow));
  $("#copyShadow").addEventListener("click", () => copyText($("#shadowCode").textContent, "Shadow CSS"));
  $("#applyShadow").addEventListener("click", () => appendCss(".soft-shadow {\n  " + updateShadow() + ";\n}", "Shadow added to style.css"));
  $("#motionPreset").addEventListener("change", updateMotion);
  $("#motionDuration").addEventListener("input", updateMotion);
  $("#replayMotion").addEventListener("click", replayMotion);
  $("#copyMotion").addEventListener("click", () => copyText(motionCss(), "Animation CSS"));
  $("#applyMotion").addEventListener("click", () => appendCss(motionCss(), "Animation added to style.css"));
  ["#markShape", "#markColor", "#markAccent"].forEach(selector => $(selector).addEventListener("input", updateMark));
  $("#downloadMark").addEventListener("click", () => downloadBlob(updateMark(), "codeforge-mark.svg", "image/svg+xml"));
  $("#hideSolvedChallenges").addEventListener("change", event => {
    challengeFilters.hideSolved = event.target.checked;
    renderChallenges();
  });
  $("#loadRepos").addEventListener("click", loadRepos);
  $("#repoSelect").addEventListener("change", loadBranches);
  $("#branchSelect").addEventListener("change", loadGitHubTree);
  $("#loadGhFile").addEventListener("click", loadGitHubFile);
  $("#pushGh").addEventListener("click", pushGitHubFile);
  $("#avatarButton").addEventListener("click", () => showAuth("login"));
  $(".modal-close").addEventListener("click", closeAuth);
  $(".modal-backdrop").addEventListener("click", closeAuth);
  $("#registerBtn").addEventListener("click", () => authenticate("/api/auth/register", { name: $("#authName").value.trim(), email: $("#authEmail").value.trim(), password: $("#authPassword").value }));
  $("#loginSubmit").addEventListener("click", () => authenticate("/api/auth/login", { email: $("#authEmail").value.trim(), password: $("#authPassword").value }));
  document.addEventListener("keydown", event => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    if (modifier && event.key.toLowerCase() === "k") { event.preventDefault(); openCommandPalette(); }
    if (modifier && event.key.toLowerCase() === "s") { event.preventDefault(); saveProject(true); }
    if (modifier && event.key === "Enter") { event.preventDefault(); runCode(); }
    if (event.key === "Escape") { closeCommandPalette(); closeAuth(); }
  });
}

function restoreProject() {
  try {
    const saved = JSON.parse(localStorage.getItem("codeforge_next_project") || "null");
    if (saved && saved.files && typeof saved.files === "object") {
      Object.entries(saved.files).forEach(([name, file]) => {
        if (name !== "__proto__" && file && typeof file.code === "string") state.files[name] = { language: file.language || languageFor(name), code: file.code, sha: file.sha };
      });
      if (state.files[saved.current]) state.current = saved.current;
      if (typeof saved.projectName === "string" && saved.projectName) state.projectName = saved.projectName;
    }
  } catch { localStorage.removeItem("codeforge_next_project"); }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function init() {
  restoreProject();
  renderPalette(paletteSets[0]);
  updateGradient(); updateShadow(); updateMotion(); updateMark(); renderSnippets(); renderLibrary(); renderChallenges(); renderLearnChallenges();
  wireEvents();
  setupEditor();
  checkAccount();
  const query = new URLSearchParams(location.search).get("github");
  if (query === "connected") { toast("GitHub connected"); history.replaceState({}, "", location.pathname); checkAccount(); }
  if (query === "missing") { toast("Add GitHub OAuth credentials to the server .env"); history.replaceState({}, "", location.pathname); }
}

init();

const tutorials = [
  {
    name: "C Programming",
    category: "Programming",
    hindi: "CodeWithHarry C programming full course Hindi",
    english: "freeCodeCamp C programming full course"
  },
  {
    name: "C++ Programming",
    category: "Programming",
    hindi: "CodeWithHarry C++ full course Hindi",
    english: "freeCodeCamp C++ programming full course"
  },
  {
    name: "Java Programming",
    category: "Programming",
    hindi: "Apna College Java programming full course Hindi",
    english: "freeCodeCamp Java programming full course"
  },
  {
    name: "Python Programming",
    category: "Programming",
    hindi: "CodeWithHarry Python full course Hindi",
    english: "freeCodeCamp Python full course beginners"
  },
  {
    name: "SQL & Databases",
    category: "Database",
    hindi: "CodeWithHarry SQL full course Hindi",
    english: "freeCodeCamp SQL full course beginners"
  },
  {
    name: "HTML & CSS",
    category: "Web Development",
    hindi: "CodeWithHarry HTML CSS full course Hindi",
    english: "freeCodeCamp HTML CSS full course beginners"
  },
  {
    name: "JavaScript",
    category: "Web Development",
    hindi: "CodeWithHarry JavaScript full course Hindi",
    english: "freeCodeCamp JavaScript full course beginners"
  },
  {
    name: "React.js",
    category: "Web Development",
    hindi: "CodeWithHarry React JS course Hindi",
    english: "freeCodeCamp React JS full course"
  },
  {
    name: "Node.js",
    category: "Web Development",
    hindi: "Chai aur Code Node.js backend course Hindi",
    english: "freeCodeCamp Node.js full course"
  },
  {
    name: "PHP",
    category: "Web Development",
    hindi: "CodeWithHarry PHP full course Hindi",
    english: "freeCodeCamp PHP full course beginners"
  },
  {
    name: "UI/UX Design",
    category: "Design",
    hindi: "UI UX design full course Hindi Figma",
    english: "freeCodeCamp UI UX design Figma full course"
  },
  {
    name: "Figma",
    category: "Design",
    hindi: "Figma tutorial full course Hindi",
    english: "Figma official beginner tutorial"
  },
  {
    name: "Data Structures & Algorithms",
    category: "Programming",
    hindi: "Apna College DSA full course Hindi",
    english: "freeCodeCamp data structures algorithms full course"
  },
  {
    name: "AI & Machine Learning",
    category: "AI",
    hindi: "CampusX machine learning full course Hindi",
    english: "freeCodeCamp machine learning full course"
  },
  {
    name: "Data Analytics",
    category: "Data",
    hindi: "Codebasics data analytics full course Hindi",
    english: "Alex The Analyst data analyst full course"
  },
  {
    name: "Cybersecurity",
    category: "Security",
    hindi: "cybersecurity full course Hindi beginners",
    english: "freeCodeCamp cybersecurity full course beginners"
  },
  {
    name: "Git & GitHub",
    category: "Tools",
    hindi: "CodeWithHarry Git GitHub tutorial Hindi",
    english: "freeCodeCamp Git and GitHub full course"
  },
  {
    name: "C++ OOP",
    category: "Programming",
    hindi: "C++ OOP full course Hindi",
    english: "freeCodeCamp C++ object oriented programming"
  }
];

function createTutorialCard(tutorial) {
  const card = document.createElement("article");
  card.className = "tutorial-card tutorial-resource-card";

  const hindiURL =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(tutorial.hindi);

  const englishURL =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(tutorial.english);

  card.innerHTML = `
    <div class="tutorial-icon">🎓</div>
    <span class="tutorial-category">
      ${tutorial.category}
    </span>

    <h3>${tutorial.name}</h3>
    <p>Choose your preferred language and start learning for free.</p>

    <div class="tutorial-language-buttons">
      <a class="language-btn hindi-btn"
         href="${hindiURL}"
         target="_blank"
         rel="noopener noreferrer">
         🇮🇳 Learn in Hindi ↗
      </a>

      <a class="language-btn english-btn"
         href="${englishURL}"
         target="_blank"
         rel="noopener noreferrer">
         🌎 Learn in English ↗
      </a>
    </div>
  `;

  return card;
}

function displayTutorials(list = tutorials) {
  const container = document.getElementById("tutorialGrid");

  if (!container) {
    console.error('Add an HTML element with id="tutorialGrid".');
    return;
  }

  container.replaceChildren();

  list.forEach(tutorial => {
    container.appendChild(createTutorialCard(tutorial));
  });
}

// Display all tutorials when the page loads.
document.addEventListener("DOMContentLoaded", () => {
  displayTutorials();
});
