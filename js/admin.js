//admin.js

function tokenOku() { return localStorage.getItem("adminToken"); }
function tokenYaz(t) { localStorage.setItem("adminToken", t); }
function tokenSil() { localStorage.removeItem("adminToken"); }

async function adminGiris() {
  const kadi = document.getElementById("kadi").value.trim();
  const sifre = document.getElementById("sifre").value.trim();
  const msg = document.getElementById("adminMesaj");

  const r = await fetch("/api/admin/giris", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kullanici_adi: kadi, sifre })
  });
  const data = await r.json();

  if (data.hata) {
    msg.className = "text-danger";
    msg.textContent = data.hata;
    return;
  }

  tokenYaz(data.token);
  msg.className = "text-success";
  msg.textContent = "Giriş başarılı, yönlendiriliyor...";
  setTimeout(() => location.href = "/admin_panel.html", 600);
}

if (document.getElementById("girisBtn")) {
  document.getElementById("girisBtn").addEventListener("click", adminGiris);
}

async function adminUrunleriCek() {
  const r = await fetch("/api/urunler");
  return r.json();
}

// function kategorileriYukle removed

// Global functions for admin panel
// Global functions for admin panel
function getStatusBadgeClass(status) {
  if (!status) return 'bg-secondary';
  switch (status) {
    case 'Bekliyor': return 'bg-warning text-dark';
    case 'Hazırlanıyor': return 'bg-info text-dark';
    case 'Yola Çıktı': return 'bg-primary';
    case 'Teslim Edildi': return 'bg-success';
    case 'İptal Edildi': return 'bg-danger';
    // German Support
    case 'Warten': return 'bg-warning text-dark';
    case 'Vorbereitung': return 'bg-info text-dark'; // or 'In Bearbeitung'
    case 'Er machte sich auf den Weg': return 'bg-primary'; // Google Translate spec
    case 'Unterwegs': return 'bg-primary';
    case 'Geliefert': return 'bg-success';
    case 'Abgesagt': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

window.siparisSecimleriTemizle = function () {
  const checkboxes = document.querySelectorAll(".siparis-checkbox");
  checkboxes.forEach(c => c.checked = false);
  const hepsiniSec = document.getElementById("siparisHepsiniSec");
  if (hepsiniSec) hepsiniSec.checked = false;
  document.getElementById("bulkActionBar").classList.remove("active");

  // Hide checkboxes
  document.querySelectorAll('.siparis-checkbox, #selectAllContainer').forEach(el => el.classList.add('d-none'));
  document.getElementById('selectModeBtn').classList.remove('d-none');
  document.getElementById('hashHeader').classList.remove('d-none');
};

window.cancelSelectionMode = window.siparisSecimleriTemizle;

window.toggleSelectionMode = function () {
  const isHidden = document.querySelector('.siparis-checkbox').classList.contains('d-none');
  if (isHidden) {
    // Show checkboxes
    document.querySelectorAll('.siparis-checkbox, #selectAllContainer').forEach(el => el.classList.remove('d-none'));
    document.getElementById('selectModeBtn').classList.add('d-none');
    document.getElementById('hashHeader').classList.add('d-none');
  } else {
    window.siparisSecimleriTemizle();
  }
};

window.markSelectedReady = function () {
  const checkboxes = document.querySelectorAll(".siparis-checkbox:checked");
  if (checkboxes.length === 0) return;


};


// Tab Switching Function
window.showTab = function (tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-section').forEach(el => el.classList.add('d-none'));

  // Deactivate all buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('btn-brand-primary', 'text-white');
    btn.classList.add('btn-outline-primary');
  });

  // Show selected tab
  document.getElementById('tab-' + tabId).classList.remove('d-none');

  // Activate button
  const btn = document.getElementById('btn-' + tabId);
  if (btn) {
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-brand-primary', 'text-white');
  }
};


