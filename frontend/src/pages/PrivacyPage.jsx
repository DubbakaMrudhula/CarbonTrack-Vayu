import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LEGAL from '../utils/legal';

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | Vayu';
  }, []);
  return (
    <article>
      <h1>Privacy Policy</h1>

      <p className="legal-review-notice">
        <strong>Note:</strong> This policy has not been reviewed by a lawyer.
        It does not claim compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act)
        or any other law. The operator should obtain legal advice before making this service available to the public.
      </p>

      <p>
        <strong>Effective date:</strong> {LEGAL.EFFECTIVE_DATE}<br />
        <strong>Operator:</strong> {LEGAL.OPERATOR_NAME}<br />
        <strong>Contact:</strong> {LEGAL.CONTACT_EMAIL}
      </p>

      <h2>1. What this service does</h2>
      <p>
        Vayu is a personal carbon footprint tracker. You log daily activities
        (transportation, electricity, food, shopping) and the service calculates estimated
        CO2 equivalent emissions using published emission factors. All estimates are
        approximations based on published data and are not certified by any government
        body or scientific institution.
      </p>

      <h2>2. Data we collect and store</h2>
      <ul>
        <li>Your name and email address (provided at registration)</li>
        <li>A hashed copy of your password (the original password is never stored)</li>
        <li>Your account preferences: country, region, currency, diet type, primary transport mode, household size, focus categories, weekly target</li>
        <li>Activity logs you create: category, activity type, quantity, unit, date, notes, and the calculated CO2e value</li>
        <li>Timestamps of when records were created or updated</li>
      </ul>
      <p>We do not collect any information about your device, browser, or location beyond what you explicitly provide.</p>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To authenticate you and keep your session active</li>
        <li>To calculate and display your carbon footprint estimates</li>
        <li>To show you a summary of your logged activities and trends</li>
      </ul>
      <p>We do not use your data for advertising, profiling, or any purpose beyond providing the service you signed up for.</p>

      <h2>4. Third-party services and analytics</h2>
      <p>
        This service does not use any third-party analytics tools (such as Google Analytics),
        advertising networks, or tracking pixels. No personal data is shared with any third party
        except as required by applicable law.
      </p>

      <h2>5. Authentication tokens</h2>
      <p>
        When you sign in, a JSON Web Token (JWT) is issued and stored in your browser's
        localStorage. This token is sent with each request to authenticate you.
        It expires after one hour. If your session expires, you will be asked to sign in again.
        Clearing your browser's localStorage will sign you out.
      </p>

      <h2>6. Data retention</h2>
      <p>
        Your data is kept for as long as your account exists. If you delete your account,
        all associated data (including your name, email address, hashed password, preferences,
        and all activity logs) is permanently deleted. Deletion is immediate and cannot be undone.
      </p>

      <h2>7. Your rights and withdrawing consent</h2>
      <p>
        You may update your name and preferences at any time from the Profile page.
        You may delete your account at any time from the Settings page.
        Deleting your account constitutes withdrawing your consent for us to process your data.
      </p>
      <p>
        Under applicable Indian data protection law, including the Digital Personal Data Protection Act, 2023,
        you may have additional rights. For enquiries, contact: {LEGAL.GRIEVANCE_CONTACT}.
      </p>

      <h2>8. Data security</h2>
      <p>
        Passwords are hashed using BCrypt before storage. Data is transmitted over HTTPS in production.
        We apply reasonable technical and organisational measures to protect your data,
        but no system is completely secure. Use a strong, unique password for your account.
      </p>

      <h2>9. Children</h2>
      <p>
        This service is not intended for children under 18 years of age. Do not create an account
        if you are under 18.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        If we make material changes to this policy, we will update the effective date above.
        Continued use of the service after changes are posted constitutes acceptance of the revised policy.
      </p>

      <h2>11. Governing law and jurisdiction</h2>
      <p>
        This policy is governed by the laws of {LEGAL.GOVERNING_LAW}.
        Disputes will be subject to the exclusive jurisdiction of {LEGAL.JURISDICTION}.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy-related enquiries or to exercise your rights, contact:{' '}
        {LEGAL.CONTACT_EMAIL}.
      </p>

      <hr />
      <p className="legal-footer-note">
        <Link to="/terms">Terms of Service</Link>
      </p>
    </article>
  );
}

