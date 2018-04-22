<?php

namespace CavApps\Exceptions;

use Exception;

class InvalidSteamId extends Exception
{
    protected $id;
    protected $details;
    protected $err_msg = "The provided steam ID is invalid";
 
    protected function create($id)
    {
        $this->id = $id;
        $error = $this->errors($this->id);
        $this->details = vsprintf($this->err_msg, $args);
        return $this->details;
    }
}
