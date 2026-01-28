//urunler.js
function sepetOku() { return JSON.parse(localStorage.getItem("sepet") || "[]"); }
function sepetYaz(s) {
  localStorage.setItem("sepet", JSON.stringify(s));

  // NAVBAR'A HABER VER
  window.dispatchEvent(new Event("sepetGuncellendi"));
}

function favoriOku() {
  return JSON.parse(localStorage.getItem("favoriler") || "[]");
}

function favoriYaz(liste) {
  localStorage.setItem("favoriler", JSON.stringify(liste));
}

function favoriMi(id) {
  return favoriOku().includes(id);
}

function favoriToggle(id) {
  let f = favoriOku();
  let eklendi;

  if (f.includes(id)) {
    f = f.filter(x => x !== id);
    eklendi = false; // çıkarıldı
  } else {
    f.push(id);
    eklendi = true; // eklendi
  }

  favoriYaz(f);

  // FAVORİLER SAYFASINDAYSAK VE ÇIKARILDIYSA KARTI SİL
  if (!eklendi && window.location.pathname.includes("favoriler.html")) {
    const kart = document.querySelector(`.urun-kart[data-id="${id}"]`)?.parentElement;
    if (kart) {
      kart.style.transition = "opacity 0.3s";
      kart.style.opacity = "0";
      setTimeout(() => {
        kart.remove();
        if (favoriOku().length === 0) favoriSayfaInit(); // Boşsa mesajı bas
      }, 300);
    }
  }

  return eklendi;
}


function sepeteAyarla(urun, adet) {
  if (adet < 1) adet = 1;

  const s = sepetOku();
  const b = s.find(x => x.id === urun.id);

  let durum; // 'eklendi' | 'guncellendi'

  if (b) {
    b.adet += adet;
    // Stok güncelle (gerekirse)
    if (urun.stok !== undefined) b.stok = urun.stok;

    // Limit kontrolü (Eğer eklenen miktar stoğu aşarsa)
    if (b.stok !== undefined && b.adet > b.stok) {
      b.adet = b.stok;
      durum = 'stok_siniri';
      // Burada alert/swal GÖSTERMİYORUZ, return değeri ile çağıran yer gösterecek
    } else {
      durum = "guncellendi";
    }
  } else {
    // İlk ekleme - stok kontrolü
    if (urun.stok !== undefined && adet > urun.stok) {
      adet = urun.stok;
      durum = 'stok_siniri';
    } else {
      durum = "eklendi";
    }
    s.push({ id: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet, stok: urun.stok });
  }

  sepetYaz(s);
  return durum;
}


function urunKartiHTML(u) {
  const img = `/images/${u.resim || "placeholder.svg"}`;
  const isFav = favoriMi(u.id);

  return `
  <div class="col-md-6 col-lg-4 col-xl-3">
    <div class="card border-0 shadow-sm h-100 urun-kart position-relative overflow-hidden" data-id="${u.id}" style="border-radius: 16px; transition: transform 0.2s;">
      
      <!-- Floating Favorite Button -->
      <button 
        class="heart-button position-absolute top-0 end-0 m-3 ${isFav ? 'active' : ''}"
        onclick="
            const aktif = favoriToggle(${u.id});
            this.classList.toggle('active', aktif);
        "
        style="z-index: 10;"
        aria-label="Favorilere ekle"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      <!-- Image Area -->
      <div class="bg-light d-flex align-items-center justify-content-center p-4 position-relative" style="height: 250px;">
         <img src="${img}" class="img-fluid" style="max-height: 100%; object-fit: contain;" onerror="this.src='/images/placeholder.svg'" alt="${u.ad}">
      </div>

      <!-- Content Area -->
      <div class="card-body p-4 d-flex flex-column">
        <div class="small text-uppercase fw-bold text-brand-secondary mb-2" style="font-size: 0.75rem; letter-spacing: 1px;">${u.kategori}</div>
        <h5 class="fw-bold text-brand-primary mb-1 text-truncate" title="${u.ad}">${u.ad}</h5>
        <div class="text-muted small mb-3 text-truncate">${u.aciklama || ""}</div>
        
        <div class="mt-auto d-flex align-items-end justify-content-between">
             <div class="fs-4 fw-bold text-brand-primary">${Number(u.fiyat).toFixed(2)} <span class="fs-6">TL</span></div>
             
             <!-- Simple Add Button (Quantity defaults to 1 for simplicity in card view, Detail view handles more) -->
             <!-- We will keep the quantity logic hidden or simplified for the card view to keep it clean -->
             <div class="d-flex align-items-center">
                 <button 
                    type="button" 
                    class="btn btn-brand-primary rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm scale-hover"
                    data-sepet-ekle="1"
                    data-id="${u.id}"
                    data-ad="${u.ad}"
                    data-fiyat="${u.fiyat}"
                 >
                    <i class="bi bi-bag-plus"></i> <span class="small fw-bold">Ekle</span>
                 </button>
                 <!-- Hidden input for existing logic compatibility -->
                 <input id="adet-${u.id}" type="hidden" value="1">
             </div>
        </div>
      </div>

    </div>
  </div>`;
}

