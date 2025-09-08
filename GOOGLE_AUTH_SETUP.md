# Google Authentication Setup Guide

Google Authentication əlavə edildi. İndi konfiqurasiya üçün aşağıdakı addımları izləyin:

## 1. Google Cloud Console Setup

### Addım 1: Google Cloud Console-a girin
- [Google Cloud Console](https://console.cloud.google.com/) -a girin
- Yeni project yaradın və ya mövcud project seçin

### Addım 2: OAuth 2.0 Credentials yaradın
1. Sol tərəfdəki menüdan **APIs & Services** > **Credentials** seçin
2. **+ CREATE CREDENTIALS** düyməsinə basın
3. **OAuth client ID** seçin
4. Application type olaraq **Web application** seçin
5. Name qismini doldurun (məsələn: "Backlify Frontend")

### Addım 3: Authorized JavaScript origins əlavə edin
**Authorized JavaScript origins** bölməsinə aşağıdakıları əlavə edin:
- `http://localhost:3000` (development üçün)
- `https://yourdomain.com` (production domain-iniz)
- `https://your-netlify-app.netlify.app` (Netlify istifadə edirsizsə)

### Addım 4: Client ID-ni kopyalayın
- **Create** düyməsinə basın
- Yaradılan Client ID-ni kopyalayın (`.apps.googleusercontent.com` ilə bitir)

## 2. Environment Variables

### Addım 1: .env faylı yaradın
Layihənin root qovluğunda `.env` faylı yaradın:

```bash
# .env
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### Addım 2: Client ID-ni əlavə edin
Google Cloud Console-dan kopyaladığınız Client ID-ni `.env` faylında `REACT_APP_GOOGLE_CLIENT_ID` dəyişəninə əlavə edin.

**Nümunə:**
```bash
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## 3. Testing

### Local Development
1. `.env` faylını yaratdığınızdan əmin olun
2. `npm start` ilə aplikasiyanı başladın
3. `/login` səhifəsinə gedin
4. "Continue with Google" düyməsinə basın

### Production Deployment
1. Hosting platform-unuzda (Netlify, Vercel, vs.) environment variable əlavə edin:
   - Key: `REACT_APP_GOOGLE_CLIENT_ID`
   - Value: sizin Google Client ID-niz

## 4. Backend Integration (İstəyə bağlı)

Hal-hazırda Google authentication frontend-də işləyir və fallback olaraq avtomatik user yaradır. 

Backend-də Google authentication endpointi yaratmaq istəyirsizsə:

### Backend Endpoint
```javascript
// POST /auth/google-login
{
  "google_token": "...",
  "email": "user@gmail.com", 
  "name": "User Name",
  "picture": "https://...",
  "google_id": "123456789"
}
```

### Response Format
```javascript
{
  "XAuthUserId": "username",
  "email": "user@gmail.com",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

## 5. Troubleshooting

### Xəta: "Invalid client ID"
- `.env` faylında Client ID düzgün olduğunu yoxlayın
- Browser cache-ni təmizləyin
- Development server-i restart edin

### Xəta: "Not authorized"
- Google Cloud Console-da Authorized JavaScript origins düzgün əlavə edilib-edilmədiyini yoxlayın
- Domain-in düzgün olduğunu təsdiq edin

### Development vs Production
- Development: `http://localhost:3000`
- Production: sizin real domain-iniz

Bütün addımları yerinə yetirdikdən sonra Google Authentication işləyəcək!
