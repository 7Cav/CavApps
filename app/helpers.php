<?php

if (! function_exists('get_user_color')) {
    function get_user_color($id) {
        $hash = md5('thinginads' . $id); // modify 'color' to get a different palette
        return array(
            hexdec(substr($hash, 0, 2)), // r
            hexdec(substr($hash, 2, 2)), // g
            hexdec(substr($hash, 4, 2))); //b
    }
}
