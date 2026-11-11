import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LEGAL from '../utils/legal';

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service | Vayu';
  }, []);
  return (
    <article>
      <h1>Terms of Service</h1>

      <p className="legal-review-notice">
        <strong>Note:</strong> This document has not been reviewed by a lawyer.
        It does not constitute legal advice. The operator should obtain legal advice before
        making this service available to the public.
      </p>

      <p>
        <strong>Effective date:</strong> {LEGAL.EFFECTIVE_DATE}<br />
        <strong>Operator:</strong> {LEGAL.OPERATOR_NAME}<br />
        <strong>Contact:</strong> {LEGAL.CONTACT_EMAIL}
      </p>

      <h2>1. Acceptance of terms</h2>
      <p>
        By creating an account and using Vayu, you confirm that you have read and agree to these Terms of Service
        and the <Link to="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service.
      </p>

      <h2>2. Description of service</h2>
      <p>
        Vayu is a personal carbon footprint tracker. It allows you to log daily activities
        in four categories (transportation, electricity, food, shopping) and displays estimated
        CO2 equivalent emissions based on published emission factors. The estimates are approximations
        and are not certified by any government body or scientific institution.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old to use this service. By registering, you represent
        that you meet this requirement.
      </p>

      <h2>4. Account responsibility</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials.
        You are responsible for all activity that occurs under your account. Notify us immediately
        at {LEGAL.CONTACT_EMAIL} if you believe your account has been compromised.
        We are not liable for any loss resulting from unauthorised use of your account.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for any unlawful purpose</li>
        <li>Attempt to gain unauthorised access to any part of the service or its infrastructure</li>
        <li>Transmit any code, files, or programs designed to disrupt or harm the service</li>
        <li>Scrape, crawl, or systematically extract data from the service</li>
        <li>Impersonate any person or entity</li>
        <li>Use the service in any way that violates applicable law or regulation</li>
      </ul>

      <h2>6. Accuracy of estimates</h2>
      <p>
        Emission calculations are estimates based on published emission factors from sources
        such as the Central Electricity Authority (CEA) CO2 Baseline Database, UK DESNZ,
        and the IPCC. Actual emissions may differ. Vayu makes no warranty regarding the
        accuracy, completeness, or fitness for any purpose of these estimates.
      </p>

      <h2>7. No warranty</h2>
      <p>
        The service is provided "as is" and "as available" without warranty of any kind,
        express or implied, including but not limited to warranties of merchantability,
        fitness for a particular purpose, or non-infringement. We do not warrant that
        the service will be uninterrupted, error-free, or free of viruses or other harmful components.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, {LEGAL.OPERATOR_NAME} shall not be
        liable for any indirect, incidental, special, consequential, or punitive damages
        arising out of or in connection with your use of or inability to use the service,
        even if we have been advised of the possibility of such damages.
        Our total liability to you for any claim arising out of or relating to these terms
        or the service shall not exceed the amount you have paid to us in the twelve months
        preceding the claim (or zero, if the service was provided free of charge).
      </p>

      <h2>9. Termination</h2>
      <p>
        You may terminate your account at any time from the Settings page, which will permanently
        delete all your data. We reserve the right to suspend or terminate accounts that violate
        these terms, with or without notice.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. We will update the effective date when we do.
        Continued use of the service after changes are posted constitutes acceptance of the revised terms.
      </p>

      <h2>11. Governing law and jurisdiction</h2>
      <p>
        These terms are governed by the laws of {LEGAL.GOVERNING_LAW}.
        Any dispute arising from these terms or the service will be subject to the exclusive
        jurisdiction of {LEGAL.JURISDICTION}.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these terms, contact: {LEGAL.CONTACT_EMAIL}.
      </p>

      <hr />
      <p className="legal-footer-note">
        <Link to="/privacy">Privacy Policy</Link>
      </p>
    </article>
  );
}

