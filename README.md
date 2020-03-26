# covid19SimpleChart

Use WHO data, via Our World in Data  
Prefered, but does not include recovered cases  
Source: https://ourworldindata.org/coronavirus-source-data
```
cd covid19SimpleChart
php prepareDataWho.php
```

Use Johns Hopkins University  
Have some missing data, include recovered cases  
Source: https://github.com/CSSEGISandData/COVID-19  

Init
```
cd covid19SimpleChart
git submodule init
git submodule update
git clone https://github.com/nyroDev/covid19SimpleChart.git
php prepareDataHopkins.php
```

Update data
```
git submodule update --remote
php prepareDataHopkins.php
```

Then point your webserver to the public directory.  
Prefer the PHP version, it add a cache bursting for the data.json file

