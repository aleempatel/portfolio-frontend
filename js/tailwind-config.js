/* Tailwind CDN configuration — extracted verbatim from source HTML */
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
            mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
          },
          colors: {
            cyber: "#00d9ff",
            emeraldx: "#00f5a0",
            violetx: "#8b5cf6"
          },
          boxShadow: {
            neon: "0 0 30px rgba(0,217,255,.18)",
            emerald: "0 0 30px rgba(0,245,160,.16)",
            violet: "0 0 30px rgba(139,92,246,.18)"
          }
        }
      }
    };
