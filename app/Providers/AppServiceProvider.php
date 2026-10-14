<?php

namespace App\Providers;

use App\Contracts\LlmClient;
use App\Services\Llm\LlmManager;
use App\Services\Llm\LlmUsageRecorder;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LlmClient::class, fn () => new LlmManager());
        $this->app->singleton(LlmUsageRecorder::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
