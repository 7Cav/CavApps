<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Util\DateHelper;
use App\Models\User;

class HomeController extends Controller
{

	protected $dateHelper;

	/**
	 * Create a new controller instance.
	 *
	 * @return void
	 */
	public function __construct(DateHelper $dateHelper)
	{
		$this->middleware('auth');
		$this->dateHelper = $dateHelper;
	}

	/**
	 * Show the application dashboard.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{

		$viewParams = [

		];

		return view('page.home', $viewParams);
	}

}
