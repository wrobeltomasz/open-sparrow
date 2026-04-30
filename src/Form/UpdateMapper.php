<?php

declare(strict_types=1);

namespace App\Form;

use App\Domain\Schema\TableConfig;

final class UpdateMapper
{
    public function __construct(private readonly FieldTypeRegistry $registry)
    {
    }

    public function fromPost(TableConfig $cfg, array $postData): RecordData
    {
        $bindings = [];
        foreach ($cfg->writableColumns() as $col) {
            $hasFk      = $cfg->hasForeignKey($col->name);
            $bound      = $this->registry->for($col, $hasFk)->bind($col->name, $postData);
            $bindings[] = ['col' => $col->name, 'bound' => $bound];
        }
        return new RecordData($bindings);
    }
}
