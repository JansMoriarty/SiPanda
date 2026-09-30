<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('courses')->where(fn ($q) => $q->where('user_id', $request->user()->id)),
            ],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $request->user()->courses()->create([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#465FFF',
        ]);

        return redirect()->back();
    }
}