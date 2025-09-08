# Backlify API Usage Limits System

This directory contains the frontend components for the Backlify API Usage Limits system, which provides real-time monitoring, plan management, and limit enforcement for API usage.

## Components Overview

### 1. PlanSelectionInterface.js
**Purpose**: Displays available subscription plans and allows users to select or upgrade their plan.

**Features**:
- Fetches plans from `/api/user/plans` endpoint
- Shows plan features, pricing, and usage limits
- Handles plan selection and upgrade flows
- Special handling for Enterprise unlimited plans
- Visual indicators for popular plans and current plan

**Props**:
- `currentPlan`: Current user's plan object
- `onPlanSelect`: Callback when user selects a plan
- `onUpgrade`: Callback when user wants to upgrade
- `loading`: Loading state
- `showUsageInfo`: Whether to show usage limit information

### 2. UsageDashboard.js
**Purpose**: Real-time dashboard showing API usage statistics and limits.

**Features**:
- Fetches usage data from `/api/{apiId}/usage` endpoint or debug endpoint
- Shows progress bars for requests and projects usage
- Real-time updates with configurable refresh interval
- Visual indicators for usage levels (normal, high, exceeded)
- Special handling for Enterprise unlimited plans
- Warning alerts when approaching limits
- Uses debug endpoint for real-time user data when `useRealData={true}`

**Props**:
- `apiId`: ID of the API to monitor (optional when using debug endpoint)
- `refreshInterval`: Auto-refresh interval in milliseconds (default: 30000)
- `onUpgradeClick`: Callback when user clicks upgrade
- `useRealData`: Whether to use real data from debug endpoint (default: false)
- `username`: Username for debug endpoint (optional, uses localStorage if not provided)
- `showApiList`: Whether to show list of user's APIs
- `userApis`: Array of user's APIs to display

### 3. LimitNotifications.js
**Purpose**: Global notification system for usage limit warnings and exceeded alerts.

**Features**:
- Listens for global API errors via custom events
- Shows toast notifications for limit warnings
- Modal dialogs for detailed limit information
- Auto-hide functionality with configurable delay
- Upgrade prompts when limits are exceeded
- Visual progress indicators

**Props**:
- `onUpgradeClick`: Callback when user wants to upgrade
- `onDismiss`: Callback when user dismisses notification
- `autoHide`: Whether to auto-hide notifications
- `hideDelay`: Delay before auto-hiding (default: 10000ms)

### 4. AdminUsagePanel.js
**Purpose**: Admin-only panel for monitoring system-wide usage statistics.

**Features**:
- Fetches admin stats from `/api/user/usage/stats` endpoint
- Shows summary cards with key metrics
- Top users and APIs tables
- Search and filtering capabilities
- Real-time updates with configurable refresh
- Export functionality (placeholder)

**Props**:
- `refreshInterval`: Auto-refresh interval (default: 60000ms)
- `showCharts`: Whether to show chart components (future feature)

## API Integration

### Endpoints Used

1. **GET /api/user/plans**
   - Fetches available subscription plans
   - Returns plan details, pricing, and features

2. **GET /api/{apiId}/usage**
   - Fetches usage statistics for a specific API
   - Returns current usage, limits, and remaining quotas

3. **GET /api/user/usage/stats**
   - Fetches admin-level usage statistics
   - Returns user stats, API stats, and system metrics

4. **GET /debug-user-info?XAuthUserId={username}**
   - Fetches real-time user debug information
   - Returns current usage, limits, plan, and log counts
   - Used when `useRealData={true}` in UsageDashboard

### Error Handling

The system includes comprehensive error handling for:

- **403 Status Codes**: Usage limit exceeded errors
- **Network Errors**: Connection issues
- **API Errors**: General API failures
- **Limit Warnings**: Approaching usage limits

## Usage Examples

### Basic Plan Selection
```jsx
import PlanSelectionInterface from './components/usage/PlanSelectionInterface';

<PlanSelectionInterface
  currentPlan={userPlan}
  onPlanSelect={handlePlanSelect}
  onUpgrade={handleUpgrade}
  showUsageInfo={true}
/>
```

### Usage Dashboard
```jsx
import UsageDashboard from './components/usage/UsageDashboard';

// Basic usage with specific API
<UsageDashboard
  apiId="your-api-id"
  refreshInterval={30000}
  onUpgradeClick={handleUpgrade}
/>

// Real-time usage with debug endpoint
<UsageDashboard
  useRealData={true}
  username="your-username"
  refreshInterval={30000}
  onUpgradeClick={handleUpgrade}
  showApiList={true}
  userApis={userApis}
/>
```

### Limit Notifications
```jsx
import LimitNotifications from './components/usage/LimitNotifications';

<LimitNotifications
  onUpgradeClick={handleUpgrade}
  onDismiss={handleDismiss}
  autoHide={true}
  hideDelay={10000}
/>
```

### Admin Panel
```jsx
import AdminUsagePanel from './components/usage/AdminUsagePanel';

<AdminUsagePanel
  refreshInterval={60000}
  showCharts={true}
/>
```

## Styling

All components use Bootstrap classes and custom CSS for:
- Glass morphism effects
- Gradient backgrounds
- Smooth animations with Framer Motion
- Responsive design
- Dark theme compatibility

## Dependencies

- React Bootstrap
- Framer Motion
- React Hot Toast
- React Bootstrap Icons

## Future Enhancements

1. **Charts Integration**: Add Chart.js or similar for visual data representation
2. **Real-time Updates**: WebSocket integration for live updates
3. **Export Functionality**: CSV/PDF export for admin data
4. **Advanced Filtering**: More sophisticated filtering options
5. **Usage Predictions**: AI-powered usage forecasting
6. **Custom Limits**: User-defined usage alerts

## Error States

The system handles various error states gracefully:

- **Loading States**: Spinners and skeleton loaders
- **Empty States**: Helpful messages and action buttons
- **Error States**: Clear error messages with retry options
- **Network Issues**: Offline indicators and retry mechanisms

## Performance Considerations

- **Caching**: API responses are cached to reduce server load
- **Debouncing**: Search and filter inputs are debounced
- **Lazy Loading**: Large datasets are loaded on demand
- **Background Updates**: Non-blocking background data refresh
