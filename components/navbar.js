//navbar/js
const navbar = document.getElementById("navbar");
const current = window.location.pathname;

function navbarBas() {
  const adet = sepetAdetHesapla();

  const kullanici = JSON.parse(sessionStorage.getItem("kullanici"));

  document.getElementById("navbar").innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark bg-brand-primary sticky-top shadow-sm py-3">
    <div class="container">
      <!-- Brand -->

      <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="/index.html">
        <img src="/images/aylara_logo.png" alt="Aylara" class="rounded-circle" style="height: 40px; width: 40px; object-fit: cover;">
        <span style="letter-spacing: 0.5px;">Aylara Kırtasiye</span> <!-- Zeile 17: Name geändert -->
      </a>

      <!-- Mobile Toggle -->
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Links & Actions -->
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav mx-auto mb-2 mb-lg-0 fw-medium">
          <li class="nav-item px-2">
            <a class="nav-link ${current.endsWith('index.html') || current === '/' ? 'active border-bottom border-2 border-brand-secondary' : ''}" href="/index.html">Ana Sayfa</a>
          </li>
          <li class="nav-item px-2">
            <a class="nav-link ${current.includes('urun') ? 'active border-bottom border-2 border-brand-secondary' : ''}" href="/urunler.html">Ürünler</a>
          </li>
          <li class="nav-item px-2">
            <a class="nav-link ${current.includes('hakkimizda') ? 'active border-bottom border-2 border-brand-secondary' : ''}" href="/hakkimizda.html">Hakkımızda</a>
          </li>
          <li class="nav-item px-2">
             <a class="nav-link ${current.includes('iletisim') ? 'active border-bottom border-2 border-brand-secondary' : ''}" href="/iletisim.html">İletişim</a>
          </li>
        </ul>

        <div class="d-flex align-items-center gap-3">
          
          ${kullanici ? `
             <div class="dropdown">
                <button class="btn btn-sm btn-outline-light border-0 d-flex align-items-center gap-2 dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle fs-5"></i>
                    <span class="d-none d-lg-inline small">${kullanici.ad_soyad}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                    <li><a class="dropdown-item small" href="#" onclick="sessionStorage.removeItem('kullanici'); location.reload();">Çıkış Yap</a></li>
                </ul>
             </div>
          ` : `
             <a href="/kullanici_giris.html" class="text-white text-decoration-none small opacity-75 hover-opacity-100 me-2">
                Giriş Yap
             </a>
          `}

          <!-- Admin Link -->
          <a href="/admin_giris.html" class="text-white text-decoration-none small opacity-50 hover-opacity-100 me-2" style="font-size: 0.75rem;">
            Admin
          </a>

          <!-- Favorites -->
          <a href="/favoriler.html" class="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center p-0 position-relative" style="width: 40px; height: 40px;">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
             </svg>
          </a>

          <!-- Cart -->
          <a href="/sepet.html" class="btn btn-brand-primary rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-cart2" viewBox="0 0 16 16">
              <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 10H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
            </svg>
            <span class="fw-bold">Sepetim</span>
            <span id="sepetBadge" class="badge rounded-pill bg-danger">
              ${adet}
            </span>
          </a>
        </div>
      </div>
    </div>
  </nav>
  `;
}

navbarBas();

function sepetSayisiniGuncelle() {
  const badge = document.getElementById("sepetBadge");
  if (!badge) return;

  const sepet = JSON.parse(localStorage.getItem("sepet") || "[]");
  const adet = sepet.reduce((t, u) => t + Number(u.adet || 1), 0);

  badge.textContent = adet;
}

// ilk yükleme
sepetSayisiniGuncelle();

// 🔥 sepete ekle / sil / azalt / artır hepsi buraya düşer
window.addEventListener("sepetGuncellendi", sepetSayisiniGuncelle);