// ✅ Kart üstü "Sepete Ekle" butonunu kesin çalıştırır (inline onclick yok)
document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-sepet-ekle]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const ad = btn.dataset.ad;
  const fiyat = Number(btn.dataset.fiyat);

  const input = document.getElementById("adet-" + id);
  const adet = input ? Number(input.value) : 1;

  const sonuc = sepeteAyarla({ id, ad, fiyat }, adet);

  if (sonuc === "eklendi") {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });
    Toast.fire({
      icon: 'success',
      title: 'Sepete eklendi'
    });
  }
  else if (sonuc === "guncellendi") {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });
    Toast.fire({
      icon: 'success',
      title: 'Sepet güncellendi'
    });
  }
  else if (sonuc === "stok_siniri") {
    Swal.fire({
      icon: 'warning',
      title: 'Limit aşıldı',
      text: 'Maksimum sipariş miktarına ulaşıldı (Stok: ' + (input ? input.max : 'Limit') + ')',
      confirmButtonColor: '#ffc107'
    });
  }
});




async function urunleriGetir(param) {
  const url = new URL("/api/urunler", window.location.origin);
  if (param?.kategori) url.searchParams.set("kategori", param.kategori);
  if (param?.q) url.searchParams.set("q", param.q);
  const r = await fetch(url.toString());
  return r.json();
}

// index: öne çıkan bas
// index: öne çıkan bas
async function urunleriGetirVeBas({ hedefId, limit, arama, kategori, siralama }) {
  // Parametreleri hazırla (arama -> q)
  const params = {};
  if (arama) params.q = arama;
  if (kategori && kategori !== "Tümü") params.kategori = kategori; // "Tümü" seçilince parametre gönderme

  // Veriyi çek
  let data = await urunleriGetir(params);

  // Client-side Sıralama (API yapmıyorsa burada yapalım)
  if (siralama) {
    if (siralama === "artan") {
      data.sort((a, b) => a.fiyat - b.fiyat);
    } else if (siralama === "azalan") {
      data.sort((a, b) => b.fiyat - a.fiyat);
    } else if (siralama === "yeni") {
      data.sort((a, b) => b.id - a.id);
    }
  }

  // Limit varsa uygula
  if (limit) {
    data = data.slice(0, limit);
  }

  const hedef = document.getElementById(hedefId);
  if (!hedef) return; // Hedef yoksa hata verme
  
  if (data.length === 0) {
    hedef.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted fs-5">Aradığınız kriterlere uygun ürün bulunamadı.</p></div>`;
  } else {
    hedef.innerHTML = data.map(urunKartiHTML).join("");
  }
}

// ürünler sayfası init
async function sayfaUrunlerInit() {
  const kat = await (await fetch("/api/kategoriler")).json();
  const s = document.getElementById("kategoriSelect");
  s.innerHTML = `<option value="">Tümü</option>` + kat.map(k => `<option value="${k}">${k}</option>`).join("");

  async function bas() {
    const kategori = s.value || "";
    const q = document.getElementById("aramaInput").value.trim();
    const data = await urunleriGetir({ kategori, q });
    document.getElementById("urunGrid").innerHTML = data.map(urunKartiHTML).join("");
  }

  document.getElementById("filtreBtn").addEventListener("click", bas);
  bas();
}

