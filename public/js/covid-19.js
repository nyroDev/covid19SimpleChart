const
    storageName = 'covid19',
    ui = document.getElementById('ui'),
    serie = document.getElementById('serie'),
    serieDraw = document.getElementById('serieDraw'),
    number = document.getElementById('number'),
    countries = document.getElementById('countries'),
    submit = document.getElementById('submit'),
    chart = document.getElementById('chart'),
    chartPc = document.getElementById('chartPc');

const updateChart = function () {
    const dataIndexes = {};
    let minIndex = window.data.dates.length;

    const toStore = {
        serie: serie.value,
        serieDraw: serieDraw.value,
        number: number.value,
        country: []
    };

    Array.prototype.forEach.call(
        countries.querySelectorAll('input:checked'),
        (el) => {
            toStore.country.push(el.dataset.country);
            dataIndexes[el.dataset.country] = window.data.data[el.dataset.country];

            dataIndexes[el.dataset.country].alignIndex = dataIndexes[el.dataset.country][serie.value].findIndex((v, i) => {
                return v > parseInt(number.value);
            });

            dataIndexes[el.dataset.country].lockdown = window.lockdowns[el.dataset.country] || false;
            dataIndexes[el.dataset.country].lockdownIndex = -1;
            if (dataIndexes[el.dataset.country].lockdown) {
                dataIndexes[el.dataset.country].lockdownIndex = window.data.dates.indexOf(dataIndexes[el.dataset.country].lockdown);
            }

            if (dataIndexes[el.dataset.country].alignIndex > -1) {
                minIndex = Math.min(minIndex, dataIndexes[el.dataset.country].alignIndex);
            }
        }
    );

    window.localStorage.setItem(storageName, JSON.stringify(toStore));

    const nbValues = window.data.dates.length - minIndex;
    const categories = [];
    for (i = 1; i <= nbValues; i++) {
        categories.push('Day ' + i);
    }

    const chartSeries = [];
    const chartSeriesPc = [];
    Object.keys(dataIndexes).forEach((indexName) => {
        chartSeries.push({
            name: indexName,
            data: dataIndexes[indexName].alignIndex > -1 ? dataIndexes[indexName][serieDraw.value].slice(dataIndexes[indexName].alignIndex) : []
        });
        chartSeriesPc.push({
            name: indexName,
            data: dataIndexes[indexName].alignIndex > -1 ? dataIndexes[indexName][serieDraw.value + '_pc'].slice(dataIndexes[indexName].alignIndex) : []
        });

        if (false && dataIndexes[indexName].lockdownIndex > -1 && dataIndexes[indexName].lockdownIndex > minIndex) {
            const curIndex = dataIndexes[indexName].lockdownIndex - minIndex;
            chartSeries[chartSeries.length - 1].data[curIndex] = {
                y: chartSeries[chartSeries.length - 1].data[curIndex],
                marker: {
                    radius: 'url(https://www.highcharts.com/samples/graphics/flag-circlepin.svg?' + indexName + ')'
                }
            };
            chartSeriesPc[chartSeriesPc.length - 1].data[curIndex] = {
                y: chartSeriesPc[chartSeriesPc.length - 1].data[curIndex],
                marker: {
                    radius: 'url(https://www.highcharts.com/samples/graphics/flag-circlepin.svg?' + indexName + 'PC)'
                }
            };
        }
    });

    const formatter = function () {
        const indexCat = categories.indexOf(this.x);
        if (indexCat == -1) {
            return '';
        }

        const html = [];
        html.push('<table>');

        html.push('<thead>');
        html.push('<tr>');
        html.push('<th>Date</th>');
        html.push('<th>Country</th>');
        Object.keys(window.data.series).forEach((id) => {
            html.push('<th>' + window.data.series[id] + '</th>');
        });
        html.push('</tr>');
        html.push('</thead>');

        Object.keys(dataIndexes).forEach((indexName, i) => {
            const
                color = hgchart.options.colors[i],
                curIdx = dataIndexes[indexName].alignIndex + indexCat,
                date = window.data.dates[curIdx] || '-';
            html.push('<tr style="color: ' + color + '">');
            html.push('<th>' + date + '</th>');
            html.push('<th>' + indexName + '</th>');

            Object.keys(window.data.series).forEach((id, name) => {
                const val = dataIndexes[indexName][id][curIdx] || '-',
                    valPc = dataIndexes[indexName][id + '_pc'][curIdx] || '-';
                html.push('<th class="number">' + Highcharts.numberFormat(val, 0) + '<br />' + valPc + '%</th>');
            });

            html.push('</tr>');
        });

        html.push('</table>');

        return html.join(' ');
    };

    const hgchart = Highcharts.chart(chart, {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Alignement: ' + number.value + ' ' + serie.value + ', Draw: ' + serieDraw.value
        },
        subtitle: {
            text: 'Source: Johns Hopkins University'
        },
        xAxis: {
            categories: categories,
            crosshair: true
        },
        yAxis: {
            min: 0,
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            }
        },
        series: chartSeries,
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: formatter
        },
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    });
    const hgchartPc = Highcharts.chart(chartPc, {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Alignement: ' + number.value + ' ' + serie.value + ', Draw: ' + serieDraw.value
        },
        subtitle: {
            text: 'Source: Johns Hopkins University'
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Percentage'
            },
            labels: {
                formatter: function () {
                    return this.value + '%';
                }
            }
        },
        xAxis: {
            categories: categories,
            crosshair: true
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            }
        },
        series: chartSeriesPc,
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: formatter
        },
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    });

    chart.scrollIntoView();
};

