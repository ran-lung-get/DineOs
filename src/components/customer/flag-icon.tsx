export function FlagIcon({ lang }: { lang: string }) {
  if (lang === "th") {
    return (
      <svg
        viewBox="0 0 9 6"
        className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm border border-white/10"
      >
        <rect width="9" height="6" fill="#A51931" />
        <rect y="1" width="9" height="4" fill="#F4F5F8" />
        <rect y="2" width="9" height="2" fill="#2D2A4A" />
      </svg>
    );
  }
  if (lang === "en") {
    return (
      <svg
        viewBox="0 0 19 10"
        className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm border border-white/10"
      >
        <rect width="19" height="10" fill="#B22234" />
        <path
          d="M0,1 h19 M0,3 h19 M0,5 h19 M0,7 h19 M0,9 h19"
          stroke="#FFF"
          strokeWidth="1"
        />
        <rect width="7.6" height="5.38" fill="#3C3B6E" />
        <circle cx="1.5" cy="1" r="0.2" fill="#fff" />
        <circle cx="3.0" cy="1" r="0.2" fill="#fff" />
        <circle cx="4.5" cy="1" r="0.2" fill="#fff" />
        <circle cx="6.0" cy="1" r="0.2" fill="#fff" />
        <circle cx="2.2" cy="1.8" r="0.2" fill="#fff" />
        <circle cx="3.7" cy="1.8" r="0.2" fill="#fff" />
        <circle cx="5.2" cy="1.8" r="0.2" fill="#fff" />
        <circle cx="1.5" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="3.0" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="4.5" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="6.0" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="2.2" cy="3.4" r="0.2" fill="#fff" />
        <circle cx="3.7" cy="3.4" r="0.2" fill="#fff" />
        <circle cx="5.2" cy="3.4" r="0.2" fill="#fff" />
        <circle cx="1.5" cy="4.2" r="0.2" fill="#fff" />
        <circle cx="3.0" cy="4.2" r="0.2" fill="#fff" />
        <circle cx="4.5" cy="4.2" r="0.2" fill="#fff" />
        <circle cx="6.0" cy="4.2" r="0.2" fill="#fff" />
      </svg>
    );
  }
  if (lang === "zh") {
    return (
      <svg
        viewBox="0 0 30 20"
        className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm border border-white/10"
      >
        <rect width="30" height="20" fill="#DE2910" />
        <polygon
          points="5,2 6.17,5.61 9.33,5.61 6.78,7.47 7.76,11.08 5,8.89 2.24,11.08 3.22,7.47 0.67,5.61 3.83,5.61"
          fill="#FFDE00"
        />
        <circle cx="10" cy="2" r="0.5" fill="#FFDE00" />
        <circle cx="12" cy="4" r="0.5" fill="#FFDE00" />
        <circle cx="12" cy="7" r="0.5" fill="#FFDE00" />
        <circle cx="10" cy="9" r="0.5" fill="#FFDE00" />
      </svg>
    );
  }
  return null;
}
