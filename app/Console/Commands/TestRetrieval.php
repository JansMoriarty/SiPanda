<?php

namespace App\Console\Commands;

use App\Services\RetrievalService;
use Illuminate\Console\Command;

class TestRetrieval extends Command
{
    protected $signature = 'test:retrieval {question}';
    protected $description = 'Test retrieval chunk berdasarkan pertanyaan';

    public function handle(RetrievalService $retrieval)
    {
        $question = $this->argument('question');
        $results = $retrieval->search($question);

        if (empty($results)) {
            $this->warn('Tidak ada chunk relevan ditemukan.');
            return;
        }

        foreach ($results as $item) {
            $this->info("Score: " . round($item['score'], 4) . " | " . $item['chunk']->source_location);
            $this->line(substr($item['chunk']->content, 0, 150) . '...');
            $this->line('---');
        }
    }
}