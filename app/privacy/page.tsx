import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Social Automation",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Last updated: November 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 mb-4">
              Social Automation ("we", "our", or "the App") helps creators automate video workflows such as processing content, generating metadata, and uploading videos to YouTube.
            </p>
            <p className="text-gray-600 mb-4">
              We value your privacy and only access the minimum information necessary to perform these actions.
            </p>
            <div className="border-t border-gray-300 my-6"></div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Google Account Information:</strong> When you connect your YouTube account, we receive access tokens through Google's secure OAuth 2.0 process.</li>
              <li><strong>YouTube Video Data:</strong> We access and upload video content only when you explicitly authorize it within the app.</li>
              <li><strong>App Usage Data:</strong> Basic usage logs (like workflow runs or upload success) may be stored for debugging and improving the service.</li>
            </ul>
            <p className="text-gray-600 mb-4">
              We do not collect personal information such as passwords, financial details, or sensitive data.
            </p>
            <div className="border-t border-gray-300 my-6"></div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <p className="text-gray-600 mb-4">
              We use your data only to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Automate the upload and management of videos to your connected YouTube account.</li>
              <li>Generate video titles, tags, and descriptions with AI (if enabled).</li>
              <li>Maintain app functionality and improve reliability.</li>
            </ul>
            <p className="text-gray-600 mb-4">
              We do not sell, share, or rent your information to any third parties.
            </p>
            <div className="border-t border-gray-300 my-6"></div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
            <p className="text-gray-600 mb-4">
              All credentials and tokens are securely stored using environment variables and encrypted storage. Tokens are never shared outside the app and can be revoked at any time from your Google Account Permissions.
            </p>
            <div className="border-t border-gray-300 my-6"></div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Control</h2>
            <p className="text-gray-600 mb-4">
              You can:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Revoke app access anytime via Google Account Settings.</li>
              <li>Request data deletion or removal of logs by contacting us at <a href="mailto:support@social-automation.app" className="text-purple-600 hover:text-purple-800 underline">support@social-automation.app</a>.</li>
            </ul>
            <div className="border-t border-gray-300 my-6"></div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. Updates will be posted on this page.
            </p>
            <div className="border-t border-gray-300 my-6"></div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions, please reach out to:
            </p>
            <p className="text-gray-600">
              <a href="mailto:g.dalaqishvili01@gmail.com" className="text-purple-600 hover:text-purple-800 underline">g.dalaqishvili01@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

