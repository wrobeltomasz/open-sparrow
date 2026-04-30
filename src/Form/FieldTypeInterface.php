<?php

declare(strict_types=1);

namespace App\Form;

use App\Domain\Schema\ColumnConfig;

interface FieldTypeInterface
{
    public function supports(ColumnConfig $col, bool $hasForeignKey): bool;

    /** Map raw POST data for one column to a typed, SQL-ready value. */
    public function bind(string $colName, array $postData): BoundValue;

    /** Render the HTML input widget for one column. */
    public function render(ColumnConfig $col, mixed $currentValue, RenderContext $ctx): string;
}
