import { PageHeader } from '@/components/ui';
import { Shield } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="container-max section-padding animate-fade-in max-w-4xl">
      <PageHeader title="Privacy Policy" subtitle="Last updated: October 2026" icon={Shield} />

      <div className="card space-y-6">
        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">Information We Collect</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            We collect your name, email, phone number, city, address, pincode, and location coordinates when you sign up. This information is used solely to schedule and coordinate e-waste pickups. We do not sell or share your personal data with third parties.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">How We Use Your Data</h2>
          <ul className="space-y-2 text-sm text-forest-600">
            <li>• To schedule pickups and coordinate with our collection team</li>
            <li>• To send you notifications about your pickup status</li>
            <li>• To generate recycling certificates with your name</li>
            <li>• To calculate rewards, points, and wallet balance</li>
            <li>• To improve our service and understand community impact</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">Data Security</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            Your data is stored securely using Supabase with Row Level Security. You can only access and modify your own data. Admin access is restricted to authorised team members. Passwords are hashed and managed by Supabase Auth.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">Your Rights</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            You can edit your profile information at any time. You may request deletion of your account and associated data by contacting us. Your pickup history and certificates are retained for record-keeping purposes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">Cookies & Tracking</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            We use only essential cookies to maintain your login session. We do not use advertising or third-party tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">Contact</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            Questions about privacy? Contact us through the Contact page or in-app messaging.
          </p>
        </section>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="container-max section-padding animate-fade-in max-w-4xl">
      <PageHeader title="Terms of Service" subtitle="Last updated: October 2026" icon={Shield} />

      <div className="card space-y-6">
        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">1. Service Description</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            Reboot Earth is an e-waste collection platform that connects users with authorised recycling partners. We facilitate the collection, grading, and responsible recycling of electronic waste.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">2. Rewards & Payments</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            Wallet cash and points are virtual rewards with no real monetary value. Rates shown are estimates and may differ from the final value set at collection. Hazardous items may receive zero or minimum payment.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">3. Data Responsibility</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            You are responsible for backing up and wiping personal data from devices before handing them over. While our recycling partner ensures data destruction, Reboot Earth is not liable for any data remaining on devices.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">4. Hazardous Items</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            Swollen, leaking, or damaged batteries must be flagged as hazardous. Follow the safe-handling instructions provided. Reboot Earth is not liable for damage caused by improper handling of hazardous items before collection.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">5. Pickup Scheduling</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            Pickups are subject to availability and service zone coverage. The admin may reschedule, reject, or cancel pickups with a reason. You may cancel or reschedule at any time before collection.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">6. Acceptable Use</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            You agree not to misuse the platform, submit false information, or attempt to access other users' data. Violations may result in account suspension.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-800 mb-2">7. Changes to Terms</h2>
          <p className="text-sm text-forest-600 leading-relaxed">
            We may update these terms as the service evolves. Continued use after changes constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
}
