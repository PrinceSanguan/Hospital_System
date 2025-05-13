<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CheckTableExists extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:table-exists {table}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if a table exists in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tableName = $this->argument('table');

        // Check if the table exists
        $exists = Schema::hasTable($tableName);

        // Exit with code 0 if table exists, 1 if it doesn't
        return $exists ? 0 : 1;
    }
}
