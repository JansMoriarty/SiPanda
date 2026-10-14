export default function Card({ children, className = "" }) {
    return (
        <section className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
            {children}
        </section>
    );
}
