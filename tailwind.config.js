/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12151B",
        panel: "#181C24",
        panel2: "#1F2430",
        line: "#2A2F3B",
        amber: "#E8A33D",
        amber2: "#F2C574",
        mist: "#9AA3B2",
        paper: "#EDEFF3"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      keyframes: {
        rise: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        bar1: { "0%,100%": { height: "30%" }, "50%": { height: "90%" } },
        bar2: { "0%,100%": { height: "60%" }, "50%": { height: "20%" } },
        bar3: { "0%,100%": { height: "45%" }, "50%": { height: "75%" } }
      },
      animation: {
        rise: "rise 0.5s ease-out both",
        bar1: "bar1 0.9s ease-in-out infinite",
        bar2: "bar2 1.1s ease-in-out infinite",
        bar3: "bar3 0.75s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