async function adminPanelInit() {
  const t = tokenOku();
  if (!t) {
    location.href = "/admin_giris.html";
    return;
  }

  const body = document.getElementById("adminUrunBody");
  const msg = document.getElementById("panelMesaj");

  // Removed unused vars

  // --- MODAL YARDIMCILARI ---
  const msgModalEl = document.getElementById('messageModal');
  const messageModal = msgModalEl ? new bootstrap.Modal(msgModalEl) : null;

  const confirmModalEl = document.getElementById('confirmModal');
  const confirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;
  let confirmCallback = null;

  document.getElementById('confirmBtnYes').onclick = () => {
    if (confirmCallback) confirmCallback();
    confirmModal.hide();
  };

  function showMessage(title, text, isError = false) {
    if (!messageModal) return;
    const titleEl = document.getElementById('msgTitle');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.className = `modal-title fw-bold ${isError ? 'text-danger' : 'text-brand-primary'}`;
    }
    const bodyEl = document.getElementById('msgBody');
    if (bodyEl) bodyEl.textContent = text;
    messageModal.show();
  }

  function showConfirm(text, callback) {
    if (!confirmModal) {
      if (confirm(text)) callback();
      return;
    }
    const bodyEl = document.getElementById('confirmBody');
    if (bodyEl) bodyEl.textContent = text;
    confirmCallback = callback;
    confirmModal.show();
  }

  // Window'a dışa aç, global fonksiyonlar kullansın
  window.showConfirm = showConfirm;
  window.showMessage = showMessage;

  // ---------------------------

  async function adminSiparisleriCek() {
    const r = await fetch("/api/admin/siparisler", { headers: { "x-admin-token": t } });
    if (r.status === 401) {
      tokenSil();
      location.href = "/admin_giris.html";
      return [];
    }
    if (!r.ok) return [];
    return r.json();
  }

  // --- SİPARİŞ DETAY & EDİT İŞLEMLERİ ---
  const siparisModalEl = document.getElementById('siparisModal');
  const siparisModal = siparisModalEl ? new bootstrap.Modal(siparisModalEl) : null;
  const siparisKaydetBtn = document.getElementById('siparisKaydetBtn');
  const siparisSilBtn = document.getElementById('siparisSilBtn');

  // Sipariş Detay Inputlar
  const dId = document.getElementById('detayId');
  const dAd = document.getElementById('detayAd');
  const dTel = document.getElementById('detayTel');
  const dEmail = document.getElementById('detayEmail');
  const dAdres = document.getElementById('detayAdres');
  const dDurum = document.getElementById('detayDurum'); // Yeni eklendi
  const dTarih = document.getElementById('detayTarih');
  const dToplam = document.getElementById('detayToplam');
  const dUrunler = document.getElementById('detayUrunler');

  async function siparisDetayAc(id) {
    try {
      const r = await fetch("/api/admin/siparis/" + id, { headers: { "x-admin-token": t } });
      if (!r.ok) throw new Error("Sipariş çekilemedi");
      const data = await r.json();
      const s = data.siparis;
      const urunler = data.urunler;

      dId.value = s.id;
      dAd.value = s.ad_soyad;
      dTel.value = s.telefon;
      dEmail.value = s.email;
      dEmail.value = s.email;
      dAdres.value = s.adres;
      dDurum.value = s.durum || "Bekliyor"; // Durumu set et
      dTarih.value = new Date(s.tarih).toLocaleString("tr-TR");
      dToplam.textContent = Number(s.toplam_tutar).toFixed(2) + " TL";

      // Tabloyu doldur
      dUrunler.innerHTML = urunler.map(u => `
        <tr>
          <td>
            <div class="d-flex align-items-center">
               ${u.resim ? `<img src="/images/${u.resim}" class="rounded me-2" style="width:40px;height:40px;object-fit:cover">` : ''}
               <div>
                 <div class="fw-bold small">${u.urun_ad || 'Silinmiş Ürün'}</div>
               </div>
            </div>
          </td>
          <td class="text-center">${u.adet}</td>
          <td class="text-end">${Number(u.birim_fiyat).toFixed(2)} ₺</td>
          <td class="text-end fw-bold">${(Number(u.birim_fiyat) * Number(u.adet)).toFixed(2)} ₺</td>
        </tr>
      `).join("");

      // Silme butonu ID'sini güncelle
      siparisSilBtn.onclick = () => {
        showConfirm("Bu siparişi silmek istediğinize emin misiniz?", async () => {
          const resp = await fetch("/api/admin/siparis/" + s.id, {
            method: "DELETE",
            headers: { "x-admin-token": t }
          });
          const resData = await resp.json();
          if (resData.hata) {
            showMessage("Hata", resData.hata, true);
          } else {
            showMessage("Başarılı", "Sipariş silindi");
            if (siparisModal) siparisModal.hide();
            listele();
          }
        });
      };

      if (siparisModal) siparisModal.show();

    } catch (err) {
      console.error(err);
      showMessage("Hata", "Sipariş detayları alınamadı", true);
    }
  }

  // Sipariş güncelle
  siparisKaydetBtn.onclick = async () => {
    const id = dId.value;
    const payload = {
      ad_soyad: dAd.value,
      telefon: dTel.value,
      email: dEmail.value,
      adres: dAdres.value,
      durum: dDurum.value // Durumu ekle
    };

    try {
      const r = await fetch("/api/admin/siparis/" + id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": t
        },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      if (data.hata) {
        showMessage("Hata", data.hata, true);
      } else {
        showMessage("Başarılı", "Sipariş güncellendi");
        if (siparisModal) siparisModal.hide();
        listele();
      }
    } catch (e) {
      console.error(e);
      showMessage("Hata", "Güncelleme başarısız", true);
    }
  };

  // --- YENİ ÜRÜN & EDİT İŞLEMLERİ (MODAL İLE) ---
  const urunModalEl = document.getElementById('urunModal');
  const urunModal = urunModalEl ? new bootstrap.Modal(urunModalEl) : null;

  const modalEl = document.getElementById('urunModal');
  const modalTitle = document.getElementById('urunModalTitle');
  const urunKaydetBtn = document.getElementById('urunKaydetBtn');

  // Inputlar
  const uId = document.getElementById('urunId');
  const uAd = document.getElementById('urunAd');
  const uKat = document.getElementById('urunKategori');
  const uYeniKat = document.getElementById('urunYeniKategori');
  const uFiyat = document.getElementById('urunFiyat');
  const uStok = document.getElementById('urunStok');
  const uResim = document.getElementById('urunResim');
  const uAcik = document.getElementById('urunAciklama');

  // Kategori input göster/gizle
  uKat.onchange = () => {
    if (uKat.value === '__yeni__') uYeniKat.classList.remove('d-none');
    else uYeniKat.classList.add('d-none');
  };

  function formTemizle() {
    uId.value = '';
    uAd.value = '';
    uKat.value = '';
    uYeniKat.value = '';
    uYeniKat.classList.add('d-none');
    uFiyat.value = '';
    uStok.value = '';
    uResim.value = '';
    uAcik.value = '';
  }

  // Yeni ürün ekle butonuna tıklandığında
  const yeniUrunBtn = document.getElementById('yeniUrunBtn');
  if (yeniUrunBtn) {
    yeniUrunBtn.onclick = () => {
      formTemizle();
      if (modalTitle) modalTitle.textContent = "Yeni Ürün Ekle";
      if (urunKaydetBtn) urunKaydetBtn.textContent = "Kaydet";
      if (urunModal) urunModal.show();
    };
  }

  // Düzenle butonuna tıklandığında (Listele fonksiyonu içinden çağırılacak)
  function urunDuzenleAc(u) {
    formTemizle();
    modalTitle.textContent = "Ürün Düzenle";
    urunKaydetBtn.textContent = "Güncelle";

    uId.value = u.id;
    uAd.value = u.ad;
    uKat.value = u.kategori;
    uFiyat.value = u.fiyat;
    uStok.value = u.stok;
    uAcik.value = u.aciklama || '';

    // Kategori kontrolü (eğer select içinde yoksa ekle)
    if (!Array.from(uKat.options).some(o => o.value === u.kategori)) {
      const opt = document.createElement("option");
      opt.value = u.kategori;
      opt.textContent = u.kategori;
      uKat.appendChild(opt);
      uKat.value = u.kategori;
    }

    if (urunModal) urunModal.show();
  }

  // Kaydet butonuna basıldığında
  if (urunKaydetBtn) {
    urunKaydetBtn.onclick = async () => {
      const fd = new FormData();
      fd.append("ad", uAd.value.trim());

      let kategori = uKat.value;
      if (kategori === "__yeni__") {
        kategori = uYeniKat.value.trim();
        if (!kategori) { showMessage("Uyarı", "Yeni kategori giriniz", true); return; }
      }
      fd.append("kategori", kategori);
      fd.append("fiyat", uFiyat.value);
      fd.append("stok", uStok.value);
      fd.append("aciklama", uAcik.value.trim());

      if (uResim.files[0]) fd.append("resim", uResim.files[0]);

      try {
        let r;
        if (uId.value) {
          // GÜNCELLEME
          r = await fetch("/api/admin/urun/" + uId.value, {
            method: "PUT",
            headers: { "x-admin-token": t },
            body: fd
          });
        } else {
          // EKLEME
          r = await fetch("/api/admin/urun", {
            method: "POST",
            headers: { "x-admin-token": t },
            body: fd
          });
        }

        const data = await r.json();
        if (data.hata) {
          showMessage("Hata", data.hata, true);
        } else {
          showMessage("Başarılı", data.mesaj);
          if (urunModal) urunModal.hide();
          listele();
          kategorileriYukle();
        }

      } catch (e) {
        console.error(e);
        showMessage("Hata", "İşlem sırasında bir hata oluştu.", true);
      }
    };
  }

  // Kategorileri yükle
  async function kategorileriYukle() {
    const r = await fetch("/api/kategoriler");
    const kategoriler = await r.json();
    uKat.innerHTML = `<option value="">Kategori seç</option>`;
    kategoriler.forEach(k => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      uKat.appendChild(opt);
    });
    const yeni = document.createElement("option");
    yeni.value = "__yeni__";
    yeni.textContent = "+ Yeni kategori ekle";
    uKat.appendChild(yeni);
  }


  async function listele() {
    // 1. Ürünleri listele
    const urunler = await adminUrunleriCek();
    const urunListesi = Array.isArray(urunler) ? urunler : [];

    body.innerHTML = urunListesi.map(u => `
      <tr>
        <td class="ps-4 fw-bold">#${u.id}</td>
        <td>${u.ad}</td>
        <td>${u.kategori}</td>
        <td>${Number(u.fiyat).toFixed(2)} TL</td>
        <td>${u.stok}</td>
        <td class="d-flex gap-2 justify-content-end pe-4">
          <button class="btn btn-outline-dark btn-sm shadow-sm" data-edit='${JSON.stringify(u)}'>
             <i class="bi bi-pencil-square"></i> Güncelle
          </button>
          <button class="btn btn-outline-danger btn-sm shadow-sm" data-sil="${u.id}">
             <i class="bi bi-trash"></i> Sil
          </button>
        </td>
      </tr>
    `).join("");

    body.querySelectorAll("[data-sil]").forEach(b => {
      b.onclick = () => {
        showConfirm("Bu ürünü silmek istediğinize emin misiniz?", async () => {
          const id = b.dataset.sil;
          const r = await fetch("/api/admin/urun/" + id, {
            method: "DELETE",
            headers: { "x-admin-token": t }
          });
          const data = await r.json();

          if (data.hata) {
            showMessage("Hata", data.hata, true);
          } else {
            showMessage("Başarılı", data.mesaj);
            kategorileriYukle();
            listele();
          }
        });
      };
    });

    body.querySelectorAll("[data-edit]").forEach(btn => {
      btn.onclick = () => {
        const u = JSON.parse(btn.dataset.edit);
        urunDuzenleAc(u);
      };
    });

    // 2. Siparişleri listele
    const siparisBody = document.getElementById("adminSiparisBody");
    if (siparisBody) {
      try {
        const siparisler = await adminSiparisleriCek();

        // İstatistikleri Güncelle
        let toplamCiro = 0;
        let toplamSiparis = Array.isArray(siparisler) ? siparisler.length : 0;

        if (Array.isArray(siparisler)) {
          siparisler.forEach(s => {
            // Sadece Teslim Edilenleri (veya Geliefert) topla
            if (s.durum === 'Teslim Edildi' || s.durum === 'Geliefert') {
              toplamCiro += Number(s.toplam_tutar || 0);
            }
          });
        }

        // Elementleri güncelle
        document.getElementById("statGelir").innerText = toplamCiro.toFixed(2) + " ₺";
        document.getElementById("statSiparis").innerText = toplamSiparis;

        siparisBody.innerHTML = siparisler.map(s => `
                <tr>
                    <td class="ps-4">
                        <input type="checkbox" class="form-check-input siparis-checkbox" data-id="${s.id}">
                    </td>
                    <td class="fw-bold">#${s.id}</td>
                    <td>
                        <div class="fw-bold text-dark">${s.ad_soyad}</div>
                        <div class="small text-muted">${s.email}</div>
                    </td>
                    <td class="fw-bold text-brand-secondary">${Number(s.toplam_tutar).toFixed(2)} TL</td>
                    <td><span class="badge bg-light text-dark border">${s.odeme_tipi}</span></td>
                    <td>
                        <span class="badge ${getStatusBadgeClass(s.durum)}">${s.durum || 'Bekliyor'}</span>
                    </td>
                    <td class="text-muted small">${new Date(s.tarih).toLocaleString("tr-TR")}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-brand-primary shadow-sm" data-siparis-id="${s.id}">
                            Detay
                        </button>
                    </td>
                </tr>
            `).join("");

        // Floating Action Bar logic
        const bulkBar = document.getElementById("bulkActionBar");
        const bulkCount = document.getElementById("bulkActionCount");
        const checkboxes = siparisBody.querySelectorAll(".siparis-checkbox");
        const hepsiniSec = document.getElementById("siparisHepsiniSec");

        const updateBulkBar = () => {
          const secilenler = Array.from(checkboxes).filter(c => c.checked);
          if (secilenler.length > 0) {
            bulkCount.textContent = secilenler.length;
            bulkBar.classList.add("active");
          } else {
            bulkBar.classList.remove("active");
          }
        };

        checkboxes.forEach(c => c.onchange = updateBulkBar);

        if (hepsiniSec) {
          hepsiniSec.onchange = () => {
            checkboxes.forEach(c => c.checked = hepsiniSec.checked);
            updateBulkBar();
          };
        }

        // --- GLOBAL BULK ACTIONS ---
        window.markSelectedReady = () => {
          const secilenIdler = Array.from(checkboxes)
            .filter(c => c.checked)
            .map(c => c.dataset.id);

          if (secilenIdler.length === 0) return;

          showConfirm(`${secilenIdler.length} siparişi 'Hazırlanıyor' olarak işaretlemek istiyor musunuz?`, async () => {
            let basarili = 0;
            for (const id of secilenIdler) {
              try {
                const r = await fetch("/api/admin/siparis/" + id, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": t
                  },
                  body: JSON.stringify({ durum: "Hazırlanıyor" })
                });
                if (r.ok) basarili++;
              } catch (e) {
                console.error("Güncelleme hatası:", id, e);
              }
            }

            showMessage("Tamamlandı", `${basarili} sipariş 'Hazırlanıyor' durumuna getirildi.`);
            window.cancelSelectionMode(); // Seçimi temizle
            listele(); // Listeyi yenile
            listele(); // Listeyi yenile
          });
        };

        window.markSelectedDelivered = () => {
          const secilenIdler = Array.from(checkboxes)
            .filter(c => c.checked)
            .map(c => c.dataset.id);

          if (secilenIdler.length === 0) return;

          showConfirm(`${secilenIdler.length} siparişi 'Teslim Edildi' (Geliefert) olarak işaretlemek istiyor musunuz?`, async () => {
            let basarili = 0;
            for (const id of secilenIdler) {
              try {
                const r = await fetch("/api/admin/siparis/" + id, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": t
                  },
                  body: JSON.stringify({ durum: "Teslim Edildi" })
                });
                if (r.ok) basarili++;
              } catch (e) {
                console.error("Güncelleme hatası:", id, e);
              }
            }

            showMessage("Tamamlandı", `${basarili} sipariş 'Teslim Edildi' durumuna getirildi.`);
            window.cancelSelectionMode();
            listele();
          });
        };

        window.toggleSelectionMode = () => {
          document.querySelectorAll('.siparis-checkbox, #selectAllContainer').forEach(el => el.classList.remove('d-none'));
          document.getElementById('selectModeBtn').classList.add('d-none');
          document.getElementById('hashHeader').classList.add('d-none');
        };

        window.cancelSelectionMode = () => {
          checkboxes.forEach(c => c.checked = false);
          if (hepsiniSec) hepsiniSec.checked = false;
          updateBulkBar();
          document.querySelectorAll('.siparis-checkbox, #selectAllContainer').forEach(el => el.classList.add('d-none'));
          document.getElementById('selectModeBtn').classList.remove('d-none');
          document.getElementById('hashHeader').classList.remove('d-none');
        };

        const topluSilBtn = document.getElementById("topluSiparisSilBtn");
        if (topluSilBtn) {
          topluSilBtn.onclick = () => {
            const secilenIdler = Array.from(checkboxes)
              .filter(c => c.checked)
              .map(c => c.dataset.id);

            showConfirm(`${secilenIdler.length} siparişi silmek istediğinize emin misiniz?`, async () => {
              for (const id of secilenIdler) {
                try {
                  await fetch("/api/admin/siparis/" + id, {
                    method: "DELETE",
                    headers: { "x-admin-token": t }
                  });
                } catch (e) { console.error("Silme hatası:", id, e); }
              }
              showMessage("Başarılı", "Seçilen siparişler silindi");
              bulkBar.classList.remove("active");
              listele();
            });
          };
        }

        siparisBody.querySelectorAll("[data-siparis-id]").forEach(btn => {
          btn.onclick = () => siparisDetayAc(btn.dataset.siparisId);
        });
      } catch (err) {
        console.error("Sipariş çekme hatası", err);
        siparisBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Siparişler yüklenemedi</td></tr>`;
      }
    }

    // 3. Kullanıcıları listele
    const kullaniciBody = document.getElementById("adminKullaniciBody");
    if (kullaniciBody) {
      try {
        const r = await fetch("/api/admin/kullanicilar", { headers: { "x-admin-token": t } });
        if (r.ok) {
          const kullanicilar = await r.json();
          // Müşteri Sayısını Güncelle
          document.getElementById("statMusteri").innerText = Array.isArray(kullanicilar) ? kullanicilar.length : 0;

          kullaniciBody.innerHTML = kullanicilar.map(k => {
            const initials = (k.ad_soyad || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            // Engelli durumu için stil ve metin
            const isBlocked = k.engelli === 1;
            const rowClass = isBlocked ? 'table-danger' : '';
            const statusBadge = isBlocked
              ? '<span class="badge bg-danger ms-2">Engellendi</span>'
              : '';
            const blockBtnText = isBlocked ? 'Engeli Kaldır' : 'Engelle';
            const blockBtnIcon = isBlocked ? 'bi-unlock' : 'bi-lock';
            const blockBtnClass = isBlocked ? 'btn-outline-success' : 'btn-outline-warning';

            return `
            <tr class="${rowClass}">
                <td class="ps-4 fw-bold">#${k.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-brand-primary text-white d-flex align-items-center justify-content-center me-3 shadow-sm" style="width: 40px; height: 40px; flex-shrink: 0; font-size: 0.9rem;">
                            ${initials}
                        </div>
                        <div>
                            <div class="fw-bold text-dark">
                              ${k.ad_soyad}
                              ${statusBadge}
                            </div>
                            <div class="small text-muted">${k.email}</div>
                        </div>
                    </div>
                </td>
                <td>${k.telefon || '<span class="text-muted">-</span>'}</td>
                <td class="text-truncate" style="max-width: 150px;" title="${k.adres || ''}">${k.adres || '<span class="text-muted">-</span>'}</td>
                <td class="text-muted small">${k.tarih ? new Date(k.tarih).toLocaleDateString("tr-TR") : '-'}</td>
                <td class="text-end pe-4">
                  <div class="btn-group" role="group">
                    <button class="btn btn-sm ${blockBtnClass} rounded-start shadow-sm px-2" 
                      onclick="window.kullaniciEngelle(${k.id}, ${k.engelli || 0})">
                      <i class="bi ${blockBtnIcon} me-1"></i> ${blockBtnText}
                    </button>
                    <button class="btn btn-sm btn-outline-primary shadow-sm px-2" 
                      onclick="window.kullaniciDuzenle(${k.id}, '${k.ad_soyad}', '${k.email}', '${k.telefon || ''}', '${k.adres ? k.adres.replace(/\n/g, '\\n').replace(/'/g, "\\'") : ''}')">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-end shadow-sm px-2" 
                      onclick="window.kullaniciSil(${k.id})">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
            </tr>
           `;
          }).join("");
        }
      } catch (err) {
        console.error("Kullanıcıları çekme hatası", err);
        kullaniciBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Kullanıcılar yüklenemedi</td></tr>`;
      }
    }
  }

  await kategorileriYukle();

  document.getElementById("cikisBtn").onclick = () => {
    tokenSil();
    location.href = "/index.html";
  };

  // Global erişim için listele fonksiyonunu dışarı aç
  window.adminListele = listele;

  listele();
}

