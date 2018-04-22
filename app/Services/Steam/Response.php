<?php

namespace CavApps\Services\Steam;

class Response
{
	//////////////////
	// Properties & //
	// Constructor  //
	//////////////////
	
	private $status;

	private $data;

	private $header;

	public function __construct(int $status, array $data, string $header)
	{
		$this->status = $status;
		$this->data   = $data;
		$this->header = $header;
	}

	///////////////
	// Accessors //
	///////////////

	/**
	 * @codeCoverageIgnore
	 */
	public function status()
	{
		return $this->status;
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function setStatus(int $status)
	{
		$this->status = $status;
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function data()
	{
		return $this->data;
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function setData(array $data)
	{
		$this->data = $data;
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function header()
	{
		return $this->header;
	}

	/**
	 * @codeCoverageIgnore
	 */
	public function setHeader(array $header)
	{
		$this->$header = $header;
	}
}