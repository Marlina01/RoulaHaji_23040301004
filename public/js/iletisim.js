document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#iletisimForm');
    const submitBtn = document.querySelector('#btnGonder');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const ad_soyad = document.getElementById('ad_soyad').value;
            const email = document.getElementById('email').value;
            const mesaj = document.getElementById('mesaj').value;
            const feedback = document.getElementById('formFeedback');

            if (!ad_soyad || !email || !mesaj) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Eksik Bilgi',
                    text: 'Lütfen tüm alanları doldurun.',
                    confirmButtonColor: '#0d6efd'
                });
                return;
            }

            // Butonu devre dışı bırak
            const originalText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = "Gönderiliyor...";

            try {
                const response = await fetch('/api/iletisim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ad_soyad, email, mesaj })
                });

                const result = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Başarılı!',
                        text: 'Mesajınız başarıyla gönderildi!',
                        confirmButtonColor: '#198754'
                    });
                    form.reset();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Hata',
                        text: 'Hata: ' + (result.hata || 'Bir sorun oluştu'),
                        confirmButtonColor: '#dc3545'
                    });
                }
            } catch (error) {
                console.error('Hata:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Bağlantı Hatası',
                    text: 'Sunucuyla bağlantı kurulamadı.',
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        });
    }
});
