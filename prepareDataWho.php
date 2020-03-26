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

$initTmp = [];

foreach($series as $serie) {
    $initTmp[$serie] = [];
    $initTmp[$serie.'_inc'] = [];
    $initTmp[$serie.'_pc'] = [];
}

$tmp = $initTmp;
$tmpCountry = null;
$headersOk = false;

$headerDates = [];
$datesOk = false;

if (false !== ($handle = fopen($source, 'r'))) {
    $headerDates = null;
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

        if (!$datesOk) {
            $headerDates[] = $line['date'];
        }

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

ksort($data);

file_put_contents(__DIR__.'/public/data.json', json_encode([
    'source' => '<a href="https://ourworldindata.org/coronavirus-source-data" target="_blank">Our Wolrd in Data</a>',
    'dates' => $headerDates,
    'series' => $series,
    'data' => $data,
]));
