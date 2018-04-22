<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Facades\CavApps\Services\Steam\SteamUtils;
use CavApps\Services\Steam\SteamUtils as RealUtil;
use Mockery;

class UtilTest extends TestCase
{
	public $id = "76561198084006121";

	public function test_valid_url_api_request()
	{
		$apiRequirements = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => "&steamids=%id"];
		$parameters = ["%id" => $this->id];
		
		$res = RealUtil::api($apiRequirements, $parameters);
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class));
	}

	public function test_invalid_url_api_request()
	{
		$apiRequirements = ["slug" => "/ISteamUser/GetPlayerSummaries/v0002/", "param_string" => ""];
		$parameters = ["%id" => $this->id];
		
		$res = RealUtil::api($apiRequirements, $parameters);
		$this->assertTrue(is_a($res, \CavApps\Services\Steam\Response::class));
		$this->assertEquals(400, $res->status());
	}
}
