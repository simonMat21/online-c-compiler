async function compileCode(code, testCases) {
  let finalOutput = "";
  let resultList = [];
  for (let i = 0; i < testCases.length; i++) {
    const { input, expected, element } = testCases[i];

    try {
      // const response = await fetch(process.env.COMPILER_API, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ code, input }),
      // });
      const response = await fetch(process.env.COMPILER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "C",
          title: "43nzrzunz",
          version: "latest",
          mode: "c_cpp",
          description: null,
          extension: "c",
          languageType: "programming",
          active: true,
          properties: {
            language: "c",
            docs: true,
            tutorials: true,
            cheatsheets: true,
            filesEditable: true,
            filesDeletable: true,
            files: [
              {
                name: "Main.c",
                content: code,
              },
            ],

            stdin: input,
          },
          language: "c",
          visibility: "public",
          _id: "43nzrzunz",
          user: null,
        }),
      });

      const result = await response.json();
      const actual = result.stdout || result.error || "No output";
      const passed = actual.trim() === expected.trim();
      resultList.push(passed);
      const statusClass = passed ? "result-passed" : "result-failed";
      const resultText = passed ? "✅ Passed" : "❌ Failed";

      finalOutput += `🧪 Test Case ${
        i + 1
      }:\n\nInput:\n${input}\nExpected:\n${expected}\n\nActual:\n${actual}\n\nResult: <span class="${statusClass}">${resultText}</span>\n\n-------------------------------------------------------\n\n`;
    } catch (err) {
      finalOutput += `❌ Test Case ${i + 1}:
      Error: ${err.message}

      `;
    }
  }

  return [finalOutput, resultList];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { code, testCases } = req.body;
  // Use secret (from .env) to talk to EmailJS or any other service
  const compiler_api = process.env.COMPILER_API;

  const [output, resultList] = await compileCode(code, testCases);

  // Dummy example: just echo back
  res.status(200).json({
    output: output,
    resultList: resultList,
  });
}
