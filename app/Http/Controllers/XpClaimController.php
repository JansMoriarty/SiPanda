<?php

namespace App\Http\Controllers;

use App\Models\StudyLevel;
use App\Services\XpService;
use Illuminate\Http\Request;

class XpClaimController extends Controller
{
    public function __construct(private XpService $xp) {}

    public function store(Request $request, StudyLevel $studyLevel)
    {
        $this->xp->claimLevel($request->user(), $studyLevel);

        return back()->with('success', 'EXP berhasil diklaim! +'.(int) config('sipanda.xp.per_claim', 50).' XP.');
    }
}
