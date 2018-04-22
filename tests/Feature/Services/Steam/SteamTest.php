<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Facades\CavApps\Services\Steam\SteamUtils;
use Mockery;

class SteamTest extends TestCase
{	

	const MAX_VALID_STEAM_IDS   = 0x02; // TODO
	const MAX_PRIVATE_STEAM_IDS = 0x00; // TODO
	const MAX_BANNED_STEAM_IDS  = 0x01;
	const MAX_INVALID_STEAM_IDS = 0x07;

	public $validB64 = [
		"76561197988210016" // TODO
	];

	public $privateIds = [
		"", // TODO
	];

	public $bannedIds = [
		"76561198062036232",
		"76561198087011831"
	];

	public $invalidIds = [
		"12321",
		"STEAM_12312",
		"103582791429521408",
		"123213123",
		"ASDDAS",
		"NADOAS",
		"OIMADDSSD",
		"IWIEIWEW"
	];

	public function test_create_profile_b64_steam()
	{	
		$id = "76561197988210016";

		$steam = new \CavApps\Services\Steam\Steam();
		$profile = $steam->profile($id);

		$this->assertTrue(is_a($profile, \CavApps\Services\Steam\Profile::class));
		$this->assertEquals($id, $profile->getID());
	}

	public function test_create_profile_s32_steam()
	{
	    $id = "STEAM_0:1:111451590";
	    $b64 = "76561198183168909";

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	    $this->assertEquals($b64, $profile->getID());
	}

	public function test_create_profile_3_steam()
	{
	    $id = "[U:1:222903181]";
	    $b64 = "76561198183168909";

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	    $this->assertEquals($b64, $profile->getID());
	}

	public function test_create_profile_formmated_types()
	{
	    
	    $id   = "76561198183168909";
	    $id3  = "[U:1:222903181]";
	    $id32 = "STEAM_1:1:111451590";

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	    $this->assertEquals($id, $profile->getSteam64());
	    $this->assertEquals($id3, $profile->getSteam3());
	    $this->assertEquals($id32, $profile->getSteam32());
	}		

	public function test_create_profile_invalid_steam()
	{
	    $id = $this->invalidIds[random_int(0, self::MAX_INVALID_STEAM_IDS)];

	    $this->expectException('\CavApps\Exceptions\InvalidSteamId');

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	}

	public function test_create_profile_banned_steam()
	{
	    $id = "76561198062036232";

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	    $this->assertTrue($profile->isBanned());
	}

		public function test_create_profile_perfect_steam()
	{
	    $id = "76561198065870055";

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	    $this->assertTrue(!$profile->isBanned());
	    $this->assertTrue(!$profile->isPrivate());
	}

	public function test_create_profile_private_steam()
	{
	    $id = "76561197988210016";

	    $steam = new \CavApps\Services\Steam\Steam();
	    $profile = $steam->profile($id);
	    $this->assertTrue($profile->isPrivate());
	}
}