// admin_panel.html içinde çağrılıyor
window.adminPanelInit = adminPanelInit;

// Kullanıcı Düzenle - Global Fonksiyon
window.kullaniciDuzenle = function (id, ad, email, tel, adres) {
  document.getElementById("kulId").value = id;
  document.getElementById("kulAd").value = ad;
  document.getElementById("kulEmail").value = email;
  document.getElementById("kulTel").value = (tel === 'undefined' || !tel) ? '' : tel;

  // Adres Parçalama
  // Beklenen format: Sokak No:123, 34000 Şehir / Ülke
  const regex = /(.*) No:(.*), (\d{5}) (.*) \/ (.*)/;
  let match = null;

  if (adres && adres !== 'undefined') {
    const cleanAdres = adres.replace(/\\n/g, '\n');
    match = cleanAdres.match(regex);
  }

  if (match) {
    document.getElementById("kulSokak").value = match[1];
    document.getElementById("kulNo").value = match[2];
    document.getElementById("kulPK").value = match[3];
    document.getElementById("kulSehir").value = match[4];
    document.getElementById("kulUlke").value = match[5];
  } else {
    // Format uymuyorsa hepsini sokağa yaz, diğerlerini temizle
    document.getElementById("kulSokak").value = (adres && adres !== 'undefined') ? adres.replace(/\\n/g, '\n') : '';
    document.getElementById("kulNo").value = '';
    document.getElementById("kulPK").value = '';
    document.getElementById("kulSehir").value = '';
    document.getElementById("kulUlke").value = '';
  }

  const modalEl = document.getElementById("kullaniciModal");
  if (modalEl) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
};

