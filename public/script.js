require.config({
  paths: { vs: "https://unpkg.com/monaco-editor@0.45.0/min/vs" },
});
require(["vs/editor/editor.main"], function () {
  window.editor = monaco.editor.create(document.getElementById("editor"), {
    value: `#include <stdio.h>\nint main() {\n    char name[20];\n    scanf("%s", name);\n    printf("Hello %s, ready to code in C??\\n", name);\n    return 0;\n}`,
    language: "c",
    theme: "vs-dark",
    fontSize: 14,
    automaticLayout: true,
  });
});

document
  .getElementById("addTestCaseBtn")
  .addEventListener("click", addTestCase);
document.getElementById("runBtn").addEventListener("click", compileCode);
document.getElementById("testClassBtn").addEventListener("click", () => {
  switchTab("test-cases-section");
});
document.getElementById("outputBtn").addEventListener("click", () => {
  switchTab("output-section");
});

async function GetVales() {
  const response = await fetch("/api/backend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const result = await response.json();
  alert(result.keyUsed);
}

function switchTab(id) {
  document
    .querySelectorAll("#tabs button")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll("#side-panel > div")
    .forEach((div) => div.classList.remove("active"));
  document.querySelector(`#${id}`).classList.add("active");
  const tabButton = document.querySelector(`#tabs button[data-tab="${id}"]`);
  if (tabButton) {
    tabButton.classList.add("active");
  }
}

function addTestCase(input = "", expected = "") {
  if (typeof input !== "string") input = "";
  if (typeof expected !== "string") expected = "";
  const container = document.getElementById("test-cases");
  const div = document.createElement("div");
  const testCaseCount = container.children.length + 1;
  div.innerHTML = `
                <div class="test-case-label">Test Case ${testCaseCount}</div>
                <textarea placeholder="Input">${input}</textarea>
                <textarea placeholder="Expected Output">${expected}</textarea>
              `;
  container.appendChild(div);
}

function getTestCases() {
  const divs = Array.from(document.getElementById("test-cases").children);
  return divs.map((div) => {
    const [label, inputArea, expectedArea] = div.querySelectorAll(
      ".test-case-label, textarea"
    );
    return {
      input: inputArea.value.trim(),
      expected: expectedArea.value.trim(),
      element: div,
    };
  });
}

function addPrintfAfterScanf(code) {
  const lines = code.split("\n");
  const updatedLines = [];

  const scanfRegex = /scanf\s*\(\s*"([^"]+)"\s*,\s*([^)]+)\)/;

  for (let i = 0; i < lines.length; i++) {
    updatedLines.push(lines[i]);

    const match = lines[i].match(scanfRegex);
    if (match) {
      const formatString = match[1]; // e.g., "%d %f %s"
      const args = match[2] // e.g., "&x, &y, name"
        .split(",")
        .map((arg) => arg.trim().replace(/^&/, "")); // remove leading &

      const specifiers = [...formatString.matchAll(/%[a-zA-Z]/g)].map(
        (m) => m[0]
      );

      if (args.length === specifiers.length) {
        const printfFormat =
          specifiers
            .map((spec) => {
              if (spec === "%c") return "%c";
              if (spec === "%s") return "%s";
              if (spec === "%f" || spec === "%lf") return "%f";
              return "%d"; // default fallback for %d, %u, %ld, etc.
            })
            .join(" ") + "\\n";

        const printfLine = `printf("${printfFormat}", ${args.join(", ")});`;
        updatedLines.push(printfLine);
      } else {
        updatedLines.push(
          "// ⚠️ Could not auto-generate printf due to format mismatch"
        );
      }
    }
  }

  return updatedLines.join("\n");
}

function lineBreakAfterScanf(code) {
  const lines = code.split("\n");
  const updatedLines = [];

  const scanfRegex = /scanf\s*\(\s*"([^"]+)"\s*,\s*([^)]+)\)/;

  for (let i = 0; i < lines.length; i++) {
    updatedLines.push(lines[i]);

    const match = lines[i].match(scanfRegex);
    if (match) {
      const printfLine = `printf("\\n");`;
      updatedLines.push(printfLine);
    }
  }

  return updatedLines.join("\n");
}

async function compileCode() {
  const code = document.getElementById("subscribeCheckbox").checked
    ? addPrintfAfterScanf(editor.getValue())
    : lineBreakAfterScanf(editor.getValue());

  const testCases = getTestCases();

  document.getElementById("loading-overlay").style.display = "flex";
  const response = await fetch("/api/backend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, testCases }),
  });

  const result = await response.json();
  const finalOutput = result.output || result.error || "No output";
  const resultList = result.resultList || result.error || "No output";

  for (let i = 0; i < testCases.length; i++) {
    const { input, expected, element } = testCases[i];
    const passed = resultList[i];
    element.classList.remove("passed", "failed");
    element.classList.add(passed ? "passed" : "failed");
  }

  document.getElementById("output").innerHTML = finalOutput;
  document.getElementById("loading-overlay").style.display = "none";
  switchTab("output-section");
}

window.onload = () => {
  addTestCase("Alice", "Hello Alice, ready to code in C??");

  const resizer = document.getElementById("resizer");
  const editorContainer = document.getElementById("editor-container");

  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    editorContainer.style.width = newWidth + "px";
  });

  window.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = "default";
  });
};
