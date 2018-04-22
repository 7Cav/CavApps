<?php

namespace CavApps\Services\Steam;

use CavApps\Services\Steam\Profile;
use CavApps\Services\Steam\Game;
use Facades\CavApps\Services\Steam\SteamUtils;

class Steam
{

	/////////////////////
	// Accessors (ish) //
	/////////////////////

	/**
	 * Build Profile object
	 * 
	 * Builds a steam profile object after verifying
	 * if the steam profile is valid & converting to
	 * the format required by the API
	 * 
	 * @param  string $steamID
	 * @return CavApps\Services\Steam\Profile
	 */
	public function profile(string $steamID)
	{

		$b64 = SteamUtils::get_b64($steamID);

		if ($b64 === null) {

			// throw err for incorrect steam ID
			// cuz we have no fuckin clue what
			// they just gave us
			throw new \CavApps\Exceptions\InvalidSteamId($steamID);
		}

		return new Profile($b64);
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function game()
	{
		// return new Game
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function group()
	{
	  
	}
}