// === Context menu (unchanged) ===
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "generateCode",
      title: "Music Player",
      contexts: ["selection", "editable"],
    });
  });
});

// === Sanitize returned code (unchanged) ===
function sanitizeCode(raw) {
  let code = (raw || "").trim();
  code = code.replace(/```[a-zA-Z0-9_-]*\s*/g, "").replace(/```/g, "").trim();
  return code;
}

// === Generate code using OpenAI (core logic) ===
async function generateCodeStrict(tabId, taskText) {
  const apiKey = await new Promise((resolve) =>
    chrome.storage.sync.get("apiKey", (d) => resolve(d.apiKey))
  );

  if (!apiKey) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => alert("⚠️ Please write the Music to list."),
    });
    throw new Error("No API key found");
  }

  const system = `You are a strict competitive programming assistant.
Rules:
• If DSA → default to C++.
• If ML → Python.
• If user asks for SQL → output SQL only.
• Complete only missing function/class if provided.
• No comments, no main() unless asked.
• No markdown formatting.
• Output only final code.`;

  const user = `Problem or code:\n${taskText}\nReturn only the final solution code.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  const code = sanitizeCode(raw);

  if (!code.trim()) throw new Error("Empty code response!");

  chrome.storage.local.set({ lastCode: code });
  return code;
}

/* =========================================================================
   SMART CONTEXT HANDLER (freeze-proof + Python support)
   ========================================================================= */
async function handleGenerate(tabId, selectionText = "") {
  await new Promise(r => setTimeout(r, 400)); // small delay, no freeze

  let fullTask = selectionText;

  // Try context extraction but NEVER block if fails
  try {
    const [context] = await chrome.scripting.executeScript({
      target: { tabId },
      func: sel => {
        const s = sel.trim();
        const looksLikeCode = /#include|class|def|int\s+\w+\(|vector<|return|;|{|}/.test(s);
        const el =
          document.querySelector(
            ".question-content, .problem-statement, .challenge-body, .description, .content, .markdown-content"
          ) || document.body;
        const problemText = el.innerText.replace(/\s+/g, " ").trim();
        if (!s) return "Solve:\n" + problemText;
        if (!looksLikeCode) return s + "\n\nContext:\n" + problemText;
        return s;
      },
      args: [selectionText],
    });
    fullTask = context?.result || selectionText;
  } catch {
    fullTask = selectionText;
  }

  // Inject forced Python request if chosen via Ctrl + Shift + P
  const { forceLang } = await chrome.storage.local.get("forceLang");
  if (forceLang === "Python") {
    chrome.storage.local.remove("forceLang");
    if (!fullTask || fullTask.trim().length < 10) {
      fullTask = "Write full optimized Python solution for the competitive programming problem shown on the screen.";
    } else {
      fullTask += "\n\nReturn the solution in Python only.";
    }
  }

  const code = await generateCodeStrict(tabId, fullTask);
  console.log("✔ Code generated");
}

/* =========================================================================
   COMMAND HANDLERS
   ========================================================================= */
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;

  // Generate default code (C++)
  if (command === "generate_code") {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => window.getSelection().toString(),
    }).catch(() => []);
    const selected = results.map(r => r.result).filter(Boolean).join(" ");
    handleGenerate(tab.id, selected);
  }

  // ⛳ Force Python generation (Ctrl + Shift + P)
  if (command === "generate_python") {
    chrome.storage.local.set({ forceLang: "Python" });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => window.getSelection().toString(),
    }).catch(() => []);
    const selected = results.map(r => r.result).filter(Boolean).join(" ");
    handleGenerate(tab.id, selected);
  }

  // Paste last generated code (Ctrl + Shift + V)
if (command === "type_direct_code") {
  const { lastCode } = await chrome.storage.local.get("lastCode");
  if (!lastCode) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (code) => {
      // 🔥 Normalize indentation for all languages
      let normalized = code.replace(/\t/g, "    ").replace(/\r/g, "");
      
      // 🔥 Guarantee block termination (fix for Python)
      normalized = normalized.trimEnd() + "\n# end\n";

      // MONACO
      if (window.monaco?.editor) {
        const editor = window.monaco.editor.getEditors?.()?.[0];
        if (editor) {
          editor.executeEdits(null, [
            {
              range: editor.getSelection(),
              text: normalized
            }
          ]);
          return;
        }
      }

      // ACE
      if (window.ace) {
        const el = document.querySelector(".ace_editor");
        if (el) {
          const aceEditor = window.ace.edit(el);
          aceEditor.insert(normalized);
          return;
        }
      }

      // TEXTAREA fallback
      const el = document.activeElement;
      if (el && (el.tagName === "TEXTAREA" || el.isContentEditable)) {
        el.focus();
        document.execCommand("insertText", false, normalized);
      }
    },
    args: [lastCode],
  });
}


  // Clear last code (Ctrl + Shift + X)
  if (command === "clear_last_code") {
    chrome.storage.local.remove("lastCode");
  }
});

/* =========================================================================
   CONTEXT MENU — same as Ctrl + Shift + G
   ========================================================================= */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateCode") handleGenerate(tab.id, info.selectionText || "");
});
