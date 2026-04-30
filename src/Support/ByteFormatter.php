<?php

declare(strict_types=1);

namespace App\Support;

final class ByteFormatter
{
    public static function humanize(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }
        $units = ['B', 'KB', 'MB', 'GB'];
        $i     = 0;
        $v     = (float)$bytes;
        while ($v >= 1024 && $i < count($units) - 1) {
            $v /= 1024;
            $i++;
        }
        return round($v, 1) . ' ' . $units[$i];
    }
}
