document.getElementById("save").addEventListener("click", () => {
  const key = document.getElementById("key").value.trim();
  if (!key) {
    alert("⚠️ Enter the song name!");
    return;
  }
  chrome.storage.sync.set({ apiKey: key }, () => {
    alert("✅ Playlist Saved!");
  });
});
