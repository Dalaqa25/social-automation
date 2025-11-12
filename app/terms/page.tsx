import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Social Automation",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using our social automation service, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use License</h2>
            <p className="text-gray-600 mb-4">
              Permission is granted to temporarily use our service for personal, non-commercial use. This license does not include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Modifying or copying materials</li>
              <li>Using materials for commercial purposes</li>
              <li>Removing copyright or proprietary notations</li>
              <li>Transferring materials to another person</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Ensuring you have the right to use and share any content you submit</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Maintaining the security of your account credentials</li>
              <li>Not using the service for illegal or unauthorized purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice. We do not guarantee that the service will be available at all times.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              In no event shall we be liable for any damages arising out of the use or inability to use our service, including but not limited to direct, indirect, incidental, or consequential damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms of Service, please contact us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

