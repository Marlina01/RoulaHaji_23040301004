//sepet_utils.js
function sepetOku() {
  return JSON.parse(localStorage.getItem("sepet") || "[]");
}

function sepetYaz(sepet) {
  localStorage.setItem("sepet", JSON.stringify(sepet));
  window.dispatchEvent(new Event("sepetGuncellendi"));
}

function sepetAdetHesapla() {
  return sepetOku().reduce((t, u) => t + Number(u.adet || 0), 0);
}

function toast(m) {
  const d = document.createElement("div");
  d.className = "position-fixed top-0 start-50 translate-middle-x mt-4";
  d.style.zIndex = 9999;
  d.innerHTML = `
    <div class="bg-brand-primary shadow-lg px-4 py-3 d-flex align-items-center gap-2" 
         style="font-size:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1)">
      ${m}
    </div>
  `;
  document.body.appendChild(d);
  setTimeout(() => {
    d.style.transition = "opacity 0.5s";
    d.style.opacity = "0";
    setTimeout(() => d.remove(), 500);
  }, 2000);
}

