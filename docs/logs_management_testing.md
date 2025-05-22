# Logs Management Feature Testing Plan

## Overview
This document outlines the testing plan for the logs management feature implemented for the Hospital Management System's admin section. The feature allows administrators to view, download, and manage system log files, with special emphasis on tracking user logins.

## Prerequisites
- Hospital Management System running on localhost
- Admin account credentials
- At least one log file in the `storage/logs` directory

## Test Cases

### 1. Logs Listing

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC001 | 1. Login as admin<br>2. Navigate to logs section | The logs listing page displays correctly showing all log files with name, size, and modified date | ⬜️ |
| TC002 | Search for a specific log file using the search box | The logs list is filtered to show only matching log files | ⬜️ |
| TC003 | Verify no logs found behavior | When search criteria matches no logs, a "No logs found" message is displayed | ⬜️ |

### 2. Log File Details

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC004 | 1. In the logs listing page<br>2. Click "View" on a log file | The log details page displays showing all entries in the selected log file | ⬜️ |
| TC005 | Filter log entries by level | Only entries with the selected log level are displayed | ⬜️ |
| TC006 | Filter log entries by channel | Only entries from the selected channel are displayed | ⬜️ |
| TC007 | Filter log entries by user role | Only entries related to users with the selected role are displayed | ⬜️ |
| TC008 | Filter log entries by event type | Only entries of the selected event type are displayed | ⬜️ |
| TC009 | Filter log entries by user name | Only entries related to the selected user are displayed | ⬜️ |
| TC010 | Enable "Show only login events" checkbox | Only login/logout related events are displayed | ⬜️ |
| TC011 | Search for specific text in log entries | Only entries containing the search text are displayed | ⬜️ |
| TC012 | Verify display of login events special formatting | Login events are highlighted with green background and logout events with orange | ⬜️ |

### 3. Log File Operations

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC013 | Click "Download" on a log file in the listing | The log file is downloaded to the user's device | ⬜️ |
| TC014 | Click "Delete" on a log file and confirm deletion | The log file is deleted and removed from the list | ⬜️ |
| TC015 | Click "Download" on the log details page | The log file is downloaded to the user's device | ⬜️ |
| TC016 | Click "Back to Logs" on log details page | User is redirected to the logs listing page | ⬜️ |

### 4. Login Tracking

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC017 | 1. Login as any user<br>2. Check logs as admin | A login event is recorded with user details | ⬜️ |
| TC018 | 1. Logout as any user<br>2. Check logs as admin | A logout event is recorded with user details | ⬜️ |
| TC019 | 1. Attempt login with invalid credentials<br>2. Check logs as admin | A login failed event is recorded | ⬜️ |

### 5. Console Commands

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC020 | Run `php artisan logs:login-history` | Login history is displayed in the console | ⬜️ |
| TC021 | Run `php artisan logs:login-history --role=admin` | Only admin login history is displayed | ⬜️ |
| TC022 | Run `php artisan logs:login-history --date=2023-05-20` | Only login history for specified date is displayed | ⬜️ |
| TC023 | Run `php artisan logs:generate-test-data` | Test login logs are generated | ⬜️ |
| TC024 | Run `php artisan logs:generate-test-data 25` | 25 test login logs are generated | ⬜️ |

### 6. Access Control

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| TC025 | Try to access logs section as a non-admin user | Access is denied | ⬜️ |

## Test Execution

For each test case, record the status using the following indicators:
- ✅ Pass
- ❌ Fail
- ⏭️ Skipped
- ⬜️ Not Tested

## Bugs and Issues

Document any bugs or issues discovered during testing in the following format:

| Bug ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| | | | |

## Test Results Summary

Summary will be provided upon completion of testing.
