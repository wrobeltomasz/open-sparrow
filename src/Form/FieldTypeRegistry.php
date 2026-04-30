<?php

declare(strict_types=1);

namespace App\Form;

use App\Domain\Schema\ColumnConfig;

final class FieldTypeRegistry
{
    /**
     * @param list<FieldTypeInterface> $types Ordered by specificity; last entry must be a universal fallback.
     */
    public function __construct(private readonly array $types)
    {
    }

    public function for(ColumnConfig $col, bool $hasForeignKey): FieldTypeInterface
    {
        foreach ($this->types as $type) {
            if ($type->supports($col, $hasForeignKey)) {
                return $type;
            }
        }
        throw new \LogicException(
            "No FieldType supports column '{$col->name}' (type: {$col->type}). "
            . 'Ensure TextField is registered as the last fallback.'
        );
    }
}