// Auto City Lookup for Admin Panel
document.getElementById("kulPK")?.addEventListener("input", async (e) => {
  const pl = e.target.value;
  if (pl.length === 5) {
    try {
      const res = await fetch(`https://api.zippopotam.us/tr/${pl}`);
      if (res.ok) {
        const data = await res.json();
        document.getElementById("kulSehir").value = data.places[0]["place name"];
        document.getElementById("kulUlke").value = "Türkiye";
      }
    } catch (err) {
      console.error("Şehir bulunamadı", err);
    }
  }
});

const kulKaydetBtn = document.getElementById("kulKaydetBtn");
if (kulKaydetBtn) {
  kulKaydetBtn.onclick = async () => {
    const t = tokenOku();
    const id = document.getElementById("kulId").value;
    const ad_soyad = document.getElementById("kulAd").value;
    const email = document.getElementById("kulEmail").value;
    const telefon = document.getElementById("kulTel").value;

    // Adres Birleştirme
    const sokak = document.getElementById("kulSokak").value;
    const no = document.getElementById("kulNo").value;
    const pk = document.getElementById("kulPK").value;
    const sehir = document.getElementById("kulSehir").value;
    const ulke = document.getElementById("kulUlke").value;

    const adres = `${sokak} No:${no}, ${pk} ${sehir} / ${ulke}`;

    try {
      const res = await fetch(`/api/admin/kullanici/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": t },
        body: JSON.stringify({ ad_soyad, email, telefon, adres })
      });
      if (res.ok) {
        // Modal kapat ve yenile
        const modalEl = document.getElementById("kullaniciModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Listeyi güncellemek için sayfayı yenilemek en temiz çözüm
        if (window.adminListele) window.adminListele();
      } else {
        const data = await res.json();
        alert("Hata: " + (data.hata || "Bilinmeyen hata"));
      }
    } catch (e) {
      console.error(e);
      alert("Bağlantı hatası");
    }
  };
}

// Kullanıcı Engelleme
window.kullaniciEngelle = function (id, currentStatus) {
  const t = localStorage.getItem("adminToken");
  const newStatus = currentStatus === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? "engellemek" : "engelini kaldırmak";

  window.showConfirm(`Bu kullanıcıyı ${actionText} istediğinize emin misiniz?`, async () => {
    try {
      const res = await fetch(`/api/admin/kullanici/${id}/engelle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': t
        },
        body: JSON.stringify({ engelli: newStatus })
      });

      if (res.ok) {
        if (window.adminListele) window.adminListele();
      } else {
        const data = await res.json();
        window.showMessage("Hata", data.error || "İşlem başarısız", true);
      }
    } catch (e) {
      console.error(e);
      window.showMessage("Hata", "Bir hata oluştu", true);
    }
  });
};

// Kullanıcı Silme
window.kullaniciSil = function (id) {
  const t = localStorage.getItem("adminToken");

  window.showConfirm("Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!", async () => {
    try {
      const res = await fetch(`/api/admin/kullanici/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': t
        }
      });

      if (res.ok) {
        if (window.adminListele) window.adminListele();
      } else {
        const data = await res.json();
        window.showMessage("Hata", data.error || "Silme işlemi başarısız", true);
      }
    } catch (e) {
      console.error(e);
      window.showMessage("Hata", "Bir hata oluştu", true);
    }
  });
};
