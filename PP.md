# Privacy Policy

**Plural Cloud**
Last updated: March 6, 2026

## 1. Overview

Plural Cloud ("the Service") is a self-hosted web application. This policy explains what data we collect, why, and how it is handled.

## 2. Data We Collect

### Discord
- Discord user ID
- Discord username
- Discord avatar URL

This is collected when you sign in via Discord OAuth2 and is used solely to identify your account.

### Minecraft / Microsoft
- Minecraft UUID
- Minecraft username

This is collected when you voluntarily link a Minecraft account. It is used to look up your system data when you join a Minecraft server running the Plural Cloud plugin.

### PluralKit
- PluralKit system token (stored encrypted)
- PluralKit system ID
- Member names, display names, pronouns, colours, avatar URLs, and descriptions

This data is imported from PluralKit at your request and is used to proxy your system members in-game. Your PluralKit token is never returned to the client after being saved.

## 3. Data We Do Not Collect

- Microsoft account credentials or personal information beyond Minecraft UUID/username
- Xbox Live data beyond what is required to obtain the Minecraft profile
- Payment information
- IP addresses (beyond standard server logs)
- Any data from players who have not registered with the Service

## 4. How We Use Your Data

- To authenticate you via Discord
- To look up your system when you join a supported Minecraft server
- To sync member data with PluralKit at your request
- To display your linked accounts on the dashboard

We do not sell, share, or use your data for advertising or analytics.

## 5. Data Retention

Your data is stored for as long as your account exists. You may delete your account and all associated data at any time by contacting us via Discord. Unlinking a Minecraft account or PluralKit token removes that data immediately.

## 6. Third-Party Services

The Service uses the following third-party services:

- **Discord** — authentication ([Discord Privacy Policy](https://discord.com/privacy))
- **Microsoft / Xbox Live** — Minecraft account verification ([Microsoft Privacy Statement](https://privacy.microsoft.com))
- **PluralKit** — member data sync ([PluralKit Privacy Policy](https://pluralkit.me/privacy))
- **Crafatar** — Minecraft avatar rendering ([crafatar.com](https://crafatar.com))

## 7. Security

Data is stored in a PostgreSQL database on a self-hosted VPS. Sensitive tokens are not exposed via the API. We use HTTPS in production and JWT-based authentication.

## 8. Your Rights

You have the right to:
- Access the data we hold about you
- Request correction of inaccurate data
- Request deletion of your data
- Unlink any connected account at any time via the dashboard

## 9. Changes to This Policy

We may update this policy at any time. Continued use of the Service after changes constitutes acceptance of the updated policy.

## 10. Contact

For any privacy-related questions or data requests, contact us via Discord.