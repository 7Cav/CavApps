<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Facades\CavApps\Services\Steam\SteamUtils;
use Mockery;

class ProfileTest extends TestCase
{	
	public $steam;
	public $profile;
	public $id = "76561198084006121";

	public function setUp()
	{
		parent::setUp();

		$this->steam = new \CavApps\Services\Steam\Steam();
		$this->profile = $this->steam->profile($this->id);
	}
	
	public function test_profile_get_id()
	{
		$this->assertEquals($this->id, $this->profile->getID());
	}

	public function test_profile_get_summary()
	{
		$PLAYER_SUMMARY = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => "&steamids=%id"];
		$parameters     = ["%id" => $this->id];

		SteamUtils::shouldReceive('api')
					->once()
					->with($PLAYER_SUMMARY, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_summary.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		$res = $this->profile->getSummary();
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class));
	}

	public function test_profile_get_friends()
	{
		$FRIENDS_LIST   = ["slug" => "/ISteamUser/GetFriendList/v0001/", "param_string" => "&steamid=%id&relationship=friend"];
		$parameters     = ["%id" => $this->id];

		$PLAYER_SUMMARY = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => "&steamids=%id"];

		SteamUtils::shouldReceive('api')
					->once()
					->with($PLAYER_SUMMARY, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_summary.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		SteamUtils::shouldReceive('api')
					->once()
					->with($FRIENDS_LIST, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_friends.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		$res = $this->profile->getFriends();
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class));
	}

	public function test_profile_get_games()
	{
		$OWNED_GAMES    = ["slug" => "/IPlayerService/GetOwnedGames/v0001/", "param_string" => "&steamid=%id"];
		$parameters     = ["%id" => $this->id];

		$PLAYER_SUMMARY = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => "&steamids=%id"];

		SteamUtils::shouldReceive('api')
					->once()
					->with($PLAYER_SUMMARY, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_summary.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		SteamUtils::shouldReceive('api')
					->once()
					->with($OWNED_GAMES, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_games.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		$res = $this->profile->getGames();
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class)); 
	}

	public function test_profile_get_bans()
	{
		$BANS           = ["slug" => "/ISteamUser/GetPlayerBans/v1/", "param_string" => "&steamids=%id"];
		$parameters     = ["%id" => $this->id];

		SteamUtils::shouldReceive('api')
					->once()
					->with($BANS, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_bans.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		$res = $this->profile->getBans();
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class)); 
	}

	public function test_profile_get_groups()
	{
		$GROUPS         = ["slug" => "/ISteamUser/GetUserGroupList/v1/", "param_string" => "&steamid=%id"];
		$parameters     = ["%id" => $this->id];

		$PLAYER_SUMMARY = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => "&steamids=%id"];

		SteamUtils::shouldReceive('api')
					->once()
					->with($PLAYER_SUMMARY, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_summary.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		SteamUtils::shouldReceive('api')
					->once()
					->with($GROUPS, $parameters)
					->andReturnUsing(function() {
						$status = 200;
						$data = include(dirname(__FILE__)."/example_responses/steam_groups.php");
						$header = "application/json; charset=UTF-8";
						return new \CavApps\Services\Steam\Response($status, $data, $header);
					});

		$res = $this->profile->getGroups();
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class)); 
	}

	public function test_profile_private_cannot_make_get_groups()
	{
		$profile = $this->steam->profile("76561197988210016");

		$this->expectException('\CavApps\Exceptions\PrivateSteamProfile');
		$res = $profile->getGroups();
	}

	public function test_profile_private_cannot_make_get_games()
	{
		$profile = $this->steam->profile("76561197988210016");

		$this->expectException('\CavApps\Exceptions\PrivateSteamProfile');
		$res = $profile->getGames();
	}

	public function test_profile_private_cannot_make_get_friends()
	{
		$profile = $this->steam->profile("76561197988210016");

		$this->expectException('\CavApps\Exceptions\PrivateSteamProfile');
		$res = $profile->getFriends();
	}
}
