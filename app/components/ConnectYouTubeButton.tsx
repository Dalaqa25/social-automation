"use client";

export default function ConnectYouTubeButton() {
  function handleClick() {
    console.log("Connect YouTube clicked");
  }
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 px-5 py-2.5 font-medium text-white shadow-md cursor-pointer transition duration-200 ease-out hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
      onClick={handleClick}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        className="opacity-95"
      >
        <path
          fill="currentColor"
          d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.7 3 12 3 12 3s-6.7 0-8.7.4A4 4 0 0 0 .5 6.2 41.6 41.6 0 0 0 0 12c0 1.9.2 3.8.5 5.8a4 4 0 0 0 2.8 2.8C5.3 21 12 21 12 21s6.7 0 8.7-.4a4 4 0 0 0 2.8-2.8c.3-2 .5-3.9.5-5.8 0-1.9-.2-3.8-.5-5.8Z"
        />
        <path fill="#fff" d="M10 15.5V8.5l6 3.5-6 3.5Z" />
      </svg>
      Connect your YouTube account
    </button>
  );
}


