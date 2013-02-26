var root = d3.select(document.body),
        dayPicker = root.append('div').classed('dayPicker', true),
            prevDay = dayPicker.append('a').classed('action', true).classed('dn', true).text("←"),
            dayLabel = dayPicker.append('a').classed('action', true).classed('label', true).text("Today"),
            nextDay = dayPicker.append('a').classed('action', true).classed('up', true).text("→")
        eggCounter = root.append('div').classed('eggCounter', true),
            decCount = eggCounter.append('a').classed('action', true).classed('dn', true).text("-"),
            countDisplay = eggCounter.append('span').classed('value', true).text("0"),
            countLabel = eggCounter.append('span').classed('label', true).text('eggs'),
            incCount = eggCounter.append('a').classed('action', true).classed('up', true).text("+"),
        graph = root.append('svg:svg').classed('graph', true);

var dayDoc = null;
function _loadDay(day) {
    dayDoc = null;
    updateCount();
    var req = d3.json("_view/count_by_day?key=" + encodeURIComponent(JSON.stringify(day)) + "&include_docs=true", function (e,d) {
        //if (e) { alert(e.responseText); throw e; }
        if (e) { d = {rows:[]}; }
        if (d.rows.length) {
            dayDoc = d.rows[0].doc;
        } else {
            var dateString = day.map(function (n) { return (n > 9) ? n : '0'+n; }).join('');
            dayDoc = {_id:"eggcount-"+dateString, 'isEggcount':true, date:day, count:0};
        }
        updateCount();
    });
}

function _saveCurrentDay() {
    decCount.classed('unavailable', true);
    incCount.classed('unavailable', true);
    d3.xhr("../..").header('Content-Type', "application/json").post(JSON.stringify(dayDoc), function (e,d) {
        updateCount();
        if (e) { alert(e.responseText); throw e; }
        dayDoc._rev = JSON.parse(d.responseText).rev;
    });
}


function _dayToArray(day) {
    return [day.getFullYear(), day.getMonth()+1, day.getDate()];
}

var day = new Date(),
    today = new Date(+day);
function updateDay() {
    var isToday = (+day === +today),
        dayArray = _dayToArray(day);
    dayLabel.text(dayArray.join('-'));
    nextDay.classed('unavailable', isToday);
    dayLabel.classed('unavailable', isToday);
    if (!dayDoc || dayDoc.date.join('-') != dayArray.join('-')) _loadDay(dayArray);
}
prevDay.on('click', function () {
    if (d3.select(this).classed('unavailable')) return;
    day.setDate(day.getDate() - 1);
    updateDay();
});
dayLabel.on('click', function () {
    if (d3.select(this).classed('unavailable')) return;
    day.setTime(+today);
    updateDay();
});
nextDay.on('click', function () {
    if (d3.select(this).classed('unavailable')) return;
    day.setDate(day.getDate() + 1);
    updateDay();
});
updateDay();

function updateCount() {
    if (!dayDoc) {
        countDisplay.text("-");
        countLabel.text("Loading…");
        decCount.classed('unavailable', true);
        incCount.classed('unavailable', true);
    } else {
        var count = dayDoc.count;
        countDisplay.text(count);
        countLabel.text((count === 1) ? "egg" : "eggs");
        decCount.classed('unavailable', count < 1);
        incCount.classed('unavailable', false);
    }
}
decCount.on('click', function () {
    if (d3.select(this).classed('unavailable')) return;
    dayDoc.count -= 1;
    _saveCurrentDay();
    updateCount();
});
incCount.on('click', function () {
    if (d3.select(this).classed('unavailable')) return;
    dayDoc.count += 1;
    _saveCurrentDay();
    updateCount();
});
updateCount();


var graphInfo = [];
function updateGraph() {
    var points = graph.selectAll('.count').data(graphInfo),
        xScale = d3.time.scale().domain(d3.extent(graphInfo, function (d) { return d.date; })).range([0+5, graph.property('clientWidth')-5]),
        yScale = d3.scale.linear().domain(d3.extent(graphInfo, function (d) { return d.eggs; })).range([graph.property('clientHeight')-5, 0+5]);
    points.enter().append('svg:circle').classed('count', true).attr('r', 2);
    points.attr('cx', function (d) { return xScale(d.date); }).attr('cy', function (d) { return yScale(d.eggs); });
    points.exit().remove();
}
d3.json("_view/count_by_day", function (e,d) {
    if (e) { alert(e.responseText); throw e; }
    console.log(d.rows);
    graphInfo = d.rows.map(function (row) {
        return {date: new Date(row.key[0], row.key[1], row.key[2]), eggs: row.value};
    });
    updateGraph();
});
