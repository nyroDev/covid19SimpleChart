<?php

$filepath = __DIR__.'/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-[NAME].csv';

$series = [
    'confirmed' => 'Confirmed',
    'deaths' => 'Deaths',
    'recovered' => 'Recovered',
];

$startDateIndex = 4;

$data = [];

foreach ($series as $serieName => $serie) {
    $file = str_replace('[NAME]', $serie, $filepath);

    if (false !== ($handle = fopen($file, 'r'))) {
        $headerDates = null;
        while (false !== ($row = fgetcsv($handle, 10000, ','))) {
            if (is_null($headerDates)) {
                $headerDates = [];
                for ($i = $startDateIndex; $i < count($row); ++$i) {
                    $tmpDate = explode('/', $row[$i]);
                    $headerDates[] = date('Y-m-d', strtotime('20'.$tmpDate[2].'-'.$tmpDate[0].'-'.$tmpDate[1]));
                }
                continue;
            }

            $indexName = trim($row[1] == $row[0] ? $row[1] : $row[1].' '.$row[0]);

            if (!isset($data[$indexName])) {
                $data[$indexName] = [
                    'infos' => [
                        'country' => $row[1],
                        'province' => $row[0],
                        'lat' => $row[2],
                        'long' => $row[3],
                    ],
                ];
            }

            $data[$indexName][$serieName] = array_map('intval', array_slice($row, $startDateIndex));

            $prevVal = null;
            $data[$indexName][$serieName.'_inc'] = array_map(function ($v) use (&$prevVal) {
                $ret = $v - $prevVal;
                $prevVal = $v;

                return $ret;
            }, $data[$indexName][$serieName]);

            $prevVal = null;
            $data[$indexName][$serieName.'_pc'] = array_map(function ($v) use (&$prevVal) {
                $pc = 0;
                if ($prevVal) {
                    $pc = ($v - $prevVal) / $prevVal;
                }
                $prevVal = $v;

                return round($pc * 100, 2);
            }, $data[$indexName][$serieName]);
        }
        fclose($handle);
    }
}

ksort($data);

file_put_contents(__DIR__.'/public/data.json', json_encode([
    'dates' => $headerDates,
    'series' => $series,
    'data' => $data,
]));
