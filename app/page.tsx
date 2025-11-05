import AutomationGraph from "./components/AutomationGraph";
import HeroForm from "./components/HeroForm";
import ConnectYouTubeButton from "./components/ConnectYouTubeButton";
import ParallaxTilt from "./components/ParallaxTilt";
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
            <HeroForm />
            <div className="mt-4">
              <ConnectYouTubeButton />
            </div>
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
    </section>
  );
}