const initUI = function () {
    if (!window.lockdowns || !window.data) {
        return;
    }

    const stored = window.localStorage.getItem(storageName);
    const storedData = stored ? JSON.parse(stored) : {
        serie: 'deaths',
        number: 15,
        serieDraw: 'deaths'
    };

    if (storedData && storedData.number) {
        number.value = storedData.number;
    }

    let seriesHTML = '';
    let seriesDrawHTML = '';
    Object.keys(window.data.series).forEach((id) => {
        seriesHTML += '<option value="' + id + '"' + (storedData.serie && storedData.serie == id ? 'selected' : '') + '>' + window.data.series[id] + '</option>';
        seriesDrawHTML += '<option value="' + id + '"' + (storedData.serieDraw && storedData.serieDraw == id ? 'selected' : '') + '>' + window.data.series[id] + '</option>';
    });
    serie.innerHTML = seriesHTML;
    serieDraw.innerHTML = seriesDrawHTML;

    let countriesHTML = '';
    Object.keys(window.data.data).forEach((country, i) => {
        countriesHTML += '<span>';
        countriesHTML += '<input type="checkbox" name="country[]" value="country-' + i + '" ';
        if (storedData && storedData.country && storedData.country.indexOf(country) != -1) {
            countriesHTML += 'checked ';
            submit.disabled = false;
        }
        countriesHTML += 'id="country-' + i + '" data-country="' + country + '" />';
        countriesHTML += '<label for="country-' + i + '">' + country + '</label>';
        countriesHTML += '</span>';
    });

    countries.innerHTML = countriesHTML;

    let isDisabled = false;
    countries.addEventListener('change', (e) => {
        const nbChecked = countries.querySelectorAll('input:checked').length;

        submit.disabled = nbChecked == 0;

        if (nbChecked == 10) {
            Array.prototype.forEach.call(
                countries.querySelectorAll('input:not(:checked)'),
                (el) => {
                    el.disabled = true;
                }
            );
            isDisabled = true;
        } else if (isDisabled) {
            Array.prototype.forEach.call(
                countries.querySelectorAll('input[disabled'),
                (el) => {
                    el.disabled = false;
                }
            );
            isDisabled = false;
        }
    });

    ui.addEventListener('submit', (e) => {
        e.preventDefault();

        updateChart();
    });

    ui.classList.add('ready');

    if (storedData && storedData.country && storedData.country.length) {
        updateChart();
    }
};

fetch(document.body.dataset.lockdowns)
    .then(response => response.json())
    .then(data => {
        window.lockdowns = data;
        initUI();
    });

fetch(document.body.dataset.data)
    .then(response => response.json())
    .then(data => {
        window.data = data;
        initUI();
    });
