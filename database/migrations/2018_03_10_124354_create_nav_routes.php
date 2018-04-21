<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateNavRoutes extends Migration
{
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{

	   Schema::connection('mysql')->create('sidebar_menus', function($table) {
			$table->increments('id');
			$table->string('title');
			$table->timestamps();
		});

		Schema::connection('mysql')->create('sidebar_items', function (Blueprint $table) {
			$table->increments('id');
			$table->string('title');
			$table->string('url');
			$table->string('icon');
			$table->integer('menu_id')->unsigned();
			$table->boolean('admin_only');
			$table->timestamps();

			$table->foreign('menu_id')
				->references('id')
				->on('sidebar_menus')
				->onDelete('cascade');
		});

		DB::statement("ALTER TABLE sidebar_menus ROW_FORMAT=DYNAMIC ");
		DB::statement("ALTER TABLE sidebar_items ROW_FORMAT=DYNAMIC ");
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::connection('mysql')->dropIfExists('sidebar_items');
		Schema::connection('mysql')->dropIfExists('sidebar_menus');
	}
}
