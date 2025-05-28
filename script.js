async function submitFeedback() {
  const message = document.getElementById("feedback-text").value.trim();

  const response = await fetch("/api/backend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const result = await response.json();
  alert(result.message);
}
