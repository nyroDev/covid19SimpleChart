<?php

$source = 'https://covid.ourworldindata.org/data/ecdc/full_data.csv';

$headers = [
    'date',
    'location',
    'new_cases',
    'new_deaths',
    'total_cases',
    'total_deaths',
];

$series = [
    'confirmed' => 'confirmed',
    'deaths' => 'deaths',
];

$data = [];

$initTmp = [
    'dates' => [],
];

foreach($series as $serie) {
    $initTmp[$serie] = [];
    $initTmp[$serie.'_inc'] = [];
    $initTmp[$serie.'_pc'] = [];
}

$tmp = $initTmp;
$tmpCountry = null;

$minDate = '2019-12-31';
$maxDate = $minDate;

if (false !== ($handle = fopen($source, 'r'))) {
    while (false !== ($row = fgetcsv($handle, 10000, ','))) {
        if (!$headersOk) {
            if ($headers == $row) {
                $headersOk = true;
                continue;
            }
            echo 'Headers did not match, aborting'.PHP_EOL;
            print_r($row);
            exit;
        }

        $line = array_combine($headers, $row);

        $country = $line['location'];

        if ($tmpCountry && $tmpCountry != $country) {
            // We changed country
            $data[$tmpCountry] = $tmp;
            $tmp = $initTmp;
            $datesOk = true;
            echo $tmpCountry.PHP_EOL;
        }
        
        if ($line['date'] > $maxDate) {
            $maxDate = $line['date'];
        }

        $tmp['dates'][] = $line['date'];
        $tmp['confirmed_inc'][] = intval($line['new_cases']);
        $tmp['deaths_inc'][] = intval($line['new_deaths']);
        $tmp['confirmed'][] = intval($line['total_cases']);
        $tmp['deaths'][] = intval($line['total_deaths']);

        $nbVal = count($tmp['confirmed_inc']);
        if ($nbVal > 1) {
            // calculate the pc
            $prevVal = $tmp['confirmed'][$nbVal - 2];
            $tmp['confirmed_pc'][] = $prevVal ? round(100 * (($tmp['confirmed'][$nbVal - 1] - $prevVal) / $prevVal), 2) : 0;
            $prevVal = $tmp['deaths'][$nbVal - 2];
            $tmp['deaths_pc'][] = $prevVal ? round(100 * (($tmp['deaths'][$nbVal - 1] - $prevVal) / $prevVal), 2) : 0;
        } else {
            $tmp['confirmed_pc'][] = 0;
            $tmp['deaths_pc'][] = 0;
        }

        $tmpCountry = $country;
    }
}

// Create correct headerDates
$minDateDate = new \DateTime($minDate.' 12:00:00');
$maxDateDate = new \DateTime($maxDate.' 12:00:00');
$maxDateDate->modify('+1 day');

$daterange = new \DatePeriod($minDateDate, new \DateInterval('P1D') ,$maxDateDate);

$headerDates = [];
foreach($daterange as $date) {
    $headerDates[] = $date->format('Y-m-d');
}

$nbDates = count($headerDates);

// Update all data if needed
foreach($data as $k => $v) {
    if (count($v['dates']) != $nbDates) {
        $tmp = $initTmp;
        unset($tmp['dates']);

        foreach($tmp as $kk=>$vv) {
            $curVal = 0;
            foreach($headerDates as $headerDate) {
                if (!in_array($headerDate, $v['dates'])) {
                    // Date is missing, recreate correct values
                    switch($kk) {
                        case 'confirmed':
                        case 'deaths':
                            $val = $curVal == 0 ? 0 : $v[$kk][$curVal - 1];
                        break;
                        case 'confirmed_inc':
                        case 'confirmed_pc':
                        case 'deaths_inc':
                        case 'deaths_pc':
                            $val = 0;
                        break;
                    }
                } else {
                    $val = $v[$kk][$curVal];
                    ++$curVal;
                }
                $tmp[$kk][] = $val;
            }
        }
        $data[$k] = $tmp;
    }
    unset($data[$k]['dates']);
}

ksort($data);

file_put_contents(__DIR__.'/public/data.json', json_encode([
    'source' => '<a href="https://ourworldindata.org/coronavirus-source-data" target="_blank">Our Wolrd in Data</a>',
    'dates' => $headerDates,
    'series' => $series,
    'data' => $data,
]));
