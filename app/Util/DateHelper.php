<?php

namespace App\Util;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DateHelper {

    /**
     * Compute the start and end date of some fixed o relative quarter in a specific year.
     * @param mixed $quarter  Integer from 1 to 4 or relative string value:
     *                        'this', 'current', 'previous', 'first' or 'last'.
     *                        'this' is equivalent to 'current'. Any other value
     *                        will be ignored and instead current quarter will be used.
     *                        Default value 'current'. Particularly, 'previous' value
     *                        only make sense with current year so if you use it with
     *                        other year like: get_dates_of_quarter('previous', 1990)
     *                        the year will be ignored and instead the current year
     *                        will be used.
     * @param int $year       Year of the quarter. Any wrong value will be ignored and
     *                        instead the current year will be used.
     *                        Default value null (current year).
     * @param string $format  String to format returned dates
     * @return array          Array with two elements (keys): start and end date.
     */
    public static function getDatesOfQuarter($quarter = 'current', $year = null, $format = 'U')
    {
        if ( !is_int($year) ) {
            $year = (new \DateTime)->format('Y');
        }
        $current_quarter = ceil((new \DateTime)->format('n') / 3);
        switch (  strtolower($quarter) ) {
            case 'this':
            case 'current':
                $quarter = ceil((new \DateTime)->format('n') / 3);
                break;
            case 'previous':
                $year = (new \DateTime)->format('Y');
                if ($current_quarter == 1) {
                    $quarter = 4;
                    $year--;
                } else {
                    $quarter =  $current_quarter - 1;
                }
                break;
            case 'first':
                $quarter = 1;
                break;
            case 'last':
                $quarter = 4;
                break;
            default:
                $quarter = (!is_int($quarter) || $quarter < 1 || $quarter > 4) ? $current_quarter : $quarter;
                break;
        }
        if ( $quarter === 'this' ) {
            $quarter = ceil((new \DateTime)->format('n') / 3);
        }
        $start = new \DateTime($year.'-'.(3*$quarter-2).'-1 00:00:00');
        $end = new \DateTime($year.'-'.(3*$quarter).'-'.($quarter == 1 || $quarter == 4 ? 31 : 30) .' 23:59:59');
        return array(
            'start' => $format ? $start->format($format) : $start,
            'end' => $format ? $end->format($format) : $end
        );
    }

    public function getDatesOfYear($year = null, $format = null)
    {
        if (!is_int($format)) {
            $format = 'U';
        }
        if ( !is_string($year)) {
            $year = (new \DateTime)->format('Y');
        } else {
            switch ($year) {
                case 'current':
                    $year = (new \DateTime)->format('Y');
                    break;
                case 'previous':
                    $year = (new \DateTime)->format('Y');
                    $year--;
                    break;
            }
        }
        $start = new \DateTime('first day of January '.$year.' 00:00:00');
        $end = new \DateTime('last day of December '.$year.' 23:59:59');
        return array(
            'start' => $format ? $start->format($format) : $start,
            'end' => $format ? $end->format($format) : $end
        );
    }

    public function getDatesOfMonth($month)
    {
        $year = (new \DateTime)->format('Y');
        $format = 'U';
        $start = new \DateTime('first day of '.$month .' '.$year.' 00:00:00');
        $end = new \DateTime('last day of '.$month.' '.$year.' 23:59:59');
        return array(
            'start' => $format ? $start->format($format) : $start,
            'end' => $format ? $end->format($format) : $end
        );
    }

    public function generateLast12MonthNames()
    {

        $startingMonthNum = Carbon::now()->month;

        $startingMonthNum = $startingMonthNum + 1;

        $names = [];

        for($i = 0; $i < 12; $i++)
        {
            $monthNum  = ($startingMonthNum+$i);

            if ($monthNum > 12) {
                $monthNum = $monthNum - 12;
            }

            $dateObj = \DateTime::createFromFormat('!m', $monthNum);
            $names[] = $dateObj->format('M');
        }

        return $names;
    }

    public function getTotalDataForYear($user = null)
    {
        $monthlyData = [];

        $startingMonthNum = Carbon::now()->month;

        $startingMonthNum = $startingMonthNum + 1;

        for($i = 0; $i < 12; $i++)
        {

            $monthNum  = ($startingMonthNum+$i);

            if ($monthNum > 12) {
                $monthNum = $monthNum - 12;
            }
            

            $dateObj   = \DateTime::createFromFormat('!m', $monthNum);
            $monthName = $dateObj->format('F');
            $monthTime = $this->getDatesOfMonth($monthName);

            if (!$user) {
            $count = DB::table('api_logs')->whereBetween('created_at', 
                        [Carbon::createFromTimestamp($monthTime['start'])->format('Y-m-d'), 
                        Carbon::createFromTimestamp($monthTime['end'])->format('Y-m-d')]
                    )
                    ->count();
            } else {
                $count = DB::table('api_logs')->where('user_id', $user->id)->whereBetween('created_at', 
                        [Carbon::createFromTimestamp($monthTime['start'])->format('Y-m-d'), 
                        Carbon::createFromTimestamp($monthTime['end'])->format('Y-m-d')]
                    )
                    ->count();
            }
            array_push($monthlyData, $count);
        }

        return $monthlyData;
    }
}
