# Logs Management Feature with User Login Tracking

This document describes the implementation of the logs management feature for the Hospital Management System admin section, which allows administrators to view, download, and manage system log files, with a special emphasis on tracking user logins.

## Features

1. View a list of all system log files with metadata
2. View the contents of specific log files with formatted display
3. Download log files for offline analysis
4. Delete log files when no longer needed
5. Track user login/logout events
6. Filter logs by various criteria including:
   - User role
   - Event type (login, logout)
   - User name
   - Log level
   - Channel

## Components

### Backend (PHP/Laravel)

1. **LogsController.php**
   - Lists all log files in the storage/logs directory
   - Displays the contents of specific log files
   - Enables downloading of log files
   - Allows deletion of log files
   - Enhanced parsing of log entries with user login detection

2. **LoginController.php**
   - Updated to log user login events
   - Records user details, IP address, and user agent
   - Logs both successful logins and logouts

3. **EventServiceProvider.php**
   - Listens for Laravel authentication events (Login, Logout, Failed)
   - Logs detailed information about these events

4. **LogActivity.php Middleware**
   - Tracks user activity related to logs management
   - Records who viewed, downloaded, or deleted log files

5. **Console Commands**
   - UserLoginHistory: View login history through the command line
   - GenerateLoginLogs: Generate test login data for development

### Frontend (React/TypeScript)

1. **Logs.tsx**
   - Displays the list of all log files
   - Provides controls to view, download, or delete logs
   - Includes search functionality to filter logs by name

2. **LogDetails.tsx**
   - Enhanced to display detailed login information
   - Features filters for:
     - Log levels (ERROR, WARNING, INFO, DEBUG)
     - Log channels (different components of the system)
     - User roles (admin, doctor, clinical_staff, patient)
     - Event types (LOGIN, LOGOUT)
     - User names
   - Special formatting for login events

## Security Considerations

1. All logs routes are protected by the AdminMiddleware
2. The LogActivity middleware adds additional audit trail for logs access
3. Special formatting helps identify potential security issues

## Usage

1. Access logs via the admin dashboard sidebar
2. Use filters to find specific login events or system errors
3. Download logs for offline analysis or compliance reporting
4. Use the CLI commands for automated monitoring:
   - `php artisan logs:login-history --role=admin`
   - `php artisan logs:login-history --date=2023-05-20`

## Future Enhancements

1. Real-time log monitoring with websockets
2. Advanced analytics dashboard for login patterns
3. Automated alerts for suspicious login activities
4. Export of filtered logs reports in various formats (PDF, CSV)
