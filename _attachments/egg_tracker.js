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


var db = null;
new Pouch("test", function (e, d) {
    if (e) { alert(e); throw e; }
    db = d;
    var hostURL = window.location + "/../../../";
    Pouch._replicate_hack = function (source, target, opts) {
        if (!opts.continuous) return Pouch.replicate.apply(this, arguments);
        // workaround continuous replication checkpoint bug
        // follows strategy described at https://github.com/daleharvey/pouchdb/issues/234#issuecomment-14108660
        opts.continuous = false;
        Pouch.replicate(source, target, opts, function () {
            opts.continuous = true;
            Pouch.replicate(source, target, opts);
        });
    }
    Pouch._replicate_hack(hostURL, db, {continuous:true, filter:'_view', query_params:{view:"eggcounting/count_by_day"}});
    Pouch._replicate_hack(db, hostURL, {continuous:true});
    db.allDocs(function (e,d) { console.log("Currently there are", d.rows.length, "documents locally"); })
    updateDay();
});

var dayDoc = null,
    graphInfo = [];
function _loadDay(day) {
    if (!db) return;
    dayDoc = null;
    updateCount();
    //d3.json("_view/count_by_day?key=" + encodeURIComponent(JSON.stringify(day)) + "&include_docs=true", function (e,d) {
    function map(doc) { emit(doc.date); }
    db.query({map:map}, {include_docs:true, reduce:false, key:day}, function (e,d) {
        if (e) { alert(JSON.stringify(e)); throw e; }
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
    //d3.xhr("../..").header('Content-Type', "application/json").post(JSON.stringify(dayDoc), function (e,d) {
    db.put(dayDoc, function (e,d) {
        updateCount();
        if (e) { alert(JSON.stringify(e)); throw e; }
        dayDoc._rev = d.rev;
        
        // HACK: update view results without refetching...not terribly efficient
        var savedString = dayDoc.date.join('-');
        graphInfo.forEach(function (d) {
            var dayString = _dayToArray(d.date).join('-');
            if (dayString === savedString) d.eggs = dayDoc.count;
        });
        updateGraph();
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
    updateGraph();
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
//updateDay();

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

function updateGraph() {
    var points = graph.selectAll('.count').data(graphInfo),
        xScale = d3.time.scale().domain(d3.extent(graphInfo, function (d) { return d.date; })).range([0+5, graph.property('clientWidth')-5]),
        yScale = d3.scale.linear().domain(d3.extent(graphInfo, function (d) { return d.eggs; })).range([graph.property('clientHeight')-5, 0+5]);
    points.enter().append('svg:circle').classed('count', true).attr('r', 2);
    points.attr('cx', function (d) { return xScale(d.date); }).attr('cy', function (d) { return yScale(d.eggs); });
    points.classed('active', function (d) { return _dayToArray(d.date).join('-') === _dayToArray(day).join('-'); });
    points.exit().remove();
}
d3.json("_view/count_by_day", function (e,d) {
    if (e) { alert(e.responseText); throw e; }
    graphInfo = d.rows.map(function (row) {
        return {date: new Date(row.key[0], row.key[1]-1, row.key[2]), eggs: row.value};
    });
    updateGraph();
});
