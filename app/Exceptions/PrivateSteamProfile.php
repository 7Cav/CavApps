<?php

namespace CavApps\Exceptions;

use Exception;

class PrivateSteamProfile extends Exception
{
    protected $id;
    protected $details;
    protected $err_msg = "The provided steam ID is private";
 
    protected function create($id)
    {
        $this->id = $id;
        $error = $this->errors($this->id);
        $this->details = vsprintf($this->err_msg, $args);
        return $this->details;
    }
}
