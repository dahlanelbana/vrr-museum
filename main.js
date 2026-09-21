// Membuat pilar dengan detail dasar
AFRAME.registerComponent("pillar", {
  init: function () {
    const el = this.el;

    const base = document.createElement("a-cylinder");
    base.setAttribute("position", "0 -2.35 0");
    base.setAttribute("radius", "0.78");
    base.setAttribute("height", "0.35");
    base.setAttribute("material", "color: #b8aa98; roughness: 0.35");
    el.appendChild(base);

    const body = document.createElement("a-cylinder");
    body.setAttribute("position", "0 0 0");
    body.setAttribute("radius", "0.5");
    body.setAttribute("height", "5");
    body.setAttribute("material", "color: #c8bbaa; roughness: 0.42");
    body.setAttribute("shadow", "cast: true; receive: true");
    el.appendChild(body);

    const top = document.createElement("a-cylinder");
    top.setAttribute("position", "0 2.55 0");
    top.setAttribute("radius", "0.8");
    top.setAttribute("height", "0.3");
    top.setAttribute("material", "color: #b8aa98; roughness: 0.35");
    el.appendChild(top);
  }
});

// Membuat tanaman dekorasi
AFRAME.registerComponent("plant", {
  init: function () {
    const el = this.el;

    const pot = document.createElement("a-cylinder");
    pot.setAttribute("position", "0 0.55 0");
    pot.setAttribute("radius", "0.62");
    pot.setAttribute("height", "1.1");
    pot.setAttribute("material", "color: #514038; roughness: 0.75");
    el.appendChild(pot);

    const foliage = document.createElement("a-sphere");
    foliage.setAttribute("position", "0 1.75 0");
    foliage.setAttribute("scale", "1.15 1.35 1.15");
    foliage.setAttribute("material", "color: #2f5639; roughness: 0.9");
    foliage.setAttribute("shadow", "cast: true; receive: true");
    el.appendChild(foliage);

    const foliage2 = document.createElement("a-sphere");
    foliage2.setAttribute("position", "0.45 1.55 0.25");
    foliage2.setAttribute("scale", "0.7 0.8 0.7");
    foliage2.setAttribute("material", "color: #3e7049; roughness: 0.9");
    el.appendChild(foliage2);
  }
});

// Sistem informasi objek
AFRAME.registerComponent("museum-object", {
  schema: {
    title: { type: "string", default: "Objek Museum" },
    description: { type: "string", default: "Tidak ada deskripsi." }
  },

  init: function () {
    this.el.classList.add("interactive-object");

    this.el.addEventListener("mouseenter", () => {
      this.el.setAttribute("scale", "1.03 1.03 1.03");
    });

    this.el.addEventListener("mouseleave", () => {
      this.el.setAttribute("scale", "1 1 1");
    });

    this.el.addEventListener("click", () => {
      showDetail(this.data.title, this.data.description);
    });
  }
});

function showDetail(title, description) {
  document.getElementById("detail-title").textContent = title;
  document.getElementById("detail-description").textContent = description;
  document.getElementById("detail-panel").classList.remove("hidden");
}

document.getElementById("close-detail").addEventListener("click", () => {
  document.getElementById("detail-panel").classList.add("hidden");
});

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "e") {
    const objects = document.querySelectorAll(".interactive-object");
    let nearest = null;
    let nearestDistance = Infinity;

    const camera = document.querySelector("#camera");
    const cameraPosition = camera.object3D.getWorldPosition(new THREE.Vector3());

    objects.forEach((object) => {
      const position = object.object3D.getWorldPosition(new THREE.Vector3());
      const distance = cameraPosition.distanceTo(position);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = object;
      }
    });

    if (nearest && nearestDistance < 5.5) {
      showDetail(nearest.components["museum-object"].data.title,
                 nearest.components["museum-object"].data.description);
    }
  }
});

const scene = document.querySelector("a-scene");

scene.addEventListener("loaded", () => {
  setTimeout(() => {
    document.getElementById("loading").classList.add("hidden");
  }, 900);
});
