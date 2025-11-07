# SmartFarm360 Email Flow Documentation

## Overview
This document describes the correct email flow for different user registration scenarios in SmartFarm360.

## Email Flow Scenarios

### 1. Farm Owner Application Flow

#### Step 1: Application Submission
**Trigger:** Farm owner submits application via `/api/applications/submit`

**Emails Sent:**
1. **To Applicant:** "Application Received" confirmation email
   - Subject: "SmartFarm360 - Application Received"
   - Content: Confirms application was received and will be reviewed within 24 hours
   - Template: `EmailServiceHTML.sendApplicationConfirmationEmail()`

2. **To System Admin:** "New Application" notification email
   - Subject: "SmartFarm360 - New Application Received"
   - Content: Notifies admin of new application with applicant details
   - Template: `EmailServiceHTML.sendNewApplicationNotificationToAdmin()`

#### Step 2: Admin Approves Application
**Trigger:** System admin approves application via `/api/applications/{id}/approve`

**Emails Sent:**
1. **To Applicant:** "Application Approved - Welcome!" email with credentials
   - Subject: "SmartFarm360 - Application Approved - Welcome!"
   - Content: Congratulations message with username and password
   - Template: `EmailServiceHTML.sendApplicationApprovalEmail()`
   - **Note:** This is the ONLY email sent on approval - no separate welcome email

#### Step 3: Admin Rejects Application
**Trigger:** System admin rejects application via `/api/applications/{id}/reject`

**Emails Sent:**
1. **To Applicant:** "Application Status Update" email
   - Subject: "SmartFarm360 - Application Status Update"
   - Content: Rejection notification with reason
   - Template: `EmailServiceHTML.sendApplicationRejectionEmail()`

---

### 2. Supervisor Creation Flow (by Farm Owner)

**Trigger:** Farm owner creates supervisor via `/api/users/create`

**Emails Sent:**
1. **To Supervisor:** "Your Account Credentials" email
   - Subject: "SmartFarm360 - Your Account Credentials"
   - Content: Welcome message with username and password
   - Template: `EmailServiceHTML.sendCredentialsEmail()`

---

### 3. Worker Creation Flow (by Supervisor or Farm Owner)

**Trigger:** Supervisor/Farm owner creates worker via `/api/users/create`

**Emails Sent:**
1. **To Worker:** "Your Account Credentials" email
   - Subject: "SmartFarm360 - Your Account Credentials"
   - Content: Welcome message with username and password
   - Template: `EmailServiceHTML.sendCredentialsEmail()`

---

## Email Templates

All emails use HTML templates with:
- Professional design with SmartFarm360 branding
- Green color scheme (#10b981)
- Responsive layout
- Clear call-to-action buttons
- Security warnings where appropriate

## Important Notes

1. **No Duplicate Emails:** The `UserService.registerUser()` method does NOT send any emails. All emails are sent by the calling service (ApplicationService or UserService.createUserByRole).

2. **HTML Email Service:** All emails use `EmailServiceHTML` for consistent, professional formatting.

3. **Async Processing:** All email sending is asynchronous to avoid blocking the main application flow.

4. **Error Handling:** Email failures are logged but do not cause the main operation to fail.

5. **Security:** Passwords are only sent once via email. Users are encouraged to change passwords on first login.

## Configuration

Email settings are configured in `application.yml`:
- SMTP host, port, username, password
- Admin email address for notifications
- Email sender address

## Testing

To test the email flow:
1. Submit a farm owner application
2. Check applicant receives "Application Received" email
3. Check admin receives "New Application" notification
4. Approve the application as admin
5. Check applicant receives "Application Approved" email with credentials
6. Login with provided credentials
7. Create a supervisor and verify they receive credentials email
8. Create a worker and verify they receive credentials email
