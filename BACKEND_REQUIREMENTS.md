# Backend API Requirements for Account Settings

## Overview
Bu sənəd AccountSettingsPage üçün lazım olan backend API endpointlərini təsvir edir

## 1. User Profile Management

### GET /api/user/profile
**Məqsəd**: İstifadəçinin profil məlumatlarını əldə etmək

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "company": "Tech Company",
    "phone": "+994 50 123 45 67",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/user/profile
**Məqsəd**: İstifadəçinin profil məlumatlarını yeniləmək

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "company": "Tech Company",
  "phone": "+994 50 123 45 67"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "company": "Tech Company",
    "phone": "+994 50 123 45 67",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/user/change-password
**Məqsəd**: İstifadəçinin şifrəsini dəyişmək

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 2. Subscription Management

### GET /api/user/subscription
**Məqsəd**: İstifadəçinin abunəlik məlumatlarını əldə etmək

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "plan": "pro",
    "planName": "Pro Plan",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "price": 0.01,
    "currency": "AZN",
    "features": {
      "apiCalls": 10000,
      "maxProjects": 5,
      "prioritySupport": true,
      "analytics": true,
      "customIntegrations": true
    },
    "autoRenew": true
  }
}
```

### POST /api/user/subscription/upgrade
**Məqsəd**: Abunəliyi yüksəltmək

**Request Body**:
```json
{
  "plan": "enterprise"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription upgrade initiated",
  "data": {
    "redirectUrl": "https://epoint.az/checkout/..."
  }
}
```

---

## 3. API Usage & Analytics

### GET /api/user/usage
**Məqsəd**: İstifadəçinin API istifadə statistikalarını əldə etmək

**Query Parameters**:
- `period`: `month` | `year` (default: `month`)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalCalls": 2347,
    "limit": 10000,
    "remaining": 7653,
    "thisMonth": 2347,
    "lastMonth": 1892,
    "dailyUsage": [
      { "date": "2024-01-01", "calls": 45 },
      { "date": "2024-01-02", "calls": 67 },
      { "date": "2024-01-03", "calls": 89 }
    ],
    "topEndpoints": [
      {
        "endpoint": "/api/schema/generate",
        "calls": 456,
        "success": 98.2,
        "avgResponseTime": 245
      },
      {
        "endpoint": "/api/database/connect",
        "calls": 234,
        "success": 99.1,
        "avgResponseTime": 156
      }
    ],
    "errorRate": 1.2,
    "avgResponseTime": 189
  }
}
```

### GET /api/user/usage/export
**Məqsəd**: İstifadə statistikalarını export etmək

**Query Parameters**:
- `format`: `csv` | `json` | `pdf` (default: `csv`)
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response**: File download

---

## 4. Request Logs

### GET /api/user/logs
**Məqsəd**: İstifadəçinin API request loglarını əldə etmək

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 100)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `status`: number (optional) - HTTP status code
- `endpoint`: string (optional) - endpoint filter

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "timestamp": "2024-01-15T14:30:25Z",
        "endpoint": "/api/schema/generate",
        "method": "POST",
        "status": 200,
        "responseTime": 245,
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "requestSize": 1024,
        "responseSize": 2048,
        "error": null
      },
      {
        "id": "log_124",
        "timestamp": "2024-01-15T14:28:12Z",
        "endpoint": "/api/database/connect",
        "method": "GET",
        "status": 500,
        "responseTime": 1200,
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "requestSize": 512,
        "responseSize": 256,
        "error": "Database connection timeout"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25
    }
  }
}
```

### GET /api/user/logs/export
**Məqsəd**: Request loglarını export etmək

**Query Parameters**:
- `format`: `csv` | `json` | `pdf` (default: `csv`)
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response**: File download

---

## 5. Notification Settings

### GET /api/user/notifications/settings
**Məqsəd**: İstifadəçinin bildiriş tənzimləmələrini əldə etmək

**Response**:
```json
{
  "success": true,
  "data": {
    "emailNotifications": true,
    "smsNotifications": false,
    "marketingEmails": false,
    "twoFactorAuth": false,
    "apiAccess": true,
    "securityAlerts": true,
    "billingNotifications": true
  }
}
```

### PUT /api/user/notifications/settings
**Məqsəd**: Bildiriş tənzimləmələrini yeniləmək

**Request Body**:
```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "marketingEmails": false,
  "twoFactorAuth": false,
  "apiAccess": true,
  "securityAlerts": true,
  "billingNotifications": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "data": {
    "emailNotifications": true,
    "smsNotifications": false,
    "marketingEmails": false,
    "twoFactorAuth": false,
    "apiAccess": true,
    "securityAlerts": true,
    "billingNotifications": true,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 6. Security & Two-Factor Authentication

### POST /api/user/2fa/enable
**Məqsəd**: İki faktorlu autentifikasiyanı aktivləşdirmək

**Response**:
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344"
    ]
  }
}
```
---

## 6. Account Management

### DELETE /api/user/account
**Məqsəd**: İstifadəçi hesabını silmək

**Request Body**:
```json
{
  "password": "userPassword123",
  "confirmation": "DELETE"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### GET /api/user/account/export
**Məqsəd**: İstifadəçi məlumatlarını export etmək (GDPR)

**Response**: File download (JSON format)

---

## Error Responses

Bütün endpointlər üçün standart error response formatı:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

### Common Error Codes:
- `FORBIDDEN`: İcazə yoxdur
- `VALIDATION_ERROR`: Input validation xətası
- `NOT_FOUND`: Resource tapılmadı
- `RATE_LIMIT_EXCEEDED`: Rate limit aşıldı
- `SUBSCRIPTION_EXPIRED`: Abunəlik bitib
- `QUOTA_EXCEEDED`: API limit aşıldı

---

## Rate Limiting

- **Profile endpoints**: 10 requests/minute
- **Usage endpoints**: 30 requests/minute  
- **Logs endpoints**: 20 requests/minute
- **Settings endpoints**: 5 requests/minute

---

## Database Schema Suggestions

### users table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  phone VARCHAR(20),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### subscriptions table:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### api_usage table:
```sql
CREATE TABLE api_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  request_size INTEGER,
  response_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### notification_settings table:
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  security_alerts BOOLEAN DEFAULT TRUE,
  billing_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Bu API endpointləri AccountSettingsPage-in bütün funksionallığını dəstəkləyəcək və professional bir dashboard təcrübəsi təmin edəcək.
