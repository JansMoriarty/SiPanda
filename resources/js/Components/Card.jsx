export default function Card({ children, className = "" }) {
    return (
        <section className={`rounded-card bg-surface p-5 shadow-card dark:ring-1 dark:ring-track ${className}`}>
            {children}
        </section>
    );
}
