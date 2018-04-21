<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CavUser;
use Socialite;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
	/**
	 * Redirect the user to the XenForo [bd] Api authentication page.
	 *
	 * @return Response
	 */
	public function redirectToProvider()
	{
		return Socialite::driver('xenforo')->redirect();
	}

	/**
	 * Obtain the user information from XenForo [bd] Api.
	 *
	 * @return Response
	 */
	public function handleProviderCallback()
	{
		$user = Socialite::driver('xenforo')->user();

		$authUser = $this->findOrCreateUser($user);

		Auth::login($authUser, true);

		return redirect('/')->withSuccess('you are logged in!');
	}

	public function findOrCreateUser($user)
	{
		$authUser = User::where('provider_id', $user->id)->first();

		if ($authUser) {
			return $authUser;
		}

		$cavUser = CavUser::find($user->id);

		$user = User::create([
			'name'     => $user->name,
			'email'    => $user->email,
			'provider_id' => $user->id,
			'avatar' => $user->avatar,
			'is_banned' => $cavUser->is_banned,
			'is_admin' => $cavUser->is_admin
		]);

		$user->is_admin = $cavUser->is_admin;

		return $user;
	}

	public function logout()
	{
	    Auth::logout();

	    return redirect('https://7cav.us')->withSuccess('you are logged out!');
	}
}
