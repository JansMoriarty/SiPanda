<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LlmUsage;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Monitoring pemakaian token LLM (observability admin).
 *
 * Angka diambil dari usageMetadata Gemini yang dicatat LlmUsageRecorder.
 * Query lintas-user — memang di balik middleware `admin`.
 */
class LlmUsageController extends Controller
{
    private const FEATURES = [LlmUsage::FEATURE_STUDY_PACK, LlmUsage::FEATURE_ASK_PANDA];

    private const RANGES = ['7', '30', '90', 'all'];

    public function index(Request $request)
    {
        $feature = (string) $request->query('feature', 'all');
        $range = (string) $request->query('range', '30');

        if (! in_array($feature, self::FEATURES, true)) {
            $feature = 'all';
        }

        if (! in_array($range, self::RANGES, true)) {
            $range = '30';
        }

        $base = LlmUsage::query()
            ->when($feature !== 'all', fn ($q) => $q->where('feature', $feature))
            ->when($range !== 'all', fn ($q) => $q->where('created_at', '>=', now()->subDays((int) $range)));

        $calls = (clone $base)->count();
        $totalTokens = (int) (clone $base)->sum('total_tokens');

        $byModel = (clone $base)
            ->selectRaw('provider, model, COUNT(*) as calls, SUM(total_tokens) as tokens')
            ->groupBy('provider', 'model')
            ->orderByDesc('tokens')
            ->get()
            ->map(fn ($row) => [
                'provider' => $row->provider,
                'model' => $row->model,
                'calls' => (int) $row->calls,
                'tokens' => (int) $row->tokens,
            ])
            ->values();

        $byFeature = (clone $base)
            ->selectRaw('feature, COUNT(*) as calls, SUM(total_tokens) as tokens')
            ->groupBy('feature')
            ->orderByDesc('tokens')
            ->get()
            ->map(fn ($row) => [
                'feature' => $row->feature,
                'calls' => (int) $row->calls,
                'tokens' => (int) $row->tokens,
            ])
            ->values();

        $daily = $this->dailySeries(clone $base);

        $recent = (clone $base)
            ->with('user:id,name')
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (LlmUsage $row) => [
                'id' => $row->id,
                'user' => $row->user?->name,
                'feature' => $row->feature,
                'provider' => $row->provider,
                'model' => $row->model,
                'prompt_tokens' => $row->prompt_tokens,
                'completion_tokens' => $row->completion_tokens,
                'total_tokens' => $row->total_tokens,
                'successful' => $row->successful,
                'error' => $row->error,
                'created_at' => $row->created_at?->toISOString(),
            ]);

        return Inertia::render('Admin/LlmUsage/Index', [
            'stats' => [
                'calls' => $calls,
                'total_tokens' => $totalTokens,
                'prompt_tokens' => (int) (clone $base)->sum('prompt_tokens'),
                'completion_tokens' => (int) (clone $base)->sum('completion_tokens'),
                'failed_calls' => (clone $base)->where('successful', false)->count(),
                'average_tokens' => $calls > 0 ? (int) round($totalTokens / $calls) : 0,
            ],
            'by_model' => $byModel,
            'by_feature' => $byFeature,
            'daily' => $daily,
            'recent' => $recent,
            'filters' => [
                'feature' => $feature,
                'range' => $range,
            ],
        ]);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<LlmUsage>  $base
     * @return \Illuminate\Support\Collection<int, array{date: string, tokens: int}>
     */
    private function dailySeries($base): \Illuminate\Support\Collection
    {
        $days = 14;

        $byDay = (clone $base)
            ->where('created_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->selectRaw('DATE(created_at) as day, SUM(total_tokens) as tokens')
            ->groupBy('day')
            ->pluck('tokens', 'day');

        return collect(range($days - 1, 0))
            ->map(function (int $offset) use ($byDay) {
                $date = now()->subDays($offset)->toDateString();

                return [
                    'date' => $date,
                    'tokens' => (int) ($byDay[$date] ?? 0),
                ];
            })
            ->values();
    }
}
