<?php

namespace App\Console\Commands;

use App\Jobs\GenerateStudyPackJob;
use App\Models\Document;
use Illuminate\Console\Command;

class GenerateStudyPack extends Command
{
    protected $signature = 'study-pack:generate {document}';

    protected $description = 'Hasilkan Study Pack (summary, konsep, soal) untuk sebuah document';

    public function handle(): int
    {
        $document = Document::findOrFail($this->argument('document'));

        $this->info("Membuat Study Pack untuk document #{$document->id} ({$document->original_filename})...");

        GenerateStudyPackJob::dispatchSync($document);

        $document->refresh();

        $this->info(
            "Status: {$document->study_pack_status} | konsep: {$document->concepts()->count()} | soal: {$document->questions()->count()}"
        );

        return self::SUCCESS;
    }
}
