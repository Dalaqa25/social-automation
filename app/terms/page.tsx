import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Social Automation",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 font-extrabold mb-6 text-center">
          Terms of Service
        </h1>
        <p className="text-gray-500 mb-12 text-center">
          Effective date: {new Date().toLocaleDateString()}
        </p>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-500 mb-4">
              By using Social Automation, you agree to these Terms of Service. If you disagree, please do not use the app.
            </p>
            <div className="border-t border-gray-200 my-8"></div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-500 mb-4">
              Social Automation allows users to connect social media accounts (e.g., YouTube, TikTok) and automate uploads and captions through API-based workflows.
            </p>
            <div className="border-t border-gray-200 my-8"></div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-500 mb-4 space-y-3">
              <li>You must have the legal right to upload and share any video or content.</li>
              <li>You are responsible for compliance with YouTube's Terms of Service.</li>
              <li>You may not use Social Automation for illegal, harmful, or abusive purposes.</li>
            </ul>
            <div className="border-t border-gray-200 my-8"></div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations of Liability</h2>
            <p className="text-gray-500 mb-4">
              We provide this service "as is" without warranties. We are not responsible for data loss, service interruptions, or API limitations from YouTube or TikTok.
            </p>
            <div className="border-t border-gray-200 my-8"></div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Termination</h2>
            <p className="text-gray-500 mb-4">
              We reserve the right to suspend or terminate access if you violate these terms or use the service in a way that violates platform policies.
            </p>
            <div className="border-t border-gray-200 my-8"></div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes</h2>
            <p className="text-gray-500 mb-4">
              We may update these Terms from time to time. Continued use of the app means you accept any new version.
            </p>
            <div className="border-t border-gray-200 my-8"></div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
            <p className="text-gray-500 mb-4">
              If you have any questions:
            </p>
            <p className="text-gray-500">
              <a href="mailto:g.dalaqishvili01@gmail.com" className="text-purple-600 hover:text-pink-600 underline transition-colors">g.dalaqishvili01@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

