// iletiim.js

document.getElementById('iletisimForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    const adSoyad = document.getElementById('ad_soyad').value.trim();
    const email = document.getElementById('email').value.trim();
    const mesaj = document.getElementById('mesaj').value.trim();
    const btn = document.getElementById('btnGonder');

    if (!adSoyad || !email || !mesaj) {
        Swal.fire({
            icon: 'warning',
            title: 'Eksik Bilgi',
            text: 'Lütfen tüm alanları doldurunuz.',
            confirmButtonColor: '#C5A059'
        });
        return;
    }

    // Butonu pasif yap
    const orgText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Gönderiliyor...';

    try {
        const response = await fetch('/api/iletisim', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ad_soyad: adSoyad,
                email: email,
                mesaj: mesaj
            })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Mesajınız Alındı!',
                text: 'En kısa sürede size dönüş yapacağız.',
                confirmButtonColor: '#002147'
            });
            // Formu temizle
            document.getElementById('iletisimForm').reset();
        } else {
            throw new Error(data.hata || 'Bir hata oluştu');
        }

    } catch (error) {
        console.error('Hata:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: 'Mesaj gönderilemedi: ' + error.message,
            confirmButtonColor: '#002147'
        });
    } finally {
        // Butonu eski haline getir
        btn.disabled = false;
        btn.innerHTML = orgText;
    }
});
