import { useEffect } from "react";
import { router } from "@inertiajs/react";

/**
 * Muat ulang props Inertia secara berkala selama `active` bernilai true.
 *
 * Dipakai untuk status async di server (ingest dokumen & pembuatan study pack
 * berjalan di queue), yang tidak punya event realtime. Begitu tidak ada yang
 * diproses, polling berhenti sendiri sehingga tidak ada request sia-sia.
 *
 * @param {boolean} active   apakah perlu polling
 * @param {{ interval?: number, only?: string[] }} options
 *        interval: jeda antar-refresh (ms). only: nama props yang di-reload.
 */
export default function useRefreshWhile(active, { interval = 3000, only = [] } = {}) {
    const key = Array.isArray(only) ? only.join(",") : "";

    useEffect(() => {
        if (!active) {
            return;
        }

        const id = setInterval(() => {
            router.reload({ only, preserveScroll: true, preserveState: true });
        }, interval);

        return () => clearInterval(id);
        // `only` dipakai lewat `key` yang stabil supaya effect tidak re-run tiap render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, interval, key]);
}
