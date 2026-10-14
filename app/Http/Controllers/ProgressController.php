<?php

namespace App\Http\Controllers;

use App\Services\Progress\ProgressData;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Halaman Progress / Knowledge Gap. Agregasi mentah dikerjakan ProgressData
 * (already scoped ke course.user_id), lalu persentase dihitung di
 * resources/js/utils/gap.js supaya sama dengan Quiz Results.
 */
class ProgressController extends Controller
{
    public function index(Request $request, ProgressData $progressData)
    {
        return Inertia::render('Progress/Index', $progressData->forUser($request->user()));
    }
}
