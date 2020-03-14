<?php

$content = file_get_contents('index.html');

echo str_replace('TIMING', filemtime('data.json'), $content);
