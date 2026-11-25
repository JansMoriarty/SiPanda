<?php

namespace App\Services;

class TextSanitizer
{
    public static function sanitize(string $text): string
    {
        if (mb_check_encoding($text, 'UTF-8')) {
            return self::stripControlCharacters($text);
        }

        return self::stripControlCharacters(mb_convert_encoding($text, 'UTF-8', 'UTF-8'));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function sanitizeArray(array $data): array
    {
        return array_map(function ($value) {
            if (is_string($value)) {
                return self::sanitize($value);
            }

            if (is_array($value)) {
                return self::sanitizeArray($value);
            }

            return $value;
        }, $data);
    }

    private static function stripControlCharacters(string $text): string
    {
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;
    }
}
