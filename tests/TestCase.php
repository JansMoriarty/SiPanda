<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Http::preventStrayRequests();
    }

    /**
     * Gagal keras sebelum test apa pun jalan kalau database aktif bukan
     * database test (nama tidak berakhiran "_test").
     *
     * Krusial: dipanggil di setUpTraits() SEBELUM parent::setUpTraits(),
     * dan justru parent::setUpTraits() itulah yang memicu RefreshDatabase
     * (migrate:fresh). Artinya exception ini melempar sebelum satu pun
     * migrasi/destruktif query menyentuh database asli.
     */
    protected function setUpTraits()
    {
        $this->assertTestingDatabase();

        return parent::setUpTraits();
    }

    protected function assertTestingDatabase(): void
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if (is_string($database) && str_ends_with($database, '_test')) {
            return;
        }

        throw new RuntimeException(sprintf(
            'Menolak menjalankan test: koneksi "%s" menunjuk ke database "%s". '.
            'Nama database test wajib berakhiran "_test" (mis. panda_test) supaya '.
            'database asli tidak pernah di-migrate:fresh.',
            (string) $connection,
            is_string($database) ? $database : var_export($database, true),
        ));
    }
}
