export default function XpMedal({ color = "#F5A524", className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path d="M8 2.5L11 9M16 2.5L13 9" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path d="M7.2 2.5l3.2 6.3-3.4 1.7L4.4 3.7z" fill={color} opacity="0.85" />
            <path d="M16.8 2.5l-3.2 6.3 3.4 1.7 2.6-6.8z" fill={color} opacity="0.85" />
            <circle cx="12" cy="15" r="6.5" fill={color} opacity="0.16" />
            <circle cx="12" cy="15" r="5" fill="none" stroke={color} strokeWidth="1.8" />
            <path
                d="M12 11.6l1.1 2.2 2.4.35-1.75 1.7.42 2.4L12 17.1l-2.17 1.15.42-2.4-1.75-1.7 2.4-.35 1.1-2.2z"
                fill={color}
            />
        </svg>
    );
}
