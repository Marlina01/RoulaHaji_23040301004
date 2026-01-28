//odeme.js
function sepetOku() { return JSON.parse(localStorage.getItem("sepet") || "[]"); }

function ozetBas() {
  const ozet = document.getElementById("ozet");
  const toplamEl = document.getElementById("toplam");
  const s = sepetOku();

  let toplam = 0;
  ozet.innerHTML = "";

  s.forEach(u => {
    const t = Number(u.fiyat) * Number(u.adet);
    toplam += t;
    const div = document.createElement("div");
    div.className = "d-flex justify-content-between small mb-1";
    div.innerHTML = `<span>${u.ad} x${u.adet}</span><span>${t.toFixed(2)} TL</span>`;
    ozet.appendChild(div);
  });

  toplamEl.textContent = toplam.toFixed(2);
}

// PLZ -> Şehir Otomatik Doldurma (Zippopotam.us API)
const pkInput = document.getElementById("adresPK");
const sehirInput = document.getElementById("adresSehir");
const ulkeInput = document.getElementById("adresUlke"); // Ülke alanı varsa

pkInput.addEventListener("input", async (e) => {
  const pl = e.target.value.trim();
  if (pl.length === 5 && /^\d+$/.test(pl)) {
    try {
      // Varsayılan olarak Türkiye (TR) deneriz. Kullanıcı ülkeyi değiştirirse ona göre kodlanabilir ama şimdilik TR.
      const res = await fetch(`https://api.zippopotam.us/tr/${pl}`);
      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          sehirInput.value = data.places[0]["place name"];
          // Şehir alanı dolu olduğu için kullanıcıya görsel ipucu verebiliriz (ör: yeşil kenarlık)
          sehirInput.classList.add("is-valid");
          setTimeout(() => sehirInput.classList.remove("is-valid"), 2000);
        }
      }
    } catch (err) {
      console.log("ZIP API Hatası:", err);
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  ozetBas();

  // Ödeme Tipi Değişince Kart Alanını Göster/Gizle
  const odemeTipiEl = document.getElementById("odemeTipi");
  const kartDiv = document.getElementById("kartBilgileriMain");

  odemeTipiEl.addEventListener("change", (e) => {
    if (e.target.value === "Kart") {
      kartDiv.classList.remove("d-none");
    } else {
      kartDiv.classList.add("d-none");
    }
  });

  document.getElementById("odemeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const sepet = sepetOku();
    const msg = document.getElementById("odemeMesaj");

    if (sepet.length === 0) {
      msg.className = "text-danger";
      msg.textContent = "Sepet boş. Önce ürün ekleyin.";
      return;
    }

    // Telefon Validasyonu
    const tel = document.getElementById("telefon").value.trim();
    if (!/^\d+$/.test(tel) || tel.length < 10) {
      msg.className = "text-danger";
      msg.textContent = "Lütfen geçerli bir telefon numarası giriniz (sadece rakam).";
      return;
    }

    // Kart Validasyonu
    if (odemeTipiEl.value === "Kart") {
      const kartNo = document.querySelector("#kartBilgileriMain input:nth-child(1)").value.trim();
      const kartSKT = document.querySelector("#kartBilgileriMain .col-md-6:nth-child(2) input").value.trim();
      const kartCVV = document.querySelector("#kartBilgileriMain .col-md-6:nth-child(3) input").value.trim();

      if (!kartNo || !kartSKT || !kartCVV) {
        msg.className = "text-danger";
        msg.textContent = "Lütfen kredi kartı bilgilerini eksiksiz doldurunuz.";
        return;
      }
    }

    // Adres parçalarını birleştir
    const sokak = document.getElementById("adresSokak").value.trim();
    const no = document.getElementById("adresNo").value.trim();
    const pk = document.getElementById("adresPK").value.trim();
    const sehir = document.getElementById("adresSehir").value.trim();
    const ulke = document.getElementById("adresUlke").value.trim();

    // Format: Sokak No, PK Şehir / Ülke
    const tamAdres = `${sokak} No:${no}, ${pk} ${sehir} / ${ulke}`;

    const payload = {
      ad_soyad: document.getElementById("adSoyad").value.trim(),
      telefon: document.getElementById("telefon").value.trim(),
      email: document.getElementById("email").value.trim(),
      adres: tamAdres,
      odeme_tipi: odemeTipiEl.value,
      sepet
    };

    const r = await fetch("/api/siparis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json();

    if (data.hata) {
      msg.className = "text-danger";
      msg.textContent = data.hata;
      return;
    }

    // Modal'ı göster
    const modalEl = document.getElementById('successModal');
    const modalMessageEl = document.getElementById('modalMessage');

    modalMessageEl.textContent = `Siparişiniz onaylandı (ID: ${data.siparis_id}). Teşekkürler!`;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Sepeti temizle
    localStorage.removeItem("sepet");

    // Modal kapandığında veya 3 sn sonra anasayfaya dön
    modalEl.addEventListener('hidden.bs.modal', () => {
      location.href = "/index.html";
    });
  });
});
