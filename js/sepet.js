//sepet.js


function render() {
  const s = sepetOku();
  const body = document.getElementById("sepetBody");
  const head = document.getElementById("sepetHead");
  const toplamAlan = document.getElementById("toplamAlan");
  const odemeBtn = document.getElementById("odemeBtn");
  const toplamEl = document.getElementById("genelToplam");

  if (s.length === 0) {
    head.style.display = "none";
    toplamAlan.style.display = "none";
    odemeBtn.style.display = "none";
    toplamEl.textContent = "0.00";

    body.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <div style="font-size:64px">👜</div>
          <h4 class="fw-bold mt-3">Sepetin boş!</h4>
          <p class="text-muted">Alışverişe başlamak için ürünlere göz at.</p>
          <a href="/urunler.html" class="btn btn-brand-primary mt-3">Alışverişe Başla →</a>
        </td>
      </tr>
    `;
    return;
  }

  head.style.display = "";
  toplamAlan.style.display = "flex";
  odemeBtn.style.display = "";

  body.innerHTML = "";
  let toplam = 0;

  s.forEach((u, i) => {
    const t = u.fiyat * u.adet;
    toplam += t;

    body.innerHTML += `
      <tr>
        <td>${u.ad}</td>
        <td>
           <div class="input-group" style="width: 120px;">
              <button class="btn btn-sm btn-outline-secondary" onclick="adetGuncelle(${i}, -1)">−</button>
              <input type="number" class="form-control form-control-sm text-center px-0 fs-6" 
                     value="${u.adet}" 
                     min="1" 
                     max="${u.stok || ''}" 
                     onchange="adetGuncelle(${i}, 0, this.value)"
                     style="background: white;">
              <button class="btn btn-sm btn-outline-secondary" onclick="adetGuncelle(${i}, 1)">+</button>
           </div>
           ${u.stok ? `<div class="text-muted" style="font-size:10px; text-align:center;">Stok: ${u.stok}</div>` : ''}
        </td>
        <td>${u.fiyat.toFixed(2)} TL</td>
        <td class="fw-bold">${t.toFixed(2)} TL</td>
        <td>
          <button class="btn btn-sm btn-brand-functional" onclick="sil(${i})">Sil</button>
        </td>
      </tr>
    `;
  });

  toplamEl.textContent = toplam.toFixed(2);
}

function adetGuncelle(index, degisim, manualValue = null) {
  const s = sepetOku();
  const urun = s[index];

  let yeniAdet;

  if (manualValue !== null) {
    yeniAdet = Number(manualValue);
  } else {
    yeniAdet = urun.adet + degisim;
  }

  if (yeniAdet < 1) yeniAdet = 1;

  // Stok Kontrolü
  if (urun.stok && yeniAdet > urun.stok) {
    yeniAdet = urun.stok;
    toast("⚠️ Stok limiti! En fazla " + urun.stok + " adet alabilirsiniz.");
  }

  s[index].adet = yeniAdet;
  sepetYaz(s);
  render();
}

function sil(i) {
  const s = sepetOku();
  s.splice(i, 1);
  sepetYaz(s);
  render();
}

document.addEventListener("DOMContentLoaded", render);
window.addEventListener("sepetGuncellendi", render);
