# Payment System Integration Guide

Bu sənəd Backlify layihəsinə əlavə edilən ödəmə sistemi inteqrasyasını izah edir.

## Yeni Əlavə Edilən Səhifələr

### 1. Uğurlu Ödəniş Səhifəsi (`/payment/success`)

**Məqsəd:** Ödəniş uğurla tamamlandıqda istifadəçinin yönləndiriləcəyi səhifə.

**Xüsusiyyətlər:**
- ✅ Uğurlu ödəniş göstəricisi
- 📋 Ödəniş detalları (Transaction ID, məbləğ, valyuta, status)
- 🎯 Dashboard-a davam etmək üçün düymə
- 🏠 Ana səhifəyə qayıtmaq üçün düymə
- 📧 Təsdiq email-i göndərildiyi barədə məlumat

**URL Parametrləri:**
- `transaction_id` - Əməliyyat ID-si
- `amount` - Ödəniş məbləği
- `currency` - Valyuta (default: USD)
- `status` - Status (default: success)

**Nümunə URL:**
```
/payment/success?transaction_id=12345&amount=99.99&currency=USD&status=success
```

### 2. Uğursuz Ödəniş Səhifəsi (`/payment/error`)

**Məqsəd:** Ödəniş zamanı xəta baş verdikdə istifadəçinin yönləndiriləcəyi səhifə.

**Xüsusiyyətlər:**
- ❌ Xəta göstəricisi
- 📋 Xəta detalları (Error Code, Error Message, Transaction ID)
- 💡 Xəta növünə görə təkliflər
- 🔄 Yenidən cəhd etmək üçün düymə
- ⬅️ Geri qayıtmaq üçün düymə
- 🏠 Ana səhifəyə qayıtmaq üçün düymə
- 📞 Dəstək komandası ilə əlaqə məlumatı

**URL Parametrləri:**
- `error_code` - Xəta kodu
- `error_message` - Xəta mesajı
- `transaction_id` - Əməliyyat ID-si

**Dəstəklənən Xəta Kodları:**
- `INSUFFICIENT_FUNDS` - Kifayət qədər vəsait yoxdur
- `CARD_DECLINED` - Kart rədd edildi
- `EXPIRED_CARD` - Kartın müddəti bitib
- `INVALID_CARD` - Yanlış kart məlumatları

**Nümunə URL:**
```
/payment/error?error_code=CARD_DECLINED&error_message=Your+card+was+declined&transaction_id=12345
```

### 3. Ödəniş Callback Səhifəsi (`/payment/callback`)

**Məqsəd:** Epoint sisteminin ödəniş nəticəsi barədə məlumatı serverinizə göndərəcəyi URL (Webhook/Callback).

**Xüsusiyyətlər:**
- ⏳ Callback emal edilir göstəricisi
- 📊 Callback statusu (processing, success, failed, error)
- 📋 Callback məlumatları (Transaction ID, status, məbləğ, timestamp)
- 🔐 İmza yoxlaması
- 🎯 Dashboard-a davam etmək üçün düymə
- 🏠 Ana səhifəyə qayıtmaq üçün düymə

**URL Parametrləri:**
- `transaction_id` - Əməliyyat ID-si
- `status` - Ödəniş statusu
- `amount` - Ödəniş məbləği
- `currency` - Valyuta
- `signature` - Təhlükəsizlik imzası
- `timestamp` - Zaman damgası

**Nümunə URL:**
```
/payment/callback?transaction_id=12345&status=success&amount=99.99&currency=USD&signature=abc123&timestamp=2024-01-01T12:00:00Z
```

## Təhlükəsizlik

Bütün ödəmə səhifələri `RequireAuth` komponenti ilə qorunur və yalnız autentifikasiya olunmuş istifadəçilər tərəfindən əlçatan olur.

## Stil və Dizayn

Bütün səhifələr layihənin mövcud dizayn sisteminə uyğun olaraq yaradılıb:

- 🌟 Glassmorphism effektləri
- 🎨 Gradient arxa fonlar
- ✨ Framer Motion animasiyaları
- 📱 Responsive dizayn
- 🎯 Bootstrap komponentləri
- 🔵 Layihənin rəng sxemi

## Routing

Yeni səhifələr `App.js` faylında əlavə edilib:

```javascript
<Route path="/payment/success" element={
  <RequireAuth>
    <PaymentSuccessPage />
  </RequireAuth>
} />
<Route path="/payment/error" element={
  <RequireAuth>
    <PaymentErrorPage />
  </RequireAuth>
} />
<Route path="/payment/callback" element={
  <RequireAuth>
    <PaymentCallbackPage />
  </RequireAuth>
} />
```

## Backend İnteqrasiyası

Callback səhifəsində backend API-yə məlumat göndərmək üçün:

```javascript
const response = await fetch('/api/payment/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(callbackData)
});
```

## Test Etmək

Səhifələri test etmək üçün:

1. Layihəni işə salın: `npm start`
2. Autentifikasiya olun
3. Aşağıdakı URL-ləri ziyarət edin:
   - `/payment/success?transaction_id=123&amount=99.99`
   - `/payment/error?error_code=CARD_DECLINED&error_message=Test+error`
   - `/payment/callback?transaction_id=123&status=success&amount=99.99`

## Təkmilləşdirmə Təklifləri

- 📊 Ödəniş statistikaları
- 📧 Email bildirişləri
- 🔔 Push bildirişləri
- 💳 Kredit kartı məlumatlarının saxlanması
- 📱 Mobil tətbiq dəstəyi

## Dəstək

Hər hansı sual və ya problem üçün:
- 📧 Email: support@backlify.com
- 📚 Dokumentasiya: [Backlify Docs](https://docs.backlify.com)
- 💬 Discord: [Backlify Community](https://discord.gg/backlify)
