const
    storageName = 'covid19',
    ui = document.getElementById('ui'),
    serie = document.getElementById('serie'),
    number = document.getElementById('number'),
    countries = document.getElementById('countries'),
    submit = document.getElementById('submit'),
    chart = document.getElementById('chart');

const updateChart = function () {
    const dataIndexes = {};
    let minIndex = window.data.dates.length;

    const toStore = {
        serie: serie.value,
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
    Object.keys(dataIndexes).forEach((indexName) => {
        chartSeries.push({
            name: indexName,
            data: dataIndexes[indexName].alignIndex > -1 ? dataIndexes[indexName][serie.value].slice(dataIndexes[indexName].alignIndex) : []
        });
    });

    const hgchart = Highcharts.chart(chart, {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Alignement: ' + number.value + ' ' + serie.value
        },
        subtitle: {
            text: 'Source: Johns Hopkins University'
        },
        yAxis: {
            min: 0,
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
        series: chartSeries,
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                const indexCat = categories.indexOf(this.x);
                if (indexCat == -1) {
                    return '';
                }

                const html = [];
                html.push('<table>');

                Object.keys(dataIndexes).forEach((indexName, i) => {
                    const
                        color = hgchart.options.colors[i],
                        curIdx = dataIndexes[indexName].alignIndex + indexCat,
                        date = window.data.dates[curIdx] || '-',
                        val = dataIndexes[indexName][serie.value][curIdx] || '-';
                    html.push('<tr style="color: ' + color + '">');
                    html.push('<th>' + date + '</th>');
                    html.push('<th>' + indexName + '</th>');
                    html.push('<th>' + val + '</th>');
                    html.push('</tr>');
                });

                html.push('</table>');

                return html.join(' ');
            },
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
    const stored = window.localStorage.getItem(storageName);
    const storedData = stored ? JSON.parse(stored) : {};

    if (storedData && storedData.number) {
        number.value = storedData.number;
    }

    let seriesHTML = '';
    Object.keys(window.data.series).forEach((id) => {
        seriesHTML += '<option value="' + id + '"' + (storedData.serie && storedData.serie == id ? 'selected' : '') + '>' + window.data.series[id] + '</option>';
    });
    serie.innerHTML = seriesHTML;

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

fetch(document.body.dataset.data)
    .then(response => response.json())
    .then(data => {
        window.data = data;
        initUI();
    });