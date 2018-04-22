<?php

namespace CavApps\Services\Steam;

use CavApps\Services\Steam\Response as SteamResponse;
use \GuzzleHttp\Client as Guzzle;

class SteamUtils
{

	///////////////
	// Constants //
	///////////////

	const STEAM_64 = 0x1;
	const STEAM_32 = 0x2;
	const STEAM_3 = 0x3;
	const ID_64_BASE = '76561197960265728';

	/////////////////
	// Variables & //
	// Constructor //
	/////////////////

	/**
	 * @codeCoverageIgnore
	 */
	private static function getUrlBase()
	{
		return config("steam.url_base");
	}

	/**
	 * @codeCoverageIgnore
	 */
	private static function getKey()
	{
		return config("steam.key");
	}

	/**
	 * @codeCoverageIgnore
	 */
	private static function guzzle()
	{
		return new Guzzle();
	}	

	///////////////
	// API Stuff //
	///////////////

	private static function send_request_to_endpoint(string $url)
	{

		// http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=XXXXXXXXXXXXXXXXXXXXXXX&steamids=76561197960435530
		// http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=XXXXXXXXXXXXXXXXX&steamid=76561197960434622

		try {
			$response = self::guzzle()->request('GET', $url);
			$status   = $response->getStatusCode();
			$data     = json_decode($response->getBody(), true);
			$header   = $response->getHeader('content-type')[0];
		}
		catch (\GuzzleHttp\Exception\RequestException $e) {
			if ($e->hasResponse()) {
				$status   = $e->getResponse()->getStatusCode();
				$data     = [(string) $e->getResponse()->getBody()];
				$header   = "invalid!";
			// @codeCoverageIgnoreStart
			} else {
				$status   = 500;
				$data     = ["Timeout" => true];
				$header   = "network error";
			}
			// @codeCoverageIgnoreEnd
		}
		return new SteamResponse($status, $data, $header);
	}

	/**
	 * Entry-point to making API request
	 *
	 * This method formulates the REST endpoint to be used in the request
	 * based on the parameters for that given API call, found in the constants
	 * in the Profile Object.
	 * 
	 * @param  array  $apiRequirements | contains the endpoint slug + parameter format
	 * @param  array  $parameters      | contains the actual data parameters we need
	 */
	public static function api(array $apiRequirements, array $parameters)
	{
		$apiRequest = self::prepareAPIRequest($apiRequirements, $parameters);
		
		$url = self::prepareURL($apiRequest['slug'], $apiRequest['param_string']);
		
		return self::send_request_to_endpoint($url);
	}

	//////////////////
	// Util Methods //
	//////////////////

	/**
	 * Prepares the API request data
	 *
	 * We iterate over each of the parameters provided and insert them into
	 * the url query format, ready for use in the REST URL.
	 * 
	 * @param  array  $apiRequirements | contains the endpoint slug + parameter format
	 * @param  array  $parameters      | contains the actual data parameters we need
	 * 
	 * @return array  $apiRequirements | request object ready for use in API
	 */
	private static function prepareAPIRequest(array $apiRequirements, array $parameters)
	{
		foreach ($parameters as $key => $param) {
			$apiRequirements['param_string'] = str_replace("$key", $param, $apiRequirements['param_string']);
		}
		return $apiRequirements;
	}

	/**
	 * Prepares the URL for the API request
	 *
	 * Here we use the slug endpoint from the Resource type found in the object constants
	 * and combine it with the formatted parameter string from previous method call.
	 * 
	 * @param  string $endpoint | the slug used in the request
	 * @param  string $params   | the parameter string needed for this request
	 * @return string           | the URL we are going to fire in the API
	 */
	private static function prepareURL(string $endpoint, string $params)
	{
		$url = self::getUrlBase();
		$url .= $endpoint;
		$url .= "?key=".self::getKey();
		$url .= $params;

		return $url;
	}