// ürün detay init
async function urunDetayInit() {
  const id = new URLSearchParams(location.search).get("id");
  const alan = document.getElementById("detayAlan");
  if (!id) { alan.innerHTML = `<div class="alert alert-danger mx-5">Ürün ID bulunamadı.</div>`; return; }

  const r = await fetch("/api/urunler/" + id);
  const u = await r.json();
  if (u.hata) { alan.innerHTML = `<div class="alert alert-danger mx-5">${u.hata}</div>`; return; }

  const img = `/images/${u.resim || "placeholder.svg"}`;
  alan.innerHTML = `
    <div class="row g-5 align-items-center">
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
             <img class="w-100 object-fit-cover" style="height: 500px;" src="${img}" onerror="this.src='/images/placeholder.svg'">
        </div>
      </div>
      <div class="col-lg-6">
        <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-light text-brand-secondary border fw-normal px-3 py-2 rounded-pill">${u.kategori}</span>
        </div>
        
        <h1 class="fw-bold text-brand-primary display-5 mb-3">${u.ad}</h1>
        
        <div class="d-flex align-items-end gap-3 mb-4 border-bottom pb-4">
            <div class="price display-6 fw-bold text-brand-secondary-dark">${Number(u.fiyat).toFixed(2)} TL</div>
            
            <button
                class="btn btn-light rounded-circle shadow-sm ms-auto p-2"
                style="width: 48px; height: 48px;"
                onclick="
                const aktif = favoriToggle(${u.id});
                this.querySelector('svg').classList.toggle('kirmizi', aktif);
                "
            >
                <svg class="kalp-icon ${favoriMi(u.id) ? 'kirmizi' : ''}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round">
                <path d="M20.8 4.6c-1.5-1.5-4-1.5-5.6 0L12 7.8 8.8 4.6c-1.5-1.5-4-1.5-5.6 0-1.5 1.5-1.5 4 0 5.6l8.8 8.8 8.8-8.8c1.5-1.5 1.5-4 0-5.6z"/>
                </svg>
            </button>
        </div>

        <div class="mb-4">
             <p class="text-muted fs-5 leading-loose">${u.aciklama || "Ürün açıklaması bulunmuyor."}</p>
        </div>

        <div class="d-flex align-items-center gap-3 bg-light p-4 rounded-4">
             <div class="small fw-bold text-uppercase text-muted">Miktar</div>
             <div class="input-group" style="width:140px">
                <button class="btn btn-white border shadow-sm" onclick="this.nextElementSibling.stepDown()">−</button>
                <input type="number" id="detayAdet" class="form-control text-center border-y-0" value="1" min="1" max="${u.stok}">
                <button class="btn btn-white border shadow-sm" onclick="this.previousElementSibling.stepUp()">+</button>
             </div>
             <div class="small text-muted ms-2">Stok: ${u.stok}</div>
        </div>

        <button class="btn btn-brand-primary btn-lg w-100 rounded-pill mt-4 shadow-lg py-3 fw-bold fs-5"
            onclick="
                const adet = Number(document.getElementById('detayAdet').value);
                const sonuc = sepeteAyarla(
                {id:${u.id}, ad:'${u.ad}', fiyat:${u.fiyat}, resim:'${u.resim}', stok:${u.stok}},
                adet
                );

                if (sonuc === 'eklendi') {
                   Swal.fire({
                       icon: 'success',
                       title: 'Eklendi',
                       text: 'Ürün sepete eklendi',
                       timer: 1500,
                       showConfirmButton: false
                   }); 
                }
                else if (sonuc === 'guncellendi') {
                   Swal.fire({
                       icon: 'success',
                       title: 'Güncellendi',
                       text: 'Sepet güncellendi',
                       timer: 1500,
                       showConfirmButton: false
                   });
                }
                else if (sonuc === 'stok_siniri') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Limit aşıldı',
                        text: 'Maksimum sipariş miktarına ulaşıldı (Stok: ${u.stok})',
                        confirmButtonColor: '#ffc107'
                    });
                }
            ">
            Sepete Ekle
        </button>

      </div>
    </div>
  `;
}

document.addEventListener("click", function (e) {
  const kart = e.target.closest(".urun-kart");
  if (!kart) return;

  // Eğer tıklanan şey BUTON, INPUT, + -, sepete ekle ise detay açma
  if (
    e.target.closest("button") ||
    e.target.closest("input")
  ) {
    return;
  }

  const id = kart.dataset.id;
  if (id) {
    location.href = "/urun_detay.html?id=" + id;
  }
});

document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-favori-id]");
  if (!btn) return;

  const id = Number(btn.dataset.favoriId);
  const kalp = btn.querySelector(".kalp");

  const aktif = favoriToggle(id);

  if (aktif) {
    kalp.classList.add("kirmizi");
  } else {
    kalp.classList.remove("kirmizi");
  }
});

async function favoriSayfaInit() {
  const grid = document.getElementById("favoriGrid");
  const favoriler = favoriOku();

  if (favoriler.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="text-muted mb-3" style="font-size: 80px; opacity: 0.2;">
          <svg style="width: 1em; height: 1em;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
             <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>
          </svg>
        </div>
        <h3 class="fw-bold text-brand-primary">Favori Listeniz Henüz Boş</h3>
        <p class="text-muted mb-4 lead">Beğendiğiniz ürünleri kalp ikonuna tıklayarak buraya ekleyebilirsiniz.</p>
        <a href="/urunler.html" class="btn btn-brand-primary btn-lg px-5 rounded-pill shadow-sm">
           Ürünleri Keşfet
        </a>
      </div>
    `;
    return;
  }

  const tum = await urunleriGetir({});
  const secilenler = tum.filter(u => favoriler.includes(u.id));

  grid.innerHTML = secilenler.map(urunKartiHTML).join("");
}
