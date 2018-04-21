<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration
{
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::connection('mysql')->create('users', function (Blueprint $table) {
			$table->increments('id');
			$table->string('name');
			$table->string('email')->unique();
			$table->string('provider_id')->nullable();
			$table->string('avatar')->nullable();
			$table->boolean('is_admin')->default(0);
			$table->boolean('is_banned')->default(0);
			$table->rememberToken();
			$table->timestamps();
		});

		DB::statement("ALTER TABLE users ROW_FORMAT=DYNAMIC ");
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::connection('mysql')->dropIfExists('users');
	}
}