	/**
	 * Parse the ID for a given type
	 *
	 * https://regex101.com is the best way to see how this works, we just filter
	 * for the types of ID and gather specific sections from the ID to use elsewhere
	 * 
	 * @param  string $steamID | the steam ID we're going to parse
	 * @return array           | contains the ID type & the substring matches
	 */
	private static function parse_steam_ID(string $steamID)
	{
		// regex for different types
		// 76561198006409530
		$steam64 = "/^[765]\d{16}$/";
		// STEAM_0:0:23071901
		$steam32  = "/^STEAM_[0-1]:([0-1]):([0-9]+)$/";
		// [U:1:46143802]
		$steam3  = "/^\[U:1:([0-9]+)\]$/";

		$steamID = trim($steamID);

		// switch on id param
		// return type constant
		switch($steamID) {
			case (preg_match($steam64, $steamID, $matches) ? true: false):
				return ['type' => self::STEAM_64, 'matches' => null];	
			case (preg_match($steam32, $steamID, $matches) ? true: false):
				return ['type' => self::STEAM_32, 'matches' => $matches];
			case (preg_match($steam3, $steamID, $matches) ? true: false):
				return ['type' => self::STEAM_3, 'matches' => $matches];
			default:
				// return null because someone borked
				return ['type' => null, 'matches' => null];
		}
	}

	/**
	 * Calculate the steam raw value
	 *
	 * This is used in converting the steam ID to different formats later. Steam
	 * uses a really strange way of calculating them, so we need this base as a shared
	 * value to move between them.
	 * 
	 * @param  string   $id    | the steam ID
	 * @param  int/null $type  | the type of steam ID
	 * @param         $matches | the substring matches for the ID
	 * @return int             | raw value for a given steam $id
	 */
	private static function get_raw_value(string $id, $type, $matches)
	{
		switch ($type) {
			case self::STEAM_32:
				$raw = bcmul($matches[2], '2', 0);
				return bcadd($raw, $matches[1], 0);
				break;
			case self::STEAM_64:
				return bcsub($id, self::ID_64_BASE, 0);
				break;
			case self::STEAM_3:
				return $matches[1];
				break;
		}
	}

	/**
	 * Convert whatever ID we had to ID32
	 * 
	 * @param  int $raw  | the raw value for the steam ID
	 * @return string    | ID32 Steam ID
	 */
	private static function convert_to_ID_32($raw)
	{
		$z = bcdiv($raw, '2', 0);
		$y = bcmul($z, '2', 0);
		$y = bcsub($raw, $y, 0);
		return "STEAM_1:$y:$z";
	}

	/**
	 * Convert whatever ID we had to ID64
	 * 
	 * @param  int $raw  | the raw value for the steam ID
	 * @return string    | ID64 Steam ID
	 */
	private static function convert_to_ID_64($raw)
	{
		return bcadd($raw, self::ID_64_BASE, 0);
	}

	/**
	 * Convert whatever ID we had to ID3
	 * 
	 * @param  int $raw  | the raw value for the steam ID
	 * @return string    | ID3 Steam ID
	 */
	private static function convert_to_ID_3($raw)
	{
		return "[U:1:$raw]";
	}	

	///////////////
	// Accessors //
	///////////////

	/**
	 * Get the b64 ID from the provided ID
	 *
	 * This is where the profile enters into the utilities flow,
	 * as the entire web API requires this.
	 * 
	 * @param  string $steamID | the value collected from the profile method
	 */
	public static function get_b64(string $steamID)
	{
		// get current type by parsing the ID
		$parsed = self::parse_steam_ID($steamID);
		$rawValue = self::get_raw_value($steamID, $parsed['type'] ,$parsed['matches']);

		// Convert to b64
		// which is real fuckin easy to use
		// with the steam API
		if ($parsed['type'] === null) {
			return null;
		}

		return self::convert_to_ID_64($rawValue);
	}

	/**
	 * Get all 3 formats of the same steam ID
	 * 
	 * @param  string $steamID | valid steam ID
	 * @return array           | contains the 3 different ID formats of the parameter ID
	 */
	public static function get_all_formats(string $steamID)
	{
		$parsed = self::parse_steam_ID($steamID);
		$rawValue = self::get_raw_value($steamID, $parsed['type'] ,$parsed['matches']);

		return [
			"id64" => self::convert_to_ID_64($rawValue),
			"id32" => self::convert_to_ID_32($rawValue),
			"id3" => self::convert_to_ID_3($rawValue),
		];
	}
}