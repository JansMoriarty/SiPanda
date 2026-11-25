<?php

namespace App\Services\Llm;

class LlmRateLimit
{
    public const CODE = 429;

    public const MESSAGE = 'Batas harian layanan AI sudah tercapai. Coba lagi besok atau hubungi admin.';

    public static function is(\Throwable $exception): bool
    {
        return $exception->getCode() === self::CODE;
    }

    public static function bodyMatches(?string $body): bool
    {
        if ($body === null || $body === '') {
            return false;
        }

        return str_contains(strtoupper($body), 'RESOURCE_EXHAUSTED')
            || stripos($body, 'quota') !== false
            || stripos($body, 'rate limit') !== false
            || stripos($body, 'too many requests') !== false;
    }

    public static function throwIfMatched(int $status, ?string $body): void
    {
        if ($status === self::CODE || self::bodyMatches($body)) {
            throw new \RuntimeException(self::MESSAGE, self::CODE);
        }
    }
}
