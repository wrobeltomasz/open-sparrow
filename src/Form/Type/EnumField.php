<?php

declare(strict_types=1);

namespace App\Form\Type;

use App\Domain\Schema\ColumnConfig;
use App\Form\BoundValue;
use App\Form\FieldTypeInterface;
use App\Form\RenderContext;

final class EnumField implements FieldTypeInterface
{
    public function supports(ColumnConfig $col, bool $hasForeignKey): bool
    {
        return $col->isEnum();
    }

    public function bind(string $colName, array $postData): BoundValue
    {
        $val = $postData[$colName] ?? null;
        if ($val === '' || $val === null) {
            $val = null;
        }
        return new BoundValue($val);
    }

    public function render(ColumnConfig $col, mixed $currentValue, RenderContext $ctx): string
    {
        $val     = $ctx->isPrefilled($col->name) ? $ctx->prefilledValue($col->name) : (string)($currentValue ?? '');
        $locked  = $ctx->isLocked($col->name);
        $name    = htmlspecialchars($col->name, ENT_QUOTES, 'UTF-8');
        $reqAttr = ($col->notNull && !$locked) ? 'required' : '';

        $html  = '<select name="' . $name . '" ' . ($locked ? 'disabled' : '') . ' ' . $reqAttr . ' style="width:100%;padding:8px;">';
        $html .= '<option value="">-- Select --</option>';
        foreach ($col->options as $opt) {
            $optStr   = (string)$opt;
            $selected = $val === $optStr ? 'selected' : '';
            $html    .= '<option value="' . htmlspecialchars($optStr, ENT_QUOTES, 'UTF-8') . '" ' . $selected . '>'
                      . htmlspecialchars($optStr, ENT_QUOTES, 'UTF-8')
                      . '</option>';
        }
        $html .= '</select>';
        if ($locked) {
            $html .= '<input type="hidden" name="' . $name . '" value="' . htmlspecialchars($val, ENT_QUOTES, 'UTF-8') . '" />';
        }
        return $html;
    }
}
