document.getElementById("health-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const water = document.getElementById("water").value;
  const sleep = document.getElementById("sleep").value;
  const exercise = document.getElementById("exercise").value;

  if (water && sleep && exercise) {
    const list = document.getElementById("progress-list");

    const li = document.createElement("li");
    li.textContent = `💧 ${water} L | 😴 ${sleep} h | 🏃 ${exercise} min`;
    
    list.appendChild(li);
    li.scrollIntoView({ behavior: "smooth" });

    document.getElementById("health-form").reset();
  }
});
