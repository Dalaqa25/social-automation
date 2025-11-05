"use client";

export default function ConnectYouTubeButton() {
  function handleClick() {
    console.log("Connect YouTube clicked");
  }
  return (
    <button
      type="button"
      className="rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 px-5 py-2.5 font-medium text-white shadow-md cursor-pointer transition duration-200 ease-out hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
      onClick={handleClick}
    >
      Connect your YouTube account
    </button>
  );
}


