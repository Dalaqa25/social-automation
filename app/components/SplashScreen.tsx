"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type SplashScreenProps = {
  children: React.ReactNode;
};

export default function SplashScreen({ children }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-300 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!visible}
      >
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-6">
          <div className="animate-mg-float">
            <Image
              src="/3dcube.png"
              alt="ModelGrow logo"
              width={160}
              height={160}
              priority
            />
          </div>
          <p className="absolute bottom-12 text-sm tracking-wide text-gray-500">
            Powered by <span className="font-semibold text-gray-800">ModelGrow</span>
          </p>
        </div>
      </div>
      <div aria-hidden={visible}>{children}</div>
    </>
  );
}

