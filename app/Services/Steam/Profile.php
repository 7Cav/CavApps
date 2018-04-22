<?php

namespace CavApps\Services\Steam;

use Facades\CavApps\Services\Steam\SteamUtils;;

class Profile
{
	///////////////
	// Constants //
	///////////////

	const PLAYER_SUMMARY = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => "&steamids=%id"];
	const FRIENDS_LIST   = ["slug" => "/ISteamUser/GetFriendList/v0001/", "param_string" => "&steamid=%id&relationship=friend"];
	const OWNED_GAMES    = ["slug" => "/IPlayerService/GetOwnedGames/v0001/", "param_string" => "&steamid=%id"];
	const BANS           = ["slug" => "/ISteamUser/GetPlayerBans/v1/", "param_string" => "&steamids=%id"];
	const GROUPS         = ["slug" => "/ISteamUser/GetUserGroupList/v1/", "param_string" => "&steamid=%id"];

	////////////////
	// Properties //
	////////////////

	private $parameters;

	private $id;

	private $banned;

	private $private;

	private $formattedIDs;

	/**
	 * Construct
	 * 
	 * @param string $b64   steam id
	 * @param \CavApps\Services\Steam\Utils  $utils
	 */
	public function __construct(string $b64)
	{
		$this->id = $b64;
		$this->formattedIDs = SteamUtils::get_all_formats($b64);
		$this->parameters = ["%id" => $this->id];
	}

	///////////////
	// Accessors //
	///////////////

	public function getID()
	{
		return $this->id;
	}

	public function getSteam64()
	{
		return $this->formattedIDs['id64'];
	}

	public function getSteam3()
	{
		return $this->formattedIDs['id3'];
	}

	public function getSteam32()
	{
		return $this->formattedIDs['id32'];
	}

	public function isBanned()
	{
		if ($this->banned === null) {
			$this->getBans();
		}

		return $this->banned;
	}

	public function isPrivate()
	{
		if ($this->private === null) {
			$this->getSummary();
		}

		return $this->private;
	}

	/////////
	// API //	https://developer.valvesoftware.com/wiki/Steam_Web_API#GetGlobalAchievementPercentagesForApp_.28v0001.29
	/////////

	/**
	 * Gets summary of player profile
	 * 
	 * @return \CavApps\Services\Steam\Response
	 */
	public function getSummary()
	{
		$res = SteamUtils::api(self::PLAYER_SUMMARY, $this->parameters);
		$res->setData($res->data()['response']['players'][0]);
		$this->checkPrivateSteam($res);
		return $res;
	}

	/**
	 * Gets friends of player profile
	 *
	 * @throws \CavApps\Exceptions\PrivateSteamProfile
	 * @return \CavApps\Services\Steam\Response
	 */
	public function getFriends()
	{
		if (!$this->isPrivate()) {
			$res = SteamUtils::api(self::FRIENDS_LIST, $this->parameters);
			$res->setData($res->data()['friendslist']['friends']);
			return $res;
		}

		throw new \CavApps\Exceptions\PrivateSteamProfile($this->id);
	}

	/**
	 * Gets games of player profile
	 *
	 * @throws \CavApps\Exceptions\PrivateSteamProfile
	 * @return \CavApps\Services\Steam\Response
	 */
	public function getGames()
	{
		if (!$this->isPrivate()) {
			$res = SteamUtils::api(self::OWNED_GAMES, $this->parameters);
			$res->setData($res->data()['response']);
			return $res;
		}
		
		throw new \CavApps\Exceptions\PrivateSteamProfile($this->id);
	}

	/**
	 * Gets bans of player profile
	 *
	 * @return \CavApps\Services\Steam\Response
	 */
	public function getBans()
	{
		$res = SteamUtils::api(self::BANS, $this->parameters);
		$res->setData($res->data()['players'][0]);
		$this->checkIsBanned($res);
		return $res;
	}

	/**
	 * Gets groups (IDs only currently) of player profile
	 *
	 * @throws \CavApps\Exceptions\PrivateSteamProfile
	 * @return \CavApps\Services\Steam\Response
	 */
	public function getGroups()
	{
		if (!$this->isPrivate()) {
			$res = SteamUtils::api(self::GROUPS, $this->parameters);
			$res->setData($res->data()['response']);
			return $res;
		}

		throw new \CavApps\Exceptions\PrivateSteamProfile($this->id);
	}

	///////////////////
	// Profile Utils //
	///////////////////

	/**
	 * Sorts through the response to see if the player has any cav
	 * denial-level bans
	 * 
	 * @param  \CavApps\Services\Steam\Response $res
	 */
	private function checkIsBanned(\CavApps\Services\Steam\Response $res)
	{
		$this->banned = $res->data()['EconomyBan'] === "none" ? true : false;
		$this->banned = $res->data()['VACBanned'] === true ? true : false;
	}

	/**
	 * Sorts through the response to see if the player profile is private
	 * @param  \CavApps\Services\Steam\Response $res
	 */
	private function checkPrivateSteam(\CavApps\Services\Steam\Response $res)
	{	
		$this->private = $res->data()['communityvisibilitystate'] === 1 ? true : false;
	}
}