import AutomationGraph from "./components/AutomationGraph";
import HeroForm from "./components/HeroForm";
import ConnectYouTubeButton from "./components/ConnectYouTubeButton";
import ParallaxTilt from "./components/ParallaxTilt";
import SignInButton from "./components/SignInButton";
import UserStatus from "./components/UserStatus";
import AuthError from "./components/AuthError";
import YouTubeUserData from "./components/YouTubeUserData";
import Link from "next/link";

export default function Home() {
  return (
    <section className="relative min-h-screen flex items-center w-full">
      <AutomationGraph className="absolute inset-0 z-0 opacity-90" />
      <div className="relative z-10 max-w-screen-xl mx-auto px-4 md:px-8">
        <ParallaxTilt maxTiltDeg={2} maxTranslatePx={6} perspectivePx={1200} lerpFactor={0.08}>
          <div className="space-y-5 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 font-extrabold mx-auto sm:text-6xl">
              Automate Your Social Media
            </h1>
            <p className="max-w-2xl mx-auto text-gray-500">
              Paste a public video link. We remove the watermark, download the video, and generate captions, upload it to your social media accounts.
            </p>
            <AuthError />
            <HeroForm />
            <div className="mt-3 flex items-center justify-center">
              <UserStatus />
            </div>
            <div className="mt-4">
              <ConnectYouTubeButton />
            </div>
            <div className="mt-4">
              <SignInButton />
            </div>
            <YouTubeUserData />
          </div>
        </ParallaxTilt>
      </div>
      <div
        className="absolute inset-0 max-w-md mx-auto h-72 blur-[118px]"
        style={{
          background:
            "linear-gradient(152.92deg, rgba(192, 132, 252, 0.2) 4.54%, rgba(232, 121, 249, 0.26) 34.2%, rgba(204, 171, 238, 0.0) 77.55%)",
        }}
      ></div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 z-10">
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link 
            href="/privacy" 
            className="text-gray-500 hover:text-purple-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-400">•</span>
          <Link 
            href="/terms" 
            className="text-gray-500 hover:text-purple-600 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </section>
  );
}