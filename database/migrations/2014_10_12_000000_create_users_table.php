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
			$table->integer('id')->unique();
			$table->string('name');
			$table->string('email')->unique();
			$table->string('avatar')->nullable();
			$table->boolean('is_admin')->default(0);
			$table->boolean('is_banned')->default(0);
			$table->string('steam_id')->nullable();
			$table->rememberToken();
			$table->timestamps();

			$table->primary('id');
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
